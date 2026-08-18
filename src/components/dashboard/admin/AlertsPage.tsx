import type React from "react";
import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, Bell, CheckCircle2, ShieldAlert, Clock, MessageSquare, Phone, MapPin, Info, Eye, ChevronRight } from "lucide-react";
import StatusPill from "./StatusPill";
import { QrRecord, Template, SystemAlertItem } from "./types";
import { fmtDateTime } from "./helpers";
import { getReportsFromDb } from "../../../lib/supabaseService";

export default function AlertsPage({
  qrList, setQrList, templates, setToast, searchQuery, isAdmin,
}: {
  qrList: QrRecord[]; setQrList: React.Dispatch<React.SetStateAction<QrRecord[]>>;
  templates: Template[]; setToast: (msg: string | null) => void; searchQuery: string; isAdmin: boolean;
}) {
  const [filter, setFilter] = useState<"all" | "emergency" | "assistance" | "activation" | "scan">("all");
  const [reports, setReports] = useState<any[]>([]);
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

  // Fetch reports from Supabase & LocalStorage (real reports only — no mocks).
  // GET /api/alerts is admin-only (reporter phone + GPS location) — client accounts
  // can never pass verifyAdmin, so skip the backend call entirely for them rather
  // than polling it into a permanent 401 loop every 15s.
  const loadReports = useCallback(() => {
    const reportsPromise = isAdmin ? getReportsFromDb() : Promise.resolve(null);
    reportsPromise.then((dbReports) => {
      let combined: any[] = dbReports || [];
      try {
        const local = JSON.parse(localStorage.getItem("repiqr-reports") || localStorage.getItem("namoqr-reports") || "[]");
        if (local.length > 0) {
          const existingIds = new Set(combined.map((r) => r.id));
          const uniqueLocal = local.filter((r: any) => !existingIds.has(r.id));
          combined = [...uniqueLocal, ...combined];
        }
      } catch { /* ignore */ }
      setReports(combined);
    });
  }, [isAdmin]);

  useEffect(() => {
    loadReports();
    const onReportsUpdated = () => loadReports();
    window.addEventListener("repiqr-reports-updated", onReportsUpdated);
    window.addEventListener("namoqr-reports-updated", onReportsUpdated);
    const interval = isAdmin ? setInterval(loadReports, 15000) : null;
    return () => {
      window.removeEventListener("repiqr-reports-updated", onReportsUpdated);
      window.removeEventListener("namoqr-reports-updated", onReportsUpdated);
      if (interval) clearInterval(interval);
    };
  }, [loadReports, isAdmin]);

  // Construct unified alerts list
  const unifiedAlerts: SystemAlertItem[] = [];

  // 1. Add Emergency / Assistance Reports
  // Only a real SOS/accident location-share from the red emergency screen is tagged
  // `type: "emergency"` at the source (see ScanPage.tsx handleShareLocation) — every
  // other report (towing, parking, headlights, theft, flat tyre, "message owner") is
  // a routine assistance request and must NOT be shown as a true emergency.
  reports.forEach((r) => {
    const isTrueEmergency = r.type === "emergency";
    unifiedAlerts.push({
      id: `report-${r.id}`,
      category: isTrueEmergency ? "emergency" : "assistance",
      title: isTrueEmergency
        ? "🚨 TRUE EMERGENCY — Live SOS Location"
        : `Assistance requested: ${r.type ? r.type.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) : "Contact Owner"}`,
      subtitle: `${r.product_label || r.qr_code_id || "Vehicle Tag"}`,
      timestamp: r.created_at || new Date().toISOString(),
      status: r.status === "resolved" ? "resolved" : "unread",
      qrId: r.qr_code_id,
      vehicleName: r.product_label,
      vehicleNumber: r.license_plate || "",
      reporterPhone: r.reporter_phone,
      message: r.message,
      location: r.location,
      details: r.details || r.message,
      isTrueEmergency,
    });
  });

  // 2. Add Activation alerts from QR codes pending activation
  qrList
    .filter((q) => q.status === "inactive" || q.status === "pending")
    .forEach((q) => {
      unifiedAlerts.push({
        id: `activation-${q.id}`,
        category: "activation",
        title: `QR Activation Pending: ${q.vehicleName || q.id}`,
        subtitle: `QR ID: ${q.id} · ${q.vehicleNumber || "N/A"}`,
        timestamp: q.createdAt,
        status: "active",
        qrId: q.id,
        vehicleName: q.vehicleName,
        vehicleNumber: q.vehicleNumber,
      });
    });

  // 3. Add Scan events (last 5 scans from QR codes)
  qrList
    .filter((q) => q.scans > 0)
    .slice(0, 5)
    .forEach((q) => {
      unifiedAlerts.push({
        id: `scan-${q.id}`,
        category: "scan",
        title: `QR Scanned: ${q.vehicleName || q.id}`,
        subtitle: `Total scans: ${q.scans} · ${q.vehicleNumber || ""}`,
        timestamp: q.createdAt,
        status: "info",
        qrId: q.id,
        vehicleName: q.vehicleName,
        vehicleNumber: q.vehicleNumber,
      });
    });

  // Sort: true emergencies always float to the top, then most recent first
  unifiedAlerts.sort((a, b) => {
    if (!!a.isTrueEmergency !== !!b.isTrueEmergency) return a.isTrueEmergency ? -1 : 1;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const trueEmergencyCount = unifiedAlerts.filter((a) => a.isTrueEmergency && a.status !== "resolved").length;

  const filteredAlerts = unifiedAlerts.filter((a) => {
    if (filter !== "all" && a.category !== filter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return a.title.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q);
    }
    return true;
  });

  const categoryIcons: Record<string, React.ReactNode> = {
    emergency: <AlertTriangle size={14} />,
    assistance: <Phone size={14} />,
    activation: <Bell size={14} />,
    scan: <Eye size={14} />,
    fleet: <ShieldAlert size={14} />,
  };

  const categoryColors: Record<string, string> = {
    emergency: "#DC2626",
    assistance: "#B8863F",
    activation: "#B8863F",
    scan: "#5C78DF",
    fleet: "#777B80",
  };

  const categoryBgs: Record<string, string> = {
    emergency: "#FDEAEA",
    assistance: "#FBF3E4",
    activation: "#FBF3E4",
    scan: "#EDEDFB",
    fleet: "#F1F1F2",
  };

  const statusBadge = (s: string) => {
    if (s === "unread") return <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-[4px]" style={{ background: "#FDEAEA", color: "#DC2626" }}>NEW</span>;
    if (s === "active") return <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-[4px]" style={{ background: "#FBF3E4", color: "#B8863F" }}>ACTIVE</span>;
    if (s === "resolved") return <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-[4px]" style={{ background: "#E9F9EF", color: "#2E9E5B" }}>RESOLVED</span>;
    return <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-[4px]" style={{ background: "#F1F1F2", color: "#777B80" }}>INFO</span>;
  };

  return (
    <div className="px-8 pt-7 pb-16 space-y-7 text-[#17181A] font-body" style={{ background: "#F7F7F8" }}>
      {/* True Emergency Banner — impossible to miss when a real SOS is active */}
      {trueEmergencyCount > 0 && (
        <div className="flex items-center gap-3 border border-[#DC2626] bg-[#FDEAEA] px-4 py-3">
          <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#DC2626] opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#DC2626]" />
          </span>
          <p className="text-[13px] font-bold text-[#DC2626]">
            {trueEmergencyCount} true emergenc{trueEmergencyCount === 1 ? "y" : "ies"} awaiting response — live SOS location shared from the visitor's phone.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {(["all", "emergency", "assistance", "activation", "scan"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-[4px] border px-3.5 py-1.5 text-[12.5px] font-semibold transition-all cursor-pointer ${
              filter === f
                ? "bg-[#17181A] text-white border-[#17181A]"
                : "bg-transparent border-[#E5E5E7] text-[#777B80] hover:bg-[#F3F3F4]"
            }`}
          >
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <span className="text-[11px] text-[#777B80] font-semibold ml-auto">{filteredAlerts.length} alerts</span>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-2">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white border border-[#E5E5E7] p-12 text-center shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
            <div className="w-12 h-12 rounded-[4px] flex items-center justify-center mx-auto mb-4" style={{ background: "#E8EDFF", color: "#5271D5" }}>
              <CheckCircle2 size={22} />
            </div>
            <p className="font-bold text-[#17181A] text-sm">All clear</p>
            <p className="text-xs text-[#777B80] mt-1 font-medium">No alerts matching your current filter.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isExpanded = expandedAlert === alert.id;
            const isLiveEmergency = alert.isTrueEmergency && alert.status !== "resolved";
            return (
              <div
                key={alert.id}
                className={`bg-white overflow-hidden transition-all shadow-[0_1px_4px_rgba(0,0,0,0.03)] hover:bg-[#F3F3F4] ${
                  isLiveEmergency ? "border-2 border-[#DC2626]" : "border border-[#E5E5E7]"
                }`}
                style={{
                  borderLeft: `4px solid ${categoryColors[alert.category]}`,
                }}
              >
                <button
                  onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
                  className="w-full flex items-center gap-4 px-5 py-3.5 text-left cursor-pointer"
                >
                  <div
                    className="w-9 h-9 rounded-[4px] flex items-center justify-center flex-shrink-0"
                    style={{ background: categoryBgs[alert.category], color: categoryColors[alert.category] }}
                  >
                    {isLiveEmergency ? (
                      <span className="relative flex h-9 w-9 items-center justify-center">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-[4px] bg-[#DC2626] opacity-30" />
                        {categoryIcons[alert.category]}
                      </span>
                    ) : (
                      categoryIcons[alert.category]
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-xs truncate ${isLiveEmergency ? "font-bold text-[#DC2626]" : "font-bold text-[#17181A]"}`}>{alert.title}</p>
                      {isLiveEmergency ? (
                        <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-[4px] bg-[#DC2626] text-white">Live</span>
                      ) : (
                        statusBadge(alert.status)
                      )}
                    </div>
                    <p className="text-[11px] text-[#777B80] font-medium mt-0.5 truncate">{alert.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] text-[#9CA0A6] font-mono font-semibold">{fmtDateTime(alert.timestamp)}</span>
                    <ChevronRight size={14} className={`text-[#9CA0A6] transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-4 pt-0 border-t border-[#E5E5E7]">
                    <div className="mt-3 space-y-2 text-xs text-[#17181A]">
                      {alert.message && (
                        <div className="flex items-start gap-2">
                          <MessageSquare size={12} className="text-[#9CA0A6] mt-0.5 flex-shrink-0" />
                          <span className="font-medium">{alert.message}</span>
                        </div>
                      )}
                      {alert.reporterPhone && (
                        <div className="flex items-center gap-2">
                          <Phone size={12} className="text-[#9CA0A6] flex-shrink-0" />
                          <span className="font-mono font-medium">{alert.reporterPhone}</span>
                        </div>
                      )}
                      {alert.location && (
                        <div className="flex items-center gap-2">
                          <MapPin size={12} className="text-[#9CA0A6] flex-shrink-0" />
                          <span className="font-medium">{alert.location}</span>
                        </div>
                      )}
                      {alert.qrId && (
                        <div className="flex items-center gap-2">
                          <Info size={12} className="text-[#9CA0A6] flex-shrink-0" />
                          <span className="font-mono font-medium">QR ID: {alert.qrId}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

import type React from "react";
import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, Bell, CheckCircle2, ShieldAlert, Clock, MessageSquare, Phone, MapPin, Info, Eye, ChevronRight } from "lucide-react";
import StatusPill from "./StatusPill";
import { QrRecord, Template, SystemAlertItem } from "./types";
import { fmtDateTime } from "./helpers";
import { getReportsFromDb } from "../../../lib/supabaseService";

export default function AlertsPage({
  qrList, setQrList, templates, setToast, searchQuery,
}: {
  qrList: QrRecord[]; setQrList: React.Dispatch<React.SetStateAction<QrRecord[]>>;
  templates: Template[]; setToast: (msg: string | null) => void; searchQuery: string;
}) {
  const [filter, setFilter] = useState<"all" | "emergency" | "activation" | "scan">("all");
  const [reports, setReports] = useState<any[]>([]);
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

  // Fetch reports from Supabase & LocalStorage (real reports only — no mocks)
  const loadReports = useCallback(() => {
    getReportsFromDb().then((dbReports) => {
      let combined: any[] = dbReports || [];
      try {
        const local = JSON.parse(localStorage.getItem("namoqr-reports") || "[]");
        if (local.length > 0) {
          const existingIds = new Set(combined.map((r) => r.id));
          const uniqueLocal = local.filter((r: any) => !existingIds.has(r.id));
          combined = [...uniqueLocal, ...combined];
        }
      } catch { /* ignore */ }
      setReports(combined);
    });
  }, []);

  useEffect(() => {
    loadReports();
    const onReportsUpdated = () => loadReports();
    window.addEventListener("namoqr-reports-updated", onReportsUpdated);
    const interval = setInterval(loadReports, 15000);
    return () => {
      window.removeEventListener("namoqr-reports-updated", onReportsUpdated);
      clearInterval(interval);
    };
  }, [loadReports]);

  // Construct unified alerts list
  const unifiedAlerts: SystemAlertItem[] = [];

  // 1. Add Emergency / Scan Reports
  reports.forEach((r) => {
    unifiedAlerts.push({
      id: `emergency-${r.id}`,
      category: "emergency",
      title: `Emergency Scan: ${r.type ? r.type.replace(/_/g, " ").toUpperCase() : "CONTACT OWNER"}`,
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

  // Sort: most recent first
  unifiedAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

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
    activation: <Bell size={14} />,
    scan: <Eye size={14} />,
    fleet: <ShieldAlert size={14} />,
  };

  const categoryColors: Record<string, string> = {
    emergency: "#dc2626",
    activation: "#b45309",
    scan: "#6366f1",
    fleet: "#0f766e",
  };

  const categoryBgs: Record<string, string> = {
    emergency: "rgba(220,38,38,0.10)",
    activation: "rgba(180,83,9,0.10)",
    scan: "rgba(99,102,241,0.10)",
    fleet: "rgba(15,118,110,0.10)",
  };

  const statusBadge = (s: string) => {
    if (s === "unread") return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: "rgba(220,38,38,0.12)", color: "#dc2626" }}>NEW</span>;
    if (s === "active") return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: "rgba(180,83,9,0.12)", color: "#b45309" }}>ACTIVE</span>;
    if (s === "resolved") return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: "rgba(15,118,110,0.12)", color: "#0f766e" }}>RESOLVED</span>;
    return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: "rgba(107,114,128,0.12)", color: "#374151" }}>INFO</span>;
  };

  return (
    <div className="px-8 pt-7 pb-10 space-y-6 text-gray-900">
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {(["all", "emergency", "activation", "scan"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3.5 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer"
            style={{
              background: filter === f ? "var(--accent)" : "#f3f4f6",
              color: filter === f ? "#fff" : "#64748b",
            }}
          >
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <span className="text-[11px] text-gray-500 font-semibold ml-auto">{filteredAlerts.length} alerts</span>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-2">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-2xl border p-12 text-center" style={{ borderColor: "#f0f0f0" }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(99,102,241,0.10)", color: "#6366f1" }}>
              <CheckCircle2 size={22} />
            </div>
            <p className="font-bold text-gray-900 text-sm">All clear</p>
            <p className="text-xs text-gray-500 mt-1 font-medium">No alerts matching your current filter.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isExpanded = expandedAlert === alert.id;
            return (
              <div
                key={alert.id}
                className="bg-white rounded-2xl border overflow-hidden transition-all hover:shadow-sm"
                style={{
                  borderColor: alert.status === "unread" ? "rgba(220,38,38,0.2)" : "#f0f0f0",
                  borderLeft: `3px solid ${categoryColors[alert.category]}`,
                }}
              >
                <button
                  onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
                  className="w-full flex items-center gap-4 px-5 py-3.5 text-left cursor-pointer"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: categoryBgs[alert.category], color: categoryColors[alert.category] }}
                  >
                    {categoryIcons[alert.category]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-gray-900 truncate">{alert.title}</p>
                      {statusBadge(alert.status)}
                    </div>
                    <p className="text-[11px] text-gray-500 font-medium mt-0.5 truncate">{alert.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] text-gray-400 font-semibold">{fmtDateTime(alert.timestamp)}</span>
                    <ChevronRight size={14} className={`text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-4 pt-0 border-t" style={{ borderColor: "#f7f7f7" }}>
                    <div className="mt-3 space-y-2 text-xs text-gray-700">
                      {alert.message && (
                        <div className="flex items-start gap-2">
                          <MessageSquare size={12} className="text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="font-medium">{alert.message}</span>
                        </div>
                      )}
                      {alert.reporterPhone && (
                        <div className="flex items-center gap-2">
                          <Phone size={12} className="text-gray-400 flex-shrink-0" />
                          <span className="font-medium">{alert.reporterPhone}</span>
                        </div>
                      )}
                      {alert.location && (
                        <div className="flex items-center gap-2">
                          <MapPin size={12} className="text-gray-400 flex-shrink-0" />
                          <span className="font-medium">{alert.location}</span>
                        </div>
                      )}
                      {alert.qrId && (
                        <div className="flex items-center gap-2">
                          <Info size={12} className="text-gray-400 flex-shrink-0" />
                          <span className="font-medium">QR ID: {alert.qrId}</span>
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

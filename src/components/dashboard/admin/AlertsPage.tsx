import type React from "react";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Phone,
  MapPin,
  Eye,
  Trash2,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Check,
  Search,
} from "lucide-react";
import { QrRecord, Template, SystemAlertItem } from "./types";
import { apiClient } from "../../../lib/apiClient";

interface AlertsPageProps {
  qrList: QrRecord[];
  setQrList?: React.Dispatch<React.SetStateAction<QrRecord[]>>;
  templates?: Template[];
  setToast: (message: string | null) => void;
  isAdmin: boolean;
  searchQuery: string;
}

type AlertCategoryFilter = "all" | "emergency" | "assistance" | "activation" | "scan";

function fmtTimeAgo(iso: string): string {
  try {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return "now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export default function AlertsPage({
  qrList,
  setToast,
  isAdmin,
  searchQuery,
}: AlertsPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<AlertCategoryFilter>("all");
  const [incidentReports, setIncidentReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const dbPromise = isAdmin
        ? apiClient.alerts.getAlerts().then((res) => res?.data || []).catch(() => [])
        : Promise.resolve([]);

      const dbReports = await dbPromise;
      let combined: any[] = Array.isArray(dbReports) ? dbReports : [];

      try {
        const local = localStorage.getItem("repiqr-reports") || localStorage.getItem("namoqr-reports") || "[]";
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(combined.map((r) => String(r.id)));
          const uniqueLocal = parsed.filter((r: any) => !existingIds.has(String(r.id)));
          combined = [...uniqueLocal, ...combined];
        }
      } catch {
        /* ignore */
      }

      setIncidentReports(combined);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchReports();
    const handleUpdate = () => fetchReports();
    window.addEventListener("repiqr-reports-updated", handleUpdate);
    window.addEventListener("namoqr-reports-updated", handleUpdate);
    const interval = isAdmin ? setInterval(fetchReports, 20000) : null;

    return () => {
      window.removeEventListener("repiqr-reports-updated", handleUpdate);
      window.removeEventListener("namoqr-reports-updated", handleUpdate);
      if (interval) clearInterval(interval);
    };
  }, [fetchReports, isAdmin]);

  const handleResolve = async (alertId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const rawId = alertId.replace(/^report-/, "");
    try {
      if (isAdmin) {
        await apiClient.alerts.resolveAlert(rawId).catch(() => null);
      }
      try {
        const stored = JSON.parse(localStorage.getItem("repiqr-reports") || "[]");
        const updated = stored.map((item: any) =>
          String(item.id) === String(rawId) ? { ...item, status: "resolved" } : item
        );
        localStorage.setItem("repiqr-reports", JSON.stringify(updated));
      } catch {
        /* ignore */
      }

      setIncidentReports((prev) =>
        prev.map((r) => (String(r.id) === String(rawId) ? { ...r, status: "resolved" } : r))
      );
      setToast("Resolved");
    } catch {
      setToast("Could not resolve");
    }
  };

  const handleDelete = async (alertId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const rawId = alertId.replace(/^report-/, "");
    try {
      if (isAdmin) {
        await apiClient.alerts.deleteAlert(rawId).catch(() => null);
      }
      try {
        const stored = JSON.parse(localStorage.getItem("repiqr-reports") || "[]");
        const updated = stored.filter((item: any) => String(item.id) !== String(rawId));
        localStorage.setItem("repiqr-reports", JSON.stringify(updated));
      } catch {
        /* ignore */
      }

      setIncidentReports((prev) => prev.filter((r) => String(r.id) !== String(rawId)));
      setToast("Deleted");
    } catch {
      setToast("Could not delete");
    }
  };

  const handleClearAll = async () => {
    setConfirmClearAll(false);
    try {
      if (isAdmin) {
        await apiClient.alerts.deleteAllAlerts().catch(() => null);
      }
      localStorage.removeItem("repiqr-reports");
      localStorage.removeItem("namoqr-reports");
      window.dispatchEvent(new Event("repiqr-reports-updated"));
      setIncidentReports([]);
      setToast("Cleared all alerts");
    } catch {
      setToast("Failed to clear");
    }
  };

  const unifiedAlerts = useMemo<SystemAlertItem[]>(() => {
    const list: SystemAlertItem[] = [];

    incidentReports.forEach((report) => {
      const isTrueEmergency = report.type === "emergency";
      const formattedType = report.type
        ? report.type.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())
        : "Assistance";

      list.push({
        id: `report-${report.id}`,
        category: isTrueEmergency ? "emergency" : "assistance",
        title: isTrueEmergency ? "SOS Emergency" : formattedType,
        subtitle: report.product_label || report.license_plate || report.qr_code_id || "Vehicle",
        timestamp: report.created_at || new Date().toISOString(),
        status: report.status === "resolved" ? "resolved" : "unread",
        qrId: report.qr_code_id,
        vehicleName: report.product_label,
        vehicleNumber: report.license_plate || "",
        reporterPhone: report.reporter_phone,
        message: report.message,
        location: report.location,
        details: report.details || report.message,
        isTrueEmergency,
      });
    });

    qrList
      .filter((qr) => qr.status === "inactive" || qr.status === "pending")
      .forEach((qr) => {
        list.push({
          id: `activation-${qr.id}`,
          category: "activation",
          title: "Pending Activation",
          subtitle: qr.id,
          timestamp: qr.createdAt,
          status: "active",
          qrId: qr.id,
          vehicleName: qr.vehicleName,
          vehicleNumber: qr.vehicleNumber,
        });
      });

    qrList
      .filter((qr) => qr.scans > 0)
      .slice(0, 10)
      .forEach((qr) => {
        list.push({
          id: `scan-${qr.id}`,
          category: "scan",
          title: "Tag Scanned",
          subtitle: `${qr.id} (${qr.scans} scans)`,
          timestamp: qr.createdAt,
          status: "info",
          qrId: qr.id,
          vehicleName: qr.vehicleName,
          vehicleNumber: qr.vehicleNumber,
        });
      });

    list.sort((a, b) => {
      const liveA = a.isTrueEmergency && a.status !== "resolved";
      const liveB = b.isTrueEmergency && b.status !== "resolved";
      if (liveA !== liveB) return liveA ? -1 : 1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return list;
  }, [incidentReports, qrList]);

  const counts = useMemo(() => {
    const total = unifiedAlerts.length;
    const emergency = unifiedAlerts.filter((a) => a.category === "emergency" && a.status !== "resolved").length;
    const assistance = unifiedAlerts.filter((a) => a.category === "assistance" && a.status !== "resolved").length;
    const activation = unifiedAlerts.filter((a) => a.category === "activation").length;
    const scan = unifiedAlerts.filter((a) => a.category === "scan").length;
    return { total, emergency, assistance, activation, scan };
  }, [unifiedAlerts]);

  const filteredAlerts = useMemo(() => {
    let list = unifiedAlerts;
    if (selectedCategory !== "all") {
      list = list.filter((a) => a.category === selectedCategory);
    }
    if (localSearch.trim()) {
      const q = localSearch.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.subtitle.toLowerCase().includes(q) ||
          (a.qrId && a.qrId.toLowerCase().includes(q)) ||
          (a.reporterPhone && a.reporterPhone.toLowerCase().includes(q)) ||
          (a.message && a.message.toLowerCase().includes(q)) ||
          (a.location && a.location.toLowerCase().includes(q))
      );
    }
    return list;
  }, [unifiedAlerts, selectedCategory, localSearch]);

  return (
    <div className="px-3 sm:px-5 py-4 space-y-3 text-gray-900 font-body bg-[#F8FAFC] min-h-screen">
      {/* ── Top Bar (Minimal, Compact) ─────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-lg sm:text-xl font-bold font-display text-gray-900">Alerts</h1>
          <span className="text-xs font-bold text-gray-500 bg-gray-200/80 px-2 py-0.5 rounded-full">
            {counts.total}
          </span>
          {counts.emergency > 0 && (
            <span className="text-[11px] font-extrabold text-red-600 bg-red-100 px-2 py-0.5 rounded-full animate-pulse">
              {counts.emergency} SOS
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={fetchReports}
            disabled={isLoading}
            className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-40"
            title="Refresh"
          >
            <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
          </button>

          {counts.total > 0 && (
            <button
              type="button"
              onClick={() => setConfirmClearAll(true)}
              className="p-1.5 rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
              title="Clear all"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ── Filters & Search (Single Compact Row) ───────────────────────── */}
      <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
        {/* Minimal Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {[
            { key: "all", label: "All", count: counts.total },
            { key: "emergency", label: "SOS", count: counts.emergency, red: counts.emergency > 0 },
            { key: "assistance", label: "Assistance", count: counts.assistance },
            { key: "activation", label: "Pending", count: counts.activation },
            { key: "scan", label: "Scans", count: counts.scan },
          ].map((tab) => {
            const active = selectedCategory === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSelectedCategory(tab.key as AlertCategoryFilter)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  active
                    ? "bg-gray-900 text-white shadow-2xs"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`text-[10px] px-1 rounded-full font-bold ${
                      active
                        ? "bg-gray-700 text-white"
                        : tab.red
                        ? "bg-red-500 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Small Search */}
        <div className="relative w-full sm:w-44 flex-shrink-0">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-7 pr-2.5 py-1 text-xs rounded-lg border border-gray-200 bg-white text-gray-900 outline-none focus:border-gray-900"
          />
        </div>
      </div>

      {/* ── Compact Feed List ────────────────────────────────────────── */}
      <div className="space-y-1.5">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <CheckCircle2 size={20} className="text-emerald-500 mx-auto mb-1.5" />
            <p className="text-xs font-semibold text-gray-600">No alerts matching filter</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isExpanded = expandedAlertId === alert.id;
            const isResolved = alert.status === "resolved";
            const isEmergency = alert.category === "emergency";
            const isReport = alert.id.startsWith("report-");

            // Category styling
            let dotColor = "bg-purple-500";
            let borderColor = "border-l-purple-500";
            if (isEmergency) {
              dotColor = "bg-red-500";
              borderColor = "border-l-red-500";
            } else if (alert.category === "assistance") {
              dotColor = "bg-amber-500";
              borderColor = "border-l-amber-500";
            } else if (alert.category === "activation") {
              dotColor = "bg-blue-500";
              borderColor = "border-l-blue-500";
            }

            return (
              <div
                key={alert.id}
                className={`bg-white rounded-xl border border-gray-200 border-l-[3px] ${borderColor} transition-colors overflow-hidden ${
                  isEmergency && !isResolved ? "bg-red-50/20" : isResolved ? "opacity-70" : ""
                }`}
              >
                {/* Compact Row */}
                <div
                  onClick={() => setExpandedAlertId(isExpanded ? null : alert.id)}
                  className="px-3 py-2 flex items-center gap-2.5 cursor-pointer text-xs select-none"
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />

                  {/* Title & info snippet */}
                  <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900 whitespace-nowrap">{alert.title}</span>
                    <span className="text-gray-400 font-mono text-[11px] truncate">{alert.subtitle}</span>
                    {alert.message && (
                      <span className="text-gray-500 truncate hidden md:inline max-w-[280px]">
                        — {alert.message}
                      </span>
                    )}
                  </div>

                  {/* Status & Time */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isResolved ? (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">
                        Done
                      </span>
                    ) : isEmergency ? (
                      <span className="text-[10px] font-extrabold text-red-600 bg-red-100 px-1.5 py-0.2 rounded animate-pulse">
                        SOS
                      </span>
                    ) : null}

                    <span className="text-[11px] text-gray-400 whitespace-nowrap">
                      {fmtTimeAgo(alert.timestamp)}
                    </span>

                    {/* Fast actions on hover / mobile */}
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {alert.reporterPhone && (
                        <a
                          href={`tel:${alert.reporterPhone}`}
                          className="p-1 text-gray-400 hover:text-indigo-600 rounded transition-colors"
                          title={`Call ${alert.reporterPhone}`}
                        >
                          <Phone size={13} />
                        </a>
                      )}

                      {alert.location && (
                        <a
                          href={`https://maps.google.com/?q=${encodeURIComponent(alert.location)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 text-gray-400 hover:text-indigo-600 rounded transition-colors"
                          title="Open map"
                        >
                          <MapPin size={13} />
                        </a>
                      )}

                      {isReport && !isResolved && (
                        <button
                          type="button"
                          onClick={(e) => handleResolve(alert.id, e)}
                          className="p-1 text-gray-400 hover:text-emerald-600 rounded transition-colors cursor-pointer"
                          title="Resolve"
                        >
                          <Check size={13} />
                        </button>
                      )}

                      {isReport && (
                        <button
                          type="button"
                          onClick={(e) => handleDelete(alert.id, e)}
                          className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>

                    <span className="text-gray-300">
                      {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </span>
                  </div>
                </div>

                {/* Minimal Expanded Snippet */}
                {isExpanded && (
                  <div className="px-3 pb-2.5 pt-1 border-t border-gray-100 bg-gray-50/50 text-[11px] text-gray-700 flex flex-wrap items-center gap-4">
                    {alert.message && (
                      <div className="w-full">
                        <span className="font-semibold text-gray-800">Message: </span>
                        <span>{alert.message}</span>
                      </div>
                    )}
                    {alert.reporterPhone && (
                      <div>
                        <span className="text-gray-400">Phone: </span>
                        <a href={`tel:${alert.reporterPhone}`} className="font-bold text-indigo-600 hover:underline">
                          {alert.reporterPhone}
                        </a>
                      </div>
                    )}
                    {alert.location && (
                      <div>
                        <span className="text-gray-400">Location: </span>
                        <a
                          href={`https://maps.google.com/?q=${encodeURIComponent(alert.location)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-indigo-600 hover:underline inline-flex items-center gap-0.5"
                        >
                          <span>{alert.location}</span>
                          <ExternalLink size={9} />
                        </a>
                      </div>
                    )}
                    {alert.qrId && (
                      <div>
                        <span className="text-gray-400">Tag: </span>
                        <span className="font-mono font-bold text-gray-800">{alert.qrId}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Clear Confirmation Modal */}
      {confirmClearAll && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
          onClick={() => setConfirmClearAll(false)}
        >
          <div
            className="bg-white rounded-xl border border-gray-200 p-4 max-w-xs w-full shadow-lg space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle size={16} />
              <h3 className="text-sm font-bold">Clear all alerts?</h3>
            </div>
            <p className="text-xs text-gray-500">This removes all recorded alerts.</p>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmClearAll(false)}
                className="px-3 py-1 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="px-3 py-1 text-xs font-bold rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

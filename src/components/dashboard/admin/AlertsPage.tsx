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
import { CodeVisibilityToggleButton } from "./StickerCodeComponents";
import { adminStickerLabel, useCodesRevealed } from "../../../lib/codeVisibility";
import { getCategoryLabel } from "../../../stickerModules";
import { mapRowToRecord } from "./helpers";
import { apiClient } from "../../../lib/apiClient";
import { usePolling } from "../../../hooks/usePolling";
import ConfirmModal from "./ConfirmModal";
import Pagination, { usePagination } from "../shared/Pagination";
import AlertDateFilter, {
  DEFAULT_ALERT_FILTER,
  isInAlertRange,
  type AlertDateFilterValue,
} from "../shared/AlertDateFilter";

interface AlertsPageProps {
  qrList: QrRecord[];
  setQrList?: React.Dispatch<React.SetStateAction<QrRecord[]>>;
  templates?: Template[];
  setToast: (message: string | null) => void;
  isAdmin: boolean;
  searchQuery: string;
  /** Called after a resolve/delete/clear so the sidebar badge re-counts straight away. */
  onChanged?: () => void;
}

type AlertCategoryFilter = "all" | "emergency" | "assistance" | "activation" | "scan" | "location";

/** A live-location session's points, loaded when its row is expanded. */
type TrailDetail = { status: "loading" } | { status: "error" } | { status: "ready"; points: { lat: number; lng: number; accuracy?: number | null; at: string }[]; count: number };

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

function formatLocationDisplay(location: any): string {
  if (!location) return "";
  if (typeof location === "string") return location;
  if (typeof location === "object" && location.lat != null && location.lng != null) {
    const acc = location.accuracy ? ` (±${Math.round(location.accuracy)}m)` : "";
    return `${Number(location.lat).toFixed(5)}, ${Number(location.lng).toFixed(5)}${acc}`;
  }
  return "";
}

function getLocationMapsUrl(location: any): string {
  if (!location) return "";
  if (typeof location === "string") {
    if (location.startsWith("http://") || location.startsWith("https://")) return location;
    return `https://maps.google.com/?q=${encodeURIComponent(location)}`;
  }
  if (typeof location === "object" && location.lat != null && location.lng != null) {
    return `https://maps.google.com/?q=${location.lat},${location.lng}`;
  }
  return "";
}

/** Expanded view for a live-location session: its totals and most recent fixes. */
function TrailPanel({ detail, onRetry }: { detail?: TrailDetail; onRetry: () => void }) {
  const shell = "px-3 pb-3 pt-2 border-t border-gray-100 bg-gray-50/50 text-[11px] text-gray-700";
  if (!detail || detail.status === "loading") {
    return <div className={shell}>Loading locations…</div>;
  }
  if (detail.status === "error") {
    return (
      <div className={shell}>
        Couldn't load this session.{" "}
        <button type="button" onClick={onRetry} className="font-semibold underline cursor-pointer">Retry</button>
      </div>
    );
  }
  const recent = [...detail.points].reverse().slice(0, 25);
  return (
    <div className={`${shell} space-y-2`}>
      <div className="flex flex-wrap gap-4 font-semibold text-gray-800">
        <span>{detail.count} update{detail.count === 1 ? "" : "s"}</span>
        <span className="text-gray-400 font-normal">Showing the latest {recent.length}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-400 font-semibold">
              <th className="py-1 pr-3">Time</th>
              <th className="py-1 pr-3">Latitude</th>
              <th className="py-1 pr-3">Longitude</th>
              <th className="py-1 pr-3">Accuracy</th>
              <th className="py-1">Map</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {recent.map((p, i) => (
              <tr key={`${p.at}-${i}`} className="border-t border-gray-100">
                <td className="py-1 pr-3 whitespace-nowrap">{new Date(p.at).toLocaleTimeString()}</td>
                <td className="py-1 pr-3">{p.lat.toFixed(5)}</td>
                <td className="py-1 pr-3">{p.lng.toFixed(5)}</td>
                <td className="py-1 pr-3">{p.accuracy != null ? `${Math.round(p.accuracy)} m` : "—"}</td>
                <td className="py-1">
                  <a href={`https://www.google.com/maps?q=${p.lat},${p.lng}`} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">Open</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {detail.count > detail.points.length && (
        <p className="text-gray-400">Older updates aren't kept; only the latest {detail.points.length} are stored.</p>
      )}
    </div>
  );
}

export default function AlertsPage({
  qrList,
  setQrList,
  setToast,
  isAdmin,
  searchQuery,
  onChanged,
}: AlertsPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<AlertCategoryFilter>("all");
  const [incidentReports, setIncidentReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [codesRevealed, setCodesRevealed] = useCodesRevealed();
  const [dateFilter, setDateFilter] = useState<AlertDateFilterValue>(DEFAULT_ALERT_FILTER);
  const [trails, setTrails] = useState<any[]>([]);
  const [trailDetail, setTrailDetail] = useState<Record<string, TrailDetail>>({});

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Fetches latest updates of incident alerts and activated QR tags from the backend
  const fetchReports = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    try {
      const [alertsRes, qrRes, trailsRes] = await Promise.allSettled([
        apiClient.alerts.getAlerts(200),
        setQrList ? apiClient.qr.getQrCodes(500) : Promise.resolve(null),
        apiClient.alerts.getTrails(200),
      ]);

      if (trailsRes.status === "fulfilled" && trailsRes.value) {
        setTrails(Array.isArray(trailsRes.value.data) ? trailsRes.value.data : []);
        // Points cached for an open session are stale after a refresh; the open panel reloads them.
        setTrailDetail({});
      }

      if (alertsRes.status === "fulfilled" && alertsRes.value) {
        setIncidentReports(Array.isArray(alertsRes.value.data) ? alertsRes.value.data : []);
        setLoadError(null);
      } else if (alertsRes.status === "rejected") {
        setLoadError(alertsRes.reason?.message || "Could not load alerts.");
      }

      if (qrRes.status === "fulfilled" && qrRes.value?.data && setQrList) {
        setQrList(qrRes.value.data.map(mapRowToRecord));
      }
    } catch (err: any) {
      setLoadError(err?.message || "Could not load alerts.");
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, setQrList]);

  // Loads the recent points for an expanded live-location row.
  const loadTrail = useCallback(async (key: string) => {
    setTrailDetail((prev) => ({ ...prev, [key]: { status: "loading" } }));
    try {
      const res = await apiClient.alerts.getTrail(key.slice("trail-".length));
      const d = res.data;
      setTrailDetail((prev) => ({
        ...prev,
        [key]: { status: "ready", points: d?.points || [], count: d?.count ?? 0 },
      }));
    } catch {
      setTrailDetail((prev) => ({ ...prev, [key]: { status: "error" } }));
    }
  }, []);

  useEffect(() => {
    if (expandedAlertId?.startsWith("trail-") && !trailDetail[expandedAlertId]) {
      loadTrail(expandedAlertId);
    }
  }, [expandedAlertId, trailDetail, loadTrail]);

  const handleSelectCategory = (cat: AlertCategoryFilter) => {
    setSelectedCategory(cat);
    // When switching filters (e.g. SOS to All or Scans), immediately pull latest updates
    fetchReports().catch(() => {});
  };

  const refresh = usePolling(fetchReports, { intervalMs: 30_000, enabled: isAdmin });

  // Each action reports what the SERVER did. The old calls swallowed failures
  // (`.catch(() => null)`) and then updated the screen and toasted success anyway,
  // so a failed resolve/delete looked done until the next refresh undid it.
  const handleResolve = async (alertId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const rawId = alertId.replace(/^report-/, "");
    try {
      const res = await apiClient.alerts.resolveAlert(rawId);
      if (!res?.success || res.data?.success === false) throw new Error("Alert not resolved");
      setIncidentReports((prev) =>
        prev.map((r) => (String(r.id) === String(rawId) ? { ...r, status: "resolved" } : r))
      );
      setToast("Resolved");
      onChanged?.();
    } catch {
      setToast("Could not resolve — try again");
    }
  };

  const handleDelete = async (alertId: string) => {
    const rawId = alertId.replace(/^report-/, "");
    try {
      const res = await apiClient.alerts.deleteAlert(rawId);
      if (!res?.success) throw new Error("Alert not deleted");
      setIncidentReports((prev) => prev.filter((r) => String(r.id) !== String(rawId)));
      setToast("Deleted");
      onChanged?.();
    } catch {
      setToast("Could not delete — try again");
    }
  };

  const handleClearAll = async () => {
    setConfirmClearAll(false);
    try {
      const res = await apiClient.alerts.deleteAllAlerts();
      if (!res?.success) throw new Error("Alerts not cleared");
      setIncidentReports([]);
      setToast("Cleared all alerts");
      onChanged?.();
    } catch {
      setToast("Failed to clear — try again");
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
        subtitle: adminStickerLabel({ id: report.qr_code_id, registeredName: report.sticker_name }, "Vehicle"),
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

    // Live-location sessions: one row per session, however many pings it holds.
    trails.forEach((t) => {
      list.push({
        id: `trail-${t.id}`,
        category: "location",
        title: "Live location",
        subtitle: adminStickerLabel({ id: t.sticker_id, registeredName: t.sticker_name }, "Sticker"),
        timestamp: t.last_at || t.started_at || new Date().toISOString(),
        status: "info",
        qrId: t.sticker_id,
        message: `${t.count} location update${t.count === 1 ? "" : "s"}`,
        location: t.last_lat != null ? { lat: t.last_lat, lng: t.last_lng, accuracy: t.last_accuracy } : undefined,
      });
    });

    // Activation alerts: only stickers a client has successfully activated, and
    // only Sticker ID | status | phone — no failed attempts, codes or metadata.
    qrList
      .filter((qr) => qr.status === "active" && (qr.ownerPhone || qr.phoneNumber))
      .forEach((qr) => {
        list.push({
          id: `activation-${qr.id}`,
          category: "activation",
          title: "Activated Successfully",
          subtitle: adminStickerLabel(qr, getCategoryLabel((qr.category || "car") as any)),
          timestamp: qr.activatedAt || qr.createdAt,
          status: "active",
          reporterPhone: qr.ownerPhone || qr.phoneNumber,
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
          subtitle: `${adminStickerLabel(qr, getCategoryLabel((qr.category || "car") as any))} (${qr.scans} scans)`,
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
  }, [incidentReports, qrList, trails, codesRevealed]);

  // Only the alerts inside the chosen window are counted and listed — the page
  // opens on the last 24 hours.
  const rangeAlerts = useMemo(
    () => unifiedAlerts.filter((a) => isInAlertRange(a.timestamp, dateFilter)),
    [unifiedAlerts, dateFilter]
  );

  const counts = useMemo(() => {
    const total = rangeAlerts.length;
    const emergency = rangeAlerts.filter((a) => a.category === "emergency" && a.status !== "resolved").length;
    const assistance = rangeAlerts.filter((a) => a.category === "assistance" && a.status !== "resolved").length;
    const activation = rangeAlerts.filter((a) => a.category === "activation").length;
    const scan = rangeAlerts.filter((a) => a.category === "scan").length;
    const location = rangeAlerts.filter((a) => a.category === "location").length;
    return { total, emergency, assistance, activation, scan, location };
  }, [rangeAlerts]);

  const filteredAlerts = useMemo(() => {
    let list = rangeAlerts;
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
          (a.location && formatLocationDisplay(a.location).toLowerCase().includes(q))
      );
    }
    return list;
  }, [rangeAlerts, selectedCategory, localSearch]);

  // 10 rows per page by default; a new filter or search starts again from page 1.
  const pager = usePagination<SystemAlertItem>(filteredAlerts, [selectedCategory, localSearch, dateFilter.range, dateFilter.day]);

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7 pb-16 space-y-4 text-[var(--fx-ink)] font-body min-h-screen" style={{ background: "var(--fx-canvas)" }}>
      {/* ── Top Bar (Minimal, Compact) ─────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="fx-text-heading-page text-[var(--fx-ink)]">Alerts</h1>
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
            onClick={refresh}
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

      {loadError && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-md border border-[var(--fx-red)]/30 bg-[var(--fx-red-soft)] px-3 py-2 text-xs text-[var(--fx-red)]">
          <span className="font-semibold">{loadError}</span>
          <button type="button" onClick={refresh} className="font-bold underline underline-offset-2 cursor-pointer">Retry</button>
        </div>
      )}

      {/* ── Filters & Search (Single Compact Row) ───────────────────────── */}
      <AlertDateFilter value={dateFilter} onChange={setDateFilter} />

      <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
        {/* Minimal Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {[
            { key: "all", label: "All", count: counts.total },
            { key: "emergency", label: "SOS", count: counts.emergency, red: counts.emergency > 0 },
            { key: "assistance", label: "Assistance", count: counts.assistance },
            { key: "activation", label: "Activated", count: counts.activation },
            { key: "scan", label: "Scans", count: counts.scan },
            { key: "location", label: "Live", count: counts.location },
          ].map((tab) => {
            const active = selectedCategory === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleSelectCategory(tab.key as AlertCategoryFilter)}
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

        {selectedCategory === "activation" && (
          <CodeVisibilityToggleButton
            isRevealed={codesRevealed}
            onToggleVisibility={() => setCodesRevealed(!codesRevealed)}
          />
        )}

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
          <div className="bg-white border border-gray-200 rounded-md p-8 text-center">
            <CheckCircle2 size={20} className="text-emerald-500 mx-auto mb-1.5" />
            <p className="text-xs font-semibold text-gray-600">
              {dateFilter.range === "1d" ? "No alerts in the last 24 hours" : "No alerts matching filter"}
            </p>
          </div>
        ) : (
          pager.pageItems.map((alert) => {
            const isExpanded = expandedAlertId === alert.id;
            const isResolved = alert.status === "resolved";
            const isEmergency = alert.category === "emergency";
            const isReport = alert.id.startsWith("report-");
            // Activation rows are a fixed "Sticker ID | status | phone" line — nothing to expand.
            const isActivation = alert.category === "activation";

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
            } else if (alert.category === "location") {
              dotColor = "bg-teal-500";
              borderColor = "border-l-teal-500";
            }

            return (
              <div
                key={alert.id}
                className={`bg-white rounded-md border border-gray-200 border-l-[3px] ${borderColor} transition-colors overflow-hidden ${
                  isEmergency && !isResolved ? "bg-red-50/20" : isResolved ? "opacity-70" : ""
                }`}
              >
                {/* Compact Row */}
                <div
                  onClick={isActivation ? undefined : () => setExpandedAlertId(isExpanded ? null : alert.id)}
                  className={`px-3 py-2 flex items-center gap-2.5 text-xs select-none ${isActivation ? "" : "cursor-pointer"}`}
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />

                  {/* Title & info snippet */}
                  {isActivation ? (
                    <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-gray-900">{alert.subtitle}</span>
                      <span className="text-gray-300">|</span>
                      <span className="font-semibold text-emerald-700">{alert.title}</span>
                      <span className="text-gray-300">|</span>
                      <span className="font-mono text-gray-600">{alert.reporterPhone}</span>
                    </div>
                  ) : (
                  <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900 whitespace-nowrap">{alert.title}</span>
                    <span className="text-gray-400 font-mono text-[11px] truncate">{alert.subtitle}</span>
                    {alert.message && (
                      <span className="text-gray-500 truncate hidden md:inline max-w-[280px]">
                        — {alert.message}
                      </span>
                    )}
                  </div>
                  )}

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
                      {alert.reporterPhone && !isActivation && (
                        <a
                          href={`tel:${alert.reporterPhone}`}
                          className="p-1 text-gray-400 hover:text-indigo-600 rounded transition-colors"
                          title={`Call ${alert.reporterPhone}`}
                        >
                          <Phone size={13} />
                        </a>
                      )}

                      {getLocationMapsUrl(alert.location) && (
                        <a
                          href={getLocationMapsUrl(alert.location)}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            setPendingDeleteId(alert.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>

                    {!isActivation && (
                      <span className="text-gray-300">
                        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </span>
                    )}
                  </div>
                </div>

                {/* Minimal Expanded Snippet */}
                {isExpanded && alert.category === "location" && (
                  <TrailPanel detail={trailDetail[alert.id]} onRetry={() => loadTrail(alert.id)} />
                )}

                {isExpanded && alert.category !== "location" && (
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
                    {formatLocationDisplay(alert.location) && (
                      <div>
                        <span className="text-gray-400">Location: </span>
                        <a
                          href={getLocationMapsUrl(alert.location)}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-indigo-600 hover:underline inline-flex items-center gap-0.5"
                        >
                          <span>{formatLocationDisplay(alert.location)}</span>
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
        <Pagination
          page={pager.page}
          pageCount={pager.pageCount}
          pageSize={pager.pageSize}
          total={pager.total}
          onPageChange={pager.setPage}
          onPageSizeChange={pager.setPageSize}
        />
      </div>

      <ConfirmModal
        isOpen={!!pendingDeleteId}
        title="Delete this alert?"
        message="This alert will be permanently removed."
        onConfirm={() => {
          if (pendingDeleteId) handleDelete(pendingDeleteId);
        }}
        onClose={() => setPendingDeleteId(null)}
      />

      {/* Clear Confirmation Modal */}
      {confirmClearAll && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
          onClick={() => setConfirmClearAll(false)}
        >
          <div
            className="bg-white rounded-md border border-gray-200 p-4 max-w-xs w-full shadow-lg space-y-3"
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

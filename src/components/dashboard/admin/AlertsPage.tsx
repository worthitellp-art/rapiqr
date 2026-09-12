import type React from "react";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  MessageSquare,
  Phone,
  MapPin,
  Info,
  Eye,
  Trash2,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Car,
  Check,
  AlertOctagon,
} from "lucide-react";
import { QrRecord, Template, SystemAlertItem } from "./types";
import { fmtDateTime } from "./helpers";
import { apiClient } from "../../../lib/apiClient";

interface AlertsPageProps {
  qrList: QrRecord[];
  setQrList: React.Dispatch<React.SetStateAction<QrRecord[]>>;
  templates: Template[];
  setToast: (message: string | null) => void;
  isAdmin: boolean;
  searchQuery: string;
}

type AlertCategoryFilter = "all" | "emergency" | "assistance" | "activation" | "scan";

export default function AlertsPage({
  qrList,
  setToast,
  isAdmin,
  searchQuery,
}: AlertsPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<AlertCategoryFilter>("all");
  const [incidentReports, setIncidentReports] = useState<any[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState<boolean>(false);
  const [isDeletingAllAlerts, setIsDeletingAllAlerts] = useState<boolean>(false);
  const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState<boolean>(false);
  const [activeActionAlertId, setActiveActionAlertId] = useState<string | null>(null);

  /**
   * Fetch latest incident reports from database and local storage fallback.
   */
  const fetchIncidentReports = useCallback(async () => {
    setIsLoadingReports(true);
    try {
      const databaseReportsPromise = isAdmin
        ? apiClient.alerts.getAlerts().then((response) => response?.data || []).catch(() => [])
        : Promise.resolve([]);

      const databaseReports = await databaseReportsPromise;
      let combinedReports: any[] = Array.isArray(databaseReports) ? databaseReports : [];

      try {
        const localSerialized = localStorage.getItem("repiqr-reports") || localStorage.getItem("namoqr-reports") || "[]";
        const localParsed = JSON.parse(localSerialized);
        if (Array.isArray(localParsed) && localParsed.length > 0) {
          const existingDatabaseIds = new Set(combinedReports.map((report) => String(report.id)));
          const uniqueLocalReports = localParsed.filter((report: any) => !existingDatabaseIds.has(String(report.id)));
          combinedReports = [...uniqueLocalReports, ...combinedReports];
        }
      } catch {
        // Silently preserve database reports if localStorage parsing fails
      }

      setIncidentReports(combinedReports);
    } finally {
      setIsLoadingReports(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchIncidentReports();

    const handleReportsUpdated = () => {
      fetchIncidentReports();
    };

    window.addEventListener("repiqr-reports-updated", handleReportsUpdated);
    window.addEventListener("namoqr-reports-updated", handleReportsUpdated);

    // Poll for new emergency broadcasts every 15 seconds for administrators
    const pollingInterval = isAdmin ? setInterval(fetchIncidentReports, 15000) : null;

    return () => {
      window.removeEventListener("repiqr-reports-updated", handleReportsUpdated);
      window.removeEventListener("namoqr-reports-updated", handleReportsUpdated);
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [fetchIncidentReports, isAdmin]);

  /**
   * Delete all incident reports from both the remote database and local storage.
   */
  const handleDeleteAllAlerts = async () => {
    setIsDeletingAllAlerts(true);
    try {
      if (isAdmin) {
        await apiClient.alerts.deleteAllAlerts().catch(() => null);
      }

      localStorage.removeItem("repiqr-reports");
      localStorage.removeItem("namoqr-reports");
      window.dispatchEvent(new Event("repiqr-reports-updated"));

      setIncidentReports([]);
      setShowDeleteConfirmationModal(false);
      setToast("All alerts and incident logs have been cleared successfully.");
    } catch {
      setToast("Failed to delete all alerts. Please check your connection.");
    } finally {
      setIsDeletingAllAlerts(false);
    }
  };

  /**
   * Delete a single incident report.
   */
  const handleDeleteSingleAlert = async (alertId: string) => {
    const rawReportId = alertId.replace(/^report-/, "");
    setActiveActionAlertId(alertId);

    try {
      if (isAdmin) {
        await apiClient.alerts.deleteAlert(rawReportId).catch(() => null);
      }

      try {
        const storedReports = JSON.parse(localStorage.getItem("repiqr-reports") || "[]");
        const updatedLocalReports = storedReports.filter((item: any) => String(item.id) !== String(rawReportId));
        localStorage.setItem("repiqr-reports", JSON.stringify(updatedLocalReports));
      } catch {
        // Ignore local parse issues
      }

      setIncidentReports((previousReports) =>
        previousReports.filter((report) => String(report.id) !== String(rawReportId))
      );
      setToast("Alert removed successfully.");
    } catch {
      setToast("Could not remove alert.");
    } finally {
      setActiveActionAlertId(null);
    }
  };

  /**
   * Mark a single incident report as resolved.
   */
  const handleResolveSingleAlert = async (alertId: string) => {
    const rawReportId = alertId.replace(/^report-/, "");
    setActiveActionAlertId(alertId);

    try {
      if (isAdmin) {
        await apiClient.alerts.resolveAlert(rawReportId).catch(() => null);
      }

      try {
        const storedReports = JSON.parse(localStorage.getItem("repiqr-reports") || "[]");
        const updatedLocalReports = storedReports.map((item: any) =>
          String(item.id) === String(rawReportId) ? { ...item, status: "resolved" } : item
        );
        localStorage.setItem("repiqr-reports", JSON.stringify(updatedLocalReports));
      } catch {
        // Ignore local parse issues
      }

      setIncidentReports((previousReports) =>
        previousReports.map((report) =>
          String(report.id) === String(rawReportId) ? { ...report, status: "resolved" } : report
        )
      );
      setToast("Alert marked as resolved.");
    } catch {
      setToast("Could not resolve alert.");
    } finally {
      setActiveActionAlertId(null);
    }
  };

  // Construct unified alerts list from incident reports, pending QR activations, and scan events
  const unifiedAlerts = useMemo<SystemAlertItem[]>(() => {
    const alertsList: SystemAlertItem[] = [];

    // 1. Incident Reports (Emergency / Assistance)
    incidentReports.forEach((report) => {
      const isTrueEmergency = report.type === "emergency";
      const formattedType = report.type
        ? report.type.replace(/_/g, " ").replace(/\b\w/g, (char: string) => char.toUpperCase())
        : "Contact Vehicle Owner";

      alertsList.push({
        id: `report-${report.id}`,
        category: isTrueEmergency ? "emergency" : "assistance",
        title: isTrueEmergency ? "🚨 LIVE SOS ROADSIDE EMERGENCY" : `Assistance Request: ${formattedType}`,
        subtitle: report.product_label || report.license_plate || report.qr_code_id || "Vehicle Tag",
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

    // 2. QR Codes pending activation
    qrList
      .filter((qr) => qr.status === "inactive" || qr.status === "pending")
      .forEach((qr) => {
        alertsList.push({
          id: `activation-${qr.id}`,
          category: "activation",
          title: `Pending Activation: ${qr.vehicleName || "Vehicle QR Tag"}`,
          subtitle: `QR ID: ${qr.id} · Plate: ${qr.vehicleNumber || "Unassigned"}`,
          timestamp: qr.createdAt,
          status: "active",
          qrId: qr.id,
          vehicleName: qr.vehicleName,
          vehicleNumber: qr.vehicleNumber,
        });
      });

    // 3. QR Scan activity events
    qrList
      .filter((qr) => qr.scans > 0)
      .slice(0, 8)
      .forEach((qr) => {
        alertsList.push({
          id: `scan-${qr.id}`,
          category: "scan",
          title: `Vehicle Tag Scanned: ${qr.vehicleName || qr.id}`,
          subtitle: `Total scan count: ${qr.scans} · Plate: ${qr.vehicleNumber || "N/A"}`,
          timestamp: qr.createdAt,
          status: "info",
          qrId: qr.id,
          vehicleName: qr.vehicleName,
          vehicleNumber: qr.vehicleNumber,
        });
      });

    // Prioritize active true emergencies first, followed by newest timestamp
    alertsList.sort((alertA, alertB) => {
      const isLiveA = alertA.isTrueEmergency && alertA.status !== "resolved";
      const isLiveB = alertB.isTrueEmergency && alertB.status !== "resolved";
      if (isLiveA !== isLiveB) return isLiveA ? -1 : 1;
      return new Date(alertB.timestamp).getTime() - new Date(alertA.timestamp).getTime();
    });

    return alertsList;
  }, [incidentReports, qrList]);

  // Counts for badge indicators
  const emergencyCount = useMemo(
    () => unifiedAlerts.filter((alert) => alert.category === "emergency" && alert.status !== "resolved").length,
    [unifiedAlerts]
  );
  const assistanceCount = useMemo(
    () => unifiedAlerts.filter((alert) => alert.category === "assistance" && alert.status !== "resolved").length,
    [unifiedAlerts]
  );
  const activationCount = useMemo(
    () => unifiedAlerts.filter((alert) => alert.category === "activation").length,
    [unifiedAlerts]
  );
  const scanCount = useMemo(
    () => unifiedAlerts.filter((alert) => alert.category === "scan").length,
    [unifiedAlerts]
  );

  // Filter alerts by category tab and optional global search query
  const filteredAlerts = useMemo(() => {
    let result = unifiedAlerts;

    if (selectedCategory !== "all") {
      result = result.filter((alert) => alert.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((alert) => {
        const titleMatch = alert.title.toLowerCase().includes(query);
        const subtitleMatch = alert.subtitle.toLowerCase().includes(query);
        const vehicleMatch = alert.vehicleNumber?.toLowerCase().includes(query);
        const qrMatch = alert.qrId?.toLowerCase().includes(query);
        const phoneMatch = alert.reporterPhone?.toLowerCase().includes(query);
        const messageMatch = alert.message?.toLowerCase().includes(query);
        return titleMatch || subtitleMatch || vehicleMatch || qrMatch || phoneMatch || messageMatch;
      });
    }

    return result;
  }, [unifiedAlerts, selectedCategory, searchQuery]);

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7 pb-16 space-y-6 text-[var(--fx-ink)] font-body bg-[var(--fx-canvas)] min-h-screen">
      {/* Top Banner: High-priority SOS broadcast warning */}
      {emergencyCount > 0 && (
        <div className="flex items-center justify-between gap-4 border-2 border-red-500 bg-red-100/90 px-4 sm:px-6 py-4 rounded-xl shadow-md animate-pulse">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3.5 w-3.5 flex-shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-600 opacity-80" />
              <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-red-600" />
            </span>
            <div>
              <p className="text-sm font-extrabold text-red-900 tracking-wide">
                CRITICAL EMERGENCY ALERT: {emergencyCount} Active SOS Broadcast{emergencyCount > 1 ? "s" : ""}
              </p>
              <p className="text-xs font-semibold text-red-700 mt-0.5">
                Real-time roadside location or accident notification shared from motorist phone.
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedCategory("emergency")}
            className="flex-shrink-0 bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            View Emergencies
          </button>
        </div>
      )}

      {/* Header bar with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--fx-border)] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold font-display text-[var(--fx-ink)] tracking-tight">System Alerts & Incidents</h1>
            <span className="bg-[var(--fx-border)] text-[var(--fx-ink-2)] text-xs font-bold px-2.5 py-0.5 rounded-full">
              {unifiedAlerts.length} Total
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--fx-ink-2)] mt-1">
            Real-time roadside emergencies, motorist assistance requests, and scanner telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={fetchIncidentReports}
            disabled={isLoadingReports}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-[var(--fx-ink-2)] bg-white border border-[var(--fx-border-strong)] rounded-xl hover:bg-[var(--fx-canvas)] shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh alerts feed"
          >
            <RefreshCw size={14} className={isLoadingReports ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>

          {unifiedAlerts.length > 0 && (
            <button
              onClick={() => setShowDeleteConfirmationModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 shadow-xs transition-colors cursor-pointer"
              title="Delete all incident reports"
            >
              <Trash2 size={14} />
              <span>Delete All Alerts</span>
            </button>
          )}
        </div>
      </div>

      {/* Category filter pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {([
          { key: "all", label: "All Alerts", count: unifiedAlerts.length },
          { key: "emergency", label: "Emergencies", count: emergencyCount, isDanger: true },
          { key: "assistance", label: "Assistance", count: assistanceCount, isWarning: true },
          { key: "activation", label: "Pending Activation", count: activationCount },
          { key: "scan", label: "Scans", count: scanCount },
        ] as Array<{ key: AlertCategoryFilter; label: string; count: number; isDanger?: boolean; isWarning?: boolean }>).map((tab) => {
          const isSelected = selectedCategory === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setSelectedCategory(tab.key)}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isSelected
                  ? "bg-[var(--fx-accent)] text-white shadow-xs"
                  : "bg-white border border-[var(--fx-border)] text-[var(--fx-ink-2)] hover:bg-[var(--fx-canvas)] hover:text-[var(--fx-ink)]"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span
                  className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? tab.isDanger
                        ? "bg-red-500 text-white"
                        : "bg-[var(--fx-ink)] text-[var(--fx-faint)]"
                      : tab.isDanger
                      ? "bg-red-100 text-red-700 font-black"
                      : tab.isWarning
                      ? "bg-amber-100 text-amber-800"
                      : "bg-[var(--fx-canvas)] text-[var(--fx-ink-2)]"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Alerts list */}
      <div className="space-y-3.5">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white border border-[var(--fx-border)] p-12 text-center rounded-2xl shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3.5 border border-emerald-100">
              <CheckCircle2 size={28} />
            </div>
            <h3 className="font-display font-bold text-[var(--fx-ink)] text-base">All clear — no alerts</h3>
            <p className="text-xs text-[var(--fx-ink-2)] mt-1 max-w-sm mx-auto">
              There are no active emergency broadcasts or assistance requests matching your current filter.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isLiveEmergency = alert.isTrueEmergency && alert.status !== "resolved";
            const isResolved = alert.status === "resolved";
            const isReport = alert.id.startsWith("report-");
            const isAssistance = alert.category === "assistance";
            const isActivation = alert.category === "activation";
            const isScan = alert.category === "scan";

            return (
              <div
                key={alert.id}
                className={`bg-white rounded-2xl transition-all shadow-xs overflow-hidden ${
                  isLiveEmergency
                    ? "border-2 border-red-500 bg-red-50/20 ring-4 ring-red-50"
                    : isResolved
                    ? "border border-[var(--fx-border)] opacity-80"
                    : isAssistance
                    ? "border-2 border-amber-300 bg-amber-50/20"
                    : "border border-[var(--fx-border)]"
                }`}
              >
                {/* Alert Top Bar */}
                <div
                  className={`px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b ${
                    isLiveEmergency
                      ? "bg-red-50 border-red-200"
                      : isAssistance
                      ? "bg-amber-50/80 border-amber-200"
                      : "bg-[var(--fx-canvas)] border-[var(--fx-border)]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {isLiveEmergency ? (
                      <span className="relative flex h-3 w-3">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-red-600" />
                      </span>
                    ) : null}

                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                        isLiveEmergency
                          ? "bg-red-600 text-white"
                          : isAssistance
                          ? "bg-amber-500 text-white"
                          : isActivation
                          ? "bg-blue-600 text-white"
                          : "bg-[var(--fx-ink)] text-white"
                      }`}
                    >
                      {isLiveEmergency ? (
                        <AlertTriangle size={15} />
                      ) : isAssistance ? (
                        <Phone size={14} />
                      ) : isActivation ? (
                        <Bell size={14} />
                      ) : (
                        <Eye size={14} />
                      )}
                    </div>

                    <span
                      className={`text-xs font-extrabold uppercase tracking-wider ${
                        isLiveEmergency
                          ? "text-red-700"
                          : isAssistance
                          ? "text-amber-800"
                          : isActivation
                          ? "text-blue-700"
                          : "text-[var(--fx-ink-2)]"
                      }`}
                    >
                      {isLiveEmergency
                        ? "🚨 Live Emergency SOS"
                        : isAssistance
                        ? "Motorist Assistance Request"
                        : isActivation
                        ? "QR Tag Activation Pending"
                        : "Scanner Telemetry"}
                    </span>

                    {/* Status Pill */}
                    {isResolved ? (
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Resolved
                      </span>
                    ) : isLiveEmergency ? (
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-600 text-white animate-pulse">
                        Action Required
                      </span>
                    ) : (
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                        Pending
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono font-medium text-[var(--fx-ink-2)]">
                    <Clock size={13} className="text-[var(--fx-faint)]" />
                    <span>{fmtDateTime(alert.timestamp)}</span>
                  </div>
                </div>

                {/* Alert Body */}
                <div className="p-5 space-y-4">
                  <div>
                    <h2
                      className={`text-base font-bold font-display ${
                        isLiveEmergency ? "text-red-900" : "text-[var(--fx-ink)]"
                      }`}
                    >
                      {alert.title}
                    </h2>
                    <p className="text-xs font-semibold text-[var(--fx-ink-2)] mt-0.5">{alert.subtitle}</p>
                  </div>

                  {/* Message Container: Highly visible with high-contrast borders */}
                  {alert.message && (
                    <div
                      className={`p-4 rounded-xl border ${
                        isLiveEmergency
                          ? "bg-red-50/80 border-red-200 text-red-950"
                          : isAssistance
                          ? "bg-amber-50/50 border-amber-200 text-[var(--fx-ink)]"
                          : "bg-[var(--fx-canvas)] border-[var(--fx-border)] text-[var(--fx-ink)]"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <MessageSquare
                          size={16}
                          className={`mt-0.5 flex-shrink-0 ${
                            isLiveEmergency ? "text-red-600" : "text-amber-600"
                          }`}
                        />
                        <div className="space-y-1">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--fx-ink-2)]">
                            Report Details / Message
                          </p>
                          <p className="text-sm font-medium leading-relaxed">{alert.message}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Metadata & Quick Action Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                    {/* Vehicle Plate / Identification */}
                    {(alert.vehicleNumber || alert.vehicleName) && (
                      <div className="bg-[var(--fx-canvas)] border border-[var(--fx-border)] rounded-xl p-3 flex items-center gap-2.5">
                        <Car size={16} className="text-[var(--fx-faint)] flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--fx-faint)]">
                            Vehicle Plate
                          </p>
                          <p className="text-xs font-mono font-bold text-[var(--fx-ink)] truncate">
                            {alert.vehicleNumber || alert.vehicleName}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* QR Identifier */}
                    {alert.qrId && (
                      <div className="bg-[var(--fx-canvas)] border border-[var(--fx-border)] rounded-xl p-3 flex items-center gap-2.5">
                        <Info size={16} className="text-[var(--fx-faint)] flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--fx-faint)]">QR Tag ID</p>
                          <p className="text-xs font-mono font-bold text-[var(--fx-ink)] truncate">{alert.qrId}</p>
                        </div>
                      </div>
                    )}

                    {/* Reporter Phone Number */}
                    {alert.reporterPhone ? (
                      <div className="bg-[var(--fx-canvas)] border border-[var(--fx-border)] rounded-xl p-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Phone size={16} className="text-emerald-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--fx-faint)]">
                              Reporter Phone
                            </p>
                            <p className="text-xs font-mono font-bold text-[var(--fx-ink)] truncate">
                              {alert.reporterPhone}
                            </p>
                          </div>
                        </div>
                        <a
                          href={`tel:${alert.reporterPhone}`}
                          className="inline-flex items-center justify-center p-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
                          title="Call reporter directly"
                        >
                          <Phone size={13} />
                        </a>
                      </div>
                    ) : null}

                    {/* GPS Coordinates & Google Maps Link */}
                    {alert.location && typeof alert.location === "object" && alert.location.lat != null ? (
                      <div className="bg-[var(--fx-canvas)] border border-[var(--fx-border)] rounded-xl p-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <MapPin size={16} className="text-red-500 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--fx-faint)]">
                              GPS Coordinates
                            </p>
                            <p className="text-xs font-mono font-bold text-[var(--fx-ink)] truncate">
                              {alert.location.lat.toFixed(4)}, {alert.location.lng.toFixed(4)}
                            </p>
                          </div>
                        </div>
                        <a
                          href={`https://www.google.com/maps?q=${alert.location.lat},${alert.location.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          <span>Map</span>
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    ) : alert.location && typeof alert.location === "string" ? (
                      <div className="bg-[var(--fx-canvas)] border border-[var(--fx-border)] rounded-xl p-3 flex items-center gap-2.5">
                        <MapPin size={16} className="text-red-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--fx-faint)]">Location</p>
                          <p className="text-xs font-medium text-[var(--fx-ink)] truncate">{alert.location}</p>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* Card Action Buttons (Only for actionable incident reports) */}
                  {isReport && (
                    <div className="pt-3 border-t border-[var(--fx-border)] flex items-center justify-end gap-2.5">
                      {!isResolved && (
                        <button
                          onClick={() => handleResolveSingleAlert(alert.id)}
                          disabled={activeActionAlertId === alert.id}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <Check size={14} />
                          <span>Mark as Resolved</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteSingleAlert(alert.id)}
                        disabled={activeActionAlertId === alert.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-700 hover:text-red-800 hover:bg-red-50 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                        title="Delete this alert"
                      >
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete All Alerts Confirmation Modal */}
      {showDeleteConfirmationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[var(--fx-border)] space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
              <AlertOctagon size={24} />
            </div>

            <div>
              <h3 className="text-lg font-bold font-display text-[var(--fx-ink)]">Clear All Incident Alerts?</h3>
              <p className="text-xs text-[var(--fx-ink-2)] mt-1 leading-relaxed">
                This action will permanently delete all roadside emergency reports, assistance requests, and incident
                logs from the database. This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirmationModal(false)}
                disabled={isDeletingAllAlerts}
                className="px-4 py-2 text-xs font-bold text-[var(--fx-ink-2)] bg-[var(--fx-canvas)] hover:bg-[var(--fx-border)] rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAllAlerts}
                disabled={isDeletingAllAlerts}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Trash2 size={14} />
                <span>{isDeletingAllAlerts ? "Deleting..." : "Yes, Delete All Alerts"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

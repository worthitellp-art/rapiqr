import type React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useLocalStorage } from "./useLocalStorage";
import { QrRecord, Template } from "./types";
import { qrFullUrl, DEFAULT_STICKER_POS } from "./helpers";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";
import QuickLookModal from "./QuickLookModal";
import RestoreStickerModal from "./RestoreStickerModal";
import Toast from "./Toast";
import OverviewPage from "./OverviewPage";
import QrCodesPage from "./QrCodesPage";
import AlertsPage from "./AlertsPage";
import CommunicationPage from "./CommunicationPage";
import MessageManagerPage from "./MessageManagerPage";
import UsersPage from "./UsersPage";
import CustomizePage from "./CustomizePage";
import DistributorsPage from "./DistributorsPage";
import ShopProductsPage from "./ShopProductsPage";
import OrdersPage from "./OrdersPage";
import RepiChatPage from "./RepiChatPage";
import PrintSheetModal from "./PrintSheetModal";
import { apiClient, AdminSummary } from "../../../lib/apiClient";
import { usePolling } from "../../../hooks/usePolling";

// How often the cheap heartbeat runs, and the slower safety-net refresh of the
// full fleet list (which otherwise only reloads when the heartbeat says it changed).
const SUMMARY_INTERVAL_MS = 30_000;
const FLEET_FALLBACK_INTERVAL_MS = 120_000;
const CHAT_INTERVAL_MS = 20_000;
// A just-generated row may not be in a response that was already in flight; keep it
// this long before treating a row the server doesn't know about as a deleted ghost.
const LOCAL_ONLY_GRACE_MS = 2 * 60_000;

// Browsers that used the old console still hold the fleet list (owner names and
// phones) and alert reports in localStorage. The backend is the only source now,
// so clear those copies instead of leaving personal data on disk indefinitely.
const LEGACY_PII_KEYS = ["repiqr-qrlist", "namoqr-qrlist", "repiqr-reports", "namoqr-reports"];

function mapRowToRecord(r: any): QrRecord {
  return {
    id: r.id,
    qrUrl: qrFullUrl(r.id),
    clientId: r.client_id,
    createdAt: r.created_at,
    scans: r.scans_count || 0,
    status: r.status || "inactive",
    template: r.template_name || "Default",
    category: r.category || "car",
    fg: r.fg_color || "D9581F",
    bg: r.bg_color || "FFFFFF",
    ownerPhone: r.owner_phone || undefined,
    ownerName: r.owner_name || undefined,
    vehicleNumber: r.vehicle_number || undefined,
    activatedAt: r.activated_at || undefined,
    labelName: r.label_name || undefined,
    labelColor: r.label_color || undefined,
    isPrinted: Boolean(r.is_printed),
  };
}

export default function AdminDashboard({ onBack }: { onBack: () => void }) {
  const { profile, signOut, isAdmin } = useAuth();
  const [page, setPage] = useState(() => {
    try {
      const saved = localStorage.getItem("repiqr-admin-active-menu") || localStorage.getItem("namoqr-admin-active-menu");
      if (saved) return saved;
    } catch { /* fallback */ }
    return isAdmin ? "overview" : "qr";
  });
  const [templates, setTemplates] = useLocalStorage<Template[]>("repiqr-templates", []);
  // In memory only — never persisted. See LEGACY_PII_KEYS.
  const [qrList, setQrList] = useState<QrRecord[]>([]);
  // The QR slot is fixed to the template's panel — not a saved/per-admin setting,
  // so no stale localStorage or server value can ever push it out of place.
  const stickerPos = DEFAULT_STICKER_POS;
  // Shared with both the main fleet table (read) and the Print Sheet modal
  // (read/write) so marking a sticker printed in one place is reflected in
  // the other immediately — see PrintSheetModal/usePrintSheetState.
  const [printedStickerIdList, setPrintedStickerIdList] = useLocalStorage<string[]>("repiqr-printed-sticker-ids", []);
  const [quickLookQr, setQuickLookQr] = useState<QrRecord | null>(null);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [unreadChats, setUnreadChats] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [printSheetTargetSticker, setPrintSheetTargetSticker] = useState<QrRecord | null>(null);
  const [printSheetInitialBatch, setPrintSheetInitialBatch] = useState<QrRecord[] | undefined>(undefined);
  const [isPrintSheetModalOpen, setIsPrintSheetModalOpen] = useState(false);

  function handleOpenPrintSheet(targetSticker?: QrRecord, selectedBatchStickers?: QrRecord[]) {
    setPrintSheetTargetSticker(targetSticker || null);
    setPrintSheetInitialBatch(selectedBatchStickers);
    setIsPrintSheetModalOpen(true);
  }

  useEffect(() => {
    try {
      LEGACY_PII_KEYS.forEach((key) => localStorage.removeItem(key));
    } catch { /* storage unavailable */ }
  }, []);

  // RepiChat unread count — client accounts only; admin gets the "Online Now"
  // presence widget on the Overview page instead of a chat inbox.
  usePolling(async () => {
    const res = await apiClient.chat.listOwnerSessions();
    if (res.success) setUnreadChats(res.data.reduce((sum, s) => sum + (s.unread_owner_count || 0), 0));
  }, { intervalMs: CHAT_INTERVAL_MS, enabled: !isAdmin });

  // Heartbeat: one small, PII-free response gives the sidebar badges and the
  // Overview KPIs (exact, straight from the database — not derived from a capped
  // list). Pauses while the tab is hidden, backs off if the server errors.
  const refreshSummary = usePolling(async () => {
    const res = await apiClient.admin.getSummary();
    if (res?.success) setSummary(res.data);
  }, { intervalMs: SUMMARY_INTERVAL_MS, enabled: isAdmin });

  // The fleet list backs the tables. Backend rows are the source of truth; a row
  // that exists only locally survives just long enough for its create call to
  // round-trip, after which it is a ghost (deleted elsewhere) and is dropped.
  // Deletes only update state on confirmed success, so there is no client-side
  // "hidden ids" blacklist to go stale.
  const refreshFleet = usePolling(async () => {
    const res = await apiClient.qr.getQrCodes(500);
    const rows = res?.data;
    if (!rows) return;
    const mapped = rows.map(mapRowToRecord);

    // Sync any server-side printed flags into the local printedStickerIdList set
    const serverPrintedIds = rows.filter((r: any) => Boolean(r.is_printed)).map((r: any) => r.id);
    if (serverPrintedIds.length > 0) {
      setPrintedStickerIdList((prev) => Array.from(new Set([...prev, ...serverPrintedIds])));
    }

    setQrList((prev) => {
      const backendIds = new Set(mapped.map((r) => r.id));
      const now = Date.now();
      const freshLocalOnly = prev.filter(
        (r) => !backendIds.has(r.id) && now - new Date(r.createdAt || 0).getTime() < LOCAL_ONLY_GRACE_MS
      );
      return [...freshLocalOnly, ...mapped];
    });
  }, { intervalMs: FLEET_FALLBACK_INTERVAL_MS, enabled: isAdmin });

  // Re-download the list only when the heartbeat reports the fleet actually changed.
  const tagSignature = summary
    ? `${summary.tags.total}|${summary.tags.active}|${summary.tags.scans}|${summary.tags.lastCreatedAt}`
    : null;
  const lastSignatureRef = useRef<string | null>(null);
  const refreshFleetRef = useRef(refreshFleet);
  refreshFleetRef.current = refreshFleet;
  useEffect(() => {
    if (!tagSignature) return;
    if (lastSignatureRef.current !== null && lastSignatureRef.current !== tagSignature) refreshFleetRef.current();
    lastSignatureRef.current = tagSignature;
  }, [tagSignature]);

  const refreshAll = useCallback(() => {
    refreshSummary();
    refreshFleet();
  }, [refreshSummary, refreshFleet]);

  const admin = {
    name: profile?.fullName || (isAdmin ? "System Admin" : "Client User"),
    email: profile?.email || "",
    role: isAdmin ? "Administrator" : "Client Account",
  };

  const attention = summary?.attention;
  const badges: Record<string, number> = {
    alerts: attention?.unresolvedAlerts ?? 0,
    orders: attention?.ordersToShip ?? 0,
    distributors: attention?.pendingPartners ?? 0,
    messages: attention?.failedMessages24h ?? 0,
    repichat: unreadChats,
  };

  // Persist active menu & reset search on page change & guard admin-only pages for client users
  useEffect(() => {
    try {
      localStorage.setItem("repiqr-admin-active-menu", page);
    } catch { /* fallback */ }
    if (!isAdmin && (page === "overview" || page === "orders" || page === "distributors" || page === "users" || page === "communication" || page === "messages" || page === "customize" || page === "products")) {
      setPage("qr");
    }
    // Admin has no RepiChat inbox (see "Online Now" on Overview instead) — a
    // stale localStorage page value shouldn't strand them on a page with no nav entry.
    if (isAdmin && page === "repichat") {
      setPage("overview");
    }
    // Backup & Restore was removed — a stale localStorage value shouldn't
    // strand anyone on a page with no nav entry and no component behind it.
    if (page === "backup") {
      setPage(isAdmin ? "overview" : "qr");
    }
    setSearchQuery("");
  }, [page, isAdmin]);

  // NOTE: sticker template sync previously read from a direct Supabase
  // `templates` table with no backend endpoint behind it. There is no
  // /api/templates route yet, so this is a no-op for now (templates are
  // effectively local-only, same as the real behavior before this migration
  // since that direct Supabase path was already unconfigured/dormant).

  return (
    <div
      className="fx-shell h-screen w-full flex overflow-hidden text-[var(--fx-ink)]"
      style={{ background: "var(--fx-canvas)" } as React.CSSProperties}
    >
      {/* Mobile drawer backdrop — md+ docks the sidebar so it never renders there */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        page={page} setPage={setPage} admin={admin} onBack={onBack} onSignOut={signOut}
        badges={badges}
        isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ background: "var(--fx-canvas)" }}>
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="md:hidden m-3 w-8 h-8 flex-shrink-0 rounded-md bg-[var(--fx-surface)] border border-[var(--fx-border)] flex items-center justify-center text-[var(--fx-ink)] cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu size={16} />
        </button>

        <div className="flex-1 overflow-y-auto">
          {page === "overview" && (
            <OverviewPage
              qrList={qrList} setQrList={setQrList}
              summary={summary} onRefresh={refreshAll}
              setPage={setPage} openQuickLook={setQuickLookQr}
              setToast={setToast} openPrintSheet={handleOpenPrintSheet}
            />
          )}
          {page === "orders" && <OrdersPage setToast={setToast} />}
          {page === "distributors" && <DistributorsPage setToast={setToast} />}
          {page === "qr" && (
            <QrCodesPage
              qrList={qrList} setQrList={setQrList} templates={templates}
              setToast={setToast} openQuickLook={setQuickLookQr}
              openRestore={() => setRestoreModalOpen(true)} searchQuery={searchQuery}
              stickerPos={stickerPos} openPrintSheet={handleOpenPrintSheet}
              printedStickerIdList={printedStickerIdList}
              setPrintedStickerIdList={setPrintedStickerIdList}
            />
          )}
          {page === "communication" && <CommunicationPage setToast={setToast} />}
          {page === "messages" && <MessageManagerPage />}
          {page === "alerts" && (
            <AlertsPage
              qrList={qrList} setQrList={setQrList} templates={templates}
              setToast={setToast} searchQuery={searchQuery} isAdmin={isAdmin}
              onChanged={refreshSummary}
            />
          )}
          {page === "repichat" && <RepiChatPage />}
          {page === "users" && <UsersPage setToast={setToast} />}
          {page === "products" && <ShopProductsPage setToast={setToast} />}

          {page === "customize" && (
            <CustomizePage
              templates={templates} setTemplates={setTemplates}
              stickerPos={stickerPos}
              setToast={setToast}
              openPrintSheet={() => handleOpenPrintSheet()}
            />
          )}
        </div>
      </div>

      <QuickLookModal
        qr={quickLookQr}
        onClose={() => setQuickLookQr(null)}
        stickerPos={stickerPos}
        templates={templates}
        onOpenPrintSheet={handleOpenPrintSheet}
      />
      <RestoreStickerModal
        isOpen={restoreModalOpen} onClose={() => setRestoreModalOpen(false)}
        setQrList={setQrList} openQuickLook={setQuickLookQr} setToast={setToast}
      />
      <PrintSheetModal
        isOpen={isPrintSheetModalOpen}
        onClose={() => {
          setIsPrintSheetModalOpen(false);
          setPrintSheetTargetSticker(null);
          setPrintSheetInitialBatch(undefined);
        }}
        availableStickers={qrList}
        initialSelectedSticker={printSheetTargetSticker}
        initialBatchStickers={printSheetInitialBatch}
        stickerPos={stickerPos}
        printedStickerIdList={printedStickerIdList}
        setPrintedStickerIdList={setPrintedStickerIdList}
        onShowToast={(msg) => {
          setToast(msg);
          setTimeout(() => setToast(null), 3500);
        }}
      />
      <Toast msg={toast} />
    </div>
  );
}

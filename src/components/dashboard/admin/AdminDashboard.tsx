import type React from "react";
import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { getTemplatesFromDb, getReportsFromDb, getQrCodesFromDb } from "../../../lib/supabaseService";
import { useLocalStorage } from "./useLocalStorage";
import { QrRecord, Template, StickerPos } from "./types";
import { qrFullUrl } from "./helpers";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
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
import OrdersPage from "./OrdersPage";
import RepiChatPage from "./RepiChatPage";
import BackupPage from "./BackupPage";
import { apiClient } from "../../../lib/apiClient";

export default function AdminDashboard({ onBack }: { onBack: () => void }) {
  const { profile, signOut, isAdmin } = useAuth();
  const [page, setPage] = useState(() => {
    try {
      const saved = localStorage.getItem("repiqr-admin-active-menu") || localStorage.getItem("namoqr-admin-active-menu");
      if (saved) return saved;
    } catch { /* fallback */ }
    return isAdmin ? "overview" : "qr";
  });
  const accent = "FFB020";
  const fontCss = "'Plus Jakarta Sans', 'Inter', ui-sans-serif, system-ui";
  const [templates, setTemplates] = useLocalStorage<Template[]>("repiqr-templates", []);
  const [qrList, setQrList] = useLocalStorage<QrRecord[]>("repiqr-qrlist", []);
  const [stickerPos, setStickerPos] = useLocalStorage<StickerPos>("repiqr-sticker-pos", { x: 110, y: 40, w: 100, h: 100 });
  const [quickLookQr, setQuickLookQr] = useState<QrRecord | null>(null);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [unreadChats, setUnreadChats] = useState(0);

  // RepiChat unread count — client accounts only; admin gets the "Online Now"
  // presence widget on the Overview page instead of a chat inbox.
  useEffect(() => {
    if (isAdmin) return;
    const update = () => {
      apiClient.chat.listOwnerSessions().then((res) => {
        if (res.success) setUnreadChats(res.data.reduce((sum, s) => sum + (s.unread_owner_count || 0), 0));
      }).catch(() => { /* not logged in yet / transient network error */ });
    };
    update();
    const interval = setInterval(update, 15000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    const update = () => {
      getReportsFromDb().then((dbReports) => {
        let combined: any[] = dbReports || [];
        try {
          const local = JSON.parse(localStorage.getItem("repiqr-reports") || localStorage.getItem("namoqr-reports") || "[]");
          const existingIds = new Set(combined.map((r) => r.id));
          combined = [...local.filter((r: any) => !existingIds.has(r.id)), ...combined];
        } catch { /* ignore */ }
        setUnreadAlerts(combined.filter((r: any) => r.status !== "resolved").length);
      });
    };
    update();
    const onUpdated = () => update();
    window.addEventListener("repiqr-reports-updated", onUpdated);
    const interval = setInterval(update, 15000);
    return () => {
      window.removeEventListener("repiqr-reports-updated", onUpdated);
      clearInterval(interval);
    };
  }, [isAdmin]);

  // Sync the fleet list with the real database — previously qrList was purely a
  // localStorage cache of QR codes generated in THIS browser, so a sticker a
  // client activated (and its owner phone) from their own device never showed
  // up here. Backend rows are the source of truth for anything already synced;
  // local-only rows (e.g. freshly generated, not yet round-tripped) are kept.
  //
  // There used to be a client-side "deleted ids" blacklist here to hide rows
  // the admin had just deleted, in case the backend hadn't caught up yet. That
  // blacklist was written unconditionally BEFORE the delete call's result was
  // even checked (see QrCodesPage/OverviewPage/QRFleetDashboard), so any delete
  // that actually failed server-side (e.g. the FK-constraint bug previously in
  // qrModel.js) still hid the row here forever — a real Supabase row that could
  // never show up in this admin panel again. Deletes now propagate real success/
  // failure and only update local state on confirmed success, so backend rows
  // can be trusted directly with no separate hide-list.
  useEffect(() => {
    if (!isAdmin) return;
    const sync = () => {
      getQrCodesFromDb(500).then((rows) => {
        if (!rows) return;
        const mapped: QrRecord[] = rows.map((r: any) => ({
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
        }));
        setQrList((prev) => {
          const backendIds = new Set(mapped.map((r) => r.id));
          const localOnly = prev.filter((r) => !backendIds.has(r.id));
          return [...mapped, ...localOnly];
        });
      });
    };
    sync();
    const interval = setInterval(sync, 15000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  const admin = {
    name: profile?.fullName || (isAdmin ? "System Admin" : "Client User"),
    email: profile?.email || "",
    role: isAdmin ? "Administrator" : "Client Account",
  };

  // Persist active menu & reset search on page change & guard admin-only pages for client users
  useEffect(() => {
    try {
      localStorage.setItem("repiqr-admin-active-menu", page);
    } catch { /* fallback */ }
    if (!isAdmin && (page === "overview" || page === "orders" || page === "distributors" || page === "users" || page === "communication" || page === "messages" || page === "customize")) {
      setPage("qr");
    }
    // Admin has no RepiChat inbox (see "Online Now" on Overview instead) — a
    // stale localStorage page value shouldn't strand them on a page with no nav entry.
    if (isAdmin && page === "repichat") {
      setPage("overview");
    }
    setSearchQuery("");
  }, [page, isAdmin]);

  // Sync templates & stickerPos from Supabase
  useEffect(() => {
    getTemplatesFromDb().then((dbTemplates) => {
      if (dbTemplates && dbTemplates.length > 0) {
        const mapped: Template[] = dbTemplates.map((t: any) => ({
          id: t.id,
          name: t.name,
          fg: t.fg_color,
          bg: t.bg_color,
          logo: null,
          stickerPos: t.sticker_pos || { x: 110, y: 40, w: 100, h: 100 },
          isPublicDefault: t.is_default,
        }));
        setTemplates(mapped);
        const defTpl = dbTemplates.find((t: any) => t.is_default);
        if (defTpl?.sticker_pos) setStickerPos(defTpl.sticker_pos);
      }
    });
  }, []);

  return (
    <div
      className="h-screen w-full flex overflow-hidden text-[#17181A]"
      style={{ "--accent": "#5C78DF", fontFamily: "'Inter', sans-serif", background: "#F7F7F8" } as React.CSSProperties}
    >
      <Sidebar page={page} setPage={setPage} admin={admin} onBack={onBack} onSignOut={signOut} unreadAlerts={unreadAlerts} unreadChats={unreadChats} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ background: "#F7F7F8" }}>
        <TopBar admin={admin} searchQuery={searchQuery} setSearchQuery={setSearchQuery} page={page} setPage={setPage} activeCount={qrList.filter(q => q.status === "active").length || 18} />

        <div className="flex-1 overflow-y-auto">
          {page === "overview" && (
            <OverviewPage
              qrList={qrList} setQrList={setQrList} templates={templates}
              setPage={setPage} openQuickLook={setQuickLookQr}
              openRestore={() => setRestoreModalOpen(true)} setToast={setToast}
            />
          )}
          {page === "orders" && <OrdersPage setToast={setToast} />}
          {page === "distributors" && <DistributorsPage setToast={setToast} />}
          {page === "qr" && (
            <QrCodesPage
              qrList={qrList} setQrList={setQrList} templates={templates}
              setToast={setToast} openQuickLook={setQuickLookQr}
              openRestore={() => setRestoreModalOpen(true)} searchQuery={searchQuery}
              stickerPos={stickerPos}
            />
          )}
          {page === "communication" && <CommunicationPage setToast={setToast} />}
          {page === "messages" && <MessageManagerPage />}
          {page === "alerts" && (
            <AlertsPage
              qrList={qrList} setQrList={setQrList} templates={templates}
              setToast={setToast} searchQuery={searchQuery} isAdmin={isAdmin}
            />
          )}
          {page === "repichat" && <RepiChatPage />}
          {page === "users" && <UsersPage searchQuery={searchQuery} setSearchQuery={setSearchQuery} setToast={setToast} />}

          {page === "customize" && (
            <CustomizePage
              templates={templates} setTemplates={setTemplates}
              stickerPos={stickerPos} setStickerPos={setStickerPos}
              setToast={setToast}
            />
          )}

          {page === "backup" && (
            <BackupPage
              qrList={qrList} setQrList={setQrList}
              stickerPos={stickerPos} setStickerPos={setStickerPos}
              setToast={setToast}
            />
          )}
        </div>
      </div>

      <QuickLookModal qr={quickLookQr} onClose={() => setQuickLookQr(null)} stickerPos={stickerPos} templates={templates} />
      <RestoreStickerModal
        isOpen={restoreModalOpen} onClose={() => setRestoreModalOpen(false)}
        qrList={qrList} setQrList={setQrList}
        templates={templates} openQuickLook={setQuickLookQr} setToast={setToast}
      />
      <Toast msg={toast} />
    </div>
  );
}

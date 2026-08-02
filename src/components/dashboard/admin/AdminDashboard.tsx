import type React from "react";
import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { getTemplatesFromDb, saveStickerPosToDb, getReportsFromDb } from "../../../lib/supabaseService";
import { useLocalStorage } from "./useLocalStorage";
import { QrRecord, Template, StickerPos } from "./types";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import QuickLookModal from "./QuickLookModal";
import RestoreStickerModal from "./RestoreStickerModal";
import Toast from "./Toast";
import OverviewPage from "./OverviewPage";
import QrCodesPage from "./QrCodesPage";
import AlertsPage from "./AlertsPage";
import CommunicationPage from "./CommunicationPage";
import UsersPage from "./UsersPage";
import CustomizePage from "./CustomizePage";
import DistributorsPage from "./DistributorsPage";
import OrdersPage from "./OrdersPage";

export default function AdminDashboard({ onBack, switchToClientPortal }: { onBack: () => void; switchToClientPortal?: () => void }) {
  const { profile, signOut, isAdmin } = useAuth();
  const [page, setPage] = useState(() => (isAdmin ? "overview" : "qr"));
  const accent = "0F172A";
  const fontCss = "'Inter', ui-sans-serif, system-ui";
  const [templates, setTemplates] = useLocalStorage<Template[]>("repiqr-templates", []);
  const [qrList, setQrList] = useLocalStorage<QrRecord[]>("repiqr-qrlist", []);
  const [stickerPos, setStickerPos] = useLocalStorage<StickerPos>("repiqr-sticker-pos", { x: 110, y: 40, w: 100, h: 100 });
  const [quickLookQr, setQuickLookQr] = useState<QrRecord | null>(null);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  // Live unread alert count for the sidebar badge (real reports only).
  // GET /api/alerts is admin-only (reporter phone + GPS location) — skip entirely
  // for client accounts, which can never pass verifyAdmin and would otherwise
  // poll it into a permanent 401 loop every 15s.
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

  const admin = {
    name: profile?.fullName || (isAdmin ? "System Admin" : "Client User"),
    email: profile?.email || "",
    role: isAdmin ? "Administrator" : "Client Account",
  };

  // Reset search on page change & guard admin-only pages for client users
  useEffect(() => {
    if (!isAdmin && (page === "overview" || page === "orders" || page === "distributors" || page === "users" || page === "communication" || page === "customize")) {
      setPage("qr");
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

  useEffect(() => {
    if (stickerPos) saveStickerPosToDb(stickerPos);
  }, [stickerPos]);

  return (
    <div
      className="h-screen w-full flex overflow-hidden text-gray-900"
      style={{ "--accent": `#${accent}`, fontFamily: fontCss, background: "#F5F6FA" } as React.CSSProperties}
    >
      <Sidebar page={page} setPage={setPage} admin={admin} onBack={onBack} onSignOut={signOut} unreadAlerts={unreadAlerts} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ background: "#F5F6FA" }}>
        <TopBar admin={admin} searchQuery={searchQuery} setSearchQuery={setSearchQuery} page={page} switchToClientPortal={switchToClientPortal} />

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
            />
          )}
          {page === "communication" && <CommunicationPage setToast={setToast} />}
          {page === "alerts" && (
            <AlertsPage
              qrList={qrList} setQrList={setQrList} templates={templates}
              setToast={setToast} searchQuery={searchQuery} isAdmin={isAdmin}
            />
          )}
          {page === "users" && <UsersPage searchQuery={searchQuery} setSearchQuery={setSearchQuery} setToast={setToast} />}

          {page === "customize" && (
            <CustomizePage
              templates={templates} setTemplates={setTemplates}
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

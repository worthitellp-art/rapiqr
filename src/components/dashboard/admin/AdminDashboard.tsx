 import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { getTemplatesFromDb, saveStickerPosToDb } from "../../../lib/supabaseService";
import { useLocalStorage } from "./useLocalStorage";
import { QrRecord, Template, TeamMember, StickerPos } from "./types";
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

export default function AdminDashboard({ onBack }: { onBack: () => void }) {
  const { profile, signOut, isAdmin } = useAuth();
  const [page, setPage] = useState(() => (isAdmin ? "overview" : "qr"));
  const accent = "EAB308";
  const fontCss = "'Plus Jakarta Sans', ui-sans-serif, system-ui";
  const [templates, setTemplates] = useLocalStorage<Template[]>("namoqr-templates", []);
  const [qrList, setQrList] = useLocalStorage<QrRecord[]>("namoqr-qrlist", []);
  const [users, setUsers] = useLocalStorage<TeamMember[]>("namoqr-users", []);
  const [stickerPos, setStickerPos] = useLocalStorage<StickerPos>("namoqr-sticker-pos", { x: 110, y: 40, w: 100, h: 100 });
  const [quickLookQr, setQuickLookQr] = useState<QrRecord | null>(null);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const admin = {
    name: profile?.fullName || (isAdmin ? "System Admin" : "Client User"),
    email: profile?.email || "",
    role: isAdmin ? "Administrator" : "Client Account",
  };

  // Reset search on page change & guard admin pages for client users
  useEffect(() => {
    if (!isAdmin && (page === "overview" || page === "users")) {
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
      <Sidebar page={page} setPage={setPage} admin={admin} onBack={onBack} onSignOut={signOut} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ background: "#F5F6FA" }}>
        <TopBar admin={admin} searchQuery={searchQuery} setSearchQuery={setSearchQuery} page={page} />

        <div className="flex-1 overflow-y-auto">
          {page === "overview" && (
            <OverviewPage
              qrList={qrList} setQrList={setQrList} templates={templates}
              setPage={setPage} openQuickLook={setQuickLookQr}
              openRestore={() => setRestoreModalOpen(true)} setToast={setToast}
            />
          )}
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
              setToast={setToast} searchQuery={searchQuery}
            />
          )}
          {page === "users" && <UsersPage users={users} setUsers={setUsers} setToast={setToast} />}
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

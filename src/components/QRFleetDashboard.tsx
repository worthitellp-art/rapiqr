import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  saveQrCodeToDb,
  getTemplatesFromDb,
  saveTemplateToDb,
  saveStickerPosToDb,
  saveStickerImageToDb,
  bulkSaveQrCodesToDb,
  getReportsFromDb,
} from "../lib/supabaseService";
import stickerTemplateImg from "../../assets/template-sticker.jpeg";
import groupLogo from "../../assets/Group 1000005716.png";
import groupLogo1 from "../../assets/Group 1000005716-1.png";
import groupLogo2 from "../../assets/Group 1000005716-2.png";
import {
  LayoutGrid,
  QrCode,
  Bell,
  Users,
  Palette,
  Search,
  ChevronRight,
  Plus,
  Download,
  Trash2,
  Settings,
  LogOut,
  X,
  Check,
  ScanLine,
  RefreshCw,
  Sparkles,
  Eye,
  UserPlus,
  FileImage,
  ShieldCheck,
  PhoneCall,
  AlertTriangle,
  ShieldAlert,
  MessageSquare,
  Phone,
  MapPin,
  CheckCircle2,
  Clock,
  Info,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { STICKER_CATEGORIES, getStickerCategoryLabel } from "../stickerModules";

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface QrRecord {
  id: string;
  qrUrl: string;
  clientId: string;
  vehicleName: string;
  vehicleNumber: string;
  createdAt: string;
  scans: number;
  status: string;
  activationCode?: string;
  template: string;
  fg: string;
  bg: string;
  category?: string;
}

interface Template {
  id: number;
  name: string;
  fg: string;
  bg: string;
  logo: null | string;
  stickerPos: StickerPos;
  isPublicDefault: boolean;
}

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface StickerPos {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SystemAlertItem {
  id: string;
  category: "emergency" | "activation" | "scan" | "fleet";
  title: string;
  subtitle: string;
  timestamp: string;
  status: "unread" | "resolved" | "active" | "info";
  qrId?: string;
  vehicleName?: string;
  vehicleNumber?: string;
  reporterPhone?: string;
  message?: string;
  location?: string;
  details?: string;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function qrImageUrl(data: string, fg: string, bg: string, size = 220) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&color=${fg}&bgcolor=${bg}&qzone=1`;
}

function avatarUrl(seed: string) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=eef2ff,fce7f3,dbeafe,fef3c7`;
}

function fmtDate(d: string) {
  try {
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return d;
  }
}

function fmtDateTime(d: string) {
  try {
    return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return d;
  }
}

function uid(prefix = "QR") {
  return `${prefix}${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

function generateActivationCode(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "ACT";
  for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

function dispatchActivationToUserDashboard(qrItem: QrRecord) {
  if (typeof window === "undefined") return;
  try {
    const existing = JSON.parse(localStorage.getItem("namoqr-pending-activations") || "[]");
    const filtered = existing.filter((item: QrRecord) => item.id !== qrItem.id);
    const updated = [
      {
        id: qrItem.id,
        activationCode: qrItem.activationCode || generateActivationCode(),
        vehicleName: qrItem.vehicleName || "Unassigned QR Sticker",
        vehicleNumber: qrItem.vehicleNumber || "PENDING",
        status: "pending_activation",
        createdAt: new Date().toISOString(),
        template: qrItem.template || "Default",
        category: qrItem.category || "car",
      },
      ...filtered,
    ];
    localStorage.setItem("namoqr-pending-activations", JSON.stringify(updated));
    window.dispatchEvent(new Event("namoqr-pending-activations-updated"));
  } catch (err) {
    console.error("Error dispatching activation code:", err);
  }
}

function getQrBaseUrl() {
  if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
  return "https://namoqr.linkspace-service.workers.dev";
}

function qrFullUrl(qrId: string) {
  return `${getQrBaseUrl()}/${qrId}`;
}

/* ─── localStorage hook ──────────────────────────────────────────────────── */

function useLocalStorage<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [val, setVal] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch { /* quota exceeded */ }
  }, [key, val]);

  return [val, setVal];
}

/* ─── Constants ──────────────────────────────────────────────────────────── */

const FONT_OPTIONS = [
  { id: "Plus Jakarta Sans", label: "Jakarta Sans", css: "'Plus Jakarta Sans', ui-sans-serif, system-ui" },
  { id: "Inter", label: "Inter", css: "'Inter', ui-sans-serif, system-ui" },
  { id: "JetBrains Mono", label: "JetBrains Mono", css: "'JetBrains Mono', ui-monospace, monospace" },
];

const NAV_ITEMS = [
  { id: "overview", label: "Dashboard", icon: LayoutGrid },
  { id: "qr", label: "QR Codes", icon: QrCode },
  { id: "communication", label: "Communication", icon: PhoneCall },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "users", label: "Team", icon: Users },
  { id: "customize", label: "Customization", icon: Palette },
];

const STICKER_SRC = stickerTemplateImg;
const EDITOR_DISPLAY = { w: 320, h: 200 };

/* ─── Mini atoms ─────────────────────────────────────────────────────────── */

function StatusPill({ status }: { status: string }) {
  const active = status === "active" || status === "resolved";
  const isUnread = status === "unread" || status === "pending";
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide"
      style={{
        background: active ? "rgba(15,118,110,0.12)" : isUnread ? "rgba(220,38,38,0.12)" : "rgba(107,114,128,0.12)",
        color: active ? "#0f766e" : isUnread ? "#b91c1c" : "#374151",
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: active ? "#0f766e" : isUnread ? "#dc2626" : "#6b7280" }} />
      {status.toUpperCase()}
    </span>
  );
}

function ActCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer hover:bg-amber-100"
      style={{ background: "rgba(180,83,9,0.1)", color: "#92400e", border: "1px solid rgba(180,83,9,0.2)" }}
    >
      <ShieldCheck size={11} />
      {copied ? "Copied!" : code}
    </button>
  );
}

function CopyLinkButton({ qrId, compact }: { qrId: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(qrFullUrl(qrId)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(qrFullUrl(qrId), "_blank");
  };

  if (compact) {
    return (
      <div className="flex items-center gap-0.5">
        <button
          onClick={handleCopy}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all cursor-pointer"
          title={copied ? "Copied!" : "Copy link"}
        >
          {copied ? <Check size={12} className="text-teal-600" /> : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
          )}
        </button>
        <button
          onClick={handleOpen}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all cursor-pointer"
          title="Open scan page"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2 w-full">
      <button
        onClick={handleCopy}
        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold text-gray-800 hover:bg-gray-50 transition-all cursor-pointer"
        style={{ borderColor: "#e5e7eb" }}
      >
        {copied ? <Check size={12} className="text-teal-600" /> : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
        )}
        {copied ? "Copied!" : "Copy Link"}
      </button>
      <button
        onClick={handleOpen}
        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold text-gray-800 hover:bg-gray-50 transition-all cursor-pointer"
        style={{ borderColor: "#e5e7eb" }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
        </svg>
        Open Page
      </button>
    </div>
  );
}

function Toast({ msg }: { msg: string | null }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (msg) { setVisible(true); } else { setVisible(false); }
  }, [msg]);

  if (!msg) return null;
  return (
    <div
      className="fixed bottom-6 right-6 z-[200] flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-bold text-white shadow-xl"
      style={{
        background: "linear-gradient(135deg, #0f172a, #1e293b)",
        transform: visible ? "translateY(0) scale(1)" : "translateY(8px) scale(0.96)",
        opacity: visible ? 1 : 0,
        transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
      }}
    >
      <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "var(--accent)" }}>
        <Check size={11} />
      </div>
      {msg}
    </div>
  );
}

/* ─── Sticker Thumb ──────────────────────────────────────────────────────── */

function StickerThumb({ qr, templates, size = 96 }: { qr: QrRecord; templates: Template[]; size?: number }) {
  const tpl = templates.find((t) => t.name === qr.template) || templates[0];
  const sp = tpl?.stickerPos || { x: 110, y: 40, w: 100, h: 100 };
  const thumbH = Math.round(size * (EDITOR_DISPLAY.h / EDITOR_DISPLAY.w));
  const qrX = (sp.x / EDITOR_DISPLAY.w) * size;
  const qrY = (sp.y / EDITOR_DISPLAY.h) * thumbH;
  const qrW = (sp.w / EDITOR_DISPLAY.w) * size;
  const qrH = (sp.h / EDITOR_DISPLAY.h) * thumbH;
  const qrFg = qr?.fg || "EAB308";
  const qrBg = qr?.bg || "FFFFFF";

  return (
    <div
      style={{
        width: size, height: thumbH, position: "relative", overflow: "hidden",
        borderRadius: 8, flexShrink: 0,
        boxShadow: "0 4px 16px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)",
      }}
    >
      <img src={STICKER_SRC} style={{ width: "100%", height: "100%", objectFit: "fill" }} draggable={false} alt="" />
      <img
        src={qrImageUrl(qrFullUrl(qr.id), qrFg, qrBg, 128)}
        style={{ position: "absolute", left: qrX, top: qrY, width: qrW, height: qrH, objectFit: "contain" }}
        draggable={false}
        alt="qr"
      />
    </div>
  );
}

async function compositeQrOnSticker(qrDataUrl: string, pos: StickerPos): Promise<Blob | null> {
  return new Promise((resolve) => {
    const sticker = new Image();
    sticker.crossOrigin = "anonymous";
    sticker.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = sticker.naturalWidth;
      canvas.height = sticker.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(null);
      ctx.drawImage(sticker, 0, 0);
      const scaleX = sticker.naturalWidth / EDITOR_DISPLAY.w;
      const scaleY = sticker.naturalHeight / EDITOR_DISPLAY.h;
      const qr = new Image();
      qr.crossOrigin = "anonymous";
      qr.onload = () => {
        ctx.drawImage(qr, pos.x * scaleX, pos.y * scaleY, pos.w * scaleX, pos.h * scaleY);
        canvas.toBlob((avifBlob) => {
          if (avifBlob && avifBlob.type === "image/avif") resolve(avifBlob);
          else canvas.toBlob((pngBlob) => resolve(pngBlob), "image/png");
        }, "image/avif", 0.95);
      };
      qr.onerror = () => resolve(null);
      qr.src = qrDataUrl;
    };
    sticker.onerror = () => resolve(null);
    sticker.src = STICKER_SRC;
  });
}

async function saveGeneratedSticker(rec: { id: string; fg?: string; bg?: string }, pos: StickerPos) {
  try {
    const qrDataUrl = await new Promise<string | null>((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        c.getContext("2d")!.drawImage(img, 0, 0);
        resolve(c.toDataURL("image/png"));
      };
      img.onerror = () => resolve(null);
      img.src = qrImageUrl(qrFullUrl(rec.id), rec.fg || "EAB308", rec.bg || "FFFFFF", 512);
    });
    if (!qrDataUrl) return null;
    const blob = await compositeQrOnSticker(qrDataUrl, pos);
    if (!blob) return null;
    return await saveStickerImageToDb(rec.id, blob);
  } catch (err) {
    console.warn("Failed to save generated sticker image:", err);
    return null;
  }
}

/* ─── Sidebar ────────────────────────────────────────────────────────────── */

function Sidebar({
  page, setPage, admin, onBack, onSignOut,
}: {
  page: string; setPage: (p: string) => void;
  admin: { name: string }; onBack: () => void; onSignOut: () => void;
}) {
  return (
    <aside className="w-[232px] flex-shrink-0 flex flex-col h-full" style={{ background: "linear-gradient(180deg, #111318 0%, #0c0e13 100%)" }}>
      {/* Logo Section */}
      <div className="px-5 pt-5 pb-4">
        <a
          href="/"
          className="flex items-center gap-2.5 cursor-pointer group"
          onClick={(e) => { e.preventDefault(); onBack(); }}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(234,179,8,0.15)" }}>
            <img src={groupLogo1} alt="RapiQR" className="h-5 w-auto object-contain" />
          </div>
          <div>
            <span className="text-sm font-extrabold text-white tracking-tight block leading-none">RapiQR</span>
            <span className="text-[9px] font-semibold text-gray-500 tracking-wide">Admin Panel</span>
          </div>
        </a>
      </div>

      {/* Navigation */}
      <div className="px-3 flex-1 overflow-y-auto">
        <p className="text-[9px] font-bold text-gray-600 tracking-[0.18em] px-3 mb-2 uppercase">Navigation</p>
        <nav className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 cursor-pointer"
                style={{
                  background: active ? "#ffffff" : "transparent",
                  color: active ? "#111318" : "#94a3b8",
                  boxShadow: active ? "0 1px 4px rgba(0,0,0,0.12)" : "none",
                }}
              >
                <Icon size={16} strokeWidth={active ? 2.2 : 1.8} style={{ color: active ? "#EAB308" : "#64748b" }} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="my-4 mx-3 border-t border-white/5" />

        <p className="text-[9px] font-bold text-gray-600 tracking-[0.18em] px-3 mb-2 uppercase">Settings</p>
        <nav className="space-y-0.5">
          <button
            onClick={() => setPage("customize")}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 cursor-pointer"
            style={{
              background: page === "customize" ? "#ffffff" : "transparent",
              color: page === "customize" ? "#111318" : "#94a3b8",
              boxShadow: page === "customize" ? "0 1px 4px rgba(0,0,0,0.12)" : "none",
            }}
          >
            <Settings size={16} strokeWidth={page === "customize" ? 2.2 : 1.8} style={{ color: page === "customize" ? "#EAB308" : "#64748b" }} />
            <span className="truncate">Settings</span>
          </button>
        </nav>
      </div>

      {/* Sign Out + Admin Profile */}
      <div className="px-3 pb-4">
        <button
          onClick={() => { onSignOut(); onBack(); }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 cursor-pointer"
          style={{ color: "#f87171" }}
        >
          <LogOut size={16} strokeWidth={1.8} />
          <span className="truncate">Sign Out</span>
        </button>

        <div className="mt-3 px-3 py-2.5 rounded-xl flex items-center gap-2.5" style={{ background: "rgba(255,255,255,0.04)" }}>
          <img
            src={avatarUrl(admin.name)}
            alt={admin.name}
            className="w-8 h-8 rounded-lg object-cover"
            style={{ background: "#1e293b" }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-white truncate leading-tight">{admin.name}</p>
            <p className="text-[10px] font-medium text-gray-500">Administrator</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ─── Top Bar ────────────────────────────────────────────────────────────── */

function TopBar({
  admin, searchQuery, setSearchQuery, page,
}: {
  admin: { name: string };
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  page: string;
}) {
  const pageTitles: Record<string, string> = {
    overview: "Dashboard Overview", qr: "QR Codes & Fleet Management", communication: "Communication & Helplines",
    alerts: "Alerts & Notifications Feed", users: "Team Members & Permissions", customize: "Brand & Template Customization",
  };

  return (
    <div
      className="h-16 flex-shrink-0 flex items-center justify-between px-8 border-b"
      style={{ borderColor: "rgba(0,0,0,0.06)", background: "#FAFAF7" }}
    >
      <div className="flex items-center gap-3">
        <h1 className="text-base font-extrabold text-gray-900 tracking-tight">{pageTitles[page] || "Dashboard"}</h1>
      </div>

      <div className="flex items-center gap-3">
        {(page === "qr" || page === "alerts") && (
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search QR, vehicle, alert message…"
              className="pl-8 pr-4 py-2 text-xs bg-white rounded-xl border text-gray-900 placeholder:text-gray-400 outline-none w-60 transition-all focus:w-72 font-medium shadow-xs"
              style={{ borderColor: "#e2e8f0" }}
            />
          </div>
        )}

        <button className="relative w-8 h-8 rounded-xl bg-white border flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all cursor-pointer" style={{ borderColor: "#e2e8f0" }}>
          <Bell size={14} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
        </button>
      </div>
    </div>
  );
}

/* ─── Overview Page ──────────────────────────────────────────────────────── */

function OverviewPage({
  qrList, setQrList, templates, setPage, openQuickLook, setToast, openRestore,
}: {
  qrList: QrRecord[]; setQrList: React.Dispatch<React.SetStateAction<QrRecord[]>>;
  templates: Template[]; setPage: (p: string) => void;
  openQuickLook: (q: QrRecord) => void;
  setToast: (msg: string | null) => void;
  openRestore: () => void;
}) {
  const totalScans = qrList.reduce((a, q) => a + (q.scans || 0), 0);
  const active = qrList.filter((q) => q.status === "active").length;
  const inactive = qrList.filter((q) => q.status !== "active").length;

  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString("en-IN", { weekday: "short" });
    const count = qrList.filter((q) => {
      const cd = new Date(q.createdAt);
      return cd.toDateString() === d.toDateString();
    }).length;
    return { name: label, v: count };
  });

  const stats = [
    { label: "Total QR Codes", value: qrList.length, icon: QrCode, accent: "var(--accent)" },
    { label: "Active Stickers", value: active, icon: ScanLine, accent: "#0f766e" },
    { label: "Inactive / Pending", value: inactive, icon: RefreshCw, accent: "#b45309" },
    { label: "Total Scans", value: totalScans, icon: Eye, accent: "#6366f1" },
  ];

  return (
    <div className="px-8 pt-7 pb-10 space-y-7 text-gray-900">
      {/* Stat grid */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={i}
              className="bg-white rounded-2xl p-5 border flex items-center gap-4 transition-all hover:shadow-md"
              style={{ borderColor: "#f0f0f0" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${s.accent}15`, color: s.accent }}
              >
                <Icon size={18} />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1 }}>
                  {s.value.toLocaleString()}
                </p>
                <p className="text-xs text-gray-600 mt-1 font-semibold">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Chart */}
        <div className="col-span-2 bg-white rounded-2xl p-6 border" style={{ borderColor: "#f0f0f0" }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">QR Generation This Week</h3>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">Codes generated per day</p>
            </div>
            <button
              onClick={() => setPage("qr")}
              className="flex items-center gap-1 text-xs font-bold transition-colors hover:opacity-80 cursor-pointer"
              style={{ color: "var(--accent)" }}
            >
              View all <ChevronRight size={12} />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} barSize={22} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "none", borderRadius: 10, color: "#fff", fontSize: 12, padding: "6px 12px" }}
                cursor={{ fill: "rgba(0,0,0,0.04)", radius: 6 }}
              />
              <Bar dataKey="v" radius={[6, 6, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={i === chartData.length - 1 ? "var(--accent)" : "#e2e8f0"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-2xl p-6 border flex flex-col gap-3" style={{ borderColor: "#f0f0f0" }}>
          <h3 className="font-bold text-gray-900 text-sm">Quick Actions</h3>
          <button
            onClick={() => setPage("qr")}
            className="w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:scale-[1.02] text-white text-sm font-bold cursor-pointer shadow-sm"
            style={{ background: "var(--accent)" }}
          >
            <span className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <QrCode size={16} />
            </span>
            Generate QR Code
          </button>
          <button
            onClick={openRestore}
            className="w-full flex items-center gap-3 p-3 rounded-xl border text-sm font-semibold text-gray-800 hover:bg-amber-50 hover:border-amber-200 transition-all cursor-pointer"
            style={{ borderColor: "#e2e8f0" }}
          >
            <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <RefreshCw size={16} />
            </span>
            Restore by ID
          </button>
          <button
            onClick={() => setPage("customize")}
            className="w-full flex items-center gap-3 p-3 rounded-xl border text-sm font-semibold text-gray-800 hover:bg-violet-50 hover:border-violet-200 transition-all cursor-pointer"
            style={{ borderColor: "#e2e8f0" }}
          >
            <span className="w-8 h-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
              <Palette size={16} />
            </span>
            Manage Templates
          </button>
          <button
            onClick={() => setPage("communication")}
            className="w-full flex items-center gap-3 p-3 rounded-xl border text-sm font-semibold text-gray-800 hover:bg-emerald-50 hover:border-emerald-200 transition-all cursor-pointer"
            style={{ borderColor: "#e2e8f0" }}
          >
            <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <PhoneCall size={16} />
            </span>
            Edit Helplines
          </button>
        </div>
      </div>

      {/* Recent table */}
      {qrList.length > 0 && (
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#f0f0f0" }}>
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#f7f7f7" }}>
            <h3 className="font-bold text-gray-900 text-sm">Recent QR Codes</h3>
            <button onClick={() => setPage("qr")} className="text-xs font-bold hover:opacity-75 transition-opacity cursor-pointer" style={{ color: "var(--accent)" }}>
              See all
            </button>
          </div>
          <table className="w-full text-sm text-gray-800">
            <thead>
              <tr className="text-left text-[11px] text-gray-500 font-bold border-b uppercase tracking-wider" style={{ borderColor: "#f7f7f7" }}>
                <th className="px-6 py-3">QR</th>
                <th className="px-2 py-3">Client</th>
                <th className="px-2 py-3">Vehicle</th>
                <th className="px-2 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {qrList.slice(0, 5).map((q, i) => (
                <tr
                  key={q.id}
                  className="border-b last:border-0 hover:bg-gray-50/60 transition-colors"
                  style={{ borderColor: "#f7f7f7", animationDelay: `${i * 40}ms` }}
                >
                  <td className="px-6 py-3">
                    <button onClick={() => openQuickLook(q)} className="hover:opacity-80 transition-opacity cursor-pointer">
                      <StickerThumb qr={q} templates={templates} size={38} />
                    </button>
                  </td>
                  <td className="px-2 py-3 font-mono text-xs font-bold text-gray-800">{q.clientId}</td>
                  <td className="px-2 py-3">
                    <p className="text-xs font-bold text-gray-900">{q.vehicleName}</p>
                    <p className="text-[10px] text-gray-500 font-mono font-medium">{q.vehicleNumber}</p>
                  </td>
                  <td className="px-2 py-3"><StatusPill status={q.status} /></td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openQuickLook(q)} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-all cursor-pointer">
                        <Eye size={13} />
                      </button>
                      <button
                        onClick={() => { setQrList((prev) => prev.filter((x) => x.id !== q.id)); setToast("QR removed"); setTimeout(() => setToast(null), 1500); }}
                        className="w-7 h-7 rounded-lg hover:bg-red-50 hover:text-red-500 flex items-center justify-center text-gray-400 transition-all cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {qrList.length === 0 && (
        <div className="bg-white rounded-2xl border flex flex-col items-center py-16 text-center" style={{ borderColor: "#f0f0f0" }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(234,179,8,0.1)", color: "var(--accent)" }}>
            <QrCode size={22} />
          </div>
          <p className="font-bold text-gray-900 text-sm">No QR codes yet</p>
          <p className="text-xs text-gray-500 mt-1 max-w-xs font-medium">Generate your first QR sticker to start tracking and managing your fleet.</p>
          <button
            onClick={() => setPage("qr")}
            className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 cursor-pointer shadow-sm"
            style={{ background: "var(--accent)" }}
          >
            <Plus size={14} /> Generate First QR
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── QR Codes Page ──────────────────────────────────────────────────────── */

function QrCodesPage({
  qrList, setQrList, templates, setToast, openQuickLook, openRestore, searchQuery,
}: {
  qrList: QrRecord[]; setQrList: React.Dispatch<React.SetStateAction<QrRecord[]>>;
  templates: Template[]; setToast: (msg: string | null) => void;
  openQuickLook: (q: QrRecord) => void; openRestore: () => void; searchQuery: string;
}) {
  const [vehicleName, setVehicleName] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [templateId, setTemplateId] = useState(
    templates.find((t) => t.isPublicDefault)?.id?.toString() || templates[0]?.id?.toString() || ""
  );
  const [tab, setTab] = useState("single");
  const [bulkCount, setBulkCount] = useState(25);
  const [bulkProgress, setBulkProgress] = useState<number | null>(null);
  const [category, setCategory] = useState("car");

  useEffect(() => {
    if (templates.length > 0 && !templates.find((t) => t.id.toString() === templateId)) {
      const def = templates.find((t) => t.isPublicDefault) || templates[0];
      setTemplateId(def.id.toString());
    }
  }, [templates]);

  const activeTemplate = templates.find((t) => t.id.toString() === templateId) || templates[0];

  const filtered = qrList.filter((q) => {
    if (!searchQuery) return true;
    const q_ = searchQuery.toLowerCase();
    return q.vehicleName.toLowerCase().includes(q_) ||
      q.vehicleNumber.toLowerCase().includes(q_) ||
      q.clientId.toLowerCase().includes(q_) ||
      q.id.toLowerCase().includes(q_);
  });

  function handleGenerateSingle() {
    if (!vehicleName || !vehicleNumber) {
      setToast("Fill in vehicle name and vehicle number");
      setTimeout(() => setToast(null), 2500);
      return;
    }
    const qrId = uid();
    const actCode = generateActivationCode();
    const rec: QrRecord = {
      id: qrId,
      qrUrl: qrFullUrl(qrId),
      clientId: uid("CL"),
      vehicleName,
      vehicleNumber,
      createdAt: new Date().toISOString(),
      scans: 0,
      status: "inactive",
      activationCode: actCode,
      template: activeTemplate?.name || "Default",
      fg: activeTemplate?.fg || "EAB308",
      bg: activeTemplate?.bg || "FFFFFF",
      category,
    };
    setQrList((prev) => [rec, ...prev]);
    saveQrCodeToDb({ id: rec.id, clientId: rec.clientId, status: rec.status, templateName: rec.template, category: rec.category, fgColor: rec.fg, bgColor: rec.bg, activationCode: actCode });
    saveGeneratedSticker(rec, activeTemplate?.stickerPos || { x: 110, y: 40, w: 100, h: 100 });
    dispatchActivationToUserDashboard(rec);
    openQuickLook(rec);
    setVehicleName("");
    setVehicleNumber("");
    setToast(`QR Generated! Code: ${actCode}`);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleGenerateBulk() {
    const count = Math.max(1, Math.min(1000, Number(bulkCount) || 0));
    setBulkProgress(0);
    const batch: QrRecord[] = Array.from({ length: count }).map((_, i) => {
      const bulkId = uid();
      const actCode = generateActivationCode();
      return {
        id: bulkId,
        qrUrl: qrFullUrl(bulkId),
        clientId: uid("CL"),
        vehicleName: `Item ${i + 1}`,
        vehicleNumber: `XX00XX${(1000 + i).toString().slice(-4)}`,
        createdAt: new Date().toISOString(),
        scans: 0,
        status: "inactive",
        activationCode: actCode,
        template: activeTemplate?.name || "Default",
        fg: activeTemplate?.fg || "EAB308",
        bg: activeTemplate?.bg || "FFFFFF",
        category,
      };
    });

    setQrList((prev) => [...batch, ...prev]);

    // Chunked Supabase insert
    const CHUNK = 50;
    for (let i = 0; i < batch.length; i += CHUNK) {
      await bulkSaveQrCodesToDb(batch.slice(i, i + CHUNK));
      setBulkProgress(Math.min(100, Math.round(((i + CHUNK) / batch.length) * 100)));
    }

    batch.forEach((item) => dispatchActivationToUserDashboard(item));
    setBulkProgress(null);
    setToast(`${count} QR codes generated & sent to User Dashboard`);
    setTimeout(() => setToast(null), 3000);
  }

  function downloadCsv() {
    const rows = [
      ["QR ID", "Client ID", "Activation Code", "Vehicle Name", "Vehicle Number", "Status", "Template", "Created"],
      ...qrList.map((q) => [q.id, q.clientId, q.activationCode || "ACTPENDING", q.vehicleName, q.vehicleNumber, q.status, q.template, fmtDate(q.createdAt)]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "namoqr-export.csv";
    a.click();
  }

  const inputCls = "w-full px-3.5 py-2.5 text-sm rounded-xl border bg-gray-50 outline-none focus:bg-white focus:border-gray-400 transition-all font-semibold text-gray-900";

  return (
    <div className="px-8 pt-7 pb-10 space-y-6 text-gray-900">
      {/* Generate card */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#f0f0f0" }}>
        <div className="flex items-center gap-1 px-6 pt-5 pb-0">
          {[{ id: "single", label: "Single QR" }, { id: "bulk", label: "Bulk Generate" }].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-4 py-1.5 text-xs font-bold rounded-full mr-1 transition-all cursor-pointer"
              style={
                tab === t.id
                  ? { background: "var(--accent)", color: "#fff" }
                  : { background: "#f3f4f6", color: "#64748b" }
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "single" ? (
          <div className="p-6 grid grid-cols-5 gap-3">
            <div>
              <label className="block text-[10px] font-extrabold text-gray-500 mb-1.5 uppercase tracking-wider">Vehicle Name</label>
              <input value={vehicleName} onChange={(e) => setVehicleName(e.target.value)} placeholder="Toyota Innova" className={inputCls} style={{ borderColor: "#e2e8f0" }} />
            </div>
            <div>
              <label className="block text-[10px] font-extrabold text-gray-500 mb-1.5 uppercase tracking-wider">Vehicle Number</label>
              <input value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} placeholder="GJ01AB1234" className={inputCls} style={{ borderColor: "#e2e8f0" }} />
            </div>
            <div>
              <label className="block text-[10px] font-extrabold text-gray-500 mb-1.5 uppercase tracking-wider">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls} style={{ borderColor: "#e2e8f0" }}>
                {STICKER_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-extrabold text-gray-500 mb-1.5 uppercase tracking-wider">Template</label>
              <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className={inputCls} style={{ borderColor: "#e2e8f0" }}>
                {templates.map((t) => <option key={t.id} value={t.id}>{t.name}{t.isPublicDefault ? " (default)" : ""}</option>)}
                {templates.length === 0 && <option value="">No templates yet</option>}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleGenerateSingle}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-95 cursor-pointer shadow-sm"
                style={{ background: "var(--accent)" }}
              >
                <Plus size={14} /> Generate
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-5 gap-3">
            <div>
              <label className="block text-[10px] font-extrabold text-gray-500 mb-1.5 uppercase tracking-wider">Quantity (max 1000)</label>
              <input
                type="number" min={1} max={1000} value={bulkCount}
                onChange={(e) => setBulkCount(Math.min(1000, Number(e.target.value)))}
                className={inputCls} style={{ borderColor: "#e2e8f0" }}
              />
            </div>
            <div>
              <label className="block text-[10px] font-extrabold text-gray-500 mb-1.5 uppercase tracking-wider">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls} style={{ borderColor: "#e2e8f0" }}>
                {STICKER_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-extrabold text-gray-500 mb-1.5 uppercase tracking-wider">Template</label>
              <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className={inputCls} style={{ borderColor: "#e2e8f0" }}>
                {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                {templates.length === 0 && <option value="">No templates</option>}
              </select>
            </div>
            <div className="col-span-2 flex items-end gap-3">
              <button
                onClick={handleGenerateBulk}
                disabled={bulkProgress !== null}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 cursor-pointer shadow-sm"
                style={{ background: "var(--accent)" }}
              >
                {bulkProgress !== null ? (
                  <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> {bulkProgress}%</>
                ) : (
                  <><Sparkles size={14} /> Generate {bulkCount}</>
                )}
              </button>
            </div>
            <p className="col-span-5 text-[11px] text-gray-500 font-medium">Vehicle names &amp; numbers are auto-assigned. Export CSV for the full batch.</p>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#f0f0f0" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#f7f7f7" }}>
          <h3 className="font-bold text-gray-900 text-sm">
            All QR Codes <span className="text-gray-500 font-normal">· {filtered.length}</span>
          </h3>
          <div className="flex items-center gap-2">
            <button onClick={openRestore} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all hover:bg-yellow-50 cursor-pointer" style={{ color: "var(--accent)", borderColor: "rgba(234,179,8,0.3)" }}>
              <RefreshCw size={12} /> Restore
            </button>
            <button onClick={downloadCsv} disabled={qrList.length === 0} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-40 cursor-pointer">
              <Download size={12} /> Export CSV
            </button>
            <button onClick={() => { setQrList([]); setToast("All QR codes cleared"); setTimeout(() => setToast(null), 1500); }} disabled={qrList.length === 0} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-all disabled:opacity-40 cursor-pointer">
              <Trash2 size={12} /> Clear all
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-semibold text-gray-700">{searchQuery ? "No results match your search." : "No QR codes yet — generate one above."}</p>
            {searchQuery && <p className="text-xs text-gray-500 mt-1 font-medium">Try adjusting your search query.</p>}
          </div>
        ) : (
          <>
            <table className="w-full text-sm text-gray-900">
              <thead>
                <tr className="text-left text-[11px] text-gray-500 font-bold uppercase tracking-wider border-b" style={{ borderColor: "#f7f7f7" }}>
                  <th className="px-6 py-3">QR</th>
                  <th className="px-2 py-3">ID / Client</th>
                  <th className="px-2 py-3">Vehicle</th>
                  <th className="px-2 py-3">Category</th>
                  <th className="px-2 py-3">Activation Code</th>
                  <th className="px-2 py-3">Created</th>
                  <th className="px-2 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 60).map((q) => {
                  const actCode = q.activationCode || "ACT????";
                  return (
                    <tr key={q.id} className="border-b last:border-0 hover:bg-gray-50/60 transition-colors" style={{ borderColor: "#f7f7f7" }}>
                      <td className="px-6 py-3">
                        <button onClick={() => openQuickLook(q)} className="hover:opacity-80 transition-opacity cursor-pointer">
                          <StickerThumb qr={q} templates={templates} size={36} />
                        </button>
                      </td>
                      <td className="px-2 py-3">
                        <p className="font-mono text-[11px] font-bold text-gray-900">{q.id}</p>
                        <p className="font-mono text-[10px] text-gray-500 font-semibold">{q.clientId}</p>
                      </td>
                      <td className="px-2 py-3">
                        <p className="text-xs font-bold text-gray-900">{q.vehicleName}</p>
                        <p className="font-mono text-[10px] text-gray-500 font-medium">{q.vehicleNumber}</p>
                      </td>
                      <td className="px-2 py-3">
                        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-yellow-50 text-yellow-700 border border-yellow-100">
                          {getStickerCategoryLabel(q.category) || "Sticker"}
                        </span>
                      </td>
                      <td className="px-2 py-3"><ActCode code={actCode} /></td>
                      <td className="px-2 py-3 text-[11px] text-gray-600 font-semibold">{fmtDate(q.createdAt)}</td>
                      <td className="px-2 py-3"><StatusPill status={q.status} /></td>
                      <td className="px-6 py-3">
                        <div className="flex items-center justify-end gap-0.5">
                          <button
                            onClick={() => { dispatchActivationToUserDashboard(q); setToast(`Code ${actCode} dispatched`); setTimeout(() => setToast(null), 2000); }}
                            className="w-7 h-7 rounded-lg hover:bg-yellow-50 hover:text-yellow-600 flex items-center justify-center text-gray-500 transition-all cursor-pointer"
                            title="Dispatch to user"
                          >
                            <UserPlus size={13} />
                          </button>
                          <CopyLinkButton qrId={q.id} compact />
                          <button onClick={() => openQuickLook(q)} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-all cursor-pointer" title="Quick look">
                            <Eye size={13} />
                          </button>
                          <button onClick={() => { setQrList((prev) => prev.filter((x) => x.id !== q.id)); setToast("QR deleted"); setTimeout(() => setToast(null), 1500); }} className="w-7 h-7 rounded-lg hover:bg-red-50 hover:text-red-500 flex items-center justify-center text-gray-400 transition-all cursor-pointer">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length > 60 && (
              <div className="px-6 py-3 text-xs text-gray-500 font-medium border-t" style={{ borderColor: "#f7f7f7" }}>
                Showing latest 60 of {filtered.length} — export CSV for the full list.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Quick Look Modal ───────────────────────────────────────────────────── */

function QuickLookModal({
  qr, onClose, stickerPos, templates,
}: {
  qr: QrRecord | null; onClose: () => void; stickerPos: StickerPos; templates: Template[];
}) {
  if (!qr) return null;

  const activeTpl = templates.find((t) => t.name === qr.template);
  const dlPos = activeTpl?.stickerPos || stickerPos;

  async function handleDownload() {
    const qrDataUrl = await new Promise<string>((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        c.getContext("2d")!.drawImage(img, 0, 0);
        resolve(c.toDataURL("image/png"));
      };
      img.src = qrImageUrl(qrFullUrl(qr.id), qr?.fg || "EAB308", qr?.bg || "FFFFFF", 512);
    });
    const blob = await compositeQrOnSticker(qrDataUrl, dlPos);
    if (blob) {
      saveStickerImageToDb(qr.id, blob);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${qr.id}-sticker.avif`;
      a.click();
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(10,10,20,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden text-gray-900 border border-gray-100"
        style={{ animation: "modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5">
          <span className="text-[10px] font-extrabold text-gray-500 tracking-[0.12em]">QUICK LOOK</span>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-all cursor-pointer">
            <X size={13} />
          </button>
        </div>

        <div className="flex flex-col items-center px-6 pt-4 pb-6">
          <div className="p-4 rounded-2xl" style={{ background: "rgba(234,179,8,0.08)" }}>
            <StickerThumb qr={qr} templates={templates} size={190} />
          </div>

          <p className="font-extrabold text-gray-900 text-lg mt-4">{qr.vehicleName}</p>
          <p className="font-mono text-xs font-bold text-gray-500">{qr.vehicleNumber}</p>

          <div className="flex flex-wrap gap-1.5 justify-center mt-3">
            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">{qr.clientId}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">{qr.template}</span>
            <StatusPill status={qr.status} />
          </div>

          <div className="w-full mt-4 p-3 rounded-2xl flex items-center justify-between" style={{ background: "rgba(180,83,9,0.08)", border: "1px solid rgba(180,83,9,0.2)" }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(180,83,9,0.15)", color: "#92400e" }}>
                <ShieldCheck size={15} />
              </div>
              <div>
                <p className="text-[9px] font-extrabold text-amber-800 uppercase tracking-wider">Activation Code</p>
                <p className="font-mono font-black text-amber-950 text-sm">{qr.activationCode || "ACT?????"}</p>
              </div>
            </div>
            <button
              onClick={() => dispatchActivationToUserDashboard(qr)}
              className="px-3 py-1.5 rounded-xl text-white text-[10px] font-bold shadow-sm transition-all hover:opacity-90 cursor-pointer"
              style={{ background: "#b45309" }}
            >
              Send to User
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5 w-full mt-4">
            <div className="bg-gray-50 rounded-xl px-3 py-2.5 text-center border border-gray-100">
              <p className="text-[10px] font-bold text-gray-500 uppercase">Scans</p>
              <p className="font-black text-gray-900 text-sm mt-0.5">{qr.scans}</p>
            </div>
            <div className="bg-gray-50 rounded-xl px-3 py-2.5 text-center border border-gray-100">
              <p className="text-[10px] font-bold text-gray-500 uppercase">Created</p>
              <p className="font-bold text-gray-900 text-xs mt-0.5">{fmtDate(qr.createdAt)}</p>
            </div>
          </div>

          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold mt-4 transition-all hover:opacity-90 active:scale-[0.98] cursor-pointer shadow-sm"
            style={{ background: "var(--accent)" }}
          >
            <Download size={13} /> Download Sticker
          </button>
          <div className="w-full mt-2">
            <CopyLinkButton qrId={qr.id} />
          </div>
        </div>
      </div>
      <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.94) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
    </div>
  );
}

/* ─── Alerts Page (All Types of Alerts & Notifications) ──────────────────── */

function AlertsPage({
  qrList, setQrList, templates, setToast, searchQuery,
}: {
  qrList: QrRecord[]; setQrList: React.Dispatch<React.SetStateAction<QrRecord[]>>;
  templates: Template[]; setToast: (msg: string | null) => void; searchQuery: string;
}) {
  const [filter, setFilter] = useState<"all" | "emergency" | "activation" | "scan">("all");
  const [reports, setReports] = useState<any[]>([]);

  // Fetch reports from Supabase & LocalStorage
  useEffect(() => {
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

      // Default mock emergency alerts if no emergency reports exist yet
      if (combined.length === 0) {
        combined = [
          {
            id: "rep-101",
            qr_code_id: "QR8A3F",
            product_label: "Toyota Innova (GJ01AB1234)",
            type: "wrong_parking",
            message: "Vehicle is parked blocking gate #2 entrance. Please move immediately.",
            reporter_phone: "+91 98765 12345",
            location: "Sector 4, Main Gate",
            status: "unread",
            created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          },
          {
            id: "rep-102",
            qr_code_id: "CLCXTF2",
            product_label: "Honda City (MH02CD5678)",
            type: "headlights_on",
            message: "Headlights left switched ON in basement parking level B2.",
            reporter_phone: "+91 98190 88776",
            location: "Basement B2, Slot 44",
            status: "unread",
            created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
          },
          {
            id: "rep-103",
            qr_code_id: "QR5590",
            product_label: "Gate Security QR Tag",
            type: "emergency_contact",
            message: "Accident reported near vehicle. Emergency contact requested.",
            reporter_phone: "+91 99001 22334",
            location: "Express Highway Exit 3",
            status: "resolved",
            created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
          },
        ];
      }
      setReports(combined);
    });
  }, []);

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
    });
  });

  // 2. Add QR Activation Dispatches & Generated Codes
  qrList.forEach((q) => {
    if (q.activationCode) {
      unifiedAlerts.push({
        id: `act-${q.id}`,
        category: "activation",
        title: `Activation Code Issued: ${q.activationCode}`,
        subtitle: `Assigned for ${q.vehicleName} (${q.vehicleNumber})`,
        timestamp: q.createdAt,
        status: "info",
        qrId: q.id,
        vehicleName: q.vehicleName,
        vehicleNumber: q.vehicleNumber,
        details: `Template: ${q.template} · Client ID: ${q.clientId}`,
      });
    }

    unifiedAlerts.push({
      id: `qr-${q.id}`,
      category: "scan",
      title: `QR Sticker Event: ${q.status.toUpperCase()}`,
      subtitle: `${q.vehicleName} · ${q.scans} total scans recorded`,
      timestamp: q.createdAt,
      status: q.status === "active" ? "active" : "info",
      qrId: q.id,
      vehicleName: q.vehicleName,
      vehicleNumber: q.vehicleNumber,
    });
  });

  // Sort unified alerts by timestamp descending
  const sortedAlerts = unifiedAlerts.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Search and filter logic
  const filteredAlerts = sortedAlerts.filter((item) => {
    if (filter !== "all" && item.category !== filter) return false;
    if (!searchQuery) return true;
    const q_ = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q_) ||
      item.subtitle.toLowerCase().includes(q_) ||
      (item.message && item.message.toLowerCase().includes(q_)) ||
      (item.qrId && item.qrId.toLowerCase().includes(q_))
    );
  });

  const countEmergency = unifiedAlerts.filter((a) => a.category === "emergency").length;
  const countActivation = unifiedAlerts.filter((a) => a.category === "activation").length;
  const countScan = unifiedAlerts.filter((a) => a.category === "scan").length;

  const toggleResolveReport = (reportId: string) => {
    setReports((prev) =>
      prev.map((r) =>
        `emergency-${r.id}` === reportId ? { ...r, status: r.status === "resolved" ? "unread" : "resolved" } : r
      )
    );
    setToast("Alert status updated");
    setTimeout(() => setToast(null), 1500);
  };

  return (
    <div className="px-8 pt-7 pb-10 space-y-6 text-gray-900">
      {/* Alert Stats Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border flex items-center gap-3.5 shadow-xs" style={{ borderColor: "#f0f0f0" }}>
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold flex-shrink-0">
            <AlertTriangle size={18} />
          </div>
          <div>
            <p className="text-xl font-black text-gray-900">{countEmergency}</p>
            <p className="text-xs text-gray-600 font-semibold">Emergency Reports</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border flex items-center gap-3.5 shadow-xs" style={{ borderColor: "#f0f0f0" }}>
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold flex-shrink-0">
            <ShieldCheck size={18} />
          </div>
          <div>
            <p className="text-xl font-black text-gray-900">{countActivation}</p>
            <p className="text-xs text-gray-600 font-semibold">Activation Dispatches</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border flex items-center gap-3.5 shadow-xs" style={{ borderColor: "#f0f0f0" }}>
          <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold flex-shrink-0">
            <ScanLine size={18} />
          </div>
          <div>
            <p className="text-xl font-black text-gray-900">{countScan}</p>
            <p className="text-xs text-gray-600 font-semibold">Scan Activity Logs</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border flex items-center gap-3.5 shadow-xs" style={{ borderColor: "#f0f0f0" }}>
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold flex-shrink-0">
            <Bell size={18} />
          </div>
          <div>
            <p className="text-xl font-black text-gray-900">{unifiedAlerts.length}</p>
            <p className="text-xs text-gray-600 font-semibold">Total System Alerts</p>
          </div>
        </div>
      </div>

      {/* Main Alerts Feed Card */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#f0f0f0" }}>
        {/* Filter Tabs Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-wrap gap-3" style={{ borderColor: "#f7f7f7" }}>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">System Alerts &amp; Notifications Feed</h3>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">All emergency reports, activation events, and scan logs</p>
          </div>

          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            {[
              { id: "all", label: "All Alerts", count: unifiedAlerts.length },
              { id: "emergency", label: "Emergency", count: countEmergency },
              { id: "activation", label: "Activations", count: countActivation },
              { id: "scan", label: "Scan Activity", count: countScan },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setFilter(t.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filter === t.id
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {t.label} <span className="text-[10px] opacity-75 font-mono">({t.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Alerts List */}
        {filteredAlerts.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Bell size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-bold text-gray-700">No alerts found matching your criteria.</p>
            {searchQuery && <p className="text-xs text-gray-500 mt-1 font-medium">Try clearing your search query.</p>}
          </div>
        ) : (
          <div className="divide-y max-h-[640px] overflow-y-auto" style={{ divideColor: "#f7f7f7" }}>
            {filteredAlerts.map((item) => {
              const isEmergency = item.category === "emergency";
              const isActivation = item.category === "activation";

              return (
                <div
                  key={item.id}
                  className={`p-5 flex items-start gap-4 transition-all hover:bg-gray-50/80 ${
                    item.status === "unread" ? "bg-red-50/20" : ""
                  }`}
                >
                  {/* Category Icon Badge */}
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 font-bold ${
                      isEmergency
                        ? "bg-red-100 text-red-600 border border-red-200"
                        : isActivation
                        ? "bg-amber-100 text-amber-800 border border-amber-200"
                        : "bg-teal-100 text-teal-800 border border-teal-200"
                    }`}
                  >
                    {isEmergency ? (
                      <AlertTriangle size={18} />
                    ) : isActivation ? (
                      <ShieldCheck size={18} />
                    ) : (
                      <ScanLine size={18} />
                    )}
                  </div>

                  {/* Alert Content */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-extrabold text-gray-900">{item.title}</span>
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                            isEmergency
                              ? "bg-red-100 text-red-800"
                              : isActivation
                              ? "bg-amber-100 text-amber-900"
                              : "bg-teal-100 text-teal-800"
                          }`}
                        >
                          {item.category}
                        </span>
                        {item.qrId && (
                          <span className="font-mono text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            {item.qrId}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-semibold text-gray-500 whitespace-nowrap flex items-center gap-1">
                        <Clock size={11} /> {fmtDateTime(item.timestamp)}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-gray-700">{item.subtitle}</p>

                    {/* Detailed Message if present */}
                    {item.message && (
                      <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-800 font-medium space-y-1">
                        <p className="font-bold text-gray-900">Message from reporter:</p>
                        <p className="leading-relaxed text-gray-700">"{item.message}"</p>
                        {item.location && (
                          <p className="text-[11px] text-gray-500 font-semibold flex items-center gap-1 mt-1">
                            <MapPin size={11} className="text-red-500" /> Location: {item.location}
                          </p>
                        )}
                      </div>
                    )}

                    {item.details && (
                      <p className="text-[11px] font-medium text-gray-500">{item.details}</p>
                    )}

                    {/* Action Bar */}
                    <div className="flex items-center gap-3 pt-1">
                      {item.reporterPhone && (
                        <a
                          href={`tel:${item.reporterPhone}`}
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors"
                        >
                          <Phone size={11} /> Call {item.reporterPhone}
                        </a>
                      )}
                      {isEmergency && (
                        <button
                          onClick={() => toggleResolveReport(item.id)}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                            item.status === "resolved"
                              ? "bg-gray-100 text-gray-600 border-gray-200"
                              : "bg-red-600 text-white border-red-600 hover:bg-red-700"
                          }`}
                        >
                          {item.status === "resolved" ? "Mark Unresolved" : "Resolve Emergency"}
                        </button>
                      )}
                      {item.qrId && (
                        <CopyLinkButton qrId={item.qrId} compact />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Users Page ─────────────────────────────────────────────────────────── */

function UsersPage({
  users, setUsers, setToast,
}: {
  users: TeamMember[]; setUsers: React.Dispatch<React.SetStateAction<TeamMember[]>>;
  setToast: (msg: string | null) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Operator");

  function addUser() {
    if (!name || !email) { setToast("Enter a name and email"); setTimeout(() => setToast(null), 2000); return; }
    setUsers((prev) => [...prev, { id: Date.now(), name, email, role, status: "invited" }]);
    setName(""); setEmail("");
    setToast("Invite sent");
    setTimeout(() => setToast(null), 2000);
  }

  const inputCls = "w-full px-3.5 py-2.5 text-sm rounded-xl border bg-gray-50 outline-none focus:bg-white focus:border-gray-400 transition-all font-semibold text-gray-900";

  return (
    <div className="px-8 pt-7 pb-10 space-y-6 text-gray-900">
      <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "#f0f0f0" }}>
        <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
          <UserPlus size={15} style={{ color: "var(--accent)" }} /> Invite Team Member
        </h3>
        <div className="grid grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-extrabold text-gray-500 mb-1.5 uppercase tracking-wider">Full Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className={inputCls} style={{ borderColor: "#e2e8f0" }} />
          </div>
          <div>
            <label className="block text-[10px] font-extrabold text-gray-500 mb-1.5 uppercase tracking-wider">Email Address</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@company.com" className={inputCls} style={{ borderColor: "#e2e8f0" }} />
          </div>
          <div>
            <label className="block text-[10px] font-extrabold text-gray-500 mb-1.5 uppercase tracking-wider">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className={inputCls} style={{ borderColor: "#e2e8f0" }}>
              <option>Admin</option><option>Manager</option><option>Operator</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={addUser} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-95 cursor-pointer shadow-sm" style={{ background: "var(--accent)" }}>
              <Plus size={14} /> Invite
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#f0f0f0" }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: "#f7f7f7" }}>
          <h3 className="font-bold text-gray-900 text-sm">Team Members <span className="text-gray-500 font-normal">· {users.length}</span></h3>
        </div>
        {users.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-semibold text-gray-700">No team members yet.</p>
            <p className="text-xs text-gray-500 mt-1 font-medium">Invite someone above to grant them access.</p>
          </div>
        ) : (
          <table className="w-full text-sm text-gray-900">
            <thead>
              <tr className="text-left text-[11px] text-gray-500 font-bold uppercase tracking-wider border-b" style={{ borderColor: "#f7f7f7" }}>
                <th className="px-6 py-3">Name</th>
                <th className="px-2 py-3">Email</th>
                <th className="px-2 py-3">Role</th>
                <th className="px-2 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors" style={{ borderColor: "#f7f7f7" }}>
                  <td className="px-6 py-3 flex items-center gap-2.5">
                    <img src={avatarUrl(u.name)} alt={u.name} className="w-7 h-7 rounded-full bg-gray-100" />
                    <span className="text-xs font-bold text-gray-900">{u.name}</span>
                  </td>
                  <td className="px-2 py-3 text-xs text-gray-600 font-medium">{u.email}</td>
                  <td className="px-2 py-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-800">{u.role}</span>
                  </td>
                  <td className="px-2 py-3"><StatusPill status={u.status === "active" ? "active" : "inactive"} /></td>
                  <td className="px-6 py-3 text-right">
                    <button onClick={() => { setUsers((prev) => prev.filter((x) => x.id !== u.id)); setToast("Member removed"); setTimeout(() => setToast(null), 1500); }} className="w-7 h-7 rounded-lg hover:bg-red-50 hover:text-red-500 flex items-center justify-center text-gray-400 transition-all cursor-pointer ml-auto">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ─── Sticker Editor ─────────────────────────────────────────────────────── */

function StickerEditor({
  stickerPos, setStickerPos, templates, setTemplates, setToast,
}: {
  stickerPos: StickerPos; setStickerPos: (p: StickerPos) => void;
  templates: Template[]; setTemplates: React.Dispatch<React.SetStateAction<Template[]>>;
  setToast: (msg: string | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState<"se" | "sw" | "ne" | "nw" | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const startPos = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const [showGrid, setShowGrid] = useState(false);
  const [lockAspect, setLockAspect] = useState(true);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [tplName, setTplName] = useState("");
  const [tplFg, setTplFg] = useState("EAB308");
  const [tplBg, setTplBg] = useState("FFFFFF");
  const MIN_SIZE = 16;
  const MAX_SIZE = 300;

  function clamp(val: number, min: number, max: number) { return Math.max(min, Math.min(max, val)); }

  const handleDragDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragging(true);
    dragOffset.current = { x: e.clientX, y: e.clientY };
    startPos.current = { x: stickerPos.x, y: stickerPos.y, w: stickerPos.w, h: stickerPos.h };
  }, [stickerPos]);

  const handleResizeDown = useCallback((dir: "se" | "sw" | "ne" | "nw") => (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setResizing(dir);
    dragOffset.current = { x: e.clientX, y: e.clientY };
    startPos.current = { x: stickerPos.x, y: stickerPos.y, w: stickerPos.w, h: stickerPos.h };
  }, [stickerPos]);

  useEffect(() => {
    if (!dragging && !resizing) return;
    const handleMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const dx = e.clientX - dragOffset.current.x;
      const dy = e.clientY - dragOffset.current.y;
      if (dragging) {
        setStickerPos({ ...stickerPos, x: Math.round(clamp(startPos.current.x + dx, 0, rect.width - stickerPos.w)), y: Math.round(clamp(startPos.current.y + dy, 0, rect.height - stickerPos.h)) });
      }
      if (resizing) {
        const s = startPos.current;
        let nw = s.w, nh = s.h, nx = s.x, ny = s.y;
        if (resizing === "se") { nw = clamp(s.w + dx, MIN_SIZE, MAX_SIZE); nh = lockAspect ? nw : clamp(s.h + dy, MIN_SIZE, MAX_SIZE); }
        else if (resizing === "sw") { nw = clamp(s.w - dx, MIN_SIZE, MAX_SIZE); nh = lockAspect ? nw : clamp(s.h + dy, MIN_SIZE, MAX_SIZE); nx = s.x + s.w - nw; }
        else if (resizing === "ne") { nw = clamp(s.w + dx, MIN_SIZE, MAX_SIZE); nh = lockAspect ? nw : clamp(s.h - dy, MIN_SIZE, MAX_SIZE); ny = s.y + s.h - nh; }
        else if (resizing === "nw") { nw = clamp(s.w - dx, MIN_SIZE, MAX_SIZE); nh = lockAspect ? nw : clamp(s.h - dy, MIN_SIZE, MAX_SIZE); nx = s.x + s.w - nw; ny = s.y + s.h - nh; }
        nx = clamp(nx, 0, rect.width - nw); ny = clamp(ny, 0, rect.height - nh);
        setStickerPos({ x: Math.round(nx), y: Math.round(ny), w: Math.round(nw), h: Math.round(nh) });
      }
    };
    const handleUp = () => { setDragging(false); setResizing(null); };
    window.addEventListener("mousemove", handleMove); window.addEventListener("mouseup", handleUp);
    return () => { window.removeEventListener("mousemove", handleMove); window.removeEventListener("mouseup", handleUp); };
  }, [dragging, resizing, stickerPos, setStickerPos, lockAspect]);

  function handleSave() {
    if (saveState !== "idle") return;
    if (!tplName.trim()) { setToast("Enter a template name first"); setTimeout(() => setToast(null), 2000); return; }
    setSaveState("saving");
    setTimeout(() => {
      const newTpl: Template = {
        id: Date.now(),
        name: tplName.trim(),
        fg: tplFg,
        bg: tplBg,
        logo: null,
        stickerPos: { ...stickerPos },
        isPublicDefault: templates.length === 0,
      };
      setTemplates((prev) => [...prev, newTpl]);
      saveTemplateToDb({ name: newTpl.name, fgColor: newTpl.fg, bgColor: newTpl.bg, stickerPos, isDefault: newTpl.isPublicDefault });
      setTplName("");
      setSaveState("saved");
      setToast(`"${newTpl.name}" template saved`);
      setTimeout(() => setSaveState("idle"), 1800);
      setTimeout(() => setToast(null), 2500);
    }, 600);
  }

  const handleStyle = (dir: string): React.CSSProperties => ({
    position: "absolute", width: 8, height: 8, borderRadius: 2,
    background: "white", border: "2px solid var(--accent)", zIndex: 10,
    cursor: { se: "nwse-resize", sw: "nesw-resize", ne: "nesw-resize", nw: "nwse-resize" }[dir] || "pointer",
    ...(dir === "se" ? { right: -4, bottom: -4 } : {}),
    ...(dir === "sw" ? { left: -4, bottom: -4 } : {}),
    ...(dir === "ne" ? { right: -4, top: -4 } : {}),
    ...(dir === "nw" ? { left: -4, top: -4 } : {}),
  });

  return (
    <div className="bg-white rounded-2xl border overflow-hidden text-gray-900" style={{ borderColor: "#f0f0f0" }}>
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#f7f7f7" }}>
        <div className="flex items-center gap-2">
          <FileImage size={14} className="text-gray-500" />
          <h3 className="font-bold text-gray-900 text-sm">Sticker QR Placement</h3>
        </div>
        <div className="flex items-center gap-1.5">
          {[["Grid", showGrid, () => setShowGrid(!showGrid)], [lockAspect ? "1:1" : "Free", lockAspect, () => setLockAspect(!lockAspect)]].map(([label, on, fn]) => (
            <button
              key={label as string}
              onClick={fn as () => void}
              className="text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer"
              style={on ? { background: "var(--accent)", color: "#fff" } : { background: "#f3f4f6", color: "#475569" }}
            >
              {label as string}
            </button>
          ))}
          <div className="w-px h-4 bg-gray-200 mx-1" />
          <button
            onClick={handleSave}
            disabled={saveState !== "idle"}
            className="flex items-center gap-1.5 text-[10px] font-bold text-white rounded-lg px-3 py-1.5 transition-all disabled:cursor-default cursor-pointer shadow-sm"
            style={{
              background: saveState === "saved" ? "#0f766e" : "var(--accent)",
              transform: saveState === "saved" ? "scale(1.05)" : "scale(1)",
              transition: "all 0.35s cubic-bezier(0.34,1.56,0.64,1)",
            }}
          >
            {saveState === "saving" ? <><span className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</> :
             saveState === "saved" ? <><Check size={10} /> Saved!</> :
             <><Check size={10} /> Save Template</>}
          </button>
        </div>
      </div>

      <div className="p-6 grid grid-cols-2 gap-6">
        <div>
          <div
            ref={containerRef}
            className="relative rounded-xl overflow-hidden border bg-gray-100"
            style={{ width: 320, height: 200, cursor: dragging ? "grabbing" : "default", borderColor: "#e2e8f0" }}
          >
            <img src={STICKER_SRC} alt="" className="w-full h-full object-contain select-none" draggable={false} />
            {showGrid && <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.05) 1px,transparent 1px)", backgroundSize: "20px 20px" }} />}
            <div
              className="absolute"
              style={{ left: stickerPos.x, top: stickerPos.y, width: stickerPos.w, height: stickerPos.h, cursor: dragging ? "grabbing" : "grab" }}
              onMouseDown={handleDragDown}
            >
              <div className="w-full h-full rounded border-2 border-dashed flex items-center justify-center" style={{ borderColor: dragging || resizing ? "var(--accent)" : "rgba(0,0,0,0.4)", background: "rgba(255,255,255,0.2)" }}>
                <img src={qrImageUrl("PREVIEW|Sticker|TEMPLATE", tplFg, tplBg, 200)} className="w-full h-full rounded pointer-events-none object-contain" draggable={false} alt="" />
              </div>
              {(["nw", "ne", "sw", "se"] as const).map((d) => (
                <div key={d} style={handleStyle(d)} onMouseDown={handleResizeDown(d)} />
              ))}
            </div>
            <div className="absolute bottom-1.5 right-2 bg-black/60 text-white text-[9px] font-mono px-1.5 py-0.5 rounded font-bold">
              {Math.round(stickerPos.w)}×{Math.round(stickerPos.h)}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(["x", "y", "w", "h"] as const).map((f) => (
              <div key={f}>
                <label className="text-[9px] font-extrabold text-gray-500 uppercase tracking-wider mb-1 block">{f === "w" ? "Width" : f === "h" ? "Height" : f.toUpperCase()}</label>
                <input
                  type="number"
                  value={Math.round(stickerPos[f])}
                  onChange={(e) => setStickerPos({ ...stickerPos, [f]: f === "w" ? Math.max(MIN_SIZE, Math.min(MAX_SIZE, Number(e.target.value))) : f === "h" ? Math.max(MIN_SIZE, Math.min(MAX_SIZE, Number(e.target.value))) : Number(e.target.value) })}
                  className="w-full px-2 py-1.5 text-[11px] font-mono font-bold bg-gray-50 border border-gray-200 text-gray-900 rounded-lg outline-none text-center focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>
            ))}
          </div>

          <div>
            <label className="text-[9px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5 block">Quick Resize</label>
            <div className="flex gap-1 flex-wrap">
              {[40, 60, 80, 100, 120, 140].map((s) => (
                <button key={s} onClick={() => setStickerPos({ ...stickerPos, w: s, h: s })}
                  className="text-[10px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer"
                  style={{ borderColor: stickerPos.w === s ? "var(--accent)" : "#e2e8f0", color: stickerPos.w === s ? "var(--accent)" : "#475569", background: stickerPos.w === s ? "rgba(234,179,8,0.08)" : "#fff" }}
                >{s}</button>
              ))}
            </div>
          </div>

          <div className="border-t pt-4 space-y-3" style={{ borderColor: "#f0f0f0" }}>
            <div>
              <label className="text-[9px] font-extrabold text-gray-500 uppercase tracking-wider mb-1 block">Template Name</label>
              <input value={tplName} onChange={(e) => setTplName(e.target.value)} placeholder="e.g. Orange Fleet" className="w-full px-3 py-2 text-sm font-semibold text-gray-900 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-1 focus:ring-[var(--accent)]" />
            </div>
            <div className="flex gap-3">
              <div>
                <label className="text-[9px] font-extrabold text-gray-500 uppercase tracking-wider mb-1 block">QR Color</label>
                <input type="color" value={`#${tplFg}`} onChange={(e) => setTplFg(e.target.value.replace("#", ""))} className="w-10 h-9 rounded-lg border border-gray-200 cursor-pointer" />
              </div>
              <div>
                <label className="text-[9px] font-extrabold text-gray-500 uppercase tracking-wider mb-1 block">BG Color</label>
                <input type="color" value={`#${tplBg}`} onChange={(e) => setTplBg(e.target.value.replace("#", ""))} className="w-10 h-9 rounded-lg border border-gray-200 cursor-pointer" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {templates.length > 0 && (
        <div className="border-t px-6 pb-6 pt-4 space-y-2" style={{ borderColor: "#f7f7f7" }}>
          <p className="text-[9px] font-extrabold text-gray-500 uppercase tracking-wider">Saved Templates</p>
          <div className="grid grid-cols-3 gap-2">
            {templates.map((t) => (
              <div key={t.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 group border border-transparent hover:border-gray-200 transition-all">
                <div className="w-5 h-5 rounded-md border border-gray-200 flex-shrink-0 flex items-center justify-center" style={{ background: `#${t.bg || "FFFFFF"}` }}>
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: `#${t.fg || "EAB308"}` }} />
                </div>
                <span className="text-xs font-bold text-gray-800 truncate flex-1">{t.name}</span>
                {t.isPublicDefault && <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full text-white flex-shrink-0" style={{ background: "var(--accent)" }}>DEFAULT</span>}
                <button onClick={() => { setTemplates((prev) => { const rest = prev.filter((x) => x.id !== t.id); if (rest.length === 0) return prev; if (t.isPublicDefault) rest[0].isPublicDefault = true; return rest; }); setToast("Template deleted"); setTimeout(() => setToast(null), 1500); }} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Customization Page ─────────────────────────────────────────────────── */

function CustomizationPage({
  templates, setTemplates, stickerPos, setStickerPos, setToast,
}: {
  templates: Template[]; setTemplates: React.Dispatch<React.SetStateAction<Template[]>>;
  stickerPos: StickerPos; setStickerPos: (p: StickerPos) => void;
  setToast: (msg: string | null) => void;
}) {
  return (
    <div className="px-8 pt-7 pb-10 space-y-6 text-gray-900">
      <StickerEditor stickerPos={stickerPos} setStickerPos={setStickerPos} templates={templates} setTemplates={setTemplates} setToast={setToast} />
    </div>
  );
}

/* ─── Restore Modal ──────────────────────────────────────────────────────── */

function RestoreStickerModal({
  isOpen, onClose, qrList, setQrList, templates, openQuickLook, setToast,
}: {
  isOpen: boolean; onClose: () => void;
  qrList: QrRecord[]; setQrList: React.Dispatch<React.SetStateAction<QrRecord[]>>;
  templates: Template[]; openQuickLook: (q: QrRecord) => void;
  setToast: (msg: string | null) => void;
}) {
  const [targetId, setTargetId] = useState("");
  const [vehicleName, setVehicleName] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");

  if (!isOpen) return null;

  const handleRestore = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = targetId.trim().toUpperCase();
    if (!cleanId) return;

    const existing = qrList.find((q) => q.id.toUpperCase() === cleanId || (q.clientId && q.clientId.toUpperCase() === cleanId));
    if (existing) {
      setToast(`Found active sticker ${existing.id}`); setTimeout(() => setToast(null), 2500);
      onClose(); openQuickLook(existing); return;
    }

    const defTpl = templates[0] || { name: "Default", fg: "EAB308", bg: "FFFFFF" };
    const rec: QrRecord = {
      id: cleanId,
      qrUrl: qrFullUrl(cleanId),
      clientId: cleanId.startsWith("CL") ? cleanId : `CL${cleanId.replace(/^QR/, "")}`,
      vehicleName: vehicleName.trim() || `Restored Sticker (${cleanId})`,
      vehicleNumber: vehicleNumber.trim() || `RE-${cleanId.slice(-4)}`,
      createdAt: new Date().toISOString(),
      scans: 0,
      status: "inactive",
      template: defTpl.name || "Default",
      category: "car",
      fg: defTpl.fg || "EAB308",
      bg: defTpl.bg || "FFFFFF",
    };

    setQrList((prev) => [rec, ...prev]);
    saveQrCodeToDb({ id: rec.id, clientId: rec.clientId, status: rec.status, templateName: rec.template, category: rec.category, fgColor: rec.fg, bgColor: rec.bg });
    setToast(`Sticker ${cleanId} restored!`);
    setTimeout(() => setToast(null), 3000);
    onClose(); openQuickLook(rec);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" style={{ background: "rgba(10,10,20,0.6)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 text-gray-900 border border-gray-100 relative" style={{ animation: "modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)" }} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-5 right-5 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 cursor-pointer">
          <X size={13} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(234,179,8,0.12)", color: "var(--accent)" }}>
            <RefreshCw size={18} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-base">Restore Sticker</h3>
            <p className="text-xs text-gray-500 font-semibold">Recreate a QR sticker using its ID</p>
          </div>
        </div>

        <form onSubmit={handleRestore} className="space-y-3">
          <div>
            <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">Sticker ID or QR Code *</label>
            <input type="text" required placeholder="e.g. QR-8A3F or CL-CXTF2" value={targetId} onChange={(e) => setTargetId(e.target.value)} className="w-full px-4 py-2.5 text-sm font-semibold text-gray-900 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-gray-400 uppercase font-mono transition-all" />
          </div>
          <div>
            <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">Vehicle / Item Name (optional)</label>
            <input type="text" placeholder="e.g. Tesla Model 3" value={vehicleName} onChange={(e) => setVehicleName(e.target.value)} className="w-full px-4 py-2.5 text-sm font-semibold text-gray-900 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-gray-400 transition-all" />
          </div>
          <div>
            <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">Vehicle Reg Number (optional)</label>
            <input type="text" placeholder="e.g. MH01AB1234" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} className="w-full px-4 py-2.5 text-sm font-semibold text-gray-900 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-gray-400 uppercase transition-all" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all cursor-pointer">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm" style={{ background: "var(--accent)" }}>
              <RefreshCw size={12} /> Restore
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Communication / Helpline Page ──────────────────────────────────────── */

function HelplineProvidersPage({ setToast }: { setToast: (msg: string | null) => void }) {
  const [providers, setProviders] = useLocalStorage<any[]>("namoqr-helplines", [
    { id: "prov-1", category: "Towing", label: "National Flatbed Towing 24x7", phone: "+91 98765 00001", active: true },
    { id: "prov-2", category: "Flat Tire", label: "Quick Puncture Repair Assist", phone: "+91 98765 00002", active: true },
    { id: "prov-3", category: "Battery", label: "Battery Jumpstart & Fuel Helpline", phone: "+91 98765 00003", active: true },
    { id: "prov-4", category: "Mechanic", label: "Emergency Mobile Mechanics", phone: "+91 98765 00004", active: true },
  ]);
  const [category, setCategory] = useState("Towing");
  const [label, setLabel] = useState("");
  const [phone, setPhone] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !phone.trim()) return;
    const p = { id: `prov-${Date.now()}`, category, label: label.trim(), phone: phone.trim(), active: true };
    setProviders([p, ...providers]);
    window.dispatchEvent(new Event("namoqr-helplines-updated"));
    setLabel(""); setPhone("");
    setToast("Helpline provider added"); setTimeout(() => setToast(null), 2000);
  };

  const inputCls = "w-full px-3.5 py-2.5 text-sm rounded-xl border bg-gray-50 outline-none focus:bg-white focus:border-gray-400 transition-all font-semibold text-gray-900";

  return (
    <div className="px-8 pt-7 pb-10 space-y-6 text-gray-900">
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border p-6 h-fit space-y-4" style={{ borderColor: "#f0f0f0" }}>
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <Plus size={14} style={{ color: "var(--accent)" }} /> Add Provider
          </h3>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls} style={{ borderColor: "#e2e8f0" }}>
                <option>Towing</option><option>Flat Tire</option><option>Battery</option><option>Mechanic</option><option>General</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">Provider Name *</label>
              <input type="text" required placeholder="e.g. 24x7 Flatbed Towing" value={label} onChange={(e) => setLabel(e.target.value)} className={inputCls} style={{ borderColor: "#e2e8f0" }} />
            </div>
            <div>
              <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">Phone Number *</label>
              <input type="tel" required placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} className={`${inputCls} font-mono`} style={{ borderColor: "#e2e8f0" }} />
            </div>
            <button type="submit" className="w-full py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] mt-1 cursor-pointer shadow-sm" style={{ background: "var(--accent)" }}>
              <Plus size={14} /> Save Provider
            </button>
          </form>
        </div>

        <div className="col-span-2 bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#f0f0f0" }}>
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#f7f7f7" }}>
            <h3 className="font-bold text-gray-900 text-sm">Configured Helplines <span className="text-gray-500 font-normal">· {providers.length}</span></h3>
            <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">Live on Scan Pages</span>
          </div>
          <div className="divide-y" style={{ divideColor: "#f7f7f7" }}>
            {providers.length === 0 ? (
              <p className="text-xs text-gray-500 font-medium text-center py-10">No helpline numbers added yet.</p>
            ) : (
              providers.map((p) => (
                <div key={p.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50/60 transition-colors group">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(234,179,8,0.12)", color: "var(--accent)" }}>
                    <PhoneCall size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-gray-900 truncate">{p.label}</p>
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md flex-shrink-0" style={{ background: "rgba(234,179,8,0.12)", color: "var(--accent)" }}>{p.category}</span>
                    </div>
                    <p className="font-mono text-xs font-bold text-gray-700 mt-0.5">{p.phone}</p>
                  </div>
                  <button
                    onClick={() => { const u = providers.map((x) => x.id === p.id ? { ...x, active: !x.active } : x); setProviders(u); window.dispatchEvent(new Event("namoqr-helplines-updated")); setToast("Status updated"); setTimeout(() => setToast(null), 1500); }}
                    className="text-[9px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex-shrink-0"
                    style={p.active ? { background: "rgba(15,118,110,0.1)", color: "#0f766e", borderColor: "rgba(15,118,110,0.2)" } : { background: "#f3f4f6", color: "#64748b", borderColor: "#e2e8f0" }}
                  >
                    {p.active ? "ACTIVE" : "INACTIVE"}
                  </button>
                  <button
                    onClick={() => { setProviders(providers.filter((x) => x.id !== p.id)); window.dispatchEvent(new Event("namoqr-helplines-updated")); setToast("Provider deleted"); setTimeout(() => setToast(null), 1500); }}
                    className="w-7 h-7 rounded-lg hover:bg-red-50 hover:text-red-500 flex items-center justify-center text-gray-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Root ───────────────────────────────────────────────────────────────── */

export default function QRFleetDashboard({ onBack }: { onBack: () => void }) {
  const { profile, signOut } = useAuth();
  const [page, setPage] = useState("overview");
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

  const admin = { name: profile?.fullName || "Admin", email: profile?.email || "" };

  // Reset search on page change
  useEffect(() => { setSearchQuery(""); }, [page]);

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
      style={{ "--accent": `#${accent}`, fontFamily: fontCss, background: "#F5F5F0" } as React.CSSProperties}
    >
      <Sidebar page={page} setPage={setPage} admin={admin} onBack={onBack} onSignOut={signOut} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
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
          {page === "communication" && <HelplineProvidersPage setToast={setToast} />}
          {page === "alerts" && (
            <AlertsPage
              qrList={qrList} setQrList={setQrList} templates={templates}
              setToast={setToast} searchQuery={searchQuery}
            />
          )}
          {page === "users" && <UsersPage users={users} setUsers={setUsers} setToast={setToast} />}
          {page === "customize" && (
            <CustomizationPage
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

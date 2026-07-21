import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  LayoutGrid,
  QrCode,
  Bell,
  Users,
  Palette,
  Search,
  ChevronRight,
  Plus,
  Upload,
  Download,
  Trash2,
  Settings,
  LogOut,
  X,
  Check,
  ScanLine,
  Car,
  RefreshCw,
  Sparkles,
  Eye,
  UserPlus,
  ImagePlus,
  Star,
  FileImage,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { BarChart, Bar, XAxis, ResponsiveContainer } from "recharts";

/* ---------------------------------------------------------------------- */
/*  Helpers                                                                 */
/* ---------------------------------------------------------------------- */

function qrImageUrl(data: string, fg: string, bg: string, size = 220) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&color=${fg}&bgcolor=${bg}&qzone=1`;
}

function avatarUrl(seed: string) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=eef2ff,fce7f3,dbeafe,fef3c7`;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtDateTime(d: string) {
  return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
function uid(prefix = "QR") {
  return `${prefix}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

const QR_DOMAIN = "https://oqr.linkspace-service.workers.dev";

function qrFullUrl(qrId: string) {
  return `${QR_DOMAIN}/${qrId}`;
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
      <div className="flex items-center gap-1">
        <button onClick={handleCopy} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400" title={copied ? "Copied!" : "Copy QR link"}>
          {copied ? <Check size={14} className="text-emerald-500" /> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>}
        </button>
        <button onClick={handleOpen} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400" title="Open scan page">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2 w-full">
      <button
        onClick={handleCopy}
        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
      >
        {copied ? <Check size={14} className="text-emerald-500" /> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>}
        {copied ? "Copied!" : "Copy Link"}
      </button>
      <button
        onClick={handleOpen}
        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
        Open Page
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  localStorage hook                                                       */
/* ---------------------------------------------------------------------- */

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
    } catch { /* quota exceeded — ignore */ }
  }, [key, val]);

  return [val, setVal];
}

/* ---------------------------------------------------------------------- */
/*  Constants                                                               */
/* ---------------------------------------------------------------------- */

const FONT_OPTIONS = [
  { id: "Plus Jakarta Sans", label: "Jakarta Sans", css: "'Plus Jakarta Sans', ui-sans-serif, system-ui" },
  { id: "Inter", label: "Inter", css: "'Inter', ui-sans-serif, system-ui" },
  { id: "JetBrains Mono", label: "JetBrains Mono", css: "'JetBrains Mono', ui-monospace, monospace" },
];

const PASTELS = [
  { bg: "#FEE8DB", fg: "#D9581F" },
  { bg: "#FCE7F3", fg: "#EC4899" },
  { bg: "#DBEAFE", fg: "#3B82F6" },
];

const NAV_ITEMS = [
  { id: "overview", label: "Dashboard", icon: LayoutGrid },
  { id: "qr", label: "QR Codes", icon: QrCode },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "users", label: "Manage Users", icon: Users },
  { id: "customize", label: "Customization", icon: Palette },
];

const PAGE_TITLES: Record<string, string> = {
  overview: "Dashboard",
  qr: "QR Codes",
  alerts: "Alerts",
  users: "Manage Users",
  customize: "Customization",
};

const STICKER_SRC = "/sticker-template.jpeg";

/* ---------------------------------------------------------------------- */
/*  Shared atoms                                                            */
/* ---------------------------------------------------------------------- */

function Pill({ tone = "gray", children }: { tone?: string; children: React.ReactNode }) {
  const tones: Record<string, string> = {
    gray: "bg-gray-100 text-gray-500",
    green: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-500",
    violet: "bg-orange-50 text-orange-600",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

function IconAvatar({ seed, size = 32, ring = false }: { seed: string; size?: number; ring?: boolean }) {
  return (
    <img
      src={avatarUrl(seed)}
      alt={seed}
      className="rounded-full flex-shrink-0 bg-gray-100"
      style={{ width: size, height: size, boxShadow: ring ? `0 0 0 2px white, 0 0 0 4px var(--accent)` : "none" }}
    />
  );
}

function IconTrash({ onClick, title = "Delete" }: { onClick: () => void; title?: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
    >
      <Trash2 size={15} />
    </button>
  );
}

function Toast({ toast }: { toast: string | null }) {
  if (!toast) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[60] bg-gray-900 text-white text-sm px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2">
      <Check size={16} />
      {toast}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Canvas composite: QR on sticker                                         */
/* ---------------------------------------------------------------------- */

const EDITOR_DISPLAY = { w: 320, h: 200 };

function StickerThumb({ qr, templates, size = 96 }: { qr: any; templates: any[]; size?: number }) {
  const tpl = templates.find((t: any) => t.name === qr.template) || templates[0];
  const sp = tpl?.stickerPos || { x: 110, y: 40, w: 100, h: 100 };
  const thumbH = Math.round(size * (EDITOR_DISPLAY.h / EDITOR_DISPLAY.w));
  const qrX = (sp.x / EDITOR_DISPLAY.w) * size;
  const qrY = (sp.y / EDITOR_DISPLAY.h) * thumbH;
  const qrW = (sp.w / EDITOR_DISPLAY.w) * size;
  const qrH = (sp.h / EDITOR_DISPLAY.h) * thumbH;
  const qrFg = qr?.fg || "D9581F";
  const qrBg = qr?.bg || "FFFFFF";

  return (
    <div style={{ width: size, height: thumbH, position: "relative", overflow: "hidden", borderRadius: 6, flexShrink: 0 }}>
      <img src={STICKER_SRC} style={{ width: "100%", height: "100%", objectFit: "fill" }} draggable={false} alt="" />
      <img
        src={qrImageUrl(qr.qrUrl || qrFullUrl(qr.id), qrFg, qrBg, 128)}
        style={{ position: "absolute", left: qrX, top: qrY, width: qrW, height: qrH, objectFit: "contain" }}
        draggable={false}
        alt="qr"
      />
    </div>
  );
}

async function compositeQrOnSticker(qrDataUrl: string, pos: { x: number; y: number; w: number; h: number }): Promise<Blob | null> {
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
      const sx = pos.x * scaleX;
      const sy = pos.y * scaleY;
      const sw = pos.w * scaleX;
      const sh = pos.h * scaleY;

      const qr = new Image();
      qr.crossOrigin = "anonymous";
      qr.onload = () => {
        ctx.drawImage(qr, sx, sy, sw, sh);
        canvas.toBlob((blob) => resolve(blob), "image/png");
      };
      qr.onerror = () => resolve(null);
      qr.src = qrDataUrl;
    };
    sticker.onerror = () => resolve(null);
    sticker.src = STICKER_SRC;
  });
}

/* ---------------------------------------------------------------------- */
/*  Sidebar                                                                  */
/* ---------------------------------------------------------------------- */

function Sidebar({ page, setPage, admin, onBack }: { page: string; setPage: (p: string) => void; admin: { name: string }; onBack: () => void }) {
  return (
    <aside className="w-64 flex-shrink-0 bg-white flex flex-col h-full px-5 py-6">
      <div className="flex items-center gap-2.5 px-1 mb-8">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0"
          style={{ backgroundColor: "var(--accent)" }}
        >
          <Sparkles size={17} />
        </div>
        <span className="font-bold text-gray-900 text-lg">NamoQR</span>
      </div>

      <p className="text-[11px] font-bold text-gray-300 tracking-widest px-1 mb-3">OVERVIEW</p>
      <nav className="space-y-1 mb-8">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = page === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors"
              style={{ color: active ? "#111827" : "#9CA3AF", fontWeight: active ? 700 : 500 }}
            >
              <Icon size={18} color={active ? "var(--accent)" : "#9CA3AF"} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="flex-1" />

      <div className="pt-4 mt-4 border-t border-gray-100 space-y-1">
        <p className="text-[11px] font-bold text-gray-300 tracking-widest px-1 mb-2">SETTINGS</p>
        <button
          onClick={() => setPage("customize")}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500"
        >
          <Settings size={18} /> Setting
        </button>
        <button
          onClick={onBack}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-orange-400"
        >
          <LogOut size={18} /> Back to Home
        </button>
      </div>
    </aside>
  );
}

/* ---------------------------------------------------------------------- */
/*  Top bar                                                                  */
/* ---------------------------------------------------------------------- */

function TopBar({ admin }: { admin: { name: string } }) {
  return (
    <div className="h-20 flex-shrink-0 flex items-center justify-between px-8">
      <div className="relative w-[420px] max-w-full">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
        <input
          placeholder="Search your QR codes..."
          className="pl-11 pr-4 py-3 w-full text-sm bg-white rounded-full outline-none shadow-sm border border-gray-100 focus:ring-2"
          style={{ "--tw-ring-color": "var(--accent)" } as React.CSSProperties}
        />
      </div>
      <div className="flex items-center gap-4">
        <button className="relative w-11 h-11 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400">
          <Bell size={17} />
          <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
        </button>
        <div className="w-px h-8 bg-gray-200" />
        <div className="flex items-center gap-2.5">
          <IconAvatar seed={admin.name} size={38} />
          <span className="font-semibold text-gray-800 text-sm pr-1">{admin.name}</span>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Overview page                                                           */
/* ---------------------------------------------------------------------- */

function StatPill({ color, icon: Icon, label, value }: { color: { bg: string; fg: string }; icon: React.FC<any>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 shadow-sm flex-1">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: color.bg, color: color.fg }}
      >
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{value}</p>
        <p className="text-sm font-semibold text-gray-800 truncate">{label}</p>
      </div>
    </div>
  );
}

function RecentCard({ q, onOpen, templates }: { q: any; onOpen: (q: any) => void; templates: any[]; [key: string]: any }) {
  return (
    <button onClick={() => onOpen(q)} className="text-left bg-white rounded-2xl shadow-sm overflow-hidden flex-shrink-0 w-[220px]">
      <div className="p-4 flex items-center justify-center" style={{ backgroundColor: "#FFF5EE" }}>
        <StickerThumb qr={q} templates={templates} size={120} />
      </div>
      <div className="p-4">
        <Pill tone={q.status === "active" ? "violet" : "red"}>{q.status === "active" ? "ACTIVE" : "EXPIRED"}</Pill>
        <p className="font-semibold text-gray-900 text-sm mt-2 truncate">{q.vehicleName}</p>
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: "#FEE8DB", color: "var(--accent)" }}>
            <Car size={12} />
          </div>
          <p className="text-xs text-gray-400 truncate">{q.clientId} · {fmtDate(q.createdAt)}</p>
        </div>
        <div className="mt-3">
          <CopyLinkButton qrId={q.id} compact />
        </div>
      </div>
    </button>
  );
}

function OverviewPage({ qrList, setQrList, templates, setPage, openQuickLook, setToast }: any) {
  function removeRecent(id: string) {
    setQrList((prev: any[]) => prev.filter((x: any) => x.id !== id));
    setToast("QR removed");
    setTimeout(() => setToast(null), 1500);
  }

  const totalScans = qrList.reduce((a: number, q: any) => a + q.scans, 0);
  const active = qrList.filter((q: any) => q.status === "active").length;
  const quotaPct = Math.min(100, Math.round((qrList.length / 5000) * 100));
  const chartData = [
    { name: "1-10", v: Math.max(4, Math.round(qrList.length * 0.3)) },
    { name: "11-20", v: Math.max(6, Math.round(qrList.length * 0.45)) },
    { name: "21-30", v: Math.max(3, Math.round(qrList.length * 0.25)) },
  ];

  return (
    <div className="px-8 pt-8 pb-8 flex gap-6">
      <div className="flex-1 min-w-0 space-y-6">
        <div
          className="relative overflow-hidden rounded-3xl p-8 text-white"
          style={{ background: "linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 60%, #1e1b4b))" }}
        >
          <Sparkles className="absolute -right-4 top-6 opacity-20" size={140} />
          <h1 className="text-3xl font-bold mt-2 max-w-md leading-tight">
            Generate QR Codes for Your Products
          </h1>
          <p className="text-white/70 mt-2 text-sm max-w-sm">Create, manage and track QR codes for every sticker you ship.</p>
          <button
            onClick={() => setPage("qr")}
            className="mt-6 flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-full text-sm font-semibold"
          >
            Generate QR
            <span className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center">
              <ChevronRight size={13} />
            </span>
          </button>
        </div>

        {qrList.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900">Recently Generated</h3>
              <button onClick={() => setPage("qr")} className="text-sm font-semibold" style={{ color: "var(--accent)" }}>See all</button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {qrList.slice(0, 6).map((q: any) => (
                <RecentCard key={q.id} q={q} onOpen={openQuickLook} templates={templates} />
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h3 className="font-bold text-gray-900">Latest Activity</h3>
            <button onClick={() => setPage("alerts")} className="text-sm font-semibold" style={{ color: "var(--accent)" }}>See all</button>
          </div>
          {qrList.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-gray-400">
              No QR codes yet. Generate your first one to get started.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-50">
                  <th className="px-6 py-2.5 font-medium">Client</th>
                  <th className="px-2 py-2.5 font-medium">Vehicle</th>
                  <th className="px-2 py-2.5 font-medium">Status</th>
                  <th className="px-6 py-2.5 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {qrList.slice(0, 5).map((q: any) => (
                  <tr key={q.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-6 py-3 flex items-center gap-2.5">
                      <IconAvatar seed={q.clientId} size={28} />
                      <span className="font-semibold text-gray-800">{q.clientId}</span>
                    </td>
                    <td className="px-2 py-3 text-gray-500">{q.vehicleName}</td>
                    <td className="px-2 py-3">
                      <Pill tone={q.status === "active" ? "violet" : "red"}>{q.status}</Pill>
                    </td>
                    <td className="px-6 py-3 text-right flex items-center justify-end gap-1">
                      <button onClick={() => openQuickLook(q)} className="w-8 h-8 rounded-full hover:bg-gray-50 flex items-center justify-center text-gray-400">
                        <Eye size={15} />
                      </button>
                      <IconTrash onClick={() => removeRecent(q.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  QR Codes page                                                           */
/* ---------------------------------------------------------------------- */

function QrCodesPage({ qrList, setQrList, templates, setToast, openQuickLook }: any) {
  const [vehicleName, setVehicleName] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [templateId, setTemplateId] = useState(templates.find((t: any) => t.isPublicDefault)?.id?.toString() || templates[0]?.id?.toString() || "");
  const [tab, setTab] = useState("single");
  const [bulkCount, setBulkCount] = useState(25);

  useEffect(() => {
    if (templates.length > 0 && !templates.find((t: any) => t.id.toString() === templateId)) {
      const def = templates.find((t: any) => t.isPublicDefault) || templates[0];
      setTemplateId(def.id.toString());
    }
  }, [templates]);

  const activeTemplate = templates.find((t: any) => t.id.toString() === templateId) || templates[0];

  function handleGenerateSingle() {
    if (!vehicleName || !vehicleNumber) {
      setToast("Fill in vehicle name and vehicle number");
      setTimeout(() => setToast(null), 2500);
      return;
    }
    const qrId = uid();
    const rec = {
      id: qrId,
      qrUrl: `${QR_DOMAIN}/${qrId}`,
      clientId: uid("CL"),
      vehicleName,
      vehicleNumber,
      createdAt: new Date().toISOString(),
      scans: 0,
      status: "inactive",
      template: activeTemplate?.name || "Default",
      fg: activeTemplate?.fg || "D9581F",
      bg: activeTemplate?.bg || "FFFFFF",
    };
    setQrList((prev: any[]) => [rec, ...prev]);
    openQuickLook(rec);
    setVehicleName("");
    setVehicleNumber("");
    setToast("QR code generated");
    setTimeout(() => setToast(null), 2000);
  }

  function handleGenerateBulk() {
    const count = Math.max(1, Math.min(1000, Number(bulkCount) || 0));
    const batch = Array.from({ length: count }).map((_, i) => {
      const bulkId = uid();
      return {
        id: bulkId,
        qrUrl: `${QR_DOMAIN}/${bulkId}`,
        clientId: uid("CL"),
        vehicleName: `Item ${i + 1}`,
        vehicleNumber: `XX00XX${(1000 + i).toString().slice(-4)}`,
        createdAt: new Date().toISOString(),
        scans: 0,
        status: "inactive",
        template: activeTemplate?.name || "Default",
        fg: activeTemplate?.fg || "D9581F",
        bg: activeTemplate?.bg || "FFFFFF",
      };
    });
    setQrList((prev: any[]) => [...batch, ...prev]);
    setToast(`${count} QR codes generated in bulk`);
    setTimeout(() => setToast(null), 2500);
  }

  function downloadCsv() {
    const rows = [
      ["QR ID", "ID", "Vehicle Name", "Vehicle Number", "Template", "Created"],
      ...qrList.map((q: any) => [q.id, q.clientId, q.vehicleName, q.vehicleNumber, q.template, fmtDate(q.createdAt)]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "qr-codes-export.csv";
    a.click();
  }

  function deleteQr(id: string) {
    setQrList((prev: any[]) => prev.filter((x: any) => x.id !== id));
    setToast("QR code deleted");
    setTimeout(() => setToast(null), 1500);
  }

  function deleteAllQr() {
    if (qrList.length === 0) return;
    setQrList([]);
    setToast("All QR codes cleared");
    setTimeout(() => setToast(null), 1500);
  }

  return (
    <div className="px-8 pt-8 pb-8 space-y-6">
      <div className="bg-white rounded-2xl shadow-sm">
        <div className="flex items-center gap-1 px-6 pt-5">
          {[
            { id: "single", label: "Generate single" },
            { id: "bulk", label: "Bulk generate" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-4 py-2 text-sm font-semibold rounded-full mr-2 mb-4"
              style={
                tab === t.id
                  ? { backgroundColor: "var(--accent)", color: "white" }
                  : { backgroundColor: "#F9FAFB", color: "#9CA3AF" }
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "single" ? (
          <div className="p-6 pt-0 grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Vehicle name</label>
              <input
                value={vehicleName}
                onChange={(e) => setVehicleName(e.target.value)}
                placeholder="Toyota Innova"
                className="w-full px-4 py-2.5 text-sm bg-gray-50 rounded-xl outline-none focus:ring-2"
                style={{ "--tw-ring-color": "var(--accent)" } as React.CSSProperties}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Vehicle number</label>
              <input
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                placeholder="GJ01AB1234"
                className="w-full px-4 py-2.5 text-sm bg-gray-50 rounded-xl outline-none focus:ring-2"
                style={{ "--tw-ring-color": "var(--accent)" } as React.CSSProperties}
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-400 mb-1.5 block">QR theme template</label>
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-gray-50 rounded-xl outline-none"
              >
                {templates.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.isPublicDefault ? "(default)" : ""}
                  </option>
                ))}
                {templates.length === 0 && <option value="">No templates — create one in Customization</option>}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleGenerateSingle}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold"
                style={{ backgroundColor: "var(--accent)" }}
              >
                <Plus size={15} /> Generate QR
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 pt-0 grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Quantity (max 1000)</label>
              <input
                type="number"
                min={1}
                max={1000}
                value={bulkCount}
                onChange={(e) => setBulkCount(Math.min(1000, Number(e.target.value)))}
                className="w-full px-4 py-2.5 text-sm bg-gray-50 rounded-xl outline-none focus:ring-2"
                style={{ "--tw-ring-color": "var(--accent)" } as React.CSSProperties}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 mb-1.5 block">QR theme template</label>
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-gray-50 rounded-xl outline-none"
              >
                {templates.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
                {templates.length === 0 && <option value="">No templates</option>}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleGenerateBulk}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold"
                style={{ backgroundColor: "var(--accent)" }}
              >
                <RefreshCw size={15} /> Generate {bulkCount}
              </button>
            </div>
            <p className="col-span-3 text-xs text-gray-400">
              Vehicle name &amp; number are auto-assigned for bulk batches. Export the full list as CSV below once generated.
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <h3 className="font-bold text-gray-900">All QR codes · {qrList.length}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadCsv}
              disabled={qrList.length === 0}
              className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 bg-gray-50 px-3.5 py-2 rounded-full disabled:opacity-40"
            >
              <Download size={14} /> Export CSV
            </button>
            <button
              onClick={deleteAllQr}
              disabled={qrList.length === 0}
              className="flex items-center gap-1.5 text-sm font-semibold text-red-500 bg-red-50 px-3.5 py-2 rounded-full disabled:opacity-40"
            >
              <Trash2 size={14} /> Clear all
            </button>
          </div>
        </div>
        {qrList.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">No QR codes yet — generate one above.</div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-y border-gray-50">
                  <th className="px-6 py-2.5 font-medium">QR</th>
                  <th className="px-2 py-2.5 font-medium">ID</th>
                  <th className="px-2 py-2.5 font-medium">Vehicle</th>
                  <th className="px-2 py-2.5 font-medium">Number</th>
                  <th className="px-2 py-2.5 font-medium">Created</th>
                  <th className="px-2 py-2.5 font-medium">Scans</th>
                  <th className="px-2 py-2.5 font-medium">Status</th>
                  <th className="px-6 py-2.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {qrList.slice(0, 60).map((q: any) => (
                  <tr key={q.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
                    <td className="px-6 py-2.5">
                      <button onClick={() => openQuickLook(q)}>
                        <StickerThumb qr={q} templates={templates} size={36} />
                      </button>
                    </td>
                    <td className="px-2 py-2.5 font-semibold text-gray-800">{q.clientId}</td>
                    <td className="px-2 py-2.5 text-gray-500">{q.vehicleName}</td>
                    <td className="px-2 py-2.5 text-gray-500">{q.vehicleNumber}</td>
                    <td className="px-2 py-2.5 text-gray-400">{fmtDate(q.createdAt)}</td>
                    <td className="px-2 py-2.5 text-gray-500">{q.scans}</td>
                    <td className="px-2 py-2.5">
                      <Pill tone={q.status === "active" ? "violet" : "red"}>{q.status}</Pill>
                    </td>
                    <td className="px-6 py-2.5 text-right flex items-center justify-end gap-1">
                      <CopyLinkButton qrId={q.id} compact />
                      <button onClick={() => openQuickLook(q)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400" title="Quick look">
                        <Eye size={15} />
                      </button>
                      <IconTrash onClick={() => deleteQr(q.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {qrList.length > 60 && (
              <div className="px-6 py-3 text-xs text-gray-400">Showing latest 60 of {qrList.length} — export CSV for the full batch.</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Quick Look centered popup                                               */
/* ---------------------------------------------------------------------- */

function QuickLookModal({ qr, onClose, stickerPos, templates }: { qr: any; onClose: () => void; stickerPos: { x: number; y: number; w: number; h: number }; templates: any[] }) {
  if (!qr) return null;

  const activeTpl = templates.find((t: any) => t.name === qr.template);
  const dlPos = activeTpl?.stickerPos || stickerPos;

  async function handleDownload() {
    const qrDataUrl = await new Promise<string>((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        c.getContext("2d")!.drawImage(img, 0, 0);
        resolve(c.toDataURL("image/png"));
      };
      img.src = qrImageUrl(qr.qrUrl || qrFullUrl(qr.id), qr?.fg || "D9581F", qr?.bg || "FFFFFF", 512);
    });
    const blob = await compositeQrOnSticker(qrDataUrl, dlPos);
    if (blob) {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${qr.id}-sticker.png`;
      a.click();
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ backgroundColor: "rgba(17,17,27,0.45)" }} onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5">
          <span className="text-xs font-bold text-gray-300 tracking-widest">QUICK LOOK</span>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
            <X size={15} />
          </button>
        </div>

        <div className="flex flex-col items-center px-6 pt-4 pb-5">
          <div className="p-3 rounded-2xl" style={{ backgroundColor: "#FFF5EE" }}>
            <StickerThumb qr={qr} templates={templates} size={200} />
          </div>
          <p className="font-bold text-gray-900 text-lg mt-4">{qr.vehicleName}</p>
          <p className="text-sm text-gray-400">{qr.vehicleNumber}</p>

          <div className="flex flex-wrap gap-2 justify-center mt-3">
            <Pill tone="violet">{qr.clientId}</Pill>
            <Pill tone="gray">{qr.template}</Pill>
            <Pill tone={qr.status === "active" ? "green" : "red"}>{qr.status}</Pill>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full mt-5 text-sm">
            <div className="bg-gray-50 rounded-xl px-3 py-2.5 text-center">
              <p className="text-gray-400 text-xs">Scans</p>
              <p className="font-bold text-gray-900">{qr.scans}</p>
            </div>
            <div className="bg-gray-50 rounded-xl px-3 py-2.5 text-center">
              <p className="text-gray-400 text-xs">Created</p>
              <p className="font-bold text-gray-900">{fmtDate(qr.createdAt)}</p>
            </div>
          </div>

          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-white text-sm font-semibold mt-5"
            style={{ backgroundColor: "var(--accent)" }}
          >
            <Download size={14} /> Download
          </button>

          <CopyLinkButton qrId={qr.id} />
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Alerts page                                                             */
/* ---------------------------------------------------------------------- */

function AlertsPage({ qrList, setQrList, templates, setToast }: any) {
  const sorted = [...qrList].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  function removeAlert(id: string) {
    setQrList((prev: any[]) => prev.filter((x: any) => x.id !== id));
    setToast("Alert deleted");
    setTimeout(() => setToast(null), 1500);
  }

  return (
    <div className="px-8 pt-8 pb-8 space-y-6">
      <div className="bg-white rounded-2xl shadow-sm">
        <div className="px-6 py-4">
          <h3 className="font-bold text-gray-900">QR Activity &amp; Statistics</h3>
          <p className="text-xs text-gray-400 mt-0.5">Every generated code, most recent first</p>
        </div>
        {sorted.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">No activity yet.</div>
        ) : (
          <div className="max-h-[560px] overflow-y-auto">
            {sorted.map((q: any) => (
              <div key={q.id} className="flex items-center gap-4 px-6 py-3.5 border-t border-gray-50 group">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: q.status === "active" ? "#10B981" : "#EF4444" }} />
                <StickerThumb qr={q} templates={templates} size={36} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold text-gray-900">{q.vehicleName}</span> ({q.vehicleNumber}) generated for{" "}
                    <span className="font-semibold text-gray-900">{q.clientId}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{fmtDateTime(q.createdAt)} · template: {q.template}</p>
                </div>
                <CopyLinkButton qrId={q.id} compact />
                <Pill tone="violet"><ScanLine size={11} /> {q.scans}</Pill>
                <Pill tone={q.status === "active" ? "green" : "red"}>{q.status}</Pill>
                <IconTrash onClick={() => removeAlert(q.id)} title="Delete alert" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Manage users page                                                       */
/* ---------------------------------------------------------------------- */

function UsersPage({ users, setUsers, setToast }: any) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Operator");

  function addUser() {
    if (!name || !email) {
      setToast("Enter a name and email");
      setTimeout(() => setToast(null), 2000);
      return;
    }
    setUsers((prev: any[]) => [...prev, { id: Date.now(), name, email, role, status: "invited" }]);
    setName("");
    setEmail("");
    setToast("Invite sent");
    setTimeout(() => setToast(null), 2000);
  }

  function removeUser(id: number) {
    setUsers((prev: any[]) => prev.filter((x: any) => x.id !== id));
    setToast("Team member removed");
    setTimeout(() => setToast(null), 1500);
  }

  return (
    <div className="px-8 pt-8 pb-8 space-y-6">
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <UserPlus size={16} /> Invite a team member
        </h3>
        <div className="grid grid-cols-4 gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="px-4 py-2.5 text-sm bg-gray-50 rounded-xl outline-none focus:ring-2"
            style={{ "--tw-ring-color": "var(--accent)" } as React.CSSProperties}
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="px-4 py-2.5 text-sm bg-gray-50 rounded-xl outline-none focus:ring-2"
            style={{ "--tw-ring-color": "var(--accent)" } as React.CSSProperties}
          />
          <select value={role} onChange={(e) => setRole(e.target.value)} className="px-4 py-2.5 text-sm bg-gray-50 rounded-xl outline-none">
            <option>Admin</option>
            <option>Manager</option>
            <option>Operator</option>
          </select>
          <button
            onClick={addUser}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold"
            style={{ backgroundColor: "var(--accent)" }}
          >
            <Plus size={15} /> Send invite
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm">
        <div className="px-6 py-4">
          <h3 className="font-bold text-gray-900">Team · {users.length}</h3>
        </div>
        {users.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-400">No team members yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-y border-gray-50">
                <th className="px-6 py-2.5 font-medium">Name</th>
                <th className="px-2 py-2.5 font-medium">Email</th>
                <th className="px-2 py-2.5 font-medium">Role</th>
                <th className="px-2 py-2.5 font-medium">Status</th>
                <th className="px-6 py-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-6 py-3 flex items-center gap-2.5">
                    <IconAvatar seed={u.name} size={30} />
                    <span className="font-semibold text-gray-800">{u.name}</span>
                  </td>
                  <td className="px-2 py-3 text-gray-500">{u.email}</td>
                  <td className="px-2 py-3 text-gray-500">{u.role}</td>
                  <td className="px-2 py-3">
                    <Pill tone={u.status === "active" ? "green" : "gray"}>{u.status}</Pill>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <IconTrash onClick={() => removeUser(u.id)} />
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

/* ---------------------------------------------------------------------- */
/*  Customization page — QR themes + Sticker Template                       */
/* ---------------------------------------------------------------------- */

function StickerEditor({ stickerPos, setStickerPos, templates, setTemplates, setToast }: { stickerPos: { x: number; y: number; w: number; h: number }; setStickerPos: (p: { x: number; y: number; w: number; h: number }) => void; templates: any[]; setTemplates: any; setToast: any }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState<"se" | "sw" | "ne" | "nw" | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const startPos = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const [showGrid, setShowGrid] = useState(false);
  const [lockAspect, setLockAspect] = useState(true);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [tplName, setTplName] = useState("");
  const [tplFg, setTplFg] = useState("D9581F");
  const [tplBg, setTplBg] = useState("FFFFFF");

  const MIN_SIZE = 16;
  const MAX_SIZE = 300;

  function getScale() {
    if (!containerRef.current) return 1;
    const el = containerRef.current;
    return el.clientWidth / el.offsetWidth || 1;
  }

  function clamp(val: number, min: number, max: number) {
    return Math.max(min, Math.min(max, val));
  }

  const handleDragDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
    dragOffset.current = { x: e.clientX, y: e.clientY };
    startPos.current = { x: stickerPos.x, y: stickerPos.y, w: stickerPos.w, h: stickerPos.h };
  }, [stickerPos]);

  const handleResizeDown = useCallback((dir: "se" | "sw" | "ne" | "nw") => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
        const nx = clamp(startPos.current.x + dx, 0, rect.width - stickerPos.w);
        const ny = clamp(startPos.current.y + dy, 0, rect.height - stickerPos.h);
        setStickerPos({ ...stickerPos, x: Math.round(nx), y: Math.round(ny) });
      }

      if (resizing) {
        const s = startPos.current;
        let nw = s.w;
        let nh = s.h;
        let nx = s.x;
        let ny = s.y;

        if (resizing === "se") {
          nw = clamp(s.w + dx, MIN_SIZE, MAX_SIZE);
          nh = lockAspect ? nw : clamp(s.h + dy, MIN_SIZE, MAX_SIZE);
        } else if (resizing === "sw") {
          nw = clamp(s.w - dx, MIN_SIZE, MAX_SIZE);
          nh = lockAspect ? nw : clamp(s.h + dy, MIN_SIZE, MAX_SIZE);
          nx = s.x + s.w - nw;
        } else if (resizing === "ne") {
          nw = clamp(s.w + dx, MIN_SIZE, MAX_SIZE);
          nh = lockAspect ? nw : clamp(s.h - dy, MIN_SIZE, MAX_SIZE);
          ny = s.y + s.h - nh;
        } else if (resizing === "nw") {
          nw = clamp(s.w - dx, MIN_SIZE, MAX_SIZE);
          nh = lockAspect ? nw : clamp(s.h - dy, MIN_SIZE, MAX_SIZE);
          nx = s.x + s.w - nw;
          ny = s.y + s.h - nh;
        }

        nx = clamp(nx, 0, rect.width - nw);
        ny = clamp(ny, 0, rect.height - nh);
        setStickerPos({ x: Math.round(nx), y: Math.round(ny), w: Math.round(nw), h: Math.round(nh) });
      }
    };
    const handleUp = () => { setDragging(false); setResizing(null); };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => { window.removeEventListener("mousemove", handleMove); window.removeEventListener("mouseup", handleUp); };
  }, [dragging, resizing, stickerPos, setStickerPos, lockAspect]);

  function setField(field: "x" | "y" | "w" | "h", val: number) {
    const next = { ...stickerPos };
    if (field === "w") next.w = clamp(val, MIN_SIZE, MAX_SIZE);
    else if (field === "h") next.h = clamp(val, MIN_SIZE, MAX_SIZE);
    else next[field] = val;
    setStickerPos(next);
  }

  function centerH() {
    if (!containerRef.current) return;
    const cw = containerRef.current.clientWidth;
    setStickerPos({ ...stickerPos, x: Math.round((cw - stickerPos.w) / 2) });
  }
  function centerV() {
    if (!containerRef.current) return;
    const ch = containerRef.current.clientHeight;
    setStickerPos({ ...stickerPos, y: Math.round((ch - stickerPos.h) / 2) });
  }
  function centerAll() {
    if (!containerRef.current) return;
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    setStickerPos({ x: Math.round((cw - stickerPos.w) / 2), y: Math.round((ch - stickerPos.h) / 2), w: stickerPos.w, h: stickerPos.h });
  }
  function resetPos() {
    setStickerPos({ x: 0, y: 0, w: stickerPos.w, h: stickerPos.h });
  }

  function handleSave() {
    if (saveState !== "idle") return;
    if (!tplName.trim()) {
      setToast("Enter a template name first");
      setTimeout(() => setToast(null), 2000);
      return;
    }
    setSaveState("saving");
    setTimeout(() => {
      const newTpl = {
        id: Date.now(),
        name: tplName.trim(),
        fg: tplFg,
        bg: tplBg,
        logo: null,
        stickerPos: { ...stickerPos },
        isPublicDefault: templates.length === 0,
      };
      setTemplates((prev: any[]) => [...prev, newTpl]);
      setTplName("");
      setSaveState("saved");
      setToast(`"${newTpl.name}" saved — available in QR generation`);
      setTimeout(() => setSaveState("idle"), 1800);
      setTimeout(() => setToast(null), 2500);
    }, 600);
  }

  function deleteTemplate(id: number) {
    setTemplates((prev: any[]) => {
      const rest = prev.filter((t: any) => t.id !== id);
      if (rest.length === 0) return prev;
      const target = prev.find((t: any) => t.id === id);
      if (target?.isPublicDefault) rest[0].isPublicDefault = true;
      return rest;
    });
    setToast("Template deleted");
    setTimeout(() => setToast(null), 1500);
  }

  function makeDefault(id: number) {
    const target = templates.find((t: any) => t.id === id);
    if (target?.stickerPos) setStickerPos(target.stickerPos);
    setTemplates((prev: any[]) => prev.map((t: any) => ({ ...t, isPublicDefault: t.id === id })));
    setToast("Set as default");
    setTimeout(() => setToast(null), 2000);
  }

  const cursorMap: Record<string, string> = { se: "nwse-resize", sw: "nesw-resize", ne: "nesw-resize", nw: "nwse-resize" };
  const handleStyle = (dir: string): React.CSSProperties => ({
    position: "absolute" as const,
    width: 10, height: 10,
    borderRadius: dir.length === 2 ? 2 : "50%",
    background: "white",
    border: "2px solid var(--accent)",
    zIndex: 10,
    cursor: cursorMap[dir] || "pointer",
    ...(dir === "se" ? { right: -5, bottom: -5 } : {}),
    ...(dir === "sw" ? { left: -5, bottom: -5 } : {}),
    ...(dir === "ne" ? { right: -5, top: -5 } : {}),
    ...(dir === "nw" ? { left: -5, top: -5 } : {}),
  });

  const inputCls = "w-full px-2 py-1 text-[11px] font-mono bg-gray-50 border border-gray-200 rounded-lg outline-none text-center focus:ring-1 focus:ring-[var(--accent)]";

  return (
    <div className="bg-white rounded-2xl shadow-sm">
      <div className="px-5 py-4 border-b border-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileImage size={15} className="text-gray-400" />
            <h3 className="font-bold text-gray-900 text-sm">Sticker QR Placement</h3>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowGrid(!showGrid)}
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full transition-colors"
              style={{ backgroundColor: showGrid ? "var(--accent)" : "#F3F4F6", color: showGrid ? "white" : "#9CA3AF" }}
            >
              Grid
            </button>
            <button
              onClick={() => setLockAspect(!lockAspect)}
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full transition-colors"
              style={{ backgroundColor: lockAspect ? "var(--accent)" : "#F3F4F6", color: lockAspect ? "white" : "#9CA3AF" }}
            >
              {lockAspect ? "1:1" : "Free"}
            </button>
            <div className="w-px h-4 bg-gray-200" />
            <button
              onClick={handleSave}
              disabled={saveState !== "idle"}
              className="relative flex items-center gap-1.5 text-[10px] font-semibold text-white rounded-full overflow-hidden disabled:cursor-default"
              style={{
                paddingLeft: saveState === "idle" ? 12 : saveState === "saving" ? 10 : 10,
                paddingRight: saveState === "idle" ? 12 : saveState === "saving" ? 14 : 14,
                paddingTop: 4, paddingBottom: 4,
                backgroundColor: saveState === "saved" ? "#10B981" : "var(--accent)",
                minWidth: saveState === "idle" ? undefined : saveState === "saved" ? 78 : 82,
                transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
                transform: saveState === "saved" ? "scale(1.08)" : "scale(1)",
              }}
            >
              <span className="relative flex items-center justify-center" style={{ width: 11, height: 11 }}>
                {saveState === "idle" && (
                  <Check size={11} style={{ transition: "opacity 0.2s ease", opacity: 1 }} />
                )}
                {saveState === "saving" && (
                  <svg className="animate-spin" width={11} height={11} viewBox="0 0 24 24" fill="none" style={{ opacity: 1, transition: "opacity 0.15s ease" }}>
                    <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {saveState === "saved" && (
                  <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="animate-check-in">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </span>
              <span className="whitespace-nowrap" style={{
                transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}>
                {saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved!" : "Save"}
              </span>
              {saveState === "saved" && (
                <span className="absolute inset-0 rounded-full animate-save-ripple" style={{ border: "2px solid #10B981" }} />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="flex gap-4">
          <div
            ref={containerRef}
            className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-100 flex-shrink-0"
            style={{
              width: 320, height: 200,
              cursor: dragging ? "grabbing" : "default",
            }}
          >
            <img src={STICKER_SRC} alt="Sticker template" className="w-full h-full object-contain select-none" draggable={false} />

            {showGrid && (
              <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: "linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }} />
            )}

            <div
              className="absolute"
              style={{
                left: stickerPos.x, top: stickerPos.y, width: stickerPos.w, height: stickerPos.h,
                cursor: dragging ? "grabbing" : "grab",
              }}
              onMouseDown={handleDragDown}
            >
              <div className="w-full h-full rounded-md border-2 border-dashed flex items-center justify-center"
                style={{ borderColor: dragging || resizing ? "var(--accent)" : "rgba(0,0,0,0.35)", background: "rgba(255,255,255,0.2)", backdropFilter: "blur(1px)" }}
              >
                <img
                  src={qrImageUrl("PREVIEW|Sticker|TEMPLATE", tplFg, tplBg, 200)}
                  className="w-full h-full rounded pointer-events-none object-contain"
                  alt="QR preview"
                  draggable={false}
                />
              </div>
              {(["nw", "ne", "sw", "se"] as const).map((d) => (
                <div key={d} style={handleStyle(d)} onMouseDown={handleResizeDown(d)} title={`Resize ${d.toUpperCase()}`} />
              ))}
            </div>

            <div className="absolute bottom-1.5 right-2 bg-black/60 text-white text-[9px] font-mono px-1.5 py-0.5 rounded-md">
              {Math.round(stickerPos.w)} x {Math.round(stickerPos.h)}
            </div>
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">X</label>
                <input type="number" value={Math.round(stickerPos.x)} onChange={(e) => setField("x", Number(e.target.value))} className={inputCls} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Y</label>
                <input type="number" value={Math.round(stickerPos.y)} onChange={(e) => setField("y", Number(e.target.value))} className={inputCls} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Width</label>
                <input type="number" value={Math.round(stickerPos.w)} onChange={(e) => setField("w", Number(e.target.value))} className={inputCls} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Height</label>
                <input type="number" value={Math.round(stickerPos.h)} onChange={(e) => setField("h", Number(e.target.value))} className={inputCls} />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Quick Resize</label>
              <div className="flex gap-1.5 flex-wrap">
                {[40, 60, 80, 100, 120, 140, 160].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStickerPos({ ...stickerPos, w: s, h: s })}
                    className="text-[10px] font-semibold px-2 py-1 rounded-lg border transition-colors"
                    style={{
                      borderColor: stickerPos.w === s ? "var(--accent)" : "#E5E7EB",
                      color: stickerPos.w === s ? "var(--accent)" : "#6B7280",
                      backgroundColor: stickerPos.w === s ? "color-mix(in srgb, var(--accent) 8%, white)" : "white",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Align</label>
              <div className="flex gap-1.5">
                <button onClick={centerH} className="text-[10px] font-semibold px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors">Center H</button>
                <button onClick={centerV} className="text-[10px] font-semibold px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors">Center V</button>
                <button onClick={centerAll} className="text-[10px] font-semibold px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors">Center All</button>
                <button onClick={resetPos} className="text-[10px] font-semibold px-3 py-1.5 rounded-lg bg-gray-50 text-gray-400 hover:bg-gray-100 transition-colors">Reset</button>
              </div>
            </div>

            <p className="text-[10px] text-gray-400 leading-relaxed">
              Drag the QR to position. Use corner handles or input fields to resize. Toggle grid for alignment. Used when downloading sticker composites.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Template Name</label>
              <input
                value={tplName}
                onChange={(e) => setTplName(e.target.value)}
                placeholder="e.g. Namo Orange"
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">QR Color</label>
              <input type="color" value={`#${tplFg}`} onChange={(e) => setTplFg(e.target.value.replace("#", ""))} className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">BG Color</label>
              <input type="color" value={`#${tplBg}`} onChange={(e) => setTplBg(e.target.value.replace("#", ""))} className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer" />
            </div>
          </div>
        </div>

        {templates.length > 0 && (
          <div className="border-t border-gray-100 pt-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Saved Templates</p>
            <div className="space-y-1.5">
              {templates.map((t: any) => (
                <div key={t.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gray-50 group">
                  <div className="w-6 h-6 rounded-md border border-gray-200 flex-shrink-0" style={{ backgroundColor: `#${t.bg || "FFFFFF"}` }}>
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: `#${t.fg || "D9581F"}` }} />
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-gray-700 truncate flex-1">{t.name}</span>
                  {t.stickerPos && (
                    <span className="text-[9px] text-gray-400 font-mono">{Math.round(t.stickerPos.w)}px</span>
                  )}
                  {t.isPublicDefault && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--accent)] text-white">default</span>
                  )}
                  {!t.isPublicDefault && (
                    <button onClick={() => makeDefault(t.id)} className="text-[9px] font-semibold text-gray-400 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">use</button>
                  )}
                  <button onClick={() => deleteTemplate(t.id)} className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CustomizationPage({ accent, setAccent, font, setFont, templates, setTemplates, stickerPos, setStickerPos, setToast }: any) {
  return (
    <div className="px-8 pt-8 pb-8 space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Palette size={16} /> Brand color
          </h3>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={`#${accent}`}
              onChange={(e) => setAccent(e.target.value.replace("#", ""))}
              className="w-12 h-12 rounded-xl border border-gray-100 cursor-pointer"
            />
            <div>
              <p className="text-sm font-semibold text-gray-900">#{accent.toUpperCase()}</p>
              <p className="text-xs text-gray-400">Applied across sidebar, buttons &amp; badges</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">Interface font</h3>
          <div className="flex gap-2">
            {FONT_OPTIONS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFont(f.id)}
                className="flex-1 px-3 py-2.5 rounded-xl text-sm"
                style={
                  font === f.id
                    ? { backgroundColor: "var(--accent)", color: "white", fontFamily: f.css }
                    : { backgroundColor: "#F9FAFB", color: "#6B7280", fontFamily: f.css }
                }
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <StickerEditor stickerPos={stickerPos} setStickerPos={setStickerPos} templates={templates} setTemplates={setTemplates} setToast={setToast} />
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Root                                                                     */
/* ---------------------------------------------------------------------- */

export default function QRFleetDashboard({ onBack }: { onBack: () => void }) {
  const [page, setPage] = useState("overview");
  const [accent, setAccent] = useLocalStorage("namoqr-accent", "D9581F");
  const [font, setFont] = useLocalStorage("namoqr-font", "Plus Jakarta Sans");
  const [templates, setTemplates] = useLocalStorage<any[]>("namoqr-templates", []);
  const [qrList, setQrList] = useLocalStorage<any[]>("namoqr-qrlist", []);
  const [users, setUsers] = useLocalStorage<any[]>("namoqr-users", []);
  const [stickerPos, setStickerPos] = useLocalStorage("namoqr-sticker-pos", { x: 110, y: 40, w: 100, h: 100 });
  const [quickLookQr, setQuickLookQr] = useState<any>(null);
  const [toast, setToast] = useState<string | null>(null);

  const admin = { name: "Mihir Rathod" };
  const fontCss = FONT_OPTIONS.find((f) => f.id === font)?.css;

  return (
    <div
      className="h-screen w-full flex overflow-hidden"
      style={{ "--accent": `#${accent}`, fontFamily: fontCss, backgroundColor: "#F1F0F6" } as React.CSSProperties}
    >
      <Sidebar page={page} setPage={setPage} admin={admin} onBack={onBack} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <TopBar admin={admin} />

        {page === "overview" && (
          <OverviewPage
            qrList={qrList}
            setQrList={setQrList}
            templates={templates}
            setPage={setPage}
            openQuickLook={setQuickLookQr}
            setToast={setToast}
          />
        )}
        {page === "qr" && (
          <QrCodesPage
            qrList={qrList}
            setQrList={setQrList}
            templates={templates}
            setToast={setToast}
            openQuickLook={setQuickLookQr}
          />
        )}
        {page === "alerts" && (
          <AlertsPage qrList={qrList} setQrList={setQrList} templates={templates} setToast={setToast} />
        )}
        {page === "users" && (
          <UsersPage users={users} setUsers={setUsers} setToast={setToast} />
        )}
        {page === "customize" && (
          <CustomizationPage
            accent={accent}
            setAccent={setAccent}
            font={font}
            setFont={setFont}
            templates={templates}
            setTemplates={setTemplates}
            stickerPos={stickerPos}
            setStickerPos={setStickerPos}
            setToast={setToast}
          />
        )}
      </div>

      <QuickLookModal
        qr={quickLookQr}
        onClose={() => setQuickLookQr(null)}
        stickerPos={stickerPos}
        templates={templates}
      />
      <Toast toast={toast} />
    </div>
  );
}

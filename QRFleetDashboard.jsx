import React, { useState, useRef } from "react";
import {
  LayoutGrid,
  QrCode,
  Bell,
  Users,
  Palette,
  Search,
  ChevronDown,
  ChevronLeft,
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
  Mail,
  Eye,
  ShieldCheck,
  Clock,
  UserPlus,
  ImagePlus,
  Star,
  Flame,
} from "lucide-react";
import { BarChart, Bar, XAxis, ResponsiveContainer } from "recharts";

/* ---------------------------------------------------------------------- */
/*  Helpers                                                                 */
/* ---------------------------------------------------------------------- */

const VEHICLE_POOL = [
  "Toyota Innova",
  "Honda City",
  "Maruti Swift",
  "Hyundai Creta",
  "Tata Nexon",
  "Mahindra XUV700",
  "Kia Seltos",
  "Ford EcoSport",
  "Skoda Slavia",
  "Renault Kwid",
];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPlate() {
  const states = ["GJ01", "GJ05", "MH12", "DL08", "KA03", "RJ14"];
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const l2 =
    letters[Math.floor(Math.random() * letters.length)] +
    letters[Math.floor(Math.random() * letters.length)];
  const num = Math.floor(1000 + Math.random() * 8999);
  return `${randomFrom(states)}${l2}${num}`;
}

function qrImageUrl(data, fg, bg, size = 220) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
    data
  )}&color=${fg}&bgcolor=${bg}&qzone=1`;
}

function avatarUrl(seed) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
    seed
  )}&backgroundColor=eef2ff,fce7f3,dbeafe,fef3c7`;
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtDateTime(d) {
  return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
function uid(prefix = "QR") {
  return `${prefix}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

/* ---------------------------------------------------------------------- */
/*  Seed data                                                               */
/* ---------------------------------------------------------------------- */

const seedTemplates = [
  { id: 1, name: "Violet Classic", fg: "6C5CE7", bg: "FFFFFF", logo: null, isPublicDefault: true },
  { id: 2, name: "Midnight", fg: "111827", bg: "F3F4F6", logo: null, isPublicDefault: false },
  { id: 3, name: "Sunset Pink", fg: "DB2777", bg: "FDF2F8", logo: null, isPublicDefault: false },
];

function seedQr(templates) {
  const t = templates[0];
  const now = Date.now();
  return Array.from({ length: 10 }).map((_, i) => {
    const created = new Date(now - i * 86400000 * (1 + Math.random() * 3));
    return {
      id: uid(),
      clientId: `CL-${200 + i}`,
      vehicleName: randomFrom(VEHICLE_POOL),
      vehicleNumber: randomPlate(),
      createdAt: created.toISOString(),
      scans: Math.floor(Math.random() * 60),
      status: Math.random() > 0.15 ? "active" : "expired",
      template: t.name,
      fg: t.fg,
      bg: t.bg,
    };
  });
}

const seedUsers = [
  { id: 1, name: "Rakesh Patel", email: "rakesh@fleethq.com", role: "Admin", status: "active" },
  { id: 2, name: "Meera Shah", email: "meera@fleethq.com", role: "Manager", status: "active" },
  { id: 3, name: "Aakash Joshi", email: "aakash@fleethq.com", role: "Operator", status: "invited" },
];

const FONT_OPTIONS = [
  { id: "Plus Jakarta Sans", label: "Jakarta Sans", css: "'Plus Jakarta Sans', ui-sans-serif, system-ui" },
  { id: "Inter", label: "Inter", css: "'Inter', ui-sans-serif, system-ui" },
  { id: "JetBrains Mono", label: "JetBrains Mono", css: "'JetBrains Mono', ui-monospace, monospace" },
];

const PASTELS = [
  { bg: "#EDEBFF", fg: "#6C5CE7" },
  { bg: "#FCE7F3", fg: "#EC4899" },
  { bg: "#DBEAFE", fg: "#3B82F6" },
];

/* ---------------------------------------------------------------------- */
/*  Shared atoms                                                            */
/* ---------------------------------------------------------------------- */

function Pill({ tone = "gray", children }) {
  const tones = {
    gray: "bg-gray-100 text-gray-500",
    green: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-500",
    violet: "bg-violet-50 text-violet-600",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

function IconAvatar({ seed, size = 32, ring }) {
  return (
    <img
      src={avatarUrl(seed)}
      alt={seed}
      className="rounded-full flex-shrink-0 bg-gray-100"
      style={{ width: size, height: size, boxShadow: ring ? `0 0 0 2px white, 0 0 0 4px var(--accent)` : "none" }}
    />
  );
}

function IconTrash({ onClick, title = "Delete" }) {
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

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[60] bg-gray-900 text-white text-sm px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2">
      <Check size={16} />
      {toast}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Sidebar                                                                  */
/* ---------------------------------------------------------------------- */

const NAV_ITEMS = [
  { id: "overview", label: "Dashboard", icon: LayoutGrid },
  { id: "qr", label: "QR Codes", icon: QrCode },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "users", label: "Manage Users", icon: Users },
  { id: "customize", label: "Customization", icon: Palette },
];

function Sidebar({ page, setPage, admin, users }) {
  return (
    <aside className="w-64 flex-shrink-0 bg-white flex flex-col h-full px-5 py-6">
      <div className="flex items-center gap-2.5 px-1 mb-8">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0"
          style={{ backgroundColor: "var(--accent)" }}
        >
          <Sparkles size={17} />
        </div>
        <span className="font-bold text-gray-900 text-lg">FleetQR</span>
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

      <p className="text-[11px] font-bold text-gray-300 tracking-widest px-1 mb-3">TEAM</p>
      <div className="space-y-3 px-1 flex-1">
        {users.slice(0, 3).map((u) => (
          <div key={u.id} className="flex items-center gap-2.5">
            <IconAvatar seed={u.name} size={34} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{u.name}</p>
              <p className="text-xs text-gray-400 truncate">{u.role}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 mt-4 border-t border-gray-100 space-y-1">
        <p className="text-[11px] font-bold text-gray-300 tracking-widest px-1 mb-2">SETTINGS</p>
        <button
          onClick={() => setPage("customize")}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500"
        >
          <Settings size={18} /> Setting
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-orange-400">
          <LogOut size={18} /> Logout
        </button>
      </div>
    </aside>
  );
}

/* ---------------------------------------------------------------------- */
/*  Top bar                                                                  */
/* ---------------------------------------------------------------------- */

function TopBar({ admin }) {
  return (
    <div className="h-20 flex-shrink-0 flex items-center justify-between px-8">
      <div className="relative w-[420px] max-w-full">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
        <input
          placeholder="Search your fleet..."
          className="pl-11 pr-4 py-3 w-full text-sm bg-white rounded-full outline-none shadow-sm border border-gray-100 focus:ring-2"
          style={{ "--tw-ring-color": "var(--accent)" }}
        />
      </div>
      <div className="flex items-center gap-4">
        <button className="w-11 h-11 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400">
          <Mail size={17} />
        </button>
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

function HeroBanner({ setPage }) {
  return (
    <div
      className="relative overflow-hidden rounded-3xl p-8 text-white"
      style={{ background: "linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 60%, #1e1b4b))" }}
    >
      <Sparkles className="absolute -right-4 top-6 opacity-20" size={140} />
      <Pill tone="gray">
        <span className="text-white/90" style={{ background: "transparent" }}>ONLINE FLEET</span>
      </Pill>
      <h1 className="text-3xl font-bold mt-4 max-w-md leading-tight">
        Generate Smarter QR Codes for Every Vehicle
      </h1>
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
  );
}

function StatPill({ color, icon: Icon, label, value }) {
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

function RecentCard({ q, onOpen }) {
  return (
    <button onClick={() => onOpen(q)} className="text-left bg-white rounded-2xl shadow-sm overflow-hidden flex-shrink-0 w-[220px]">
      <div className="p-6 flex items-center justify-center" style={{ backgroundColor: "#F4F3FF" }}>
        <img src={qrImageUrl(`${q.clientId}|${q.vehicleName}|${q.vehicleNumber}`, q.fg, q.bg, 200)} className="w-24 h-24" alt="qr" />
      </div>
      <div className="p-4">
        <Pill tone={q.status === "active" ? "violet" : "red"}>{q.status === "active" ? "ACTIVE" : "EXPIRED"}</Pill>
        <p className="font-semibold text-gray-900 text-sm mt-2 truncate">{q.vehicleName}</p>
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: "#EDEBFF", color: "var(--accent)" }}>
            <Car size={12} />
          </div>
          <p className="text-xs text-gray-400 truncate">{q.clientId} · {fmtDate(q.createdAt)}</p>
        </div>
      </div>
    </button>
  );
}

function OverviewPage({ qrList, setQrList, users, templates, setPage, openQuickLook, setToast }) {
  const totalScans = qrList.reduce((a, q) => a + q.scans, 0);
  const active = qrList.filter((q) => q.status === "active").length;
  const quotaPct = Math.min(100, Math.round((qrList.length / 5000) * 100));
  const chartData = [
    { name: "1-10", v: Math.max(4, Math.round(qrList.length * 0.3)) },
    { name: "11-20", v: Math.max(6, Math.round(qrList.length * 0.45)) },
    { name: "21-30", v: Math.max(3, Math.round(qrList.length * 0.25)) },
  ];

  function removeRecent(id) {
    setQrList((prev) => prev.filter((x) => x.id !== id));
    setToast("QR removed");
    setTimeout(() => setToast(null), 1500);
  }

  return (
    <div className="px-8 pb-8 flex gap-6">
      <div className="flex-1 min-w-0 space-y-6">
        <HeroBanner setPage={setPage} />

        <div className="flex gap-4">
          <StatPill color={PASTELS[0]} icon={QrCode} label="Total generated" value={`${qrList.length} codes`} />
          <StatPill color={PASTELS[1]} icon={ScanLine} label="Total scans" value={`${totalScans} scans`} />
          <StatPill color={PASTELS[2]} icon={ShieldCheck} label="Active codes" value={`${active} active`} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900">Recently Generated</h3>
            <button onClick={() => setPage("qr")} className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
              See all
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {qrList.slice(0, 6).map((q) => (
              <RecentCard key={q.id} q={q} onOpen={openQuickLook} />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h3 className="font-bold text-gray-900">Latest Activity</h3>
            <button onClick={() => setPage("alerts")} className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
              See all
            </button>
          </div>
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
              {qrList.slice(0, 5).map((q) => (
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
        </div>
      </div>

      <div className="w-80 flex-shrink-0 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
          <div className="flex justify-between items-start mb-2">
            <p className="font-bold text-gray-900 text-left">Statistic</p>
          </div>
          <div className="relative w-24 h-24 mx-auto my-3">
            <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#F3F4F6" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(quotaPct / 100) * 264} 264`}
              />
            </svg>
            <img src={avatarUrl(admin_seed)} alt="admin" className="absolute inset-0 m-auto w-16 h-16 rounded-full" />
            <span
              className="absolute -top-1 right-0 text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: "var(--accent)" }}
            >
              {quotaPct}%
            </span>
          </div>
          <p className="font-bold text-gray-900 flex items-center justify-center gap-1">
            Good Morning Jason <Flame size={14} className="text-orange-400" />
          </p>
          <p className="text-xs text-gray-400 mt-1">Your monthly QR quota usage so far</p>

          <div className="h-28 mt-5">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barCategoryGap="35%">
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <Bar dataKey="v" radius={[6, 6, 6, 6]} fill="var(--accent)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-bold text-gray-900">Your Templates</p>
            <span className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
              <Plus size={14} />
            </span>
          </div>
          <div className="space-y-3.5">
            {templates.map((t) => (
              <div key={t.id} className="flex items-center gap-3">
                <img src={qrImageUrl("PREVIEW", t.fg, t.bg, 60)} className="w-9 h-9 rounded-lg border border-gray-100" alt="template" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-800 truncate">{t.name}</p>
                  <p className="text-xs text-gray-400">Template</p>
                </div>
                {t.isPublicDefault ? (
                  <Pill tone="violet">Default</Pill>
                ) : (
                  <span className="text-xs text-gray-300">—</span>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={() => setPage("customize")}
            className="w-full mt-4 py-2.5 rounded-full text-sm font-semibold text-white"
            style={{ backgroundColor: "var(--accent)" }}
          >
            See All
          </button>
        </div>
      </div>
    </div>
  );
}

const admin_seed = "Jason Ranti";

/* ---------------------------------------------------------------------- */
/*  QR Codes page                                                           */
/* ---------------------------------------------------------------------- */

function QrCodesPage({ qrList, setQrList, templates, setToast, openQuickLook }) {
  const [vehicleName, setVehicleName] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [templateId, setTemplateId] = useState(templates.find((t) => t.isPublicDefault)?.id || templates[0].id);
  const [bulkCount, setBulkCount] = useState(25);
  const [tab, setTab] = useState("single");

  const activeTemplate = templates.find((t) => t.id === Number(templateId)) || templates[0];

  function handleGenerateSingle() {
    if (!vehicleName || !vehicleNumber) {
      setToast("Fill in vehicle name and vehicle number");
      setTimeout(() => setToast(null), 2500);
      return;
    }
    const rec = {
      id: uid(),
      clientId: uid("CL"),
      vehicleName,
      vehicleNumber,
      createdAt: new Date().toISOString(),
      scans: 0,
      status: "active",
      template: activeTemplate.name,
      fg: activeTemplate.fg,
      bg: activeTemplate.bg,
    };
    setQrList((prev) => [rec, ...prev]);
    openQuickLook(rec);
    setVehicleName("");
    setVehicleNumber("");
    setToast("QR code generated");
    setTimeout(() => setToast(null), 2000);
  }

  function handleGenerateBulk() {
    const count = Math.max(1, Math.min(1000, Number(bulkCount) || 0));
    const batch = Array.from({ length: count }).map((_, i) => ({
      id: uid(),
      clientId: uid("CL"),
      vehicleName: randomFrom(VEHICLE_POOL),
      vehicleNumber: randomPlate(),
      createdAt: new Date().toISOString(),
      scans: 0,
      status: "active",
      template: activeTemplate.name,
      fg: activeTemplate.fg,
      bg: activeTemplate.bg,
    }));
    setQrList((prev) => [...batch, ...prev]);
    setToast(`${count} QR codes generated in bulk`);
    setTimeout(() => setToast(null), 2500);
  }

  function downloadCsv() {
    const rows = [
      ["QR ID", "Client ID", "Vehicle Name", "Vehicle Number", "Template", "Created"],
      ...qrList.map((q) => [q.id, q.clientId, q.vehicleName, q.vehicleNumber, q.template, fmtDate(q.createdAt)]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "qr-codes-export.csv";
    a.click();
  }

  function deleteQr(id) {
    setQrList((prev) => prev.filter((x) => x.id !== id));
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
    <div className="px-8 pb-8 space-y-6">
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
                style={{ "--tw-ring-color": "var(--accent)" }}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Vehicle number</label>
              <input
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                placeholder="GJ01AB1234"
                className="w-full px-4 py-2.5 text-sm bg-gray-50 rounded-xl outline-none focus:ring-2"
                style={{ "--tw-ring-color": "var(--accent)" }}
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-400 mb-1.5 block">QR theme template</label>
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-gray-50 rounded-xl outline-none"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.isPublicDefault ? "(public default)" : ""}
                  </option>
                ))}
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
                style={{ "--tw-ring-color": "var(--accent)" }}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 mb-1.5 block">QR theme template</label>
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-gray-50 rounded-xl outline-none"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
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
            <p className="col-span-4 text-xs text-gray-400">
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
              className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 bg-gray-50 px-3.5 py-2 rounded-full"
            >
              <Download size={14} /> Export CSV
            </button>
            <button
              onClick={deleteAllQr}
              className="flex items-center gap-1.5 text-sm font-semibold text-red-500 bg-red-50 px-3.5 py-2 rounded-full"
            >
              <Trash2 size={14} /> Clear all
            </button>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-400 border-y border-gray-50">
              <th className="px-6 py-2.5 font-medium">QR</th>
              <th className="px-2 py-2.5 font-medium">Client ID</th>
              <th className="px-2 py-2.5 font-medium">Vehicle</th>
              <th className="px-2 py-2.5 font-medium">Number</th>
              <th className="px-2 py-2.5 font-medium">Created</th>
              <th className="px-2 py-2.5 font-medium">Scans</th>
              <th className="px-2 py-2.5 font-medium">Status</th>
              <th className="px-6 py-2.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {qrList.slice(0, 60).map((q) => (
              <tr key={q.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 group">
                <td className="px-6 py-2.5">
                  <button onClick={() => openQuickLook(q)}>
                    <img
                      src={qrImageUrl(`${q.clientId}|${q.vehicleName}|${q.vehicleNumber}`, q.fg, q.bg, 60)}
                      className="w-9 h-9 rounded-lg border border-gray-100"
                      alt="qr"
                    />
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
                  <button
                    onClick={() => openQuickLook(q)}
                    className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400"
                    title="Quick look"
                  >
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
        {qrList.length === 0 && <div className="px-6 py-10 text-center text-sm text-gray-400">No QR codes yet — generate one above.</div>}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Quick Look centered popup                                               */
/* ---------------------------------------------------------------------- */

function QuickLookModal({ qr, onClose, onDelete }) {
  if (!qr) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ backgroundColor: "rgba(17,17,27,0.45)" }} onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5">
          <span className="text-xs font-bold text-gray-300 tracking-widest">QUICK LOOK</span>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
            <X size={15} />
          </button>
        </div>

        <div className="flex flex-col items-center px-6 pt-4 pb-5">
          <div className="p-5 rounded-2xl" style={{ backgroundColor: "#F4F3FF" }}>
            <img
              src={qrImageUrl(`${qr.clientId}|${qr.vehicleName}|${qr.vehicleNumber}`, qr.fg, qr.bg, 220)}
              className="w-40 h-40"
              alt="qr large"
            />
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

          <div className="flex gap-2 w-full mt-5">
            <a
              href={qrImageUrl(`${qr.clientId}|${qr.vehicleName}|${qr.vehicleNumber}`, qr.fg, qr.bg, 512)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-white text-sm font-semibold"
              style={{ backgroundColor: "var(--accent)" }}
            >
              <Download size={14} /> Download
            </a>
            <button
              onClick={() => onDelete(qr.id)}
              className="w-11 h-11 flex-shrink-0 rounded-full bg-red-50 text-red-500 flex items-center justify-center"
              title="Delete this QR"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Alerts page (deletable list)                                            */
/* ---------------------------------------------------------------------- */

function AlertsPage({ qrList, setQrList, setToast }) {
  const sorted = [...qrList].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const totalScans = qrList.reduce((a, q) => a + q.scans, 0);
  const expired = qrList.filter((q) => q.status === "expired").length;

  function removeAlert(id) {
    setQrList((prev) => prev.filter((x) => x.id !== id));
    setToast("Alert deleted");
    setTimeout(() => setToast(null), 1500);
  }

  return (
    <div className="px-8 pb-8 space-y-6">
      <div className="flex gap-4">
        <StatPill color={PASTELS[1]} icon={ScanLine} label="Total scans" value={`${totalScans}`} />
        <StatPill color={PASTELS[0]} icon={ShieldCheck} label="Active codes" value={`${qrList.length - expired}`} />
        <StatPill color={PASTELS[2]} icon={Clock} label="Needs renewal" value={`${expired}`} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm">
        <div className="px-6 py-4">
          <h3 className="font-bold text-gray-900">QR Activity &amp; Statistics</h3>
          <p className="text-xs text-gray-400 mt-0.5">Every generated code, most recent first — swipe left on any row to delete</p>
        </div>
        <div className="max-h-[560px] overflow-y-auto">
          {sorted.map((q) => (
            <div key={q.id} className="flex items-center gap-4 px-6 py-3.5 border-t border-gray-50 group">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: q.status === "active" ? "#10B981" : "#EF4444" }}
              />
              <img
                src={qrImageUrl(`${q.clientId}|${q.vehicleName}|${q.vehicleNumber}`, q.fg, q.bg, 60)}
                className="w-9 h-9 rounded-lg border border-gray-100 flex-shrink-0"
                alt="qr"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold text-gray-900">{q.vehicleName}</span> ({q.vehicleNumber}) generated for{" "}
                  <span className="font-semibold text-gray-900">{q.clientId}</span>
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{fmtDateTime(q.createdAt)} · template: {q.template}</p>
              </div>
              <Pill tone="violet">
                <ScanLine size={11} /> {q.scans}
              </Pill>
              <Pill tone={q.status === "active" ? "green" : "red"}>{q.status}</Pill>
              <IconTrash onClick={() => removeAlert(q.id)} title="Delete alert" />
            </div>
          ))}
          {sorted.length === 0 && <div className="px-6 py-10 text-center text-sm text-gray-400">No alerts — all clear.</div>}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Manage users page                                                       */
/* ---------------------------------------------------------------------- */

function UsersPage({ users, setUsers, setToast }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Operator");

  function addUser() {
    if (!name || !email) {
      setToast("Enter a name and email");
      setTimeout(() => setToast(null), 2000);
      return;
    }
    setUsers((prev) => [...prev, { id: Date.now(), name, email, role, status: "invited" }]);
    setName("");
    setEmail("");
    setToast("Invite sent");
    setTimeout(() => setToast(null), 2000);
  }

  function removeUser(id) {
    setUsers((prev) => prev.filter((x) => x.id !== id));
    setToast("Team member removed");
    setTimeout(() => setToast(null), 1500);
  }

  return (
    <div className="px-8 pb-8 space-y-6">
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
            style={{ "--tw-ring-color": "var(--accent)" }}
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="px-4 py-2.5 text-sm bg-gray-50 rounded-xl outline-none focus:ring-2"
            style={{ "--tw-ring-color": "var(--accent)" }}
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
            {users.map((u) => (
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
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Customization page                                                      */
/* ---------------------------------------------------------------------- */

function CustomizationPage({ accent, setAccent, font, setFont, templates, setTemplates, setToast }) {
  const fileRef = useRef(null);
  const [draft, setDraft] = useState({ name: "", fg: "6C5CE7", bg: "FFFFFF", logo: null });

  function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setDraft((d) => ({ ...d, logo: reader.result }));
    reader.readAsDataURL(file);
  }

  function saveTemplate() {
    if (!draft.name) {
      setToast("Name the template first");
      setTimeout(() => setToast(null), 2000);
      return;
    }
    setTemplates((prev) => [...prev, { id: Date.now(), ...draft, isPublicDefault: false }]);
    setDraft({ name: "", fg: "6C5CE7", bg: "FFFFFF", logo: null });
    setToast("Template uploaded");
    setTimeout(() => setToast(null), 2000);
  }

  function makeDefault(id) {
    setTemplates((prev) => prev.map((t) => ({ ...t, isPublicDefault: t.id === id })));
    setToast("Set as public default QR theme");
    setTimeout(() => setToast(null), 2000);
  }

  function deleteTemplate(id) {
    setTemplates((prev) => {
      const target = prev.find((t) => t.id === id);
      const rest = prev.filter((t) => t.id !== id);
      if (rest.length === 0) {
        setToast("Can't delete your only template");
        setTimeout(() => setToast(null), 2000);
        return prev;
      }
      if (target?.isPublicDefault) {
        rest[0].isPublicDefault = true;
      }
      return rest;
    });
    setToast("Template deleted");
    setTimeout(() => setToast(null), 1500);
  }

  return (
    <div className="px-8 pb-8 space-y-6">
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

      <div className="bg-white rounded-2xl shadow-sm">
        <div className="px-6 py-5">
          <h3 className="font-bold text-gray-900">QR theme templates</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Upload a custom design, adjust colors, and set one as the public default used for new QR codes.
          </p>
        </div>

        <div className="px-6 pb-4 grid grid-cols-3 gap-4">
          {templates.map((t) => (
            <div key={t.id} className="border border-gray-100 rounded-2xl p-4 relative">
              <div className="absolute top-3 right-3 flex items-center gap-1">
                {t.isPublicDefault && (
                  <Pill tone="violet">
                    <Star size={11} /> default
                  </Pill>
                )}
                <IconTrash onClick={() => deleteTemplate(t.id)} />
              </div>
              <div className="flex items-center gap-3 mb-3 pr-6">
                {t.logo ? (
                  <img src={t.logo} className="w-12 h-12 rounded-lg border border-gray-100 object-cover" alt="logo" />
                ) : (
                  <img src={qrImageUrl("PREVIEW-SAMPLE", t.fg, t.bg, 70)} className="w-12 h-12 rounded-lg border border-gray-100" alt="template preview" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{t.name}</p>
                  <p className="text-xs text-gray-400">#{t.fg} on #{t.bg}</p>
                </div>
              </div>
              {!t.isPublicDefault && (
                <button
                  onClick={() => makeDefault(t.id)}
                  className="w-full text-xs font-semibold py-2 rounded-full bg-gray-50 text-gray-600"
                >
                  Set as public default
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="px-6 pb-6 pt-2 border-t border-gray-50">
          <p className="text-xs font-semibold text-gray-500 mt-4 mb-3">Upload a new template</p>
          <div className="grid grid-cols-5 gap-3 items-end">
            <div className="col-span-2">
              <label className="text-xs text-gray-400 mb-1 block">Template name</label>
              <input
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                placeholder="e.g. Client onboarding"
                className="w-full px-4 py-2.5 text-sm bg-gray-50 rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Foreground</label>
              <input
                type="color"
                value={`#${draft.fg}`}
                onChange={(e) => setDraft((d) => ({ ...d, fg: e.target.value.replace("#", "") }))}
                className="w-full h-10 rounded-xl border border-gray-100 cursor-pointer"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Background</label>
              <input
                type="color"
                value={`#${draft.bg}`}
                onChange={(e) => setDraft((d) => ({ ...d, bg: e.target.value.replace("#", "") }))}
                className="w-full h-10 rounded-xl border border-gray-100 cursor-pointer"
              />
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-gray-50 text-sm text-gray-600"
            >
              <ImagePlus size={14} /> {draft.logo ? "Logo added" : "Add logo"}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          </div>
          <button
            onClick={saveTemplate}
            className="mt-3 flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-semibold"
            style={{ backgroundColor: "var(--accent)" }}
          >
            <Upload size={14} /> Save template
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Root                                                                     */
/* ---------------------------------------------------------------------- */

const PAGE_TITLES = {
  overview: "Dashboard",
  qr: "QR Codes",
  alerts: "Alerts",
  users: "Manage Users",
  customize: "Customization",
};

export default function App() {
  const [page, setPage] = useState("overview");
  const [accent, setAccent] = useState("6C5CE7");
  const [font, setFont] = useState("Plus Jakarta Sans");
  const [templates, setTemplates] = useState(seedTemplates);
  const [qrList, setQrList] = useState(() => seedQr(seedTemplates));
  const [users, setUsers] = useState(seedUsers);
  const [quickLookQr, setQuickLookQr] = useState(null);
  const [toast, setToast] = useState(null);

  const admin = { name: "Jason Ranti", role: "Fleet Administrator" };
  const fontCss = FONT_OPTIONS.find((f) => f.id === font)?.css;

  function deleteFromQuickLook(id) {
    setQrList((prev) => prev.filter((x) => x.id !== id));
    setQuickLookQr(null);
    setToast("QR code deleted");
    setTimeout(() => setToast(null), 1500);
  }

  return (
    <div
      className="h-screen w-full flex overflow-hidden"
      style={{ "--accent": `#${accent}`, fontFamily: fontCss, backgroundColor: "#F1F0F6" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
      `}</style>

      <Sidebar page={page} setPage={setPage} admin={admin} users={users} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <TopBar admin={admin} />

        {page === "overview" && (
          <OverviewPage
            qrList={qrList}
            setQrList={setQrList}
            users={users}
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
        {page === "alerts" && <AlertsPage qrList={qrList} setQrList={setQrList} setToast={setToast} />}
        {page === "users" && <UsersPage users={users} setUsers={setUsers} setToast={setToast} />}
        {page === "customize" && (
          <CustomizationPage
            accent={accent}
            setAccent={setAccent}
            font={font}
            setFont={setFont}
            templates={templates}
            setTemplates={setTemplates}
            setToast={setToast}
          />
        )}
      </div>

      <QuickLookModal qr={quickLookQr} onClose={() => setQuickLookQr(null)} onDelete={deleteFromQuickLook} />
      <Toast toast={toast} />
    </div>
  );
}

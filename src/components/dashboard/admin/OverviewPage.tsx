import { Plus, RefreshCw, Palette, PhoneCall, QrCode, ScanLine, Eye, ChevronRight, Trash2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import StatusPill from "./StatusPill";
import StickerThumb from "./StickerThumb";
import { QrRecord, Template } from "./types";

export default function OverviewPage({
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

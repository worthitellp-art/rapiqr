import { Plus, RefreshCw, Palette, PhoneCall, QrCode, ScanLine, Eye, ChevronRight, Trash2, TrendingUp, Clock, ArrowUpRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import StatusPill from "./StatusPill";
import StickerThumb from "./StickerThumb";
import { QrRecord, Template } from "./types";
import { fmtDate } from "./helpers";

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
    { label: "Total QR Codes", value: qrList.length, icon: QrCode, accent: "#EAB308", bg: "linear-gradient(135deg, #FEF9C3 0%, #FEF3C7 100%)", change: "+12%", up: true },
    { label: "Active Stickers", value: active, icon: ScanLine, accent: "#10B981", bg: "linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)", change: "+8%", up: true },
    { label: "Inactive / Pending", value: inactive, icon: RefreshCw, accent: "#F59E0B", bg: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)", change: "-3%", up: false },
    { label: "Total Scans", value: totalScans, icon: Eye, accent: "#8B5CF6", bg: "linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)", change: "+24%", up: true },
  ];

  const recentActivity = qrList.slice(0, 5).map((q) => ({
    id: q.id,
    type: q.status === "active" ? "activation" : "creation",
    title: `${q.vehicleName}`,
    subtitle: q.vehicleNumber,
    time: fmtDate(q.createdAt),
    status: q.status,
  }));

  return (
    <div className="px-8 pt-7 pb-10 space-y-7 text-gray-900">
      {/* Welcome Banner */}
      <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)" }}>
        <div className="absolute top-0 right-0 w-64 h-64 opacity-10" style={{ background: "radial-gradient(circle, #EAB308 0%, transparent 70%)" }} />
        <div className="relative z-10">
          <h2 className="text-xl font-extrabold text-white mb-1">Welcome back 👋</h2>
          <p className="text-sm text-gray-400 font-medium">Here's what's happening with your fleet today.</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={i}
              className="bg-white rounded-2xl p-5 border flex flex-col gap-3 transition-all hover:shadow-lg hover:shadow-gray-200/50 hover:-translate-y-0.5 cursor-default group"
              style={{ borderColor: "rgba(0,0,0,0.04)" }}
            >
              <div className="flex items-center justify-between">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                  style={{ background: s.bg, color: s.accent }}
                >
                  <Icon size={20} />
                </div>
                <div className={`flex items-center gap-1 text-[11px] font-bold ${s.up ? 'text-emerald-600' : 'text-amber-600'}`}>
                  <TrendingUp size={12} className={!s.up ? 'rotate-180' : ''} />
                  {s.change}
                </div>
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1 }}>
                  {s.value.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1.5 font-semibold">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Chart */}
        <div className="col-span-2 bg-white rounded-2xl p-6 border" style={{ borderColor: "rgba(0,0,0,0.04)" }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">QR Generation This Week</h3>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">Codes generated per day</p>
            </div>
            <button
              onClick={() => setPage("qr")}
              className="flex items-center gap-1 text-xs font-bold transition-all hover:gap-2 cursor-pointer px-3 py-1.5 rounded-lg hover:bg-amber-50"
              style={{ color: "#EAB308" }}
            >
              View all <ChevronRight size={12} />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} barSize={24} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#0F172A", border: "none", borderRadius: 12, color: "#fff", fontSize: 12, padding: "8px 14px", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}
                cursor={{ fill: "rgba(234,179,8,0.06)", radius: 6 }}
              />
              <Bar dataKey="v" radius={[8, 8, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={i === chartData.length - 1 ? "#EAB308" : "#F1F5F9"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-6 border flex flex-col gap-3" style={{ borderColor: "rgba(0,0,0,0.04)" }}>
          <h3 className="font-bold text-gray-900 text-sm">Quick Actions</h3>
          <button
            onClick={() => setPage("qr")}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl transition-all hover:scale-[1.02] text-white text-sm font-bold cursor-pointer shadow-md shadow-amber-500/20"
            style={{ background: "linear-gradient(135deg, #EAB308 0%, #F59E0B 100%)" }}
          >
            <span className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <QrCode size={18} />
            </span>
            Generate QR Code
          </button>
          <button
            onClick={openRestore}
            className="w-full flex items-center gap-3 p-3 rounded-xl border text-sm font-semibold text-gray-700 hover:bg-amber-50 hover:border-amber-200 transition-all cursor-pointer"
            style={{ borderColor: "rgba(0,0,0,0.06)" }}
          >
            <span className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <RefreshCw size={16} />
            </span>
            Restore by ID
          </button>
          <button
            onClick={() => setPage("customize")}
            className="w-full flex items-center gap-3 p-3 rounded-xl border text-sm font-semibold text-gray-700 hover:bg-violet-50 hover:border-violet-200 transition-all cursor-pointer"
            style={{ borderColor: "rgba(0,0,0,0.06)" }}
          >
            <span className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
              <Palette size={16} />
            </span>
            Manage Templates
          </button>
          <button
            onClick={() => setPage("communication")}
            className="w-full flex items-center gap-3 p-3 rounded-xl border text-sm font-semibold text-gray-700 hover:bg-emerald-50 hover:border-emerald-200 transition-all cursor-pointer"
            style={{ borderColor: "rgba(0,0,0,0.06)" }}
          >
            <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <PhoneCall size={16} />
            </span>
            Edit Helplines
          </button>
        </div>
      </div>

      {/* Recent Table + Activity Feed */}
      <div className="grid grid-cols-3 gap-6">
        {/* Recent QR Codes Table */}
        <div className="col-span-2 bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "rgba(0,0,0,0.04)" }}>
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "rgba(0,0,0,0.04)" }}>
            <h3 className="font-bold text-gray-900 text-sm">Recent QR Codes</h3>
            <button onClick={() => setPage("qr")} className="flex items-center gap-1 text-xs font-bold transition-all hover:gap-2 cursor-pointer" style={{ color: "#EAB308" }}>
              See all <ChevronRight size={12} />
            </button>
          </div>
          {qrList.length > 0 ? (
            <table className="w-full text-sm text-gray-800">
              <thead>
                <tr className="text-left text-[10px] text-gray-400 font-bold border-b uppercase tracking-wider" style={{ borderColor: "rgba(0,0,0,0.04)" }}>
                  <th className="px-6 py-3">QR</th>
                  <th className="px-3 py-3">Client</th>
                  <th className="px-3 py-3">Vehicle</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {qrList.slice(0, 5).map((q, i) => (
                  <tr
                    key={q.id}
                    className="border-b last:border-0 hover:bg-gray-50/60 transition-colors"
                    style={{ borderColor: "rgba(0,0,0,0.03)" }}
                  >
                    <td className="px-6 py-3">
                      <button onClick={() => openQuickLook(q)} className="hover:opacity-80 transition-opacity cursor-pointer">
                        <StickerThumb qr={q} templates={templates} size={40} />
                      </button>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs font-bold text-gray-600">{q.clientId}</td>
                    <td className="px-3 py-3">
                      <p className="text-xs font-bold text-gray-900">{q.vehicleName}</p>
                      <p className="text-[10px] text-gray-500 font-mono font-medium">{q.vehicleNumber}</p>
                    </td>
                    <td className="px-3 py-3"><StatusPill status={q.status} /></td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openQuickLook(q)} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-all cursor-pointer">
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
          ) : (
            <div className="flex flex-col items-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg, #FEF9C3 0%, #FEF3C7 100%)", color: "#EAB308" }}>
                <QrCode size={24} />
              </div>
              <p className="font-bold text-gray-900 text-sm">No QR codes yet</p>
              <p className="text-xs text-gray-500 mt-1 max-w-xs font-medium">Generate your first QR sticker to start tracking your fleet.</p>
              <button
                onClick={() => setPage("qr")}
                className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:shadow-lg hover:shadow-amber-500/20 cursor-pointer"
                style={{ background: "linear-gradient(135deg, #EAB308 0%, #F59E0B 100%)" }}
              >
                <Plus size={14} /> Generate First QR
              </button>
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "rgba(0,0,0,0.04)" }}>
          <h3 className="font-bold text-gray-900 text-sm mb-4">Recent Activity</h3>
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((item, i) => (
                <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-default">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      background: item.status === "active" ? "rgba(16,185,129,0.1)" : "rgba(234,179,8,0.1)",
                      color: item.status === "active" ? "#10B981" : "#EAB308",
                    }}
                  >
                    {item.status === "active" ? <ScanLine size={16} /> : <QrCode size={16} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-900 truncate">{item.title}</p>
                    <p className="text-[10px] text-gray-500 font-mono">{item.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium flex-shrink-0">
                    <Clock size={10} />
                    {item.time}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: "rgba(0,0,0,0.03)" }}>
                <Clock size={18} className="text-gray-400" />
              </div>
              <p className="text-xs font-semibold text-gray-500">No activity yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

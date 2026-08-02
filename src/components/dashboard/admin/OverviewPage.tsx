import React, { useMemo, useEffect, useRef, useState } from "react";
import {
  QrCode, ScanLine, Eye, ChevronRight, Trash2, RefreshCw,
  Palette, PhoneCall, Plus, ArrowUpRight, ArrowDownRight,
  Download, Calendar, ChevronDown, MoreHorizontal,
} from "lucide-react";
import { XAxis, YAxis, ResponsiveContainer, Tooltip, AreaChart, Area, BarChart, Bar, Cell } from "recharts";
import StatusPill from "./StatusPill";
import StickerThumb from "./StickerThumb";
import { QrRecord, Template } from "./types";
import ConfirmModal from "./ConfirmModal";

/* ─── Animated Counter ──────────────────────────────────────────────── */
function AnimatedNumber({ value, duration = 800 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(0);
  useEffect(() => {
    const start = ref.current;
    const diff = value - start;
    if (diff === 0) { setDisplay(value); return; }
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(start + diff * eased));
      if (p < 1) requestAnimationFrame(step);
      else ref.current = value;
    };
    requestAnimationFrame(step);
  }, [value, duration]);
  return <>{display.toLocaleString()}</>;
}

/* ─── SVG Donut ─────────────────────────────────────────────────────── */
function DonutRing({ percentage, size = 150 }: { percentage: number; size?: number }) {
  const r = (size - 20) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const filled = circ * (percentage / 100);
  const empty = circ - filled;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F1F5F9" strokeWidth="14" />
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke="#D97706" strokeWidth="14" strokeLinecap="round"
        strokeDasharray={`${filled} ${empty}`}
        strokeDashoffset={circ * 0.25}
        style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.34,1.56,0.64,1)" }}
      />
      <text x={cx} y={cy - 8} textAnchor="middle" fill="#1A1D26" fontSize="28" fontWeight="900" fontFamily="'Plus Jakarta Sans', sans-serif">
        {percentage}%
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="#94A3B8" fontSize="10" fontWeight="600" letterSpacing="0.3">
        On track for {Math.max(percentage - 8, 50)}% target
      </text>
    </svg>
  );
}

/* ─── Percentage Helper ─────────────────────────────────────────────── */
function calcChange(current: number, previous: number): { pct: string; up: boolean; prev: number } {
  if (previous === 0 && current === 0) return { pct: "0%", up: true, prev: 0 };
  if (previous === 0) return { pct: "+100%", up: true, prev: 0 };
  const change = ((current - previous) / previous) * 100;
  return { pct: `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`, up: change >= 0, prev: previous };
}

/* ─── Main Overview ──────────────────────────────────────────────────── */
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
  const active = qrList.filter(q => q.status === "active").length;
  const inactive = qrList.length - active;
  const activeRate = qrList.length > 0 ? Math.round((active / qrList.length) * 100) : 0;
  const [deleteTarget, setDeleteTarget] = useState<QrRecord | null>(null);

  // ── Period comparison (this week vs last week) ──
  const nowMs = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const thisWeek = qrList.filter(q => nowMs - new Date(q.createdAt).getTime() < weekMs);
  const prevWeekTotal = qrList.length - thisWeek.length;
  const prevWeekActive = active - thisWeek.filter(q => q.status === "active").length;
  const thisWeekScans = thisWeek.reduce((s, q) => s + (q.scans || 0), 0);
  const prevWeekScans = totalScans - thisWeekScans;
  const prevWeekInactive = inactive - thisWeek.filter(q => q.status !== "active").length;

  const qrChange = calcChange(qrList.length, Math.max(prevWeekTotal, 0));
  const activeChange = calcChange(active, Math.max(prevWeekActive, 0));
  const scanChange = calcChange(totalScans, Math.max(prevWeekScans, 0));
  const pendingChange = calcChange(inactive, Math.max(prevWeekInactive, 0));

  // ── Date range header ──
  const today = new Date();
  const thirtyAgo = new Date(today);
  thirtyAgo.setDate(thirtyAgo.getDate() - 30);
  const dateStr = `${thirtyAgo.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })} - ${today.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}`;

  // ── 7-day chart data ──
  const chartData = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    const count = qrList.filter(q => new Date(q.createdAt).toDateString() === d.toDateString()).length;
    return { name: label, v: count };
  }), [qrList]);

  const totalThisWeek = chartData.reduce((s, d) => s + d.v, 0);

  // ── Weekday scan data ──
  const weekdayData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const todayIdx = new Date().getDay();
    return days.map((name, i) => {
      const d = new Date();
      d.setDate(d.getDate() + (i - todayIdx));
      const scans = qrList.filter(q => new Date(q.createdAt).toDateString() === d.toDateString())
        .reduce((s, q) => s + (q.scans || 0), 0);
      return { name, v: scans, isToday: i === todayIdx };
    });
  }, [qrList]);

  const peakScan = Math.max(...weekdayData.map(d => d.v), 0);

  // ── Fleet distribution ──
  const fleetSegments = useMemo(() => {
    const segments = [
      { label: "Active", count: active, color: "#EAB308" },
      { label: "Inactive", count: qrList.length - active, color: "#F97316" },
    ];
    return segments.filter(s => s.count > 0);
  }, [qrList, active]);

  const fleetTotal = qrList.length || 1;

  // ── Stat cards config ──
  const stats = [
    { label: "Total QR Codes", value: qrList.length, change: qrChange, color: "#EAB308", bgLight: "#FFFBEB", icon: QrCode },
    { label: "Active Stickers", value: active, change: activeChange, color: "#22C55E", bgLight: "#F0FDF4", icon: ScanLine },
    { label: "Total Scans", value: totalScans, change: scanChange, color: "#F97316", bgLight: "#FFF7ED", icon: Eye },
    { label: "Pending", value: inactive, change: pendingChange, color: "#A855F7", bgLight: "#FAF5FF", icon: RefreshCw },
  ];

  return (
    <div className="px-8 pt-6 pb-12 space-y-5" style={{ fontFamily: "'Inter', ui-sans-serif, system-ui" }}>

      {/* ════════ Header ════════ */}
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-extrabold text-[#1A1D26] tracking-[-0.02em]">Dashboard</h1>
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2 px-3 py-[7px] rounded-xl border text-[12px] font-semibold transition-all cursor-pointer"
            style={{ borderColor: "#E2E8F0", color: "#64748B", background: "#fff" }}
          >
            <Calendar size={13} />
            <span>{dateStr}</span>
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-[7px] rounded-xl border text-[12px] font-semibold transition-all cursor-pointer"
            style={{ borderColor: "#E2E8F0", color: "#64748B", background: "#fff" }}
          >
            Last 30 days
            <ChevronDown size={13} />
          </button>
          <button
            className="flex items-center gap-2 px-4 py-[8px] rounded-xl text-[12px] font-bold text-white transition-all hover:opacity-90 cursor-pointer"
            style={{ background: "#0F172A", boxShadow: "0 2px 8px rgba(15,23,42,0.25)" }}
          >
            <Download size={13} />
            Export
          </button>
        </div>
      </div>

      {/* ════════ Insight Banner ════════ */}
      <div
        className="rounded-2xl p-5 flex items-center justify-between gap-4 border"
        style={{ background: "#FFFBEB", borderColor: "#FDE68A" }}
      >
        <div className="flex items-start gap-3">
          <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg" style={{ background: "#FDE68A" }}>✨</span>
          <div>
            <p className="text-[13px] font-bold text-[#1A1D26]">
              {activeRate >= 50
                ? `${activeRate}% of your fleet is active and scanning — you're on a roll, keep the momentum going.`
                : `Only ${activeRate}% of your fleet is active. Follow up on pending activations to boost coverage.`}
            </p>
            <p className="text-[11px] font-medium mt-0.5" style={{ color: "#92400E" }}>
              {qrList.length} total stickers · {active} active · {inactive} pending
            </p>
          </div>
        </div>
        <button
          onClick={() => setPage("qr")}
          className="flex-shrink-0 px-4 py-2 rounded-xl text-[12px] font-bold cursor-pointer transition-all hover:opacity-90"
          style={{ background: "#D97706", color: "#fff" }}
        >
          View Fleet
        </button>
      </div>

      {/* ════════ Stat Cards ════════ */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={i}
              className="bg-white rounded-2xl p-5 border transition-all duration-300 hover:shadow-lg hover:shadow-black/[0.04] hover:-translate-y-0.5 cursor-default group"
              style={{ borderColor: "#E8ECF4" }}
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-[12px] font-semibold" style={{ color: "#64748B" }}>{s.label}</span>
                <div
                  className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                  style={{ background: s.bgLight, color: s.color }}
                >
                  <Icon size={16} strokeWidth={2} />
                </div>
              </div>
              <p className="text-[26px] font-black text-[#1A1D26] leading-none tracking-[-0.02em]">
                <AnimatedNumber value={s.value} />
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className="flex items-center gap-0.5 text-[11px] font-bold"
                  style={{ color: s.change.up ? "#22C55E" : "#EF4444" }}
                >
                  {s.change.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {s.change.pct}
                </span>
                <span className="text-[10px] font-medium" style={{ color: "#94A3B8" }}>
                  vs. {s.change.prev.toLocaleString()} last period
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ════════ Charts Row ════════ */}
      <div className="grid grid-cols-12 gap-5">
        {/* ── Area Chart: QR Generation Trend ── */}
        <div
          className="col-span-8 bg-white rounded-2xl p-6 border transition-shadow hover:shadow-lg hover:shadow-black/[0.03]"
          style={{ borderColor: "#E8ECF4" }}
        >
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-[14px] font-extrabold text-[#1A1D26]">QR Generation Trend</h3>
            <button
              onClick={() => setPage("qr")}
              className="flex items-center gap-1 text-[11px] font-bold transition-all hover:gap-2 cursor-pointer px-2.5 py-1 rounded-lg"
              style={{ color: "#D97706" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#FEF3C7"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
            >
              View all <ChevronRight size={11} />
            </button>
          </div>
          <div className="mb-4">
            <span className="text-[28px] font-black text-[#1A1D26] tracking-[-0.02em] leading-none">{totalThisWeek}</span>
            <div className="flex items-center gap-2 mt-1.5">
              <span
                className="flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: qrChange.up ? "#F0FDF4" : "#FEF2F2", color: qrChange.up ? "#22C55E" : "#EF4444" }}
              >
                {qrChange.up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                {qrChange.pct}
              </span>
              <span className="text-[10px] font-medium" style={{ color: "#94A3B8" }}>vs. last period</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D97706" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#D97706" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94A3B8", fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94A3B8", fontWeight: 600 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "#1A1D26", border: "none", borderRadius: 12, color: "#fff",
                  fontSize: 11, padding: "8px 14px", boxShadow: "0 12px 32px rgba(0,0,0,0.2)", fontWeight: 700,
                }}
                cursor={{ stroke: "rgba(99,102,241,0.15)", strokeWidth: 1 }}
              />
              <Area type="monotone" dataKey="v" stroke="#D97706" strokeWidth={2.5} fill="url(#areaGrad)" dot={false}
                activeDot={{ r: 5, fill: "#D97706", stroke: "#fff", strokeWidth: 2.5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ── Bar Chart: Scan Activity ── */}
        <div
          className="col-span-4 bg-white rounded-2xl p-6 border transition-shadow hover:shadow-lg hover:shadow-black/[0.03]"
          style={{ borderColor: "#E8ECF4" }}
        >
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-[14px] font-extrabold text-[#1A1D26]">Scan Activity</h3>
            <button className="w-7 h-7 rounded-lg flex items-center justify-center text-[#94A3B8] hover:bg-[#F1F5F9] transition-all cursor-pointer">
              <MoreHorizontal size={15} />
            </button>
          </div>
          <p className="text-[24px] font-black text-[#1A1D26] tracking-[-0.02em] leading-none mb-4">
            <AnimatedNumber value={peakScan} />
          </p>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={weekdayData} barSize={20} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94A3B8", fontWeight: 600 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: "#1A1D26", border: "none", borderRadius: 12, color: "#fff",
                  fontSize: 11, padding: "8px 14px", boxShadow: "0 12px 32px rgba(0,0,0,0.2)", fontWeight: 700,
                }}
                cursor={false}
              />
              <Bar dataKey="v" radius={[6, 6, 6, 6]}>
                {weekdayData.map((entry, i) => (
                  <Cell key={i} fill={entry.isToday ? "#D97706" : "#E8ECF4"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* Day indicator */}
          <div className="flex justify-between mt-2 px-1">
            {weekdayData.map((d, i) => (
              <div key={i} className="flex flex-col items-center">
                <div
                  className="w-[18px] h-[3px] rounded-full"
                  style={{ background: d.isToday ? "#D97706" : "transparent" }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════ Distribution + Donut Row ════════ */}
      <div className="grid grid-cols-12 gap-5">
        {/* ── Fleet Distribution ── */}
        <div
          className="col-span-8 bg-white rounded-2xl p-6 border transition-shadow hover:shadow-lg hover:shadow-black/[0.03]"
          style={{ borderColor: "#E8ECF4" }}
        >
          <h3 className="text-[14px] font-extrabold text-[#1A1D26] mb-5">Fleet Distribution</h3>
          {/* Segmented Bar */}
          <div className="flex h-[14px] rounded-full overflow-hidden mb-5" style={{ background: "#F1F5F9" }}>
            {fleetSegments.map((seg, i) => (
              <div
                key={i}
                className="h-full transition-all duration-700 first:rounded-l-full last:rounded-r-full"
                style={{ width: `${(seg.count / fleetTotal) * 100}%`, background: seg.color }}
              />
            ))}
          </div>
          {/* Legend */}
          <div className="flex items-center gap-8">
            {fleetSegments.map((seg, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-[10px] h-[10px] rounded-full" style={{ background: seg.color }} />
                <div>
                  <p className="text-[18px] font-black text-[#1A1D26] leading-none tracking-[-0.01em]">
                    <AnimatedNumber value={seg.count} />
                  </p>
                  <p className="text-[11px] font-semibold mt-1" style={{ color: "#94A3B8" }}>{seg.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Active Rate Donut ── */}
        <div
          className="col-span-4 bg-white rounded-2xl p-6 border transition-shadow hover:shadow-lg hover:shadow-black/[0.03] flex flex-col items-center"
          style={{ borderColor: "#E8ECF4" }}
        >
          <div className="flex items-center justify-between w-full mb-3">
            <h3 className="text-[14px] font-extrabold text-[#1A1D26]">Active Rate</h3>
            <button className="w-7 h-7 rounded-lg flex items-center justify-center text-[#94A3B8] hover:bg-[#F1F5F9] transition-all cursor-pointer">
              <MoreHorizontal size={15} />
            </button>
          </div>
          <DonutRing percentage={activeRate} />
          <button
            className="mt-3 text-[11px] font-bold transition-all cursor-pointer"
            style={{ color: "#D97706" }}
            onClick={() => setPage("qr")}
          >
            Show details
          </button>
        </div>
      </div>

      {/* ════════ Table + Quick Actions Row ════════ */}
      <div className="grid grid-cols-12 gap-5">
        {/* ── Recent QR Table ── */}
        <div
          className="col-span-8 bg-white rounded-2xl border overflow-hidden transition-shadow hover:shadow-lg hover:shadow-black/[0.03]"
          style={{ borderColor: "#E8ECF4" }}
        >
          <div className="flex items-center justify-between px-6 py-4">
            <h3 className="text-[14px] font-extrabold text-[#1A1D26]">Recent QR Codes</h3>
            <button
              onClick={() => setPage("qr")}
              className="flex items-center gap-1 text-[11px] font-bold cursor-pointer"
              style={{ color: "#D97706" }}
            >
              See all <ChevronRight size={11} />
            </button>
          </div>
          {qrList.length > 0 ? (
            <table className="w-full text-[12px] text-[#1E293B]">
              <thead>
                <tr
                  className="text-left text-[9px] font-bold uppercase tracking-widest border-t"
                  style={{ borderColor: "#F1F5F9", color: "#94A3B8" }}
                >
                  <th className="px-6 py-2.5">QR</th>
                  <th className="px-3 py-2.5">Code</th>
                  <th className="px-3 py-2.5">Scans</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-6 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {qrList.slice(0, 5).map(q => (
                  <tr
                    key={q.id}
                    className="border-t last:border-0 transition-all duration-200 group/row"
                    style={{ borderColor: "#F1F5F9" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#FAFBFF"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <td className="px-6 py-3">
                      <button onClick={() => openQuickLook(q)} className="hover:opacity-80 transition-opacity cursor-pointer">
                        <StickerThumb qr={q} templates={templates} size={36} />
                      </button>
                    </td>
                    <td className="px-3 py-3 font-mono text-[11px] font-bold" style={{ color: "#0F172A" }}>{q.id}</td>
                    <td className="px-3 py-3 text-[11px] font-bold text-[#1A1D26]">{(q.scans || 0).toLocaleString()}</td>
                    <td className="px-3 py-3"><StatusPill status={q.status} /></td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => openQuickLook(q)}
                          className="w-[26px] h-[26px] rounded-lg flex items-center justify-center transition-all cursor-pointer"
                          style={{ color: "#94A3B8" }}
                          onMouseEnter={e => { e.currentTarget.style.background = "#F1F5F9"; e.currentTarget.style.color = "#1E293B"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94A3B8"; }}
                        >
                          <Eye size={12} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(q)}
                          className="w-[26px] h-[26px] rounded-lg flex items-center justify-center transition-all cursor-pointer"
                          style={{ color: "#94A3B8" }}
                          onMouseEnter={e => { e.currentTarget.style.background = "#FEF2F2"; e.currentTarget.style.color = "#EF4444"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94A3B8"; }}
                          title="Delete QR"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center py-16 text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "#FEF3C7", color: "#D97706" }}
              >
                <QrCode size={24} />
              </div>
              <p className="font-bold text-[#1A1D26] text-[13px]">No QR codes yet</p>
              <p className="text-[11px] mt-1 max-w-xs font-medium" style={{ color: "#94A3B8" }}>Generate your first QR sticker to start tracking your fleet.</p>
              <button
                onClick={() => setPage("qr")}
                className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-[12px] font-bold transition-all hover:opacity-90 cursor-pointer"
                style={{ background: "#0F172A", boxShadow: "0 2px 8px rgba(15,23,42,0.25)" }}
              >
                <Plus size={13} /> Generate First QR
              </button>
            </div>
          )}
        </div>

        {/* ── Quick Actions ── */}
        <div
          className="col-span-4 bg-white rounded-2xl p-5 border flex flex-col gap-2.5 transition-shadow hover:shadow-lg hover:shadow-black/[0.03]"
          style={{ borderColor: "#E8ECF4" }}
        >
          <h3 className="text-[14px] font-extrabold text-[#1A1D26] mb-1">Quick Actions</h3>
          <button
            onClick={() => setPage("qr")}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-white text-[12px] font-bold cursor-pointer transition-all duration-300 hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #0F172A 0%, #334155 100%)", boxShadow: "0 4px 12px rgba(15,23,42,0.3)" }}
          >
            <span className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <QrCode size={15} />
            </span>
            Generate QR Code
          </button>
          <button
            onClick={openRestore}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl border text-[12px] font-semibold transition-all duration-200 cursor-pointer"
            style={{ borderColor: "#E8ECF4", color: "#1E293B" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#FEF9C3"; e.currentTarget.style.borderColor = "#FDE68A"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "#E8ECF4"; }}
          >
            <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#FEF9C3", color: "#EAB308" }}>
              <RefreshCw size={14} />
            </span>
            Restore by ID
          </button>
          <button
            onClick={() => setPage("customize")}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl border text-[12px] font-semibold transition-all duration-200 cursor-pointer"
            style={{ borderColor: "#E8ECF4", color: "#1E293B" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#F5F3FF"; e.currentTarget.style.borderColor = "#DDD6FE"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "#E8ECF4"; }}
          >
            <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#F5F3FF", color: "#8B5CF6" }}>
              <Palette size={14} />
            </span>
            Manage Templates
          </button>
          <button
            onClick={() => setPage("communication")}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl border text-[12px] font-semibold transition-all duration-200 cursor-pointer"
            style={{ borderColor: "#E8ECF4", color: "#1E293B" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#F0FDF4"; e.currentTarget.style.borderColor = "#BBF7D0"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "#E8ECF4"; }}
          >
            <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#F0FDF4", color: "#22C55E" }}>
              <PhoneCall size={14} />
            </span>
            Edit Helplines
          </button>

          {/* AI-style info card at bottom */}
          <div
            className="mt-auto rounded-xl p-4 text-[#1A1D26] relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #EAB308 0%, #D97706 100%)" }}
          >
            <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-20" style={{ background: "#fff" }} />
            <p className="text-[12px] font-bold relative z-10">Need help?</p>
            <p className="text-[10px] font-medium opacity-80 mt-1 relative z-10">Contact support or read our documentation for quick answers.</p>
            <button
              className="mt-3 text-[10px] font-bold px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-all cursor-pointer relative z-10"
            >
              Get Support
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="Delete QR Sticker?"
        message={
          <>
            Are you sure you want to delete <span className="font-bold text-gray-900">{deleteTarget?.id}</span>?
            This cannot be undone.
          </>
        }
        onConfirm={() => {
          if (deleteTarget) {
            setQrList(prev => prev.filter(x => x.id !== deleteTarget.id));
            setToast("QR removed");
            setTimeout(() => setToast(null), 1500);
          }
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

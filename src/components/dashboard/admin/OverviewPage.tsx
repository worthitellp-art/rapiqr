import React, { useMemo, useState } from "react";
import {
  QrCode, ScanLine, Eye, ChevronRight, Trash2, RefreshCw,
  CheckCircle2, Clock,
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, Tooltip, Cell, XAxis, YAxis } from "recharts";
import StatusPill from "./StatusPill";
import StickerThumb from "./StickerThumb";
import { QrRecord, Template } from "./types";
import ConfirmModal from "./ConfirmModal";

/* ─── Metric Card Component ──────────────────────────────────────────── */
function MetricCard({
  count,
  subtitle,
  icon: Icon,
  iconBg = "#006A71",
  iconColor = "#ffffff",
  metrics,
}: {
  title: string;
  count: number | string;
  subtitle: string;
  icon: React.ElementType;
  iconBg?: string;
  iconColor?: string;
  metrics: { label: string; value: string }[];
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
      {/* Top Main Stat */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs"
          style={{ background: iconBg, color: iconColor }}
        >
          <Icon size={20} strokeWidth={2.2} />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-[28px] font-extrabold text-[#0F172A] leading-none">
            {typeof count === "number" ? count.toLocaleString() : count}
          </span>
          <span className="text-[12px] font-semibold text-[#64748B] tracking-tight">
            {subtitle}
          </span>
        </div>
      </div>

      {/* Bottom Mini Metric Breakdown Box */}
      <div className="bg-[#F1F5F9]/80 rounded-xl p-2.5 grid grid-cols-3 gap-2 border border-[#E2E8F0]/60 text-center">
        {metrics.map((m, idx) => (
          <div key={idx} className="flex flex-col items-center">
            <span className="text-[10px] font-semibold text-[#64748B] truncate max-w-full">
              {m.label}
            </span>
            <span className="text-[13px] font-bold text-[#1E293B] mt-0.5">
              {m.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Overview Component ─────────────────────────────────────────── */
export default function OverviewPage({
  qrList,
  setQrList,
  templates,
  setPage,
  openQuickLook,
  setToast,
  openRestore,
}: {
  qrList: QrRecord[];
  setQrList: React.Dispatch<React.SetStateAction<QrRecord[]>>;
  templates: Template[];
  setPage: (p: string) => void;
  openQuickLook: (q: QrRecord) => void;
  setToast: (msg: string | null) => void;
  openRestore: () => void;
}) {
  const totalScans = qrList.reduce((acc, qr) => acc + (qr.scans || 0), 0);
  const activeCount = qrList.filter((qr) => qr.status === "active").length;
  const pendingCount = qrList.length - activeCount;
  const zeroScanCount = qrList.filter((qr) => !qr.scans).length;
  const avgScans = qrList.length > 0 ? (totalScans / qrList.length).toFixed(1) : "0";
  const activationRate = qrList.length > 0 ? Math.round((activeCount / qrList.length) * 100) : 0;
  const [deleteTarget, setDeleteTarget] = useState<QrRecord | null>(null);

  // Real scan counts per sticker, top 10 — no synthetic/random data.
  const topScanned = useMemo(() => {
    return [...qrList]
      .sort((a, b) => (b.scans || 0) - (a.scans || 0))
      .slice(0, 10)
      .map((qr) => ({ id: qr.id, scans: qr.scans || 0, status: qr.status }));
  }, [qrList]);

  return (
    <div
      className="p-7 space-y-6 min-h-full"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#F5F6FA" }}
    >
      {/* ════════ Top Row: 3 KPI Cards (all derived from real fleet data) ════════ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <MetricCard
          title="Stickers"
          count={qrList.length}
          subtitle="Total stickers"
          icon={QrCode}
          iconBg="#006A71"
          metrics={[
            { label: "Active", value: String(activeCount) },
            { label: "Pending", value: String(pendingCount) },
            { label: "Templates", value: String(templates.length) },
          ]}
        />

        <MetricCard
          title="Scans"
          count={totalScans}
          subtitle="Total scans"
          icon={ScanLine}
          iconBg="#0F172A"
          metrics={[
            { label: "Avg/sticker", value: avgScans },
            { label: "Zero scans", value: String(zeroScanCount) },
            { label: "Top sticker", value: String(topScanned[0]?.scans ?? 0) },
          ]}
        />

        <MetricCard
          title="Active"
          count={activeCount}
          subtitle="Active stickers"
          icon={CheckCircle2}
          iconBg="#D97706"
          iconColor="#FFFFFF"
          metrics={[
            { label: "Pending", value: String(pendingCount) },
            { label: "Activation", value: `${activationRate}%` },
            { label: "Fleet size", value: String(qrList.length) },
          ]}
        />
      </div>

      {/* ════════ Scans per Sticker (real data, top 10) ════════ */}
      <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-[15px] font-extrabold text-[#0F172A]">Top scanned stickers</h3>
            <p className="text-[11px] font-semibold text-[#64748B] mt-0.5">
              Scan counts for your {topScanned.length > 0 ? "highest-traffic" : ""} stickers
            </p>
          </div>
        </div>

        {topScanned.length > 0 ? (
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topScanned} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis
                  dataKey="id"
                  tick={{ fontSize: 10, fill: "#94A3B8", fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#94A3B8", fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: "#F1F5F9" }}
                  contentStyle={{ borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 12 }}
                />
                <Bar dataKey="scans" radius={[4, 4, 0, 0]} barSize={24}>
                  {topScanned.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.status === "active" ? "#006A71" : "#D97706"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex flex-col items-center py-10 text-center">
            <Clock size={22} className="text-[#94A3B8] mb-2" />
            <p className="text-[12px] font-semibold text-[#64748B]">No scan activity yet</p>
          </div>
        )}
      </div>

      {/* ════════ Bottom Section: Fleet Table & Quick Actions ════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Recent QR Codes Fleet Table */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1F5F9]">
            <div>
              <h3 className="text-[14px] font-extrabold text-[#0F172A]">Recent Fleet Stickers</h3>
              <p className="text-[11px] font-semibold text-[#64748B] mt-0.5">
                Active QR codes, scan logs & safety statuses
              </p>
            </div>
            <button
              onClick={() => setPage("qr")}
              className="flex items-center gap-1 text-[12px] font-bold text-[#006A71] hover:underline cursor-pointer"
            >
              View fleet <ChevronRight size={13} />
            </button>
          </div>

          {qrList.length > 0 ? (
            <table className="w-full text-[12px] text-[#1E293B]">
              <thead>
                <tr className="text-left text-[10px] font-bold uppercase tracking-wider bg-[#F8FAFC] text-[#64748B] border-b border-[#E2E8F0]">
                  <th className="px-6 py-3">Sticker</th>
                  <th className="px-4 py-3">Tag ID</th>
                  <th className="px-4 py-3">Scans</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {qrList.slice(0, 5).map((qr) => (
                  <tr key={qr.id} className="hover:bg-[#F8FAFC] transition-colors group">
                    <td className="px-6 py-3">
                      <button onClick={() => openQuickLook(qr)} className="cursor-pointer">
                        <StickerThumb qr={qr} templates={templates} size={36} />
                      </button>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-[#0F172A]">{qr.id}</td>
                    <td className="px-4 py-3 font-bold text-[#334155]">{(qr.scans || 0).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <StatusPill status={qr.status} />
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openQuickLook(qr)}
                          className="p-1.5 rounded-lg text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#0F172A] transition-colors cursor-pointer"
                          title="Quick preview"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(qr)}
                          className="p-1.5 rounded-lg text-[#64748B] hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                          title="Delete sticker"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-[#006A71]/10 text-[#006A71] flex items-center justify-center mb-3">
                <QrCode size={22} />
              </div>
              <p className="font-bold text-[#0F172A] text-[13px]">No stickers generated yet</p>
              <p className="text-[11px] text-[#64748B] mt-1 max-w-xs font-medium">
                Create your first QR sticker to populate your fleet dashboard.
              </p>
              <button
                onClick={() => setPage("qr")}
                className="mt-4 px-4 py-2 rounded-xl bg-[#006A71] text-white text-[12px] font-bold shadow-sm hover:bg-[#005C66] transition-colors cursor-pointer"
              >
                Generate QR Tag
              </button>
            </div>
          )}
        </div>

        {/* Quick Action Shortcuts Panel */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm flex flex-col justify-between gap-3">
          <h4 className="text-[14px] font-extrabold text-[#0F172A]">Quick Actions</h4>

          <button
            onClick={() => setPage("qr")}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#006A71] text-white text-[12px] font-bold hover:bg-[#005C66] transition-all cursor-pointer shadow-sm"
          >
            <span className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <QrCode size={16} />
            </span>
            Generate QR Sticker
          </button>

          <button
            onClick={openRestore}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-[#E2E8F0] text-[#1E293B] text-[12px] font-semibold hover:bg-[#F8FAFC] transition-all cursor-pointer"
          >
            <span className="w-8 h-8 rounded-lg bg-[#EAB308]/15 text-[#D97706] flex items-center justify-center shrink-0">
              <RefreshCw size={15} />
            </span>
            Restore Sticker by Tag ID
          </button>

          <button
            onClick={() => setPage("customize")}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-[#E2E8F0] text-[#1E293B] text-[12px] font-semibold hover:bg-[#F8FAFC] transition-all cursor-pointer"
          >
            <span className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
              <ScanLine size={15} />
            </span>
            Customize Sticker Templates
          </button>

          <div className="mt-2 p-3.5 rounded-xl bg-gradient-to-br from-[#006A71] to-[#004D54] text-white space-y-1">
            <p className="text-[12px] font-extrabold">Safety Tag Helpline Support</p>
            <p className="text-[10px] text-teal-100/90 font-medium">
              Need to connect emergency response services to your fleet?
            </p>
            <button
              onClick={() => setPage("communication")}
              className="mt-2 px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-[10px] font-bold transition-colors cursor-pointer"
            >
              Manage Helplines
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
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
            setQrList((prev) => prev.filter((x) => x.id !== deleteTarget.id));
            setToast("QR sticker removed");
            setTimeout(() => setToast(null), 1500);
          }
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

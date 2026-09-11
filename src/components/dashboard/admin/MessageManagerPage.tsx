import type React from "react";
import { useEffect, useState, useCallback } from "react";
import { Send, CheckCircle2, XCircle, FlaskConical, MessageSquareText, RefreshCcw } from "lucide-react";
import { apiClient } from "../../../lib/apiClient";

type MessageStats = { total: number; sent: number; failed: number; simulated: number; sms: number; whatsapp: number; last24h: number };

type MessageRow = {
  id: string;
  created_at: string;
  channel: "sms" | "whatsapp";
  to_number: string | null;
  event: string | null;
  status: "sent" | "failed" | "simulated";
  provider_sid: string | null;
  error: string | null;
  body_preview: string | null;
};

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  sent: { label: "Sent", color: "#16A34A", bg: "#F0FDF4", icon: <CheckCircle2 size={12} /> },
  failed: { label: "Failed", color: "#EF4444", bg: "#FEF2F2", icon: <XCircle size={12} /> },
  simulated: { label: "Simulated", color: "#B54708", bg: "#FEF6E7", icon: <FlaskConical size={12} /> },
};

function StatTile({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
  return (
    <div className="bg-white border border-[#E5E7EB] p-4 rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
      <p className="text-[10px] font-extrabold text-[#71717A] uppercase tracking-wider mb-1.5">{label}</p>
      <p className="text-2xl font-display font-bold" style={{ color: accent || "#18181B" }}>{value}</p>
    </div>
  );
}

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

export default function MessageManagerPage() {
  const [stats, setStats] = useState<MessageStats | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [channelFilter, setChannelFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    apiClient.admin.getMessageStats().then((res) => {
      if (res.success) setStats(res.data);
    }).catch(() => { /* table may not be provisioned yet */ });

    apiClient.admin.getMessages({
      limit: 150,
      status: statusFilter !== "ALL" ? statusFilter : undefined,
      channel: channelFilter !== "ALL" ? channelFilter : undefined,
    }).then((res) => {
      if (res.success) setMessages(res.data);
    }).catch(() => { /* table may not be provisioned yet */ })
      .finally(() => setLoading(false));
  }, [statusFilter, channelFilter]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  const successRate = stats && stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : null;

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7 pb-16 space-y-6 sm:space-y-7 text-[#18181B] font-body" style={{ background: "#F8F8F7" }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-display font-semibold text-[#18181B] text-[14px] flex items-center gap-2">
            <Send size={15} className="text-[#EAB308]" /> Message Manager
          </h3>
          <p className="text-[11px] text-[#71717A] mt-1">Every SMS &amp; WhatsApp send attempted via Twilio — alerts, phone verification, and sticker activation OTPs.</p>
        </div>
        <button
          onClick={load}
          className="self-start inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-[#E5E7EB] text-[12px] font-semibold text-[#18181B] hover:bg-[#F4F4F5] transition-all cursor-pointer flex-shrink-0"
        >
          <RefreshCcw size={13} /> Refresh
        </button>
      </div>

      {/* ── Stat Tiles ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <StatTile label="Total Sends" value={stats?.total ?? "—"} />
        <StatTile label="Sent OK" value={stats?.sent ?? "—"} accent="#16A34A" />
        <StatTile label="Failed" value={stats?.failed ?? "—"} accent="#EF4444" />
        <StatTile label="Simulated" value={stats?.simulated ?? "—"} accent="#B54708" />
        <StatTile label="SMS" value={stats?.sms ?? "—"} />
        <StatTile label="WhatsApp" value={stats?.whatsapp ?? "—"} />
        <StatTile label="Success Rate" value={successRate !== null ? `${successRate}%` : "—"} accent="#F5C518" />
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-2">
        {["ALL", "sent", "failed", "simulated"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
              statusFilter === s ? "bg-[#F5C518] text-[#18181B]" : "bg-white border border-[#E5E7EB] text-[#71717A] hover:text-[#18181B]"
            }`}
          >
            {s === "ALL" ? "All Statuses" : STATUS_META[s]?.label || s}
          </button>
        ))}
        <span className="w-px h-4 bg-[#E5E7EB] mx-1" />
        {["ALL", "sms", "whatsapp"].map((c) => (
          <button
            key={c}
            onClick={() => setChannelFilter(c)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
              channelFilter === c ? "bg-[#F5C518] text-[#18181B]" : "bg-white border border-[#E5E7EB] text-[#71717A] hover:text-[#18181B]"
            }`}
          >
            {c === "ALL" ? "All Channels" : c.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ── Message Log Table ── */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.05)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[10px] font-extrabold text-[#71717A] uppercase tracking-wider">
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Channel</th>
                <th className="text-left px-4 py-3">To</th>
                <th className="text-left px-4 py-3">Event</th>
                <th className="text-left px-4 py-3">Message</th>
                <th className="text-left px-4 py-3">When</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((m) => {
                const meta = STATUS_META[m.status] || STATUS_META.failed;
                return (
                  <tr key={m.id} className="border-b border-[#F0F0F1] last:border-0 hover:bg-[#FCFCFD] align-top">
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold"
                        style={{ color: meta.color, background: meta.bg }}
                      >
                        {meta.icon} {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12px] font-semibold text-[#18181B] uppercase">{m.channel}</td>
                    <td className="px-4 py-3 text-[12px] font-mono text-[#18181B]">{m.to_number || "—"}</td>
                    <td className="px-4 py-3 text-[11px] text-[#71717A]">{m.event || "—"}</td>
                    <td className="px-4 py-3 text-[11px] text-[#71717A] max-w-xs truncate" title={m.error || m.body_preview || ""}>
                      {m.status === "failed" ? (m.error || "Unknown error") : (m.body_preview || "—")}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-[#71717A] whitespace-nowrap">{formatWhen(m.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!loading && messages.length === 0 && (
          <div className="py-16 flex flex-col items-center justify-center text-center px-6">
            <MessageSquareText size={28} className="text-[#C9CACC] mb-3" />
            <p className="text-[13px] font-semibold text-[#18181B]">No messages logged yet</p>
            <p className="text-[11px] text-[#71717A] mt-1 max-w-sm">
              Sends will appear here once an alert, phone verification, or sticker activation OTP goes out.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

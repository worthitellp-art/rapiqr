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
  sent: { label: "Sent", color: "#2E9E5B", bg: "#E9F9EF", icon: <CheckCircle2 size={12} /> },
  failed: { label: "Failed", color: "#DC2626", bg: "#FDEAEA", icon: <XCircle size={12} /> },
  simulated: { label: "Simulated", color: "#B8863F", bg: "#FBF3E4", icon: <FlaskConical size={12} /> },
};

function StatTile({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
  return (
    <div className="bg-white border border-[#E5E5E7] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
      <p className="text-[10px] font-extrabold text-[#777B80] uppercase tracking-wider mb-1.5">{label}</p>
      <p className="text-2xl font-display font-bold" style={{ color: accent || "#17181A" }}>{value}</p>
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
    <div className="px-8 pt-7 pb-16 space-y-7 text-[#17181A] font-body" style={{ background: "#F7F7F8" }}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-semibold text-[#17181A] text-[14px] flex items-center gap-2">
            <Send size={15} className="text-[#5C78DF]" /> Message Manager
          </h3>
          <p className="text-[11px] text-[#777B80] mt-1">Every SMS &amp; WhatsApp send attempted via Twilio — alerts, phone verification, and sticker activation OTPs.</p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[4px] bg-white border border-[#E5E5E7] text-[12px] font-semibold text-[#17181A] hover:bg-[#F3F3F4] transition-all cursor-pointer"
        >
          <RefreshCcw size={13} /> Refresh
        </button>
      </div>

      {/* ── Stat Tiles ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <StatTile label="Total Sends" value={stats?.total ?? "—"} />
        <StatTile label="Sent OK" value={stats?.sent ?? "—"} accent="#2E9E5B" />
        <StatTile label="Failed" value={stats?.failed ?? "—"} accent="#DC2626" />
        <StatTile label="Simulated" value={stats?.simulated ?? "—"} accent="#B8863F" />
        <StatTile label="SMS" value={stats?.sms ?? "—"} />
        <StatTile label="WhatsApp" value={stats?.whatsapp ?? "—"} />
        <StatTile label="Success Rate" value={successRate !== null ? `${successRate}%` : "—"} accent="#5C78DF" />
      </div>

      {/* ── Filters ── */}
      <div className="flex items-center gap-2">
        {["ALL", "sent", "failed", "simulated"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
              statusFilter === s ? "bg-[#17181A] text-white" : "bg-white border border-[#E5E5E7] text-[#777B80] hover:text-[#17181A]"
            }`}
          >
            {s === "ALL" ? "All Statuses" : STATUS_META[s]?.label || s}
          </button>
        ))}
        <span className="w-px h-4 bg-[#E5E5E7] mx-1" />
        {["ALL", "sms", "whatsapp"].map((c) => (
          <button
            key={c}
            onClick={() => setChannelFilter(c)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
              channelFilter === c ? "bg-[#17181A] text-white" : "bg-white border border-[#E5E5E7] text-[#777B80] hover:text-[#17181A]"
            }`}
          >
            {c === "ALL" ? "All Channels" : c.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ── Message Log Table ── */}
      <div className="bg-white border border-[#E5E5E7] shadow-[0_1px_4px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E5E7] text-[10px] font-extrabold text-[#777B80] uppercase tracking-wider">
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
                  <tr key={m.id} className="border-b border-[#F0F0F1] last:border-0 hover:bg-[#FAFAFB] align-top">
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-[4px] text-[10px] font-bold"
                        style={{ color: meta.color, background: meta.bg }}
                      >
                        {meta.icon} {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12px] font-semibold text-[#17181A] uppercase">{m.channel}</td>
                    <td className="px-4 py-3 text-[12px] font-mono text-[#17181A]">{m.to_number || "—"}</td>
                    <td className="px-4 py-3 text-[11px] text-[#777B80]">{m.event || "—"}</td>
                    <td className="px-4 py-3 text-[11px] text-[#777B80] max-w-xs truncate" title={m.error || m.body_preview || ""}>
                      {m.status === "failed" ? (m.error || "Unknown error") : (m.body_preview || "—")}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-[#777B80] whitespace-nowrap">{formatWhen(m.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!loading && messages.length === 0 && (
          <div className="py-16 flex flex-col items-center justify-center text-center px-6">
            <MessageSquareText size={28} className="text-[#C9CACC] mb-3" />
            <p className="text-[13px] font-semibold text-[#17181A]">No messages logged yet</p>
            <p className="text-[11px] text-[#777B80] mt-1 max-w-sm">
              Sends will appear here once an alert, phone verification, or sticker activation OTP goes out. If this stays empty after a real send, the <code className="font-mono bg-[#F3F3F4] px-1 rounded">messages</code> table may not be provisioned in Supabase yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

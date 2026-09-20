import type React from "react";
import { useEffect, useState, useCallback } from "react";
import { Send, CheckCircle2, XCircle, FlaskConical, MessageSquareText, RefreshCcw, Trash2, AlertTriangle, PhoneCall, ShieldCheck } from "lucide-react";
import { apiClient } from "../../../lib/apiClient";
import { sendMsg91Otp, verifyMsg91Otp, retryMsg91Otp, toMsg91Identifier } from "../../../lib/msg91Widget";

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
    <div className="bg-white border border-[var(--fx-border)] p-4 rounded-xl shadow-xs">
      <p className="text-[10px] font-extrabold text-[var(--fx-ink-2)] uppercase tracking-wider mb-1.5">{label}</p>
      <p className="text-2xl font-display font-bold text-[var(--fx-ink)]" style={{ color: accent }}>{value}</p>
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
  const [deleting, setDeleting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Live OTP widget test — drives the real MSG91 widget (src/lib/msg91Widget.ts)
  // directly in the browser so an admin can confirm the widget config actually
  // sends/verifies against MSG91, independent of any QR activation flow.
  const [testPhone, setTestPhone] = useState("");
  const [testOtp, setTestOtp] = useState("");
  const [testStep, setTestStep] = useState<"idle" | "sent" | "verified">("idle");
  const [testSending, setTestSending] = useState(false);
  const [testVerifying, setTestVerifying] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  const [testToken, setTestToken] = useState<string | null>(null);
  const [testResendCountdown, setTestResendCountdown] = useState(0);

  useEffect(() => {
    if (testResendCountdown <= 0) return;
    const timer = setInterval(() => setTestResendCountdown((c) => (c > 1 ? c - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [testResendCountdown]);

  function isValidTestPhone(phone: string) {
    return /^\d{10}$/.test(phone.replace(/\D/g, ""));
  }

  const handleTestSendOtp = async () => {
    if (testSending) return;
    setTestError(null);
    if (!isValidTestPhone(testPhone)) {
      setTestError("Enter a valid 10-digit mobile number.");
      return;
    }
    setTestSending(true);
    try {
      await sendMsg91Otp(toMsg91Identifier(testPhone));
      setTestOtp("");
      setTestToken(null);
      setTestStep("sent");
      setTestResendCountdown(30);
    } catch (err: any) {
      setTestError(err?.message || "Failed to send the test OTP.");
    } finally {
      setTestSending(false);
    }
  };

  const handleTestResendOtp = async () => {
    if (testResendCountdown > 0 || testSending) return;
    setTestError(null);
    try {
      await retryMsg91Otp();
      setTestResendCountdown(30);
    } catch (err: any) {
      setTestError(err?.message || "Failed to resend the test OTP.");
    }
  };

  const handleTestVerifyOtp = async () => {
    if (testVerifying) return;
    setTestError(null);
    if (!testOtp.trim()) {
      setTestError("Enter the code you received.");
      return;
    }
    setTestVerifying(true);
    try {
      const token = await verifyMsg91Otp(testOtp.trim());
      setTestToken(token);
      setTestStep("verified");
    } catch (err: any) {
      setTestError(err?.message || "Incorrect code — please try again.");
    } finally {
      setTestVerifying(false);
    }
  };

  const handleTestReset = () => {
    setTestStep("idle");
    setTestOtp("");
    setTestToken(null);
    setTestError(null);
  };

  const load = useCallback(() => {
    setLoading(true);
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

  const handleDeleteAll = async () => {
    setDeleting(true);
    try {
      const res = await apiClient.admin.deleteAllMessages();
      if (res.success) {
        setMessages([]);
        setStats({ total: 0, sent: 0, failed: 0, simulated: 0, sms: 0, whatsapp: 0, last24h: 0 });
        setShowConfirmModal(false);
        setToastMessage("All messages have been successfully deleted.");
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err: any) {
      alert(err?.message || "Failed to delete messages");
    } finally {
      setDeleting(false);
    }
  };

  const successRate = stats && stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : null;

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7 pb-16 space-y-6 sm:space-y-7 text-[var(--fx-ink)] font-body bg-[var(--fx-canvas)]/50 min-h-screen">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-[var(--fx-accent)] text-white px-4 py-3 rounded-xl shadow-xl text-xs font-bold animate-fade-in">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[var(--fx-border)] p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-black text-[var(--fx-ink)] font-display">Delete All Messages?</h3>
              <p className="text-xs text-[var(--fx-ink-2)] leading-relaxed max-w-xs mx-auto">
                This will permanently delete all SMS and WhatsApp delivery records from the system. This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={deleting}
                className="w-1/2 py-2.5 rounded-xl border border-[var(--fx-border)] text-xs font-bold text-[var(--fx-ink-2)] hover:bg-[var(--fx-canvas)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAll}
                disabled={deleting}
                className="w-1/2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
              >
                {deleting ? "Deleting..." : "Yes, Delete All"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-display font-bold text-[var(--fx-ink)] text-base sm:text-lg flex items-center gap-2">
            <Send size={18} className="text-[var(--fx-ink-2)]" /> Message Manager
          </h3>
          <p className="text-xs text-[var(--fx-ink-2)] mt-1">Every SMS &amp; WhatsApp send attempted via Twilio — alerts, phone verification, and sticker activation OTPs.</p>
        </div>
        <div className="flex items-center gap-2 self-start flex-wrap">
          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            disabled={messages.length === 0 || deleting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 size={13} /> Delete All Messages
          </button>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[var(--fx-border)] text-xs font-bold text-[var(--fx-ink-2)] hover:bg-[var(--fx-canvas)] transition-all cursor-pointer shadow-xs flex-shrink-0"
          >
            <RefreshCcw size={13} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Live OTP Widget Test ── */}
      <div className="bg-white border border-[var(--fx-border)] rounded-2xl shadow-xs p-4 sm:p-5 space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h4 className="font-display font-bold text-[var(--fx-ink)] text-sm flex items-center gap-2">
              <PhoneCall size={15} className="text-[var(--fx-ink-2)]" /> Test OTP Widget (Live)
            </h4>
            <p className="text-xs text-[var(--fx-ink-2)] mt-1 max-w-lg">
              Sends a real OTP via the MSG91 widget to the number below, exactly like the activation flow. No sticker or account is touched.
            </p>
          </div>
          {testStep !== "idle" && (
            <button
              type="button"
              onClick={handleTestReset}
              className="text-xs font-bold text-[var(--fx-ink-2)] hover:text-[var(--fx-ink)] underline underline-offset-2 cursor-pointer"
            >
              Start over
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-start">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="px-3 py-2.5 rounded-xl bg-[var(--fx-canvas)] border border-[var(--fx-border)] text-xs font-bold text-[var(--fx-ink-2)]">+91</span>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="10-digit mobile number"
              value={testPhone}
              disabled={testStep !== "idle"}
              onChange={(e) => setTestPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              className="flex-1 sm:w-56 px-3.5 py-2.5 rounded-xl border border-[var(--fx-border)] text-sm font-medium disabled:bg-[var(--fx-canvas)]/60 disabled:text-[var(--fx-ink-2)] focus:outline-none focus:ring-2 focus:ring-[var(--fx-accent)]/30"
            />
          </div>

          {testStep === "idle" && (
            <button
              type="button"
              onClick={handleTestSendOtp}
              disabled={testSending}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--fx-accent)] text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Send size={13} /> {testSending ? "Sending…" : "Send Test OTP"}
            </button>
          )}

          {(testStep === "sent" || testStep === "verified") && (
            <>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Enter code"
                value={testOtp}
                disabled={testStep === "verified"}
                onChange={(e) => setTestOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full sm:w-36 px-3.5 py-2.5 rounded-xl border border-[var(--fx-border)] text-sm font-medium disabled:bg-[var(--fx-canvas)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--fx-accent)]/30"
              />
              {testStep === "sent" && (
                <>
                  <button
                    type="button"
                    onClick={handleTestVerifyOtp}
                    disabled={testVerifying}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--fx-ink)] text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <ShieldCheck size={13} /> {testVerifying ? "Verifying…" : "Verify"}
                  </button>
                  <button
                    type="button"
                    onClick={handleTestResendOtp}
                    disabled={testResendCountdown > 0 || testSending}
                    className="text-xs font-bold text-[var(--fx-accent)] hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer disabled:cursor-not-allowed"
                  >
                    {testResendCountdown > 0 ? `Resend in ${testResendCountdown}s` : "Resend"}
                  </button>
                </>
              )}
            </>
          )}
        </div>

        {testError && (
          <div className="flex items-start gap-2 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
            <XCircle size={14} className="mt-0.5 flex-shrink-0" /> {testError}
          </div>
        )}

        {testStep === "sent" && !testError && (
          <div className="flex items-start gap-2 text-xs font-semibold text-[#B54708] bg-[#FEF6E7] border border-[#FBE5B8] rounded-xl px-3.5 py-2.5">
            <FlaskConical size={14} className="mt-0.5 flex-shrink-0" /> Code sent to +91{testPhone}. Check the Message Manager log below once it lands.
          </div>
        )}

        {testStep === "verified" && testToken && (
          <div className="flex items-start gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5">
            <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" />
            Widget verified successfully — access token received (<span className="font-mono">{testToken.slice(0, 16)}…</span>). MSG91 send/verify is working live.
          </div>
        )}
      </div>

      {/* ── Stat Tiles ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <StatTile label="Total Sends" value={stats?.total ?? "—"} />
        <StatTile label="Sent OK" value={stats?.sent ?? "—"} accent="#16A34A" />
        <StatTile label="Failed" value={stats?.failed ?? "—"} accent="#EF4444" />
        <StatTile label="Simulated" value={stats?.simulated ?? "—"} accent="#B54708" />
        <StatTile label="SMS" value={stats?.sms ?? "—"} />
        <StatTile label="WhatsApp" value={stats?.whatsapp ?? "—"} />
        <StatTile label="Success Rate" value={successRate !== null ? `${successRate}%` : "—"} accent="var(--fx-accent)" />
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-2">
        {["ALL", "sent", "failed", "simulated"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              statusFilter === s ? "bg-[var(--fx-accent)] text-white shadow-xs" : "bg-white border border-[var(--fx-border)] text-[var(--fx-ink-2)] hover:text-[var(--fx-ink)] hover:border-[var(--fx-border-strong)]"
            }`}
          >
            {s === "ALL" ? "All Statuses" : STATUS_META[s]?.label || s}
          </button>
        ))}
        <span className="w-px h-4 bg-[var(--fx-border-strong)] mx-1" />
        {["ALL", "sms", "whatsapp"].map((c) => (
          <button
            key={c}
            onClick={() => setChannelFilter(c)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              channelFilter === c ? "bg-[var(--fx-accent)] text-white shadow-xs" : "bg-white border border-[var(--fx-border)] text-[var(--fx-ink-2)] hover:text-[var(--fx-ink)] hover:border-[var(--fx-border-strong)]"
            }`}
          >
            {c === "ALL" ? "All Channels" : c.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ── Message Log Table ── */}
      <div className="bg-white border border-[var(--fx-border)] rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-[var(--fx-border)] bg-[var(--fx-canvas)]/80 text-[11px] font-extrabold text-[var(--fx-ink-2)] uppercase tracking-wider">
                <th className="text-left px-4 py-3.5">Status</th>
                <th className="text-left px-4 py-3.5">Channel</th>
                <th className="text-left px-4 py-3.5">To</th>
                <th className="text-left px-4 py-3.5">Event</th>
                <th className="text-left px-4 py-3.5">Message</th>
                <th className="text-left px-4 py-3.5">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--fx-border)]">
              {messages.map((m) => {
                const meta = STATUS_META[m.status] || STATUS_META.failed;
                return (
                  <tr key={m.id} className="hover:bg-[var(--fx-canvas)]/80 transition-colors align-top">
                    <td className="px-4 py-3.5">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold"
                        style={{ color: meta.color, background: meta.bg }}
                      >
                        {meta.icon} {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs font-bold text-[var(--fx-ink)] uppercase">{m.channel}</td>
                    <td className="px-4 py-3.5 text-xs font-mono font-medium text-[var(--fx-ink)]">{m.to_number || "—"}</td>
                    <td className="px-4 py-3.5 text-xs font-medium text-[var(--fx-ink-2)]">{m.event || "—"}</td>
                    <td className="px-4 py-3.5 text-xs text-[var(--fx-ink-2)] max-w-xs break-words" title={m.error || m.body_preview || ""}>
                      {m.status === "failed" ? (
                        <span className="text-red-600 font-semibold">{m.error || "Unknown error"}</span>
                      ) : (
                        <span>{m.body_preview || "—"}</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-[var(--fx-ink-2)] font-medium whitespace-nowrap">{formatWhen(m.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!loading && messages.length === 0 && (
          <div className="py-16 flex flex-col items-center justify-center text-center px-6">
            <div className="w-12 h-12 rounded-2xl bg-[var(--fx-canvas)] flex items-center justify-center text-[var(--fx-faint)] mb-3">
              <MessageSquareText size={24} />
            </div>
            <p className="text-sm font-bold text-[var(--fx-ink)]">No messages logged yet</p>
            <p className="text-xs text-[var(--fx-ink-2)] mt-1 max-w-sm leading-relaxed">
              Sends will appear here once an alert, phone verification, or sticker activation OTP goes out.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

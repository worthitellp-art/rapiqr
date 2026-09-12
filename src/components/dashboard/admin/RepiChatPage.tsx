import type React from "react";
import { useState, useEffect, useCallback } from "react";
import { MessageCircle, Search, Trash2 } from "lucide-react";
import { apiClient, type ChatSession } from "../../../lib/apiClient";
import RepiChat from "../../chat/RepiChat";
import { connectAsOwner } from "../../../lib/socketClient";
import { soundNotification } from "../../../utils/soundNotification";
import { recallOwnerThread, rememberOwnerThread } from "../../../lib/chatStorage";
import ConfirmModal from "./ConfirmModal";

function timeAgo(iso: string | null) {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function RepiChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  // Reopen whichever conversation was on screen before the last reload.
  const [selectedId, setSelectedId] = useState<string | null>(() => recallOwnerThread());
  const [loading, setLoading] = useState(true);

  const openThread = (id: string | null) => {
    setSelectedId(id);
    rememberOwnerThread(id);
  };

  const loadSessions = useCallback(async () => {
    const res = await apiClient.chat.listOwnerSessions().catch(() => null);
    if (res?.success) setSessions(res.data);
    setLoading(false);
  }, []);

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const handleDeleteSession = (e: React.MouseEvent, sessId: string) => {
    e.stopPropagation();
    setDeleteTargetId(sessId);
  };

  const confirmDeleteSession = async () => {
    const sessId = deleteTargetId;
    if (!sessId) return;
    try {
      const res = await apiClient.chat.deleteSession(sessId);
      if (res?.success) {
        setSessions((prev) => prev.filter((s) => s.id !== sessId));
        if (selectedId === sessId) openThread(null);
      }
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    loadSessions();
    const token = localStorage.getItem("repiqr-token") || localStorage.getItem("namoqr-token") || "";
    const socket = connectAsOwner(token);
    const onNewMsg = (msg: any) => {
      if (msg.sender_type === "customer") {
        soundNotification.playMessageChime();
        soundNotification.showBrowserNotification("New Chat Message", msg.body || "New visitor message");
        loadSessions();
      }
    };
    socket.on("new_message", onNewMsg);
    socket.on("inbox_updated", loadSessions);

    const timer = setInterval(loadSessions, 15000);
    return () => {
      clearInterval(timer);
      socket.off("new_message", onNewMsg);
      socket.off("inbox_updated", loadSessions);
    };
  }, [loadSessions]);

  const filtered = sessions.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.customer_name.toLowerCase().includes(q) ||
      (s.vehicle_label || "").toLowerCase().includes(q) ||
      (s.last_message_preview || "").toLowerCase().includes(q)
    );
  });

  const selected = sessions.find((s) => s.id === selectedId) || null;
  const totalUnread = sessions.reduce((sum, s) => sum + (s.unread_owner_count || 0), 0);

  // The split pane and the phone takeover are different places in the DOM, so
  // the breakpoint has to be resolved in JS rather than with `lg:hidden` —
  // mounting both would open two live subscriptions to the same thread and
  // chime twice on every incoming message.
  const [isWide, setIsWide] = useState(() => window.matchMedia("(min-width: 1024px)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = (e: MediaQueryListEvent) => setIsWide(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // The phone takeover covers the page, which must not scroll underneath it.
  useEffect(() => {
    if (!selected || isWide) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [selected, isWide]);

  const threadProps = selected && {
    mode: "owner" as const,
    sessionId: selected.id,
    title: selected.customer_name,
    subtitle: selected.vehicle_label || undefined,
  };

  return (
    <div
      className="px-3 sm:px-6 lg:px-8 pt-4 sm:pt-7 pb-16 space-y-5 sm:space-y-7 text-[var(--fx-ink)] font-body"
      style={{ background: "var(--fx-canvas)" }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="font-display text-[20px] sm:text-[24px] font-semibold text-[var(--fx-ink)] flex items-center gap-2">
            <MessageCircle className="text-[var(--fx-accent)]" size={24} />
            RepiChat
          </h1>
          <p className="text-[12.5px] sm:text-[13.5px] text-[var(--fx-ink-2)] mt-1">
            Real-time conversations with visitors who scanned your stickers.
          </p>
        </div>
        {totalUnread > 0 && (
          <div className="self-start px-3.5 py-2 rounded-[4px] bg-[var(--fx-accent-soft)] border border-[var(--fx-accent)]/20 text-[var(--fx-accent-ink)] text-xs font-bold flex items-center gap-2">
            <span>{totalUnread} unread</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
        {/* Conversation list — the whole page below lg, the left rail above it */}
        <div className="lg:col-span-4 space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--fx-faint)]" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-[13px] rounded-full border-0 bg-[var(--fx-canvas)] text-[var(--fx-ink)] placeholder-[var(--fx-faint)] outline-none transition-all focus:ring-2 focus:ring-[var(--fx-accent)]/25"
            />
          </div>

          <div className="bg-white border border-[var(--fx-border)] shadow-[0_1px_4px_rgba(0,0,0,0.03)] divide-y divide-[var(--fx-border)] lg:max-h-[32rem] lg:overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-xs text-[var(--fx-faint)] font-medium">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-[4px] bg-[var(--fx-accent-soft)] text-[var(--fx-accent-ink)] flex items-center justify-center mx-auto mb-3">
                  <MessageCircle size={22} />
                </div>
                <p className="text-xs font-bold text-[var(--fx-ink)]">No conversations yet</p>
                <p className="text-[11px] text-[var(--fx-ink-2)] mt-1">Chats started from a sticker scan will show up here.</p>
              </div>
            ) : (
              filtered.map((s) => (
                <div
                  key={s.id}
                  onClick={() => openThread(s.id)}
                  className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                    selectedId === s.id ? "lg:bg-[var(--fx-accent-soft)]" : "hover:bg-[var(--fx-canvas)] active:bg-[var(--fx-canvas)]"
                  }`}
                >
                  <div className="w-10 h-10 rounded-[4px] bg-[var(--fx-accent-soft)] text-[var(--fx-accent-ink)] flex items-center justify-center font-black text-[13px] shrink-0">
                    {s.customer_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[13px] font-bold text-[var(--fx-ink)] truncate">{s.customer_name}</p>
                      <span className="text-[10px] font-mono text-[var(--fx-faint)] shrink-0">{timeAgo(s.last_message_at)}</span>
                    </div>
                    {s.vehicle_label && <p className="text-[10.5px] text-[var(--fx-faint)] truncate">{s.vehicle_label}</p>}
                    <p
                      className={`text-[11.5px] truncate mt-0.5 ${
                        s.unread_owner_count > 0 ? "text-[var(--fx-ink)] font-semibold" : "text-[var(--fx-ink-2)]"
                      }`}
                    >
                      {s.last_message_preview || "No messages yet"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                    {s.unread_owner_count > 0 && (
                      <span className="text-[10px] font-bold bg-[var(--fx-accent)] text-white rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center">
                        {s.unread_owner_count}
                      </span>
                    )}
                    <button
                      onClick={(e) => handleDeleteSession(e, s.id)}
                      title="Delete conversation"
                      aria-label="Delete conversation"
                      className="p-1.5 text-[var(--fx-faint)] hover:text-[#DC2626] hover:bg-[#FEE2E2] rounded transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active thread — desktop split pane */}
        <div className="hidden lg:block lg:col-span-8 bg-white border border-[var(--fx-border)] shadow-[0_1px_4px_rgba(0,0,0,0.03)] overflow-hidden h-[calc(100dvh-15rem)] min-h-[26rem] max-h-[42rem]">
          {isWide && threadProps ? (
            <RepiChat key={threadProps.sessionId} {...threadProps} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-[var(--fx-faint)] gap-2">
              <MessageCircle size={32} className="text-[var(--fx-faint)]" />
              <p className="text-xs font-medium">Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>

      {/* Active thread — phone/tablet takeover, dismissed by the panel's own back arrow */}
      {!isWide && threadProps && (
        <div className="fixed inset-0 z-50 bg-white animate-fade-in">
          <RepiChat key={threadProps.sessionId} {...threadProps} onClose={() => openThread(null)} />
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTargetId}
        title="Delete this conversation?"
        message="This chat thread will be permanently removed. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={confirmDeleteSession}
        onClose={() => setDeleteTargetId(null)}
      />
    </div>
  );
}

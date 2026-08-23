/**
 * RepiChat — the shared conversation panel.
 *
 * The same component renders in three very different frames: a full-screen
 * sheet on the visitor's phone after a sticker scan, a right-side drawer in the
 * client dashboard, and a split-pane thread in the owner's inbox. It therefore
 * owns no size of its own — it fills whatever box it is given and adapts its
 * spacing, type scale and header affordances to the width it lands in.
 *
 * It also assumes it will be interrupted. Phones reload pages under people, so
 * the transcript, the draft and the pending sends are cached locally and
 * repainted on the next mount before the network answers (see `chatStorage`).
 */
import type React from "react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  AlertCircle,
  ArrowDown,
  Check,
  CheckCheck,
  ChevronLeft,
  Clock,
  MessageCircle,
  RotateCw,
  Send,
  X,
} from "lucide-react";
import { apiClient, type ChatMessage } from "../../lib/apiClient";
import { connectAsOwner, connectAsCustomer } from "../../lib/socketClient";
import { soundNotification } from "../../utils/soundNotification";
import {
  cacheMessages,
  cachedMessages,
  readDraft,
  recallCustomerSession,
  rememberCustomerSession,
  writeDraft,
} from "../../lib/chatStorage";
import type { Socket } from "socket.io-client";

interface RepiChatProps {
  mode: "customer" | "owner";
  /** Owner mode: the session being viewed. Customer mode: filled in once the session bootstraps. */
  sessionId?: string;
  /** Customer mode only — the sticker being contacted, used to start/resume a session. */
  qrId?: string;
  customerName?: string;
  /** Customer mode only — sent automatically once the session is ready (e.g. from a quick-issue tile). */
  initialMessage?: string;
  title?: string;
  subtitle?: string;
  onClose?: () => void;
  className?: string;
  key?: React.Key;
}

/** A server message plus the local-only delivery state an optimistic send needs. */
type UiMessage = ChatMessage & {
  delivered_at?: string | null;
  /** Sent from this device, not yet acknowledged by the server. */
  pending?: boolean;
  /** The send failed — the bubble offers a retry. */
  failed?: boolean;
};

export function customerTokenKey(qrId: string) {
  return `repichat-customer-token-${qrId}`;
}

/* ── Transcript formatting helpers ──────────────────────────────────────── */

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

function dayLabel(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (sameDay(date, today)) return "Today";
  if (sameDay(date, yesterday)) return "Yesterday";
  return date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
    ...(date.getFullYear() === today.getFullYear() ? {} : { year: "numeric" }),
  });
}

const clockTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/** Consecutive messages from the same sender within this window render as one block. */
const GROUP_WINDOW_MS = 5 * 60 * 1000;

type Row =
  | { kind: "day"; key: string; label: string }
  | {
      kind: "msg";
      key: string;
      msg: UiMessage;
      isOwn: boolean;
      firstOfGroup: boolean;
      lastOfGroup: boolean;
    };

function buildRows(messages: UiMessage[], mode: "owner" | "customer"): Row[] {
  const rows: Row[] = [];

  messages.forEach((msg, i) => {
    const prev = messages[i - 1];
    const next = messages[i + 1];
    const at = new Date(msg.created_at).getTime();

    const startsDay = !prev || !sameDay(new Date(prev.created_at), new Date(msg.created_at));
    if (startsDay) {
      rows.push({ kind: "day", key: `day-${msg.id}`, label: dayLabel(msg.created_at) });
    }

    const groupedWithPrev =
      !startsDay &&
      !!prev &&
      prev.sender_type === msg.sender_type &&
      at - new Date(prev.created_at).getTime() < GROUP_WINDOW_MS;

    const groupedWithNext =
      !!next &&
      next.sender_type === msg.sender_type &&
      sameDay(new Date(next.created_at), new Date(msg.created_at)) &&
      new Date(next.created_at).getTime() - at < GROUP_WINDOW_MS;

    rows.push({
      kind: "msg",
      key: msg.id,
      msg,
      isOwn: msg.sender_type === mode,
      firstOfGroup: !groupedWithPrev,
      lastOfGroup: !groupedWithNext,
    });
  });

  return rows;
}

/**
 * Quick-issue alerts arrive as messages carrying a Google Maps link, so the one
 * thing worth making interactive in a bubble is a URL.
 */
const URL_SPLIT = /(https?:\/\/[^\s]+)/g;
const IS_URL = /^https?:\/\//;

function renderBody(text: string, isOwn: boolean) {
  return text.split(URL_SPLIT).map((part, i) => {
    if (!IS_URL.test(part)) return <span key={i}>{part}</span>;
    const isMap = /maps|google\.[a-z.]+\/maps|maps\?q=/.test(part);
    return (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className={`underline underline-offset-2 break-all font-semibold ${
          isOwn ? "text-white/95 decoration-white/50" : "text-indigo-600 decoration-indigo-300"
        }`}
      >
        {isMap ? "📍 Open location" : part.length > 42 ? `${part.slice(0, 39)}…` : part}
      </a>
    );
  });
}

/* ── Component ──────────────────────────────────────────────────────────── */

export default function RepiChat({
  mode,
  sessionId: sessionIdProp,
  qrId,
  customerName,
  initialMessage,
  title,
  subtitle,
  onClose,
  className = "",
}: RepiChatProps) {
  // On the visitor side the session id only comes back from `startSession`, but
  // the last one used for this sticker was remembered — so a reload can paint
  // the cached transcript on the first frame instead of an empty panel.
  const initialSessionId = sessionIdProp || (mode === "customer" ? recallCustomerSession(qrId) : undefined);

  const [sessionId, setSessionId] = useState<string | undefined>(initialSessionId);
  const [customerToken, setCustomerToken] = useState<string | undefined>(() =>
    qrId ? localStorage.getItem(customerTokenKey(qrId)) || undefined : undefined
  );
  const [messages, setMessages] = useState<UiMessage[]>(() => cachedMessages<UiMessage>(initialSessionId));
  const [input, setInput] = useState(() => readDraft(initialSessionId));
  const [ready, setReady] = useState(false);
  const [connected, setConnected] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const [resolvedTitle, setResolvedTitle] = useState(title);
  const [atBottom, setAtBottom] = useState(true);
  const [unseenCount, setUnseenCount] = useState(0);

  const headerTitle = resolvedTitle || title || (mode === "owner" ? "Visitor" : "Vehicle Owner");

  const scrollerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sentInitialRef = useRef(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const atBottomRef = useRef(true);
  const didInitialScrollRef = useRef(false);

  /* ── Message list mutation ───────────────────────────────────────────── */

  /**
   * Adds a server message, or reconciles it with the optimistic copy this
   * device already rendered. Both the socket ack and the room broadcast deliver
   * our own message back, and either can win the race, so matching on a pending
   * bubble with the same text is what keeps a send from appearing twice.
   */
  const upsertMessage = useCallback((incoming: ChatMessage) => {
    setMessages((prev) => {
      const existing = prev.findIndex((m) => m.id === incoming.id);
      if (existing !== -1) {
        const next = prev.slice();
        next[existing] = { ...prev[existing], ...incoming, pending: false, failed: false };
        return next;
      }

      const pending = prev.findIndex(
        (m) => m.pending && m.sender_type === incoming.sender_type && m.body === incoming.body
      );
      if (pending !== -1) {
        const next = prev.slice();
        next[pending] = incoming;
        return next;
      }

      return [...prev, incoming];
    });
  }, []);

  /**
   * Re-reads the server transcript and folds it over whatever is on screen,
   * keeping local sends that haven't landed yet. Runs on reconnect and whenever
   * the tab comes back to the foreground, which is when a phone is most likely
   * to have missed live events.
   */
  const syncHistory = useCallback(
    async (id: string | undefined = sessionId, token: string | undefined = customerToken) => {
      if (!id) return;
      const res = await apiClient.chat
        .getMessages(id, mode === "customer" ? token : undefined)
        .catch(() => null);
      if (!res?.success || !Array.isArray(res.data)) return;

      setMessages((prev) => {
        // apiClient falls back to an empty transcript when the request fails —
        // never let that wipe a conversation the user can currently see.
        if (res.data.length === 0 && prev.length > 0) return prev;

        const unlanded = prev.filter(
          (m) =>
            (m.pending || m.failed) &&
            !res.data.some((d) => d.sender_type === m.sender_type && d.body === m.body)
        );
        return [...(res.data as UiMessage[]), ...unlanded];
      });

      if (res.session && mode === "owner") {
        setResolvedTitle((t) => t || title || res.session.customer_name || "Visitor");
      }
    },
    [sessionId, mode, customerToken, title]
  );

  /* ── Bootstrap ───────────────────────────────────────────────────────── */

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    sentInitialRef.current = false;
    didInitialScrollRef.current = false;

    async function bootstrapCustomer() {
      if (!qrId) return;
      let res = await apiClient.chat.startSession(qrId, customerToken, customerName).catch(() => null);
      if (cancelled) return;

      if (!res || !res.success) {
        const fallbackTok = customerToken || `cust_${Math.random().toString(36).substring(2, 9)}`;
        const fallbackSess = `sess_${qrId.replace(/[^a-zA-Z0-9]/g, "")}_${fallbackTok.substring(0, 6)}`;
        res = {
          success: true,
          sessionId: fallbackSess,
          customerToken: fallbackTok,
          ownerName: title || "Vehicle Owner",
        };
      }

      localStorage.setItem(customerTokenKey(qrId), res.customerToken);
      rememberCustomerSession(qrId, res.sessionId);
      setCustomerToken(res.customerToken);
      setSessionId(res.sessionId);
      if (res.ownerName) setResolvedTitle(res.ownerName);

      // A resumed session may differ from the one cached on this device (a
      // cleared token, a new owner) — repaint from its own cache first.
      if (res.sessionId !== initialSessionId) {
        setMessages(cachedMessages<UiMessage>(res.sessionId));
        setInput((current) => current || readDraft(res!.sessionId));
      }

      await syncHistory(res.sessionId);
      if (cancelled) return;

      connectAsCustomer(res.sessionId, res.customerToken);
      setReady(true);
    }

    async function bootstrapOwner() {
      if (!sessionIdProp) return;
      await syncHistory(sessionIdProp);
      if (cancelled) return;

      const token = localStorage.getItem("repiqr-token") || localStorage.getItem("namoqr-token") || "";
      connectAsOwner(token);
      setSessionId(sessionIdProp);
      setReady(true);
    }

    if (mode === "customer") bootstrapCustomer();
    else bootstrapOwner();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, qrId, sessionIdProp]);

  /* ── Live transport ──────────────────────────────────────────────────── */

  useEffect(() => {
    if (!ready || !sessionId) return;

    const socket =
      mode === "owner"
        ? connectAsOwner(localStorage.getItem("repiqr-token") || localStorage.getItem("namoqr-token") || "")
        : connectAsCustomer(sessionId, customerToken || "");
    socketRef.current = socket;
    setConnected(socket.connected);

    const joinRoom = () => {
      socket.emit("join_session", sessionId, (ack: { success: boolean; error?: string }) => {
        if (!ack?.success) {
          console.warn("RepiChat: failed to join live session room —", ack?.error || "unknown error");
        }
      });
      socket.emit("mark_read", { sessionId });
    };

    const onConnect = () => {
      setConnected(true);
      joinRoom();
      // Anything said while the socket was down is only in the database.
      syncHistory(sessionId);
    };
    const onDisconnect = () => {
      setConnected(false);
      setPeerTyping(false);
    };

    const onNewMessage = (msg: ChatMessage) => {
      if (msg.session_id !== sessionId) return;
      upsertMessage(msg);
      setPeerTyping(false);

      if (msg.sender_type !== mode) {
        if (!atBottomRef.current) setUnseenCount((n) => n + 1);
        soundNotification.playMessageChime();
        soundNotification.showBrowserNotification(
          headerTitle || "New Chat Message",
          msg.body.length > 60 ? `${msg.body.slice(0, 60)}…` : msg.body
        );
        if (document.visibilityState === "visible") socket.emit("mark_read", { sessionId });
      }
    };

    const onTyping = (payload: { sessionId: string; isTyping: boolean; from: "owner" | "customer" }) => {
      if (payload.sessionId !== sessionId || payload.from === mode) return;
      setPeerTyping(payload.isTyping);
    };

    // The peer opened the thread — flip our own ticks to read without a reload.
    const onRead = (payload: { sessionId: string; by: "owner" | "customer" }) => {
      if (payload.sessionId !== sessionId || payload.by === mode) return;
      const now = new Date().toISOString();
      setMessages((prev) =>
        prev.map((m) => (m.sender_type === mode && !m.read_at ? { ...m, read_at: now } : m))
      );
    };

    if (socket.connected) joinRoom();

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("new_message", onNewMessage);
    socket.on("typing", onTyping);
    socket.on("read", onRead);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("new_message", onNewMessage);
      socket.off("typing", onTyping);
      socket.off("read", onRead);
    };
  }, [ready, sessionId, mode, customerToken, upsertMessage, syncHistory, headerTitle]);

  /* Coming back to a backgrounded tab is the other moment live events get missed. */
  useEffect(() => {
    if (!ready || !sessionId) return;
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      syncHistory(sessionId);
      socketRef.current?.emit("mark_read", { sessionId });
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [ready, sessionId, syncHistory]);

  /* ── Local persistence ───────────────────────────────────────────────── */

  useEffect(() => {
    if (sessionId && messages.length) cacheMessages(sessionId, messages);
  }, [sessionId, messages]);

  useEffect(() => {
    writeDraft(sessionId, input);
  }, [sessionId, input]);

  /* ── Scrolling ───────────────────────────────────────────────────────── */

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
    setUnseenCount(0);
  }, []);

  const handleScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    atBottomRef.current = near;
    setAtBottom(near);
    if (near) setUnseenCount(0);
  };

  // The very first paint jumps; everything after it eases — and only when the
  // reader is already at the bottom, so scrolling back through history isn't
  // yanked away by an incoming message.
  useLayoutEffect(() => {
    if (!messages.length) return;
    if (!didInitialScrollRef.current) {
      didInitialScrollRef.current = true;
      scrollToBottom("auto");
      return;
    }
    if (atBottomRef.current) scrollToBottom("smooth");
  }, [messages, peerTyping, scrollToBottom]);

  /* ── Sending ─────────────────────────────────────────────────────────── */

  const send = useCallback(
    async (text: string, retryId?: string) => {
      const trimmed = text.trim();
      if (!trimmed || !sessionId) return;

      const tempId = retryId ?? `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const optimistic: UiMessage = {
        id: tempId,
        session_id: sessionId,
        sender_type: mode,
        sender_id: null,
        body: trimmed,
        created_at: new Date().toISOString(),
        read_at: null,
        pending: true,
      };

      // The bubble appears before the network is consulted; retries reuse the
      // same slot rather than stacking copies of the same message.
      setMessages((prev) => {
        const at = prev.findIndex((m) => m.id === tempId);
        if (at === -1) return [...prev, optimistic];
        const next = prev.slice();
        next[at] = { ...optimistic, created_at: prev[at].created_at };
        return next;
      });
      atBottomRef.current = true;

      const settle = (real?: ChatMessage) => {
        setMessages((prev) => {
          const at = prev.findIndex((m) => m.id === tempId);
          if (at === -1) return prev; // the live broadcast already reconciled it
          const next = prev.slice();
          next[at] = real ? (real as UiMessage) : { ...next[at], pending: false, failed: true };
          return next;
        });
      };

      const socket = socketRef.current;
      if (socket?.connected) {
        let acked = false;
        socket.emit(
          "send_message",
          { sessionId, body: trimmed },
          (ack: { success: boolean; message?: ChatMessage }) => {
            acked = true;
            settle(ack?.success && ack.message ? ack.message : undefined);
          }
        );
        // A socket that never acks would otherwise leave the bubble spinning forever.
        setTimeout(() => {
          if (!acked) settle();
        }, 10000);
        return;
      }

      try {
        const res =
          mode === "owner"
            ? await apiClient.chat.sendMessage(sessionId, trimmed)
            : await apiClient.chat.sendMessage(sessionId, trimmed, customerToken);
        settle(res.success ? res.data : undefined);
      } catch {
        settle();
      }
    },
    [sessionId, mode, customerToken]
  );

  // Fire the quick-issue-tile's prefilled message once the thread is ready.
  useEffect(() => {
    if (ready && initialMessage && !sentInitialRef.current) {
      sentInitialRef.current = true;
      send(initialMessage);
    }
  }, [ready, initialMessage, send]);

  const retry = (msg: UiMessage) => {
    if (!msg.failed) return;
    send(msg.body, msg.id);
  };

  /* ── Composer ────────────────────────────────────────────────────────── */

  const autoGrow = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  };

  useEffect(autoGrow, [input]);

  const handleInputChange = (value: string) => {
    setInput(value);

    const socket = socketRef.current;
    if (!sessionId || !socket?.connected) return;
    socket.emit("typing", { sessionId, isTyping: value.length > 0 });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(
      () => socket.emit("typing", { sessionId, isTyping: false }),
      2000
    );
  };

  const submit = () => {
    const text = input.trim();
    if (!text) return;
    send(text);
    setInput("");
    writeDraft(sessionId, "");
    socketRef.current?.emit("typing", { sessionId, isTyping: false });
    requestAnimationFrame(() => {
      autoGrow();
      scrollToBottom("smooth");
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit();
  };

  // Enter sends, Shift+Enter breaks the line — and mobile keyboards get a real
  // send key via enterKeyHint rather than a newline they can't escape.
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const rows = useMemo(() => buildRows(messages, mode), [messages, mode]);

  const statusLine = peerTyping
    ? "Typing…"
    : !ready
      ? "Connecting…"
      : connected
        ? subtitle || (mode === "owner" ? "Visitor · online" : "RepiChat")
        : "Reconnecting…";

  const peerInitial = (headerTitle.trim()[0] || "?").toUpperCase();

  return (
    <div className={`flex flex-col h-full w-full min-h-0 bg-white overflow-hidden ${className}`}>
      {/* ── Header ───────────────────────────────────────────────────── */}
      <header className="flex items-center gap-2 sm:gap-3 shrink-0 px-2.5 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white pt-[max(0.625rem,env(safe-area-inset-top))] sm:pt-3">
        {/* A full-screen sheet on a phone wants a back arrow; a desktop panel wants a close X. */}
        {onClose && (
          <button
            onClick={onClose}
            className="sm:hidden w-9 h-9 -ml-1 rounded-full hover:bg-white/15 active:bg-white/25 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ChevronLeft size={22} />
          </button>
        )}

        <div className="relative shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/15 flex items-center justify-center font-bold text-sm">
            {peerInitial === "?" ? <MessageCircle size={18} /> : peerInitial}
          </div>
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-indigo-600 transition-colors ${
              connected ? "bg-emerald-400" : "bg-amber-400"
            }`}
            aria-hidden
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] sm:text-[15px] font-bold truncate leading-tight">{headerTitle}</p>
          <p className="text-[11px] sm:text-xs text-indigo-100 font-medium truncate flex items-center gap-1.5 mt-0.5">
            {peerTyping && (
              <span className="flex items-center gap-0.5" aria-hidden>
                <span className="w-1 h-1 rounded-full bg-indigo-100 animate-bounce [animation-delay:0ms]" />
                <span className="w-1 h-1 rounded-full bg-indigo-100 animate-bounce [animation-delay:150ms]" />
                <span className="w-1 h-1 rounded-full bg-indigo-100 animate-bounce [animation-delay:300ms]" />
              </span>
            )}
            {statusLine}
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="hidden sm:flex w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 items-center justify-center shrink-0 transition-colors cursor-pointer"
            aria-label="Close chat"
          >
            <X size={17} />
          </button>
        )}
      </header>

      {/* ── Transcript ───────────────────────────────────────────────── */}
      <div className="relative flex-1 min-h-0 flex flex-col bg-[#F3F4F8]">
        <div
          ref={scrollerRef}
          onScroll={handleScroll}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-2.5 sm:px-4 py-3 sm:py-4"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(79,70,229,0.055) 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        >
          {!ready && messages.length === 0 ? (
            <div className="space-y-3 pt-2" aria-hidden>
              {/* Skeleton rather than a spinner — the shape of the thread is the loading state. */}
              {[
                "w-3/5 self-start",
                "w-2/5 self-end",
                "w-1/2 self-start",
                "w-1/3 self-end",
              ].map((w, i) => (
                <div key={i} className={`flex ${i % 2 ? "justify-end" : "justify-start"}`}>
                  <div className={`h-10 rounded-2xl bg-gray-200/70 animate-pulse ${w.split(" ")[0]}`} />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-8 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                <MessageCircle size={26} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-700">No messages yet</p>
                <p className="text-xs text-gray-400 font-medium mt-1 max-w-[16rem]">
                  Say hello — replies land here in real time, and this chat stays put if you reload.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              {rows.map((row) =>
                row.kind === "day" ? (
                  <div key={row.key} className="flex justify-center my-3">
                    <span className="px-3 py-1 rounded-full bg-white/90 border border-gray-200/80 text-[10.5px] font-bold text-gray-500 uppercase tracking-wide shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                      {row.label}
                    </span>
                  </div>
                ) : (
                  <MessageBubble
                    key={row.key}
                    row={row}
                    peerInitial={peerInitial}
                    onRetry={retry}
                  />
                )
              )}

              {peerTyping && (
                <div className="flex items-end gap-2 mt-1.5">
                  <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[11px] font-bold shrink-0">
                    {peerInitial}
                  </div>
                  <div className="bg-white border border-gray-200/80 rounded-2xl rounded-bl-md px-3.5 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Jumping back down, with a count of what arrived while reading history. */}
        {!atBottom && messages.length > 0 && (
          <button
            onClick={() => scrollToBottom("smooth")}
            className="absolute bottom-3 right-3 sm:right-4 z-10 flex items-center gap-1.5 pl-2.5 pr-3 py-2 rounded-full bg-white shadow-lg border border-gray-200 text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
            aria-label="Scroll to latest messages"
          >
            <ArrowDown size={15} />
            {unseenCount > 0 && (
              <span className="text-[11px] font-bold">
                {unseenCount} new
              </span>
            )}
          </button>
        )}
      </div>

      {/* ── Composer ─────────────────────────────────────────────────── */}
      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 shrink-0 px-2.5 sm:px-3 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] sm:pb-3 border-t border-gray-200 bg-white"
      >
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={ready ? "Type a message…" : "Connecting…"}
          disabled={!ready && !sessionId}
          enterKeyHint="send"
          aria-label="Message"
          className="flex-1 min-w-0 resize-none max-h-[132px] bg-gray-100 border border-transparent focus:border-indigo-400 focus:bg-white rounded-2xl px-3.5 py-2.5 text-[15px] sm:text-sm leading-snug text-gray-900 placeholder-gray-400 outline-none disabled:opacity-50 transition-colors"
        />
        <button
          type="submit"
          disabled={!input.trim() || (!ready && !sessionId)}
          className="w-11 h-11 sm:w-10 sm:h-10 shrink-0 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95"
          aria-label="Send message"
        >
          <Send size={17} />
        </button>
      </form>
    </div>
  );
}

/* ── Bubble ─────────────────────────────────────────────────────────────── */

interface MessageBubbleProps {
  row: Extract<Row, { kind: "msg" }>;
  peerInitial: string;
  onRetry: (msg: UiMessage) => void;
  key?: React.Key;
}

function MessageBubble({ row, peerInitial, onRetry }: MessageBubbleProps) {
  const { msg, isOwn, firstOfGroup, lastOfGroup } = row;

  return (
    <div
      className={`flex items-end gap-2 ${isOwn ? "justify-end" : "justify-start"} ${
        firstOfGroup ? "mt-2.5" : "mt-0.5"
      }`}
    >
      {/* The peer's avatar anchors the last bubble of their block; earlier ones are indented to match. */}
      {!isOwn &&
        (lastOfGroup ? (
          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[11px] font-bold shrink-0">
            {peerInitial}
          </div>
        ) : (
          <div className="w-7 shrink-0" aria-hidden />
        ))}

      <div className={`max-w-[82%] sm:max-w-[70%] min-w-0 ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
        <div
          className={`rounded-2xl px-3.5 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-opacity ${
            isOwn
              ? `bg-indigo-600 text-white ${lastOfGroup ? "rounded-br-md" : ""} ${msg.pending ? "opacity-70" : ""} ${
                  msg.failed ? "bg-red-500" : ""
                }`
              : `bg-white text-gray-800 border border-gray-200/80 ${lastOfGroup ? "rounded-bl-md" : ""}`
          }`}
        >
          <p className="whitespace-pre-wrap break-words text-[14.5px] sm:text-[13.5px] leading-relaxed font-medium">
            {renderBody(msg.body, isOwn)}
          </p>

          <div
            className={`flex items-center gap-1 mt-0.5 ${
              isOwn ? "justify-end text-indigo-200" : "justify-end text-gray-400"
            }`}
          >
            <span className="text-[10px] font-medium tabular-nums">{clockTime(msg.created_at)}</span>
            {isOwn && <DeliveryTick msg={msg} />}
          </div>
        </div>

        {msg.failed && (
          <button
            onClick={() => onRetry(msg)}
            className="flex items-center gap-1 mt-1 px-1 text-[10.5px] font-bold text-red-600 hover:text-red-700 cursor-pointer"
          >
            <RotateCw size={11} /> Not sent · tap to retry
          </button>
        )}
      </div>
    </div>
  );
}

function DeliveryTick({ msg }: { msg: UiMessage }) {
  if (msg.failed) return <AlertCircle size={13} className="text-white" aria-label="Not sent" />;
  if (msg.pending) return <Clock size={12} className="text-indigo-200" aria-label="Sending" />;
  if (msg.read_at) return <CheckCheck size={14} className="text-sky-300" aria-label="Read" />;
  if (msg.delivered_at) return <CheckCheck size={14} className="text-indigo-200" aria-label="Delivered" />;
  return <Check size={13} className="text-indigo-200" aria-label="Sent" />;
}

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
  Download,
  ImagePlus,
  Loader2,
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
  /** Sent from this device, not yet acknowledged by the server. */
  pending?: boolean;
  /** The send failed — the bubble offers a retry. */
  failed?: boolean;
  /** An `object:` URL for an image still uploading, so the bubble shows the real picture immediately. */
  localPreview?: string;
  /** 0–1 while an attachment is on the wire. */
  uploadProgress?: number;
  /** Kept on the failed bubble so "retry" can re-upload without re-picking the file. */
  retryFile?: File;
};

export function customerTokenKey(qrId: string) {
  return `repichat-customer-token-${qrId}`;
}

/* ── Images ─────────────────────────────────────────────────────────────── */

/** Anything larger is downscaled before upload — well past what a chat bubble shows. */
const MAX_IMAGE_EDGE = 1600;
const MAX_PICK_BYTES = 25 * 1024 * 1024;

/**
 * Turn a picked file into something worth sending over a phone connection.
 *
 * A modern phone camera produces 4–12 MB per shot, and a chat bubble displays it
 * at a few hundred pixels. Downscaling to `MAX_IMAGE_EDGE` and re-encoding as
 * JPEG typically cuts that by 10–20×, which is the difference between a photo
 * that appears and one that spins — and it happens on the sender's device, so
 * the server and the recipient both get the cheap version.
 *
 * GIFs are passed through untouched: re-encoding one through a canvas would
 * flatten it to a single frame.
 */
async function prepareImage(file: File): Promise<{
  dataUrl: string;
  width: number;
  height: number;
  name: string;
}> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("That file could not be read as an image."));
      el.src = objectUrl;
    });

    const { naturalWidth: w, naturalHeight: h } = img;

    if (file.type === "image/gif") {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("That file could not be read."));
        reader.readAsDataURL(file);
      });
      return { dataUrl, width: w, height: h, name: file.name };
    }

    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(w, h));
    const width = Math.max(1, Math.round(w * scale));
    const height = Math.max(1, Math.round(h * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("This browser could not process the image.");
    ctx.drawImage(img, 0, 0, width, height);

    // PNG only when the source had transparency worth keeping; JPEG otherwise,
    // which is far smaller for photographs.
    const keepAlpha = file.type === "image/png" || file.type === "image/webp";
    const dataUrl = keepAlpha
      ? canvas.toDataURL("image/png")
      : canvas.toDataURL("image/jpeg", 0.82);

    // A screenshot-style PNG can come out bigger than the JPEG of the same
    // thing; when it does, take the smaller one.
    if (keepAlpha) {
      const jpeg = canvas.toDataURL("image/jpeg", 0.82);
      if (jpeg.length < dataUrl.length * 0.7) {
        return { dataUrl: jpeg, width, height, name: file.name.replace(/\.\w+$/, ".jpg") };
      }
    }

    return { dataUrl, width, height, name: file.name };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/** A bare image URL in a message body — how attachments arrive before the migration runs. */
const IMAGE_URL = /^https?:\/\/\S+\.(png|jpe?g|webp|gif|avif)(\?\S*)?$/i;

/** The image this message carries, from either the column or a body that is just a URL. */
function attachmentOf(msg: UiMessage): { url: string; name?: string | null; w?: number | null; h?: number | null } | null {
  if (msg.localPreview) return { url: msg.localPreview, name: msg.attachment_name, w: msg.attachment_width, h: msg.attachment_height };
  if (msg.attachment_url) return { url: msg.attachment_url, name: msg.attachment_name, w: msg.attachment_width, h: msg.attachment_height };

  const lines = (msg.body || "").trim().split("\n");
  const last = lines[lines.length - 1];
  if (lines.length <= 2 && IMAGE_URL.test(last)) return { url: last };
  return null;
}

/** The caption to show under an image — the body minus the URL that IS the image. */
function captionOf(msg: UiMessage): string {
  if (msg.attachment_url || msg.localPreview) return msg.body || "";
  const lines = (msg.body || "").trim().split("\n");
  if (lines.length <= 2 && IMAGE_URL.test(lines[lines.length - 1])) {
    return lines.slice(0, -1).join("\n");
  }
  return msg.body || "";
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
  const [attachError, setAttachError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [lightbox, setLightbox] = useState<{ url: string; name?: string | null } | null>(null);

  const headerTitle = resolvedTitle || title || (mode === "owner" ? "Visitor" : "Vehicle Owner");

  // Read inside socket callbacks without making the transport effect depend on
  // it — the title resolves a moment after connecting, and having it in the
  // dependency list tore every listener down and re-joined the room for what is
  // only ever a notification caption.
  const headerTitleRef = useRef(headerTitle);
  headerTitleRef.current = headerTitle;

  const scrollerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sentInitialRef = useRef(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingSentAtRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);
  const socketRef = useRef<Socket | null>(null);
  const atBottomRef = useRef(true);
  const didInitialScrollRef = useRef(false);
  const messagesRef = useRef<UiMessage[]>([]);
  messagesRef.current = messages;

  /* ── Message list mutation ───────────────────────────────────────────── */

  /**
   * Adds a server message, or reconciles it with the optimistic copy this
   * device already rendered. Both the socket ack and the room broadcast deliver
   * our own message back and either can win the race, so a send must be matched
   * to its pending bubble rather than appended twice.
   *
   * Matching is by `client_id` — the id this device minted and the server echoed.
   * The previous match on body text quietly ate a message any time the same
   * words were sent twice in a row, which in a chat ("ok", "ok") is normal.
   * Text matching survives only as a fallback for the REST path.
   */
  const upsertMessage = useCallback((incoming: ChatMessage) => {
    setMessages((prev) => {
      const replaceAt = (i: number) => {
        const next = prev.slice();
        // Hold on to the local preview until the real image has been decoded by
        // the browser, otherwise the bubble flashes empty on swap.
        next[i] = { ...prev[i], ...incoming, pending: false, failed: false, uploadProgress: undefined, retryFile: undefined };
        return next;
      };

      const byId = prev.findIndex((m) => m.id === incoming.id);
      if (byId !== -1) return replaceAt(byId);

      if (incoming.client_id) {
        const byClientId = prev.findIndex((m) => m.id === incoming.client_id || m.client_id === incoming.client_id);
        if (byClientId !== -1) return replaceAt(byClientId);
      }

      const byText = prev.findIndex(
        (m) => m.pending && m.sender_type === incoming.sender_type && m.body === incoming.body && !attachmentOf(m)
      );
      if (byText !== -1) return replaceAt(byText);

      return [...prev, incoming as UiMessage];
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
      try {
        const res = await apiClient.chat.getMessages(id, mode === "customer" ? token : undefined);
        if (!res?.success || !Array.isArray(res.data)) {
          if (mode === "customer" && qrId && (res as any)?.error?.includes("Session not found")) {
            localStorage.removeItem(customerTokenKey(qrId));
            localStorage.removeItem(`repichat-last-session-${qrId}`);
          }
          return;
        }

        setMessages((prev) => {
          if (res.data.length === 0 && prev.length > 0) return prev;

          const unlanded = prev.filter((m) => {
            if (!m.pending && !m.failed) return false;
            if (m.uploadProgress !== undefined || m.retryFile) return true;
            return !res.data.some((d) => d.sender_type === m.sender_type && d.body === m.body);
          });
          return [...(res.data as UiMessage[]), ...unlanded];
        });

        if (res.session && mode === "owner") {
          setResolvedTitle((t) => t || title || res.session.customer_name || "Visitor");
        }
      } catch (err: any) {
        if (mode === "customer" && qrId && err?.message?.includes("Session not found")) {
          localStorage.removeItem(customerTokenKey(qrId));
          localStorage.removeItem(`repichat-last-session-${qrId}`);
        }
      }
    },
    [sessionId, mode, customerToken, title, qrId]
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

      // If existing token caused session not found or invalid session, retry without token to create fresh session
      if (!res || !res.success) {
        localStorage.removeItem(customerTokenKey(qrId));
        localStorage.removeItem(`repichat-last-session-${qrId}`);
        res = await apiClient.chat.startSession(qrId, undefined, customerName).catch(() => null);
      }

      if (!res || !res.success) {
        const fallbackTok = `cust_${Math.random().toString(36).substring(2, 9)}`;
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

      await syncHistory(res.sessionId, res.customerToken);
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
        const preview = msg.attachment_url
          ? msg.body
            ? `📷 ${msg.body}`
            : "📷 Photo"
          : msg.body;
        soundNotification.showBrowserNotification(
          headerTitleRef.current || "New Chat Message",
          preview.length > 60 ? `${preview.slice(0, 60)}…` : preview
        );
        if (document.visibilityState === "visible") socket.emit("mark_read", { sessionId });
      }
    };

    // The peer's socket was in the room when this was broadcast — second tick.
    const onDelivered = (payload: { sessionId: string; messageId: string; deliveredAt: string }) => {
      if (payload.sessionId !== sessionId) return;
      setMessages((prev) =>
        prev.map((m) => (m.id === payload.messageId && !m.delivered_at ? { ...m, delivered_at: payload.deliveredAt } : m))
      );
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
    socket.on("delivered", onDelivered);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("new_message", onNewMessage);
      socket.off("typing", onTyping);
      socket.off("read", onRead);
      socket.off("delivered", onDelivered);
    };
  }, [ready, sessionId, mode, customerToken, upsertMessage, syncHistory]);

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
    if (!sessionId || !messages.length) return;
    // Debounced: a burst of live messages (or an upload ticking its progress)
    // would otherwise re-serialise the whole transcript on every state change.
    const t = setTimeout(() => {
      cacheMessages(
        sessionId,
        // `localPreview` is a blob: URL and `retryFile` a File — both are dead
        // the moment the page reloads, which is exactly when this cache is read.
        // Persisting them produced bubbles pointing at images that no longer exist.
        messages.map(({ localPreview, retryFile, uploadProgress, ...rest }) => rest)
      );
    }, 250);
    return () => clearTimeout(t);
  }, [sessionId, messages]);

  // Object URLs are held for the life of the thread so the sender keeps seeing
  // their own photo; release them when the panel goes away.
  useEffect(() => {
    return () => {
      for (const m of messagesRef.current) {
        if (m.localPreview) URL.revokeObjectURL(m.localPreview);
      }
    };
  }, []);

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
        client_id: tempId,
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
          { sessionId, body: trimmed, clientId: tempId },
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
        const res = await apiClient.chat.sendMessage(
          sessionId,
          trimmed,
          mode === "customer" ? customerToken : undefined,
          tempId
        );
        if (!res.success && (res as any)?.error?.includes('Session not found') && mode === "customer" && qrId) {
          localStorage.removeItem(customerTokenKey(qrId));
          localStorage.removeItem(`repichat-last-session-${qrId}`);
          const fresh = await apiClient.chat.startSession(qrId, undefined, customerName).catch(() => null);
          if (fresh?.success) {
            localStorage.setItem(customerTokenKey(qrId), fresh.customerToken);
            rememberCustomerSession(qrId, fresh.sessionId);
            setCustomerToken(fresh.customerToken);
            setSessionId(fresh.sessionId);
            const retryRes = await apiClient.chat.sendMessage(
              fresh.sessionId,
              trimmed,
              fresh.customerToken,
              tempId
            ).catch(() => null);
            settle(retryRes?.success ? retryRes.data : undefined);
            return;
          }
        }
        settle(res.success ? res.data : undefined);
      } catch (err: any) {
        if (err?.message?.includes('Session not found') && mode === "customer" && qrId) {
          localStorage.removeItem(customerTokenKey(qrId));
          localStorage.removeItem(`repichat-last-session-${qrId}`);
          const fresh = await apiClient.chat.startSession(qrId, undefined, customerName).catch(() => null);
          if (fresh?.success) {
            localStorage.setItem(customerTokenKey(qrId), fresh.customerToken);
            rememberCustomerSession(qrId, fresh.sessionId);
            setCustomerToken(fresh.customerToken);
            setSessionId(fresh.sessionId);
            const retryRes = await apiClient.chat.sendMessage(
              fresh.sessionId,
              trimmed,
              fresh.customerToken,
              tempId
            ).catch(() => null);
            settle(retryRes?.success ? retryRes.data : undefined);
            return;
          }
        }
        settle();
      }
    },
    [sessionId, mode, customerToken, qrId, customerName]
  );

  /**
   * Send an image. The bubble appears immediately showing the file straight from
   * disk (an object URL), so the sender sees their photo the instant they pick
   * it rather than after a round trip — the upload then swaps in the hosted copy.
   */
  const sendImage = useCallback(
    async (file: File, retryId?: string) => {
      if (!sessionId) return;

      if (!file.type.startsWith("image/")) {
        setAttachError("Only images can be attached.");
        return;
      }
      if (file.size > MAX_PICK_BYTES) {
        setAttachError(`That image is ${(file.size / 1024 / 1024).toFixed(1)} MB — please pick one under 25 MB.`);
        return;
      }
      setAttachError(null);

      const tempId = retryId ?? `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const preview = URL.createObjectURL(file);

      const optimistic: UiMessage = {
        id: tempId,
        client_id: tempId,
        session_id: sessionId,
        sender_type: mode,
        sender_id: null,
        body: "",
        created_at: new Date().toISOString(),
        read_at: null,
        pending: true,
        localPreview: preview,
        uploadProgress: 0,
        retryFile: file,
      };

      setMessages((prev) => {
        const at = prev.findIndex((m) => m.id === tempId);
        if (at === -1) return [...prev, optimistic];
        const next = prev.slice();
        next[at] = { ...optimistic, created_at: prev[at].created_at };
        return next;
      });
      atBottomRef.current = true;

      const fail = () =>
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, pending: false, failed: true, uploadProgress: undefined } : m))
        );

      try {
        const prepared = await prepareImage(file);
        setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, uploadProgress: 0.35 } : m)));

        const res = await apiClient.chat.sendAttachment(
          sessionId,
          {
            image: prepared.dataUrl,
            name: prepared.name,
            width: prepared.width,
            height: prepared.height,
            clientId: tempId,
          },
          mode === "customer" ? customerToken : undefined
        );

        if (!res?.success || !res.data) throw new Error(res?.error || "Upload failed");

        setMessages((prev) => {
          const at = prev.findIndex((m) => m.id === tempId);
          if (at === -1) return prev; // the broadcast already reconciled it
          const next = prev.slice();
          next[at] = { ...(res.data as UiMessage), localPreview: preview };
          return next;
        });
      } catch (err: any) {
        setAttachError(err?.message || "That image couldn't be sent.");
        fail();
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
    if (msg.retryFile) sendImage(msg.retryFile, msg.id);
    else send(msg.body, msg.id);
  };

  /* ── Composer ────────────────────────────────────────────────────────── */

  const autoGrow = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  };

  useEffect(autoGrow, [input]);

  /** Keystrokes are fast; a typing indicator only needs to be roughly right. */
  const TYPING_THROTTLE_MS = 1500;

  const handleInputChange = (value: string) => {
    setInput(value);

    const socket = socketRef.current;
    if (!sessionId || !socket?.connected) return;

    // Emit at most once per throttle window instead of once per character. The
    // old version put a socket event — and, before the server started caching
    // its access check, a database round trip — behind every letter typed.
    const now = Date.now();
    if (value.length > 0 && now - typingSentAtRef.current > TYPING_THROTTLE_MS) {
      typingSentAtRef.current = now;
      socket.emit("typing", { sessionId, isTyping: true });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      typingSentAtRef.current = 0;
      socket.emit("typing", { sessionId, isTyping: false });
    }, 2000);
  };

  /* ── Attaching ───────────────────────────────────────────────────────── */

  const pickFiles = (files: FileList | File[] | null) => {
    const images = Array.from(files || []).filter((f) => f.type.startsWith("image/"));
    if (!images.length) return;
    // Sent one at a time so each gets its own bubble, tick and retry affordance.
    images.slice(0, 10).forEach((f) => sendImage(f));
  };

  /** Screenshot → Ctrl/Cmd+V straight into the thread. */
  const handlePaste = (e: React.ClipboardEvent) => {
    const list: FileList | undefined = e.clipboardData?.files;
    if (!list?.length) return;
    const files: File[] = [];
    for (let i = 0; i < list.length; i++) {
      const f = list.item(i);
      if (f && f.type.startsWith("image/")) files.push(f);
    }
    if (!files.length) return;
    e.preventDefault();
    pickFiles(files);
  };

  // Drag events fire on every child element, so a plain enter/leave pair flickers
  // the overlay as the pointer crosses bubbles. Counting depth is what keeps it steady.
  const handleDragEnter = (e: React.DragEvent) => {
    if (!Array.from(e.dataTransfer?.types || []).includes("Files")) return;
    dragDepthRef.current += 1;
    setDragActive(true);
  };
  const handleDragLeave = () => {
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setDragActive(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragDepthRef.current = 0;
    setDragActive(false);
    pickFiles(e.dataTransfer?.files || null);
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
        ? subtitle || "Online"
        : "Reconnecting…";

  const peerInitial = (headerTitle.trim()[0] || "?").toUpperCase();

  return (
    <div
      className={`relative flex flex-col h-full w-full min-h-0 bg-white overflow-hidden ${className}`}
      onDragEnter={handleDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
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

      {/* A dropped socket used to be visible only as a small amber dot. Messages
          still send over REST, but replies stop arriving live — worth saying so. */}
      {ready && !connected && (
        <div className="shrink-0 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-50 border-b border-amber-200/70 text-[11px] font-semibold text-amber-800">
          <Loader2 size={12} className="animate-spin" />
          Reconnecting — new messages may be delayed
        </div>
      )}

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
                    onOpenImage={setLightbox}
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
      <div className="shrink-0 border-t border-gray-200 bg-white">
        {attachError && (
          <div className="flex items-start gap-2 px-3 pt-2.5 text-[11.5px] font-semibold text-red-600">
            <AlertCircle size={14} className="shrink-0 mt-px" />
            <span className="flex-1 leading-snug">{attachError}</span>
            <button
              onClick={() => setAttachError(null)}
              className="shrink-0 text-red-400 hover:text-red-600 cursor-pointer"
              aria-label="Dismiss"
            >
              <X size={13} />
            </button>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex items-end gap-1.5 sm:gap-2 px-2.5 sm:px-3 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] sm:pb-3"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              pickFiles(e.target.files);
              // Reset so picking the same file twice in a row still fires onChange.
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={!sessionId}
            className="w-10 h-10 sm:w-9 sm:h-9 shrink-0 rounded-full text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer active:scale-95"
            aria-label="Attach an image"
            title="Attach an image"
          >
            <ImagePlus size={19} />
          </button>

          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
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

      {/* ── Drop target ──────────────────────────────────────────────── */}
      {dragActive && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-indigo-600/10 backdrop-blur-[2px] pointer-events-none">
          <div className="flex flex-col items-center gap-2 px-6 py-5 rounded-2xl bg-white border-2 border-dashed border-indigo-400 shadow-xl">
            <ImagePlus size={26} className="text-indigo-500" />
            <p className="text-sm font-bold text-gray-700">Drop to send</p>
          </div>
        </div>
      )}

      {/* ── Lightbox ─────────────────────────────────────────────────── */}
      {lightbox && <Lightbox image={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}

/* ── Lightbox ───────────────────────────────────────────────────────────── */

function Lightbox({
  image,
  onClose,
}: {
  image: { url: string; name?: string | null };
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="absolute inset-0 z-40 bg-black/90 flex flex-col animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
    >
      <div className="flex items-center justify-end gap-1 p-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <a
          href={image.url}
          download={image.name || "image"}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="w-10 h-10 rounded-full text-white/90 hover:bg-white/15 flex items-center justify-center transition-colors"
          aria-label="Open full size"
        >
          <Download size={19} />
        </a>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full text-white/90 hover:bg-white/15 flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Close preview"
        >
          <X size={21} />
        </button>
      </div>
      <div className="flex-1 min-h-0 flex items-center justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <img
          src={image.url}
          alt={image.name || "Shared image"}
          onClick={(e) => e.stopPropagation()}
          className="max-w-full max-h-full object-contain rounded-lg"
        />
      </div>
    </div>
  );
}

/* ── Bubble ─────────────────────────────────────────────────────────────── */

interface MessageBubbleProps {
  row: Extract<Row, { kind: "msg" }>;
  peerInitial: string;
  onRetry: (msg: UiMessage) => void;
  onOpenImage: (image: { url: string; name?: string | null }) => void;
  key?: React.Key;
}

function MessageBubble({ row, peerInitial, onRetry, onOpenImage }: MessageBubbleProps) {
  const { msg, isOwn, firstOfGroup, lastOfGroup } = row;
  const attachment = attachmentOf(msg);
  const caption = captionOf(msg);
  const uploading = msg.uploadProgress !== undefined;

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
          className={`overflow-hidden rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-opacity ${
            attachment ? "p-1" : "px-3.5 py-2"
          } ${
            isOwn
              ? `bg-indigo-600 text-white ${lastOfGroup ? "rounded-br-md" : ""} ${msg.pending && !attachment ? "opacity-70" : ""} ${
                  msg.failed ? "bg-red-500" : ""
                }`
              : `bg-white text-gray-800 border border-gray-200/80 ${lastOfGroup ? "rounded-bl-md" : ""}`
          }`}
        >
          {attachment && (
            <button
              type="button"
              onClick={() => !uploading && onOpenImage({ url: attachment.url, name: attachment.name })}
              disabled={uploading}
              className="relative block w-full overflow-hidden rounded-[13px] bg-black/5 cursor-zoom-in disabled:cursor-wait"
              // Reserving the real shape stops the transcript from jumping as
              // each image decodes — the scroll position is anchored to the
              // bottom, so any late reflow visibly shoves the conversation.
              style={
                attachment.w && attachment.h
                  ? { aspectRatio: `${attachment.w} / ${attachment.h}`, maxHeight: "22rem" }
                  : undefined
              }
            >
              <img
                src={attachment.url}
                alt={caption || attachment.name || "Shared image"}
                loading="lazy"
                decoding="async"
                className={`w-full h-full object-cover max-h-[22rem] transition-[filter,opacity] duration-300 ${
                  uploading ? "blur-[1.5px] opacity-80" : ""
                }`}
              />
              {uploading && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                  <Loader2 size={22} className="animate-spin text-white drop-shadow" />
                </span>
              )}
            </button>
          )}

          {(caption || !attachment) && (
            <p
              className={`whitespace-pre-wrap break-words text-[14.5px] sm:text-[13.5px] leading-relaxed font-medium ${
                attachment ? "px-2.5 pt-1.5" : ""
              }`}
            >
              {renderBody(caption, isOwn)}
            </p>
          )}

          <div
            className={`flex items-center gap-1 justify-end ${attachment ? "px-2.5 pb-1 pt-1" : "mt-0.5"} ${
              isOwn ? "text-indigo-200" : "text-gray-400"
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
            <RotateCw size={11} />
            {msg.retryFile ? "Image not sent · tap to retry" : "Not sent · tap to retry"}
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

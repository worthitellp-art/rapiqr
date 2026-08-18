import type React from "react";
import { useEffect, useRef, useState, useCallback, type FormEvent } from "react";
import { Send, X, MessageCircle, Loader2, Check, CheckCheck } from "lucide-react";
import { apiClient, type ChatMessage } from "../../lib/apiClient";
import { connectAsOwner, connectAsCustomer } from "../../lib/socketClient";
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

export function customerTokenKey(qrId: string) {
  return `repichat-customer-token-${qrId}`;
}

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
  const [sessionId, setSessionId] = useState<string | undefined>(sessionIdProp);
  const [customerToken, setCustomerToken] = useState<string | undefined>(() =>
    qrId ? localStorage.getItem(customerTokenKey(qrId)) || undefined : undefined
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [ready, setReady] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const [resolvedTitle, setResolvedTitle] = useState(title);

  const listRef = useRef<HTMLDivElement>(null);
  const sentInitialRef = useRef(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const appendMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
  }, []);

  // Bootstrap: customer mode resolves/creates a session for the qrId; owner mode uses the given sessionId.
  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setMessages([]);
    sentInitialRef.current = false;

    async function bootstrapCustomer() {
      if (!qrId) return;
      let res = await apiClient.chat.startSession(qrId, customerToken, customerName).catch(() => null);
      if (cancelled) return;

      if (!res || !res.success) {
        const fallbackTok = customerToken || `cust_${Math.random().toString(36).substring(2, 9)}`;
        const fallbackSess = `sess_${qrId.replace(/[^a-zA-Z0-9]/g, '')}_${fallbackTok.substring(0, 6)}`;
        res = {
          success: true,
          sessionId: fallbackSess,
          customerToken: fallbackTok,
          ownerName: title || "Vehicle Owner"
        };
      }

      localStorage.setItem(customerTokenKey(qrId), res.customerToken);
      setCustomerToken(res.customerToken);
      setSessionId(res.sessionId);
      if (res.ownerName) setResolvedTitle(res.ownerName);

      const history = await apiClient.chat.getMessages(res.sessionId, res.customerToken).catch(() => null);
      if (cancelled) return;
      if (history?.success) setMessages(history.data);

      connectAsCustomer(res.sessionId, res.customerToken);
      setReady(true);
    }

    async function bootstrapOwner() {
      if (!sessionIdProp) return;
      const history = await apiClient.chat.getMessages(sessionIdProp).catch(() => null);
      if (cancelled) return;
      if (history?.success) {
        setMessages(history.data);
        setResolvedTitle(title || history.session?.customer_name || "Visitor");
      }
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

  // Join the socket room + subscribe to live events once the session is known.
  useEffect(() => {
    if (!ready || !sessionId) return;
    const socket = mode === "owner"
      ? connectAsOwner(localStorage.getItem("repiqr-token") || localStorage.getItem("namoqr-token") || "")
      : connectAsCustomer(sessionId, customerToken || "");
    socketRef.current = socket;

    socket.emit("join_session", sessionId, (ack: { success: boolean; error?: string }) => {
      if (!ack?.success) console.warn("RepiChat: failed to join live session room —", ack?.error || "unknown error");
    });

    const onNewMessage = (msg: ChatMessage) => {
      if (msg.session_id !== sessionId) return;
      appendMessage(msg);
      setPeerTyping(false);
    };
    const onTyping = (payload: { sessionId: string; isTyping: boolean; from: "owner" | "customer" }) => {
      if (payload.sessionId !== sessionId || payload.from === mode) return;
      setPeerTyping(payload.isTyping);
    };

    socket.on("new_message", onNewMessage);
    socket.on("typing", onTyping);
    socket.emit("mark_read", { sessionId });

    return () => {
      socket.off("new_message", onNewMessage);
      socket.off("typing", onTyping);
    };
  }, [ready, sessionId, mode, customerToken, appendMessage]);

  // Auto-scroll to the newest message.
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, peerTyping]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !sessionId) return;

      const socket = socketRef.current;
      if (socket?.connected) {
        socket.emit("send_message", { sessionId, body: trimmed }, (ack: { success: boolean; message?: ChatMessage }) => {
          if (ack?.success && ack.message) appendMessage(ack.message);
        });
      } else {
        const res = mode === "owner"
          ? await apiClient.chat.sendMessage(sessionId, trimmed)
          : await apiClient.chat.sendMessage(sessionId, trimmed, customerToken);
        if (res.success) appendMessage(res.data);
      }
    },
    [sessionId, mode, customerToken, appendMessage]
  );

  // Fire the quick-issue-tile's prefilled message once the thread is ready.
  useEffect(() => {
    if (ready && initialMessage && !sentInitialRef.current) {
      sentInitialRef.current = true;
      send(initialMessage);
    }
  }, [ready, initialMessage, send]);

  const handleInputChange = (value: string) => {
    setInput(value);
    const socket = socketRef.current;
    if (!sessionId || !socket?.connected) return;
    socket.emit("typing", { sessionId, isTyping: value.length > 0 });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => socket.emit("typing", { sessionId, isTyping: false }), 2000);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    send(input);
    setInput("");
  };

  const headerTitle = resolvedTitle || title || (mode === "owner" ? "Visitor" : "Vehicle Owner");

  return (
    <div className={`flex flex-col h-full w-full bg-white ${className}`}>
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <MessageCircle size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold truncate">{headerTitle}</p>
            <p className="text-[11px] text-indigo-100 font-medium">
              {peerTyping ? "Typing…" : subtitle || "RepiChat"}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
            aria-label="Close chat"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-2.5 bg-gray-50">
        {!ready && (
          <div className="flex items-center justify-center h-full text-gray-400 gap-2 text-xs font-medium">
            <Loader2 size={16} className="animate-spin" /> Connecting…
          </div>
        )}
        {ready && messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-400 text-xs font-medium text-center px-6">
            No messages yet. Say hello — replies arrive here in real time.
          </div>
        )}
        {messages.map((msg) => {
          const isOwn = msg.sender_type === mode;
          return (
            <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-medium shadow-sm ${
                  isOwn
                    ? "bg-indigo-600 text-white rounded-br-sm"
                    : "bg-white text-gray-800 border border-gray-100 rounded-bl-sm"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                <div className={`flex items-center gap-1 mt-1 ${isOwn ? "justify-end text-indigo-100" : "text-gray-400"}`}>
                  <span className="text-[10px]">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {isOwn && (
                    msg.read_at ? (
                      <CheckCheck size={13} className="text-[#60A5FA]" title="✓✓ Read" />
                    ) : (msg as any).delivered_at ? (
                      <CheckCheck size={13} className="text-indigo-200" title="✓✓ Delivered" />
                    ) : (
                      <Check size={13} className="text-indigo-200" title="✓ Sent" />
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 border-t border-gray-100 bg-white shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Type a message…"
          disabled={!ready}
          className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-500 disabled:opacity-50 transition-colors"
        />
        <button
          type="submit"
          disabled={!ready || !input.trim()}
          className="w-10 h-10 shrink-0 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Send message"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

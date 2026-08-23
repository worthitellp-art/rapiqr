/**
 * AssistantChat — the popup the "Ask the RepiQR Assistant" button opens.
 *
 * It owns the whole conversation: the greeting, the suggested questions and
 * the transcript all come from the scanned sticker's category, so a helmet tag
 * opens with helmet questions instead of the vehicle ones every category used
 * to inherit. Questions the category already answers are answered on the spot;
 * anything else goes to `onAskServer`, which is where ScanPage passes the
 * backend-brokered model call.
 */
import React, { useEffect, useRef, useState } from "react";
import { ChevronRight, Send, Sparkles, X } from "lucide-react";
import type { CategoryVariant } from "./categoryVariants";

export type ChatMessage = { role: "user" | "assistant"; content: string; ts: number };

export interface AssistantChatProps {
  open: boolean;
  onClose: () => void;
  variant: CategoryVariant;
  /** Returns the assistant's reply, or null when the server can't be reached. */
  onAskServer: (messages: { role: "user" | "assistant"; content: string }[]) => Promise<string | null>;
}

export default function AssistantChat({ open, onClose, variant, onAskServer }: AssistantChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, open]);

  /* Escape closes it, the page behind stops scrolling, and the composer takes focus. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 120);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      clearTimeout(focusTimer);
    };
  }, [open, onClose]);

  const send = async (preset?: string) => {
    const prompt = (preset ?? input).trim();
    if (!prompt || loading) return;

    const history: ChatMessage[] = [...messages, { role: "user", content: prompt, ts: Date.now() }];
    setMessages(history);
    if (!preset) setInput("");

    /* The category's own suggested questions already have written answers, so
       tapping one is answered instantly instead of paying a round-trip. */
    const canned = variant.ai.find(([q]) => q.toLowerCase() === prompt.toLowerCase());
    if (canned) {
      setMessages([...history, { role: "assistant", content: canned[1], ts: Date.now() }]);
      return;
    }

    setLoading(true);
    let reply: string | null = null;
    try {
      reply = await onAskServer(history.map(({ role, content }) => ({ role, content })));
    } catch {
      /* fall through to the offline reply */
    }
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content:
          reply ||
          `I couldn't reach the server just now. The buttons on the previous screen still work — they reach whoever this ${variant.label.toLowerCase()} tag belongs to directly.`,
        ts: Date.now(),
      },
    ]);
    setLoading(false);
  };

  if (!open) return null;

  const avatar = (
    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-xs">
      <Sparkles size={15} className="text-white" />
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="RepiQR assistant"
    >
      <div
        className="bg-white w-full max-w-lg h-[92vh] sm:h-[640px] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — names the tag the visitor actually scanned */}
        <div className="bg-gradient-to-br from-violet-600 via-indigo-600 to-indigo-700 px-4 pt-5 pb-4 sm:pt-4 text-white flex items-center gap-3 flex-shrink-0 relative">
          <div className="w-10 h-1.5 bg-white/40 rounded-full absolute left-1/2 -translate-x-1/2 top-2 sm:hidden" />
          <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0 backdrop-blur-xs">
            <Sparkles size={21} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-black text-[15px] leading-tight flex items-center gap-2">
              RepiQR Assistant
              <span className="text-[9px] bg-white/20 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" /> Online
              </span>
            </h3>
            <p className="text-[11px] text-white/75 font-semibold mt-0.5 truncate">
              {variant.label} tag · you stay anonymous
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
            aria-label="Close chat"
          >
            <X size={17} className="text-white" />
          </button>
        </div>

        {/* Transcript */}
        <div className="flex-1 px-4 py-4 overflow-y-auto space-y-3 bg-slate-50">
          {messages.length === 0 && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-start gap-2.5">
                {avatar}
                <div className="bg-white border border-gray-200/90 rounded-2xl rounded-tl-sm px-3.5 py-3 text-[12.5px] font-medium text-gray-800 leading-relaxed shadow-xs">
                  {variant.aiHello}
                </div>
              </div>

              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 pt-1 pl-1">
                Common questions
              </p>
              <div className="space-y-2">
                {variant.ai.map(([question], i) => (
                  <button
                    key={i}
                    onClick={() => send(question)}
                    className="w-full text-left bg-white border border-gray-200 hover:border-violet-300 hover:bg-violet-50/40 rounded-2xl px-3.5 py-3 text-[12.5px] font-semibold text-gray-700 flex items-center gap-2 transition-all cursor-pointer active:scale-98"
                  >
                    <span className="flex-1">{question}</span>
                    <ChevronRight size={15} className="text-gray-300 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              {msg.role === "assistant" && <div className="mb-4">{avatar}</div>}
              <div className={`max-w-[80%] flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`rounded-2xl px-3.5 py-2.5 text-[12.5px] font-medium leading-relaxed shadow-xs ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-br-sm"
                      : "bg-white text-gray-800 border border-gray-200/90 rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-[9.5px] font-bold text-gray-400 px-1">
                  {new Date(msg.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-end gap-2 animate-fade-in">
              {avatar}
              <div className="bg-white border border-gray-200/90 rounded-2xl rounded-bl-sm px-4 py-3.5 shadow-xs flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Suggestion strip — only once the conversation has started */}
        {messages.length > 0 && (
          <div className="px-3 py-2 bg-white border-t border-gray-100 flex items-center gap-2 overflow-x-auto no-scrollbar flex-shrink-0">
            {variant.ai.map(([question], i) => (
              <button
                key={i}
                onClick={() => send(question)}
                disabled={loading}
                className="text-[11px] font-bold text-gray-600 bg-gray-100 hover:bg-violet-50 hover:text-violet-700 px-3 py-1.5 rounded-full whitespace-nowrap border border-gray-200 hover:border-violet-200 transition-all flex-shrink-0 cursor-pointer disabled:opacity-50"
              >
                {question}
              </button>
            ))}
          </div>
        )}

        {/* Composer */}
        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="p-3 bg-white border-t border-gray-200 flex items-center gap-2 flex-shrink-0"
        >
          <input
            ref={inputRef}
            type="text"
            placeholder={`Ask about this ${variant.label.toLowerCase()} tag...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 min-w-0 px-4 py-3 text-[12.5px] bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-violet-400 focus:bg-white font-medium transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center shadow-md transition-all flex-shrink-0 cursor-pointer active:scale-95"
            aria-label="Send"
          >
            <Send size={17} />
          </button>
        </form>
      </div>
    </div>
  );
}

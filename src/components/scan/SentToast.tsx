import { useEffect, useState } from "react";
import { Check, AlertTriangle, TriangleAlert, Loader2 } from "lucide-react";

export type SentToastTone = "pending" | "success" | "warning" | "error";

interface SentToastProps {
  text: string;
  tone?: SentToastTone;
  durationMs?: number;
  onClose: () => void;
}

const TONE_STYLE: Record<SentToastTone, { iconBg: string; border: string; Icon: typeof Check; spin?: boolean }> = {
  pending: { iconBg: "bg-slate-400", border: "border-slate-100", Icon: Loader2, spin: true },
  success: { iconBg: "bg-emerald-500", border: "border-emerald-100", Icon: Check },
  warning: { iconBg: "bg-amber-500", border: "border-amber-100", Icon: AlertTriangle },
  error: { iconBg: "bg-red-500", border: "border-red-100", Icon: TriangleAlert },
};

/**
 * Floating confirmation toast for scan-page send actions (WhatsApp/SMS alert
 * dispatch, chat message, etc). Fixed to the top of the viewport so it works
 * the same whether the bespoke car/bike screen or a category tile sheet is
 * active, and sits above the chat panel it often opens alongside.
 */
export default function SentToast({ text, tone = "success", durationMs = tone === "pending" ? 6000 : 3200, onClose }: SentToastProps) {
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    setClosing(false);
    const closeTimer = setTimeout(() => setClosing(true), durationMs);
    return () => clearTimeout(closeTimer);
  }, [text, durationMs]);

  useEffect(() => {
    if (!closing) return;
    const removeTimer = setTimeout(onClose, 220);
    return () => clearTimeout(removeTimer);
  }, [closing, onClose]);

  const { iconBg, border, Icon, spin } = TONE_STYLE[tone];

  return (
    <div className="fixed top-4 inset-x-0 z-[9999] flex justify-center px-4 pointer-events-none">
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-auto flex items-center gap-3 bg-white ${border} border shadow-xl shadow-black/10 rounded-2xl pl-3 pr-4 py-3 max-w-sm ${
          closing ? "animate-toast-out" : "animate-success-pop"
        }`}
      >
        <span className={`w-8 h-8 rounded-full ${iconBg} flex items-center justify-center flex-shrink-0 ${tone === "success" ? "animate-save-pulse" : ""}`}>
          <Icon size={16} strokeWidth={3} className={`text-white ${spin ? "animate-spin" : ""}`} />
        </span>
        <p className="text-[13px] font-bold text-[#211922] leading-snug">{text}</p>
      </div>
    </div>
  );
}

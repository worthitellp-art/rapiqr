import type React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

const TONE: Record<"success" | "danger" | "info" | "warning", { bg: string; fg: string; icon: React.ReactNode }> = {
  success: { bg: "bg-[var(--fx-green-soft)]", fg: "text-[var(--fx-green)]", icon: <CheckCircle2 size={16} /> },
  danger: { bg: "bg-[var(--fx-red-soft)]", fg: "text-[var(--fx-red)]", icon: <AlertCircle size={16} /> },
  info: { bg: "bg-[var(--fx-blue-soft)]", fg: "text-[var(--fx-blue)]", icon: <Info size={16} /> },
  warning: { bg: "bg-[var(--fx-amber-soft)]", fg: "text-[var(--fx-amber)]", icon: <AlertCircle size={16} /> },
};

/** Inline success/error/info message strip — replaces the ad-hoc two-tone
 * `<div>` banners duplicated across AccountSettingsPanel, EmergencyContactsPanel,
 * CompleteProfilePopup, SupportLegalPanel, etc. */
export default function FxBanner({
  tone,
  children,
  onDismiss,
}: {
  tone: "success" | "danger" | "info" | "warning";
  children: React.ReactNode;
  onDismiss?: () => void;
}) {
  const t = TONE[tone];
  return (
    <div className={`flex items-start gap-2.5 rounded-lg px-3.5 py-3 text-[13px] leading-relaxed ${t.bg} ${t.fg}`}>
      <span className="flex-shrink-0 mt-0.5">{t.icon}</span>
      <span className="flex-1">{children}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="flex-shrink-0 opacity-60 hover:opacity-100 cursor-pointer" aria-label="Dismiss">
          <X size={14} />
        </button>
      )}
    </div>
  );
}

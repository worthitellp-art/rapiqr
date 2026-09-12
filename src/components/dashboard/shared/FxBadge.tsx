import type React from "react";

const TONE_CLASS: Record<"success" | "pending" | "danger" | "info" | "neutral" | "accent", { bg: string; fg: string; dot: string }> = {
  success: { bg: "bg-[var(--fx-green-soft)]", fg: "text-[var(--fx-green)]", dot: "bg-[var(--fx-green)]" },
  pending: { bg: "bg-[var(--fx-amber-soft)]", fg: "text-[var(--fx-amber)]", dot: "bg-[var(--fx-amber)]" },
  danger: { bg: "bg-[var(--fx-red-soft)]", fg: "text-[var(--fx-red)]", dot: "bg-[var(--fx-red)]" },
  info: { bg: "bg-[var(--fx-blue-soft)]", fg: "text-[var(--fx-blue)]", dot: "bg-[var(--fx-blue)]" },
  neutral: { bg: "bg-[var(--fx-canvas)]", fg: "text-[var(--fx-ink-2)]", dot: "bg-[var(--fx-ink-2)]" },
  accent: { bg: "bg-[var(--fx-accent-soft)]", fg: "text-[var(--fx-accent-ink)]", dot: "bg-[var(--fx-accent)]" },
};

/** Status/badge pill — replaces ad-hoc raw-hex status chips scattered across
 * both dashboards (StatusPill, client badge literals, etc). */
export default function FxBadge({
  tone = "neutral",
  children,
  dot = false,
}: {
  tone?: "success" | "pending" | "danger" | "info" | "neutral" | "accent";
  children: React.ReactNode;
  dot?: boolean;
}) {
  const t = TONE_CLASS[tone];
  return (
    <span className={`fx-pill ${t.bg} ${t.fg}`}>
      {dot && <span className={`fx-pill-dot ${t.dot}`} />}
      {children}
    </span>
  );
}

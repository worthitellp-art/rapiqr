import type React from "react";

type Tone = "neutral" | "green" | "amber" | "red";

export interface FxKpiCardSpec {
  key: string;
  label: string;
  value: React.ReactNode;
  tone?: Tone;
  icon?: React.ReactNode;
  /** Short status chip beside the value (e.g. "62%"). Keep it to a few characters. */
  badge?: { text: string; tone?: Tone };
}

const TONE_VALUE_CLASS: Record<Tone, string> = {
  neutral: "text-[var(--fx-ink)]",
  green: "text-[var(--fx-green)]",
  amber: "text-[var(--fx-amber)]",
  red: "text-[var(--fx-red)]",
};

const TONE_BADGE_CLASS: Record<Tone, string> = {
  neutral: "bg-[var(--fx-canvas)] text-[var(--fx-ink-2)]",
  green: "bg-[var(--fx-green-soft)] text-[var(--fx-green)]",
  amber: "bg-[var(--fx-amber-soft)] text-[var(--fx-amber)]",
  red: "bg-[var(--fx-red-soft)] text-[var(--fx-red)]",
};

/**
 * Horizontal KPI strip — one-word label + big absolute value per card, hairline
 * dividers between cards, and an optional small status badge. Cards share width
 * evenly and wrap on narrow screens instead of scrolling, since dashboard KPI
 * counts here are short.
 */
export default function FxKpiStrip({ cards }: { cards: FxKpiCardSpec[] }) {
  return (
    <div className="flex flex-wrap border border-[var(--fx-border)] rounded-[var(--fx-radius-card)] bg-[var(--fx-surface)] overflow-hidden">
      {cards.map((c, i) => (
        <div
          key={c.key}
          className={`flex-1 min-w-[140px] px-5 py-4 ${i > 0 ? "border-l border-[var(--fx-border)]" : ""}`}
        >
          <div className="flex items-center gap-1.5 fx-text-body-regular text-[var(--fx-ink-2)]">
            {c.icon}
            <span className="truncate">{c.label}</span>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <span className={`fx-text-kpi-value ${TONE_VALUE_CLASS[c.tone || "neutral"]}`}>{c.value}</span>
            {c.badge && (
              <span
                className={`inline-flex items-center h-5 px-1.5 rounded-[6px] text-[11px] font-semibold tabular-nums ${TONE_BADGE_CLASS[c.badge.tone || "neutral"]}`}
              >
                {c.badge.text}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

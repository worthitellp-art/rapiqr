import type React from "react";

export interface FxKpiCardSpec {
  key: string;
  label: string;
  value: React.ReactNode;
  tone?: "neutral" | "green" | "amber" | "red";
  icon?: React.ReactNode;
}

const TONE_VALUE_CLASS: Record<NonNullable<FxKpiCardSpec["tone"]>, string> = {
  neutral: "text-[var(--fx-ink)]",
  green: "text-[var(--fx-green)]",
  amber: "text-[var(--fx-amber)]",
  red: "text-[var(--fx-red)]",
};

/**
 * Horizontal KPI strip — label + big value per card, hairline dividers
 * between cards (no outer card padding mismatch), matching the Yu Studio
 * CRM reference's KPI row. Cards share width evenly and wrap on narrow
 * screens instead of scrolling, since dashboard KPI counts here are short.
 */
export default function FxKpiStrip({ cards }: { cards: FxKpiCardSpec[] }) {
  return (
    <div className="flex flex-wrap border border-[var(--fx-border)] rounded-[var(--fx-radius-card)] bg-[var(--fx-surface)] overflow-hidden">
      {cards.map((c, i) => (
        <div
          key={c.key}
          className={`flex-1 min-w-[150px] px-5 py-4 ${i > 0 ? "border-l border-[var(--fx-border)]" : ""}`}
        >
          <div className="flex items-center gap-1.5 fx-text-body-regular text-[var(--fx-ink-2)]">
            {c.icon}
            <span className="truncate">{c.label}</span>
          </div>
          <div className={`fx-text-kpi-value mt-1.5 ${TONE_VALUE_CLASS[c.tone || "neutral"]}`}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}

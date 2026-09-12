import type React from "react";

/** Four muted, canvas-compatible hues for data categorization (not UI chrome —
 * the single sparing UI accent stays reserved for the "blue" slot). "purple"
 * and "cream" both resolve to the same neutral slate tone. */
const COLOR_MAP: Record<string, { chip: string; bar: string; ink: string }> = {
  blue: { chip: "bg-[var(--fx-accent-soft)] text-[var(--fx-accent-ink)]", bar: "bg-[var(--fx-accent)]", ink: "var(--fx-accent)" },
  orange: { chip: "bg-[var(--fx-amber-soft)] text-[var(--fx-amber)]", bar: "bg-[var(--fx-amber)]", ink: "var(--fx-amber)" },
  purple: { chip: "bg-[var(--fx-canvas)] text-[var(--fx-ink-2)]", bar: "bg-[var(--fx-ink-2)]", ink: "var(--fx-ink-2)" },
  cream: { chip: "bg-[var(--fx-canvas)] text-[var(--fx-ink-2)]", bar: "bg-[var(--fx-ink-2)]", ink: "var(--fx-ink-2)" },
  green: { chip: "bg-[var(--fx-green-soft)] text-[var(--fx-green)]", bar: "bg-[var(--fx-green)]", ink: "var(--fx-green)" },
};

/** Small stat card: icon chip, label, big number, colored progress bar — the
 * right-rail 2x2 KPI grid (Users / Clicks / Sales / Items) in the reference. */
export default function FxStatTile({
  icon,
  label,
  value,
  color = "blue",
  progress,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  color?: keyof typeof COLOR_MAP;
  /** 0–100. Omit to hide the progress bar. */
  progress?: number;
}) {
  const c = COLOR_MAP[color] || COLOR_MAP.blue;
  return (
    <div className="fx-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${c.chip}`}>{icon}</span>
        <span className="text-[12.5px] font-medium text-[var(--fx-ink-2)] truncate">{label}</span>
      </div>
      <div className="fx-display text-[22px] text-[var(--fx-ink)] leading-none">{value}</div>
      {typeof progress === "number" && (
        <div className="w-full h-[5px] rounded-full bg-[var(--fx-canvas)] overflow-hidden">
          <div
            className={`h-full rounded-full ${c.bar}`}
            style={{ width: `${Math.max(4, Math.min(100, progress))}%` }}
          />
        </div>
      )}
    </div>
  );
}

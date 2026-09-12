import type React from "react";

export interface FxAssetTile {
  icon: React.ReactNode;
  count: React.ReactNode;
  name: string;
  bg: string;
  fg: string;
  onClick?: () => void;
}

/** The "My Asset" panel: a headline total + a 2x2 grid of colored tiles,
 * matching the reference dashboard's asset breakdown card. */
export default function FxAssetCard({
  title = "My Asset",
  total,
  totalDelta,
  tiles,
}: {
  title?: string;
  total: React.ReactNode;
  totalDelta?: string;
  tiles: FxAssetTile[];
}) {
  return (
    <div className="fx-card p-6 space-y-5">
      <div>
        <h3 className="text-[13px] font-semibold text-[var(--fx-ink-2)]">{title}</h3>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="fx-display text-[26px] text-[var(--fx-ink)]">{total}</span>
          {totalDelta && <span className="text-[12.5px] font-semibold text-[var(--fx-green)]">{totalDelta}</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {tiles.map((t, i) => (
          <button
            key={i}
            onClick={t.onClick}
            disabled={!t.onClick}
            className="text-left rounded-lg p-4 space-y-6 transition-transform enabled:hover:-translate-y-0.5 enabled:cursor-pointer"
            style={{ background: t.bg }}
          >
            <span
              className="w-8 h-8 rounded-md flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.55)", color: t.fg }}
            >
              {t.icon}
            </span>
            <div>
              <p className="text-[11.5px] font-medium" style={{ color: t.fg, opacity: 0.75 }}>{t.count}</p>
              <p className="text-[13.5px] font-bold" style={{ color: t.fg }}>{t.name}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

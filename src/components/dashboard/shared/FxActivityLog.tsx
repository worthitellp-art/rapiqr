import type React from "react";

export interface FxActivityItem {
  id: string;
  avatar: React.ReactNode;
  avatarBg: string;
  title: string;
  subtitle: string;
  time: string;
}

/** The "Activity Log" feed — avatar chip, title/subtitle, relative time. */
export default function FxActivityLog({
  title = "Activity Log",
  items,
  onViewAll,
}: {
  title?: string;
  items: FxActivityItem[];
  onViewAll?: () => void;
}) {
  return (
    <div className="fx-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-bold text-[var(--fx-ink)]">{title}</h3>
        {onViewAll && (
          <button onClick={onViewAll} className="text-[12px] font-semibold text-[var(--fx-accent)] hover:underline cursor-pointer">
            View All
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-[12.5px] text-[var(--fx-faint)] py-6 text-center">No recent activity.</p>
      ) : (
        <div className="space-y-4">
          {items.map((it) => (
            <div key={it.id} className="flex items-start gap-3">
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-white"
                style={{ background: it.avatarBg }}
              >
                {it.avatar}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-[var(--fx-ink)] leading-tight">{it.title}</p>
                <p className="text-[11.5px] text-[var(--fx-faint)] leading-tight mt-0.5">{it.subtitle}</p>
              </div>
              <span className="text-[10.5px] text-[var(--fx-faint)] flex-shrink-0 pt-0.5">{it.time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

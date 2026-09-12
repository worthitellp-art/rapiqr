import type React from "react";

export interface FxTodoItem {
  id: string;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  percent: number;
}

/** The "To-do List" card — icon, title/subtitle, and a percent readout per row. */
export default function FxTodoList({
  title = "To-do List",
  items,
  onViewAll,
}: {
  title?: string;
  items: FxTodoItem[];
  onViewAll?: () => void;
}) {
  return (
    <div className="fx-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-bold text-[var(--fx-ink)]">{title}</h3>
        {onViewAll && (
          <button onClick={onViewAll} className="text-[12.5px] font-semibold text-[var(--fx-accent)] hover:underline cursor-pointer">
            View All
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-[12.5px] text-[var(--fx-faint)] py-6 text-center">Nothing pending right now.</p>
      ) : (
        <div className="divide-y divide-[var(--fx-border)]">
          {items.map((it) => (
            <div key={it.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <span className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: it.iconBg }}>
                {it.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-semibold text-[var(--fx-ink)] truncate">{it.title}</p>
                <p className="text-[11.5px] text-[var(--fx-faint)] truncate">{it.subtitle}</p>
              </div>
              <span className="text-[13px] font-bold text-[var(--fx-ink)] flex-shrink-0">{it.percent}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

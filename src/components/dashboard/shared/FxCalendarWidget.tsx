import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Decorative current-month week strip matching the reference's calendar
 * widget — no event data source exists yet, so this is purely a date picker
 * feel (today highlighted), same as the reference. */
export default function FxCalendarWidget() {
  const today = new Date();
  const [anchor, setAnchor] = useState(new Date(today));

  const startOfWeek = new Date(anchor);
  startOfWeek.setDate(anchor.getDate() - anchor.getDay());

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  const monthLabel = anchor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

  return (
    <div className="fx-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-bold text-[var(--fx-ink)]">{monthLabel}</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setAnchor((d) => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; })}
            className="w-6 h-6 rounded-full flex items-center justify-center text-[var(--fx-faint)] hover:bg-[var(--fx-canvas)] hover:text-[var(--fx-ink)] cursor-pointer"
          >
            <ChevronLeft size={13} />
          </button>
          <button
            onClick={() => setAnchor((d) => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; })}
            className="w-6 h-6 rounded-full flex items-center justify-center text-[var(--fx-faint)] hover:bg-[var(--fx-canvas)] hover:text-[var(--fx-ink)] cursor-pointer"
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center">
        {days.map((d, i) => {
          const isToday = isSameDay(d, today);
          return (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <span className="text-[10px] font-medium text-[var(--fx-faint)]">{DAY_LABELS[d.getDay()]}</span>
              <span
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-[12.5px] font-semibold ${
                  isToday ? "bg-[var(--fx-accent)] text-white" : "text-white border border-[var(--fx-border)]"
                }`}
              >
                {d.getDate()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

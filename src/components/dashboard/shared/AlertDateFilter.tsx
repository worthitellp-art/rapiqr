import React from 'react';
import { CalendarDays, X } from 'lucide-react';

/** `1d` = the last 24 hours (the default); `day` = one calendar day picked below. */
export type AlertRange = '1d' | '7d' | '30d' | 'all' | 'day';

export interface AlertDateFilterValue {
  range: AlertRange;
  /** Local calendar day, YYYY-MM-DD. Only read when `range` is `day`. */
  day: string;
}

export const DEFAULT_ALERT_FILTER: AlertDateFilterValue = { range: '1d', day: '' };

const DAY_MS = 24 * 60 * 60 * 1000;

/** Local YYYY-MM-DD for a Date — the value a date input reads and writes. */
export function toLocalDayKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Whether an alert's timestamp falls inside the chosen range. */
export function isInAlertRange(timestamp: string | number | Date, value: AlertDateFilterValue, now = Date.now()): boolean {
  const t = new Date(timestamp).getTime();
  if (Number.isNaN(t)) return false;

  if (value.range === 'all') return true;

  if (value.range === 'day') {
    if (!value.day) return true;
    const [y, m, d] = value.day.split('-').map(Number);
    const start = new Date(y, m - 1, d).getTime();
    const end = new Date(y, m - 1, d + 1).getTime();
    return t >= start && t < end;
  }

  const windowMs = value.range === '1d' ? DAY_MS : value.range === '7d' ? 7 * DAY_MS : 30 * DAY_MS;
  return t >= now - windowMs;
}

const CHIPS: { key: AlertRange; label: string }[] = [
  { key: '1d', label: 'Last 24h' },
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: 'all', label: 'All' },
];

/**
 * Range chips plus a calendar-day picker for the alert lists. Picking a day
 * switches to that day; the chips return to a rolling window.
 */
export default function AlertDateFilter({
  value,
  onChange,
}: {
  value: AlertDateFilterValue;
  onChange: (next: AlertDateFilterValue) => void;
}) {
  const todayKey = toLocalDayKey(new Date());
  const pickingDay = value.range === 'day';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
        {CHIPS.map((chip) => {
          const active = value.range === chip.key;
          return (
            <button
              key={chip.key}
              type="button"
              onClick={() => onChange({ range: chip.key, day: '' })}
              aria-pressed={active}
              className={`px-2.5 py-1 rounded-[var(--fx-radius-control)] text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                active
                  ? 'bg-[var(--fx-ink)] text-white'
                  : 'bg-white border border-[var(--fx-border)] text-[var(--fx-ink-2)] hover:bg-[var(--fx-canvas)]'
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      <label
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--fx-radius-control)] text-xs font-semibold cursor-pointer transition-colors ${
          pickingDay
            ? 'bg-[var(--fx-ink)] text-white'
            : 'bg-white border border-[var(--fx-border)] text-[var(--fx-ink-2)] hover:bg-[var(--fx-canvas)]'
        }`}
      >
        <CalendarDays size={13} />
        <span className="sr-only">Pick a date</span>
        <input
          type="date"
          max={todayKey}
          value={pickingDay ? value.day : ''}
          onChange={(e) => {
            if (e.target.value) onChange({ range: 'day', day: e.target.value });
          }}
          className="bg-transparent outline-none text-xs font-semibold cursor-pointer"
          style={{ color: pickingDay ? 'white' : 'var(--fx-ink-2)' }}
        />
      </label>

      {pickingDay && (
        <button
          type="button"
          onClick={() => onChange(DEFAULT_ALERT_FILTER)}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-[var(--fx-radius-control)] text-xs font-semibold text-[var(--fx-ink-2)] hover:bg-[var(--fx-canvas)] cursor-pointer"
          aria-label="Back to last 24 hours"
        >
          <X size={12} /> Back to 24h
        </button>
      )}
    </div>
  );
}

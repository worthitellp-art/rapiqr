import { Search } from "lucide-react";

/** Pill search input matching the reference top bar's "Quick Search..." field. */
export function FxSearchInput({
  value,
  onChange,
  placeholder = "Search",
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`relative w-full min-w-0 ${className}`}>
      <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--fx-faint)]" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 h-[38px] text-[13px] rounded-[var(--fx-radius-control)] border border-[var(--fx-border)] bg-[var(--fx-canvas)] text-[var(--fx-ink)] placeholder-[var(--fx-faint)] outline-none transition-all focus:ring-2 focus:ring-[var(--fx-accent)]/25 focus:border-[var(--fx-accent)]"
      />
    </div>
  );
}

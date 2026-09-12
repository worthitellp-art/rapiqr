import type React from "react";
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
        className="w-full pl-9 pr-3 h-[36px] text-[13px] rounded-full border border-[var(--fx-border)] bg-[var(--fx-canvas)] text-[var(--fx-ink)] placeholder-[var(--fx-faint)] outline-none transition-all focus:ring-2 focus:ring-[var(--fx-accent)]/25 focus:border-[var(--fx-accent)]"
      />
    </div>
  );
}

/** Round icon button used for mail/bell-style actions in the top bar. */
export function FxIconButton({
  icon,
  onClick,
  title,
  badge,
}: {
  icon: React.ReactNode;
  onClick?: () => void;
  title?: string;
  badge?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="relative w-9 h-9 flex-shrink-0 rounded-full border border-[var(--fx-border)] bg-[var(--fx-surface)] flex items-center justify-center text-[var(--fx-ink-2)] hover:text-[var(--fx-ink)] hover:border-[var(--fx-accent)]/40 transition-colors cursor-pointer"
    >
      {icon}
      {badge && (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--fx-accent)] ring-2 ring-[var(--fx-surface)]" />
      )}
    </button>
  );
}

/** Avatar + name trigger for the profile dropdown in the top-right of the top bar. */
export function FxAvatarTrigger({
  name,
  role,
  onClick,
}: {
  name: string;
  role?: string;
  onClick?: () => void;
}) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 pl-1 pr-3 h-9 rounded-full border border-[var(--fx-border)] bg-[var(--fx-surface)] hover:border-[var(--fx-accent)]/40 transition-colors cursor-pointer min-w-0"
    >
      <span className="w-7 h-7 rounded-full bg-[var(--fx-accent)] text-white text-[12px] font-bold flex items-center justify-center flex-shrink-0">
        {initial}
      </span>
      <span className="min-w-0 text-left hidden sm:block">
        <span className="block text-[12.5px] font-semibold text-[var(--fx-ink)] truncate leading-tight">{name}</span>
        {role && <span className="block text-[10.5px] text-[var(--fx-faint)] truncate leading-tight capitalize">{role}</span>}
      </span>
    </button>
  );
}

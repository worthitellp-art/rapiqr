import type React from "react";

export default function FxNavItem({
  active,
  danger,
  label,
  badge,
  onClick,
  children,
}: {
  active?: boolean;
  danger?: boolean;
  label: string;
  badge?: number;
  onClick: () => void;
  children: React.ReactNode;
  key?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`w-full flex items-center gap-2.5 h-[38px] px-3 rounded-[var(--fx-radius-control)] text-[13.5px] cursor-pointer relative group ${
        active
          ? "bg-[var(--fx-surface)] text-[var(--fx-ink)] font-semibold shadow-[var(--fx-shadow-raised)]"
          : danger
          ? "text-[var(--fx-sidebar-ink)] hover:bg-[var(--fx-red-soft)] hover:text-[var(--fx-red)]"
          : "text-[var(--fx-sidebar-ink)] hover:bg-[var(--fx-sidebar-hover)] hover:text-[var(--fx-ink)]"
      }`}
    >
      <span className="text-inherit flex-shrink-0">{children}</span>
      <span className="flex-1 text-left truncate">{label}</span>
      {!!badge && badge > 0 && (
        <span className="ml-auto min-w-[20px] h-5 flex items-center justify-center text-[11px] font-medium px-1 rounded-[6px] bg-[var(--fx-surface)] text-[var(--fx-sidebar-ink)] shadow-[var(--fx-shadow-raised)]">
          {badge}
        </span>
      )}
    </button>
  );
}

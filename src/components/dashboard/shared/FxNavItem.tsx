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
      className={`w-full flex items-center gap-2.5 h-[38px] pl-2.5 pr-3 rounded-lg text-[13.5px] transition-colors cursor-pointer relative group border-l-2 ${
        active
          ? "bg-[var(--fx-accent-soft)] text-[var(--fx-ink)] font-semibold border-l-[var(--fx-accent)]"
          : danger
          ? "text-[var(--fx-sidebar-ink)] border-l-transparent hover:bg-[var(--fx-red-soft)] hover:text-[var(--fx-red)]"
          : "text-[var(--fx-sidebar-ink)] border-l-transparent hover:bg-[var(--fx-sidebar-hover)] hover:text-[var(--fx-ink)]"
      }`}
    >
      <span className="text-inherit flex-shrink-0">{children}</span>
      <span className="flex-1 text-left truncate">{label}</span>
      {!!badge && badge > 0 && (
        <span
          className={`ml-auto text-[10.5px] font-bold px-1.5 py-0.5 rounded-full ${
            active ? "bg-[var(--fx-accent)] text-white" : "bg-[var(--fx-sidebar-hover)] text-[var(--fx-sidebar-ink)]"
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

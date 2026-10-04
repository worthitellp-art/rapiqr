import type React from "react";

export default function FxNavItem({
  active,
  danger,
  label,
  badge,
  badgeTone = "neutral",
  onClick,
  children,
}: {
  active?: boolean;
  danger?: boolean;
  label: string;
  badge?: number;
  /** `alert` = red pill, for counts that mean "something needs you" (alerts, unread chats). */
  badgeTone?: "neutral" | "alert";
  onClick: () => void;
  children: React.ReactNode;
  key?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={`w-full flex items-center gap-2.5 h-[38px] px-3 rounded-[var(--fx-radius-control)] text-[13.5px] cursor-pointer relative group focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--fx-accent)] ${
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
        <span
          className={`ml-auto min-w-[20px] h-5 flex items-center justify-center text-[11px] font-semibold px-1.5 rounded-[6px] tabular-nums ${
            badgeTone === "alert"
              ? "bg-[var(--fx-red-soft)] text-[var(--fx-red)]"
              : "bg-[var(--fx-surface)] text-[var(--fx-sidebar-ink)] shadow-[var(--fx-shadow-raised)]"
          }`}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </button>
  );
}

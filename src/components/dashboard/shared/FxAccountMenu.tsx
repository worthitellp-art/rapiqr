import type React from "react";
import { useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { MorphingPopover, MorphingPopoverContent, MorphingPopoverTrigger } from "../../ui/morphing-popover";
import InitialAvatar from "../../common/InitialAvatar";

export interface FxAccountMenuItem {
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  onClick: () => void;
  danger?: boolean;
}

const TONE_CLASS = {
  ok: "text-[var(--fx-green)]",
  warn: "text-[var(--fx-amber)]",
  neutral: "text-[var(--fx-ink-2)]",
} as const;

/**
 * Sidebar footer: the signed-in person as a card that morphs open into the
 * account menu (Settings, Back to site, Sign out). One menu instead of a
 * permanent Settings row plus a Sign-out button competing for the footer.
 */
export default function FxAccountMenu({
  name,
  email,
  subtitle,
  tone = "neutral",
  menu,
}: {
  name: string;
  email?: string;
  subtitle?: string;
  tone?: keyof typeof TONE_CLASS;
  menu: FxAccountMenuItem[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <MorphingPopover open={open} onOpenChange={setOpen} className="w-full">
      <MorphingPopoverTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className="w-full flex items-center gap-2.5 p-2 rounded-[var(--fx-radius-control)] bg-[var(--fx-sidebar-hover)] hover:bg-[var(--fx-border)] text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fx-accent)]"
        >
          <InitialAvatar name={name} email={email} size={32} />
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-semibold text-[var(--fx-ink)] truncate leading-tight">{name}</span>
            {subtitle && <span className={`block text-[11.5px] truncate mt-0.5 ${TONE_CLASS[tone]}`}>{subtitle}</span>}
          </span>
          <ChevronsUpDown size={14} className="text-[var(--fx-faint)] flex-shrink-0" />
        </button>
      </MorphingPopoverTrigger>

      <MorphingPopoverContent
        className="bottom-full left-0 right-0 mb-2 p-1.5 rounded-[var(--fx-radius-card)] border-[var(--fx-border)] bg-[var(--fx-surface)] text-[var(--fx-ink)]"
        variants={{
          initial: { opacity: 0, y: 6 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: 6 },
        }}
      >
        {menu.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className={`w-full flex items-center gap-2.5 h-9 px-2.5 rounded-[var(--fx-radius-control)] text-[13px] text-left cursor-pointer ${
                item.danger
                  ? "text-[var(--fx-red)] hover:bg-[var(--fx-red-soft)]"
                  : "text-[var(--fx-ink-2)] hover:bg-[var(--fx-sidebar-hover)] hover:text-[var(--fx-ink)]"
              }`}
            >
              <Icon size={15} strokeWidth={2} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </MorphingPopoverContent>
    </MorphingPopover>
  );
}

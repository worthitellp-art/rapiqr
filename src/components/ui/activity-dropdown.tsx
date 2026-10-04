import { useState } from 'react';
import type { ReactNode } from 'react';
import { Bell, ChevronUp } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface ActivityItem {
  id: string | number;
  icon: ReactNode;
  title: string;
  description?: string;
  time?: string;
}

export interface ActivityDropdownProps {
  title: string;
  /** Shown under the title while collapsed. */
  subtitle?: string;
  /** Header tile icon (defaults to a bell). */
  icon?: ReactNode;
  items: ActivityItem[];
  defaultOpen?: boolean;
  /** Shown instead of the list when `items` is empty. */
  emptyText?: string;
  /** Optional link at the bottom of the open list. */
  action?: { label: string; onClick: () => void };
  className?: string;
}

/**
 * Card whose header expands into a staggered list of recent activity. Uses the
 * dashboards' own colour tokens, so it sits next to the other `fx-card`s.
 */
export function ActivityDropdown({
  title,
  subtitle,
  icon,
  items,
  defaultOpen = false,
  emptyText = 'Nothing here yet.',
  action,
  className,
}: ActivityDropdownProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className={cn(
        'w-full overflow-hidden border border-[var(--fx-border)] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]',
        'transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]',
        isOpen ? 'rounded-3xl' : 'rounded-2xl',
        className
      )}
    >
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        className="flex w-full cursor-pointer select-none items-center gap-4 p-4 text-left"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--fx-canvas)] text-[var(--fx-ink-2)]">
          {icon ?? <Bell className="h-5 w-5" />}
        </span>
        <span className="flex-1 overflow-hidden">
          <span className="block text-base font-semibold text-[var(--fx-ink)]">{title}</span>
          {subtitle && (
            <span
              className={cn(
                'block text-sm text-[var(--fx-ink-2)]',
                'transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]',
                isOpen ? 'mt-0 max-h-0 opacity-0' : 'mt-0.5 max-h-6 opacity-100'
              )}
            >
              {subtitle}
            </span>
          )}
        </span>
        <span className="flex h-8 w-8 items-center justify-center">
          <ChevronUp
            className={cn(
              'h-5 w-5 text-[var(--fx-faint)] transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]',
              isOpen ? 'rotate-0' : 'rotate-180'
            )}
          />
        </span>
      </button>

      <div
        className={cn(
          'grid transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]',
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden">
          <div className="px-2 pb-4">
            {items.length === 0 ? (
              <p className="px-3 py-6 text-center text-[12.5px] text-[var(--fx-faint)]">{emptyText}</p>
            ) : (
              <div className="space-y-1">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className={cn(
                      'flex items-start gap-3 rounded-xl p-3 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-[var(--fx-canvas)]',
                      isOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                    )}
                    style={{ transitionDelay: isOpen ? `${index * 75}ms` : '0ms' }}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--fx-canvas)] text-[var(--fx-ink-2)]">
                      {item.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-[var(--fx-ink)]">{item.title}</span>
                      {item.description && (
                        <span className="block truncate text-sm text-[var(--fx-ink-2)]">{item.description}</span>
                      )}
                    </span>
                    {item.time && <span className="shrink-0 pt-0.5 text-xs text-[var(--fx-faint)]">{item.time}</span>}
                  </div>
                ))}
              </div>
            )}

            {action && items.length > 0 && (
              <div className="px-3 pt-2">
                <button
                  type="button"
                  onClick={action.onClick}
                  className="cursor-pointer text-xs font-semibold text-[var(--fx-accent)] hover:underline"
                >
                  {action.label} ›
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ActivityDropdown;

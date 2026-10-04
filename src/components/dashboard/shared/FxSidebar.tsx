import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { FlowButton } from "../../ui/flow-button";
import FxSidebarShell from "./FxSidebarShell";
import FxNavItem from "./FxNavItem";
import FxAccountMenu, { FxAccountMenuItem } from "./FxAccountMenu";

export interface FxSidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  /** Items sharing a section collapse together; items with none render flat at the top. */
  section?: string;
  badge?: number;
  badgeTone?: "neutral" | "alert";
}

interface FxSidebarProps {
  /** Namespaces the remembered open/closed state of the groups (one per dashboard). */
  storageKey: string;
  items: FxSidebarItem[];
  activeId: string;
  onSelect: (id: string) => void;
  /** Mobile drawer state — ignored at md+ where the sidebar is always docked. */
  isOpen?: boolean;
  onClose?: () => void;
  logo: React.ReactNode;
  /** The one primary action for this dashboard, shown as the flow button. */
  cta?: { label: string; onClick: () => void };
  /** Optional block between the CTA and the nav (e.g. onboarding progress). */
  widget?: React.ReactNode;
  account: {
    name: string;
    email?: string;
    subtitle?: string;
    tone?: "ok" | "warn" | "neutral";
    menu: FxAccountMenuItem[];
  };
}

function readCollapsed(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

/**
 * The sidebar every dashboard mounts: logo, one primary action, grouped nav
 * whose groups fold shut (same chevron + grid-rows motion as ActivityDropdown),
 * and an account card that morphs into its menu. Callers pass data only —
 * items, the active id, and what each click does.
 */
export default function FxSidebar({
  storageKey,
  items,
  activeId,
  onSelect,
  isOpen = false,
  onClose,
  logo,
  cta,
  widget,
  account,
}: FxSidebarProps) {
  const prefKey = `fx-nav-collapsed:${storageKey}`;
  const [collapsed, setCollapsed] = useState<string[]>(() => readCollapsed(prefKey));

  useEffect(() => {
    try {
      localStorage.setItem(prefKey, JSON.stringify(collapsed));
    } catch {
      /* a UI preference only — fine to lose */
    }
  }, [prefKey, collapsed]);

  const groups = useMemo(() => {
    const out: { section?: string; items: FxSidebarItem[] }[] = [];
    for (const item of items) {
      const group = out.find((g) => g.section === item.section);
      if (group) group.items.push(item);
      else out.push({ section: item.section, items: [item] });
    }
    // Flat (section-less) items lead, then the folders in the order they first appear.
    return out.sort((a, b) => Number(Boolean(a.section)) - Number(Boolean(b.section)));
  }, [items]);

  const toggle = (section: string) =>
    setCollapsed((prev) => (prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]));

  const select = (id: string) => {
    onSelect(id);
    onClose?.();
  };

  const renderItem = (item: FxSidebarItem) => {
    const Icon = item.icon;
    return (
      <FxNavItem
        key={item.id}
        active={activeId === item.id}
        label={item.label}
        badge={item.badge}
        badgeTone={item.badgeTone}
        onClick={() => select(item.id)}
      >
        <Icon size={16} strokeWidth={2} />
      </FxNavItem>
    );
  };

  return (
    <FxSidebarShell
      isOpen={isOpen}
      onClose={onClose}
      logoSlot={logo}
      footerSlot={<FxAccountMenu {...account} />}
    >
      {(cta || widget) && (
        <div className="space-y-3 pb-3">
          {cta && (
            <FlowButton tone="dark" size="sm" fullWidth onClick={() => { cta.onClick(); onClose?.(); }}>
              {cta.label}
            </FlowButton>
          )}
          {widget}
        </div>
      )}

      {groups.map((group) => {
        if (!group.section) {
          return (
            <div key="flat" className="space-y-0.5 pb-1">
              {group.items.map(renderItem)}
            </div>
          );
        }

        // A folder holding the current page never folds shut under the user.
        const holdsActive = group.items.some((i) => i.id === activeId);
        const open = holdsActive || !collapsed.includes(group.section);
        const panelId = `fx-nav-${storageKey}-${group.section.replace(/\W+/g, "-").toLowerCase()}`;

        return (
          <div key={group.section} className="pt-1">
            <button
              type="button"
              onClick={() => toggle(group.section!)}
              aria-expanded={open}
              aria-controls={panelId}
              className="w-full flex items-center justify-between h-8 px-3 rounded-[var(--fx-radius-control)] text-[12px] font-medium text-[var(--fx-faint)] hover:text-[var(--fx-ink-2)] cursor-pointer"
            >
              <span>{group.section}</span>
              <ChevronDown
                size={13}
                className={`transition-transform duration-300 motion-reduce:transition-none ${open ? "" : "-rotate-90"}`}
              />
            </button>
            <div
              id={panelId}
              className={`grid transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none ${
                open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden -mx-1 px-1" inert={!open}>
                <div className="space-y-0.5 pb-1">{group.items.map(renderItem)}</div>
              </div>
            </div>
          </div>
        );
      })}
    </FxSidebarShell>
  );
}

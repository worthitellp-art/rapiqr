import type React from "react";
import { useState, useMemo } from "react";
import {
  Globe,
  LogOut,
  ChevronsUpDown,
  X,
  ShieldCheck,
  Check,
} from "lucide-react";
import { NAV_ITEMS, REPICHAT_NAV_ITEM } from "./constants";
import AppLogo from "../../common/AppLogo";

interface SidebarProps {
  page: string;
  setPage: (p: string) => void;
  admin: { name: string; email?: string; role?: string };
  onBack: () => void;
  onSignOut: () => void;
  /** Count per nav id (alerts, orders, distributors, messages, repichat); 0/absent shows nothing. */
  badges?: Record<string, number>;
  /** Mobile drawer state — ignored at md+ where the sidebar is always docked. */
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({
  page,
  setPage,
  admin,
  onBack,
  onSignOut,
  badges = {},
  isOpen = false,
  onClose,
}: SidebarProps) {
  const isClientUser = admin.role === "Client Account";
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  const navItems = isClientUser
    ? [
        { id: "qr", label: "Your Codes", icon: NAV_ITEMS.find((i) => i.id === "qr")!.icon },
        { id: "alerts", label: "Alerts", icon: NAV_ITEMS.find((i) => i.id === "alerts")!.icon },
        REPICHAT_NAV_ITEM,
      ]
    : NAV_ITEMS;

  // Group nav items by section (matching reference style)
  const groupedSections = useMemo(() => {
    const groups: { section: string; items: typeof navItems }[] = [];
    const sectionMap = new Map<string, typeof navItems>();

    navItems.forEach((item) => {
      const section = (item as any).section || "MAIN";
      if (!sectionMap.has(section)) {
        sectionMap.set(section, []);
      }
      sectionMap.get(section)!.push(item);
    });

    sectionMap.forEach((items, section) => {
      groups.push({ section, items });
    });

    return groups;
  }, [navItems]);

  const handleSelectPage = (id: string) => {
    setPage(id);
    onClose?.();
  };

  const userInitials = (admin.name || "Admin")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200/80 flex flex-col justify-between select-none
        transition-transform duration-200 ease-in-out md:static md:translate-x-0
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}
    >
      {/* ── Top Section: Workspace Selector & Close (mobile) ────── */}
      <div className="p-4 border-b border-gray-100 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          {/* Workspace Switcher Card matching image copy 2.png */}
          <div className="relative w-full">
            <button
              type="button"
              onClick={() => setIsWorkspaceMenuOpen((prev) => !prev)}
              className="w-full flex items-center justify-between p-2 rounded-xl border border-gray-200/70 bg-white hover:bg-gray-50/80 hover:border-gray-300 transition-all text-left cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Brand Squircle Icon Container */}
                <div className="w-8 h-8 rounded-lg bg-linear-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shrink-0 shadow-xs font-bold text-sm tracking-tight">
                  <span className="font-sans font-black text-xs">R</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-xs text-gray-900 truncate">RapiQR Fleet</span>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  </div>
                  <span className="text-[11px] text-gray-400 font-medium truncate">Operations Console</span>
                </div>
              </div>
              <ChevronsUpDown size={14} className="text-gray-400 group-hover:text-gray-600 shrink-0 ml-1.5" />
            </button>

            {/* Workspace Dropdown */}
            {isWorkspaceMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsWorkspaceMenuOpen(false)}
                />
                <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white rounded-xl border border-gray-200 shadow-lg p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2.5 py-1.5 flex items-center justify-between text-[11px] font-semibold text-gray-900 bg-gray-50 rounded-lg">
                    <span>RapiQR Fleet (Live)</span>
                    <Check size={13} className="text-emerald-600" />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsWorkspaceMenuOpen(false);
                      onBack();
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-[11px] text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <Globe size={13} />
                    <span>Public Storefront</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={onClose}
            className="md:hidden p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer ml-1"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* ── Middle Section: Grouped Navigation Links ─────────── */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5 custom-scrollbar-light">
        {groupedSections.map((group) => (
          <div key={group.section} className="space-y-0.5">
            {/* Section Header */}
            <div className="px-3 py-1 text-[10.5px] font-bold uppercase tracking-wider text-gray-400">
              {group.section}
            </div>

            {/* Nav Items */}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = page === item.id;
              const badgeCount = badges[item.id] || 0;
              const isAlertItem = item.id === "alerts";

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectPage(item.id)}
                  className={`
                    w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer group
                    ${
                      isActive
                        ? "bg-gray-100/90 text-gray-950 font-semibold shadow-2xs"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50/80"
                    }
                  `}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon
                      size={16}
                      className={`
                        shrink-0 transition-colors
                        ${isActive ? "text-gray-900" : "text-gray-400 group-hover:text-gray-600"}
                      `}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {/* Badge Pills */}
                  {badgeCount > 0 && (
                    <span
                      className={`
                        text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0
                        ${
                          isAlertItem
                            ? "bg-red-50 text-red-600 border border-red-200/60"
                            : "bg-gray-100 text-gray-600 border border-gray-200/60"
                        }
                      `}
                    >
                      {badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* ── Bottom Section: User Profile & Account Controls ──── */}
      <div className="p-3 border-t border-gray-100 relative">
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsAccountMenuOpen((prev) => !prev)}
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer text-left group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                {userInitials}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-xs text-gray-900 truncate">{admin.name || "Admin"}</span>
                <span className="text-[11px] text-gray-400 truncate">{admin.role || "Administrator"}</span>
              </div>
            </div>
            <ChevronsUpDown size={14} className="text-gray-400 group-hover:text-gray-600 shrink-0" />
          </button>

          {/* Account Popover Menu */}
          {isAccountMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setIsAccountMenuOpen(false)}
              />
              <div className="absolute bottom-full left-0 right-0 mb-1.5 z-30 bg-white rounded-xl border border-gray-200 shadow-xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-900 truncate">{admin.name}</p>
                  <p className="text-[11px] text-gray-400 truncate">{admin.email || "admin@rapiqr.com"}</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsAccountMenuOpen(false);
                    onBack();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                >
                  <Globe size={14} className="text-gray-400" />
                  <span>Back to site</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsAccountMenuOpen(false);
                    onSignOut();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>Sign out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}

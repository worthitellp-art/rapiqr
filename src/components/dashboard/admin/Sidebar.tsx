import { LogOut, Settings as SettingsIcon } from "lucide-react";
import { NAV_ITEMS, REPICHAT_NAV_ITEM } from "./constants";
import AppLogo from "../../common/AppLogo";
import FxSidebarShell from "../shared/FxSidebarShell";
import FxNavItem from "../shared/FxNavItem";

export default function Sidebar({
  page,
  setPage,
  admin,
  onBack,
  onSignOut,
  unreadAlerts,
  unreadChats,
  isOpen = false,
  onClose,
}: {
  page: string;
  setPage: (p: string) => void;
  admin: { name: string; email?: string; role?: string };
  onBack: () => void;
  onSignOut: () => void;
  unreadAlerts?: number;
  unreadChats?: number;
  /** Mobile drawer state — ignored at md+ where the sidebar is always docked. */
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const isClientUser = admin.role === "Client Account";

  const mainNav = isClientUser
    ? [
        { id: "qr", label: "Your Codes", icon: NAV_ITEMS.find((i) => i.id === "qr")!.icon },
        { id: "alerts", label: "Alerts", icon: NAV_ITEMS.find((i) => i.id === "alerts")!.icon },
        REPICHAT_NAV_ITEM,
      ]
    : NAV_ITEMS;

  return (
    <FxSidebarShell
      isOpen={isOpen}
      onClose={onClose}
      logoSlot={
        <a
          href="/"
          className="flex items-center cursor-pointer group"
          onClick={(e) => {
            e.preventDefault();
            onBack();
          }}
          aria-label="RapiQR Console home"
        >
          <AppLogo variant="light" className="h-7 w-auto object-contain transition-transform group-hover:scale-105" />
        </a>
      }
      footerSlot={
        <>
          <button
            onClick={() => { setPage("customize"); onClose?.(); }}
            className="w-full flex items-center gap-2.5 h-[38px] px-3 rounded-lg text-[13.5px] text-[var(--fx-sidebar-ink)] hover:text-[var(--fx-ink)] hover:bg-[var(--fx-sidebar-hover)] transition-colors cursor-pointer"
          >
            <SettingsIcon size={15} />
            <span>Settings</span>
          </button>

          <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--fx-sidebar-hover)] mt-2">
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-bold text-[var(--fx-ink)] truncate leading-tight">{admin.name}</p>
              <p className="text-[10px] font-medium text-[var(--fx-accent-ink)] truncate tracking-normal capitalize">{admin.role || "Admin"}</p>
            </div>
            <button
              onClick={onSignOut}
              className="p-1.5 rounded-lg text-[var(--fx-sidebar-ink)] hover:text-[var(--fx-red)] hover:bg-[var(--fx-red-soft)] transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </>
      }
    >
      {(() => {
        let lastSection: string | undefined;
        return mainNav.map((item) => {
          const Icon = item.icon;
          const isActive = page === item.id;
          const badge = item.id === "alerts" ? unreadAlerts : item.id === "repichat" ? unreadChats : undefined;
          const section = (item as { section?: string }).section;
          const showLabel = section && section !== lastSection;
          lastSection = section;

          return (
            <div key={item.id}>
              {showLabel && (
                <p className="px-3 pt-4 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--fx-faint)]">
                  {section}
                </p>
              )}
              <FxNavItem active={isActive} label={item.label} badge={badge} onClick={() => { setPage(item.id); onClose?.(); }}>
                <Icon size={15} strokeWidth={2} />
              </FxNavItem>
            </div>
          );
        });
      })()}
    </FxSidebarShell>
  );
}

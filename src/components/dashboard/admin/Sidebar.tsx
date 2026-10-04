import { Globe, LogOut } from "lucide-react";
import { NAV_ITEMS, REPICHAT_NAV_ITEM } from "./constants";
import AppLogo from "../../common/AppLogo";
import FxSidebar, { FxSidebarItem } from "../shared/FxSidebar";

const ALERT_TONE_IDS = new Set(["alerts", "messages", "repichat"]);

export default function Sidebar({
  page,
  setPage,
  admin,
  onBack,
  onSignOut,
  badges = {},
  isOpen = false,
  onClose,
}: {
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
}) {
  const isClientUser = admin.role === "Client Account";

  const navItems = isClientUser
    ? [
        { id: "qr", label: "Your Codes", icon: NAV_ITEMS.find((i) => i.id === "qr")!.icon },
        { id: "alerts", label: "Alerts", icon: NAV_ITEMS.find((i) => i.id === "alerts")!.icon },
        REPICHAT_NAV_ITEM,
      ]
    : NAV_ITEMS;

  const items: FxSidebarItem[] = navItems.map((item) => ({
    ...item,
    section: (item as { section?: string }).section,
    badge: badges[item.id],
    // Red only where the count means "something is going wrong / waiting on you now".
    badgeTone: ALERT_TONE_IDS.has(item.id) ? "alert" : "neutral",
  }));

  return (
    <FxSidebar
      storageKey="admin"
      items={items}
      activeId={page}
      onSelect={setPage}
      isOpen={isOpen}
      onClose={onClose}
      logo={
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
      cta={isClientUser ? undefined : { label: "Generate tags", onClick: () => setPage("qr") }}
      account={{
        name: admin.name,
        email: admin.email,
        subtitle: admin.role || "Admin",
        menu: [
          { label: "Back to site", icon: Globe, onClick: onBack },
          { label: "Sign out", icon: LogOut, onClick: onSignOut, danger: true },
        ],
      }}
    />
  );
}

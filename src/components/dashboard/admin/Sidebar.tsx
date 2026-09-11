import type React from "react";
import { LogOut, ChevronRight, X, Settings as SettingsIcon } from "lucide-react";
import { NAV_ITEMS, REPICHAT_NAV_ITEM } from "./constants";
import AppLogo from "../../common/AppLogo";

function SideItem({
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
      className={`w-full flex items-center gap-2.5 h-[38px] px-3 rounded-2xl text-sm transition-colors cursor-pointer relative group ${
        active
          ? "bg-[#FFF7DC] text-[#211922] font-semibold"
          : danger
          ? "text-[#62625B] hover:bg-[#FDEAEA] hover:text-[#9E0A0A]"
          : "text-[#62625B] hover:bg-[#F6F6F3] hover:text-[#211922]"
      }`}
    >
      <span className="text-inherit">{children}</span>
      <span className="flex-1 text-left font-body">{label}</span>
      {!!badge && badge > 0 && (
        <span
          className={`ml-auto font-mono text-[10.5px] font-bold px-1.5 py-0.5 rounded-full ${
            active ? "bg-[#F6C000] text-[#211922]" : "bg-[#EFEFEA] text-[#62625B]"
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

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
    <aside
      className={`w-[220px] flex-shrink-0 flex flex-col h-full py-[18px] px-3 fixed inset-y-0 left-0 z-50 transition-transform duration-300 border-r border-[#EAEAE5] md:sticky md:top-0 md:z-20 md:translate-x-0 ${
        isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      }`}
      style={{ background: "#FFFFFF", fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── Brand Header ────────────────────── */}
      <div className="flex items-center justify-between px-2 mb-5 flex-shrink-0">
        <a
          href="/"
          className="flex items-center cursor-pointer group"
          onClick={(e) => {
            e.preventDefault();
            onBack();
          }}
          aria-label="RapiQR Console home"
        >
          <AppLogo variant="light" className="h-8 w-auto object-contain transition-transform group-hover:scale-105" />
        </a>
        <button
          onClick={onClose}
          className="md:hidden p-1.5 rounded-xl text-[#62625B] hover:text-[#211922] hover:bg-[#F6F6F3] transition-colors cursor-pointer"
          aria-label="Close navigation menu"
        >
          <X size={16} />
        </button>
      </div>

      

      {/* ── Section Label ──────────────── */}
      <div className="px-2.5 pb-2 font-body text-[11px] font-semibold tracking-normal text-[#91918C]">
        Fleet Operations
      </div>

      {/* ── Main Navigation ──────────────── */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto custom-scrollbar-light pr-0.5">
        {mainNav.map((item) => {
          const Icon = item.icon;
          const isActive = page === item.id;
          const badge = item.id === "alerts" ? unreadAlerts : item.id === "repichat" ? unreadChats : undefined;

          return (
            <SideItem key={item.id} active={isActive} label={item.label} badge={badge} onClick={() => { setPage(item.id); onClose?.(); }}>
              <Icon size={15} strokeWidth={2} />
            </SideItem>
          );
        })}
      </nav>

      {/* ── Bottom Fixed Utilities ──────────────── */}
      <div className="pt-3 border-t border-[#EAEAE5] space-y-1">
        <button
          onClick={() => { setPage("customize"); onClose?.(); }}
          className="w-full flex items-center gap-2.5 h-[38px] px-3 rounded-2xl text-sm text-[#62625B] hover:text-[#211922] hover:bg-[#F6F6F3] transition-colors cursor-pointer"
        >
          <SettingsIcon size={15} />
          <span>Settings</span>
        </button>

        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#F6F6F3] mt-2">
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-bold text-[#211922] truncate leading-tight">{admin.name}</p>
            <p className="text-[10px] font-medium text-[#A16207] truncate tracking-normal capitalize">{admin.role || "Admin"}</p>
          </div>
          <button
            onClick={onSignOut}
            className="p-1.5 rounded-xl text-[#62625B] hover:text-[#9E0A0A] hover:bg-[#FDEAEA] transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}

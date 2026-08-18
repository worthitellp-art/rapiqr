import type React from "react";
import { LogOut, Tag, ShieldCheck, ChevronRight, HelpCircle, Settings as SettingsIcon } from "lucide-react";
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
      className={`w-full flex items-center gap-2.5 h-[34px] px-2.5 rounded-[5px] text-sm transition-all cursor-pointer relative group ${
        active
          ? "bg-[#303235] text-white"
          : danger
          ? "text-[#C9CACC] hover:bg-[#DC2626]/10 hover:text-[#DC2626]"
          : "text-[#C9CACC] hover:bg-[#303235] hover:text-white"
      }`}
    >
      <span className="text-inherit">{children}</span>
      <span className="flex-1 text-left font-body">{label}</span>
      {!!badge && badge > 0 && (
        <span
          className={`ml-auto font-mono text-[10.5px] font-bold px-1.5 py-0.5 rounded-[4px] ${
            active ? "bg-[#5C78DF] text-white" : "bg-white/10 text-[#9CA0A6]"
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
}: {
  page: string;
  setPage: (p: string) => void;
  admin: { name: string; email?: string; role?: string };
  onBack: () => void;
  onSignOut: () => void;
  unreadAlerts?: number;
  unreadChats?: number;
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
      className="w-[220px] flex-shrink-0 flex flex-col h-full py-[18px] px-3 sticky top-0 z-20"
      style={{ background: "#111315", fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── Brand Header ────────────────────── */}
      <a
        href="/"
        className="flex items-center px-2 mb-5 cursor-pointer flex-shrink-0 group"
        onClick={(e) => {
          e.preventDefault();
          onBack();
        }}
        aria-label="RapiQR Console home"
      >
        <AppLogo variant="dark" className="h-8 w-auto object-contain transition-transform group-hover:scale-105" />
      </a>

      {/* ── Setup Progress Card Widget ─────────────── */}
      <div className="mx-0.5 mb-[9px] border border-[#414347] rounded-[7px] p-3 text-white">
        <div className="flex items-center justify-between text-xs mb-[9px]">
          <span className="text-white">Set up your fleet</span>
          <ChevronRight size={14} className="text-[#C9CACC]" />
        </div>
        <div className="w-full bg-[#3D4142] rounded-[5px] h-[5px] overflow-hidden">
          <div className="h-full bg-[#4FC47A] rounded-[5px]" style={{ width: "88%" }} />
        </div>
        <div className="text-[11px] mt-[7px] text-[#ddd]">6/7 completed</div>
      </div>

      {/* ── Section Label ──────────────── */}
      <div className="px-2.5 pb-2 font-body text-[11px] font-semibold tracking-normal text-[#777B80]">
        Fleet Operations
      </div>

      {/* ── Main Navigation ──────────────── */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto custom-scrollbar pr-0.5">
        {mainNav.map((item) => {
          const Icon = item.icon;
          const isActive = page === item.id;
          const badge = item.id === "alerts" ? unreadAlerts : item.id === "repichat" ? unreadChats : undefined;

          return (
            <SideItem key={item.id} active={isActive} label={item.label} badge={badge} onClick={() => setPage(item.id)}>
              <Icon size={15} strokeWidth={2} />
            </SideItem>
          );
        })}
      </nav>

      {/* ── Bottom Fixed Utilities ──────────────── */}
      <div className="pt-3 border-t border-[#292B2E] space-y-1">
        <button
          onClick={() => setPage("customize")}
          className="w-full flex items-center gap-2.5 h-[34px] px-2.5 rounded-[5px] text-sm text-[#C9CACC] hover:text-white hover:bg-[#303235] transition-all cursor-pointer"
        >
          <SettingsIcon size={15} />
          <span>Settings</span>
        </button>

        <div className="flex items-center justify-between p-2.5 rounded-[7px] bg-[#292B2E] border border-[#414347] mt-2">
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-bold text-white truncate leading-tight">{admin.name}</p>
            <p className="text-[10px] font-medium text-[#5C78DF] truncate tracking-normal capitalize">{admin.role || "Admin"}</p>
          </div>
          <button
            onClick={onSignOut}
            className="p-1.5 rounded-[4px] text-[#C9CACC] hover:text-[#DC2626] hover:bg-[#DC2626]/10 transition-all cursor-pointer"
            title="Sign Out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}

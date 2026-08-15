import type React from "react";
import { LogOut, HelpCircle } from "lucide-react";
import { NAV_ITEMS } from "./constants";
import { avatarUrl } from "./helpers";
import AppLogo from "../../common/AppLogo";

function SideItem({
  active,
  danger,
  label,
  badge,
  onClick,
  children,
}: {
  key?: string;
  active?: boolean;
  danger?: boolean;
  label: string;
  badge?: number;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all cursor-pointer ${
        active
          ? "bg-white text-[#111111] shadow-[0_4px_16px_rgba(0,0,0,0.25)] font-bold scale-[1.02]"
          : danger
          ? "text-red-400 hover:bg-white/10"
          : "text-white/70 hover:bg-white/10 hover:text-white"
      }`}
    >
      {children}
      <span className="flex-1 text-left tracking-wide">{label}</span>
      {!!badge && badge > 0 && (
        <span
          className="min-w-[20px] h-[20px] px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center shadow-sm"
          style={{ background: "#EF4444", color: "#fff" }}
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
}: {
  page: string;
  setPage: (p: string) => void;
  admin: { name: string; email?: string; role?: string };
  onBack: () => void;
  onSignOut: () => void;
  unreadAlerts?: number;
}) {
  const isClientUser = admin.role === "Client Account";

  const mainNav = isClientUser
    ? [
        { id: "qr", label: "Your Code", icon: NAV_ITEMS[1].icon },
        { id: "alerts", label: "Alerts", icon: NAV_ITEMS[3].icon },
      ]
    : NAV_ITEMS;

  return (
    <aside
      className="w-[240px] flex-shrink-0 flex flex-col h-full py-5 px-3.5 shadow-2xl relative z-20"
      style={{ background: "#14161C", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* ── Logo ─────────────────────────── */}
      <a
        href="/"
        className="flex items-center gap-3 px-2 mb-7 cursor-pointer flex-shrink-0 group"
        onClick={(e) => {
          e.preventDefault();
          onBack();
        }}
        aria-label="RapiQR home"
      >
        <AppLogo variant="dark" className="h-7 w-auto object-contain transition-transform group-hover:scale-105" />
      </a>

      {/* ── Main Navigation ──────────────── */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar">
        {mainNav.map((item) => {
          const Icon = item.icon;
          const isActive = page === item.id;
          return (
            <SideItem
              key={item.id}
              active={isActive}
              label={item.label}
              badge={item.id === "alerts" ? unreadAlerts : undefined}
              onClick={() => setPage(item.id)}
            >
              <Icon size={19} strokeWidth={isActive ? 2.3 : 1.8} className={isActive ? "text-[#EAB308]" : ""} />
            </SideItem>
          );
        })}
      </nav>

      {/* ── Bottom: Help, Sign Out, Avatar ── */}
      <div className="flex-shrink-0 pt-3 space-y-1" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <SideItem label="Help & Support" onClick={() => {}}>
          <HelpCircle size={18} strokeWidth={1.8} />
        </SideItem>

        <SideItem
          danger
          label="Sign Out"
          onClick={() => {
            onSignOut();
            onBack();
          }}
        >
          <LogOut size={18} strokeWidth={1.8} />
        </SideItem>

        <div className="flex items-center gap-3 px-2.5 py-2.5 mt-2 rounded-xl bg-white/5 border border-white/10">
          <img
            src={avatarUrl(admin.name)}
            alt={admin.name}
            className="w-9 h-9 rounded-full object-cover flex-shrink-0 bg-white/10 p-0.5"
            style={{ border: "2px solid rgba(234,179,8,0.6)" }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-bold text-white truncate leading-tight">{admin.name}</p>
            <p className="text-[10px] font-bold mt-0.5 text-[#EAB308] truncate uppercase tracking-wider">
              {admin.role || "Client"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

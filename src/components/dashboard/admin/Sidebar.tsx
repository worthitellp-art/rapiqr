import { LogOut, HelpCircle } from "lucide-react";
import { NAV_ITEMS } from "./constants";
import { avatarUrl } from "./helpers";
import groupLogo1 from "../../../assets/Group 1000005716-1.png";

export default function Sidebar({
  page, setPage, admin, onBack, onSignOut, unreadAlerts,
}: {
  page: string; setPage: (p: string) => void;
  admin: { name: string; email?: string; role?: string }; onBack: () => void; onSignOut: () => void;
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
    <aside className="w-[256px] flex-shrink-0 flex flex-col h-full bg-white border-r" style={{ borderColor: "#E8ECF4" }}>
      {/* ── Logo ─────────────────────────── */}
      <div className="px-5 h-[64px] flex items-center gap-2.5 flex-shrink-0">
        <a
          href="/"
          className="flex items-center gap-2.5 cursor-pointer"
          onClick={e => { e.preventDefault(); onBack(); }}
        >
          <div
            className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center"
            style={{ background: "#111111" }}
          >
            <img src={groupLogo1} alt="" className="h-[18px] w-auto object-contain" />
          </div>
          <span className="text-[15px] font-extrabold text-[#1A1D26] tracking-[-0.02em]">RapiQR</span>
        </a>
      </div>

      {/* ── Main Navigation ──────────────── */}
      <div className="flex-1 px-3 pt-2 overflow-y-auto custom-scrollbar">
        <nav className="space-y-[2px]">
          {mainNav.map(item => {
            const Icon = item.icon;
            const isActive = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className="w-full flex items-center gap-3 px-3 py-[10px] rounded-xl text-[13px] font-semibold transition-all duration-200 cursor-pointer"
                style={{
                  background: isActive ? "#111111" : "transparent",
                  color: isActive ? "#fff" : "#64748B",
                  boxShadow: isActive ? "0 2px 8px rgba(17,17,17,0.25)" : "none",
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "#F1F5F9"; e.currentTarget.style.color = "#1E293B"; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748B"; } }}
              >
                <Icon size={18} strokeWidth={isActive ? 2.2 : 1.7} />
                <span>{item.label}</span>
                {item.id === "alerts" && (unreadAlerts ?? 0) > 0 && (
                  <span
                    className="ml-auto text-[10px] font-bold px-[7px] py-[2px] rounded-full"
                    style={{
                      background: isActive ? "rgba(255,255,255,0.18)" : "#FEE2E2",
                      color: isActive ? "#fff" : "#DC2626",
                    }}
                  >
                    {unreadAlerts}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="my-4 mx-2 h-px" style={{ background: "#F1F5F9" }} />

        {/* ── Settings Section ────────────── */}
        <nav className="space-y-[2px]">
          <button
            className="w-full flex items-center gap-3 px-3 py-[10px] rounded-xl text-[13px] font-semibold text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B] transition-all cursor-pointer"
          >
            <HelpCircle size={18} strokeWidth={1.7} />
            <span>Help & Support</span>
          </button>
        </nav>
      </div>

      {/* ── Bottom: Sign Out + Profile ───── */}
      <div className="px-3 pb-4 flex-shrink-0 space-y-2">
        <div className="mx-2 h-px" style={{ background: "#F1F5F9" }} />

        <button
          onClick={() => { onSignOut(); onBack(); }}
          className="w-full flex items-center gap-3 px-3 py-[10px] rounded-xl text-[13px] font-semibold transition-all cursor-pointer"
          style={{ color: "#EF4444" }}
          onMouseEnter={e => { e.currentTarget.style.background = "#FEF2F2"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
        >
          <LogOut size={18} strokeWidth={1.7} />
          <span>Sign Out</span>
        </button>

        <div className="mx-2 h-px" style={{ background: "#F1F5F9" }} />

        <div className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl" style={{ background: "#F8FAFC" }}>
          <img
            src={avatarUrl(admin.name)}
            alt={admin.name}
            className="w-[36px] h-[36px] rounded-[10px] object-cover"
            style={{ background: "#E2E8F0" }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-bold text-[#1A1D26] truncate leading-tight">{admin.name}</p>
            <p className="text-[10px] font-medium mt-0.5" style={{ color: "#94A3B8" }}>{admin.role || "Client"}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

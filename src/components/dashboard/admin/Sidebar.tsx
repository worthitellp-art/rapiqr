import { Settings, LogOut, ChevronLeft } from "lucide-react";
import { NAV_ITEMS } from "./constants";
import { avatarUrl } from "./helpers";
import groupLogo1 from "../../../assets/Group 1000005716-1.png";

export default function Sidebar({
  page, setPage, admin, onBack, onSignOut,
}: {
  page: string; setPage: (p: string) => void;
  admin: { name: string; email?: string; role?: string }; onBack: () => void; onSignOut: () => void;
}) {
  const isClientUser = admin.role === "Client Account";

  const navItems = isClientUser
    ? [
        { id: "qr", label: "My Stickers", icon: NAV_ITEMS[1].icon },
        { id: "alerts", label: "My Alerts", icon: NAV_ITEMS[3].icon },
        { id: "communication", label: "Emergency Help", icon: NAV_ITEMS[2].icon },
      ]
    : NAV_ITEMS;

  return (
    <aside className="w-[260px] flex-shrink-0 flex flex-col h-full" style={{ background: "linear-gradient(180deg, #0F1117 0%, #0A0B0F 100%)" }}>
      {/* Logo Section */}
      <div className="px-5 pt-5 pb-2">
        <div className="flex items-center justify-between">
          <a
            href="/"
            className="flex items-center gap-3 cursor-pointer group"
            onClick={(e) => { e.preventDefault(); onBack(); }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(234,179,8,0.2) 0%, rgba(234,179,8,0.05) 100%)", border: "1px solid rgba(234,179,8,0.15)" }}>
              <img src={groupLogo1} alt="RapiQR" className="h-6 w-auto object-contain" />
            </div>
            <div>
              <span className="text-sm font-extrabold text-white tracking-tight block leading-none">RapiQR</span>
              <span className="text-[10px] font-semibold tracking-wide" style={{ color: "rgba(234,179,8,0.7)" }}>
                {isClientUser ? "Client Portal" : "Admin Panel"}
              </span>
            </div>
          </a>
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            title="Back to Home"
          >
            <ChevronLeft size={16} />
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 my-3 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }} />

      {/* Navigation */}
      <div className="px-3 flex-1 overflow-y-auto custom-scrollbar">
        <p className="text-[10px] font-bold tracking-[0.2em] px-4 mb-2.5 uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>Navigation</p>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 cursor-pointer group"
                style={{
                  background: active ? "linear-gradient(135deg, rgba(234,179,8,0.15) 0%, rgba(234,179,8,0.05) 100%)" : "transparent",
                  color: active ? "#EAB308" : "rgba(255,255,255,0.5)",
                  border: active ? "1px solid rgba(234,179,8,0.2)" : "1px solid transparent",
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
                  style={{
                    background: active ? "rgba(234,179,8,0.15)" : "rgba(255,255,255,0.03)",
                  }}
                >
                  <Icon size={16} strokeWidth={active ? 2.2 : 1.8} style={{ color: active ? "#EAB308" : "rgba(255,255,255,0.4)" }} />
                </div>
                <span className="truncate">{item.label}</span>
                {active && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: "#EAB308" }} />
                )}
              </button>
            );
          })}
        </nav>

        <div className="my-4 mx-4 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }} />

        <p className="text-[10px] font-bold tracking-[0.2em] px-4 mb-2.5 uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>Settings</p>
        <nav className="space-y-1">
          <button
            onClick={() => setPage("customize")}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 cursor-pointer"
            style={{
              background: page === "customize" ? "linear-gradient(135deg, rgba(234,179,8,0.15) 0%, rgba(234,179,8,0.05) 100%)" : "transparent",
              color: page === "customize" ? "#EAB308" : "rgba(255,255,255,0.5)",
              border: page === "customize" ? "1px solid rgba(234,179,8,0.2)" : "1px solid transparent",
            }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
              style={{
                background: page === "customize" ? "rgba(234,179,8,0.15)" : "rgba(255,255,255,0.03)",
              }}
            >
              <Settings size={16} strokeWidth={page === "customize" ? 2.2 : 1.8} style={{ color: page === "customize" ? "#EAB308" : "rgba(255,255,255,0.4)" }} />
            </div>
            <span className="truncate">{isClientUser ? "Account Settings" : "Settings"}</span>
            {page === "customize" && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: "#EAB308" }} />
            )}
          </button>
        </nav>
      </div>

      {/* Sign Out + User Profile */}
      <div className="px-3 pb-4">
        <button
          onClick={() => { onSignOut(); onBack(); }}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 cursor-pointer mb-3"
          style={{ color: "rgba(248,113,113,0.8)" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(248,113,113,0.1)"; e.currentTarget.style.color = "#f87171"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(248,113,113,0.8)"; }}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(248,113,113,0.1)" }}>
            <LogOut size={16} strokeWidth={1.8} />
          </div>
          <span className="truncate">Sign Out</span>
        </button>

        <div className="mx-1 mb-3 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }} />

        <div className="px-3 py-3 rounded-xl flex items-center gap-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <img
            src={avatarUrl(admin.name)}
            alt={admin.name}
            className="w-9 h-9 rounded-lg object-cover"
            style={{ background: "rgba(255,255,255,0.05)" }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-bold text-white truncate leading-tight">{admin.name}</p>
            <p className="text-[10px] font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>{admin.role || "Client Account"}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

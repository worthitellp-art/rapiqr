import { Settings, LogOut } from "lucide-react";
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
    <aside className="w-[232px] flex-shrink-0 flex flex-col h-full" style={{ background: "linear-gradient(180deg, #111318 0%, #0c0e13 100%)" }}>
      {/* Logo Section */}
      <div className="px-5 pt-5 pb-4">
        <a
          href="/"
          className="flex items-center gap-2.5 cursor-pointer group"
          onClick={(e) => { e.preventDefault(); onBack(); }}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(234,179,8,0.15)" }}>
            <img src={groupLogo1} alt="RapiQR" className="h-5 w-auto object-contain" />
          </div>
          <div>
            <span className="text-sm font-extrabold text-white tracking-tight block leading-none">RapiQR</span>
            <span className="text-[9px] font-semibold text-gray-500 tracking-wide">
              {isClientUser ? "Client Portal" : "Admin Panel"}
            </span>
          </div>
        </a>
      </div>

      {/* Navigation */}
      <div className="px-3 flex-1 overflow-y-auto">
        <p className="text-[9px] font-bold text-gray-600 tracking-[0.18em] px-3 mb-2 uppercase">Navigation</p>
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 cursor-pointer"
                style={{
                  background: active ? "#ffffff" : "transparent",
                  color: active ? "#111318" : "#94a3b8",
                  boxShadow: active ? "0 1px 4px rgba(0,0,0,0.12)" : "none",
                }}
              >
                <Icon size={16} strokeWidth={active ? 2.2 : 1.8} style={{ color: active ? "#111318" : "#64748b" }} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="my-4 mx-3 border-t border-white/5" />

        <p className="text-[9px] font-bold text-gray-600 tracking-[0.18em] px-3 mb-2 uppercase">Settings</p>
        <nav className="space-y-0.5">
          <button
            onClick={() => setPage("customize")}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 cursor-pointer"
            style={{
              background: page === "customize" ? "#ffffff" : "transparent",
              color: page === "customize" ? "#111318" : "#94a3b8",
              boxShadow: page === "customize" ? "0 1px 4px rgba(0,0,0,0.12)" : "none",
            }}
          >
            <Settings size={16} strokeWidth={page === "customize" ? 2.2 : 1.8} style={{ color: page === "customize" ? "#111318" : "#64748b" }} />
            <span className="truncate">{isClientUser ? "Account Settings" : "Settings"}</span>
          </button>
        </nav>
      </div>

      {/* Sign Out + User Profile */}
      <div className="px-3 pb-4">
        <button
          onClick={() => { onSignOut(); onBack(); }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 cursor-pointer"
          style={{ color: "#f87171" }}
        >
          <LogOut size={16} strokeWidth={1.8} />
          <span className="truncate">Sign Out</span>
        </button>

        <div className="mt-3 px-3 py-2.5 rounded-xl flex items-center gap-2.5" style={{ background: "rgba(255,255,255,0.04)" }}>
          <img
            src={avatarUrl(admin.name)}
            alt={admin.name}
            className="w-8 h-8 rounded-lg object-cover"
            style={{ background: "#1e293b" }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-white truncate leading-tight">{admin.name}</p>
            <p className="text-[10px] font-medium text-gray-500">{admin.role || "Client Account"}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

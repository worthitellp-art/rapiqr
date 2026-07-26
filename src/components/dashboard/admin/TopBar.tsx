import { Search, Bell, ChevronRight } from "lucide-react";
import { avatarUrl } from "./helpers";

export default function TopBar({
  admin, searchQuery, setSearchQuery, page,
}: {
  admin: { name: string; email?: string; role?: string };
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  page: string;
}) {
  const pageTitles: Record<string, string> = {
    overview: "Dashboard Overview",
    qr: "QR Codes & Fleet Management",
    communication: "Communication & Helplines",
    alerts: "Alerts & Notifications Feed",
    users: "Team Members & Permissions",
    customize: "Brand & Template Customization",
  };

  const pageIcons: Record<string, string> = {
    overview: "📊",
    qr: "📱",
    communication: "📞",
    alerts: "🔔",
    users: "👥",
    customize: "🎨",
  };

  return (
    <div
      className="h-16 flex-shrink-0 flex items-center justify-between px-8 border-b"
      style={{ borderColor: "rgba(0,0,0,0.06)", background: "rgba(255,255,255,0.8)", backdropFilter: "blur(12px)" }}
    >
      {/* Left: Breadcrumb & Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-medium" style={{ color: "rgba(0,0,0,0.4)" }}>
          <span>Dashboard</span>
          <ChevronRight size={12} />
          <span style={{ color: "rgba(0,0,0,0.7)" }} className="font-semibold">{pageTitles[page] || "Dashboard"}</span>
        </div>
      </div>

      {/* Right: Search & Actions */}
      <div className="flex items-center gap-3">
        {(page === "qr" || page === "alerts") && (
          <div className="relative group">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search QR, vehicle, alert..."
              className="pl-9 pr-4 py-2 text-xs bg-gray-50 rounded-xl border text-gray-900 placeholder:text-gray-400 outline-none w-56 transition-all focus:w-64 focus:bg-white focus:border-amber-300 focus:shadow-sm font-medium"
              style={{ borderColor: "rgba(0,0,0,0.08)" }}
            />
          </div>
        )}

        {/* Notification Bell */}
        <button className="relative w-9 h-9 rounded-xl bg-gray-50 border flex items-center justify-center text-gray-500 hover:bg-white hover:text-gray-700 hover:border-gray-200 transition-all cursor-pointer" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
          <Bell size={15} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "#EF4444" }} />
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-2.5 pl-3 border-l" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
          <img
            src={avatarUrl(admin.name)}
            alt={admin.name}
            className="w-8 h-8 rounded-lg object-cover"
            style={{ background: "rgba(0,0,0,0.03)" }}
          />
          <div className="hidden sm:block">
            <p className="text-xs font-bold text-gray-900 leading-none">{admin.name}</p>
            <p className="text-[10px] font-medium text-gray-500 mt-0.5">{admin.role || "Client Account"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

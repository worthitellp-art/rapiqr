import { Search, Bell } from "lucide-react";

export default function TopBar({
  admin, searchQuery, setSearchQuery, page,
}: {
  admin: { name: string };
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  page: string;
}) {
  const pageTitles: Record<string, string> = {
    overview: "Dashboard Overview", qr: "QR Codes & Fleet Management", communication: "Communication & Helplines",
    alerts: "Alerts & Notifications Feed", users: "Team Members & Permissions", customize: "Brand & Template Customization",
  };

  return (
    <div
      className="h-16 flex-shrink-0 flex items-center justify-between px-8 border-b"
      style={{ borderColor: "rgba(0,0,0,0.06)", background: "#FAFAF7" }}
    >
      <div className="flex items-center gap-3">
        <h1 className="text-base font-extrabold text-gray-900 tracking-tight">{pageTitles[page] || "Dashboard"}</h1>
      </div>

      <div className="flex items-center gap-3">
        {(page === "qr" || page === "alerts") && (
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search QR, vehicle, alert message…"
              className="pl-8 pr-4 py-2 text-xs bg-white rounded-xl border text-gray-900 placeholder:text-gray-400 outline-none w-60 transition-all focus:w-72 font-medium shadow-xs"
              style={{ borderColor: "#e2e8f0" }}
            />
          </div>
        )}

        <button className="relative w-8 h-8 rounded-xl bg-white border flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all cursor-pointer" style={{ borderColor: "#e2e8f0" }}>
          <Bell size={14} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
        </button>
      </div>
    </div>
  );
}

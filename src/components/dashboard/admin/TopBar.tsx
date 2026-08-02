import { Search, Bell, Sun } from "lucide-react";
import { avatarUrl } from "./helpers";

export default function TopBar({
  admin, searchQuery, setSearchQuery, page, switchToClientPortal,
}: {
  admin: { name: string; email?: string; role?: string };
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  page: string;
  switchToClientPortal?: () => void;
}) {
  return (
    <div
      className="h-[64px] flex-shrink-0 flex items-center justify-between px-8 bg-white border-b"
      style={{ borderColor: "#E8ECF4" }}
    >
      {/* ── Search Bar ───────────────────── */}
      <div className="relative group">
        <Search
          size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors"
          style={{ color: "#94A3B8" }}
        />
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search anything..."
          className="pl-10 pr-16 py-[9px] text-[13px] rounded-xl border outline-none w-[280px] transition-all duration-200 font-medium"
          style={{
            background: "#F8FAFC",
            borderColor: "#E8ECF4",
            color: "#1E293B",
          }}
          onFocus={e => {
            e.currentTarget.style.width = "320px";
            e.currentTarget.style.background = "#fff";
            e.currentTarget.style.borderColor = "rgba(217,119,6,0.45)";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(217,119,6,0.12)";
          }}
          onBlur={e => {
            e.currentTarget.style.width = "280px";
            e.currentTarget.style.background = "#F8FAFC";
            e.currentTarget.style.borderColor = "#E8ECF4";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
        <span
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold px-[6px] py-[3px] rounded-md select-none pointer-events-none"
          style={{ color: "#94A3B8", background: "#fff", border: "1px solid #E2E8F0" }}
        >
          ⌘K
        </span>
      </div>

      {/* ── Right Actions ────────────────── */}
      <div className="flex items-center gap-3">
        {switchToClientPortal && (
          <button
            onClick={switchToClientPortal}
            className="text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer mr-1"
          >
            Client Portal ↗
          </button>
        )}

        {/* Theme Toggle */}
        <button
          className="w-[36px] h-[36px] rounded-xl border flex items-center justify-center transition-all cursor-pointer"
          style={{ background: "#F8FAFC", borderColor: "#E8ECF4", color: "#64748B" }}
          onMouseEnter={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#1E293B"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#F8FAFC"; e.currentTarget.style.color = "#64748B"; }}
        >
          <Sun size={16} />
        </button>

        {/* Notification Bell */}
        <button
          className="relative w-[36px] h-[36px] rounded-xl border flex items-center justify-center transition-all cursor-pointer"
          style={{ background: "#F8FAFC", borderColor: "#E8ECF4", color: "#64748B" }}
          onMouseEnter={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#1E293B"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#F8FAFC"; e.currentTarget.style.color = "#64748B"; }}
        >
          <Bell size={16} />
          <span
            className="absolute top-[6px] right-[6px] w-[8px] h-[8px] rounded-full ring-2 ring-white"
            style={{ background: "#EF4444" }}
          />
        </button>

        {/* Divider */}
        <div className="w-px h-8" style={{ background: "#E8ECF4" }} />

        {/* User Avatar */}
        <img
          src={avatarUrl(admin.name)}
          alt={admin.name}
          className="w-[38px] h-[38px] rounded-xl object-cover cursor-pointer"
          style={{ background: "#E2E8F0" }}
        />
      </div>
    </div>
  );
}

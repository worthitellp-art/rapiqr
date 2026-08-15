import { Search, Bell } from "lucide-react";
import { avatarUrl } from "./helpers";
import { NAV_ITEMS } from "./constants";

export default function TopBar({
  admin,
  searchQuery,
  setSearchQuery,
  page,
  setPage,
}: {
  admin: { name: string; email?: string; role?: string };
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  page: string;
  setPage?: (p: string) => void;
}) {
  const isClientUser = admin.role === "Client Account";

  const navItems = isClientUser
    ? [
        { id: "qr", label: "YOUR CODES" },
        { id: "alerts", label: "ALERTS" },
      ]
    : NAV_ITEMS.map((item) => ({
        id: item.id,
        label: item.label.toUpperCase(),
      }));

  return (
    <div
      className="flex-shrink-0 flex flex-col bg-white border-b border-[#E8ECF4]"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* ── Top Header Row ────────────────────────────── */}
      <div className="h-[60px] px-8 flex items-center justify-between border-b border-[#F1F5F9]">
        {/* Left Greeting & Search */}
        <div className="flex items-center gap-5">
          <p className="text-[13.5px] font-medium text-[#475569]">
            Hello <span className="font-extrabold text-[#0F172A]">{admin.name}</span>
          </p>

          {/* Search Input */}
          <div className="relative ml-2 hidden sm:block">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dashboard..."
              className="pl-9 pr-14 py-1.5 text-[12px] rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-[#1E293B] outline-none w-[220px] transition-all font-medium focus:w-[280px] focus:bg-white focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/15"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-white text-[#64748B] border border-[#E2E8F0]">
              ⌘K
            </span>
          </div>
        </div>

        {/* Right Actions & Profile */}
        <div className="flex items-center gap-3">
          {/* Notifications Bell */}
          <button
            title="Notifications"
            className="relative w-9 h-9 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-white transition-colors cursor-pointer"
          >
            <Bell size={16} />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>

          {/* User Avatar */}
          <img
            src={avatarUrl(admin.name)}
            alt={admin.name}
            className="w-9 h-9 rounded-xl object-cover bg-[#F1F5F9] border border-[#E2E8F0] cursor-pointer"
          />
        </div>
      </div>

      {/* ── Secondary Sub-Navigation Tabs Strip ───────────────── */}
      <div className="h-[42px] px-8 flex items-center justify-between">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-6 overflow-x-auto custom-scrollbar h-full">
          {navItems.map((item) => {
            const isActive = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPage && setPage(item.id)}
                className={`h-full flex items-center px-1 text-[11px] font-bold tracking-wider transition-all cursor-pointer border-b-2 whitespace-nowrap ${
                  isActive
                    ? "border-[#D97706] text-[#D97706]"
                    : "border-transparent text-[#64748B] hover:text-[#0F172A] hover:border-[#E2E8F0]"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

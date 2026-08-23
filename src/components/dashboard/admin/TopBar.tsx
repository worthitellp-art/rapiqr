import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Search, Bell, Plus, Tag, UserPlus, HardDriveDownload, Menu } from "lucide-react";

export default function TopBar({
  admin,
  searchQuery,
  setSearchQuery,
  page,
  setPage,
  activeCount = 18,
  onOpenSidebar,
}: {
  admin: { name: string; email?: string; role?: string };
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  page: string;
  setPage: (p: string) => void;
  activeCount?: number;
  onOpenSidebar?: () => void;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-[57px] flex-shrink-0 bg-[#F7F7F8] border-b border-[#E5E5E7] flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-10 z-20 font-body">
      {/* ── Left: mobile menu toggle + search ────────────────── */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <button
          onClick={onOpenSidebar}
          className="md:hidden flex-shrink-0 w-8 h-8 rounded-full bg-white border border-[#E5E5E7] flex items-center justify-center text-[#17181A] cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu size={16} />
        </button>

        <div className="relative w-full max-w-[220px] min-w-0">
          <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6F7377]" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            className="w-full pl-8 pr-3 h-[31px] text-[12px] rounded-full border-0 bg-[#EFEFF0] text-[#17181A] placeholder-[#6F7377] outline-none transition-all focus:ring-2 focus:ring-[#5C78DF]/25"
          />
        </div>
      </div>

      {/* ── Right Action Cluster ──────────────────────────────────── */}
      <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
        {/* Status Badge */}
        <div className="hidden lg:inline-flex items-center gap-2 text-[12px] text-[#777B80]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4FC47A]" />
          <span className="font-bold text-[#17181A]">{activeCount}</span> tags active
        </div>

        {/* Notifications Button */}
        <button
          onClick={() => setPage("alerts")}
          title="Alerts & Notifications"
          className="relative flex items-center justify-center text-[#777] hover:text-[#17181A] transition-all cursor-pointer"
        >
          <Bell size={18} />
          <span className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] px-[3px] rounded-[4px] bg-[#5C78DF] text-white text-[9px] font-bold flex items-center justify-center leading-none" />
        </button>

        {/* "+ New" Action Button Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="inline-flex items-center gap-1.5 px-3 py-[7px] rounded-[4px] bg-[#E8EDFF] text-[#5271D5] font-semibold text-[13px] hover:bg-[#DCE3FE] transition-all cursor-pointer"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>New</span>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-[#E5E5E7] shadow-[0_4px_16px_rgba(0,0,0,0.08)] p-1.5 z-50">
              <button
                onClick={() => { setPage("qr"); setDropdownOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[4px] text-[13px] text-[#17181A] hover:bg-[#F3F3F4] font-medium transition-colors text-left"
              >
                <Tag size={15} className="text-[#5C78DF]" />
                <span>Generate Tag</span>
              </button>

              <button
                onClick={() => { setPage("users"); setDropdownOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[4px] text-[13px] text-[#17181A] hover:bg-[#F3F3F4] font-medium transition-colors text-left"
              >
                <UserPlus size={15} className="text-[#4FC47A]" />
                <span>Add User Account</span>
              </button>

              <button
                onClick={() => { setPage("backup"); setDropdownOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[4px] text-[13px] text-[#17181A] hover:bg-[#F3F3F4] font-medium transition-colors text-left"
              >
                <HardDriveDownload size={15} className="text-[#777B80]" />
                <span>Backup Fleet Data</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

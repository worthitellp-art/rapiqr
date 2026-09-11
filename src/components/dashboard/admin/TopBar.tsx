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
    <header className="h-[57px] flex-shrink-0 bg-white border-b border-[#EAEAE5] flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-10 z-20 font-body">
      {/* ── Left: mobile menu toggle + search ────────────────── */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <button
          onClick={onOpenSidebar}
          className="md:hidden flex-shrink-0 w-8 h-8 rounded-full bg-white border border-[#EAEAE5] flex items-center justify-center text-[#211922] cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu size={16} />
        </button>

        <div className="relative w-full max-w-[220px] min-w-0">
          <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#91918C]" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            className="w-full pl-8 pr-3 h-[31px] text-[12px] rounded-full border-0 bg-[#F6F6F3] text-[#211922] placeholder-[#91918C] outline-none transition-all focus:ring-2 focus:ring-[#F6C000]/40"
          />
        </div>
      </div>

      {/* ── Right Action Cluster ──────────────────────────────────── */}
      <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
        {/* Status Badge */}
        <div className="hidden lg:inline-flex items-center gap-2 text-[12px] text-[#62625B]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4FC47A]" />
          <span className="font-bold text-[#211922]">{activeCount}</span> tags active
        </div>

        {/* Notifications Button */}
        <button
          onClick={() => setPage("alerts")}
          title="Alerts & Notifications"
          className="relative flex items-center justify-center text-[#62625B] hover:text-[#211922] transition-colors cursor-pointer"
        >
          <Bell size={18} />
          <span className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] px-[3px] rounded-full bg-[#F6C000] text-[#211922] text-[9px] font-bold flex items-center justify-center leading-none" />
        </button>

        {/* "+ New" Action Button Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="inline-flex items-center gap-1.5 px-3 py-[7px] rounded-full bg-[#FFF7DC] text-[#A16207] font-semibold text-[13px] hover:bg-[#F8E9B0] transition-colors cursor-pointer"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>New</span>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-[#EAEAE5] rounded-2xl shadow-lg p-1.5 z-50">
              <button
                onClick={() => { setPage("qr"); setDropdownOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-[#211922] hover:bg-[#F6F6F3] font-medium transition-colors text-left"
              >
                <Tag size={15} className="text-[#A16207]" />
                <span>Generate Tag</span>
              </button>

              <button
                onClick={() => { setPage("users"); setDropdownOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-[#211922] hover:bg-[#F6F6F3] font-medium transition-colors text-left"
              >
                <UserPlus size={15} className="text-[#4FC47A]" />
                <span>Add User Account</span>
              </button>

              <button
                onClick={() => { setPage("backup"); setDropdownOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-[#211922] hover:bg-[#F6F6F3] font-medium transition-colors text-left"
              >
                <HardDriveDownload size={15} className="text-[#62625B]" />
                <span>Backup Fleet Data</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

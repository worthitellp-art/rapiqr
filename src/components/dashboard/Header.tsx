import React from 'react';
import { Bell, Menu, ShieldCheck } from 'lucide-react';
import { UserProfile } from '../../types';

interface HeaderProps {
  user: UserProfile;
  activeCount: number;
  notifCount: number;
  onNotifClick: () => void;
  onMenuClick: () => void;
}

export default function Header({ user, activeCount, notifCount, onNotifClick, onMenuClick }: HeaderProps) {
  const initials = user.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="flex items-center justify-between px-5 py-3 bg-[#FFFEFB] border-b border-[rgba(32,28,21,0.08)] z-20 shrink-0">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuClick}
          className="md:hidden text-[#6E6759] hover:text-[#201C15] bg-transparent border-none outline-none cursor-pointer p-1"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-base font-black tracking-tight text-[#201C15]">
            Namo<span className="text-[#E25822]">QR</span>
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-[#FBEBE1] border border-[rgba(226,88,34,0.2)] rounded-full text-[9px] font-bold text-[#E25822] uppercase tracking-widest">
            <ShieldCheck size={9} /> {activeCount} Active
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onNotifClick}
          className="relative p-2 rounded-full hover:bg-[#F0EBE0] transition-colors cursor-pointer bg-transparent border-none outline-none text-[#6E6759] hover:text-[#201C15]">
          <Bell size={18} />
          {notifCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-[#E25822] rounded-full text-[9px] text-white font-bold flex items-center justify-center">
              {notifCount}
            </span>
          )}
        </button>
        <div className="w-8 h-8 rounded-full bg-[#E25822] flex items-center justify-center text-white text-[11px] font-bold">
          {initials}
        </div>
      </div>
    </header>
  );
}

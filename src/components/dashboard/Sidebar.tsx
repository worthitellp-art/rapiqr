import React from 'react';
import { LayoutGrid, Bell, ShoppingBag, Settings, Plus, X } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onActivateNew: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { id: 'my_products', label: 'My Products', icon: LayoutGrid },
  { id: 'alerts', label: 'Activity & Alerts', icon: Bell },
  { id: 'shop', label: 'Product Catalog', icon: ShoppingBag },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ activeTab, onTabChange, onActivateNew, isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-[rgba(32,28,21,0.5)] z-30 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`
          fixed top-0 left-0 h-full z-40 bg-[#FFFEFB] border-r border-[rgba(32,28,21,0.08)]
          flex flex-col w-[230px] transition-transform duration-300
          md:static md:translate-x-0 md:z-auto md:flex
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Mobile close */}
        <div className="flex items-center justify-between px-5 pt-5 pb-2 md:hidden">
          <span className="font-bold text-sm text-[#201C15] uppercase tracking-widest">Menu</span>
          <button onClick={onClose} className="text-[#A79E8B] hover:text-[#201C15] cursor-pointer bg-transparent border-none outline-none">
            <X size={18} />
          </button>
        </div>

        {/* Logo area */}
        <div className="px-5 pt-6 pb-4 hidden md:block">
          <div className="flex items-center gap-2">
            <span className="text-lg font-black tracking-tight text-[#201C15]">Namo<span className="text-[#E25822]">QR</span></span>
          </div>
          <p className="text-[10px] text-[#A79E8B] uppercase tracking-widest mt-0.5 font-semibold">Safety Dashboard</p>
        </div>

        <nav className="flex flex-col gap-1 px-3 flex-1 mt-2">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { onTabChange(id); onClose(); }}
              className={`
                flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer w-full text-left border-none outline-none
                ${activeTab === id
                  ? 'bg-[#E25822] text-white shadow-[0_6px_14px_-6px_rgba(226,88,34,0.5)]'
                  : 'text-[#6E6759] hover:bg-[#F0EBE0] hover:text-[#201C15]'
                }
              `}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>

        <div className="p-4">
          <button
            onClick={() => { onActivateNew(); onClose(); }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#F0EBE0] hover:bg-[#EEE4CF] border border-[rgba(32,28,21,0.10)] rounded-xl text-xs font-bold uppercase tracking-wider text-[#201C15] transition-all cursor-pointer"
          >
            <Plus size={13} /> Activate New Tag
          </button>
          <p className="text-center text-[9px] text-[#A79E8B] mt-3 uppercase tracking-widest">v2.5.0 · NamoQR™</p>
        </div>
      </aside>
    </>
  );
}

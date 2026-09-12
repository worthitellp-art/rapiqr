import type React from "react";
import { X } from "lucide-react";

/**
 * Light sidebar chrome shared by the Admin panel and the Client dashboard —
 * same warm canvas family as the page content, separated by a hairline
 * border rather than a dark rail. Purely presentational — callers own their
 * own nav item list, routing, and role-gating; this just renders the frame
 * (logo row, scrollable nav slot, footer slot).
 */
export default function FxSidebarShell({
  logoSlot,
  footerSlot,
  children,
  isOpen = false,
  onClose,
  width = 232,
}: {
  logoSlot: React.ReactNode;
  footerSlot?: React.ReactNode;
  children: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
  width?: number;
}) {
  return (
    <aside
      className={`fx-shell flex-shrink-0 flex flex-col h-full py-5 px-3 fixed inset-y-0 left-0 z-50 border-r border-[var(--fx-border)] transition-transform duration-300 md:sticky md:top-0 md:z-20 md:translate-x-0 ${
        isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      }`}
      style={{ width, background: "var(--fx-sidebar-bg)" }}
    >
      <div className="flex items-center justify-between px-2 mb-6 flex-shrink-0">
        {logoSlot}
        <button
          onClick={onClose}
          className="md:hidden p-1.5 rounded-xl text-[var(--fx-sidebar-ink)] hover:text-[var(--fx-ink)] hover:bg-[var(--fx-sidebar-hover)] transition-colors cursor-pointer"
          aria-label="Close navigation menu"
        >
          <X size={16} />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto fx-scrollbar-light pr-0.5">
        {children}
      </nav>

      {footerSlot && (
        <div className="pt-3 mt-2 border-t border-[var(--fx-border)] space-y-1 flex-shrink-0">
          {footerSlot}
        </div>
      )}
    </aside>
  );
}

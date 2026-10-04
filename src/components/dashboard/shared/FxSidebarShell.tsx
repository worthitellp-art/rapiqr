import type React from "react";
import { X } from "lucide-react";

/**
 * Light sidebar chrome shared by the Admin panel, the Client dashboard and the
 * Distributor dashboard — same warm canvas family as the page content,
 * separated by a hairline border rather than a dark rail. Purely
 * presentational — callers own their nav items, routing and role-gating; this
 * just renders the frame (logo row, scrollable nav slot, footer slot). See
 * FxSidebar for the composed version every dashboard actually mounts.
 */
export default function FxSidebarShell({
  logoSlot,
  footerSlot,
  children,
  isOpen = false,
  onClose,
  width = 240,
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
      className={`fx-shell flex-shrink-0 flex flex-col h-full md:h-screen py-4 px-3 fixed inset-y-0 left-0 z-50 border-r border-[var(--fx-border)] transition-transform duration-300 motion-reduce:transition-none md:sticky md:top-0 md:z-20 md:translate-x-0 ${
        isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      }`}
      style={{ width, background: "var(--fx-sidebar-bg)" }}
    >
      <div className="flex items-center justify-between px-2 mb-4 flex-shrink-0">
        {logoSlot}
        <button
          onClick={onClose}
          className="md:hidden p-1.5 rounded-xl text-[var(--fx-sidebar-ink)] hover:text-[var(--fx-ink)] hover:bg-[var(--fx-sidebar-hover)] transition-colors cursor-pointer"
          aria-label="Close navigation menu"
        >
          <X size={16} />
        </button>
      </div>

      <nav aria-label="Main" className="flex-1 min-h-0 overflow-y-auto fx-scrollbar-light pr-0.5">
        {children}
      </nav>

      {footerSlot && (
        <div className="pt-3 mt-2 border-t border-[var(--fx-border)] space-y-2 flex-shrink-0">
          {footerSlot}
        </div>
      )}
    </aside>
  );
}

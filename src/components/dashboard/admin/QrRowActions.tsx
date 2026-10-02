import type React from "react";
import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Copy, Check, ExternalLink, Eye, Trash2, Printer, MoreHorizontal, Tag } from "lucide-react";
import { QrRecord } from "./types";
import { qrFullUrl } from "./helpers";

const MENU_WIDTH = 186;

interface QrRowActionsProps {
  qr: QrRecord;
  openQuickLook: (qr: QrRecord) => void;
  setDeleteTarget: (qr: QrRecord) => void;
  openPrintSheet?: (qr: QrRecord) => void;
  onAssignLabel?: (qr: QrRecord) => void;
  onTogglePrinted?: (qr: QrRecord) => void;
  isPrinted?: boolean;
  onMoreReveal?: (qr: QrRecord) => void;
  menuOpen?: boolean;
  onMenuToggle?: () => void;
}

export default function QrRowActions({
  qr,
  openQuickLook,
  setDeleteTarget,
  openPrintSheet,
  onAssignLabel,
  onTogglePrinted,
  isPrinted,
  onMoreReveal,
  menuOpen,
  onMenuToggle,
}: QrRowActionsProps) {
  const [copied, setCopied] = useState(false);
  const hasMenu = Boolean(onMenuToggle);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!menuOpen || !triggerRef.current) {
      setMenuPos(null);
      return;
    }
    const updatePos = () => {
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const left = Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8);
      setMenuPos({ top: rect.bottom + 4, left: Math.max(8, left) });
    };
    updatePos();
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, [menuOpen]);

  const closeMenu = () => {
    if (menuOpen) onMenuToggle?.();
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = qrFullUrl(qr.id);
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  const handleOpenLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(qrFullUrl(qr.id), "_blank", "noopener,noreferrer");
  };

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    openQuickLook(qr);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    closeMenu();
    setDeleteTarget(qr);
  };

  return (
    <div className="flex items-center justify-end gap-0.5">
      <button className="fx-icon-btn" onClick={handleView} title="View sticker">
        <Eye size={14} />
      </button>
      <button className="fx-icon-btn" onClick={handleOpenLink} title="Open scan link">
        <ExternalLink size={14} />
      </button>
      {openPrintSheet && (
        <button
          className="fx-icon-btn"
          onClick={(e) => {
            e.stopPropagation();
            openPrintSheet(qr);
          }}
          title="Print sticker sheet"
        >
          <Printer size={14} />
        </button>
      )}

      {hasMenu && (
        <div className="fx-menu-wrap" data-fx-more>
          <button ref={triggerRef} className="fx-icon-btn" onClick={onMenuToggle} title="More actions">
            <MoreHorizontal size={15} />
          </button>
          {menuOpen &&
            menuPos &&
            createPortal(
              <div
                className="fx-menu bg-white border border-gray-200 rounded-lg shadow-xl p-1 z-[200]"
                data-fx-more
                style={{
                  position: "fixed",
                  top: menuPos.top,
                  left: menuPos.left,
                  right: "auto",
                  width: MENU_WIDTH,
                }}
              >
                <button
                  type="button"
                  className="w-full px-2.5 py-1.5 text-left text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-md flex items-center gap-2 cursor-pointer transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyLink(e);
                    closeMenu();
                  }}
                >
                  {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  <span>{copied ? "Copied!" : "Copy link"}</span>
                </button>

                {onAssignLabel && (
                  <button
                    type="button"
                    className="w-full px-2.5 py-1.5 text-left text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-md flex items-center gap-2 cursor-pointer transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeMenu();
                      onAssignLabel(qr);
                    }}
                  >
                    <Tag size={14} className="text-indigo-600" />
                    <span>Assign Label</span>
                  </button>
                )}

                {onTogglePrinted && (
                  <button
                    type="button"
                    className="w-full px-2.5 py-1.5 text-left text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-md flex items-center gap-2 cursor-pointer transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeMenu();
                      onTogglePrinted(qr);
                    }}
                  >
                    <Printer size={14} className={isPrinted ? "text-amber-600" : "text-emerald-600"} />
                    <span>{isPrinted ? "Mark as Unprinted" : "Mark as Printed"}</span>
                  </button>
                )}

                {onMoreReveal && (
                  <button
                    type="button"
                    className="w-full px-2.5 py-1.5 text-left text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-md flex items-center gap-2 cursor-pointer transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoreReveal(qr);
                      closeMenu();
                    }}
                  >
                    <Eye size={14} />
                    <span>Reveal codes</span>
                  </button>
                )}

                <div className="h-px bg-gray-100 my-1" />

                <button
                  type="button"
                  className="w-full px-2.5 py-1.5 text-left text-xs font-semibold text-red-600 hover:bg-red-50 rounded-md flex items-center gap-2 cursor-pointer transition-colors"
                  onClick={handleDelete}
                >
                  <Trash2 size={14} />
                  <span>Delete Tag</span>
                </button>
              </div>,
              document.body
            )}
        </div>
      )}
    </div>
  );
}
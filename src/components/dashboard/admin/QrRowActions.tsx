import type React from "react";
import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Copy, Check, ExternalLink, Eye, Trash2, Printer, MoreHorizontal } from "lucide-react";
import { QrRecord } from "./types";
import { qrFullUrl } from "./helpers";

const MENU_WIDTH = 176;

interface QrRowActionsProps {
  qr: QrRecord;
  openQuickLook: (qr: QrRecord) => void;
  setDeleteTarget: (qr: QrRecord) => void;
  openPrintSheet?: (qr: QrRecord) => void;
  onMoreReveal?: (qr: QrRecord) => void;
  menuOpen?: boolean;
  onMenuToggle?: () => void;
}

export default function QrRowActions({
  qr, openQuickLook, setDeleteTarget, openPrintSheet,
  onMoreReveal, menuOpen, onMenuToggle,
}: QrRowActionsProps) {
  const [copied, setCopied] = useState(false);
  const hasMenu = Boolean(onMenuToggle);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

  // The table row this button lives in sits inside `.fx-table-wrap`, which uses
  // `overflow: hidden` to clip its rounded corners — that same clip was cutting
  // off (or hiding behind the next row's background) an absolutely-positioned
  // dropdown opened near the bottom of the list. Portaling to <body> with
  // fixed positioning escapes that ancestor clip entirely.
  useLayoutEffect(() => {
    if (!menuOpen || !triggerRef.current) { setMenuPos(null); return; }
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

  const closeMenu = () => { if (menuOpen) onMenuToggle?.(); };

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
      <button className="fx-icon-btn" onClick={handleView} title="View">
        <Eye size={14} />
      </button>
      <button className="fx-icon-btn" onClick={handleOpenLink} title="Open link">
        <ExternalLink size={14} />
      </button>
      {openPrintSheet && (
        <button
          className="fx-icon-btn"
          onClick={(e) => { e.stopPropagation(); openPrintSheet(qr); }}
          title="Print sheet"
        >
          <Printer size={14} />
        </button>
      )}

      {hasMenu && (
        <div className="fx-menu-wrap" data-fx-more>
          <button ref={triggerRef} className="fx-icon-btn" onClick={onMenuToggle} title="More actions">
            <MoreHorizontal size={15} />
          </button>
          {menuOpen && menuPos && createPortal(
            <div
              className="fx-menu"
              data-fx-more
              style={{ position: "fixed", top: menuPos.top, left: menuPos.left, right: "auto", width: MENU_WIDTH }}
            >
              <button
                className="fx-menu-item"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyLink(e);
                  closeMenu();
                }}
              >
                {copied ? <Check size={14} style={{ color: "var(--fx-green)" }} /> : <Copy size={14} />}
                {copied ? "Copied!" : "Copy link"}
              </button>
              {onMoreReveal && (
                <button
                  className="fx-menu-item"
                  onClick={(e) => { e.stopPropagation(); onMoreReveal(qr); closeMenu(); }}
                >
                  <Eye size={14} /> Reveal codes
                </button>
              )}
              <div className="fx-menu-sep" />
              <button className="fx-menu-item fx-menu-item-danger" onClick={handleDelete}>
                <Trash2 size={14} /> Delete
              </button>
            </div>,
            document.body
          )}
        </div>
      )}
    </div>
  );
}
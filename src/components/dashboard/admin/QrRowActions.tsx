import type React from "react";
import { useState } from "react";
import { Copy, Check, ExternalLink, Eye, Trash2, Printer, MoreHorizontal } from "lucide-react";
import { QrRecord } from "./types";
import { qrFullUrl } from "./helpers";

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
      <button className="rq-icon-btn" onClick={handleView} title="View">
        <Eye size={14} />
      </button>
      <button className="rq-icon-btn" onClick={handleOpenLink} title="Open link">
        <ExternalLink size={14} />
      </button>
      {openPrintSheet && (
        <button
          className="rq-icon-btn"
          onClick={(e) => { e.stopPropagation(); openPrintSheet(qr); }}
          title="Print sheet"
        >
          <Printer size={14} />
        </button>
      )}

      {hasMenu && (
        <div className="rq-menu-wrap" data-rq-more>
          <button className="rq-icon-btn" onClick={onMenuToggle} title="More actions">
            <MoreHorizontal size={15} />
          </button>
          {menuOpen && (
            <div className="rq-menu">
              <button
                className="rq-menu-item"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyLink(e);
                  closeMenu();
                }}
              >
                {copied ? <Check size={14} style={{ color: "var(--rq-success)" }} /> : <Copy size={14} />}
                {copied ? "Copied!" : "Copy link"}
              </button>
              {onMoreReveal && (
                <button
                  className="rq-menu-item"
                  onClick={(e) => { e.stopPropagation(); onMoreReveal(qr); closeMenu(); }}
                >
                  <Eye size={14} /> Reveal codes
                </button>
              )}
              <div className="rq-menu-sep" />
              <button className="rq-menu-item rq-menu-item-danger" onClick={handleDelete}>
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
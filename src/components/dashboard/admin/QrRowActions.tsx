import type React from "react";
import { useState } from "react";
import { Copy, Check, ExternalLink, Eye, Trash2 } from "lucide-react";
import { QrRecord } from "./types";
import { qrFullUrl } from "./helpers";

interface QrRowActionsProps {
  qr: QrRecord;
  openQuickLook: (qr: QrRecord) => void;
  setDeleteTarget: (qr: QrRecord) => void;
}

export default function QrRowActions({ qr, openQuickLook, setDeleteTarget }: QrRowActionsProps) {
  const [copied, setCopied] = useState(false);

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
    const url = qrFullUrl(qr.id);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    openQuickLook(qr);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget(qr);
  };

  return (
    <div className="flex items-center justify-end gap-1.5">
      {/* Copy button */}
      <button
        onClick={handleCopyLink}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs border ${
          copied
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:text-gray-900"
        }`}
        title={copied ? "Copied to clipboard!" : "Copy QR Link"}
      >
        {copied ? (
          <Check size={13} className="text-emerald-600 flex-shrink-0" />
        ) : (
          <Copy size={13} className="text-gray-500 flex-shrink-0" />
        )}
        <span>{copied ? "Copied!" : "Copy"}</span>
      </button>

      {/* Open link button */}
      <button
        onClick={handleOpenLink}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/80 hover:bg-blue-100 transition-all cursor-pointer shadow-2xs"
        title="Open QR public URL in new tab"
      >
        <ExternalLink size={13} className="text-blue-600 flex-shrink-0" />
        <span>Open link</span>
      </button>

      {/* View button */}
      <button
        onClick={handleView}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200/80 transition-all cursor-pointer shadow-2xs"
        title="Quick preview sticker"
      >
        <Eye size={13} className="text-slate-600 flex-shrink-0" />
        <span>View</span>
      </button>

      {/* Delete button */}
      <button
        onClick={handleDelete}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/80 hover:bg-rose-100 transition-all cursor-pointer shadow-2xs"
        title="Delete QR code"
      >
        <Trash2 size={13} className="text-rose-600 flex-shrink-0" />
        <span>Delete</span>
      </button>
    </div>
  );
}

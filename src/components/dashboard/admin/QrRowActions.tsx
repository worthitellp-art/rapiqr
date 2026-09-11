import type React from "react";
import { useState } from "react";
import { Copy, Check, ExternalLink, Eye, Trash2, Printer } from "lucide-react";
import { QrRecord } from "./types";
import { qrFullUrl } from "./helpers";

interface QrRowActionsProps {
  qr: QrRecord;
  openQuickLook: (qr: QrRecord) => void;
  setDeleteTarget: (qr: QrRecord) => void;
  openPrintSheet?: (qr: QrRecord) => void;
}

export default function QrRowActions({ qr, openQuickLook, setDeleteTarget, openPrintSheet }: QrRowActionsProps) {
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
    window.open(qrFullUrl(qr.id), "_blank", "noopener,noreferrer");
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
    <div className="flex items-center justify-end gap-0.5">
      <button
        onClick={handleView}
        className="w-7 h-7 rounded-md flex items-center justify-center text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5] transition-all cursor-pointer"
        title="View"
      >
        <Eye size={14} />
      </button>
      <button
        onClick={handleCopyLink}
        className="w-7 h-7 rounded-md flex items-center justify-center text-[#71717A] hover:text-[#16A34A] hover:bg-[#F0FDF4] transition-all cursor-pointer"
        title={copied ? "Copied!" : "Copy link"}
      >
        {copied ? <Check size={14} className="text-[#16A34A]" /> : <Copy size={14} />}
      </button>
      <button
        onClick={handleOpenLink}
        className="w-7 h-7 rounded-md flex items-center justify-center text-[#71717A] hover:text-[#2563EB] hover:bg-[#EFF6FF] transition-all cursor-pointer"
        title="Open link"
      >
        <ExternalLink size={14} />
      </button>
      {openPrintSheet && (
        <button
          onClick={(e) => { e.stopPropagation(); openPrintSheet(qr); }}
          className="w-7 h-7 rounded-md flex items-center justify-center text-[#71717A] hover:text-[#A16207] hover:bg-[#FDF4DB] transition-all cursor-pointer"
          title="Print sheet"
        >
          <Printer size={14} />
        </button>
      )}
      <button
        onClick={handleDelete}
        className="w-7 h-7 rounded-md flex items-center justify-center text-[#71717A] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-all cursor-pointer"
        title="Delete"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

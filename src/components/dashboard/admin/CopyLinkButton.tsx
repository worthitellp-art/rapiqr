import type React from "react";
import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { qrFullUrl } from "./helpers";

interface CopyLinkButtonProps {
  qrId: string;
  compact?: boolean;
}

export default function CopyLinkButton({ qrId, compact }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(qrFullUrl(qrId)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  const handleOpenPage = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(qrFullUrl(qrId), "_blank");
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={handleCopyLink}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
          title={copied ? "Copied!" : "Copy link"}
        >
          {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
        </button>
        <button
          onClick={handleOpenPage}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
          title="Open scan page"
        >
          <ExternalLink size={13} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2.5 w-full">
      <button
        onClick={handleCopyLink}
        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all cursor-pointer shadow-xs"
      >
        {copied ? (
          <>
            <Check size={14} className="text-emerald-600" />
            <span className="text-emerald-600">Copied!</span>
          </>
        ) : (
          <>
            <Copy size={14} className="text-slate-500" />
            <span>Copy Link</span>
          </>
        )}
      </button>
      <button
        onClick={handleOpenPage}
        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all cursor-pointer shadow-xs"
      >
        <ExternalLink size={14} className="text-slate-500" />
        <span>Open Page</span>
      </button>
    </div>
  );
}

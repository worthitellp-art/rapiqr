import type React from "react";
import { useState } from "react";
import { Check } from "lucide-react";
import { qrFullUrl } from "./helpers";

export default function CopyLinkButton({ qrId, compact }: { qrId: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(qrFullUrl(qrId)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(qrFullUrl(qrId), "_blank");
  };

  if (compact) {
    return (
      <div className="flex items-center gap-0.5">
        <button
          onClick={handleCopy}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all cursor-pointer"
          title={copied ? "Copied!" : "Copy link"}
        >
          {copied ? <Check size={12} className="text-teal-600" /> : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
          )}
        </button>
        <button
          onClick={handleOpen}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all cursor-pointer"
          title="Open scan page"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2 w-full">
      <button
        onClick={handleCopy}
        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold text-gray-800 hover:bg-gray-50 transition-all cursor-pointer"
        style={{ borderColor: "#e5e7eb" }}
      >
        {copied ? <Check size={12} className="text-teal-600" /> : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
        )}
        {copied ? "Copied!" : "Copy Link"}
      </button>
      <button
        onClick={handleOpen}
        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold text-gray-800 hover:bg-gray-50 transition-all cursor-pointer"
        style={{ borderColor: "#e5e7eb" }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
        </svg>
        Open Page
      </button>
    </div>
  );
}

import { X } from "lucide-react";
import CopyLinkButton from "./CopyLinkButton";
import StickerThumb from "./StickerThumb";
import { QrRecord, Template, StickerPos } from "./types";

interface QuickLookModalProps {
  qr: QrRecord | null;
  onClose: () => void;
  stickerPos?: StickerPos;
  templates: Template[];
}

export default function QuickLookModal({
  qr,
  onClose,
  templates,
}: QuickLookModalProps) {
  if (!qr) return null;

  const displayCode = qr.id;
  const displayLabel = qr.vehicleName ? `${qr.vehicleName}` : "QR STICKER CODE";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden text-slate-900 border border-slate-100 relative"
        style={{ animation: "modalIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-slate-900/40 hover:bg-slate-900/70 text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer shadow-sm"
          aria-label="Close modal"
          title="Close"
        >
          <X size={15} />
        </button>

        {/* Top side sticker image full width of card */}
        <div className="w-full bg-slate-100 relative overflow-hidden">
          <StickerThumb qr={qr} templates={templates} fullWidth />
        </div>

        {/* Bottom Details: Code text and only Copy & Open buttons */}
        <div className="px-6 pt-5 pb-6 flex flex-col items-center text-center">
          <h3 className="font-mono font-black text-slate-900 text-xl tracking-tight">
            {displayCode}
          </h3>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-1">
            {displayLabel}
          </p>

          <div className="w-full mt-5">
            <CopyLinkButton qrId={qr.id} />
          </div>
        </div>
      </div>
      <style>{`@keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(6px); } to { opacity: 1; transform: scale(1) translateY(0); } }`}</style>
    </div>
  );
}

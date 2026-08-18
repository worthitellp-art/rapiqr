import { X } from "lucide-react";
import CopyLinkButton from "./CopyLinkButton";
import StickerThumb from "./StickerThumb";
import { QrRecord, Template, StickerPos } from "./types";

interface QuickLookModalProps {
  qr: QrRecord | null;
  onClose: () => void;
  stickerPos?: StickerPos;
  templates?: Template[];
}

export default function QuickLookModal({
  qr,
  onClose,
}: QuickLookModalProps) {
  if (!qr) return null;

  const displayCode = qr.id;
  const displayLabel = qr.vehicleName ? `${qr.vehicleName}` : "FLEET TAG CODE";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(23, 24, 28, 0.5)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="bg-white shadow-[0_1px_4px_rgba(0,0,0,0.03)] w-full max-w-sm overflow-hidden text-[#17181A] border border-[#E5E5E7] relative font-body"
        style={{ animation: "modalIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-[4px] bg-white/90 hover:bg-white text-[#17181A] flex items-center justify-center transition-all cursor-pointer border border-[#E5E5E7]"
          aria-label="Close modal"
          title="Close"
        >
          <X size={15} />
        </button>

        {/* Top side sticker image full width of card */}
        <div className="w-full bg-[#F3F3F4] relative overflow-hidden border-b border-[#E5E5E7]">
          <StickerThumb qr={qr} fullWidth />
        </div>

        {/* Bottom Details: Code text and Copy & Open buttons */}
        <div className="px-6 pt-5 pb-6 flex flex-col items-center text-center">
          <h3 className="font-display font-semibold text-[#17181A] text-[24px] tracking-wider">
            {displayCode}
          </h3>
          <p className="text-[10.5px] font-bold text-[#9CA0A6] uppercase tracking-widest mt-0.5">
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

import { useState } from "react";
import { X, Printer } from "lucide-react";
import CopyLinkButton from "./CopyLinkButton";
import StickerThumb from "./StickerThumb";
import { QrRecord, Template, StickerPos } from "./types";
import { MaskedCodeDisplay, CodeVisibilityToggleButton } from "./StickerCodeComponents";

interface QuickLookModalProps {
  qr: QrRecord | null;
  onClose: () => void;
  stickerPos?: StickerPos;
  templates?: Template[];
  onOpenPrintSheet?: (qr: QrRecord) => void;
}

export default function QuickLookModal({
  qr,
  onClose,
  onOpenPrintSheet,
}: QuickLookModalProps) {
  const [isCodesRevealed, setIsCodesRevealed] = useState(false);

  if (!qr) return null;

  const displayCode = qr.id;
  const displayLabel = qr.vehicleName ? `${qr.vehicleName}` : "FLEET TAG CODE";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(16, 24, 40, 0.45)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#E5E7EB] w-full max-w-sm rounded-2xl overflow-hidden text-[#18181B] relative font-body shadow-[0_16px_48px_rgba(16,24,40,0.16),0_2px_8px_rgba(16,24,40,0.08)]"
        style={{ animation: "modalIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-[8px] bg-white/90 hover:bg-white text-[#18181B] flex items-center justify-center transition-all cursor-pointer border border-[#E5E7EB] shadow-sm"
          aria-label="Close modal"
          title="Close"
        >
          <X size={15} />
        </button>

        {/* Top side sticker image full width of card */}
        <div className="w-full bg-[#F8F8F7] relative overflow-hidden border-b border-[#E5E7EB]">
          <StickerThumb qr={qr} fullWidth />
        </div>

        {/* Bottom Details: Code text and Copy & Open buttons */}
        <div className="px-6 pt-5 pb-6 flex flex-col items-center text-center">
          <h3 className="font-display font-semibold text-[#18181B] text-[20px] tracking-wider break-all">
            {displayCode}
          </h3>
          <p className="text-[10.5px] font-bold text-[#A1A1AA] uppercase tracking-widest mt-0.5">
            {displayLabel}
          </p>

          {/* Security Codes Box with See / Hide Toggle */}
          <div className="w-full mt-4 p-3 bg-[#F8F8F7] border border-[#E5E7EB] rounded-[10px] text-left space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#71717A]">
                Security Codes
              </span>
              <CodeVisibilityToggleButton
                isRevealed={isCodesRevealed}
                onToggleVisibility={() => setIsCodesRevealed((prev) => !prev)}
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#E5E7EB]">
              <span className="text-[11px] text-[#71717A] font-medium">Unique ID</span>
              <MaskedCodeDisplay
                codeValue={qr.id}
                isRevealed={isCodesRevealed}
                maskedLength={14}
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#E5E7EB]">
              <span className="text-[11px] text-[#71717A] font-medium">Recovery Code</span>
              <MaskedCodeDisplay
                codeValue={qr.recoveryCode || ""}
                isRevealed={isCodesRevealed}
                maskedLength={10}
                highlightAccent={true}
                fallbackText="—"
              />
            </div>
          </div>

          <div className="w-full mt-4 space-y-2">
            <CopyLinkButton qrId={qr.id} />

            {onOpenPrintSheet && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPrintSheet(qr);
                }}
                className="ac-btn ac-btn-secondary w-full rounded-[10px] bg-[#FDF4DB] border-[#EAB308]/50 text-[#A16207] hover:bg-[#F8E9B0] text-[12.5px] font-bold"
              >
                <Printer size={14} />
                <span>Print 18×12″ Sheet (3×3 Grid)</span>
              </button>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(6px); } to { opacity: 1; transform: scale(1) translateY(0); } }`}</style>
    </div>
  );
}

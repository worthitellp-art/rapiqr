import type React from "react";
import { AlertTriangle, X } from "lucide-react";

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  onClose,
}: {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[115] flex items-center justify-center p-4"
      style={{ background: "rgba(23,24,28,0.5)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="bg-white shadow-[0_1px_4px_rgba(0,0,0,0.03)] w-full max-w-sm p-6 text-[#17181A] border border-[#E5E5E7] relative font-body"
        style={{ animation: "modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-7 h-7 rounded-[4px] bg-[#F3F3F4] flex items-center justify-center text-[#777B80] hover:text-[#17181A] hover:bg-[#E5E5E7] cursor-pointer transition-colors"
        >
          <X size={14} />
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-[4px] bg-[#FDEAEA] text-[#DC2626] border border-[#DC2626]/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={19} />
          </div>
          <h3 className="font-display font-semibold text-[#17181A] text-[17px] leading-snug">{title}</h3>
        </div>

        <div className="text-[13.5px] text-[#777B80] leading-relaxed mb-6">{message}</div>

        <div className="flex gap-3 text-[12px]">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-[4px] border border-[#E5E5E7] font-semibold text-[#777B80] bg-[#F3F3F4] hover:bg-[#E5E5E7] hover:text-[#17181A] transition-all cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 py-2.5 rounded-[4px] font-semibold text-white transition-all hover:bg-[#B91C1C] flex items-center justify-center gap-1.5 cursor-pointer bg-[#DC2626]"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
      <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.94) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
    </div>
  );
}

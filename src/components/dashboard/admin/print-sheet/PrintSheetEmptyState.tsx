import React from "react";
import { PackageX, PlusCircle } from "lucide-react";

interface PrintSheetEmptyStateProps {
  onClose: () => void;
}

export default function PrintSheetEmptyState({ onClose }: PrintSheetEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#F4F5F7] border border-[#E5E5E7] flex items-center justify-center text-[#777B80] mb-4 shadow-2xs">
        <PackageX size={32} strokeWidth={1.8} />
      </div>

      <h3 className="font-display text-[17px] font-bold text-[#17181A] mb-1.5">
        No stickers exist
      </h3>

      <p className="text-[13px] text-[#777B80] max-w-md leading-relaxed mb-6">
        There are currently no stickers available to generate an 18×12″ print sheet. Please generate or import QR stickers in the dashboard before printing.
      </p>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#5C78DF] hover:bg-[#4A63C0] text-white text-[13px] font-semibold transition-all cursor-pointer shadow-sm"
        >
          <PlusCircle size={15} />
          <span>Back to Dashboard</span>
        </button>
      </div>
    </div>
  );
}

import React from "react";
import { PackageX, PlusCircle } from "lucide-react";

interface PrintSheetEmptyStateProps {
  onClose: () => void;
}

export default function PrintSheetEmptyState({ onClose }: PrintSheetEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[var(--fx-canvas)] border border-[var(--fx-border)] flex items-center justify-center text-[var(--fx-ink-2)] mb-4 shadow-2xs">
        <PackageX size={32} strokeWidth={1.8} />
      </div>

      <h3 className="font-display text-[17px] font-bold text-[var(--fx-ink)] mb-1.5">
        No stickers exist
      </h3>

      <p className="text-[13px] text-[var(--fx-ink-2)] max-w-md leading-relaxed mb-6">
        There are currently no stickers available to generate an 18×12″ print sheet. Please generate or import QR stickers in the dashboard before printing.
      </p>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--fx-accent)] hover:bg-[var(--fx-accent-ink)] text-white text-[13px] font-semibold transition-all cursor-pointer shadow-sm shadow-[var(--fx-accent)]/20"
        >
          <PlusCircle size={15} />
          <span>Back to Dashboard</span>
        </button>
      </div>
    </div>
  );
}

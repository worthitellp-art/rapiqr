import React from "react";
import { Loader2, AlertCircle, EyeOff, ChevronLeft, ChevronRight } from "lucide-react";

interface PrintSheetPreviewProps {
  isLoading: boolean;
  errorMessage: string | null;
  previewBlobUrl: string | null;
  hasSelection: boolean;
  currentPage: number;
  totalSheets: number;
  selectedCount: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

export default function PrintSheetPreview({
  isLoading,
  errorMessage,
  previewBlobUrl,
  hasSelection,
  currentPage,
  totalSheets,
  selectedCount,
  onPreviousPage,
  onNextPage,
}: PrintSheetPreviewProps) {
  const currentSheetStartSticker = currentPage * 9 + 1;
  const currentSheetEndSticker = Math.min((currentPage + 1) * 9, selectedCount);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold text-[var(--fx-ink)]">
          Preview
        </span>

        {totalSheets > 1 && hasSelection && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onPreviousPage}
              disabled={currentPage === 0}
              className="p-1 rounded bg-white border border-[var(--fx-border)] hover:bg-[var(--fx-canvas)] text-[var(--fx-ink)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Previous Sheet"
            >
              <ChevronLeft size={13} />
            </button>
            <span className="text-[11px] font-medium text-[var(--fx-ink-2)] px-1">
              {currentPage + 1} / {totalSheets}
            </span>
            <button
              type="button"
              onClick={onNextPage}
              disabled={currentPage >= totalSheets - 1}
              className="p-1 rounded bg-white border border-[var(--fx-border)] hover:bg-[var(--fx-canvas)] text-[var(--fx-ink)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Next Sheet"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        )}
      </div>

      <div className="w-full bg-[var(--fx-canvas)] rounded-lg border border-[var(--fx-border)] p-3 flex items-center justify-center relative min-h-[220px] max-h-[340px] overflow-hidden">
        {isLoading ? (
          <div className="flex items-center gap-2 text-[var(--fx-ink-2)] text-[12px]">
            <Loader2 size={16} className="animate-spin text-[var(--fx-accent-ink)]" />
            <span>Rendering preview...</span>
          </div>
        ) : errorMessage ? (
          <div className="text-[12px] text-[#EF4444] text-center p-2">
            {errorMessage}
          </div>
        ) : !hasSelection ? (
          <div className="text-[12px] text-[var(--fx-faint)] text-center p-4">
            Select stickers to preview sheet
          </div>
        ) : previewBlobUrl ? (
          <img
            src={previewBlobUrl}
            alt="Print sheet preview"
            className="w-full h-auto max-h-[310px] object-contain rounded border border-[var(--fx-border)] shadow-xs"
          />
        ) : (
          <div className="text-[12px] text-[var(--fx-faint)]">No preview</div>
        )}
      </div>
    </div>
  );
}

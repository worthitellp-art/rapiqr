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
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-bold text-[#17181A] uppercase tracking-wider">
            Live 18×12″ Sheet Preview
          </span>
          {totalSheets > 1 && hasSelection && (
            <span className="text-[11px] font-bold bg-[#E8EDFF] text-[#3E52B8] px-2 py-0.5 rounded">
              Sheet {currentPage + 1} of {totalSheets} (Stickers {currentSheetStartSticker}–{currentSheetEndSticker})
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {totalSheets > 1 && hasSelection && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onPreviousPage}
                disabled={currentPage === 0}
                className="p-1 rounded bg-white border border-[#E5E5E7] hover:bg-[#F3F3F4] text-[#17181A] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Previous Sheet"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-[11px] font-mono text-[#777B80] px-1">
                {currentPage + 1} / {totalSheets}
              </span>
              <button
                type="button"
                onClick={onNextPage}
                disabled={currentPage >= totalSheets - 1}
                className="p-1 rounded bg-white border border-[#E5E5E7] hover:bg-[#F3F3F4] text-[#17181A] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Next Sheet"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          <span className="text-[11px] text-[#777B80] font-mono hidden sm:inline">
            Ratio: 18:12 (3:2) · 9 Unique Slots · Cut lines
          </span>
        </div>
      </div>

      <div className="w-full bg-[#EAEBED] rounded-xl border border-[#DCDDE0] p-4 flex items-center justify-center relative min-h-[260px] max-h-[360px] overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center gap-2 text-[#777B80]">
            <Loader2 size={24} className="animate-spin text-[#5C78DF]" />
            <span className="text-[12px] font-medium">Rendering unique 3×3 sticker sheet...</span>
          </div>
        ) : errorMessage ? (
          <div className="flex flex-col items-center gap-2 text-[#DC2626] text-center p-4 max-w-sm">
            <AlertCircle size={24} />
            <span className="text-[13px] font-medium">{errorMessage}</span>
          </div>
        ) : !hasSelection ? (
          <div className="flex flex-col items-center gap-2 text-[#777B80] text-center p-4">
            <EyeOff size={26} className="text-[#9CA0A6]" />
            <span className="text-[13px] font-medium text-[#17181A]">No stickers selected</span>
            <span className="text-[11.5px] text-[#777B80]">
              Select stickers above to preview the unique 3×3 sheet layout.
            </span>
          </div>
        ) : previewBlobUrl ? (
          <img
            src={previewBlobUrl}
            alt="Print sheet preview"
            className="w-full h-auto max-h-[320px] object-contain rounded shadow-md border border-white"
          />
        ) : (
          <div className="text-[12px] text-[#777B80]">No preview available</div>
        )}
      </div>
    </div>
  );
}

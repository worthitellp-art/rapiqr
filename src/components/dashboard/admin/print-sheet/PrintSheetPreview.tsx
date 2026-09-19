import React from "react";
import { Loader2, ChevronLeft, ChevronRight, Eye, Layers } from "lucide-react";

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
    <div className="space-y-2.5">
      {/* Preview Section Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Eye size={14} className="text-slate-500" />
            <span>3×3 Print Sheet Layout</span>
          </span>
          {hasSelection && (
            <span className="text-[11px] font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              Stickers {currentSheetStartSticker}–{currentSheetEndSticker} of {selectedCount}
            </span>
          )}
        </div>

        {totalSheets > 1 && hasSelection && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onPreviousPage}
              disabled={currentPage === 0}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
              title="Previous Sheet"
            >
              <ChevronLeft size={14} />
              <span>Prev</span>
            </button>
            <span className="text-xs font-bold text-slate-700 px-1.5 font-mono">
              Sheet {currentPage + 1} / {totalSheets}
            </span>
            <button
              type="button"
              onClick={onNextPage}
              disabled={currentPage >= totalSheets - 1}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
              title="Next Sheet"
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Preview Viewport */}
      <div className="w-full bg-slate-100/80 rounded-2xl border border-slate-200/90 p-3 sm:p-4 flex items-center justify-center relative min-h-[240px] max-h-[380px] overflow-hidden shadow-inner">
        {isLoading ? (
          <div className="flex flex-col items-center gap-2 text-slate-600 text-xs font-medium">
            <Loader2 size={24} className="animate-spin text-slate-900" />
            <span>Generating 300 DPI layout preview...</span>
          </div>
        ) : errorMessage ? (
          <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3 text-center max-w-md">
            {errorMessage}
          </div>
        ) : !hasSelection ? (
          <div className="flex flex-col items-center gap-2 text-slate-400 text-xs py-8">
            <Layers size={28} strokeWidth={1.5} />
            <span>Select stickers above to render print sheet preview</span>
          </div>
        ) : previewBlobUrl ? (
          <div className="relative group max-h-[340px] flex items-center justify-center">
            <img
              src={previewBlobUrl}
              alt="18×12 Print Sheet Preview"
              className="w-full h-auto max-h-[340px] object-contain rounded-lg border border-slate-300 shadow-md bg-white"
            />
            <div className="absolute bottom-2 right-2 bg-[#14120C]/80 text-[#FFD444] text-[10px] font-mono px-2 py-0.5 rounded-md backdrop-blur-xs font-bold pointer-events-none">
              18″ × 12″ · 300 DPI
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-400">No preview available</div>
        )}
      </div>
    </div>
  );
}

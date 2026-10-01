import React from "react";
import { Loader2, ChevronLeft, ChevronRight, Layers } from "lucide-react";

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
  onPreviousPage,
  onNextPage,
}: PrintSheetPreviewProps) {
  return (
    <div className="space-y-2.5">
      {totalSheets > 1 && hasSelection && (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={onPreviousPage}
            disabled={currentPage === 0}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            aria-label="Previous sheet"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={onNextPage}
            disabled={currentPage >= totalSheets - 1}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            aria-label="Next sheet"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      <div className="w-full bg-slate-50 rounded-2xl border border-slate-200 p-4 flex items-center justify-center relative min-h-[240px] max-h-[380px] overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center gap-2 text-slate-500 text-sm">
            <Loader2 size={24} className="animate-spin text-slate-900" />
            <span>Preparing preview…</span>
          </div>
        ) : errorMessage ? (
          <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3 text-center max-w-md">
            {errorMessage}
          </div>
        ) : !hasSelection ? (
          <div className="flex flex-col items-center gap-2 text-slate-400 text-sm py-8">
            <Layers size={28} strokeWidth={1.5} />
            <span>Select stickers to preview the sheet</span>
          </div>
        ) : previewBlobUrl ? (
          <img
            src={previewBlobUrl}
            alt="Print sheet preview"
            className="w-full h-auto max-h-[340px] object-contain rounded-lg border border-slate-200 shadow-sm bg-white"
          />
        ) : (
          <div className="text-sm text-slate-400">No preview available</div>
        )}
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { QrRecord, StickerPos } from "./types";
import { usePrintSheetState } from "./print-sheet/usePrintSheetState";
import PrintSheetEmptyState from "./print-sheet/PrintSheetEmptyState";
import BatchStickerPicker from "./print-sheet/BatchStickerPicker";
import PrintSheetPreview from "./print-sheet/PrintSheetPreview";
import PrintCopiesPopup from "./print-sheet/PrintCopiesPopup";

interface PrintSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableStickers: QrRecord[];
  initialSelectedSticker?: QrRecord | null;
  initialBatchStickers?: QrRecord[];
  stickerPos: StickerPos;
  onShowToast?: (message: string) => void;
  // Optional: share printed-status with a parent (e.g. the main fleet table)
  // — falls back to its own localStorage-backed copy when omitted.
  printedStickerIdList?: string[];
  setPrintedStickerIdList?: (update: string[] | ((previous: string[]) => string[])) => void;
}

export default function PrintSheetModal({
  isOpen,
  onClose,
  availableStickers,
  initialSelectedSticker,
  initialBatchStickers,
  stickerPos,
  onShowToast,
  printedStickerIdList,
  setPrintedStickerIdList,
}: PrintSheetModalProps) {
  const {
    selectedStickerIds,
    selectedStickerRecords,
    displayStickers,
    currentPreviewPage,
    totalSheets,
    hasValidSelection,
    previewBlobUrl,
    isPreviewLoading,
    previewErrorMessage,
    isExporting,
    maxSelectable,
    printedStickerIds: resolvedPrintedStickerIds,
    handleToggleSticker,
    handleTogglePrinted,
    handleSelectAll,
    handleDeselectAll,
    handleNextPage,
    handlePreviousPage,
    handleDirectPrint,
  } = usePrintSheetState({
    isOpen,
    availableStickers,
    initialSelectedSticker,
    initialBatchStickers,
    stickerPos,
    onShowToast,
    printedStickerIdList,
    setPrintedStickerIdList,
  });

  const [showCopiesPopup, setShowCopiesPopup] = useState(false);

  if (!isOpen) return null;

  const hasStickers = displayStickers.length > 0;
  const selectedCount = selectedStickerRecords.length;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-4"
      style={{ background: "rgba(15, 17, 23, 0.65)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200"
        onClick={(clickEvent) => clickEvent.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Print Stickers</h2>
            <p className="text-sm text-slate-500 mt-0.5">Choose stickers to print</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {!hasStickers ? (
            <PrintSheetEmptyState onClose={onClose} />
          ) : (
            <>
              <BatchStickerPicker
                availableStickers={displayStickers}
                selectedStickerIds={selectedStickerIds}
                onToggleSticker={handleToggleSticker}
                onSelectAll={handleSelectAll}
                onDeselectAll={handleDeselectAll}
                maxSelectable={maxSelectable}
                printedStickerIds={resolvedPrintedStickerIds}
                onTogglePrinted={handleTogglePrinted}
              />

              <PrintSheetPreview
                isLoading={isPreviewLoading}
                errorMessage={previewErrorMessage}
                previewBlobUrl={previewBlobUrl}
                hasSelection={hasValidSelection}
                currentPage={currentPreviewPage}
                totalSheets={totalSheets}
                selectedCount={selectedCount}
                onPreviousPage={handlePreviousPage}
                onNextPage={handleNextPage}
              />
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => setShowCopiesPopup(true)}
            disabled={!hasValidSelection || isExporting}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-black active:scale-95 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {isExporting && <Loader2 size={15} className="animate-spin" />}
            <span>Print {totalSheets > 1 ? `${totalSheets} Sheets` : "Sheet"}</span>
          </button>
        </div>
      </div>

      <PrintCopiesPopup
        isOpen={showCopiesPopup}
        onClose={() => setShowCopiesPopup(false)}
        isPrinting={isExporting}
        onConfirm={(copies) => {
          handleDirectPrint(copies);
          setShowCopiesPopup(false);
        }}
      />
    </div>
  );
}

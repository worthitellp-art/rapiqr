import React from "react";
import { X, Printer, Download, Loader2, Grid3X3 } from "lucide-react";
import { QrRecord, StickerPos } from "./types";
import { usePrintSheetState } from "./print-sheet/usePrintSheetState";
import PrintSheetEmptyState from "./print-sheet/PrintSheetEmptyState";
import PrintSheetSpecifications from "./print-sheet/PrintSheetSpecifications";
import BatchStickerPicker from "./print-sheet/BatchStickerPicker";
import PrintSheetPreview from "./print-sheet/PrintSheetPreview";

interface PrintSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableStickers: QrRecord[];
  initialSelectedSticker?: QrRecord | null;
  initialBatchStickers?: QrRecord[];
  stickerPos: StickerPos;
  onShowToast?: (message: string) => void;
}

export default function PrintSheetModal({
  isOpen,
  onClose,
  availableStickers,
  initialSelectedSticker,
  initialBatchStickers,
  stickerPos,
  onShowToast,
}: PrintSheetModalProps) {
  const {
    selectedStickerIds,
    selectedStickerRecords,
    currentPreviewPage,
    totalSheets,
    hasValidSelection,
    previewBlobUrl,
    isPreviewLoading,
    previewErrorMessage,
    isExporting,
    exportAction,
    handleToggleSticker,
    handleSelectAll,
    handleSelectFirstNine,
    handleDeselectAll,
    handleNextPage,
    handlePreviousPage,
    handleDownloadSheet,
    handleDirectPrint,
  } = usePrintSheetState({
    isOpen,
    availableStickers,
    initialSelectedSticker,
    initialBatchStickers,
    stickerPos,
    onShowToast,
  });

  if (!isOpen) return null;

  const hasStickers = availableStickers.length > 0;
  const selectedCount = selectedStickerRecords.length;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-5"
      style={{ background: "rgba(15, 17, 23, 0.65)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-[#17181A] border border-[#E5E5E7] font-body"
        style={{ animation: "modalFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)" }}
        onClick={(clickEvent) => clickEvent.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E7] bg-[#FAFAFB]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#E8EDFF] text-[#3E52B8] flex items-center justify-center">
              <Printer size={18} strokeWidth={2.4} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-[17px] font-bold text-[#17181A] leading-tight">
                  Print Sheet Generator (18×12″)
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wide bg-[#E8EDFF] text-[#3E52B8] px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Grid3X3 size={11} /> 9 Unique Stickers / Sheet
                </span>
              </div>
              <p className="text-[12px] text-[#777B80] mt-0.5">
                Every slot is a different unique sticker from your generated fleet · 300 DPI with cut lines
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-transparent hover:bg-[#E5E5E7] text-[#777B80] hover:text-[#17181A] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!hasStickers ? (
            <PrintSheetEmptyState onClose={onClose} />
          ) : (
            <>
              {/* Unique Sticker Selection Controls */}
              <BatchStickerPicker
                availableStickers={availableStickers}
                selectedStickerIds={selectedStickerIds}
                onToggleSticker={handleToggleSticker}
                onSelectAll={handleSelectAll}
                onSelectFirstNine={handleSelectFirstNine}
                onDeselectAll={handleDeselectAll}
              />

              {/* Live Preview Viewport with Sheet Pagination */}
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

              {/* Specifications Checklist */}
              <PrintSheetSpecifications />
            </>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-[#E5E5E7] bg-[#FAFAFB] flex flex-wrap items-center justify-between gap-3">
          <div className="text-[12px] text-[#777B80]">
            {!hasStickers ? (
              <span className="text-[#DC2626] font-medium">No stickers available in fleet</span>
            ) : !hasValidSelection ? (
              <span className="text-[#DC2626] font-medium">Please select stickers above</span>
            ) : (
              <span>
                Unique Stickers:{" "}
                <strong className="text-[#17181A]">{selectedCount} selected</strong>{" "}
                <span className="text-[#777B80]">
                  ({totalSheets} sheet{totalSheets > 1 ? "s" : ""})
                </span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[13px] font-semibold text-[#777B80] hover:text-[#17181A] bg-white border border-[#E5E5E7] rounded-lg hover:bg-[#F3F3F4] transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleDirectPrint}
              disabled={!hasValidSelection || isExporting}
              className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-semibold text-[#17181A] bg-white border border-[#17181A] rounded-lg hover:bg-[#F3F3F4] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isExporting && exportAction === "print" ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Printer size={15} />
              )}
              <span>Print Dialog</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadSheet}
              disabled={!hasValidSelection || isExporting}
              className="inline-flex items-center gap-2 px-5 py-2 text-[13px] font-semibold text-white bg-[#5C78DF] hover:bg-[#4A63C0] active:scale-95 rounded-lg transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isExporting && exportAction === "download" ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Download size={15} strokeWidth={2.2} />
              )}
              <span>
                {totalSheets > 1
                  ? `Download ${totalSheets} Sheets (PNG)`
                  : "Download 18×12 PNG"}
              </span>
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes modalFadeIn { from { opacity: 0; transform: scale(0.96) translateY(6px); } to { opacity: 1; transform: scale(1) translateY(0); } }`}</style>
    </div>
  );
}

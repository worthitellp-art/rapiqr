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
    handleSelectCategory,
    handleDeselectCategory,
    handleSelectFirstNineOfCategory,
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

  const categoryBreakdown = React.useMemo(() => {
    if (!selectedStickerRecords.length) return "";
    const counts: Record<string, number> = {};
    for (const s of selectedStickerRecords) {
      const cat = (s.category || "car").trim().toLowerCase();
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([cat, count]) => `${count} ${cat.charAt(0).toUpperCase() + cat.slice(1)}`)
      .join(", ");
  }, [selectedStickerRecords]);

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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-[var(--fx-ink)] border border-[var(--fx-border)] font-body"
        style={{ animation: "modalFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)" }}
        onClick={(clickEvent) => clickEvent.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--fx-border)] bg-[var(--fx-canvas)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#14120C] text-[#FFD444] flex items-center justify-center shadow-xs">
              <Printer size={20} strokeWidth={2.4} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-[17px] font-bold text-[var(--fx-ink)] leading-tight">
                  Print Sheet Generator (18×12″)
                </h2>
                <span className="text-[10.5px] font-bold uppercase tracking-wide bg-[#FFD444]/20 border border-[#FFD444]/40 text-amber-900 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Grid3X3 size={11} /> 9 Unique Stickers / Sheet
                </span>
              </div>
              <p className="text-[12px] text-[var(--fx-ink-2)] mt-0.5">
                Category-wise fleet printing · 300 DPI high-resolution output with crop & cut guides
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-transparent hover:bg-[var(--fx-border)] text-[var(--fx-ink-2)] hover:text-[var(--fx-ink)] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
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
                onSelectCategory={handleSelectCategory}
                onDeselectCategory={handleDeselectCategory}
                onSelectFirstNineOfCategory={handleSelectFirstNineOfCategory}
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
        <div className="px-6 py-4 border-t border-[var(--fx-border)] bg-[var(--fx-canvas)] flex flex-wrap items-center justify-between gap-3">
          <div className="text-[12px] text-[var(--fx-ink-2)]">
            {!hasStickers ? (
              <span className="text-[#DC2626] font-medium">No stickers available in fleet</span>
            ) : !hasValidSelection ? (
              <span className="text-[#DC2626] font-medium">Please select stickers above</span>
            ) : (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span>
                  Selected: <strong className="text-[var(--fx-ink)]">{selectedCount} stickers</strong>{" "}
                  <span className="text-[var(--fx-ink-2)]">
                    ({totalSheets} sheet{totalSheets > 1 ? "s" : ""})
                  </span>
                </span>
                {categoryBreakdown && (
                  <span className="text-slate-600 font-semibold bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md text-[11px]">
                    {categoryBreakdown}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[13px] font-semibold text-[var(--fx-ink-2)] hover:text-[var(--fx-ink)] bg-white border border-[var(--fx-border)] rounded-lg hover:bg-[var(--fx-canvas)] transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleDirectPrint}
              disabled={!hasValidSelection || isExporting}
              className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-semibold text-[var(--fx-ink)] bg-white border border-[var(--fx-ink)] rounded-lg hover:bg-[var(--fx-canvas)] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
              className="inline-flex items-center gap-2 px-5 py-2 text-[13px] font-semibold text-white bg-[var(--fx-accent)] hover:bg-[var(--fx-accent-ink)] active:scale-95 rounded-lg transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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

import { useState, useEffect, useCallback, useMemo } from "react";
import { QrRecord, StickerPos } from "../types";
import {
  PRINT_SHEET_CONSTANTS,
  generateBatchStickersSheetBlobs,
  downloadSheetBlob,
  printSheetBlobInBrowser,
} from "../../../../services/stickerPrintSheetService";

interface UsePrintSheetStateProps {
  isOpen: boolean;
  availableStickers: QrRecord[];
  initialSelectedSticker?: QrRecord | null;
  initialBatchStickers?: QrRecord[];
  stickerPos: StickerPos;
  onShowToast?: (message: string) => void;
}

export function usePrintSheetState({
  isOpen,
  availableStickers,
  initialSelectedSticker,
  initialBatchStickers,
  stickerPos,
  onShowToast,
}: UsePrintSheetStateProps) {
  const [selectedStickerIds, setSelectedStickerIds] = useState<Set<string>>(new Set());
  const [currentPreviewPage, setCurrentPreviewPage] = useState<number>(0);
  const [previewBlobs, setPreviewBlobs] = useState<Blob[]>([]);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportAction, setExportAction] = useState<"download" | "print" | null>(null);
  const [previewErrorMessage, setPreviewErrorMessage] = useState<string | null>(null);

  // Initialize selection when modal opens: prioritize explicitly selected stickers or select all available
  useEffect(() => {
    if (!isOpen) return;

    setCurrentPreviewPage(0);

    // If explicit batch stickers were passed (e.g. from table checkboxes)
    if (initialBatchStickers && initialBatchStickers.length > 0) {
      setSelectedStickerIds(new Set(initialBatchStickers.map((sticker) => sticker.id)));
      return;
    }

    // If a single sticker row was clicked, select it as the initial item
    if (initialSelectedSticker) {
      setSelectedStickerIds(new Set([initialSelectedSticker.id]));
      return;
    }

    // Default: pre-select all available unique stickers
    if (availableStickers.length > 0) {
      setSelectedStickerIds(new Set(availableStickers.map((sticker) => sticker.id)));
    } else {
      setSelectedStickerIds(new Set());
    }
  }, [isOpen, initialBatchStickers, initialSelectedSticker, availableStickers]);

  // Resolve unique selected sticker records in original sequence
  const selectedStickerRecords = useMemo<QrRecord[]>(() => {
    if (availableStickers.length === 0) return [];
    return availableStickers.filter((sticker) => selectedStickerIds.has(sticker.id));
  }, [availableStickers, selectedStickerIds]);

  const totalSheets = Math.ceil(selectedStickerRecords.length / PRINT_SHEET_CONSTANTS.STICKERS_PER_SHEET);
  const hasValidSelection = selectedStickerRecords.length > 0;

  // Reset current preview page if out of bounds after deselecting
  useEffect(() => {
    if (currentPreviewPage >= totalSheets && totalSheets > 0) {
      setCurrentPreviewPage(totalSheets - 1);
    }
  }, [currentPreviewPage, totalSheets]);

  // Generate live preview sheets for unique stickers
  const refreshPreview = useCallback(async () => {
    if (!isOpen || selectedStickerRecords.length === 0) {
      setPreviewBlobs([]);
      setPreviewBlobUrl(null);
      return;
    }

    setIsPreviewLoading(true);
    setPreviewErrorMessage(null);

    try {
      const previewConfig = { dpi: 100 };
      const generatedBlobs = await generateBatchStickersSheetBlobs(
        selectedStickerRecords,
        stickerPos,
        previewConfig
      );

      setPreviewBlobs(generatedBlobs);

      const targetBlob = generatedBlobs[currentPreviewPage] || generatedBlobs[0] || null;
      if (targetBlob) {
        const nextUrl = URL.createObjectURL(targetBlob);
        setPreviewBlobUrl((previousUrl) => {
          if (previousUrl) URL.revokeObjectURL(previousUrl);
          return nextUrl;
        });
      } else {
        setPreviewBlobUrl(null);
      }
    } catch (previewError) {
      console.error("Failed to generate unique stickers preview:", previewError);
      setPreviewErrorMessage("Unable to render preview. You can still export directly.");
    } finally {
      setIsPreviewLoading(false);
    }
  }, [isOpen, selectedStickerRecords, currentPreviewPage, stickerPos]);

  useEffect(() => {
    refreshPreview();
    return () => {
      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
      }
    };
  }, [refreshPreview]);

  // Selection handlers
  const handleToggleSticker = useCallback((stickerId: string) => {
    setSelectedStickerIds((previousSet) => {
      const nextSet = new Set(previousSet);
      if (nextSet.has(stickerId)) {
        nextSet.delete(stickerId);
      } else {
        nextSet.add(stickerId);
      }
      return nextSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedStickerIds(new Set(availableStickers.map((sticker) => sticker.id)));
  }, [availableStickers]);

  const handleSelectFirstNine = useCallback(() => {
    const firstNineIds = availableStickers.slice(0, PRINT_SHEET_CONSTANTS.STICKERS_PER_SHEET).map((s) => s.id);
    setSelectedStickerIds(new Set(firstNineIds));
  }, [availableStickers]);

  const handleDeselectAll = useCallback(() => {
    setSelectedStickerIds(new Set());
  }, []);

  // Category-wise selection handlers
  const handleSelectCategory = useCallback((category: string, exclusive = false) => {
    const targetCat = category.trim().toLowerCase();
    const matchingIds = availableStickers
      .filter((s) => (s.category || "car").trim().toLowerCase() === targetCat)
      .map((s) => s.id);

    setSelectedStickerIds((prev) => {
      if (exclusive) {
        return new Set(matchingIds);
      }
      const next = new Set(prev);
      matchingIds.forEach((id) => next.add(id));
      return next;
    });
  }, [availableStickers]);

  const handleDeselectCategory = useCallback((category: string) => {
    const targetCat = category.trim().toLowerCase();
    const matchingIds = new Set(
      availableStickers
        .filter((s) => (s.category || "car").trim().toLowerCase() === targetCat)
        .map((s) => s.id)
    );

    setSelectedStickerIds((prev) => {
      const next = new Set(prev);
      matchingIds.forEach((id) => next.delete(id));
      return next;
    });
  }, [availableStickers]);

  const handleSelectFirstNineOfCategory = useCallback((category: string) => {
    const targetCat = category.trim().toLowerCase();
    const matchingIds = availableStickers
      .filter((s) => (s.category || "car").trim().toLowerCase() === targetCat)
      .slice(0, PRINT_SHEET_CONSTANTS.STICKERS_PER_SHEET)
      .map((s) => s.id);

    setSelectedStickerIds(new Set(matchingIds));
  }, [availableStickers]);

  // Pagination handlers
  const handleNextPage = useCallback(() => {
    if (currentPreviewPage < totalSheets - 1) {
      setCurrentPreviewPage((previousPage) => previousPage + 1);
    }
  }, [currentPreviewPage, totalSheets]);

  const handlePreviousPage = useCallback(() => {
    if (currentPreviewPage > 0) {
      setCurrentPreviewPage((previousPage) => previousPage - 1);
    }
  }, [currentPreviewPage]);

  // Export handlers
  const handleDownloadSheet = useCallback(async () => {
    if (!hasValidSelection) return;

    setIsExporting(true);
    setExportAction("download");

    try {
      const fullResConfig = { dpi: PRINT_SHEET_CONSTANTS.DEFAULT_DPI };
      const timestamp = new Date().toISOString().slice(0, 10);

      const sheetBlobs = await generateBatchStickersSheetBlobs(
        selectedStickerRecords,
        stickerPos,
        fullResConfig
      );

      if (sheetBlobs.length === 0) throw new Error("No sheet blobs were generated");

      sheetBlobs.forEach((blob, index) => {
        const fileName =
          sheetBlobs.length === 1
            ? `repiqr-unique-stickers-sheet-18x12-${timestamp}.png`
            : `repiqr-unique-stickers-sheet-18x12-${timestamp}-part-${index + 1}-of-${sheetBlobs.length}.png`;
        downloadSheetBlob(blob, fileName);
      });

      onShowToast?.(
        `Downloaded ${sheetBlobs.length} print sheet${sheetBlobs.length > 1 ? "s" : ""} containing ${selectedStickerRecords.length} unique stickers`
      );
    } catch (exportError) {
      console.error("Failed to download print sheet:", exportError);
      onShowToast?.("Failed to generate print sheets. Please try again.");
    } finally {
      setIsExporting(false);
      setExportAction(null);
    }
  }, [hasValidSelection, selectedStickerRecords, stickerPos, onShowToast]);

  const handleDirectPrint = useCallback(async () => {
    if (!hasValidSelection) return;

    setIsExporting(true);
    setExportAction("print");

    try {
      const fullResConfig = { dpi: PRINT_SHEET_CONSTANTS.DEFAULT_DPI };
      const sheetBlobs = await generateBatchStickersSheetBlobs(
        selectedStickerRecords,
        stickerPos,
        fullResConfig
      );

      const targetBlob = sheetBlobs[currentPreviewPage] || sheetBlobs[0] || null;
      if (!targetBlob) throw new Error("Could not create print sheet blob");

      const printTitle = `RapiQR-Unique-Stickers-Sheet-18x12-Page-${currentPreviewPage + 1}`;
      printSheetBlobInBrowser(targetBlob, printTitle);
      onShowToast?.("Opening browser print dialog...");
    } catch (printError) {
      console.error("Failed to initiate browser print:", printError);
      onShowToast?.("Could not open print dialog. Try downloading the PNG instead.");
    } finally {
      setIsExporting(false);
      setExportAction(null);
    }
  }, [hasValidSelection, selectedStickerRecords, currentPreviewPage, stickerPos, onShowToast]);

  return {
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
  };
}

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { QrRecord, StickerPos } from "../types";
import { useLocalStorage } from "../useLocalStorage";
import {
  PRINT_SHEET_CONSTANTS,
  generateBatchStickersSheetBlobs,
  printSheetBlobInBrowser,
} from "../../../../services/stickerPrintSheetService";

// One physical 12×18 sheet holds a grid sized to fill it (see
// PRINT_SHEET_CONSTANTS.GRID_ROWS) — selection is capped to that many rather
// than letting it spill into multiple sheets, so "select stickers to print"
// always means "this one sheet," not an open-ended batch job.
const MAX_SELECTABLE = PRINT_SHEET_CONSTANTS.STICKERS_PER_SHEET;

interface UsePrintSheetStateProps {
  isOpen: boolean;
  availableStickers: QrRecord[];
  initialSelectedSticker?: QrRecord | null;
  initialBatchStickers?: QrRecord[];
  stickerPos: StickerPos;
  onShowToast?: (message: string) => void;
  // Optional: lets a parent (AdminDashboard) share this with the main fleet
  // table so a sticker marked printed here shows up there immediately too.
  // Falls back to owning its own localStorage-backed copy when omitted.
  printedStickerIdList?: string[];
  setPrintedStickerIdList?: (update: string[] | ((previous: string[]) => string[])) => void;
}

export function usePrintSheetState({
  isOpen,
  availableStickers,
  initialSelectedSticker,
  initialBatchStickers,
  stickerPos,
  onShowToast,
  printedStickerIdList: externalPrintedStickerIdList,
  setPrintedStickerIdList: externalSetPrintedStickerIdList,
}: UsePrintSheetStateProps) {
  const [selectedStickerIds, setSelectedStickerIds] = useState<Set<string>>(new Set());
  const [internalPrintedStickerIdList, setInternalPrintedStickerIdList] = useLocalStorage<string[]>("repiqr-printed-sticker-ids", []);
  const printedStickerIdList = externalPrintedStickerIdList ?? internalPrintedStickerIdList;
  const setPrintedStickerIdList = externalSetPrintedStickerIdList ?? setInternalPrintedStickerIdList;
  const printedStickerIds = useMemo(() => new Set(printedStickerIdList), [printedStickerIdList]);

  // Already-activated stickers (a real owner phone on file) are excluded from
  // batch browsing/select-all — they print individually, not as part of a
  // sheet with other stickers. An explicitly targeted single sticker (opened
  // via its own "Print" action) still resolves correctly below regardless,
  // since that lookup uses the full, unfiltered list.
  const selectableStickers = useMemo(
    () => availableStickers.filter((sticker) => !sticker.ownerPhone),
    [availableStickers]
  );

  // Auto-fill (default pre-select / "Select All") should prioritize stickers
  // that still need printing — an already-printed one is only pulled in if
  // there aren't enough unprinted ones left to fill the sheet.
  const addableStickers = useMemo(() => {
    const unprinted = selectableStickers.filter((sticker) => !printedStickerIds.has(sticker.id));
    const alreadyPrinted = selectableStickers.filter((sticker) => printedStickerIds.has(sticker.id));
    return [...unprinted, ...alreadyPrinted];
  }, [selectableStickers, printedStickerIds]);

  // What the picker actually renders: the browsable (non-activated) set, plus
  // a specific already-activated sticker if it was opened directly for its
  // own single-sticker reprint — so that one card still shows up to confirm,
  // even though it won't appear when browsing/select-all draws from above.
  const displayStickers = useMemo(() => {
    const extra = availableStickers.filter((sticker) => sticker.ownerPhone && selectedStickerIds.has(sticker.id));
    return extra.length > 0 ? [...selectableStickers, ...extra] : selectableStickers;
  }, [selectableStickers, availableStickers, selectedStickerIds]);
  const [currentPreviewPage, setCurrentPreviewPage] = useState<number>(0);
  const [previewBlobs, setPreviewBlobs] = useState<Blob[]>([]);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [previewErrorMessage, setPreviewErrorMessage] = useState<string | null>(null);

  // Initialize selection only when the modal actually opens — deliberately
  // NOT reactive to `addableStickers`/etc. changing afterward. AdminDashboard
  // refetches the fleet (and therefore creates a brand new `availableStickers`
  // array) every 15s on a background timer; if this effect depended on that
  // derived list directly, every poll would silently re-run it and stomp
  // whatever the admin had just manually selected back to the default. Refs
  // hold the latest values for the effect to read without depending on them.
  const latestInitialBatchStickersRef = useRef(initialBatchStickers);
  latestInitialBatchStickersRef.current = initialBatchStickers;
  const latestInitialSelectedStickerRef = useRef(initialSelectedSticker);
  latestInitialSelectedStickerRef.current = initialSelectedSticker;
  const latestAddableStickersRef = useRef(addableStickers);
  latestAddableStickersRef.current = addableStickers;

  useEffect(() => {
    if (!isOpen) return;

    setCurrentPreviewPage(0);

    // If explicit batch stickers were passed (e.g. from table checkboxes)
    const batchStickers = latestInitialBatchStickersRef.current;
    if (batchStickers && batchStickers.length > 0) {
      const capped = batchStickers.slice(0, MAX_SELECTABLE);
      setSelectedStickerIds(new Set(capped.map((sticker) => sticker.id)));
      if (batchStickers.length > MAX_SELECTABLE) {
        onShowToast?.(`Only ${MAX_SELECTABLE} fit on one sheet — the rest are still listed below if you'd like to swap one in.`);
      }
      return;
    }

    // If a single sticker row was clicked, select it as the initial item
    const singleSticker = latestInitialSelectedStickerRef.current;
    if (singleSticker) {
      setSelectedStickerIds(new Set([singleSticker.id]));
      return;
    }

    // Default: pre-select up to one sheet's worth of available stickers,
    // preferring ones that haven't been printed yet.
    const addable = latestAddableStickersRef.current;
    if (addable.length > 0) {
      setSelectedStickerIds(new Set(addable.slice(0, MAX_SELECTABLE).map((sticker) => sticker.id)));
    } else {
      setSelectedStickerIds(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

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
        if (nextSet.size >= MAX_SELECTABLE) {
          onShowToast?.(`A print sheet holds at most ${MAX_SELECTABLE} stickers — deselect one first.`);
          return previousSet;
        }
        nextSet.add(stickerId);
      }
      return nextSet;
    });
  }, [onShowToast]);

  const handleSelectAll = useCallback(() => {
    const capped = addableStickers.slice(0, MAX_SELECTABLE);
    setSelectedStickerIds(new Set(capped.map((sticker) => sticker.id)));
    if (addableStickers.length > MAX_SELECTABLE) {
      onShowToast?.(`Selected ${MAX_SELECTABLE} of ${addableStickers.length} (unprinted first) — swap any of them below if you'd like a different one.`);
    }
  }, [addableStickers, onShowToast]);

  const handleDeselectAll = useCallback(() => {
    setSelectedStickerIds(new Set());
  }, []);

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
  // Printed-status tracking — persisted locally (see useLocalStorage above)
  // so the picker can show which stickers have already gone to print, across
  // sessions and regardless of which ones happen to be selected right now.
  const markStickersPrinted = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    setPrintedStickerIdList((previous) => {
      const next = new Set(previous);
      ids.forEach((id) => next.add(id));
      return Array.from(next);
    });
  }, [setPrintedStickerIdList]);

  const handleTogglePrinted = useCallback((stickerId: string) => {
    setPrintedStickerIdList((previous) => {
      const next = new Set(previous);
      if (next.has(stickerId)) next.delete(stickerId);
      else next.add(stickerId);
      return Array.from(next);
    });
  }, [setPrintedStickerIdList]);

  const handleDirectPrint = useCallback(async (copies = 1) => {
    if (!hasValidSelection) return;

    setIsExporting(true);

    try {
      const fullResConfig = { dpi: PRINT_SHEET_CONSTANTS.DEFAULT_DPI };
      const sheetBlobs = await generateBatchStickersSheetBlobs(
        selectedStickerRecords,
        stickerPos,
        fullResConfig
      );

      const targetBlob = sheetBlobs[currentPreviewPage] || sheetBlobs[0] || null;
      if (!targetBlob) throw new Error("Could not create print sheet blob");

      const printTitle = `RapiQR-Unique-Stickers-Sheet-12x18-Page-${currentPreviewPage + 1}`;
      printSheetBlobInBrowser(targetBlob, printTitle, copies);
      markStickersPrinted(selectedStickerRecords.map((sticker) => sticker.id));
      onShowToast?.(copies > 1 ? `Opening print dialog for ${copies} copies...` : "Opening print dialog...");
    } catch (printError) {
      console.error("Failed to initiate browser print:", printError);
      onShowToast?.("Could not open the print dialog. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }, [hasValidSelection, selectedStickerRecords, currentPreviewPage, stickerPos, onShowToast, markStickersPrinted]);

  return {
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
    maxSelectable: MAX_SELECTABLE,
    printedStickerIds,
    handleToggleSticker,
    handleTogglePrinted,
    handleSelectAll,
    handleDeselectAll,
    handleNextPage,
    handlePreviousPage,
    handleDirectPrint,
  };
}

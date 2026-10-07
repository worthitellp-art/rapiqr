import type React from "react";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Plus,
  Download,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Printer,
  Eye,
  EyeOff,
  Search,
  QrCode,
  Loader2,
  AlertTriangle,
  LayoutGrid,
  Table as TableIcon,
  Phone,
  Tag,
  CheckCircle2,
  SlidersHorizontal,
  X,
  ExternalLink,
  Shield,
  FileSpreadsheet,
  CheckSquare,
  Square,
  Folder,
  FolderPlus,
} from "lucide-react";
import { QrRecord, Template, StickerPos, StickerLabel } from "./types";
import { qrFullUrl, fmtDate, getStableSlotMap, formatSlotNumber } from "./helpers";
import { apiClient } from "../../../lib/apiClient";
import { adminStickerLabel, useCodesRevealed } from "../../../lib/codeVisibility";
import { useLocalStorage } from "./useLocalStorage";
import { generateStickerBatchPdfBlob, downloadSheetBlob } from "../../../services/stickerPrintSheetService";
import { STICKER_CATEGORIES, getCategoryLabel, getCategoryIcon } from "../../../stickerModules";
import GenerateTagModal from "./GenerateTagModal";
import StickerMockupView from "./StickerMockupView";
import LabelBadge from "./labels/LabelBadge";
import LabelManagerModal from "./labels/LabelManagerModal";
import AssignLabelModal from "./labels/AssignLabelModal";
import BulkPrintByLabelModal from "./labels/BulkPrintByLabelModal";
import { DEFAULT_PRESET_LABELS } from "./labels/labelConstants";
import PrintProgressModal, { PrintProgressState } from "./print-sheet/PrintProgressModal";
import FolderGrid from "./folders/FolderGrid";
import FolderBreadcrumbs from "./folders/FolderBreadcrumbs";
import CreateFolderModal from "./folders/CreateFolderModal";
import MoveToFolderModal from "./folders/MoveToFolderModal";
import RenameFolderModal from "./folders/RenameFolderModal";
import {
  StickerFolder,
  getStoredFolders,
  addFolder,
  renameFolder,
  removeFolder,
} from "./folders/folderStorage";

type ViewMode = "cards" | "table";
type TabFilter = "all" | "active" | "pending" | "printed";

interface QrCodesPageProps {
  qrList: QrRecord[];
  setQrList: React.Dispatch<React.SetStateAction<QrRecord[]>>;
  templates: Template[];
  setToast: (msg: string | null) => void;
  openQuickLook: (q: QrRecord) => void;
  openRestore: () => void;
  stickerPos: StickerPos;
  openPrintSheet?: (targetSticker?: QrRecord, selectedBatchStickers?: QrRecord[]) => void;
  searchQuery: string;
  printedStickerIdList?: string[];
  setPrintedStickerIdList?: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function QrCodesPage({
  qrList,
  setQrList,
  templates,
  setToast,
  openQuickLook,
  openRestore,
  stickerPos,
  openPrintSheet,
  searchQuery,
  printedStickerIdList,
  setPrintedStickerIdList,
}: QrCodesPageProps) {
  // Printed sticker tracking
  const [internalPrintedIds, setInternalPrintedIds] = useLocalStorage<string[]>("repiqr-printed-sticker-ids", []);
  const activePrintedIdsList = printedStickerIdList ?? internalPrintedIds;
  const activeSetPrintedIds = setPrintedStickerIdList ?? setInternalPrintedIds;
  const printedStickerIds = useMemo(() => new Set(activePrintedIdsList || []), [activePrintedIdsList]);

  // Custom Color Labels
  const [labels, setLabels] = useLocalStorage<StickerLabel[]>("repiqr-custom-labels", DEFAULT_PRESET_LABELS);

  // Layout View Mode & Tab Segment
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [activeTab, setActiveTab] = useState<TabFilter>("all");

  // Single Unified Filter Bar State
  const [searchText, setSearchText] = useState(searchQuery);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [labelFilter, setLabelFilter] = useState("all");
  const [printStatusFilter, setPrintStatusFilter] = useState<"all" | "unprinted" | "printed">("all");

  // Pagination state (reset to 1 on filter changes)
  const [page, setPage] = useState(1);
  const PAGE_SIZE = viewMode === "cards" ? 12 : 20;

  // Selected stickers for batch operations
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<QrRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLabelManagerOpen, setIsLabelManagerOpen] = useState(false);
  const [isAssignLabelOpen, setIsAssignLabelOpen] = useState(false);
  const [isBulkPrintByLabelOpen, setIsBulkPrintByLabelOpen] = useState(false);
  const [assignLabelTargetIds, setAssignLabelTargetIds] = useState<string[]>([]);
  // Bulk confirmation modal
  const [showDeleteSelectedConfirm, setShowDeleteSelectedConfirm] = useState(false);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  // ── Folders State ─────────────────────────────────────────────────────────
  const [folders, setFolders] = useState<StickerFolder[]>(() => getStoredFolders());
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isMoveToFolderOpen, setIsMoveToFolderOpen] = useState(false);
  const [moveToFolderTargetIds, setMoveToFolderTargetIds] = useState<string[]>([]);
  const [folderToRename, setFolderToRename] = useState<StickerFolder | null>(null);

  // Count unassigned stickers
  const unassignedCount = useMemo(() => {
    return qrList.filter((q) => !q.folderName).length;
  }, [qrList]);

  // All folders, auto-including "Unassigned Stock" if there are any stickers without a folder
  const allDisplayFolders = useMemo(() => {
    const list = [...folders];
    if (unassignedCount > 0 && !list.some((f) => f.name.toLowerCase() === "unassigned stock")) {
      list.push({
        id: "f-unassigned-stock",
        name: "Unassigned Stock",
        createdAt: new Date().toISOString(),
      });
    }
    return list;
  }, [folders, unassignedCount]);

  // Count stickers per folder
  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    qrList.forEach((q) => {
      if (q.folderName) {
        const k = q.folderName.toLowerCase();
        counts[k] = (counts[k] || 0) + 1;
      }
    });
    if (unassignedCount > 0) {
      counts["unassigned stock"] = unassignedCount;
    }
    return counts;
  }, [qrList, unassignedCount]);

  // Recovery codes reveal & print progress
  const [revealedCodes, setRevealedCodes] = useCodesRevealed();
  const [recoveryCodeMap, setRecoveryCodeMap] = useState<Record<string, string | null>>({});
  const [revealingCodes, setRevealingCodes] = useState(false);
  const [sheetGenerating, setSheetGenerating] = useState(false);
  const [printProgress, setPrintProgress] = useState<PrintProgressState>({
    isVisible: false,
    current: 0,
    total: 0,
    percent: 0,
    stage: "",
  });

  // Sync external search query
  useEffect(() => {
    if (searchQuery !== searchText) {
      setSearchText(searchQuery);
    }
  }, [searchQuery]);

  // Compute stable slot numbers for all records so deleting #3 leaves #4 as #4 forever
  const stableSlotMap = useMemo(() => getStableSlotMap(qrList), [qrList]);

  // Metrics computation (scoped to active folder if one is open)
  const metrics = useMemo(() => {
    let dataset = qrList;
    if (activeFolder) {
      if (
        activeFolder.toLowerCase() === "unassigned stock" ||
        activeFolder.toLowerCase() === "unassigned"
      ) {
        dataset = dataset.filter(
          (q) =>
            !q.folderName ||
            q.folderName.toLowerCase() === "unassigned" ||
            q.folderName.toLowerCase() === "unassigned stock"
        );
      } else {
        dataset = dataset.filter(
          (q) => (q.folderName || "").toLowerCase() === activeFolder.toLowerCase()
        );
      }
    }
    const total = dataset.length;
    let active = 0;
    let printed = 0;
    dataset.forEach((q) => {
      const phone = q.ownerPhone || q.phoneNumber || (q as any).phone;
      if (phone && phone.trim()) active += 1;
      else if (q.status === "active") active += 1;
      if (printedStickerIds.has(q.id) || q.isPrinted) printed += 1;
    });
    return {
      total,
      active,
      pending: total - active,
      printed,
      unprinted: total - printed,
    };
  }, [qrList, printedStickerIds, activeFolder]);

  // Reset page to 1 whenever filters or tab changes (Requirement 3: deterministic filter fetch)
  const handleTabChange = (newTab: TabFilter) => {
    setActiveTab(newTab);
    setPage(1);
  };

  const handleFilterChange = useCallback((updater: () => void) => {
    updater();
    setPage(1);
  }, []);

  const clearAllFilters = () => {
    setSearchText("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setLabelFilter("all");
    setPrintStatusFilter("all");
    setActiveTab("all");
    setPage(1);
  };

  const hasActiveFilters =
    searchText.trim() !== "" ||
    statusFilter !== "all" ||
    categoryFilter !== "all" ||
    labelFilter !== "all" ||
    printStatusFilter !== "all" ||
    activeTab !== "all";

  // Filtered dataset
  const filtered = useMemo(() => {
    let result = qrList;

    // Segment tab filter
    if (activeTab === "active") {
      result = result.filter((q) => {
        const phone = q.ownerPhone || q.phoneNumber || (q as any).phone;
        return (phone && phone.trim()) || q.status === "active";
      });
    } else if (activeTab === "pending") {
      result = result.filter((q) => {
        const phone = q.ownerPhone || q.phoneNumber || (q as any).phone;
        return !phone && q.status !== "active";
      });
    } else if (activeTab === "printed") {
      result = result.filter((q) => printedStickerIds.has(q.id) || q.isPrinted);
    }

    // Status filter
    if (statusFilter === "active") {
      result = result.filter((q) => {
        const phone = q.ownerPhone || q.phoneNumber || (q as any).phone;
        return (phone && phone.trim()) || q.status === "active";
      });
    } else if (statusFilter === "inactive") {
      result = result.filter((q) => {
        const phone = q.ownerPhone || q.phoneNumber || (q as any).phone;
        return !phone && q.status !== "active";
      });
    }

    // Category filter
    if (categoryFilter !== "all") {
      result = result.filter((q) => (q.category || "car") === categoryFilter);
    }

    // Label filter
    if (labelFilter !== "all") {
      if (labelFilter === "unlabeled") {
        result = result.filter((q) => !q.labelName);
      } else {
        result = result.filter((q) => (q.labelName || "").toLowerCase() === labelFilter.toLowerCase());
      }
    }

    // Print status filter
    if (printStatusFilter === "unprinted") {
      result = result.filter((q) => !printedStickerIds.has(q.id) && !q.isPrinted);
    } else if (printStatusFilter === "printed") {
      result = result.filter((q) => printedStickerIds.has(q.id) || q.isPrinted);
    }

    // Folder filter: when inside a folder, only show stickers belonging to that folder
    if (activeFolder) {
      if (
        activeFolder.toLowerCase() === "unassigned stock" ||
        activeFolder.toLowerCase() === "unassigned"
      ) {
        result = result.filter(
          (q) =>
            !q.folderName ||
            q.folderName.toLowerCase() === "unassigned" ||
            q.folderName.toLowerCase() === "unassigned stock"
        );
      } else {
        result = result.filter(
          (q) => (q.folderName || "").toLowerCase() === activeFolder.toLowerCase()
        );
      }
    }

    // Search query filter
    if (searchText.trim()) {
      const needle = searchText.toLowerCase().trim();
      result = result.filter(
        (r) =>
          (r.id || "").toLowerCase().includes(needle) ||
          (r.ownerPhone || r.phoneNumber || (r as any).phone || "").toLowerCase().includes(needle) ||
          (r.category || "").toLowerCase().includes(needle) ||
          (r.labelName || "").toLowerCase().includes(needle) ||
          (r.vehicleNumber || "").toLowerCase().includes(needle)
      );
    }

    return result;
  }, [qrList, activeTab, statusFilter, categoryFilter, labelFilter, printStatusFilter, searchText, printedStickerIds, activeFolder]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page, PAGE_SIZE]
  );

  // Clean selection state when items are deleted
  useEffect(() => {
    setSelectedIds((prev) => {
      const valid = new Set(qrList.map((q) => q.id));
      const next = new Set([...prev].filter((id) => valid.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [qrList]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllCurrent = () => {
    const pageIds = paginated.map((q) => q.id);
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  // Safe Explicit Deletion Flow (Requirement 2 & 7)
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const targetId = deleteTarget.id;

    try {
      const res = await apiClient.qr.deleteQrCode(targetId);
      if (!res?.success) {
        throw new Error((res as any)?.error || "Delete call failed");
      }

      // Remove only the confirmed deleted item; never reorder or replace other slots
      setQrList((prev) => prev.filter((item) => item.id !== targetId));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });

      setDeleteTarget(null);
      setToast(`Sticker ${targetId} permanently deleted from database.`);
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      setToast(`Failed to delete sticker: ${err?.message || "Please check connection"}`);
      setTimeout(() => setToast(null), 4000);
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Delete Selected stickers ────────────────────────────────────────────
  const handleDeleteSelected = async () => {
    const ids: string[] = Array.from(selectedIds);
    if (ids.length === 0) return;
    setIsDeletingBulk(true);
    let successCount = 0;
    let failCount = 0;
    for (const id of ids) {
      try {
        const res = await apiClient.qr.deleteQrCode(id);
        if (res?.success) successCount++;
        else failCount++;
      } catch {
        failCount++;
      }
    }
    setQrList((prev) => prev.filter((q) => !ids.includes(q.id)));
    setSelectedIds(new Set());
    setShowDeleteSelectedConfirm(false);
    setIsDeletingBulk(false);
    if (failCount === 0) {
      setToast(`${successCount} sticker${successCount !== 1 ? 's' : ''} permanently deleted.`);
    } else {
      setToast(`${successCount} deleted, ${failCount} failed. Check connection.`);
    }
    setTimeout(() => setToast(null), 4000);
  };

  // ── Folder Operations ────────────────────────────────────────────────────
  const handlePrintActiveFolder = () => {
    let folderStickers = qrList;
    if (activeFolder) {
      if (
        activeFolder.toLowerCase() === "unassigned stock" ||
        activeFolder.toLowerCase() === "unassigned"
      ) {
        folderStickers = qrList.filter(
          (q) =>
            !q.folderName ||
            q.folderName.toLowerCase() === "unassigned" ||
            q.folderName.toLowerCase() === "unassigned stock"
        );
      } else {
        folderStickers = qrList.filter(
          (q) => (q.folderName || "").toLowerCase() === activeFolder.toLowerCase()
        );
      }
    }
    if (folderStickers.length === 0) return;
    handleTriggerPrint(undefined, folderStickers);
  };

  const handleAssignActiveFolderLabel = () => {
    let folderStickers = qrList;
    if (activeFolder) {
      if (
        activeFolder.toLowerCase() === "unassigned stock" ||
        activeFolder.toLowerCase() === "unassigned"
      ) {
        folderStickers = qrList.filter(
          (q) =>
            !q.folderName ||
            q.folderName.toLowerCase() === "unassigned" ||
            q.folderName.toLowerCase() === "unassigned stock"
        );
      } else {
        folderStickers = qrList.filter(
          (q) => (q.folderName || "").toLowerCase() === activeFolder.toLowerCase()
        );
      }
    }
    if (folderStickers.length === 0) return;
    setAssignLabelTargetIds(folderStickers.map((q) => q.id));
    setIsAssignLabelOpen(true);
  };

  const handleMoveToFolder = async (targetFolderName: string | null) => {
    const ids = moveToFolderTargetIds.length > 0 ? moveToFolderTargetIds : Array.from(selectedIds);
    if (ids.length === 0) return;

    setQrList((prev) =>
      prev.map((q) => (ids.includes(q.id) ? { ...q, folderName: targetFolderName || undefined } : q))
    );
    setSelectedIds(new Set());
    setMoveToFolderTargetIds([]);

    try {
      await apiClient.qr.bulkUpdateFolder(ids, targetFolderName);
      setToast(
        targetFolderName
          ? `Moved ${ids.length} sticker${ids.length !== 1 ? "s" : ""} to "${targetFolderName}".`
          : `Removed ${ids.length} sticker${ids.length !== 1 ? "s" : ""} from folder.`
      );
      setTimeout(() => setToast(null), 3000);
    } catch {
      setToast(`Saved locally: updated ${ids.length} sticker${ids.length !== 1 ? "s" : ""}.`);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleCreateFolder = (name: string) => {
    const newF = addFolder(name);
    setFolders(getStoredFolders());
    setToast(`Folder "${newF.name}" created.`);
    setTimeout(() => setToast(null), 2500);
  };

  const handleRenameFolder = async (folder: StickerFolder, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === folder.name) return;

    const oldName = folder.name;
    // 1. Rename in storage
    const updated = renameFolder(folder.id, trimmed);
    setFolders(updated);

    // 2. Update affected stickers in local state
    const affectedStickers = qrList.filter(
      (q) => (q.folderName || "").toLowerCase() === oldName.toLowerCase()
    );
    setQrList((prev) =>
      prev.map((q) =>
        (q.folderName || "").toLowerCase() === oldName.toLowerCase()
          ? { ...q, folderName: trimmed }
          : q
      )
    );

    // 3. Update activeFolder if user was viewing it
    if (activeFolder?.toLowerCase() === oldName.toLowerCase()) {
      setActiveFolder(trimmed);
    }

    // 4. Update in backend database
    if (affectedStickers.length > 0) {
      try {
        await apiClient.qr.bulkUpdateFolder(
          affectedStickers.map((q) => q.id),
          trimmed
        );
      } catch (err) {
        console.warn("Could not sync folder rename to server:", err);
      }
    }

    setToast(`Folder renamed to "${trimmed}".`);
    setTimeout(() => setToast(null), 3000);
  };

  const handleDeleteFolder = async (folder: StickerFolder) => {
    const affectedStickers = qrList.filter(
      (q) => (q.folderName || "").toLowerCase() === folder.name.toLowerCase()
    );
    const count = affectedStickers.length;

    const confirmMsg =
      count > 0
        ? `Delete folder "${folder.name}"?\n\nNOTE: None of the ${count} sticker(s) will be deleted. They will remain completely safe in your sticker fleet as unassigned.`
        : `Delete empty folder "${folder.name}"?`;

    if (!window.confirm(confirmMsg)) return;

    // 1. Remove folder metadata from folder list
    const updated = removeFolder(folder.id);
    setFolders(updated);

    // 2. Keep ALL stickers in state, only unsetting their folderName
    setQrList((prev) =>
      prev.map((q) =>
        (q.folderName || "").toLowerCase() === folder.name.toLowerCase()
          ? { ...q, folderName: undefined }
          : q
      )
    );

    // 3. Return to root view if user was viewing this folder
    if (activeFolder?.toLowerCase() === folder.name.toLowerCase()) {
      setActiveFolder(null);
    }

    // 4. Update database so stickers' folder_name is safely set to null without deleting the stickers
    if (affectedStickers.length > 0) {
      try {
        await apiClient.qr.bulkUpdateFolder(
          affectedStickers.map((q) => q.id),
          null
        );
      } catch (err) {
        console.warn("Could not sync folder detachment to server:", err);
      }
    }

    setToast(
      count > 0
        ? `Folder "${folder.name}" deleted. All ${count} stickers safely preserved.`
        : `Folder "${folder.name}" deleted.`
    );
    setTimeout(() => setToast(null), 3000);
  };

  // Trigger print modal
  function handleTriggerPrint(target?: QrRecord, batch?: QrRecord[]) {
    if (openPrintSheet) {
      openPrintSheet(target, batch);
    }
  }

  // Bulk print export
  const cancelBatchExportRef = useRef(false);

  function handleCancelBatchExport() {
    cancelBatchExportRef.current = true;
    setSheetGenerating(false);
    setPrintProgress((prev) => ({ ...prev, isVisible: false }));
    setToast("PDF export cancelled.");
    setTimeout(() => setToast(null), 3000);
  }

  async function handleExportPdf(selected: QrRecord[]) {
    if (sheetGenerating) return;
    cancelBatchExportRef.current = false;
    setSheetGenerating(true);
    setPrintProgress({
      isVisible: true,
      current: 0,
      total: selected.length,
      percent: 2,
      stage: "Preparing stickers…",
    });

    try {
      const codes = await fetchMissingRecoveryCodes(selected.map((q) => q.id));
      if (cancelBatchExportRef.current) return;

      const pdfBlob = await generateStickerBatchPdfBlob(
        selected,
        stickerPos,
        codes,
        1,
        (progressInfo) => {
          if (!cancelBatchExportRef.current) {
            setPrintProgress({ isVisible: true, ...progressInfo });
          }
        },
        () => cancelBatchExportRef.current
      );
      if (cancelBatchExportRef.current) return;
      if (!pdfBlob) throw new Error("PDF generation failed");
      downloadSheetBlob(pdfBlob, `rapiqr-batch-${new Date().toISOString().slice(0, 10)}.pdf`);

      // Mark as printed
      const ids = selected.map((s) => s.id);
      activeSetPrintedIds((prev) => Array.from(new Set([...(prev || []), ...ids])));
      setQrList((prev) =>
        prev.map((q) => (ids.includes(q.id) ? { ...q, isPrinted: true } : q))
      );
      setToast(`PDF generated for ${selected.length} sticker(s)`);
      setTimeout(() => setToast(null), 3500);
    } catch (err: any) {
      if (!cancelBatchExportRef.current) {
        setToast("Failed to generate PDF sheet.");
        setTimeout(() => setToast(null), 4000);
      }
    } finally {
      setSheetGenerating(false);
      setPrintProgress((prev) => ({ ...prev, isVisible: false }));
    }
  }

  async function fetchMissingRecoveryCodes(ids: string[]) {
    const missing = ids.filter((id) => !(id in recoveryCodeMap));
    if (missing.length === 0) return recoveryCodeMap;
    setRevealingCodes(true);
    try {
      const res = await apiClient.admin.revealRecoveryCodes(missing);
      const merged = { ...recoveryCodeMap, ...(res?.data || {}) };
      setRecoveryCodeMap(merged);
      return merged;
    } catch {
      return recoveryCodeMap;
    } finally {
      setRevealingCodes(false);
    }
  }

  // Export fleet CSV
  function downloadFleetCsv() {
    const rows = [
      ["Slot #", "Sticker ID", "Phone Number", "Category", "Batch Label", "Printed", "Status", "Created At"],
      ...filtered.map((q) => {
        const phone = q.ownerPhone || q.phoneNumber || (q as any).phone || "";
        const isAct = Boolean(phone && phone.trim());
        const isPr = printedStickerIds.has(q.id) || q.isPrinted;
        const slot = stableSlotMap.get(q.id);
        return [
          formatSlotNumber(slot),
          q.id,
          phone || "Unassigned",
          q.category || "car",
          q.labelName || "None",
          isPr ? "Yes" : "No",
          isAct ? "Active" : "Pending",
          fmtDate(q.createdAt),
        ];
      }),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `rapiqr-fleet-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  // Mark selection as printed/unprinted
  const handleBulkSetPrinted = (printed: boolean) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    activeSetPrintedIds((prev) => {
      const set = new Set(prev || []);
      if (printed) ids.forEach((id) => set.add(id));
      else ids.forEach((id) => set.delete(id));
      return Array.from(set);
    });
    setQrList((prev) =>
      prev.map((q) => (ids.includes(q.id) ? { ...q, isPrinted: printed } : q))
    );
    setToast(`${ids.length} sticker(s) marked as ${printed ? "printed" : "unprinted"}.`);
    setTimeout(() => setToast(null), 2500);
  };

  const isAllCurrentPageSelected =
    paginated.length > 0 && paginated.every((q) => selectedIds.has(q.id));

  return (
    <div className="px-6 lg:px-10 py-8 space-y-6 text-gray-900 bg-gray-50/60 min-h-screen">
      {/* ── 1. Page Header (Linear / SquareUI Style) ───────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {/* Header Squircle Icon Badge matching reference image */}
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center border border-orange-200/50 shadow-2xs shrink-0">
            {activeFolder ? <Folder size={22} className="fill-amber-500 text-amber-600" /> : <QrCode size={22} strokeWidth={2.2} />}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-950">
              {activeFolder ? activeFolder : "QR Stickers Fleet"}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-normal">
              {activeFolder
                ? `Showing sticker collection inside folder "${activeFolder}"`
                : "Double-click or double-tap any folder to open its sticker collection"}
            </p>
          </div>
        </div>

        {/* Primary Header Action: ONE Create Button + Utility Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {activeFolder && (
            <button
              type="button"
              onClick={() => {
                setActiveFolder(null);
                setPage(1);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 font-semibold text-xs transition-colors cursor-pointer shadow-2xs"
            >
              <ChevronLeft size={15} />
              <span>All Folders</span>
            </button>
          )}

          {!activeFolder && (
            <button
              type="button"
              onClick={() => setIsCreateFolderOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-xs transition-all shadow-xs cursor-pointer"
            >
              <FolderPlus size={15} />
              <span>New Folder</span>
            </button>
          )}

          {/* Single Primary Create Button (Requirement 5) */}
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-950 text-white font-semibold text-xs hover:bg-black active:scale-98 transition-all shadow-xs cursor-pointer"
          >
            <Plus size={16} strokeWidth={2.4} />
            <span>Create</span>
          </button>

          {/* Export Fleet CSV */}
          <button
            type="button"
            onClick={downloadFleetCsv}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-gray-200/80 text-gray-700 font-semibold text-xs hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-2xs cursor-pointer disabled:opacity-40"
            title="Export CSV"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* Label Manager */}
          <button
            type="button"
            onClick={() => setIsLabelManagerOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-gray-200/80 text-gray-700 font-semibold text-xs hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-2xs cursor-pointer"
          >
            <Tag size={13} className="text-orange-600" />
            <span>Labels</span>
          </button>

          {/* Deleted Restore */}
          <button
            type="button"
            onClick={openRestore}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-gray-200/80 text-gray-700 font-semibold text-xs hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-2xs cursor-pointer"
            title="Restore a deleted sticker with proof of recovery code"
          >
            <RefreshCw size={13} />
            <span className="hidden md:inline">Restore</span>
          </button>
        </div>
      </div>

      {/* ── 2. Windows 11 Explorer Folders Grid (Root) vs Inside Folder View ── */}
      {!activeFolder ? (
        /* Root View: Show ONLY Windows 11 Explorer Folders (No stickers outside folder) */
        <FolderGrid
          folders={allDisplayFolders}
          stickerCounts={folderCounts}
          totalStickersCount={qrList.length}
          selectedFolderId={selectedFolderId}
          onSelectFolder={(f) => setSelectedFolderId(f.id)}
          onOpenFolder={(f) => {
            setActiveFolder(f.name);
            setPage(1);
          }}
          onPrintFolder={(f) => {
            const stickersInFolder = qrList.filter((q) =>
              f.name.toLowerCase() === "unassigned stock"
                ? !q.folderName || q.folderName.toLowerCase() === "unassigned" || q.folderName.toLowerCase() === "unassigned stock"
                : (q.folderName || "").toLowerCase() === f.name.toLowerCase()
            );
            handleTriggerPrint(undefined, stickersInFolder);
          }}
          onAssignLabelFolder={(f) => {
            const stickersInFolder = qrList.filter((q) =>
              f.name.toLowerCase() === "unassigned stock"
                ? !q.folderName || q.folderName.toLowerCase() === "unassigned" || q.folderName.toLowerCase() === "unassigned stock"
                : (q.folderName || "").toLowerCase() === f.name.toLowerCase()
            );
            if (stickersInFolder.length > 0) {
              setAssignLabelTargetIds(stickersInFolder.map((q) => q.id));
              setIsAssignLabelOpen(true);
            }
          }}
          onDeleteFolder={handleDeleteFolder}
          onRenameFolder={(f) => setFolderToRename(f)}
          onCreateFolderClick={() => setIsCreateFolderOpen(true)}
        />
      ) : (
        /* Inside Folder View: Breadcrumbs, Filter Bar, and Stickers Collection */
        <div className="space-y-6 animate-in fade-in duration-150">
          <FolderBreadcrumbs
            currentFolder={activeFolder}
            folderCount={filtered.length}
            onBackToAll={() => {
              setActiveFolder(null);
              setPage(1);
            }}
            onPrintFolder={handlePrintActiveFolder}
            onAssignFolderLabel={handleAssignActiveFolderLabel}
            onRenameFolder={() => {
              const currentF = allDisplayFolders.find(
                (f) => f.name.toLowerCase() === activeFolder.toLowerCase()
              );
              if (currentF) {
                setFolderToRename(currentF);
              } else {
                setFolderToRename({
                  id: "f-" + activeFolder.toLowerCase(),
                  name: activeFolder,
                  createdAt: new Date().toISOString(),
                });
              }
            }}
            onCreateStickerInFolder={() => setCreateModalOpen(true)}
          />

          {/* Segmented Capsule Tabs (Within Folder) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200/80 pb-4">
            <div className="inline-flex p-1 rounded-xl bg-gray-200/70 border border-gray-200/80 self-start">
              <button
                type="button"
                onClick={() => handleTabChange("all")}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === "all"
                    ? "bg-white text-gray-950 shadow-2xs font-bold"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                All in Folder ({metrics.total})
              </button>
              <button
                type="button"
                onClick={() => handleTabChange("active")}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === "active"
                    ? "bg-white text-gray-950 shadow-2xs font-bold"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Active ({metrics.active})
              </button>
              <button
                type="button"
                onClick={() => handleTabChange("pending")}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === "pending"
                    ? "bg-white text-gray-950 shadow-2xs font-bold"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Pending Stock ({metrics.pending})
              </button>
              <button
                type="button"
                onClick={() => handleTabChange("printed")}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === "printed"
                    ? "bg-white text-gray-950 shadow-2xs font-bold"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Printed ({metrics.printed})
              </button>
            </div>

            {/* View Mode Switcher: Cards vs Table */}
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <div className="inline-flex p-0.5 rounded-lg border border-gray-200/80 bg-white shadow-2xs">
                <button
                  type="button"
                  onClick={() => setViewMode("cards")}
                  className={`p-1.5 rounded-md transition-all cursor-pointer ${
                    viewMode === "cards" ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-900"
                  }`}
                  title="Cards Grid View"
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 rounded-md transition-all cursor-pointer ${
                    viewMode === "table" ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-900"
                  }`}
                  title="Table View"
                >
                  <TableIcon size={15} />
                </button>
              </div>

              {/* Reveal Recovery Codes Toggle */}
              <button
                type="button"
                onClick={async () => {
                  const next = !revealedCodes;
                  setRevealedCodes(next);
                  if (next) await fetchMissingRecoveryCodes(qrList.map((q) => q.id));
                }}
                disabled={revealingCodes}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200/80 transition-colors cursor-pointer ${
                  revealedCodes ? "bg-gray-900 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {revealingCodes ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : revealedCodes ? (
                  <EyeOff size={13} />
                ) : (
                  <Eye size={13} />
                )}
                <span className="hidden sm:inline">{revealedCodes ? "Hide Codes" : "See Codes"}</span>
              </button>
            </div>
          </div>

      {/* ── 3. Single Unified Horizontal Filter Bar (Requirement 4) ───────── */}
      <div className="p-3 bg-white border border-gray-200/80 rounded-2xl shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search ID, phone, vehicle..."
              value={searchText}
              onChange={(e) => handleFilterChange(() => setSearchText(e.target.value))}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-gray-200/90 bg-gray-50/50 text-gray-900 placeholder:text-gray-400 outline-none focus:bg-white focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition-all"
            />
          </div>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => handleFilterChange(() => setStatusFilter(e.target.value as any))}
            className="px-3 py-1.5 text-xs font-medium rounded-xl border border-gray-200/90 bg-white text-gray-700 outline-none hover:border-gray-300 focus:border-gray-900 cursor-pointer transition-all"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Pending Stock Only</option>
          </select>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => handleFilterChange(() => setCategoryFilter(e.target.value))}
            className="px-3 py-1.5 text-xs font-medium rounded-xl border border-gray-200/90 bg-white text-gray-700 outline-none hover:border-gray-300 focus:border-gray-900 cursor-pointer transition-all"
          >
            <option value="all">All Categories</option>
            {STICKER_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>

          {/* Label Filter */}
          <select
            value={labelFilter}
            onChange={(e) => handleFilterChange(() => setLabelFilter(e.target.value))}
            className="px-3 py-1.5 text-xs font-medium rounded-xl border border-gray-200/90 bg-white text-gray-700 outline-none hover:border-gray-300 focus:border-gray-900 cursor-pointer transition-all"
          >
            <option value="all">All Batch Labels</option>
            {labels.map((lbl) => (
              <option key={lbl.id} value={lbl.name}>
                🏷️ {lbl.name}
              </option>
            ))}
            <option value="unlabeled">Unlabeled Only</option>
          </select>

          {/* Print Status Filter */}
          <select
            value={printStatusFilter}
            onChange={(e) => handleFilterChange(() => setPrintStatusFilter(e.target.value as any))}
            className="px-3 py-1.5 text-xs font-medium rounded-xl border border-gray-200/90 bg-white text-gray-700 outline-none hover:border-gray-300 focus:border-gray-900 cursor-pointer transition-all"
          >
            <option value="all">All Print Status</option>
            <option value="unprinted">Unprinted Only ({metrics.unprinted})</option>
            <option value="printed">Printed Only ({metrics.printed})</option>
          </select>

          {/* Clear All Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-950 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X size={13} />
              <span>Clear Filters</span>
            </button>
          )}
        </div>

        {/* Count summary + Select All — visible regardless of card/table view,
            so bulk print/label actions aren't buried in the table-only header checkbox. */}
        <div className="flex items-center gap-3 whitespace-nowrap">
          <button
            type="button"
            onClick={toggleSelectAllCurrent}
            disabled={paginated.length === 0}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-950 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {isAllCurrentPageSelected ? <CheckSquare size={14} /> : <Square size={14} />}
            <span>{isAllCurrentPageSelected ? "Deselect All" : "Select All"}</span>
          </button>
          <div className="text-xs text-gray-500 font-medium">
            Showing <span className="font-bold text-gray-900">{filtered.length}</span> matching stickers
          </div>
        </div>
      </div>

      {/* ── 4. Batch Selection Toolbar (when items selected) ──────────────── */}
      {selectedIds.size > 0 && (
        <div className="bg-gray-900 text-white rounded-2xl p-3.5 px-5 flex flex-wrap items-center justify-between gap-4 shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-white/20 text-white font-bold text-xs flex items-center justify-center">
              {selectedIds.size}
            </span>
            <span className="text-xs font-semibold">
              {selectedIds.size} sticker{selectedIds.size > 1 ? "s" : ""} selected
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setAssignLabelTargetIds(Array.from(selectedIds));
                setIsAssignLabelOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <Tag size={13} />
              <span>Assign Label</span>
            </button>

            <button
              type="button"
              onClick={() => handleBulkSetPrinted(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <CheckCircle2 size={13} />
              <span>Mark Printed</span>
            </button>

            <button
              type="button"
              onClick={() => handleBulkSetPrinted(false)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <Printer size={13} />
              <span>Mark Unprinted</span>
            </button>

            {/* ── Move Selected to Folder ─────────────────────────── */}
            <button
              type="button"
              onClick={() => {
                setMoveToFolderTargetIds(Array.from(selectedIds));
                setIsMoveToFolderOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <Folder size={13} className="fill-current" />
              <span>Folder ({selectedIds.size})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const selected = filtered.filter((q) => selectedIds.has(q.id));
                handleTriggerPrint(undefined, selected);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <Printer size={13} />
              <span>Print Sheet Modal ({selectedIds.size})</span>
            </button>

            {/* ── Delete Selected (destructive, red) ───────────────── */}
            <button
              type="button"
              onClick={() => setShowDeleteSelectedConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <Trash2 size={13} />
              <span>Delete Selected ({selectedIds.size})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-gray-400 hover:text-white font-medium px-2 py-1 cursor-pointer"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* ── 5. Main Content: Cards Grid vs Table ───────────────────────────── */}
      {filtered.length === 0 ? (
        /* Empty State */
        <div className="bg-white border border-gray-200/80 rounded-2xl p-12 text-center shadow-2xs space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 mx-auto">
            <QrCode size={26} />
          </div>
          <h3 className="text-base font-bold text-gray-900">
            {hasActiveFilters ? "No stickers match your filters" : "No QR stickers in fleet yet"}
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {hasActiveFilters
              ? "Try clearing or adjusting your search filters to find what you are looking for."
              : "Create your first QR sticker to begin managing and deploying vehicle tags."}
          </p>
          <div className="pt-2">
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <RefreshCw size={13} />
                <span>Reset All Filters</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl bg-gray-900 text-white hover:bg-black transition-colors cursor-pointer shadow-xs"
              >
                <Plus size={15} />
                <span>+ Create First QR Sticker</span>
              </button>
            )}
          </div>
        </div>
      ) : viewMode === "cards" ? (
        /* ── Cards Grid View (Matching Reference Style: rounded-2xl, subtle borders) ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {paginated.map((q) => {
            const slotNumber = stableSlotMap.get(q.id);
            const catKey = (q.category || "car") as any;
            const catLabel = getCategoryLabel(catKey);
            const catIcon = getCategoryIcon(catKey);
            const phone = q.ownerPhone || q.phoneNumber || (q as any).phone || "";
            const isActivated = Boolean(phone && phone.trim());
            const isPrinted = printedStickerIds.has(q.id) || q.isPrinted;
            const isSelected = selectedIds.has(q.id);

            return (
              <div
                key={q.id}
                className={`
                  bg-white rounded-2xl border transition-all duration-150 overflow-hidden flex flex-col justify-between
                  hover:shadow-md hover:border-gray-300
                  ${isSelected ? "border-gray-900 ring-2 ring-gray-900/10" : "border-gray-200/80 shadow-2xs"}
                `}
              >
                {/* Card Top: Stable Slot Number, Selection, Status */}
                <div className="p-4 pb-3 flex items-center justify-between border-b border-gray-100 bg-gray-50/40">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(q.id)}
                      className="w-4 h-4 rounded-md border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
                    />
                    {/* Stable Permanent Slot Number */}
                    <span className="font-mono text-xs font-bold text-gray-800 bg-gray-200/70 px-2 py-0.5 rounded-md">
                      {formatSlotNumber(slotNumber)}
                    </span>
                  </div>

                  {/* Status Pill */}
                  <span
                    className={`
                      text-[11px] font-semibold px-2 py-0.5 rounded-full border
                      ${
                        isActivated
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                          : "bg-amber-50 text-amber-700 border-amber-200/60"
                      }
                    `}
                  >
                    {isActivated ? "Active" : "Pending"}
                  </span>
                </div>

                {/* Card Middle: Preview with Hover Zoom */}
                <div
                  className="p-5 flex flex-col items-center justify-center bg-gray-50/20 cursor-pointer group"
                  onClick={() => openQuickLook(q)}
                >
                  <div className="w-full max-w-[200px] transition-transform duration-200 group-hover:scale-105">
                    <StickerMockupView qr={q} mode="physical" />
                  </div>
                </div>

                {/* Card Details & Metadata */}
                <div className="p-4 pt-3 border-t border-gray-100 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 text-gray-700 font-semibold">
                      <span>{catIcon}</span>
                      <span>{catLabel}</span>
                    </span>

                    {/* Batch Label */}
                    {q.labelName ? (
                      <LabelBadge
                        name={q.labelName}
                        color={q.labelColor}
                        size="xs"
                        onClick={() => {
                          setAssignLabelTargetIds([q.id]);
                          setIsAssignLabelOpen(true);
                        }}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setAssignLabelTargetIds([q.id]);
                          setIsAssignLabelOpen(true);
                        }}
                        className="text-[11px] text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                      >
                        + Label
                      </button>
                    )}
                  </div>

                  {/* Phone / Identity */}
                  <div className="text-xs">
                    {isActivated ? (
                      <div className="flex items-center gap-1.5 text-gray-800 bg-gray-100/80 px-2.5 py-1 rounded-lg">
                        <Phone size={12} className="text-emerald-600" />
                        <span className="font-semibold">{phone}</span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg">
                        Unassigned Blank Stock
                      </div>
                    )}
                  </div>

                  {/* Folder Badge if assigned */}
                  {q.folderName && (
                    <div className="flex items-center justify-between text-[11px] pt-0.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveFolder(q.folderName!);
                          setPage(1);
                        }}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold border border-amber-200/60 transition-colors cursor-pointer"
                        title="Open folder"
                      >
                        <Folder size={11} className="fill-amber-400 text-amber-600" />
                        <span>{q.folderName}</span>
                      </button>
                    </div>
                  )}

                  {/* Footer Action Buttons */}
                  <div className="flex items-center gap-1.5 pt-1 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => openQuickLook(q)}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200/80 text-gray-900 text-xs font-semibold transition-colors cursor-pointer text-center"
                    >
                      Inspect
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMoveToFolderTargetIds([q.id]);
                        setIsMoveToFolderOpen(true);
                      }}
                      className="p-1.5 rounded-xl border border-gray-200/80 hover:bg-amber-50 hover:text-amber-700 text-gray-600 transition-colors cursor-pointer"
                      title="Move to Folder"
                    >
                      <Folder size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportPdf([q])}
                      className="p-1.5 rounded-xl border border-gray-200/80 hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer"
                      title="Print Sticker"
                    >
                      <Printer size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(q)}
                      className="p-1.5 rounded-xl border border-red-200/80 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Delete Sticker"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Table View ──────────────────────────────────────────────────────── */
        <div className="bg-white border border-gray-200/80 rounded-2xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-900">
              <thead className="bg-gray-50/80 border-b border-gray-200/80 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={isAllCurrentPageSelected}
                      onChange={toggleSelectAllCurrent}
                      className="w-4 h-4 rounded-md border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3.5">Slot #</th>
                  <th className="px-4 py-3.5">Sticker ID</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Batch Label</th>
                  <th className="px-4 py-3.5">Owner Phone</th>
                  <th className="px-4 py-3.5">Print Status</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-normal">
                {paginated.map((q) => {
                  const slotNumber = stableSlotMap.get(q.id);
                  const catKey = (q.category || "car") as any;
                  const catLabel = getCategoryLabel(catKey);
                  const catIcon = getCategoryIcon(catKey);
                  const phone = q.ownerPhone || q.phoneNumber || (q as any).phone || "";
                  const isActivated = Boolean(phone && phone.trim());
                  const isPrinted = printedStickerIds.has(q.id) || q.isPrinted;
                  const isSelected = selectedIds.has(q.id);

                  return (
                    <tr
                      key={q.id}
                      className={`hover:bg-gray-50/80 transition-colors ${
                        isSelected ? "bg-gray-50" : ""
                      }`}
                    >
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(q.id)}
                          className="w-4 h-4 rounded-md border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3.5 font-mono font-bold text-gray-800">
                        {formatSlotNumber(slotNumber)}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col items-start">
                          <button
                            type="button"
                            onClick={() => openQuickLook(q)}
                            className="font-mono font-semibold text-gray-900 hover:text-orange-600 transition-colors cursor-pointer text-left"
                          >
                            {adminStickerLabel(q, catLabel)}
                          </button>
                          {q.folderName && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveFolder(q.folderName!);
                                setPage(1);
                              }}
                              className="inline-flex items-center gap-1 text-[10px] text-amber-900 bg-amber-50 hover:bg-amber-100 px-1.5 py-0.5 rounded-md mt-1 border border-amber-200/60 cursor-pointer font-medium"
                              title="Filter by this folder"
                            >
                              <Folder size={10} className="fill-amber-400 text-amber-600" />
                              <span>{q.folderName}</span>
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-gray-700 font-medium">
                          <span>{catIcon}</span>
                          <span>{catLabel}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {q.labelName ? (
                          <LabelBadge
                            name={q.labelName}
                            color={q.labelColor}
                            size="xs"
                            onClick={() => {
                              setAssignLabelTargetIds([q.id]);
                              setIsAssignLabelOpen(true);
                            }}
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setAssignLabelTargetIds([q.id]);
                              setIsAssignLabelOpen(true);
                            }}
                            className="text-[11px] text-gray-400 hover:text-gray-700 cursor-pointer"
                          >
                            + Label
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {isActivated ? (
                          <span className="font-semibold text-gray-900">{phone}</span>
                        ) : (
                          <span className="text-gray-400">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`
                            text-[11px] font-semibold px-2 py-0.5 rounded-full border
                            ${
                              isPrinted
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                                : "bg-gray-100 text-gray-600 border-gray-200/60"
                            }
                          `}
                        >
                          {isPrinted ? "Printed" : "Unprinted"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`
                            text-[11px] font-semibold px-2 py-0.5 rounded-full border
                            ${
                              isActivated
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                                : "bg-amber-50 text-amber-700 border-amber-200/60"
                            }
                          `}
                        >
                          {isActivated ? "Active" : "Pending"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openQuickLook(q)}
                            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg cursor-pointer"
                            title="Inspect"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMoveToFolderTargetIds([q.id]);
                              setIsMoveToFolderOpen(true);
                            }}
                            className="p-1.5 text-gray-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg cursor-pointer"
                            title="Move to Folder"
                          >
                            <Folder size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExportPdf([q])}
                            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg cursor-pointer"
                            title="Print"
                          >
                            <Printer size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(q)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 6. Pagination Controls ────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 pt-2">
          <p className="text-xs text-gray-500">
            Showing{" "}
            <span className="font-semibold text-gray-900">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}
            </span>{" "}
            of <span className="font-semibold text-gray-900">{filtered.length}</span> stickers
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border border-gray-200/80 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronLeft size={14} />
              <span>Prev</span>
            </button>
            <span className="text-xs font-bold text-gray-700 px-2">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border border-gray-200/80 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
        </div>
      )}

      {/* ── 7. Safe Delete Confirmation Modal (Requirement 7) ─────────────── */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/45 backdrop-blur-xs select-none"
          onClick={() => !isDeleting && setDeleteTarget(null)}
        >
          <div
            className="bg-white rounded-2xl border border-gray-200 shadow-2xl p-6 max-w-sm w-full space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-200/60">
                <AlertTriangle size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-gray-950">
                  Delete QR Sticker {deleteTarget.id}?
                </h3>
                <p className="text-xs text-gray-500 font-normal leading-relaxed">
                  Are you sure you want to permanently delete this sticker? Existing sticker slot numbers will{" "}
                  <strong className="text-gray-800">NOT</strong> shift, and no replacement will be automatically created.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-red-600 text-white hover:bg-red-700 active:scale-98 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 8. Delete Selected Confirmation Modal ─────────────────────────── */}
      {showDeleteSelectedConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/50 backdrop-blur-xs select-none"
          onClick={() => !isDeletingBulk && setShowDeleteSelectedConfirm(false)}
        >
          <div
            className="bg-white rounded-2xl border border-red-200 shadow-2xl p-6 max-w-sm w-full space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-200">
                <Trash2 size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-gray-950">
                  Delete {selectedIds.size} selected sticker{selectedIds.size !== 1 ? 's' : ''}?
                </h3>
                <p className="text-xs text-gray-500 font-normal leading-relaxed">
                  This will permanently remove{' '}
                  <strong className="text-gray-800">{selectedIds.size} sticker{selectedIds.size !== 1 ? 's' : ''}</strong>{' '}
                  from the database. This action <strong className="text-red-700">cannot be undone</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
              <button
                type="button"
                disabled={isDeletingBulk}
                onClick={() => setShowDeleteSelectedConfirm(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingBulk}
                onClick={handleDeleteSelected}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-red-600 text-white hover:bg-red-700 active:scale-98 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {isDeletingBulk ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                <span>{isDeletingBulk ? 'Deleting…' : `Delete ${selectedIds.size} Stickers`}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── 10. Create Tag Modal (Hidden by default; open ONLY on [+ Create]) ─ */}
      <GenerateTagModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        qrList={qrList}
        setQrList={setQrList}
        initialCategory={categoryFilter !== "all" ? categoryFilter : "car"}
        labels={labels}
        folders={allDisplayFolders}
        activeFolderName={activeFolder}
        setToast={setToast}
        onPrint={(target, batch) => handleTriggerPrint(target, batch)}
      />

      {/* ── 9. Auxiliary Label Modals ─────────────────────────────────────── */}
      <LabelManagerModal
        isOpen={isLabelManagerOpen}
        onClose={() => setIsLabelManagerOpen(false)}
        labels={labels}
        onSaveLabels={setLabels}
        onSelectLabel={() => {}}
      />

      <AssignLabelModal
        isOpen={isAssignLabelOpen}
        onClose={() => {
          setIsAssignLabelOpen(false);
          setAssignLabelTargetIds([]);
        }}
        selectedCount={assignLabelTargetIds.length > 0 ? assignLabelTargetIds.length : selectedIds.size}
        labels={labels}
        onAssignLabel={(labelId) => {
          const targetIds = assignLabelTargetIds.length > 0 ? assignLabelTargetIds : Array.from(selectedIds);
          const chosen = labels.find((l) => l.id === labelId);
          setQrList((prev) =>
            prev.map((q) =>
              targetIds.includes(q.id)
                ? {
                    ...q,
                    labelName: chosen ? chosen.name : undefined,
                    labelColor: chosen ? chosen.color : undefined,
                  }
                : q
            )
          );
          setIsAssignLabelOpen(false);
          setAssignLabelTargetIds([]);
          setToast(`Assigned label to ${targetIds.length} sticker(s)`);
          setTimeout(() => setToast(null), 2500);
        }}
        onOpenCreateLabel={() => setIsLabelManagerOpen(true)}
      />

      <BulkPrintByLabelModal
        isOpen={isBulkPrintByLabelOpen}
        onClose={() => setIsBulkPrintByLabelOpen(false)}
        labels={labels}
        qrList={qrList}
        printedStickerIds={printedStickerIds}
        onSelectLabelForPrint={(lbl, onlyUnprinted) => {
          let matching = qrList.filter(
            (q) => (q.labelName || "").toLowerCase() === lbl.name.toLowerCase()
          );
          if (onlyUnprinted) matching = matching.filter((q) => !printedStickerIds.has(q.id) && !q.isPrinted);
          if (matching.length === 0) {
            setToast(`No stickers found for label "${lbl.name}".`);
            setTimeout(() => setToast(null), 3000);
            return;
          }
          handleTriggerPrint(undefined, matching);
        }}
      />

      {/* Print Progress Non-blocking Widget */}
      <PrintProgressModal
        progress={printProgress}
        onCancel={handleCancelBatchExport}
      />

      {/* ── 11. Folder Modals ──────────────────────────────────────────────── */}
      <CreateFolderModal
        isOpen={isCreateFolderOpen}
        onClose={() => setIsCreateFolderOpen(false)}
        onCreate={handleCreateFolder}
      />

      <MoveToFolderModal
        isOpen={isMoveToFolderOpen}
        onClose={() => {
          setIsMoveToFolderOpen(false);
          setMoveToFolderTargetIds([]);
        }}
        folders={folders}
        selectedCount={moveToFolderTargetIds.length > 0 ? moveToFolderTargetIds.length : selectedIds.size}
        onMoveToFolder={(folderName) => {
          const targetIds = moveToFolderTargetIds.length > 0 ? moveToFolderTargetIds : Array.from(selectedIds);
          handleMoveToFolder(folderName);
        }}
        onCreateNewFolder={() => setIsCreateFolderOpen(true)}
      />

      <RenameFolderModal
        isOpen={Boolean(folderToRename)}
        onClose={() => setFolderToRename(null)}
        folder={folderToRename}
        onRename={handleRenameFolder}
      />
    </div>
  );
}
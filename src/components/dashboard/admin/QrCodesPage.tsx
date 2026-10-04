import type React from "react";
import { useState, useEffect, useMemo } from "react";
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
  Copy,
  Check,
  Phone,
  Sparkles,
  ExternalLink,
  Shield,
  Layers,
  Activity,
  Tag,
  CheckCircle2,
  SlidersHorizontal,
} from "lucide-react";
import { QrRecord, Template, StickerPos, StickerLabel } from "./types";
import { qrFullUrl, fmtDate, dispatchActivationToUserDashboard } from "./helpers";
import { apiClient } from "../../../lib/apiClient";
import { stickerRef, useCodesRevealed } from "../../../lib/codeVisibility";
import { useLocalStorage } from "./useLocalStorage";
import { generateStickerBatchPdfBlob, downloadSheetBlob } from "../../../services/stickerPrintSheetService";
import { STICKER_CATEGORIES, getCategoryLabel, getCategoryIcon } from "../../../stickerModules";
import QrRowActions from "./QrRowActions";
import PrintSheetModal from "./PrintSheetModal";
import PrintProgressModal, { PrintProgressState } from "./print-sheet/PrintProgressModal";
import GenerateTagModal from "./GenerateTagModal";
import StickerMockupView from "./StickerMockupView";
import LabelBadge from "./labels/LabelBadge";
import LabelManagerModal from "./labels/LabelManagerModal";
import AssignLabelModal from "./labels/AssignLabelModal";
import BulkPrintByLabelModal from "./labels/BulkPrintByLabelModal";
import { DEFAULT_PRESET_LABELS } from "./labels/labelConstants";
import FxKpiStrip, { FxKpiCardSpec } from "../shared/FxKpiStrip";
import { FxModal } from "../shared";

type ViewMode = "table" | "cards";

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
}: {
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
}) {
  const [internalPrintedIds, setInternalPrintedIds] = useLocalStorage<string[]>("repiqr-printed-sticker-ids", []);
  const activePrintedIdsList = printedStickerIdList ?? internalPrintedIds;
  const activeSetPrintedIds = setPrintedStickerIdList ?? setInternalPrintedIds;
  const printedStickerIds = useMemo(() => new Set(activePrintedIdsList || []), [activePrintedIdsList]);

  // Custom Color Labels
  const [labels, setLabels] = useLocalStorage<StickerLabel[]>("repiqr-custom-labels", DEFAULT_PRESET_LABELS);
  const [selectedLabelId, setSelectedLabelId] = useState<string>("none");

  const [selectedCategory, setSelectedCategory] = useState("car");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [labelFilter, setLabelFilter] = useState("all");
  const [printStatusFilter, setPrintStatusFilter] = useState<"all" | "unprinted" | "printed">("all");

  const [tab, setTab] = useState<"single" | "bulk">("single");
  const [bulkCount, setBulkCount] = useState(25);
  const [bulkProgress, setBulkProgress] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<QrRecord | null>(null);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revealedCodes, setRevealedCodes] = useCodesRevealed();
  const [recoveryCodeMap, setRecoveryCodeMap] = useState<Record<string, string | null>>({});
  const [revealingCodes, setRevealingCodes] = useState(false);

  const PAGE_SIZE = viewMode === "cards" ? 18 : 25;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sheetGenerating, setSheetGenerating] = useState(false);
  const [printAllOpen, setPrintAllOpen] = useState(false);
  const [printProgress, setPrintProgress] = useState<PrintProgressState>({
    isVisible: false,
    current: 0,
    total: 0,
    percent: 0,
    stage: "",
  });

  // Modal dialog states
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [isLabelManagerOpen, setIsLabelManagerOpen] = useState(false);
  const [isAssignLabelOpen, setIsAssignLabelOpen] = useState(false);
  const [isBulkPrintByLabelOpen, setIsBulkPrintByLabelOpen] = useState(false);
  const [assignLabelTargetIds, setAssignLabelTargetIds] = useState<string[]>([]);

  const [searchText, setSearchText] = useState(searchQuery);
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);

  useEffect(() => {
    setSearchText(searchQuery);
  }, [searchQuery]);

  // Metrics computation (including printed vs unprinted counts)
  const metrics = useMemo(() => {
    const total = qrList.length;
    let active = 0;
    let totalScans = 0;
    let printed = 0;
    qrList.forEach((q) => {
      const phone = q.ownerPhone || q.phoneNumber || (q as any).phone;
      if (phone && phone.trim()) active += 1;
      else if (q.status === "active") active += 1;
      totalScans += q.scans || 0;
      if (printedStickerIds.has(q.id) || q.isPrinted) {
        printed += 1;
      }
    });
    return {
      total,
      active,
      pending: total - active,
      printed,
      unprinted: total - printed,
      scans: totalScans,
    };
  }, [qrList, printedStickerIds]);

  // Blank stock: no linked phone number and not active (same "pending" notion as the KPI above).
  const unassignedInactive = useMemo(
    () =>
      qrList.filter((q) => {
        const phone = q.ownerPhone || q.phoneNumber || (q as any).phone || (q as any).owner_phone || "";
        return !String(phone).trim() && q.status !== "active";
      }),
    [qrList]
  );
  const unassignedAlreadyPrinted = useMemo(
    () => unassignedInactive.filter((q) => printedStickerIds.has(q.id) || q.isPrinted).length,
    [unassignedInactive, printedStickerIds]
  );

  // Filtered fleet list
  const filtered = useMemo(() => {
    let result = qrList;

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

    // Search text filter
    if (searchText.trim()) {
      const needle = searchText.toLowerCase().trim();
      result = result.filter(
        (r) =>
          (r.id || "").toLowerCase().includes(needle) ||
          (r.ownerPhone || r.phoneNumber || (r as any).phone || "").toLowerCase().includes(needle) ||
          (r.category || "").toLowerCase().includes(needle) ||
          (r.clientId || "").toLowerCase().includes(needle) ||
          (r.recoveryCode || "").toLowerCase().includes(needle) ||
          (r.labelName || "").toLowerCase().includes(needle) ||
          (r.vehicleName || "").toLowerCase().includes(needle) ||
          (r.vehicleNumber || "").toLowerCase().includes(needle)
      );
    }
    return result;
  }, [qrList, categoryFilter, labelFilter, printStatusFilter, searchText, printedStickerIds]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);
  useEffect(() => {
    setPage(1);
  }, [categoryFilter, labelFilter, printStatusFilter, searchText, viewMode]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setSelectedIds((prev) => {
      const valid = new Set(qrList.map((q) => q.id));
      const next = new Set([...prev].filter((id) => valid.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [qrList]);

  useEffect(() => {
    setOpenActionMenu(null);
  }, [page, categoryFilter, labelFilter, printStatusFilter, searchText, viewMode]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest?.("[data-fx-more]")) return;
      setOpenActionMenu(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const allPageSelected = paginated.length > 0 && paginated.every((q) => selectedIds.has(q.id));
  function toggleSelectAllPage() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) paginated.forEach((q) => next.delete(q.id));
      else paginated.forEach((q) => next.add(q.id));
      return next;
    });
  }

  function handleCopyId(id: string) {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setToast(`Copied ${id} to clipboard`);
    setTimeout(() => {
      setCopiedId(null);
      setToast(null);
    }, 2000);
  }

  // Toggle single sticker print status
  function handleTogglePrintedStatus(id: string) {
    const isCurrentlyPrinted = printedStickerIds.has(id);
    const newPrinted = !isCurrentlyPrinted;
    activeSetPrintedIds((prev) => {
      const next = new Set<string>(prev || []);
      if (newPrinted) next.add(id);
      else next.delete(id);
      return Array.from(next);
    });

    setQrList((prev) =>
      prev.map((q) => (q.id === id ? { ...q, isPrinted: newPrinted } : q))
    );

    apiClient.qr.bulkUpdatePrintStatus([id], newPrinted).catch(() => {});
    setToast(newPrinted ? `Tag ${id} marked as Printed` : `Tag ${id} marked as Unprinted`);
    setTimeout(() => setToast(null), 2500);
  }

  // Bulk toggle print status for selected stickers
  function handleBulkTogglePrinted(markAsPrinted: boolean) {
    const targetIds: string[] = [...selectedIds];
    if (targetIds.length === 0) return;

    activeSetPrintedIds((prev) => {
      const next = new Set<string>(prev || []);
      if (markAsPrinted) targetIds.forEach((id: string) => next.add(id));
      else targetIds.forEach((id: string) => next.delete(id));
      return Array.from(next);
    });

    setQrList((prev) =>
      prev.map((q) => (selectedIds.has(q.id) ? { ...q, isPrinted: markAsPrinted } : q))
    );

    apiClient.qr.bulkUpdatePrintStatus(targetIds, markAsPrinted).catch(() => {});
    setToast(
      markAsPrinted
        ? `Marked ${targetIds.length} stickers as Printed`
        : `Marked ${targetIds.length} stickers as Unprinted`
    );
    setTimeout(() => setToast(null), 3000);
  }

  // Assign label to selected stickers
  function handleBulkAssignLabel(labelName: string | null, labelColor: string | null) {
    const targetIds: string[] = assignLabelTargetIds.length > 0 ? assignLabelTargetIds : [...selectedIds];
    if (targetIds.length === 0) return;

    setQrList((prev) =>
      prev.map((q) =>
        targetIds.includes(q.id)
          ? {
              ...q,
              labelName: labelName || undefined,
              labelColor: labelColor || undefined,
            }
          : q
      )
    );

    apiClient.qr.bulkUpdateLabels(targetIds, labelName, labelColor).catch(() => {});
    setToast(
      labelName
        ? `Assigned label "${labelName}" to ${targetIds.length} sticker${targetIds.length > 1 ? "s" : ""}`
        : `Removed label from ${targetIds.length} sticker${targetIds.length > 1 ? "s" : ""}`
    );
    setAssignLabelTargetIds([]);
    setTimeout(() => setToast(null), 3000);
  }

  function handleOpenAssignLabelForSingle(qr: QrRecord) {
    setAssignLabelTargetIds([qr.id]);
    setIsAssignLabelOpen(true);
  }

  const [isLocalPrintModalOpen, setIsLocalPrintModalOpen] = useState(false);
  const [localPrintTargetSticker, setLocalPrintTargetSticker] = useState<QrRecord | null>(null);
  const [localPrintBatch, setLocalPrintBatch] = useState<QrRecord[] | undefined>(undefined);

  function handleTriggerPrintSheet(targetSticker?: QrRecord, selectedBatchStickers?: QrRecord[]) {
    if (openPrintSheet) {
      openPrintSheet(targetSticker, selectedBatchStickers);
      return;
    }
    setLocalPrintTargetSticker(targetSticker || null);
    setLocalPrintBatch(selectedBatchStickers);
    setIsLocalPrintModalOpen(true);
  }

  // Bulk print by label shortcut
  function handleSelectLabelForPrint(label: StickerLabel, onlyUnprinted = false) {
    let matching: QrRecord[];
    if (label.id === "unlabeled") {
      matching = qrList.filter((q) => !q.labelName);
    } else {
      matching = qrList.filter(
        (q) => (q.labelName || "").toLowerCase() === label.name.toLowerCase()
      );
    }
    if (onlyUnprinted) {
      matching = matching.filter((q) => !printedStickerIds.has(q.id) && !q.isPrinted);
    }
    if (matching.length === 0) {
      setToast(`No ${onlyUnprinted ? "unprinted " : ""}stickers found for label "${label.name}"`);
      setTimeout(() => setToast(null), 3000);
      return;
    }
    handleTriggerPrintSheet(undefined, matching);
  }

  function handlePrintSheet() {
    const selected = filtered.filter((q) => selectedIds.has(q.id));
    if (selected.length === 0) {
      setToast("Select at least one sticker to include in the print sheet.");
      setTimeout(() => setToast(null), 3000);
      return;
    }
    void exportStickersPdf(selected, `rapiqr-print-sheet-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  /**
   * "Print all unassigned": every sticker that has no linked phone number AND is
   * not active — i.e. blank stock nobody has claimed yet — in ONE PDF. Looks at
   * the whole fleet, not the current filter/selection.
   */
  async function handlePrintAllUnassigned() {
    setPrintAllOpen(false);
    if (unassignedInactive.length === 0) {
      setToast("No unassigned, inactive stickers to print.");
      setTimeout(() => setToast(null), 3000);
      return;
    }
    await exportStickersPdf(
      unassignedInactive,
      `rapiqr-unassigned-stickers-${new Date().toISOString().slice(0, 10)}.pdf`
    );
  }

  async function exportStickersPdf(selected: QrRecord[], fileName: string) {
    if (sheetGenerating) return;
    setSheetGenerating(true);
    setPrintProgress({
      isVisible: true,
      current: 0,
      total: selected.length,
      percent: 2,
      stage: "Resolving sticker codes…",
    });

    try {
      const recoveryCodeMap = await fetchMissingRecoveryCodes(selected.map((q) => q.id));
      const pdfBlob = await generateStickerBatchPdfBlob(
        selected,
        stickerPos,
        recoveryCodeMap,
        1,
        (progressInfo) => {
          setPrintProgress({
            isVisible: true,
            ...progressInfo,
          });
        }
      );
      if (!pdfBlob) throw new Error("No PDF generated");
      downloadSheetBlob(pdfBlob, fileName);

      // Mark the printed stickers as printed
      const newlyPrintedIds = selected.map((s) => s.id);
      const newlyPrinted = new Set(newlyPrintedIds);
      activeSetPrintedIds((prev) => {
        const next = new Set<string>(prev || []);
        newlyPrintedIds.forEach((id) => next.add(id));
        return Array.from(next);
      });
      setQrList((prev) =>
        prev.map((q) => (newlyPrinted.has(q.id) ? { ...q, isPrinted: true } : q))
      );
      apiClient.qr.bulkUpdatePrintStatus(newlyPrintedIds, true).catch(() => {});

      setToast(`Generated a print-ready PDF for ${selected.length} sticker${selected.length > 1 ? "s" : ""}`);
    } catch (err) {
      console.error("Failed to generate print sheet:", err);
      setToast("Failed to generate print sheet — please try again");
    } finally {
      setSheetGenerating(false);
      setPrintProgress((prev) => ({ ...prev, isVisible: false }));
      setTimeout(() => setToast(null), 4000);
    }
  }

  function recordFromV2Response(data: any, fallbackCategory: string, labelName?: string, labelColor?: string): QrRecord {
    return {
      id: data.id,
      clientId: data.client_id,
      qrUrl: qrFullUrl(data.id),
      createdAt: data.created_at || new Date().toISOString(),
      scans: 0,
      status: data.status || "inactive",
      template: data.template_name || "Standard Tag",
      category: data.category || fallbackCategory,
      fg: data.fg_color || "000000",
      bg: data.bg_color || "FFFFFF",
      recoveryCode: data.recoveryCode,
      labelName: data.label_name || labelName || undefined,
      labelColor: data.label_color || labelColor || undefined,
      isPrinted: false,
    };
  }

  const chosenGeneratorLabel = labels.find((l) => l.id === selectedLabelId);

  async function doGenerateBulk() {
    const count = Math.min(Math.max(1, bulkCount), 200);
    setBulkProgress(0);

    const recoveryRows: [string, string][] = [];
    let failedCount = 0;
    const CHUNK = 20;

    for (let i = 0; i < count; i++) {
      try {
        const res = await apiClient.qr.saveQrCodeV2({
          category: selectedCategory,
          labelName: chosenGeneratorLabel?.name || undefined,
          labelColor: chosenGeneratorLabel?.color || undefined,
        });
        if (!res?.success || !res.data) throw new Error(res?.error || "save failed");
        const rec = recordFromV2Response(res.data, selectedCategory, chosenGeneratorLabel?.name, chosenGeneratorLabel?.color);
        setQrList((prev) => [rec, ...prev]);
        if (rec.recoveryCode) recoveryRows.push([rec.id, rec.recoveryCode]);
        dispatchActivationToUserDashboard(rec);
      } catch (err) {
        console.warn(`Failed to generate QR ${i + 1}/${count}:`, err);
        failedCount += 1;
      }
      if ((i + 1) % CHUNK === 0 || i === count - 1) {
        setBulkProgress(Math.min(100, Math.round(((i + 1) / count) * 100)));
      }
    }

    setBulkProgress(null);

    const savedCount = count - failedCount;
    const labelInfo = chosenGeneratorLabel ? ` with label "${chosenGeneratorLabel.name}"` : "";
    if (failedCount > 0) {
      setToast(
        `${savedCount} of ${count} QR codes generated${labelInfo} — ${failedCount} failed to save.`
      );
    } else if (recoveryRows.length > 0) {
      downloadRecoveryCodesCsv(recoveryRows);
      setToast(`${count} QR codes generated${labelInfo} — recovery codes downloaded`);
    } else {
      setToast(`${count} QR codes generated & synced${labelInfo}`);
    }
    setTimeout(() => setToast(null), 5000);
  }

  function downloadRecoveryCodesCsv(rows: [string, string][]) {
    const csvRows = [["Sticker ID", "Recovery Code"], ...rows];
    const csv = csvRows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `rapiqr-recovery-codes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
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
      setToast("Failed to load recovery codes — please try again.");
      setTimeout(() => setToast(null), 4000);
      return recoveryCodeMap;
    } finally {
      setRevealingCodes(false);
    }
  }

  async function downloadCsv() {
    const codes = await fetchMissingRecoveryCodes(qrList.map((q) => q.id));
    const rows = [
      ["QR ID", "Recovery Code", "Phone Number", "Category", "Label", "Printed", "Status", "Created"],
      ...qrList.map((q) => {
        const phoneNum = q.ownerPhone || q.phoneNumber || (q as any).phone || (q as any).owner_phone || "";
        const isActivated = Boolean(phoneNum && phoneNum.trim());
        const computedStatus = isActivated ? "active" : q.status;
        const code = codes[q.id] ?? q.recoveryCode;
        const isPrinted = printedStickerIds.has(q.id) || q.isPrinted;
        return [
          q.id,
          code || "N/A",
          phoneNum || "N/A",
          q.category || "car",
          q.labelName || "None",
          isPrinted ? "Yes" : "No",
          computedStatus,
          fmtDate(q.createdAt),
        ];
      }),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "rapiqr-fleet-export.csv";
    a.click();
  }

  const kpiCards: FxKpiCardSpec[] = [
    { key: "total", label: "Total Stickers", value: metrics.total },
    { key: "active", label: "Active", value: metrics.active, tone: "green" },
    { key: "pending", label: "Pending", value: metrics.pending, tone: "amber" },
    { key: "printed", label: "Printed", value: metrics.printed, tone: "green" },
    { key: "unprinted", label: "Unprinted", value: metrics.unprinted, tone: "amber" },
    { key: "scans", label: "Total Scans", value: metrics.scans, icon: <Activity size={14} /> },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-5 pb-16 space-y-6 text-[var(--fx-ink)] font-body bg-[var(--fx-canvas)] min-h-screen">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <h1 className="fx-text-heading-page text-[var(--fx-ink)]">QR Fleet Management</h1>
      </div>

      {/* ── Fleet KPI Strip ──────────────────────────────────────────────────── */}
      <FxKpiStrip cards={kpiCards} />

      {/* ── Generator Console Card ───────────────────────────────── */}
      <div className="bg-white border border-[var(--fx-border)] rounded-xl shadow-xs p-5 sm:p-6 transition-all space-y-4">
        <div className="flex flex-wrap items-end gap-4 sm:gap-6">
          {/* Mode Switcher */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--fx-ink-2)]">Generation Mode</label>
            <div className="inline-flex rounded-lg border border-[var(--fx-border)] overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => setTab("single")}
                className={`px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                  tab === "single"
                    ? "bg-[var(--fx-ink)] text-white"
                    : "bg-white text-[var(--fx-ink-2)] hover:bg-[var(--fx-canvas)]"
                }`}
              >
                Single Tag
              </button>
              <button
                type="button"
                onClick={() => setTab("bulk")}
                className={`px-4 py-2 text-xs font-bold border-l border-[var(--fx-border)] transition-all cursor-pointer ${
                  tab === "bulk"
                    ? "bg-[var(--fx-ink)] text-white"
                    : "bg-white text-[var(--fx-ink-2)] hover:bg-[var(--fx-canvas)]"
                }`}
              >
                Bulk Sheet
              </button>
            </div>
          </div>

          {/* Category Dropdown */}
          <div className="flex-1 min-w-[170px] flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--fx-ink-2)]">Category</label>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-3 pr-8 py-2 text-xs font-semibold rounded-lg border border-[var(--fx-border-strong)] bg-white text-[var(--fx-ink)] outline-none focus:border-[var(--fx-accent)] focus:ring-2 focus:ring-[var(--fx-accent)]/20 transition-all cursor-pointer shadow-2xs"
              >
                {STICKER_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Batch Color Label Dropdown */}
          <div className="flex-1 min-w-[210px] flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--fx-ink-2)]">Batch Label</label>
              <button
                type="button"
                onClick={() => setIsLabelManagerOpen(true)}
                className="text-[11px] text-[var(--fx-accent)] font-bold hover:text-[var(--fx-accent-hover)] transition-colors cursor-pointer flex items-center gap-1"
              >
                <Plus size={11} />
                <span>Manage</span>
              </button>
            </div>
            <div className="relative">
              <select
                value={selectedLabelId}
                onChange={(e) => {
                  if (e.target.value === "create_new") {
                    setIsLabelManagerOpen(true);
                  } else {
                    setSelectedLabelId(e.target.value);
                  }
                }}
                className="w-full pl-3 pr-8 py-2 text-xs font-semibold rounded-lg border border-[var(--fx-border-strong)] bg-white text-[var(--fx-ink)] outline-none focus:border-[var(--fx-accent)] focus:ring-2 focus:ring-[var(--fx-accent)]/20 transition-all cursor-pointer shadow-2xs"
              >
                <option value="none">No Label</option>
                {labels.map((lbl) => (
                  <option key={lbl.id} value={lbl.id}>
                    🏷️ {lbl.name}
                  </option>
                ))}
                <option value="create_new">+ Create New Label…</option>
              </select>
            </div>
          </div>

          {/* Bulk Quantity Input */}
          {tab === "bulk" && (
            <div className="w-[110px] flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--fx-ink-2)]">Quantity</label>
              <input
                type="number"
                min={1}
                max={200}
                value={bulkCount}
                onChange={(e) => setBulkCount(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-[var(--fx-border-strong)] bg-white text-[var(--fx-ink)] outline-none focus:border-[var(--fx-accent)] focus:ring-2 focus:ring-[var(--fx-accent)]/20 shadow-2xs"
              />
            </div>
          )}

          {/* Action CTA */}
          <div className="ml-auto sm:ml-0">
            {tab === "single" ? (
              <button
                type="button"
                onClick={() => setGenerateModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--fx-accent)] text-white font-bold text-xs hover:bg-[var(--fx-accent-hover)] active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                <Plus size={15} strokeWidth={2.4} />
                <span>Generate Tag</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => doGenerateBulk()}
                disabled={bulkProgress !== null}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--fx-accent)] text-white font-bold text-xs hover:bg-[var(--fx-accent-hover)] active:scale-95 disabled:opacity-50 transition-all shadow-xs cursor-pointer"
              >
                {bulkProgress !== null ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Sparkles size={15} strokeWidth={2.4} />
                )}
                <span>Generate {bulkCount} Tags</span>
              </button>
            )}
          </div>
        </div>

        {/* Selected Label Display */}
        {chosenGeneratorLabel && (
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-[var(--fx-ink-2)]">Will be tagged with:</span>
            <LabelBadge name={chosenGeneratorLabel.name} color={chosenGeneratorLabel.color} size="sm" />
          </div>
        )}

        {/* Bulk Progress Bar */}
        {bulkProgress !== null && (
          <div className="mt-4 pt-4 border-t border-[var(--fx-sidebar-hover)]">
            <div className="w-full bg-[var(--fx-sidebar-hover)] rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-[var(--fx-accent)] transition-all duration-200"
                style={{ width: `${bulkProgress}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-[var(--fx-ink-2)] font-semibold mt-1.5">
              <span>Generating stickers and storing recovery records...</span>
              <span className="font-mono text-[var(--fx-accent)]">{bulkProgress}%</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Toolbar: Search, Filters, View Modes & Bulk Actions ───────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Side: Search & Filters */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative min-w-[210px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fx-faint)]" />
            <input
              type="text"
              placeholder="Search sticker ID, label, phone..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[var(--fx-border-strong)] bg-white text-[var(--fx-ink)] outline-none focus:border-[var(--fx-accent)] focus:ring-2 focus:ring-[var(--fx-accent)]/20 shadow-2xs"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-[var(--fx-border-strong)] bg-white text-[var(--fx-ink-2)] outline-none cursor-pointer focus:border-[var(--fx-accent)] shadow-2xs"
          >
            <option value="all">All Categories ({qrList.length})</option>
            {STICKER_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>

          {/* Label Filter */}
          <select
            value={labelFilter}
            onChange={(e) => setLabelFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-[var(--fx-border-strong)] bg-white text-[var(--fx-ink-2)] outline-none cursor-pointer focus:border-[var(--fx-accent)] shadow-2xs"
          >
            <option value="all">All Labels ({labels.length})</option>
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
            onChange={(e) => setPrintStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-[var(--fx-border-strong)] bg-white text-[var(--fx-ink-2)] outline-none cursor-pointer focus:border-[var(--fx-accent)] shadow-2xs"
          >
            <option value="all">All Print Status</option>
            <option value="unprinted">🖨️ Unprinted Only ({metrics.unprinted})</option>
            <option value="printed">✅ Printed Only ({metrics.printed})</option>
          </select>
        </div>

        {/* Right Side: Action Buttons (segmented pill style) */}
        <div className="flex items-center gap-2 flex-wrap">

          {/* Primary action group: Print by Label */}
          <button
            type="button"
            onClick={() => setIsBulkPrintByLabelOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-[var(--fx-ink)] text-white hover:bg-[var(--fx-ink)]/90 transition-all shadow-xs cursor-pointer"
            title="Bulk print stickers grouped by label"
          >
            <Printer size={13} />
            <span>Print by Label</span>
          </button>

          {/* Secondary button group: Labels | Table/Cards | Restore | See Codes */}
          <div className="inline-flex rounded-lg border border-[var(--fx-border-strong)] overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => setIsLabelManagerOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-white text-[var(--fx-ink-2)] hover:bg-[var(--fx-canvas)] transition-colors cursor-pointer border-r border-[var(--fx-border)]"
              title="Manage batch labels"
            >
              <Tag size={13} className="text-[var(--fx-accent)]" />
              <span>Labels</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`inline-flex items-center justify-center px-2.5 py-2 text-xs font-bold transition-all cursor-pointer border-r border-[var(--fx-border)] ${
                viewMode === "table" ? "bg-[var(--fx-ink)] text-white" : "bg-white text-[var(--fx-ink-2)] hover:bg-[var(--fx-canvas)]"
              }`}
              title="Table View"
            >
              <TableIcon size={14} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`inline-flex items-center justify-center px-2.5 py-2 text-xs font-bold transition-all cursor-pointer border-r border-[var(--fx-border)] ${
                viewMode === "cards" ? "bg-[var(--fx-ink)] text-white" : "bg-white text-[var(--fx-ink-2)] hover:bg-[var(--fx-canvas)]"
              }`}
              title="Card View"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              type="button"
              onClick={openRestore}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-white text-[var(--fx-ink-2)] hover:bg-[var(--fx-canvas)] transition-colors cursor-pointer border-r border-[var(--fx-border)]"
              title="Restore a deleted sticker"
            >
              <RefreshCw size={12} />
              <span className="hidden sm:inline">Restore</span>
            </button>
            <button
              type="button"
              onClick={async () => {
                const next = !revealedCodes;
                setRevealedCodes(next);
                if (next) await fetchMissingRecoveryCodes(qrList.map((q) => q.id));
              }}
              disabled={revealingCodes}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition-colors cursor-pointer disabled:opacity-60 ${
                revealedCodes ? "bg-[var(--fx-ink)] text-white" : "bg-white text-[var(--fx-ink-2)] hover:bg-[var(--fx-canvas)]"
              }`}
              title="Toggle recovery codes"
            >
              {revealingCodes ? <Loader2 size={12} className="animate-spin" /> : revealedCodes ? <EyeOff size={12} /> : <Eye size={12} />}
              <span className="hidden sm:inline">{revealedCodes ? "Hide Codes" : "See Codes"}</span>
            </button>
          </div>

          {/* Export group: PDF | CSV */}
          <div className="inline-flex rounded-lg border border-[var(--fx-border-strong)] overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => setPrintAllOpen(true)}
              disabled={unassignedInactive.length === 0 || sheetGenerating}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-white text-[var(--fx-ink-2)] hover:bg-[var(--fx-canvas)] transition-colors disabled:opacity-40 cursor-pointer border-r border-[var(--fx-border)]"
              title="One PDF with every sticker that has no linked phone and isn't active"
            >
              <Printer size={13} />
              <span>Print all unassigned ({unassignedInactive.length})</span>
            </button>
            <button
              type="button"
              onClick={handlePrintSheet}
              disabled={selectedIds.size === 0 || sheetGenerating}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-white text-[var(--fx-ink-2)] hover:bg-[var(--fx-canvas)] transition-colors shadow-2xs disabled:opacity-40 cursor-pointer border-r border-[var(--fx-border)]"
              title="Select stickers then export PDF"
            >
              {sheetGenerating ? <Loader2 size={13} className="animate-spin" /> : <Printer size={13} />}
              <span>Export PDF{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}</span>
            </button>
            <button
              type="button"
              onClick={downloadCsv}
              disabled={qrList.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-white text-[var(--fx-ink-2)] hover:bg-[var(--fx-canvas)] transition-colors disabled:opacity-40 cursor-pointer"
            >
              <Download size={12} />
              <span>CSV</span>
            </button>
          </div>

        </div>
      </div>

      {/* ── Selection Action Bar (when items are checked) ────────────── */}
      {selectedIds.size > 0 && (
        <div className="bg-[var(--fx-accent-soft)] border border-[var(--fx-border-strong)] rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[var(--fx-accent)] text-white text-xs font-bold flex items-center justify-center">
              {selectedIds.size}
            </span>
            <span className="text-xs font-bold text-[var(--fx-accent)]">
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[var(--fx-border-strong)] text-[var(--fx-accent-hover)] text-xs font-bold hover:bg-[var(--fx-sidebar-hover)] transition-colors cursor-pointer shadow-2xs"
            >
              <Tag size={13} />
              <span>Assign Label</span>
            </button>

            <button
              type="button"
              onClick={() => handleBulkTogglePrinted(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--fx-green)] text-white text-xs font-bold hover:bg-[var(--fx-green)] transition-colors cursor-pointer shadow-2xs"
            >
              <CheckCircle2 size={13} />
              <span>Mark as Printed</span>
            </button>

            <button
              type="button"
              onClick={() => handleBulkTogglePrinted(false)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[var(--fx-border-strong)] text-[var(--fx-ink-2)] text-xs font-bold hover:bg-[var(--fx-sidebar-hover)] transition-colors cursor-pointer shadow-2xs"
            >
              <Printer size={13} />
              <span>Mark as Unprinted</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const selected = filtered.filter((q) => selectedIds.has(q.id));
                handleTriggerPrintSheet(undefined, selected);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[var(--fx-accent-hover)] text-white text-xs font-bold hover:bg-[var(--fx-accent-hover)] transition-colors cursor-pointer shadow-2xs"
            >
              <Printer size={13} />
              <span>Print Sheet Modal ({selectedIds.size})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-[var(--fx-ink-2)] hover:text-[var(--fx-ink)] font-bold px-2 py-1 cursor-pointer"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* ── Empty State ────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-[var(--fx-border)] rounded-xl p-8 text-center shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-[var(--fx-accent-soft)] text-[var(--fx-accent)] flex items-center justify-center mx-auto mb-3 border border-[var(--fx-border-strong)]">
            <QrCode size={22} />
          </div>
          <h3 className="font-bold text-[var(--fx-ink)] text-base">
            {categoryFilter !== "all" || labelFilter !== "all" || printStatusFilter !== "all" || searchText.trim()
              ? "No stickers match current filters."
              : "No QR codes yet — generate one using the console above."}
          </h3>
          {(categoryFilter !== "all" || labelFilter !== "all" || printStatusFilter !== "all" || searchText.trim()) && (
            <button
              onClick={() => {
                setCategoryFilter("all");
                setLabelFilter("all");
                setPrintStatusFilter("all");
                setSearchText("");
              }}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-[var(--fx-sidebar-hover)] text-[var(--fx-ink-2)] hover:bg-[var(--fx-border)] transition-colors cursor-pointer"
            >
              <RefreshCw size={12} /> Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ══════════════════════════════════════════════════════════
              VIEW MODE 1: TABLE VIEW
             ══════════════════════════════════════════════════════════ */}
          {viewMode === "table" && (
            <div className="bg-white border border-[var(--fx-border)] rounded-xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[var(--fx-ink)]">
                  <thead className="bg-[var(--fx-surface)] border-b border-[var(--fx-border)] text-[var(--fx-ink-2)] fx-text-body-regular">
                    <tr>
                      <th className="px-4 py-3 w-10">
                        <input
                          type="checkbox"
                          checked={allPageSelected}
                          onChange={toggleSelectAllPage}
                          className="w-4 h-4 rounded-md border-[var(--fx-border-strong)] text-[var(--fx-accent)] focus:ring-[var(--fx-accent)] cursor-pointer"
                        />
                      </th>
                      <th className="px-4 py-3">{revealedCodes ? "Sticker ID" : "Vehicle"}</th>
                      <th className="px-4 py-3">Batch Label</th>
                      <th className="px-4 py-3">Recovery Code</th>
                      <th className="px-4 py-3">Linked Phone</th>
                      <th className="px-4 py-3 hidden md:table-cell">Category</th>
                      <th className="px-4 py-3">Print Status</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--fx-sidebar-hover)] font-medium">
                    {paginated.map((q) => {
                      const catKey = (q.category || "car") as any;
                      const label = getCategoryLabel(catKey);
                      const icon = getCategoryIcon(catKey);
                      const phoneNum = q.ownerPhone || q.phoneNumber || (q as any).phone || (q as any).owner_phone || "";
                      const isActivated = Boolean(phoneNum && phoneNum.trim());
                      const computedStatus = isActivated ? "active" : q.status;
                      const isSelected = selectedIds.has(q.id);
                      const isPrinted = printedStickerIds.has(q.id) || q.isPrinted;

                      return (
                        <tr
                          key={q.id}
                          className={`hover:bg-[var(--fx-canvas)]/70 transition-colors ${
                            isSelected ? "bg-[var(--fx-accent-soft)]/30" : ""
                          }`}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelected(q.id)}
                              className="w-4 h-4 rounded-md border-[var(--fx-border-strong)] text-[var(--fx-accent)] focus:ring-[var(--fx-accent)] cursor-pointer"
                            />
                          </td>
                          {/* Vehicle number by default; the sticker ID only after "See Codes" */}
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => openQuickLook(q)}
                              className="flex items-center gap-2.5 text-left cursor-pointer group"
                              title="Inspect sticker"
                            >
                              <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-[var(--fx-canvas)] border border-[var(--fx-border)] text-[var(--fx-ink-2)] group-hover:border-[var(--fx-accent)] group-hover:text-[var(--fx-accent)] transition-colors shrink-0">
                                <QrCode size={16} />
                              </span>
                              <span className="font-mono font-semibold text-[12px] text-[var(--fx-ink)] truncate max-w-[160px]">
                                {stickerRef(q, revealedCodes, label)}
                              </span>
                            </button>
                          </td>

                          {/* Label Column */}
                          <td className="px-4 py-3">
                            {q.labelName ? (
                              <LabelBadge
                                name={q.labelName}
                                color={q.labelColor}
                                size="xs"
                                onClick={() => handleOpenAssignLabelForSingle(q)}
                              />
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenAssignLabelForSingle(q)}
                                className="text-[11px] text-[var(--fx-faint)] hover:text-[var(--fx-accent)] font-normal hover:font-semibold transition-colors cursor-pointer"
                              >
                                + Label
                              </button>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <span className="font-mono text-[var(--fx-ink-2)]">
                              {revealedCodes ? (recoveryCodeMap[q.id] ?? q.recoveryCode ?? "—") : "••••••••"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {isActivated ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--fx-green-soft)] text-[var(--fx-green)] font-bold text-[11px] border border-[var(--fx-green)]">
                                <Phone size={11} />
                                <span>{phoneNum}</span>
                              </span>
                            ) : (
                              <span className="text-[var(--fx-faint)] font-normal">Unassigned</span>
                            )}
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--fx-sidebar-hover)] text-[var(--fx-ink-2)] font-semibold text-[11px]">
                              <span>{icon}</span>
                              <span>{label}</span>
                            </span>
                          </td>

                          {/* Print Status Sign Column */}
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => handleTogglePrintedStatus(q.id)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all shadow-2xs cursor-pointer select-none ${
                                isPrinted
                                  ? "bg-[var(--fx-green-soft)] text-[var(--fx-green)] border border-[var(--fx-green)] hover:bg-[var(--fx-green-soft)]"
                                  : "bg-[var(--fx-sidebar-hover)] text-[var(--fx-ink-2)] border border-[var(--fx-border)] hover:bg-[var(--fx-border)]"
                              }`}
                              title={isPrinted ? "Click to mark as Unprinted" : "Click to mark as Printed"}
                            >
                              <Printer size={12} className={isPrinted ? "text-[var(--fx-green)]" : "text-[var(--fx-faint)]"} />
                              <span>{isPrinted ? "Printed" : "Not Printed"}</span>
                            </button>
                          </td>

                          <td className="px-4 py-3">
                            <span
                              className={`fx-score-badge fx-text-label-caps ${
                                computedStatus === "active" ? "fx-score-excellent" : "fx-score-fair"
                              }`}
                            >
                              {computedStatus === "active" ? "Active" : "Inactive"}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-right">
                            <QrRowActions
                              qr={q}
                              openQuickLook={openQuickLook}
                              setDeleteTarget={setDeleteTarget}
                              openPrintSheet={(target) => handleTriggerPrintSheet(target, [target])}
                              onAssignLabel={() => handleOpenAssignLabelForSingle(q)}
                              onTogglePrinted={() => handleTogglePrintedStatus(q.id)}
                              isPrinted={isPrinted}
                              menuOpen={openActionMenu === q.id}
                              onMenuToggle={() => setOpenActionMenu((prev) => (prev === q.id ? null : q.id))}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              VIEW MODE 2: STICKER CARDS GRID
             ══════════════════════════════════════════════════════════ */}
          {viewMode === "cards" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {paginated.map((q) => {
                const catKey = (q.category || "car") as any;
                const label = getCategoryLabel(catKey);
                const icon = getCategoryIcon(catKey);
                const phoneNum = q.ownerPhone || q.phoneNumber || (q as any).phone || (q as any).owner_phone || "";
                const isActivated = Boolean(phoneNum && phoneNum.trim());
                const computedStatus = isActivated ? "active" : q.status;
                const isSelected = selectedIds.has(q.id);
                const isPrinted = printedStickerIds.has(q.id) || q.isPrinted;

                return (
                  <div
                    key={q.id}
                    className={`bg-white rounded-xl border transition-all duration-200 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md ${
                      isSelected ? "border-[var(--fx-accent)] ring-2 ring-[var(--fx-accent-soft)]" : "border-[var(--fx-border)]"
                    }`}
                  >
                    {/* Card Header */}
                    <div className="p-3.5 bg-[var(--fx-canvas)]/70 border-b border-[var(--fx-sidebar-hover)] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelected(q.id)}
                          className="w-4 h-4 rounded-md border-[var(--fx-border-strong)] text-[var(--fx-accent)] focus:ring-[var(--fx-accent)] cursor-pointer"
                        />
                        {/* Vehicle number by default; the sticker ID only after "See Codes" */}
                        <button
                          type="button"
                          onClick={() => openQuickLook(q)}
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[var(--fx-ink-2)] hover:text-[var(--fx-accent)] transition-colors cursor-pointer"
                          title="Inspect sticker"
                        >
                          <QrCode size={13} />
                          <span className="font-mono truncate max-w-[140px]">{stickerRef(q, revealedCodes, label)}</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Printed Sign Badge */}
                        <button
                          type="button"
                          onClick={() => handleTogglePrintedStatus(q.id)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold border transition-colors cursor-pointer ${
                            isPrinted
                              ? "bg-[var(--fx-green-soft)] text-[var(--fx-green)] border-[var(--fx-green)] hover:bg-[var(--fx-green-soft)]"
                              : "bg-[var(--fx-sidebar-hover)] text-[var(--fx-ink-2)] border-[var(--fx-border)] hover:bg-[var(--fx-border)]"
                          }`}
                          title={isPrinted ? "Click to unmark as printed" : "Click to mark as printed"}
                        >
                          <Printer size={10} />
                          <span>{isPrinted ? "Printed" : "Unprinted"}</span>
                        </button>

                        <span
                          className={`fx-score-badge fx-text-label-caps ${
                            computedStatus === "active" ? "fx-score-excellent" : "fx-score-fair"
                          }`}
                        >
                          {computedStatus === "active" ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>

                    {/* Sticker Graphic Preview */}
                    <div className="p-4 flex flex-col items-center justify-center bg-[var(--fx-canvas)]/30">
                      <button
                        type="button"
                        onClick={() => openQuickLook(q)}
                        className="w-full max-w-[240px] cursor-pointer hover:scale-[1.03] transition-transform"
                      >
                        <StickerMockupView qr={q} mode="physical" />
                      </button>
                    </div>

                    {/* Card Details & Actions */}
                    <div className="p-3.5 border-t border-[var(--fx-sidebar-hover)] space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="inline-flex items-center gap-1.5 text-[var(--fx-ink-2)] font-semibold">
                          <span>{icon}</span>
                          <span>{label}</span>
                        </span>

                        {/* Label Badge on Card */}
                        {q.labelName ? (
                          <LabelBadge
                            name={q.labelName}
                            color={q.labelColor}
                            size="xs"
                            onClick={() => handleOpenAssignLabelForSingle(q)}
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenAssignLabelForSingle(q)}
                            className="text-[11px] text-[var(--fx-faint)] hover:text-[var(--fx-accent)] font-normal transition-colors cursor-pointer"
                          >
                            + Label
                          </button>
                        )}
                      </div>

                      {isActivated ? (
                        <div className="flex items-center gap-1.5 text-xs text-[var(--fx-green)] bg-[var(--fx-green-soft)] px-2.5 py-1 rounded-lg border border-[var(--fx-green)]">
                          <Phone size={12} />
                          <span className="font-bold">{phoneNum}</span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-[var(--fx-faint)] bg-[var(--fx-canvas)] px-2.5 py-1 rounded-lg">
                          No phone assigned yet
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => openQuickLook(q)}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-[var(--fx-sidebar-hover)] hover:bg-[var(--fx-border)] text-[var(--fx-ink)] text-xs font-bold transition-colors cursor-pointer text-center"
                        >
                          Inspect Sticker
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTriggerPrintSheet(q, [q])}
                          className="p-1.5 rounded-lg border border-[var(--fx-border)] hover:bg-[var(--fx-sidebar-hover)] text-[var(--fx-ink-2)] transition-colors cursor-pointer"
                          title="Print Sticker Sheet"
                        >
                          <Printer size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(q)}
                          className="p-1.5 rounded-lg border border-[var(--fx-red)] text-[var(--fx-red)] hover:bg-[var(--fx-red-soft)] transition-colors cursor-pointer"
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
          )}

          {/* ── Pagination Controls ────────────────────────────────────────── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-4 pt-2">
              <p className="text-xs text-[var(--fx-ink-2)]">
                Showing{" "}
                <span className="font-bold text-[var(--fx-ink)]">
                  {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}
                </span>{" "}
                of <span className="font-bold text-[var(--fx-ink)]">{filtered.length}</span> tags
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg border border-[var(--fx-border-strong)] bg-white text-[var(--fx-ink-2)] hover:bg-[var(--fx-canvas)] disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <ChevronLeft size={14} />
                  <span>Prev</span>
                </button>
                <span className="text-xs font-bold text-[var(--fx-ink-2)] px-2">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg border border-[var(--fx-border-strong)] bg-white text-[var(--fx-ink-2)] hover:bg-[var(--fx-canvas)] disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Modals: Delete Confirmation, Generate Tag, Print Sheet, Labels ─── */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(16, 24, 40, 0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="bg-white rounded-xl border border-[var(--fx-border)] p-6 max-w-sm w-full shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--fx-red-soft)] text-[var(--fx-red)] flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--fx-ink)]">Delete QR Sticker?</h3>
                <p className="text-xs text-[var(--fx-ink-2)] mt-1 leading-relaxed">
                  Tag <span className="font-mono font-bold text-[var(--fx-ink)]">{deleteTarget.id}</span> will be removed from
                  the fleet list. You can restore it later with its recovery code.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs font-bold rounded-lg border border-[var(--fx-border-strong)] bg-white text-[var(--fx-ink-2)] hover:bg-[var(--fx-canvas)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const targetId = deleteTarget.id;
                  setDeleteTarget(null);
                  const deleted = await apiClient.qr
                    .deleteQrCode(targetId)
                    .then((res) => res?.success)
                    .catch(() => false);
                  if (!deleted) {
                    setToast(`Failed to delete ${targetId}. Please try again.`);
                    setTimeout(() => setToast(null), 3000);
                    return;
                  }
                  setQrList((prev) => {
                    const updated = prev.filter((x) => x.id !== targetId);
                    try {
                      localStorage.setItem("repiqr-qrlist", JSON.stringify(updated));
                      localStorage.setItem("namoqr-qrlist", JSON.stringify(updated));
                    } catch {
                      /* ignore */
                    }
                    return updated;
                  });
                  setToast("Sticker deleted from database");
                  setTimeout(() => setToast(null), 2000);
                }}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-[var(--fx-red)] text-white hover:bg-[var(--fx-red)] transition-colors cursor-pointer"
              >
                Delete Sticker
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Tag Generation Modal */}
      <GenerateTagModal
        isOpen={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        qrList={qrList}
        setQrList={setQrList}
        initialCategory={selectedCategory}
        labels={labels}
        setToast={setToast}
        onPrint={(target, batch) => handleTriggerPrintSheet(target, batch)}
      />

      {/* Label Manager Modal */}
      <LabelManagerModal
        isOpen={isLabelManagerOpen}
        onClose={() => setIsLabelManagerOpen(false)}
        labels={labels}
        onSaveLabels={setLabels}
        onSelectLabel={(lbl) => setSelectedLabelId(lbl.id)}
      />

      {/* Assign Label Modal */}
      <AssignLabelModal
        isOpen={isAssignLabelOpen}
        onClose={() => {
          setIsAssignLabelOpen(false);
          setAssignLabelTargetIds([]);
        }}
        selectedCount={assignLabelTargetIds.length > 0 ? assignLabelTargetIds.length : selectedIds.size}
        labels={labels}
        onAssignLabel={handleBulkAssignLabel}
        onOpenCreateLabel={() => setIsLabelManagerOpen(true)}
      />

      {/* Bulk Print By Label Modal */}
      <BulkPrintByLabelModal
        isOpen={isBulkPrintByLabelOpen}
        onClose={() => setIsBulkPrintByLabelOpen(false)}
        labels={labels}
        qrList={qrList}
        printedStickerIds={printedStickerIds}
        onSelectLabelForPrint={handleSelectLabelForPrint}
      />

      {/* Print Sheet Modal */}
      <PrintSheetModal
        isOpen={isLocalPrintModalOpen}
        onClose={() => setIsLocalPrintModalOpen(false)}
        availableStickers={filtered}
        initialSelectedSticker={localPrintTargetSticker}
        initialBatchStickers={localPrintBatch}
        stickerPos={stickerPos}
        printedStickerIdList={activePrintedIdsList}
        setPrintedStickerIdList={activeSetPrintedIds}
        onShowToast={(msg) => {
          setToast(msg);
          setTimeout(() => setToast(null), 4000);
        }}
      />

      <FxModal
        isOpen={printAllOpen}
        onClose={() => setPrintAllOpen(false)}
        title="Print all unassigned stickers?"
        icon={<Printer size={19} />}
        iconTone="accent"
        footer={
          <>
            <button onClick={() => setPrintAllOpen(false)} className="fx-btn fx-btn-secondary flex-1">Cancel</button>
            <button onClick={handlePrintAllUnassigned} className="fx-btn fx-btn-primary flex-1">
              Print {unassignedInactive.length}
            </button>
          </>
        }
      >
        <p>
          {unassignedInactive.length} sticker{unassignedInactive.length === 1 ? "" : "s"} with no linked phone number
          that aren't active will go into a single PDF, one per page, followed by a recovery-code list.
        </p>
        {unassignedAlreadyPrinted > 0 && (
          <p className="mt-2 font-semibold text-[var(--fx-amber)]">
            {unassignedAlreadyPrinted} of them {unassignedAlreadyPrinted === 1 ? "was" : "were"} already printed before.
          </p>
        )}
      </FxModal>

      <PrintProgressModal progress={printProgress} />
    </div>
  );
}
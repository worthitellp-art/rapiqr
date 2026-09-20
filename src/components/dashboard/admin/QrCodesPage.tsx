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
  List,
  Copy,
  Check,
  Phone,
  Sparkles,
  ExternalLink,
  Shield,
  Layers,
  Activity,
} from "lucide-react";
import { QrRecord, Template, StickerPos } from "./types";
import { qrFullUrl, fmtDate, dispatchActivationToUserDashboard, generateSheetBlobs } from "./helpers";
import { apiClient } from "../../../lib/apiClient";
import { STICKER_CATEGORIES, getCategoryLabel, getCategoryIcon } from "../../../stickerModules";
import QrRowActions from "./QrRowActions";
import PrintSheetModal from "./PrintSheetModal";
import GenerateTagModal from "./GenerateTagModal";
import StickerThumb from "./StickerThumb";
import StickerMockupView from "./StickerMockupView";

type ViewMode = "table" | "cards" | "compact";

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
}) {
  const [selectedCategory, setSelectedCategory] = useState("car");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [tab, setTab] = useState<"single" | "bulk">("single");
  const [bulkCount, setBulkCount] = useState(25);
  const [bulkProgress, setBulkProgress] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<QrRecord | null>(null);
  const [clearAllOpen, setClearAllOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revealedCodes, setRevealedCodes] = useState(false);

  const PAGE_SIZE = viewMode === "cards" ? 18 : 25;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [revealedRowIds, setRevealedRowIds] = useState<Set<string>>(new Set());
  const [sheetGenerating, setSheetGenerating] = useState(false);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [searchText, setSearchText] = useState(searchQuery);
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);

  useEffect(() => {
    setSearchText(searchQuery);
  }, [searchQuery]);

  // Metrics computation
  const metrics = useMemo(() => {
    const total = qrList.length;
    let active = 0;
    let totalScans = 0;
    qrList.forEach((q) => {
      const phone = q.ownerPhone || q.phoneNumber || (q as any).phone;
      if (phone && phone.trim()) active += 1;
      else if (q.status === "active") active += 1;
      totalScans += q.scans || 0;
    });
    return {
      total,
      active,
      pending: total - active,
      scans: totalScans,
    };
  }, [qrList]);

  // Filtered fleet list
  const filtered = useMemo(() => {
    let result = qrList.filter((q) => categoryFilter === "all" || (q.category || "car") === categoryFilter);
    if (searchText.trim()) {
      const needle = searchText.toLowerCase().trim();
      result = result.filter(
        (r) =>
          (r.id || "").toLowerCase().includes(needle) ||
          (r.ownerPhone || r.phoneNumber || (r as any).phone || "").toLowerCase().includes(needle) ||
          (r.category || "").toLowerCase().includes(needle) ||
          (r.clientId || "").toLowerCase().includes(needle) ||
          (r.recoveryCode || "").toLowerCase().includes(needle)
      );
    }
    return result;
  }, [qrList, categoryFilter, searchText]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);
  useEffect(() => {
    setPage(1);
  }, [categoryFilter, searchText, viewMode]);

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
  }, [page, categoryFilter, searchText, viewMode]);

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

  async function handlePrintSheet() {
    const selected = filtered.filter((q) => selectedIds.has(q.id));
    if (selected.length === 0) {
      handleTriggerPrintSheet(filtered[0], filtered);
      return;
    }
    if (sheetGenerating) return;
    setSheetGenerating(true);
    try {
      const blobs = await generateSheetBlobs(selected, stickerPos);
      const dateStr = new Date().toISOString().slice(0, 10);
      blobs.forEach((blob, i) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `rapiqr-print-sheet-${dateStr}-${i + 1}-of-${blobs.length}.png`;
        a.click();
        URL.revokeObjectURL(a.href);
      });
      setToast(
        `Generated ${blobs.length} print sheet${blobs.length > 1 ? "s" : ""} for ${selected.length} sticker${
          selected.length > 1 ? "s" : ""
        }`
      );
    } catch (err) {
      console.error("Failed to generate print sheet:", err);
      setToast("Failed to generate print sheet — please try again");
    } finally {
      setSheetGenerating(false);
      setTimeout(() => setToast(null), 4000);
    }
  }

  function recordFromV2Response(data: any, fallbackCategory: string): QrRecord {
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
    };
  }

  async function doGenerateBulk() {
    const count = Math.min(Math.max(1, bulkCount), 200);
    setBulkProgress(0);

    const recoveryRows: [string, string][] = [];
    let failedCount = 0;
    const CHUNK = 20;

    for (let i = 0; i < count; i++) {
      try {
        const res = await apiClient.qr.saveQrCodeV2({ category: selectedCategory });
        if (!res?.success || !res.data) throw new Error(res?.error || "save failed");
        const rec = recordFromV2Response(res.data, selectedCategory);
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
    if (failedCount > 0) {
      setToast(
        `${savedCount} of ${count} QR codes generated — ${failedCount} failed to save. Try again for the rest.`
      );
    } else if (recoveryRows.length > 0) {
      downloadRecoveryCodesCsv(recoveryRows);
      setToast(`${count} QR codes generated — recovery codes downloaded, keep them safe`);
    } else {
      setToast(`${count} QR codes generated & synced`);
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

  function downloadCsv() {
    const rows = [
      ["QR ID", "Recovery Code", "Phone Number", "Category", "Status", "Created"],
      ...qrList.map((q) => {
        const phoneNum = q.ownerPhone || q.phoneNumber || (q as any).phone || (q as any).owner_phone || "";
        const isActivated = Boolean(phoneNum && phoneNum.trim());
        const computedStatus = isActivated ? "active" : q.status;
        return [q.id, q.recoveryCode || "N/A", phoneNum || "N/A", q.category || "car", computedStatus, fmtDate(q.createdAt)];
      }),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "rapiqr-fleet-export.csv";
    a.click();
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-5 pb-16 space-y-6 text-gray-900 font-body bg-[#F8FAFC] min-h-screen">
      {/* ── Page Header & Fleet Metrics Bar ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-display text-gray-900 tracking-tight">QR Code Fleet Management</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {metrics.total} Stickers
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Generate, print, and monitor scannable smart asset stickers across all categories.
          </p>
        </div>

        {/* Fleet Quick Stats */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 flex items-center gap-2.5 shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Active</span>
              <span className="text-xs font-extrabold text-gray-800">{metrics.active}</span>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 flex items-center gap-2.5 shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Pending</span>
              <span className="text-xs font-extrabold text-gray-800">{metrics.pending}</span>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 flex items-center gap-2.5 shadow-xs">
            <Activity size={14} className="text-indigo-600" />
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Scans</span>
              <span className="text-xs font-extrabold text-gray-800">{metrics.scans}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Generator Console Card (Classic Clean Style) ───────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xs p-5 sm:p-6 transition-all">
        <div className="flex flex-wrap items-end gap-4 sm:gap-6">
          {/* Mode Switcher */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Generation Mode</label>
            <div className="inline-flex bg-gray-100 p-1 rounded-xl border border-gray-200">
              <button
                type="button"
                onClick={() => setTab("single")}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  tab === "single" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Single Tag
              </button>
              <button
                type="button"
                onClick={() => setTab("bulk")}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  tab === "bulk" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Bulk Sheet
              </button>
            </div>
          </div>

          {/* Category Dropdown */}
          <div className="flex-1 min-w-[200px] flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Sticker Category</label>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-3 pr-8 py-2 text-xs font-semibold rounded-xl border border-gray-300 bg-white text-gray-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all cursor-pointer"
              >
                {STICKER_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bulk Quantity Input */}
          {tab === "bulk" && (
            <div className="w-[120px] flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Quantity</label>
              <input
                type="number"
                min={1}
                max={200}
                value={bulkCount}
                onChange={(e) => setBulkCount(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-gray-300 bg-white text-gray-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
              />
            </div>
          )}

          {/* Action CTA */}
          <div className="ml-auto sm:ml-0">
            {tab === "single" ? (
              <button
                type="button"
                onClick={() => setGenerateModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                <Plus size={15} strokeWidth={2.4} />
                <span>Generate Tag</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => doGenerateBulk()}
                disabled={bulkProgress !== null}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 active:scale-95 disabled:opacity-50 transition-all shadow-xs cursor-pointer"
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

        {/* Bulk Progress Bar */}
        {bulkProgress !== null && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all duration-200"
                style={{ width: `${bulkProgress}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-gray-500 font-semibold mt-1.5">
              <span>Generating stickers and storing recovery records...</span>
              <span className="font-mono text-indigo-600">{bulkProgress}%</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Toolbar: Search, Filters, View Modes & Bulk Actions ───────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Side: Search & Filter */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative min-w-[220px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search sticker ID, phone..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-300 bg-white text-gray-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 shadow-2xs"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-gray-300 bg-white text-gray-700 outline-none cursor-pointer focus:border-indigo-600 shadow-2xs"
          >
            <option value="all">All Categories ({qrList.length})</option>
            {STICKER_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Right Side: View Mode Switcher + Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle: Table, Cards, Compact */}
          <div className="inline-flex bg-gray-200/80 p-0.5 rounded-xl border border-gray-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "table" ? "bg-white text-indigo-600 shadow-xs" : "text-gray-600 hover:text-gray-900"
              }`}
              title="Table View"
            >
              <TableIcon size={14} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "cards" ? "bg-white text-indigo-600 shadow-xs" : "text-gray-600 hover:text-gray-900"
              }`}
              title="Sticker Cards View (Visual Previews)"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("compact")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "compact" ? "bg-white text-indigo-600 shadow-xs" : "text-gray-600 hover:text-gray-900"
              }`}
              title="Compact List View"
            >
              <List size={14} />
            </button>
          </div>

          <button
            type="button"
            onClick={openRestore}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs cursor-pointer"
            title="Restore a deleted sticker with recovery code"
          >
            <RefreshCw size={12} />
            <span>Restore</span>
          </button>

          <button
            type="button"
            onClick={() => setRevealedCodes((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs cursor-pointer"
            title="Toggle recovery code visibility"
          >
            {revealedCodes ? <EyeOff size={12} /> : <Eye size={12} />}
            <span>{revealedCodes ? "Hide Codes" : "See Codes"}</span>
          </button>

          <button
            type="button"
            onClick={handlePrintSheet}
            disabled={filtered.length === 0 || sheetGenerating}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
            title="Generate 18×12″ print sheet"
          >
            <Printer size={13} />
            <span>Print Sheet{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}</span>
          </button>

          <button
            type="button"
            onClick={downloadCsv}
            disabled={qrList.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs disabled:opacity-40 cursor-pointer"
          >
            <Download size={12} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setClearAllOpen(true)}
            disabled={qrList.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-red-200 text-red-600 bg-red-50/50 hover:bg-red-100 transition-colors shadow-2xs disabled:opacity-40 cursor-pointer"
          >
            <Trash2 size={12} />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {/* ── Empty State ────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-14 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3.5 border border-indigo-100">
            <QrCode size={22} />
          </div>
          <h3 className="font-bold text-gray-900 text-base">
            {categoryFilter !== "all" || searchText.trim() ? "No tags match that filter." : "No QR codes yet"}
          </h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            {categoryFilter !== "all" || searchText.trim()
              ? "Try clearing your search query or selecting another sticker category."
              : "Generate a new sticker using the console above to begin managing your fleet."}
          </p>
          {(categoryFilter !== "all" || searchText.trim()) && (
            <button
              onClick={() => {
                setCategoryFilter("all");
                setSearchText("");
              }}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
            >
              <RefreshCw size={12} /> Clear Filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ══════════════════════════════════════════════════════════
              VIEW MODE 1: TABLE VIEW (High density, clean data)
             ══════════════════════════════════════════════════════════ */}
          {viewMode === "table" && (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-800">
                  <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-4 py-3 w-10">
                        <input
                          type="checkbox"
                          checked={allPageSelected}
                          onChange={toggleSelectAllPage}
                          className="w-4 h-4 rounded-md border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </th>
                      <th className="px-4 py-3 w-16">Sticker</th>
                      <th className="px-4 py-3">Sticker ID</th>
                      <th className="px-4 py-3">Recovery Code</th>
                      <th className="px-4 py-3">Linked Phone</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Created</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {paginated.map((q) => {
                      const catKey = (q.category || "car") as any;
                      const label = getCategoryLabel(catKey);
                      const icon = getCategoryIcon(catKey);
                      const phoneNum = q.ownerPhone || q.phoneNumber || (q as any).phone || (q as any).owner_phone || "";
                      const isActivated = Boolean(phoneNum && phoneNum.trim());
                      const computedStatus = isActivated ? "active" : q.status;
                      const isSelected = selectedIds.has(q.id);

                      return (
                        <tr
                          key={q.id}
                          className={`hover:bg-gray-50/70 transition-colors ${
                            isSelected ? "bg-indigo-50/30" : ""
                          }`}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelected(q.id)}
                              className="w-4 h-4 rounded-md border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => openQuickLook(q)}
                              className="block hover:scale-105 transition-transform cursor-pointer"
                              title="Click to inspect sticker"
                            >
                              <StickerThumb qr={q} size={36} />
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-gray-900">{q.id}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyId(q.id)}
                                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                title="Copy ID"
                              >
                                {copiedId === q.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-gray-600">
                              {revealedCodes ? q.recoveryCode || "—" : "••••••••"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {isActivated ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200">
                                <Phone size={11} />
                                <span>{phoneNum}</span>
                              </span>
                            ) : (
                              <span className="text-gray-400 font-normal">Unassigned</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 font-semibold text-[11px]">
                              <span>{icon}</span>
                              <span>{label}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500">{fmtDate(q.createdAt)}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-extrabold uppercase tracking-wide ${
                                computedStatus === "active"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  computedStatus === "active" ? "bg-emerald-500" : "bg-amber-500"
                                }`}
                              />
                              <span>{computedStatus === "active" ? "Active" : "Inactive"}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <QrRowActions
                              qr={q}
                              openQuickLook={openQuickLook}
                              setDeleteTarget={setDeleteTarget}
                              openPrintSheet={(target) => handleTriggerPrintSheet(target, [target])}
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
              VIEW MODE 2: STICKER CARDS GRID (Visual sticker showcase)
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

                return (
                  <div
                    key={q.id}
                    className={`bg-white rounded-2xl border transition-all duration-200 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md ${
                      isSelected ? "border-indigo-500 ring-2 ring-indigo-100" : "border-gray-200"
                    }`}
                  >
                    {/* Card Header */}
                    <div className="p-3.5 bg-gray-50/60 border-b border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelected(q.id)}
                          className="w-4 h-4 rounded-md border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span className="font-mono font-bold text-xs text-gray-900">{q.id}</span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                          computedStatus === "active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            computedStatus === "active" ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                        />
                        <span>{computedStatus === "active" ? "Active" : "Inactive"}</span>
                      </span>
                    </div>

                    {/* Sticker Graphic Preview */}
                    <div className="p-4 flex flex-col items-center justify-center bg-gray-50/30">
                      <button
                        type="button"
                        onClick={() => openQuickLook(q)}
                        className="w-full max-w-[240px] cursor-pointer hover:scale-[1.03] transition-transform"
                      >
                        <StickerMockupView qr={q} mode="physical" />
                      </button>
                    </div>

                    {/* Card Details & Actions */}
                    <div className="p-3.5 border-t border-gray-100 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="inline-flex items-center gap-1.5 text-gray-700 font-semibold">
                          <span>{icon}</span>
                          <span>{label}</span>
                        </span>
                        <span className="text-[11px] text-gray-400">{fmtDate(q.createdAt)}</span>
                      </div>

                      {isActivated ? (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                          <Phone size={12} />
                          <span className="font-bold">{phoneNum}</span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg">
                          No phone assigned yet
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => openQuickLook(q)}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-colors cursor-pointer text-center"
                        >
                          Inspect Sticker
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTriggerPrintSheet(q, [q])}
                          className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
                          title="Print Sticker Sheet"
                        >
                          <Printer size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(q)}
                          className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
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

          {/* ══════════════════════════════════════════════════════════
              VIEW MODE 3: COMPACT LIST VIEW (Quick scanning)
             ══════════════════════════════════════════════════════════ */}
          {viewMode === "compact" && (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-xs divide-y divide-gray-100 overflow-hidden">
              {paginated.map((q) => {
                const catKey = (q.category || "car") as any;
                const label = getCategoryLabel(catKey);
                const phoneNum = q.ownerPhone || q.phoneNumber || (q as any).phone || (q as any).owner_phone || "";
                const isActivated = Boolean(phoneNum && phoneNum.trim());
                const computedStatus = isActivated ? "active" : q.status;

                return (
                  <div
                    key={q.id}
                    className="flex items-center gap-3 p-3.5 hover:bg-gray-50/70 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(q.id)}
                      onChange={() => toggleSelected(q.id)}
                      className="w-4 h-4 rounded-md border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => openQuickLook(q)}
                      className="cursor-pointer hover:opacity-80"
                    >
                      <StickerThumb qr={q} size={30} />
                    </button>
                    <div className="flex-1 min-w-0 flex items-center gap-4">
                      <span className="font-mono font-bold text-xs text-gray-900">{q.id}</span>
                      <span className="text-xs text-gray-600 font-semibold">{label}</span>
                      <span className="text-xs text-gray-500 truncate">{isActivated ? phoneNum : "—"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          computedStatus === "active"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {computedStatus}
                      </span>
                      <QrRowActions
                        qr={q}
                        openQuickLook={openQuickLook}
                        setDeleteTarget={setDeleteTarget}
                        openPrintSheet={(target) => handleTriggerPrintSheet(target, [target])}
                        menuOpen={openActionMenu === q.id}
                        onMenuToggle={() => setOpenActionMenu((prev) => (prev === q.id ? null : q.id))}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Pagination Controls ────────────────────────────────────────── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-4 pt-2">
              <p className="text-xs text-gray-500">
                Showing{" "}
                <span className="font-bold text-gray-800">
                  {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}
                </span>{" "}
                of <span className="font-bold text-gray-800">{filtered.length}</span> tags
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <ChevronLeft size={14} />
                  <span>Prev</span>
                </button>
                <span className="text-xs font-bold text-gray-600 px-2">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Modals: Delete Confirmation, Clear All, Generate Tag, Print Sheet ─── */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(16, 24, 40, 0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="bg-white rounded-2xl border border-gray-200 p-6 max-w-sm w-full shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Delete QR Sticker?</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Tag <span className="font-mono font-bold text-gray-800">{deleteTarget.id}</span> will be removed from
                  the fleet list. You can restore it later with its recovery code.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
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
                className="px-4 py-2 text-xs font-bold rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer"
              >
                Delete Sticker
              </button>
            </div>
          </div>
        </div>
      )}

      {clearAllOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(16, 24, 40, 0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => setClearAllOpen(false)}
        >
          <div
            className="bg-white rounded-2xl border border-gray-200 p-6 max-w-md w-full shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Clear All {qrList.length} Stickers?</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Are you sure you want to permanently delete all {qrList.length} QR codes? This action cannot be
                  undone.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setClearAllOpen(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setClearAllOpen(false);
                  const deleted = await apiClient.qr
                    .deleteAllQrCodes()
                    .then((res) => res?.success)
                    .catch(() => false);
                  if (!deleted) {
                    setToast("Failed to clear QR codes. Please try again.");
                    setTimeout(() => setToast(null), 3000);
                    return;
                  }
                  setQrList([]);
                  try {
                    localStorage.removeItem("repiqr-qrlist");
                    localStorage.removeItem("namoqr-qrlist");
                  } catch {
                    /* ignore */
                  }
                  setToast("All QR codes cleared from database");
                  setTimeout(() => setToast(null), 2000);
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      <GenerateTagModal
        isOpen={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        qrList={qrList}
        setQrList={setQrList}
        initialCategory={selectedCategory}
        setToast={setToast}
        onPrint={(target, batch) => handleTriggerPrintSheet(target, batch)}
      />

      <PrintSheetModal
        isOpen={isLocalPrintModalOpen}
        onClose={() => setIsLocalPrintModalOpen(false)}
        availableStickers={filtered}
        initialSelectedSticker={localPrintTargetSticker}
        initialBatchStickers={localPrintBatch}
        stickerPos={stickerPos}
        onShowToast={(msg) => {
          setToast(msg);
          setTimeout(() => setToast(null), 4000);
        }}
      />
    </div>
  );
}
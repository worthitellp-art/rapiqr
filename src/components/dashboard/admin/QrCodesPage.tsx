import type React from "react";
import { useState, useEffect, useMemo } from "react";
import { Plus, Sparkles, Download, Trash2, RefreshCw, Tag, Phone, ChevronLeft, ChevronRight, Printer, Eye, EyeOff, Search, Copy, Check, ExternalLink, Trash } from "lucide-react";
import StatusPill from "./StatusPill";
import StickerThumb from "./StickerThumb";
import { QrRecord, Template, StickerPos } from "./types";
import { uid, generateStickerId, generateClientRecoveryCode, qrFullUrl, fmtDate, dispatchActivationToUserDashboard, generateSheetBlobs } from "./helpers";
import { apiClient } from "../../../lib/apiClient";
import { STICKER_CATEGORIES, getCategoryIcon, getCategoryLabel } from "../../../stickerModules";
import ConfirmModal from "./ConfirmModal";
import RecoveryCodeModal from "./RecoveryCodeModal";
import QrRowActions from "./QrRowActions";
import PrintSheetModal from "./PrintSheetModal";
import { MaskedCodeDisplay, CodeVisibilityToggleButton } from "./StickerCodeComponents";

function normalizePhoneForDupCheck(phone: string): string | null {
  const digits = String(phone ?? "").replace(/\D/g, "");
  if (digits.length < 10) return null;
  return digits.slice(-10);
}

export default function QrCodesPage({
  qrList, setQrList, templates, setToast, openQuickLook, openRestore, stickerPos, openPrintSheet, searchQuery,
}: {
  qrList: QrRecord[]; setQrList: React.Dispatch<React.SetStateAction<QrRecord[]>>;
  templates: Template[]; setToast: (msg: string | null) => void;
  openQuickLook: (q: QrRecord) => void; openRestore: () => void;
  stickerPos: StickerPos;
  openPrintSheet?: (targetSticker?: QrRecord, selectedBatchStickers?: QrRecord[]) => void;
  searchQuery: string;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>("car");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [tab, setTab] = useState("single");
  const [bulkCount, setBulkCount] = useState(25);
  const [bulkProgress, setBulkProgress] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<QrRecord | null>(null);
  const [clearAllOpen, setClearAllOpen] = useState(false);
  const [recoveryModal, setRecoveryModal] = useState<{ stickerId: string; recoveryCode: string } | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [revealedRowIds, setRevealedRowIds] = useState<Set<string>>(new Set());
  const [sheetGenerating, setSheetGenerating] = useState(false);
  const [showConfirmDupe, setShowConfirmDupe] = useState<{ category: string; phone: string } | null>(null);
  const [pendingGenerateArgs, setPendingGenerateArgs] = useState<{ category: string; count: number } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchText, setSearchText] = useState(searchQuery);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => { setSearchText(searchQuery); }, [searchQuery]);

  const filtered = useMemo(() => {
    let result = qrList.filter((q) => {
      const matchesCategory = categoryFilter === "all" || (q.category || "car") === categoryFilter;
      return matchesCategory;
    });
    if (searchText.trim()) {
      const q = searchText.toLowerCase().trim();
      result = result.filter((r) =>
        (r.id || "").toLowerCase().includes(q) ||
        (r.ownerPhone || r.phoneNumber || r.phone || "").toLowerCase().includes(q) ||
        (r.category || "").toLowerCase().includes(q) ||
        (r.clientId || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [qrList, categoryFilter, searchText]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);
  useEffect(() => { setPage(1); }, [categoryFilter]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setSelectedIds((prev) => {
      const validIds = new Set(qrList.map((q) => q.id));
      const next = new Set([...prev].filter((id) => validIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [qrList]);

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const allFilteredSelected = filtered.length > 0 && filtered.every((q) => selectedIds.has(q.id));
  function toggleSelectAllFiltered() {
    setSelectedIds((prev) => {
      if (allFilteredSelected) {
        const next = new Set(prev);
        filtered.forEach((q) => next.delete(q.id));
        return next;
      }
      const next = new Set(prev);
      filtered.forEach((q) => next.add(q.id));
      return next;
    });
  }

  function toggleRowCodeVisibility(targetId: string) {
    setRevealedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(targetId)) next.delete(targetId);
      else next.add(targetId);
      return next;
    });
  }

  const areAllFilteredCodesRevealed = filtered.length > 0 && filtered.every((q) => revealedRowIds.has(q.id));

  function toggleAllFilteredCodesVisibility() {
    setRevealedRowIds((prev) => {
      if (areAllFilteredCodesRevealed) {
        const next = new Set(prev);
        filtered.forEach((q) => next.delete(q.id));
        return next;
      }
      const next = new Set(prev);
      filtered.forEach((q) => next.add(q.id));
      return next;
    });
  }

  const [isLocalPrintModalOpen, setIsLocalPrintModalOpen] = useState(false);
  const [localPrintTargetSticker, setLocalPrintTargetSticker] = useState<QrRecord | null>(null);

  function handleTriggerPrintSheet(targetSticker?: QrRecord, selectedBatchStickers?: QrRecord[]) {
    if (openPrintSheet) { openPrintSheet(targetSticker, selectedBatchStickers); return; }
    setLocalPrintTargetSticker(targetSticker || null);
    setIsLocalPrintModalOpen(true);
  }

  async function handlePrintSheet() {
    const selected = filtered.filter((q) => selectedIds.has(q.id));
    if (selected.length === 0) { handleTriggerPrintSheet(filtered[0]); return; }
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
      setToast(`Generated ${blobs.length} print sheet${blobs.length > 1 ? "s" : ""} for ${selected.length} sticker${selected.length > 1 ? "s" : ""}`);
    } catch (err) {
      console.error("Failed to generate print sheet:", err);
      setToast("Failed to generate print sheet — please try again");
    } finally {
      setSheetGenerating(false);
      setTimeout(() => setToast(null), 4000);
    }
  }

  function buildQrRecord(targetCategory: string): QrRecord {
    const codeId = generateStickerId();
    const recoveryCode = generateClientRecoveryCode();
    return {
      id: codeId, clientId: uid("CL"), qrUrl: "", createdAt: new Date().toISOString(),
      scans: 0, status: "inactive", template: "Standard Tag", category: targetCategory,
      fg: "000000", bg: "FFFFFF", recoveryCode,
    };
  }

  function checkDuplicateForCategory(category: string, phone: string): boolean {
    if (!phone || phone.trim().length < 10) return false;
    const normPhone = normalizePhoneForDupCheck(phone);
    if (!normPhone) return false;
    return qrList.some(
      (q) => (q.category || "car") === category && normalizePhoneForDupCheck(q.ownerPhone || q.phoneNumber || q.phone || q.owner_phone || "") === normPhone
    );
  }

  async function handleGenerateSingle() {
    const phoneCheck = checkDuplicateForCategory(selectedCategory, "");
    const rec = buildQrRecord(selectedCategory);
    rec.qrUrl = qrFullUrl(rec.id);
    setQrList((prev) => [rec, ...prev]);
    try {
      const res = await apiClient.qr.saveQrCode({
        id: rec.id, clientId: rec.clientId, status: rec.status, templateName: rec.template,
        category: rec.category, fgColor: rec.fg, bgColor: rec.bg, recoveryCode: rec.recoveryCode,
      });
      const resolvedCode = res?.data?.recoveryCode || rec.recoveryCode;
      if (resolvedCode) { rec.recoveryCode = resolvedCode; setRecoveryModal({ stickerId: rec.id, recoveryCode: resolvedCode }); }
    } catch (err) { console.warn(`Failed to save QR ${rec.id} to backend:`, err); }
    setToast(`Generated 1 ${rec.category || "Car"} Tag`);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleGenerateBulkWithDupCheck() {
    const phone = "";
    const hasDup = checkDuplicateForCategory(selectedCategory, phone);
    if (hasDup) {
      const normPhone = normalizePhoneForDupCheck(phone);
      setShowConfirmDupe({ category: selectedCategory, phone: normPhone || "" });
      setPendingGenerateArgs({ category: selectedCategory, count: Math.min(Math.max(1, bulkCount), 200) });
      return;
    }
    await doGenerateBulk();
  }

  async function doGenerateBulk() {
    const count = Math.min(Math.max(1, bulkCount), 200);
    setIsGenerating(true);
    setBulkProgress(0);

    const batch: QrRecord[] = [];
    for (let i = 0; i < count; i++) {
      const rec = buildQrRecord(selectedCategory);
      rec.qrUrl = qrFullUrl(rec.id);
      batch.push(rec);
    }
    setQrList((prev) => [...batch, ...prev]);

    const recoveryRows: [string, string][] = [];
    const CHUNK = 50;
    for (let i = 0; i < batch.length; i += CHUNK) {
      const slice = batch.slice(i, i + CHUNK);
      for (const qr of slice) {
        try {
          const res = await apiClient.qr.saveQrCode({ ...qr, recoveryCode: qr.recoveryCode });
          const resolvedCode = res?.data?.recoveryCode || qr.recoveryCode;
          if (resolvedCode) { qr.recoveryCode = resolvedCode; recoveryRows.push([qr.id, resolvedCode]); }
        } catch (err) { console.warn(`Failed to save QR ${qr.id} to backend:`, err); }
      }
      setBulkProgress(Math.min(100, Math.round(((i + CHUNK) / batch.length) * 100)));
    }

    batch.forEach((item) => dispatchActivationToUserDashboard(item));
    setBulkProgress(null);
    setIsGenerating(false);

    if (recoveryRows.length > 0) {
      downloadRecoveryCodesCsv(recoveryRows);
      setToast(`${count} QR codes generated — recovery codes downloaded, keep them safe`);
    } else {
      setToast(`${count} QR codes generated & synced`);
    }
    setTimeout(() => setToast(null), 5000);
  }

  async function handleConfirmGenerateBulk() {
    setShowConfirmDupe(null);
    await doGenerateBulk();
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
    a.download = "tagyard-fleet-export.csv";
    a.click();
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-5 pb-12 space-y-5 text-[#18181B] font-body" style={{ background: "#F8F8F7" }}>
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#18181B] leading-tight tracking-[-0.5px]">
            Tag generator
          </h1>
          <p className="text-xs text-[#71717A] mt-0.5">
            Stamp a new tag for a single asset, or run a full sheet
          </p>
        </div>
        <button
          onClick={handleGenerateSingle}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#F5C518] text-[#18181B] font-semibold text-sm hover:bg-[#EAB308] active:scale-95 transition-all cursor-pointer"
        >
          <Plus size={16} strokeWidth={2.4} /> Generate tag
        </button>
      </div>

      {/* ── Generator Toolbar ────────────────────────────────── */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 flex flex-wrap items-end gap-4">
        {/* Mode Tabs */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-[1px] text-[#71717A]">Mode</label>
          <div className="flex bg-[#F8F8F7] border border-[#E5E7EB] rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setTab("single")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                tab === "single" ? "bg-white text-[#18181B] shadow-sm" : "text-[#71717A] hover:text-[#18181B]"
              }`}
            >Single</button>
            <button
              type="button"
              onClick={() => setTab("bulk")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                tab === "bulk" ? "bg-white text-[#18181B] shadow-sm" : "text-[#71717A] hover:text-[#18181B]"
              }`}
            >Bulk</button>
          </div>
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1 min-w-[160px]">
          <label className="text-[10px] font-semibold uppercase tracking-[1px] text-[#71717A]">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#18181B] outline-none cursor-pointer focus:border-[#F5C518] focus:ring-2 focus:ring-[#F5C518]/30 transition-all"
          >
            {STICKER_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        {/* Quantity (bulk only) */}
        {tab === "bulk" && (
          <div className="flex flex-col gap-1 w-24">
            <label className="text-[10px] font-semibold uppercase tracking-[1px] text-[#71717A]">Count</label>
            <input
              type="number" min={1} max={200} value={bulkCount}
              onChange={(e) => setBulkCount(parseInt(e.target.value) || 1)}
              className="bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#18181B] outline-none focus:border-[#F5C518] focus:ring-2 focus:ring-[#F5C518]/30 transition-all"
            />
          </div>
        )}

        {/* Generate Button */}
        <div className="ml-auto">
          {tab === "single" ? (
            <button
              onClick={handleGenerateSingle}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#F5C518] text-[#18181B] font-semibold text-sm hover:bg-[#EAB308] active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Plus size={16} strokeWidth={2.4} /> Generate
            </button>
          ) : (
            <button
              onClick={handleGenerateBulkWithDupCheck}
              disabled={isGenerating || bulkProgress !== null}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#F5C518] text-[#18181B] font-semibold text-sm hover:bg-[#EAB308] active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Sparkles size={16} strokeWidth={2.4} /> Generate {bulkCount}
            </button>
          )}
        </div>
      </div>

      {/* Bulk Progress */}
      {bulkProgress !== null && (
        <div className="mt-3 pt-3 border-t border-[#E5E7EB] flex items-center gap-3">
          <div className="flex-1 bg-[#F4F4F5] rounded-lg h-1.5 overflow-hidden border border-[#E5E7EB]">
            <div className="h-full bg-[#F5C518] transition-all duration-200 rounded" style={{ width: `${bulkProgress}%` }} />
          </div>
          <span className="text-[11px] text-[#71717A] font-bold whitespace-nowrap">{bulkProgress}% synced</span>
        </div>
      )}

      {/* ── Toolbar ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-sm font-semibold text-[#18181B]">All tags</h2>
          <span className="text-xs text-[#71717A]">· {filtered.length}</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            {showSearch ? (
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onBlur={() => setShowSearch(false)}
                autoFocus
                placeholder="Search ID, phone..."
                className="bg-white border border-[#F5C518] rounded-lg px-3 py-1.5 text-xs text-[#18181B] outline-none w-44 focus:ring-2 focus:ring-[#F5C518]/30 transition-all"
              />
            ) : (
              <button
                onClick={() => setShowSearch(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] bg-white text-[#71717A] hover:text-[#18181B] hover:border-[#D4D4D8] transition-all cursor-pointer"
                title="Search"
              >
                <Search size={13} />
              </button>
            )}
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 text-xs text-[#18181B] outline-none cursor-pointer focus:border-[#F5C518]"
          >
            <option value="all">All categories</option>
            {STICKER_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>

          <button
            onClick={openRestore}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] bg-white text-[#71717A] hover:text-[#18181B] hover:bg-[#F8F8F7] transition-all text-xs cursor-pointer"
          >
            <RefreshCw size={12} /> Restore
          </button>

          <button
            onClick={() => { setShowSearch(false); setSearchText(""); }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] bg-white text-[#71717A] hover:text-[#18181B] hover:bg-[#F8F8F7] transition-all text-xs cursor-pointer"
            title="See all codes"
          >
            {areAllFilteredCodesRevealed ? <EyeOff size={13} className="text-[#A16207]" /> : <Eye size={13} className="text-[#EAB308]" />}
          </button>

          <button
            onClick={() => {
              const selectedStickers = filtered.filter((q) => selectedIds.has(q.id));
              if (selectedStickers.length > 0) handleTriggerPrintSheet(undefined, selectedStickers);
              else handleTriggerPrintSheet(undefined, filtered);
            }}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] bg-white text-[#71717A] hover:text-[#18181B] hover:bg-[#F8F8F7] transition-all disabled:opacity-40 text-xs cursor-pointer"
            title="Print sheet"
          >
            <Printer size={13} /> Print
          </button>

          <button
            onClick={downloadCsv}
            disabled={qrList.length === 0}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] bg-white text-[#71717A] hover:text-[#18181B] hover:bg-[#F8F8F7] transition-all disabled:opacity-40 text-xs cursor-pointer"
          >
            <Download size={12} /> Export
          </button>

          <button
            onClick={() => setClearAllOpen(true)}
            disabled={qrList.length === 0}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#EF4444]/15 text-[#EF4444] hover:bg-[#FEF2F2] transition-all disabled:opacity-40 text-xs cursor-pointer"
          >
            <Trash size={12} /> Clear
          </button>
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-[#E5E7EB] p-10 text-center space-y-2">
          <div className="w-10 h-10 rounded-lg bg-[#FDF4DB] text-[#A16207] flex items-center justify-center mx-auto mb-3">
            <Tag size={20} />
          </div>
          <p className="text-sm text-[#18181B] font-semibold">
            {categoryFilter !== "all" ? "No tags match that filter." : "No tags yet — generate one above."}
          </p>
          {searchText && (
            <button onClick={() => { setSearchText(""); setShowSearch(false); }} className="text-xs text-[#F5C518] hover:underline mt-1 cursor-pointer">Clear search</button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-[#18181B]">
              <thead>
                <tr className="text-left font-display text-[11px] font-semibold text-[#71717A] tracking-normal bg-[#FAFAFA] border-b border-[#E5E7EB]">
                  <th className="px-3 py-2.5 w-8">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={toggleSelectAllFiltered}
                      className="w-3.5 h-3.5 rounded border-[#D0D5DD] text-[#EAB308] cursor-pointer"
                    />
                  </th>
                  <th className="px-3 py-2.5">QR</th>
                  <th className="px-3 py-2.5">ID</th>
                  <th className="px-3 py-2.5">Recovery</th>
                  <th className="px-2 py-2.5 w-8"></th>
                  <th className="px-3 py-2.5">Phone</th>
                  <th className="px-3 py-2.5">Category</th>
                  <th className="px-3 py-2.5">Created</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5 text-right w-16">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {paginated.map((q) => {
                  const catKey = (q.category || "car") as any;
                  const icon = getCategoryIcon(catKey);
                  const label = getCategoryLabel(catKey);
                  const phoneNum = q.ownerPhone || q.phoneNumber || (q as any).phone || (q as any).owner_phone || "";
                  const isActivated = Boolean(phoneNum && phoneNum.trim());
                  const computedStatus = isActivated ? "active" : q.status;
                  const isCodeRevealed = revealedRowIds.has(q.id);

                  return (
                    <tr key={q.id} className={`hover:bg-[#F8F8F7] transition-colors ${selectedIds.has(q.id) ? "bg-[#F5F5FF]" : ""}`}>
                      <td className="px-3 py-2.5">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(q.id)}
                          onChange={() => toggleSelected(q.id)}
                          className="w-3.5 h-3.5 rounded border-[#D0D5DD] text-[#EAB308] cursor-pointer"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <button
                          type="button"
                          onClick={() => openQuickLook(q)}
                          className="hover:opacity-80 transition-opacity cursor-pointer flex items-center"
                          title="Preview"
                        >
                          <StickerThumb qr={q} size={28} />
                        </button>
                      </td>
                      <td className="px-3 py-2.5">
                        <MaskedCodeDisplay codeValue={q.id} isRevealed={isCodeRevealed} maskedLength={8} />
                      </td>
                      <td className="px-3 py-2.5">
                        <MaskedCodeDisplay codeValue={q.recoveryCode || ""} isRevealed={isCodeRevealed} maskedLength={6} highlightAccent fallbackText="—" />
                      </td>
                      <td className="px-2 py-2.5">
                        <CodeVisibilityToggleButton isRevealed={isCodeRevealed} onToggleVisibility={() => toggleRowCodeVisibility(q.id)} />
                      </td>
                      <td className="px-3 py-2.5">
                        {isActivated ? (
                          <span className="inline-flex items-center gap-1 text-xs text-[#16A34A] font-medium">
                            <Phone size={11} />
                            <span className="truncate max-w-[100px]">{phoneNum}</span>
                          </span>
                        ) : (
                          <span className="text-[#A1A1AA] text-xs">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F8F8F7] text-[#71717A] text-[11px] font-medium">
                          <span>{icon}</span>
                          <span>{label}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-[11px] text-[#71717A] whitespace-nowrap">{fmtDate(q.createdAt)}</td>
                      <td className="px-3 py-2.5"><StatusPill status={computedStatus} /></td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          <button
                            onClick={() => openQuickLook(q)}
                            className="w-7 h-7 rounded-md flex items-center justify-center text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5] transition-all cursor-pointer"
                            title="View"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(qrFullUrl(q.id)).catch(() => {}); }}
                            className="w-7 h-7 rounded-md flex items-center justify-center text-[#71717A] hover:text-[#16A34A] hover:bg-[#F0FDF4] transition-all cursor-pointer"
                            title="Copy link"
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            onClick={() => window.open(qrFullUrl(q.id), "_blank")}
                            className="w-7 h-7 rounded-md flex items-center justify-center text-[#71717A] hover:text-[#2563EB] hover:bg-[#EFF6FF] transition-all cursor-pointer"
                            title="Open link"
                          >
                            <ExternalLink size={14} />
                          </button>
                          <button
                            onClick={() => handleTriggerPrintSheet(q, [q])}
                            className="w-7 h-7 rounded-md flex items-center justify-center text-[#71717A] hover:text-[#A16207] hover:bg-[#FDF4DB] transition-all cursor-pointer"
                            title="Print sheet"
                          >
                            <Printer size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(q)}
                            className="w-7 h-7 rounded-md flex items-center justify-center text-[#71717A] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-all cursor-pointer"
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-4 px-4 py-2.5 border-t border-[#E5E7EB] bg-[#FAFAFA]">
              <p className="text-[11px] text-[#71717A]">
                Showing <span className="font-semibold text-[#18181B]">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}</span> of{" "}
                <span className="font-semibold text-[#18181B]">{filtered.length}</span>
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md border border-[#E5E7EB] bg-white text-[#71717A] hover:text-[#18181B] hover:border-[#D4D4D8] disabled:opacity-40 cursor-pointer transition-all"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-[11px] text-[#71717A] font-semibold px-1.5">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md border border-[#E5E7EB] bg-white text-[#71717A] hover:text-[#18181B] hover:border-[#D4D4D8] disabled:opacity-40 cursor-pointer transition-all"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete confirmations */}
      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="Delete QR Sticker?"
        message={
          <>Are you sure you want to delete <span className="font-bold text-[#18181B]">{deleteTarget?.id}</span>? It will disappear from the fleet list, but can be brought back later via Restore Sticker using its printed recovery code.</>
        }
        onConfirm={async () => {
          if (deleteTarget) {
            const targetId = deleteTarget.id;
            setDeleteTarget(null);
            const deleted = await apiClient.qr.deleteQrCode(targetId).then((res) => res?.success).catch(() => false);
            if (!deleted) {
              setToast(`Failed to delete ${targetId} — it still exists in the database. Please try again.`);
              setTimeout(() => setToast(null), 3000);
              return;
            }
            setQrList((prev) => {
              const updated = prev.filter((x) => x.id !== targetId);
              try { localStorage.setItem("repiqr-qrlist", JSON.stringify(updated)); localStorage.setItem("namoqr-qrlist", JSON.stringify(updated)); } catch { /* ignore */ }
              return updated;
            });
            setToast("QR deleted from database");
            setTimeout(() => setToast(null), 1500);
          }
        }}
        onClose={() => setDeleteTarget(null)}
      />
      <ConfirmModal
        isOpen={clearAllOpen}
        title="Clear all QR stickers?"
        message={<>Are you sure you want to delete all <span className="font-bold text-[#18181B]">{qrList.length}</span> QR codes? This cannot be undone.</>}
        confirmLabel="Clear All"
        onConfirm={async () => {
          setClearAllOpen(false);
          const deleted = await apiClient.qr.deleteAllQrCodes().then((res) => res?.success).catch(() => false);
          if (!deleted) { setToast("Failed to clear QR codes from the database. Please try again."); setTimeout(() => setToast(null), 3000); return; }
          setQrList([]);
          try { localStorage.removeItem("repiqr-qrlist"); localStorage.removeItem("namoqr-qrlist"); } catch { /* ignore */ }
          setToast("All QR codes cleared from database");
          setTimeout(() => setToast(null), 1500);
        }}
        onClose={() => setClearAllOpen(false)}
      />
      <RecoveryCodeModal
        isOpen={recoveryModal !== null}
        stickerId={recoveryModal?.stickerId || ""}
        recoveryCode={recoveryModal?.recoveryCode || ""}
        onClose={() => setRecoveryModal(null)}
      />
      <PrintSheetModal
        isOpen={isLocalPrintModalOpen}
        onClose={() => { setIsLocalPrintModalOpen(false); setLocalPrintTargetSticker(null); }}
        availableStickers={filtered}
        initialSelectedSticker={localPrintTargetSticker}
        initialBatchStickers={selectedIds.size > 0 ? filtered.filter((q) => selectedIds.has(q.id)) : undefined}
        stickerPos={stickerPos}
        onShowToast={(msg) => { setToast(msg); setTimeout(() => setToast(null), 4000); }}
      />

      {/* Duplicate phone confirmation modal */}
      <ConfirmModal
        isOpen={showConfirmDupe !== null}
        title="Duplicate phone number detected"
        message={
          <>
            A tag in the <span className="font-bold text-[#18181B]">{showConfirmDupe?.category}</span> category
            already has the phone number <span className="font-mono text-[#EAB308]">{showConfirmDupe?.phone}</span>.
            <br />
            Per policy, the same phone number cannot be used twice in the same category. Continue anyway?
          </>
        }
        confirmLabel="Continue anyway"
        onConfirm={handleConfirmGenerateBulk}
        onClose={() => { setShowConfirmDupe(null); setPendingGenerateArgs(null); }}
      />
    </div>
  );
}

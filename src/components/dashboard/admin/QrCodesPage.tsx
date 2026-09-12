import type React from "react";
import { useState, useEffect, useMemo } from "react";
import { Plus, Download, Trash2, RefreshCw, ChevronLeft, ChevronRight, Printer, Eye, EyeOff, Search, QrCode, Loader2, AlertTriangle } from "lucide-react";
import { QrRecord, Template, StickerPos } from "./types";
import { qrFullUrl, fmtDate, dispatchActivationToUserDashboard, generateSheetBlobs } from "./helpers";
import { apiClient } from "../../../lib/apiClient";
import { STICKER_CATEGORIES, getCategoryLabel } from "../../../stickerModules";
import QrRowActions from "./QrRowActions";
import PrintSheetModal from "./PrintSheetModal";
import GenerateTagModal from "./GenerateTagModal";
import QrCodeImage from "./QrCodeImage";

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
  const [selectedCategory, setSelectedCategory] = useState("car");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [tab, setTab] = useState<"single" | "bulk">("single");
  const [bulkCount, setBulkCount] = useState(25);
  const [bulkProgress, setBulkProgress] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<QrRecord | null>(null);
  const [clearAllOpen, setClearAllOpen] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [revealedRowIds, setRevealedRowIds] = useState<Set<string>>(new Set());
  const [sheetGenerating, setSheetGenerating] = useState(false);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [searchText, setSearchText] = useState(searchQuery);
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);

  useEffect(() => { setSearchText(searchQuery); }, [searchQuery]);

  const filtered = useMemo(() => {
    let result = qrList.filter((q) => categoryFilter === "all" || (q.category || "car") === categoryFilter);
    if (searchText.trim()) {
      const needle = searchText.toLowerCase().trim();
      result = result.filter((r) =>
        (r.id || "").toLowerCase().includes(needle) ||
        (r.ownerPhone || r.phoneNumber || (r as any).phone || "").toLowerCase().includes(needle) ||
        (r.category || "").toLowerCase().includes(needle) ||
        (r.clientId || "").toLowerCase().includes(needle)
      );
    }
    return result;
  }, [qrList, categoryFilter, searchText]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);
  useEffect(() => { setPage(1); }, [categoryFilter, searchText]);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setSelectedIds((prev) => {
      const valid = new Set(qrList.map((q) => q.id));
      const next = new Set([...prev].filter((id) => valid.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [qrList]);

  useEffect(() => { setOpenActionMenu(null); }, [page, categoryFilter, searchText]);

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
      if (next.has(id)) next.delete(id); else next.add(id);
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

  function toggleRowCodeVisibility(targetId: string) {
    setRevealedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(targetId)) next.delete(targetId); else next.add(targetId);
      return next;
    });
  }
  const areAllFilteredCodesRevealed = filtered.length > 0 && filtered.every((q) => revealedRowIds.has(q.id));
  function toggleAllFilteredCodesVisibility() {
    setRevealedRowIds((prev) => {
      const next = new Set(prev);
      if (areAllFilteredCodesRevealed) filtered.forEach((q) => next.delete(q.id));
      else filtered.forEach((q) => next.add(q.id));
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

  /** Maps the id-scheme v2 server response (QrModel.saveV2) into a QrRecord. */
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

    // Each tag only enters the fleet list (and only gets a "pending
    // activation" entry dispatched) once the server confirms it was actually
    // persisted — id-scheme v2 also means the id itself isn't known until
    // that response arrives (see QrModel.saveV2), so there's nothing to
    // optimistically prepend beforehand the way v1's client-generated ids
    // used to allow.
    const recoveryRows: [string, string][] = [];
    let failedCount = 0;
    const CHUNK = 50;
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
      setToast(`${savedCount} of ${count} QR codes generated — ${failedCount} failed to save and were not created. Try again for the rest.`);
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
    a.download = "tagyard-fleet-export.csv";
    a.click();
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-14" style={{ background: "var(--fx-canvas)" }}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="mb-5">
        <h1 className="font-semibold tracking-[-0.02em]" style={{ fontSize: 28, lineHeight: 1.15 }}>
          Tag generator
        </h1>
      </div>

      {/* ── Generator Toolbar ─────────────────────────────────── */}
      <div className="fx-toolbar" style={{ marginBottom: 22 }}>
        <div className="fx-toolbar-field">
          <span className="fx-toolbar-label">Mode</span>
          <div className="fx-seg">
            <button type="button" className={tab === "single" ? "fx-seg-active" : ""} onClick={() => setTab("single")}>Single tag</button>
            <button type="button" className={tab === "bulk" ? "fx-seg-active" : ""} onClick={() => setTab("bulk")}>Bulk sheet</button>
          </div>
        </div>

        <div className="fx-toolbar-field" style={{ minWidth: 190 }}>
          <span className="fx-toolbar-label">Sticker category</span>
          <select className="fx-select" style={{ width: 190 }} value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            {STICKER_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        {tab === "bulk" && (
          <div className="fx-toolbar-field" style={{ width: 110 }}>
            <span className="fx-toolbar-label">Count</span>
            <input
              type="number" min={1} max={200}
              className="fx-input"
              style={{ width: 110 }}
              value={bulkCount}
              onChange={(e) => setBulkCount(parseInt(e.target.value, 10) || 1)}
            />
          </div>
        )}

        <div className="fx-toolbar-field" style={{ marginLeft: "auto" }}>
          {tab === "single" ? (
            <button className="fx-btn fx-btn-primary" onClick={() => setGenerateModalOpen(true)}>
              <Plus size={15} strokeWidth={2.4} /> Generate tag
            </button>
          ) : (
            <button className="fx-btn fx-btn-primary" disabled={bulkProgress !== null} onClick={() => doGenerateBulk()}>
              {bulkProgress !== null ? <Loader2 size={15} className="fx-spin-inline" /> : <Plus size={15} strokeWidth={2.4} />}
              Generate {bulkCount}
            </button>
          )}
        </div>
      </div>
      <style>{`.fx-spin-inline { animation: fx-spin-inline .8s linear infinite; } @keyframes fx-spin-inline { to { transform: rotate(360deg); } }`}</style>

      {/* ── Bulk Progress ─────────────────────────────────────── */}
      {bulkProgress !== null && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <div style={{ flex: 1, height: 6, borderRadius: 999, background: "var(--fx-border)", overflow: "hidden" }}>
            <div style={{ height: "100%", background: "var(--fx-accent)", transition: "width .25s ease", width: `${bulkProgress}%` }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--fx-ink-2)", whiteSpace: "nowrap" }}>{bulkProgress}% synced</span>
        </div>
      )}

      {/* ── Table Toolbar ─────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>All tags</h2>
          <span style={{ fontSize: 13, color: "var(--fx-ink-2)" }}>{filtered.length}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--fx-faint)" }} />
            <input
              type="text" className="fx-input" placeholder="Search ID or phone…"
              style={{ width: 200, paddingLeft: 30 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>

          <select className="fx-select" style={{ width: 150 }} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">All categories</option>
            {STICKER_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>

          <button className="fx-btn fx-btn-secondary fx-btn-sm" onClick={openRestore} title="Restore a deleted sticker by recovery code">
            <RefreshCw size={13} /> Restore
          </button>
          <button className="fx-btn fx-btn-secondary fx-btn-sm" onClick={toggleAllFilteredCodesVisibility} title="Show or hide recovery codes">
            {areAllFilteredCodesRevealed ? <EyeOff size={13} /> : <Eye size={13} />} See codes
          </button>
          <button
            className="fx-btn fx-btn-secondary fx-btn-sm" onClick={handlePrintSheet}
            disabled={filtered.length === 0 || sheetGenerating} title="Print selected stickers as a sheet"
          >
            <Printer size={13} /> {sheetGenerating ? "Preparing…" : "Print"}
          </button>
          <button className="fx-btn fx-btn-secondary fx-btn-sm" onClick={downloadCsv} disabled={qrList.length === 0}>
            <Download size={13} /> Export CSV
          </button>
          <button className="fx-btn fx-btn-danger fx-btn-sm" onClick={() => setClearAllOpen(true)} disabled={qrList.length === 0}>
            <Trash2 size={13} /> Clear all
          </button>
        </div>
      </div>

      {/* ── Empty ─────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="fx-empty">
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--fx-canvas)", border: "1px solid var(--fx-border)", color: "var(--fx-faint)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
            <QrCode size={22} />
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
            {categoryFilter !== "all" || searchText.trim() ? "No tags match that filter." : "No tags yet"}
          </p>
          <p style={{ fontSize: 13, color: "var(--fx-ink-2)", marginBottom: 16, maxWidth: 340 }}>
            {categoryFilter !== "all" || searchText.trim()
              ? "Try changing the category or clearing your search."
              : "Generate your first tag to get a scannable QR code and a printed sticker sheet."}
          </p>
          {categoryFilter !== "all" || searchText.trim() ? (
            <button className="fx-btn fx-btn-secondary fx-btn-sm" onClick={() => { setCategoryFilter("all"); setSearchText(""); }}>
              <RefreshCw size={13} /> Clear filters
            </button>
          ) : (
            <button className="fx-btn fx-btn-primary" onClick={() => setGenerateModalOpen(true)}>
              <Plus size={15} strokeWidth={2.4} /> Generate tag
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ── Desktop table ─────────────────────────────────── */}
          <div className="fx-table-wrap hidden lg:block">
            <table className="fx-table">
              <thead>
                <tr>
                  <th className="fx-th" style={{ width: 40 }}>
                    <input type="checkbox" className="fx-check" checked={allPageSelected} onChange={toggleSelectAllPage} />
                  </th>
                  <th className="fx-th" style={{ width: 52 }}>QR</th>
                  <th className="fx-th">Unique ID</th>
                  <th className="fx-th">Recovery</th>
                  <th className="fx-th">Phone</th>
                  <th className="fx-th">Category</th>
                  <th className="fx-th">Created</th>
                  <th className="fx-th">Status</th>
                  <th className="fx-th fx-th-right" style={{ width: 138 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((q) => {
                  const catKey = (q.category || "car") as any;
                  const label = getCategoryLabel(catKey);
                  const phoneNum = q.ownerPhone || q.phoneNumber || (q as any).phone || (q as any).owner_phone || "";
                  const isActivated = Boolean(phoneNum && phoneNum.trim());
                  const computedStatus = isActivated ? "active" : q.status;
                  const isCodeRevealed = revealedRowIds.has(q.id);
                  const isSelected = selectedIds.has(q.id);

                  return (
                    <tr key={q.id} className={`fx-tr ${isSelected ? "fx-selected" : ""}`}>
                      <td className="fx-td">
                        <input type="checkbox" className="fx-check" checked={isSelected} onChange={() => toggleSelected(q.id)} />
                      </td>
                      <td className="fx-td">
                        <button type="button" onClick={() => openQuickLook(q)} style={{ display: "flex", alignItems: "center", background: "none", border: "none", cursor: "pointer", padding: 0 }} title="Preview">
                          <QrCodeImage data={qrFullUrl(q.id)} fg={q.fg || "000000"} bg={q.bg || "FFFFFF"} size={32} style={{ width: 32, height: 32, border: "1px solid var(--fx-border)", borderRadius: 6 }} />
                        </button>
                      </td>
                      <td className="fx-td">
                        <span className="fx-mono" style={{ color: isCodeRevealed ? "var(--fx-ink)" : "var(--fx-ink-2)", userSelect: isCodeRevealed ? "text" : "none" }}>
                          {isCodeRevealed ? q.id : "••••••••"}
                        </span>
                      </td>
                      <td className="fx-td">
                        <span className="fx-mono" style={{ color: isCodeRevealed ? "var(--fx-ink)" : "var(--fx-ink-2)", userSelect: isCodeRevealed ? "text" : "none" }}>
                          {isCodeRevealed ? (q.recoveryCode || "—") : "••••••••"}
                        </span>
                      </td>
                      <td className="fx-td">
                        {isActivated ? (
                          <span style={{ fontSize: 13 }}>{phoneNum}</span>
                        ) : (
                          <span style={{ color: "var(--fx-faint)" }}>—</span>
                        )}
                      </td>
                      <td className="fx-td">
                        <span className="fx-badge" style={{ background: "var(--fx-canvas)", color: "#4B5563" }}>{label}</span>
                      </td>
                      <td className="fx-td" style={{ whiteSpace: "nowrap", color: "var(--fx-ink-2)", fontSize: 12.5 }}>{fmtDate(q.createdAt)}</td>
                      <td className="fx-td">
                        <span className="fx-status">
                          <span className={`fx-dot ${computedStatus === "active" ? "fx-dot-green" : "fx-dot-amber"}`} />
                          {computedStatus === "active" ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="fx-td">
                        <QrRowActions
                          qr={q}
                          openQuickLook={openQuickLook}
                          setDeleteTarget={setDeleteTarget}
                          openPrintSheet={(target) => handleTriggerPrintSheet(target, [target])}
                          onMoreReveal={() => toggleRowCodeVisibility(q.id)}
                          menuOpen={openActionMenu === q.id}
                          onMenuToggle={() => setOpenActionMenu((prev) => (prev === q.id ? null : q.id))}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 14px", borderTop: "1px solid var(--fx-border)" }}>
                <p style={{ fontSize: 12, color: "var(--fx-ink-2)" }}>
                  Showing <span style={{ fontWeight: 600, color: "var(--fx-ink)" }}>{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}</span> of{" "}
                  <span style={{ fontWeight: 600, color: "var(--fx-ink)" }}>{filtered.length}</span>
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button className="fx-btn fx-btn-secondary fx-btn-sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--fx-ink-2)", padding: "0 4px" }}>{page} / {totalPages}</span>
                  <button className="fx-btn fx-btn-secondary fx-btn-sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Mobile / tablet card list ─────────────────────── */}
          <div className="lg:hidden fx-table-wrap">
            {paginated.map((q) => {
              const catKey = (q.category || "car") as any;
              const label = getCategoryLabel(catKey);
              const phoneNum = q.ownerPhone || q.phoneNumber || (q as any).phone || (q as any).owner_phone || "";
              const isActivated = Boolean(phoneNum && phoneNum.trim());
              const computedStatus = isActivated ? "active" : q.status;
              const isCodeRevealed = revealedRowIds.has(q.id);

              return (
                <div key={q.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", borderBottom: "1px solid var(--fx-border)" }}>
                  <input type="checkbox" className="fx-check" checked={selectedIds.has(q.id)} onChange={() => toggleSelected(q.id)} />
                  <button type="button" onClick={() => openQuickLook(q)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}>
                    <QrCodeImage data={qrFullUrl(q.id)} fg={q.fg || "000000"} bg={q.bg || "FFFFFF"} size={36} style={{ width: 36, height: 36, border: "1px solid var(--fx-border)", borderRadius: 6 }} />
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span className="fx-mono" style={{ fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {isCodeRevealed ? q.id : `${q.id.slice(0, 6)}…`}
                      </span>
                      <span className="fx-status" style={{ fontSize: 12, marginLeft: "auto" }}>
                        <span className={`fx-dot ${computedStatus === "active" ? "fx-dot-green" : "fx-dot-amber"}`} />
                        {computedStatus === "active" ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--fx-ink-2)" }}>
                      <span className="fx-badge">{label}</span>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {isActivated ? phoneNum : "No phone"}
                      </span>
                      <span style={{ marginLeft: "auto", color: "var(--fx-faint)", fontSize: 12 }}>{fmtDate(q.createdAt)}</span>
                    </div>
                  </div>
                  <QrRowActions
                    qr={q}
                    openQuickLook={openQuickLook}
                    setDeleteTarget={setDeleteTarget}
                    openPrintSheet={(target) => handleTriggerPrintSheet(target, [target])}
                    onMoreReveal={() => toggleRowCodeVisibility(q.id)}
                    menuOpen={openActionMenu === q.id}
                    onMenuToggle={() => setOpenActionMenu((prev) => (prev === q.id ? null : q.id))}
                  />
                </div>
              );
            })}

            {totalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "12px 14px", borderTop: "1px solid var(--fx-border)" }}>
                <button className="fx-btn fx-btn-secondary fx-btn-sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft size={14} /> Prev
                </button>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--fx-ink-2)" }}>{page} / {totalPages}</span>
                <button className="fx-btn fx-btn-secondary fx-btn-sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  Next <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Delete confirmations (inline) ────────────────────── */}
      {deleteTarget && (
        <div className="fx-modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="fx-modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
              <span style={{ width: 32, height: 32, borderRadius: 8, background: "var(--fx-red-soft)", color: "var(--fx-red)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Trash2 size={16} />
              </span>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Delete QR sticker?</h3>
                <p style={{ fontSize: 13, color: "var(--fx-ink-2)", lineHeight: 1.5 }}>
                  <span className="fx-mono">{deleteTarget.id}</span> will disappear from the fleet list, but can be restored later with its recovery code.
                </p>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button className="fx-btn fx-btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button
                className="fx-btn fx-btn-primary"
                style={{ background: "var(--fx-red)", color: "#FFF" }}
                onClick={async () => {
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
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {clearAllOpen && (
        <div className="fx-modal-backdrop" onClick={() => setClearAllOpen(false)}>
          <div className="fx-modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
              <span style={{ width: 32, height: 32, borderRadius: 8, background: "var(--fx-red-soft)", color: "var(--fx-red)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <AlertTriangle size={16} />
              </span>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Clear all QR stickers?</h3>
                <p style={{ fontSize: 13, color: "var(--fx-ink-2)", lineHeight: 1.5 }}>
                  All <span style={{ fontWeight: 600, color: "var(--fx-ink)" }}>{qrList.length}</span> QR codes will be permanently deleted. This cannot be undone.
                </p>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button className="fx-btn fx-btn-secondary" onClick={() => setClearAllOpen(false)}>Cancel</button>
              <button
                className="fx-btn fx-btn-primary"
                style={{ background: "var(--fx-red)", color: "#FFF" }}
                onClick={async () => {
                  setClearAllOpen(false);
                  const deleted = await apiClient.qr.deleteAllQrCodes().then((res) => res?.success).catch(() => false);
                  if (!deleted) { setToast("Failed to clear QR codes from the database. Please try again."); setTimeout(() => setToast(null), 3000); return; }
                  setQrList([]);
                  try { localStorage.removeItem("repiqr-qrlist"); localStorage.removeItem("namoqr-qrlist"); } catch { /* ignore */ }
                  setToast("All QR codes cleared from database");
                  setTimeout(() => setToast(null), 1500);
                }}
              >
                Clear all
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
        onClose={() => { setIsLocalPrintModalOpen(false); setLocalPrintTargetSticker(null); }}
        availableStickers={filtered}
        initialSelectedSticker={localPrintTargetSticker}
        initialBatchStickers={selectedIds.size > 0 ? filtered.filter((q) => selectedIds.has(q.id)) : undefined}
        stickerPos={stickerPos}
        onShowToast={(msg) => { setToast(msg); setTimeout(() => setToast(null), 4000); }}
      />
    </div>
  );
}
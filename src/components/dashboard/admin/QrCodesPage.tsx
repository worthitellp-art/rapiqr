import type React from "react";
import { useState, useEffect } from "react";
import { Plus, Sparkles, Download, Trash2, RefreshCw, Tag, Phone, ChevronLeft, ChevronRight } from "lucide-react";
import StatusPill from "./StatusPill";
import StickerThumb from "./StickerThumb";
import { QrRecord, Template, StickerPos } from "./types";
import { uid, qrFullUrl, fmtDate, dispatchActivationToUserDashboard, saveGeneratedSticker } from "./helpers";
import { saveQrCodeToDb, bulkSaveQrCodesToDb, deleteQrCodeFromDb, deleteAllQrCodesFromDb } from "../../../lib/supabaseService";
import { STICKER_CATEGORIES, getCategoryIcon, getCategoryLabel } from "../../../stickerModules";
import ConfirmModal from "./ConfirmModal";
import QrRowActions from "./QrRowActions";

export default function QrCodesPage({
  qrList, setQrList, templates, setToast, openQuickLook, openRestore, searchQuery, stickerPos,
}: {
  qrList: QrRecord[]; setQrList: React.Dispatch<React.SetStateAction<QrRecord[]>>;
  templates: Template[]; setToast: (msg: string | null) => void;
  openQuickLook: (q: QrRecord) => void; openRestore: () => void; searchQuery: string;
  stickerPos: StickerPos;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>("car");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [tab, setTab] = useState("single");
  const [bulkCount, setBulkCount] = useState(25);
  const [bulkProgress, setBulkProgress] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<QrRecord | null>(null);
  const [clearAllOpen, setClearAllOpen] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;

  const filtered = qrList.filter((q) => {
    const phoneNum = q.ownerPhone || q.phoneNumber || (q as any).phone || (q as any).owner_phone || "";
    const matchesSearch = !searchQuery ||
      q.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phoneNum.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.category || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === "all" || (q.category || "car") === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Reset to page 1 whenever the visible set changes shape (new search/filter,
  // or the current page was deleted out from under the list) — otherwise the
  // table can land on a page past the end and render nothing.
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);
  useEffect(() => {
    setPage(1);
  }, [searchQuery, categoryFilter]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function buildQrRecord(targetCategory: string): QrRecord {
    const codeId = uid();
    return {
      id: codeId,
      clientId: uid("CL"),
      qrUrl: "",
      createdAt: new Date().toISOString(),
      scans: 0,
      status: "inactive",
      template: "Standard Tag",
      category: targetCategory,
      fg: "000000",
      bg: "FFFFFF",
    };
  }

  function handleGenerateSingle() {
    const rec = buildQrRecord(selectedCategory);
    rec.qrUrl = qrFullUrl(rec.id);

    setQrList((prev) => [rec, ...prev]);
    saveQrCodeToDb({ id: rec.id, clientId: rec.clientId, status: rec.status, templateName: rec.template, category: rec.category, fgColor: rec.fg, bgColor: rec.bg });

    // Uses the admin's actual saved placement (Customize > Sticker Placement) instead
    // of a hardcoded box — otherwise the image uploaded to the bucket never matched
    // whatever position/size the admin had customized and saved there.
    saveGeneratedSticker(rec, stickerPos);

    setToast(`Generated 1 ${rec.category || "Car"} Tag`);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleGenerateBulk() {
    const count = Math.min(Math.max(1, bulkCount), 200);
    setBulkProgress(0);

    const batch: QrRecord[] = [];
    for (let i = 0; i < count; i++) {
      const rec = buildQrRecord(selectedCategory);
      rec.qrUrl = qrFullUrl(rec.id);
      batch.push(rec);
    }

    setQrList((prev) => [...batch, ...prev]);

    const CHUNK = 50;
    for (let i = 0; i < batch.length; i += CHUNK) {
      await bulkSaveQrCodesToDb(batch.slice(i, i + CHUNK));
      setBulkProgress(Math.min(100, Math.round(((i + CHUNK) / batch.length) * 100)));
    }

    batch.forEach((item) => dispatchActivationToUserDashboard(item));
    setBulkProgress(null);
    setToast(`${count} QR codes generated & synced`);
    setTimeout(() => setToast(null), 3000);
  }

  function downloadCsv() {
    const rows = [
      ["QR ID", "Phone Number", "Category", "Status", "Created"],
      ...qrList.map((q) => {
        const phoneNum = q.ownerPhone || q.phoneNumber || (q as any).phone || (q as any).owner_phone || "";
        const isActivated = Boolean(phoneNum && phoneNum.trim());
        const computedStatus = isActivated ? "active" : q.status;
        return [q.id, phoneNum || "N/A", q.category || "car", computedStatus, fmtDate(q.createdAt)];
      }),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "tagyard-fleet-export.csv";
    a.click();
  }

  const inputCls = "w-full px-3 py-2.5 text-[13.5px] rounded-[4px] border border-[#E5E5E7] bg-white text-[#17181A] outline-none focus:border-[#5C78DF] focus:ring-2 focus:ring-[#5C78DF]/25 transition-all font-body";

  return (
    <div className="px-8 pt-7 pb-16 space-y-7 text-[#17181A] font-body" style={{ background: "#F7F7F8" }}>
      {/* ── Section Header ────────────────────────────────────────── */}
      <div className="flex items-baseline justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-[28px] font-bold text-[#17181A] leading-tight tracking-[-0.8px]">
            Tag generator
          </h1>
          <p className="text-[13px] text-[#777B80] mt-0.5">
            Stamp a new tag for a single asset, or run a full sheet
          </p>
        </div>
      </div>

      {/* ── Generator Console Card ───────────────────────────────── */}
      <div className="bg-white border border-[#E5E5E7] shadow-[0_1px_4px_rgba(0,0,0,0.03)] p-6 overflow-hidden">
        <div className="flex flex-wrap items-end gap-6">
          {/* Mode Switcher */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-body font-semibold uppercase tracking-[1px] text-[#777B80]">
              Mode
            </label>
            <div className="flex bg-[#F7F7F8] border border-[#E5E5E7] rounded-[4px] p-1">
              <button
                type="button"
                onClick={() => setTab("single")}
                className={`px-4 py-2 text-[13px] font-semibold rounded-[4px] transition-all cursor-pointer ${
                  tab === "single"
                    ? "bg-white text-[#17181A] font-bold shadow-[0_1px_4px_rgba(0,0,0,0.03)]"
                    : "text-[#777B80] hover:text-[#17181A]"
                }`}
              >
                Single tag
              </button>
              <button
                type="button"
                onClick={() => setTab("bulk")}
                className={`px-4 py-2 text-[13px] font-semibold rounded-[4px] transition-all cursor-pointer ${
                  tab === "bulk"
                    ? "bg-white text-[#17181A] font-bold shadow-[0_1px_4px_rgba(0,0,0,0.03)]"
                    : "text-[#777B80] hover:text-[#17181A]"
                }`}
              >
                Bulk sheet
              </button>
            </div>
          </div>

          {/* Category Dropdown */}
          <div className="flex-1 min-w-[200px] flex flex-col gap-1.5">
            <label className="text-[11px] font-body font-semibold uppercase tracking-[1px] text-[#777B80]">
              Sticker category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={inputCls}
            >
              {STICKER_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity Selector (if bulk) */}
          {tab === "bulk" && (
            <div className="w-[120px] flex flex-col gap-1.5">
              <label className="text-[11px] font-body font-semibold uppercase tracking-[1px] text-[#777B80]">
                Quantity
              </label>
              <input
                type="number"
                min={1}
                max={200}
                value={bulkCount}
                onChange={(e) => setBulkCount(parseInt(e.target.value) || 1)}
                className={inputCls}
              />
            </div>
          )}

          {/* Generate Button */}
          <div className="ml-auto sm:ml-0">
            {tab === "single" ? (
              <button
                onClick={handleGenerateSingle}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[4px] bg-[#5C78DF] text-white font-semibold text-[13px] hover:bg-[#4A63C0] active:scale-95 transition-all cursor-pointer"
              >
                <Plus size={16} strokeWidth={2.4} /> Generate tag
              </button>
            ) : (
              <button
                onClick={handleGenerateBulk}
                disabled={bulkProgress !== null}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[4px] bg-[#5C78DF] text-white font-semibold text-[13px] hover:bg-[#4A63C0] active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
              >
                <Sparkles size={16} strokeWidth={2.4} /> Generate {bulkCount} tags
              </button>
            )}
          </div>
        </div>

        {bulkProgress !== null && (
          <div className="mt-4 pt-3 border-t border-[#E5E5E7]">
            <div className="w-full bg-[#F3F3F4] rounded-[4px] h-2 overflow-hidden border border-[#E5E5E7]">
              <div
                className="h-full bg-[#5C78DF] transition-all duration-200"
                style={{ width: `${bulkProgress}%` }}
              />
            </div>
            <p className="text-[11px] text-[#777B80] mt-1 text-right font-bold">
              {bulkProgress}% synced to fleet database...
            </p>
          </div>
        )}
      </div>

      {/* ── Toolbar Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <h2 className="font-display text-[14px] font-semibold text-[#17181A]">
            All tags
          </h2>
          <span className="text-[12px] text-[#777B80]">
            · {filtered.length}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white border border-[#E5E5E7] rounded-[4px] px-3 py-2 text-[13px] text-[#17181A] outline-none cursor-pointer focus:border-[#5C78DF]"
          >
            <option value="all">All categories</option>
            {STICKER_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>

          <button
            onClick={openRestore}
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-2 rounded-[4px] border border-[#E5E5E7] bg-white text-[#17181A] hover:bg-[#F7F7F8] transition-all cursor-pointer"
          >
            <RefreshCw size={12} /> Restore Tag
          </button>

          <button
            onClick={downloadCsv}
            disabled={qrList.length === 0}
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-2 rounded-[4px] border border-[#E5E5E7] bg-white text-[#17181A] hover:bg-[#F7F7F8] transition-all disabled:opacity-40 cursor-pointer"
          >
            <Download size={12} /> Export CSV
          </button>

          <button
            onClick={() => setClearAllOpen(true)}
            disabled={qrList.length === 0}
            className="inline-flex items-center gap-1.5 text-[12px] font-bold px-3 py-2 rounded-[4px] border border-[#DC2626]/20 text-[#DC2626] hover:bg-[#FDEAEA] transition-all disabled:opacity-40 cursor-pointer"
          >
            <Trash2 size={12} /> Clear all
          </button>
        </div>
      </div>

      {/* ── Table View ────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-[#E5E5E7] p-16 text-center space-y-2">
          <div className="w-12 h-12 rounded-[4px] bg-[#E8EDFF] text-[#5271D5] flex items-center justify-center mx-auto">
            <Tag size={22} />
          </div>
          <p className="text-[14px] text-[#17181A] font-semibold">
            {searchQuery || categoryFilter !== "all"
              ? "No tags match that filter or search."
              : "No QR codes yet — generate one using the console above."}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-[#E5E5E7] shadow-[0_1px_4px_rgba(0,0,0,0.03)] overflow-hidden">
          <table className="w-full text-sm text-[#17181A]">
            <thead>
              <tr className="text-left font-display text-[12px] font-semibold text-[#777B80] tracking-normal bg-[#F7F7F8] border-b border-[#E5E5E7]">
                <th className="px-6 py-3">QR Plate</th>
                <th className="px-2 py-3">Phone number</th>
                <th className="px-2 py-3">Category</th>
                <th className="px-2 py-3">Created</th>
                <th className="px-2 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E7]">
              {paginated.map((q) => {
                const catKey = (q.category || "car") as any;
                const icon = getCategoryIcon(catKey);
                const label = getCategoryLabel(catKey);
                const phoneNum = q.ownerPhone || q.phoneNumber || (q as any).phone || (q as any).owner_phone || "";
                const isActivated = Boolean(phoneNum && phoneNum.trim());
                const computedStatus = isActivated ? "active" : q.status;

                return (
                  <tr key={q.id} className="hover:bg-[#F3F3F4] transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <button onClick={() => openQuickLook(q)} className="hover:opacity-80 transition-opacity cursor-pointer">
                          <StickerThumb qr={q} size={34} />
                        </button>
                        <span className="font-display font-semibold text-[15px] text-[#17181A]">
                          {q.id}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      {isActivated ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-[#E9F9EF] text-[#2E9E5B] font-semibold text-xs">
                          <Phone size={12} className="text-[#2E9E5B]" />
                          <span>{phoneNum}</span>
                        </span>
                      ) : (
                        <span className="text-[#9CA0A6] font-normal text-xs">—</span>
                      )}
                    </td>
                    <td className="px-2 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-[#E8EDFF] text-[#5271D5] font-semibold text-xs">
                        <span>{icon}</span>
                        <span>{label}</span>
                      </span>
                    </td>
                    <td className="px-2 py-3 text-[11px] text-[#777B80]">{fmtDate(q.createdAt)}</td>
                    <td className="px-2 py-3"><StatusPill status={computedStatus} /></td>
                    <td className="px-6 py-3 text-right">
                      <QrRowActions qr={q} openQuickLook={openQuickLook} setDeleteTarget={setDeleteTarget} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* ── Pagination ────────────────────────────────────────── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-4 px-6 py-3 border-t border-[#E5E5E7] bg-[#F7F7F8]">
              <p className="text-[12px] text-[#777B80]">
                Showing <span className="font-semibold text-[#17181A]">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}</span> of{" "}
                <span className="font-semibold text-[#17181A]">{filtered.length}</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="inline-flex items-center gap-1 text-[12px] font-semibold px-3 py-1.5 rounded-[4px] border border-[#E5E5E7] bg-white text-[#17181A] hover:bg-[#F3F3F4] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                <span className="text-[12px] text-[#777B80] font-semibold px-1">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="inline-flex items-center gap-1 text-[12px] font-semibold px-3 py-1.5 rounded-[4px] border border-[#E5E5E7] bg-white text-[#17181A] hover:bg-[#F3F3F4] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  Next <ChevronRight size={14} />
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
          <>
            Are you sure you want to delete <span className="font-bold text-[#17181A]">{deleteTarget?.id}</span>?
            This cannot be undone.
          </>
        }
        onConfirm={async () => {
          if (deleteTarget) {
            const targetId = deleteTarget.id;
            setDeleteTarget(null);
            const deleted = await deleteQrCodeFromDb(targetId);
            if (!deleted) {
              setToast(`Failed to delete ${targetId} — it still exists in the database. Please try again.`);
              setTimeout(() => setToast(null), 3000);
              return;
            }
            setQrList((prev) => {
              const updated = prev.filter((x) => x.id !== targetId);
              try {
                localStorage.setItem("repiqr-qrlist", JSON.stringify(updated));
                localStorage.setItem("namoqr-qrlist", JSON.stringify(updated));
              } catch { /* ignore */ }
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
        message={
          <>
            Are you sure you want to delete all <span className="font-bold text-[#17181A]">{qrList.length}</span> QR codes?
            This cannot be undone.
          </>
        }
        confirmLabel="Clear All"
        onConfirm={async () => {
          setClearAllOpen(false);
          const deleted = await deleteAllQrCodesFromDb();
          if (!deleted) {
            setToast("Failed to clear QR codes from the database. Please try again.");
            setTimeout(() => setToast(null), 3000);
            return;
          }
          setQrList([]);
          try {
            localStorage.removeItem("repiqr-qrlist");
            localStorage.removeItem("namoqr-qrlist");
          } catch { /* ignore */ }
          setToast("All QR codes cleared from database");
          setTimeout(() => setToast(null), 1500);
        }}
        onClose={() => setClearAllOpen(false)}
      />
    </div>
  );
}

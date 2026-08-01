import type React from "react";
import { useState, useEffect } from "react";
import { Plus, Sparkles, Download, Trash2, RefreshCw, Eye, UserPlus, Tag } from "lucide-react";
import StatusPill from "./StatusPill";
import ActCode from "./ActCode";
import CopyLinkButton from "./CopyLinkButton";
import StickerThumb from "./StickerThumb";
import { QrRecord, Template } from "./types";
import { uid, generateActivationCode, qrFullUrl, fmtDate, dispatchActivationToUserDashboard, saveGeneratedSticker } from "./helpers";
import { saveQrCodeToDb, bulkSaveQrCodesToDb } from "../../../lib/supabaseService";
import { STICKER_CATEGORIES, getCategoryIcon, getCategoryLabel } from "../../../stickerModules";
import ConfirmModal from "./ConfirmModal";

export default function QrCodesPage({
  qrList, setQrList, templates, setToast, openQuickLook, openRestore, searchQuery,
}: {
  qrList: QrRecord[]; setQrList: React.Dispatch<React.SetStateAction<QrRecord[]>>;
  templates: Template[]; setToast: (msg: string | null) => void;
  openQuickLook: (q: QrRecord) => void; openRestore: () => void; searchQuery: string;
}) {
  const [templateId, setTemplateId] = useState(
    templates.find((t) => t.isPublicDefault)?.id?.toString() || templates[0]?.id?.toString() || ""
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("car");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [tab, setTab] = useState("single");
  const [bulkCount, setBulkCount] = useState(25);
  const [bulkProgress, setBulkProgress] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<QrRecord | null>(null);
  const [clearAllOpen, setClearAllOpen] = useState(false);

  useEffect(() => {
    if (templates.length > 0 && !templates.find((t) => t.id.toString() === templateId)) {
      const def = templates.find((t) => t.isPublicDefault) || templates[0];
      setTemplateId(def.id.toString());
    }
  }, [templates]);

  const activeTemplate = templates.find((t) => t.id.toString() === templateId) || templates[0];

  const filtered = qrList.filter((q) => {
    const matchesSearch = !searchQuery || 
      q.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.activationCode || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.category || "").toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesCategory = categoryFilter === "all" || (q.category || "car") === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  function buildQrRecord(targetCategory: string): QrRecord {
    const codeId = uid();
    return {
      id: codeId,
      clientId: uid("CL"),
      qrUrl: "",
      createdAt: new Date().toISOString(),
      scans: 0,
      status: "inactive",
      activationCode: codeId,
      template: activeTemplate?.name || "Default",
      category: targetCategory,
      fg: activeTemplate?.fg || "EAB308",
      bg: activeTemplate?.bg || "FFFFFF",
    };
  }

  async function handleGenerateSingle() {
    const rec = buildQrRecord(selectedCategory);
    rec.qrUrl = qrFullUrl(rec.id);
    setQrList((prev) => [rec, ...prev]);

    await saveQrCodeToDb({ 
      id: rec.id, 
      clientId: rec.clientId, 
      status: rec.status, 
      templateName: rec.template, 
      category: rec.category,
      fgColor: rec.fg, 
      bgColor: rec.bg, 
      activationCode: rec.activationCode 
    });

    const stickerPos = activeTemplate?.stickerPos || { x: 110, y: 40, w: 100, h: 100 };
    saveGeneratedSticker(rec, stickerPos);

    dispatchActivationToUserDashboard(rec);
    openQuickLook(rec);
    setToast(`QR Generated (${selectedCategory.toUpperCase()})! Code: ${rec.id}`);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleGenerateBulk() {
    const count = Math.max(1, Math.min(1000, Number(bulkCount) || 0));
    setBulkProgress(0);
    const batch: QrRecord[] = Array.from({ length: count }).map(() => {
      const rec = buildQrRecord(selectedCategory);
      return { ...rec, qrUrl: qrFullUrl(rec.id) };
    });

    setQrList((prev) => [...batch, ...prev]);

    const CHUNK = 50;
    for (let i = 0; i < batch.length; i += CHUNK) {
      await bulkSaveQrCodesToDb(batch.slice(i, i + CHUNK));
      setBulkProgress(Math.min(100, Math.round(((i + CHUNK) / batch.length) * 100)));
    }

    batch.forEach((item) => dispatchActivationToUserDashboard(item));
    setBulkProgress(null);
    setToast(`${count} ${selectedCategory.toUpperCase()} QR stickers generated & sent to User Dashboard`);
    setTimeout(() => setToast(null), 3000);
  }

  function downloadCsv() {
    const rows = [
      ["QR Code", "Activation Code", "Category", "Status", "Template", "Created"],
      ...qrList.map((q) => [q.id, q.activationCode || "ACTPENDING", q.category || "car", q.status, q.template, fmtDate(q.createdAt)]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "namoqr-export.csv";
    a.click();
  }

  const inputCls = "w-full px-3.5 py-2.5 text-sm rounded-xl border bg-gray-50 outline-none focus:bg-white focus:border-gray-400 transition-all font-semibold text-gray-900";

  return (
    <div className="px-8 pt-7 pb-10 space-y-6 text-gray-900">
      {/* Generate card */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#f0f0f0" }}>
        <div className="flex items-center gap-1 px-6 pt-5 pb-0">
          {[{ id: "single", label: "Single QR" }, { id: "bulk", label: "Bulk Generate" }].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-4 py-1.5 text-xs font-bold rounded-full mr-1 transition-all cursor-pointer"
              style={
                tab === t.id
                  ? { background: "var(--accent)", color: "#fff" }
                  : { background: "#f3f4f6", color: "#64748b" }
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "single" ? (
          <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-extrabold text-gray-500 mb-1.5 uppercase tracking-wider">
                Sticker Category
              </label>
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)} 
                className={inputCls} 
                style={{ borderColor: "#e2e8f0" }}
              >
                {STICKER_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-extrabold text-gray-500 mb-1.5 uppercase tracking-wider">
                Template
              </label>
              <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className={inputCls} style={{ borderColor: "#e2e8f0" }}>
                {templates.map((t) => <option key={t.id} value={t.id}>{t.name}{t.isPublicDefault ? " (default)" : ""}</option>)}
                {templates.length === 0 && <option value="">No templates yet</option>}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleGenerateSingle}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-95 cursor-pointer shadow-sm"
                style={{ background: "var(--accent)" }}
              >
                <Plus size={14} /> Generate Sticker
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] font-extrabold text-gray-500 mb-1.5 uppercase tracking-wider">
                Sticker Category
              </label>
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)} 
                className={inputCls} 
                style={{ borderColor: "#e2e8f0" }}
              >
                {STICKER_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-extrabold text-gray-500 mb-1.5 uppercase tracking-wider">Quantity (max 1000)</label>
              <input
                type="number" min={1} max={1000} value={bulkCount}
                onChange={(e) => setBulkCount(Math.min(1000, Number(e.target.value)))}
                className={inputCls} style={{ borderColor: "#e2e8f0" }}
              />
            </div>
            <div>
              <label className="block text-[10px] font-extrabold text-gray-500 mb-1.5 uppercase tracking-wider">Template</label>
              <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className={inputCls} style={{ borderColor: "#e2e8f0" }}>
                {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                {templates.length === 0 && <option value="">No templates</option>}
              </select>
            </div>
            <div className="flex items-end gap-3">
              <button
                onClick={handleGenerateBulk}
                disabled={bulkProgress !== null}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 cursor-pointer shadow-sm"
                style={{ background: "var(--accent)" }}
              >
                {bulkProgress !== null ? (
                  <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> {bulkProgress}%</>
                ) : (
                  <><Sparkles size={14} /> Generate {bulkCount}</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#f0f0f0" }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b gap-3" style={{ borderColor: "#f7f7f7" }}>
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-gray-900 text-sm">
              All QR Codes <span className="text-gray-500 font-normal">· {filtered.length}</span>
            </h3>
            
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200">
              <Tag size={12} className="text-gray-400 ml-1.5" />
              <select 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer pr-1"
              >
                <option value="all">All Categories</option>
                {STICKER_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={openRestore} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all hover:bg-yellow-50 cursor-pointer" style={{ color: "var(--accent)", borderColor: "rgba(234,179,8,0.3)" }}>
              <RefreshCw size={12} /> Restore
            </button>
            <button onClick={downloadCsv} disabled={qrList.length === 0} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-40 cursor-pointer">
              <Download size={12} /> Export CSV
            </button>
            <button onClick={() => setClearAllOpen(true)} disabled={qrList.length === 0} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-all disabled:opacity-40 cursor-pointer">
              <Trash2 size={12} /> Clear all
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-semibold text-gray-700">{searchQuery || categoryFilter !== "all" ? "No results match your search or filter." : "No QR codes yet — generate one above."}</p>
            {(searchQuery || categoryFilter !== "all") && <p className="text-xs text-gray-500 mt-1 font-medium">Try adjusting your category filter or search query.</p>}
          </div>
        ) : (
          <>
            <table className="w-full text-sm text-gray-900">
              <thead>
                <tr className="text-left text-[11px] text-gray-500 font-bold uppercase tracking-wider border-b" style={{ borderColor: "#f7f7f7" }}>
                  <th className="px-6 py-3">QR</th>
                  <th className="px-2 py-3">Activation Code</th>
                  <th className="px-2 py-3">Category</th>
                  <th className="px-2 py-3">Created</th>
                  <th className="px-2 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 60).map((q) => {
                  const actCode = q.activationCode || q.id;
                  const catKey = (q.category || "car") as any;
                  const icon = getCategoryIcon(catKey);
                  const label = getCategoryLabel(catKey);

                  return (
                    <tr key={q.id} className="border-b last:border-0 hover:bg-gray-50/60 transition-colors" style={{ borderColor: "#f7f7f7" }}>
                      <td className="px-6 py-3">
                        <button onClick={() => openQuickLook(q)} className="hover:opacity-80 transition-opacity cursor-pointer">
                          <StickerThumb qr={q} templates={templates} size={36} />
                        </button>
                      </td>
                      <td className="px-2 py-3"><ActCode code={actCode} /></td>
                      <td className="px-2 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-800 border border-gray-200">
                          <span>{icon}</span>
                          <span>{label}</span>
                        </span>
                      </td>
                      <td className="px-2 py-3 text-[11px] text-gray-600 font-semibold">{fmtDate(q.createdAt)}</td>
                      <td className="px-2 py-3"><StatusPill status={q.status} /></td>
                      <td className="px-6 py-3">
                        <div className="flex items-center justify-end gap-0.5">
                          <button
                            onClick={() => { dispatchActivationToUserDashboard(q); setToast(`Code ${actCode} dispatched`); setTimeout(() => setToast(null), 2000); }}
                            className="w-7 h-7 rounded-lg hover:bg-yellow-50 hover:text-yellow-600 flex items-center justify-center text-gray-500 transition-all cursor-pointer"
                            title="Dispatch to user"
                          >
                            <UserPlus size={13} />
                          </button>
                          <CopyLinkButton qrId={q.id} compact />
                          <button onClick={() => openQuickLook(q)} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-all cursor-pointer" title="Quick look">
                            <Eye size={13} />
                          </button>
                          <button onClick={() => setDeleteTarget(q)} className="w-7 h-7 rounded-lg hover:bg-red-50 hover:text-red-500 flex items-center justify-center text-gray-400 transition-all cursor-pointer" title="Delete QR">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length > 60 && (
              <div className="px-6 py-3 text-xs text-gray-500 font-medium border-t" style={{ borderColor: "#f7f7f7" }}>
                Showing latest 60 of {filtered.length} — export CSV for the full list.
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete confirmations */}
      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="Delete QR Sticker?"
        message={
          <>
            Are you sure you want to delete <span className="font-bold text-gray-900">{deleteTarget?.id}</span>?
            This cannot be undone.
          </>
        }
        onConfirm={() => {
          if (deleteTarget) {
            setQrList((prev) => prev.filter((x) => x.id !== deleteTarget.id));
            setToast("QR deleted");
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
            Are you sure you want to delete all <span className="font-bold text-gray-900">{qrList.length}</span> QR codes?
            This cannot be undone.
          </>
        }
        confirmLabel="Clear All"
        onConfirm={() => {
          setQrList([]);
          setToast("All QR codes cleared");
          setTimeout(() => setToast(null), 1500);
        }}
        onClose={() => setClearAllOpen(false)}
      />
    </div>
  );
}

import type React from "react";
import { useState } from "react";
import { RefreshCw, X } from "lucide-react";
import { QrRecord } from "./types";
import { qrFullUrl } from "./helpers";
import { apiClient } from "../../../lib/apiClient";

export default function RestoreStickerModal({
  isOpen, onClose, setQrList, openQuickLook, setToast,
}: {
  isOpen: boolean; onClose: () => void;
  setQrList: React.Dispatch<React.SetStateAction<QrRecord[]>>;
  openQuickLook: (q: QrRecord) => void;
  setToast: (msg: string | null) => void;
}) {
  const [targetId, setTargetId] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setTargetId(""); setRecoveryCode(""); setError(null);
    onClose();
  };

  const handleRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = targetId.trim();
    const cleanCode = recoveryCode.trim();
    if (!cleanId || !cleanCode) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await apiClient.qr.restoreQrCode(cleanId, cleanCode);
      if (!res?.success || !res.data) {
        setError(res?.error || "No sticker found with that ID and recovery code.");
        return;
      }

      const data = res.data;
      const rec: QrRecord = {
        id: data.id,
        qrUrl: qrFullUrl(data.id),
        clientId: data.client_id,
        vehicleName: data.owner_name || undefined,
        createdAt: data.created_at,
        scans: data.scans_count || 0,
        status: data.status,
        template: data.template_name,
        category: data.category,
        fg: data.fg_color,
        bg: data.bg_color,
      };

      setQrList((prev) => [rec, ...prev.filter((q) => q.id !== rec.id)]);
      setToast(`Sticker ${cleanId} restored`);
      setTimeout(() => setToast(null), 3000);
      handleClose();
      openQuickLook(rec);
    } catch (err: any) {
      setError(err?.message || "Restore failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" style={{ background: "rgba(10,10,20,0.6)", backdropFilter: "blur(4px)" }} onClick={handleClose}>
      <div className="bg-white shadow-[0_1px_4px_rgba(0,0,0,0.03)] w-full max-w-md p-6 text-[#17181A] border border-[#E5E5E7] relative" style={{ animation: "modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)" }} onClick={(e) => e.stopPropagation()}>
        <button onClick={handleClose} className="absolute top-5 right-5 w-7 h-7 rounded-[4px] bg-[#F3F3F4] flex items-center justify-center text-[#777B80] hover:bg-[#E5E5E7] hover:text-[#17181A] cursor-pointer">
          <X size={13} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-[4px] flex items-center justify-center" style={{ background: "#E8EDFF", color: "var(--accent)" }}>
            <RefreshCw size={18} />
          </div>
          <div>
            <h3 className="font-semibold text-[#17181A] text-base">Restore Sticker</h3>
            <p className="text-xs text-[#777B80] font-semibold">Bring back a deleted sticker with its recovery code</p>
          </div>
        </div>

        <form onSubmit={handleRestore} className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-[#777B80] uppercase tracking-wider mb-1.5">Sticker ID *</label>
            <input type="text" required placeholder="the sticker's id" value={targetId} onChange={(e) => setTargetId(e.target.value)} className="w-full px-4 py-2.5 text-sm font-semibold text-[#17181A] bg-[#F7F7F8] border border-[#E5E5E7] rounded-[4px] outline-none focus:border-[#5C78DF] font-mono transition-all" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#777B80] uppercase tracking-wider mb-1.5">Recovery Code *</label>
            <input type="text" required placeholder="printed on the physical sticker" value={recoveryCode} onChange={(e) => setRecoveryCode(e.target.value)} className="w-full px-4 py-2.5 text-sm font-semibold text-[#17181A] bg-[#F7F7F8] border border-[#E5E5E7] rounded-[4px] outline-none focus:border-[#5C78DF] uppercase font-mono tracking-wider transition-all" />
          </div>
          {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={handleClose} className="flex-1 py-2.5 rounded-[4px] border border-[#E5E5E7] text-xs font-semibold text-[#777B80] hover:bg-[#F3F3F4] hover:text-[#17181A] transition-all cursor-pointer">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-[4px] text-xs font-semibold text-white transition-all hover:opacity-90 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60" style={{ background: "var(--accent)" }}>
              <RefreshCw size={12} /> {submitting ? "Restoring…" : "Restore"}
            </button>
          </div>
        </form>
      </div>
      <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.94) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
    </div>
  );
}

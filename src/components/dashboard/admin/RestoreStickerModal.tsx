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
        recoveryCode: cleanCode,
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
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" style={{ background: "rgba(16,24,40,0.45)", backdropFilter: "blur(6px)" }} onClick={handleClose}>
      <div className="bg-white w-full max-w-md p-6 text-[#18181B] border border-[#E5E7EB] relative rounded-2xl shadow-[0_16px_48px_rgba(16,24,40,0.16),0_2px_8px_rgba(16,24,40,0.08)]" style={{ animation: "modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)" }} onClick={(e) => e.stopPropagation()}>
        <button onClick={handleClose} className="absolute top-5 right-5 w-7 h-7 rounded-[8px] bg-[#F4F4F5] flex items-center justify-center text-[#A1A1AA] hover:bg-[#E4E7EC] hover:text-[#18181B] cursor-pointer transition-colors" aria-label="Close">
          <X size={13} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-[10px] flex items-center justify-center" style={{ background: "#FDF4DB", color: "#A16207" }}>
            <RefreshCw size={18} />
          </div>
          <div>
            <h3 className="font-semibold text-[#18181B] text-base">Restore Sticker</h3>
            <p className="text-xs text-[#71717A] font-medium">Bring back a deleted sticker with its recovery code</p>
          </div>
        </div>

        <form onSubmit={handleRestore} className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-[#71717A] uppercase tracking-wider mb-1.5">Sticker ID *</label>
            <input type="text" required placeholder="the sticker's id" value={targetId} onChange={(e) => setTargetId(e.target.value)} className="w-full px-4 py-2.5 text-sm font-semibold text-[#18181B] bg-[#F8F8F7] border border-[#E5E7EB] rounded-[8px] outline-none focus:border-[#F5C518] focus:ring-[3px] focus:ring-[#F5C518]/[0.35] font-mono transition-all" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#71717A] uppercase tracking-wider mb-1.5">Recovery Code *</label>
            <input type="text" required placeholder="printed on the physical sticker" value={recoveryCode} onChange={(e) => setRecoveryCode(e.target.value)} className="w-full px-4 py-2.5 text-sm font-semibold text-[#18181B] bg-[#F8F8F7] border border-[#E5E7EB] rounded-[8px] outline-none focus:border-[#F5C518] focus:ring-[3px] focus:ring-[#F5C518]/[0.35] uppercase font-mono tracking-wider transition-all" />
          </div>
          {error && <p className="text-xs font-semibold text-[#EF4444]">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={handleClose} className="ac-btn ac-btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={submitting} className="ac-btn ac-btn-accent flex-1 disabled:opacity-60">
              <RefreshCw size={12} /> {submitting ? "Restoring…" : "Restore"}
            </button>
          </div>
        </form>
      </div>
      <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.94) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
    </div>
  );
}

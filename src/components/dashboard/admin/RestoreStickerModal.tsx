import type React from "react";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { QrRecord } from "./types";
import { qrFullUrl } from "./helpers";
import { apiClient } from "../../../lib/apiClient";
import { FxModal } from "../shared";

function recordFromPublicQr(data: any, recoveryCode: string): QrRecord {
  return {
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
    recoveryCode,
  };
}

export default function RestoreStickerModal({
  isOpen, onClose, setQrList, openQuickLook, setToast,
}: {
  isOpen: boolean; onClose: () => void;
  setQrList: React.Dispatch<React.SetStateAction<QrRecord[]>>;
  openQuickLook: (q: QrRecord) => void;
  setToast: (msg: string | null) => void;
}) {
  // v1 stickers need both the id and its code (independent random values —
  // see stickerCrypto.js). v2 stickers only need the code: the id is
  // deterministically derivable from it, so the server looks it up with no
  // id from the caller at all — see QrModel.recoverByCodeV2.
  const [mode, setMode] = useState<"id-and-code" | "code-only">("id-and-code");
  const [targetId, setTargetId] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    setTargetId(""); setRecoveryCode(""); setError(null); setMode("id-and-code");
    onClose();
  };

  const handleRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = recoveryCode.trim();
    if (!cleanCode) return;
    if (mode === "id-and-code" && !targetId.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      let rec: QrRecord;
      let restoredId: string;

      if (mode === "code-only") {
        const res = await apiClient.qr.recoverByCode(cleanCode);
        if (!res?.success || !res.data) {
          setError(res?.error || "No sticker found with that recovery code.");
          return;
        }
        rec = recordFromPublicQr(res.data, cleanCode);
        restoredId = rec.id;
      } else {
        const cleanId = targetId.trim();
        const res = await apiClient.qr.restoreQrCode(cleanId, cleanCode);
        if (!res?.success || !res.data) {
          setError(res?.error || "No sticker found with that ID and recovery code.");
          return;
        }
        rec = recordFromPublicQr(res.data, cleanCode);
        restoredId = cleanId;
      }

      setQrList((prev) => [rec, ...prev.filter((q) => q.id !== rec.id)]);
      setToast(`Sticker ${restoredId} restored`);
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
    <FxModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Restore Sticker"
      icon={<RefreshCw size={18} />}
      iconTone="accent"
      size="md"
    >
      <p className="text-xs text-[var(--fx-ink-2)] font-medium -mt-2 mb-4">Bring back a deleted sticker with its recovery code</p>

      <form onSubmit={handleRestore} className="space-y-3">
        {mode === "id-and-code" && (
          <div>
            <label className="block text-[10px] font-bold text-[var(--fx-ink-2)] uppercase tracking-wider mb-1.5">Sticker ID *</label>
            <input type="text" required placeholder="the sticker's id" value={targetId} onChange={(e) => setTargetId(e.target.value)} className="fx-input font-mono" />
          </div>
        )}
        <div>
          <label className="block text-[10px] font-bold text-[var(--fx-ink-2)] uppercase tracking-wider mb-1.5">Recovery Code *</label>
          <input type="text" required placeholder="printed on the physical sticker" value={recoveryCode} onChange={(e) => setRecoveryCode(e.target.value)} className="fx-input uppercase font-mono tracking-wider" />
        </div>

        <button
          type="button"
          onClick={() => { setMode((m) => (m === "id-and-code" ? "code-only" : "id-and-code")); setError(null); }}
          className="text-[11px] font-semibold text-[var(--fx-accent-ink)] hover:underline cursor-pointer"
        >
          {mode === "id-and-code" ? "I only have the recovery code, not the ID" : "I have the sticker ID too"}
        </button>

        {error && <p className="text-xs font-semibold text-[var(--fx-red)]">{error}</p>}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={handleClose} className="fx-btn fx-btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={submitting} className="fx-btn fx-btn-primary flex-1 disabled:opacity-60">
            <RefreshCw size={12} /> {submitting ? "Restoring…" : "Restore"}
          </button>
        </div>
      </form>
    </FxModal>
  );
}

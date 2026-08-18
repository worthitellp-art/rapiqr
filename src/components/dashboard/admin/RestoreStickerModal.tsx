import type React from "react";
import { useState } from "react";
import { RefreshCw, X } from "lucide-react";
import { QrRecord } from "./types";
import { qrFullUrl } from "./helpers";
import { saveQrCodeToDb } from "../../../lib/supabaseService";

export default function RestoreStickerModal({
  isOpen, onClose, qrList, setQrList, templates, openQuickLook, setToast,
}: {
  isOpen: boolean; onClose: () => void;
  qrList: QrRecord[]; setQrList: React.Dispatch<React.SetStateAction<QrRecord[]>>;
  templates: { name: string; fg: string; bg: string }[]; openQuickLook: (q: QrRecord) => void;
  setToast: (msg: string | null) => void;
}) {
  const [targetId, setTargetId] = useState("");
  const [vehicleName, setVehicleName] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");

  if (!isOpen) return null;

  const handleRestore = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = targetId.trim().toUpperCase();
    if (!cleanId) return;

    const existing = qrList.find((q) => q.id.toUpperCase() === cleanId || (q.clientId && q.clientId.toUpperCase() === cleanId));
    if (existing) {
      setToast(`Found active sticker ${existing.id}`); setTimeout(() => setToast(null), 2500);
      onClose(); openQuickLook(existing); return;
    }

    const defTpl = templates[0] || { name: "Default", fg: "EAB308", bg: "FFFFFF" };
    const rec: QrRecord = {
      id: cleanId,
      qrUrl: qrFullUrl(cleanId),
      clientId: cleanId.startsWith("CL") ? cleanId : `CL${cleanId.replace(/^QR/, "")}`,
      vehicleName: vehicleName.trim() || `Restored Sticker (${cleanId})`,
      vehicleNumber: vehicleNumber.trim() || `RE-${cleanId.slice(-4)}`,
      createdAt: new Date().toISOString(),
      scans: 0,
      status: "inactive",
      template: defTpl.name || "Default",
      category: "car",
      fg: defTpl.fg || "EAB308",
      bg: defTpl.bg || "FFFFFF",
    };

    setQrList((prev) => [rec, ...prev]);
    saveQrCodeToDb({ id: rec.id, clientId: rec.clientId, status: rec.status, templateName: rec.template, category: rec.category, fgColor: rec.fg, bgColor: rec.bg });
    setToast(`Sticker ${cleanId} restored!`);
    setTimeout(() => setToast(null), 3000);
    onClose(); openQuickLook(rec);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" style={{ background: "rgba(10,10,20,0.6)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div className="bg-white shadow-[0_1px_4px_rgba(0,0,0,0.03)] w-full max-w-md p-6 text-[#17181A] border border-[#E5E5E7] relative" style={{ animation: "modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)" }} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-5 right-5 w-7 h-7 rounded-[4px] bg-[#F3F3F4] flex items-center justify-center text-[#777B80] hover:bg-[#E5E5E7] hover:text-[#17181A] cursor-pointer">
          <X size={13} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-[4px] flex items-center justify-center" style={{ background: "#E8EDFF", color: "var(--accent)" }}>
            <RefreshCw size={18} />
          </div>
          <div>
            <h3 className="font-semibold text-[#17181A] text-base">Restore Sticker</h3>
            <p className="text-xs text-[#777B80] font-semibold">Recreate a QR sticker using its ID</p>
          </div>
        </div>

        <form onSubmit={handleRestore} className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-[#777B80] uppercase tracking-wider mb-1.5">Sticker ID or QR Code *</label>
            <input type="text" required placeholder="e.g. QR8A3F or CLCXTF2" value={targetId} onChange={(e) => setTargetId(e.target.value)} className="w-full px-4 py-2.5 text-sm font-semibold text-[#17181A] bg-[#F7F7F8] border border-[#E5E5E7] rounded-[4px] outline-none focus:border-[#5C78DF] uppercase font-mono transition-all" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#777B80] uppercase tracking-wider mb-1.5">Vehicle / Item Name (optional)</label>
            <input type="text" placeholder="e.g. Tesla Model 3" value={vehicleName} onChange={(e) => setVehicleName(e.target.value)} className="w-full px-4 py-2.5 text-sm font-semibold text-[#17181A] bg-[#F7F7F8] border border-[#E5E5E7] rounded-[4px] outline-none focus:border-[#5C78DF] transition-all" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#777B80] uppercase tracking-wider mb-1.5">Vehicle Reg Number (optional)</label>
            <input type="text" placeholder="e.g. MH01AB1234" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} className="w-full px-4 py-2.5 text-sm font-semibold text-[#17181A] bg-[#F7F7F8] border border-[#E5E5E7] rounded-[4px] outline-none focus:border-[#5C78DF] uppercase transition-all" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-[4px] border border-[#E5E5E7] text-xs font-semibold text-[#777B80] hover:bg-[#F3F3F4] hover:text-[#17181A] transition-all cursor-pointer">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 rounded-[4px] text-xs font-semibold text-white transition-all hover:opacity-90 flex items-center justify-center gap-1.5 cursor-pointer" style={{ background: "var(--accent)" }}>
              <RefreshCw size={12} /> Restore
            </button>
          </div>
        </form>
      </div>
      <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.94) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
    </div>
  );
}

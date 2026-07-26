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
      clientId: cleanId.startsWith("CL-") ? cleanId : `CL-${cleanId.replace(/^QR-/, "")}`,
      vehicleName: vehicleName.trim() || `Restored Sticker (${cleanId})`,
      vehicleNumber: vehicleNumber.trim() || `RE-${cleanId.slice(-4)}`,
      createdAt: new Date().toISOString(),
      scans: 0,
      status: "inactive",
      template: defTpl.name || "Default",
      fg: defTpl.fg || "EAB308",
      bg: defTpl.bg || "FFFFFF",
    };

    setQrList((prev) => [rec, ...prev]);
    saveQrCodeToDb({ id: rec.id, clientId: rec.clientId, status: rec.status, templateName: rec.template, fgColor: rec.fg, bgColor: rec.bg });
    setToast(`Sticker ${cleanId} restored!`);
    setTimeout(() => setToast(null), 3000);
    onClose(); openQuickLook(rec);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" style={{ background: "rgba(10,10,20,0.6)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 text-gray-900 border border-gray-100 relative" style={{ animation: "modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)" }} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-5 right-5 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 cursor-pointer">
          <X size={13} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(234,179,8,0.12)", color: "var(--accent)" }}>
            <RefreshCw size={18} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-base">Restore Sticker</h3>
            <p className="text-xs text-gray-500 font-semibold">Recreate a QR sticker using its ID</p>
          </div>
        </div>

        <form onSubmit={handleRestore} className="space-y-3">
          <div>
            <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">Sticker ID or QR Code *</label>
            <input type="text" required placeholder="e.g. QR-8A3F or CL-CXTF2" value={targetId} onChange={(e) => setTargetId(e.target.value)} className="w-full px-4 py-2.5 text-sm font-semibold text-gray-900 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-gray-400 uppercase font-mono transition-all" />
          </div>
          <div>
            <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">Vehicle / Item Name (optional)</label>
            <input type="text" placeholder="e.g. Tesla Model 3" value={vehicleName} onChange={(e) => setVehicleName(e.target.value)} className="w-full px-4 py-2.5 text-sm font-semibold text-gray-900 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-gray-400 transition-all" />
          </div>
          <div>
            <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">Vehicle Reg Number (optional)</label>
            <input type="text" placeholder="e.g. MH01AB1234" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} className="w-full px-4 py-2.5 text-sm font-semibold text-gray-900 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-gray-400 uppercase transition-all" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all cursor-pointer">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm" style={{ background: "var(--accent)" }}>
              <RefreshCw size={12} /> Restore
            </button>
          </div>
        </form>
      </div>
      <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.94) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
    </div>
  );
}

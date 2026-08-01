import { X, ShieldCheck, Download } from "lucide-react";
import StatusPill from "./StatusPill";
import CopyLinkButton from "./CopyLinkButton";
import StickerThumb from "./StickerThumb";
import { QrRecord, Template, StickerPos } from "./types";
import { qrImageUrl, qrFullUrl, fmtDate, dispatchActivationToUserDashboard, compositeQrOnSticker } from "./helpers";
import { saveStickerImageToDb } from "../../../lib/supabaseService";

export default function QuickLookModal({
  qr, onClose, stickerPos, templates,
}: {
  qr: QrRecord | null; onClose: () => void; stickerPos: StickerPos; templates: Template[];
}) {
  if (!qr) return null;

  const activeTpl = templates.find((t) => t.name === qr.template);
  const dlPos = activeTpl?.stickerPos || stickerPos;

  async function handleDownload() {
    const qrDataUrl = await new Promise<string>((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        c.getContext("2d")!.drawImage(img, 0, 0);
        resolve(c.toDataURL("image/png"));
      };
      img.src = qrImageUrl(qrFullUrl(qr.id), qr?.fg || "EAB308", qr?.bg || "FFFFFF", 512);
    });
    const blob = await compositeQrOnSticker(qrDataUrl, dlPos);
    if (blob) {
      saveStickerImageToDb(qr.id, blob);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${qr.id}-sticker.avif`;
      a.click();
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(10,10,20,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden text-gray-900 border border-gray-100"
        style={{ animation: "modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5">
          <span className="text-[10px] font-extrabold text-gray-500 tracking-[0.12em]">QUICK LOOK</span>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-all cursor-pointer">
            <X size={13} />
          </button>
        </div>

        <div className="flex flex-col items-center px-6 pt-4 pb-6">
          <div className="p-4 rounded-2xl" style={{ background: "rgba(234,179,8,0.08)" }}>
            <StickerThumb qr={qr} templates={templates} size={190} />
          </div>

          <p className="font-mono font-black text-gray-900 text-lg mt-4 tracking-tight">{qr.id}</p>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mt-0.5">QR Sticker Code</p>

          <div className="flex flex-wrap gap-1.5 justify-center mt-3">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">{qr.template}</span>
            <StatusPill status={qr.status} />
          </div>

          <div className="w-full mt-4 p-3 rounded-2xl flex items-center justify-between" style={{ background: "rgba(180,83,9,0.08)", border: "1px solid rgba(180,83,9,0.2)" }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(180,83,9,0.15)", color: "#92400e" }}>
                <ShieldCheck size={15} />
              </div>
              <div>
                <p className="text-[9px] font-extrabold text-amber-800 uppercase tracking-wider">Activation Code</p>
                <p className="font-mono font-black text-amber-950 text-sm">{qr.activationCode || "ACT?????"}</p>
              </div>
            </div>
            <button
              onClick={() => dispatchActivationToUserDashboard(qr)}
              className="px-3 py-1.5 rounded-xl text-white text-[10px] font-bold shadow-sm transition-all hover:opacity-90 cursor-pointer"
              style={{ background: "#111111" }}
            >
              Send to User
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5 w-full mt-4">
            <div className="bg-gray-50 rounded-xl px-3 py-2.5 text-center border border-gray-100">
              <p className="text-[10px] font-bold text-gray-500 uppercase">Scans</p>
              <p className="font-black text-gray-900 text-sm mt-0.5">{qr.scans}</p>
            </div>
            <div className="bg-gray-50 rounded-xl px-3 py-2.5 text-center border border-gray-100">
              <p className="text-[10px] font-bold text-gray-500 uppercase">Created</p>
              <p className="font-bold text-gray-900 text-xs mt-0.5">{fmtDate(qr.createdAt)}</p>
            </div>
          </div>

          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold mt-4 transition-all hover:opacity-90 active:scale-[0.98] cursor-pointer shadow-sm"
            style={{ background: "var(--accent)" }}
          >
            <Download size={13} /> Download Sticker
          </button>
          <div className="w-full mt-2">
            <CopyLinkButton qrId={qr.id} />
          </div>
        </div>
      </div>
      <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.94) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
    </div>
  );
}

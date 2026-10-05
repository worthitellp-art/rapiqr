import { useState } from "react";
import QRCode from "qrcode";
import { getCategoryLabel } from "../../../stickerModules";
import { stickerRef, useCodesRevealed } from "../../../lib/codeVisibility";
import { X, Printer, Download } from "lucide-react";
import CopyLinkButton from "./CopyLinkButton";
import { QrRecord, Template, StickerPos } from "./types";
import { MaskedCodeDisplay, CodeVisibilityToggleButton } from "./StickerCodeComponents";
import StickerMockupView from "./StickerMockupView";
import { qrFullUrl } from "./helpers";
import LabelBadge from "./labels/LabelBadge";

interface QuickLookModalProps {
  qr: QrRecord | null;
  onClose: () => void;
  stickerPos?: StickerPos;
  templates?: Template[];
  onOpenPrintSheet?: (qr: QrRecord) => void;
}

export default function QuickLookModal({
  qr,
  onClose,
  stickerPos,
  onOpenPrintSheet,
}: QuickLookModalProps) {
  const [isCodesRevealed, setIsCodesRevealed] = useCodesRevealed();
  // Only the first 2 view options: Sticker ("physical") and QR Code ("qr")
  const [viewMode, setViewMode] = useState<"physical" | "qr">("physical");

  if (!qr) return null;

  const displayCode = stickerRef(qr, isCodesRevealed, getCategoryLabel((qr.category || "car") as any));
  const displayLabel = qr.vehicleName ? `${qr.vehicleName}` : "FLEET TAG CODE";

  // Rendered locally — the sticker URL is never sent to a third-party QR service.
  const handleDownloadQr = async () => {
    const url = await QRCode.toDataURL(qrFullUrl(qr.id), { width: 500, margin: 2 });
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapiqr-${qr.id}.png`;
    a.click();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(16, 24, 40, 0.55)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="bg-white border border-gray-200/90 w-full max-w-md rounded-xl overflow-hidden text-gray-900 relative font-body shadow-[0_20px_50px_rgba(0,0,0,0.18)]"
        style={{ animation: "modalIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-white">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
              <h3 className="text-sm font-semibold text-gray-900 truncate tracking-tight">{displayLabel}</h3>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
              <span className="font-mono text-[11px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium inline-block">
                {displayCode}
              </span>
              {qr.labelName && (
                <LabelBadge name={qr.labelName} color={qr.labelColor} size="xs" />
              )}
              {qr.isPrinted && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-1.5 py-0.5 rounded-full">
                  <Printer size={10} /> Printed
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors cursor-pointer ml-3 flex-shrink-0"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* View Mode Segmented Tabs — First 2 View Options Only */}
        <div className="px-5 py-2.5 bg-gray-50/70 border-b border-gray-100 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">View Mode</span>
          <div className="inline-flex bg-gray-200/60 p-0.5 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => setViewMode("physical")}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "physical"
                  ? "bg-white text-gray-900 shadow-2xs"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Sticker
            </button>
            <button
              type="button"
              onClick={() => setViewMode("qr")}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "qr"
                  ? "bg-white text-gray-900 shadow-2xs"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              QR Code
            </button>
          </div>
        </div>

        {/* Preview Container */}
        <div className="p-4 bg-gray-50/40">
          <StickerMockupView qr={qr} mode={viewMode} stickerPos={stickerPos} />
        </div>

        {/* Bottom Details & Controls */}
        <div className="px-5 pb-5 pt-1 space-y-3">
          {/* Security Codes Box */}
          <div className="p-3 bg-gray-50/80 border border-gray-200/80 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Security Codes
              </span>
              <CodeVisibilityToggleButton
                isRevealed={isCodesRevealed}
                onToggleVisibility={() => setIsCodesRevealed(!isCodesRevealed)}
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-gray-200/60">
              <span className="text-[11px] text-gray-600 font-medium">Unique ID</span>
              <MaskedCodeDisplay
                codeValue={qr.id}
                isRevealed={isCodesRevealed}
                maskedLength={14}
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-gray-200/60">
              <span className="text-[11px] text-gray-600 font-medium">Recovery Code</span>
              <MaskedCodeDisplay
                codeValue={qr.recoveryCode || ""}
                isRevealed={isCodesRevealed}
                maskedLength={10}
                highlightAccent={true}
                fallbackText="—"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <CopyLinkButton qrId={qr.id} />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadQr}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 text-xs font-semibold hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-2xs cursor-pointer active:scale-95"
                title="Download high-resolution QR image"
              >
                <Download size={13} />
                <span>Download QR</span>
              </button>

              {onOpenPrintSheet && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPrintSheet(qr);
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition-colors shadow-2xs cursor-pointer active:scale-95"
                  title="Print this sticker"
                >
                  <Printer size={13} />
                  <span>Print</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes modalIn { from { opacity: 0; transform: scale(0.96) translateY(4px); } to { opacity: 1; transform: scale(1) translateY(0); } }`}</style>
    </div>
  );
}

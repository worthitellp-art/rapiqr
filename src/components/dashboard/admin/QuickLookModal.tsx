import { useState } from "react";
import { X, Printer, Sparkles, QrCode, Car, Download } from "lucide-react";
import CopyLinkButton from "./CopyLinkButton";
import { QrRecord, Template, StickerPos } from "./types";
import { MaskedCodeDisplay, CodeVisibilityToggleButton } from "./StickerCodeComponents";
import StickerMockupView, { StickerViewMode } from "./StickerMockupView";
import { qrFullUrl } from "./helpers";

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
  const [isCodesRevealed, setIsCodesRevealed] = useState(false);
  const [viewMode, setViewMode] = useState<StickerViewMode>("physical");

  if (!qr) return null;

  const displayCode = qr.id;
  const displayLabel = qr.vehicleName ? `${qr.vehicleName}` : "FLEET TAG CODE";

  const handleDownloadQr = () => {
    // Generate simple SVG/data download for the QR code
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qrFullUrl(qr.id))}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapiqr-${qr.id}.png`;
    a.target = "_blank";
    a.rel = "noreferrer";
    a.click();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(16, 24, 40, 0.55)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="bg-white border border-gray-200 w-full max-w-md rounded-2xl overflow-hidden text-gray-900 relative font-body shadow-[0_20px_50px_rgba(0,0,0,0.2)]"
        style={{ animation: "modalIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header & Close Button */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-sm font-bold text-gray-900">Sticker Inspector</h3>
            <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-semibold">
              {displayCode}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-gray-100 text-gray-500 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* View Mode Switcher Pills */}
        <div className="px-5 pt-3 pb-2 bg-gray-50/70 border-b border-gray-100 flex items-center justify-between">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">View Mode</span>
          <div className="inline-flex bg-gray-200/80 p-0.5 rounded-lg text-xs font-semibold text-gray-600">
            <button
              type="button"
              onClick={() => setViewMode("physical")}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === "physical"
                  ? "bg-white text-gray-900 shadow-xs font-bold"
                  : "hover:text-gray-900"
              }`}
            >
              <Sparkles size={12} className={viewMode === "physical" ? "text-amber-500" : ""} />
              <span>Sticker</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("qr")}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === "qr"
                  ? "bg-white text-gray-900 shadow-xs font-bold"
                  : "hover:text-gray-900"
              }`}
            >
              <QrCode size={12} className={viewMode === "qr" ? "text-indigo-600" : ""} />
              <span>QR Code</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("windshield")}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === "windshield"
                  ? "bg-white text-gray-900 shadow-xs font-bold"
                  : "hover:text-gray-900"
              }`}
            >
              <Car size={12} className={viewMode === "windshield" ? "text-blue-500" : ""} />
              <span>Windshield</span>
            </button>
          </div>
        </div>

        {/* Preview Container */}
        <div className="p-4 bg-gray-50/40">
          <StickerMockupView qr={qr} mode={viewMode} stickerPos={stickerPos} />
        </div>

        {/* Bottom Details & Controls */}
        <div className="px-5 pb-5 pt-1 space-y-3">
          {/* Security Codes Box with See / Hide Toggle */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Security Codes
              </span>
              <CodeVisibilityToggleButton
                isRevealed={isCodesRevealed}
                onToggleVisibility={() => setIsCodesRevealed((prev) => !prev)}
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-gray-200/70">
              <span className="text-[11px] text-gray-600 font-medium">Unique ID</span>
              <MaskedCodeDisplay
                codeValue={qr.id}
                isRevealed={isCodesRevealed}
                maskedLength={14}
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-gray-200/70">
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

          <div className="space-y-2">
            <CopyLinkButton qrId={qr.id} />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadQr}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-gray-300 bg-white text-gray-800 text-xs font-bold hover:bg-gray-50 transition-colors shadow-2xs cursor-pointer"
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
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition-colors shadow-2xs cursor-pointer"
                  title="Open in 18×12 print sheet layout"
                >
                  <Printer size={13} />
                  <span>Print Sheet</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(6px); } to { opacity: 1; transform: scale(1) translateY(0); } }`}</style>
    </div>
  );
}

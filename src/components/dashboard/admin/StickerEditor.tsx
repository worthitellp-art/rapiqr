import type React from "react";
import { useState } from "react";
import { Printer, ShieldCheck, BadgeCheck } from "lucide-react";
import stickerTemplateImg from "../../../assets/template-sticker.jpeg";
import QrCodeImage from "./QrCodeImage";
import { StickerPos } from "./types";
import PrintSheetModal from "./PrintSheetModal";

const STICKER_SRC = stickerTemplateImg;
const EDITOR_DISPLAY = { w: 320, h: 200 };

export default function StickerEditor({
  stickerPos,
  setToast,
  openPrintSheet,
}: {
  stickerPos: StickerPos;
  setStickerPos?: (p: StickerPos) => void;
  setToast: (msg: string | null) => void;
  openPrintSheet?: () => void;
}) {
  const [isLocalPrintOpen, setIsLocalPrintOpen] = useState(false);
  const previewSize = 360;

  return (
    <div className="space-y-6 text-[var(--fx-ink)] font-body">
      <div>
        <h1 className="font-display text-[22px] font-semibold text-[var(--fx-ink)]">
          Sticker Preview
        </h1>
        <p className="text-[13px] text-[var(--fx-ink-2)] mt-1">
          The QR code is calibrated to this template automatically — placement can't drift out of position.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Locked Preview */}
        <div className="lg:col-span-7 bg-white border border-[var(--fx-border)] p-5.5 rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.05)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-[13px] font-semibold text-[var(--fx-ink)]">
              Sticker Layout
            </h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
              <BadgeCheck size={13} /> Auto-aligned
            </span>
          </div>

          <div
            className="relative mx-auto overflow-hidden select-none border-2 border-[var(--fx-ink)] rounded-lg shadow-[0_4px_12px_rgba(16,24,40,0.06)] bg-[var(--fx-canvas)]"
            style={{
              width: previewSize,
              height: Math.round(previewSize * (EDITOR_DISPLAY.h / EDITOR_DISPLAY.w)),
            }}
          >
            <img
              src={STICKER_SRC}
              draggable={false}
              className="w-full h-full object-fill pointer-events-none"
              alt="Sticker Layout"
            />
            <div
              className="absolute pointer-events-none"
              style={{
                left: Math.round(stickerPos.x * (previewSize / EDITOR_DISPLAY.w)),
                top: Math.round(stickerPos.y * (previewSize * (EDITOR_DISPLAY.h / EDITOR_DISPLAY.w) / EDITOR_DISPLAY.h)),
                width: Math.round(stickerPos.w * (previewSize / EDITOR_DISPLAY.w)),
                height: Math.round(stickerPos.h * (previewSize * (EDITOR_DISPLAY.h / EDITOR_DISPLAY.w) / EDITOR_DISPLAY.h)),
              }}
            >
              <QrCodeImage
                data="https://repiqr.com/demo"
                fg="000000"
                bg="FFFFFF"
                size={128}
                className="w-full h-full object-contain"
                alt="Black QR Code"
              />
            </div>
          </div>
        </div>

        {/* Right: Info & Print */}
        <div className="lg:col-span-5 bg-white border border-[var(--fx-border)] p-5.5 rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.05)] space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--fx-accent-soft)] text-[var(--fx-accent-ink)] flex items-center justify-center">
                <ShieldCheck size={18} />
              </div>
              <h3 className="font-display text-[13px] font-semibold text-[var(--fx-ink)]">
                Why this is locked
              </h3>
            </div>
            <p className="text-[13px] text-[var(--fx-ink-2)] leading-relaxed">
              Every sticker uses the same fixed QR slot on the template, so it always lines up perfectly when printed —
              no per-admin adjustment to get wrong or out of sync across devices.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (openPrintSheet) {
                openPrintSheet();
              } else {
                setIsLocalPrintOpen(true);
              }
            }}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg bg-[var(--fx-accent)] text-white font-bold text-[14.5px] hover:bg-[var(--fx-accent-ink)] active:scale-95 transition-all cursor-pointer shadow-sm shadow-[var(--fx-accent)]/20"
          >
            <Printer size={16} strokeWidth={2.2} /> Print Bulk QR Sheet
          </button>
        </div>
      </div>

      <PrintSheetModal
        isOpen={isLocalPrintOpen}
        onClose={() => setIsLocalPrintOpen(false)}
        availableStickers={[]}
        stickerPos={stickerPos}
        onShowToast={(msg) => {
          setToast(msg);
          setTimeout(() => setToast(null), 3500);
        }}
      />
    </div>
  );
}

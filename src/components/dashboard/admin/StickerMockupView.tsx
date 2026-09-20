import React from "react";
import { QrRecord, StickerPos } from "./types";
import { qrFullUrl } from "./helpers";
import QrCodeImage from "./QrCodeImage";
import stickerTemplateImg from "../../../assets/template-sticker.jpeg";
import { getCategoryLabel } from "../../../stickerModules";
import { Car, Shield, Sparkles, QrCode } from "lucide-react";

export type StickerViewMode = "physical" | "qr" | "windshield";

const STICKER_SRC = stickerTemplateImg;
const EDITOR_DISPLAY = { w: 320, h: 200 };
const DEFAULT_SP: StickerPos = { x: 110, y: 40, w: 100, h: 100 };

function getSavedStickerPos(): StickerPos {
  try {
    const saved = localStorage.getItem("repiqr-sticker-pos");
    if (saved) return JSON.parse(saved);
  } catch { /* fallback */ }
  return DEFAULT_SP;
}

interface StickerMockupViewProps {
  qr: QrRecord;
  mode?: StickerViewMode;
  stickerPos?: StickerPos;
  className?: string;
  showModeBadge?: boolean;
}

export default function StickerMockupView({
  qr,
  mode = "physical",
  stickerPos,
  className = "",
  showModeBadge = false,
}: StickerMockupViewProps) {
  const sp = stickerPos || getSavedStickerPos();
  const qrFg = qr.fg || "000000";
  const qrBg = qr.bg || "FFFFFF";
  const fullUrl = qrFullUrl(qr.id);
  const categoryLabel = getCategoryLabel((qr.category || "car") as any);

  const qrXPercent = (sp.x / EDITOR_DISPLAY.w) * 100;
  const qrYPercent = (sp.y / EDITOR_DISPLAY.h) * 100;
  const qrWPercent = (sp.w / EDITOR_DISPLAY.w) * 100;
  const qrHPercent = (sp.h / EDITOR_DISPLAY.h) * 100;

  // 1. Pure QR Code Mode
  if (mode === "qr") {
    return (
      <div className={`relative flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-gray-200 shadow-sm ${className}`}>
        {showModeBadge && (
          <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700">
            <QrCode size={12} />
            <span>Pure QR Code</span>
          </div>
        )}
        <div className="relative p-3 bg-white rounded-xl border border-gray-200 shadow-md">
          <QrCodeImage
            data={fullUrl}
            fg={qrFg}
            bg={qrBg}
            size={220}
            style={{ width: 200, height: 200, display: "block" }}
            alt={`QR code for ${qr.id}`}
          />
          {/* Subtle corner marks */}
          <div className="absolute top-1.5 left-1.5 w-3 h-3 border-t-2 border-l-2 border-indigo-600 rounded-tl-sm pointer-events-none" />
          <div className="absolute top-1.5 right-1.5 w-3 h-3 border-t-2 border-r-2 border-indigo-600 rounded-tr-sm pointer-events-none" />
          <div className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b-2 border-l-2 border-indigo-600 rounded-bl-sm pointer-events-none" />
          <div className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b-2 border-r-2 border-indigo-600 rounded-br-sm pointer-events-none" />
        </div>
        <div className="mt-3 text-center">
          <span className="font-mono text-xs font-bold text-gray-800 tracking-wider block">{qr.id}</span>
          <span className="text-[11px] text-gray-500 font-medium">High-resolution scannable matrix</span>
        </div>
      </div>
    );
  }

  // 2. On-Vehicle Placement Mockup Mode (Simulated Car Windshield / Glass)
  if (mode === "windshield") {
    return (
      <div className={`relative overflow-hidden rounded-2xl bg-[#111827] shadow-xl border border-gray-800 ${className}`}>
        {/* Windshield gradient & subtle glass texture */}
        <div
          className="w-full relative flex items-center justify-center p-6 sm:p-8"
          style={{
            background: "linear-gradient(145deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
            minHeight: 220,
          }}
        >
          {/* Windshield glare line */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              background: "linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.4) 45%, rgba(255,255,255,0.1) 50%, transparent 60%)",
            }}
          />

          {/* Windshield wipers / dashboard silhouette hint at bottom */}
          <div className="absolute bottom-0 inset-x-0 h-4 bg-black/40 backdrop-blur-xs border-t border-white/5 pointer-events-none" />

          {/* Sticker positioned on the glass */}
          <div
            className="relative w-full max-w-[280px] rounded-xl overflow-hidden shadow-[0_12px_36px_rgba(0,0,0,0.6),0_2px_10px_rgba(0,0,0,0.4)] border border-white/20 transition-transform duration-300 hover:scale-[1.02]"
            style={{ aspectRatio: `${EDITOR_DISPLAY.w} / ${EDITOR_DISPLAY.h}` }}
          >
            <img
              src={STICKER_SRC}
              style={{ width: "100%", height: "100%", objectFit: "fill" }}
              draggable={false}
              alt=""
            />
            <QrCodeImage
              data={fullUrl}
              fg={qrFg}
              bg={qrBg}
              size={256}
              style={{
                position: "absolute",
                left: `${qrXPercent}%`,
                top: `${qrYPercent}%`,
                width: `${qrWPercent}%`,
                height: `${qrHPercent}%`,
                objectFit: "contain",
              }}
              draggable={false}
              alt="QR code"
            />
            {/* Glass adhesive sheen */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 40%)",
              }}
            />
          </div>

          {showModeBadge && (
            <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-white backdrop-blur-md border border-white/10">
              <Car size={12} className="text-blue-400" />
              <span>Windshield Preview</span>
            </div>
          )}

          <div className="absolute bottom-2 right-3 text-[10px] text-gray-400 font-medium flex items-center gap-1">
            <span>Inside Vehicle Glass Placement</span>
          </div>
        </div>
      </div>
    );
  }

  // 3. Default: Physical Sticker Mode (Glossy Vinyl Die-Cut Look)
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-b from-gray-50 to-gray-100 p-4 sm:p-5 flex flex-col items-center justify-center border border-gray-200 shadow-sm ${className}`}>
      {showModeBadge && (
        <div className="w-full flex items-center justify-between mb-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white text-gray-700 border border-gray-200 shadow-2xs">
            <Sparkles size={12} className="text-amber-500" />
            <span>Physical Sticker</span>
          </div>
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{categoryLabel}</span>
        </div>
      )}

      {/* Die-cut sticker card with vinyl gloss and drop shadow */}
      <div
        className="relative w-full rounded-xl overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.18),0_2px_6px_rgba(0,0,0,0.12)] border border-gray-300 transition-all duration-300 hover:shadow-[0_12px_32px_rgba(0,0,0,0.22)]"
        style={{ aspectRatio: `${EDITOR_DISPLAY.w} / ${EDITOR_DISPLAY.h}` }}
      >
        <img
          src={STICKER_SRC}
          style={{ width: "100%", height: "100%", objectFit: "fill" }}
          draggable={false}
          alt=""
        />
        <QrCodeImage
          data={fullUrl}
          fg={qrFg}
          bg={qrBg}
          size={256}
          style={{
            position: "absolute",
            left: `${qrXPercent}%`,
            top: `${qrYPercent}%`,
            width: `${qrWPercent}%`,
            height: `${qrHPercent}%`,
            objectFit: "contain",
          }}
          draggable={false}
          alt="QR code"
        />
        {/* Subtle physical vinyl gloss reflection */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.05) 35%, transparent 60%)",
          }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between w-full text-[11px] text-gray-500">
        <span className="font-mono font-semibold text-gray-700">{qr.id}</span>
        <span className="inline-flex items-center gap-1 font-medium">
          <Shield size={11} className="text-emerald-600" />
          UV & Weatherproof Vinyl
        </span>
      </div>
    </div>
  );
}

import { qrImageUrl, qrFullUrl } from "./helpers";
import { QrRecord, Template, StickerPos } from "./types";
import stickerTemplateImg from "../../../assets/template-sticker.jpeg";

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

interface StickerThumbProps {
  qr: QrRecord;
  templates?: Template[];
  stickerPos?: StickerPos;
  size?: number;
  fullWidth?: boolean;
}

export default function StickerThumb({
  qr,
  stickerPos,
  size = 96,
  fullWidth = false,
}: StickerThumbProps) {
  const sp = stickerPos || getSavedStickerPos();
  const qrFg = "000000"; // Pure Black
  const qrBg = "FFFFFF"; // Pure White

  if (fullWidth) {
    const qrXPercent = (sp.x / EDITOR_DISPLAY.w) * 100;
    const qrYPercent = (sp.y / EDITOR_DISPLAY.h) * 100;
    const qrWPercent = (sp.w / EDITOR_DISPLAY.w) * 100;
    const qrHPercent = (sp.h / EDITOR_DISPLAY.h) * 100;

    return (
      <div
        className="w-full relative overflow-hidden bg-[#0A0B0F]"
        style={{ aspectRatio: `${EDITOR_DISPLAY.w} / ${EDITOR_DISPLAY.h}` }}
      >
        <img
          src={STICKER_SRC}
          style={{ width: "100%", height: "100%", objectFit: "fill" }}
          draggable={false}
          alt=""
        />
        <img
          src={qrImageUrl(qrFullUrl(qr.id), qrFg, qrBg, 256)}
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
      </div>
    );
  }

  const thumbH = Math.round(size * (EDITOR_DISPLAY.h / EDITOR_DISPLAY.w));
  const qrX = (sp.x / EDITOR_DISPLAY.w) * size;
  const qrY = (sp.y / EDITOR_DISPLAY.h) * thumbH;
  const qrW = (sp.w / EDITOR_DISPLAY.w) * size;
  const qrH = (sp.h / EDITOR_DISPLAY.h) * thumbH;

  return (
    <div
      style={{
        width: size,
        height: thumbH,
        position: "relative",
        overflow: "hidden",
        borderRadius: 8,
        flexShrink: 0,
        boxShadow: "0 4px 16px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)",
      }}
    >
      <img
        src={STICKER_SRC}
        style={{ width: "100%", height: "100%", objectFit: "fill" }}
        draggable={false}
        alt=""
      />
      <img
        src={qrImageUrl(qrFullUrl(qr.id), qrFg, qrBg, 128)}
        style={{
          position: "absolute",
          left: qrX,
          top: qrY,
          width: qrW,
          height: qrH,
          objectFit: "contain",
        }}
        draggable={false}
        alt="qr"
      />
    </div>
  );
}

import QRCode from "qrcode";
import { QrRecord, StickerPos } from "./types";
import stickerTemplateImg from "../../../assets/template-sticker.jpeg";

const STICKER_SRC = stickerTemplateImg;
const EDITOR_DISPLAY = { w: 320, h: 200 };

// Generated entirely client-side (no network call, no third-party service) —
// the exact same (data, fg, bg, size) always produces the exact same PNG data
// URL, so there is nothing to store: it can be regenerated on demand, forever,
// from just the sticker's own id and colors. Cached in memory since the admin
// fleet list can render the same QR many times per session (list + thumbnail).
const qrDataUrlCache = new Map<string, string>();

export async function generateQrDataUrl(data: string, fg: string, bg: string, size = 220): Promise<string> {
  const key = `${data}|${fg}|${bg}|${size}`;
  const cached = qrDataUrlCache.get(key);
  if (cached) return cached;

  const url = await QRCode.toDataURL(data, {
    width: size,
    margin: 1,
    color: { dark: `#${fg}`, light: `#${bg}` },
  });
  qrDataUrlCache.set(key, url);
  return url;
}


export function fmtDate(d: string) {
  try {
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return d;
  }
}

export function fmtDateTime(d: string) {
  try {
    return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return d;
  }
}

/**
 * A sticker's own id — cryptographically random (Web Crypto's CSPRNG), unlike
 * uid() below which uses Math.random() and a namespace small enough to be
 * guessable. Used directly in the QR/scan URL; the backend also mints a
 * separate hashed recovery code at creation for admin-only restore.
 */
export function generateStickerId(): string {
  return crypto.randomUUID();
}

export function uid(prefix = "QR") {
  const digits = "0123456789";
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let numPart = "";
  for (let i = 0; i < 3; i++) numPart += digits.charAt(Math.floor(Math.random() * digits.length));
  let letterPart = "";
  for (let i = 0; i < 3; i++) letterPart += letters.charAt(Math.floor(Math.random() * letters.length));
  return `${prefix}${numPart}${letterPart}`;
}

export function dispatchActivationToUserDashboard(qrItem: QrRecord) {
  if (typeof window === "undefined") return;
  try {
    const existing = JSON.parse(localStorage.getItem("repiqr-pending-activations") || localStorage.getItem("namoqr-pending-activations") || "[]");
    const filtered = existing.filter((item: QrRecord) => item.id !== qrItem.id);
    const updated = [
      {
        id: qrItem.id,
        vehicleName: qrItem.vehicleName || "Unassigned QR Sticker",
        vehicleNumber: qrItem.vehicleNumber || "PENDING",
        status: "pending_activation",
        createdAt: new Date().toISOString(),
        template: qrItem.template || "Default",
        category: qrItem.category || "car",
      },
      ...filtered,
    ];
    localStorage.setItem("repiqr-pending-activations", JSON.stringify(updated));
    localStorage.setItem("namoqr-pending-activations", JSON.stringify(updated));
    window.dispatchEvent(new Event("repiqr-pending-activations-updated"));
    window.dispatchEvent(new Event("namoqr-pending-activations-updated"));
  } catch (err) {
    console.error("Error dispatching activation code:", err);
  }
}

export function getQrBaseUrl() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "https://repiqr.linkspace-service.workers.dev";
}

export function qrFullUrl(qrId: string) {
  return `${getQrBaseUrl()}/${qrId}`;
}

/**
 * Composite the QR code onto the sticker template image as a canvas Blob.
 */
export async function compositeQrOnSticker(qrDataUrl: string, pos: StickerPos): Promise<Blob | null> {
  return new Promise((resolve) => {
    const sticker = new Image();
    sticker.crossOrigin = "anonymous";
    sticker.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = sticker.naturalWidth;
      canvas.height = sticker.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(null);
      ctx.drawImage(sticker, 0, 0);
      const scaleX = sticker.naturalWidth / EDITOR_DISPLAY.w;
      const scaleY = sticker.naturalHeight / EDITOR_DISPLAY.h;
      const qr = new Image();
      qr.crossOrigin = "anonymous";
      qr.onload = () => {
        ctx.drawImage(qr, pos.x * scaleX, pos.y * scaleY, pos.w * scaleX, pos.h * scaleY);
        canvas.toBlob((avifBlob) => {
          if (avifBlob && avifBlob.type === "image/avif") resolve(avifBlob);
          else canvas.toBlob((pngBlob) => resolve(pngBlob), "image/png");
        }, "image/avif", 0.95);
      };
      qr.onerror = () => resolve(null);
      qr.src = qrDataUrl;
    };
    sticker.onerror = () => resolve(null);
    sticker.src = STICKER_SRC;
  });
}

/**
 * Generate the composed sticker image for a QR record entirely client-side.
 * Nothing is uploaded or persisted — every input (id, colors, template
 * placement) is already in the sticker record, so this can be called again
 * at any time (list rendering, print export, "restore") and always produces
 * the identical result.
 */
export async function generateStickerBlob(rec: QrRecord, pos: StickerPos): Promise<Blob | null> {
  try {
    const qrDataUrl = await generateQrDataUrl(qrFullUrl(rec.id), rec.fg || "EAB308", rec.bg || "FFFFFF", 512);
    return await compositeQrOnSticker(qrDataUrl, pos);
  } catch (err) {
    console.warn("Failed to generate sticker image:", err);
    return null;
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// The sticker template is one shared image reused across every cell of every
// sheet — loaded once and cached, rather than once per sticker per sheet.
let stickerTemplateImgPromise: Promise<HTMLImageElement> | null = null;
function loadStickerTemplateImage(): Promise<HTMLImageElement> {
  if (!stickerTemplateImgPromise) stickerTemplateImgPromise = loadImage(STICKER_SRC);
  return stickerTemplateImgPromise;
}

export interface SheetOptions {
  dpi?: number;
  sheetWidthIn?: number;
  sheetHeightIn?: number;
  marginIn?: number;
  gapIn?: number;
  cols?: number;
  rows?: number;
}

/**
 * Print-ready sheet export: tiles selected stickers (each with its own QR
 * code baked in, at its own colors) onto one 18x12in canvas at 300 DPI in a
 * 3x3 grid, with trim-guide lines through the gaps and corner crop marks —
 * the same layout as a print shop's cut sheet. More than 9 records split
 * across additional sheets (cols*rows per sheet); a partial final sheet just
 * leaves its remaining cells blank.
 */
export async function generateSheetBlobs(
  records: QrRecord[],
  pos: StickerPos,
  opts: SheetOptions = {}
): Promise<Blob[]> {
  const {
    dpi = 300,
    sheetWidthIn = 18,
    sheetHeightIn = 12,
    marginIn = 0.25,
    gapIn = 0.2,
    cols = 3,
    rows = 3,
  } = opts;

  if (records.length === 0) return [];

  const stickerImg = await loadStickerTemplateImage();
  const sr = stickerImg.naturalWidth / stickerImg.naturalHeight;

  const sheetW = Math.round(sheetWidthIn * dpi);
  const sheetH = Math.round(sheetHeightIn * dpi);
  const margin = Math.round(marginIn * dpi);
  const gap = Math.round(gapIn * dpi);

  // Max cell width under both the width and height budgets, preserving the
  // sticker's exact aspect ratio (no stretching) — same math used to build
  // the reference 18x12 export.
  const budgetW = sheetW - 2 * margin;
  const budgetH = sheetH - 2 * margin;
  const wFromWidth = (budgetW - (cols - 1) * gap) / cols;
  const wFromHeight = (sr * (budgetH - (rows - 1) * gap)) / rows;
  const cellW = Math.floor(Math.min(wFromWidth, wFromHeight));
  const cellH = Math.round(cellW / sr);

  const gridW = cols * cellW + (cols - 1) * gap;
  const gridH = rows * cellH + (rows - 1) * gap;
  const originX = Math.round((sheetW - gridW) / 2);
  const originY = Math.round((sheetH - gridH) / 2);

  const cellX = Array.from({ length: cols }, (_, c) => originX + c * (cellW + gap));
  const cellY = Array.from({ length: rows }, (_, r) => originY + r * (cellH + gap));

  // pos (x/y/w/h) is authored against the 320x200 editor reference frame —
  // scale it into this sheet's actual cell pixel size, same as compositeQrOnSticker.
  const scaleX = cellW / EDITOR_DISPLAY.w;
  const scaleY = cellH / EDITOR_DISPLAY.h;

  const perSheet = cols * rows;
  const sheets: Blob[] = [];

  for (let s = 0; s * perSheet < records.length; s++) {
    const chunk = records.slice(s * perSheet, s * perSheet + perSheet);

    const canvas = document.createElement("canvas");
    canvas.width = sheetW;
    canvas.height = sheetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, sheetW, sheetH);

    for (let i = 0; i < chunk.length; i++) {
      const rec = chunk[i];
      const r = Math.floor(i / cols);
      const c = i % cols;
      const cx = cellX[c];
      const cy = cellY[r];

      ctx.drawImage(stickerImg, cx, cy, cellW, cellH);

      const qrDataUrl = await generateQrDataUrl(qrFullUrl(rec.id), rec.fg || "000000", rec.bg || "FFFFFF", 512);
      const qrImg = await loadImage(qrDataUrl);
      ctx.drawImage(qrImg, cx + pos.x * scaleX, cy + pos.y * scaleY, pos.w * scaleX, pos.h * scaleY);
    }

    // Trim-guide lines through each internal gap, running the full sheet length.
    ctx.strokeStyle = "rgba(150,150,150,0.9)";
    ctx.lineWidth = Math.max(1, Math.round((0.75 / 72) * dpi));
    for (let c = 1; c < cols; c++) {
      const x = cellX[c - 1] + cellW + gap / 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, sheetH);
      ctx.stroke();
    }
    for (let r = 1; r < rows; r++) {
      const y = cellY[r - 1] + cellH + gap / 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(sheetW, y);
      ctx.stroke();
    }

    // Corner crop marks on every cell.
    const markLen = Math.round(0.12 * dpi);
    ctx.strokeStyle = "rgba(60,60,60,0.9)";
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const corners = [
          [cellX[c], cellY[r]],
          [cellX[c] + cellW, cellY[r]],
          [cellX[c], cellY[r] + cellH],
          [cellX[c] + cellW, cellY[r] + cellH],
        ];
        for (const [cxp, cyp] of corners) {
          ctx.beginPath();
          ctx.moveTo(cxp - markLen, cyp);
          ctx.lineTo(cxp + markLen, cyp);
          ctx.moveTo(cxp, cyp - markLen);
          ctx.lineTo(cxp, cyp + markLen);
          ctx.stroke();
        }
      }
    }

    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (blob) sheets.push(blob);
  }

  return sheets;
}

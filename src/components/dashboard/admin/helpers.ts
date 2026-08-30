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

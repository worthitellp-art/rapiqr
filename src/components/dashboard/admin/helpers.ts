import { QrRecord, StickerPos } from "./types";
import { saveStickerImageToDb } from "../../../lib/supabaseService";
import stickerTemplateImg from "../../../assets/template-sticker.jpeg";

const STICKER_SRC = stickerTemplateImg;
const EDITOR_DISPLAY = { w: 320, h: 200 };

export function qrImageUrl(data: string, fg: string, bg: string, size = 220) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&color=${fg}&bgcolor=${bg}&qzone=1`;
}

export function avatarUrl(seed: string) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=eef2ff,fce7f3,dbeafe,fef3c7`;
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

export function generateActivationCode(): string {
  const digits = "0123456789";
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let numPart = "";
  for (let i = 0; i < 4; i++) numPart += digits.charAt(Math.floor(Math.random() * digits.length));
  let letterPart = "";
  for (let i = 0; i < 3; i++) letterPart += letters.charAt(Math.floor(Math.random() * letters.length));
  return `ACT${numPart}${letterPart}`;
}

export function dispatchActivationToUserDashboard(qrItem: QrRecord) {
  if (typeof window === "undefined") return;
  try {
    const existing = JSON.parse(localStorage.getItem("namoqr-pending-activations") || "[]");
    const filtered = existing.filter((item: QrRecord) => item.id !== qrItem.id);
    const updated = [
      {
        id: qrItem.id,
        activationCode: qrItem.id,
        vehicleName: qrItem.vehicleName || "Unassigned QR Sticker",
        vehicleNumber: qrItem.vehicleNumber || "PENDING",
        status: "pending_activation",
        createdAt: new Date().toISOString(),
        template: qrItem.template || "Default",
        category: qrItem.category || "car",
      },
      ...filtered,
    ];
    localStorage.setItem("namoqr-pending-activations", JSON.stringify(updated));
    window.dispatchEvent(new Event("namoqr-pending-activations-updated"));
  } catch (err) {
    console.error("Error dispatching activation code:", err);
  }
}

export function getQrBaseUrl() {
  if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
  return "https://namoqr.linkspace-service.workers.dev";
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
 * Generate the composed sticker image for a QR record and persist it to Supabase
 * (uploads to the Stickers bucket + stores the public URL on the qr_codes row).
 */
export async function saveGeneratedSticker(rec: QrRecord, pos: StickerPos) {
  try {
    const qrDataUrl = await new Promise<string | null>((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        c.getContext("2d")!.drawImage(img, 0, 0);
        resolve(c.toDataURL("image/png"));
      };
      img.onerror = () => resolve(null);
      img.src = qrImageUrl(qrFullUrl(rec.id), rec.fg || "EAB308", rec.bg || "FFFFFF", 512);
    });
    if (!qrDataUrl) return null;
    const blob = await compositeQrOnSticker(qrDataUrl, pos);
    if (!blob) return null;
    return await saveStickerImageToDb(rec.id, blob);
  } catch (err) {
    console.warn("Failed to save generated sticker image:", err);
    return null;
  }
}

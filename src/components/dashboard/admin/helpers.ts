import QrCodeWithLogo from "qrcode-with-logos";
import { QrRecord, StickerPos } from "./types";
import stickerTemplateImg from "../../../assets/template-sticker.jpeg";
import repiqrWordmark from "../../../assets/repiqr-wordmark.png";

const STICKER_SRC = stickerTemplateImg;
const EDITOR_DISPLAY = { w: 320, h: 200 };

/**
 * THE QR slot on the sticker template, in the 320x200 editor space (1 unit =
 * 4.8px of the 1536x960 template). It is a fixed constant — nothing saves or
 * overrides it, so previews, PNG downloads and PDFs always agree.
 *
 * Measured from src/assets/template-sticker.jpeg: the white panel is 452x452px
 * at (932, 224) with ~45px rounded corners, centred on (1157.5, 449.5); the
 * sample QR baked into the artwork spans x 970-1350, y 258-638. The QR image is
 * 422.4px square at (947, 238): centred on the panel within 1px, covers the
 * whole sample QR with 20px+ to spare, and its white corners stay inside the
 * rounded panel. If the template artwork changes, re-measure and update this.
 */
export const DEFAULT_STICKER_POS: StickerPos = { x: 197.3, y: 49.6, w: 88, h: 88 };

const qrDataUrlCache = new Map<string, string>();

/**
 * Generates a QR code with the exact RepiQR wordmark embedded in the center,
 * so a scanned/printed code is recognizable as a RepiQR tag at a glance.
 * errorCorrectionLevel "H" (~30% recoverable) keeps it scannable with the logo
 * covering the middle.
 */
export async function generateQrDataUrl(data: string, fg: string, bg: string, size = 220): Promise<string> {
  const key = `${data}|${fg}|${bg}|${size}|logo`;
  const cached = qrDataUrlCache.get(key);
  if (cached) return cached;

  const qrInstance = new QrCodeWithLogo({
    content: data,
    width: size,
    nodeQrCodeOptions: {
      margin: 1,
      errorCorrectionLevel: "H",
      color: { dark: `#${fg}`, light: `#${bg}` },
    },
    logo: {
      src: repiqrWordmark,
      bgColor: `#${bg}`,
      borderRadius: Math.round(size * 0.04),
      borderWidth: Math.round(size * 0.025),
    },
  });

  const image = await qrInstance.getImage();
  const url = image.src;
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

// Sticker ids and recovery codes are no longer generated client-side — the
// server derives the id FROM a server-generated recovery code (id-scheme v2,
// HMAC-SHA256; see Server/services/stickerCrypto.js) so the two can never
// drift apart the way independently-generated client values could. See
// QrModel.saveV2 / apiClient.qr.saveQrCodeV2.

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
 */
export async function generateStickerBlob(rec: QrRecord, pos: StickerPos): Promise<Blob | null> {
  try {
    const qrDataUrl = await generateQrDataUrl(qrFullUrl(rec.id), rec.fg || "000000", rec.bg || "FFFFFF", 1700);
    return await compositeQrOnSticker(qrDataUrl, pos);
  } catch (err) {
    console.warn("Failed to generate sticker image:", err);
    return null;
  }
}


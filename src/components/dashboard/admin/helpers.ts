import { QrRecord } from "./types";

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
        activationCode: qrItem.activationCode || generateActivationCode(),
        vehicleName: qrItem.vehicleName || "Unassigned QR Sticker",
        vehicleNumber: qrItem.vehicleNumber || "PENDING",
        status: "pending_activation",
        createdAt: new Date().toISOString(),
        template: qrItem.template || "Default",
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

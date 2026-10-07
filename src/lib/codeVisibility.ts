import { useSyncExternalStore } from 'react';

/**
 * One app-wide "see codes" switch. Sticker IDs are hidden by default everywhere —
 * screens show the vehicle number (or the sticker's category) instead — and only
 * appear after the user presses "See codes". Kept in memory on purpose (no
 * localStorage): a reload hides them again.
 */
let revealed = false;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setCodesRevealed(next: boolean) {
  if (next === revealed) return;
  revealed = next;
  listeners.forEach((l) => l());
}

export function useCodesRevealed(): [boolean, (next: boolean) => void] {
  const value = useSyncExternalStore(subscribe, () => revealed, () => false);
  return [value, setCodesRevealed];
}

interface StickerLike {
  id?: string | null;
  qrCodeId?: string | null;
  vehicleNumber?: string | null;
  vehicle_number?: string | null;
}

/**
 * What to print for a sticker: its ID once codes are revealed, otherwise the
 * vehicle number, otherwise the supplied fallback (e.g. the category name) —
 * never the ID by default.
 */
// Stand-ins the server writes when no owner name was given — not a registered name.
const GENERIC_NAME = /^(vehicle owner|sticker owner|owner)$/i;
const PLACEHOLDER_NAME = /^(vehicle|tag) \(/i;

/** The sticker's registered name, or null when it's missing or only a placeholder. */
export function registeredNameOf(name?: string | null): string | null {
  const clean = (name || '').trim();
  if (!clean || GENERIC_NAME.test(clean) || PLACEHOLDER_NAME.test(clean)) return null;
  return clean;
}

interface AdminStickerLike {
  id?: string | null;
  qrCodeId?: string | null;
  /** Registered owner name on admin QR records (`owner_name` from the API). */
  ownerName?: string | null;
  /** Registered name on alert rows (`sticker_name` from the API). */
  registeredName?: string | null;
}

/**
 * Admin label: the tag's registered name when it has one, otherwise the tag id.
 * The id is never shown next to a name.
 */
export function adminStickerLabel(sticker: AdminStickerLike, fallback = 'Sticker'): string {
  const id = sticker.id || sticker.qrCodeId || '';
  const name = registeredNameOf(sticker.registeredName ?? sticker.ownerName);
  return name || id || fallback;
}

export function stickerRef(sticker: StickerLike, isRevealed: boolean, fallback = 'Sticker'): string {
  const id = sticker.id || sticker.qrCodeId || '';
  if (isRevealed && id) return id;
  const vehicle = (sticker.vehicleNumber || sticker.vehicle_number || '').trim();
  return vehicle || fallback;
}

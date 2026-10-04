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
export function stickerRef(sticker: StickerLike, isRevealed: boolean, fallback = 'Sticker'): string {
  const id = sticker.id || sticker.qrCodeId || '';
  if (isRevealed && id) return id;
  const vehicle = (sticker.vehicleNumber || sticker.vehicle_number || '').trim();
  return vehicle || fallback;
}

import { getCategoryLabel } from '../../../stickerModules';

export interface EmergencyContact {
  name: string;
  phone: string;
}

export type StickerStatus = 'Active' | 'Inactive' | 'Lost' | 'Replaced';

export interface DashboardSticker {
  id: string;               // product row id (backend UUID) or local id in legacy/offline mode
  qrCodeId: string;         // physical sticker code, e.g. QR-8A3F
  code: string;             // display alias for qrCodeId (kept for legacy call sites)
  category: string;
  nickname: string;
  assigned: string;
  status: StickerStatus;
  scans: number;
  lastScan: string;
  ownerPhone: string;
  ownerEmail: string;
  address: string;
  bloodGroup: string;
  allergies: string;
  meta: [string, string][];
  contacts: EmergencyContact[];
  timeline: [string, string, string, string][];
  isBackendManaged: boolean; // true when backed by a real products row (API or Supabase-direct)
}

function titleCaseStatus(raw?: string): StickerStatus {
  const s = String(raw || 'active').toLowerCase();
  if (s === 'inactive') return 'Inactive';
  if (s === 'lost') return 'Lost';
  if (s === 'replaced') return 'Replaced';
  return 'Active';
}

function formatDate(iso?: string | null): string {
  if (!iso) return 'Never';
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return 'Never';
  }
}

/**
 * Map a backend `products` row (optionally with an embedded `qr_codes` record) into
 * the flat shape the dashboard UI renders.
 */
export function mapProductRow(row: any): DashboardSticker {
  const details = row.details || {};
  const qr = row.qr_codes || {};
  const qrCodeId = row.qr_code_id || row.id;
  const category = row.category || 'car';

  const meta: [string, string][] = [
    ['Registered', formatDate(row.created_at)],
    ['Category', getCategoryLabel(category as any) || category],
  ];
  if (row.vehicle_number) meta.push(['Vehicle No.', row.vehicle_number]);

  return {
    id: row.id,
    qrCodeId,
    code: qrCodeId,
    category,
    nickname: row.name || `${getCategoryLabel(category as any) || 'Safety'} Sticker (${qrCodeId})`,
    assigned: row.assigned_to || 'Self',
    status: titleCaseStatus(row.status),
    scans: qr.scans_count ?? row.scans_count ?? 0,
    lastScan: formatDate(qr.last_scanned_at ?? row.last_scanned_at),
    ownerPhone: details.ownerPhone || '',
    ownerEmail: details.ownerEmail || '',
    address: details.address || '',
    bloodGroup: details.bloodGroup || '',
    allergies: details.allergies || '',
    meta,
    contacts: Array.isArray(details.emergencyContacts)
      ? details.emergencyContacts.map((c: any) => ({ name: c?.name || '', phone: c?.phone || '' }))
      : [],
    timeline: [],
    isBackendManaged: true,
  };
}

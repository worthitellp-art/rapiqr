import React, { useState } from 'react';
import { X, AlertTriangle, Plus, Trash2, ArrowRightLeft, History, Loader2, ExternalLink, Download, Copy, Check, QrCode, Printer, RefreshCw } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { DashboardSticker, EmergencyContact } from './types';
import PhoneInputWithCountry from '../../common/PhoneInputWithCountry';
import { getCategoryIcon } from '../../../stickerModules';
import { generateRepeatedStickerSheetBlob, downloadSheetBlob } from '../../../services/stickerPrintSheetService';
import type { QrRecord } from '../admin/types';

function ModalShell({
  onClose,
  children,
  maxWidth = 'max-w-md',
}: {
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  return (
    <div
      className="fx-shell fixed inset-0 z-[120] flex items-center justify-center p-4 text-[var(--fx-ink)]"
      style={{ background: 'rgba(10,10,20,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-3xl shadow-2xl w-full ${maxWidth} p-6 border border-gray-100 max-h-[88vh] overflow-y-auto`}
        style={{ animation: 'modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
        <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.94) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
      </div>
    </div>
  );
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h3 className="font-bold text-lg text-[var(--fx-ink)]">{title}</h3>
      <button onClick={onClose} className="w-8 h-8 rounded-full bg-[var(--fx-canvas)] flex items-center justify-center text-gray-500 hover:text-gray-900 cursor-pointer">
        <X size={16} />
      </button>
    </div>
  );
}

const inputCls = 'w-full h-11 px-3.5 text-sm bg-white border border-gray-300 rounded-lg outline-none focus:border-black focus:ring-1 focus:ring-black text-gray-900 placeholder:text-gray-400 transition-all';
const labelCls = 'block text-sm font-medium text-gray-900 mb-1.5';

/* ─── EDIT DETAILS MODAL ─── */
export function EditDetailsModal({
  sticker,
  onClose,
  onSave,
}: {
  sticker: DashboardSticker;
  onClose: () => void;
  onSave: (updates: Record<string, any>) => Promise<void>;
}) {
  const [name, setName] = useState(sticker.nickname);
  const [address, setAddress] = useState(sticker.address);
  const [bloodGroup, setBloodGroup] = useState(sticker.bloodGroup);
  const [allergies, setAllergies] = useState(sticker.allergies);
  const [ownerEmail, setOwnerEmail] = useState(sticker.ownerEmail);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ name, address, bloodGroup, allergies, ownerEmail });
    setSaving(false);
  };

  return (
    <ModalShell onClose={onClose}>
      <ModalHeader title="Edit Sticker Details" onClose={onClose} />
      <div className="space-y-3.5">
        <div>
          <label className={labelCls}>Nickname / Label</label>
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mahindra Thar" />
        </div>
        <div>
          <label className={labelCls}>Address (optional)</label>
          <input className={inputCls} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. Flat 402, Main Gate" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Blood Group</label>
            <input className={inputCls} value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} placeholder="e.g. O+" />
          </div>
          <div>
            <label className={labelCls}>Owner Email</label>
            <input className={inputCls} value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} placeholder="you@email.com" />
          </div>
        </div>
        <div>
          <label className={labelCls}>Allergies / Medical Notes</label>
          <input className={inputCls} value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="e.g. Penicillin allergy" />
        </div>
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={onClose} className="flex-1 h-11 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer transition-all">
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 h-11 rounded-lg text-sm font-semibold text-black bg-white hover:bg-gray-50 border border-gray-300 hover:border-black disabled:opacity-60 cursor-pointer flex items-center justify-center gap-1.5 shadow-xs transition-all"
        >
          {saving && <Loader2 size={14} className="animate-spin text-black" />} Save Changes
        </button>
      </div>
    </ModalShell>
  );
}

/* ─── EDIT CONTACTS MODAL (also reused inline by the Emergency Contacts tab) ─── */
export function EditContactsModal({
  sticker,
  onClose,
  onSave,
}: {
  sticker: DashboardSticker;
  onClose: () => void;
  onSave: (contacts: EmergencyContact[]) => Promise<void>;
}) {
  const [contacts, setContacts] = useState<EmergencyContact[]>(
    sticker.contacts.length > 0 ? sticker.contacts : [{ name: '', phone: '' }]
  );
  const [saving, setSaving] = useState(false);

  const updateContact = (idx: number, field: 'name' | 'phone', value: string) => {
    setContacts((prev) => prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c)));
  };
  const removeContact = (idx: number) => setContacts((prev) => prev.filter((_, i) => i !== idx));
  const addContact = () => setContacts((prev) => [...prev, { name: '', phone: '' }]);

  const handleSave = async () => {
    setSaving(true);
    const cleaned = contacts.filter((c) => c.name.trim() || c.phone.trim());
    await onSave(cleaned);
    setSaving(false);
  };

  return (
    <ModalShell onClose={onClose}>
      <ModalHeader title={`Emergency Contacts — ${sticker.nickname}`} onClose={onClose} />
      <div className="space-y-3">
        {contacts.map((c, idx) => (
          <div key={idx} className="flex gap-2 items-start">
            <div className="w-1/3 flex-shrink-0">
              <input
                className={inputCls}
                value={c.name}
                onChange={(e) => updateContact(idx, 'name', e.target.value)}
                placeholder="Contact name"
              />
            </div>
            <div className="flex-1">
              <PhoneInputWithCountry
                value={c.phone}
                onChange={(full) => updateContact(idx, 'phone', full)}
                placeholder="10-digit mobile"
              />
            </div>
            <button
              onClick={() => removeContact(idx)}
              title="Remove contact"
              className="w-9 h-9 flex-shrink-0 rounded-xl bg-[#FEE2E2] text-[#DC2626] hover:bg-[#FECACA] flex items-center justify-center cursor-pointer mt-0.5"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <button
          onClick={addContact}
          className="w-full py-2.5 rounded-xl border border-dashed border-[var(--fx-border)] text-xs font-bold text-[var(--fx-ink-2)] hover:bg-[var(--fx-canvas)] flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus size={14} /> Add Contact
        </button>
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={onClose} className="flex-1 h-11 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer transition-all">
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 h-11 rounded-lg text-sm font-semibold text-black bg-white hover:bg-gray-50 border border-gray-300 hover:border-black disabled:opacity-60 cursor-pointer flex items-center justify-center gap-1.5 shadow-xs transition-all"
        >
          {saving && <Loader2 size={14} className="animate-spin text-black" />} Save Contacts
        </button>
      </div>
    </ModalShell>
  );
}

/* ─── TRANSFER STICKER MODAL ─── */
export function TransferModal({
  sticker,
  onClose,
  onTransfer,
}: {
  sticker: DashboardSticker;
  onClose: () => void;
  onTransfer: (targetEmail: string) => Promise<{ success: boolean; error?: string }>;
}) {
  const [email, setEmail] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    if (!email.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setBusy(true);
    setError(null);
    const res = await onTransfer(email);
    setBusy(false);
    if (!res.success) setError(res.error || 'Transfer failed.');
  };

  return (
    <ModalShell onClose={onClose}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100 text-gray-900 border border-gray-200">
          <ArrowRightLeft size={18} />
        </div>
        <h3 className="font-bold text-gray-900 text-base leading-snug">Transfer Sticker Ownership</h3>
      </div>
      <p className="text-sm text-gray-600 font-medium leading-relaxed mb-4">
        <span className="font-bold text-gray-900">{sticker.nickname}</span> will move to another RapiQR account. The recipient must already have signed up.
      </p>
      <label className={labelCls}>Recipient's Account Email</label>
      <input
        className={inputCls}
        value={email}
        onChange={(e) => { setEmail(e.target.value); setConfirming(false); setError(null); }}
        placeholder="recipient@email.com"
      />
      {error && <p className="text-xs font-bold text-[#DC2626] mt-2">{error}</p>}
      {confirming && !error && (
        <p className="text-xs font-bold text-[#B45309] mt-2">Click "Confirm Transfer" again to finalize — this cannot be undone.</p>
      )}
      <div className="flex gap-3 mt-6">
        <button onClick={onClose} className="flex-1 h-11 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer transition-all">
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={busy}
          className="flex-1 h-11 rounded-lg text-sm font-semibold text-black bg-white hover:bg-gray-50 border border-gray-300 hover:border-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-60"
        >
          {busy && <Loader2 size={14} className="animate-spin text-black" />} {confirming ? 'Confirm Transfer' : 'Transfer'}
        </button>
      </div>
    </ModalShell>
  );
}

/* ─── SCAN / ACTIVITY HISTORY MODAL ─── */
export function ScanHistoryModal({
  sticker,
  history,
  loading,
  onClose,
}: {
  sticker: DashboardSticker;
  history: any[];
  loading: boolean;
  onClose: () => void;
}) {
  return (
    <ModalShell onClose={onClose} maxWidth="max-w-lg">
      <ModalHeader title={`Scan & Alert History — ${sticker.nickname}`} onClose={onClose} />
      {loading ? (
        <div className="py-10 flex items-center justify-center text-[var(--fx-ink-2)] text-xs gap-2">
          <Loader2 size={16} className="animate-spin" /> Loading history…
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-10 space-y-2">
          <History size={28} className="mx-auto text-[var(--fx-faint)]" />
          <p className="text-xs text-[var(--fx-ink-2)]">No scans or alerts recorded yet for this sticker.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
          {history.map((h, idx) => (
            <div key={h.id || idx} className="bg-[var(--fx-canvas)] rounded-xl p-3.5 border border-[var(--fx-border)]">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-xs text-[var(--fx-ink)] capitalize">{String(h.type || 'event').replace(/_/g, ' ')}</span>
                <span className="text-[10px] text-[var(--fx-faint)]">{h.created_at ? new Date(h.created_at).toLocaleString() : ''}</span>
              </div>
              {h.message && <p className="text-xs text-[var(--fx-ink-2)]">{h.message}</p>}
              <span className={`inline-block mt-1.5 text-[9.5px] font-bold px-2 py-0.5 rounded-full uppercase ${
                h.status === 'unread' ? 'bg-[var(--fx-red-soft)] text-[var(--fx-red)]' :
                h.status === 'acknowledged' ? 'bg-[var(--fx-amber-soft)] text-[var(--fx-amber)]' :
                'bg-[var(--fx-green-soft)] text-[var(--fx-green)]'
              }`}>
                {h.status || 'logged'}
              </span>
            </div>
          ))}
        </div>
      )}
    </ModalShell>
  );
}

/* ─── GENERIC CONFIRM ACTION MODAL (delete / deactivate / reactivate) ─── */
export function ConfirmActionModal({
  title,
  description,
  confirmLabel,
  tone = 'danger',
  busy = false,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  tone?: 'danger' | 'warning' | 'info';
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const colors = {
    danger: { bg: 'rgba(239,68,68,0.12)', fg: '#EF4444', btn: '#EF4444' },
    warning: { bg: 'rgba(180,83,9,0.12)', fg: '#B45309', btn: '#B45309' },
    info: { bg: 'rgba(37,99,235,0.12)', fg: 'var(--fx-accent)', btn: 'var(--fx-accent)' },
  }[tone];

  return (
    <ModalShell onClose={onCancel}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: colors.bg, color: colors.fg }}>
          <AlertTriangle size={18} />
        </div>
        <h3 className="font-bold text-gray-900 text-base leading-snug">{title}</h3>
      </div>
      <div className="text-sm text-gray-600 font-medium leading-relaxed mb-6">{description}</div>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={busy}
          className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
          style={{ background: colors.btn }}
        >
          {busy && <Loader2 size={13} className="animate-spin" />} {confirmLabel}
        </button>
      </div>
    </ModalShell>
  );
}

/* ─── RECOVER A DELETED/BROKEN STICKER ───
 * ID-only self-service restore — no recovery code needed. The access control
 * is ownership: the backend only allows this when the sticker's user_id
 * still matches the signed-in account (see QrModel.restoreOwnedByUser),
 * which survives a soft-delete whether it was this account or an admin that
 * deleted it. Hits /products/:id/recover, not the code-based /qr/:id/recover.
 */
export function RecoverStickerModal({
  prefillId = '',
  onClose,
  onRecover,
}: {
  prefillId?: string;
  onClose: () => void;
  onRecover: (stickerId: string) => Promise<{ success: boolean; error?: string }>;
}) {
  const [stickerId, setStickerId] = useState(prefillId);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = stickerId.trim();
    if (!cleanId) return;

    setSubmitting(true);
    setError(null);
    const res = await onRecover(cleanId);
    setSubmitting(false);
    if (!res.success) {
      setError(res.error || "No sticker found with that ID, or it isn't linked to your account.");
    }
  };

  return (
    <ModalShell onClose={onClose}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(82,117,217,0.12)', color: 'var(--fx-accent)' }}>
          <RefreshCw size={18} />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-base leading-snug">Recover a Sticker</h3>
          <p className="text-xs text-gray-500 font-medium">Deleted it by mistake, or it's missing? Enter its ID to bring it back — no code needed if it's linked to your account.</p>
        </div>
        <button onClick={onClose} className="ml-auto w-8 h-8 rounded-full bg-[var(--fx-canvas)] flex items-center justify-center text-gray-500 hover:text-gray-900 cursor-pointer shrink-0">
          <X size={16} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className={labelCls}>Sticker ID *</label>
          <input
            type="text"
            required
            placeholder="the sticker's ID"
            value={stickerId}
            onChange={(e) => setStickerId(e.target.value)}
            className={`${inputCls} font-mono`}
          />
        </div>
        {error && <p className="text-xs font-semibold text-[#EF4444]">{error}</p>}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer">
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
            style={{ background: 'var(--fx-accent)' }}
          >
            {submitting ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} {submitting ? 'Recovering…' : 'Recover Sticker'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

/* ─── STICKER QR CODE DISPLAY & SCAN MODAL ─── */
export function QrCodeModal({
  sticker,
  onClose,
  onShowToast,
}: {
  sticker: DashboardSticker;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const scanUrl = `${window.location.origin}/${sticker.code || sticker.qrCodeId}`;

  const handleCopyScanLink = () => {
    navigator.clipboard.writeText(scanUrl);
    setCopied(true);
    onShowToast('Scan link copied to clipboard');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadQrCode = () => {
    const svgElement = document.getElementById(`qr-code-svg-${sticker.id}`);
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 500;
      canvas.height = 500;
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 25, 25, 450, 450);
        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `${(sticker.nickname || 'Sticker').replace(/\s+/g, '_')}_QR.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        onShowToast('QR code image downloaded');
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <ModalShell onClose={onClose} maxWidth="max-w-sm">
      <ModalHeader title="Sticker QR Code" onClose={onClose} />

      <div className="flex flex-col items-center text-center space-y-4">
        {/* Category & Nickname Badge */}
        <div className="flex items-center gap-2 bg-[var(--fx-canvas)] border border-[var(--fx-border)] px-3.5 py-1.5 rounded-full">
          <span className="text-sm">{getCategoryIcon(sticker.category as any) || '🏷️'}</span>
          <span className="font-bold text-xs text-[var(--fx-ink)]">{sticker.nickname}</span>
          <span className="text-[10px] font-bold text-[var(--fx-ink-2)] bg-[var(--fx-canvas)] px-2 py-0.5 rounded-full">
            {sticker.code || sticker.qrCodeId}
          </span>
        </div>

        {/* QR Code Container */}
        <div className="p-5 bg-white rounded-2xl border border-[var(--fx-border)] shadow-sm flex flex-col items-center justify-center">
          <QRCodeSVG
            id={`qr-code-svg-${sticker.id}`}
            value={scanUrl}
            size={190}
            level="H"
            includeMargin={true}
          />
          <p className="text-[10px] font-extrabold text-[var(--fx-ink-2)] mt-2 tracking-widest uppercase">RepiQR Safety Tag</p>
        </div>

        <p className="text-xs text-[var(--fx-ink-2)] max-w-xs font-medium leading-relaxed">
          Scan this QR code with any smartphone camera to launch the emergency contact alert interface.
        </p>

        {/* Action Buttons */}
        <div className="w-full space-y-2 pt-2">
          <a
            href={scanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 rounded-xl bg-[var(--fx-accent)] hover:bg-[var(--fx-accent-ink)] text-xs font-bold text-white flex items-center justify-center gap-2 transition-all shadow-sm shadow-[var(--fx-accent)]/20"
          >
            <ExternalLink size={14} /> Open &amp; Test Scan Page
          </a>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCopyScanLink}
              className="py-2.5 px-3 rounded-xl border border-[var(--fx-border)] bg-white hover:bg-[var(--fx-canvas)] text-xs font-bold text-[var(--fx-ink-2)] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>

            <button
              onClick={handleDownloadQrCode}
              className="py-2.5 px-3 rounded-xl border border-[var(--fx-border)] bg-white hover:bg-[var(--fx-canvas)] text-xs font-bold text-[var(--fx-ink-2)] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download size={14} /> Download PNG
            </button>
          </div>

          <button
            onClick={async () => {
              try {
                const rec: QrRecord = {
                  id: sticker.code || sticker.qrCodeId || 'STICKER',
                  qrUrl: scanUrl,
                  createdAt: new Date().toISOString(),
                  scans: sticker.scans || 0,
                  status: 'active',
                  template: 'Standard Tag',
                  category: sticker.category || 'car',
                  fg: '000000',
                  bg: 'FFFFFF',
                };
                const pos = { x: 110, y: 40, w: 100, h: 100 };
                const blob = await generateRepeatedStickerSheetBlob(rec, pos);
                if (blob) {
                  downloadSheetBlob(blob, `repiqr-print-sheet-18x12-${rec.id}.png`);
                  onShowToast('18×12″ print sheet (9 stickers) downloaded');
                }
              } catch (err) {
                console.error('Failed to generate sticker sheet:', err);
                onShowToast('Failed to generate print sheet');
              }
            }}
            className="w-full py-2.5 px-3 rounded-xl border border-[var(--fx-accent)]/30 bg-[var(--fx-accent-soft)] hover:bg-[var(--fx-accent-soft)] text-xs font-bold text-[var(--fx-accent-ink)] flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
          >
            <Printer size={14} />
            <span>Print 18×12″ Sheet (9 Stickers)</span>
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

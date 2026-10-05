import React, { useState } from 'react';
import { Phone, Mail, FileText, AlertOctagon, Loader2, X } from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';
import PhoneInputWithCountry from '../../common/PhoneInputWithCountry';

const SUPPORT_PHONE = '+91 9313719720';
const SUPPORT_EMAIL = 'support@rapiqr.com';

function LegalModal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fx-shell fixed inset-0 z-[120] flex items-center justify-center p-4 text-[var(--fx-ink)]"
      style={{ background: 'rgba(10,10,20,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[var(--fx-radius-card)] shadow-2xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-[var(--fx-ink)]">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[var(--fx-canvas)] flex items-center justify-center text-gray-500 hover:text-gray-900 cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <div className="text-xs text-[var(--fx-ink-2)] leading-relaxed space-y-3">{children}</div>
      </div>
    </div>
  );
}

function ReportModal({
  type,
  onClose,
  showToast,
}: {
  type: 'lost' | 'fraud';
  onClose: () => void;
  showToast: (msg: string) => void;
}) {
  const [message, setMessage] = useState('');
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!message.trim()) {
      setError('Please describe what happened.');
      return;
    }
    setSending(true);
    setError(null);
    try {
      await apiClient.alerts.createAlert({
        productLabel: type === 'lost' ? 'Lost Sticker Report' : 'Fraud Report',
        type: 'contact_owner',
        message: `[${type === 'lost' ? 'LOST STICKER' : 'FRAUD REPORT'}] ${message.trim()}`,
        reporterPhone: phone || undefined,
      });
      showToast('Report submitted — our support team will reach out shortly.');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit report. Please call support directly.');
    } finally {
      setSending(false);
    }
  };

  return (
    <LegalModal title={type === 'lost' ? 'Report a Lost Sticker' : 'Report Suspected Fraud'} onClose={onClose}>
      <p>Tell us what happened — our team will follow up by phone or email.</p>
      <div>
        <label className="block text-xs font-bold text-[var(--fx-ink-2)] mb-1">Your Phone (optional)</label>
        <PhoneInputWithCountry value={phone} onChange={(full) => setPhone(full)} />
      </div>
      <div>
        <label className="block text-xs font-bold text-[var(--fx-ink-2)] mb-1">Details</label>
        <textarea
          className="w-full px-3.5 py-2.5 text-sm bg-[var(--fx-canvas)] border border-[var(--fx-border)] rounded-[var(--fx-radius-control)] outline-none focus:border-[var(--fx-accent)] min-h-[100px]"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={type === 'lost' ? 'Which sticker, when/where you noticed it missing…' : 'What looked suspicious or fraudulent…'}
        />
      </div>
      {error && <p className="text-xs font-bold text-[#DC2626]">{error}</p>}
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-[var(--fx-radius-control)] border border-[var(--fx-border-strong)] text-xs font-bold text-[var(--fx-ink-2)] hover:bg-[var(--fx-canvas)] cursor-pointer">Cancel</button>
        <button onClick={submit} disabled={sending} className="flex-1 py-2.5 rounded-[var(--fx-radius-control)] bg-[var(--fx-accent)] hover:bg-[var(--fx-accent-hover)] text-white text-xs font-bold disabled:opacity-60 cursor-pointer flex items-center justify-center gap-1.5 transition-colors">
          {sending && <Loader2 size={13} className="animate-spin" />} Submit Report
        </button>
      </div>
    </LegalModal>
  );
}

export default function SupportLegalPanel({ showToast }: { showToast: (msg: string) => void }) {
  const [openModal, setOpenModal] = useState<'lost' | 'fraud' | null>(null);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="fx-text-heading-page text-[var(--fx-ink)]">Support &amp; Legal</h1>
        <p className="text-[13px] text-[var(--fx-ink-2)] mt-1">Quick answers, and how to reach us</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-[var(--fx-radius-card)] p-[18px] space-y-4">
          <h3 className="text-[15px] font-bold text-[var(--fx-ink)]">Customer Support</h3>
          <a href={`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`} className="flex items-center gap-3 text-sm font-semibold text-[var(--fx-ink)]">
            <span className="w-9 h-9 rounded-[var(--fx-radius-tile)] bg-[var(--fx-canvas)] flex items-center justify-center flex-shrink-0"><Phone size={15} /></span>
            {SUPPORT_PHONE}
          </a>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="flex items-center gap-3 text-sm font-semibold text-[var(--fx-ink)]">
            <span className="w-9 h-9 rounded-[var(--fx-radius-tile)] bg-[var(--fx-canvas)] flex items-center justify-center flex-shrink-0"><Mail size={15} /></span>
            {SUPPORT_EMAIL}
          </a>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setOpenModal('lost')} className="flex-1 py-2 rounded-[var(--fx-radius-control)] bg-[var(--fx-amber-soft)] text-[var(--fx-amber)] text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5">
              <AlertOctagon size={13} /> Report Lost Sticker
            </button>
            <button onClick={() => setOpenModal('fraud')} className="flex-1 py-2 rounded-[var(--fx-radius-control)] bg-[#FEE2E2] hover:bg-[#FECACA] text-[#DC2626] text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5">
              <AlertOctagon size={13} /> Report Fraud
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[var(--fx-radius-card)] p-[18px] space-y-4">
          <h3 className="text-[15px] font-bold text-[var(--fx-ink)]">Legal</h3>
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 text-sm font-semibold text-[var(--fx-ink)]"
          >
            <span className="w-9 h-9 rounded-[var(--fx-radius-tile)] bg-[var(--fx-canvas)] flex items-center justify-center flex-shrink-0"><FileText size={15} /></span>
            Privacy Policy
          </a>
        </div>
      </div>

      {openModal === 'lost' && <ReportModal type="lost" onClose={() => setOpenModal(null)} showToast={showToast} />}
      {openModal === 'fraud' && <ReportModal type="fraud" onClose={() => setOpenModal(null)} showToast={showToast} />}
    </div>
  );
}

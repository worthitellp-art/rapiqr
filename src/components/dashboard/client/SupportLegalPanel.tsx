import React, { useState } from 'react';
import { ShieldCheck, Phone, Mail, FileText, Scale, AlertOctagon, Loader2, X } from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';
import PhoneInputWithCountry from '../../common/PhoneInputWithCountry';

const SUPPORT_PHONE = '+91 98765 43210';
const SUPPORT_EMAIL = 'support@rapiqr.com';

function LegalModal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4"
      style={{ background: 'rgba(10,10,20,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 border border-gray-100 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-[#1A1D26]">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#F5F6FA] flex items-center justify-center text-gray-500 hover:text-gray-900 cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <div className="text-xs text-[#475569] leading-relaxed space-y-3">{children}</div>
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
        <label className="block text-xs font-bold text-[#64748B] mb-1">Your Phone (optional)</label>
        <PhoneInputWithCountry value={phone} onChange={(full) => setPhone(full)} />
      </div>
      <div>
        <label className="block text-xs font-bold text-[#64748B] mb-1">Details</label>
        <textarea
          className="w-full px-3.5 py-2.5 text-sm bg-[#F5F6FA] border border-[#E8ECF4] rounded-xl outline-none focus:border-[#111111] min-h-[100px]"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={type === 'lost' ? 'Which sticker, when/where you noticed it missing…' : 'What looked suspicious or fraudulent…'}
        />
      </div>
      {error && <p className="text-xs font-bold text-[#DC2626]">{error}</p>}
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer">Cancel</button>
        <button onClick={submit} disabled={sending} className="flex-1 py-2.5 rounded-xl bg-[#111111] hover:bg-black text-white text-xs font-bold disabled:opacity-60 cursor-pointer flex items-center justify-center gap-1.5">
          {sending && <Loader2 size={13} className="animate-spin" />} Submit Report
        </button>
      </div>
    </LegalModal>
  );
}

export default function SupportLegalPanel({ showToast }: { showToast: (msg: string) => void }) {
  const [openModal, setOpenModal] = useState<'privacy' | 'terms' | 'lost' | 'fraud' | null>(null);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1D26]">Support &amp; Legal</h1>
        <p className="text-xs sm:text-sm text-[#64748B] mt-1">Get help, report an issue, or review our policies.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white border border-[#E8ECF4] rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-sm text-[#1A1D26]">Customer Support</h3>
          <a href={`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`} className="flex items-center gap-3 text-sm font-semibold text-[#1A1D26] hover:text-[#111111]">
            <span className="w-9 h-9 rounded-xl bg-[#F1F5F9] flex items-center justify-center flex-shrink-0"><Phone size={15} /></span>
            {SUPPORT_PHONE}
          </a>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="flex items-center gap-3 text-sm font-semibold text-[#1A1D26] hover:text-[#111111]">
            <span className="w-9 h-9 rounded-xl bg-[#F1F5F9] flex items-center justify-center flex-shrink-0"><Mail size={15} /></span>
            {SUPPORT_EMAIL}
          </a>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setOpenModal('lost')} className="flex-1 py-2.5 rounded-xl bg-[#FEF3C7] hover:bg-[#FDE68A] text-[#B45309] text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5">
              <AlertOctagon size={13} /> Report Lost Sticker
            </button>
            <button onClick={() => setOpenModal('fraud')} className="flex-1 py-2.5 rounded-xl bg-[#FEE2E2] hover:bg-[#FECACA] text-[#DC2626] text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5">
              <AlertOctagon size={13} /> Report Fraud
            </button>
          </div>
        </div>

        <div className="bg-white border border-[#E8ECF4] rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-sm text-[#1A1D26]">Legal</h3>
          <button onClick={() => setOpenModal('privacy')} className="w-full flex items-center gap-3 text-sm font-semibold text-[#1A1D26] hover:text-[#111111] cursor-pointer">
            <span className="w-9 h-9 rounded-xl bg-[#F1F5F9] flex items-center justify-center flex-shrink-0"><FileText size={15} /></span>
            Privacy Policy
          </button>
          <button onClick={() => setOpenModal('terms')} className="w-full flex items-center gap-3 text-sm font-semibold text-[#1A1D26] hover:text-[#111111] cursor-pointer">
            <span className="w-9 h-9 rounded-xl bg-[#F1F5F9] flex items-center justify-center flex-shrink-0"><Scale size={15} /></span>
            Terms of Service
          </button>
          <div className="bg-[#DCFCE7] rounded-xl p-3.5 border border-emerald-200 flex items-center gap-2.5 mt-2">
            <ShieldCheck size={16} className="text-[#16A34A] flex-shrink-0" />
            <p className="text-[11px] text-[#166534] leading-relaxed">Your data is encrypted at rest and in transit. Emergency calls are masked and never expose your real number.</p>
          </div>
        </div>
      </div>

      {openModal === 'privacy' && (
        <LegalModal title="Privacy Policy" onClose={() => setOpenModal(null)}>
          <p>RapiQR collects only what's needed to protect you and your belongings: your name, phone/email, the emergency contacts you add, and scan/alert activity tied to your stickers.</p>
          <p>We never display your real phone number to anyone who scans your sticker — all calls are routed anonymously through a masked line. Location shared during an emergency scan is sent only to you, the owner.</p>
          <p>Your data is never sold. It's used solely to operate the RapiQR safety network and is encrypted at rest and in transit.</p>
        </LegalModal>
      )}

      {openModal === 'terms' && (
        <LegalModal title="Terms of Service" onClose={() => setOpenModal(null)}>
          <p>By activating a RapiQR sticker, you agree to keep the emergency contact details on your account accurate and up to date.</p>
          <p>RapiQR provides a scan-and-alert notification service — it is not a substitute for emergency services (police, ambulance, fire). Always contact local emergency services directly in a life-threatening situation.</p>
          <p>Stickers may be deactivated, transferred to another account, or replaced at any time from your dashboard. Misuse of the anonymous calling/alerting system to harass sticker owners is prohibited and may result in account suspension.</p>
        </LegalModal>
      )}

      {openModal === 'lost' && <ReportModal type="lost" onClose={() => setOpenModal(null)} showToast={showToast} />}
      {openModal === 'fraud' && <ReportModal type="fraud" onClose={() => setOpenModal(null)} showToast={showToast} />}
    </div>
  );
}

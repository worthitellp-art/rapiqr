import React, { useEffect, useState } from 'react';
import { ShieldCheck, Download, UserPlus, MessageSquareWarning, Loader2, Trash2 } from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';
import { useAuth } from '../../../context/AuthContext';
import FxModal from '../shared/FxModal';

type ConsentRow = { purpose: string; status: 'GRANTED' | 'WITHDRAWN' | 'NOT_SET'; noticeVersion: string | null };

const CONSENT_LABELS: Record<string, { title: string; description: string }> = {
  marketing_communications: {
    title: 'Marketing communications',
    description: 'Occasional promotional email/SMS about new products or offers. Not required to use RapiQR.',
  },
  push_notifications: {
    title: 'Push notifications',
    description: 'Browser push alerts for chat messages and emergency activity, even when the tab is closed.',
  },
};

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function PrivacyDataPanel({ showToast }: { showToast: (msg: string) => void }) {
  const { deleteAccount } = useAuth();
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<any>(null);
  const [consents, setConsents] = useState<ConsentRow[]>([]);
  const [busyPurpose, setBusyPurpose] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const [nomineeName, setNomineeName] = useState('');
  const [nomineeRelationship, setNomineeRelationship] = useState('');
  const [nomineePhone, setNomineePhone] = useState('');
  const [nomineeEmail, setNomineeEmail] = useState('');
  const [savingNominee, setSavingNominee] = useState(false);

  const [grievanceCategory, setGrievanceCategory] = useState('general');
  const [grievanceDescription, setGrievanceDescription] = useState('');
  const [submittingGrievance, setSubmittingGrievance] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [meRes, consentRes, grievanceRes] = await Promise.all([
        apiClient.privacy.getMe(),
        apiClient.privacy.getConsent(),
        apiClient.privacy.listGrievances(),
      ]);
      setMe(meRes.data);
      setConsents(consentRes.data as ConsentRow[]);
      setTickets(grievanceRes.data || []);
      if (meRes.data?.nominee) {
        setNomineeName(meRes.data.nominee.name || '');
        setNomineeRelationship(meRes.data.nominee.relationship || '');
        setNomineePhone(meRes.data.nominee.contact_phone || '');
        setNomineeEmail(meRes.data.nominee.contact_email || '');
      }
    } catch {
      showToast('Could not load your privacy data — please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleConsent = async (purpose: string, currentlyGranted: boolean) => {
    setBusyPurpose(purpose);
    try {
      if (currentlyGranted) {
        await apiClient.privacy.withdrawConsent(purpose);
        showToast('Consent withdrawn.');
      } else {
        await apiClient.privacy.grantConsent(purpose);
        showToast('Consent recorded.');
      }
      const res = await apiClient.privacy.getConsent();
      setConsents(res.data as ConsentRow[]);
    } catch {
      showToast('Failed to update consent — please try again.');
    } finally {
      setBusyPurpose(null);
    }
  };

  const saveNominee = async () => {
    if (!nomineeName.trim() || (!nomineePhone.trim() && !nomineeEmail.trim())) {
      showToast('Nominee name and at least one contact detail are required.');
      return;
    }
    setSavingNominee(true);
    try {
      await apiClient.privacy.setNominee({
        name: nomineeName.trim(),
        relationship: nomineeRelationship.trim() || undefined,
        contactPhone: nomineePhone.trim() || undefined,
        contactEmail: nomineeEmail.trim() || undefined,
      });
      showToast('Nominee saved.');
    } catch {
      showToast('Failed to save nominee — please try again.');
    } finally {
      setSavingNominee(false);
    }
  };

  const submitGrievance = async () => {
    if (!grievanceDescription.trim()) {
      showToast('Please describe the issue before submitting.');
      return;
    }
    setSubmittingGrievance(true);
    try {
      const res = await apiClient.privacy.submitGrievance({
        category: grievanceCategory,
        description: grievanceDescription.trim(),
      });
      showToast(`Grievance submitted — ticket ${res.data.ticketNumber}.`);
      setGrievanceDescription('');
      const list = await apiClient.privacy.listGrievances();
      setTickets(list.data || []);
    } catch {
      showToast('Failed to submit grievance — please try again.');
    } finally {
      setSubmittingGrievance(false);
    }
  };

  const exportData = async () => {
    setExporting(true);
    try {
      const res = await apiClient.privacy.exportData();
      downloadJson(`repiqr-data-export-${Date.now()}.json`, res.data);
      showToast('Your data export has downloaded.');
    } catch {
      showToast('Failed to export data — please try again.');
    } finally {
      setExporting(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    const res = await deleteAccount('Self-service erasure via Privacy & Data panel');
    setDeleting(false);
    setConfirmingDelete(false);
    if (!res.success) showToast(res.error || 'Failed to delete account.');
    // On success, deleteAccount() already signs the user out — nothing left to render here.
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={22} className="animate-spin text-[var(--fx-ink-2)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--fx-ink)]">Privacy &amp; Data</h1>
      </div>

      {/* What we hold & why */}
      <div className="bg-white border border-[var(--fx-border)] rounded-2xl p-6 space-y-3">
        <h3 className="font-bold text-sm text-[var(--fx-ink)]">How your data is used</h3>
        <div className="space-y-2">
          {(me?.processingActivities || []).map((a: any, i: number) => (
            <div key={i} className="flex items-start justify-between gap-3 text-xs border-b border-[var(--fx-border)] last:border-0 pb-2 last:pb-0">
              <div>
                <p className="font-semibold text-[var(--fx-ink)]">{a.purpose}</p>
                <p className="text-[var(--fx-ink-2)]">{(a.dataUsed || []).join(', ')}</p>
              </div>
              <span className={`shrink-0 px-2 py-0.5 rounded-full font-bold ${a.basis === 'CONSENT' ? 'bg-[var(--fx-amber-soft)] text-[var(--fx-amber)]' : 'bg-[#DCFCE7] text-[#16A34A]'}`}>
                {a.basis === 'CONSENT' ? 'Consent-based' : 'Needed for service'}
              </span>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-[var(--fx-ink-2)] pt-1">Notice version: {me?.noticeVersion}</p>
      </div>

      {/* Shared with */}
      <div className="bg-white border border-[var(--fx-border)] rounded-2xl p-6 space-y-3">
        <h3 className="font-bold text-sm text-[var(--fx-ink)]">Who we share data with</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(me?.sharedWith || []).map((p: any) => (
            <div key={p.name} className="text-xs bg-[var(--fx-canvas)] rounded-xl p-3">
              <p className="font-bold text-[var(--fx-ink)]">{p.name}</p>
              <p className="text-[var(--fx-ink-2)]">{p.purpose}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Consent */}
      <div className="bg-white border border-[var(--fx-border)] rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-sm text-[var(--fx-ink)]">Optional consent</h3>
        {consents.filter((c) => CONSENT_LABELS[c.purpose]).map((c) => {
          const granted = c.status === 'GRANTED';
          return (
            <div key={c.purpose} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[var(--fx-ink)]">{CONSENT_LABELS[c.purpose].title}</p>
                <p className="text-xs text-[var(--fx-ink-2)]">{CONSENT_LABELS[c.purpose].description}</p>
              </div>
              <button
                onClick={() => toggleConsent(c.purpose, granted)}
                disabled={busyPurpose === c.purpose}
                className={`shrink-0 w-12 h-7 rounded-full relative transition-colors cursor-pointer disabled:opacity-60 ${granted ? 'bg-[var(--fx-accent)]' : 'bg-gray-300'}`}
                aria-pressed={granted}
                aria-label={`Toggle ${CONSENT_LABELS[c.purpose].title}`}
              >
                <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${granted ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Nominee */}
      <div className="bg-white border border-[var(--fx-border)] rounded-2xl p-6 space-y-3">
        <h3 className="font-bold text-sm text-[var(--fx-ink)] flex items-center gap-2"><UserPlus size={15} /> Nominee</h3>
        <p className="text-xs text-[var(--fx-ink-2)]">Name someone who can exercise your data rights on your behalf if you're unable to.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input value={nomineeName} onChange={(e) => setNomineeName(e.target.value)} placeholder="Full name" className="px-3.5 py-2.5 text-sm bg-[var(--fx-canvas)] border border-[var(--fx-border)] rounded-xl outline-none focus:border-[var(--fx-ink)]" />
          <input value={nomineeRelationship} onChange={(e) => setNomineeRelationship(e.target.value)} placeholder="Relationship (e.g. Spouse)" className="px-3.5 py-2.5 text-sm bg-[var(--fx-canvas)] border border-[var(--fx-border)] rounded-xl outline-none focus:border-[var(--fx-ink)]" />
          <input value={nomineePhone} onChange={(e) => setNomineePhone(e.target.value)} placeholder="Contact phone" className="px-3.5 py-2.5 text-sm bg-[var(--fx-canvas)] border border-[var(--fx-border)] rounded-xl outline-none focus:border-[var(--fx-ink)]" />
          <input value={nomineeEmail} onChange={(e) => setNomineeEmail(e.target.value)} placeholder="Contact email" className="px-3.5 py-2.5 text-sm bg-[var(--fx-canvas)] border border-[var(--fx-border)] rounded-xl outline-none focus:border-[var(--fx-ink)]" />
        </div>
        <button onClick={saveNominee} disabled={savingNominee} className="fx-btn fx-btn-secondary text-xs disabled:opacity-60 flex items-center gap-1.5 w-fit">
          {savingNominee && <Loader2 size={13} className="animate-spin" />} Save Nominee
        </button>
      </div>

      {/* Export */}
      <div className="bg-white border border-[var(--fx-border)] rounded-2xl p-6 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-sm text-[var(--fx-ink)]">Download your data</h3>
          <p className="text-xs text-[var(--fx-ink-2)]">A machine-readable export of everything tied to your account.</p>
        </div>
        <button onClick={exportData} disabled={exporting} className="fx-btn fx-btn-secondary text-xs disabled:opacity-60 flex items-center gap-1.5 shrink-0">
          {exporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Export
        </button>
      </div>

      {/* Grievance */}
      <div className="bg-white border border-[var(--fx-border)] rounded-2xl p-6 space-y-3">
        <h3 className="font-bold text-sm text-[var(--fx-ink)] flex items-center gap-2"><MessageSquareWarning size={15} /> Raise a privacy grievance</h3>
        <select value={grievanceCategory} onChange={(e) => setGrievanceCategory(e.target.value)} className="px-3.5 py-2.5 text-sm bg-[var(--fx-canvas)] border border-[var(--fx-border)] rounded-xl outline-none focus:border-[var(--fx-ink)]">
          <option value="general">General</option>
          <option value="data_exposure">My data was exposed</option>
          <option value="consent">Consent issue</option>
          <option value="erasure">Deletion/erasure issue</option>
        </select>
        <textarea
          value={grievanceDescription}
          onChange={(e) => setGrievanceDescription(e.target.value)}
          placeholder="Describe the issue..."
          className="w-full px-3.5 py-2.5 text-sm bg-[var(--fx-canvas)] border border-[var(--fx-border)] rounded-xl outline-none focus:border-[var(--fx-ink)] min-h-[90px]"
        />
        <button onClick={submitGrievance} disabled={submittingGrievance} className="fx-btn fx-btn-secondary text-xs disabled:opacity-60 flex items-center gap-1.5 w-fit">
          {submittingGrievance && <Loader2 size={13} className="animate-spin" />} Submit
        </button>

        {tickets.length > 0 && (
          <div className="pt-2 space-y-1.5">
            {tickets.map((t) => (
              <div key={t.id} className="flex items-center justify-between text-xs bg-[var(--fx-canvas)] rounded-lg px-3 py-2">
                <span className="font-mono">{t.ticketNumber}</span>
                <span className="text-[var(--fx-ink-2)]">{t.category}</span>
                <span className="font-bold">{t.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Erasure */}
      <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-2xl p-6 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-sm text-[#DC2626] flex items-center gap-2"><Trash2 size={15} /> Erase my data</h3>
          <p className="text-xs text-[#991B1B]">Permanently deletes your account, stickers' link to you, and chat history. Cannot be undone.</p>
        </div>
        <button onClick={() => setConfirmingDelete(true)} className="fx-btn fx-btn-danger text-xs shrink-0">Request Erasure</button>
      </div>

      <FxModal
        isOpen={confirmingDelete}
        onClose={() => !deleting && setConfirmingDelete(false)}
        title="Delete your account?"
        icon={<Trash2 size={18} />}
        iconTone="danger"
        footer={
          <>
            <button onClick={() => setConfirmingDelete(false)} disabled={deleting} className="fx-btn fx-btn-secondary flex-1">Cancel</button>
            <button onClick={confirmDelete} disabled={deleting} className="fx-btn fx-btn-danger flex-1 flex items-center justify-center gap-1.5">
              {deleting && <Loader2 size={13} className="animate-spin" />} Confirm Delete
            </button>
          </>
        }
      >
        This permanently deletes your account and unlinks your stickers and chat history. It cannot be undone.
      </FxModal>

      <div className="flex items-center gap-2 text-[11px] text-[var(--fx-ink-2)] justify-center pt-2">
        <ShieldCheck size={13} /> Data is processed only for the purposes shown above.
      </div>
    </div>
  );
}

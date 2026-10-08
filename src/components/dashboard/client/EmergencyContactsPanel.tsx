import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Loader2, Save, Users, AlertCircle, MessageCircle, Check } from 'lucide-react';
import { getCategoryIcon, getCategoryLabel } from '../../../stickerModules';
import type { DashboardSticker, EmergencyContact } from './types';
import PhoneInputWithCountry from '../../common/PhoneInputWithCountry';

const MAX_EMERGENCY_CONTACTS = 7;
const inputCls =
  'w-full px-3 py-2 text-xs bg-[var(--fx-canvas)] border border-[var(--fx-border)] rounded-[var(--fx-radius-control)] outline-none focus:border-[var(--fx-accent)] font-semibold';

function StickerContactsCard({
  sticker,
  allStickers = [],
  onSave,
}: {
  sticker: DashboardSticker;
  allStickers?: DashboardSticker[];
  onSave: (stickerId: string, contacts: EmergencyContact[]) => Promise<void>;
}) {
  const [contacts, setContacts] = useState<EmergencyContact[]>(() =>
    Array.isArray(sticker.contacts)
      ? sticker.contacts.filter((c) => c && (c.name?.trim() || c.phone?.trim()))
      : []
  );
  const [applyToAll, setApplyToAll] = useState(allStickers.length > 1);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const cleaned = Array.isArray(sticker.contacts)
      ? sticker.contacts.filter((c) => c && (c.name?.trim() || c.phone?.trim()))
      : [];
    setContacts(cleaned);
    setDirty(false);
    setValidationError(null);
    setSaveSuccess(false);
  }, [sticker.id, sticker.contacts]);

  const updateContact = (idx: number, field: 'name' | 'phone', value: string) => {
    setContacts((prev) => prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c)));
    setDirty(true);
    setValidationError(null);
    setSaveSuccess(false);
  };

  const removeContact = (idx: number) => {
    setContacts((prev) => prev.filter((_, i) => i !== idx));
    setDirty(true);
    setValidationError(null);
    setSaveSuccess(false);
  };

  const addContact = () => {
    if (contacts.length >= MAX_EMERGENCY_CONTACTS) {
      setValidationError(`Maximum limit of ${MAX_EMERGENCY_CONTACTS} emergency contacts reached.`);
      return;
    }
    setContacts((prev) => [...prev, { name: '', phone: '' }]);
    setDirty(true);
    setValidationError(null);
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    setValidationError(null);
    const cleaned = contacts.filter((c) => c.name.trim() || c.phone.trim());

    // Validate that contact members' phone numbers are 10-digit mobile numbers first
    for (let i = 0; i < cleaned.length; i++) {
      const c = cleaned[i];
      const name = c.name.trim();
      const phoneDigits = c.phone.replace(/\D/g, '');

      if (!name) {
        setValidationError(`Please enter a name for contact #${i + 1}.`);
        return;
      }
      if (phoneDigits.length < 10) {
        setValidationError(`Please enter a valid 10-digit active WhatsApp number for ${name}.`);
        return;
      }
    }

    setSaving(true);
    try {
      await onSave(sticker.id, cleaned);
      if (applyToAll && allStickers.length > 1) {
        const others = allStickers.filter((s) => s.id !== sticker.id);
        await Promise.all(others.map((s) => onSave(s.id, cleaned)));
      }
      setDirty(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setValidationError('Failed to save contacts. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-[var(--fx-radius-card)] p-5 space-y-4 border border-[var(--fx-border)] shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[var(--fx-radius-tile)] bg-[var(--fx-canvas)] flex items-center justify-center text-lg flex-shrink-0">
            {getCategoryIcon(sticker.category as any) || '🏷️'}
          </div>
          <div>
            <h3 className="font-bold text-sm text-[var(--fx-ink)] leading-tight">{sticker.nickname}</h3>
            <p className="text-[11px] font-semibold text-[var(--fx-ink-2)]">
              {getCategoryLabel(sticker.category as any) || sticker.code}
              {sticker.vehicleNumber ? ` · ${sticker.vehicleNumber}` : ''}
            </p>
          </div>
        </div>
        <span className="text-[11px] font-bold text-[var(--fx-ink-2)] bg-[var(--fx-canvas)] px-2.5 py-1 rounded-[var(--fx-radius-pill)] border border-[var(--fx-border)]">
          {contacts.length}/{MAX_EMERGENCY_CONTACTS}
        </span>
      </div>

      {contacts.length === 0 ? (
        <div className="py-6 px-4 text-center rounded-[var(--fx-radius-control)] bg-[var(--fx-canvas)] border border-dashed border-[var(--fx-border)] space-y-2.5">
          <p className="text-xs font-bold text-[var(--fx-ink)]">No emergency contacts added yet</p>
          <p className="text-[11px] text-[var(--fx-ink-2)] max-w-sm mx-auto leading-relaxed">
            Add trusted family or friends who should receive immediate WhatsApp SOS alerts if someone scans this tag during an emergency.
          </p>
          <div>
            <button
              type="button"
              onClick={addContact}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[var(--fx-radius-control)] bg-[var(--fx-accent)] hover:bg-[var(--fx-accent-hover)] text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
            >
              <Plus size={14} />
              <span>Add Emergency Contact</span>
            </button>
          </div>
        </div>
      ) : (
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
                  placeholder="10-digit WhatsApp number"
                />
              </div>
              <button
                type="button"
                onClick={() => removeContact(idx)}
                title="Remove"
                className="w-9 h-9 flex-shrink-0 rounded-[var(--fx-radius-control)] bg-[#FEE2E2] text-[#DC2626] hover:bg-[#FECACA] flex items-center justify-center cursor-pointer mt-0.5 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={addContact}
              disabled={contacts.length >= MAX_EMERGENCY_CONTACTS}
              className="py-1.5 px-3 rounded-[var(--fx-radius-control)] border border-dashed border-[var(--fx-border-strong)] text-[11px] font-bold text-[var(--fx-ink-2)] hover:bg-[var(--fx-canvas)] flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Plus size={12} />
              {contacts.length >= MAX_EMERGENCY_CONTACTS ? 'Max 7 Contacts Reached' : 'Add Another Contact'}
            </button>
          </div>
        </div>
      )}

      {validationError && (
        <div className="flex items-center gap-1.5 p-2.5 rounded-[var(--fx-radius-control)] bg-red-50 text-xs font-medium text-red-700">
          <AlertCircle size={14} className="shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="flex items-center gap-1.5 p-2.5 rounded-[var(--fx-radius-control)] bg-emerald-50 text-xs font-semibold text-emerald-800 border border-emerald-200">
          <Check size={14} className="shrink-0 text-emerald-600" />
          <span>Emergency contacts saved successfully!</span>
        </div>
      )}

      {allStickers.length > 1 && (
        <div className="pt-2 border-t border-[var(--fx-border)]">
          <label className="flex items-center gap-2 text-xs font-semibold text-[var(--fx-ink-2)] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={applyToAll}
              onChange={(e) => setApplyToAll(e.target.checked)}
              className="rounded border-[var(--fx-border)] text-[var(--fx-accent)] focus:ring-0 cursor-pointer"
            />
            <span>Apply these emergency contacts to all {allStickers.length} safety stickers</span>
          </label>
        </div>
      )}

      {(dirty || contacts.length > 0) && (
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || (!dirty && contacts.length === sticker.contacts.length)}
            className="flex-1 py-2 rounded-[var(--fx-radius-control)] bg-[var(--fx-accent)] hover:bg-[var(--fx-accent-hover)] text-white text-xs font-bold disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 transition-colors shadow-xs"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            <span>Save Contacts</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function EmergencyContactsPanel({
  products,
  onSaveContacts,
}: {
  products: DashboardSticker[];
  onSaveContacts: (stickerId: string, contacts: EmergencyContact[]) => Promise<void>;
}) {
  const [selectedStickerId, setSelectedStickerId] = useState<string>(() => products[0]?.id || '');

  useEffect(() => {
    if (products.length > 0 && !products.some((p) => p.id === selectedStickerId)) {
      setSelectedStickerId(products[0].id);
    }
  }, [products, selectedStickerId]);

  const activeSticker = products.find((p) => p.id === selectedStickerId) || products[0];
  const withContactsCount = products.filter((p) => p.contacts && p.contacts.length > 0).length;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h1 className="fx-text-heading-page text-[var(--fx-ink)]">Emergency Contacts</h1>
        <p className="text-[13px] text-[var(--fx-ink-2)] mt-1">
          {withContactsCount > 0
            ? `${withContactsCount} of ${products.length} sticker${products.length === 1 ? '' : 's'} with contacts attached`
            : 'Attach emergency contacts to your safety stickers'}
        </p>
      </div>

      <div className="flex items-start gap-3 p-4 rounded-[var(--fx-radius-card)] bg-emerald-50 border border-emerald-200 text-emerald-950">
        <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
          <MessageCircle size={17} />
        </div>
        <div>
          <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
            Active WhatsApp Number Required
          </h4>
          <p className="text-xs text-emerald-800 mt-1 leading-relaxed font-medium">
            Please make sure every emergency contact number is actively registered on WhatsApp. When someone scans
            your tag during an emergency or sends an SOS alert, notifications and live location links are delivered
            directly to these WhatsApp numbers.
          </p>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="bg-white rounded-[var(--fx-radius-card)] p-10 text-center space-y-3 border border-[var(--fx-border)]">
          <Users size={32} className="mx-auto text-[var(--fx-faint)]" />
          <h3 className="text-base font-bold text-[var(--fx-ink)]">No stickers yet</h3>
          <p className="text-xs text-[var(--fx-ink-2)] max-w-sm mx-auto">
            Activate a sticker first — emergency contacts are attached per sticker.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {products.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-xs font-bold text-[var(--fx-ink-2)] shrink-0">Sticker:</span>
              <div className="flex flex-wrap gap-2">
                {products.map((p, idx) => {
                  const isSelected = p.id === activeSticker?.id;
                  const count = p.contacts?.length || 0;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedStickerId(p.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-[var(--fx-ink)] text-white shadow-xs'
                          : 'bg-white border border-[var(--fx-border)] text-[var(--fx-ink-2)] hover:bg-[var(--fx-canvas)]'
                      }`}
                    >
                      <span>{getCategoryIcon(p.category as any) || '🏷️'}</span>
                      <span>{p.nickname || `Sticker #${idx + 1}`}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {count}/7
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeSticker && (
            <StickerContactsCard
              key={activeSticker.id}
              sticker={activeSticker}
              allStickers={products}
              onSave={onSaveContacts}
            />
          )}
        </div>
      )}
    </div>
  );
}

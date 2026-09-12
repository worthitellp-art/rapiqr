import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Loader2, Save, Users } from 'lucide-react';
import { getCategoryIcon, getCategoryLabel } from '../../../stickerModules';
import type { DashboardSticker, EmergencyContact } from './types';
import PhoneInputWithCountry from '../../common/PhoneInputWithCountry';

const inputCls = 'w-full px-3 py-2.5 text-xs bg-[var(--fx-canvas)] border border-[var(--fx-border)] rounded-xl outline-none focus:border-[var(--fx-ink)] font-semibold';

function StickerContactsCard({
  sticker,
  onSave,
}: {
  key?: string;
  sticker: DashboardSticker;
  onSave: (stickerId: string, contacts: EmergencyContact[]) => Promise<void>;
}) {
  const [contacts, setContacts] = useState<EmergencyContact[]>(sticker.contacts);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setContacts(sticker.contacts);
    setDirty(false);
  }, [sticker.contacts]);

  const updateContact = (idx: number, field: 'name' | 'phone', value: string) => {
    setContacts((prev) => prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c)));
    setDirty(true);
  };
  const removeContact = (idx: number) => {
    setContacts((prev) => prev.filter((_, i) => i !== idx));
    setDirty(true);
  };
  const addContact = () => {
    setContacts((prev) => [...prev, { name: '', phone: '' }]);
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const cleaned = contacts.filter((c) => c.name.trim() || c.phone.trim());
    await onSave(sticker.id, cleaned);
    setSaving(false);
    setDirty(false);
  };

  return (
    <div className="bg-white border border-[var(--fx-border)] rounded-2xl p-5 space-y-3.5 shadow-xs">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--fx-canvas)] border border-[var(--fx-border)] flex items-center justify-center text-lg flex-shrink-0">
          {getCategoryIcon(sticker.category as any) || '🏷️'}
        </div>
        <div>
          <h3 className="font-bold text-sm text-[var(--fx-ink)] leading-tight">{sticker.nickname}</h3>
          <p className="text-[11px] font-semibold text-[var(--fx-faint)]">{getCategoryLabel(sticker.category as any) || sticker.code}</p>
        </div>
      </div>

      <div className="space-y-3">
        {contacts.length === 0 && (
          <p className="text-xs text-[var(--fx-faint)] italic">No emergency contacts added yet.</p>
        )}
        {contacts.map((c, idx) => (
          <div key={idx} className="flex gap-2 items-start">
            <div className="w-1/3 flex-shrink-0">
              <input className={inputCls} value={c.name} onChange={(e) => updateContact(idx, 'name', e.target.value)} placeholder="Contact name" />
            </div>
            <div className="flex-1">
              <PhoneInputWithCountry
                value={c.phone}
                onChange={(full) => updateContact(idx, 'phone', full)}
                placeholder="10-digit mobile"
              />
            </div>
            <button onClick={() => removeContact(idx)} title="Remove" className="w-9 h-9 flex-shrink-0 rounded-xl bg-[#FEE2E2] text-[#DC2626] hover:bg-[#FECACA] flex items-center justify-center cursor-pointer mt-0.5">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button onClick={addContact} className="flex-1 py-2.5 rounded-xl border border-dashed border-[var(--fx-border)] text-[11px] font-bold text-[var(--fx-ink-2)] hover:bg-[var(--fx-canvas)] flex items-center justify-center gap-1.5 cursor-pointer">
          <Plus size={12} /> Add Contact
        </button>
        {dirty && (
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-[var(--fx-accent)] hover:bg-[var(--fx-accent-ink)] text-white text-[11px] font-bold disabled:opacity-60 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shadow-[var(--fx-accent)]/20 transition-all">
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save Contacts
          </button>
        )}
      </div>
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
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--fx-ink)]">Emergency Contacts</h1>
        <p className="text-xs sm:text-sm text-[var(--fx-ink-2)] mt-1">Add, edit or remove emergency contacts for each of your stickers, any time.</p>
      </div>

      {products.length === 0 ? (
        <div className="bg-white border border-[var(--fx-border)] rounded-3xl p-12 text-center space-y-3 shadow-sm">
          <Users size={32} className="mx-auto text-[var(--fx-faint)]" />
          <h3 className="text-lg font-bold text-[var(--fx-ink)]">No stickers yet</h3>
          <p className="text-xs text-[var(--fx-ink-2)] max-w-sm mx-auto">Activate a sticker first — emergency contacts are attached per sticker.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {products.map((p) => (
            <StickerContactsCard key={p.id} sticker={p} onSave={onSaveContacts} />
          ))}
        </div>
      )}
    </div>
  );
}

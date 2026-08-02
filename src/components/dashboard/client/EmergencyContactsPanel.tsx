import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Loader2, Save, Users } from 'lucide-react';
import { getCategoryIcon, getCategoryLabel } from '../../../stickerModules';
import type { DashboardSticker, EmergencyContact } from './types';
import PhoneInputWithCountry from '../../common/PhoneInputWithCountry';

const inputCls = 'w-full px-3 py-2.5 text-xs bg-[#F5F6FA] border border-[#E8ECF4] rounded-xl outline-none focus:border-[#111111] font-semibold';

function StickerContactsCard({
  sticker,
  onSave,
}: {
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
    <div className="bg-white border border-[#E8ECF4] rounded-2xl p-5 space-y-3.5 shadow-2xs">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#F1F5F9] flex items-center justify-center text-lg flex-shrink-0">
          {getCategoryIcon(sticker.category as any) || '🏷️'}
        </div>
        <div>
          <h3 className="font-bold text-sm text-[#1A1D26] leading-tight">{sticker.nickname}</h3>
          <p className="text-[11px] font-semibold text-[#94A3B8]">{getCategoryLabel(sticker.category as any) || sticker.code}</p>
        </div>
      </div>

      <div className="space-y-3">
        {contacts.length === 0 && (
          <p className="text-xs text-[#94A3B8] italic">No emergency contacts added yet.</p>
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
        <button onClick={addContact} className="flex-1 py-2 rounded-lg border border-dashed border-[#E8ECF4] text-[11px] font-bold text-[#64748B] hover:bg-[#F5F6FA] flex items-center justify-center gap-1.5 cursor-pointer">
          <Plus size={12} /> Add Contact
        </button>
        {dirty && (
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2 rounded-lg bg-[#111111] hover:bg-black text-white text-[11px] font-bold disabled:opacity-60 cursor-pointer flex items-center justify-center gap-1.5">
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
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
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1D26]">Emergency Contacts</h1>
        <p className="text-xs sm:text-sm text-[#64748B] mt-1">Add, edit or remove emergency contacts for each of your stickers, any time.</p>
      </div>

      {products.length === 0 ? (
        <div className="bg-white border border-[#E8ECF4] rounded-3xl p-12 text-center space-y-3 shadow-sm">
          <Users size={32} className="mx-auto text-[#94A3B8]" />
          <h3 className="text-lg font-bold text-[#1A1D26]">No stickers yet</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">Activate a sticker first — emergency contacts are attached per sticker.</p>
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

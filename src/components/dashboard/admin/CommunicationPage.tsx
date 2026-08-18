import type React from "react";
import { useState, useEffect } from "react";
import { Plus, Trash2, Phone, Wrench, Battery, Truck, Settings, Users, Ambulance, ShieldAlert, Car, Lightbulb, AlertTriangle } from "lucide-react";
import { useLocalStorage } from "./useLocalStorage";
import { getCommunicationProvidersFromDb, saveCommunicationProviderToDb, deleteCommunicationProviderFromDb } from "../../../lib/supabaseService";
import PhoneInputWithCountry from "../../common/PhoneInputWithCountry";

const CATEGORIES = ["Ambulance", "Towing", "Mechanic", "Flat Tire", "Battery", "Fuel", "Parking", "Police", "Theft", "Headlights", "Family"];

const CATEGORY_META: Record<string, { icon: React.ReactNode; color: string; bg: string; placeholder: string }> = {
  Ambulance:  { icon: <Ambulance size={14} />,    color: "#DC2626", bg: "#FDEAEA", placeholder: "e.g. City Ambulance Service" },
  Towing:     { icon: <Truck size={14} />,         color: "#DC2626", bg: "#FDEAEA", placeholder: "e.g. Highway Towing 24x7" },
  Mechanic:   { icon: <Settings size={14} />,       color: "#B8863F", bg: "#FBF3E4", placeholder: "e.g. Mobile Mechanic Near Me" },
  "Flat Tire": { icon: <Wrench size={14} />,        color: "#B8863F", bg: "#FBF3E4", placeholder: "e.g. Puncture Repair Service" },
  Battery:    { icon: <Battery size={14} />,         color: "#B8863F", bg: "#FBF3E4", placeholder: "e.g. Battery Jumpstart Helpline" },
  Fuel:       { icon: <Truck size={14} />,           color: "#5C78DF", bg: "#E8EDFF", placeholder: "e.g. Emergency Fuel Delivery" },
  Parking:    { icon: <Car size={14} />,             color: "#5C78DF", bg: "#E8EDFF", placeholder: "e.g. Parking Enforcement Helpline" },
  Police:     { icon: <ShieldAlert size={14} />,     color: "#7B7FD1", bg: "#EDEDFB", placeholder: "e.g. Local Police Control Room" },
  Theft:      { icon: <AlertTriangle size={14} />,   color: "#DC2626", bg: "#FDEAEA", placeholder: "e.g. Anti-Theft Rapid Response" },
  Headlights: { icon: <Lightbulb size={14} />,       color: "#B8863F", bg: "#FBF3E4", placeholder: "e.g. Roadside Light Assist" },
  Family:     { icon: <Users size={14} />,           color: "#2E9E5B", bg: "#E9F9EF", placeholder: "e.g. Father, Mother, Sibling" },
};

export default function CommunicationPage({ setToast }: { setToast: (msg: string | null) => void }) {
  const [providers, setProviders] = useLocalStorage<any[]>("repiqr-helplines", []);

  // Save changes & dispatch update event
  const saveProviders = (newProviders: any[]) => {
    setProviders(newProviders);
    window.dispatchEvent(new Event("repiqr-helplines-updated"));
    window.dispatchEvent(new Event("namoqr-helplines-updated"));
  };
  const [category, setCategory] = useState("Ambulance");
  const [label, setLabel] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    getCommunicationProvidersFromDb().then((dbData) => {
      if (dbData && Array.isArray(dbData) && dbData.length > 0) {
        setProviders(dbData);
      }
    });
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !phone.trim()) return;
    const p = { id: `prov-${Date.now()}`, category, label: label.trim(), phone: phone.trim(), active: true };
    setProviders([p, ...providers]);
    window.dispatchEvent(new Event("namoqr-helplines-updated"));
    
    await saveCommunicationProviderToDb({ category, label: label.trim(), phone: phone.trim(), active: true });

    setLabel("");
    setPhone("");
    setToast("Provider saved to database");
    setTimeout(() => setToast(null), 2000);
  };

  const handleRemove = async (id: string) => {
    setProviders((prev) => prev.filter((x: any) => x.id !== id));
    await deleteCommunicationProviderFromDb(id);
    setToast("Provider removed from database");
    setTimeout(() => setToast(null), 1500);
  };

  const grouped = CATEGORIES.map((cat) => ({
    cat,
    items: providers.filter((p: any) => p.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="px-8 pt-7 pb-16 space-y-7 text-[#17181A] font-body" style={{ background: "#F7F7F8" }}>
      {/* Add Provider Form */}
      <div className="bg-white border border-[#E5E5E7] p-6 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
        <h3 className="font-display font-semibold text-[#17181A] text-[14px] mb-5 flex items-center gap-2">
          <Phone size={15} className="text-[#B8863F]" /> Add Helpline Provider
        </h3>
        <form onSubmit={handleAdd} className="grid grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-extrabold text-[#777B80] mb-1.5 uppercase tracking-wider">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-[4px] border border-[#E5E5E7] bg-white outline-none focus:border-[#5C78DF] transition-all font-semibold text-[#17181A]"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-extrabold text-[#777B80] mb-1.5 uppercase tracking-wider">Provider Name</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={CATEGORY_META[category]?.placeholder || "e.g. Provider Name"}
              className="w-full px-3.5 py-2.5 text-sm rounded-[4px] border border-[#E5E5E7] bg-white outline-none focus:border-[#5C78DF] transition-all font-semibold text-[#17181A]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-extrabold text-[#777B80] mb-1.5 uppercase tracking-wider">Phone Number</label>
            <PhoneInputWithCountry value={phone} onChange={(full) => setPhone(full)} />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={!label.trim() || !phone.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[4px] bg-[#17181A] hover:bg-[#2A2B2E] text-white text-sm font-bold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Plus size={14} /> Add
            </button>
          </div>
        </form>
      </div>

      {/* Provider List grouped by category */}
      {grouped.length > 0 ? (
        <div className="space-y-3">
          {grouped.map(({ cat, items }) => {
            const meta = CATEGORY_META[cat] || { icon: <Phone size={14} />, color: "#777B80", bg: "#F3F3F4" };
            return (
              <div key={cat} className="bg-white border border-[#E5E5E7] overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
                {/* Category Header */}
                <div className="px-5 py-3 border-b border-[#E5E5E7] bg-[#F7F7F8] flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-[4px] flex items-center justify-center" style={{ background: meta.bg, color: meta.color }}>
                    {meta.icon}
                  </div>
                  <span className="text-xs font-extrabold text-[#17181A] uppercase tracking-wider">{cat}</span>
                  <span className="text-[10px] text-[#777B80] font-semibold bg-[#F3F3F4] px-1.5 py-0.5 rounded-[4px]">{items.length}</span>
                </div>
                {/* Items */}
                {items.map((p: any) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5E5E7] last:border-0 hover:bg-[#F3F3F4] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-[4px] flex items-center justify-center flex-shrink-0" style={{ background: meta.bg, color: meta.color }}>
                        {meta.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#17181A] truncate">{p.label}</p>
                        <p className="text-[11px] text-[#777B80] font-mono font-semibold mt-0.5">{p.phone}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(p.id)}
                      className="w-7 h-7 rounded-[4px] hover:bg-[#FDEAEA] hover:text-[#DC2626] flex items-center justify-center text-[#9CA0A6] transition-all cursor-pointer flex-shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-[#E5E5E7] p-12 text-center shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
          <div className="w-12 h-12 rounded-[4px] bg-[#F3F3F4] flex items-center justify-center mx-auto mb-3">
            <Phone size={20} className="text-[#9CA0A6]" />
          </div>
          <p className="text-sm font-semibold text-[#17181A]">No providers added yet</p>
          <p className="text-xs text-[#777B80] mt-1">Add your first helpline provider above</p>
        </div>
      )}
    </div>
  );
}

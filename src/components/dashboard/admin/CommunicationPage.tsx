import type React from "react";
import { useState, useEffect } from "react";
import { Plus, Trash2, Phone, Wrench, Battery, Truck, Settings, Users, Ambulance, ShieldAlert, Car, Lightbulb, AlertTriangle } from "lucide-react";
import { useLocalStorage } from "./useLocalStorage";
import { getCommunicationProvidersFromDb, saveCommunicationProviderToDb, deleteCommunicationProviderFromDb } from "../../../lib/supabaseService";
import PhoneInputWithCountry from "../../common/PhoneInputWithCountry";

const CATEGORIES = ["Ambulance", "Towing", "Mechanic", "Flat Tire", "Battery", "Fuel", "Parking", "Police", "Theft", "Headlights", "Family"];

const CATEGORY_META: Record<string, { icon: React.ReactNode; color: string; bg: string; placeholder: string }> = {
  Ambulance:  { icon: <Ambulance size={14} />,    color: "text-red-600",     bg: "bg-red-50",     placeholder: "e.g. City Ambulance Service" },
  Towing:     { icon: <Truck size={14} />,         color: "text-red-500",     bg: "bg-red-50",     placeholder: "e.g. Highway Towing 24x7" },
  Mechanic:   { icon: <Settings size={14} />,       color: "text-orange-600",  bg: "bg-orange-50",  placeholder: "e.g. Mobile Mechanic Near Me" },
  "Flat Tire": { icon: <Wrench size={14} />,        color: "text-amber-600",   bg: "bg-amber-50",   placeholder: "e.g. Puncture Repair Service" },
  Battery:    { icon: <Battery size={14} />,         color: "text-yellow-600",  bg: "bg-yellow-50",  placeholder: "e.g. Battery Jumpstart Helpline" },
  Fuel:       { icon: <Truck size={14} />,           color: "text-blue-600",    bg: "bg-blue-50",    placeholder: "e.g. Emergency Fuel Delivery" },
  Parking:    { icon: <Car size={14} />,             color: "text-blue-500",    bg: "bg-blue-50",    placeholder: "e.g. Parking Enforcement Helpline" },
  Police:     { icon: <ShieldAlert size={14} />,     color: "text-indigo-600",  bg: "bg-indigo-50",  placeholder: "e.g. Local Police Control Room" },
  Theft:      { icon: <AlertTriangle size={14} />,   color: "text-rose-600",    bg: "bg-rose-50",    placeholder: "e.g. Anti-Theft Rapid Response" },
  Headlights: { icon: <Lightbulb size={14} />,       color: "text-amber-500",   bg: "bg-amber-50",   placeholder: "e.g. Roadside Light Assist" },
  Family:     { icon: <Users size={14} />,           color: "text-emerald-600", bg: "bg-emerald-50", placeholder: "e.g. Father, Mother, Sibling" },
};

export default function CommunicationPage({ setToast }: { setToast: (msg: string | null) => void }) {
  const [providers, setProviders] = useLocalStorage<any[]>("namoqr-helplines", []);
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
    <div className="px-8 pt-7 pb-10 space-y-6 text-gray-900 font-sans">
      {/* Add Provider Form */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-bold text-gray-900 text-sm mb-5 flex items-center gap-2">
          <Phone size={15} className="text-orange-500" /> Add Helpline Provider
        </h3>
        <form onSubmit={handleAdd} className="grid grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-extrabold text-gray-500 mb-1.5 uppercase tracking-wider">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 outline-none focus:bg-white focus:border-gray-400 transition-all font-semibold text-gray-900"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-extrabold text-gray-500 mb-1.5 uppercase tracking-wider">Provider Name</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={CATEGORY_META[category]?.placeholder || "e.g. Provider Name"}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 outline-none focus:bg-white focus:border-gray-400 transition-all font-semibold text-gray-900"
            />
          </div>
          <div>
            <label className="block text-[10px] font-extrabold text-gray-500 mb-1.5 uppercase tracking-wider">Phone Number</label>
            <PhoneInputWithCountry value={phone} onChange={(full) => setPhone(full)} />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={!label.trim() || !phone.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#111111] hover:bg-gray-800 text-white text-sm font-bold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm"
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
            const meta = CATEGORY_META[cat] || { icon: <Phone size={14} />, color: "text-gray-600", bg: "bg-gray-50" };
            return (
              <div key={cat} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {/* Category Header */}
                <div className="px-5 py-3 border-b border-gray-50 bg-gray-50/60 flex items-center gap-2.5">
                  <div className={`w-6 h-6 rounded-lg ${meta.bg} ${meta.color} flex items-center justify-center`}>
                    {meta.icon}
                  </div>
                  <span className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">{cat}</span>
                  <span className="text-[10px] text-gray-400 font-semibold bg-gray-100 px-1.5 py-0.5 rounded-md">{items.length}</span>
                </div>
                {/* Items */}
                {items.map((p: any) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between px-5 py-3.5 border-b last:border-0 hover:bg-gray-50/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg ${meta.bg} ${meta.color} flex items-center justify-center flex-shrink-0`}>
                        {meta.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">{p.label}</p>
                        <p className="text-[11px] text-gray-500 font-mono font-semibold mt-0.5">{p.phone}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(p.id)}
                      className="w-7 h-7 rounded-lg hover:bg-red-50 hover:text-red-500 flex items-center justify-center text-gray-400 transition-all cursor-pointer flex-shrink-0"
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
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Phone size={20} className="text-gray-300" />
          </div>
          <p className="text-sm font-semibold text-gray-500">No providers added yet</p>
          <p className="text-xs text-gray-400 mt-1">Add your first helpline provider above</p>
        </div>
      )}
    </div>
  );
}

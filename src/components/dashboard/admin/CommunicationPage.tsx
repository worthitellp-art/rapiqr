import { useState } from "react";
import { Plus, Trash2, Phone, Wrench, Battery, Truck, Settings } from "lucide-react";
import { useLocalStorage } from "./useLocalStorage";

const CATEGORIES = ["Towing", "Flat Tire", "Battery", "Mechanic", "Fuel", "Ambulance", "Police"];

export default function CommunicationPage({ setToast }: { setToast: (msg: string | null) => void }) {
  const [providers, setProviders] = useLocalStorage<any[]>("namoqr-helplines", [
    { id: "prov-1", category: "Towing", label: "National Flatbed Towing 24x7", phone: "+91 98765 00001", active: true },
    { id: "prov-2", category: "Flat Tire", label: "Quick Puncture Repair Assist", phone: "+91 98765 00002", active: true },
    { id: "prov-3", category: "Battery", label: "Battery Jumpstart & Fuel Helpline", phone: "+91 98765 00003", active: true },
    { id: "prov-4", category: "Mechanic", label: "Emergency Mobile Mechanics", phone: "+91 98765 00004", active: true },
  ]);
  const [category, setCategory] = useState("Towing");
  const [label, setLabel] = useState("");
  const [phone, setPhone] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !phone.trim()) return;
    const p = { id: `prov-${Date.now()}`, category, label: label.trim(), phone: phone.trim(), active: true };
    setProviders([p, ...providers]);
    window.dispatchEvent(new Event("namoqr-helplines-updated"));
    setLabel(""); setPhone("");
    setToast("Helpline provider added"); setTimeout(() => setToast(null), 2000);
  };

  const inputCls = "w-full px-3.5 py-2.5 text-sm rounded-xl border bg-gray-50 outline-none focus:bg-white focus:border-gray-400 transition-all font-semibold text-gray-900";

  const categoryIcons: Record<string, React.ReactNode> = {
    Towing: <Truck size={14} />,
    "Flat Tire": <Wrench size={14} />,
    Battery: <Battery size={14} />,
    Mechanic: <Settings size={14} />,
  };

  return (
    <div className="px-8 pt-7 pb-10 space-y-6 text-gray-900">
      <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "#f0f0f0" }}>
        <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
          <Phone size={15} style={{ color: "var(--accent)" }} /> Add Helpline Provider
        </h3>
        <form onSubmit={handleAdd} className="grid grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-extrabold text-gray-500 mb-1.5 uppercase tracking-wider">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls} style={{ borderColor: "#e2e8f0" }}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-extrabold text-gray-500 mb-1.5 uppercase tracking-wider">Provider Name</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Quick Towing Co." className={inputCls} style={{ borderColor: "#e2e8f0" }} />
          </div>
          <div>
            <label className="block text-[10px] font-extrabold text-gray-500 mb-1.5 uppercase tracking-wider">Phone Number</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" className={inputCls} style={{ borderColor: "#e2e8f0" }} />
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={!label.trim() || !phone.trim()} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm" style={{ background: "var(--accent)" }}>
              <Plus size={14} /> Add Provider
            </button>
          </div>
        </form>
      </div>

      {/* Provider list */}
      <div className="space-y-2">
        {CATEGORIES.map((cat) => {
          const items = providers.filter((p: any) => p.category === cat);
          if (items.length === 0) return null;
          return (
            <div key={cat} className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#f0f0f0" }}>
              <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: "#f7f7f7", background: "#fafafa" }}>
                <span style={{ color: "var(--accent)" }}>{categoryIcons[cat] || <Phone size={14} />}</span>
                <span className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">{cat}</span>
                <span className="text-[10px] text-gray-500 font-semibold">· {items.length}</span>
              </div>
              {items.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3 border-b last:border-0 hover:bg-gray-50/50 transition-colors" style={{ borderColor: "#f7f7f7" }}>
                  <div>
                    <p className="text-xs font-bold text-gray-900">{p.label}</p>
                    <p className="text-[11px] text-gray-500 font-mono font-semibold mt-0.5">{p.phone}</p>
                  </div>
                  <button
                    onClick={() => { setProviders((prev) => prev.filter((x: any) => x.id !== p.id)); setToast("Provider removed"); setTimeout(() => setToast(null), 1500); }}
                    className="w-7 h-7 rounded-lg hover:bg-red-50 hover:text-red-500 flex items-center justify-center text-gray-400 transition-all cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          );
        })}
        {providers.length === 0 && (
          <div className="bg-white rounded-2xl border p-10 text-center" style={{ borderColor: "#f0f0f0" }}>
            <p className="text-sm font-semibold text-gray-700">No helpline providers added yet.</p>
            <p className="text-xs text-gray-500 mt-1 font-medium">Add your first provider above.</p>
          </div>
        )}
      </div>
    </div>
  );
}

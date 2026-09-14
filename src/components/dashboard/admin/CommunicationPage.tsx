import type React from "react";
import { useState, useEffect } from "react";
import { Plus, Trash2, Phone, AlertTriangle, Check, Mail, MapPin } from "lucide-react";
import { useLocalStorage } from "./useLocalStorage";
import { apiClient } from "../../../lib/apiClient";
import PhoneInputWithCountry from "../../common/PhoneInputWithCountry";
import { SERVICE_TYPES, slugifyService } from "../../scan/tileActions";
import { getServiceMeta } from "../../scan/serviceMeta";
import { STICKER_CATEGORIES } from "../../../stickerModules";

/**
 * Service provider directory.
 *
 * A provider is matched by SERVICE TYPE (`service_type`) and optionally scoped
 * to specific sticker CATEGORIES. Leaving the category scope empty means "every
 * category", which is what every row created before this screen existed is.
 *
 * `category` is still written with the service type's legacy label, because the
 * bespoke car/bike scan screen looks providers up by that exact string
 * (getAdminContacts("Towing")). Changing it would break the car template.
 */

/** The service type a stored row belongs to, tolerating pre-migration rows. */
function providerSlug(p: any): string {
  return slugifyService(p?.service_type || p?.category);
}

async function saveProvider(provider: {
  id?: string; category: string; serviceType?: string; categories?: string[];
  label: string; phone: string; active?: boolean;
  email?: string | null; city?: string | null; notes?: string | null;
}) {
  try {
    const res = provider.id
      ? await apiClient.helplines.update(provider.id, provider)
      : await apiClient.helplines.create(provider);
    return res.data ? [res.data] : null;
  } catch (err) {
    console.warn('Failed to save communication provider:', err);
    return null;
  }
}

export default function CommunicationPage({ setToast }: { setToast: (msg: string | null) => void }) {
  const [providers, setProviders] = useLocalStorage<any[]>("repiqr-helplines", []);
  const [serviceType, setServiceType] = useState("ambulance");
  const [label, setLabel] = useState("");
  const [phone, setPhone] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const meta = getServiceMeta(serviceType);

  const announce = () => {
    window.dispatchEvent(new Event("repiqr-helplines-updated"));
    window.dispatchEvent(new Event("namoqr-helplines-updated"));
  };

  const flash = (msg: string, ms = 2000) => {
    setToast(msg);
    setTimeout(() => setToast(null), ms);
  };

  useEffect(() => {
    apiClient.helplines.getAll().then((res) => {
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setProviders(res.data);
      }
    }).catch((err) => console.warn('Failed to fetch communication providers:', err));
  }, []);

  const toggleCategory = (value: string) => {
    setCategories((prev) => (prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !phone.trim() || saving) return;

    const type = SERVICE_TYPES.find((s) => s.slug === serviceType);
    if (!type) return;

    setSaving(true);
    try {
      const payload = {
        // Legacy label stays authoritative for the car/bike screen's lookups.
        category: type.legacy || type.label,
        serviceType: type.slug,
        categories,
        label: label.trim(),
        phone: phone.trim(),
        active: true,
      };

      const saved = await saveProvider(payload);
      // Adopt the row the server actually created — the old code invented a
      // local `prov-<timestamp>` id, so later edits (activate/delete) addressed
      // a row that never existed in the database.
      const row = Array.isArray(saved) && saved[0] ? saved[0] : { ...payload, id: `prov-${Date.now()}` };

      setProviders([row, ...providers]);
      announce();

      setLabel("");
      setPhone("");
      setCategories([]);
      flash(Array.isArray(saved) && saved[0] ? "Provider saved to database" : "Provider saved locally — backend unreachable");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (p: any) => {
    const next = p.active === false;
    setProviders((prev) => prev.map((x: any) => (x.id === p.id ? { ...x, active: next } : x)));
    announce();
    await saveProvider({ ...p, serviceType: providerSlug(p), active: next });
    flash(next ? "Provider activated" : "Provider deactivated", 1500);
  };

  const handleRemove = async (id: string) => {
    setProviders((prev) => prev.filter((x: any) => x.id !== id));
    announce();
    await apiClient.helplines.remove(id).catch((err) => console.warn('Failed to delete communication provider:', err));
    flash("Provider removed from database", 1500);
  };

  const grouped = SERVICE_TYPES.map((type) => ({
    type,
    items: providers.filter((p: any) => providerSlug(p) === type.slug),
  })).filter((g) => g.items.length > 0);

  // Rows whose service type isn't in the catalogue (hand-entered or renamed)
  // would otherwise vanish from this screen entirely.
  const known = new Set(SERVICE_TYPES.map((s) => s.slug));
  const orphans = providers.filter((p: any) => !known.has(providerSlug(p)));

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7 pb-16 space-y-6 sm:space-y-7 text-[var(--fx-ink)] font-body" style={{ background: "var(--fx-canvas)" }}>
      {/* Add Provider Form */}
      <div className="bg-white border border-[var(--fx-border)] p-6 rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
        <h3 className="font-display font-semibold text-[var(--fx-ink)] text-[14px] mb-5 flex items-center gap-2">
          <Phone size={15} className="text-[#B54708]" /> Add Service Provider
        </h3>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-extrabold text-[var(--fx-ink-2)] mb-1.5 uppercase tracking-wider">Service Type</label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-[var(--fx-border)] bg-white outline-none focus:border-[var(--fx-accent)] transition-all font-semibold text-[var(--fx-ink)]"
              >
                {SERVICE_TYPES.map((s) => (
                  <option key={s.slug} value={s.slug}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-extrabold text-[var(--fx-ink-2)] mb-1.5 uppercase tracking-wider">Provider Name</label>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={meta.placeholder}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-[var(--fx-border)] bg-white outline-none focus:border-[var(--fx-accent)] transition-all font-semibold text-[var(--fx-ink)]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-extrabold text-[var(--fx-ink-2)] mb-1.5 uppercase tracking-wider">Phone Number</label>
              <PhoneInputWithCountry value={phone} onChange={(full) => setPhone(full)} />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={!label.trim() || !phone.trim() || saving}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[var(--fx-accent)] hover:bg-[var(--fx-accent-ink)] text-white text-sm font-bold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm shadow-[var(--fx-accent)]/20"
              >
                <Plus size={14} /> {saving ? "Saving…" : "Add"}
              </button>
            </div>
          </div>

          {/* Category scope */}
          <div>
            <label className="block text-[10px] font-extrabold text-[var(--fx-ink-2)] mb-2 uppercase tracking-wider">
              Applicable Categories
              <span className="ml-2 font-semibold normal-case tracking-normal text-[var(--fx-faint)]">
                — leave all unselected to make this provider available to every category
              </span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {STICKER_CATEGORIES.map((c) => {
                const on = categories.includes(c.value);
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => toggleCategory(c.value)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                      on
                        ? "bg-[var(--fx-accent)] border-[var(--fx-accent)] text-white shadow-xs"
                        : "bg-white border-[var(--fx-border)] text-[var(--fx-ink-2)] hover:border-[var(--fx-faint)]"
                    }`}
                  >
                    {on && <Check size={11} />} {c.label}
                  </button>
                );
              })}
            </div>
          </div>
        </form>
      </div>

      {/* Provider list grouped by service type */}
      {grouped.length > 0 || orphans.length > 0 ? (
        <div className="space-y-3">
          {grouped.map(({ type, items }) => {
            const m = getServiceMeta(type.slug);
            return (
              <div key={type.slug} className="bg-white border border-[var(--fx-border)] overflow-hidden rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
                <div className="px-5 py-3 border-b border-[var(--fx-border)] bg-[var(--fx-canvas)] flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: m.bg, color: m.color }}>
                    <m.Icon size={14} />
                  </div>
                  <span className="text-xs font-extrabold text-[var(--fx-ink)] uppercase tracking-wider">{type.label}</span>
                  <span className="text-[10px] text-[var(--fx-ink-2)] font-semibold bg-[var(--fx-canvas)] px-1.5 py-0.5 rounded-lg">{items.length}</span>
                  <span className="text-[10px] text-[var(--fx-faint)] font-mono ml-auto">{type.slug}</span>
                </div>

                {items.map((p: any) => {
                  const scope: string[] = Array.isArray(p.categories) ? p.categories : [];
                  const inactive = p.active === false;
                  // A row that came in through the landing page "Join us" form: still
                  // inactive and carrying the contact details the applicant typed.
                  const isApplication = inactive && Boolean(p.email || p.city || p.country || p.notes);
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between px-5 py-3.5 border-b border-[var(--fx-border)] last:border-0 hover:bg-[var(--fx-canvas)] transition-colors ${inactive ? "opacity-55" : ""}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: m.bg, color: m.color }}>
                          <m.Icon size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[var(--fx-ink)] truncate flex items-center gap-1.5">
                            {p.label}
                            {isApplication && (
                              <span className="px-1.5 py-0.5 rounded-md bg-[#FEF6E7] text-[#B54708] text-[9px] font-extrabold uppercase tracking-wider flex-shrink-0">
                                Applied
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-[var(--fx-ink-2)] font-mono font-semibold mt-0.5">{p.phone}</p>
                          {(p.city || p.country || p.email) && (
                            <p className="text-[10px] text-[var(--fx-ink-2)] font-semibold mt-1 flex items-center gap-2.5 flex-wrap">
                              {(p.city || p.country) && (
                                <span className="flex items-center gap-1">
                                  <MapPin size={10} /> {[p.city, p.country].filter(Boolean).join(', ')}
                                </span>
                              )}
                              {p.email && <span className="flex items-center gap-1"><Mail size={10} /> {p.email}</span>}
                            </p>
                          )}
                          {p.notes && <p className="text-[10px] text-[var(--fx-ink-2)] mt-1 line-clamp-2">{p.notes}</p>}
                          <p className="text-[10px] text-[var(--fx-faint)] font-semibold mt-1">
                            {scope.length === 0
                              ? "All categories"
                              : scope.map((s) => STICKER_CATEGORIES.find((c) => c.value === s)?.label || s).join(" · ")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleToggleActive(p)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border transition-all cursor-pointer ${
                            inactive
                              ? "bg-white border-[var(--fx-border)] text-[var(--fx-faint)] hover:border-[#16A34A] hover:text-[#16A34A]"
                              : "bg-[#F0FDF4] border-[#16A34A]/30 text-[#16A34A] hover:bg-[#D7F2E2]"
                          }`}
                        >
                          {inactive ? (isApplication ? "Approve" : "Inactive") : "Active"}
                        </button>
                        <button
                          onClick={() => handleRemove(p.id)}
                          className="w-7 h-7 rounded-lg hover:bg-[#FEF2F2] hover:text-[#EF4444] flex items-center justify-center text-[var(--fx-faint)] transition-all cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {orphans.length > 0 && (
            <div className="bg-white border border-[var(--fx-border)] overflow-hidden rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
              <div className="px-5 py-3 border-b border-[var(--fx-border)] bg-[#FEF6E7] flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "#FEF2F2", color: "#B54708" }}>
                  <AlertTriangle size={14} />
                </div>
                <span className="text-xs font-extrabold text-[var(--fx-ink)] uppercase tracking-wider">Unrecognised service type</span>
                <span className="text-[10px] text-[var(--fx-ink-2)] font-semibold">These won't be matched by any scan-page button</span>
              </div>
              {orphans.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--fx-border)] last:border-0">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[var(--fx-ink)] truncate">{p.label}</p>
                    <p className="text-[11px] text-[var(--fx-ink-2)] font-mono font-semibold mt-0.5">{p.phone}</p>
                    <p className="text-[10px] text-[var(--fx-faint)] font-mono mt-1">{p.category || "—"} → {providerSlug(p) || "—"}</p>
                  </div>
                  <button
                    onClick={() => handleRemove(p.id)}
                    className="w-7 h-7 rounded-lg hover:bg-[#FEF2F2] hover:text-[#EF4444] flex items-center justify-center text-[var(--fx-faint)] transition-all cursor-pointer flex-shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-[var(--fx-border)] p-12 text-center rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
          <div className="w-12 h-12 rounded-lg bg-[var(--fx-canvas)] flex items-center justify-center mx-auto mb-3">
            <Phone size={20} className="text-[var(--fx-faint)]" />
          </div>
          <p className="text-sm font-semibold text-[var(--fx-ink)]">No providers added yet</p>
          <p className="text-xs text-[var(--fx-ink-2)] mt-1">Add your first service provider above</p>
        </div>
      )}
    </div>
  );
}

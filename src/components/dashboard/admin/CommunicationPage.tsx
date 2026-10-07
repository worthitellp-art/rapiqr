import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import type React from "react";
import {
  Plus, Trash2, MapPin, Check, X, Search, Pencil, Eye, Loader2,
  RefreshCw, ChevronLeft, ChevronRight, LocateFixed, CheckCircle2, XCircle,
} from "lucide-react";
import { apiClient, type ProviderInput } from "../../../lib/apiClient";
import { usePolling } from "../../../hooks/usePolling";
import { connectAsOwner } from "../../../lib/socketClient";
import PhoneInputWithCountry from "../../common/PhoneInputWithCountry";
import { SERVICE_TYPES, slugifyService } from "../../scan/tileActions";
import { getServiceMeta } from "../../scan/serviceMeta";
import { STICKER_CATEGORIES } from "../../../stickerModules";
import ConfirmModal from "./ConfirmModal";
import FxKpiStrip from "../shared/FxKpiStrip";
import { fmtDate } from "./helpers";

// Leaflet only loads when a popup with a map opens.
const RadiusMap = lazy(() => import("../../common/RadiusMap"));

/** A service provider row as the API returns it (see Server/models/helplineModel.js toApi). */
interface Provider {
  id: string;
  category: string;
  label: string;
  phone: string;
  active: boolean;
  service_type?: string;
  categories?: string[];
  email?: string | null;
  whatsapp?: string | null;
  city?: string | null;
  country?: string | null;
  address?: string | null;
  area?: string | null;
  state?: string | null;
  pincode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  radius_km?: number | null;
  years_experience?: string | null;
  availability?: { type?: string } | null;
  notes?: string | null;
  created_at?: string;
}

interface FormState {
  serviceType: string;
  label: string;
  phone: string;
  email: string;
  categories: string[];
  address: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  radiusKm: string;
  latitude: number | null;
  longitude: number | null;
  notes: string;
}

const EMPTY_FORM: FormState = {
  serviceType: "ambulance", label: "", phone: "", email: "", categories: [],
  address: "", area: "", city: "", state: "", pincode: "", country: "India",
  radiusKm: "10", latitude: null, longitude: null, notes: "",
};

const RADIUS_CHIPS = [5, 10, 15, 25, 50];
const PAGE_SIZE = 10;
type StatusFilter = "all" | "pending" | "active" | "inactive";

const providerSlug = (p: Provider) => slugifyService(p.service_type || p.category);
const serviceLabel = (slug: string) => SERVICE_TYPES.find((s) => s.slug === slug)?.label || slug.replace(/_/g, " ");
const areaLine = (p: Provider) => [p.area, p.city, p.state].filter(Boolean).join(", ");
/** Joined through the public "Join us" form: inactive and carrying applicant-entered details. */
const isApplication = (p: Provider) => p.active === false && Boolean(p.email || p.city || p.country || p.notes);
const statusOf = (p: Provider): Exclude<StatusFilter, "all"> => (p.active !== false ? "active" : isApplication(p) ? "pending" : "inactive");
const availabilityText = (p: Provider) => {
  const t = p.availability?.type;
  return t === "available_24_7" ? "24/7" : t === "daytime" ? "Daytime" : t === "night" ? "Night" : t === "custom" ? "Custom hours" : "";
};

function toForm(p: Provider): FormState {
  return {
    serviceType: providerSlug(p),
    label: p.label || "",
    phone: p.phone || "",
    email: p.email || "",
    categories: Array.isArray(p.categories) ? p.categories : [],
    address: p.address || "",
    area: p.area || "",
    city: p.city || "",
    state: p.state || "",
    pincode: p.pincode || "",
    country: p.country || "India",
    radiusKm: p.radius_km ? String(p.radius_km) : "",
    latitude: p.latitude ?? null,
    longitude: p.longitude ?? null,
    notes: p.notes || "",
  };
}

function Modal({ onClose, children, wide = false }: { onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--fx-ink)]/50 backdrop-blur-[2px] animate-fade-in" onClick={onClose}>
      <div
        className={`bg-white rounded-lg w-full ${wide ? "max-w-3xl" : "max-w-xl"} max-h-[92vh] overflow-y-auto shadow-2xl border border-[var(--fx-border)] animate-modal-pop`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

const MapFallback = ({ h = "h-64" }: { h?: string }) => <div className={`${h} w-full animate-pulse rounded-xl bg-[var(--fx-canvas)]`} />;

/** When this admin last opened Communication. Shared with the sidebar badge in AdminDashboard. */
export const COMMUNICATION_SEEN_KEY = "repiqr-admin-communication-seen-at";

/**
 * Visitor requests for a service no provider covers yet, newest first, with the spot they
 * were filed from. Refreshes every 30 seconds; requests that arrived since the admin last
 * opened this tab are marked new.
 */
function ServiceInquiriesPanel() {
  // Read on mount, before the dashboard marks this tab as seen, so "new" means since the last visit.
  const [seenBefore] = useState<number>(() => {
    try {
      const stored = Date.parse(localStorage.getItem(COMMUNICATION_SEEN_KEY) || "");
      return Number.isNaN(stored) ? Date.now() - 24 * 60 * 60 * 1000 : stored;
    } catch {
      return Date.now() - 24 * 60 * 60 * 1000;
    }
  });
  const [rows, setRows] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiClient.alerts.getAlerts(200, "service_inquiry");
      setRows(res.data || []);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Couldn't load service inquiries.");
      throw err; // lets the poller back off while the server is unreachable
    }
  }, []);

  usePolling(load, { intervalMs: 30_000 });

  // The server pushes a signal the moment a request arrives, so the list doesn't wait for the next poll.
  useEffect(() => {
    const token = localStorage.getItem("repiqr-token") || localStorage.getItem("namoqr-token") || "";
    const socket = connectAsOwner(token);
    const onUpdate = () => { load().catch(() => { /* the poll shows the error */ }); };
    socket.on("admin_update", onUpdate);
    return () => { socket.off("admin_update", onUpdate); };
  }, [load]);

  const isNew = (r: any) => new Date(r.created_at).getTime() > seenBefore;
  const newCount = rows ? rows.filter(isNew).length : 0;

  return (
    <section className="rounded-xl border border-[var(--fx-border)] bg-white" aria-label="Service inquiries">
      <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[var(--fx-border)]">
        <h2 className="fx-text-label-tab text-[var(--fx-ink)]">Service inquiries</h2>
        <div className="flex items-center gap-2">
          {newCount > 0 && (
            <span className="rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white tabular-nums" aria-live="polite">
              {newCount} new
            </span>
          )}
          {rows && <span className="text-xs font-bold text-[var(--fx-ink-2)] tabular-nums">{rows.length}</span>}
        </div>
      </header>

      {error ? (
        <p className="px-4 py-4 text-sm text-red-600">{error}</p>
      ) : rows === null ? (
        <div className="m-4 h-14 animate-pulse rounded-lg bg-[var(--fx-canvas)]" />
      ) : rows.length === 0 ? (
        <p className="px-4 py-4 text-sm text-[var(--fx-ink-2)]">No service requests from visitors yet.</p>
      ) : (
        <ul className="divide-y divide-[var(--fx-border)]">
          {rows.slice(0, 25).map((r) => {
            const lat = r.location?.lat;
            const lng = r.location?.lng;
            return (
              <li key={r.id} className={`flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 ${isNew(r) ? "bg-red-50/40" : ""}`}>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-semibold text-[var(--fx-ink)]">
                    {isNew(r) && <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-extrabold text-red-700">NEW</span>}
                    <span>{r.message}</span>
                  </p>
                  <p className="text-xs text-[var(--fx-ink-2)]">
                    {new Date(r.created_at).toLocaleString()} · {r.product_label}
                  </p>
                </div>
                {lat != null && lng != null ? (
                  <a
                    href={`https://www.google.com/maps?q=${lat},${lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--fx-ink)] underline underline-offset-2 tabular-nums"
                  >
                    <MapPin size={13} /> {Number(lat).toFixed(5)}, {Number(lng).toFixed(5)}
                  </a>
                ) : (
                  <span className="text-xs text-[var(--fx-ink-2)]">Location not shared</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default function CommunicationPage({ setToast }: { setToast: (msg: string | null) => void }) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [viewing, setViewing] = useState<Provider | null>(null);
  const [editing, setEditing] = useState<{ provider: Provider | null } | null>(null); // provider null = create
  const [pendingRemove, setPendingRemove] = useState<Provider | null>(null);

  const flash = (msg: string, ms = 2200) => {
    setToast(msg);
    setTimeout(() => setToast(null), ms);
  };

  // The scan page keeps an offline copy of the PUBLIC fields only — never the
  // applicants' email/address/coordinates this screen now holds.
  const syncPublicCache = (rows: Provider[]) => {
    try {
      const publicRows = rows.map(({ id, category, label, phone, active, service_type, categories, city, country }) => ({
        id, category, label, phone, active, service_type, categories, city, country,
      }));
      localStorage.setItem("repiqr-helplines", JSON.stringify(publicRows));
      window.dispatchEvent(new Event("repiqr-helplines-updated"));
      window.dispatchEvent(new Event("namoqr-helplines-updated"));
    } catch { /* storage unavailable */ }
  };

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await apiClient.helplines.getAll();
      const rows = Array.isArray(res.data) ? (res.data as Provider[]) : [];
      setProviders(rows);
      syncPublicCache(rows);
    } catch (err: any) {
      setLoadError(err?.message || "Couldn't load providers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const replaceRow = (row: Provider) => {
    setProviders((prev) => {
      const next = prev.some((p) => p.id === row.id) ? prev.map((p) => (p.id === row.id ? row : p)) : [row, ...prev];
      syncPublicCache(next);
      return next;
    });
    setViewing((cur) => (cur && cur.id === row.id ? row : cur));
  };

  const toggleActive = async (p: Provider) => {
    const next = p.active === false;
    try {
      const res = await apiClient.helplines.update(p.id, { active: next });
      replaceRow({ ...p, ...(res.data || {}), active: next });
      flash(next ? "Provider activated" : "Provider deactivated");
    } catch (err: any) {
      flash(err?.message || "Couldn't update the provider.");
    }
  };

  const remove = async (p: Provider) => {
    try {
      await apiClient.helplines.remove(p.id);
      setProviders((prev) => {
        const next = prev.filter((x) => x.id !== p.id);
        syncPublicCache(next);
        return next;
      });
      setViewing((cur) => (cur && cur.id === p.id ? null : cur));
      flash("Provider deleted");
    } catch (err: any) {
      flash(err?.message || "Couldn't delete the provider.");
    }
  };

  const counts = useMemo(() => ({
    all: providers.length,
    pending: providers.filter((p) => statusOf(p) === "pending").length,
    active: providers.filter((p) => statusOf(p) === "active").length,
    inactive: providers.filter((p) => statusOf(p) === "inactive").length,
  }), [providers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return providers.filter((p) => {
      if (filter !== "all" && statusOf(p) !== filter) return false;
      if (!q) return true;
      return [p.label, p.phone, p.email, p.city, p.area, p.state, p.pincode, serviceLabel(providerSlug(p))]
        .some((v) => (v || "").toLowerCase().includes(q));
    });
  }, [providers, filter, search]);

  useEffect(() => { setPage(1); }, [filter, search]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const TABS: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "active", label: "Active" },
    { key: "inactive", label: "Inactive" },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7 pb-16 space-y-6 sm:space-y-7 text-[var(--fx-ink)] font-body" style={{ background: "var(--fx-canvas)" }}>
      <div className="flex items-center gap-3">
        <h1 className="fx-text-heading-page text-[var(--fx-ink)]">Communication</h1>
        <div className="flex-1" />
        <button onClick={() => setEditing({ provider: null })} className="fx-btn fx-btn-primary">
          <Plus size={15} strokeWidth={2.5} /> Add provider
        </button>
      </div>

      <FxKpiStrip
        cards={[
          { key: "total", label: "Providers", value: counts.all },
          { key: "pending", label: "Pending", value: counts.pending, tone: "amber" },
          { key: "active", label: "Active", value: counts.active, tone: "green" },
        ]}
      />

      <ServiceInquiriesPanel />

      {/* Tabs + search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-[var(--fx-border)] -mb-px">
          {TABS.map((tab) => {
            const active = filter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`relative flex items-center gap-2 h-10 px-3.5 fx-text-label-tab transition-colors whitespace-nowrap cursor-pointer ${
                  active ? "text-[var(--fx-ink)]" : "text-[var(--fx-ink-2)] hover:text-[var(--fx-ink)]"
                }`}
              >
                {tab.label}
                <span className="inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-[6px] bg-[var(--fx-canvas)] fx-text-label-score text-[var(--fx-ink-2)]">{counts[tab.key]}</span>
                {active && <span className="absolute left-0 right-0 bottom-0 h-[2px] bg-[var(--fx-accent)]" />}
              </button>
            );
          })}
        </div>
        <div className="relative w-full lg:w-80 shrink-0">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--fx-faint)]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, phone, area, city…" className="fx-input pl-10" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[var(--fx-border)] rounded-md shadow-[0_1px_2px_rgba(24,24,27,0.05)] overflow-hidden w-full">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 size={22} className="animate-spin mx-auto text-[var(--fx-accent-ink)]" />
          </div>
        ) : loadError ? (
          <div className="p-10 text-center space-y-3">
            <p className="font-bold text-[13px]">Couldn't load providers.</p>
            <p className="text-[12px] text-[var(--fx-ink-2)] font-mono">{loadError}</p>
            <button onClick={load} className="fx-btn fx-btn-danger h-10"><RefreshCw size={14} /> Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <p className="font-bold text-[13px]">{search || filter !== "all" ? "No providers match." : "No providers yet."}</p>
            {(search || filter !== "all") && (
              <button onClick={() => { setSearch(""); setFilter("all"); }} className="fx-btn fx-btn-secondary h-10"><X size={14} /> Clear filters</button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--fx-surface)] border-b border-[var(--fx-border)] fx-text-body-regular text-[var(--fx-ink-2)] text-left">
                    <th className="px-4 py-3">Provider</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Radius</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--fx-border)]">
                  {rows.map((p) => {
                    const slug = providerSlug(p);
                    const m = getServiceMeta(slug);
                    const st = statusOf(p);
                    return (
                      <tr key={p.id} onClick={() => setViewing(p)} className="cursor-pointer hover:bg-[var(--fx-canvas)] transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: m.bg, color: m.color }}>
                              <m.Icon size={15} />
                            </span>
                            <div className="min-w-0">
                              <div className="font-semibold text-[13px] truncate max-w-[200px]">{p.label}</div>
                              <div className="text-[11px] text-[var(--fx-faint)] capitalize">{serviceLabel(slug)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="text-[12px] font-semibold font-mono whitespace-nowrap">{p.phone}</div>
                          {p.email && <div className="text-[11px] text-[var(--fx-faint)] truncate max-w-[170px]">{p.email}</div>}
                        </td>
                        <td className="px-4 py-3.5">
                          {areaLine(p) ? (
                            <div className="flex items-start gap-1.5 text-[12px] max-w-[220px]">
                              <MapPin size={12} className="mt-0.5 text-[var(--fx-faint)] shrink-0" />
                              <span>{areaLine(p)}{p.pincode ? ` · ${p.pincode}` : ""}</span>
                            </div>
                          ) : (
                            <span className="text-[var(--fx-faint)] text-[12px]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-[12px] font-semibold">
                          {p.radius_km ? `${p.radius_km} km` : <span className="text-[var(--fx-faint)] font-normal">—</span>}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-[11.5px]">{p.created_at ? fmtDate(p.created_at) : "—"}</td>
                        <td className="px-4 py-3.5">
                          <span className={`fx-score-badge fx-text-label-caps whitespace-nowrap ${
                            st === "active" ? "bg-[var(--fx-green-soft)] text-[var(--fx-green)]"
                            : st === "pending" ? "bg-[var(--fx-amber-soft)] text-[var(--fx-amber)]"
                            : "bg-[var(--fx-canvas)] text-[var(--fx-ink-2)]"
                          }`}>
                            {st === "active" ? "Active" : st === "pending" ? "Pending" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            {st === "pending" && (
                              <button onClick={() => toggleActive(p)} className="h-8 px-3 rounded-[8px] text-[11px] font-bold bg-[var(--fx-accent)] text-white hover:bg-[var(--fx-accent-ink)] cursor-pointer">
                                Approve
                              </button>
                            )}
                            <button onClick={() => setViewing(p)} title="View" aria-label="View" className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[var(--fx-ink-2)] hover:bg-[var(--fx-canvas)] cursor-pointer"><Eye size={14} /></button>
                            <button onClick={() => setEditing({ provider: p })} title="Edit" aria-label="Edit" className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[var(--fx-ink-2)] hover:bg-[var(--fx-canvas)] cursor-pointer"><Pencil size={14} /></button>
                            <button onClick={() => setPendingRemove(p)} title="Delete" aria-label="Delete" className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[var(--fx-red)] hover:bg-[var(--fx-red-soft)] cursor-pointer"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-[var(--fx-border)] flex items-center justify-between gap-3">
                <span className="text-[11.5px] text-[var(--fx-ink-2)]">
                  {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                </span>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setPage((n) => Math.max(1, n - 1))} disabled={page === 1} aria-label="Previous page" className="w-9 h-9 rounded-[10px] border border-[var(--fx-border)] flex items-center justify-center disabled:opacity-40 cursor-pointer"><ChevronLeft size={15} /></button>
                  <span className="text-[12px] font-semibold px-2">{page} / {totalPages}</span>
                  <button onClick={() => setPage((n) => Math.min(totalPages, n + 1))} disabled={page === totalPages} aria-label="Next page" className="w-9 h-9 rounded-[10px] border border-[var(--fx-border)] flex items-center justify-center disabled:opacity-40 cursor-pointer"><ChevronRight size={15} /></button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {viewing && (
        <ProviderQuickView
          provider={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => { setEditing({ provider: viewing }); setViewing(null); }}
          onDelete={() => setPendingRemove(viewing)}
          onToggleActive={() => toggleActive(viewing)}
        />
      )}

      {editing && (
        <ProviderForm
          provider={editing.provider}
          onClose={() => setEditing(null)}
          onSaved={(row, created) => {
            replaceRow(row);
            setEditing(null);
            flash(created ? "Provider added" : "Provider updated");
          }}
        />
      )}

      <ConfirmModal
        isOpen={!!pendingRemove}
        title="Delete provider?"
        message={pendingRemove ? `"${pendingRemove.label}" will be removed permanently.` : ""}
        confirmLabel="Delete"
        onConfirm={() => { if (pendingRemove) remove(pendingRemove); }}
        onClose={() => setPendingRemove(null)}
      />
    </div>
  );
}

/* ── Quick view popup: who joined, where, and how far they cover ─────────── */

function ProviderQuickView({
  provider: p, onClose, onEdit, onDelete, onToggleActive,
}: {
  provider: Provider;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}) {
  const slug = providerSlug(p);
  const m = getServiceMeta(slug);
  const st = statusOf(p);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    p.latitude != null && p.longitude != null ? { lat: p.latitude, lng: p.longitude } : null
  );
  const [mapState, setMapState] = useState<"ready" | "loading" | "none">(coords ? "ready" : "loading");

  // No saved GPS fix (admin-entered or older rows): place the pin from the
  // written address through the backend geocoder.
  useEffect(() => {
    if (coords) return;
    const query = [p.address, p.area, p.city, p.state, p.pincode, p.country].filter(Boolean).join(", ");
    if (query.length < 2) { setMapState("none"); return; }
    const controller = new AbortController();
    apiClient.geo.forward(query, controller.signal)
      .then((res) => { setCoords({ lat: res.data.latitude, lng: res.data.longitude }); setMapState("ready"); })
      .catch(() => { if (!controller.signal.aborted) setMapState("none"); });
    return () => controller.abort();
  }, [coords, p.address, p.area, p.city, p.state, p.pincode, p.country]);

  const scope = Array.isArray(p.categories) && p.categories.length
    ? p.categories.map((s) => STICKER_CATEGORIES.find((c) => c.value === s)?.label || s).join(" · ")
    : "All categories";
  const fullAddress = [p.address, p.area, p.city, p.state, p.pincode, p.country].filter(Boolean).join(", ");

  const Row = ({ label, value }: { label: string; value?: React.ReactNode }) =>
    value ? (
      <div className="flex justify-between gap-4 py-2 border-b border-[var(--fx-border)] last:border-0 text-[12.5px]">
        <span className="text-[var(--fx-ink-2)] shrink-0">{label}</span>
        <span className="font-semibold text-right break-words min-w-0">{value}</span>
      </div>
    ) : null;

  return (
    <Modal onClose={onClose} wide>
      <div className="px-6 py-4 border-b border-[var(--fx-border)] flex items-center gap-3">
        <span className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: m.bg, color: m.color }}><m.Icon size={18} /></span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display font-bold text-[16px] truncate">{p.label}</h3>
          <p className="text-[12px] text-[var(--fx-ink-2)] capitalize">{serviceLabel(slug)}</p>
        </div>
        <span className={`fx-score-badge fx-text-label-caps ${
          st === "active" ? "bg-[var(--fx-green-soft)] text-[var(--fx-green)]" : st === "pending" ? "bg-[var(--fx-amber-soft)] text-[var(--fx-amber)]" : "bg-[var(--fx-canvas)] text-[var(--fx-ink-2)]"
        }`}>{st === "active" ? "Active" : st === "pending" ? "Pending" : "Inactive"}</span>
        <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[var(--fx-ink-2)] hover:bg-[var(--fx-canvas)] cursor-pointer"><X size={16} /></button>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          {mapState === "ready" && coords ? (
            <Suspense fallback={<MapFallback h="h-72" />}>
              <RadiusMap
                latitude={coords.lat}
                longitude={coords.lng}
                radiusKm={p.radius_km || 0}
                className="h-72 w-full rounded-xl border border-[var(--fx-border)] overflow-hidden z-0"
              />
            </Suspense>
          ) : mapState === "loading" ? (
            <MapFallback h="h-72" />
          ) : (
            <div className="h-72 w-full rounded-xl border border-dashed border-[var(--fx-border)] flex items-center justify-center text-[12px] text-[var(--fx-faint)] text-center px-6">
              No location on file for this provider.
            </div>
          )}
          <p className="text-[12px] text-[var(--fx-ink-2)] text-center">
            {p.radius_km ? `Covers ${p.radius_km} km around ${[p.area, p.city].filter(Boolean).join(", ") || "their base"}` : "No coverage radius set"}
          </p>
        </div>

        <div>
          <Row label="Phone" value={<a href={`tel:${p.phone}`} className="font-mono hover:underline">{p.phone}</a>} />
          <Row label="WhatsApp" value={p.whatsapp && p.whatsapp !== p.phone ? p.whatsapp : undefined} />
          <Row label="Email" value={p.email} />
          <Row label="Address" value={fullAddress} />
          <Row label="Coverage radius" value={p.radius_km ? `${p.radius_km} km` : undefined} />
          <Row label="Serves" value={scope} />
          <Row label="Availability" value={availabilityText(p)} />
          <Row label="Experience" value={p.years_experience} />
          <Row label="Joined" value={p.created_at ? fmtDate(p.created_at) : undefined} />
          <Row label="Notes" value={p.notes} />
        </div>
      </div>

      <div className="px-6 py-4 border-t border-[var(--fx-border)] flex flex-wrap items-center justify-between gap-2">
        <button onClick={onDelete} className="fx-btn fx-btn-danger"><Trash2 size={14} /> Delete</button>
        <div className="flex items-center gap-2">
          <button onClick={onToggleActive} className="fx-btn fx-btn-secondary">
            {p.active === false ? <><CheckCircle2 size={14} /> {st === "pending" ? "Approve" : "Activate"}</> : <><XCircle size={14} /> Deactivate</>}
          </button>
          <button onClick={onEdit} className="fx-btn fx-btn-primary"><Pencil size={14} /> Edit</button>
        </div>
      </div>
    </Modal>
  );
}

/* ── Add / edit popup, with a draggable pin and the radius drawn live ────── */

function ProviderForm({
  provider, onClose, onSaved,
}: {
  provider: Provider | null;
  onClose: () => void;
  onSaved: (row: Provider, created: boolean) => void;
}) {
  const [form, setForm] = useState<FormState>(provider ? toForm(provider) : EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const meta = getServiceMeta(form.serviceType);
  const radius = Number(form.radiusKm);
  const radiusOk = !form.radiusKm || (Number.isFinite(radius) && radius >= 1 && radius <= 150);

  const toggleCategory = (value: string) =>
    set("categories", form.categories.includes(value) ? form.categories.filter((c) => c !== value) : [...form.categories, value]);

  // Writes the address fields from a coordinate (pin dragged / placed) via the backend geocoder.
  const resolveFromPin = async (lat: number, lng: number) => {
    setForm((f) => ({ ...f, latitude: lat, longitude: lng }));
    try {
      const res = await apiClient.geo.reverse(lat, lng);
      const d = res.data;
      setForm((f) => ({
        ...f,
        address: d.address || f.address,
        area: d.area || f.area,
        city: d.city || f.city,
        state: d.state || f.state,
        pincode: d.pincode || f.pincode,
        country: d.country || f.country,
      }));
    } catch { /* keep the typed address */ }
  };

  const locateFromAddress = async () => {
    const query = [form.address, form.area, form.city, form.state, form.pincode, form.country].filter((v) => v.trim()).join(", ");
    if (query.length < 2) { setError("Enter an address or city first."); return; }
    setLocating(true);
    setError("");
    try {
      const res = await apiClient.geo.forward(query);
      setForm((f) => ({ ...f, latitude: res.data.latitude, longitude: res.data.longitude }));
    } catch {
      setError("Couldn't find that place on the map. Try a nearby city.");
    } finally {
      setLocating(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.label.trim() || !form.phone.trim()) { setError("Name and phone are required."); return; }
    if (!radiusOk) { setError("Radius must be between 1 and 150 km."); return; }
    const type = SERVICE_TYPES.find((s) => s.slug === form.serviceType);
    if (!type) { setError("Pick a service type."); return; }

    const payload: ProviderInput = {
      // Legacy label stays authoritative for the car/bike screen's lookups.
      category: type.legacy || type.label,
      serviceType: type.slug,
      categories: form.categories,
      label: form.label.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || null,
      address: form.address.trim() || null,
      area: form.area.trim() || null,
      city: form.city.trim() || null,
      state: form.state.trim() || null,
      pincode: form.pincode.trim() || null,
      country: form.country.trim() || null,
      latitude: form.latitude,
      longitude: form.longitude,
      radiusKm: form.radiusKm ? radius : null,
      notes: form.notes.trim() || null,
    };

    setSaving(true);
    try {
      if (provider) {
        const res = await apiClient.helplines.update(provider.id, payload);
        onSaved({ ...provider, ...(res.data || {}) }, false);
      } else {
        const res = await apiClient.helplines.create({ ...payload, active: true });
        if (!res.data) throw new Error("The server didn't return the new provider.");
        onSaved(res.data as Provider, true);
      }
    } catch (err: any) {
      setError(err?.message || "Couldn't save the provider.");
    } finally {
      setSaving(false);
    }
  };

  const hasPin = form.latitude != null && form.longitude != null;
  const field = "fx-input";
  const label = "fx-label mb-1.5 block";

  return (
    <Modal onClose={() => !saving && onClose()} wide>
      <form onSubmit={submit}>
        <div className="px-6 py-4 border-b border-[var(--fx-border)] flex items-center justify-between">
          <h2 className="font-display text-[17px] font-bold">{provider ? "Edit provider" : "Add provider"}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[var(--fx-ink-2)] hover:bg-[var(--fx-canvas)] cursor-pointer"><X size={16} /></button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
          <div>
            <label className={label}>Service type</label>
            <select value={form.serviceType} onChange={(e) => set("serviceType", e.target.value)} className={field}>
              {SERVICE_TYPES.map((s) => <option key={s.slug} value={s.slug}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>Name</label>
            <input value={form.label} onChange={(e) => set("label", e.target.value)} placeholder={meta.placeholder} className={field} />
          </div>
          <div>
            <label className={label}>Phone</label>
            <PhoneInputWithCountry value={form.phone} onChange={(full) => set("phone", full)} />
          </div>
          <div>
            <label className={label}>Email <span className="font-normal text-[var(--fx-faint)]">(optional)</span></label>
            <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={field} />
          </div>

          <div className="md:col-span-2">
            <label className={label}>Categories <span className="font-normal text-[var(--fx-faint)]">(none selected = all)</span></label>
            <div className="flex flex-wrap gap-1.5">
              {STICKER_CATEGORIES.map((c) => {
                const on = form.categories.includes(c.value);
                return (
                  <button key={c.value} type="button" onClick={() => toggleCategory(c.value)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                      on ? "bg-[var(--fx-accent)] border-[var(--fx-accent)] text-white" : "bg-white border-[var(--fx-border)] text-[var(--fx-ink-2)] hover:border-[var(--fx-faint)]"
                    }`}>
                    {on && <Check size={11} />} {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className={label}>Address <span className="font-normal text-[var(--fx-faint)]">(optional)</span></label>
            <input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Building, street" className={field} />
          </div>
          <div>
            <label className={label}>Area / locality</label>
            <input value={form.area} onChange={(e) => set("area", e.target.value)} className={field} />
          </div>
          <div>
            <label className={label}>City</label>
            <input value={form.city} onChange={(e) => set("city", e.target.value)} className={field} />
          </div>
          <div>
            <label className={label}>State</label>
            <input value={form.state} onChange={(e) => set("state", e.target.value)} className={field} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>PIN</label>
              <input inputMode="numeric" maxLength={6} value={form.pincode} onChange={(e) => set("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))} className={`${field} font-mono`} />
            </div>
            <div>
              <label className={label}>Country</label>
              <input value={form.country} onChange={(e) => set("country", e.target.value)} className={field} />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className={label}>Coverage radius (km)</label>
            <div className="flex flex-wrap items-center gap-2">
              {RADIUS_CHIPS.map((km) => (
                <button key={km} type="button" onClick={() => set("radiusKm", String(km))}
                  className={`h-9 px-3 rounded-lg border text-[12px] font-semibold cursor-pointer ${
                    Number(form.radiusKm) === km ? "bg-[var(--fx-ink)] border-[var(--fx-ink)] text-white" : "border-[var(--fx-border)] text-[var(--fx-ink-2)] hover:border-[var(--fx-faint)]"
                  }`}>{km} km</button>
              ))}
              <input type="number" min={1} max={150} value={form.radiusKm} onChange={(e) => set("radiusKm", e.target.value)} placeholder="Custom" className={`${field} w-28`} />
            </div>
          </div>

          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center justify-between">
              <label className="fx-label">Map</label>
              <button type="button" onClick={locateFromAddress} disabled={locating} className="fx-btn fx-btn-secondary h-9">
                {locating ? <Loader2 size={13} className="animate-spin" /> : <LocateFixed size={13} />} Find on map
              </button>
            </div>
            {hasPin ? (
              <>
                <Suspense fallback={<MapFallback h="h-72" />}>
                  <RadiusMap
                    latitude={form.latitude as number}
                    longitude={form.longitude as number}
                    radiusKm={radiusOk && radius > 0 ? radius : 0}
                    onMove={resolveFromPin}
                    className="h-72 w-full rounded-xl border border-[var(--fx-border)] overflow-hidden z-0"
                  />
                </Suspense>
                <p className="text-[11px] text-[var(--fx-ink-2)]">Drag the pin or tap the map — the address fills in automatically.</p>
              </>
            ) : (
              <div className="h-24 rounded-xl border border-dashed border-[var(--fx-border)] flex items-center justify-center text-[12px] text-[var(--fx-faint)]">
                Fill the address, then press “Find on map”.
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <label className={label}>Notes <span className="font-normal text-[var(--fx-faint)]">(optional)</span></label>
            <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} className={`${field} h-auto py-2`} />
          </div>

          {error && <p className="md:col-span-2 text-[12px] font-semibold text-[var(--fx-red)]">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t border-[var(--fx-border)] flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} disabled={saving} className="fx-btn fx-btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="fx-btn fx-btn-primary">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
            {saving ? "Saving…" : provider ? "Save changes" : "Add provider"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

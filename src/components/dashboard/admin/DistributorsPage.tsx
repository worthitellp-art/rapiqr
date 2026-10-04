import React, { useState, useEffect, useMemo } from 'react';
import {
  Store, CheckCircle2, Clock, XCircle, Search, MapPin,
  ShieldCheck, RefreshCw, Loader2, Plus, ArrowUp, ArrowDown, ArrowUpDown,
  ChevronLeft, ChevronRight, X, Eye,
} from 'lucide-react';
import {
  updateDistributorApplicationStatus,
  saveDistributorApplication,
  DistributorApplication,
} from '../../../lib/distributorService';
import { apiClient } from '../../../lib/apiClient';
import { STICKER_CATEGORIES } from '../../../stickerModules';
import FxKpiStrip from '../shared/FxKpiStrip';

const STATUS_META: Record<DistributorApplication['status'], { label: string; icon: any; color: string; bg: string }> = {
  pending: { label: 'Pending', icon: Clock, color: 'text-[var(--fx-amber)]', bg: 'bg-[var(--fx-amber-soft)]' },
  approved: { label: 'Approved', icon: CheckCircle2, color: 'text-[var(--fx-green)]', bg: 'bg-[var(--fx-green-soft)]' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'text-[var(--fx-red)]', bg: 'bg-[var(--fx-red-soft)]' },
};

const STATUS_TABS: Array<{ key: 'all' | DistributorApplication['status']; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

const EMPTY_FORM = { userName: '', userEmail: '', phone: '', city: '', business: '', tier: 'Starter' };
const PAGE_SIZE = 8;

type SortKey = 'userName' | 'tier' | 'createdAt';

const fmtDay = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

export default function DistributorsPage({ setToast }: { setToast: (msg: string | null) => void }) {
  const [apps, setApps] = useState<DistributorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | DistributorApplication['status']>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'createdAt', dir: 'desc' });
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewing, setViewing] = useState<DistributorApplication | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [savingAdd, setSavingAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  // Stock allocation for an approved partner (server picks the stickers).
  const [alloc, setAlloc] = useState({ count: '', category: '', printedOnly: true });
  const [allocBusy, setAllocBusy] = useState(false);

  const handleAllocate = async (app: DistributorApplication) => {
    const count = Number(alloc.count);
    if (!Number.isInteger(count) || count < 1 || count > 500) {
      showToast('Enter a quantity from 1 to 500.');
      return;
    }
    setAllocBusy(true);
    try {
      const res = await apiClient.distributors.allocate(app.id, {
        count,
        category: alloc.category || undefined,
        printedOnly: alloc.printedOnly,
      });
      if (!res?.success) throw new Error(res?.error || 'Allocation failed.');
      const { allocated, remainingPool } = res.data;
      showToast(allocated > 0 ? `${allocated} allocated to ${app.userName} · ${remainingPool} left` : 'No matching stickers in stock.');
      if (allocated > 0) setAlloc((a) => ({ ...a, count: '' }));
    } catch (err: any) {
      showToast(err?.message || "Couldn't allocate stickers.");
    } finally {
      setAllocBusy(false);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const loadApplications = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await apiClient.distributors.list();
      setApps(res?.data || []);
    } catch (err: any) {
      setLoadError(err?.message || 'Failed to load applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleStatusChange = async (app: DistributorApplication, status: 'approved' | 'rejected') => {
    setBusyId(app.id);
    const updated = await updateDistributorApplicationStatus(app.id, status);
    setBusyId(null);
    if (updated) {
      setApps((prev) => prev.map((a) => (a.id === app.id ? { ...a, ...updated } : a)));
      setViewing((cur) => (cur && cur.id === app.id ? { ...cur, ...updated } : cur));
      showToast(status === 'approved' ? `${app.userName} approved` : `${app.userName} rejected`);
    } else {
      showToast(`Couldn't ${status === 'approved' ? 'approve' : 'reject'} ${app.userName}.`);
    }
  };

  const filteredApps = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = apps.filter((app) => {
      if (filter !== 'all' && app.status !== filter) return false;
      return !q ||
        app.userName.toLowerCase().includes(q) ||
        (app.business || '').toLowerCase().includes(q) ||
        (app.city || '').toLowerCase().includes(q) ||
        (app.phone || '').includes(q) ||
        (app.userEmail || '').toLowerCase().includes(q);
    });
    return [...list].sort((a, b) => {
      let diff = 0;
      if (sort.key === 'userName') diff = a.userName.localeCompare(b.userName);
      else if (sort.key === 'tier') diff = (a.tier || '').localeCompare(b.tier || '');
      else diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sort.dir === 'asc' ? diff : -diff;
    });
  }, [apps, filter, searchQuery, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredApps.length / PAGE_SIZE));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);
  useEffect(() => { setPage(1); }, [filter, searchQuery, sort]);

  const pageRows = filteredApps.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageAllSelected = pageRows.length > 0 && pageRows.every((a) => selected.has(a.id));
  const countOf = (s: DistributorApplication['status']) => apps.filter((a) => a.status === s).length;
  const selectedPending = apps.filter((a) => selected.has(a.id) && a.status === 'pending');

  const toggleRow = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const togglePageAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      pageRows.forEach((a) => (pageAllSelected ? next.delete(a.id) : next.add(a.id)));
      return next;
    });

  const bulkStatus = async (status: 'approved' | 'rejected') => {
    if (selectedPending.length === 0) return;
    setBulkBusy(true);
    let ok = 0;
    for (const app of selectedPending) {
      if (await updateDistributorApplicationStatus(app.id, status)) ok += 1;
    }
    setSelected(new Set());
    setBulkBusy(false);
    showToast(`${ok} ${status}`);
    loadApplications();
  };

  const submitAdd = async () => {
    if (!form.userName.trim() || !form.userEmail.trim() || !form.phone.trim()) {
      showToast('Name, email and phone are required.');
      return;
    }
    setSavingAdd(true);
    try {
      const created = await saveDistributorApplication({
        userName: form.userName.trim(),
        userEmail: form.userEmail.trim(),
        phone: form.phone.trim(),
        city: form.city.trim(),
        business: form.business.trim(),
        tier: form.tier,
      });
      if (created) {
        setAddOpen(false);
        setFilter('all');
        setSearchQuery('');
        showToast(`${created.userName} added`);
        loadApplications();
      } else {
        showToast("Couldn't add the partner.");
      }
    } finally {
      setSavingAdd(false);
    }
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sort.key !== k ? (
      <ArrowUpDown size={12} className="text-[var(--fx-faint)]" />
    ) : sort.dir === 'asc' ? (
      <ArrowUp size={12} className="text-[var(--fx-accent-ink)]" />
    ) : (
      <ArrowDown size={12} className="text-[var(--fx-accent-ink)]" />
    );

  const sortTh = (k: SortKey, label: string) => (
    <th
      className="px-4 py-3 cursor-pointer select-none whitespace-nowrap"
      onClick={() => setSort((s) => (s.key === k ? { key: k, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key: k, dir: k === 'userName' ? 'asc' : 'desc' }))}
    >
      <span className={`inline-flex items-center gap-1 ${sort.key === k ? 'text-[var(--fx-ink)]' : ''}`}>{label}<SortIcon k={k} /></span>
    </th>
  );

  const Badge = ({ status }: { status: DistributorApplication['status'] }) => {
    const meta = STATUS_META[status];
    const Icon = meta.icon;
    return (
      <span className={`fx-score-badge fx-text-label-caps gap-1.5 whitespace-nowrap ${meta.bg} ${meta.color}`}>
        <Icon size={12} />
        {meta.label}
      </span>
    );
  };

  const field = (label: string, node: React.ReactNode, span = false) => (
    <div className={span ? 'sm:col-span-2' : ''}>
      <label className="fx-label mb-1.5 block">{label}</label>
      {node}
    </div>
  );

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7 pb-16 space-y-6 sm:space-y-7 text-[var(--fx-ink)] font-body relative" style={{ background: 'var(--fx-canvas)' }}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="fx-text-heading-page text-[var(--fx-ink)]">Distributors &amp; Partners</h1>
        <div className="flex-1" />
        <button onClick={() => { setForm(EMPTY_FORM); setAddOpen(true); }} className="fx-btn fx-btn-primary">
          <Plus size={15} strokeWidth={2.5} /> Add partner
        </button>
      </div>

      <FxKpiStrip
        cards={[
          { key: 'total', label: 'Applications', value: apps.length },
          { key: 'pending', label: 'Pending', value: countOf('pending'), tone: 'amber' },
          { key: 'approved', label: 'Approved', value: countOf('approved'), tone: 'green' },
        ]}
      />

      {/* Tabs + search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-[var(--fx-border)] -mb-px">
          {STATUS_TABS.map((tab) => {
            const count = tab.key === 'all' ? apps.length : countOf(tab.key);
            const active = filter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`relative flex items-center gap-2 h-10 px-3.5 fx-text-label-tab transition-colors whitespace-nowrap cursor-pointer ${
                  active ? 'text-[var(--fx-ink)]' : 'text-[var(--fx-ink-2)] hover:text-[var(--fx-ink)]'
                }`}
              >
                {tab.label}
                <span className="inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-[6px] bg-[var(--fx-canvas)] fx-text-label-score text-[var(--fx-ink-2)]">{count}</span>
                {active && <span className="absolute left-0 right-0 bottom-0 h-[2px] bg-[var(--fx-accent)]" />}
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:w-80 shrink-0">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--fx-faint)]" />
          <input
            type="text"
            placeholder="Search name, city, phone…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="fx-input pl-10"
          />
        </div>
      </div>

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="bg-[var(--fx-accent-soft)] border border-[var(--fx-accent-ink)]/50 rounded-md px-4 py-3 flex flex-wrap items-center justify-between gap-3 animate-fade-in">
          <span className="text-[12.5px] font-bold text-[var(--fx-ink)]">
            {selected.size} selected{selectedPending.length > 0 ? ` · ${selectedPending.length} pending` : ''}
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => bulkStatus('approved')}
              disabled={bulkBusy || selectedPending.length === 0}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[10px] text-[12px] font-bold bg-[var(--fx-accent)] text-white hover:bg-[var(--fx-accent-ink)] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {bulkBusy ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />} Approve
            </button>
            <button
              onClick={() => bulkStatus('rejected')}
              disabled={bulkBusy || selectedPending.length === 0}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[10px] text-[12px] font-bold text-[var(--fx-red)] bg-white border border-[var(--fx-red)] hover:bg-[var(--fx-red-soft)] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <XCircle size={13} /> Reject
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[10px] text-[12px] font-semibold text-[var(--fx-ink-2)] hover:bg-white/60 transition-colors cursor-pointer"
            >
              <X size={13} /> Clear
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-[var(--fx-border)] rounded-md shadow-[0_1px_2px_rgba(24,24,27,0.05)] overflow-hidden w-full">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 size={22} className="animate-spin mx-auto text-[var(--fx-accent-ink)]" />
          </div>
        ) : loadError ? (
          <div className="p-10 text-center space-y-3">
            <p className="font-bold text-[13px]">Couldn't load applications.</p>
            <p className="text-[12px] text-[var(--fx-ink-2)] font-mono">{loadError}</p>
            <button onClick={loadApplications} className="fx-btn fx-btn-danger h-10"><RefreshCw size={14} /> Retry</button>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <div className="w-10 h-10 rounded-md bg-[var(--fx-accent-soft)] text-[var(--fx-accent-ink)] flex items-center justify-center mx-auto">
              <Store size={18} />
            </div>
            <p className="font-bold text-[13px]">{searchQuery || filter !== 'all' ? 'No applications match.' : 'No applications yet.'}</p>
            {(searchQuery || filter !== 'all') && (
              <button onClick={() => { setSearchQuery(''); setFilter('all'); }} className="fx-btn fx-btn-secondary h-10">
                <X size={14} /> Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--fx-surface)] border-b border-[var(--fx-border)] fx-text-body-regular text-[var(--fx-ink-2)] text-left">
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={pageAllSelected}
                        onChange={togglePageAll}
                        aria-label="Select all on this page"
                        className="w-4 h-4 rounded border-[var(--fx-border-strong)] text-[var(--fx-accent-ink)] cursor-pointer"
                      />
                    </th>
                    {sortTh('userName', 'Partner')}
                    {sortTh('tier', 'Tier')}
                    <th className="px-4 py-3">City</th>
                    <th className="px-4 py-3">Phone</th>
                    {sortTh('createdAt', 'Applied')}
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--fx-border)]">
                  {pageRows.map((app) => {
                    const isPending = app.status === 'pending';
                    const busy = busyId === app.id;
                    return (
                      <tr
                        key={app.id}
                        onClick={() => setViewing(app)}
                        className={`cursor-pointer transition-colors ${selected.has(app.id) ? 'bg-[var(--fx-accent)]/[0.07]' : 'hover:bg-[var(--fx-canvas)]'}`}
                      >
                        <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selected.has(app.id)}
                            onChange={() => toggleRow(app.id)}
                            aria-label={`Select ${app.userName}`}
                            className="w-4 h-4 rounded border-[var(--fx-border-strong)] text-[var(--fx-accent-ink)] cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-[13px] truncate max-w-[220px]">{app.userName}</div>
                          {app.business && <div className="text-[11px] text-[var(--fx-faint)] truncate max-w-[220px]">{app.business}</div>}
                        </td>
                        <td className="px-4 py-3.5 text-[12px] font-semibold whitespace-nowrap">{app.tier}</td>
                        <td className="px-4 py-3.5">
                          {app.city ? (
                            <span className="inline-flex items-center gap-1.5 text-[12px] whitespace-nowrap"><MapPin size={12} className="text-[var(--fx-faint)]" /> {app.city}</span>
                          ) : <span className="text-[var(--fx-faint)]">—</span>}
                        </td>
                        <td className="px-4 py-3.5 text-[12px] font-mono font-semibold whitespace-nowrap">{app.phone}</td>
                        <td className="px-4 py-3.5 text-[11.5px] whitespace-nowrap">{fmtDay(app.createdAt)}</td>
                        <td className="px-4 py-3.5"><Badge status={app.status} /></td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {isPending && (
                              <>
                                <button
                                  onClick={() => handleStatusChange(app, 'approved')}
                                  disabled={busy}
                                  className="h-8 px-3 rounded-[8px] text-[11px] font-bold bg-[var(--fx-accent)] text-white hover:bg-[var(--fx-accent-ink)] transition-all cursor-pointer disabled:opacity-50"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleStatusChange(app, 'rejected')}
                                  disabled={busy}
                                  className="h-8 px-3 rounded-[8px] text-[11px] font-bold text-[var(--fx-red)] bg-[var(--fx-red-soft)] border border-[var(--fx-red)] hover:brightness-95 transition cursor-pointer disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => setViewing(app)}
                              title="Quick view"
                              aria-label="Quick view"
                              className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[var(--fx-ink-2)] hover:bg-[var(--fx-canvas)] cursor-pointer"
                            >
                              <Eye size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-[var(--fx-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-[11.5px] text-[var(--fx-ink-2)]">
                  {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredApps.length)} of {filteredApps.length}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    aria-label="Previous page"
                    className="w-9 h-9 rounded-[10px] border border-[var(--fx-border)] bg-white flex items-center justify-center hover:bg-[var(--fx-canvas)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <span className="text-[12px] font-semibold px-2">{page} / {totalPages}</span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    aria-label="Next page"
                    className="w-9 h-9 rounded-[10px] border border-[var(--fx-border)] bg-white flex items-center justify-center hover:bg-[var(--fx-canvas)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick view popup */}
      {viewing && (
        <div className="fixed inset-0 bg-[var(--fx-ink)]/50 backdrop-blur-[2px] flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => setViewing(null)}>
          <div className="bg-white rounded-lg max-w-md w-full shadow-2xl border border-[var(--fx-border)] animate-modal-pop" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-[var(--fx-border)] flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-display font-bold text-[16px] truncate">{viewing.userName}</h3>
                {viewing.business && <p className="text-[12px] text-[var(--fx-ink-2)] truncate">{viewing.business}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge status={viewing.status} />
                <button onClick={() => setViewing(null)} aria-label="Close" className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[var(--fx-ink-2)] hover:bg-[var(--fx-canvas)] cursor-pointer">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="px-6 py-3 text-[12.5px]">
              {[
                ['Phone', viewing.phone ? <a href={`tel:${viewing.phone}`} className="font-mono hover:underline">{viewing.phone}</a> : ''],
                ['Email', viewing.userEmail],
                ['City', viewing.city],
                ['Tier', viewing.tier],
                ['Applied', fmtDay(viewing.createdAt)],
                ['Approved', viewing.status === 'approved' ? fmtDay(viewing.approvedAt) : ''],
                ['Notes', viewing.notes],
              ]
                .filter(([, value]) => value && value !== '—')
                .map(([label, value]) => (
                  <div key={label as string} className="flex justify-between gap-4 py-2.5 border-b border-[var(--fx-border)] last:border-0">
                    <span className="text-[var(--fx-ink-2)] shrink-0">{label}</span>
                    <span className="font-semibold text-right break-words min-w-0">{value}</span>
                  </div>
                ))}
            </div>

            {viewing.status === 'approved' && (
              <div className="px-6 py-4 border-t border-[var(--fx-border)] space-y-3">
                <p className="text-[13px] font-semibold">Allocate stickers</p>
                <div className="flex flex-wrap items-end gap-2">
                  <div>
                    <label className="fx-label mb-1.5 block" htmlFor="alloc-count">Qty</label>
                    <input
                      id="alloc-count"
                      type="number"
                      min={1}
                      max={500}
                      inputMode="numeric"
                      value={alloc.count}
                      onChange={(e) => setAlloc((a) => ({ ...a, count: e.target.value }))}
                      className="fx-input w-24"
                    />
                  </div>
                  <div className="flex-1 min-w-[140px]">
                    <label className="fx-label mb-1.5 block" htmlFor="alloc-type">Type</label>
                    <select
                      id="alloc-type"
                      value={alloc.category}
                      onChange={(e) => setAlloc((a) => ({ ...a, category: e.target.value }))}
                      className="fx-input"
                    >
                      <option value="">Any</option>
                      {STICKER_CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <button onClick={() => handleAllocate(viewing)} disabled={allocBusy} className="fx-btn fx-btn-primary">
                    {allocBusy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Allocate
                  </button>
                </div>
                <label className="inline-flex items-center gap-2 text-[12.5px] text-[var(--fx-ink-2)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alloc.printedOnly}
                    onChange={(e) => setAlloc((a) => ({ ...a, printedOnly: e.target.checked }))}
                    className="w-4 h-4 rounded border-[var(--fx-border-strong)] cursor-pointer"
                  />
                  Printed only
                </label>
              </div>
            )}

            {viewing.status === 'pending' && (
              <div className="px-6 py-4 border-t border-[var(--fx-border)] flex items-center justify-end gap-2">
                <button onClick={() => handleStatusChange(viewing, 'rejected')} disabled={busyId === viewing.id} className="fx-btn fx-btn-danger">
                  <XCircle size={14} /> Reject
                </button>
                <button onClick={() => handleStatusChange(viewing, 'approved')} disabled={busyId === viewing.id} className="fx-btn fx-btn-primary">
                  {busyId === viewing.id ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />} Approve
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add partner popup */}
      {addOpen && (
        <div className="fixed inset-0 bg-[var(--fx-ink)]/50 backdrop-blur-[2px] flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => !savingAdd && setAddOpen(false)}>
          <div className="bg-white rounded-lg max-w-lg w-full shadow-2xl border border-[var(--fx-border)] p-6 space-y-5 animate-modal-pop" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-[17px] font-bold tracking-[-0.3px]">Add partner</h2>
              <button onClick={() => setAddOpen(false)} className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[var(--fx-ink-2)] hover:bg-[var(--fx-canvas)] cursor-pointer" aria-label="Close">
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {field('Partner name', <input type="text" value={form.userName} onChange={(e) => setForm((f) => ({ ...f, userName: e.target.value }))} className="fx-input" />, true)}
              {field('Email', <input type="email" value={form.userEmail} onChange={(e) => setForm((f) => ({ ...f, userEmail: e.target.value }))} className="fx-input" />)}
              {field('Phone', <input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="fx-input font-mono" />)}
              {field('Business', <input type="text" value={form.business} onChange={(e) => setForm((f) => ({ ...f, business: e.target.value }))} className="fx-input" />, true)}
              {field('City', <input type="text" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} className="fx-input" />)}
              {field('Tier',
                <select value={form.tier} onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value }))} className="fx-input">
                  <option value="Starter">Starter</option>
                  <option value="Growth">Growth</option>
                  <option value="Elite">Elite</option>
                </select>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button onClick={() => setAddOpen(false)} disabled={savingAdd} className="fx-btn fx-btn-secondary">Cancel</button>
              <button onClick={submitAdd} disabled={savingAdd} className="fx-btn fx-btn-primary">
                {savingAdd ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                {savingAdd ? 'Saving…' : 'Add partner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

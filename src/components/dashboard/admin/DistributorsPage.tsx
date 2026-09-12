import React, { useState, useEffect, useMemo } from 'react';
import {
  Store, CheckCircle2, Clock, XCircle, Search, MapPin,
  Phone, Mail, Zap, ShieldCheck, RefreshCw, Loader2,
  Plus, ArrowUp, ArrowDown, ArrowUpDown, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import {
  updateDistributorApplicationStatus,
  saveDistributorApplication,
  DistributorApplication
} from '../../../lib/distributorService';
import { apiClient } from '../../../lib/apiClient';

const STATUS_META: Record<DistributorApplication['status'], { label: string; icon: any; color: string; bg: string }> = {
  pending: { label: 'Pending Verification', icon: Clock, color: 'text-[#B54708]', bg: 'bg-[#FEF6E7]' },
  approved: { label: 'Approved', icon: CheckCircle2, color: 'text-[#16A34A]', bg: 'bg-[#F0FDF4]' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'text-[#EF4444]', bg: 'bg-[#FEF2F2]' },
};

const STATUS_TABS: Array<{ key: 'all' | DistributorApplication['status']; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

type SortKey = 'userName' | 'tier' | 'createdAt';

export default function DistributorsPage({ setToast }: { setToast: (msg: string) => void }) {
  const [apps, setApps] = useState<DistributorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | DistributorApplication['status']>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'createdAt', dir: 'desc' });
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectedApp, setSelectedApp] = useState<DistributorApplication | null>(null);

  const [bulkBusy, setBulkBusy] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [savingAdd, setSavingAdd] = useState(false);
  const [form, setForm] = useState({ userName: '', userEmail: '', phone: '', city: '', business: '', tier: 'Starter' });

  const loadApplications = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await apiClient.distributors.list();
      setApps(res?.data || []);
    } catch (err: any) {
      console.error('Failed to load distributor applications:', err);
      setLoadError(err?.message || 'Failed to load distributor applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const handleStatusChange = async (appId: string, status: 'approved' | 'rejected') => {
    const updated = await updateDistributorApplicationStatus(appId, status);
    if (updated) {
      loadApplications();
      if (selectedApp && selectedApp.id === appId) setSelectedApp(updated);
      showToast(
        status === 'approved'
          ? `✓ Application ${appId} Verified & Approved! Distributor dashboard access granted.`
          : `Application ${appId} rejected.`
      );
    } else {
      showToast(`Failed to ${status === 'approved' ? 'approve' : 'reject'} application ${appId}.`);
    }
  };

  const filteredApps = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = apps.filter(app => {
      const matchesFilter = filter === 'all' || app.status === filter;
      const matchesSearch =
        !q ||
        app.userName.toLowerCase().includes(q) ||
        app.city.toLowerCase().includes(q) ||
        app.phone.includes(q) ||
        app.userEmail.toLowerCase().includes(q) ||
        app.id.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
    return [...filtered].sort((a, b) => {
      let diff = 0;
      if (sort.key === 'userName') diff = a.userName.localeCompare(b.userName);
      else if (sort.key === 'tier') diff = a.tier.localeCompare(b.tier);
      else diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sort.dir === 'asc' ? diff : -diff;
    });
  }, [apps, filter, searchQuery, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredApps.length / PAGE_SIZE));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);
  useEffect(() => {
    setPage(1);
  }, [filter, searchQuery, sort]);

  const pageRows = filteredApps.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageAllSelected = pageRows.length > 0 && pageRows.every((a) => selected.has(a.id));

  const pendingCount = apps.filter(a => a.status === 'pending').length;
  const approvedCount = apps.filter(a => a.status === 'approved').length;
  const selectedPendingCount = apps.filter(a => selected.has(a.id) && a.status === 'pending').length;

  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const togglePageAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (pageAllSelected) pageRows.forEach((a) => next.delete(a.id));
      else pageRows.forEach((a) => next.add(a.id));
      return next;
    });
  };

  const bulkStatus = async (status: 'approved' | 'rejected') => {
    const pendingIds = [...selected].filter((id) => apps.find((a) => a.id === id)?.status === 'pending');
    if (pendingIds.length === 0) return;
    setBulkBusy(true);
    let ok = 0;
    for (const id of pendingIds) {
      const updated = await updateDistributorApplicationStatus(id, status);
      if (updated) ok += 1;
    }
    setSelected(new Set());
    setBulkBusy(false);
    showToast(
      status === 'approved'
        ? `✓ ${ok} application${ok === 1 ? '' : 's'} verified & approved!`
        : `${ok} application${ok === 1 ? '' : 's'} rejected.`
    );
    loadApplications();
  };

  const submitAdd = async () => {
    if (!form.userName.trim() || !form.userEmail.trim() || !form.phone.trim()) {
      showToast('Partner name, email and phone are required.');
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
        showToast(`${created.userName} added — application ${created.id} submitted.`);
        loadApplications();
      } else {
        showToast('Failed to submit the partner application.');
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
    <th className="px-4 py-3 cursor-pointer select-none whitespace-nowrap" onClick={() => { setSort((s) => s.key === k ? { key: k, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key: k, dir: k === 'userName' ? 'asc' : 'desc' }); }}>
      <span className={`inline-flex items-center gap-1 ${sort.key === k ? 'text-[var(--fx-ink)]' : ''}`}>{label}<SortIcon k={k} /></span>
    </th>
  );

  const Badge = ({ status }: { status: DistributorApplication['status'] }) => {
    const meta = STATUS_META[status];
    const Icon = meta.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide whitespace-nowrap ${meta.bg} ${meta.color}`}>
        <Icon size={12} />
        {meta.label}
      </span>
    );
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7 pb-16 space-y-6 sm:space-y-7 text-[var(--fx-ink)] font-body relative" style={{ background: 'var(--fx-canvas)' }}>
      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-[var(--fx-accent-soft)] text-[var(--fx-accent-ink)] flex items-center justify-center shrink-0">
            <Store size={21} />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-[24px] font-bold text-[var(--fx-ink)] leading-tight tracking-[-0.5px] flex items-center gap-2.5">
              Distributors & Partners
              <span className="inline-flex items-center px-2.5 h-6 rounded-full bg-[var(--fx-canvas)] text-[var(--fx-ink-2)] text-[11px] font-bold">
                {apps.length} application{apps.length === 1 ? '' : 's'}
              </span>
            </h1>
            <p className="text-[13px] text-[var(--fx-ink-2)] mt-0.5">
              Review B2B franchise requests, verify partner credentials, and unlock Distributor Dashboards.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="inline-flex items-center gap-2 px-3.5 h-10 rounded-lg bg-[#FEF6E7] text-[#B54708] text-[12px] font-semibold">
            <Clock size={14} className="animate-pulse" />
            <span className="font-mono font-bold">{pendingCount}</span> Pending Verification
          </div>
          <div className="inline-flex items-center gap-2 px-3.5 h-10 rounded-lg bg-[#F0FDF4] text-[#16A34A] text-[12px] font-semibold">
            <CheckCircle2 size={14} />
            <span className="font-mono font-bold">{approvedCount}</span> Active Partners
          </div>
          <button onClick={() => { setAddOpen(true); setForm({ userName: '', userEmail: '', phone: '', city: '', business: '', tier: 'Starter' }); }} className="fx-btn fx-btn-primary">
            <Plus size={15} strokeWidth={2.5} />
            Add Partner
          </button>
        </div>
      </div>

      {/* ── Toolbar: tabs + search ──────────────────────────────────── */}
      <div className="bg-white border border-[var(--fx-border)] rounded-xl shadow-[0_1px_2px_rgba(24,24,27,0.05)] p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto -mx-1 px-1">
          {STATUS_TABS.map((tab) => {
            const count = tab.key === 'all' ? apps.length : apps.filter((a) => a.status === tab.key).length;
            const active = filter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-1.5 h-10 px-4 rounded-[10px] text-[12px] font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  active ? 'bg-[var(--fx-accent)] text-white shadow-sm shadow-[var(--fx-accent)]/25' : 'text-[var(--fx-ink-2)] hover:bg-[var(--fx-canvas)] hover:text-[var(--fx-ink)]'
                }`}
              >
                {tab.label}
                <span className={`text-[10px] font-bold font-mono ${active ? 'text-white/80' : 'text-[var(--fx-faint)]'}`}>{count}</span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:w-80 shrink-0">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--fx-faint)]" />
          <input
            type="text"
            placeholder="Search by name, city, phone, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 h-10 text-[12.5px] rounded-[10px] border border-[var(--fx-border)] bg-[var(--fx-canvas)] text-[var(--fx-ink)] placeholder-[var(--fx-faint)] outline-none transition-all focus:border-[var(--fx-accent-ink)] focus:bg-white focus:ring-[3px] focus:ring-[var(--fx-accent)]/[0.30]"
          />
        </div>
      </div>

      {/* ── Bulk selection bar ──────────────────────────────────────── */}
      {selected.size > 0 && (
        <div className="bg-[var(--fx-accent-soft)] border border-[var(--fx-accent-ink)]/50 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 animate-fade-in">
          <span className="text-[12.5px] font-bold text-[var(--fx-ink)]">
            {selected.size} application{selected.size === 1 ? '' : 's'} selected
            {selectedPendingCount > 0 && (
              <span className="ml-1.5 text-[11px] font-semibold text-[var(--fx-accent-ink)]">({selectedPendingCount} pending)</span>
            )}
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => bulkStatus('approved')}
              disabled={bulkBusy || selectedPendingCount === 0}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[10px] text-[12px] font-bold bg-[var(--fx-accent)] text-white hover:bg-[var(--fx-accent-ink)] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
              title={selectedPendingCount === 0 ? 'Select pending applications to approve' : 'Approve all selected pending applications'}
            >
              <ShieldCheck size={13} /> Approve Selected
            </button>
            <button
              onClick={() => bulkStatus('rejected')}
              disabled={bulkBusy || selectedPendingCount === 0}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[10px] text-[12px] font-bold text-[#EF4444] bg-white border border-[#FECACA] hover:bg-[#FEF2F2] transition-all cursor-pointer disabled:opacity-40"
            >
              {bulkBusy ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />} Reject Selected
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

      {/* ── Main: table + inspector ─────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-8 space-y-4 min-w-0">
          <div className="bg-white border border-[var(--fx-border)] rounded-xl shadow-[0_1px_2px_rgba(24,24,27,0.05)] overflow-hidden">
            {loading ? (
              <div className="p-16 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-[var(--fx-accent-soft)] text-[var(--fx-accent-ink)] flex items-center justify-center mx-auto">
                  <Loader2 size={22} className="animate-spin" />
                </div>
                <p className="font-semibold text-[13px] text-[var(--fx-ink)]">Loading applications…</p>
              </div>
            ) : loadError ? (
              <div className="p-16 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-[#FEF2F2] text-[#EF4444] flex items-center justify-center mx-auto">
                  <XCircle size={22} />
                </div>
                <p className="font-bold text-[13px] text-[var(--fx-ink)]">Couldn't load applications.</p>
                <p className="text-[12px] text-[var(--fx-ink-2)] font-mono max-w-[420px] mx-auto">{loadError}</p>
                <button onClick={loadApplications} className="fx-btn fx-btn-danger h-10">
                  <RefreshCw size={14} /> Retry
                </button>
              </div>
            ) : filteredApps.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-[var(--fx-accent-soft)] text-[var(--fx-accent-ink)] flex items-center justify-center mx-auto">
                  <Store size={22} />
                </div>
                <p className="font-bold text-[13px] text-[var(--fx-ink)]">
                  {searchQuery || filter !== 'all' ? 'No applications match your filters.' : 'No distributor applications yet.'}
                </p>
                <p className="text-[12.5px] text-[var(--fx-ink-2)] max-w-[440px] mx-auto">
                  {searchQuery || filter !== 'all'
                    ? 'Try a different search term or status tab.'
                    : 'Applications submitted by users on the landing page will appear here for verification.'}
                </p>
                {(searchQuery || filter !== 'all') && (
                  <button onClick={() => { setSearchQuery(''); setFilter('all'); }} className="fx-btn fx-btn-secondary h-10">
                    <X size={14} /> Clear filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[var(--fx-canvas)] border-b border-[var(--fx-border)] text-[10px] font-bold uppercase tracking-wide text-[var(--fx-ink-2)]">
                        <th className="px-4 py-3 w-10">
                          <input
                            type="checkbox"
                            checked={pageAllSelected}
                            onChange={togglePageAll}
                            title="Select all applications on this page"
                            className="w-4 h-4 rounded border-[#D0D5DD] text-[var(--fx-accent-ink)] cursor-pointer"
                          />
                        </th>
                        {sortTh('userName', 'Partner')}
                        <th className="px-4 py-3">Business</th>
                        {sortTh('tier', 'Tier')}
                        <th className="px-4 py-3">City</th>
                        <th className="px-4 py-3">Contact</th>
                        {sortTh('createdAt', 'Applied')}
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--fx-border)]">
                      {pageRows.map((app) => {
                        const isBulkSelected = selected.has(app.id);
                        const isInspecting = selectedApp?.id === app.id;
                        const isPending = app.status === 'pending';
                        const isApproved = app.status === 'approved';
                        return (
                          <tr
                            key={app.id}
                            onClick={() => setSelectedApp(app)}
                            className={`group cursor-pointer transition-colors ${
                              isInspecting ? 'bg-[var(--fx-accent-soft)]/50' : isBulkSelected ? 'bg-[var(--fx-accent)]/[0.07]' : 'hover:bg-[var(--fx-canvas)]'
                            }`}
                          >
                            <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isBulkSelected}
                                onChange={() => toggleRow(app.id)}
                                title="Select this application"
                                className="w-4 h-4 rounded border-[#D0D5DD] text-[var(--fx-accent-ink)] cursor-pointer"
                              />
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-[13px] shrink-0 ${
                                  isApproved ? 'bg-[#F0FDF4] text-[#16A34A]' : isPending ? 'bg-[#FEF6E7] text-[#B54708]' : 'bg-[#FEF2F2] text-[#EF4444]'
                                }`}>
                                  {app.userName.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-semibold text-[13px] text-[var(--fx-ink)] truncate">{app.userName}</div>
                                  <div className="text-[11px] text-[var(--fx-faint)] font-mono truncate">#{app.id}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="text-[12.5px] font-semibold text-[var(--fx-ink)] truncate max-w-[160px]">{app.business}</div>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10.5px] font-bold text-[var(--fx-accent-ink)] bg-[var(--fx-accent-soft)] whitespace-nowrap">
                                <Zap size={11} /> {app.tier}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="inline-flex items-center gap-1.5 text-[11.5px] text-[var(--fx-ink)] whitespace-nowrap">
                                <MapPin size={12} className="text-[var(--fx-faint)]" /> {app.city}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="text-[12px] font-semibold font-mono text-[var(--fx-ink)] whitespace-nowrap">{app.phone}</div>
                              <div className="text-[11px] text-[var(--fx-faint)] max-w-[150px] truncate">{app.userEmail}</div>
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <div className="text-[11.5px] font-semibold text-[var(--fx-ink)]">{new Date(app.createdAt).toLocaleDateString()}</div>
                              <div className="text-[11px] text-[var(--fx-faint)]">{new Date(app.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            </td>
                            <td className="px-4 py-3.5"><Badge status={app.status} /></td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                {isPending && (
                                  <>
                                    <button
                                      onClick={() => handleStatusChange(app.id, 'approved')}
                                      className="flex items-center gap-1.5 h-8 px-3 rounded-[8px] text-[11px] font-bold bg-[var(--fx-accent)] text-white hover:bg-[var(--fx-accent-ink)] transition-all cursor-pointer shadow-xs"
                                    >
                                      <ShieldCheck size={12} /> Approve
                                    </button>
                                    <button
                                      onClick={() => handleStatusChange(app.id, 'rejected')}
                                      className="flex items-center gap-1.5 h-8 px-3 rounded-[8px] text-[11px] font-bold text-[#EF4444] bg-[#FEF2F2] border border-[#FECACA] hover:bg-[#FFE4E6] transition-colors cursor-pointer"
                                    >
                                      <XCircle size={12} /> Reject
                                    </button>
                                  </>
                                )}
                                {isApproved && (
                                  <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-[#16A34A]">
                                    <CheckCircle2 size={14} /> Active
                                  </span>
                                )}
                                {app.status === 'rejected' && (
                                  <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-[var(--fx-faint)]">
                                    <XCircle size={14} /> Closed
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                   </tbody>
                 </table>

                 {/* Pagination footer */}
                <div className="px-4 py-3 border-t border-[var(--fx-border)] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-[11.5px] text-[var(--fx-ink-2)]">
                    Showing <span className="font-bold text-[var(--fx-ink)]">{filteredApps.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}</span>–
                    <span className="font-bold text-[var(--fx-ink)]">{Math.min(page * PAGE_SIZE, filteredApps.length)}</span> of{" "}
                    <span className="font-bold text-[var(--fx-ink)]">{filteredApps.length}</span> applications
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="flex items-center justify-center w-9 h-9 rounded-[10px] border border-[var(--fx-border)] bg-white text-[var(--fx-ink)] hover:bg-[var(--fx-canvas)] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={15} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => {
                      const show = totalPages <= 7 || Math.abs(n - page) <= 1 || n === 1 || n === totalPages;
                      if (!show) return n === totalPages - 1 || n === 2 ? <span key={n} className="px-1 text-[12px] text-[var(--fx-faint)]">…</span> : null;
                      return (
                        <button
                          key={n}
                          onClick={() => setPage(n)}
                          className={`flex items-center justify-center min-w-9 h-9 px-2.5 rounded-[10px] text-[12px] font-semibold transition-all cursor-pointer ${
                            page === n ? 'bg-[var(--fx-accent)] text-white shadow-xs' : 'text-[var(--fx-ink-2)] hover:bg-[var(--fx-canvas)]'
                          }`}
                        >
                          {n}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="flex items-center justify-center w-9 h-9 rounded-[10px] border border-[var(--fx-border)] bg-white text-[var(--fx-ink)] hover:bg-[var(--fx-canvas)] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Next page"
                    >
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Details Inspector ─────────────────────────────────────── */}
        <div className="xl:col-span-4 bg-white border border-[var(--fx-border)] rounded-xl shadow-[0_1px_2px_rgba(24,24,27,0.05)] sticky top-6 min-w-0">
          <div className="px-6 py-4 border-b border-[var(--fx-border)] flex items-center justify-between gap-3">
            <h3 className="font-display font-semibold text-[14.5px] text-[var(--fx-ink)]">Application Inspector</h3>
            {selectedApp && <span className="text-[11px] font-mono font-bold text-[var(--fx-accent-ink)] bg-[var(--fx-accent-soft)] px-2 py-0.5 rounded-md">#{selectedApp.id}</span>}
          </div>

          {selectedApp ? (
            <div className="p-6 space-y-5 text-[12px]">
              <div>
                <label className="text-[10px] font-bold text-[var(--fx-ink-2)] uppercase tracking-wide block mb-1.5">Company / Partner Name</label>
                <div className="font-bold text-[14px] text-[var(--fx-ink)] bg-[var(--fx-canvas)] border border-[var(--fx-border)] p-3 rounded-[10px]">
                  {selectedApp.userName}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-[var(--fx-ink-2)] uppercase tracking-wide block mb-1.5">Phone / WhatsApp</label>
                  <div className="font-bold text-[var(--fx-ink)] bg-[var(--fx-canvas)] border border-[var(--fx-border)] p-3 rounded-[10px] flex items-center gap-1.5 font-mono">
                    <Phone size={14} className="text-[var(--fx-accent-ink)]" />
                    {selectedApp.phone}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[var(--fx-ink-2)] uppercase tracking-wide block mb-1.5">City / Region</label>
                  <div className="font-bold text-[var(--fx-ink)] bg-[var(--fx-canvas)] border border-[var(--fx-border)] p-3 rounded-[10px] flex items-center gap-1.5">
                    <MapPin size={14} className="text-[var(--fx-accent-ink)]" />
                    {selectedApp.city}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[var(--fx-ink-2)] uppercase tracking-wide block mb-1.5">Account Email</label>
                <div className="font-medium text-[var(--fx-ink)] bg-[var(--fx-canvas)] border border-[var(--fx-border)] p-3 rounded-[10px] flex items-center gap-1.5 truncate">
                  <Mail size={14} className="text-[var(--fx-faint)] flex-shrink-0" />
                  <span className="truncate">{selectedApp.userEmail}</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[var(--fx-ink-2)] uppercase tracking-wide block mb-1.5">Interested Partner Tier</label>
                <div className="font-black text-[var(--fx-accent-ink)] bg-[var(--fx-accent-soft)] p-3 rounded-[10px] flex items-center gap-2">
                  <Zap size={15} /> {selectedApp.tier}
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--fx-border)] space-y-2">
                <label className="text-[10px] font-bold text-[var(--fx-ink-2)] uppercase tracking-wide block">Admin Verification Action</label>
                {selectedApp.status === 'pending' ? (
                  <div className="space-y-2">
                    <button
                      onClick={() => handleStatusChange(selectedApp.id, 'approved')}
                      className="w-full flex items-center justify-center gap-2 h-11 rounded-[10px] font-bold bg-[var(--fx-accent)] text-white hover:bg-[var(--fx-accent-ink)] transition-all text-[12.5px] cursor-pointer shadow-sm shadow-[var(--fx-accent)]/20"
                    >
                      <ShieldCheck size={16} /> Approve & Grant Distributor Access
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedApp.id, 'rejected')}
                      className="w-full flex items-center justify-center gap-2 h-10 rounded-[10px] font-semibold text-[#EF4444] bg-[#FEF2F2] border border-[#FECACA] hover:bg-[#FFE4E6] transition-all text-[12.5px] cursor-pointer"
                    >
                      Reject Application
                    </button>
                  </div>
                ) : (
                  <div className="p-3 rounded-[10px] bg-[#F0FDF4] text-[#16A34A] font-bold text-center text-[12.5px]">
                    ✓ Verified on {selectedApp.approvedAt ? new Date(selectedApp.approvedAt).toLocaleDateString() : 'Today'}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-20 px-6 text-center text-[var(--fx-faint)] text-[12.5px]">
              Select any application row to inspect applicant details and verify rights.
            </div>
          )}
        </div>
      </div>

      {/* ── Add Partner Modal ───────────────────────────────────────── */}
      {addOpen && (
        <div className="fixed inset-0 bg-[var(--fx-ink)]/50 backdrop-blur-[2px] flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => !savingAdd && setAddOpen(false)}>
           <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[var(--fx-border)] p-6 space-y-5 animate-modal-pop" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-[17px] font-bold text-[var(--fx-ink)] tracking-[-0.3px]">Add partner application</h2>
                <p className="text-[12.5px] text-[var(--fx-ink-2)] mt-0.5">Manually register a distributor/partner interested in the franchise program.</p>
              </div>
              <button onClick={() => setAddOpen(false)} className="flex items-center justify-center w-8 h-8 rounded-[8px] text-[var(--fx-ink-2)] hover:bg-[var(--fx-canvas)] cursor-pointer" aria-label="Close">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="fx-label mb-1.5 block">Company / Partner name</label>
                  <input type="text" value={form.userName} onChange={(e) => setForm((f) => ({ ...f, userName: e.target.value }))} placeholder="e.g. Sharma Auto Garage" className="fx-input" />
                </div>
                <div>
                  <label className="fx-label mb-1.5 block">Email</label>
                  <input type="email" value={form.userEmail} onChange={(e) => setForm((f) => ({ ...f, userEmail: e.target.value }))} placeholder="name@example.com" className="fx-input" />
                </div>
                <div>
                  <label className="fx-label mb-1.5 block">Phone / WhatsApp</label>
                  <input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="90XXXXXXXX" className="fx-input font-mono" />
                </div>
                <div className="sm:col-span-2">
                  <label className="fx-label mb-1.5 block">Business type</label>
                  <input type="text" value={form.business} onChange={(e) => setForm((f) => ({ ...f, business: e.target.value }))} placeholder="e.g. Automobile dealership" className="fx-input" />
                </div>
                <div>
                  <label className="fx-label mb-1.5 block">City / Region</label>
                  <input type="text" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} placeholder="City" className="fx-input" />
                </div>
                <div>
                  <label className="fx-label mb-1.5 block">Requested tier</label>
                  <select value={form.tier} onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value }))} className="fx-input">
                    <option value="Starter">Starter</option>
                    <option value="Growth">Growth</option>
                    <option value="Elite">Elite</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button onClick={() => setAddOpen(false)} disabled={savingAdd} className="fx-btn fx-btn-secondary">
                Cancel
              </button>
              <button onClick={submitAdd} disabled={savingAdd} className="fx-btn fx-btn-primary">
                {savingAdd ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                {savingAdd ? 'Submitting…' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
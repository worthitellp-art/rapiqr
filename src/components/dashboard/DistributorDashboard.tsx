import { useEffect, useState } from 'react';
import { Boxes, CheckCircle2, Clock, Globe, LayoutGrid, Loader2, LogOut, MapPin, QrCode, RefreshCw, ScanLine, Store, Tag, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { dashboardTranslations } from '../../i18n/dashboardTranslations';
import { apiClient, DistributorDashboardData } from '../../lib/apiClient';
import { usePolling } from '../../hooks/usePolling';
import LanguageSwitcher from '../common/LanguageSwitcher';
import AppLogo from '../common/AppLogo';
import FxSidebar, { FxSidebarItem } from './shared/FxSidebar';
import FxKpiStrip from './shared/FxKpiStrip';
import FxTable, { FxTableColumn } from './shared/FxTable';

type TabId = 'overview' | 'stickers';
type StickerRow = DistributorDashboardData['stickers'][number];
type ApplicationStatus = 'pending' | 'approved' | 'rejected';

const POLL_MS = 60_000;

const fmtDay = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const rowKeyOf = (s: StickerRow) => `${s.ref}-${s.allocatedAt}`;

const stickerColumns: FxTableColumn<StickerRow>[] = [
  { key: 'ref', header: 'Sticker', render: (s) => <span className="font-mono font-semibold">{s.ref}</span> },
  { key: 'type', header: 'Type', render: (s) => <span className="capitalize text-[var(--fx-ink-2)]">{s.category}</span> },
  {
    key: 'customer',
    header: 'Customer',
    render: (s) => (s.ownerName ? <span className="font-semibold">{s.ownerName}</span> : <span className="text-[var(--fx-faint)]">—</span>),
  },
  {
    key: 'phone',
    header: 'Phone',
    render: (s) => (s.ownerPhone ? <span className="font-mono text-[12px]">{s.ownerPhone}</span> : <span className="text-[var(--fx-faint)]">—</span>),
  },
  { key: 'activated', header: 'Activated', render: (s) => <span className="text-[12px] text-[var(--fx-ink-2)]">{fmtDay(s.activatedAt)}</span> },
  { key: 'scans', header: 'Scans', render: (s) => <span className="tabular-nums">{s.scans}</span> },
  {
    key: 'status',
    header: 'Status',
    align: 'right',
    render: (s) => (
      <span
        className={`inline-flex items-center h-6 px-2 rounded-[var(--fx-radius-pill)] text-[12px] font-semibold ${
          s.status === 'active' ? 'bg-[var(--fx-green-soft)] text-[var(--fx-green)]' : 'bg-[var(--fx-canvas)] text-[var(--fx-ink-2)]'
        }`}
      >
        {s.status === 'active' ? 'Active' : 'In stock'}
      </span>
    ),
  },
];

/** What a partner sees when the account isn't an approved distributor (yet). */
function ApplicationGate({ status, onBack }: { status: ApplicationStatus | null; onBack: () => void }) {
  const meta = {
    pending: { icon: Clock, tone: 'bg-[var(--fx-amber-soft)] text-[var(--fx-amber)]', title: 'Application under review' },
    rejected: { icon: XCircle, tone: 'bg-[var(--fx-red-soft)] text-[var(--fx-red)]', title: 'Application not approved' },
    // Approved, yet this account was never granted the partner role (the application
    // was filed before the account existed) — only support can finish linking it.
    approved: { icon: CheckCircle2, tone: 'bg-[var(--fx-green-soft)] text-[var(--fx-green)]', title: 'Approved — contact support to finish setup' },
    none: { icon: Store, tone: 'bg-[var(--fx-canvas)] text-[var(--fx-ink-2)]', title: 'No partner application yet' },
  }[status ?? 'none'];
  const Icon = meta.icon;

  return (
    <div className="fx-empty mx-auto max-w-md">
      <span className={`w-11 h-11 rounded-[var(--fx-radius-control)] flex items-center justify-center ${meta.tone}`}>
        <Icon size={20} />
      </span>
      <p className="text-[14px] font-semibold text-[var(--fx-ink)]">{meta.title}</p>
      <button onClick={onBack} className="fx-btn fx-btn-secondary mt-1">Back to site</button>
    </div>
  );
}

export default function DistributorDashboard({ onBack }: { onBack: () => void }) {
  const { profile, signOut } = useAuth();
  const { language } = useLanguage();
  const t = dashboardTranslations[language].distributor;

  const [activeTab, setActiveTab] = useState<TabId>(() => {
    try {
      const saved = localStorage.getItem('repiqr-distributor-active-tab');
      if (saved === 'overview' || saved === 'stickers') return saved;
    } catch { /* fallback */ }
    return 'overview';
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [data, setData] = useState<DistributorDashboardData | null>(null);
  const [gate, setGate] = useState<ApplicationStatus | 'none' | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // The old screen saved customer names and phone numbers a partner typed in to
  // localStorage. Nothing reads them any more — clear them rather than leave
  // other people's personal data sitting in the browser.
  useEffect(() => {
    try {
      localStorage.removeItem('repiqr-distributor-assigned-tags');
      localStorage.removeItem('namoqr-distributor-assigned-tags');
    } catch { /* storage unavailable */ }
  }, []);

  const selectTab = (id: string) => {
    setActiveTab(id as TabId);
    try { localStorage.setItem('repiqr-distributor-active-tab', id); } catch { /* UI preference only */ }
  };

  // Everything here comes from the backend: the partner's application and the stock
  // an admin allocated to them. (This screen used to show invented customers, a
  // fixed 300-tag stock and made-up revenue, all kept in localStorage.)
  const refresh = usePolling(async () => {
    try {
      const res = await apiClient.distributors.myDashboard();
      if (res?.success) {
        setData(res.data);
        setGate(null);
        setError(null);
      }
    } catch (err: any) {
      if (err?.status === 403) {
        // Not (or no longer) an approved distributor — show where the application stands.
        const app = await apiClient.distributors.myStatus().catch(() => null);
        setData(null);
        setGate((app?.data?.status as ApplicationStatus | undefined) ?? 'none');
        setError(null);
      } else {
        setError(err?.message || 'Could not load your dashboard.');
        throw err; // lets the poller back off
      }
    } finally {
      setLoading(false);
    }
  }, { intervalMs: POLL_MS });

  const items: FxSidebarItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    { id: 'stickers', label: 'Stickers', icon: Tag },
  ];

  const stats = data?.stats;
  const activationPct = stats && stats.allocated > 0 ? Math.round((stats.activated / stats.allocated) * 100) : 0;
  const app = data?.application;

  return (
    <div className="fx-shell h-screen w-full flex overflow-hidden text-[var(--fx-ink)]" style={{ background: 'var(--fx-canvas)' }}>
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} aria-hidden="true" />}

      <FxSidebar
        storageKey="distributor"
        items={items}
        activeId={activeTab}
        onSelect={selectTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        logo={
          <button onClick={onBack} className="flex items-center gap-2 cursor-pointer group" aria-label="RapiQR home">
            <AppLogo variant="light" className="h-7 w-auto object-contain transition-transform group-hover:scale-105" />
          </button>
        }
        account={{
          name: profile?.fullName || t.partnerDesk,
          email: profile?.email,
          subtitle: gate ? t.partnerDesk : t.verifiedPartner,
          tone: gate ? 'neutral' : 'ok',
          menu: [
            { label: t.exitToHome, icon: Globe, onClick: onBack },
            { label: t.logOut, icon: LogOut, onClick: async () => { await signOut(); onBack(); }, danger: true },
          ],
        }}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-[56px] flex-shrink-0 flex items-center gap-3 px-4 sm:px-6 lg:px-8 border-b border-[var(--fx-border)]">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="md:hidden w-8 h-8 flex-shrink-0 rounded-md bg-[var(--fx-surface)] border border-[var(--fx-border)] flex items-center justify-center cursor-pointer"
            aria-label="Open navigation menu"
          >
            <LayoutGrid size={15} />
          </button>
          <h1 className="fx-text-heading-brand text-[var(--fx-ink)]">{t.partnerDesk}</h1>
          <div className="flex-1" />
          <LanguageSwitcher />
          <button
            type="button"
            onClick={refresh}
            aria-label="Refresh"
            title="Refresh"
            className="w-9 h-9 flex-shrink-0 rounded-[var(--fx-radius-control)] border border-[var(--fx-border)] bg-[var(--fx-surface)] flex items-center justify-center text-[var(--fx-ink-2)] hover:text-[var(--fx-ink)] cursor-pointer"
          >
            <RefreshCw size={15} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16 space-y-6">
          {loading ? (
            <div className="fx-empty"><Loader2 size={22} className="fx-spin text-[var(--fx-ink-2)]" /></div>
          ) : gate ? (
            <ApplicationGate status={gate === 'none' ? null : gate} onBack={onBack} />
          ) : error && !data ? (
            <div className="fx-empty" role="alert">
              <p className="text-[13px] font-semibold text-[var(--fx-red)]">{error}</p>
              <button onClick={refresh} className="fx-btn fx-btn-secondary mt-1"><RefreshCw size={14} /> Retry</button>
            </div>
          ) : data && stats ? (
            <>
              {activeTab === 'overview' && (
                <>
                  <FxKpiStrip
                    cards={[
                      { key: 'allocated', label: 'Allocated', value: stats.allocated.toLocaleString('en-IN'), icon: <Boxes size={14} /> },
                      {
                        key: 'activated',
                        label: 'Activated',
                        value: stats.activated.toLocaleString('en-IN'),
                        tone: 'green',
                        badge: stats.allocated > 0 ? { text: `${activationPct}%`, tone: 'green' } : undefined,
                        icon: <CheckCircle2 size={14} />,
                      },
                      { key: 'stock', label: 'In stock', value: stats.inStock.toLocaleString('en-IN'), tone: stats.inStock > 0 ? 'amber' : 'neutral', icon: <QrCode size={14} /> },
                      { key: 'scans', label: 'Scans', value: stats.scans.toLocaleString('en-IN'), icon: <ScanLine size={14} /> },
                    ]}
                  />

                  {app && (
                    <div className="fx-card p-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px]">
                      <span className="inline-flex items-center gap-1.5 font-semibold">
                        <Store size={14} className="text-[var(--fx-ink-2)]" /> {app.business || t.partnerDesk}
                      </span>
                      {app.city && (
                        <span className="inline-flex items-center gap-1.5 text-[var(--fx-ink-2)]">
                          <MapPin size={13} /> {app.city}
                        </span>
                      )}
                      {app.tier && <span className="text-[var(--fx-ink-2)]">{app.tier}</span>}
                      <span className="text-[var(--fx-faint)]">Since {fmtDay(app.approvedAt || app.createdAt)}</span>
                    </div>
                  )}

                  {stats.allocated === 0 ? (
                    <div className="fx-empty">
                      <Tag size={24} className="text-[var(--fx-faint)]" />
                      <p className="text-[13.5px] font-semibold text-[var(--fx-ink)]">No stickers allocated yet</p>
                    </div>
                  ) : (
                    <div className="fx-card p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h2 className="text-[15px] font-bold text-[var(--fx-ink)]">Recent activations</h2>
                        <button onClick={() => selectTab('stickers')} className="text-[12.5px] font-semibold text-[var(--fx-accent)] hover:underline cursor-pointer">
                          View all
                        </button>
                      </div>
                      <FxTable<StickerRow>
                        dense
                        rows={data.stickers.filter((s) => s.status === 'active').slice(0, 5)}
                        rowKey={rowKeyOf}
                        emptyState="No activations yet"
                        columns={stickerColumns.filter((c) => c.key !== 'status' && c.key !== 'type')}
                      />
                    </div>
                  )}
                </>
              )}

              {activeTab === 'stickers' && (
                <div className="fx-card overflow-hidden">
                  <FxTable<StickerRow> rows={data.stickers} rowKey={rowKeyOf} emptyState="No stickers allocated yet" columns={stickerColumns} />
                </div>
              )}
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}

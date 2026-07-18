import { lazy, Suspense, useState, useEffect } from 'react';

const LandingPageMaster = lazy(() => import('./components/landing/LandingPageMaster'));
const QRFleetDashboard = lazy(() => import('./components/QRFleetDashboard'));
const ScanPage = lazy(() => import('./components/scan/ScanPage'));

function PageLoader() {
  return (
    <div className="min-h-screen bg-[var(--cream)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[var(--orange)] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold text-[var(--ink-soft)]">Loading...</span>
      </div>
    </div>
  );
}

function isScanUrl(): boolean {
  const path = window.location.pathname;
  const hash = window.location.hash;
  return /\/qr\//.test(path) || /#\/qr\//.test(hash);
}

export default function App() {
  const [page, setPage] = useState<'landing' | 'dashboard' | 'scan'>(() =>
    isScanUrl() ? 'scan' : 'landing'
  );

  useEffect(() => {
    const handler = () => {
      if (isScanUrl() && page !== 'scan') setPage('scan');
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [page]);

  if (page === 'scan') {
    return (
      <Suspense fallback={<PageLoader />}>
        <ScanPage onBack={() => { window.history.pushState({}, '', '/'); setPage('landing'); }} />
      </Suspense>
    );
  }

  if (page === 'dashboard') {
    return (
      <Suspense fallback={<PageLoader />}>
        <QRFleetDashboard onBack={() => setPage('landing')} />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <div className="min-h-screen bg-[var(--cream)] text-[var(--ink)]">
        <LandingPageMaster
          onStart={() => setPage('dashboard')}
          onLogin={() => setPage('dashboard')}
        />
      </div>
    </Suspense>
  );
}

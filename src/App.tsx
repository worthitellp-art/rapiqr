import { lazy, Suspense, useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthModal from './components/auth/AuthModal';

const LandingPageMaster = lazy(() => import('./components/landing/LandingPageMaster'));
const QRFleetDashboard = lazy(() => import('./components/QRFleetDashboard'));
const ScanPage = lazy(() => import('./components/scan/ScanPage'));

function PageLoader() {
  return (
    <div className="min-h-screen bg-[#FAFAFC] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#FF6500] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold text-[#64748B]">Loading...</span>
      </div>
    </div>
  );
}

/**
 * Universal QR Scan URL Detector:
 * Matches /QR-8A3F, /CL-CXTF2, /qr/8A3F, ?qr=8A3F, #/qr/8A3F on any mobile or desktop browser
 */
function isScanUrl(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname;
  const hash = window.location.hash;
  const search = window.location.search;

  const directQrMatch = path.match(/\/(QR-|CL-|qr-|cl-)[A-Z0-9_-]+/i);
  const legacyPathMatch = /\/qr\//i.test(path);
  const hashMatch = /#\/qr\//i.test(hash);
  const queryMatch = /\?qr=/i.test(search);

  return !!directQrMatch || legacyPathMatch || hashMatch || queryMatch;
}

function MainAppContent() {
  const { isLoggedIn, isAdmin, loading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  // Restore page from localStorage, but only non-scan pages
  const [page, setPage] = useState<'landing' | 'dashboard' | 'scan'>(() => {
    if (isScanUrl()) return 'scan';
    try {
      const saved = localStorage.getItem('namoqr-current-page');
      if (saved === 'dashboard') return 'dashboard';
    } catch { /* ignore */ }
    return 'landing';
  });

  // Persist page to localStorage whenever it changes
  const navigateTo = (next: 'landing' | 'dashboard' | 'scan') => {
    try {
      if (next === 'landing') localStorage.removeItem('namoqr-current-page');
      else localStorage.setItem('namoqr-current-page', next);
    } catch { /* ignore */ }
    setPage(next);
  };

  // After auth loads: if we think we're on dashboard but not logged in → send to landing
  // If logged in (admin) and on landing → restore to dashboard
  useEffect(() => {
    if (loading) return; // wait for Supabase session to resolve
    if (page === 'dashboard' && !isLoggedIn) {
      navigateTo('landing');
    }
  }, [loading, isLoggedIn]);

  useEffect(() => {
    const handler = () => {
      if (isScanUrl() && page !== 'scan') navigateTo('scan');
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [page]);

  const handleOpenAuth = (mode: 'login' | 'signup') => {
    if (isLoggedIn) {
      navigateTo('dashboard');
    } else {
      setAuthModalMode(mode);
      setAuthModalOpen(true);
    }
  };

  // While Supabase is resolving the session, show loader — prevents flash of landing page
  if (loading && page === 'dashboard') {
    return <PageLoader />;
  }

  if (page === 'scan') {
    return (
      <Suspense fallback={<PageLoader />}>
        <ScanPage onBack={() => { window.history.pushState({}, '', '/'); navigateTo('landing'); }} />
      </Suspense>
    );
  }

  if (page === 'dashboard') {
    return (
      <Suspense fallback={<PageLoader />}>
        <QRFleetDashboard onBack={() => navigateTo('landing')} />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <div className="min-h-screen bg-[#FAFAFC] text-[#0A0D14]">
        <LandingPageMaster
          onStart={() => handleOpenAuth('signup')}
          onLogin={() => handleOpenAuth('login')}
        />
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={() => navigateTo('dashboard')}
          initialMode={authModalMode}
        />
      </div>
    </Suspense>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}

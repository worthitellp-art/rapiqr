import { lazy, Suspense, useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthModal from './components/auth/AuthModal';
import AuthCallback from './pages/AuthCallback';

const LandingPageMaster = lazy(() => import('./components/landing/LandingPageMaster'));
const QRFleetDashboard = lazy(() => import('./components/dashboard/admin'));
const ClientDashboard = lazy(() => import('./components/ClientDashboard'));
const ScanPage = lazy(() => import('./components/scan/ScanPage'));
const DistributorDashboard = lazy(() => import('./components/dashboard/DistributorDashboard'));

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
 * Matches /QR-8A3F, /CL-CXTF2, /QR482KLM, /CL482KLM, /qr/8A3F, ?qr=8A3F, #/qr/8A3F on any mobile or desktop browser.
 * QR/CL IDs are generated without hyphens (e.g. QR482KLM) as well as legacy hyphenated IDs (QR-8A3F).
 */
function isScanUrl(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname;
  const hash = window.location.hash;
  const search = window.location.search;

  // Matches /QR... or /CL... with at least one following char (handles both QR482KLM and QR-8A3F)
  const directQrMatch = path.match(/\/(QR|CL)[A-Z0-9_-]+/i);
  const legacyPathMatch = /\/qr\//i.test(path);
  const hashMatch = /#\/qr\//i.test(hash);
  const queryMatch = /\?qr=/i.test(search);

  return !!directQrMatch || legacyPathMatch || hashMatch || queryMatch;
}

function MainAppContent() {
  const { isLoggedIn, isAdmin, loading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [dashboardMode, setDashboardMode] = useState<'admin' | 'client' | null>(null);

  // Restore page from localStorage, but only non-scan pages
  const [page, setPage] = useState<'landing' | 'dashboard' | 'scan' | 'distributor'>(() => {
    if (isScanUrl()) return 'scan';
    try {
      const saved = localStorage.getItem('namoqr-current-page');
      if (saved === 'dashboard') return 'dashboard';
      if (saved === 'distributor') return 'distributor';
    } catch { /* ignore */ }
    return 'landing';
  });

  // Persist page to localStorage whenever it changes
  const navigateTo = (next: 'landing' | 'dashboard' | 'scan' | 'distributor') => {
    try {
      if (next === 'landing') localStorage.removeItem('namoqr-current-page');
      else localStorage.setItem('namoqr-current-page', next);
    } catch { /* ignore */ }
    setPage(next);
  };

  // After auth loads: if we think we're on dashboard but not logged in → send to landing
  useEffect(() => {
    if (loading) return; // wait for Supabase session to resolve
    if ((page === 'dashboard' || page === 'distributor') && !isLoggedIn) {
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
  if (loading && (page === 'dashboard' || page === 'distributor')) {
    return <PageLoader />;
  }

  // OAuth / password-reset callback — exchange the code, then go to dashboard
  if (window.location.pathname.startsWith('/auth/callback')) {
    return <AuthCallback onSuccess={() => navigateTo('dashboard')} />;
  }

  if (page === 'scan') {
    return (
      <Suspense fallback={<PageLoader />}>
        <ScanPage onBack={() => { window.history.pushState({}, '', '/'); navigateTo('landing'); }} />
      </Suspense>
    );
  }

  if (page === 'dashboard') {
    const showAdmin = (dashboardMode === 'admin') || (dashboardMode !== 'client' && isAdmin);
    return (
      <Suspense fallback={<PageLoader />}>
        {showAdmin ? (
          <QRFleetDashboard
            onBack={() => navigateTo('landing')}
            switchToClientPortal={() => setDashboardMode('client')}
          />
        ) : (
          <ClientDashboard
            onBack={() => navigateTo('landing')}
            switchToAdminFleet={isAdmin ? () => setDashboardMode('admin') : undefined}
          />
        )}
      </Suspense>
    );
  }

  if (page === 'distributor') {
    return (
      <Suspense fallback={<PageLoader />}>
        <DistributorDashboard onBack={() => navigateTo('landing')} />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <div className="min-h-screen bg-[#FAFAFC] text-[#0A0D14]">
        <LandingPageMaster
          onStart={() => handleOpenAuth('signup')}
          onLogin={() => handleOpenAuth('login')}
          onOpenDistributorDashboard={() => navigateTo('distributor')}
        />
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={() => {
            // Check if there was a pending distributor application attempt before login
            const pendingIntent = localStorage.getItem('namoqr-pending-distributor-intent');
            if (pendingIntent) {
              // Stay on landing page, LandingPageMaster will auto-open the distributor modal
              setAuthModalOpen(false);
            } else {
              navigateTo('dashboard');
            }
          }}
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

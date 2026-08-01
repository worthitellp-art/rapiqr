import { lazy, Suspense, useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthModal from './components/auth/AuthModal';
import AdminAuthModal from './components/auth/AdminAuthModal';
import AuthCallback from './pages/AuthCallback';

const LandingPageMaster = lazy(() => import('./components/landing/LandingPageMaster'));
const CheckoutPage = lazy(() => import('./components/landing/CheckoutPage'));
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

  // Matches /QR..., /CL..., /NQ... with at least one char (handles QR482KLM, QR-8A3F, NQ-CAR-9081)
  const directQrMatch = path.match(/\/(QR|CL|NQ)[A-Z0-9_-]+/i);
  const legacyPathMatch = /\/(qr|activate|verify)(\/|$)/i.test(path);
  const hashMatch = /#\/(qr|activate|verify)/i.test(hash);
  const queryMatch = /\?(qr|sticker|code)=/i.test(search);

  return !!directQrMatch || legacyPathMatch || hashMatch || queryMatch;
}

/**
 * Secret Admin Fleet entry point: only reachable by visiting /admin (or #/admin) directly.
 * There is no visible link/button to this route anywhere in the app — admin access is
 * gated purely behind the dedicated AdminAuthModal (secret email + password).
 */
function isAdminUrl(): boolean {
  if (typeof window === 'undefined') return false;
  return /\/admin(\/|$)/i.test(window.location.pathname) || /#\/admin(\/|$)/i.test(window.location.hash);
}

function MainAppContent() {
  const { isLoggedIn, isAdmin, loading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [dashboardMode, setDashboardMode] = useState<'admin' | 'client' | null>(null);
  const [adminModalOpen, setAdminModalOpen] = useState(() => isAdminUrl());

  // Restore page from localStorage, but only non-scan pages
  const [page, setPage] = useState<'landing' | 'dashboard' | 'scan' | 'distributor' | 'checkout'>(() => {
    if (isScanUrl()) return 'scan';
    try {
      const saved = localStorage.getItem('namoqr-current-page');
      if (saved === 'dashboard') return 'dashboard';
      if (saved === 'distributor') return 'distributor';
      if (saved === 'checkout') return 'checkout';
    } catch { /* ignore */ }
    return 'landing';
  });

  // Persist page to localStorage whenever it changes
  const navigateTo = (next: 'landing' | 'dashboard' | 'scan' | 'distributor' | 'checkout') => {
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

  // Post-purchase one-click signup: open the signup modal pre-filled with the order email
  const [authPrefillEmail, setAuthPrefillEmail] = useState('');
  const handleOpenSignupWithEmail = (email: string) => {
    setAuthPrefillEmail(email);
    handleOpenAuth('signup');
  };

  // While Supabase is resolving the session, show loader — prevents flash of landing page
  if (loading && (page === 'dashboard' || page === 'distributor')) {
    return <PageLoader />;
  }

  // Secret Admin Fleet entry (/admin) — requires the dedicated admin email + password.
  // Normal sign in/sign up never lands here; this is the only path into the admin dashboard.
  if (adminModalOpen) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <AdminAuthModal
          isOpen={true}
          onClose={() => {
            setAdminModalOpen(false);
            window.history.replaceState({}, '', '/');
            navigateTo('landing');
          }}
          onSuccess={() => {
            setDashboardMode('admin');
            setAdminModalOpen(false);
            window.history.replaceState({}, '', '/');
            navigateTo('dashboard');
          }}
        />
      </div>
    );
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

  if (page === 'checkout') {
    return (
      <Suspense fallback={<PageLoader />}>
        <CheckoutPage
          onBack={() => navigateTo('landing')}
          onOpenSignup={handleOpenSignupWithEmail}
          onOpenLogin={() => handleOpenAuth('login')}
          onViewDashboard={() => navigateTo('dashboard')}
          onOrderComplete={() => {
            try { localStorage.removeItem('namoqr-cart'); } catch { /* ignore */ }
          }}
        />
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => { setAuthModalOpen(false); setAuthPrefillEmail(''); }}
          onSuccess={() => navigateTo('dashboard')}
          initialMode={authModalMode}
          prefillEmail={authPrefillEmail}
        />
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
          onOpenCheckout={() => navigateTo('checkout')}
        />
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => { setAuthModalOpen(false); setAuthPrefillEmail(''); }}
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
          prefillEmail={authPrefillEmail}
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

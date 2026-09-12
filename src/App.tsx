import { lazy, Suspense, useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminAuthModal from './components/auth/AdminAuthModal';
import AuthCallback from './pages/AuthCallback';

const LandingPageMaster = lazy(() => import('./components/landing/LandingPageMaster'));
const CheckoutPage = lazy(() => import('./components/landing/CheckoutPage'));
const JoinUsPage = lazy(() => import('./components/landing/JoinUsPage'));
const QRFleetDashboard = lazy(() => import('./components/dashboard/admin'));
const ClientDashboard = lazy(() => import('./components/ClientDashboard'));
const ScanPage = lazy(() => import('./components/scan/ScanPage'));
const DistributorDashboard = lazy(() => import('./components/dashboard/DistributorDashboard'));
const TrackOrderModal = lazy(() => import('./components/landing/TrackOrderModal'));
const AuthPage = lazy(() => import('./components/auth/AuthPage'));

export type AppPage =
  | 'landing'
  | 'dashboard'
  | 'scan'
  | 'distributor'
  | 'checkout'
  | 'join'
  | 'login'
  | 'register';

function PageLoader() {
  return (
    <div className="min-h-screen bg-[#FAFAFC] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#446FF2] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold text-[#64748B]">Loading...</span>
      </div>
    </div>
  );
}

/**
 * Universal QR Scan URL Detector:
 * Matches /QR805ERB, /QR-8A3F, /CL-CXTF2, /QR482KLM, /emergency/QR805ERB, ?qr=8A3F on any mobile or desktop browser.
 */
function isScanUrl(): boolean {
  if (typeof window === 'undefined') return false;
  const pathName = window.location.pathname;
  const hashString = window.location.hash;
  const searchString = window.location.search;

  const directQrMatch = pathName.match(/\/(QR|CL|NQ|EMERGENCY)[A-Z0-9_-]+/i);
  const legacyPathMatch = /\/(qr|activate|verify|emergency|scan)(\/|$)/i.test(pathName);
  const hashMatch = /#\/(qr|activate|verify|emergency|scan)/i.test(hashString);
  const queryMatch = /\?(qr|sticker|code|id)=/i.test(searchString);

  const isSingleSegmentQrPath =
    /^\/([A-Z0-9_-]{3,})$/i.test(pathName) &&
    !/^\/(admin|distributor|checkout|auth|callback|login|register|signup)$/i.test(pathName);

  return !!directQrMatch || legacyPathMatch || hashMatch || queryMatch || isSingleSegmentQrPath;
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

function getAuthUrlMode(): 'login' | 'register' | null {
  if (typeof window === 'undefined') return null;
  const pathName = window.location.pathname.toLowerCase();
  const hashString = window.location.hash.toLowerCase();
  if (pathName === '/login' || hashString === '#/login') return 'login';
  if (
    pathName === '/register' ||
    pathName === '/signup' ||
    hashString === '#/register' ||
    hashString === '#/signup'
  ) {
    return 'register';
  }
  return null;
}

function MainAppContent() {
  const { isLoggedIn, isAdmin, loading } = useAuth();
  const [dashboardMode, setDashboardMode] = useState<'admin' | null>(null);
  const [adminModalOpen, setAdminModalOpen] = useState(() => isAdminUrl());
  const [joinServiceType, setJoinServiceType] = useState<string | undefined>();
  const [authPrefillEmail, setAuthPrefillEmail] = useState('');

  // Track order modal state
  const [trackModalOpen, setTrackModalOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    const search = new URLSearchParams(window.location.search);
    return search.has('track') || window.location.hash.includes('track');
  });
  const [trackInitialOrderId, setTrackInitialOrderId] = useState(() => {
    if (typeof window === 'undefined') return '';
    const search = new URLSearchParams(window.location.search);
    return search.get('track') || '';
  });
  const [trackInitialContact, setTrackInitialContact] = useState('');

  const handleOpenTrackOrder = (orderId?: string, contact?: string) => {
    setTrackInitialOrderId(orderId || '');
    setTrackInitialContact(contact || '');
    setTrackModalOpen(true);
  };

  // Restore page from localStorage or URL
  const [page, setPage] = useState<AppPage>(() => {
    if (isScanUrl()) return 'scan';
    const authUrlMode = getAuthUrlMode();
    if (authUrlMode) return authUrlMode;
    try {
      const saved = localStorage.getItem('repiqr-current-page') || localStorage.getItem('namoqr-current-page');
      if (saved === 'dashboard') return 'dashboard';
      if (saved === 'distributor') return 'distributor';
      if (saved === 'checkout') return 'checkout';
      if (saved === 'join') return 'join';
      if (saved === 'login') return 'login';
      if (saved === 'register') return 'register';
    } catch { /* ignore */ }
    return 'landing';
  });

  // Persist page to localStorage whenever it changes
  const navigateTo = (next: AppPage) => {
    try {
      if (next === 'landing') {
        localStorage.removeItem('repiqr-current-page');
        localStorage.removeItem('namoqr-current-page');
        if (window.location.pathname !== '/' && !window.location.pathname.startsWith('/QR')) {
          window.history.pushState({}, '', '/');
        }
      } else if (next === 'login') {
        window.history.pushState({}, '', '/login');
      } else if (next === 'register') {
        window.history.pushState({}, '', '/register');
      } else {
        localStorage.setItem('repiqr-current-page', next);
        localStorage.setItem('namoqr-current-page', next);
      }
    } catch { /* ignore */ }
    setPage(next);
  };

  // After auth loads or on signout: if on dashboard/distributor but not logged in → send to landing & reset dashboardMode
  useEffect(() => {
    if (loading) return; // wait for the session restore to resolve
    if ((page === 'dashboard' || page === 'distributor') && !isLoggedIn) {
      setDashboardMode(null);
      navigateTo('landing');
    }
    if ((page === 'login' || page === 'register') && isLoggedIn) {
      navigateTo('dashboard');
    }
  }, [loading, isLoggedIn, page]);

  useEffect(() => {
    const handleUrlChange = () => {
      if (isScanUrl() && page !== 'scan') {
        navigateTo('scan');
      }
      if (isAdminUrl()) {
        if (isAdmin) {
          setDashboardMode('admin');
          setAdminModalOpen(false);
          window.history.replaceState({}, '', '/');
          navigateTo('dashboard');
        } else {
          setAdminModalOpen(true);
        }
      }
      const authUrlMode = getAuthUrlMode();
      if (authUrlMode && page !== authUrlMode) {
        setPage(authUrlMode);
      }
      const search = new URLSearchParams(window.location.search);
      if (search.has('track')) {
        setTrackInitialOrderId(search.get('track') || '');
        setTrackModalOpen(true);
      }
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, [page, isAdmin]);

  const handleOpenAuth = (mode: 'login' | 'signup') => {
    if (isLoggedIn) {
      navigateTo('dashboard');
    } else {
      navigateTo(mode === 'login' ? 'login' : 'register');
    }
  };

  // Post-purchase one-click signup: open the signup page pre-filled with the order email
  const handleOpenSignupWithEmail = (email: string) => {
    setAuthPrefillEmail(email);
    navigateTo('register');
  };

  // While the session is resolving, show loader — prevents flash of landing page
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

  // OAuth / password-reset callback — exchange the code/token, then navigate to dashboard
  const isAuthCallbackRoute =
    window.location.pathname.startsWith('/auth/callback') ||
    window.location.search.includes('code=') ||
    window.location.hash.includes('access_token=') ||
    window.location.search.includes('error=');

  if (isAuthCallbackRoute) {
    return <AuthCallback onSuccess={() => navigateTo('dashboard')} />;
  }

  if (page === 'scan') {
    return (
      <Suspense fallback={<PageLoader />}>
        <ScanPage
          onBack={() => { window.history.pushState({}, '', '/'); navigateTo('landing'); }}
          onGoToDashboard={() => { window.history.pushState({}, '', '/'); navigateTo('dashboard'); }}
        />
      </Suspense>
    );
  }

  if (page === 'dashboard') {
    // Only users with isAdmin === true are allowed to view the Fleet Admin Dashboard
    const showAdminPanel = isAdmin && dashboardMode !== 'client';
    return (
      <Suspense fallback={<PageLoader />}>
        {showAdminPanel ? (
          <QRFleetDashboard
            onBack={() => navigateTo('landing')}
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

  if (page === 'login' || page === 'register') {
    return (
      <Suspense fallback={<PageLoader />}>
        <AuthPage
          initialMode={page === 'register' ? 'signup' : 'login'}
          prefillEmail={authPrefillEmail}
          onBackHome={() => navigateTo('landing')}
          onSuccess={() => {
            setAuthPrefillEmail('');
            const pendingIntent = localStorage.getItem('namoqr-pending-distributor-intent');
            if (pendingIntent) {
              navigateTo('landing');
            } else {
              navigateTo('dashboard');
            }
          }}
        />
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
          onTrackOrder={(orderId, contact) => handleOpenTrackOrder(orderId, contact)}
          onOrderComplete={() => {
            try { localStorage.removeItem('namoqr-cart'); } catch { /* ignore */ }
          }}
        />
        <TrackOrderModal
          isOpen={trackModalOpen}
          onClose={() => setTrackModalOpen(false)}
          initialOrderId={trackInitialOrderId}
          initialContact={trackInitialContact}
          onOpenDashboard={() => {
            setTrackModalOpen(false);
            navigateTo('dashboard');
          }}
        />
      </Suspense>
    );
  }

  if (page === 'join') {
    return (
      <Suspense fallback={<PageLoader />}>
        <JoinUsPage onBack={() => navigateTo('landing')} initialServiceType={joinServiceType} />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <div className="min-h-screen bg-[#FAFAFC] text-[#0A0D14]">
        <LandingPageMaster
          onStart={() => navigateTo('checkout')}
          onLogin={() => handleOpenAuth('login')}
          onOpenDashboard={() => navigateTo('dashboard')}
          onOpenDistributorDashboard={() => navigateTo('distributor')}
          onOpenCheckout={() => navigateTo('checkout')}
          onOpenTrackOrder={() => handleOpenTrackOrder()}
          onOpenJoinUs={(serviceType) => {
            setJoinServiceType(serviceType);
            navigateTo('join');
          }}
        />
        <TrackOrderModal
          isOpen={trackModalOpen}
          onClose={() => setTrackModalOpen(false)}
          initialOrderId={trackInitialOrderId}
          initialContact={trackInitialContact}
          onOpenDashboard={() => {
            setTrackModalOpen(false);
            navigateTo('dashboard');
          }}
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

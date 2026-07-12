import { useState, useEffect, lazy, Suspense } from 'react';
import {
  INITIAL_USER,
  INITIAL_VEHICLES,
  INITIAL_QR_CODES,
  INITIAL_REPORTS
} from './data';
import { NamoProduct, QRCodeData, Report, UserProfile } from './types';

const LandingPageMaster = lazy(() => import('./components/landing/LandingPageMaster'));
const LoginPage = lazy(() => import('./components/auth/LoginPage'));
const RegisterPage = lazy(() => import('./components/auth/RegisterPage'));
const DashboardView = lazy(() => import('./components/DashboardView'));
const PublicScanPage = lazy(() => import('./components/PublicScanPage'));

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

export default function App() {
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('qr_user_profile');
    return saved ? JSON.parse(saved) : INITIAL_USER;
  });

  const [products, setProducts] = useState<NamoProduct[]>(() => {
    const saved = localStorage.getItem('qr_products');
    return saved ? JSON.parse(saved) : INITIAL_VEHICLES;
  });

  const [qrCodes, setQrCodes] = useState<QRCodeData[]>(() => {
    const saved = localStorage.getItem('qr_codes');
    return saved ? JSON.parse(saved) : INITIAL_QR_CODES;
  });

  const [reports, setReports] = useState<Report[]>(() => {
    const saved = localStorage.getItem('qr_reports');
    return saved ? JSON.parse(saved) : INITIAL_REPORTS;
  });

  const [currentRoute, setCurrentRoute] = useState<'landing' | 'login' | 'signup' | 'dashboard' | 'scan'>('landing');
  const [activeQrCodeId, setActiveQrCodeId] = useState<string>('');

  useEffect(() => { localStorage.setItem('qr_user_profile', JSON.stringify(user)); }, [user]);
  useEffect(() => { localStorage.setItem('qr_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('qr_codes', JSON.stringify(qrCodes)); }, [qrCodes]);
  useEffect(() => { localStorage.setItem('qr_reports', JSON.stringify(reports)); }, [reports]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || '';

      if (hash.startsWith('#/scan/')) {
        const parts = hash.split('/');
        const id = parts[2] || '';
        setActiveQrCodeId(id);
        setCurrentRoute('scan');
      } else if (hash === '#/login') {
        setCurrentRoute('login');
      } else if (hash === '#/signup') {
        setCurrentRoute('signup');
      } else if (hash === '#/dashboard') {
        if (user.isLoggedIn) {
          setCurrentRoute('dashboard');
        } else {
          window.location.hash = '#/login';
          setCurrentRoute('login');
        }
      } else {
        setCurrentRoute('landing');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [user.isLoggedIn]);

  const navigateTo = (hashRoute: string) => { window.location.hash = hashRoute; };

  const handleLoginSuccess = (profile: UserProfile) => {
    setUser(profile);
    navigateTo('#/dashboard');
  };

  const handleLogout = () => {
    setUser({ ...user, isLoggedIn: false });
    navigateTo('#/');
  };

  const handleAddNewReport = (newReportData: Omit<Report, 'id' | 'createdAt' | 'status'>) => {
    const nextReportId = `R-${Date.now().toString().slice(-4)}`;
    const freshReport: Report = {
      ...newReportData,
      id: nextReportId,
      status: 'unread',
      createdAt: new Date().toISOString(),
    };
    setReports((prev) => [freshReport, ...prev]);
    setQrCodes((prevQrs) =>
      prevQrs.map((q) => {
        if (q.vehicleId === newReportData.vehicleId || q.id === activeQrCodeId) {
          return { ...q, scansCount: q.scansCount + 1 };
        }
        return q;
      })
    );
    setProducts((prevProds) =>
      prevProds.map((p) => {
        if (p.id === newReportData.vehicleId || p.qrCodeId === activeQrCodeId) {
          return { ...p, scansCount: p.scansCount + 1, lastScannedAt: new Date().toISOString() };
        }
        return p;
      })
    );
  };

  const handleActivateSticker = (newProduct: NamoProduct, updatedQrCode: QRCodeData) => {
    setProducts((prev) => [newProduct, ...prev]);
    setQrCodes((prev) => prev.map((q) => q.id === updatedQrCode.id ? updatedQrCode : q));
  };

  return (
    <Suspense fallback={<PageLoader />}>
      <div className="min-h-screen bg-[var(--cream)] text-[var(--ink)]">
        {currentRoute === 'landing' && (
          <LandingPageMaster
            onStart={() => navigateTo(user.isLoggedIn ? '#/dashboard' : '#/signup')}
            onLogin={() => navigateTo('#/login')}
          />
        )}

        {currentRoute === 'login' && (
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onSwitchToSignup={() => navigateTo('#/signup')}
            onBack={() => navigateTo('#/')}
          />
        )}

        {currentRoute === 'signup' && (
          <RegisterPage
            onLoginSuccess={handleLoginSuccess}
            onSwitchToLogin={() => navigateTo('#/login')}
            onBack={() => navigateTo('#/')}
          />
        )}

        {currentRoute === 'dashboard' && (
          <DashboardView
            user={user}
            products={products}
            qrCodes={qrCodes}
            reports={reports}
            onLogout={handleLogout}
            onUpdateProducts={(updatedProds) => setProducts(updatedProds)}
            onUpdateQrCodes={(updatedQrs) => setQrCodes(updatedQrs)}
            onUpdateReports={(updatedReps) => setReports(updatedReps)}
            onUpdateUser={(updatedProf) => setUser(updatedProf)}
            onSimulatePublicScan={(qrId) => navigateTo(`#/scan/${qrId}`)}
          />
        )}

        {currentRoute === 'scan' && (
          <PublicScanPage
            qrCodeId={activeQrCodeId}
            products={products}
            qrCodes={qrCodes}
            onActivateSticker={handleActivateSticker}
            onSubmitReport={handleAddNewReport}
            onNavigateHome={() => navigateTo('#/')}
          />
        )}
      </div>
    </Suspense>
  );
}

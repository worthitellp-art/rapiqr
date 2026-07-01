/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  INITIAL_USER,
  INITIAL_VEHICLES,
  INITIAL_QR_CODES,
  INITIAL_REPORTS
} from './data';
import { NamoProduct, QRCodeData, Report, UserProfile } from './types';
import LandingPage from './components/LandingPage';
import LoginSignup from './components/LoginSignup';
import DashboardView from './components/DashboardView';
import PublicScanPage from './components/PublicScanPage';

export default function App() {
  // --- Persistent Storage State Synchronizers ---
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

  // Simple client-hash route state
  const [currentRoute, setCurrentRoute] = useState<'landing' | 'login' | 'signup' | 'dashboard' | 'scan'>('landing');
  const [activeQrCodeId, setActiveQrCodeId] = useState<string>('');

  // Write changes to localStorage on updates
  useEffect(() => {
    localStorage.setItem('qr_user_profile', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('qr_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('qr_codes', JSON.stringify(qrCodes));
  }, [qrCodes]);

  useEffect(() => {
    localStorage.setItem('qr_reports', JSON.stringify(reports));
  }, [reports]);

  // --- Client Hash Routing Hook ---
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
        // Authenticate route guard
        if (user.isLoggedIn) {
          setCurrentRoute('dashboard');
        } else {
          window.location.hash = '#/login';
          setCurrentRoute('login');
        }
      } else {
        // Default Landing Page
        setCurrentRoute('landing');
      }
    };

    // Parse hash on initial mounting
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [user.isLoggedIn]);

  // Helper route dispatchers
  const navigateTo = (hashRoute: string) => {
    window.location.hash = hashRoute;
  };

  // Log in user handler
  const handleLoginSuccess = (profile: UserProfile) => {
    setUser(profile);
    navigateTo('#/dashboard');
  };

  // Sign out handler
  const handleLogout = () => {
    const signedOut: UserProfile = {
      ...user,
      isLoggedIn: false,
    };
    setUser(signedOut);
    navigateTo('#/');
  };

  // Dynamic alert report creator submitted from scanned bystander
  const handleAddNewReport = (newReportData: Omit<Report, 'id' | 'createdAt' | 'status'>) => {
    const nextReportId = `R-${Date.now().toString().slice(-4)}`;
    const freshReport: Report = {
      ...newReportData,
      id: nextReportId,
      status: 'unread',
      createdAt: new Date().toISOString(),
    };

    // Append to reports
    setReports((prev) => [freshReport, ...prev]);

    // Increment scanCount on the scanned QR code
    setQrCodes((prevQrs) =>
      prevQrs.map((q) => {
        const matchFound = q.vehicleId === newReportData.vehicleId || q.id === activeQrCodeId;
        if (matchFound) {
          return { ...q, scansCount: q.scansCount + 1 };
        }
        return q;
      })
    );

    // Update scan counters on the associated product
    setProducts((prevProds) =>
      prevProds.map((p) => {
        const matchFound = p.id === newReportData.vehicleId || p.qrCodeId === activeQrCodeId;
        if (matchFound) {
          return {
            ...p,
            scansCount: p.scansCount + 1,
            lastScannedAt: new Date().toISOString()
          };
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
    <div className="bg-[#050508] min-h-screen text-white">
      {currentRoute === 'landing' && (
        <LandingPage
          onStart={() => navigateTo(user.isLoggedIn ? '#/dashboard' : '#/signup')}
          onLogin={() => navigateTo('#/login')}
          onSimulateScan={(qrId) => navigateTo(`#/scan/${qrId}`)}
        />
      )}

      {currentRoute === 'login' && (
        <LoginSignup
          isNewUser={false}
          onLoginSuccess={handleLoginSuccess}
          onBack={() => navigateTo('#/')}
        />
      )}

      {currentRoute === 'signup' && (
        <LoginSignup
          isNewUser={true}
          onLoginSuccess={handleLoginSuccess}
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
  );
}

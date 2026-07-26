import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  QrCode,
  Bell,
  Plus,
  ShieldCheck,
  Download,
  MapPin,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Car,
  Home,
  Briefcase,
  Key,
  HeartPulse,
  User,
  LogOut,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Search,
  Settings,
  ChevronRight
} from 'lucide-react';

interface ClientDashboardProps {
  onBack: () => void;
  switchToAdminFleet?: () => void;
}

export default function ClientDashboard({ onBack, switchToAdminFleet }: ClientDashboardProps) {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'stickers' | 'alerts' | 'register' | 'sos'>('stickers');

  // Client's items state (persisted in localStorage / Supabase)
  const [myStickers, setMyStickers] = useState<any[]>(() => {
    const saved = localStorage.getItem('namoqr-client-stickers');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'CL-CXTF2',
        name: "Mihir's Car",
        category: 'car',
        vehicleNumber: 'GJ01AB1234',
        ownerPhone: '+91 98162 31234',
        secondaryPhone: '+91 98765 43210',
        roadsidePhone: '1800-102-1234',
        status: 'active',
        scansCount: 3,
        createdAt: new Date().toISOString(),
        template: 'Default',
        fg: 'EAB308',
        bg: 'FFFFFF',
        details: { make: 'Tesla', model: 'Model 3', year: 2024 }
      },
      {
        id: 'QR-8A3F',
        name: 'Home Gate Tag',
        category: 'home',
        vehicleNumber: 'Apartment 4B',
        ownerPhone: '+91 98765 43210',
        status: 'active',
        scansCount: 1,
        createdAt: new Date().toISOString(),
        template: 'Default',
        fg: 'EAB308',
        bg: 'FFFFFF',
        details: { houseProfile: 'Green Glen Society, Gate 2' }
      }
    ];
  });

  // Client's emergency alerts state
  const [alerts, setAlerts] = useState<any[]>(() => {
    const saved = localStorage.getItem('namoqr-client-alerts');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'ALT-101',
        qrCodeId: 'CL-CXTF2',
        productLabel: "Mihir's Car (GJ01AB1234)",
        type: 'wrong_parking',
        message: 'Vehicle is blocking driveway entrance. Please move.',
        reporterPhone: '+91 98765 43210',
        location: { lat: 23.0225, lng: 72.5714 },
        status: 'unread',
        createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString()
      }
    ];
  });

  // Pending Admin Activations state
  const [pendingActivations, setPendingActivations] = useState<any[]>(() => {
    const saved = localStorage.getItem('namoqr-pending-activations');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'QR-0Z2A',
        activationCode: 'ACT-0Z2A',
        vehicleName: 'NamoQR Pro Sticker Tag',
        vehicleNumber: 'PENDING',
        status: 'pending_activation',
        createdAt: new Date().toISOString()
      }
    ];
  });

  // New Sticker Registration Form & Protection Layer
  const [newQrId, setNewQrId] = useState('');
  const [newActivationCode, setNewActivationCode] = useState('');
  const [activationError, setActivationError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newRegNumber, setNewRegNumber] = useState('');
  const [newCategory, setNewCategory] = useState('car');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // SOS Details
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [allergies, setAllergies] = useState('None');
  const [sosPhone, setSosPhone] = useState('+91 98980 12345');

  useEffect(() => {
    localStorage.setItem('namoqr-client-stickers', JSON.stringify(myStickers));
  }, [myStickers]);

  useEffect(() => {
    localStorage.setItem('namoqr-client-alerts', JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    localStorage.setItem('namoqr-pending-activations', JSON.stringify(pendingActivations));
  }, [pendingActivations]);

  useEffect(() => {
    const handleUpdate = () => {
      const saved = localStorage.getItem('namoqr-pending-activations');
      if (saved) setPendingActivations(JSON.parse(saved));
    };
    window.addEventListener('namoqr-pending-activations-updated', handleUpdate);
    return () => window.removeEventListener('namoqr-pending-activations-updated', handleUpdate);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleCopyLink = (qrId: string) => {
    const url = `${window.location.origin}/${qrId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(qrId);
    showToast('Direct scan link copied!');
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleRegisterSticker = (e: React.FormEvent) => {
    e.preventDefault();
    setActivationError(null);

    const cleanId = newQrId.trim().toUpperCase() || 'QR-0Z2A';
    const cleanCode = newActivationCode.trim().toUpperCase();

    // Protection Verification: Find expected activation code for this QR ID
    const pendingItem = pendingActivations.find(p => p.id.toUpperCase() === cleanId);
    const globalQrList = JSON.parse(localStorage.getItem('namoqr-qrlist') || '[]');
    const adminQrItem = globalQrList.find((q: any) => q.id.toUpperCase() === cleanId);

    const expectedCode = pendingItem?.activationCode || adminQrItem?.activationCode || `ACT-${cleanId.replace(/^QR-/, '')}`;

    // Protection Gate Check
    if (cleanCode && expectedCode && cleanCode !== expectedCode.toUpperCase() && !cleanCode.startsWith('ACT-')) {
      setActivationError(`Invalid Activation Code "${cleanCode}". Please enter the correct Security Activation Code provided by Admin or on your sticker package (Expected e.g. ${expectedCode}).`);
      return;
    }

    if (!cleanCode && (pendingItem || adminQrItem)) {
      setActivationError(`Protection Active: Security Activation Code is required to activate sticker ${cleanId}. Check your dashboard pending list above.`);
      return;
    }

    const newRecord = {
      id: cleanId,
      name: newName.trim() || pendingItem?.vehicleName || `My ${newCategory}`,
      category: newCategory,
      vehicleNumber: newRegNumber.trim() || pendingItem?.vehicleNumber || 'REG-ACTIVE',
      ownerPhone: newOwnerPhone.trim() || '+91 98162 31234',
      secondaryPhone: newSecondaryPhone.trim() || '',
      roadsidePhone: newRoadsidePhone.trim() || '',
      status: 'active',
      scansCount: 0,
      createdAt: new Date().toISOString(),
      activationCode: cleanCode || expectedCode,
      template: 'Default',
      fg: 'EAB308',
      bg: 'FFFFFF',
      details: {}
    };

    setMyStickers([newRecord, ...myStickers]);

    // Remove from pending activations
    const updatedPending = pendingActivations.filter(p => p.id.toUpperCase() !== cleanId);
    setPendingActivations(updatedPending);

    // Sync global QR list status & contact numbers to 'active'
    const updatedGlobal = globalQrList.map((q: any) => {
      if (q.id.toUpperCase() === cleanId) {
        return {
          ...q,
          status: 'active',
          vehicleName: newRecord.name,
          vehicleNumber: newRecord.vehicleNumber,
          ownerPhone: newRecord.ownerPhone,
          secondaryPhone: newRecord.secondaryPhone,
          roadsidePhone: newRecord.roadsidePhone,
        };
      }
      return q;
    });
    if (!updatedGlobal.some((q: any) => q.id.toUpperCase() === cleanId)) {
      updatedGlobal.unshift(newRecord);
    }
    localStorage.setItem('namoqr-qrlist', JSON.stringify(updatedGlobal));

    setNewQrId('');
    setNewActivationCode('');
    setNewName('');
    setNewRegNumber('');
    setNewOwnerPhone('');
    setNewSecondaryPhone('');
    setNewRoadsidePhone('');
    setActivationError(null);
    setActiveTab('stickers');
    showToast(`🔒 Protection Code Verified! Sticker ${cleanId} activated successfully.`);
  };

  const handleToggleAlertStatus = (alertId: string) => {
    setAlerts(prev =>
      prev.map(a => {
        if (a.id === alertId) {
          const nextStatus = a.status === 'unread' ? 'acknowledged' : a.status === 'acknowledged' ? 'resolved' : 'unread';
          return { ...a, status: nextStatus };
        }
        return a;
      })
    );
    showToast('Alert status updated');
  };

  const unreadAlertsCount = alerts.filter(a => a.status === 'unread').length;

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-gray-900 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <span className="font-black text-gray-900 text-2xl tracking-tight block" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Rapi<span className="text-orange-500">QR</span>
              </span>
              <span className="text-[11px] text-gray-400 font-medium">Customer Safety Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {switchToAdminFleet && (
              <button
                onClick={switchToAdminFleet}
                className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 px-3.5 py-2 rounded-full transition-colors"
              >
                <Settings size={14} /> Fleet Manager View
              </button>
            )}
            <div className="h-6 w-px bg-gray-200 hidden sm:block" />
            <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-100 rounded-full py-1.5 pl-3 pr-2">
              <div className="w-7 h-7 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">
                {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : 'M'}
              </div>
              <span className="text-xs font-semibold text-gray-800 max-w-[120px] truncate">
                {profile?.fullName || 'Mihir Rathod'}
              </span>
              <button
                onClick={signOut}
                title="Log Out"
                className="w-7 h-7 rounded-full bg-white shadow-2xs hover:bg-red-50 hover:text-red-500 text-gray-400 flex items-center justify-center transition-colors ml-1"
              >
                <LogOut size={13} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Protection Layer: Pending Activations Section */}
        {pendingActivations.length > 0 && (
          <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-200/90 rounded-3xl p-5 sm:p-6 shadow-xs animate-fade-in">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/20 flex-shrink-0">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-gray-900 text-base">Pending Security Activation Codes</h3>
                    <span className="bg-amber-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {pendingActivations.length} Pending
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Admin generated protective activation codes for your QR stickers. Use the activation code to activate your QR code.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5 w-full lg:w-auto">
                {pendingActivations.map((pending) => (
                  <div key={pending.id} className="bg-white border border-amber-200/90 rounded-2xl p-3 shadow-2xs flex items-center justify-between gap-3 w-full lg:w-auto">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 block">QR STICKER ID</span>
                      <span className="font-mono font-extrabold text-gray-900 text-xs">{pending.id}</span>
                    </div>
                    <div className="h-6 w-px bg-gray-100" />
                    <div>
                      <span className="text-[10px] font-bold text-amber-600 block">ACTIVATION CODE</span>
                      <span className="font-mono font-extrabold text-amber-900 text-xs bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        {pending.activationCode}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setNewQrId(pending.id);
                        setNewActivationCode(pending.activationCode);
                        setNewName(pending.vehicleName !== 'Unassigned QR Sticker' ? pending.vehicleName : '');
                        setActiveTab('register');
                        showToast(`Pre-filled activation code ${pending.activationCode}`);
                      }}
                      className="ml-auto bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition-colors flex items-center gap-1"
                    >
                      <ShieldCheck size={13} /> Activate
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* Banner Card */}
        <div 
          className="relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white shadow-xl"
          style={{ background: 'linear-gradient(135deg, #EAB308, #9A2C00)' }}
        >
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-white mb-3">
                <ShieldCheck size={14} /> Protected by RapiQR SOS Relay
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Welcome, {profile?.fullName || 'Mihir'}
              </h1>
              <p className="text-white/80 text-sm mt-1 max-w-lg">
                Manage your active safety stickers, view emergency pings, and update your SOS contacts.
              </p>
            </div>

            <button
              onClick={() => setActiveTab('register')}
              className="flex items-center gap-2 bg-white text-orange-600 hover:bg-orange-50 px-5 py-3 rounded-2xl font-bold text-sm shadow-md active:scale-95 transition-all flex-shrink-0"
            >
              <Plus size={18} /> Add New Sticker
            </button>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('stickers')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'stickers'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <QrCode size={16} /> My Stickers ({myStickers.length})
          </button>

          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap relative ${
              activeTab === 'alerts'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Bell size={16} /> Emergency Alerts
            {unreadAlertsCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('register')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'register'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Plus size={16} /> Register Sticker
          </button>

          <button
            onClick={() => setActiveTab('sos')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'sos'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <HeartPulse size={16} /> SOS Medical & Contacts
          </button>
        </div>

        {/* TAB 1: MY STICKERS */}
        {activeTab === 'stickers' && (
          <div className="space-y-6">
            {myStickers.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-2xs">
                <QrCode size={48} className="mx-auto text-gray-300 mb-3" />
                <h3 className="text-lg font-bold text-gray-800">No active safety stickers registered</h3>
                <p className="text-gray-400 text-sm max-w-sm mx-auto mt-1 mb-6">
                  Register your vehicle, home gate tag, or keychain to start receiving emergency pings.
                </p>
                <button
                  onClick={() => setActiveTab('register')}
                  className="inline-flex items-center gap-2 bg-orange-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm"
                >
                  <Plus size={16} /> Register First Sticker
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {myStickers.map((item) => (
                  <div key={item.id} className="bg-white rounded-3xl border border-gray-100 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between">
                    <div>
                      {/* Top status */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full uppercase">
                          <CheckCircle2 size={12} /> {item.status}
                        </span>
                        <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                          {item.id}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold flex-shrink-0">
                          {item.category === 'car' && <Car size={22} />}
                          {item.category === 'home' && <Home size={22} />}
                          {item.category === 'luggage' && <Briefcase size={22} />}
                          {item.category === 'keychain' && <Key size={22} />}
                          {item.category !== 'car' && item.category !== 'home' && item.category !== 'luggage' && item.category !== 'keychain' && <QrCode size={22} />}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-base">{item.name}</h3>
                          <p className="text-xs font-semibold text-gray-500">{item.vehicleNumber}</p>
                        </div>
                      </div>

                      {/* Scans counter */}
                      <div className="bg-gray-50 rounded-2xl p-3 flex items-center justify-between text-xs text-gray-500 my-4">
                        <span>Total Emergency Scans</span>
                        <span className="font-extrabold text-gray-900 text-sm">{item.scansCount}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
                      <button
                        onClick={() => handleCopyLink(item.id)}
                        className="flex-1 py-2 px-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        {copiedId === item.id ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        {copiedId === item.id ? 'Copied' : 'Copy Link'}
                      </button>
                      <button
                        onClick={() => window.open(`/${item.id}`, '_blank')}
                        className="py-2 px-3 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                      >
                        Preview <ExternalLink size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: EMERGENCY ALERTS */}
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800 text-lg">Received Scan Pings ({alerts.length})</h3>
              <span className="text-xs text-gray-400">Click alert to update status</span>
            </div>

            {alerts.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-gray-100">
                <Bell size={40} className="mx-auto text-gray-300 mb-3" />
                <h4 className="font-bold text-gray-700">No emergency alerts received</h4>
                <p className="text-xs text-gray-400 mt-1">When someone scans your sticker, alerts will appear here in real-time.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div 
                    key={alert.id} 
                    className={`bg-white rounded-3xl border p-5 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                      alert.status === 'unread' ? 'border-orange-200 shadow-sm bg-orange-50/20' : 'border-gray-100'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 font-bold ${
                        alert.status === 'unread' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <AlertTriangle size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-sm">{alert.productLabel}</span>
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
                            {alert.type.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 font-medium mt-1">"{alert.message}"</p>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
                          <span>{new Date(alert.createdAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</span>
                          {alert.reporterPhone && (
                            <span className="flex items-center gap-1 text-gray-600 font-semibold">
                              <Phone size={12} /> {alert.reporterPhone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                      {alert.location && (
                        <a
                          href={`https://www.google.com/maps?q=${alert.location.lat},${alert.location.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-xl transition-colors"
                        >
                          <MapPin size={13} /> GPS Location
                        </a>
                      )}

                      <button
                        onClick={() => handleToggleAlertStatus(alert.id)}
                        className={`text-xs font-bold px-3 py-2 rounded-xl border transition-colors ${
                          alert.status === 'unread'
                            ? 'bg-orange-50 border-orange-200 text-orange-600'
                            : alert.status === 'acknowledged'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                            : 'bg-gray-100 border-gray-200 text-gray-500'
                        }`}
                      >
                        {alert.status.toUpperCase()}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: REGISTER STICKER */}
        {activeTab === 'register' && (
          <div className="max-w-xl mx-auto bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Activate Protected RapiQR Sticker</h3>
                <p className="text-xs text-gray-400">Enter your QR Code ID and Security Activation Code to unlock your QR sticker</p>
              </div>
            </div>

            <form onSubmit={handleRegisterSticker} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Category *</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-orange-500 font-medium"
                >
                  <option value="car">Car / Vehicle Sticker</option>
                  <option value="bike">Bike / Motorcycle Tag</option>
                  <option value="home">Home Main Gate Tag</option>
                  <option value="luggage">Luggage / Travel Tag</option>
                  <option value="keychain">Keychain Medical SOS</option>
                  <option value="child">Child Bag Tag</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Sticker QR ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. QR-8A3F or QR-0Z2A"
                  value={newQrId}
                  onChange={(e) => setNewQrId(e.target.value)}
                  className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-orange-500 font-mono uppercase"
                />
              </div>

              {/* Protection Layer Activation Code Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-700">Security Activation Code *</label>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    Protection Layer Active
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. ACT-8A3F (Admin Code or Sticker Card)"
                    value={newActivationCode}
                    onChange={(e) => { setNewActivationCode(e.target.value); setActivationError(null); }}
                    className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-orange-500 font-mono uppercase pl-10"
                  />
                  <ShieldCheck size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-500" />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Generated in Admin when QR is created. Check dashboard pending section above or physical sticker package.
                </p>
              </div>

              {activationError && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2.5">
                  <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Security Protection Notice</p>
                    <p className="mt-0.5">{activationError}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Sticker / Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. My Tesla Model 3 or Main Apartment Gate"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Vehicle Number / House ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GJ01AB1234 or Flat 402"
                  value={newRegNumber}
                  onChange={(e) => setNewRegNumber(e.target.value)}
                  className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-orange-500 uppercase"
                />
              </div>

              {/* Admin / Owner Contact Numbers */}
              <div className="pt-2 border-t border-gray-100 space-y-3">
                <p className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Phone size={14} className="text-orange-500" /> Emergency Contact Numbers (Shown on Scan)
                </p>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Primary Owner Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 98162 31234"
                    value={newOwnerPhone}
                    onChange={(e) => setNewOwnerPhone(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-orange-500 font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Secondary Emergency Phone</label>
                    <input
                      type="tel"
                      placeholder="e.g. +91 98765 43210"
                      value={newSecondaryPhone}
                      onChange={(e) => setNewSecondaryPhone(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-orange-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Roadside Assistance Helpline</label>
                    <input
                      type="tel"
                      placeholder="e.g. 1800-102-1234"
                      value={newRoadsidePhone}
                      onChange={(e) => setNewRoadsidePhone(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-orange-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl font-bold text-white text-sm shadow-md transition-all active:scale-[0.99] mt-4 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #EAB308, #C2410C)' }}
              >
                <ShieldCheck size={18} /> Verify Code & Activate Sticker
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: SOS MEDICAL & CONTACTS */}
        {activeTab === 'sos' && (
          <div className="max-w-xl mx-auto bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
                <HeartPulse size={22} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Emergency SOS & Medical Notes</h3>
                <p className="text-xs text-gray-400">Information displayed when first responders scan your keychain</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Blood Group</label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-orange-500 font-medium"
                >
                  {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Emergency SOS Phone Number</label>
                <input
                  type="text"
                  value={sosPhone}
                  onChange={(e) => setSosPhone(e.target.value)}
                  className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-orange-500 font-semibold text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Known Allergies / Medical Conditions</label>
                <textarea
                  rows={3}
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="e.g. Diabetic, Allergic to Penicillin"
                  className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-orange-500"
                />
              </div>

              <button
                type="button"
                onClick={() => showToast('Emergency SOS details saved!')}
                className="w-full py-3.5 rounded-xl font-bold text-white text-sm shadow-md transition-all active:scale-[0.99]"
                style={{ background: 'linear-gradient(135deg, #EAB308, #C2410C)' }}
              >
                Save Emergency Medical Details
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl animate-fade-in flex items-center gap-2">
          <Sparkles size={14} className="text-amber-400" />
          {toast}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCategoryIcon, getCategoryLabel, STICKER_CATEGORIES } from '../stickerModules';
import {
  QrCode,
  Bell,
  Plus,
  ShieldCheck,
  User,
  LogOut,
  Sparkles,
  Check,
  X,
  Eye,
  Share2,
  Menu,
  Grid,
  History,
  BookOpen,
  Store,
  AlertTriangle,
  ShoppingBag,
  Trash2
} from 'lucide-react';

interface ClientDashboardProps {
  onBack: () => void;
  switchToDistributor?: () => void;
}

// Product descriptions keyed by the admin sticker category value.
const CATALOG_DESCRIPTIONS: Record<string, string> = {
  car: 'Wrong-parking alerts, crash SOS & masked calling for cars, autos & trucks.',
  bike: 'Rider safety with crash alerts & instant emergency contact sharing.',
  home: 'Courier arrival pings, visitor check-in & neighbour hazard alerts for home & office.',
  pet: 'Vet details & instant finder calling for your pets.',
  child: 'School-bag tracking, guardian alerts & pickup verification for kids.',
  luggage: 'Anonymous finder messaging & recovery support for your luggage.'
};

// Banner images keyed by the admin sticker category value.
const CATALOG_IMAGES: Record<string, string> = {
  car: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&q=80&w=400',
  bike: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=400',
  home: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=400',
  pet: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=400',
  child: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&q=80&w=400',
  luggage: 'https://images.unsplash.com/photo-1553531384-cc64ac80f931?auto=format&fit=crop&q=80&w=400'
};

// Product Catalog — driven by the same admin sticker categories. Purchases happen on the website.
const CATALOG_ITEMS = STICKER_CATEGORIES.map((cat) => ({
  category: cat.value,
  icon: getCategoryIcon(cat.value),
  name: `NamoQR ${cat.label} Sticker`,
  desc: CATALOG_DESCRIPTIONS[cat.value] || `${cat.label} sticker with instant scan-and-alert protection.`,
  price: 299,
  img: CATALOG_IMAGES[cat.value] || ''
}));

export default function ClientDashboard({ onBack }: ClientDashboardProps) {
  const { profile, signOut } = useAuth();

  // Load Google Fraunces Font dynamically for title rendering
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  // Active navigation view tab
  const [activeTab, setActiveTab] = useState<'overview' | 'activate' | 'catalog' | 'history'>('overview');

  // Mobile sidebar toggle
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Products State - NO MOCK DATA (Filters out any old mock items from storage)
  const [products, setProducts] = useState<any[]>(() => {
    const saved = localStorage.getItem('namoqr-client-stickers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((p: any) => 
            !['p1', 'p2', 'p3', 'p4', 'p5', 'p6'].includes(p.id) &&
            !['Mahindra Thar', 'Daily Activa', 'Main Gate · Flat 402', 'Samsonite Cabin Bag', "Father's Keychain", "Aryan's School Bag"].includes(p.nickname)
          );
        }
      } catch {
        return [];
      }
    }
    return [];
  });

  // Persist products to localStorage
  useEffect(() => {
    localStorage.setItem('namoqr-client-stickers', JSON.stringify(products));
  }, [products]);

  // Drawer & Toast State
  const [drawerProductId, setDrawerProductId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [notifBadgeVisible, setNotifBadgeVisible] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2800);
  };

  // Auto-sync real stickers by user's phone number on mount
  useEffect(() => {
    const userPhone = profile?.phoneNumber;
    if (userPhone) {
      syncStickersByPhone(userPhone);
    }
  }, [profile?.phoneNumber]);

  const syncStickersByPhone = (phoneNum: string) => {
    const cleanPhone = phoneNum.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 5) return;

    const globalQrList = JSON.parse(localStorage.getItem('namoqr-qrlist') || '[]');
    const pendingList = JSON.parse(localStorage.getItem('namoqr-pending-activations') || '[]');

    const matchedActive = globalQrList.filter((q: any) => {
      const qPhone = (q.ownerPhone || q.phone || q.details?.ownerPhone || '').replace(/\D/g, '');
      return qPhone && (qPhone.includes(cleanPhone) || cleanPhone.includes(qPhone));
    });

    const matchedPending = pendingList
      .filter((p: any) => {
        const pPhone = (p.ownerPhone || p.phone || '').replace(/\D/g, '');
        return pPhone && (pPhone.includes(cleanPhone) || cleanPhone.includes(pPhone));
      })
      .map((p: any) => ({
        ...p,
        nickname: p.nickname || p.vehicleName || `Sticker ${p.id}`,
        status: 'Active',
        ownerPhone: p.phone || p.ownerPhone || phoneNum
      }));

    const allMatched = [...matchedActive, ...matchedPending];

    if (allMatched.length > 0) {
      setProducts(prev => {
        const existingIds = new Set(prev.map(s => s.id));
        const newItems = allMatched.filter((m: any) => !existingIds.has(m.id));
        return [...newItems, ...prev];
      });
    }
  };

  // ─── ACTIVATION WIZARD STATE ───
  const [wizStep, setWizStep] = useState(1);
  const [wizCode, setWizCode] = useState('NQ-AUTO-8812');
  const [wizCategory, setWizCategory] = useState('car');
  const [wizContactName, setWizContactName] = useState(() => profile?.fullName || 'Karan Sharma');
  const [wizContactPhone, setWizContactPhone] = useState(() => profile?.phoneNumber || '+91 98765 43210');

  const handleAutoScanCode = () => {
    const codes = ['NQ-AUTO-8812', 'NQ-GATE-9051', 'NQ-KIDS-3392', 'NQ-LUGG-1188', 'NQ-BIKE-2900'];
    const rCode = codes[Math.floor(Math.random() * codes.length)];
    setWizCode(rCode);
    showToast(`Sticker QR authenticated!`);
  };

  const handleWizardNext = () => {
    if (wizStep === 1 && wizCode.trim().length < 4) {
      showToast('Please enter a valid product code');
      return;
    }
    if (wizStep < 4) {
      setWizStep(wizStep + 1);
    } else {
      const catLabel = getCategoryLabel(wizCategory as any) || 'Safety Sticker';
      const newProduct = {
        id: 'p' + Date.now(),
        code: wizCode.trim().toUpperCase(),
        category: wizCategory,
        nickname: `${catLabel} (${wizCode.trim().toUpperCase()})`,
        assigned: profile?.fullName ? `Self (${profile.fullName.split(' ')[0]})` : 'Self (Rahul)',
        status: 'Active',
        scans: 0,
        lastScan: 'Never scanned',
        ownerPhone: wizContactPhone || profile?.phoneNumber || '',
        meta: [['Registered', 'Just now']],
        docs: [],
        contacts: [[wizContactName || 'Karan Sharma', wizContactPhone || '+91 98765 43210']],
        timeline: [['success', 'Activation Success', 'Just now', 'Sticker activated and linked.']]
      };
      setProducts(prev => [newProduct, ...prev]);
      showToast(`${newProduct.nickname} activated successfully!`);
      setWizStep(1);
      setWizCode('NQ-AUTO-' + Math.floor(1000 + Math.random() * 9000));
      setActiveTab('overview');
    }
  };

  // ─── VERIFY & CONNECT CODE HANDLER ───
  const [verifyCodeInput, setVerifyCodeInput] = useState('');
  const [verifyPhoneInput, setVerifyPhoneInput] = useState(() => profile?.phoneNumber || '');
  const [verificationResult, setVerificationResult] = useState<{ success: boolean; msg: string } | null>(null);

  const handleVerifyAndConnectCode = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = verifyCodeInput.trim().toUpperCase();
    const cleanPhone = verifyPhoneInput.replace(/\D/g, '');

    if (!cleanCode && !cleanPhone) {
      setVerificationResult({ success: false, msg: 'Please enter an Activation Code or Phone Number to verify.' });
      return;
    }

    const globalQrList = JSON.parse(localStorage.getItem('namoqr-qrlist') || '[]');
    const pendingList = JSON.parse(localStorage.getItem('namoqr-pending-activations') || '[]');
    const allSystemRecords = [...globalQrList, ...pendingList, ...products];

    const matched = allSystemRecords.find((q: any) => {
      const qCode = (q.activationCode || q.id || q.code || '').trim().toUpperCase();
      const qPhone = (q.ownerPhone || q.phone || '').replace(/\D/g, '');
      const codeMatches = cleanCode && (qCode === cleanCode || qCode.includes(cleanCode));
      const phoneMatches = cleanPhone && qPhone && (qPhone.includes(cleanPhone) || cleanPhone.includes(qPhone));
      return codeMatches || phoneMatches;
    });

    if (matched) {
      const catLabel = getCategoryLabel((matched.category || 'car') as any) || 'Safety Sticker';
      const newConnectedItem = {
        id: matched.id || 'p' + Date.now(),
        code: matched.activationCode || matched.id || cleanCode || 'NQ-TAG-1001',
        category: matched.category || 'car',
        nickname: matched.nickname || matched.vehicleName || `${catLabel} (${matched.id || cleanCode})`,
        assigned: matched.ownerName || profile?.fullName || 'Self',
        status: 'Active',
        scans: matched.scans || 0,
        lastScan: matched.lastScan || 'Code Verified (True)',
        ownerPhone: verifyPhoneInput || matched.ownerPhone || '',
        meta: matched.meta || [['Verification', 'Valid Code (True)'], ['Phone', verifyPhoneInput || matched.ownerPhone || 'Linked']],
        docs: matched.docs || [],
        contacts: matched.contacts || [[profile?.fullName || 'Owner', verifyPhoneInput || '']],
        timeline: [['success', 'Code Verification Success', 'Just now', 'Activation code verified (True) and sticker assigned to dashboard.']]
      };

      setProducts(prev => {
        const exists = prev.some(p => p.id === newConnectedItem.id || p.code === newConnectedItem.code);
        if (exists) {
          return prev.map(p => (p.id === newConnectedItem.id || p.code === newConnectedItem.code) ? { ...p, status: 'Active' } : p);
        }
        return [newConnectedItem, ...prev];
      });

      setVerificationResult({
        success: true,
        msg: `✓ Code Verification True! Sticker ${newConnectedItem.code} activated and assigned to your dashboard.`
      });
      showToast(`Sticker ${newConnectedItem.code} verified (True) & assigned!`);
      setVerifyCodeInput('');
    } else {
      setVerificationResult({
        success: false,
        msg: `✗ Verification False: Activation Code "${cleanCode}" not found in database or phone match failed.`
      });
      showToast('Invalid Activation Code. Verification result: False.');
    }
  };

  // ─── CHANGE STATUS ───
  const handleChangeStatus = (id: string, newStatus: string) => {
    setProducts(prev =>
      prev.map(p => (p.id === id ? { ...p, status: newStatus } : p))
    );
    showToast(`Status updated to ${newStatus}`);
  };

  // ─── SHARE PROFILE ───
  const handleShareProfile = (code: string) => {
    const url = `${window.location.origin}/verify/${code}`;
    navigator.clipboard.writeText(url);
    showToast(`Safety link copied: ${url}`);
  };

  // ─── CLEAR HISTORY ───
  const handleClearHistory = () => {
    setProducts(prev => prev.map(p => ({ ...p, timeline: [] })));
    showToast('All security logs cleared');
  };

  // ─── DELETE STICKER ───
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    setProducts(prev => prev.filter(p => p.id !== deleteTarget.id));
    setDrawerProductId(null);
    showToast(`Sticker removed from dashboard`);
    setDeleteTarget(null);
  };

  const activeProduct = drawerProductId ? products.find(p => p.id === drawerProductId) : null;
  const activeCount = products.filter(p => p.status === 'Active').length;
  const totalScans = products.reduce((s, p) => s + (p.scans || 0), 0);
  const totalTimelineLogs = products.flatMap(p => (p.timeline || []).map(t => ({ ...t, nickname: p.nickname, code: p.code })));

  return (
    <div className="flex flex-col h-screen bg-[#F5F6FA] text-[#1A1D26] font-sans antialiased overflow-hidden">
      
      {/* ─── APP HEADER ─── */}
      <header className="h-[72px] flex-shrink-0 bg-white border-b border-[#E8ECF4] flex items-center justify-between px-6 sm:px-8 z-20">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="md:hidden w-9.5 h-9.5 rounded-xl bg-[#F5F6FA] border border-gray-200 flex items-center justify-center text-gray-700 cursor-pointer"
          >
            <Menu size={20} />
          </button>
          <div onClick={onBack} className="flex items-center gap-2 cursor-pointer font-extrabold text-xl tracking-tight">
            <div className="w-7 h-7 text-[#111111]">
              <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
                <rect x="2" y="2" width="11" height="11" rx="3" stroke="#111111" strokeWidth="3"/>
                <rect x="19" y="2" width="11" height="11" rx="3" stroke="#111111" strokeWidth="3"/>
                <rect x="2" y="19" width="11" height="11" rx="3" stroke="#111111" strokeWidth="3"/>
                <rect x="19" y="19" width="5" height="5" rx="1" fill="#111111"/>
                <rect x="26" y="26" width="4" height="4" rx="1" fill="#111111"/>
                <rect x="19" y="26" width="4" height="4" rx="1" fill="#111111"/>
                <rect x="26" y="19" width="4" height="4" rx="1" fill="#111111"/>
              </svg>
            </div>
            <span>Namo<span className="text-[#111111]">QR</span></span>
          </div>
        </div>

        <div className="flex items-center gap-3.5">
          <button
            onClick={onBack}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F5F6FA] border border-[#E8ECF4] text-xs font-bold text-[#1A1D26] hover:bg-[#E2E8F0] transition-colors cursor-pointer"
          >
            <Store size={15} /> Store
          </button>

          <div className="hidden sm:flex items-center gap-2 bg-[#DCFCE7] text-[#16A34A] px-3.5 py-1.5 rounded-full text-xs font-extrabold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16A34A] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#16A34A]"></span>
            </span>
            <span>{activeCount} Active Tags</span>
          </div>

          <button
            onClick={() => {
              setNotifBadgeVisible(false);
              showToast('2 new alerts — Wrong Parking, Courier Arrived');
            }}
            className="relative w-10 h-10 rounded-xl bg-[#F5F6FA] border border-[#E8ECF4] flex items-center justify-center text-[#1A1D26] hover:bg-[#E2E8F0] transition-colors cursor-pointer"
          >
            <Bell size={18} />
            {notifBadgeVisible && (
              <span className="absolute -top-1 -right-1 bg-[#111111] text-white text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center">
                2
              </span>
            )}
          </button>

          <div className="flex items-center gap-2.5 pl-3 border-l border-[#E8ECF4]">
            <img
              src={profile?.avatarUrl || "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80&w=100"}
              alt="User Avatar"
              className="w-9 h-9 rounded-full object-cover border-2 border-[#111111]"
            />
           
            <button onClick={signOut} title="Sign Out" className="text-gray-400 hover:text-red-600 transition-colors ml-1 cursor-pointer">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* ─── APP BODY LAYOUT ─── */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* ─── SIDEBAR ─── */}
        <aside className={`w-[236px] flex-shrink-0 bg-white border-r border-[#E8ECF4] flex flex-col justify-between p-5 z-30 transition-all duration-300 md:static fixed inset-y-0 left-0 ${
          isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}>
          <div className="space-y-4">
            <nav className="space-y-1">
              <button
                onClick={() => { setActiveTab('overview'); setIsMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'overview' ? 'bg-[#F1F5F9] text-[#111111]' : 'text-[#64748B] hover:bg-[#F1F5F9]'
                }`}
              >
                <Grid size={17} />
                <span>My Products</span>
              </button>

              <button
                onClick={() => { setActiveTab('activate'); setIsMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'activate' ? 'bg-[#F1F5F9] text-[#111111]' : 'text-[#64748B] hover:bg-[#F1F5F9]'
                }`}
              >
                <Plus size={17} />
                <span>Activate QR Tag</span>
              </button>

              <button
                onClick={() => { setActiveTab('catalog'); setIsMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'catalog' ? 'bg-[#F1F5F9] text-[#111111]' : 'text-[#64748B] hover:bg-[#F1F5F9]'
                }`}
              >
                <BookOpen size={17} />
                <span>Product Catalog</span>
              </button>

              <button
                onClick={() => { setActiveTab('history'); setIsMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'history' ? 'bg-[#F1F5F9] text-[#111111]' : 'text-[#64748B] hover:bg-[#F1F5F9]'
                }`}
              >
                <History size={17} />
                <span>Emergency History</span>
              </button>

            </nav>

            <button
              onClick={() => { setActiveTab('activate'); setIsMobileSidebarOpen(false); }}
              className="w-full flex items-center justify-center gap-2 bg-[#111111] hover:bg-black text-white font-bold text-xs py-3 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Plus size={15} /> Add New Sticker
            </button>

          </div>

          <div className="bg-[#DCFCE7] rounded-xl p-4 border border-emerald-200">
            <div className="text-[10px] font-black uppercase tracking-wider text-[#16A34A] mb-1">SYSTEM SECURE</div>
            <p className="text-[11px] text-[#166534] leading-relaxed">
              All NamoQR emergency calls &amp; scans are masked and 256-bit encrypted.
            </p>
          </div>
        </aside>

        {/* ─── MAIN CONTENT VIEW PANEL ─── */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-9 space-y-6">

          {/* ════ VIEW 1: MY PRODUCTS / OVERVIEW ════ */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1D26]">
                    Welcome back, {profile?.fullName ? profile.fullName.split(' ')[0] : 'Rahul'}.
                  </h1>
                  <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                    Here's what's happening across your family's safety network.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('activate')}
                  className="bg-[#111111] hover:bg-black text-white font-extrabold text-xs px-5 py-3 rounded-full shadow-lg transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <Plus size={16} /> Active Sticker
                </button>
              </div>
              {/* Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-[#E8ECF4] rounded-2xl p-5 shadow-2xs flex flex-col gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#F1F5F9] text-[#111111] flex items-center justify-center font-bold">
                    <ShieldCheck size={18} />
                  </div>
                  <div className="text-2xl font-bold text-[#1A1D26]">{activeCount}</div>
                  <div className="text-xs font-semibold text-[#64748B]">Active Tags</div>
                </div>

                <div className="bg-white border border-[#E8ECF4] rounded-2xl p-5 shadow-2xs flex flex-col gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center font-bold">
                    <Eye size={18} />
                  </div>
                  <div className="text-2xl font-bold text-[#1A1D26]">{totalScans}</div>
                  <div className="text-xs font-semibold text-[#64748B]">Total Scans Received</div>
                </div>

                <div className="bg-white border border-[#E8ECF4] rounded-2xl p-5 shadow-2xs flex flex-col gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center font-bold">
                    <AlertTriangle size={18} />
                  </div>
                  <div className="text-2xl font-bold text-[#1A1D26]">{totalTimelineLogs.filter(t => t[0] === 'alert').length}</div>
                  <div className="text-xs font-semibold text-[#64748B]">Alerts Recorded</div>
                </div>

                <div className="bg-white border border-[#E8ECF4] rounded-2xl p-5 shadow-2xs flex flex-col gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center font-bold">
                    <User size={18} />
                  </div>
                  <div className="text-2xl font-bold text-[#1A1D26]">{products.length}</div>
                  <div className="text-xs font-semibold text-[#64748B]">Total Connected Tags</div>
                </div>
              </div>

              {/* Product Grid OR Clean Empty State */}
              {products.length === 0 ? (
                <div className="bg-white border border-[#E8ECF4] rounded-3xl p-12 text-center space-y-4 shadow-sm">
                  <div className="w-16 h-16 rounded-full bg-[#F1F5F9] flex items-center justify-center mx-auto text-3xl">🛡️</div>
                  <h3 className="text-xl font-bold text-[#1A1D26]">No QR Tags Connected Yet</h3>
                  <p className="text-xs sm:text-sm text-[#64748B] max-w-md mx-auto">
                    You haven't activated any NamoQR tags yet. Activate a tag from the sidebar or buy safety stickers on our website.
                  </p>
                  <div className="flex justify-center gap-3 pt-2">
                    <button
                      onClick={() => setActiveTab('activate')}
                      className="bg-[#111111] hover:bg-black text-white text-xs font-bold px-5 py-3 rounded-full cursor-pointer"
                    >
                      Activate Tag
                    </button>
                    <button
                      onClick={onBack}
                      className="bg-[#111111] hover:bg-black text-white text-xs font-bold px-5 py-3 rounded-full shadow-md cursor-pointer"
                    >
                      Buy on Website
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {products.map(p => (
                    <div
                      key={p.id}
                      className="bg-white border border-[#E8ECF4] rounded-2xl p-5 shadow-2xs hover:shadow-lg hover:-translate-y-1 transition-all relative overflow-hidden flex flex-col justify-between"
                    >
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#111111] to-[#3B3B3B]" />
                      <div className="absolute top-0 right-0 w-6.5 h-6.5 bg-[#F5F6FA] rounded-bl-xl" />
                      
                      <div>
                        {/* Top Header */}
                        <div className="flex items-start justify-between gap-2 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10.5 h-10.5 rounded-xl bg-[#F1F5F9] flex items-center justify-center text-xl flex-shrink-0">
                              {getCategoryIcon(p.category as any) || '🏷️'}
                            </div>
                            <div>
                              <h3 className="font-bold text-base text-[#1A1D26] leading-tight">{p.nickname}</h3>
                              <p className="text-[11px] font-semibold text-[#94A3B8]">{getCategoryLabel(p.category as any) || p.code}</p>
                            </div>
                          </div>

                          <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                            p.status === 'Active' ? 'bg-[#DCFCE7] text-[#16A34A]' :
                            p.status === 'Suspended' ? 'bg-[#FEF3C7] text-[#B45309]' :
                            'bg-[#FEE2E2] text-[#DC2626]'
                          }`}>
                            {p.status}
                          </span>
                        </div>

                        {/* Meta List */}
                        <div className="space-y-1.5 my-3 text-xs border-y border-dashed border-[#E8ECF4] py-2.5">
                          {p.meta?.map((m: any, idx: number) => (
                            <div key={idx} className="flex justify-between">
                              <span className="text-[#94A3B8]">{m[0]}</span>
                              <span className="font-semibold text-[#1A1D26]">{m[1]}</span>
                            </div>
                          ))}
                          <div className="flex justify-between">
                            <span className="text-[#94A3B8]">Total Scans</span>
                            <span className="font-semibold text-[#1A1D26]">{p.scans || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#94A3B8]">Last Scan</span>
                            <span className="font-semibold text-[#1A1D26]">{p.lastScan || 'Never'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="pt-3 border-t border-[#E8ECF4] flex items-center gap-2">
                        <button
                          onClick={() => setDrawerProductId(p.id)}
                          className="flex-1 py-2.5 rounded-xl bg-[#111111] hover:bg-black text-xs font-bold text-white transition-colors cursor-pointer"
                        >
                          Manage Tag
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          title="Delete sticker"
                          className="w-10 h-10 rounded-xl bg-[#FEE2E2] text-[#DC2626] hover:bg-[#FECACA] flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ════ VIEW 2: ACTIVATION WIZARD ════ */}
          {activeTab === 'activate' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1D26]">Activate a New Sticker</h1>
                <p className="text-xs sm:text-sm text-[#64748B] mt-1">Register your physical NamoQR product in under a minute.</p>
              </div>

              <div className="bg-white border border-[#E8ECF4] rounded-3xl min-h-[500px] flex flex-col md:flex-row overflow-hidden shadow-sm">
                {/* Wizard Steps Sidebar */}
                <div className="w-full md:w-60 bg-[#F5F6FA] border-b md:border-b-0 md:border-r border-[#E8ECF4] p-6 flex-shrink-0">
                  <div className="space-y-5">
                    {[
                      { num: 1, title: 'Scan Code', desc: 'Enter or scan sticker' },
                      { num: 2, title: 'Category', desc: 'Pick product type' },
                      { num: 3, title: 'Contacts', desc: 'Emergency triggers' },
                      { num: 4, title: 'Done', desc: 'Tag is now active' }
                    ].map(st => (
                      <div
                        key={st.num}
                        className={`flex items-center gap-3 transition-opacity ${
                          wizStep === st.num ? 'opacity-100' : wizStep > st.num ? 'opacity-90' : 'opacity-40'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          wizStep === st.num ? 'bg-[#111111] border-[#111111] text-white' :
                          wizStep > st.num ? 'bg-[#16A34A] border-[#16A34A] text-white' :
                          'bg-white border-[#E8ECF4] text-[#1A1D26]'
                        }`}>
                          {wizStep > st.num ? <Check size={14} /> : st.num}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#1A1D26]">{st.title}</div>
                          <div className="text-[10px] text-[#94A3B8]">{st.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Wizard Main Section */}
                <div className="flex-1 p-6 sm:p-9 flex flex-col justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-[#1A1D26]">Product Activation</h2>
                    <p className="text-xs text-[#64748B] mt-0.5">Step {wizStep} of 4</p>
                  </div>

                  <div className="my-6">
                    {/* Pane 1: Scan Code */}
                    {wizStep === 1 && (
                      <div className="space-y-4 max-w-md mx-auto text-center">
                        <div className="w-40 h-40 border-2 border-dashed border-[#111111] rounded-2xl mx-auto flex items-center justify-center relative overflow-hidden bg-[#F1F5F9]">
                          <div className="absolute inset-x-0 h-0.5 bg-[#111111] animate-pulse top-1/2" />
                          <QrCode size={70} className="text-[#1A1D26] opacity-75" />
                        </div>
                        <p className="text-xs text-[#64748B]">Scan the sticker's QR, or enter its code manually.</p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={wizCode}
                            onChange={e => setWizCode(e.target.value.toUpperCase())}
                            placeholder="e.g. NQ-CAR-9081"
                            className="flex-1 px-4 py-3 text-sm bg-[#F5F6FA] border border-[#E8ECF4] rounded-xl outline-none focus:border-[#111111] font-mono font-bold uppercase"
                          />
                          <button
                            type="button"
                            onClick={handleAutoScanCode}
                            className="px-4 py-3 rounded-xl bg-[#F5F6FA] border border-[#E8ECF4] text-xs font-bold text-[#1A1D26] hover:bg-[#E2E8F0] cursor-pointer"
                          >
                            Auto-Scan
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Pane 2: Category Pick */}
                    {wizStep === 2 && (
                      <div className="space-y-3">
                        <h3 className="text-base font-bold text-[#1A1D26]">Select physical product type</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {[
                            { v: 'car', icon: '🚗', name: 'Car Sticker' },
                            { v: 'bike', icon: '🏍️', name: 'Bike Sticker' },
                            { v: 'home', icon: '🏡', name: 'Home Gate' },
                            { v: 'luggage', icon: '🧳', name: 'Luggage Tag' },
                            { v: 'keychain', icon: '🔑', name: 'SOS Keychain' },
                            { v: 'child', icon: '🎒', name: 'School Bag' }
                          ].map(cat => (
                            <div
                              key={cat.v}
                              onClick={() => setWizCategory(cat.v)}
                              className={`p-4 rounded-xl border-2 text-center cursor-pointer transition-all ${
                                wizCategory === cat.v ? 'border-[#111111] bg-[#F1F5F9]' : 'border-[#E8ECF4] bg-white'
                              }`}
                            >
                              <div className="text-3xl mb-2">{cat.icon}</div>
                              <div className="text-xs font-bold text-[#1A1D26]">{cat.name}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pane 3: Contacts & Triggers */}
                    {wizStep === 3 && (
                      <div className="space-y-4 max-w-md mx-auto">
                        <h3 className="text-base font-bold text-[#1A1D26]">Configure SOS &amp; alert settings</h3>
                        <div>
                          <label className="block text-xs font-bold text-[#64748B] mb-1">Primary Emergency Contact Name</label>
                          <input
                            type="text"
                            value={wizContactName}
                            onChange={e => setWizContactName(e.target.value)}
                            className="w-full px-3.5 py-2.5 text-sm bg-[#F5F6FA] border border-[#E8ECF4] rounded-xl outline-none focus:border-[#111111]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#64748B] mb-1">Phone Number</label>
                          <input
                            type="tel"
                            value={wizContactPhone}
                            onChange={e => setWizContactPhone(e.target.value)}
                            className="w-full px-3.5 py-2.5 text-sm bg-[#F5F6FA] border border-[#E8ECF4] rounded-xl outline-none focus:border-[#111111] font-mono"
                          />
                        </div>
                        <div className="space-y-2 pt-2 text-xs font-semibold text-[#1A1D26]">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" defaultChecked className="accent-[#111111] w-4 h-4" /> Notify via WhatsApp
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" defaultChecked className="accent-[#111111] w-4 h-4" /> Masked emergency call (IVR)
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" defaultChecked className="accent-[#111111] w-4 h-4" /> SMS alert with GPS coordinates
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Pane 4: Done */}
                    {wizStep === 4 && (
                      <div className="text-center space-y-3 py-6">
                        <div className="w-14 h-14 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center mx-auto">
                          <Check size={28} />
                        </div>
                        <h2 className="text-2xl font-bold text-[#1A1D26]">Tag Successfully Activated!</h2>
                        <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                          Your sticker is now live and visible on your dashboard.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Wizard Footer Controls */}
                  <div className="flex justify-between pt-4 border-t border-[#E8ECF4]">
                    <button
                      onClick={() => wizStep > 1 && setWizStep(wizStep - 1)}
                      disabled={wizStep === 1}
                      className="px-5 py-2.5 rounded-full bg-[#F5F6FA] text-xs font-bold text-[#1A1D26] disabled:opacity-40 cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleWizardNext}
                      className="px-6 py-2.5 rounded-full bg-[#111111] hover:bg-black text-white text-xs font-bold shadow-md cursor-pointer"
                    >
                      {wizStep === 4 ? 'Go to Dashboard' : wizStep === 3 ? 'Activate Tag' : 'Next Step'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════ VIEW 3: PRODUCT CATALOG ════ */}
          {activeTab === 'catalog' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#F1F5F9] text-[#111111] px-2.5 py-1 rounded-full">
                      Safety Tag Collection
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1D26]">Product Catalog</h1>
                  <p className="text-xs sm:text-sm text-[#64748B] mt-1">Browse the NamoQR safety tag range. Purchase is handled securely on our website.</p>
                </div>
                <button
                  onClick={onBack}
                  className="flex items-center gap-2 bg-[#111111] hover:bg-black text-white font-bold text-xs px-5 py-3 rounded-full shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <ShoppingBag size={15} /> Buy on Website
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {CATALOG_ITEMS.map((item, idx) => (
                  <div key={idx} className="group bg-white border border-[#E8ECF4] rounded-2xl overflow-hidden shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col">
                    <div className="relative h-36 bg-gradient-to-br from-[#F1F5F9] to-[#F1F5F9] flex items-center justify-center">
                      {item.img ? (
                        <img src={item.img} alt={item.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      ) : (
                        <span className="text-4xl">{item.icon}</span>
                      )}
                      <div className="absolute top-3 right-3 text-[9.5px] font-extrabold uppercase bg-[#111111] text-white px-2.5 py-1 rounded-full shadow">
                        New
                      </div>
                    </div>
                    <div className="p-5 flex flex-col justify-between flex-1 space-y-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{item.icon}</span>
                          <h4 className="font-bold text-base text-[#1A1D26]">{item.name}</h4>
                        </div>
                        <p className="text-xs text-[#64748B] leading-relaxed">{item.desc}</p>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-dashed border-[#E8ECF4]">
                        <span className="text-lg font-extrabold text-[#1A1D26]">₹{item.price}</span>
                        <button
                          onClick={onBack}
                          className="px-4 py-2.5 rounded-xl bg-[#111111] hover:bg-black text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                        >
                          <ShoppingBag size={14} /> Buy on Website
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════ VIEW 4: EMERGENCY HISTORY TIMELINE ════ */}
          {activeTab === 'history' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1D26]">Emergency &amp; Activity History</h1>
                  <p className="text-xs sm:text-sm text-[#64748B] mt-1">Every scan and alert, across all your tags.</p>
                </div>
                <button
                  onClick={handleClearHistory}
                  className="px-4 py-2 rounded-full bg-[#F5F6FA] border border-[#E8ECF4] text-xs font-bold text-[#1A1D26] hover:bg-[#E2E8F0] cursor-pointer"
                >
                  Clear All Logs
                </button>
              </div>

              <div className="bg-white border border-[#E8ECF4] rounded-3xl p-6 sm:p-8 max-w-3xl space-y-6 shadow-sm">
                {totalTimelineLogs.length === 0 ? (
                  <div className="text-center py-12 space-y-2">
                    <div className="text-4xl mb-2">🛡️</div>
                    <h3 className="font-bold text-lg text-[#1A1D26]">All clear</h3>
                    <p className="text-xs text-[#64748B] max-w-xs mx-auto">No security logs recorded yet. Your family's network is quiet.</p>
                  </div>
                ) : (
                  totalTimelineLogs.map((log: any, i: number) => (
                    <div key={i} className="flex gap-4 relative pb-6 last:pb-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 z-10 ${
                        log[0] === 'alert' ? 'bg-[#FEE2E2] text-[#DC2626]' :
                        log[0] === 'success' ? 'bg-[#DCFCE7] text-[#16A34A]' :
                        'bg-[#DBEAFE] text-[#2563EB]'
                      }`}>
                        {log[0] === 'alert' ? '⚠️' : log[0] === 'success' ? '🛡️' : '🔍'}
                      </div>
                      <div className="flex-1 bg-[#F5F6FA] rounded-xl p-3.5 border border-[#E8ECF4]">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-xs text-[#1A1D26]">{log.nickname} — {log[1]}</span>
                          <span className="text-[10px] text-[#94A3B8]">{log[2]}</span>
                        </div>
                        <p className="text-xs text-[#64748B]">{log[3]} <span className="font-mono text-[10px] text-[#94A3B8]">[{log.code}]</span></p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ─── SLIDE-OVER DRAWER ─── */}
      <div
        className={`fixed inset-0 bg-[#111111]/40 z-40 transition-opacity duration-300 ${
          activeProduct ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setDrawerProductId(null)}
      />

      <aside className={`fixed top-0 right-0 bottom-0 w-[440px] max-w-[92vw] bg-[#F5F6FA] z-50 shadow-2xl transition-transform duration-300 ease-out flex flex-col ${
        activeProduct ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {activeProduct && (
          <>
            <div className="flex justify-between items-center px-6 py-5 border-b border-[#E8ECF4] bg-white">
              <h3 className="font-bold text-lg text-[#1A1D26]">{activeProduct.nickname}</h3>
              <button onClick={() => setDrawerProductId(null)} className="w-8 h-8 rounded-full bg-[#F5F6FA] flex items-center justify-center text-gray-500 hover:text-gray-900 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* QR Box */}
              <div className="bg-white border border-[#E8ECF4] rounded-2xl p-5 text-center space-y-3">
                <div className="w-32 h-32 bg-white border border-[#E8ECF4] rounded-2xl p-2 mx-auto shadow-inner flex items-center justify-center">
                  <svg viewBox="0 0 120 120" className="w-full h-full">
                    <rect x="5" y="5" width="26" height="26" rx="4" fill="none" stroke="#201C15" strokeWidth="6"/>
                    <rect x="11" y="11" width="14" height="14" rx="2" fill="#201C15"/>
                    <rect x="89" y="5" width="26" height="26" rx="4" fill="none" stroke="#201C15" strokeWidth="6"/>
                    <rect x="95" y="11" width="14" height="14" rx="2" fill="#201C15"/>
                    <rect x="5" y="89" width="26" height="26" rx="4" fill="none" stroke="#201C15" strokeWidth="6"/>
                    <rect x="11" y="95" width="14" height="14" rx="2" fill="#201C15"/>
                    <rect x="42" y="10" width="8" height="8" fill="#201C15"/>
                    <rect x="62" y="15" width="12" height="6" fill="#201C15"/>
                    <rect x="36" y="44" width="48" height="32" rx="6" fill="#111111"/>
                    <text x="60" y="64" fill="#fff" fontFamily="Inter" fontSize="9" fontWeight="800" textAnchor="middle">NamoQR</text>
                  </svg>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleShareProfile(activeProduct.code)}
                    className="flex-1 py-2 rounded-xl bg-[#111111] hover:bg-black text-xs font-bold text-white cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Share2 size={12} /> Share Profile
                  </button>
                  <button
                    onClick={() => { setDrawerProductId(null); onBack(); }}
                    className="flex-1 py-2 rounded-xl bg-[#F5F6FA] border border-[#E8ECF4] text-xs font-bold text-[#1A1D26] hover:bg-[#E2E8F0] cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <ShoppingBag size={12} /> Buy More
                  </button>
                </div>
              </div>

              {/* Stat Grid */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-white border border-[#E8ECF4] rounded-xl p-3">
                  <span className="text-xl font-bold block text-[#1A1D26]">{activeProduct.scans || 0}</span>
                  <span className="text-[10px] font-bold text-[#64748B]">Total Scans</span>
                </div>
                <div className="bg-white border border-[#E8ECF4] rounded-xl p-3">
                  <span className="text-xl font-bold block text-[#1A1D26]">{activeProduct.status === 'Active' ? '95%' : '0%'}</span>
                  <span className="text-[10px] font-bold text-[#64748B]">Readiness</span>
                </div>
              </div>

              {/* Documents Card */}
              {activeProduct.docs && activeProduct.docs.length > 0 && (
                <div className="bg-white border border-[#E8ECF4] rounded-2xl p-4 space-y-2">
                  <h4 className="font-bold text-xs text-[#1A1D26]">Documents</h4>
                  {activeProduct.docs.map((d: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-xs py-1 border-b border-dashed border-[#E8ECF4] last:border-0">
                      <span className="font-semibold text-[#1A1D26]">{d[0]}</span>
                      <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        d[1] === 'valid' ? 'bg-[#DCFCE7] text-[#16A34A]' :
                        d[1] === 'soon' ? 'bg-[#FEF3C7] text-[#B45309]' :
                        'bg-[#FEE2E2] text-[#DC2626]'
                      }`}>
                        {d[1] === 'valid' ? 'Valid' : d[1] === 'soon' ? 'Expiring Soon' : 'Expired'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Emergency Contacts Card */}
              <div className="bg-white border border-[#E8ECF4] rounded-2xl p-4 space-y-2">
                <h4 className="font-bold text-xs text-[#1A1D26]">Emergency Contacts</h4>
                {activeProduct.contacts?.map((c: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="font-bold text-[#1A1D26]">{c[0]}</span>
                    <span className="font-mono text-[#64748B]">{c[1]}</span>
                  </div>
                ))}
              </div>

              {/* Status Control */}
              <div className="bg-white border border-[#E8ECF4] rounded-2xl p-4 space-y-2">
                <h4 className="font-bold text-xs text-[#1A1D26]">Status Control</h4>
                <select
                  value={activeProduct.status}
                  onChange={e => handleChangeStatus(activeProduct.id, e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#F5F6FA] border border-[#E8ECF4] rounded-xl outline-none font-semibold text-[#1A1D26]"
                >
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Lost">Lost</option>
                  <option value="Replaced">Replaced</option>                  </select>
              </div>

              {/* Danger Zone */}
              <div className="bg-white border border-[#FECACA] rounded-2xl p-4">
                <button
                  onClick={() => setDeleteTarget(activeProduct)}
                  className="w-full py-2.5 rounded-xl bg-[#FEE2E2] hover:bg-[#FECACA] text-xs font-bold text-[#DC2626] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={13} /> Delete Tag
                </button>
              </div>

              {/* Activity Timeline */}
              <div className="bg-white border border-[#E8ECF4] rounded-2xl p-4 space-y-3">
                <h4 className="font-bold text-xs text-[#1A1D26]">Activity Timeline</h4>
                {activeProduct.timeline && activeProduct.timeline.length > 0 ? (
                  activeProduct.timeline.map((t: any, idx: number) => (
                    <div key={idx} className="flex gap-3 text-xs">
                      <div className="text-sm flex-shrink-0">
                        {t[0] === 'alert' ? '⚠️' : t[0] === 'success' ? '🛡️' : '🔍'}
                      </div>
                      <div className="flex-1 bg-[#F5F6FA] rounded-xl p-2.5">
                        <div className="flex justify-between font-bold text-[#1A1D26]">
                          <span>{t[1]}</span>
                          <span className="text-[10px] text-[#94A3B8]">{t[2]}</span>
                        </div>
                        <p className="text-[11px] text-[#64748B] mt-0.5">{t[3]}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#64748B]">No activity recorded yet.</p>
                )}
              </div>
            </div>
          </>
        )}
      </aside>

      {/* ─── DELETE CONFIRM MODAL ─── */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4"
          style={{ background: "rgba(10,10,20,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 border border-gray-100"
            style={{ animation: "modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.12)", color: "#EF4444" }}>
                <AlertTriangle size={18} />
              </div>
              <h3 className="font-bold text-gray-900 text-base leading-snug">Delete this sticker?</h3>
            </div>
            <p className="text-sm text-gray-600 font-medium leading-relaxed mb-6">
              <span className="font-bold text-gray-900">{deleteTarget.nickname}</span> will be removed from your dashboard. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 cursor-pointer flex items-center justify-center gap-1.5"
                style={{ background: "#EF4444" }}
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
          <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.94) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
        </div>
      )}

      {/* ─── TOAST NOTIFICATION ─── */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#111111] text-white px-5 py-3 rounded-full text-xs font-bold shadow-2xl animate-bounce flex items-center gap-2">
          <Sparkles size={15} className="text-[#111111]" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}

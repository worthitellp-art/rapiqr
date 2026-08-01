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
  Settings,
  CreditCard,
  X,
  Eye,
  Share2,
  Menu,
  Grid,
  History,
  BookOpen,
  Store,
  CheckCircle2,
  AlertTriangle,
  ShoppingBag,
  Trash2,
  ShieldAlert
} from 'lucide-react';

interface ClientDashboardProps {
  onBack: () => void;
  switchToAdminFleet?: () => void;
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

// Product Catalog & Pre-orders — driven by the same admin sticker categories.
const CATALOG_ITEMS = STICKER_CATEGORIES.map((cat) => ({
  category: cat.value,
  icon: getCategoryIcon(cat.value),
  name: `NamoQR ${cat.label} Sticker`,
  desc: CATALOG_DESCRIPTIONS[cat.value] || `${cat.label} sticker with instant scan-and-alert protection.`,
  price: 299,
  img: CATALOG_IMAGES[cat.value] || ''
}));

export default function ClientDashboard({ onBack, switchToAdminFleet }: ClientDashboardProps) {
  const { profile, signOut } = useAuth();

  // Load Google Fraunces Font dynamically for title rendering
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  // Active navigation view tab
  const [activeTab, setActiveTab] = useState<'overview' | 'activate' | 'catalog' | 'history' | 'subscription'>('overview');

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

  // ─── CHECKOUT PAGE STATE ───
  const [cart, setCart] = useState<any[]>([
    { id: 'item-1', name: 'Car Safety QR Sticker', category: 'car', price: 349, qty: 1, img: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&q=80&w=200' },
    { id: 'item-2', name: 'Family Starter Protection Pack (3 Tags)', category: 'child', price: 899, qty: 1, img: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=200' }
  ]);
  const [coFullName, setCoFullName] = useState(() => profile?.fullName || '');
  const [coPhone, setCoPhone] = useState(() => profile?.phoneNumber || '');
  const [coEmail, setCoEmail] = useState(() => profile?.email || '');
  const [coAddress, setCoAddress] = useState('');
  const [coCity, setCoCity] = useState('');
  const [coState, setCoState] = useState('');
  const [coPincode, setCoPincode] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'standard' | 'express'>('standard');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'cod'>('upi');
  const [promoInput, setPromoInput] = useState('');
  const [discountPct, setDiscountPct] = useState(0);
  const [confirmedOrder, setConfirmedOrder] = useState<any | null>(null);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discountAmt = Math.round((subtotal * discountPct) / 100);
  const deliveryFee = deliveryMethod === 'express' ? 99 : 0;
  const grandTotal = Math.max(0, subtotal - discountAmt + deliveryFee);

  const handleQtyChange = (index: number, delta: number) => {
    setCart(prev => {
      const next = [...prev];
      const newQty = (next[index].qty || 1) + delta;
      if (newQty <= 0) return next.filter((_, i) => i !== index);
      next[index] = { ...next[index], qty: newQty };
      return next;
    });
  };

  const handleRemoveCartItem = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  // ─── ADD CATALOG ITEM TO CART ───
  const handleAddToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(c => c.name === item.name);
      if (existing) {
        return prev.map(c => c.name === item.name ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, {
        id: 'cat-' + item.category + '-' + Date.now(),
        name: item.name,
        category: item.category || 'car',
        price: item.price || 299,
        qty: 1,
        img: item.img || ''
      }];
    });
    showToast(`${item.name} added to cart!`);
  };

  const handleApplyPromo = () => {
    if (promoInput.trim().toUpperCase() === 'NAMO10') {
      setDiscountPct(10);
      showToast('Promo code NAMO10 applied (10% OFF)!');
    } else {
      showToast('Invalid promo code.');
    }
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      showToast('Your cart is empty!');
      return;
    }
    if (!coPhone.trim()) {
      showToast('Please enter your Phone Number to link your stickers.');
      return;
    }

    const orderId = '#NQ-' + Math.floor(100000 + Math.random() * 899999);
    const newPurchasedStickers: any[] = [];

    cart.forEach(cartItem => {
      for (let i = 0; i < cartItem.qty; i++) {
        const codeId = 'NQ-' + cartItem.category.toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);
        newPurchasedStickers.push({
          id: 'p' + Date.now() + i,
          code: codeId,
          nickname: `${cartItem.name} ${cartItem.qty > 1 ? `#${i + 1}` : ''}`.trim(),
          category: cartItem.category || 'car',
          assigned: coFullName || 'Self',
          status: 'Active',
          scans: 0,
          lastScan: 'Just purchased',
          ownerPhone: coPhone.trim(),
          meta: [['Purchased', 'Just now'], ['Order ID', orderId]],
          docs: [],
          contacts: [[coFullName || 'Customer', coPhone.trim()]],
          timeline: [['success', 'Order Completed', 'Just now', `Purchased via Order ${orderId}`]]
        });
      }
    });

    setProducts(prev => [...newPurchasedStickers, ...prev]);
    setConfirmedOrder({ orderId, items: cart, total: grandTotal, purchasedStickers: newPurchasedStickers });
    showToast(`Order Confirmed! ${newPurchasedStickers.length} sticker(s) activated in dashboard.`);
  };

  const activeProduct = drawerProductId ? products.find(p => p.id === drawerProductId) : null;
  const activeCount = products.filter(p => p.status === 'Active').length;
  const totalScans = products.reduce((s, p) => s + (p.scans || 0), 0);
  const totalTimelineLogs = products.flatMap(p => (p.timeline || []).map(t => ({ ...t, nickname: p.nickname, code: p.code })));

  return (
    <div className="flex flex-col h-screen bg-[#F6F1E7] text-[#201C15] font-sans antialiased overflow-hidden">
      
      {/* ─── APP HEADER ─── */}
      <header className="h-[72px] flex-shrink-0 bg-[#FFFEFB] border-b border-[rgba(32,28,21,0.1)] flex items-center justify-between px-6 sm:px-8 z-20">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="md:hidden w-9.5 h-9.5 rounded-xl bg-[#F6F1E7] border border-gray-200 flex items-center justify-center text-gray-700 cursor-pointer"
          >
            <Menu size={20} />
          </button>
          <div onClick={onBack} className="flex items-center gap-2 cursor-pointer font-serif font-bold text-xl tracking-tight" style={{ fontFamily: "'Fraunces', serif" }}>
            <div className="w-7 h-7 text-[#E25822]">
              <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
                <rect x="2" y="2" width="11" height="11" rx="3" stroke="#E25822" strokeWidth="3"/>
                <rect x="19" y="2" width="11" height="11" rx="3" stroke="#E25822" strokeWidth="3"/>
                <rect x="2" y="19" width="11" height="11" rx="3" stroke="#E25822" strokeWidth="3"/>
                <rect x="19" y="19" width="5" height="5" rx="1" fill="#E25822"/>
                <rect x="26" y="26" width="4" height="4" rx="1" fill="#E25822"/>
                <rect x="19" y="26" width="4" height="4" rx="1" fill="#E25822"/>
                <rect x="26" y="19" width="4" height="4" rx="1" fill="#E25822"/>
              </svg>
            </div>
            <span>Namo<span className="text-[#E25822]">QR</span></span>
          </div>
        </div>

        <div className="flex items-center gap-3.5">
          <button
            onClick={onBack}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F6F1E7] border border-[rgba(32,28,21,0.1)] text-xs font-bold text-[#201C15] hover:bg-[#FBEBE1] transition-colors cursor-pointer"
          >
            <Store size={15} /> Store
          </button>

          <div className="hidden sm:flex items-center gap-2 bg-[#E4EFE8] text-[#2F6B4F] px-3.5 py-1.5 rounded-full text-xs font-extrabold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2F6B4F] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2F6B4F]"></span>
            </span>
            <span>{activeCount} Active Tags</span>
          </div>

          <button
            onClick={() => {
              setNotifBadgeVisible(false);
              showToast('2 new alerts — Wrong Parking, Courier Arrived');
            }}
            className="relative w-10 h-10 rounded-xl bg-[#F6F1E7] border border-[rgba(32,28,21,0.1)] flex items-center justify-center text-[#201C15] hover:bg-[#FBEBE1] transition-colors cursor-pointer"
          >
            <Bell size={18} />
            {notifBadgeVisible && (
              <span className="absolute -top-1 -right-1 bg-[#E25822] text-white text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center">
                2
              </span>
            )}
          </button>

          <div className="flex items-center gap-2.5 pl-3 border-l border-[rgba(32,28,21,0.1)]">
            <img
              src={profile?.avatarUrl || "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80&w=100"}
              alt="User Avatar"
              className="w-9 h-9 rounded-full object-cover border-2 border-[#E25822]"
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
        <aside className={`w-[236px] flex-shrink-0 bg-[#FFFEFB] border-r border-[rgba(32,28,21,0.1)] flex flex-col justify-between p-5 z-30 transition-all duration-300 md:static fixed inset-y-0 left-0 ${
          isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}>
          <div className="space-y-4">
            <nav className="space-y-1">
              <button
                onClick={() => { setActiveTab('overview'); setIsMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'overview' ? 'bg-[#FBEBE1] text-[#C4471A]' : 'text-[#6E6759] hover:bg-[#F6F1E7]'
                }`}
              >
                <Grid size={17} />
                <span>My Products</span>
              </button>

              <button
                onClick={() => { setActiveTab('activate'); setIsMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'activate' ? 'bg-[#FBEBE1] text-[#C4471A]' : 'text-[#6E6759] hover:bg-[#F6F1E7]'
                }`}
              >
                <Plus size={17} />
                <span>Activate QR Tag</span>
              </button>

              <button
                onClick={() => { setActiveTab('catalog'); setIsMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'catalog' ? 'bg-[#FBEBE1] text-[#C4471A]' : 'text-[#6E6759] hover:bg-[#F6F1E7]'
                }`}
              >
                <BookOpen size={17} />
                <span>Product Catalog</span>
              </button>

              <button
                onClick={() => { setActiveTab('history'); setIsMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'history' ? 'bg-[#FBEBE1] text-[#C4471A]' : 'text-[#6E6759] hover:bg-[#F6F1E7]'
                }`}
              >
                <History size={17} />
                <span>Emergency History</span>
              </button>

              <button
                onClick={() => { setActiveTab('subscription'); setIsMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'subscription' ? 'bg-[#FBEBE1] text-[#C4471A]' : 'text-[#6E6759] hover:bg-[#F6F1E7]'
                }`}
              >
                <CreditCard size={17} />
                <span>Subscription</span>
              </button>
            </nav>

            <button
              onClick={() => { setActiveTab('activate'); setIsMobileSidebarOpen(false); }}
              className="w-full flex items-center justify-center gap-2 bg-[#201C15] hover:bg-[#E25822] text-[#F6F1E7] font-bold text-xs py-3 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Plus size={15} /> Add New Sticker
            </button>

            {switchToAdminFleet && (
              <button
                onClick={switchToAdminFleet}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-[#E25822] bg-[#FBEBE1] border border-orange-200 py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                <Settings size={14} /> Admin Fleet View
              </button>
            )}
          </div>

          <div className="bg-[#E4EFE8] rounded-xl p-4 border border-[#2F6B4F]/20">
            <div className="text-[10px] font-black uppercase tracking-wider text-[#2F6B4F] mb-1">SYSTEM SECURE</div>
            <p className="text-[11px] text-[#3B6E56] leading-relaxed">
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
                  <h1 className="text-2xl sm:text-3xl font-bold text-[#201C15]" style={{ fontFamily: "'Fraunces', serif" }}>
                    Welcome back, {profile?.fullName ? profile.fullName.split(' ')[0] : 'Rahul'}.
                  </h1>
                  <p className="text-xs sm:text-sm text-[#6E6759] mt-1">
                    Here's what's happening across your family's safety network.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('activate')}
                  className="bg-[#E25822] hover:bg-[#C4471A] text-white font-extrabold text-xs px-5 py-3 rounded-full shadow-lg transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <Plus size={16} /> Register Sticker
                </button>
              </div>

              

              {/* Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#FFFEFB] border border-[rgba(32,28,21,0.1)] rounded-2xl p-5 shadow-2xs flex flex-col gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#FBEBE1] text-[#C4471A] flex items-center justify-center font-bold">
                    <ShieldCheck size={18} />
                  </div>
                  <div className="text-2xl font-bold text-[#201C15]" style={{ fontFamily: "'Fraunces', serif" }}>{activeCount}</div>
                  <div className="text-xs font-semibold text-[#6E6759]">Active Tags</div>
                </div>

                <div className="bg-[#FFFEFB] border border-[rgba(32,28,21,0.1)] rounded-2xl p-5 shadow-2xs flex flex-col gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#E4EDF5] text-[#2E5C8A] flex items-center justify-center font-bold">
                    <Eye size={18} />
                  </div>
                  <div className="text-2xl font-bold text-[#201C15]" style={{ fontFamily: "'Fraunces', serif" }}>{totalScans}</div>
                  <div className="text-xs font-semibold text-[#6E6759]">Total Scans Received</div>
                </div>

                <div className="bg-[#FFFEFB] border border-[rgba(32,28,21,0.1)] rounded-2xl p-5 shadow-2xs flex flex-col gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#F8E7E3] text-[#C1442E] flex items-center justify-center font-bold">
                    <AlertTriangle size={18} />
                  </div>
                  <div className="text-2xl font-bold text-[#201C15]" style={{ fontFamily: "'Fraunces', serif" }}>{totalTimelineLogs.filter(t => t[0] === 'alert').length}</div>
                  <div className="text-xs font-semibold text-[#6E6759]">Alerts Recorded</div>
                </div>

                <div className="bg-[#FFFEFB] border border-[rgba(32,28,21,0.1)] rounded-2xl p-5 shadow-2xs flex flex-col gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#E4EFE8] text-[#2F6B4F] flex items-center justify-center font-bold">
                    <User size={18} />
                  </div>
                  <div className="text-2xl font-bold text-[#201C15]" style={{ fontFamily: "'Fraunces', serif" }}>{products.length}</div>
                  <div className="text-xs font-semibold text-[#6E6759]">Total Connected Tags</div>
                </div>
              </div>

              {/* Product Grid OR Clean Empty State */}
              {products.length === 0 ? (
                <div className="bg-[#FFFEFB] border border-[rgba(32,28,21,0.1)] rounded-3xl p-12 text-center space-y-4 shadow-sm">
                  <div className="w-16 h-16 rounded-full bg-[#EEE4CF] flex items-center justify-center mx-auto text-3xl">🛡️</div>
                  <h3 className="text-xl font-bold text-[#201C15]" style={{ fontFamily: "'Fraunces', serif" }}>No QR Tags Connected Yet</h3>
                  <p className="text-xs sm:text-sm text-[#6E6759] max-w-md mx-auto">
                    You haven't activated any NamoQR tags yet. Activate a tag from the sidebar or order safety stickers below.
                  </p>
                  <div className="flex justify-center gap-3 pt-2">
                    <button
                      onClick={() => setActiveTab('activate')}
                      className="bg-[#201C15] hover:bg-black text-[#F6F1E7] text-xs font-bold px-5 py-3 rounded-full cursor-pointer"
                    >
                      Activate Tag
                    </button>
                    <button
                      onClick={() => setActiveTab('subscription')}
                      className="bg-[#E25822] hover:bg-[#C4471A] text-white text-xs font-bold px-5 py-3 rounded-full shadow-md cursor-pointer"
                    >
                      Purchase Sticker
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {products.map(p => (
                    <div
                      key={p.id}
                      className="bg-[#FFFEFB] border border-[rgba(32,28,21,0.1)] rounded-2xl p-5 shadow-2xs hover:shadow-lg hover:-translate-y-1 transition-all relative overflow-hidden flex flex-col justify-between"
                    >
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#E25822] to-[#FF9E5C]" />
                      <div className="absolute top-0 right-0 w-6.5 h-6.5 bg-[#F6F1E7] rounded-bl-xl" />
                      
                      <div>
                        {/* Top Header */}
                        <div className="flex items-start justify-between gap-2 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10.5 h-10.5 rounded-xl bg-[#EEE4CF] flex items-center justify-center text-xl flex-shrink-0">
                              {getCategoryIcon(p.category as any) || '🏷️'}
                            </div>
                            <div>
                              <h3 className="font-bold text-base text-[#201C15] leading-tight" style={{ fontFamily: "'Fraunces', serif" }}>{p.nickname}</h3>
                              <p className="text-[11px] font-semibold text-[#A79E8B]">{getCategoryLabel(p.category as any) || p.code}</p>
                            </div>
                          </div>

                          <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                            p.status === 'Active' ? 'bg-[#E4EFE8] text-[#2F6B4F]' :
                            p.status === 'Suspended' ? 'bg-[#F5EBD9] text-[#A9711F]' :
                            'bg-[#F8E7E3] text-[#C1442E]'
                          }`}>
                            {p.status}
                          </span>
                        </div>

                        {/* Meta List */}
                        <div className="space-y-1.5 my-3 text-xs border-y border-dashed border-[rgba(32,28,21,0.1)] py-2.5">
                          {p.meta?.map((m: any, idx: number) => (
                            <div key={idx} className="flex justify-between">
                              <span className="text-[#A79E8B]">{m[0]}</span>
                              <span className="font-semibold text-[#201C15]">{m[1]}</span>
                            </div>
                          ))}
                          <div className="flex justify-between">
                            <span className="text-[#A79E8B]">Total Scans</span>
                            <span className="font-semibold text-[#201C15]">{p.scans || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#A79E8B]">Last Scan</span>
                            <span className="font-semibold text-[#201C15]">{p.lastScan || 'Never'}</span>
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
                <h1 className="text-2xl sm:text-3xl font-bold text-[#201C15]" style={{ fontFamily: "'Fraunces', serif" }}>Activate a New Sticker</h1>
                <p className="text-xs sm:text-sm text-[#6E6759] mt-1">Register your physical NamoQR product in under a minute.</p>
              </div>

              <div className="bg-[#FFFEFB] border border-[rgba(32,28,21,0.1)] rounded-3xl min-h-[500px] flex flex-col md:flex-row overflow-hidden shadow-sm">
                {/* Wizard Steps Sidebar */}
                <div className="w-full md:w-60 bg-[#F6F1E7] border-b md:border-b-0 md:border-r border-[rgba(32,28,21,0.1)] p-6 flex-shrink-0">
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
                          wizStep === st.num ? 'bg-[#E25822] border-[#E25822] text-white' :
                          wizStep > st.num ? 'bg-[#2F6B4F] border-[#2F6B4F] text-white' :
                          'bg-[#FFFEFB] border-[rgba(32,28,21,0.1)] text-[#201C15]'
                        }`}>
                          {wizStep > st.num ? <Check size={14} /> : st.num}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#201C15]">{st.title}</div>
                          <div className="text-[10px] text-[#A79E8B]">{st.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Wizard Main Section */}
                <div className="flex-1 p-6 sm:p-9 flex flex-col justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-[#201C15]" style={{ fontFamily: "'Fraunces', serif" }}>Product Activation</h2>
                    <p className="text-xs text-[#6E6759] mt-0.5">Step {wizStep} of 4</p>
                  </div>

                  <div className="my-6">
                    {/* Pane 1: Scan Code */}
                    {wizStep === 1 && (
                      <div className="space-y-4 max-w-md mx-auto text-center">
                        <div className="w-40 h-40 border-2 border-dashed border-[#E25822] rounded-2xl mx-auto flex items-center justify-center relative overflow-hidden bg-[#FBEBE1]">
                          <div className="absolute inset-x-0 h-0.5 bg-[#E25822] animate-pulse top-1/2" />
                          <QrCode size={70} className="text-[#201C15] opacity-75" />
                        </div>
                        <p className="text-xs text-[#6E6759]">Scan the sticker's QR, or enter its code manually.</p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={wizCode}
                            onChange={e => setWizCode(e.target.value.toUpperCase())}
                            placeholder="e.g. NQ-CAR-9081"
                            className="flex-1 px-4 py-3 text-sm bg-[#F6F1E7] border border-[rgba(32,28,21,0.1)] rounded-xl outline-none focus:border-[#E25822] font-mono font-bold uppercase"
                          />
                          <button
                            type="button"
                            onClick={handleAutoScanCode}
                            className="px-4 py-3 rounded-xl bg-[#F6F1E7] border border-[rgba(32,28,21,0.1)] text-xs font-bold text-[#201C15] hover:bg-[#EEE4CF] cursor-pointer"
                          >
                            Auto-Scan
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Pane 2: Category Pick */}
                    {wizStep === 2 && (
                      <div className="space-y-3">
                        <h3 className="text-base font-bold text-[#201C15]" style={{ fontFamily: "'Fraunces', serif" }}>Select physical product type</h3>
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
                                wizCategory === cat.v ? 'border-[#E25822] bg-[#FBEBE1]' : 'border-[rgba(32,28,21,0.1)] bg-[#FFFEFB]'
                              }`}
                            >
                              <div className="text-3xl mb-2">{cat.icon}</div>
                              <div className="text-xs font-bold text-[#201C15]">{cat.name}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pane 3: Contacts & Triggers */}
                    {wizStep === 3 && (
                      <div className="space-y-4 max-w-md mx-auto">
                        <h3 className="text-base font-bold text-[#201C15]" style={{ fontFamily: "'Fraunces', serif" }}>Configure SOS &amp; alert settings</h3>
                        <div>
                          <label className="block text-xs font-bold text-[#6E6759] mb-1">Primary Emergency Contact Name</label>
                          <input
                            type="text"
                            value={wizContactName}
                            onChange={e => setWizContactName(e.target.value)}
                            className="w-full px-3.5 py-2.5 text-sm bg-[#F6F1E7] border border-[rgba(32,28,21,0.1)] rounded-xl outline-none focus:border-[#E25822]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#6E6759] mb-1">Phone Number</label>
                          <input
                            type="tel"
                            value={wizContactPhone}
                            onChange={e => setWizContactPhone(e.target.value)}
                            className="w-full px-3.5 py-2.5 text-sm bg-[#F6F1E7] border border-[rgba(32,28,21,0.1)] rounded-xl outline-none focus:border-[#E25822] font-mono"
                          />
                        </div>
                        <div className="space-y-2 pt-2 text-xs font-semibold text-[#201C15]">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" defaultChecked className="accent-[#E25822] w-4 h-4" /> Notify via WhatsApp
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" defaultChecked className="accent-[#E25822] w-4 h-4" /> Masked emergency call (IVR)
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" defaultChecked className="accent-[#E25822] w-4 h-4" /> SMS alert with GPS coordinates
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Pane 4: Done */}
                    {wizStep === 4 && (
                      <div className="text-center space-y-3 py-6">
                        <div className="w-14 h-14 rounded-full bg-[#E4EFE8] text-[#2F6B4F] flex items-center justify-center mx-auto">
                          <Check size={28} />
                        </div>
                        <h2 className="text-2xl font-bold text-[#201C15]" style={{ fontFamily: "'Fraunces', serif" }}>Tag Successfully Activated!</h2>
                        <p className="text-xs text-[#6E6759] max-w-sm mx-auto">
                          Your sticker is now live and visible on your dashboard.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Wizard Footer Controls */}
                  <div className="flex justify-between pt-4 border-t border-[rgba(32,28,21,0.1)]">
                    <button
                      onClick={() => wizStep > 1 && setWizStep(wizStep - 1)}
                      disabled={wizStep === 1}
                      className="px-5 py-2.5 rounded-full bg-[#F6F1E7] text-xs font-bold text-[#201C15] disabled:opacity-40 cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleWizardNext}
                      className="px-6 py-2.5 rounded-full bg-[#E25822] hover:bg-[#C4471A] text-white text-xs font-bold shadow-md cursor-pointer"
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
                    <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#FBEBE1] text-[#C4471A] px-2.5 py-1 rounded-full">
                      Pre-order Collection
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-[#201C15]" style={{ fontFamily: "'Fraunces', serif" }}>Product Catalog &amp; Pre-orders</h1>
                  <p className="text-xs sm:text-sm text-[#6E6759] mt-1">Reserve the next generation of NamoQR safety tags. Added items go straight to your cart.</p>
                </div>
                <button
                  onClick={() => setActiveTab('subscription')}
                  className="flex items-center gap-2 bg-[#201C15] hover:bg-[#E25822] text-[#F6F1E7] font-bold text-xs px-5 py-3 rounded-full shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <ShoppingBag size={15} /> Cart ({cart.reduce((s, c) => s + (c.qty || 1), 0)})
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {CATALOG_ITEMS.map((item, idx) => (
                  <div key={idx} className="group bg-[#FFFEFB] border border-[rgba(32,28,21,0.1)] rounded-2xl overflow-hidden shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col">
                    <div className="relative h-36 bg-gradient-to-br from-[#F6F1E7] to-[#FBEBE1] flex items-center justify-center">
                      {item.img ? (
                        <img src={item.img} alt={item.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      ) : (
                        <span className="text-4xl">{item.icon}</span>
                      )}
                      <div className="absolute top-3 right-3 text-[9.5px] font-extrabold uppercase bg-[#E25822] text-white px-2.5 py-1 rounded-full shadow">
                        Pre-order
                      </div>
                    </div>
                    <div className="p-5 flex flex-col justify-between flex-1 space-y-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{item.icon}</span>
                          <h4 className="font-bold text-base text-[#201C15]" style={{ fontFamily: "'Fraunces', serif" }}>{item.name}</h4>
                        </div>
                        <p className="text-xs text-[#6E6759] leading-relaxed">{item.desc}</p>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-dashed border-[rgba(32,28,21,0.1)]">
                        <span className="text-lg font-extrabold text-[#201C15]" style={{ fontFamily: "'Fraunces', serif" }}>₹{item.price}</span>
                        <button
                          onClick={() => handleAddToCart(item)}
                          className="px-4 py-2.5 rounded-xl bg-[#E25822] hover:bg-[#C4471A] text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                        >
                          <ShoppingBag size={14} /> Add to Cart
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
                  <h1 className="text-2xl sm:text-3xl font-bold text-[#201C15]" style={{ fontFamily: "'Fraunces', serif" }}>Emergency &amp; Activity History</h1>
                  <p className="text-xs sm:text-sm text-[#6E6759] mt-1">Every scan and alert, across all your tags.</p>
                </div>
                <button
                  onClick={handleClearHistory}
                  className="px-4 py-2 rounded-full bg-[#F6F1E7] border border-[rgba(32,28,21,0.1)] text-xs font-bold text-[#201C15] hover:bg-[#EEE4CF] cursor-pointer"
                >
                  Clear All Logs
                </button>
              </div>

              <div className="bg-[#FFFEFB] border border-[rgba(32,28,21,0.1)] rounded-3xl p-6 sm:p-8 max-w-3xl space-y-6 shadow-sm">
                {totalTimelineLogs.length === 0 ? (
                  <div className="text-center py-12 space-y-2">
                    <div className="text-4xl mb-2">🛡️</div>
                    <h3 className="font-bold text-lg text-[#201C15]" style={{ fontFamily: "'Fraunces', serif" }}>All clear</h3>
                    <p className="text-xs text-[#6E6759] max-w-xs mx-auto">No security logs recorded yet. Your family's network is quiet.</p>
                  </div>
                ) : (
                  totalTimelineLogs.map((log: any, i: number) => (
                    <div key={i} className="flex gap-4 relative pb-6 last:pb-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 z-10 ${
                        log[0] === 'alert' ? 'bg-[#F8E7E3] text-[#C1442E]' :
                        log[0] === 'success' ? 'bg-[#E4EFE8] text-[#2F6B4F]' :
                        'bg-[#E4EDF5] text-[#2E5C8A]'
                      }`}>
                        {log[0] === 'alert' ? '⚠️' : log[0] === 'success' ? '🛡️' : '🔍'}
                      </div>
                      <div className="flex-1 bg-[#F6F1E7] rounded-xl p-3.5 border border-[rgba(32,28,21,0.1)]">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-xs text-[#201C15]">{log.nickname} — {log[1]}</span>
                          <span className="text-[10px] text-[#A79E8B]">{log[2]}</span>
                        </div>
                        <p className="text-xs text-[#6E6759]">{log[3]} <span className="font-mono text-[10px] text-[#A79E8B]">[{log.code}]</span></p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ════ VIEW 5: SUBSCRIPTION & NAMQOR CHECKOUT ════ */}
          {activeTab === 'subscription' && (
            <div className="space-y-6 animate-fade-in">
              <div
                className="relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                style={{ background: 'linear-gradient(135deg, #201C15, #E25822)' }}
              >
                <div>
                  <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-white mb-3">
                    <ShoppingBag size={14} /> Official NamoQR Checkout
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ fontFamily: "'Fraunces', serif" }}>
                    Purchase Safety Stickers
                  </h1>
                  <p className="text-white/90 text-xs sm:text-sm mt-1 max-w-lg">
                    Order your NamoQR safety stickers. Purchased stickers will be automatically activated and assigned to your dashboard upon payment.
                  </p>
                </div>
              </div>

              {confirmedOrder ? (
                <div className="bg-[#FFFEFB] rounded-3xl border border-emerald-200 p-8 text-center shadow-lg max-w-lg mx-auto space-y-4">
                  <div className="w-16 h-16 bg-[#E4EFE8] text-[#2F6B4F] rounded-full flex items-center justify-center mx-auto font-bold">
                    <CheckCircle2 size={36} />
                  </div>
                  <h2 className="text-2xl font-bold text-[#201C15]" style={{ fontFamily: "'Fraunces', serif" }}>Order Confirmed!</h2>
                  <p className="text-xs text-[#6E6759]">
                    Thank you! Your NamoQR stickers are being prepared. They have been assigned to your phone number and activated in your dashboard.
                  </p>
                  <div className="bg-[#F6F1E7] rounded-2xl p-4 border border-[rgba(32,28,21,0.1)] text-left space-y-2 text-xs">
                    <div className="flex justify-between font-bold text-[#201C15]">
                      <span>Order ID:</span>
                      <span className="font-mono text-[#E25822]">{confirmedOrder.orderId}</span>
                    </div>
                    <div className="flex justify-between font-bold text-[#201C15]">
                      <span>Total Paid:</span>
                      <span>₹{confirmedOrder.total}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setConfirmedOrder(null);
                      setActiveTab('overview');
                    }}
                    className="w-full py-3.5 rounded-xl bg-[#E25822] hover:bg-[#C4471A] text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ShieldCheck size={18} /> View Purchased Stickers in Dashboard
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Form Column */}
                  <form onSubmit={handleCheckoutSubmit} className="lg:col-span-7 space-y-6">
                    {/* 1. Contact Information */}
                    <div className="bg-[#FFFEFB] rounded-3xl border border-[rgba(32,28,21,0.1)] p-6 shadow-2xs space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-[#201C15] text-[#F6F1E7] text-xs font-black flex items-center justify-center">1</div>
                        <h3 className="font-bold text-[#201C15] text-base" style={{ fontFamily: "'Fraunces', serif" }}>Contact Information</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-[#6E6759] mb-1">Full Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="Rahul Sharma"
                            value={coFullName}
                            onChange={e => setCoFullName(e.target.value)}
                            className="w-full px-3.5 py-2.5 text-sm bg-[#F6F1E7] border border-[rgba(32,28,21,0.1)] rounded-xl outline-none focus:border-[#E25822]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#6E6759] mb-1">Phone Number (Links to Dashboard) *</label>
                          <input
                            type="tel"
                            required
                            placeholder="+91 98162 31234"
                            value={coPhone}
                            onChange={e => setCoPhone(e.target.value)}
                            className="w-full px-3.5 py-2.5 text-sm bg-[#F6F1E7] border border-[rgba(32,28,21,0.1)] rounded-xl outline-none focus:border-[#E25822] font-mono font-semibold"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#6E6759] mb-1">Email Address *</label>
                        <input
                          type="email"
                          required
                          placeholder="you@example.com"
                          value={coEmail}
                          onChange={e => setCoEmail(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-sm bg-[#F6F1E7] border border-[rgba(32,28,21,0.1)] rounded-xl outline-none focus:border-[#E25822]"
                        />
                      </div>
                    </div>

                    {/* 2. Shipping Address */}
                    <div className="bg-[#FFFEFB] rounded-3xl border border-[rgba(32,28,21,0.1)] p-6 shadow-2xs space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-[#201C15] text-[#F6F1E7] text-xs font-black flex items-center justify-center">2</div>
                        <h3 className="font-bold text-[#201C15] text-base" style={{ fontFamily: "'Fraunces', serif" }}>Shipping Address</h3>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#6E6759] mb-1">Flat / Building / Street Address *</label>
                        <input
                          type="text"
                          required
                          placeholder="Flat 402, Green Heights Apartment"
                          value={coAddress}
                          onChange={e => setCoAddress(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-sm bg-[#F6F1E7] border border-[rgba(32,28,21,0.1)] rounded-xl outline-none focus:border-[#E25822]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-[#6E6759] mb-1">City *</label>
                          <input
                            type="text"
                            required
                            placeholder="Rajkot"
                            value={coCity}
                            onChange={e => setCoCity(e.target.value)}
                            className="w-full px-3.5 py-2.5 text-sm bg-[#F6F1E7] border border-[rgba(32,28,21,0.1)] rounded-xl outline-none focus:border-[#E25822]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#6E6759] mb-1">State *</label>
                          <input
                            type="text"
                            required
                            placeholder="Gujarat"
                            value={coState}
                            onChange={e => setCoState(e.target.value)}
                            className="w-full px-3.5 py-2.5 text-sm bg-[#F6F1E7] border border-[rgba(32,28,21,0.1)] rounded-xl outline-none focus:border-[#E25822]"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#6E6759] mb-1">Pincode *</label>
                        <input
                          type="text"
                          required
                          placeholder="360001"
                          value={coPincode}
                          onChange={e => setCoPincode(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-sm bg-[#F6F1E7] border border-[rgba(32,28,21,0.1)] rounded-xl outline-none focus:border-[#E25822] font-mono"
                        />
                      </div>
                    </div>

                    {/* 3. Delivery Method */}
                    <div className="bg-[#FFFEFB] rounded-3xl border border-[rgba(32,28,21,0.1)] p-6 shadow-2xs space-y-3">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-7 h-7 rounded-full bg-[#201C15] text-[#F6F1E7] text-xs font-black flex items-center justify-center">3</div>
                        <h3 className="font-bold text-[#201C15] text-base" style={{ fontFamily: "'Fraunces', serif" }}>Delivery Method</h3>
                      </div>
                      <label
                        onClick={() => setDeliveryMethod('standard')}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                          deliveryMethod === 'standard' ? 'border-[#E25822] bg-[#FBEBE1]' : 'border-[rgba(32,28,21,0.1)]'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-xs text-[#201C15]">Standard Delivery</p>
                          <p className="text-[11px] text-[#6E6759]">Arrives in 4–6 business days</p>
                        </div>
                        <span className="text-xs font-extrabold text-[#2F6B4F]">FREE</span>
                      </label>
                      <label
                        onClick={() => setDeliveryMethod('express')}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                          deliveryMethod === 'express' ? 'border-[#E25822] bg-[#FBEBE1]' : 'border-[rgba(32,28,21,0.1)]'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-xs text-[#201C15]">Express Delivery</p>
                          <p className="text-[11px] text-[#6E6759]">Arrives in 24–48 hours</p>
                        </div>
                        <span className="text-xs font-extrabold text-[#201C15]">₹99</span>
                      </label>
                    </div>

                    {/* 4. Payment Method */}
                    <div className="bg-[#FFFEFB] rounded-3xl border border-[rgba(32,28,21,0.1)] p-6 shadow-2xs space-y-3">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-7 h-7 rounded-full bg-[#201C15] text-[#F6F1E7] text-xs font-black flex items-center justify-center">4</div>
                        <h3 className="font-bold text-[#201C15] text-base" style={{ fontFamily: "'Fraunces', serif" }}>Payment Method</h3>
                      </div>
                      <label
                        onClick={() => setPaymentMethod('upi')}
                        className={`block p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                          paymentMethod === 'upi' ? 'border-[#E25822] bg-[#FBEBE1]' : 'border-[rgba(32,28,21,0.1)]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[#201C15]">📱 UPI (GPay, PhonePe, Paytm)</span>
                          <span className="bg-[#E4EFE8] text-[#2F6B4F] text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">Recommended</span>
                        </div>
                      </label>
                      <label
                        onClick={() => setPaymentMethod('card')}
                        className={`block p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                          paymentMethod === 'card' ? 'border-[#E25822] bg-[#FBEBE1]' : 'border-[rgba(32,28,21,0.1)]'
                        }`}
                      >
                        <span className="font-bold text-xs text-[#201C15]">💳 Credit / Debit Card</span>
                      </label>
                      <label
                        onClick={() => setPaymentMethod('cod')}
                        className={`block p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                          paymentMethod === 'cod' ? 'border-[#E25822] bg-[#FBEBE1]' : 'border-[rgba(32,28,21,0.1)]'
                        }`}
                      >
                        <span className="font-bold text-xs text-[#201C15]">💵 Cash on Delivery</span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-4 rounded-2xl bg-[#E25822] hover:bg-[#C4471A] text-white font-extrabold text-base shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <ShieldCheck size={20} /> Pay ₹{grandTotal} &amp; Activate Sticker
                    </button>
                  </form>

                  {/* Summary Column */}
                  <aside className="lg:col-span-5 bg-[#FFFEFB] rounded-3xl border border-[rgba(32,28,21,0.1)] p-6 shadow-2xs sticky top-6 space-y-4">
                    <h3 className="font-bold text-[#201C15] text-lg" style={{ fontFamily: "'Fraunces', serif" }}>Order Summary</h3>

                    <div className="space-y-3">
                      {cart.map((item, i) => (
                        <div key={item.id} className="flex gap-3 items-center pb-3 border-b border-[rgba(32,28,21,0.1)]">
                          <img src={item.img} alt={item.name} className="w-12 h-12 rounded-xl object-cover bg-[#F6F1E7] flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-xs text-[#201C15] truncate">{item.name}</p>
                            <p className="text-[11px] text-[#6E6759]">₹{item.price} each</p>
                            <div className="flex items-center gap-2 mt-1">
                              <button type="button" onClick={() => handleQtyChange(i, -1)} className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center font-bold text-xs text-gray-600">-</button>
                              <span className="text-xs font-bold text-[#201C15]">{item.qty}</span>
                              <button type="button" onClick={() => handleQtyChange(i, 1)} className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center font-bold text-xs text-gray-600">+</button>
                              <button type="button" onClick={() => handleRemoveCartItem(i)} className="text-[10px] text-red-500 font-semibold ml-2 hover:underline">Remove</button>
                            </div>
                          </div>
                          <span className="font-extrabold text-xs text-[#201C15]">₹{item.price * item.qty}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Promo code (e.g. NAMO10)"
                        value={promoInput}
                        onChange={e => setPromoInput(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs bg-[#F6F1E7] border border-[rgba(32,28,21,0.1)] rounded-xl outline-none focus:border-[#E25822] uppercase font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleApplyPromo}
                        className="bg-[#201C15] hover:bg-black text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                    {discountPct > 0 && <p className="text-xs text-[#2F6B4F] font-bold">✓ NAMO10 applied (10% OFF)</p>}

                    <div className="space-y-2 pt-3 border-t border-[rgba(32,28,21,0.1)] text-xs text-[#6E6759]">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span className="font-semibold text-[#201C15]">₹{subtotal}</span>
                      </div>
                      {discountAmt > 0 && (
                        <div className="flex justify-between text-[#2F6B4F] font-semibold">
                          <span>Discount</span>
                          <span>-₹{discountAmt}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Delivery Fee</span>
                        <span className="font-semibold text-[#201C15]">{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
                      </div>
                      <div className="flex justify-between text-sm font-extrabold text-[#201C15] pt-2 border-t border-[rgba(32,28,21,0.1)]">
                        <span>Total (Incl. GST)</span>
                        <span className="text-[#E25822]">₹{grandTotal}</span>
                      </div>
                    </div>
                  </aside>
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* ─── SLIDE-OVER DRAWER ─── */}
      <div
        className={`fixed inset-0 bg-[#201C15]/40 z-40 transition-opacity duration-300 ${
          activeProduct ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setDrawerProductId(null)}
      />

      <aside className={`fixed top-0 right-0 bottom-0 w-[440px] max-w-[92vw] bg-[#F6F1E7] z-50 shadow-2xl transition-transform duration-300 ease-out flex flex-col ${
        activeProduct ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {activeProduct && (
          <>
            <div className="flex justify-between items-center px-6 py-5 border-b border-[rgba(32,28,21,0.1)] bg-[#FFFEFB]">
              <h3 className="font-bold text-lg text-[#201C15]" style={{ fontFamily: "'Fraunces', serif" }}>{activeProduct.nickname}</h3>
              <button onClick={() => setDrawerProductId(null)} className="w-8 h-8 rounded-full bg-[#F6F1E7] flex items-center justify-center text-gray-500 hover:text-gray-900 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* QR Box */}
              <div className="bg-[#FFFEFB] border border-[rgba(32,28,21,0.1)] rounded-2xl p-5 text-center space-y-3">
                <div className="w-32 h-32 bg-white border border-[rgba(32,28,21,0.1)] rounded-2xl p-2 mx-auto shadow-inner flex items-center justify-center">
                  <svg viewBox="0 0 120 120" className="w-full h-full">
                    <rect x="5" y="5" width="26" height="26" rx="4" fill="none" stroke="#201C15" strokeWidth="6"/>
                    <rect x="11" y="11" width="14" height="14" rx="2" fill="#201C15"/>
                    <rect x="89" y="5" width="26" height="26" rx="4" fill="none" stroke="#201C15" strokeWidth="6"/>
                    <rect x="95" y="11" width="14" height="14" rx="2" fill="#201C15"/>
                    <rect x="5" y="89" width="26" height="26" rx="4" fill="none" stroke="#201C15" strokeWidth="6"/>
                    <rect x="11" y="95" width="14" height="14" rx="2" fill="#201C15"/>
                    <rect x="42" y="10" width="8" height="8" fill="#201C15"/>
                    <rect x="62" y="15" width="12" height="6" fill="#201C15"/>
                    <rect x="36" y="44" width="48" height="32" rx="6" fill="#E25822"/>
                    <text x="60" y="64" fill="#fff" fontFamily="Inter" fontSize="9" fontWeight="800" textAnchor="middle">NamoQR</text>
                  </svg>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleShareProfile(activeProduct.code)}
                    className="flex-1 py-2 rounded-xl bg-[#201C15] hover:bg-[#E25822] text-xs font-bold text-[#F6F1E7] cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Share2 size={12} /> Share Profile
                  </button>
                  <button
                    onClick={() => { setDrawerProductId(null); setActiveTab('subscription'); }}
                    className="flex-1 py-2 rounded-xl bg-[#F6F1E7] border border-[rgba(32,28,21,0.1)] text-xs font-bold text-[#201C15] hover:bg-[#EEE4CF] cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <ShoppingBag size={12} /> Buy More
                  </button>
                </div>
              </div>

              {/* Stat Grid */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-[#FFFEFB] border border-[rgba(32,28,21,0.1)] rounded-xl p-3">
                  <span className="text-xl font-bold block text-[#201C15]" style={{ fontFamily: "'Fraunces', serif" }}>{activeProduct.scans || 0}</span>
                  <span className="text-[10px] font-bold text-[#6E6759]">Total Scans</span>
                </div>
                <div className="bg-[#FFFEFB] border border-[rgba(32,28,21,0.1)] rounded-xl p-3">
                  <span className="text-xl font-bold block text-[#201C15]" style={{ fontFamily: "'Fraunces', serif" }}>{activeProduct.status === 'Active' ? '95%' : '0%'}</span>
                  <span className="text-[10px] font-bold text-[#6E6759]">Readiness</span>
                </div>
              </div>

              {/* Documents Card */}
              {activeProduct.docs && activeProduct.docs.length > 0 && (
                <div className="bg-[#FFFEFB] border border-[rgba(32,28,21,0.1)] rounded-2xl p-4 space-y-2">
                  <h4 className="font-bold text-xs text-[#201C15]" style={{ fontFamily: "'Fraunces', serif" }}>Documents</h4>
                  {activeProduct.docs.map((d: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-xs py-1 border-b border-dashed border-[rgba(32,28,21,0.1)] last:border-0">
                      <span className="font-semibold text-[#201C15]">{d[0]}</span>
                      <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        d[1] === 'valid' ? 'bg-[#E4EFE8] text-[#2F6B4F]' :
                        d[1] === 'soon' ? 'bg-[#F5EBD9] text-[#A9711F]' :
                        'bg-[#F8E7E3] text-[#C1442E]'
                      }`}>
                        {d[1] === 'valid' ? 'Valid' : d[1] === 'soon' ? 'Expiring Soon' : 'Expired'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Emergency Contacts Card */}
              <div className="bg-[#FFFEFB] border border-[rgba(32,28,21,0.1)] rounded-2xl p-4 space-y-2">
                <h4 className="font-bold text-xs text-[#201C15]" style={{ fontFamily: "'Fraunces', serif" }}>Emergency Contacts</h4>
                {activeProduct.contacts?.map((c: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="font-bold text-[#201C15]">{c[0]}</span>
                    <span className="font-mono text-[#6E6759]">{c[1]}</span>
                  </div>
                ))}
              </div>

              {/* Status Control */}
              <div className="bg-[#FFFEFB] border border-[rgba(32,28,21,0.1)] rounded-2xl p-4 space-y-2">
                <h4 className="font-bold text-xs text-[#201C15]" style={{ fontFamily: "'Fraunces', serif" }}>Status Control</h4>
                <select
                  value={activeProduct.status}
                  onChange={e => handleChangeStatus(activeProduct.id, e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#F6F1E7] border border-[rgba(32,28,21,0.1)] rounded-xl outline-none font-semibold text-[#201C15]"
                >
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Lost">Lost</option>
                  <option value="Replaced">Replaced</option>                  </select>
              </div>

              {/* Danger Zone */}
              <div className="bg-[#FFFEFB] border border-[#FECACA] rounded-2xl p-4">
                <button
                  onClick={() => setDeleteTarget(activeProduct)}
                  className="w-full py-2.5 rounded-xl bg-[#FEE2E2] hover:bg-[#FECACA] text-xs font-bold text-[#DC2626] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={13} /> Delete Tag
                </button>
              </div>

              {/* Activity Timeline */}
              <div className="bg-[#FFFEFB] border border-[rgba(32,28,21,0.1)] rounded-2xl p-4 space-y-3">
                <h4 className="font-bold text-xs text-[#201C15]" style={{ fontFamily: "'Fraunces', serif" }}>Activity Timeline</h4>
                {activeProduct.timeline && activeProduct.timeline.length > 0 ? (
                  activeProduct.timeline.map((t: any, idx: number) => (
                    <div key={idx} className="flex gap-3 text-xs">
                      <div className="text-sm flex-shrink-0">
                        {t[0] === 'alert' ? '⚠️' : t[0] === 'success' ? '🛡️' : '🔍'}
                      </div>
                      <div className="flex-1 bg-[#F6F1E7] rounded-xl p-2.5">
                        <div className="flex justify-between font-bold text-[#201C15]">
                          <span>{t[1]}</span>
                          <span className="text-[10px] text-[#A79E8B]">{t[2]}</span>
                        </div>
                        <p className="text-[11px] text-[#6E6759] mt-0.5">{t[3]}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#6E6759]">No activity recorded yet.</p>
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#201C15] text-[#F6F1E7] px-5 py-3 rounded-full text-xs font-bold shadow-2xl animate-bounce flex items-center gap-2">
          <Sparkles size={15} className="text-[#E25822]" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCategoryIcon, getCategoryLabel } from '../stickerModules';
import {
  Bell,
  Search,
  ShieldCheck,
  LogOut,
  Eye,
  Menu,
  Grid,
  History,
  Trash2,
  Loader2,
  Users,
  Settings,
  LifeBuoy,
  X,
  Share2,
  ShoppingBag,
  Pencil,
  ArrowRightLeft,
  Power,
  RefreshCcw,
  Sparkles,
  QrCode,
  Tag,
  Plus,
  AlertTriangle,
  Smartphone,
  CheckCircle2,
  ArrowRight,
  MessageSquare,
  MessageCircle,
  Package
} from 'lucide-react';
import type { DashboardSticker } from './dashboard/client/types';
import PhoneVerificationCard from './auth/PhoneVerificationCard';
import { mapProductRow } from './dashboard/client/types';
import { QrCodeModal, EditDetailsModal, EditContactsModal, TransferModal, ScanHistoryModal, ConfirmActionModal } from './dashboard/client/StickerModals';
import PhoneInputWithCountry from './common/PhoneInputWithCountry';
import EmergencyContactsPanel from './dashboard/client/EmergencyContactsPanel';
import AccountSettingsPanel from './dashboard/client/AccountSettingsPanel';
import SupportLegalPanel from './dashboard/client/SupportLegalPanel';
import CompleteProfilePopup from './dashboard/client/CompleteProfilePopup';
import AppLogo from './common/AppLogo';
import RepiChat from './chat/RepiChat';
import { apiClient, ChatSession } from '../lib/apiClient';
import { connectAsOwner } from '../lib/socketClient';
import { soundNotification } from '../utils/soundNotification';
import {
  getProductsFromDb,
  updateProductDetailsInDb,
  updateProductContactsInDb,
  setProductStatusInDb,
  transferProductInDb,
  deleteProductFromDb,
  getProductHistoryFromDb,
} from '../lib/supabaseService';

interface ClientDashboardProps {
  onBack: () => void;
  switchToDistributor?: () => void;
}

type TabId = 'setup' | 'overview' | 'products' | 'chat' | 'contacts' | 'history' | 'settings' | 'support';

const NAV_ITEMS: { id: TabId; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'setup', label: 'Setup Guide', icon: Sparkles },
  { id: 'overview', label: 'Home Overview', icon: Grid },
  { id: 'products', label: 'Products', icon: ShoppingBag },
  { id: 'chat', label: 'Live Visitor Chat', icon: MessageSquare },
  { id: 'contacts', label: 'Emergency Contacts', icon: Users },
  { id: 'history', label: 'Alert History', icon: History },
  { id: 'settings', label: 'Account Settings', icon: Settings },
  { id: 'support', label: 'Support & Help', icon: LifeBuoy },
];

type ModalState =
  | { type: 'editDetails'; sticker: DashboardSticker }
  | { type: 'editContacts'; sticker: DashboardSticker }
  | { type: 'transfer'; sticker: DashboardSticker }
  | { type: 'history'; sticker: DashboardSticker }
  | { type: 'deactivate'; sticker: DashboardSticker }
  | { type: 'reactivate'; sticker: DashboardSticker }
  | { type: 'delete'; sticker: DashboardSticker }
  | { type: 'qrCode'; sticker: DashboardSticker }
  | null;

export default function ClientDashboard({ onBack }: ClientDashboardProps) {
  const { profile, signOut, sendPhoneOtp, verifyPhoneOtp, updatePhoneNumber } = useAuth();

  // ─── DASHBOARD PREPARATION SPLASH ANIMATION ───
  const [isPreparing, setIsPreparing] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPreparing(false);
    }, 1600);
    return () => clearTimeout(timer);
  }, []);

  // ─── PHONE NUMBER STICKER LINKING STATE ───
  const [linkingPhone, setLinkingPhone] = useState(profile?.phoneNumber || '');
  const [otpStep, setOtpStep] = useState<'input' | 'otp'>('input');
  const [otpCode, setOtpCode] = useState('');
  const [linkingLoading, setLinkingLoading] = useState(false);
  const [linkingMessage, setLinkingMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSendPhoneVerification = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const digits = linkingPhone.replace(/\D/g, '');
    if (digits.length < 7) {
      setLinkingMessage({ type: 'error', text: 'Please enter a valid mobile number.' });
      return;
    }
    setLinkingLoading(true);
    setLinkingMessage(null);
    try {
      const res = await sendPhoneOtp(linkingPhone);
      setLinkingLoading(false);
      if (res.success) {
        setOtpStep('otp');
        showToast(`Verification code sent to ${linkingPhone}`);
        setLinkingMessage({ type: 'success', text: `Verification code sent to ${linkingPhone}. Enter OTP to claim your stickers.` });
      } else {
        setLinkingMessage({ type: 'error', text: res.error || 'Failed to send OTP.' });
      }
    } catch (err: any) {
      setLinkingLoading(false);
      setLinkingMessage({ type: 'error', text: err.message || 'Failed to send verification code.' });
    }
  };

  const handleConfirmPhoneOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!otpCode.trim()) {
      setLinkingMessage({ type: 'error', text: 'Please enter the verification code.' });
      return;
    }
    setLinkingLoading(true);
    setLinkingMessage(null);
    try {
      const res = await verifyPhoneOtp(otpCode.trim());
      setLinkingLoading(false);
      if (res.success) {
        setIsPreparing(true);
        await updatePhoneNumber(linkingPhone);
        const claimed = await loadProducts();
        setOtpStep('input');
        setOtpCode('');
        const count = claimed?.length || res.claimedCount || 0;
        const msg = `Phone verified! Loaded ${count} safety sticker${count === 1 ? '' : 's'} linked to ${linkingPhone}.`;
        showToast(msg);
        setLinkingMessage({ type: 'success', text: msg });
        setTimeout(() => setIsPreparing(false), 1600);
      } else {
        setLinkingMessage({ type: 'error', text: res.error || 'Invalid verification code.' });
      }
    } catch (err: any) {
      setLinkingLoading(false);
      setLinkingMessage({ type: 'error', text: err.message || 'Verification failed.' });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    onBack();
  };

  const missingPhone = !profile?.phoneNumber;
  const missingEmail = !profile?.email || profile.email.endsWith('.repiqr.local');
  const [profilePopupDismissed, setProfilePopupDismissed] = useState(false);
  const showCompleteProfilePopup = Boolean(profile) && (missingPhone || missingEmail) && !profilePopupDismissed;

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  const [activeTab, setActiveTab] = useState<TabId>(() => {
    try {
      const hash = window.location.hash || window.location.search;
      if (hash.includes('tab=chat')) return 'chat';
      if (hash.includes('tab=products')) return 'products';
      if (hash.includes('tab=settings')) return 'settings';
      const saved = localStorage.getItem('repiqr-client-active-tab') || localStorage.getItem('namoqr-client-active-tab');
      if (saved && ['setup', 'overview', 'products', 'chat', 'contacts', 'history', 'settings', 'support'].includes(saved)) {
        return saved as TabId;
      }
    } catch { /* fallback */ }
    return 'overview';
  });

  useEffect(() => {
    try {
      localStorage.setItem('repiqr-client-active-tab', activeTab);
    } catch { /* fallback */ }
  }, [activeTab]);

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [products, setProducts] = useState<DashboardSticker[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // Stickers that used to be in the list and silently disappeared — deletion
  // is a hard DELETE server-side (no soft-delete/tombstone), so the only
  // signal a client has that "this was removed by the owner" (vs. never
  // existing) is noticing it vanished between loads. Tracked per-account in
  // localStorage so a refresh doesn't lose the "previously seen" baseline.
  const [removedStickers, setRemovedStickers] = useState<{ id: string; qrCodeId: string; nickname: string }[]>([]);

  const loadProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const rows = await getProductsFromDb(profile?.id, profile?.phoneNumber);
      const mapped = Array.isArray(rows) ? rows.map(mapProductRow) : [];

      if (profile?.id) {
        const seenKey = `repiqr-client-seen-stickers-${profile.id}`;
        try {
          const prevSeen: { id: string; qrCodeId: string; nickname: string }[] = JSON.parse(localStorage.getItem(seenKey) || '[]');
          const currentIds = new Set(mapped.map((p) => p.id));
          const vanished = prevSeen.filter((s) => !currentIds.has(s.id));
          if (vanished.length > 0 && prevSeen.length > 0) {
            setRemovedStickers((prev) => {
              const known = new Set(prev.map((s) => s.id));
              const additions = vanished.filter((s) => !known.has(s.id));
              return additions.length ? [...prev, ...additions] : prev;
            });
          }
          localStorage.setItem(seenKey, JSON.stringify(mapped.map((p) => ({ id: p.id, qrCodeId: p.qrCodeId, nickname: p.nickname }))));
        } catch { /* ignore storage errors */ }
      }

      setProducts(mapped);
      return mapped;
    } finally {
      setProductsLoading(false);
    }
  }, [profile?.id, profile?.phoneNumber]);

  const dismissRemovedSticker = (id: string) => {
    setRemovedStickers((prev) => prev.filter((s) => s.id !== id));
  };

  useEffect(() => {
    if (!profile) return;
    loadProducts();
    // Admin fleet deletions are hard deletes with no push notification to the
    // client — without a periodic re-fetch, a sticker admin removed keeps
    // showing here until the client happens to manually refresh or reload the
    // page. Poll so a deletion (or any other admin-side change) syncs on its own.
    const interval = setInterval(loadProducts, 15000);
    return () => clearInterval(interval);
  }, [profile?.id, profile?.phoneNumber, loadProducts]);

  const [drawerProductId, setDrawerProductId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }, []);

  const [notifBadgeVisible, setNotifBadgeVisible] = useState(true);
  const [modal, setModal] = useState<ModalState>(null);
  const [modalBusy, setModalBusy] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const handleShareProfile = (code: string) => {
    const url = `${window.location.origin}/verify/${code}`;
    navigator.clipboard.writeText(url);
    showToast(`Safety link copied: ${url}`);
  };

  // A 404 from any per-sticker action means the admin deleted it out from under
  // the client (products are hard-deleted, see QrModel.delete) — surface that
  // distinctly instead of a generic failure toast.
  const describeError = (sticker: DashboardSticker, error?: string) => {
    if (error && /not found/i.test(error)) {
      flagRemoved(sticker);
      return `"${sticker.nickname}" was removed by the owner.`;
    }
    return error || 'Something went wrong — please try again.';
  };

  const flagRemoved = (sticker: DashboardSticker) => {
    setProducts((prev) => prev.filter((p) => p.id !== sticker.id));
    setRemovedStickers((prev) => (prev.some((s) => s.id === sticker.id) ? prev : [...prev, { id: sticker.id, qrCodeId: sticker.qrCodeId, nickname: sticker.nickname }]));
  };

  const handleSaveDetails = async (productId: string, updates: Record<string, any>) => {
    const sticker = products.find((p) => p.id === productId);
    const res = await updateProductDetailsInDb(productId, updates);
    if (res.success && res.data) {
      setProducts((prev) => prev.map((p) => (p.id === productId ? mapProductRow(res.data) : p)));
      showToast('Sticker details updated');
      setModal(null);
    } else {
      showToast(sticker ? describeError(sticker, res.error) : (res.error || 'Failed to update sticker details'));
    }
  };

  const handleSaveContacts = async (productId: string, contacts: { name: string; phone: string }[]) => {
    const sticker = products.find((p) => p.id === productId);
    const res = await updateProductContactsInDb(productId, contacts);
    if (res.success && res.data) {
      setProducts((prev) => prev.map((p) => (p.id === productId ? mapProductRow(res.data) : p)));
      showToast('Emergency contacts saved');
      setModal((m) => (m && m.type === 'editContacts' && m.sticker.id === productId ? null : m));
    } else {
      showToast(sticker ? describeError(sticker, res.error) : (res.error || 'Failed to save contacts'));
    }
  };

  const handleSetStatus = async (sticker: DashboardSticker, active: boolean) => {
    setModalBusy(true);
    const res = await setProductStatusInDb(sticker.id, active, sticker.qrCodeId);
    setModalBusy(false);
    if (res.success && res.data) {
      setProducts((prev) => prev.map((p) => (p.id === sticker.id ? mapProductRow(res.data) : p)));
      showToast(active ? 'Sticker reactivated' : 'Sticker deactivated');
      setModal(null);
    } else {
      showToast(describeError(sticker, res.error));
    }
  };

  const handleConfirmTransfer = async (sticker: DashboardSticker, newPhone: string) => {
    setModalBusy(true);
    const res = await transferProductInDb(sticker.id, newPhone);
    setModalBusy(false);
    if (res.success) {
      setProducts((prev) => prev.filter((p) => p.id !== sticker.id));
      setDrawerProductId(null);
      setModal(null);
      showToast(`Sticker transferred to ${newPhone}`);
    } else {
      showToast(`Transfer failed: ${res.error || 'Unknown error'}`);
    }
  };

  const handleConfirmDelete = async (sticker: DashboardSticker) => {
    setModalBusy(true);
    const res = await deleteProductFromDb(sticker.id, sticker.qrCodeId);
    setModalBusy(false);
    if (res.success) {
      setProducts((prev) => prev.filter((p) => p.id !== sticker.id));
      setDrawerProductId(null);
      setModal(null);
      showToast('Sticker removed from dashboard');
    } else {
      showToast(describeError(sticker, res.error));
      setDrawerProductId(null);
      setModal(null);
    }
  };

  const handleOpenHistory = async (sticker: DashboardSticker) => {
    setModal({ type: 'history', sticker });
    setHistoryLoading(true);
    const data = await getProductHistoryFromDb(sticker.id);
    setHistoryData(data);
    setHistoryLoading(false);
  };

  const [allHistory, setAllHistory] = useState<any[]>([]);
  const [allHistoryLoading, setAllHistoryLoading] = useState(false);

  // ─── PRODUCTS TAB: PURCHASE / ORDER HISTORY (checkout orders, not stickers) ───
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [myOrdersLoading, setMyOrdersLoading] = useState(false);
  const [myOrdersError, setMyOrdersError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab !== 'products') return;
    let cancelled = false;
    (async () => {
      setMyOrdersLoading(true);
      setMyOrdersError(null);
      try {
        const res = await apiClient.orders.mine();
        if (!cancelled) setMyOrders(res?.data || []);
      } catch (err: any) {
        if (!cancelled) setMyOrdersError(err?.message || 'Failed to load your orders.');
      } finally {
        if (!cancelled) setMyOrdersLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeTab]);

  // ─── LIVE VISITOR CHAT SESSIONS STATE ───
  const [ownerSessions, setOwnerSessions] = useState<ChatSession[]>([]);
  const [ownerSessionsLoading, setOwnerSessionsLoading] = useState(false);
  const [selectedChatSession, setSelectedChatSession] = useState<ChatSession | null>(null);

  const totalUnreadChats = ownerSessions.reduce((sum, s) => sum + (s.unread_owner_count || 0), 0);

  const loadOwnerSessions = useCallback(async () => {
    setOwnerSessionsLoading(true);
    const res = await apiClient.chat.listOwnerSessions().catch(() => null);
    setOwnerSessionsLoading(false);
    if (res?.success && Array.isArray(res.data)) {
      setOwnerSessions(res.data);
    } else {
      setOwnerSessions([]);
    }
  }, []);

  useEffect(() => {
    loadOwnerSessions();
    const handleHash = () => {
      const hash = window.location.hash || window.location.search;
      if (hash.includes('tab=chat')) {
        setActiveTab('chat');
        loadOwnerSessions();
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);

    // Live Socket listener for incoming visitor chat messages across all owner stickers
    const token = localStorage.getItem('repiqr-token') || localStorage.getItem('namoqr-token') || '';
    const socket = connectAsOwner(token);
    const onNewMessage = (msg: any) => {
      if (msg.sender_type === 'customer') {
        soundNotification.playMessageChime();
        soundNotification.showBrowserNotification(
          'New Visitor Message',
          msg.body ? (msg.body.length > 50 ? `${msg.body.slice(0, 50)}…` : msg.body) : 'A visitor sent a message.'
        );
        showToast(`💬 Visitor: ${msg.body ? (msg.body.length > 40 ? `${msg.body.slice(0, 40)}…` : msg.body) : 'New message'}`);
        loadOwnerSessions();
      }
    };

    socket.on('new_message', onNewMessage);

    return () => {
      window.removeEventListener('hashchange', handleHash);
      socket.off('new_message', onNewMessage);
    };
  }, [loadOwnerSessions, showToast]);

  useEffect(() => {
    if (activeTab !== 'history' || products.length === 0) {
      if (activeTab === 'history' && products.length === 0) setAllHistory([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setAllHistoryLoading(true);
      const results = await Promise.all(
        products.map(async (p) => {
          const rows = await getProductHistoryFromDb(p.id);
          return rows.map((r: any) => ({ ...r, stickerNickname: p.nickname, stickerCode: p.qrCodeId }));
        })
      );
      if (!cancelled) {
        const merged = results.flat().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setAllHistory(merged);
        setAllHistoryLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeTab, products.length]);

  const activeProduct = drawerProductId ? products.find((p) => p.id === drawerProductId) || null : null;
  const activeCount = products.filter((p) => p.status === 'Active').length;
  const totalScans = products.reduce((s, p) => s + (p.scans || 0), 0);
  const totalContacts = products.reduce((s, p) => s + (p.contacts?.length || 0), 0);

  // ─── DASHBOARD PREPARATION SPLASH LOADING ANIMATION ───
  if (isPreparing) {
    return (
      <div className="fixed inset-0 bg-[#0F172A] z-50 flex flex-col items-center justify-center font-body p-6 text-center animate-fade-in">
        <div className="mb-6 relative">
          <AppLogo variant="dark" className="h-10 w-auto mx-auto object-contain" />
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-2">
          Preparing your dashboard
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-sm font-medium leading-relaxed">
          Synchronizing safety stickers, emergency contacts, and protection settings...
        </p>

        <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden mt-7">
          <div className="h-full bg-amber-400 rounded-full animate-pulse w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col overflow-x-hidden text-[#17181A] bg-[#F7F7F8] font-body pb-16">

      <div className="flex flex-1 min-h-screen">
        {/* ─── SIDEBAR (HoneyBook Dark Style from design.html) ─── */}
        <aside
          className={`w-[213px] flex-shrink-0 flex flex-col h-screen fixed left-0 top-0 bottom-0 py-3.5 px-2 bg-[#111315] text-[#DDD] z-30 transition-all duration-300 ${
            isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
          }`}
        >
          {/* Logo */}
          <div className="flex items-center justify-between px-2 mb-3.5 flex-shrink-0">
            <button onClick={onBack} className="flex items-center gap-2 cursor-pointer group">
              <AppLogo variant="dark" className="h-8 w-auto object-contain transition-transform group-hover:scale-105" />
            </button>
          </div>

          {/* Setup Box Widget */}
          <div
            onClick={() => setActiveTab('setup')}
            className="border border-[#414347] rounded-[7px] p-2.5 mb-2.5 bg-[#292B2E]/60 hover:bg-[#292B2E] transition-colors cursor-pointer"
          >
            <div className="flex justify-between items-center text-[12px] text-white font-semibold mb-2">
              <span>Set up your account</span>
              <span className="text-[#4FC47A] font-bold">›</span>
            </div>
            <div className="h-[5px] bg-[#3D4142] rounded-full overflow-hidden">
              <div className="h-full bg-[#4FC47A] rounded-full w-[88%]" />
            </div>
            <div className="text-[11px] text-[#DDD] mt-1.5">6/7 completed</div>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-0.5 overflow-y-auto custom-scrollbar">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              const isChat = item.id === 'chat';
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setIsMobileSidebarOpen(false); }}
                  className={`w-full h-[34px] rounded-[5px] flex items-center justify-between px-2.5 text-[13px] transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#303235] text-white font-semibold'
                      : 'text-[#C9CACC] hover:bg-[#303235]/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <item.icon size={15} className={isActive ? 'text-[#5C78DF]' : 'text-[#888]'} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {isChat && totalUnreadChats > 0 && (
                    <span className="bg-[#5C78DF] text-white rounded-full text-[10px] font-bold px-1.5 py-0.2 shrink-0">
                      {totalUnreadChats}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom Nav Profile */}
          <div className="pt-2 border-t border-[#292B2E] space-y-1">
            <div className="flex items-center gap-2.5 p-2 rounded-[6px] bg-[#292B2E]">
              <img
                src={profile?.avatarUrl || "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80&w=100"}
                alt="User Avatar"
                className="w-7 h-7 rounded-full object-cover bg-white p-0.5"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-white truncate leading-tight">{profile?.fullName || 'Client'}</p>
                <p className={`text-[10px] truncate font-mono font-medium ${profile?.isPhoneVerified ? 'text-[#4FC47A]' : 'text-amber-400'}`}>
                  {profile?.isPhoneVerified ? '✓ Phone Verified' : '⚠ Phone Unverified'}
                </p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[5px] text-[12px] text-[#DC2626] hover:bg-[#DC2626]/10 transition-all cursor-pointer"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* ─── RIGHT MAIN CONTENT CANVAS (margin-left: 213px) ─── */}
        <div className="flex-1 md:ml-[213px] min-h-screen flex flex-col min-w-0">
          
          {/* Top Bar */}
          <header className="h-[57px] flex-shrink-0 bg-[#F7F7F8] border-b border-[#E5E5E7] flex items-center justify-between px-6 sm:px-12 z-20">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                className="md:hidden w-8 h-8 rounded-full bg-white border border-[#E5E5E7] flex items-center justify-center text-[#17181A] cursor-pointer"
              >
                <Menu size={16} />
              </button>

              <div className="bg-[#EFEFF0] rounded-full h-[31px] w-[140px] sm:w-[180px] flex items-center gap-2 px-3 text-[#6F7377] text-xs">
                <Search size={13} />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="bg-transparent border-none outline-none w-full text-xs text-[#17181A] placeholder-[#6F7377]"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <span className="font-semibold text-[#477486] hidden sm:inline-flex items-center gap-1">
                ◆ Pro Protection
              </span>
              <button
                onClick={() => setActiveTab('chat')}
                className="relative text-[#777] hover:text-[#17181A] cursor-pointer transition-colors"
                title={totalUnreadChats > 0 ? `${totalUnreadChats} unread message(s)` : 'Live Chat Notifications'}
              >
                <Bell size={17} />
                {totalUnreadChats > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#5579DC] text-white rounded-full text-[9px] px-1 font-bold animate-pulse">
                    {totalUnreadChats}
                  </span>
                )}
              </button>
              <span className="bg-[#EEE9FF] text-[#7259D9] rounded px-1.5 py-1 text-xs font-bold">✦</span>
            </div>
          </header>

          {/* Page Container (max-width: 1014px) */}
          <main className="max-w-[1014px] w-full mx-auto p-4 sm:p-8 space-y-6">

            {/* ── MANDATORY PHONE VERIFICATION ALERT BANNER ── */}
            {(!profile?.isPhoneVerified && (!profile?.phoneNumber || profile?.isPhoneVerified === false)) && (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-fade-in">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 flex-shrink-0 mt-0.5 sm:mt-0">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-amber-900 flex items-center gap-2">
                      <span>{profile?.phoneNumber ? 'Action Required: Phone Verification Pending' : 'Action Required: Add & Verify Mobile Number'}</span>
                      <span className="text-[10px] uppercase tracking-wider bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-bold">Unverified</span>
                    </h4>
                    <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                      {profile?.phoneNumber
                        ? `Complete 6-digit OTP verification for ${profile.phoneNumber} to auto-claim safety stickers and enable emergency SMS alerts.`
                        : 'Add and verify your mobile phone number via OTP to link safety stickers to your dashboard and enable instant emergency call bridges.'
                      }
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('settings');
                    setOtpStep('input');
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 flex-shrink-0 shadow-xs cursor-pointer"
                >
                  <Smartphone size={14} />
                  <span>{profile?.phoneNumber ? 'Verify Phone via OTP' : 'Add & Verify Mobile Number'}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            )}

            {/* ════ SETUP GUIDE PAGE ════ */}
            {activeTab === 'setup' && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-white border border-[#EEE] rounded-lg p-6 shadow-xs space-y-6">
                  <div className="flex justify-between items-center border-b border-[#EEE] pb-4">
                    <div>
                      <h1 className="text-2xl font-bold text-[#17181A]">Welcome to RapiQR, {profile?.fullName || 'Client'}!</h1>
                      <p className="text-xs text-[#777B80] mt-1">Let's start step-by-step to protect your vehicles.</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-semibold text-[#17181A]">3/3 completed</span>
                      <div className="w-32 h-1.5 bg-[#DDD] rounded-full overflow-hidden">
                        <div className="h-full bg-[#4FC47A] rounded-full w-full" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="border border-[#E3E3E5] rounded-md p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-[#55C77D] text-white flex items-center justify-center text-xs font-bold">✓</div>
                        <div>
                          <p className="font-semibold text-sm text-[#17181A]">Verify Mobile Phone Number OTP</p>
                          <p className="text-xs text-[#777B80]">Verified mobile number linked: {profile?.phoneNumber || 'Active'}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#2E9E5B]">Completed</span>
                    </div>

                    <div className="border border-[#E3E3E5] rounded-md p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-[#55C77D] text-white flex items-center justify-center text-xs font-bold">✓</div>
                        <div>
                          <p className="font-semibold text-sm text-[#17181A]">Link Emergency Responders</p>
                          <p className="text-xs text-[#777B80]">{totalContacts} emergency contact numbers active</p>
                        </div>
                      </div>
                      <button onClick={() => setActiveTab('contacts')} className="text-xs font-bold text-[#5271D5] hover:underline">Configure ›</button>
                    </div>

                    <div className="border border-[#E3E3E5] rounded-md p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-[#55C77D] text-white flex items-center justify-center text-xs font-bold">✓</div>
                        <div>
                          <p className="font-semibold text-sm text-[#17181A]">Active Safety QR Plates</p>
                          <p className="text-xs text-[#777B80]">{activeCount} active vehicle QR plates online</p>
                        </div>
                      </div>
                      <button onClick={() => setActiveTab('overview')} className="text-xs font-bold text-[#5271D5] hover:underline">View Stickers ›</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ════ HOME OVERVIEW PAGE (Exact design.html layout) ════ */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                
                {/* Hero Greeting Section */}
                <div className="flex justify-between items-start pt-2 pb-4">
                  <div className="flex gap-4 items-center">
                    <div className="w-[73px] h-[62px] relative overflow-hidden shrink-0 rounded-2xl bg-gradient-to-tr from-[#624FE1] via-[#D55BEA] to-[#4B72DB] p-0.5 shadow-md flex items-center justify-center text-white font-bold text-xl">
                      RQ
                    </div>
                    <div>
                      <div className="text-xs text-[#777] mb-1">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                      </div>
                      <h1 className="text-2xl sm:text-[28px] font-bold text-[#17181A] leading-tight tracking-tight">
                        Good morning, {profile?.fullName?.split(' ')[0] || 'Client'}
                      </h1>
                      <p className="text-xs sm:text-sm text-[#777B80] mt-0.5">
                        Pajama bottoms? No one has to know. Your vehicle safety protection is active.
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-[#6F7377] hidden sm:block">
                    <span className="font-semibold text-[#17181A]">RapiQR Pro Plan</span><br />
                    <span className="text-[#43818D] font-semibold">Active Protection Enabled</span>
                  </div>
                </div>

                {/* HoneyBook Stats Bar (4 columns) */}
                <div className="bg-white border border-[#EEE] shadow-[0_1px_4px_rgba(0,0,0,0.04)] grid grid-cols-2 lg:grid-cols-4 rounded-lg overflow-hidden divide-x divide-y lg:divide-y-0 divide-[#EEE]">
                  <div className="p-6">
                    <div className="text-xs text-[#777B80] mb-1">Active Stickers <small className="text-[#999]">ⓘ</small></div>
                    <div className="text-3xl font-light tracking-tight text-[#17181A]">{activeCount}</div>
                  </div>
                  <div className="p-6">
                    <div className="text-xs text-[#777B80] mb-1">Total Scans <small className="text-[#999]">ⓘ</small></div>
                    <div className="text-3xl font-light tracking-tight text-[#17181A]">{totalScans}</div>
                  </div>
                  <div className="p-6">
                    <div className="text-xs text-[#777B80] mb-1">Emergency Contacts <small className="text-[#999]">ⓘ</small></div>
                    <div className="text-3xl font-light tracking-tight text-[#17181A]">{totalContacts}</div>
                  </div>
                  <div className="p-6">
                    <div className="text-xs text-[#777B80] mb-1">Security Status <small className="text-[#999]">ⓘ</small></div>
                    <div className="text-2xl font-semibold text-[#4FC47A] tracking-tight mt-1">Protected</div>
                  </div>
                </div>

                {/* Bento Grid (3 Columns) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  
                  {/* Card 1: Create New */}
                  <div className="bg-white border border-[#EEE] shadow-[0_1px_4px_rgba(0,0,0,0.03)] rounded-lg p-4 flex flex-col justify-between min-h-[360px]">
                    <div>
                      <h3 className="text-xs font-semibold text-[#17181A] mb-3.5">Quick Actions</h3>
                      <div className="space-y-2">
                        <button
                          onClick={() => setActiveTab('chat')}
                          className="w-full h-11 border border-[#E7E7E8] bg-[#FAFBFF] rounded hover:border-[#5878DA] flex items-center px-3 gap-2.5 text-xs text-[#17181A] font-bold hover:bg-[#F0F4FF] transition-colors cursor-pointer"
                        >
                          <span className="text-[#5878DA] font-bold text-sm">💬</span> Open Live Visitor Chat
                        </button>
                        <button
                          onClick={() => setActiveTab('contacts')}
                          className="w-full h-11 border border-[#E7E7E8] rounded hover:border-[#5878DA] flex items-center px-3 gap-2.5 text-xs text-[#17181A] font-medium hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                        >
                          <span className="text-[#5878DA] font-bold text-sm">♙</span> Add Emergency Contact
                        </button>
                        <button
                          onClick={async () => {
                            const found = await loadProducts();
                            showToast(`Refreshed ${found?.length || 0} stickers`);
                          }}
                          className="w-full h-11 border border-[#E7E7E8] rounded hover:border-[#5878DA] flex items-center px-3 gap-2.5 text-xs text-[#17181A] font-medium hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                        >
                          <span className="text-[#5878DA] font-bold text-sm">▣</span> Sync Safety Stickers
                        </button>
                        <button
                          onClick={() => setModal({ type: 'qrCode', sticker: products[0] })}
                          disabled={!products[0]}
                          className="w-full h-11 border border-[#E7E7E8] rounded hover:border-[#5878DA] flex items-center px-3 gap-2.5 text-xs text-[#17181A] font-medium hover:bg-[#F8FAFC] transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <span className="text-[#5878DA] font-bold text-sm">⚡</span> View QR Plate Code
                        </button>
                        <button
                          onClick={() => setActiveTab('history')}
                          className="w-full h-11 border border-[#E7E7E8] rounded hover:border-[#5878DA] flex items-center px-3 gap-2.5 text-xs text-[#17181A] font-medium hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                        >
                          <span className="text-[#5878DA] font-bold text-sm">▤</span> Scan Logs & Alerts
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Active Stickers */}
                  <div className="bg-white border border-[#EEE] shadow-[0_1px_4px_rgba(0,0,0,0.03)] rounded-lg p-4 flex flex-col justify-between min-h-[360px]">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-xs font-semibold text-[#17181A]">My Safety Stickers ({products.length})</h3>
                        <button onClick={() => loadProducts()} className="text-xs text-[#5275D9] hover:underline cursor-pointer">Refresh</button>
                      </div>

                      {productsLoading ? (
                        <div className="py-12 text-center text-xs text-[#777]">Loading stickers...</div>
                      ) : products.length === 0 ? (
                        <div className="py-12 text-center text-xs text-[#777]">
                          <p className="font-semibold mb-1 text-[#17181A]">No safety stickers linked yet.</p>
                          <p>Verify phone number to fetch stickers.</p>
                        </div>
                      ) : (
                        <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                          {products.slice(0, 4).map((p) => (
                            <div key={p.id} className="p-3 border border-[#E9E9EA] rounded-md bg-[#FAFBFF] flex items-center justify-between gap-2">
                              <div>
                                <p className="font-bold text-xs text-[#17181A]">{p.qrCodeId}</p>
                                <p className="text-[11px] text-[#777] font-medium">{p.nickname || p.vehicleNumber || 'Vehicle Tag'}</p>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => setModal({ type: 'qrCode', sticker: p })}
                                  className="px-2 py-1 bg-[#FFF7DC] border border-[#E0AE00] text-[#4A3900] text-[11px] font-bold rounded cursor-pointer"
                                >
                                  QR
                                </button>
                                <button
                                  onClick={() => setModal({ type: 'editDetails', sticker: p })}
                                  className="px-2 py-1 bg-white border border-[#E5E5E7] text-[#17181A] text-[11px] font-semibold rounded cursor-pointer"
                                >
                                  Edit
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="pt-2 text-xs font-semibold text-[#5275D9] cursor-pointer hover:underline" onClick={() => setActiveTab('overview')}>
                      View all safety stickers ›
                    </div>
                  </div>

                  {/* Card 3: Emergency Responders */}
                  <div className="bg-white border border-[#EEE] shadow-[0_1px_4px_rgba(0,0,0,0.03)] rounded-lg p-4 flex flex-col justify-between min-h-[360px]">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-xs font-semibold text-[#17181A]">Emergency Contacts ({totalContacts})</h3>
                        <button onClick={() => setActiveTab('contacts')} className="text-xs text-[#5275D9] hover:underline cursor-pointer">＋ Contact</button>
                      </div>

                      <div className="space-y-3 mt-4">
                        {products[0]?.contacts?.length ? (
                          products[0].contacts.map((c, i) => (
                            <div key={i} className="flex justify-between items-center text-xs pb-2 border-b border-[#F0F0F2]">
                              <div>
                                <span className="font-bold text-[#17181A] block">{c.name}</span>
                                <span className="text-[11px] text-[#777]">{c.relation || 'Emergency Contact'}</span>
                              </div>
                              <span className="font-mono text-[11px] font-semibold text-[#5878DA]">{c.phone}</span>
                            </div>
                          ))
                        ) : (
                          <div className="py-10 text-center text-xs text-[#777]">
                            <p>No emergency contacts added yet.</p>
                            <button onClick={() => setActiveTab('contacts')} className="text-[#5275D9] font-bold mt-2 hover:underline">Add Emergency Responders</button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="pt-2 text-xs font-semibold text-[#5275D9] cursor-pointer hover:underline" onClick={() => setActiveTab('contacts')}>
                      Manage responder contacts ›
                    </div>
                  </div>

                </div>

                {/* Lower Grid (2 Columns: Scans & Activity Log) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                  <div className="bg-white border border-[#EEE] shadow-[0_1px_4px_rgba(0,0,0,0.03)] rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-xs font-semibold text-[#17181A]">Recent Scans Log ⓘ</h3>
                      <button onClick={() => setActiveTab('history')} className="text-xs text-[#5275D9] hover:underline">Full Log</button>
                    </div>
                    <div className="space-y-2 mt-3">
                      {allHistory.slice(0, 2).map((h, i) => (
                        <div key={i} className="border border-[#E9E9EA] rounded p-2.5 flex items-center gap-3">
                          <div className="border-l-4 border-[#9EACF0] bg-[#FAFBFF] px-2 py-1 text-center text-xs font-bold min-w-[50px]">
                            {new Date(h.created_at).getDate()}
                            <small className="block text-[9px] font-normal uppercase">{new Date(h.created_at).toLocaleDateString('en-US', { month: 'short' })}</small>
                          </div>
                          <div className="text-xs min-w-0 flex-1">
                            <p className="font-semibold text-[#17181A] truncate">{h.stickerCode} scanned</p>
                            <p className="text-[10px] text-[#777]">{h.event_type || 'Vehicle QR Scan Recorded'}</p>
                          </div>
                        </div>
                      ))}
                      {allHistory.length === 0 && (
                        <p className="text-xs text-[#777] py-6 text-center">No scan events recorded recently.</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-white border border-[#EEE] shadow-[0_1px_4px_rgba(0,0,0,0.03)] rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-xs font-semibold text-[#17181A]">Activity Stream ⓘ</h3>
                      <button onClick={() => setActiveTab('history')} className="text-xs text-[#5275D9] hover:underline">View All</button>
                    </div>
                    <div className="space-y-2 mt-3 text-xs">
                      <div className="p-2.5 bg-[#FAFAF9] rounded border border-[#EAEAEC] flex justify-between">
                        <span>▱ &nbsp; Verified Protection Active</span>
                        <span className="text-[#777]">Live</span>
                      </div>
                      <div className="p-2.5 bg-[#FAFAF9] rounded border border-[#EAEAEC] flex justify-between">
                        <span>♙ &nbsp; Responder SMS Notification Ready</span>
                        <span className="text-[#777]">Active</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ════ VIEW: LIVE VISITOR CHAT INBOX ════ */}
            {activeTab === 'chat' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-start flex-wrap gap-4">
                  <div>
                    <h1 className="font-display text-[26px] font-bold text-[#17181C]">
                      Live Visitor Chat Inbox
                    </h1>
                    <p className="text-[13.5px] text-[#777B80] mt-1">
                      Real-time chat threads from visitors scanning your safety stickers
                    </p>
                  </div>
                  <button
                    onClick={loadOwnerSessions}
                    disabled={ownerSessionsLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-[#EAEAEC] text-xs font-bold text-[#17181C] hover:bg-[#FAFAF9] cursor-pointer"
                  >
                    <RefreshCcw size={14} className={ownerSessionsLoading ? 'animate-spin' : ''} /> Refresh Inbox
                  </button>
                </div>

                {ownerSessionsLoading ? (
                  <div className="bg-white border border-[#EEE] rounded-lg p-16 text-center text-[#777]">
                    <Loader2 size={32} className="animate-spin mx-auto mb-2 text-[#5275D9]" />
                    <p className="text-xs font-semibold">Loading live visitor chat sessions...</p>
                  </div>
                ) : ownerSessions.length === 0 ? (
                  <div className="bg-white border border-[#EEE] rounded-lg p-12 text-center text-[#777] space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-[#E8EDFF] text-[#5271D5] mx-auto flex items-center justify-center font-bold">
                      <MessageSquare size={28} />
                    </div>
                    <p className="text-sm font-bold text-[#17181A]">Your inbox is empty</p>
                    <p className="text-xs text-[#777B80] max-w-md mx-auto">
                      When a visitor scans your vehicle's QR plate and sends a message, their live chat thread will appear here so you can reply instantly.
                    </p>
                  </div>
                ) : (
                  <div className="bg-white border border-[#EEE] rounded-lg overflow-hidden divide-y divide-[#EEE]">
                    {ownerSessions.map((sess) => (
                      <div
                        key={sess.id}
                        onClick={() => setSelectedChatSession(sess)}
                        className="p-4 hover:bg-[#FAFBFF] transition-colors flex items-center justify-between gap-4 cursor-pointer"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-[#E8EDFF] text-[#5271D5] flex items-center justify-center font-bold text-sm shrink-0">
                            <MessageCircle size={20} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-sm text-[#17181A] truncate">{sess.customer_name || 'Visitor'}</p>
                              {sess.vehicle_label && (
                                <span className="px-2 py-0.5 rounded bg-[#FAFAF9] border border-[#E5E5E7] text-[10px] font-mono font-semibold text-[#777]">
                                  {sess.vehicle_label}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#777B80] truncate mt-0.5">{sess.last_message_preview || 'No messages yet'}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[11px] text-[#999] font-mono">
                            {sess.last_message_at ? new Date(sess.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                          <button
                            className="mt-1 block text-xs font-bold text-[#5271D5] hover:underline"
                          >
                            Open Chat ›
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}


              </div>
            )}

            {/* ════ VIEW 1B: PRODUCTS (PURCHASE / ORDER HISTORY) ════ */}
            {activeTab === 'products' && (
              <div className="space-y-6">
                <div>
                  <h1 className="font-display text-[26px] font-bold text-[#17181C]">
                    Products
                  </h1>
                  <p className="text-[13.5px] text-[#777B80] mt-1">
                    Your purchase history — every order placed at checkout, with payment status.
                  </p>
                </div>

                {myOrdersLoading ? (
                  <div className="bg-white border border-[#EAEAEC] rounded-[14px] p-16 text-center text-[#9EA0AA]">
                    <Loader2 size={32} className="animate-spin mx-auto mb-2 text-[#F6C000]" />
                    <p className="text-[13.5px] font-semibold text-[#17181C]">Loading your orders...</p>
                  </div>
                ) : myOrdersError ? (
                  <div className="bg-white border border-[#EAEAEC] rounded-[14px] p-16 text-center text-[#9EA0AA]">
                    <AlertTriangle size={32} className="mx-auto mb-2 text-[#DC2626]" />
                    <p className="text-[13.5px] font-semibold text-[#17181C]">{myOrdersError}</p>
                  </div>
                ) : myOrders.length === 0 ? (
                  <div className="bg-white border border-[#EAEAEC] rounded-[14px] p-16 text-center text-[#9EA0AA]">
                    <ShoppingBag size={34} className="mx-auto mb-3 opacity-50 text-[#F6C000]" />
                    <p className="text-[13.5px] text-[#17181C] font-semibold">No orders yet.</p>
                    <p className="text-[12.5px] text-[#9EA0AA] mt-1">Purchases you make on the RapiQR store will show up here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myOrders.map((o) => {
                      const payStatus: string = o.payment?.status || 'created';
                      const payLabel = payStatus === 'paid' ? 'Paid' : payStatus === 'failed' ? 'Payment Failed' : 'Awaiting Payment';
                      const payColor = payStatus === 'paid' ? 'text-[#2E9E5B] bg-[#E9F9EF]' : payStatus === 'failed' ? 'text-[#DC2626] bg-[#FDEAEA]' : 'text-[#B8863F] bg-[#FBF3E4]';
                      const fulfillColor =
                        o.status === 'delivered' ? 'text-[#2E9E5B] bg-[#E9F9EF]' :
                        o.status === 'cancelled' ? 'text-[#DC2626] bg-[#FDEAEA]' :
                        o.status === 'shipped' ? 'text-[#5271D5] bg-[#E8EDFF]' :
                        'text-[#B8863F] bg-[#FBF3E4]';
                      return (
                        <div key={o.id} className="bg-white border border-[#EAEAEC] rounded-[14px] p-5">
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-display font-semibold text-[15px] text-[#17181C]">{o.id}</h3>
                                <span className="text-[11px] text-[#9EA0AA] font-mono">{o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN') : ''}</span>
                              </div>
                              <p className="text-[12.5px] text-[#777B80] mt-0.5 flex items-center gap-1.5">
                                <Package size={13} className="text-[#9EA0AA]" />
                                {(o.items || []).length} item{(o.items || []).length !== 1 ? 's' : ''} · <span className="font-mono">₹{(o.total || 0).toLocaleString('en-IN')}</span>
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2.5 py-1 rounded-[4px] text-[11px] font-bold uppercase tracking-wide ${payColor}`}>{payLabel}</span>
                              <span className={`px-2.5 py-1 rounded-[4px] text-[11px] font-bold uppercase tracking-wide capitalize ${fulfillColor}`}>{o.status}</span>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-[#F3F3F4] divide-y divide-[#F3F3F4]">
                            {(o.items || []).map((it: any, i: number) => (
                              <div key={i} className="flex items-center justify-between py-1.5 text-[13px]">
                                <span className="text-[#17181C]">{it.name} × {it.qty}</span>
                                <span className="font-mono text-[#777B80]">₹{(it.price * it.qty).toLocaleString('en-IN')}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ════ VIEW 2: EMERGENCY CONTACTS ════ */}
            {activeTab === 'contacts' && (
              <EmergencyContactsPanel
                products={products}
                onSaveContacts={handleSaveContacts}
              />
            )}

            {/* ════ VIEW 3: ALERT HISTORY ════ */}
            {activeTab === 'history' && (
              <div className="space-y-6">
                <div>
                  <h1 className="font-display text-[26px] font-bold text-[#17181C]">
                    Alert History
                  </h1>
                  <p className="text-[13.5px] text-[#777B80] mt-1">
                    Log of scan events and responder alerts across your stickers
                  </p>
                </div>

                {allHistoryLoading ? (
                  <div className="bg-white border border-[#EAEAEC] rounded-[14px] p-16 text-center text-[#9EA0AA]">
                    <Loader2 size={32} className="animate-spin mx-auto mb-2 text-[#F6C000]" />
                    <p className="text-[13.5px] font-semibold text-[#17181C]">Fetching alert history...</p>
                  </div>
                ) : allHistory.length === 0 ? (
                  <div className="bg-white border border-[#EAEAEC] rounded-[14px] p-16 text-center text-[#9EA0AA]">
                    <History size={34} className="mx-auto mb-3 opacity-50 text-[#F6C000]" />
                    <p className="text-[13.5px] text-[#17181C] font-semibold">No alert events recorded yet.</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-[14px] border border-[#EAEAEC] overflow-hidden">
                    <table className="w-full text-sm text-[#17181C]">
                      <thead>
                        <tr className="text-left font-display text-[12px] font-semibold text-[#777B80] tracking-normal bg-[#FAFAF9] border-b border-[#EAEAEC]">
                          <th className="px-6 py-3">Sticker</th>
                          <th className="px-3 py-3">Event</th>
                          <th className="px-3 py-3">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EAEAEC]">
                        {allHistory.map((h, i) => (
                          <tr key={i} className="hover:bg-[#FAFAF9]">
                            <td className="px-6 py-3 font-display font-semibold text-[15px]">{h.stickerCode}</td>
                            <td className="px-3 py-3 text-xs">{h.event_type || 'Scan Recorded'}</td>
                            <td className="px-3 py-3 font-mono text-xs text-[#9EA0AA]">{new Date(h.created_at).toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ════ VIEW 4: ACCOUNT SETTINGS ════ */}
            {activeTab === 'settings' && (
              <AccountSettingsPanel showToast={showToast} onProductsLinked={loadProducts} />
            )}

            {/* ════ VIEW 5: SUPPORT & LEGAL ════ */}
            {activeTab === 'support' && (
              <SupportLegalPanel showToast={showToast} />
            )}

          </main>
        </div>
      </div>



      {/* ─── LIVE VISITOR CHAT RIGHT-SIDE DRAWER ─── */}
      {selectedChatSession && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedChatSession(null)}
          />
          <div className="relative z-10 w-full sm:w-[450px] max-w-full h-full bg-white shadow-2xl flex flex-col border-l border-[#EAEAEC] animate-slide-in-right">
            <RepiChat
              mode="owner"
              sessionId={selectedChatSession.id}
              title={`${selectedChatSession.customer_name} (${selectedChatSession.qr_code_id})`}
              subtitle={selectedChatSession.vehicle_label || undefined}
              onClose={() => setSelectedChatSession(null)}
              className="h-full"
            />
          </div>
        </div>
      )}

      {/* ─── MODALS ─── */}
      {modal?.type === 'qrCode' && (
        <QrCodeModal
          sticker={modal.sticker}
          onClose={() => setModal(null)}
          onShowToast={showToast}
        />
      )}
      {modal?.type === 'editDetails' && (
        <EditDetailsModal
          sticker={modal.sticker}
          onClose={() => setModal(null)}
          onSave={(updates) => handleSaveDetails(modal.sticker.id, updates)}
        />
      )}
      {modal?.type === 'editContacts' && (
        <EditContactsModal
          sticker={modal.sticker}
          onClose={() => setModal(null)}
          onSave={(contacts) => handleSaveContacts(modal.sticker.id, contacts)}
        />
      )}

      {showCompleteProfilePopup && (
        <CompleteProfilePopup
          missingPhone={missingPhone}
          missingEmail={missingEmail}
          onDismiss={() => setProfilePopupDismissed(true)}
          onGoToSettings={() => {
            setActiveTab('settings');
            setProfilePopupDismissed(true);
          }}
          onProductsLinked={loadProducts}
        />
      )}

      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-[120] bg-[#17181C] text-white px-4 py-2.5 rounded-[9px] shadow-lg font-mono text-[13px] border border-[#F6C000]">
          {toastMsg}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { dashboardTranslations } from '../i18n/dashboardTranslations';
import LanguageSwitcher from './common/LanguageSwitcher';
import { FlowButton } from './ui/flow-button';
import { ActivityDropdown } from './ui/activity-dropdown';
import { getCategoryIcon, getCategoryLabel } from '../stickerModules';
import {
  Bell,
  ShieldCheck,
  LogOut,
  Eye,
  Search,
  LayoutDashboard,
  Trash2,
  Loader2,
  Users2,
  Contact2,
  SlidersHorizontal,
  HelpCircle,
  X,
  Share2,
  ShoppingBag,
  PackageCheck,
  Pencil,
  ArrowRightLeft,
  Power,
  RefreshCw,
  Sparkles,
  QrCode,
  Tag,
  Plus,
  AlertTriangle,
  Smartphone,
  CheckCircle2,
  ArrowRight,
  MessageSquareText,
  MessageCircle,
  Package,
  Zap,
  Wallet,
  Globe,
  PanelLeftClose,
  PanelLeftOpen,
  BellRing,
  ShieldAlert,
  ChevronRight,
  Clock,
  MapPin,
  Flame,
  ArrowUpRight,
  Truck,
} from 'lucide-react';
import { DEFAULT_PRODUCTS, mapApiShopProduct, type ProductItem } from '../data/products';

import type { DashboardSticker } from './dashboard/client/types';
import PhoneVerificationCard from './auth/PhoneVerificationCard';
import { mapProductRow } from './dashboard/client/types';
import { QrCodeModal, EditDetailsModal, EditContactsModal, TransferModal, ScanHistoryModal, ConfirmActionModal, RecoverStickerModal } from './dashboard/client/StickerModals';
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
import { sendMsg91Otp, verifyMsg91Otp, toMsg91Identifier } from '../lib/msg91Widget';
import { stickerRef, useCodesRevealed } from '../lib/codeVisibility';
import { CodeVisibilityToggleButton } from './dashboard/admin/StickerCodeComponents';

async function getProductsFromDb(opts: { sync?: boolean } = {}): Promise<any[]> {
  try {
    const res = await apiClient.products.list(opts);
    return res.data || [];
  } catch (err) {
    console.warn('Failed to fetch products:', err);
    return [];
  }
}

async function updateProductDetailsInDb(productId: string, updates: Record<string, any>): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const res = await apiClient.products.updateDetails(productId, updates);
    return { success: true, data: res.data || null };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update sticker details' };
  }
}

async function updateProductContactsInDb(productId: string, contacts: { name: string; phone: string }[]): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const res = await apiClient.products.updateContacts(productId, contacts);
    return { success: true, data: res.data || null };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to save contacts' };
  }
}

async function setProductStatusInDb(productId: string, active: boolean): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const res = active ? await apiClient.products.reactivate(productId) : await apiClient.products.deactivate(productId);
    return { success: true, data: res.data || null };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update status' };
  }
}

async function transferProductInDb(productId: string, targetEmail: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const res = await apiClient.products.transfer(productId, targetEmail);
    return { success: true, data: res.data };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to transfer sticker' };
  }
}

async function deleteProductFromDb(productId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await apiClient.products.remove(productId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete sticker' };
  }
}

async function recoverStickerInDb(stickerId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await apiClient.products.recover(stickerId);
    if (!res?.success) {
      return { success: false, error: res?.error || "No sticker found with that ID, or it isn't linked to your account." };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Recovery failed. Please try again.' };
  }
}

async function getProductHistoryFromDb(productId: string): Promise<any[]> {
  try {
    const res = await apiClient.products.getHistory(productId);
    return res.data || [];
  } catch (err) {
    console.warn('Failed to fetch sticker history:', err);
    return [];
  }
}

async function getAllHistoryFromDb(): Promise<any[]> {
  try {
    const res = await apiClient.products.getAllHistory();
    return res.data || [];
  } catch (err) {
    console.warn('Failed to fetch sticker history:', err);
    return [];
  }
}

interface ClientDashboardProps {
  onBack: () => void;
  onPurchaseSticker?: () => void;
  switchToDistributor?: () => void;
}

type TabId = 'setup' | 'overview' | 'products' | 'chat' | 'contacts' | 'history' | 'settings' | 'support';

// `section` groups the flat list in the sidebar (a small uppercase label
// renders above each run of items sharing a section); items with no
// `section` render ungrouped at the top, above every labeled group.
function buildNavItems(t: typeof dashboardTranslations['en']['client']): {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  section?: string;
}[] {
  return [
    { id: 'overview', label: t.nav.overview, icon: LayoutDashboard },
    { id: 'chat', label: t.nav.chat, icon: MessageSquareText },
    { id: 'setup', label: t.nav.setup, icon: Sparkles, section: t.navSections.myTag },
    { id: 'products', label: t.nav.products, icon: PackageCheck, section: t.navSections.myTag },
    { id: 'contacts', label: t.nav.contacts, icon: Contact2, section: t.navSections.communication },
    { id: 'history', label: t.nav.history, icon: BellRing, section: t.navSections.communication },
    { id: 'settings', label: t.nav.settings, icon: SlidersHorizontal, section: t.navSections.account },
    { id: 'support', label: t.nav.support, icon: HelpCircle, section: t.navSections.account },
  ];
}

/**
 * The customer-facing view of an order's four fulfillment states. `cancelled`
 * has no place on a progress line, so those cards skip the stepper entirely.
 */

type ModalState =
  | { type: 'editDetails'; sticker: DashboardSticker }
  | { type: 'editContacts'; sticker: DashboardSticker }
  | { type: 'transfer'; sticker: DashboardSticker }
  | { type: 'history'; sticker: DashboardSticker }
  | { type: 'deactivate'; sticker: DashboardSticker }
  | { type: 'reactivate'; sticker: DashboardSticker }
  | { type: 'delete'; sticker: DashboardSticker }
  | { type: 'qrCode'; sticker: DashboardSticker }
  | { type: 'recover'; prefillId?: string }
  | null;

export default function ClientDashboard({ onBack, onPurchaseSticker }: ClientDashboardProps) {
  const { profile, signOut, sendPhoneOtp, verifyPhoneOtp, chatLinkNotice } = useAuth();
  const { language } = useLanguage();
  const t = dashboardTranslations[language].client;
  const NAV_ITEMS = buildNavItems(t);
  // The admin account never links stickers by phone — the fleet console already sees
  // every sticker. Prompting it to verify a number only put the admin in competition
  // with the real owner for the stickers registered under that number.
  const isAdminAccount = profile?.role === 'admin';

  // Testing-only escape hatch: lets a zero-sticker account preview the full
  // dashboard shell (sidebar/tabs, empty stickers list) without buying one first.
  const [skipPurchaseGate, setSkipPurchaseGate] = useState(false);

  const handlePurchaseStickerClick = () => {
    if (onPurchaseSticker) {
      onPurchaseSticker();
      return;
    }
    onBack();
  };

  // Pre-purchase shop's "Buy this sticker" — merges into the same cart the
  // public shop writes to, so checkout (and the shared 'namoqr-cart'/
  // 'repiqr-cart' keys) sees it exactly like a landing-page purchase would.
  const handleBuyProduct = (product: ProductItem) => {
    try {
      const raw = localStorage.getItem('namoqr-cart') || localStorage.getItem('repiqr-cart');
      const existingCart: { product: ProductItem; qty: number }[] = raw ? JSON.parse(raw) : [];
      const already = existingCart.find((item) => item.product.id === product.id);
      const updatedCart = already
        ? existingCart.map((item) => (item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item))
        : [...existingCart, { product, qty: 1 }];
      localStorage.setItem('repiqr-cart', JSON.stringify(updatedCart));
      localStorage.setItem('namoqr-cart', JSON.stringify(updatedCart));
    } catch {
      /* ignore */
    }
    handlePurchaseStickerClick();
  };

  // Shop products catalog (displayed in Products tab and pre-purchase gate)
  const [shopProducts, setShopProducts] = useState<ProductItem[]>(DEFAULT_PRODUCTS);
  const [shopProductsLoading, setShopProductsLoading] = useState(false);
  const [productViewTab, setProductViewTab] = useState<'catalog' | 'orders'>('catalog');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'placed' | 'shipped' | 'delivered' | 'cancelled'>('all');

  const loadShopProducts = useCallback(async () => {
    setShopProductsLoading(true);
    try {
      const res = await apiClient.shopProducts.list();
      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        setShopProducts(res.data.map(mapApiShopProduct));
      }
    } catch {
      /* keep built-in fallback */
    } finally {
      setShopProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShopProducts();
  }, [loadShopProducts]);

  // Sidebar collapsible state with localStorage persistence
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('rapiqr-sidebar-collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('rapiqr-sidebar-collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // ─── DASHBOARD PREPARATION SPLASH ANIMATION (Shopify Minimal Clean Look) ───
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
      if (!res.success) {
        setLinkingLoading(false);
        setLinkingMessage({ type: 'error', text: res.error || 'Failed to send OTP.' });
        return;
      }

      // Pre-check passed — the MSG91 widget actually sends the OTP.
      await sendMsg91Otp(toMsg91Identifier(linkingPhone));
      setLinkingLoading(false);
      setOtpStep('otp');
      showToast(`Verification code sent to ${linkingPhone}`);
      setLinkingMessage({ type: 'success', text: `Verification code sent to ${linkingPhone}. Enter OTP to claim your stickers.` });
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
      const accessToken = await verifyMsg91Otp(otpCode.trim());
      const res = await verifyPhoneOtp(accessToken);
      setLinkingLoading(false);
      if (res.success) {
        setIsPreparing(true);
        // verifyPhoneOtp already wrote the verified number to the profile and ran the
        // server-side claim. The updatePhoneNumber() call that used to sit here re-sent
        // the number through the unverified PATCH path and re-triggered claiming.
        const claimed = await loadProducts({ sync: true });
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

  const missingPhone = false;
  const missingEmail = false;

  // Shows the "MANDATORY PHONE VERIFICATION" banner below until the account
  // actually has a verified phone, or the visitor explicitly dismisses it —
  // this used to default to true (dismissed), which let anyone open the
  // dashboard with an unverified phone and never see the prompt at all.
  const [profilePopupDismissed, setProfilePopupDismissed] = useState(false);

  // Automatically remember when profile has phone number so it is never prompted again
  useEffect(() => {
    if (profile?.phoneNumber) {
      try {
        localStorage.setItem('rapiqr-phone-number-filled', 'true');
        localStorage.setItem('rapiqr-phone-asked-once', 'true');
      } catch {
        // Ignore storage errors
      }
    }
  }, [profile?.phoneNumber]);

  const handleDismissProfilePopup = () => {
    setProfilePopupDismissed(true);
    try {
      localStorage.setItem('rapiqr-phone-asked-once', 'true');
      localStorage.setItem('rapiqr-phone-number-filled', 'true');
    } catch {
      // Ignore storage errors
    }
  };

  const showCompleteProfilePopup = false;


  const [activeTab, setActiveTab] = useState<TabId>(() => {
    try {
      const hash = window.location.hash || window.location.search;
      if (hash.includes('tab=chat')) return 'chat';
      if (hash.includes('tab=products')) return 'products';
      if (hash.includes('tab=settings')) return 'settings';
      const saved = localStorage.getItem('repiqr-client-active-tab') || localStorage.getItem('namoqr-client-active-tab');
      // 'chat' is never restored from storage: a reload lands on the sticker
      // list, and chat opens only from an explicit tab=chat link or a click.
      if (saved && ['setup', 'overview', 'products', 'contacts', 'history', 'settings', 'support'].includes(saved)) {
        return saved as TabId;
      }
    } catch { /* fallback */ }
    return 'overview';
  });

  useEffect(() => {
    try {
      localStorage.setItem('repiqr-client-active-tab', activeTab);
    } catch { /* fallback */ }

    const tabTitles: Record<string, string> = {
      overview: 'RepiQR - Dashboard',
      products: 'RepiQR - Products & Orders',
      contacts: 'RepiQR - Emergency Contacts',
      history: 'RepiQR - Alerts & Scan History',
      chat: 'RepiQR - Live Visitor Chat',
      settings: 'RepiQR - Account Settings',
      support: 'RepiQR - Support & Help',
    };
    document.title = tabTitles[activeTab] || 'RepiQR - Dashboard';
  }, [activeTab]);

  const [products, setProducts] = useState<DashboardSticker[]>([]);
  const [codesRevealed, setCodesRevealed] = useCodesRevealed();
  const [productsLoading, setProductsLoading] = useState(true);

  // Stickers that used to be in the list and silently disappeared (admin
  // deleted it, or this account deleted it from another device/session).
  // Deletion is a soft-delete server-side (see QrModel.delete /
  // ProductController.remove), and since it's still linked to this account
  // (user_id survives a soft-delete), the "Recover" button next to each of
  // these brings it back with just its ID — no code needed, see
  // QrModel.restoreOwnedByUser.
  const [removedStickers, setRemovedStickers] = useState<{ id: string; qrCodeId: string; nickname: string }[]>([]);
  const [recoveringId, setRecoveringId] = useState<string | null>(null);

  // Last time /products was fetched, and whether a fetch is in flight — lets the
  // focus/visibility refresh below skip redundant calls.
  const productsFetchedAtRef = useRef(0);
  const productsInFlightRef = useRef(false);

  // `sync` is for user-driven reloads (the Refresh button, right after phone
  // verification or linking): it forces the server to re-run sticker
  // auto-claiming, which it otherwise throttles. Automatic reloads (first load,
  // tab refocus) leave it off.
  const loadProducts = useCallback(async (opts: { sync?: boolean } = {}) => {
    productsInFlightRef.current = true;
    // Only show the loading state on the first fetch; background refreshes stay silent.
    if (productsFetchedAtRef.current === 0) setProductsLoading(true);
    try {
      const rows = await getProductsFromDb({ sync: opts.sync });
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
      productsFetchedAtRef.current = Date.now();
      productsInFlightRef.current = false;
      setProductsLoading(false);
    }
  }, [profile?.id, profile?.phoneNumber]);

  const dismissRemovedSticker = (id: string) => {
    setRemovedStickers((prev) => prev.filter((s) => s.id !== id));
  };

  useEffect(() => {
    if (!profile) return;
    loadProducts();
    // No interval polling: a timer hit /products every few seconds for the whole
    // session. Admin-side deletions still sync — re-fetch when the user comes
    // back to the tab, at most once a minute.
    const MIN_GAP_MS = 60_000;
    const refreshIfStale = () => {
      if (document.visibilityState !== 'visible' || productsInFlightRef.current) return;
      if (Date.now() - productsFetchedAtRef.current < MIN_GAP_MS) return;
      loadProducts();
    };
    document.addEventListener('visibilitychange', refreshIfStale);
    window.addEventListener('focus', refreshIfStale);
    return () => {
      document.removeEventListener('visibilitychange', refreshIfStale);
      window.removeEventListener('focus', refreshIfStale);
    };
  }, [profile?.id, profile?.phoneNumber, loadProducts]);

  const [drawerProductId, setDrawerProductId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }, []);

  // A chat link that couldn't sign in (expired, or another account) is reported once here.
  useEffect(() => {
    if (chatLinkNotice) showToast(chatLinkNotice);
  }, [chatLinkNotice, showToast]);

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

  // A 404 from any per-sticker action means it was soft-deleted out from under
  // the client — by an admin, or by this account elsewhere — see QrModel.delete.
  // Surface that distinctly (with a Recover path) instead of a generic failure toast.
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
    const res = await setProductStatusInDb(sticker.id, active);
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

  const handleRecoverSticker = async (stickerId: string) => {
    const res = await recoverStickerInDb(stickerId);
    if (res.success) {
      setRemovedStickers((prev) => prev.filter((s) => s.qrCodeId.toLowerCase() !== stickerId.trim().toLowerCase() && s.id.toLowerCase() !== stickerId.trim().toLowerCase()));
      setModal(null);
      showToast('Sticker recovered — reloading your stickers…');
      await loadProducts();
    }
    return res;
  };

  // One-click recover for a sticker already listed in removedStickers — its
  // ID is already known, so there's nothing for a modal to collect.
  const handleQuickRecover = async (qrCodeId: string) => {
    setRecoveringId(qrCodeId);
    const res = await handleRecoverSticker(qrCodeId);
    setRecoveringId(null);
    if (!res.success) {
      showToast(res.error || 'Recovery failed. Please try again.');
    }
  };

  const handleConfirmDelete = async (sticker: DashboardSticker) => {
    setModalBusy(true);
    const res = await deleteProductFromDb(sticker.id);
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
  const [historySearch, setHistorySearch] = useState('');

  // ─── PRODUCTS TAB: PURCHASE / ORDER HISTORY (checkout orders, not stickers) ───
  // Fetched as soon as the profile is known (not just when the Products tab is
  // opened): the pre-purchase gate below needs to know about a paid order
  // BEFORE it decides whether to show the "buy a sticker" screen — a customer
  // who already paid at checkout must never be told to purchase again just
  // because their sticker hasn't been claimed to their account yet.
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [myOrdersLoading, setMyOrdersLoading] = useState(true);
  const [myOrdersError, setMyOrdersError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.id) return;
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
  }, [profile?.id]);

  // Balance = every checkout top-up Razorpay has marked paid. Stickers are
  // free, so a paid order's total is exactly what was added to the balance.
  const balance = myOrders
    .filter((o) => o?.payment?.status === 'paid')
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  // ─── DELIVERY TRACKING (per order, fetched on demand) ───
  // Expanding a card asks the server for live courier tracking; the server folds
  // the result back onto the order, so what's shown here is also what the admin
  // console sees. Kept per-order so opening one card doesn't clear another.
  const [trackOpen, setTrackOpen] = useState<Record<string, boolean>>({});
  const [trackData, setTrackData] = useState<Record<string, any>>({});
  const [trackLoading, setTrackLoading] = useState<Record<string, boolean>>({});
  const [trackError, setTrackError] = useState<Record<string, string>>({});

  const handleTrackOrder = useCallback(async (orderId: string) => {
    const isOpen = trackOpen[orderId];
    setTrackOpen((prev) => ({ ...prev, [orderId]: !isOpen }));
    if (isOpen) return;

    setTrackLoading((prev) => ({ ...prev, [orderId]: true }));
    setTrackError((prev) => ({ ...prev, [orderId]: '' }));
    try {
      const res = await apiClient.orders.track(orderId);
      if (res?.success && res.data) {
        setTrackData((prev) => ({ ...prev, [orderId]: res.data }));
        // The refresh may have advanced the fulfillment status — keep the card's
        // badge in step rather than showing a stale one above fresh tracking.
        setMyOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: res.data.status, shiprocket: res.data.shiprocket } : o)));
      } else {
        setTrackError((prev) => ({ ...prev, [orderId]: 'No tracking available yet.' }));
      }
    } catch (err: any) {
      setTrackError((prev) => ({ ...prev, [orderId]: err?.message || 'Could not fetch tracking right now.' }));
    } finally {
      setTrackLoading((prev) => ({ ...prev, [orderId]: false }));
    }
  }, [trackOpen]);

  // ─── LIVE VISITOR CHAT SESSIONS STATE ───
  const [ownerSessions, setOwnerSessions] = useState<ChatSession[]>([]);
  const [ownerSessionsLoading, setOwnerSessionsLoading] = useState(false);
  const [selectedChatSession, setSelectedChatSession] = useState<ChatSession | null>(null);
  const [chatSearch, setChatSearch] = useState('');
  const [chatFilter, setChatFilter] = useState<'all' | 'unread'>('all');

  // Opening a thread is explicit only. The full-screen chat overlay is never
  // restored on load, so the dashboard always lands on the sticker list first.
  const openChatSession = useCallback((session: ChatSession | null) => {
    setSelectedChatSession(session);
  }, []);

  // A WhatsApp/push alert link carries `&session=<id>` so it opens straight
  // into that visitor's thread instead of dumping the owner on the inbox list
  // to search for it themselves.
  const deepLinkedSessionIdRef = useRef<string | null>(null);
  const getDeepLinkedSessionId = () => {
    const raw = window.location.hash || window.location.search;
    const match = raw.match(/[?&]session=([^&]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  };

  // A deep-linked id can only be matched once the sessions arrive. Only a
  // given deep link is applied once, so it doesn't fight the owner manually
  // switching threads afterwards.
  useEffect(() => {
    if (ownerSessions.length === 0) return;

    const deepLinked = getDeepLinkedSessionId();
    if (deepLinked && deepLinked !== deepLinkedSessionIdRef.current) {
      deepLinkedSessionIdRef.current = deepLinked;
      const match = ownerSessions.find((s) => s.id === deepLinked);
      if (match) {
        setActiveTab('chat');
        openChatSession(match);
      }
    }
  }, [ownerSessions]);

  const totalUnreadChats = ownerSessions.reduce((sum, s) => sum + (s.unread_owner_count || 0), 0);
  // Newest few threads for the Overview's "Latest chat" card.
  const latestSessions = [...ownerSessions]
    .sort((a, b) => new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime())
    .slice(0, 3);

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

  const handleDeleteChatSession = async (e: React.MouseEvent, sessId: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this chat conversation?')) return;
    try {
      const res = await apiClient.chat.deleteSession(sessId);
      if (res?.success) {
        setOwnerSessions((prev) => prev.filter((s) => s.id !== sessId));
        if (selectedChatSession?.id === sessId) openChatSession(null);
        showToast('Chat conversation deleted');
      } else {
        showToast(res?.message || 'Failed to delete chat');
      }
    } catch {
      showToast('Failed to delete chat');
    }
  };

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
        soundNotification.notifyIncomingMessage({
          id: msg.id,
          threadId: msg.session_id,
          title: 'New Visitor Message',
          body: msg.body ? (msg.body.length > 50 ? `${msg.body.slice(0, 50)}…` : msg.body) : 'A visitor sent a message.',
        });
        showToast(`💬 Visitor: ${msg.body ? (msg.body.length > 40 ? `${msg.body.slice(0, 40)}…` : msg.body) : 'New message'}`);
        loadOwnerSessions();
      }
    };

    socket.on('new_message', onNewMessage);
    socket.on('inbox_updated', loadOwnerSessions);

    return () => {
      window.removeEventListener('hashchange', handleHash);
      socket.off('new_message', onNewMessage);
      socket.off('inbox_updated', loadOwnerSessions);
    };
  }, [loadOwnerSessions, showToast]);

  // Overview's "Recent Scans" card reads the same feed as the History tab, so both
  // load it — before, only History did, and Overview claimed "No scans recorded"
  // until the owner happened to open History once.
  // Alert history — cached with ref so switching tabs only calls backend ONCE!
  const hasFetchedHistoryRef = useRef(false);

  const fetchAlertHistory = useCallback(async (force = false) => {
    if (!force && hasFetchedHistoryRef.current) return;
    setAllHistoryLoading(true);
    try {
      const rows = await getAllHistoryFromDb();
      const byId = new Map<string, DashboardSticker>(products.map((p) => [p.id, p] as const));
      const merged = (Array.isArray(rows) ? rows : [])
        .map((r: any) => {
          const p = byId.get(r.sticker_id);
          return {
            ...r,
            stickerNickname: p?.nickname || r.stickerNickname || r.sticker_nickname || 'Vehicle Tag',
            stickerVehicle: p?.vehicleNumber || r.stickerVehicle || r.sticker_vehicle,
            stickerCode: p?.qrCodeId || r.stickerCode || r.sticker_code || r.sticker_id || 'QR Tag',
          };
        })
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setAllHistory(merged);
      hasFetchedHistoryRef.current = true;
    } catch (err) {
      console.warn('Failed to load alert history:', err);
    } finally {
      setAllHistoryLoading(false);
    }
  }, [products]);

  useEffect(() => {
    const needsHistory = activeTab === 'history' || activeTab === 'overview';
    if (!needsHistory) return;
    fetchAlertHistory(false);
  }, [activeTab, fetchAlertHistory]);

  const activeProduct = drawerProductId ? products.find((p) => p.id === drawerProductId) || null : null;
  const activeCount = products.filter((p) => p.status === 'Active').length;
  const totalScans = products.reduce((s, p) => s + (p.scans || 0), 0);
  const totalContacts = products.reduce((s, p) => s + (p.contacts?.length || 0), 0);

  const isPhoneComplete = isAdminAccount || Boolean(profile?.isPhoneVerified && profile?.phoneNumber);
  const isContactsComplete = totalContacts > 0;
  const isStickersComplete = activeCount > 0;
  const completedSetupCount = [isPhoneComplete, isContactsComplete, isStickersComplete].filter(Boolean).length;
  const setupPercent = Math.round((completedSetupCount / 3) * 100);

  // ─── DASHBOARD PREPARATION SPLASH LOADING ANIMATION (Vercel-style full-screen) ───
  if (isPreparing) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black px-6 text-center font-body select-none">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          {t.splash.heading}
        </h2>
        <p className="mt-4 text-sm sm:text-base text-neutral-400">
          {t.splash.line1}
          <br />
          {t.splash.line2}
        </p>
        <Loader2 size={28} className="mt-8 animate-spin text-neutral-500" strokeWidth={2} />
      </div>
    );
  }

  // ─── PRE-PURCHASE GATE ───
  // A signed-in user with zero stickers AND no order on record has nothing
  // for the dashboard to manage yet. Rather than build/show the full
  // sidebar+tabs dashboard shell around an empty state, show only a minimal
  // "you're logged in" header and a full-page shop — the real dashboard is
  // created the moment they own a sticker (loadProducts() finding one flips
  // products.length > 0). Admin accounts previewing the client dashboard skip
  // this gate entirely.
  //
  // A PAID order also skips the gate even with zero claimed stickers yet —
  // the sticker was auto-minted at checkout (see
  // OrderModel.generateStickersForOrder) but only gets claimed onto this
  // account once its phone is OTP-verified (see ProductController.getMyProducts);
  // a buyer who just paid must never be told to "purchase a sticker" again in
  // the gap before that verification happens.
  const hasPaidOrder = myOrders.some((o) => o?.payment?.status === 'paid');
  if (!isAdminAccount && !productsLoading && !myOrdersLoading && products.length === 0 && !hasPaidOrder && !skipPurchaseGate) {
    return (
      <div className="fx-shell min-h-screen w-full bg-[var(--fx-canvas)] text-[var(--fx-ink)] font-body">
        <header className="flex items-center justify-between border-b border-[var(--fx-border)] bg-white px-5 py-4 sm:px-8">
          <button onClick={onBack} className="flex items-center gap-2 cursor-pointer">
            <AppLogo variant="light" className="h-8 w-auto object-contain" />
          </button>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <span className="hidden text-xs font-medium text-[var(--fx-ink-2)] sm:inline">
              {t.gate.loggedInAs}{' '}
              <span className="font-semibold text-[var(--fx-ink)]">
                {profile?.fullName || profile?.email || t.gate.you}
              </span>
            </span>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--fx-border)] px-3 py-2 text-xs font-semibold text-[var(--fx-ink-2)] hover:bg-[var(--fx-canvas)] cursor-pointer"
            >
              <LogOut size={14} /> {t.gate.logOut}
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
          <div className="mb-10 text-center">

            <h1 className="text-2xl font-black tracking-tight text-[var(--fx-ink)] sm:text-3xl">
              {t.gate.heading}
            </h1>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              <button
                onClick={() => setModal({ type: 'recover' })}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--fx-accent)] hover:underline cursor-pointer"
              >
                <QrCode size={20} /> {t.gate.recoverLink}
              </button>

              {/* Testing-only: preview the full dashboard without buying a sticker first. */}
              <button
                onClick={() => setSkipPurchaseGate(true)}
                className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--fx-ink-2)] hover:underline cursor-pointer"
              >
                {t.gate.skip}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {shopProducts.map((product) => (
              <div
                key={product.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-[var(--fx-border)] bg-white shadow-sm"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img src={product.img} alt={product.name} className="h-full w-full object-cover" />
                  <span className="absolute left-3 top-3 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
                    {product.badge}
                  </span>
                </div>
                <div className="flex flex-1 flex-col justify-between p-4">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--fx-ink)]">{product.name}</h3>
                    <p className="mt-1.5 text-xs text-[var(--fx-ink-2)]">{product.desc}</p>
                  </div>
                  <button
                    onClick={() => handleBuyProduct(product)}
                    className="mt-4 flex items-center justify-center gap-1.5 rounded-lg bg-[var(--fx-ink)] py-2.5 text-xs font-bold text-white hover:opacity-90 cursor-pointer"
                  >
                    {t.gate.getFreePrefix} <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {modal?.type === 'recover' && (
          <RecoverStickerModal
            prefillId={modal.prefillId}
            onClose={() => setModal(null)}
            onRecover={handleRecoverSticker}
          />
        )}

        {toastMsg && (
          <div className="fixed bottom-6 right-6 z-[120] rounded-[9px] border border-[var(--fx-accent)] bg-[var(--fx-ink)] px-4 py-2.5 font-mono text-[13px] text-white shadow-lg">
            {toastMsg}
          </div>
        )}
      </div>
    );
  }

  // ─── CHAT INBOX: conversation list beside the open thread ───
  const chatQuery = chatSearch.trim().toLowerCase();
  const visibleSessions = ownerSessions
    .filter((s) => chatFilter !== 'unread' || (s.unread_owner_count || 0) > 0)
    .filter((s) => !chatQuery || [s.customer_name, s.vehicle_label, s.last_message_preview].some((v) => (v || '').toLowerCase().includes(chatQuery)))
    .sort((a, b) => new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime());

  const renderChatInbox = () => (
    <div className="flex min-h-0 flex-1">
      <section className={`${selectedChatSession ? 'hidden md:flex' : 'flex'} w-full shrink-0 flex-col border-r border-[var(--fx-border)] bg-white md:w-[340px]`}>
        <div className="flex items-center justify-between px-4 pb-2 pt-4">
          <h1 className="font-display text-[20px] font-bold text-[var(--fx-ink)]">{t.chatInbox.title}</h1>
          <button
            type="button"
            onClick={loadOwnerSessions}
            disabled={ownerSessionsLoading}
            aria-label="Refresh chats"
            title="Refresh chats"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--fx-ink-2)] hover:bg-[var(--fx-canvas)] cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={16} className={ownerSessionsLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="px-4 pb-3">
          <label className="flex h-9 items-center gap-2 rounded-xl bg-[var(--fx-canvas)] px-3">
            <Search size={15} className="text-[var(--fx-faint)]" />
            <input
              value={chatSearch}
              onChange={(e) => setChatSearch(e.target.value)}
              placeholder={t.chatInbox.searchPlaceholder}
              className="w-full bg-transparent text-xs text-[var(--fx-ink)] outline-none placeholder:text-[var(--fx-faint)]"
            />
          </label>
          <div className="mt-2.5 flex gap-2">
            {(['all', 'unread'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setChatFilter(f)}
                className={`h-7 rounded-full px-3 text-xs font-semibold cursor-pointer transition-colors ${
                  chatFilter === f
                    ? 'bg-[var(--fx-accent-soft)] text-[var(--fx-accent)]'
                    : 'border border-[var(--fx-border)] text-[var(--fx-ink-2)] hover:bg-[var(--fx-canvas)]'
                }`}
              >
                {f === 'all' ? t.chatInbox.all : t.chatInbox.unread}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {ownerSessionsLoading ? (
            <div className="py-10 text-center text-xs text-[var(--fx-ink-2)]">{t.chatInbox.loadingChats}</div>
          ) : visibleSessions.length === 0 ? (
            <div className="px-6 py-10 text-center text-xs text-[var(--fx-ink-2)]">
              {ownerSessions.length === 0 ? t.chatInbox.emptyInbox : t.chatInbox.noMatches}
            </div>
          ) : (
            visibleSessions.map((sess) => {
              const selected = selectedChatSession?.id === sess.id;
              const unread = sess.unread_owner_count || 0;
              const name = sess.customer_name || t.chatInbox.visitor;
              return (
                <div
                  key={sess.id}
                  className={`group flex items-center ${selected ? 'bg-[var(--fx-accent-soft)]' : 'hover:bg-[var(--fx-canvas)]'}`}
                >
                  <button
                    type="button"
                    onClick={() => openChatSession(sess)}
                    className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left cursor-pointer"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--fx-accent-soft)] text-sm font-bold text-[var(--fx-accent)]">
                      {name.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-[13.5px] font-bold text-[var(--fx-ink)]">{name}</span>
                        <span className="shrink-0 font-mono text-[11px] text-[var(--fx-faint)]">
                          {sess.last_message_at ? new Date(sess.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </span>
                      <span className="mt-0.5 flex items-center justify-between gap-2">
                        <span className="truncate text-xs text-[var(--fx-ink-2)]">{sess.last_message_preview || t.chatInbox.noMessagesYet}</span>
                        {unread > 0 && (
                          <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-[var(--fx-accent)] px-1.5 text-[10px] font-bold text-white">
                            {unread}
                          </span>
                        )}
                      </span>
                      {sess.vehicle_label && (
                        <span className="mt-0.5 block truncate text-[11px] font-medium text-[var(--fx-faint)]">{sess.vehicle_label}</span>
                      )}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteChatSession(e, sess.id)}
                    title={t.chatInbox.deleteConversation}
                    aria-label={t.chatInbox.deleteConversation}
                    className="mr-2 hidden h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--fx-faint)] hover:bg-[#FEE2E2] hover:text-[#DC2626] group-hover:flex cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className={`${selectedChatSession ? 'flex' : 'hidden md:flex'} min-w-0 flex-1 flex-col bg-[var(--fx-canvas)]`}>
        {selectedChatSession ? (
          <RepiChat
            key={selectedChatSession.id}
            mode="owner"
            sessionId={selectedChatSession.id}
            title={selectedChatSession.customer_name}
            subtitle={[selectedChatSession.vehicle_label, selectedChatSession.qr_code_id].filter(Boolean).join(' · ') || undefined}
            onClose={() => openChatSession(null)}
            className="h-full"
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-[var(--fx-ink-2)]">
            <MessageSquareText size={28} className="text-[var(--fx-faint)]" />
            <p className="text-xs font-semibold">{t.chatInbox.selectChat}</p>
          </div>
        )}
      </section>
    </div>
  );

  return (
    <div className="fx-shell flex h-screen w-full overflow-hidden text-[var(--fx-ink)] bg-[var(--fx-canvas)] font-body">

      <div className="flex min-h-0 min-w-0 flex-1">
        {/* ─── COLLAPSIBLE SIDEBAR: expandable / collapsible navigation ─── */}
        <nav
          aria-label="Dashboard sections"
          className={`flex shrink-0 flex-col border-r border-[var(--fx-border)] bg-white transition-[width] duration-300 ease-in-out z-30 ${
            isSidebarCollapsed ? 'w-[68px]' : 'w-[245px]'
          }`}
        >
          {/* Header Branding */}
          <div className="flex h-[62px] shrink-0 items-center justify-between border-b border-[var(--fx-border)] px-3.5">
            {isSidebarCollapsed ? (
              <button
                type="button"
                onClick={onBack}
                aria-label={t.chrome.home}
                title={t.chrome.home}
                className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--fx-ink)] text-sm font-black text-white cursor-pointer"
              >
                R
              </button>
            ) : (
              <>
                <button onClick={onBack} className="flex items-center gap-2 cursor-pointer text-left">
                  <AppLogo variant="light" className="h-7 w-auto object-contain" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--fx-accent)] bg-[var(--fx-accent-soft)] px-1.5 py-0.5 rounded">
                    {t.chrome.clientBadge}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={toggleSidebar}
                  title={t.chrome.collapseSidebar}
                  aria-label={t.chrome.collapseSidebar}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--fx-ink-2)] hover:text-[var(--fx-ink)] hover:bg-[var(--fx-canvas)] cursor-pointer transition-colors"
                >
                  <PanelLeftClose size={16} />
                </button>
              </>
            )}
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
            {NAV_ITEMS.map((item, idx) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              const showSectionHeader = !isSidebarCollapsed && item.section && (idx === 0 || NAV_ITEMS[idx - 1]?.section !== item.section);

              return (
                <React.Fragment key={item.id}>
                  {showSectionHeader && (
                    <div className="px-3 pt-3.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--fx-faint)]">
                      {item.section}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    title={item.label}
                    aria-label={item.label}
                    aria-current={active ? 'page' : undefined}
                    className={`group relative flex items-center rounded-xl transition-all cursor-pointer ${
                      isSidebarCollapsed
                        ? 'h-10 w-10 mx-auto justify-center'
                        : 'h-10 w-full px-3 justify-start gap-3'
                    } ${
                      active
                        ? 'bg-[var(--fx-accent-soft)] text-[var(--fx-accent)] font-bold shadow-2xs'
                        : 'text-[var(--fx-ink-2)] hover:text-[var(--fx-ink)] hover:bg-[var(--fx-canvas)]'
                    }`}
                  >
                    <Icon size={18} strokeWidth={active ? 2.2 : 1.8} className="shrink-0" />
                    {!isSidebarCollapsed && (
                      <span className="truncate text-xs font-semibold">{item.label}</span>
                    )}
                    {item.id === 'chat' && totalUnreadChats > 0 && (
                      <span
                        className={`${
                          isSidebarCollapsed ? 'absolute -right-0.5 -top-0.5 text-[9px] px-1' : 'ml-auto text-[10px] px-1.5'
                        } flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--fx-accent)] font-bold text-white`}
                      >
                        {totalUnreadChats}
                      </span>
                    )}
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="mt-auto border-t border-[var(--fx-border)] p-2 space-y-1">
            {isSidebarCollapsed && (
              <button
                type="button"
                onClick={toggleSidebar}
                title={t.chrome.expandSidebar}
                aria-label={t.chrome.expandSidebar}
                className="flex h-10 w-10 mx-auto items-center justify-center rounded-xl text-[var(--fx-ink-2)] hover:text-[var(--fx-ink)] hover:bg-[var(--fx-canvas)] cursor-pointer"
              >
                <PanelLeftOpen size={18} />
              </button>
            )}

            {!isSidebarCollapsed && (
              <div className="flex items-center gap-2.5 px-2.5 py-2 mb-1 rounded-xl bg-[var(--fx-canvas)] border border-[var(--fx-border)]">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--fx-accent-soft)] text-xs font-bold text-[var(--fx-accent)]">
                  {(profile?.fullName || profile?.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-[var(--fx-ink)]">
                    {profile?.fullName || t.chrome.user}
                  </p>
                  <p className="truncate text-[10px] text-[var(--fx-faint)]">
                    {profile?.phoneNumber || profile?.email || t.chrome.owner}
                  </p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={onBack}
              title={t.chrome.backToSite}
              aria-label={t.chrome.backToSite}
              className={`flex items-center rounded-xl text-[var(--fx-ink-2)] hover:text-[var(--fx-ink)] hover:bg-[var(--fx-canvas)] cursor-pointer transition-colors ${
                isSidebarCollapsed ? 'h-10 w-10 mx-auto justify-center' : 'h-9 w-full px-3 gap-2.5 text-xs font-medium'
              }`}
            >
              <Globe size={16} />
              {!isSidebarCollapsed && <span>{t.chrome.backToSite}</span>}
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              title={`${t.chrome.logOut} (${profile?.fullName || profile?.email || t.chrome.owner})`}
              aria-label={t.chrome.logOut}
              className={`flex items-center rounded-xl text-[#DC2626] hover:bg-[#FEE2E2] cursor-pointer transition-colors ${
                isSidebarCollapsed ? 'h-10 w-10 mx-auto justify-center' : 'h-9 w-full px-3 gap-2.5 text-xs font-medium'
              }`}
            >
              <LogOut size={16} />
              {!isSidebarCollapsed && <span>{t.chrome.logOut}</span>}
            </button>
          </div>
        </nav>

        {/* ─── MAIN CONTENT CANVAS ─── */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          
          {/* Top Bar */}
          <header className="h-[62px] flex-shrink-0 bg-[var(--fx-canvas)] border-b border-[var(--fx-border)] flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-8 lg:px-10 z-20">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                type="button"
                onClick={toggleSidebar}
                title={isSidebarCollapsed ? t.chrome.expandSidebar : t.chrome.collapseSidebar}
                aria-label={isSidebarCollapsed ? t.chrome.expandSidebar : t.chrome.collapseSidebar}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--fx-border)] bg-white text-[var(--fx-ink-2)] hover:text-[var(--fx-ink)] hover:bg-[var(--fx-canvas)] transition-colors cursor-pointer"
              >
                {isSidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
              </button>

              {/* My Balance — sum of this account's Razorpay-paid top-ups */}
              <div
                className="inline-flex items-center gap-2 h-9 pl-2 pr-3 rounded-full bg-white border border-[var(--fx-border)] min-w-0"
                title={t.chrome.balanceTooltip}
              >
                <span className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <Wallet size={13} />
                </span>
                <span className="hidden sm:inline text-[11px] text-[var(--fx-ink-2)] font-medium">{t.chrome.myBalance}</span>
                <span className="text-sm font-bold text-[var(--fx-ink)] tabular-nums">
                  {myOrdersLoading ? '…' : `₹${balance.toLocaleString('en-IN')}`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3 text-xs flex-shrink-0">
              <LanguageSwitcher />

              {/* md+ has this action in the sidebar; keep it reachable on phones. */}
              <button
                onClick={handlePurchaseStickerClick}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[#111111] hover:bg-black active:scale-[0.99] text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                aria-label={t.chrome.getFreeSticker}
              >
                <Plus size={14} />
                <span className="hidden sm:inline">{t.chrome.getFreeSticker}</span>
              </button>

              <button
                onClick={() => setActiveTab('chat')}
                className="relative p-2 text-[var(--fx-ink-2)] hover:text-[var(--fx-ink)] hover:bg-black/5 rounded-full cursor-pointer transition-colors"
                title={totalUnreadChats > 0 ? `${totalUnreadChats} ${t.chrome.unreadMessagesSuffix}` : t.chrome.liveChatNotifications}
              >
                <Bell size={18} />
                {totalUnreadChats > 0 && (
                  <span className="absolute top-0.5 right-0.5 bg-[var(--fx-accent)] text-white rounded-full text-[9px] px-1.5 font-bold animate-pulse">
                    {totalUnreadChats}
                  </span>
                )}
              </button>
            </div>
          </header>

          {/* Page Container (expanded for spacious and zoomed look) */}
          {activeTab === 'chat' ? renderChatInbox() : (
          <main className="max-w-[1360px] w-full mx-auto p-4 sm:p-7 lg:p-9 space-y-7 min-h-0 flex-1 overflow-y-auto">

            {/* ── MANDATORY PHONE VERIFICATION ALERT BANNER ── */}
            {(!isAdminAccount && !profile?.isPhoneVerified && (!profile?.phoneNumber || profile?.isPhoneVerified === false) && !profilePopupDismissed) && (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-fade-in relative">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 flex-shrink-0 mt-0.5 sm:mt-0">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-amber-900 flex items-center gap-2">
                      <span>{profile?.phoneNumber ? t.phoneBanner.titlePending : t.phoneBanner.titleAdd}</span>
                      <span className="text-[10px] uppercase tracking-wider bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-bold">{t.phoneBanner.unverified}</span>
                    </h4>
                    <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                      {profile?.phoneNumber
                        ? `${t.phoneBanner.descPendingPrefix} ${profile.phoneNumber} ${t.phoneBanner.descPendingSuffix}`
                        : t.phoneBanner.descAdd
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setActiveTab('settings');
                      setOtpStep('input');
                    }}
                    className="flex-1 sm:flex-initial px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 flex-shrink-0 shadow-xs cursor-pointer"
                  >
                    <Smartphone size={14} />
                    <span>{profile?.phoneNumber ? t.phoneBanner.verifyBtn : t.phoneBanner.addBtn}</span>
                    <ArrowRight size={14} />
                  </button>
                  <button
                    onClick={handleDismissProfilePopup}
                    className="p-2 text-amber-700 hover:text-amber-900 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer"
                    title={t.phoneBanner.dismiss}
                    aria-label={t.phoneBanner.dismiss}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}


            {/* ════ SETUP GUIDE PAGE ════ */}
            {activeTab === 'setup' && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-white border border-[var(--fx-border)] rounded-lg p-4 sm:p-6 shadow-xs space-y-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b border-[var(--fx-border)] pb-4">
                    <div>
                      <h1 className="text-xl sm:text-2xl font-bold text-[var(--fx-ink)]">{t.setup.welcomePrefix} {profile?.fullName || t.chrome.clientBadge}!</h1>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-semibold text-[var(--fx-ink)]">{completedSetupCount}/3 {t.setup.completedSuffix}</span>
                      <div className="w-32 h-1.5 bg-[var(--fx-border)] rounded-full overflow-hidden">
                        <div className="h-full bg-[#4FC47A] rounded-full transition-all duration-500" style={{ width: `${setupPercent}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Step 1: Phone Verification */}
                    <div className="border border-[var(--fx-border)] rounded-md p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full ${isPhoneComplete ? 'bg-[#55C77D]' : 'bg-amber-400'} text-white flex items-center justify-center text-xs font-bold`}>
                          {isPhoneComplete ? '✓' : '!'}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-[var(--fx-ink)]">{t.setup.step1Title}</p>
                          <p className="text-xs text-[var(--fx-ink-2)]">
                            {isPhoneComplete
                              ? `${t.setup.step1VerifiedPrefix} ${profile?.phoneNumber}`
                              : profile?.phoneNumber
                                ? `${t.setup.step1PendingPrefix} ${profile.phoneNumber}`
                                : t.setup.step1None}
                          </p>
                        </div>
                      </div>
                      {isPhoneComplete ? (
                        <span className="text-xs font-bold text-[#2E9E5B]">{t.setup.completedLabel}</span>
                      ) : (
                        <button
                          onClick={() => {
                            setActiveTab('settings');
                            setOtpStep('input');
                          }}
                          className="text-xs font-bold text-amber-600 hover:underline cursor-pointer"
                        >
                          {t.setup.verifyLink}
                        </button>
                      )}
                    </div>

                    {/* Step 2: Emergency Contacts */}
                    <div className="border border-[var(--fx-border)] rounded-md p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full ${isContactsComplete ? 'bg-[#55C77D]' : 'bg-slate-300'} text-white flex items-center justify-center text-xs font-bold`}>
                          {isContactsComplete ? '✓' : '2'}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-[var(--fx-ink)]">{t.setup.step2Title}</p>
                          <p className="text-xs text-[var(--fx-ink-2)]">{totalContacts} {t.setup.step2DescSuffix}</p>
                        </div>
                      </div>
                      <button onClick={() => setActiveTab('contacts')} className="text-xs font-bold text-[var(--fx-accent)] hover:underline cursor-pointer">
                        {isContactsComplete ? t.setup.configureLink : t.setup.addContactsLink}
                      </button>
                    </div>

                    {/* Step 3: Safety Stickers */}
                    <div className="border border-[var(--fx-border)] rounded-md p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full ${isStickersComplete ? 'bg-[#55C77D]' : 'bg-slate-300'} text-white flex items-center justify-center text-xs font-bold`}>
                          {isStickersComplete ? '✓' : '3'}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-[var(--fx-ink)]">{t.setup.step3Title}</p>
                          <p className="text-xs text-[var(--fx-ink-2)]">{activeCount} {t.setup.step3DescSuffix}</p>
                        </div>
                      </div>
                      <button onClick={() => setActiveTab('overview')} className="text-xs font-bold text-[var(--fx-accent)] hover:underline cursor-pointer">
                        {t.setup.viewStickersLink}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ════ HOME OVERVIEW PAGE (Exact design.html layout) ════ */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                
                {/* Hero Greeting Section */}
                <div className="pt-2 pb-4">
                  <div className="text-xs text-[var(--fx-ink-2)] mb-1">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                  <h1 className="text-2xl sm:text-[28px] font-bold text-[var(--fx-ink)] leading-tight tracking-tight">
                    {t.overview.welcomeBackPrefix} {profile?.fullName?.split(' ')[0] || t.chrome.clientBadge}
                  </h1>
                </div>

                {/* ─── STICKER PURCHASE REQUIRED HERO CARD (When 0 stickers) ─── */}
                {products.length === 0 && !productsLoading && (
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0F1015] via-[#161822] to-[#0A0B0E] text-white p-6 sm:p-7 border border-white/15 shadow-xl">
                    <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-3xl" />

                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                      <div className="max-w-xl space-y-2 text-left">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-[11px] font-bold tracking-wide uppercase">
                          <Sparkles size={13} /> {t.overview.heroBadge}
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white font-display">
                          {t.overview.heroTitle}
                        </h2>
                        <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed">
                          {t.overview.heroDesc}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-zinc-400">
                          <span className="flex items-center gap-1"><ShieldCheck size={14} className="text-emerald-400" /> {t.overview.maskingBadge}</span>
                          <span className="flex items-center gap-1"><Zap size={14} className="text-white" /> {t.overview.instantBadge}</span>
                          <span className="flex items-center gap-1"><CheckCircle2 size={14} className="text-emerald-400" /> {t.overview.deliveryBadge}</span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
                        <button
                          onClick={handlePurchaseStickerClick}
                          className="h-11 px-6 rounded-xl bg-white hover:bg-neutral-100 active:scale-[0.99] text-black font-extrabold text-sm shadow-lg shadow-black/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <ShoppingBag size={17} />
                          <span>{t.overview.getFreeStickerBtn}</span>
                        </button>
                        <button
                          onClick={() => setModal({ type: 'recover' })}
                          className="h-9 px-4 rounded-lg border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 active:scale-[0.99] text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <QrCode size={13} />
                          <span>{t.overview.haveTagLink}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* HoneyBook Stats Bar (4 columns) */}
                <div className="bg-white border border-[var(--fx-border)] shadow-[0_1px_4px_rgba(0,0,0,0.04)] grid grid-cols-2 lg:grid-cols-4 rounded-lg overflow-hidden divide-x divide-y lg:divide-y-0 divide-[var(--fx-border)]">
                  <div className="p-4 sm:p-6">
                    <div className="text-xs text-[var(--fx-ink-2)] mb-1">{t.overview.statActive}</div>
                    <div className="text-2xl sm:text-3xl font-light tracking-tight text-[var(--fx-ink)]">{activeCount}</div>
                  </div>
                  <div className="p-4 sm:p-6">
                    <div className="text-xs text-[var(--fx-ink-2)] mb-1">{t.overview.statScans}</div>
                    <div className="text-2xl sm:text-3xl font-light tracking-tight text-[var(--fx-ink)]">{totalScans}</div>
                  </div>
                  <div className="p-4 sm:p-6">
                    <div className="text-xs text-[var(--fx-ink-2)] mb-1">{t.overview.statContacts}</div>
                    <div className="text-2xl sm:text-3xl font-light tracking-tight text-[var(--fx-ink)]">{totalContacts}</div>
                  </div>
                  <div className="p-4 sm:p-6">
                    <div className="text-xs text-[var(--fx-ink-2)] mb-1">{t.overview.statSecurity}</div>
                    <div className="text-xl sm:text-2xl font-semibold text-[#4FC47A] tracking-tight mt-1">{t.overview.protectedLabel}</div>
                  </div>
                </div>

                {/* Latest chat — compact, newest few threads, above the stickers */}
                <div className="bg-white border border-[var(--fx-border)] shadow-[0_1px_4px_rgba(0,0,0,0.03)] rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xs font-semibold text-[var(--fx-ink)]">
                      {t.overview.latestChat}{totalUnreadChats > 0 ? ` (${totalUnreadChats} ${t.overview.unreadSuffix})` : ''}
                    </h3>
                    <button onClick={() => setActiveTab('chat')} className="text-xs text-[var(--fx-accent)] hover:underline cursor-pointer">
                      {t.overview.viewInbox}
                    </button>
                  </div>

                  {ownerSessionsLoading ? (
                    <div className="py-4 text-center text-xs text-[var(--fx-ink-2)]">{t.overview.loadingChats}</div>
                  ) : latestSessions.length === 0 ? (
                    <div className="py-4 text-center text-xs text-[var(--fx-ink-2)]">{t.overview.noChatsYet}</div>
                  ) : (
                    <div className="divide-y divide-[var(--fx-canvas)]">
                      {latestSessions.map((sess) => (
                        <button
                          key={sess.id}
                          type="button"
                          onClick={() => {
                            setActiveTab('chat');
                            openChatSession(sess);
                          }}
                          className="w-full flex items-center justify-between gap-3 py-2.5 px-1 text-left rounded hover:bg-[var(--fx-canvas)] transition-colors cursor-pointer"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[var(--fx-ink)] truncate">
                              {sess.customer_name || t.chatInbox.visitor}
                              {sess.vehicle_label && <span className="font-medium text-[var(--fx-ink-2)]"> · {sess.vehicle_label}</span>}
                            </p>
                            <p className="text-[11px] text-[var(--fx-ink-2)] truncate">{sess.last_message_preview || t.overview.noMessagesYet}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {(sess.unread_owner_count || 0) > 0 && (
                              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--fx-accent)] text-white text-[10px] font-bold flex items-center justify-center">
                                {sess.unread_owner_count}
                              </span>
                            )}
                            <span className="text-[11px] font-mono text-[var(--fx-faint)]">
                              {sess.last_message_at ? new Date(sess.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bento Grid (3 Columns) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  
                  {/* Card 1: Create New */}
                  <div className="bg-white border border-[var(--fx-border)] shadow-[0_1px_4px_rgba(0,0,0,0.03)] rounded-lg p-4 flex flex-col justify-between md:min-h-[360px]">
                    <div>
                      <h3 className="text-xs font-semibold text-[var(--fx-ink)] mb-3.5">{t.overview.quickActions}</h3>
                      <div className="space-y-2">
                        <button
                          onClick={() => setActiveTab('chat')}
                          className="w-full h-11 border border-[var(--fx-border)] bg-[var(--fx-canvas)] rounded hover:border-[var(--fx-accent)] flex items-center px-3 gap-2.5 text-xs text-[var(--fx-ink)] font-bold hover:bg-[var(--fx-canvas)] transition-colors cursor-pointer"
                        >
                          <MessageSquareText size={15} className="text-[var(--fx-accent)]" /> {t.overview.openChat}
                        </button>
                        <button
                          onClick={() => setActiveTab('contacts')}
                          className="w-full h-11 border border-[var(--fx-border)] rounded hover:border-[var(--fx-accent)] flex items-center px-3 gap-2.5 text-xs text-[var(--fx-ink)] font-medium hover:bg-[var(--fx-canvas)] transition-colors cursor-pointer"
                        >
                          <Contact2 size={15} className="text-[var(--fx-accent)]" /> {t.overview.addContact}
                        </button>
                        <button
                          onClick={async () => {
                            const found = await loadProducts({ sync: true });
                            showToast(`Refreshed ${found?.length || 0} stickers`);
                          }}
                          className="w-full h-11 border border-[var(--fx-border)] rounded hover:border-[var(--fx-accent)] flex items-center px-3 gap-2.5 text-xs text-[var(--fx-ink)] font-medium hover:bg-[var(--fx-canvas)] transition-colors cursor-pointer"
                        >
                          <RefreshCw size={15} className="text-[var(--fx-accent)]" /> {t.overview.syncStickers}
                        </button>
                        <button
                          onClick={() => setModal({ type: 'qrCode', sticker: products[0] })}
                          disabled={!products[0]}
                          className="w-full h-11 border border-[var(--fx-border)] rounded hover:border-[var(--fx-accent)] flex items-center px-3 gap-2.5 text-xs text-[var(--fx-ink)] font-medium hover:bg-[var(--fx-canvas)] transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <QrCode size={15} className="text-[var(--fx-accent)]" /> {t.overview.viewQr}
                        </button>
                        <button
                          onClick={() => setActiveTab('history')}
                          className="w-full h-11 border border-[var(--fx-border)] rounded hover:border-[var(--fx-accent)] flex items-center px-3 gap-2.5 text-xs text-[var(--fx-ink)] font-medium hover:bg-[var(--fx-canvas)] transition-colors cursor-pointer"
                        >
                          <BellRing size={15} className="text-[var(--fx-accent)]" /> {t.overview.scanLogs}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Active Stickers */}
                  <div className="bg-white border border-[var(--fx-border)] shadow-[0_1px_4px_rgba(0,0,0,0.03)] rounded-lg p-4 flex flex-col justify-between md:min-h-[360px]">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-xs font-semibold text-[var(--fx-ink)]">{t.overview.mySafetyStickersPrefix} ({products.length})</h3>
                        <div className="flex items-center gap-2.5">
                          <CodeVisibilityToggleButton isRevealed={codesRevealed} onToggleVisibility={() => setCodesRevealed(!codesRevealed)} />
                          <button onClick={() => setModal({ type: 'recover' })} className="text-xs text-[var(--fx-accent)] hover:underline cursor-pointer">{t.overview.recoverLink}</button>
                          <button onClick={() => loadProducts({ sync: true })} className="text-xs text-[var(--fx-accent)] hover:underline cursor-pointer">{t.overview.refreshLink}</button>
                        </div>
                      </div>

                      {productsLoading ? (
                        <div className="py-12 text-center text-xs text-[var(--fx-ink-2)]">{t.overview.loadingStickers}</div>
                      ) : products.length === 0 ? (
                        <div className="py-8 text-center text-xs text-[var(--fx-ink-2)] space-y-3">
                          <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center">
                            <ShoppingBag size={22} />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-[var(--fx-ink)]">{t.overview.noStickersTitle}</p>
                            <p className="text-[11px] text-[var(--fx-ink-2)] mt-0.5">{t.overview.noStickersDesc}</p>
                          </div>
                          <FlowButton tone="dark" size="sm" onClick={handlePurchaseStickerClick}>
                            <Plus size={14} /> {t.overview.getFreeStickerShort}
                          </FlowButton>
                        </div>
                      ) : (
                        <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                          {products.slice(0, 4).map((p) => (
                            <div key={p.id} className="p-3 border border-[var(--fx-border)] rounded-md bg-[var(--fx-canvas)] flex items-center justify-between gap-2">
                              <div>
                                <p className="font-bold text-xs text-[var(--fx-ink)]">{stickerRef(p, codesRevealed, p.nickname || 'Vehicle Tag')}</p>
                                {codesRevealed && p.nickname && (
                                  <p className="text-[11px] text-[var(--fx-ink-2)] font-medium">{p.nickname}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => setModal({ type: 'qrCode', sticker: p })}
                                  className="px-2 py-1 bg-[var(--fx-accent-soft)] border border-[var(--fx-accent-ink)] text-[var(--fx-accent-ink)] text-[11px] font-bold rounded cursor-pointer"
                                >
                                  {t.overview.qrBtn}
                                </button>
                                <button
                                  onClick={() => setModal({ type: 'editDetails', sticker: p })}
                                  className="px-2 py-1 bg-white border border-[var(--fx-border)] text-[var(--fx-ink)] text-[11px] font-semibold rounded cursor-pointer"
                                >
                                  {t.overview.editBtn}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}


                      {removedStickers.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-[var(--fx-canvas)] space-y-2">
                          {removedStickers.map((s) => (
                            <div key={s.id} className="p-2.5 border border-[#FBE3B8] bg-[#FFFBF2] rounded-md flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-[11px] font-bold text-[#8A5A00] truncate">{s.nickname || 'A sticker'} {t.overview.noLongerShowsSuffix}</p>
                                {codesRevealed && <p className="text-[10px] text-[#A67C1F] font-mono truncate">{s.qrCodeId}</p>}
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => handleQuickRecover(s.qrCodeId)}
                                  disabled={recoveringId === s.qrCodeId}
                                  className="px-2 py-1 bg-white border border-[var(--fx-accent-ink)] text-[var(--fx-accent-ink)] text-[10px] font-bold rounded cursor-pointer disabled:opacity-60"
                                >
                                  {recoveringId === s.qrCodeId ? t.overview.recovering : t.overview.recoverBtn}
                                </button>
                                <button
                                  onClick={() => dismissRemovedSticker(s.id)}
                                  className="px-1.5 py-1 text-[#A67C1F] hover:text-[var(--fx-accent-ink)] cursor-pointer"
                                  title="Dismiss"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="pt-2 text-xs font-semibold text-[var(--fx-accent)] cursor-pointer hover:underline" onClick={() => setActiveTab('overview')}>
                      {t.overview.viewAllStickers}
                    </div>
                  </div>

                  {/* Card 3: Emergency Responders */}
                  <div className="bg-white border border-[var(--fx-border)] shadow-[0_1px_4px_rgba(0,0,0,0.03)] rounded-lg p-4 flex flex-col justify-between md:min-h-[360px]">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-xs font-semibold text-[var(--fx-ink)]">{t.overview.emergencyContactsPrefix} ({totalContacts})</h3>
                        <button onClick={() => setActiveTab('contacts')} className="text-xs text-[var(--fx-accent)] hover:underline cursor-pointer">{t.overview.addContactShort}</button>
                      </div>

                      <div className="space-y-3 mt-4">
                        {products[0]?.contacts?.length ? (
                          products[0].contacts.map((c, i) => (
                            <div key={i} className="flex justify-between items-center text-xs pb-2 border-b border-[var(--fx-canvas)]">
                              <div>
                                <span className="font-bold text-[var(--fx-ink)] block">{c.name}</span>
                                <span className="text-[11px] text-[var(--fx-ink-2)]">{c.relation || 'Emergency Contact'}</span>
                              </div>
                              <span className="font-mono text-[11px] font-semibold text-[var(--fx-accent)]">{c.phone}</span>
                            </div>
                          ))
                        ) : (
                          <div className="py-10 text-center text-xs text-[var(--fx-ink-2)]">
                            <p>{t.overview.noContactsYet}</p>
                            <button onClick={() => setActiveTab('contacts')} className="text-[var(--fx-accent)] font-bold mt-2 hover:underline">{t.overview.addResponders}</button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="pt-2 text-xs font-semibold text-[var(--fx-accent)] cursor-pointer hover:underline" onClick={() => setActiveTab('contacts')}>
                      {t.overview.manageContacts}
                    </div>
                  </div>

                </div>

                {/* Recent scans — expands into the latest scan events */}
                <div className="pt-2">
                  <ActivityDropdown
                    title={t.overview.recentScans}
                    subtitle={
                      allHistory.length > 0
                        ? `${allHistory.length} scan event${allHistory.length === 1 ? '' : 's'}`
                        : t.overview.noScansYet
                    }
                    icon={<QrCode className="h-5 w-5" />}
                    items={allHistory.slice(0, 5).map((h, i) => ({
                      id: h.id ?? i,
                      icon: <QrCode className="h-4 w-4" />,
                      title: `${codesRevealed ? h.stickerCode : (h.stickerVehicle || h.stickerNickname || 'Sticker')} scanned`,
                      description: h.event_type || 'Vehicle QR scan recorded',
                      time: new Date(h.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
                    }))}
                    emptyText={t.history.noScanEventsRecent}
                    action={{ label: t.history.fullLog, onClick: () => setActiveTab('history') }}
                    defaultOpen
                  />
                </div>

              </div>
            )}

            {/* ════ VIEW 1B: PRODUCTS & ORDERS ════ */}
            {activeTab === 'products' && (
              <div className="space-y-6">
                <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--fx-ink)]">
                  {t.products.title}
                </h1>

                {/* Underlined Tabs */}
                <div className="flex items-center gap-6 border-b border-[var(--fx-border)]">
                  <button
                    type="button"
                    onClick={() => setProductViewTab('catalog')}
                    className={`flex items-center gap-1.5 pb-3 text-sm font-semibold border-b-2 -mb-px transition-colors cursor-pointer ${
                      productViewTab === 'catalog'
                        ? 'border-[var(--fx-accent)] text-[var(--fx-accent)]'
                        : 'border-transparent text-[var(--fx-ink-2)] hover:text-[var(--fx-ink)]'
                    }`}
                  >
                    <span>{t.products.availableTags}</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-600">
                      {shopProducts.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductViewTab('orders')}
                    className={`flex items-center gap-1.5 pb-3 text-sm font-semibold border-b-2 -mb-px transition-colors cursor-pointer ${
                      productViewTab === 'orders'
                        ? 'border-[var(--fx-accent)] text-[var(--fx-accent)]'
                        : 'border-transparent text-[var(--fx-ink-2)] hover:text-[var(--fx-ink)]'
                    }`}
                  >
                    <span>{t.products.myOrders}</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-600">
                      {myOrders.length}
                    </span>
                  </button>
                </div>

                {/* VIEW: CATALOG */}
                {productViewTab === 'catalog' && (
                  <div className="space-y-6">
                    {shopProductsLoading ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {[1, 2, 3, 4].map((n) => (
                          <div key={n} className="rounded-2xl border border-[var(--fx-border)] bg-white p-4 space-y-3 animate-pulse">
                            <div className="aspect-[16/10] bg-neutral-100 rounded-xl" />
                            <div className="h-4 bg-neutral-100 rounded w-3/4" />
                            <div className="h-3 bg-neutral-100 rounded w-full" />
                            <div className="h-9 bg-neutral-100 rounded-lg mt-4" />
                          </div>
                        ))}
                      </div>
                    ) : shopProducts.length === 0 ? (
                      <div className="bg-white border border-[var(--fx-border)] rounded-2xl py-12 px-6 text-center">
                        <ShoppingBag size={38} className="mx-auto mb-3 opacity-40 text-[var(--fx-accent)]" />
                        <h3 className="text-sm font-bold text-[var(--fx-ink)]">{t.products.noProductsTitle}</h3>
                        <p className="text-xs text-[var(--fx-ink-2)] mt-1">{t.products.noProductsDesc}</p>
                        <button
                          onClick={loadShopProducts}
                          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--fx-accent)] text-white hover:opacity-90 cursor-pointer"
                        >
                          <RefreshCw size={13} /> {t.products.refreshCatalog}
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {shopProducts.map((product) => (
                          <div
                            key={product.id}
                            className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--fx-border)] bg-white shadow-2xs hover:shadow-md transition-all duration-200"
                          >
                            <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100">
                              <img
                                src={product.img}
                                alt={product.name}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                              {product.badge && (
                                <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-xs shadow-xs">
                                  {product.badge}
                                </span>
                              )}
                              <span className="absolute right-3 top-3 rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-neutral-700 shadow-2xs backdrop-blur-xs">
                                {product.category || t.products.safetyTagCategory}
                              </span>
                            </div>

                            <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
                              <div>
                                <h3 className="text-sm font-bold text-[var(--fx-ink)] group-hover:text-[var(--fx-accent)] transition-colors">
                                  {product.name}
                                </h3>
                                <p className="mt-1.5 text-xs text-[var(--fx-ink-2)] line-clamp-2 leading-relaxed">
                                  {product.desc}
                                </p>

                                {product.features && product.features.length > 0 && (
                                  <ul className="mt-3 space-y-1">
                                    {product.features.slice(0, 2).map((feat, idx) => (
                                      <li key={idx} className="flex items-center gap-1.5 text-[11px] text-[var(--fx-ink-2)]">
                                        <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                                        <span className="truncate">{feat}</span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>

                              <div className="mt-5 pt-3 border-t border-[var(--fx-canvas)]">
                                <div className="flex items-baseline justify-between mb-3">
                                  <div>
                                    <span className="text-base font-bold text-[var(--fx-ink)]">
                                      {product.price === 0 ? t.products.freeTag : `₹${product.price}`}
                                    </span>
                                    {product.mrp && product.mrp > product.price && (
                                      <span className="ml-1.5 text-xs text-neutral-400 line-through">
                                        ₹{product.mrp}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                    {t.products.privacyBadge}
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleBuyProduct(product)}
                                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-neutral-900 py-2.5 text-xs font-bold text-white hover:bg-black transition-all active:scale-[0.99] cursor-pointer shadow-xs"
                                >
                                  <span>{product.price === 0 ? t.products.getFreeTagBtn : t.products.orderNowBtn}</span>
                                  <ArrowRight size={13} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* VIEW: MY ORDERS */}
                {productViewTab === 'orders' && (() => {
                  const filteredOrders = myOrders.filter((o) => {
                    if (orderStatusFilter !== 'all' && o.status !== orderStatusFilter) return false;
                    const needle = orderSearch.trim().toLowerCase();
                    if (!needle) return true;
                    return (o.id || '').toLowerCase().includes(needle) || (o.items || []).some((it: any) => (it.name || '').toLowerCase().includes(needle));
                  });
                  return (
                  <div className="space-y-4">
                    {/* Search + Status Filter Toolbar */}
                    {myOrders.length > 0 && (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                        <div className="relative flex-1 min-w-[200px]">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fx-faint)]" />
                          <input
                            type="text"
                            placeholder={t.products.searchOrders}
                            value={orderSearch}
                            onChange={(e) => setOrderSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[var(--fx-border-strong)] bg-white text-[var(--fx-ink)] outline-none focus:border-[var(--fx-accent)] focus:ring-2 focus:ring-[var(--fx-accent)]/20 shadow-2xs"
                          />
                        </div>
                        <select
                          value={orderStatusFilter}
                          onChange={(e) => setOrderStatusFilter(e.target.value as any)}
                          className="px-3 py-2 text-xs font-semibold rounded-lg border border-[var(--fx-border-strong)] bg-white text-[var(--fx-ink-2)] outline-none cursor-pointer focus:border-[var(--fx-accent)] shadow-2xs"
                        >
                          <option value="all">{t.products.allStatus}</option>
                          <option value="placed">{t.products.placed}</option>
                          <option value="shipped">{t.products.shipped}</option>
                          <option value="delivered">{t.products.delivered}</option>
                          <option value="cancelled">{t.products.cancelled}</option>
                        </select>
                      </div>
                    )}

                    {myOrdersLoading ? (
                      <div className="bg-white border border-[var(--fx-border)] rounded-2xl py-10 px-6 text-center text-[var(--fx-faint)]">
                        <Loader2 size={32} className="animate-spin mx-auto mb-2 text-[var(--fx-accent)]" />
                        <p className="text-[13.5px] font-semibold text-[var(--fx-ink)]">{t.products.loadingOrders}</p>
                      </div>
                    ) : myOrdersError ? (
                      <div className="bg-white border border-[var(--fx-border)] rounded-2xl py-10 px-6 text-center text-[var(--fx-faint)]">
                        <AlertTriangle size={32} className="mx-auto mb-2 text-[#DC2626]" />
                        <p className="text-[13.5px] font-semibold text-[var(--fx-ink)]">{myOrdersError}</p>
                      </div>
                    ) : myOrders.length === 0 ? (
                      <div className="bg-white border border-[var(--fx-border)] rounded-2xl py-12 px-6 text-center">
                        <ShoppingBag size={38} className="mx-auto mb-3 opacity-40 text-[var(--fx-accent)]" />
                        <p className="text-sm text-[var(--fx-ink)] font-bold">{t.products.noOrdersTitle}</p>
                        <p className="text-xs text-[var(--fx-ink-2)] mt-1 max-w-sm mx-auto">
                          {t.products.noOrdersDesc}
                        </p>
                        <button
                          type="button"
                          onClick={() => setProductViewTab('catalog')}
                          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-neutral-900 text-white hover:bg-black cursor-pointer shadow-xs"
                        >
                          <PackageCheck size={14} /> {t.products.browseTagsBtn}
                        </button>
                      </div>
                    ) : filteredOrders.length === 0 ? (
                      <div className="bg-white border border-[var(--fx-border)] rounded-xl py-10 px-6 text-center">
                        <Search size={28} className="mx-auto mb-2 opacity-40 text-[var(--fx-accent)]" />
                        <p className="text-sm text-[var(--fx-ink)] font-bold">{t.products.noOrdersMatch}</p>
                        <button
                          type="button"
                          onClick={() => { setOrderSearch(''); setOrderStatusFilter('all'); }}
                          className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[var(--fx-canvas)] text-[var(--fx-ink-2)] hover:bg-[var(--fx-border)] transition-colors cursor-pointer"
                        >
                          <RefreshCw size={12} /> {t.products.clearFilters}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                    {filteredOrders.map((o) => {
                      const payStatus: string = o.payment?.status || 'created';
                      const payLabel = payStatus === 'paid' ? t.products.paid : payStatus === 'failed' ? t.products.paymentFailed : t.products.awaitingPayment;
                      const payColor = payStatus === 'paid' ? 'text-[#2E9E5B] bg-[#E9F9EF]' : payStatus === 'failed' ? 'text-[#DC2626] bg-[#FDEAEA]' : 'text-[#B8863F] bg-[#FBF3E4]';
                      const fulfillColor =
                        o.status === 'delivered' ? 'text-[#2E9E5B] bg-[#E9F9EF]' :
                        o.status === 'cancelled' ? 'text-[#DC2626] bg-[#FDEAEA]' :
                        o.status === 'shipped' ? 'text-[var(--fx-accent)] bg-[var(--fx-accent-soft)]' :
                        'text-[#B8863F] bg-[#FBF3E4]';
                      return (
                        <div key={o.id} className="bg-white border border-[var(--fx-border)] rounded-[14px] p-5">
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-display font-semibold text-[15px] text-[var(--fx-ink)]">{o.id}</h3>
                                <span className="text-[11px] text-[var(--fx-faint)] font-mono">{o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN') : ''}</span>
                              </div>
                              <p className="text-[12.5px] text-[var(--fx-ink-2)] mt-0.5 flex items-center gap-1.5">
                                <Package size={13} className="text-[var(--fx-faint)]" />
                                {(o.items || []).length} item{(o.items || []).length !== 1 ? 's' : ''} · <span className="font-mono">₹{(o.total || 0).toLocaleString('en-IN')}</span>
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2.5 py-1 rounded-[4px] text-[11px] font-bold uppercase tracking-wide ${payColor}`}>{payLabel}</span>
                              <span className={`px-2.5 py-1 rounded-[4px] text-[11px] font-bold uppercase tracking-wide capitalize ${fulfillColor}`}>{o.status}</span>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-[var(--fx-canvas)] divide-y divide-[var(--fx-canvas)]">
                            {(o.items || []).map((it: any, i: number) => (
                              <div key={i} className="flex items-center justify-between py-1.5 text-[13px]">
                                <span className="text-[var(--fx-ink)]">{it.name} × {it.qty}</span>
                                <span className="font-mono text-[var(--fx-ink-2)]">{it.price > 0 ? `₹${(it.price * it.qty).toLocaleString('en-IN')}` : t.products.free}</span>
                              </div>
                            ))}
                          </div>

                          {/* ── Delivery progress ── */}
                          {o.status !== 'cancelled' && (
                            <div className="mt-3 pt-3 border-t border-[var(--fx-canvas)]">
                              <div className="flex items-center">
                                {(['ordered', 'shipped', 'delivered'] as const).map((stepKey, idx) => {
                                  const stepLabel = stepKey === 'ordered' ? t.products.stepOrdered : stepKey === 'shipped' ? t.products.stepShipped : t.products.stepDelivered;
                                  const reached = idx <= ['ordered', 'shipped', 'delivered'].indexOf(
                                    o.status === 'delivered' ? 'delivered' : o.status === 'shipped' ? 'shipped' : 'ordered'
                                  );
                                  return (
                                    <React.Fragment key={stepKey}>
                                      {idx > 0 && (
                                        <div className={`h-[2px] flex-1 ${reached ? 'bg-[#2E9E5B]' : 'bg-[var(--fx-border)]'}`} />
                                      )}
                                      <div className="flex flex-col items-center gap-1 shrink-0">
                                        <div className={`w-[18px] h-[18px] rounded-full flex items-center justify-center ${reached ? 'bg-[#2E9E5B] text-white' : 'bg-[var(--fx-border)] text-[var(--fx-faint)]'}`}>
                                          {reached ? <CheckCircle2 size={12} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                                        </div>
                                        <span className={`text-[10.5px] font-semibold ${reached ? 'text-[var(--fx-ink)]' : 'text-[var(--fx-faint)]'}`}>{stepLabel}</span>
                                      </div>
                                    </React.Fragment>
                                  );
                                })}
                              </div>

                              {(o.shiprocket?.awbCode || o.shiprocket?.courierName) && (
                                <p className="text-[12px] text-[var(--fx-ink-2)] mt-3">
                                  {o.shiprocket.courierName || t.products.courierFallback}
                                  {o.shiprocket.awbCode && <> · AWB <span className="font-mono text-[var(--fx-ink)]">{o.shiprocket.awbCode}</span></>}
                                  {o.shiprocket.etd && <> · Expected <span className="text-[var(--fx-ink)]">{o.shiprocket.etd}</span></>}
                                </p>
                              )}

                              <div className="flex items-center gap-2 mt-3">
                                <button
                                  onClick={() => handleTrackOrder(o.id)}
                                  disabled={trackLoading[o.id]}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-semibold bg-[var(--fx-canvas)] text-[var(--fx-ink)] border border-[var(--fx-border)] hover:bg-[var(--fx-canvas)] transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  {trackLoading[o.id]
                                    ? <Loader2 size={13} className="animate-spin" />
                                    : <RefreshCw size={13} className="text-[var(--fx-accent)]" />}
                                  {trackLoading[o.id] ? t.products.checking : trackOpen[o.id] ? t.products.hideTracking : t.products.trackDelivery}
                                </button>
                                {o.shiprocket?.trackingUrl && (
                                  <a
                                    href={o.shiprocket.trackingUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-semibold text-[var(--fx-ink-2)] hover:text-[var(--fx-ink)] transition-colors"
                                  >
                                    {t.products.courierSite}
                                    <ArrowRight size={12} />
                                  </a>
                                )}
                              </div>

                              {trackOpen[o.id] && (
                                <div className="mt-3 pt-3 border-t border-[var(--fx-canvas)]">
                                  {trackError[o.id] ? (
                                    <p className="text-[12.5px] text-[var(--fx-ink-2)]">{trackError[o.id]}</p>
                                  ) : !(trackData[o.id]?.shiprocket?.timeline || []).length ? (
                                    <p className="text-[12.5px] text-[var(--fx-ink-2)]">
                                      {o.status === 'placed'
                                        ? t.products.preparingOrder
                                        : t.products.noCourierScans}
                                    </p>
                                  ) : (
                                    <div className="space-y-2.5">
                                      {[...trackData[o.id].shiprocket.timeline].reverse().map((ev: any, i: number) => (
                                        <div key={`${ev.status}-${ev.at}-${i}`} className="flex gap-2.5">
                                          <span className={`mt-[5px] w-2 h-2 rounded-full shrink-0 ${i === 0 ? 'bg-[#2E9E5B]' : 'bg-[#D5D6D9]'}`} />
                                          <div className="min-w-0">
                                            <div className="text-[12.5px] font-semibold text-[var(--fx-ink)]">{ev.status}</div>
                                            <div className="text-[11px] text-[var(--fx-faint)]">
                                              {[ev.at ? new Date(ev.at).toLocaleString('en-IN') : null, ev.location].filter(Boolean).join(' · ')}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    </div>
                  )}
                </div>
                  );
                })()}
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
                {/* Header with Title and Manual Refresh */}
                <div className="flex items-center justify-between gap-3">
                  <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--fx-ink)]">
                    {t.history.title}
                  </h1>
                  <button
                    type="button"
                    onClick={() => fetchAlertHistory(true)}
                    disabled={allHistoryLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--fx-border)] bg-white text-xs font-semibold text-[var(--fx-ink)] hover:bg-[var(--fx-canvas)] transition-colors self-start sm:self-auto cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw size={13} className={allHistoryLoading ? 'animate-spin text-[var(--fx-accent)]' : ''} />
                    <span>{allHistoryLoading ? t.history.refreshing : t.history.refreshAlerts}</span>
                  </button>
                </div>

                {allHistoryLoading && allHistory.length === 0 ? (
                  <div className="bg-white border border-[var(--fx-border)] rounded-2xl py-12 px-6 text-center text-[var(--fx-faint)]">
                    <Loader2 size={32} className="animate-spin mx-auto mb-2 text-[var(--fx-accent)]" />
                    <p className="text-[13.5px] font-semibold text-[var(--fx-ink)]">{t.history.fetching}</p>
                  </div>
                ) : allHistory.length === 0 ? (
                  <div className="bg-white border border-[var(--fx-border)] rounded-2xl py-12 px-6 text-center text-[var(--fx-faint)]">
                    <BellRing size={36} className="mx-auto mb-3 opacity-40 text-[var(--fx-accent)]" />
                    <p className="text-sm text-[var(--fx-ink)] font-bold">{t.history.noAlertsTitle}</p>
                    <p className="text-xs text-[var(--fx-ink-2)] mt-1 max-w-sm mx-auto">
                      {t.history.noAlertsDesc}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* ── LATEST ALERT HERO CARD ── */}
                    {allHistory[0] && (
                      <div className="rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/70 via-white to-neutral-50/40 p-5 sm:p-6 shadow-xs">
                        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100/90 text-emerald-800 border border-emerald-300/60">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
                            </span>
                            {t.history.latestAlert}
                          </span>
                          <span className="font-mono text-xs text-neutral-500">
                            {new Date(allHistory[0].created_at).toLocaleString('en-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <h2 className="text-base sm:text-lg font-bold text-neutral-900">
                              {codesRevealed ? allHistory[0].stickerCode : (allHistory[0].stickerVehicle || allHistory[0].stickerNickname || t.history.vehicleSafetyTag)}
                            </h2>
                            <div className="text-xs text-neutral-600 mt-1.5 flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200">
                                {allHistory[0].event_type || t.history.scanRecorded}
                              </span>
                              {allHistory[0].location && (
                                <span className="flex items-center gap-1 text-neutral-500">
                                  <MapPin size={12} /> {allHistory[0].location}
                                </span>
                              )}
                              {allHistory[0].scanner_name && (
                                <span className="text-neutral-500">
                                  {t.history.scannedByPrefix} <span className="font-medium text-neutral-700">{allHistory[0].scanner_name}</span>
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const found = products.find((p) => p.id === allHistory[0].sticker_id || p.qrCodeId === allHistory[0].stickerCode);
                                if (found) setModal({ type: 'qrCode', sticker: found });
                              }}
                              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-neutral-200 text-neutral-800 hover:bg-neutral-50 shadow-2xs transition-colors cursor-pointer"
                            >
                              {t.history.viewPlate}
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveTab('chat')}
                              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-neutral-900 text-white hover:bg-black shadow-2xs transition-colors cursor-pointer"
                            >
                              {t.history.openVisitorChat}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── ALL PAST ALERTS TABLE ── */}
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3 px-1">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--fx-ink-2)]">
                          {t.history.allLogsPrefix} ({allHistory.length})
                        </h3>
                        <div className="relative w-full sm:w-[220px]">
                          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fx-faint)]" />
                          <input
                            type="text"
                            placeholder={t.history.searchLogs}
                            value={historySearch}
                            onChange={(e) => setHistorySearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[var(--fx-border-strong)] bg-white text-[var(--fx-ink)] outline-none focus:border-[var(--fx-accent)] focus:ring-2 focus:ring-[var(--fx-accent)]/20 shadow-2xs"
                          />
                        </div>
                      </div>
                      {(() => {
                        const needle = historySearch.trim().toLowerCase();
                        const filteredHistory = !needle ? allHistory : allHistory.filter((h) =>
                          [h.stickerCode, h.stickerVehicle, h.stickerNickname, h.event_type, h.location, h.scanner_name]
                            .some((v) => (v || '').toLowerCase().includes(needle))
                        );
                        return filteredHistory.length === 0 ? (
                          <div className="bg-white border border-[var(--fx-border)] rounded-2xl py-8 px-6 text-center text-xs text-[var(--fx-ink-2)] font-semibold">
                            {t.history.noLogsMatchPrefix} "{historySearch}".
                          </div>
                        ) : (
                        <div className="bg-white rounded-2xl border border-[var(--fx-border)] overflow-hidden shadow-2xs">
                          <table className="w-full min-w-[520px] text-sm text-[var(--fx-ink)]">
                            <thead>
                              <tr className="text-left font-display text-[12px] font-semibold text-[var(--fx-ink-2)] tracking-normal bg-[var(--fx-canvas)] border-b border-[var(--fx-border)]">
                                <th className="px-6 py-3.5">{t.history.colSticker}</th>
                                <th className="px-4 py-3.5">{t.history.colEventType}</th>
                                <th className="px-4 py-3.5">{t.history.colContext}</th>
                                <th className="px-6 py-3.5 text-right">{t.history.colTimestamp}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--fx-border)]">
                              {filteredHistory.map((h, i) => (
                                <tr key={i} className="hover:bg-[var(--fx-canvas)] transition-colors">
                                  <td className="px-6 py-3.5 font-display font-semibold text-[14px]">
                                    {codesRevealed ? h.stickerCode : (h.stickerVehicle || h.stickerNickname || t.history.stickerFallback)}
                                  </td>
                                  <td className="px-4 py-3.5 text-xs">
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-100 text-neutral-700">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                      {h.event_type || t.history.scanRecorded}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3.5 text-xs text-[var(--fx-ink-2)]">
                                    {h.location || h.scanner_name || t.history.directScan}
                                  </td>
                                  <td className="px-6 py-3.5 font-mono text-xs text-[var(--fx-faint)] text-right">
                                    {new Date(h.created_at).toLocaleString('en-IN')}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ════ VIEW 4: ACCOUNT SETTINGS ════ */}
            {activeTab === 'settings' && (
              <AccountSettingsPanel showToast={showToast} onProductsLinked={() => loadProducts({ sync: true })} />
            )}

            {/* ════ VIEW 5: SUPPORT & LEGAL ════ */}
            {activeTab === 'support' && (
              <SupportLegalPanel showToast={showToast} />
            )}

          </main>
          )}
        </div>
      </div>



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
      {modal?.type === 'recover' && (
        <RecoverStickerModal
          prefillId={modal.prefillId}
          onClose={() => setModal(null)}
          onRecover={handleRecoverSticker}
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
          onProductsLinked={() => loadProducts({ sync: true })}
        />
      )}

      {toastMsg && (
        <div className="fixed bottom-[max(1.5rem,calc(env(safe-area-inset-bottom)+0.5rem))] right-6 z-[120] bg-[var(--fx-ink)] text-white px-4 py-2.5 rounded-[9px] shadow-lg font-mono text-[13px] border border-[var(--fx-accent)]">
          {toastMsg}
        </div>
      )}
    </div>
  );
}

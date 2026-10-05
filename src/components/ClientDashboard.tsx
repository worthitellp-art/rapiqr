import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { dashboardTranslations } from '../i18n/dashboardTranslations';
import LanguageSwitcher from './common/LanguageSwitcher';
import { FlowButton } from './ui/flow-button';
import { Button } from './ui/button';
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
  PanelLeft,
  Menu,
  BellRing,
  ShieldAlert,
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
import { isPushSupported, getExistingSubscription, subscribeToPush } from '../lib/push';
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

type TabId = 'overview' | 'products' | 'chat' | 'contacts' | 'history' | 'settings' | 'support';

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
    { id: 'products', label: t.nav.products, icon: PackageCheck },
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

  // Below `md` the docked sidebar (with its own collapse-to-icons mode) isn't
  // used at all — there's no room for it, which is why it was unusable on
  // phones. Mobile gets its own full-screen nav overlay instead, toggled
  // independently of the desktop collapse state.
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Push-notification nudge: unlike the phone banner this has no "mark as
  // done forever" write — permission state lives in the browser, not our
  // account record, so every fresh page load re-checks it. Dismissing only
  // hides it for this load (matches `profilePopupDismissed` above), which is
  // deliberate: a denied/undecided permission should keep getting surfaced
  // rather than going quiet after one dismissal.
  const [notifSupported, setNotifSupported] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(true); // assume granted until checked, so the banner never flashes on
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const [notifBannerDismissed, setNotifBannerDismissed] = useState(false);
  const [notifEnabling, setNotifEnabling] = useState(false);

  useEffect(() => {
    if (!isPushSupported()) {
      setNotifSupported(false);
      return;
    }
    setNotifSupported(true);
    setNotifPermission(Notification.permission);
    getExistingSubscription().then((sub) => setNotifEnabled(Boolean(sub))).catch(() => setNotifEnabled(false));
  }, []);

  const handleEnableNotifications = async () => {
    setNotifEnabling(true);
    const res = await subscribeToPush();
    setNotifPermission(Notification.permission);
    if (res.success) {
      setNotifEnabled(true);
      showToast('Notifications enabled');
    } else {
      showToast(res.error || 'Failed to enable notifications');
    }
    setNotifEnabling(false);
  };

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
      if (saved && ['overview', 'products', 'contacts', 'history', 'settings', 'support'].includes(saved)) {
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
      <div className="fx-shell client-theme min-h-screen w-full text-[var(--fx-ink)] font-body" style={{ background: 'var(--fx-canvas)' }}>
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
              className="flex items-center gap-1.5 rounded-[var(--fx-radius-control)] border border-[var(--fx-border)] px-3 py-2 text-xs font-semibold text-[var(--fx-ink-2)] hover:bg-[var(--fx-canvas)] cursor-pointer"
            >
              <LogOut size={14} /> {t.gate.logOut}
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
          <div className="mb-10 text-center">

            <h1 className="fx-text-heading-page text-[var(--fx-ink)]">
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
                className="flex flex-col overflow-hidden rounded-[var(--fx-radius-card)] border border-[var(--fx-border)] bg-white shadow-sm"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img src={product.img} alt={product.name} className="h-full w-full object-cover" />
                  <span className="absolute left-3 top-3 rounded-[var(--fx-radius-pill)] bg-black/50 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
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
                    className="mt-4 flex items-center justify-center gap-1.5 rounded-[var(--fx-radius-control)] bg-[var(--fx-ink)] py-2.5 text-xs font-bold text-white hover:bg-black transition-colors cursor-pointer"
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
          <div className="fixed bottom-6 right-6 z-[120] rounded-[var(--fx-radius-control)] border border-[var(--fx-accent)] bg-[var(--fx-ink)] px-4 py-2.5 font-mono text-[13px] text-white shadow-lg">
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
          <h1 className="fx-text-heading-brand text-[var(--fx-ink)]">{t.chatInbox.title}</h1>
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
          <label className="flex h-9 items-center gap-2 rounded-[var(--fx-radius-control)] bg-[var(--fx-canvas)] px-3">
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
                className={`h-7 rounded-[var(--fx-radius-pill)] px-3 text-xs font-semibold cursor-pointer transition-colors ${
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
    <div className="fx-shell client-theme flex h-screen w-full overflow-hidden text-[var(--fx-ink)] font-body" style={{ background: 'var(--fx-sidebar-bg)' }}>

      <div className="flex min-h-0 min-w-0 flex-1">
        {/* ─── COLLAPSIBLE SIDEBAR: expandable / collapsible navigation ─── */}
        <nav
          aria-label="Dashboard sections"
          className={`hidden md:flex shrink-0 flex-col py-6 transition-[width] duration-300 ease-in-out z-30 ${
            isSidebarCollapsed ? 'w-[68px]' : 'w-[245px]'
          }`}
        >
          {/* Header Branding */}
          <div className="flex h-[62px] shrink-0 items-center justify-between px-3.5">
            {isSidebarCollapsed ? (
              <button
                type="button"
                onClick={onBack}
                aria-label={t.chrome.home}
                title={t.chrome.home}
                className="mx-auto flex h-9 w-9 items-center justify-center rounded-[var(--fx-radius-tile)] bg-[var(--fx-accent)] text-sm font-black text-white cursor-pointer"
              >
                R
              </button>
            ) : (
              <>
                <button onClick={onBack} className="flex items-center gap-2 cursor-pointer text-left">
                  <AppLogo variant="dark" className="h-7 w-auto object-contain" />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-white bg-[var(--fx-accent)] px-1.5 py-0.5 rounded-full">
                    {t.chrome.clientBadge}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={toggleSidebar}
                  title={t.chrome.collapseSidebar}
                  aria-label={t.chrome.collapseSidebar}
                  className="flex h-8 w-8 items-center justify-center rounded-[var(--fx-radius-control)] text-[var(--fx-sidebar-ink)] hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
                >
                  <PanelLeft size={18} />
                </button>
              </>
            )}
          </div>

          {/* Account */}
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-3 px-3.5 pb-5 pt-1">
              <div className="relative w-[46px] h-[46px] shrink-0 rounded-[var(--fx-radius-tile)] bg-[#2b2f3c] flex items-center justify-center text-lg font-extrabold text-white">
                {(profile?.fullName || profile?.email || 'U').charAt(0).toUpperCase()}
                {totalUnreadChats > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#e53935] border-2 border-[var(--fx-sidebar-bg)] flex items-center justify-center text-[10px] font-bold text-white">
                    {totalUnreadChats}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-bold text-white">{profile?.fullName || t.chrome.user}</p>
                <p className="truncate text-xs text-[var(--fx-sidebar-ink)]">{profile?.phoneNumber || profile?.email || t.chrome.owner}</p>
              </div>
            </div>
          )}

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
            {NAV_ITEMS.map((item, idx) => {
              const active = activeTab === item.id;
              const showSectionHeader = !isSidebarCollapsed && (idx === 0 || NAV_ITEMS[idx - 1]?.section !== item.section);
              const sectionLabel = item.section || 'Main';

              return (
                <React.Fragment key={item.id}>
                  {showSectionHeader && (
                    <div className="px-3 pt-4 pb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--fx-sidebar-ink)]">
                      {sectionLabel}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    title={item.label}
                    aria-label={item.label}
                    aria-current={active ? 'page' : undefined}
                    className={`relative flex items-center rounded-[var(--fx-radius-control)] transition-colors cursor-pointer font-semibold ${
                      isSidebarCollapsed
                        ? 'h-10 w-10 mx-auto justify-center text-[17px]'
                        : 'h-10 w-full px-3 justify-start text-[17px]'
                    } ${active ? 'text-white' : 'text-[var(--fx-sidebar-ink)] hover:text-white'}`}
                  >
                    {isSidebarCollapsed ? item.label.charAt(0) : item.label}
                    {item.id === 'chat' && totalUnreadChats > 0 && !isSidebarCollapsed && (
                      <span className="ml-auto flex h-5 min-w-[20px] px-1 items-center justify-center rounded-full bg-[#e53935] text-[10px] font-bold text-white">
                        {totalUnreadChats}
                      </span>
                    )}
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="mt-auto p-2 space-y-0.5">
            {isSidebarCollapsed && (
              <button
                type="button"
                onClick={toggleSidebar}
                title={t.chrome.expandSidebar}
                aria-label={t.chrome.expandSidebar}
                className="flex h-10 w-10 mx-auto items-center justify-center rounded-[var(--fx-radius-control)] text-[var(--fx-sidebar-ink)] hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <PanelLeft size={18} className="rotate-180" />
              </button>
            )}

            <button
              type="button"
              onClick={onBack}
              title={t.chrome.backToSite}
              aria-label={t.chrome.backToSite}
              className={`flex items-center rounded-[var(--fx-radius-control)] text-[var(--fx-sidebar-ink)] hover:text-white cursor-pointer transition-colors font-semibold ${
                isSidebarCollapsed ? 'h-10 w-10 mx-auto justify-center' : 'h-9 w-full px-3 gap-2.5 text-sm'
              }`}
            >
              <Globe size={15} />
              {!isSidebarCollapsed && <span>{t.chrome.backToSite}</span>}
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              title={`${t.chrome.logOut} (${profile?.fullName || profile?.email || t.chrome.owner})`}
              aria-label={t.chrome.logOut}
              className={`flex items-center rounded-[var(--fx-radius-control)] text-[#e53935] hover:bg-white/5 cursor-pointer transition-colors font-semibold ${
                isSidebarCollapsed ? 'h-10 w-10 mx-auto justify-center' : 'h-9 w-full px-3 gap-2.5 text-sm'
              }`}
            >
              <LogOut size={15} />
              {!isSidebarCollapsed && <span>{t.chrome.logOut}</span>}
            </button>
          </div>
        </nav>

        {/* ─── MOBILE FULL-SCREEN MENU ─── replaces the docked sidebar below
             `md` — no collapse-to-icons mode here, just one big tappable list. */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-50 flex md:hidden flex-col"
            style={{ background: 'var(--fx-sidebar-bg)' }}
          >
            <div className="flex h-16 shrink-0 items-center justify-between px-4 border-b border-white/10">
              <button onClick={onBack} className="flex items-center gap-2 cursor-pointer">
                <AppLogo variant="dark" className="h-7 w-auto object-contain" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-white bg-[var(--fx-accent)] px-1.5 py-0.5 rounded-full">
                  {t.chrome.clientBadge}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
                className="flex h-10 w-10 items-center justify-center rounded-[var(--fx-radius-control)] text-[var(--fx-sidebar-ink)] hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X size={22} />
              </button>
            </div>

            <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10 shrink-0">
              <div className="relative w-12 h-12 shrink-0 rounded-[var(--fx-radius-tile)] bg-[#2b2f3c] flex items-center justify-center text-xl font-extrabold text-white">
                {(profile?.fullName || profile?.email || 'U').charAt(0).toUpperCase()}
                {totalUnreadChats > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#e53935] border-2 border-[var(--fx-sidebar-bg)] flex items-center justify-center text-[10px] font-bold text-white">
                    {totalUnreadChats}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-white">{profile?.fullName || t.chrome.user}</p>
                <p className="truncate text-sm text-[var(--fx-sidebar-ink)]">{profile?.phoneNumber || profile?.email || t.chrome.owner}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3">
              {NAV_ITEMS.map((item, idx) => {
                const active = activeTab === item.id;
                const showSectionHeader = idx === 0 || NAV_ITEMS[idx - 1]?.section !== item.section;
                const sectionLabel = item.section || 'Main';
                return (
                  <React.Fragment key={item.id}>
                    {showSectionHeader && (
                      <div className="px-3 pt-5 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--fx-sidebar-ink)]">
                        {sectionLabel}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                      aria-current={active ? 'page' : undefined}
                      className={`w-full flex items-center justify-between h-14 px-3 rounded-[var(--fx-radius-control)] text-[19px] font-semibold transition-colors cursor-pointer ${
                        active ? 'bg-[var(--fx-accent)] text-white' : 'text-[var(--fx-sidebar-ink)] hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <span>{item.label}</span>
                      {item.id === 'chat' && totalUnreadChats > 0 && (
                        <span className="flex h-6 min-w-[24px] px-1.5 items-center justify-center rounded-full bg-[#e53935] text-xs font-bold text-white">
                          {totalUnreadChats}
                        </span>
                      )}
                    </button>
                  </React.Fragment>
                );
              })}
            </div>

            <div className="p-3 border-t border-white/10 space-y-1 shrink-0">
              <button
                type="button"
                onClick={() => { setMobileMenuOpen(false); onBack(); }}
                className="w-full flex items-center gap-3 h-12 px-3 rounded-[var(--fx-radius-control)] text-[var(--fx-sidebar-ink)] hover:text-white hover:bg-white/10 text-base font-semibold transition-colors cursor-pointer"
              >
                <Globe size={18} /> <span>{t.chrome.backToSite}</span>
              </button>
              <button
                type="button"
                onClick={() => { setMobileMenuOpen(false); handleSignOut(); }}
                className="w-full flex items-center gap-3 h-12 px-3 rounded-[var(--fx-radius-control)] text-[#e53935] hover:bg-white/5 text-base font-semibold transition-colors cursor-pointer"
              >
                <LogOut size={18} /> <span>{t.chrome.logOut}</span>
              </button>
            </div>
          </div>
        )}

        {/* ─── MAIN CONTENT CANVAS — floating white card inset from the dark shell ─── */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col m-2 sm:m-3.5 sm:ml-0 rounded-[var(--fx-radius-surface)] bg-white overflow-hidden">

          {/* Top Bar */}
          <header className="flex-shrink-0 flex items-start justify-between gap-3 flex-wrap px-4 sm:px-8 pt-5 sm:pt-7 pb-1">
            {/* Mobile nav trigger — the docked sidebar is `hidden` below `md`,
                this full-screen menu button is its only replacement there. */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              title={t.chrome.expandSidebar}
              aria-label={t.chrome.expandSidebar}
              className="flex md:hidden h-9 w-9 shrink-0 items-center justify-center rounded-[var(--fx-radius-control)] bg-[var(--fx-canvas)] text-[var(--fx-ink-2)] hover:text-[var(--fx-ink)] transition-colors cursor-pointer"
            >
              <Menu size={18} />
            </button>

            {isSidebarCollapsed && (
              <button
                type="button"
                onClick={toggleSidebar}
                title={t.chrome.expandSidebar}
                aria-label={t.chrome.expandSidebar}
                className="hidden md:flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--fx-radius-control)] bg-[var(--fx-canvas)] text-[var(--fx-ink-2)] hover:text-[var(--fx-ink)] transition-colors cursor-pointer"
              >
                <PanelLeft size={18} className="rotate-180" />
              </button>
            )}

            <div className="flex-1" />

            <div className="flex items-center gap-2.5 flex-wrap justify-end">
              <LanguageSwitcher />

              <div
                className="inline-flex items-center h-9 px-3.5 rounded-[var(--fx-radius-control)] bg-[var(--fx-canvas)] text-xs font-semibold text-[var(--fx-ink)]"
                title={t.chrome.balanceTooltip}
              >
                {t.chrome.myBalance} {myOrdersLoading ? '…' : `₹${balance.toLocaleString('en-IN')}`}
              </div>

              <button
                onClick={handlePurchaseStickerClick}
                className="inline-flex items-center h-9 px-4 rounded-[var(--fx-radius-control)] bg-[var(--fx-ink)] hover:bg-black text-white font-bold text-[11px] uppercase tracking-wide transition-colors cursor-pointer"
                aria-label={t.chrome.getFreeSticker}
              >
                + {t.chrome.getFreeSticker}
              </button>

              <button
                onClick={() => setActiveTab('chat')}
                className="relative h-9 w-9 rounded-[var(--fx-radius-control)] bg-[var(--fx-canvas)] text-[var(--fx-ink-2)] hover:text-[var(--fx-ink)] cursor-pointer transition-colors"
                title={totalUnreadChats > 0 ? `${totalUnreadChats} ${t.chrome.unreadMessagesSuffix}` : t.chrome.liveChatNotifications}
              >
                <Bell size={16} className="mx-auto" />
                {totalUnreadChats > 0 && (
                  <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-[#e53935]" />
                )}
              </button>
            </div>
          </header>

          {/* Page Container */}
          {activeTab === 'chat' ? renderChatInbox() : (
          <main className="w-full p-4 sm:p-8 lg:px-12 space-y-7 min-h-0 flex-1 overflow-y-auto">

            {/* ── MANDATORY PHONE VERIFICATION ALERT BANNER ── */}
            {(!isAdminAccount && !profile?.isPhoneVerified && (!profile?.phoneNumber || profile?.isPhoneVerified === false) && !profilePopupDismissed) && (
              <div className="bg-[var(--fx-accent-soft)] rounded-[var(--fx-radius-card)] p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in relative">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-[var(--fx-radius-tile)] bg-white text-[var(--fx-accent)] flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--fx-ink)] flex items-center gap-2">
                      <span>{profile?.phoneNumber ? t.phoneBanner.titlePending : t.phoneBanner.titleAdd}</span>
                      <span className="text-[10px] uppercase tracking-wider bg-white text-[var(--fx-accent)] px-2 py-0.5 rounded-[var(--fx-radius-pill)] font-bold">{t.phoneBanner.unverified}</span>
                    </h4>
                    <p className="text-xs text-[var(--fx-ink-2)] mt-1 leading-relaxed">
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
                    className="flex-1 sm:flex-initial px-4 py-2 bg-[var(--fx-accent)] hover:bg-[var(--fx-accent-hover)] text-white font-bold text-xs rounded-[var(--fx-radius-control)] transition-colors flex items-center justify-center gap-2 flex-shrink-0 cursor-pointer"
                  >
                    <Smartphone size={14} />
                    <span>{profile?.phoneNumber ? t.phoneBanner.verifyBtn : t.phoneBanner.addBtn}</span>
                    <ArrowRight size={14} />
                  </button>
                  <button
                    onClick={handleDismissProfilePopup}
                    className="p-2 text-[var(--fx-accent)] hover:bg-white/60 rounded-[var(--fx-radius-control)] transition-colors cursor-pointer"
                    title={t.phoneBanner.dismiss}
                    aria-label={t.phoneBanner.dismiss}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* ── PUSH NOTIFICATIONS NUDGE ── re-checked (not just dismissed) on every
                load since the real state lives in the browser, not our account record. */}
            {(!isAdminAccount && notifSupported && !notifEnabled && !notifBannerDismissed) && (
              <div className="bg-[var(--fx-accent-soft)] rounded-[var(--fx-radius-card)] p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in relative">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-[var(--fx-radius-tile)] bg-white text-[var(--fx-accent)] flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
                    <Bell size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--fx-ink)]">
                      {notifPermission === 'denied' ? 'Notifications are blocked' : 'Turn on notifications'}
                    </h4>
                    {notifPermission === 'denied' ? (
                      <p className="text-xs text-[var(--fx-ink-2)] mt-1 leading-relaxed">
                        You'll miss emergency scan alerts and chat messages. Tap the lock/info icon next to this page's address, open <strong>Permissions</strong> → <strong>Notifications</strong>, set it to <strong>Allow</strong>, then reload.
                      </p>
                    ) : (
                      <p className="text-xs text-[var(--fx-ink-2)] mt-1 leading-relaxed">
                        Get notified instantly when your sticker is scanned or a visitor messages you — even when this tab isn't open.
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {notifPermission !== 'denied' && (
                    <button
                      onClick={handleEnableNotifications}
                      disabled={notifEnabling}
                      className="flex-1 sm:flex-initial px-4 py-2 bg-[var(--fx-accent)] hover:bg-[var(--fx-accent-hover)] text-white font-bold text-xs rounded-[var(--fx-radius-control)] transition-colors flex items-center justify-center gap-2 flex-shrink-0 cursor-pointer disabled:opacity-60"
                    >
                      {notifEnabling ? <Loader2 size={14} className="animate-spin" /> : <Bell size={14} />}
                      <span>{notifEnabling ? 'Enabling…' : 'Enable notifications'}</span>
                    </button>
                  )}
                  <button
                    onClick={() => setNotifBannerDismissed(true)}
                    className="p-2 text-[var(--fx-accent)] hover:bg-white/60 rounded-[var(--fx-radius-control)] transition-colors cursor-pointer"
                    title="Dismiss"
                    aria-label="Dismiss"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* ════ HOME OVERVIEW PAGE (Exact design.html layout) ════ */}
            {activeTab === 'overview' && (() => {
              const now = new Date();
              const toKey = (d: Date) => d.toISOString().slice(0, 10);
              const todayKey = toKey(now);
              const yesterdayKey = toKey(new Date(now.getTime() - 86400000));

              const chartDays = Array.from({ length: 14 }, (_, i) => {
                const d = new Date(now);
                d.setDate(d.getDate() - (13 - i));
                return { key: toKey(d), day: d.getDate() };
              });
              const countsByDay = new Map<string, number>();
              allHistory.forEach((h) => {
                const k = toKey(new Date(h.created_at));
                countsByDay.set(k, (countsByDay.get(k) || 0) + 1);
              });
              const maxDayCount = Math.max(1, ...chartDays.map((d) => countsByDay.get(d.key) || 0));

              const activityGroups: { key: string; label: string; items: any[] }[] = [];
              allHistory.slice(0, 30).forEach((h) => {
                const d = new Date(h.created_at);
                const k = toKey(d);
                const label = k === todayKey ? 'Today' : k === yesterdayKey ? 'Yesterday' : d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });
                let group = activityGroups.find((g) => g.key === k);
                if (!group) { group = { key: k, label, items: [] }; activityGroups.push(group); }
                group.items.push(h);
              });

              const stickerBreakdown = products.map((p) => ({
                id: p.id,
                label: stickerRef(p, codesRevealed, p.nickname || 'Vehicle Tag'),
                count: allHistory.filter((h) => h.sticker_id === p.id || h.stickerCode === p.qrCodeId).length,
              })).sort((a, b) => b.count - a.count).slice(0, 5);
              const maxStickerCount = Math.max(1, ...stickerBreakdown.map((s) => s.count));

              const eventVisual = (type?: string) => {
                const s = (type || '').toLowerCase();
                if (s.includes('emergency') || s.includes('sos') || s.includes('alert')) return { Icon: ShieldAlert, bg: '#FDE8E5', fg: '#B42318' };
                if (s.includes('chat') || s.includes('message')) return { Icon: MessageCircle, bg: 'var(--fx-accent-soft)', fg: 'var(--fx-accent)' };
                if (s.includes('location') || s.includes('gps')) return { Icon: MapPin, bg: '#EFF6FF', fg: '#2563EB' };
                return { Icon: QrCode, bg: '#F0FDF4', fg: '#147A3A' };
              };

              const tip = !isPhoneComplete
                ? { Icon: Smartphone, title: 'Verify your phone', desc: 'Add a verified number so people who scan your sticker can reach you.', cta: t.setup.verifyLink.replace(' ›', ''), onClick: () => { setActiveTab('settings'); setOtpStep('input'); } }
                : !isContactsComplete
                ? { Icon: Contact2, title: t.overview.noContactsYet, desc: 'Responders can reach the right people faster in an emergency.', cta: t.overview.addResponders, onClick: () => setActiveTab('contacts') }
                : { Icon: ShieldCheck, title: 'Your stickers are active', desc: 'Everything looks good — scans will reach you instantly.', cta: t.history.fullLog, onClick: () => setActiveTab('history') };

              return (
              <div className="space-y-6">

                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-4 pt-2">
                  <div>
                    <h1 className="fx-text-heading-page text-[var(--fx-ink)]">
                      {t.overview.welcomeBackPrefix} {profile?.fullName?.split(' ')[0] || t.chrome.clientBadge}
                    </h1>
                    <p className="text-xs text-[var(--fx-ink-2)] mt-1.5">
                      {activeCount} {t.overview.statActive.toLowerCase()} · {totalScans} {t.overview.statScans.toLowerCase()} · {totalContacts} {t.overview.statContacts.toLowerCase()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {[
                      { Icon: MessageSquareText, label: t.overview.openChat, onClick: () => setActiveTab('chat'), disabled: false },
                      { Icon: Contact2, label: t.overview.addContact, onClick: () => setActiveTab('contacts'), disabled: false },
                      { Icon: QrCode, label: t.overview.viewQr, onClick: () => setModal({ type: 'qrCode', sticker: products[0] }), disabled: !products[0] },
                      { Icon: RefreshCw, label: t.overview.syncStickers, onClick: async () => { const found = await loadProducts({ sync: true }); showToast(`Refreshed ${found?.length || 0} stickers`); }, disabled: false },
                      { Icon: Search, label: t.overview.recoverLink, onClick: () => setModal({ type: 'recover' }), disabled: false },
                    ].map(({ Icon, label, onClick, disabled }) => (
                      <button
                        key={label}
                        type="button"
                        title={label}
                        aria-label={label}
                        onClick={onClick}
                        disabled={disabled}
                        className="h-10 w-10 flex items-center justify-center rounded-full border border-[var(--fx-border)] bg-white text-[var(--fx-ink-2)] hover:text-[var(--fx-accent)] hover:border-[var(--fx-accent)] transition-colors cursor-pointer disabled:opacity-40"
                      >
                        <Icon size={16} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* ─── STICKER PURCHASE REQUIRED HERO CARD (When 0 stickers) ─── */}
                {products.length === 0 && !productsLoading && (
                  <div className="relative overflow-hidden rounded-[var(--fx-radius-card)] bg-gradient-to-br from-[#0F1015] via-[#161822] to-[#0A0B0E] text-white p-6 sm:p-7 border border-white/15 shadow-xl">
                    <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-3xl" />

                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                      <div className="max-w-xl space-y-2 text-left">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[var(--fx-radius-pill)] bg-white/10 border border-white/20 text-white text-[11px] font-bold tracking-wide uppercase">
                          <Tag size={13} /> {t.overview.heroBadge}
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
                          className="h-11 px-6 rounded-[var(--fx-radius-control)] bg-white hover:bg-neutral-100 active:scale-[0.99] text-black font-extrabold text-sm shadow-lg shadow-black/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <ShoppingBag size={17} />
                          <span>{t.overview.getFreeStickerBtn}</span>
                        </button>
                        <button
                          onClick={() => setModal({ type: 'recover' })}
                          className="h-9 px-4 rounded-[var(--fx-radius-control)] border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 active:scale-[0.99] text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <QrCode size={13} />
                          <span>{t.overview.haveTagLink}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* ── MAIN COLUMN ── */}
                  <div className="lg:col-span-8 space-y-6">

                    {/* Scan activity bar chart */}
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-[15px] font-bold text-[var(--fx-ink)]">Scan activity</h3>
                        <span className="text-[13px] text-[var(--fx-ink-2)]">Last 14 days</span>
                      </div>
                      <div className="flex items-end gap-1.5 h-[90px] mt-5">
                        {chartDays.map((d) => {
                          const c = countsByDay.get(d.key) || 0;
                          const barHeight = Math.max(8, Math.round((c / maxDayCount) * 90));
                          const isToday = d.key === todayKey;
                          return (
                            <div key={d.key} className="flex-1 h-full flex flex-col justify-end" title={`${c} scan${c === 1 ? '' : 's'}`}>
                              <div
                                className={`w-full rounded-[6px] transition-all ${isToday ? 'bg-[var(--fx-accent)]' : 'bg-[var(--fx-accent-soft)]'}`}
                                style={{ height: `${barHeight}px` }}
                              />
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex gap-1.5 mt-2">
                        {chartDays.map((d) => (
                          <span key={d.key} className="flex-1 text-center text-[10px] text-[var(--fx-ink-2)]">{d.day}</span>
                        ))}
                      </div>
                    </div>

                    {/* Scan activity feed, grouped by day */}
                    <div className="mt-[22px]">
                      <div className="flex items-center justify-between">
                        <h3 className="text-[15px] font-bold text-[var(--fx-ink)]">{t.overview.recentScans}</h3>
                        <button onClick={() => setActiveTab('history')} className="text-[13px] font-semibold text-[var(--fx-accent)] hover:underline cursor-pointer">{t.history.fullLog}</button>
                      </div>

                      {allHistoryLoading && allHistory.length === 0 ? (
                        <div className="py-9 text-center text-sm text-[var(--fx-ink-2)]">{t.history.fetching}</div>
                      ) : activityGroups.length === 0 ? (
                        <div className="py-9 text-center text-sm text-[var(--fx-ink-2)]">{t.overview.noScansYet}</div>
                      ) : (
                        <div className="max-h-[480px] overflow-y-auto">
                          {activityGroups.map((group) => (
                            <div key={group.key} className="mt-5 first:mt-4">
                              <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--fx-ink-2)]">{group.label}</div>
                              {group.items.map((h, i) => {
                                const { Icon, bg, fg } = eventVisual(h.event_type);
                                return (
                                  <div key={h.id ?? i} className="flex items-center gap-3.5 py-3 border-t border-[var(--fx-border)]">
                                    <span className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center" style={{ background: bg, color: fg }}>
                                      <Icon size={17} />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-semibold text-[var(--fx-ink)] truncate">
                                        {codesRevealed ? h.stickerCode : (h.stickerVehicle || h.stickerNickname || t.history.vehicleSafetyTag)}
                                      </p>
                                      <p className="text-xs text-[var(--fx-ink-2)] truncate">
                                        {new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {h.event_type || t.history.scanRecorded}
                                      </p>
                                    </div>
                                    {h.location && (
                                      <span className="shrink-0 text-xs text-[var(--fx-ink-2)] flex items-center gap-1">
                                        <MapPin size={11} /> {h.location}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── RIGHT RAIL ── */}
                  <div className="lg:col-span-4 bg-[var(--fx-canvas)] rounded-[var(--fx-radius-card)] p-5 sm:p-6 space-y-[18px] self-start">

                    {/* Where your scans come from — per-sticker breakdown */}
                    <div className="bg-white rounded-[var(--fx-radius-card)] p-[18px]">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[15px] font-bold text-[var(--fx-ink)]">{t.overview.mySafetyStickersPrefix}</h3>
                        <CodeVisibilityToggleButton isRevealed={codesRevealed} onToggleVisibility={() => setCodesRevealed(!codesRevealed)} />
                      </div>
                      {productsLoading ? (
                        <div className="py-8 text-center text-xs text-[var(--fx-ink-2)]">{t.overview.loadingStickers}</div>
                      ) : stickerBreakdown.length === 0 ? (
                        <div className="py-6 text-center text-xs text-[var(--fx-ink-2)] space-y-3">
                          <div className="w-12 h-12 mx-auto rounded-[var(--fx-radius-tile)] bg-slate-100 text-slate-500 flex items-center justify-center">
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
                        <div>
                          {stickerBreakdown.map((s) => (
                            <div key={s.id} className="mb-3.5 last:mb-0">
                              <div className="flex items-center justify-between text-sm font-semibold">
                                <span className="text-[var(--fx-ink)] truncate">{s.label}</span>
                                <span className="text-[var(--fx-ink-2)] shrink-0 ml-2">{s.count}</span>
                              </div>
                              <div className="h-[5px] rounded-full bg-[var(--fx-border)] mt-2 overflow-hidden">
                                <div className="h-full rounded-full bg-[#2EBD8E]" style={{ width: `${Math.max(4, (s.count / maxStickerCount) * 100)}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {removedStickers.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-[var(--fx-canvas)] space-y-2">
                          {removedStickers.map((s) => (
                            <div key={s.id} className="p-3 border border-[#FBE3B8] bg-[#FFFBF2] rounded-[var(--fx-radius-control)] flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-[11px] font-bold text-[#8A5A00] truncate">{s.nickname || 'A sticker'} {t.overview.noLongerShowsSuffix}</p>
                              </div>
                              <button
                                onClick={() => handleQuickRecover(s.qrCodeId)}
                                disabled={recoveringId === s.qrCodeId}
                                className="px-2 py-1 bg-white border border-[var(--fx-accent-ink)] text-[var(--fx-accent-ink)] text-[10px] font-bold rounded-[var(--fx-radius-control)] cursor-pointer disabled:opacity-60 shrink-0"
                              >
                                {recoveringId === s.qrCodeId ? t.overview.recovering : t.overview.recoverBtn}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="pt-3 text-[13px] font-semibold text-[var(--fx-accent)] cursor-pointer hover:underline" onClick={() => setActiveTab('products')}>
                        {t.overview.viewAllStickers} ›
                      </div>
                    </div>

                    {/* Latest chat — compact */}
                    <div className="bg-white rounded-[var(--fx-radius-card)] p-[18px]">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-[15px] font-bold text-[var(--fx-ink)]">
                          {t.overview.latestChat}{totalUnreadChats > 0 ? ` (${totalUnreadChats} ${t.overview.unreadSuffix})` : ''}
                        </h3>
                        <button onClick={() => setActiveTab('chat')} className="text-[13px] font-semibold text-[var(--fx-accent)] hover:underline cursor-pointer">
                          {t.overview.viewInbox} ›
                        </button>
                      </div>
                      {ownerSessionsLoading ? (
                        <div className="py-4 text-center text-xs text-[var(--fx-ink-2)]">{t.overview.loadingChats}</div>
                      ) : latestSessions.length === 0 ? (
                        <div className="py-4 text-center text-xs text-[var(--fx-ink-2)]">{t.overview.noChatsYet}</div>
                      ) : (
                        <div className="divide-y divide-[var(--fx-canvas)]">
                          {latestSessions.slice(0, 3).map((sess) => (
                            <button
                              key={sess.id}
                              type="button"
                              onClick={() => { setActiveTab('chat'); openChatSession(sess); }}
                              className="w-full flex items-center justify-between gap-3 py-2.5 text-left cursor-pointer"
                            >
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-[var(--fx-ink)] truncate">{sess.customer_name || t.chatInbox.visitor}</p>
                                <p className="text-[11px] text-[var(--fx-ink-2)] truncate">{sess.last_message_preview || t.overview.noMessagesYet}</p>
                              </div>
                              {(sess.unread_owner_count || 0) > 0 && (
                                <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--fx-accent)] text-white text-[10px] font-bold flex items-center justify-center">
                                  {sess.unread_owner_count}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Tip / promo card */}
                    <div className="bg-[#111111] rounded-[var(--fx-radius-card)] p-5 text-white">
                      <div className="w-11 h-11 rounded-[var(--fx-radius-tile)] bg-[#2a2f3d] flex items-center justify-center">
                        <tip.Icon size={20} />
                      </div>
                      <h3 className="text-[16px] font-bold mt-3.5">{tip.title}</h3>
                      <p className="text-[13px] text-[#9aa1b5] mt-1.5 mb-4 leading-relaxed">{tip.desc}</p>
                      <button
                        onClick={tip.onClick}
                        className="w-full py-3 rounded-[var(--fx-radius-control)] bg-white text-[#111111] text-sm font-bold cursor-pointer"
                      >
                        {tip.cta}
                      </button>
                    </div>
                  </div>
                </div>

              </div>
              );
            })()}

            {/* ════ VIEW 1B: PRODUCTS & ORDERS ════ */}
            {activeTab === 'products' && (
              <div className="space-y-6">
                <h1 className="fx-text-heading-page text-[var(--fx-ink)]">
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
                    <span className="px-1.5 py-0.5 rounded-[var(--fx-radius-pill)] text-[10px] font-bold bg-neutral-100 text-neutral-600">
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
                    <span className="px-1.5 py-0.5 rounded-[var(--fx-radius-pill)] text-[10px] font-bold bg-neutral-100 text-neutral-600">
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
                          <div key={n} className="rounded-[var(--fx-radius-card)] border border-[var(--fx-border)] bg-white p-4 space-y-3 animate-pulse">
                            <div className="aspect-[16/10] bg-neutral-100 rounded-[var(--fx-radius-card)]" />
                            <div className="h-4 bg-neutral-100 rounded w-3/4" />
                            <div className="h-3 bg-neutral-100 rounded w-full" />
                            <div className="h-9 bg-neutral-100 rounded-[var(--fx-radius-control)] mt-4" />
                          </div>
                        ))}
                      </div>
                    ) : shopProducts.length === 0 ? (
                      <div className="bg-white border border-[var(--fx-border)] rounded-[var(--fx-radius-card)] py-12 px-6 text-center">
                        <ShoppingBag size={38} className="mx-auto mb-3 opacity-40 text-[var(--fx-accent)]" />
                        <h3 className="text-sm font-bold text-[var(--fx-ink)]">{t.products.noProductsTitle}</h3>
                        <p className="text-xs text-[var(--fx-ink-2)] mt-1">{t.products.noProductsDesc}</p>
                        <button
                          onClick={loadShopProducts}
                          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--fx-radius-control)] text-xs font-semibold bg-[var(--fx-accent)] text-white hover:opacity-90 cursor-pointer"
                        >
                          <RefreshCw size={13} /> {t.products.refreshCatalog}
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {shopProducts.map((product) => (
                          <div
                            key={product.id}
                            className="group flex flex-col overflow-hidden rounded-[var(--fx-radius-card)] border border-[var(--fx-border)] bg-white shadow-2xs hover:shadow-md transition-all duration-200"
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
                                <span className="absolute left-3 top-3 rounded-[var(--fx-radius-pill)] bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-xs shadow-xs">
                                  {product.badge}
                                </span>
                              )}
                              <span className="absolute right-3 top-3 rounded-[var(--fx-radius-pill)] bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-neutral-700 shadow-2xs backdrop-blur-xs">
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
                                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-[var(--fx-radius-pill)]">
                                    {t.products.privacyBadge}
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleBuyProduct(product)}
                                  className="w-full flex items-center justify-center gap-1.5 rounded-[var(--fx-radius-control)] bg-[var(--fx-accent)] py-2.5 text-xs font-bold text-white hover:bg-[var(--fx-accent-hover)] transition-all active:scale-[0.99] cursor-pointer"
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
                            className="w-full pl-9 pr-3 py-2 text-xs rounded-[var(--fx-radius-control)] border border-[var(--fx-border-strong)] bg-white text-[var(--fx-ink)] outline-none focus:border-[var(--fx-accent)] focus:ring-2 focus:ring-[var(--fx-accent)]/20 shadow-2xs"
                          />
                        </div>
                        <select
                          value={orderStatusFilter}
                          onChange={(e) => setOrderStatusFilter(e.target.value as any)}
                          className="px-3 py-2 text-xs font-semibold rounded-[var(--fx-radius-control)] border border-[var(--fx-border-strong)] bg-white text-[var(--fx-ink-2)] outline-none cursor-pointer focus:border-[var(--fx-accent)] shadow-2xs"
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
                      <div className="bg-white border border-[var(--fx-border)] rounded-[var(--fx-radius-card)] py-10 px-6 text-center text-[var(--fx-faint)]">
                        <Loader2 size={32} className="animate-spin mx-auto mb-2 text-[var(--fx-accent)]" />
                        <p className="text-[13.5px] font-semibold text-[var(--fx-ink)]">{t.products.loadingOrders}</p>
                      </div>
                    ) : myOrdersError ? (
                      <div className="bg-white border border-[var(--fx-border)] rounded-[var(--fx-radius-card)] py-10 px-6 text-center text-[var(--fx-faint)]">
                        <AlertTriangle size={32} className="mx-auto mb-2 text-[#DC2626]" />
                        <p className="text-[13.5px] font-semibold text-[var(--fx-ink)]">{myOrdersError}</p>
                      </div>
                    ) : myOrders.length === 0 ? (
                      <div className="bg-white border border-[var(--fx-border)] rounded-[var(--fx-radius-card)] py-12 px-6 text-center">
                        <ShoppingBag size={38} className="mx-auto mb-3 opacity-40 text-[var(--fx-accent)]" />
                        <p className="text-sm text-[var(--fx-ink)] font-bold">{t.products.noOrdersTitle}</p>
                        <p className="text-xs text-[var(--fx-ink-2)] mt-1 max-w-sm mx-auto">
                          {t.products.noOrdersDesc}
                        </p>
                        <button
                          type="button"
                          onClick={() => setProductViewTab('catalog')}
                          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--fx-radius-control)] text-xs font-bold bg-[var(--fx-accent)] text-white hover:bg-[var(--fx-accent-hover)] cursor-pointer"
                        >
                          <PackageCheck size={14} /> {t.products.browseTagsBtn}
                        </button>
                      </div>
                    ) : filteredOrders.length === 0 ? (
                      <div className="bg-white border border-[var(--fx-border)] rounded-[var(--fx-radius-card)] py-10 px-6 text-center">
                        <Search size={28} className="mx-auto mb-2 opacity-40 text-[var(--fx-accent)]" />
                        <p className="text-sm text-[var(--fx-ink)] font-bold">{t.products.noOrdersMatch}</p>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => { setOrderSearch(''); setOrderStatusFilter('all'); }}
                          className="mt-3 gap-1.5"
                        >
                          <RefreshCw size={12} /> {t.products.clearFilters}
                        </Button>
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
                        <div key={o.id} className="bg-white border border-[var(--fx-border)] rounded-[var(--fx-radius-card)] p-4 sm:p-6">
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
                              <span className={`px-2.5 py-1 rounded-[var(--fx-radius-pill)] text-[11px] font-bold uppercase tracking-wide ${payColor}`}>{payLabel}</span>
                              <span className={`px-2.5 py-1 rounded-[var(--fx-radius-pill)] text-[11px] font-bold uppercase tracking-wide capitalize ${fulfillColor}`}>{o.status}</span>
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
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--fx-radius-control)] text-[12px] font-semibold bg-[var(--fx-canvas)] text-[var(--fx-ink)] border border-[var(--fx-border)] hover:bg-[var(--fx-canvas)] transition-colors cursor-pointer disabled:opacity-50"
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
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--fx-radius-control)] text-[12px] font-semibold text-[var(--fx-ink-2)] hover:text-[var(--fx-ink)] transition-colors"
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
                  <h1 className="fx-text-heading-page text-[var(--fx-ink)]">
                    {t.history.title}
                  </h1>
                  <button
                    type="button"
                    onClick={() => fetchAlertHistory(true)}
                    disabled={allHistoryLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--fx-radius-control)] border border-[var(--fx-border)] bg-white text-xs font-semibold text-[var(--fx-ink)] hover:bg-[var(--fx-canvas)] transition-colors self-start sm:self-auto cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw size={13} className={allHistoryLoading ? 'animate-spin text-[var(--fx-accent)]' : ''} />
                    <span>{allHistoryLoading ? t.history.refreshing : t.history.refreshAlerts}</span>
                  </button>
                </div>

                {allHistoryLoading && allHistory.length === 0 ? (
                  <div className="bg-white border border-[var(--fx-border)] rounded-[var(--fx-radius-card)] py-12 px-6 text-center text-[var(--fx-faint)]">
                    <Loader2 size={32} className="animate-spin mx-auto mb-2 text-[var(--fx-accent)]" />
                    <p className="text-[13.5px] font-semibold text-[var(--fx-ink)]">{t.history.fetching}</p>
                  </div>
                ) : allHistory.length === 0 ? (
                  <div className="bg-white border border-[var(--fx-border)] rounded-[var(--fx-radius-card)] py-12 px-6 text-center text-[var(--fx-faint)]">
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
                      <div className="rounded-[var(--fx-radius-card)] border border-emerald-200/90 bg-gradient-to-br from-emerald-50/70 via-white to-neutral-50/40 p-5 sm:p-6 shadow-xs">
                        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-[var(--fx-radius-pill)] text-xs font-bold bg-emerald-100/90 text-emerald-800 border border-emerald-300/60">
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
                            <h2 className="text-base sm:text-lg font-bold text-[var(--fx-ink)]">
                              {codesRevealed ? allHistory[0].stickerCode : (allHistory[0].stickerVehicle || allHistory[0].stickerNickname || t.history.vehicleSafetyTag)}
                            </h2>
                            <div className="text-xs text-neutral-600 mt-1.5 flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-emerald-800 bg-white px-2 py-0.5 rounded-[var(--fx-radius-pill)] border border-emerald-200">
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
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                const found = products.find((p) => p.id === allHistory[0].sticker_id || p.qrCodeId === allHistory[0].stickerCode);
                                if (found) setModal({ type: 'qrCode', sticker: found });
                              }}
                            >
                              {t.history.viewPlate}
                            </Button>
                            <button
                              type="button"
                              onClick={() => setActiveTab('chat')}
                              className="px-3.5 py-2 rounded-[var(--fx-radius-control)] text-xs font-semibold bg-[var(--fx-accent)] text-white hover:bg-[var(--fx-accent-hover)] transition-colors cursor-pointer"
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
                            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-[var(--fx-radius-control)] border border-[var(--fx-border-strong)] bg-white text-[var(--fx-ink)] outline-none focus:border-[var(--fx-accent)] focus:ring-2 focus:ring-[var(--fx-accent)]/20 shadow-2xs"
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
                          <div className="bg-white border border-[var(--fx-border)] rounded-[var(--fx-radius-card)] py-8 px-6 text-center text-xs text-[var(--fx-ink-2)] font-semibold">
                            {t.history.noLogsMatchPrefix} "{historySearch}".
                          </div>
                        ) : (
                        <div className="bg-white rounded-[var(--fx-radius-card)] border border-[var(--fx-border)] overflow-hidden shadow-2xs">
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
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--fx-radius-pill)] text-[11px] font-semibold bg-neutral-100 text-neutral-700">
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
        <div className="fixed bottom-[max(1.5rem,calc(env(safe-area-inset-bottom)+0.5rem))] right-6 z-[120] bg-[var(--fx-ink)] text-white px-4 py-2.5 rounded-[var(--fx-radius-control)] shadow-lg font-mono text-[13px] border border-[var(--fx-accent)]">
          {toastMsg}
        </div>
      )}
    </div>
  );
}

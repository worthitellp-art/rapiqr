import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Package,
  Zap,
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
import InitialAvatar from './common/InitialAvatar';
import RepiChat from './chat/RepiChat';
import { apiClient, ChatSession } from '../lib/apiClient';
import { connectAsOwner } from '../lib/socketClient';
import { recallOwnerThread, rememberOwnerThread } from '../lib/chatStorage';
import { soundNotification } from '../utils/soundNotification';
import { sendMsg91Otp, verifyMsg91Otp, toMsg91Identifier } from '../lib/msg91Widget';

async function getProductsFromDb(): Promise<any[]> {
  try {
    const res = await apiClient.products.list();
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

interface ClientDashboardProps {
  onBack: () => void;
  onPurchaseSticker?: () => void;
  switchToDistributor?: () => void;
}

type TabId = 'setup' | 'overview' | 'products' | 'chat' | 'contacts' | 'history' | 'settings' | 'support';

// `section` groups the flat list in the sidebar (a small uppercase label
// renders above each run of items sharing a section); items with no
// `section` render ungrouped at the top, above every labeled group.
const NAV_ITEMS: { id: TabId; label: string; icon: React.ComponentType<{ size?: number }>; section?: string }[] = [
  { id: 'overview', label: 'Home Overview', icon: Grid },
  { id: 'setup', label: 'Setup Guide', icon: Sparkles, section: 'My Tag' },
  { id: 'products', label: 'Products', icon: ShoppingBag, section: 'My Tag' },
  { id: 'chat', label: 'Live Visitor Chat', icon: MessageSquare, section: 'Communication' },
  { id: 'contacts', label: 'Emergency Contacts', icon: Users, section: 'Communication' },
  { id: 'history', label: 'Alert History', icon: History, section: 'Communication' },
  { id: 'settings', label: 'Account Settings', icon: Settings, section: 'Account' },
  { id: 'support', label: 'Support & Help', icon: LifeBuoy, section: 'Account' },
];

/**
 * The customer-facing view of an order's four fulfillment states. `cancelled`
 * has no place on a progress line, so those cards skip the stepper entirely.
 */
const DELIVERY_STEPS: string[] = ['Ordered', 'Shipped', 'Delivered'];

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
  const { profile, signOut, sendPhoneOtp, verifyPhoneOtp } = useAuth();
  // The admin account never links stickers by phone — the fleet console already sees
  // every sticker. Prompting it to verify a number only put the admin in competition
  // with the real owner for the stickers registered under that number.
  const isAdminAccount = profile?.role === 'admin';

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

  // Pre-purchase shop catalog — same admin-managed /api/shop-products list the
  // landing page shows, so a product the admin adds/edits appears here too.
  // Falls back to the built-in DEFAULT_PRODUCTS if none are configured yet.
  const [shopProducts, setShopProducts] = useState<ProductItem[]>(DEFAULT_PRODUCTS);
  useEffect(() => {
    apiClient.shopProducts
      .list()
      .then((res) => {
        if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
          setShopProducts(res.data.map(mapApiShopProduct));
        }
      })
      .catch(() => {
        /* keep the built-in fallback catalog */
      });
  }, []);

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

  const missingPhone = !isAdminAccount && !profile?.phoneNumber;
  const missingEmail = !profile?.email || profile.email.endsWith('.repiqr.local');

  // Once the user fills the phone number or dismisses the prompt, never ask again
  const [profilePopupDismissed, setProfilePopupDismissed] = useState(() => {
    try {
      const alreadyFilled = localStorage.getItem('rapiqr-phone-number-filled') === 'true';
      const alreadyAsked = localStorage.getItem('rapiqr-phone-asked-once') === 'true';
      const hasPhone = Boolean(profile?.phoneNumber);
      return alreadyFilled || alreadyAsked || hasPhone;
    } catch {
      return false;
    }
  });

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
    } catch {
      // Ignore storage errors
    }
  };

  const showCompleteProfilePopup =
    Boolean(profile) &&
    (missingPhone || missingEmail) &&
    !profilePopupDismissed &&
    typeof window !== 'undefined' &&
    localStorage.getItem('rapiqr-phone-asked-once') !== 'true' &&
    localStorage.getItem('rapiqr-phone-number-filled') !== 'true';


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

  // Stickers that used to be in the list and silently disappeared (admin
  // deleted it, or this account deleted it from another device/session).
  // Deletion is a soft-delete server-side (see QrModel.delete /
  // ProductController.remove), and since it's still linked to this account
  // (user_id survives a soft-delete), the "Recover" button next to each of
  // these brings it back with just its ID — no code needed, see
  // QrModel.restoreOwnedByUser.
  const [removedStickers, setRemovedStickers] = useState<{ id: string; qrCodeId: string; nickname: string }[]>([]);
  const [recoveringId, setRecoveringId] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const rows = await getProductsFromDb();
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

  // Selecting a thread records it, so a reload reopens the same conversation
  // rather than dumping the owner back on the sticker list.
  const openChatSession = useCallback((session: ChatSession | null) => {
    setSelectedChatSession(session);
    rememberOwnerThread(session?.id ?? null);
  }, []);

  // The remembered id can only be matched once the sessions themselves arrive,
  // and only on the first load — after that, a closed drawer stays closed.
  const restoredChatRef = useRef(false);
  useEffect(() => {
    if (restoredChatRef.current || ownerSessions.length === 0) return;
    restoredChatRef.current = true;
    const remembered = recallOwnerThread();
    if (!remembered) return;
    const match = ownerSessions.find((s) => s.id === remembered);
    if (match) setSelectedChatSession(match);
  }, [ownerSessions]);

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
    socket.on('inbox_updated', loadOwnerSessions);

    return () => {
      window.removeEventListener('hashchange', handleHash);
      socket.off('new_message', onNewMessage);
      socket.off('inbox_updated', loadOwnerSessions);
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

  const isPhoneComplete = isAdminAccount || Boolean(profile?.isPhoneVerified && profile?.phoneNumber);
  const isContactsComplete = totalContacts > 0;
  const isStickersComplete = activeCount > 0;
  const completedSetupCount = [isPhoneComplete, isContactsComplete, isStickersComplete].filter(Boolean).length;
  const setupPercent = Math.round((completedSetupCount / 3) * 100);

  // ─── DASHBOARD PREPARATION SPLASH LOADING ANIMATION ───
  if (isPreparing) {
    return (
      <div className="fx-shell fixed inset-0 z-50 flex items-center justify-center bg-[var(--fx-canvas)] px-6 text-center text-[var(--fx-ink)] animate-fade-in">
        <div className="flex w-full max-w-sm flex-col items-center">
          <AppLogo variant="light" className="mb-7 h-9 w-auto object-contain" />
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--fx-accent)]/25 bg-[var(--fx-accent-soft)]">
            <Loader2 size={22} className="animate-spin text-[var(--fx-accent)]" />
          </div>
          <h2 className="text-lg font-semibold tracking-tight sm:text-xl">Preparing your dashboard</h2>
          <p className="mt-2 max-w-xs text-xs font-medium leading-relaxed text-[var(--fx-ink-2)] sm:text-sm">
            Synchronizing safety stickers, emergency contacts, and protection settings...
          </p>
          <div className="mt-7 h-1 w-44 overflow-hidden rounded-full bg-[var(--fx-border)]">
            <div className="h-full w-full rounded-full bg-[var(--fx-accent)] animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // ─── PRE-PURCHASE GATE ───
  // A signed-in user with zero stickers has nothing for the dashboard to
  // manage yet. Rather than build/show the full sidebar+tabs dashboard shell
  // around an empty state, show only a minimal "you're logged in" header and
  // a full-page shop — the real dashboard is created the moment they own a
  // sticker (loadProducts() finding one flips products.length > 0). Admin
  // accounts previewing the client dashboard skip this gate entirely.
  if (!isAdminAccount && !productsLoading && products.length === 0) {
    return (
      <div className="fx-shell min-h-screen w-full bg-[var(--fx-canvas)] text-[var(--fx-ink)] font-body">
        <header className="flex items-center justify-between border-b border-[var(--fx-border)] bg-white px-5 py-4 sm:px-8">
          <button onClick={onBack} className="flex items-center gap-2 cursor-pointer">
            <AppLogo variant="light" className="h-8 w-auto object-contain" />
          </button>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs font-medium text-[var(--fx-ink-2)] sm:inline">
              Logged in as{' '}
              <span className="font-semibold text-[var(--fx-ink)]">
                {profile?.fullName || profile?.email || 'you'}
              </span>
            </span>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--fx-border)] px-3 py-2 text-xs font-semibold text-[var(--fx-ink-2)] hover:bg-[var(--fx-canvas)] cursor-pointer"
            >
              <LogOut size={14} /> Log out
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
          <div className="mb-10 text-center">

            <h1 className="text-2xl font-black tracking-tight text-[var(--fx-ink)] sm:text-3xl">
              Purchase a Safety Sticker to Create &amp; Activate Your Dashboard
            </h1>

            <button
              onClick={() => setModal({ type: 'recover' })}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--fx-accent)] hover:underline cursor-pointer"
            >
              <QrCode size={20} /> Already have a tag? Link it by recovery code
            </button>
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
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-sm font-bold text-[var(--fx-ink)]">{product.name}</h3>
                      <div className="shrink-0 text-right">
                        <div className="text-sm font-bold text-[var(--fx-ink)]">₹{product.price}</div>
                        <div className="text-[11px] text-[var(--fx-faint)] line-through">₹{product.mrp}</div>
                      </div>
                    </div>
                    <p className="mt-1.5 text-xs text-[var(--fx-ink-2)]">{product.desc}</p>
                  </div>
                  <button
                    onClick={() => handleBuyProduct(product)}
                    className="mt-4 flex items-center justify-center gap-1.5 rounded-lg bg-[var(--fx-ink)] py-2.5 text-xs font-bold text-white hover:opacity-90 cursor-pointer"
                  >
                    <ShoppingBag size={13} /> Buy this sticker <ArrowRight size={13} />
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

  return (
    <div className="fx-shell min-h-screen w-full flex flex-col overflow-x-hidden text-[var(--fx-ink)] bg-[var(--fx-canvas)] font-body pb-16">

      <div className="flex flex-1 min-h-screen">
        {/* Mobile drawer backdrop — md+ docks the sidebar so it never renders there */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 z-[25] bg-black/50 md:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* ─── SIDEBAR — light, same canvas family as the page, hairline border ─── */}
        <aside
          className={`w-[245px] flex-shrink-0 flex flex-col h-screen fixed left-0 top-0 bottom-0 py-4 px-3 border-r border-[var(--fx-border)] bg-[var(--fx-sidebar-bg)] text-[var(--fx-sidebar-ink)] z-30 transition-all duration-300 ${
            isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
          }`}
        >
          {/* Logo */}
          <div className="flex items-center justify-between px-2 mb-4 flex-shrink-0">
            <button onClick={onBack} className="flex items-center gap-2 cursor-pointer group">
              <AppLogo variant="light" className="h-9 w-auto object-contain transition-transform group-hover:scale-105" />
            </button>
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-[var(--fx-sidebar-ink)] hover:text-[var(--fx-ink)] hover:bg-[var(--fx-sidebar-hover)] transition-all cursor-pointer"
              aria-label="Close navigation menu"
            >
              <X size={18} />
            </button>
          </div>

          {/* Setup Box Widget */}
          <div
            onClick={() => setActiveTab('setup')}
            className="border border-[var(--fx-border)] rounded-lg p-3 mb-3 bg-[var(--fx-surface)] hover:bg-[var(--fx-sidebar-hover)] transition-colors cursor-pointer"
          >
            <div className="flex justify-between items-center text-xs text-[var(--fx-ink)] font-semibold mb-2">
              <span>Set up your account</span>
              <span className="text-[var(--fx-green)] font-bold">›</span>
            </div>
            <div className="h-[6px] bg-[var(--fx-border)] rounded-full overflow-hidden">
              <div className="h-full bg-[var(--fx-green)] rounded-full transition-all duration-500" style={{ width: `${setupPercent}%` }} />
            </div>
            <div className="text-[11px] text-[var(--fx-sidebar-ink)] mt-1.5">{completedSetupCount}/3 completed</div>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar-light">
            {(() => {
              let lastSection: string | undefined;
              return NAV_ITEMS.map((item) => {
                const isActive = activeTab === item.id;
                const isChat = item.id === 'chat';
                const showLabel = item.section && item.section !== lastSection;
                lastSection = item.section;
                return (
                  <div key={item.id}>
                    {showLabel && (
                      <p className="px-3 pt-4 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--fx-faint)]">
                        {item.section}
                      </p>
                    )}
                    <button
                      onClick={() => { setActiveTab(item.id); setIsMobileSidebarOpen(false); }}
                      className={`w-full h-[38px] rounded-lg flex items-center justify-between pl-2.5 pr-3 text-[13.5px] transition-all cursor-pointer border-l-2 ${
                        isActive
                          ? 'bg-[var(--fx-accent-soft)] text-[var(--fx-ink)] font-semibold border-l-[var(--fx-accent)]'
                          : 'text-[var(--fx-sidebar-ink)] border-l-transparent hover:bg-[var(--fx-sidebar-hover)] hover:text-[var(--fx-ink)]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <item.icon size={17} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {isChat && totalUnreadChats > 0 && (
                        <span className="bg-[var(--fx-accent)] text-white rounded-full text-[10px] font-bold px-2 py-0.5 shrink-0">
                          {totalUnreadChats}
                        </span>
                      )}
                    </button>
                  </div>
                );
              });
            })()}
          </nav>

          {/* Bottom Nav Profile */}
          <div className="pt-3 border-t border-[var(--fx-border)] space-y-1.5">
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--fx-sidebar-hover)] border border-[var(--fx-border)]">
              <InitialAvatar
                name={profile?.fullName}
                email={profile?.email}
                size={36}
                className="border border-[var(--fx-border-strong)] shadow-xs"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-[var(--fx-ink)] truncate leading-tight">{profile?.fullName || 'Client'}</p>
                <p className={`text-[11px] truncate font-mono font-medium mt-0.5 ${isAdminAccount || profile?.isPhoneVerified ? 'text-[var(--fx-green)]' : 'text-[var(--fx-amber)]'}`}>
                  {isAdminAccount ? 'Fleet Admin' : profile?.isPhoneVerified ? '✓ Phone Verified' : '⚠ Phone Unverified'}
                </p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-[var(--fx-red)] hover:bg-[var(--fx-red-soft)] transition-all cursor-pointer"
            >
              <LogOut size={15} />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* ─── RIGHT MAIN CONTENT CANVAS (margin-left: 245px) ─── */}
        <div className="flex-1 md:ml-[245px] min-h-screen flex flex-col min-w-0">
          
          {/* Top Bar */}
          <header className="h-[62px] flex-shrink-0 bg-[var(--fx-canvas)] border-b border-[var(--fx-border)] flex items-center justify-between gap-4 px-4 sm:px-8 lg:px-10 z-20">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                className="md:hidden flex-shrink-0 w-9 h-9 rounded-full bg-white border border-[var(--fx-border)] flex items-center justify-center text-[var(--fx-ink)] cursor-pointer"
                aria-label="Open navigation menu"
              >
                <Menu size={18} />
              </button>

              <div className="bg-[var(--fx-canvas)] rounded-full h-[36px] w-full max-w-[240px] min-w-0 flex items-center gap-2 px-3.5 text-[var(--fx-ink-2)] text-xs focus-within:ring-2 focus-within:ring-[var(--fx-accent)]/20 transition-all">
                <Search size={14} />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search stickers, contacts..."
                  className="bg-transparent border-none outline-none w-full text-xs text-[var(--fx-ink)] placeholder-[var(--fx-ink-2)]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 text-xs flex-shrink-0">
              <button
                onClick={handlePurchaseStickerClick}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 active:scale-[0.99] text-slate-950 font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                <ShoppingBag size={13} />
                <span>Buy Sticker</span>
              </button>

              <span className="font-semibold text-[var(--fx-accent-ink)] hidden sm:inline-flex items-center gap-1.5 bg-[var(--fx-accent-soft)] px-2.5 py-1 rounded-full text-xs">
                ◆ Pro Protection
              </span>
              <button
                onClick={() => setActiveTab('chat')}
                className="relative p-2 text-[var(--fx-ink-2)] hover:text-[var(--fx-ink)] hover:bg-black/5 rounded-full cursor-pointer transition-colors"
                title={totalUnreadChats > 0 ? `${totalUnreadChats} unread message(s)` : 'Live Chat Notifications'}
              >
                <Bell size={18} />
                {totalUnreadChats > 0 && (
                  <span className="absolute top-0.5 right-0.5 bg-[var(--fx-accent)] text-white rounded-full text-[9px] px-1.5 font-bold animate-pulse">
                    {totalUnreadChats}
                  </span>
                )}
              </button>
              <span className="bg-[var(--fx-accent-soft)] text-[var(--fx-accent-ink)] rounded-lg px-2 py-1 text-xs font-bold shadow-2xs">✦ Active</span>
            </div>
          </header>

          {/* Page Container (expanded for spacious and zoomed look) */}
          <main className="max-w-[1360px] w-full mx-auto p-4 sm:p-7 lg:p-9 space-y-7">

            {/* ── MANDATORY PHONE VERIFICATION ALERT BANNER ── */}
            {(!isAdminAccount && !profile?.isPhoneVerified && (!profile?.phoneNumber || profile?.isPhoneVerified === false) && !profilePopupDismissed) && (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-fade-in relative">
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
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setActiveTab('settings');
                      setOtpStep('input');
                    }}
                    className="flex-1 sm:flex-initial px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 flex-shrink-0 shadow-xs cursor-pointer"
                  >
                    <Smartphone size={14} />
                    <span>{profile?.phoneNumber ? 'Verify Phone via OTP' : 'Add & Verify Mobile Number'}</span>
                    <ArrowRight size={14} />
                  </button>
                  <button
                    onClick={handleDismissProfilePopup}
                    className="p-2 text-amber-700 hover:text-amber-900 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer"
                    title="Dismiss alert"
                    aria-label="Dismiss alert"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}


            {/* ════ SETUP GUIDE PAGE ════ */}
            {activeTab === 'setup' && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-white border border-[var(--fx-border)] rounded-lg p-6 shadow-xs space-y-6">
                  <div className="flex justify-between items-center border-b border-[var(--fx-border)] pb-4">
                    <div>
                      <h1 className="text-2xl font-bold text-[var(--fx-ink)]">Welcome to RapiQR, {profile?.fullName || 'Client'}!</h1>
                      <p className="text-xs text-[var(--fx-ink-2)] mt-1">Let's start step-by-step to protect your vehicles.</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-semibold text-[var(--fx-ink)]">{completedSetupCount}/3 completed</span>
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
                          <p className="font-semibold text-sm text-[var(--fx-ink)]">Verify Mobile Phone Number OTP</p>
                          <p className="text-xs text-[var(--fx-ink-2)]">
                            {isPhoneComplete
                              ? `Verified mobile number linked: ${profile?.phoneNumber}`
                              : profile?.phoneNumber
                                ? `Verification pending for ${profile.phoneNumber}`
                                : 'No mobile number verified yet (Required to auto-claim stickers)'}
                          </p>
                        </div>
                      </div>
                      {isPhoneComplete ? (
                        <span className="text-xs font-bold text-[#2E9E5B]">Completed</span>
                      ) : (
                        <button
                          onClick={() => {
                            setActiveTab('settings');
                            setOtpStep('input');
                          }}
                          className="text-xs font-bold text-amber-600 hover:underline cursor-pointer"
                        >
                          Verify Phone ›
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
                          <p className="font-semibold text-sm text-[var(--fx-ink)]">Link Emergency Responders</p>
                          <p className="text-xs text-[var(--fx-ink-2)]">{totalContacts} emergency contact numbers active</p>
                        </div>
                      </div>
                      <button onClick={() => setActiveTab('contacts')} className="text-xs font-bold text-[var(--fx-accent)] hover:underline cursor-pointer">
                        {isContactsComplete ? 'Configure ›' : 'Add Contacts ›'}
                      </button>
                    </div>

                    {/* Step 3: Safety Stickers */}
                    <div className="border border-[var(--fx-border)] rounded-md p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full ${isStickersComplete ? 'bg-[#55C77D]' : 'bg-slate-300'} text-white flex items-center justify-center text-xs font-bold`}>
                          {isStickersComplete ? '✓' : '3'}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-[var(--fx-ink)]">Active Safety QR Plates</p>
                          <p className="text-xs text-[var(--fx-ink-2)]">{activeCount} active vehicle QR plates online</p>
                        </div>
                      </div>
                      <button onClick={() => setActiveTab('overview')} className="text-xs font-bold text-[var(--fx-accent)] hover:underline cursor-pointer">
                        View Stickers ›
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
                <div className="flex justify-between items-start pt-2 pb-4">
                  <div className="flex gap-4 items-center">
                    <div className="w-[73px] h-[62px] relative overflow-hidden shrink-0 rounded-2xl bg-gradient-to-tr from-[#624FE1] via-[#D55BEA] to-[#4B72DB] p-0.5 shadow-md flex items-center justify-center text-white font-bold text-xl">
                      RQ
                    </div>
                    <div>
                      <div className="text-xs text-[var(--fx-ink-2)] mb-1">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                      </div>
                      <h1 className="text-2xl sm:text-[28px] font-bold text-[var(--fx-ink)] leading-tight tracking-tight">
                        Good morning, {profile?.fullName?.split(' ')[0] || 'Client'}
                      </h1>
                      <p className="text-xs sm:text-sm text-[var(--fx-ink-2)] mt-0.5">
                        Pajama bottoms? No one has to know. Your vehicle safety protection is active.
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-[var(--fx-ink-2)] hidden sm:block">
                    <span className="font-semibold text-[var(--fx-ink)]">RapiQR Pro Plan</span><br />
                    <span className="text-[#43818D] font-semibold">Active Protection Enabled</span>
                  </div>
                </div>

                {/* ─── STICKER PURCHASE REQUIRED HERO CARD (When 0 stickers) ─── */}
                {products.length === 0 && !productsLoading && (
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0F1015] via-[#161822] to-[#0A0B0E] text-white p-6 sm:p-7 border border-amber-500/30 shadow-xl">
                    <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 bg-amber-400/15 rounded-full blur-3xl" />

                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                      <div className="max-w-xl space-y-2 text-left">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-[11px] font-bold tracking-wide uppercase">
                          <Sparkles size={13} /> Sticker Purchase Required
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white font-display">
                          Purchase a Safety Sticker to Create & Activate Your Dashboard
                        </h2>
                        <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed">
                          Your account is ready! To generate your vehicle QR plate, emergency responder tree, and instant WhatsApp parking alerts, purchase your RapiQR smart safety tag.
                        </p>
                        <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-zinc-400">
                          <span className="flex items-center gap-1"><ShieldCheck size={14} className="text-emerald-400" /> 100% Number Masking</span>
                          <span className="flex items-center gap-1"><Zap size={14} className="text-amber-400" /> 0.4s Instant Alerts</span>
                          <span className="flex items-center gap-1"><CheckCircle2 size={14} className="text-emerald-400" /> Free Delivery</span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
                        <button
                          onClick={handlePurchaseStickerClick}
                          className="h-11 px-6 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-[0.99] text-black font-extrabold text-sm shadow-lg shadow-amber-400/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <ShoppingBag size={17} />
                          <span>Purchase Sticker (₹199) →</span>
                        </button>
                        <button
                          onClick={() => setModal({ type: 'recover' })}
                          className="h-9 px-4 rounded-lg border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 active:scale-[0.99] text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <QrCode size={13} />
                          <span>Have a Tag? Link by Code</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* HoneyBook Stats Bar (4 columns) */}
                <div className="bg-white border border-[var(--fx-border)] shadow-[0_1px_4px_rgba(0,0,0,0.04)] grid grid-cols-2 lg:grid-cols-4 rounded-lg overflow-hidden divide-x divide-y lg:divide-y-0 divide-[var(--fx-border)]">
                  <div className="p-6">
                    <div className="text-xs text-[var(--fx-ink-2)] mb-1">Active Stickers <small className="text-[var(--fx-faint)]">ⓘ</small></div>
                    <div className="text-3xl font-light tracking-tight text-[var(--fx-ink)]">{activeCount}</div>
                  </div>
                  <div className="p-6">
                    <div className="text-xs text-[var(--fx-ink-2)] mb-1">Total Scans <small className="text-[var(--fx-faint)]">ⓘ</small></div>
                    <div className="text-3xl font-light tracking-tight text-[var(--fx-ink)]">{totalScans}</div>
                  </div>
                  <div className="p-6">
                    <div className="text-xs text-[var(--fx-ink-2)] mb-1">Emergency Contacts <small className="text-[var(--fx-faint)]">ⓘ</small></div>
                    <div className="text-3xl font-light tracking-tight text-[var(--fx-ink)]">{totalContacts}</div>
                  </div>
                  <div className="p-6">
                    <div className="text-xs text-[var(--fx-ink-2)] mb-1">Security Status <small className="text-[var(--fx-faint)]">ⓘ</small></div>
                    <div className="text-2xl font-semibold text-[#4FC47A] tracking-tight mt-1">Protected</div>
                  </div>
                </div>

                {/* Bento Grid (3 Columns) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  
                  {/* Card 1: Create New */}
                  <div className="bg-white border border-[var(--fx-border)] shadow-[0_1px_4px_rgba(0,0,0,0.03)] rounded-lg p-4 flex flex-col justify-between min-h-[360px]">
                    <div>
                      <h3 className="text-xs font-semibold text-[var(--fx-ink)] mb-3.5">Quick Actions</h3>
                      <div className="space-y-2">
                        <button
                          onClick={() => setActiveTab('chat')}
                          className="w-full h-11 border border-[var(--fx-border)] bg-[var(--fx-canvas)] rounded hover:border-[var(--fx-accent)] flex items-center px-3 gap-2.5 text-xs text-[var(--fx-ink)] font-bold hover:bg-[var(--fx-canvas)] transition-colors cursor-pointer"
                        >
                          <span className="text-[var(--fx-accent)] font-bold text-sm">💬</span> Open Live Visitor Chat
                        </button>
                        <button
                          onClick={() => setActiveTab('contacts')}
                          className="w-full h-11 border border-[var(--fx-border)] rounded hover:border-[var(--fx-accent)] flex items-center px-3 gap-2.5 text-xs text-[var(--fx-ink)] font-medium hover:bg-[var(--fx-canvas)] transition-colors cursor-pointer"
                        >
                          <span className="text-[var(--fx-accent)] font-bold text-sm">♙</span> Add Emergency Contact
                        </button>
                        <button
                          onClick={async () => {
                            const found = await loadProducts();
                            showToast(`Refreshed ${found?.length || 0} stickers`);
                          }}
                          className="w-full h-11 border border-[var(--fx-border)] rounded hover:border-[var(--fx-accent)] flex items-center px-3 gap-2.5 text-xs text-[var(--fx-ink)] font-medium hover:bg-[var(--fx-canvas)] transition-colors cursor-pointer"
                        >
                          <span className="text-[var(--fx-accent)] font-bold text-sm">▣</span> Sync Safety Stickers
                        </button>
                        <button
                          onClick={() => setModal({ type: 'qrCode', sticker: products[0] })}
                          disabled={!products[0]}
                          className="w-full h-11 border border-[var(--fx-border)] rounded hover:border-[var(--fx-accent)] flex items-center px-3 gap-2.5 text-xs text-[var(--fx-ink)] font-medium hover:bg-[var(--fx-canvas)] transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <span className="text-[var(--fx-accent)] font-bold text-sm">⚡</span> View QR Plate Code
                        </button>
                        <button
                          onClick={() => setActiveTab('history')}
                          className="w-full h-11 border border-[var(--fx-border)] rounded hover:border-[var(--fx-accent)] flex items-center px-3 gap-2.5 text-xs text-[var(--fx-ink)] font-medium hover:bg-[var(--fx-canvas)] transition-colors cursor-pointer"
                        >
                          <span className="text-[var(--fx-accent)] font-bold text-sm">▤</span> Scan Logs & Alerts
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Active Stickers */}
                  <div className="bg-white border border-[var(--fx-border)] shadow-[0_1px_4px_rgba(0,0,0,0.03)] rounded-lg p-4 flex flex-col justify-between min-h-[360px]">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-xs font-semibold text-[var(--fx-ink)]">My Safety Stickers ({products.length})</h3>
                        <div className="flex items-center gap-2.5">
                          <button onClick={() => setModal({ type: 'recover' })} className="text-xs text-[var(--fx-accent)] hover:underline cursor-pointer">Recover a sticker</button>
                          <button onClick={() => loadProducts()} className="text-xs text-[var(--fx-accent)] hover:underline cursor-pointer">Refresh</button>
                        </div>
                      </div>

                      {productsLoading ? (
                        <div className="py-12 text-center text-xs text-[var(--fx-ink-2)]">Loading stickers...</div>
                      ) : products.length === 0 ? (
                        <div className="py-8 text-center text-xs text-[var(--fx-ink-2)] space-y-3">
                          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-400/10 text-amber-500 flex items-center justify-center">
                            <ShoppingBag size={22} />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-[var(--fx-ink)]">No Safety Stickers Linked Yet</p>
                            <p className="text-[11px] text-[var(--fx-ink-2)] mt-0.5">Purchase your first sticker to create your vehicle plate.</p>
                          </div>
                          <button
                            onClick={handlePurchaseStickerClick}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-black hover:bg-zinc-800 active:scale-[0.99] text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                          >
                            <Plus size={14} /> Buy Safety Sticker
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                          {products.slice(0, 4).map((p) => (
                            <div key={p.id} className="p-3 border border-[var(--fx-border)] rounded-md bg-[var(--fx-canvas)] flex items-center justify-between gap-2">
                              <div>
                                <p className="font-bold text-xs text-[var(--fx-ink)]">{p.qrCodeId}</p>
                                <p className="text-[11px] text-[var(--fx-ink-2)] font-medium">{p.nickname || p.vehicleNumber || 'Vehicle Tag'}</p>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => setModal({ type: 'qrCode', sticker: p })}
                                  className="px-2 py-1 bg-[var(--fx-accent-soft)] border border-[var(--fx-accent-ink)] text-[var(--fx-accent-ink)] text-[11px] font-bold rounded cursor-pointer"
                                >
                                  QR
                                </button>
                                <button
                                  onClick={() => setModal({ type: 'editDetails', sticker: p })}
                                  className="px-2 py-1 bg-white border border-[var(--fx-border)] text-[var(--fx-ink)] text-[11px] font-semibold rounded cursor-pointer"
                                >
                                  Edit
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
                                <p className="text-[11px] font-bold text-[#8A5A00] truncate">{s.nickname || s.qrCodeId} no longer shows here</p>
                                <p className="text-[10px] text-[#A67C1F] font-mono truncate">{s.qrCodeId}</p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => handleQuickRecover(s.qrCodeId)}
                                  disabled={recoveringId === s.qrCodeId}
                                  className="px-2 py-1 bg-white border border-[var(--fx-accent-ink)] text-[var(--fx-accent-ink)] text-[10px] font-bold rounded cursor-pointer disabled:opacity-60"
                                >
                                  {recoveringId === s.qrCodeId ? 'Recovering…' : 'Recover'}
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
                      View all safety stickers ›
                    </div>
                  </div>

                  {/* Card 3: Emergency Responders */}
                  <div className="bg-white border border-[var(--fx-border)] shadow-[0_1px_4px_rgba(0,0,0,0.03)] rounded-lg p-4 flex flex-col justify-between min-h-[360px]">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-xs font-semibold text-[var(--fx-ink)]">Emergency Contacts ({totalContacts})</h3>
                        <button onClick={() => setActiveTab('contacts')} className="text-xs text-[var(--fx-accent)] hover:underline cursor-pointer">＋ Contact</button>
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
                            <p>No emergency contacts added yet.</p>
                            <button onClick={() => setActiveTab('contacts')} className="text-[var(--fx-accent)] font-bold mt-2 hover:underline">Add Emergency Responders</button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="pt-2 text-xs font-semibold text-[var(--fx-accent)] cursor-pointer hover:underline" onClick={() => setActiveTab('contacts')}>
                      Manage responder contacts ›
                    </div>
                  </div>

                </div>

                {/* Lower Grid (2 Columns: Scans & Activity Log) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                  <div className="bg-white border border-[var(--fx-border)] shadow-[0_1px_4px_rgba(0,0,0,0.03)] rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-xs font-semibold text-[var(--fx-ink)]">Recent Scans Log ⓘ</h3>
                      <button onClick={() => setActiveTab('history')} className="text-xs text-[var(--fx-accent)] hover:underline">Full Log</button>
                    </div>
                    <div className="space-y-2 mt-3">
                      {allHistory.slice(0, 2).map((h, i) => (
                        <div key={i} className="border border-[var(--fx-border)] rounded p-2.5 flex items-center gap-3">
                          <div className="border-l-4 border-[var(--fx-accent-soft)] bg-[var(--fx-canvas)] px-2 py-1 text-center text-xs font-bold min-w-[50px]">
                            {new Date(h.created_at).getDate()}
                            <small className="block text-[9px] font-normal uppercase">{new Date(h.created_at).toLocaleDateString('en-US', { month: 'short' })}</small>
                          </div>
                          <div className="text-xs min-w-0 flex-1">
                            <p className="font-semibold text-[var(--fx-ink)] truncate">{h.stickerCode} scanned</p>
                            <p className="text-[10px] text-[var(--fx-ink-2)]">{h.event_type || 'Vehicle QR Scan Recorded'}</p>
                          </div>
                        </div>
                      ))}
                      {allHistory.length === 0 && (
                        <p className="text-xs text-[var(--fx-ink-2)] py-6 text-center">No scan events recorded recently.</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-white border border-[var(--fx-border)] shadow-[0_1px_4px_rgba(0,0,0,0.03)] rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-xs font-semibold text-[var(--fx-ink)]">Activity Stream ⓘ</h3>
                      <button onClick={() => setActiveTab('history')} className="text-xs text-[var(--fx-accent)] hover:underline">View All</button>
                    </div>
                    <div className="space-y-2 mt-3 text-xs">
                      <div className="p-2.5 bg-[var(--fx-canvas)] rounded border border-[var(--fx-border)] flex justify-between">
                        <span>▱ &nbsp; Verified Protection Active</span>
                        <span className="text-[var(--fx-ink-2)]">Live</span>
                      </div>
                      <div className="p-2.5 bg-[var(--fx-canvas)] rounded border border-[var(--fx-border)] flex justify-between">
                        <span>♙ &nbsp; Responder SMS Notification Ready</span>
                        <span className="text-[var(--fx-ink-2)]">Active</span>
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
                    <h1 className="font-display text-[26px] font-bold text-[var(--fx-ink)]">
                      Live Visitor Chat Inbox
                    </h1>
                    <p className="text-[13.5px] text-[var(--fx-ink-2)] mt-1">
                      Real-time chat threads from visitors scanning your safety stickers
                    </p>
                  </div>
                  <button
                    onClick={loadOwnerSessions}
                    disabled={ownerSessionsLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-[var(--fx-border)] text-xs font-bold text-[var(--fx-ink)] hover:bg-[var(--fx-canvas)] cursor-pointer"
                  >
                    <RefreshCcw size={14} className={ownerSessionsLoading ? 'animate-spin' : ''} /> Refresh Inbox
                  </button>
                </div>

                {ownerSessionsLoading ? (
                  <div className="bg-white border border-[var(--fx-border)] rounded-lg p-16 text-center text-[var(--fx-ink-2)]">
                    <Loader2 size={32} className="animate-spin mx-auto mb-2 text-[var(--fx-accent)]" />
                    <p className="text-xs font-semibold">Loading live visitor chat sessions...</p>
                  </div>
                ) : ownerSessions.length === 0 ? (
                  <div className="bg-white border border-[var(--fx-border)] rounded-lg p-12 text-center text-[var(--fx-ink-2)] space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-[var(--fx-accent-soft)] text-[var(--fx-accent)] mx-auto flex items-center justify-center font-bold">
                      <MessageSquare size={28} />
                    </div>
                    <p className="text-sm font-bold text-[var(--fx-ink)]">Your inbox is empty</p>
                    <p className="text-xs text-[var(--fx-ink-2)] max-w-md mx-auto">
                      When a visitor scans your vehicle's QR plate and sends a message, their live chat thread will appear here so you can reply instantly.
                    </p>
                  </div>
                ) : (
                  <div className="bg-white border border-[var(--fx-border)] rounded-lg overflow-hidden divide-y divide-[var(--fx-border)]">
                    {ownerSessions.map((sess) => (
                      <div
                        key={sess.id}
                        onClick={() => openChatSession(sess)}
                        className="p-4 hover:bg-[var(--fx-canvas)] transition-colors flex items-center justify-between gap-4 cursor-pointer"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-[var(--fx-accent-soft)] text-[var(--fx-accent)] flex items-center justify-center font-bold text-sm shrink-0">
                            <MessageCircle size={20} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-sm text-[var(--fx-ink)] truncate">{sess.customer_name || 'Visitor'}</p>
                              {sess.vehicle_label && (
                                <span className="px-2 py-0.5 rounded bg-[var(--fx-canvas)] border border-[var(--fx-border)] text-[10px] font-mono font-semibold text-[var(--fx-ink-2)]">
                                  {sess.vehicle_label}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[var(--fx-ink-2)] truncate mt-0.5">{sess.last_message_preview || 'No messages yet'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <span className="text-[11px] text-[var(--fx-faint)] font-mono">
                              {sess.last_message_at ? new Date(sess.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                            <span className="mt-1 block text-xs font-bold text-[var(--fx-accent)] hover:underline">
                              Open Chat ›
                            </span>
                          </div>
                          <button
                            onClick={(e) => handleDeleteChatSession(e, sess.id)}
                            title="Delete conversation"
                            className="p-2 text-[var(--fx-faint)] hover:text-[#DC2626] hover:bg-[#FEE2E2] rounded-lg transition-colors cursor-pointer"
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

            {/* ════ VIEW 1B: PRODUCTS (PURCHASE / ORDER HISTORY) ════ */}
            {activeTab === 'products' && (
              <div className="space-y-6">
                <div>
                  <h1 className="font-display text-[26px] font-bold text-[var(--fx-ink)]">
                    Products
                  </h1>
                  <p className="text-[13.5px] text-[var(--fx-ink-2)] mt-1">
                    Your purchase history — every order placed at checkout, with payment status.
                  </p>
                </div>

                {myOrdersLoading ? (
                  <div className="bg-white border border-[var(--fx-border)] rounded-[14px] p-16 text-center text-[var(--fx-faint)]">
                    <Loader2 size={32} className="animate-spin mx-auto mb-2 text-[var(--fx-accent)]" />
                    <p className="text-[13.5px] font-semibold text-[var(--fx-ink)]">Loading your orders...</p>
                  </div>
                ) : myOrdersError ? (
                  <div className="bg-white border border-[var(--fx-border)] rounded-[14px] p-16 text-center text-[var(--fx-faint)]">
                    <AlertTriangle size={32} className="mx-auto mb-2 text-[#DC2626]" />
                    <p className="text-[13.5px] font-semibold text-[var(--fx-ink)]">{myOrdersError}</p>
                  </div>
                ) : myOrders.length === 0 ? (
                  <div className="bg-white border border-[var(--fx-border)] rounded-[14px] p-16 text-center text-[var(--fx-faint)]">
                    <ShoppingBag size={34} className="mx-auto mb-3 opacity-50 text-[var(--fx-accent)]" />
                    <p className="text-[13.5px] text-[var(--fx-ink)] font-semibold">No orders yet.</p>
                    <p className="text-[12.5px] text-[var(--fx-faint)] mt-1">Purchases you make on the RapiQR store will show up here.</p>
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
                                <span className="font-mono text-[var(--fx-ink-2)]">₹{(it.price * it.qty).toLocaleString('en-IN')}</span>
                              </div>
                            ))}
                          </div>

                          {/* ── Delivery progress ── */}
                          {o.status !== 'cancelled' && (
                            <div className="mt-3 pt-3 border-t border-[var(--fx-canvas)]">
                              <div className="flex items-center">
                                {DELIVERY_STEPS.map((stepLabel, idx) => {
                                  const reached = idx <= DELIVERY_STEPS.indexOf(
                                    o.status === 'delivered' ? 'Delivered' : o.status === 'shipped' ? 'Shipped' : 'Ordered'
                                  );
                                  return (
                                    <React.Fragment key={stepLabel}>
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
                                  {o.shiprocket.courierName || 'Courier'}
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
                                    : <RefreshCcw size={13} className="text-[var(--fx-accent)]" />}
                                  {trackLoading[o.id] ? 'Checking…' : trackOpen[o.id] ? 'Hide tracking' : 'Track delivery'}
                                </button>
                                {o.shiprocket?.trackingUrl && (
                                  <a
                                    href={o.shiprocket.trackingUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-semibold text-[var(--fx-ink-2)] hover:text-[var(--fx-ink)] transition-colors"
                                  >
                                    Courier site
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
                                        ? "We're preparing your order. Tracking appears here as soon as it's handed to the courier."
                                        : 'No courier scans reported yet — check back shortly.'}
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
                  <h1 className="font-display text-[26px] font-bold text-[var(--fx-ink)]">
                    Alert History
                  </h1>
                  <p className="text-[13.5px] text-[var(--fx-ink-2)] mt-1">
                    Log of scan events and responder alerts across your stickers
                  </p>
                </div>

                {allHistoryLoading ? (
                  <div className="bg-white border border-[var(--fx-border)] rounded-[14px] p-16 text-center text-[var(--fx-faint)]">
                    <Loader2 size={32} className="animate-spin mx-auto mb-2 text-[var(--fx-accent)]" />
                    <p className="text-[13.5px] font-semibold text-[var(--fx-ink)]">Fetching alert history...</p>
                  </div>
                ) : allHistory.length === 0 ? (
                  <div className="bg-white border border-[var(--fx-border)] rounded-[14px] p-16 text-center text-[var(--fx-faint)]">
                    <History size={34} className="mx-auto mb-3 opacity-50 text-[var(--fx-accent)]" />
                    <p className="text-[13.5px] text-[var(--fx-ink)] font-semibold">No alert events recorded yet.</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-[14px] border border-[var(--fx-border)] overflow-x-auto">
                    <table className="w-full min-w-[520px] text-sm text-[var(--fx-ink)]">
                      <thead>
                        <tr className="text-left font-display text-[12px] font-semibold text-[var(--fx-ink-2)] tracking-normal bg-[var(--fx-canvas)] border-b border-[var(--fx-border)]">
                          <th className="px-6 py-3">Sticker</th>
                          <th className="px-3 py-3">Event</th>
                          <th className="px-3 py-3">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--fx-border)]">
                        {allHistory.map((h, i) => (
                          <tr key={i} className="hover:bg-[var(--fx-canvas)]">
                            <td className="px-6 py-3 font-display font-semibold text-[15px]">{h.stickerCode}</td>
                            <td className="px-3 py-3 text-xs">{h.event_type || 'Scan Recorded'}</td>
                            <td className="px-3 py-3 font-mono text-xs text-[var(--fx-faint)]">{new Date(h.created_at).toLocaleString('en-IN')}</td>
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
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => openChatSession(null)}
          />
          {/* Edge-to-edge on a phone (dvh keeps the composer clear of the
              browser chrome), a 26rem drawer from sm up. */}
          <div className="relative z-10 w-full sm:w-[26rem] max-w-full h-dvh bg-white shadow-2xl flex flex-col sm:border-l border-[var(--fx-border)] animate-slide-in-right">
            <RepiChat
              key={selectedChatSession.id}
              mode="owner"
              sessionId={selectedChatSession.id}
              title={selectedChatSession.customer_name}
              subtitle={
                [selectedChatSession.vehicle_label, selectedChatSession.qr_code_id]
                  .filter(Boolean)
                  .join(' · ') || undefined
              }
              onClose={() => openChatSession(null)}
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
          onProductsLinked={loadProducts}
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

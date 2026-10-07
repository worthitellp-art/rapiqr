import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Lock,
  ShieldCheck,
  Truck,
  CheckCircle2,
  ArrowRight,
  User,
  ArrowLeft,
  ShoppingBag,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { orderTranslations } from '../../i18n/orderTranslations';
import { apiClient } from '../../lib/apiClient';
import PhoneInputWithCountry from '../common/PhoneInputWithCountry';
import AutocompleteField from '../common/AutocompleteField';
import AppLogo from '../common/AppLogo';
import { INDIAN_CITIES } from '../../data/locations';
import { OrderInvoice } from '../../types/invoice';
import { buildOrderInvoice, printOrderInvoice } from '../../services/invoiceService';
import OrderInvoiceModal from './OrderInvoiceModal';
import DashboardAccessModal from './DashboardAccessModal';
import { BALANCE_TOPUP_AMOUNT } from '../../data/products';
import { FlowButton } from '../ui/flow-button';

/**
 * Last-resort local receipt when the backend order API is unreachable —
 * keeps checkout from dead-ending if a payment attempt is already in
 * flight. Not synced anywhere; purely so the customer has a reference id.
 */
function createLocalOrderFallback(order: {
  name: string; email: string; phone: string;
  items: any[]; subtotal: number; deliveryFee: number; total: number;
  paymentMethod: string; deliveryMethod: string; shippingAddress?: any;
  userId?: string;
}) {
  const orderId = '#NQ-' + Math.floor(100000 + Math.random() * 899999);
  const localOrder = { id: orderId, createdAt: new Date().toISOString(), ...order };
  try {
    const existing = JSON.parse(localStorage.getItem('repiqr-orders') || localStorage.getItem('namoqr-orders') || '[]');
    localStorage.setItem('repiqr-orders', JSON.stringify([localOrder, ...existing]));
    localStorage.setItem('namoqr-orders', JSON.stringify([localOrder, ...existing]));
  } catch {
    /* ignore storage errors — the in-memory id is still returned below */
  }
  return { success: true, data: localOrder };
}

/* ── Types ──────────────────────────────────────────────────────────────── */

interface CheckoutProduct {
  id: string;
  name: string;
  price: number;
  img: string;
  category: string;
}

interface CheckoutCartItem {
  product: CheckoutProduct;
  qty: number;
}

interface CheckoutPageProps {
  onBack: () => void;
  onOpenSignup: (email: string) => void;
  onOpenLogin: () => void;
  onViewDashboard: () => void;
  onOrderComplete?: () => void;
  onTrackOrder?: (orderId: string, contact?: string) => void;
  onRegisterSticker?: (stickerId: string) => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/* Shared checkout field styling — see the .checkout-theme tokens in index.css. */
const fieldInputCls =
  'w-full h-[54px] px-3.5 pt-5 pb-2 rounded-[var(--co-radius-sm)] border border-[var(--co-line)] bg-white focus:border-[var(--co-accent)] focus:ring-2 focus:ring-[var(--co-accent-soft)] text-[16px] sm:text-sm text-[var(--co-ink)] outline-none transition-colors';
const stepBadgeCls =
  'w-7 h-7 rounded-full bg-[var(--co-accent-soft)] text-[var(--co-accent)] text-xs font-bold flex items-center justify-center shrink-0';

function CheckoutFloatingField({
  id,
  label,
  value,
  children,
  className = '',
}: {
  id: string;
  label: string;
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`checkout-floating-field ${value ? 'is-filled' : ''} ${className}`}
    >
      {children}
      <label htmlFor={id} className="checkout-floating-label">
        {label}
      </label>
    </div>
  );
}

export default function CheckoutPage({
  onBack,
  onOpenSignup,
  onOpenLogin,
  onViewDashboard,
  onOrderComplete,
  onTrackOrder,
  onRegisterSticker,
}: CheckoutPageProps) {
  const { isLoggedIn, profile, refreshProfile } = useAuth();
  const { language } = useLanguage();
  const t = orderTranslations[language].checkout;

  // Checkout steps: 'details' → 'processing' → 'success'
  const [step, setStep] = useState<'details' | 'processing' | 'success'>('details');
  const [orderId, setOrderId] = useState('');
  const [confirmedTotal, setConfirmedTotal] = useState(0);
  const [recognized, setRecognized] = useState(false);
  const [dashboardAccessOpen, setDashboardAccessOpen] = useState(false);
  const [invoice, setInvoice] = useState<OrderInvoice | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  // The QR tag(s) auto-minted for this order the moment payment cleared (see
  // OrderModel.generateStickersForOrder) — surfaced on the success screen so
  // the buyer can register their own sticker right away instead of waiting
  // for it to arrive in the post and scanning it cold.
  const [purchasedStickers, setPurchasedStickers] = useState<
    { id: string; category: string; itemName?: string | null }[]
  >([]);

  // "Buy Now" writes a one-shot single-item cart here so it checks out in
  // isolation, never merged with (or clobbered by) whatever's already in the
  // persisted multi-item cart — see LandingPageMaster.handleBuyNow.
  const isBuyNowRef = useRef(false);

  // Cart is persisted in localStorage
  const [cart, setCart] = useState<CheckoutCartItem[]>(() => {
    try {
      const buyNow = localStorage.getItem('repiqr-buynow-cart');
      if (buyNow) {
        const parsed = JSON.parse(buyNow);
        if (Array.isArray(parsed) && parsed.length > 0) {
          isBuyNowRef.current = true;
          return parsed;
        }
      }
    } catch {
      /* ignore */
    }
    try {
      const primary = localStorage.getItem('repiqr-cart');
      if (primary) {
        const parsed = JSON.parse(primary);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      const fallback = localStorage.getItem('namoqr-cart');
      if (fallback) {
        const parsed = JSON.parse(fallback);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return [];
    } catch {
      return [];
    }
  });

  // Scroll to top on mount and re-sync cart from localStorage
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    if (isBuyNowRef.current) {
      // Consume the one-shot key now that it's loaded — and deliberately skip
      // the regular-cart resync below, which would otherwise overwrite this
      // isolated single-item purchase with whatever else is in the cart.
      try {
        localStorage.removeItem('repiqr-buynow-cart');
      } catch {
        /* ignore */
      }
      return;
    }

    try {
      const primary = localStorage.getItem('repiqr-cart');
      if (primary) {
        const parsed = JSON.parse(primary);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCart(parsed);
          return;
        }
      }
      const fallback = localStorage.getItem('namoqr-cart');
      if (fallback) {
        const parsed = JSON.parse(fallback);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCart(parsed);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Guest checkout form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [pincodeStatus, setPincodeStatus] = useState<
    'idle' | 'looking' | 'found' | 'not-found'
  >('idle');
  const [delivery, setDelivery] = useState<'standard' | 'express'>('standard');
  const [error, setError] = useState('');

  // Razorpay's own checkout modal already presents every payment method
  // (UPI/card/netbanking/wallets) — this is only order metadata now, not a
  // user-facing choice, so there's no in-page selector for it anymore.
  const payment = 'razorpay';

  // Stickers are free — the only charge is a flat top-up credited to the
  // buyer's balance (the server enforces the same amount in OrderController).
  const subtotal = 0;
  const deliveryFee = 0;
  const total = BALANCE_TOPUP_AMOUNT;

  // Invoice lines: each sticker at ₹0, plus the balance top-up that is the
  // actual charge. Invoice subtotal is `total` so its grand total matches.
  const invoiceItems = () => [
    ...cart.map((cartItem) => ({
      id: cartItem.product.id,
      name: cartItem.product.name,
      category: cartItem.product.category,
      qty: cartItem.qty,
      price: 0,
    })),
    { id: 'balance-topup', name: 'Balance top-up', category: 'Balance', qty: 1, price: total },
  ];

  // Keep the account name and phone convenient; the email is always entered manually.
  useEffect(() => {
    if (profile) {
      setName(profile.fullName || '');
      setPhone(profile.phoneNumber || '');
    }
  }, [profile]);

  // Auto-fill City & State from valid 6-digit Indian pincode
  useEffect(() => {
    const digits = pincode.replace(/\D/g, '');
    if (digits.length !== 6) {
      setPincodeStatus('idle');
      return;
    }
    let cancelled = false;
    setPincodeStatus('looking');
    const t = setTimeout(async () => {
      try {
        // Looked up by RepiQR's backend, not directly from the browser.
        const res = await apiClient.geo.pincode(digits);
        if (cancelled) return;
        const d = res.data;
        if (d.city || d.area) {
          setCity(d.city || d.area || '');
          setState(d.state || '');
          setPincodeStatus('found');
        } else {
          setPincodeStatus('not-found');
        }
      } catch {
        if (!cancelled) setPincodeStatus('not-found');
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [pincode]);

  const cleanDigits = (v: string) => (v || '').replace(/\D/g, '');
  const loadCitySuggestions = useCallback(
    async (query: string, signal: AbortSignal) =>
      (await apiClient.geo.suggest(query, 'city', signal)).data,
    []
  );
  const loadStateSuggestions = useCallback(
    async (query: string, signal: AbortSignal) =>
      (await apiClient.geo.suggest(query, 'state', signal)).data,
    []
  );

  const checkRecognized = () => {
    const em = email.trim().toLowerCase();
    const ph = cleanDigits(phone);
    if (isLoggedIn && profile) {
      if (em && (profile.email || '').toLowerCase() === em) return true;
      const pPhone = cleanDigits(profile.phoneNumber);
      if (ph && pPhone && ph.includes(pPhone)) return true;
    }
    try {
      const saved =
        localStorage.getItem('repiqr-auth-user') ||
        localStorage.getItem('namoqr-auth-user');
      if (saved) {
        const u = JSON.parse(saved);
        if (em && (u.email || '').toLowerCase() === em) return true;
        const uPhone = cleanDigits(u.phoneNumber || u.phone);
        if (ph && uPhone && ph.includes(uPhone)) return true;
      }
    } catch {
      /* ignore */
    }
    return false;
  };

  // Reconstruct invoice record if navigating to success screen without cached state
  useEffect(() => {
    if (step === 'success' && !invoice && orderId) {
      const fallbackInvoice = buildOrderInvoice({
        orderId,
        customerName: name.trim() || 'Valued Customer',
        customerEmail: email.trim(),
        customerPhone: phone.trim(),
        shippingAddress: {
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
        },
        items: invoiceItems(),
        subtotal: total,
        deliveryFee,
        paymentMethod: payment,
        deliveryType: delivery,
      });
      setInvoice(fallbackInvoice);
    }
  }, [
    step,
    invoice,
    orderId,
    name,
    email,
    phone,
    address,
    city,
    state,
    pincode,
    cart,
    subtotal,
    deliveryFee,
    delivery,
  ]);

  // Auto-redirect a signed-in/recognized buyer straight into the Client
  // Dashboard once the purchase confirms — the sticker was already claimed
  // onto their account server-side (see PaymentController.verify), so
  // there's nothing left for them to do here. A short delay lets them
  // actually see the "Order Confirmed" state first instead of it flashing
  // by. A buyer we couldn't recognize/log in gets left on this screen so
  // they can verify their phone via the DashboardAccessModal below instead.
  useEffect(() => {
    if (step !== 'success' || !recognized) return;
    const timer = setTimeout(() => onViewDashboard(), 1800);
    return () => clearTimeout(timer);
  }, [step, recognized, onViewDashboard]);

  const finalizeLocalRecords = (
    id: string,
    isRecognized: boolean,
    orderInvoice?: OrderInvoice
  ) => {
    const items = cart.map((i) => ({
      name: i.product.name,
      qty: i.qty,
      price: 0,
    }));

    try {
      const orders = JSON.parse(
        localStorage.getItem('repiqr-orders') ||
          localStorage.getItem('namoqr-orders') ||
          '[]'
      );
      orders.unshift({
        orderId: id,
        invoiceNumber: orderInvoice?.invoiceNumber,
        invoice: orderInvoice,
        email: email.trim(),
        phone: phone.trim(),
        name: name.trim(),
        items,
        total,
        payment,
        delivery,
        date: new Date().toISOString(),
        linkedToAccount: isRecognized,
      });
      localStorage.setItem('repiqr-orders', JSON.stringify(orders));
      localStorage.setItem('namoqr-orders', JSON.stringify(orders));
    } catch {
      /* ignore */
    }

    const newStickers: any[] = [];
    let stickerSeq = 0;
    cart.forEach((item) => {
      for (let i = 0; i < item.qty; i++) {
        const codeId =
          'RQ-' +
          (item.product.category || 'car').slice(0, 4).toUpperCase() +
          '-' +
          Math.floor(1000 + Math.random() * 9000);
        newStickers.push({
          id: 'p' + Date.now() + '-' + stickerSeq++,
          code: codeId,
          nickname: item.product.name + (item.qty > 1 ? ` #${i + 1}` : ''),
          category: (item.product.category || 'car').toLowerCase(),
          assigned: name.trim() || 'Self',
          status: 'Active',
          scans: 0,
          lastScan: 'Just purchased',
          ownerPhone: phone.trim(),
          meta: [
            ['Purchased', 'Just now'],
            ['Order ID', id],
          ],
          docs: [],
          contacts: [[name.trim() || 'Customer', phone.trim()]],
          timeline: [
            ['success', 'Order Completed', 'Just now', `Purchased via Order ${id}`],
          ],
        });
      }
    });

    try {
      const existing = JSON.parse(
        localStorage.getItem('repiqr-client-stickers') ||
          localStorage.getItem('namoqr-client-stickers') ||
          '[]'
      );
      localStorage.setItem(
        'repiqr-client-stickers',
        JSON.stringify([...newStickers, ...existing])
      );
      localStorage.setItem(
        'namoqr-client-stickers',
        JSON.stringify([...newStickers, ...existing])
      );
      const qrList = JSON.parse(
        localStorage.getItem('repiqr-qrlist') ||
          localStorage.getItem('namoqr-qrlist') ||
          '[]'
      );
      const updatedQrList = [
        ...qrList,
        ...newStickers.map((s) => ({
          id: s.id,
          code: s.code,
          status: 'active',
          ownerPhone: s.ownerPhone,
          ownerName: s.assigned,
          category: s.category,
        })),
      ];
      localStorage.setItem('repiqr-qrlist', JSON.stringify(updatedQrList));
      localStorage.setItem('namoqr-qrlist', JSON.stringify(updatedQrList));
    } catch {
      /* ignore */
    }
  };

  const runCheckout = async (isRecognized: boolean) => {
    if (!Number.isFinite(total) || total <= 0) {
      setStep('details');
      setError(t.errors.invalidTotal);
      return;
    }

    // id + category travel through to the backend so it can (a) validate price
    // against the server catalog and (b) auto-mint the right sticker category
    // per item once payment clears (see OrderModel.generateStickersForOrder).
    const items = cart.map((i) => ({
      id: i.product.id,
      name: i.product.name,
      qty: i.qty,
      price: 0,
      category: i.product.category,
    }));

    let newOrderId: string = '';
    const effectiveEmail = email.trim();
    try {
      const res = await apiClient.orders.create({
        name: name.trim(),
        email: effectiveEmail,
        phone: phone.trim(),
        items,
        subtotal,
        deliveryFee,
        total,
        paymentMethod: payment,
        deliveryMethod: delivery,
        shippingAddress: {
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
        },
      });
      if (res?.data?.id) {
        newOrderId = res.data.id;
      } else {
        throw new Error((res as any)?.error || 'Server did not return an order id');
      }
    } catch (err) {
      console.warn(
        'API backend order creation failed, falling back to database persistence:',
        err
      );
      const fallbackRes = createLocalOrderFallback({
        name: name.trim(),
        email: effectiveEmail,
        phone: phone.trim(),
        items,
        subtotal,
        deliveryFee,
        total,
        paymentMethod: payment,
        deliveryMethod: delivery,
        shippingAddress: {
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
        },
        userId: profile?.id,
      });
      if (fallbackRes?.data?.id) {
        newOrderId = fallbackRes.data.id;
      } else {
        setStep('details');
        setError(t.errors.orderNotConfirmed);
        return;
      }
    }

    const scriptOk = await loadRazorpayScript();
    if (!scriptOk) {
      setStep('details');
      setError(t.errors.gatewayLoadFailed);
      return;
    }

    // The Razorpay order MUST come from our server. It is what ties the payment
    // to order `newOrderId`, and its id is half of the signature we verify
    // afterwards. Opening checkout without one takes real money for a payment
    // nothing can attribute, verify, or refund — so a failure here stops the
    // flow rather than falling back to an unattributed charge.
    let rpData: {
      keyId: string;
      razorpayOrderId: string;
      amount: number;
      currency: string;
    } | null = null;
    let rpError = '';
    try {
      const rpRes = await apiClient.payments.createOrder(newOrderId);
      if (
        rpRes?.data?.keyId &&
        rpRes.data.razorpayOrderId &&
        Number.isFinite(rpRes.data.amount) &&
        rpRes.data.amount > 0
      ) {
        rpData = rpRes.data;
      } else {
        rpError = rpRes?.error || '';
      }
    } catch (err: any) {
      console.error('Failed to open a Razorpay order for', newOrderId, err);
      rpError = err?.message || '';
    }

    if (!rpData) {
      setStep('details');
      setError(
        `${rpError || t.errors.gatewayUnreachable}${t.errors.orderSavedSuffix(newOrderId)}`
      );
      return;
    }

    const rzpOptions: any = {
      key: rpData.keyId,
      amount: rpData.amount,
      currency: rpData.currency,
      name: 'RapiQR Safety Protection',
      description: `Order ${newOrderId}`,
      // No `method` forced here — Razorpay's own checkout modal presents the
      // full set of payment methods (UPI/card/netbanking/wallets) and the
      // customer picks there, not on this page.
      prefill: {
        name: name.trim(),
        email: effectiveEmail,
        contact: phone.trim(),
      },
      theme: { color: '#111111' },
      handler: async (response: any) => {
        let verifyRes: any = null;
        try {
          verifyRes = await apiClient.payments.verify({
            orderId: newOrderId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          if (!verifyRes?.success)
            throw new Error(verifyRes?.error || 'Payment verification failed');
          if (Array.isArray(verifyRes.data?.stickers)) {
            setPurchasedStickers(verifyRes.data.stickers);
          }
          // PaymentController.verify auto-provisions (or matches) an account for
          // the checkout phone number and hands back a token+user — but typing a
          // phone number into a form proves nothing about who actually owns it.
          // Only trust that session automatically when this buyer was ALREADY
          // recognized/logged-in before paying (checked in handleSubmit, before
          // Razorpay even opened); a genuine guest checkout must still prove
          // phone ownership via DashboardAccessModal's OTP step before the
          // success screen gives them a session or auto-redirects to the
          // dashboard. Never store an auto-provisioned token/session for an
          // unrecognized buyer — that would grant dashboard access to whoever
          // typed the number, verified or not.
          if (recognized && verifyRes.user) {
            localStorage.setItem('repiqr-auth-user', JSON.stringify(verifyRes.user));
            localStorage.setItem('namoqr-auth-user', JSON.stringify(verifyRes.user));
          }
          localStorage.setItem('rapiqr-phone-number-filled', 'true');
          localStorage.setItem('rapiqr-phone-asked-once', 'true');
          if (recognized && verifyRes.token) {
            localStorage.setItem('repiqr-token', verifyRes.token);
            localStorage.setItem('namoqr-token', verifyRes.token);
            await refreshProfile();
          }
        } catch (err: any) {
          setStep('details');
          setError(
            `${err?.message || t.errors.verificationFailedDefault}${t.errors.verificationFailedSuffix(newOrderId)}`
          );
          return;
        }

        const completedInvoice = buildOrderInvoice({
          orderId: newOrderId,
          customerName: name.trim(),
          customerEmail: effectiveEmail,
          customerPhone: phone.trim(),
          shippingAddress: {
            address: address.trim(),
            city: city.trim(),
            state: state.trim(),
            pincode: pincode.trim(),
          },
          items: invoiceItems(),
          subtotal: total,
          deliveryFee,
          paymentMethod: payment,
          paymentTransactionId: response.razorpay_payment_id,
          deliveryType: delivery,
        });

        setInvoice(completedInvoice);
        setOrderId(newOrderId);
        setConfirmedTotal(total);
        finalizeLocalRecords(newOrderId, true, completedInvoice);
        if (onOrderComplete) onOrderComplete();

        // Show the confirmation screen — a recognized/now-logged-in buyer is
        // auto-redirected from there (see the effect above); everyone else
        // stays here and can verify their phone via DashboardAccessModal.
        setStep('success');
      },
      modal: {
        ondismiss: () => {
          setStep('details');
          setError(t.errors.paymentCancelled);
        },
      },
    };

    rzpOptions.order_id = rpData.razorpayOrderId;

    const rzp = new window.Razorpay(rzpOptions);

    rzp.on('payment.failed', (resp: any) => {
      setStep('details');
      setError(`${t.errors.paymentFailedPrefix}${resp?.error?.description || t.errors.paymentFailedDefaultSuffix}`);
    });

    rzp.open();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (
      !name.trim() ||
      !phone.trim() ||
      !email.trim() ||
      !address.trim() ||
      !city.trim() ||
      !pincode.trim()
    ) {
      setError(t.errors.requiredFields);
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setError(t.errors.invalidEmail);
      return;
    }
    if (cleanDigits(phone).length < 10) {
      setError(t.errors.invalidPhone);
      return;
    }

    const isRecognized = checkRecognized();
    setRecognized(isRecognized);
    setStep('processing');
    runCheckout(isRecognized);
  };

  const stepIndex = step === 'details' ? 0 : step === 'processing' ? 1 : 2;
  const progressValue = (stepIndex + 1) / 3;

  return (
    <div className="checkout-theme min-h-screen bg-[var(--co-paper)] font-sans text-[var(--co-ink)] pb-16">

      {/* ── TOP HEADER BAR ── */}
      <header className="sticky top-0 z-40 border-b border-[var(--co-line)] bg-[var(--co-panel)]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <button
            onClick={onBack}
            className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-[var(--co-ink-soft)] transition-colors hover:text-[var(--co-ink)]"
            aria-label={t.backToShopAria}
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">{t.backToShopFull}</span>
            <span className="sm:hidden">{t.backToShopShort}</span>
          </button>

          <div className="flex items-center gap-2.5">
            <AppLogo variant="light" className="h-6 w-auto object-contain sm:h-7" />
            <span className="hidden sm:inline text-[var(--co-line)]">|</span>
            <span className="hidden sm:inline text-[var(--co-ink-soft)] font-semibold text-sm">{t.checkoutLabel}</span>
          </div>

          <div className="flex items-center gap-1.5 text-[var(--co-ink-faint)]" aria-hidden="true">
            <Lock size={14} />
          </div>
        </div>

        {/* Slim progress line — purely presentational, mirrors `step` */}
        <div
          className="h-[3px] w-full bg-[var(--co-line)]"
          role="progressbar"
          aria-label={t.checkoutLabel}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progressValue * 100)}
        >
          <div
            className="checkout-progress-fill"
            style={{ transform: `scaleX(${progressValue})` }}
          />
        </div>
      </header>

      {/* ── PAGE CONTENT ── */}
      <main className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 sm:pt-10">

        {/* ── EMPTY CART STATE ── */}
        {cart.length === 0 && step !== 'success' && (
          <div className="max-w-md mx-auto my-16 p-8 bg-[var(--co-panel)] rounded-[var(--co-radius)] border border-[var(--co-line)] text-center">
            <div className="w-14 h-14 rounded-[var(--co-radius-sm)] bg-[var(--co-paper)] border border-[var(--co-line)] text-[var(--co-ink)] flex items-center justify-center mx-auto mb-4">
              <ShoppingBag size={26} />
            </div>
            <h3 className="text-lg font-bold text-[var(--co-ink)] mb-2">{t.emptyCart.title}</h3>
            <p className="text-sm text-[var(--co-ink-soft)] mb-6">
              {t.emptyCart.description}
            </p>
            <FlowButton tone="dark" fullWidth onClick={onBack}>
              {t.emptyCart.browseButton}
            </FlowButton>
          </div>
        )}

        {/* ── ACTIVE CHECKOUT GRID ── */}
        {cart.length > 0 && step === 'details' && (
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">

            {/* ── LEFT COLUMN: FORM DETAILS (7 COLS) ── */}
            <div className="lg:col-span-7 space-y-4">

              {/* Free Sticker Banner */}
              <div className="p-4 rounded-[var(--co-radius)] bg-[var(--co-success-soft)] border border-[var(--co-success)]/20 text-[var(--co-ink)] flex items-start gap-3">
                <CheckCircle2 size={20} className="text-[var(--co-success)] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-bold text-sm sm:text-base">{t.freeStickerBanner.title}</p>
                  <p className="text-xs sm:text-sm text-[var(--co-ink-soft)] mt-0.5 leading-relaxed">
                    {t.freeStickerBanner.description(total)}
                  </p>
                </div>
              </div>

              {/* Guest Account Banner */}
              {!isLoggedIn && (
                <div className="p-3.5 rounded-[var(--co-radius)] bg-[var(--co-panel)] border border-[var(--co-line)] text-[var(--co-ink)] text-xs sm:text-sm flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-[var(--co-ink)] shrink-0" />
                    <span>{t.guestBanner.message}</span>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenLogin}
                    className="font-bold text-[var(--co-ink)] underline hover:text-[var(--co-accent)] shrink-0 cursor-pointer"
                  >
                    {t.guestBanner.logIn}
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* ── 1. Contact Information ── */}
                <div className="space-y-4 rounded-[var(--co-radius)] border border-[var(--co-line)] bg-[var(--co-panel)] p-6 shadow-sm sm:p-7">
                  <div className="flex items-center gap-3 pb-3 border-b border-[var(--co-line)]">
                    <span className={stepBadgeCls}>1</span>
                    <div>
                      <h2 className="font-semibold text-sm sm:text-base text-[var(--co-ink)]">{t.contactSection.title}</h2>
                      <p className="text-xs text-[var(--co-ink-soft)]">{t.contactSection.subtitle}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                    <CheckoutFloatingField
                      id="checkout-name"
                      label={t.contactSection.fullNameLabel}
                      value={name}
                    >
                      <input
                        id="checkout-name"
                        type="text"
                        placeholder=" "
                        autoComplete="name"
                        aria-label={t.contactSection.fullNameAria}
                        aria-required="true"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={fieldInputCls}
                      />
                    </CheckoutFloatingField>

                    <CheckoutFloatingField
                      id="checkout-phone"
                      label={t.contactSection.phoneLabel}
                      value={phone}
                      className="checkout-floating-field--phone"
                    >
                      <PhoneInputWithCountry
                        inputId="checkout-phone"
                        inputAriaLabel={t.contactSection.phoneLabel}
                        placeholder=" "
                        required
                        value={phone}
                        onChange={(full) => setPhone(full)}
                        className="checkout-phone-control"
                      />
                    </CheckoutFloatingField>
                  </div>

                  <CheckoutFloatingField
                    id="checkout-email"
                    label={t.contactSection.emailLabel}
                    value={email}
                  >
                    <input
                      id="checkout-email"
                      type="email"
                      placeholder=" "
                      autoComplete="off"
                      aria-label={t.contactSection.emailLabel}
                      aria-required="true"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={fieldInputCls}
                    />
                  </CheckoutFloatingField>
                </div>

                {/* ── 2. Shipping Address ── */}
                <div className="space-y-4 rounded-[var(--co-radius)] border border-[var(--co-line)] bg-[var(--co-panel)] p-6 shadow-sm sm:p-7">
                  <div className="flex items-center gap-3 pb-3 border-b border-[var(--co-line)]">
                    <span className={stepBadgeCls}>2</span>
                    <div>
                      <h2 className="font-semibold text-sm sm:text-base text-[var(--co-ink)]">{t.addressSection.title}</h2>
                      <p className="text-xs text-[var(--co-ink-soft)]">{t.addressSection.subtitle}</p>
                    </div>
                  </div>

                  <CheckoutFloatingField
                    id="checkout-address"
                    label={t.addressSection.streetLabel}
                    value={address}
                  >
                    <input
                      id="checkout-address"
                      type="text"
                      placeholder=" "
                      autoComplete="street-address"
                      aria-required="true"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className={fieldInputCls}
                    />
                  </CheckoutFloatingField>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <CheckoutFloatingField
                        id="checkout-pincode"
                        label={t.addressSection.pincodeLabel}
                        value={pincode}
                      >
                        <input
                          id="checkout-pincode"
                          type="text"
                          placeholder=" "
                          inputMode="numeric"
                          autoComplete="postal-code"
                          maxLength={6}
                          aria-required="true"
                          value={pincode}
                          onChange={(e) =>
                            setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))
                          }
                          className={fieldInputCls}
                        />
                      </CheckoutFloatingField>
                      {pincodeStatus === 'looking' && (
                        <span className="text-xs text-[var(--co-ink-soft)] mt-1 block">
                          {t.addressSection.pincodeLookingUp}
                        </span>
                      )}
                      {pincodeStatus === 'found' && (
                        <span className="text-xs text-[var(--co-success)] font-medium mt-1 block">
                          {t.addressSection.pincodeFound}
                        </span>
                      )}
                      {pincodeStatus === 'not-found' && (
                        <span className="text-xs text-[var(--co-ink-soft)] mt-1 block">
                          {t.addressSection.pincodeNotFound}
                        </span>
                      )}
                    </div>

                    <AutocompleteField
                      label={t.addressSection.cityLabel}
                      inputId="checkout-city"
                      floatingLabel
                      required
                      loadSuggestions={loadCitySuggestions}
                      placeholder=" "
                      value={city}
                      onChange={setCity}
                      onSelect={(selected) => {
                        const match = INDIAN_CITIES.find((c) => c.name === selected);
                        if (match && !state.trim()) setState(match.state);
                      }}
                      suggestions={[]}
                      inputClassName={fieldInputCls}
                    />

                    <AutocompleteField
                      label={t.addressSection.stateLabel}
                      inputId="checkout-state"
                      floatingLabel
                      required
                      loadSuggestions={loadStateSuggestions}
                      placeholder=" "
                      value={state}
                      onChange={setState}
                      suggestions={[]}
                      inputClassName={fieldInputCls}
                    />
                  </div>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="p-4 rounded-[var(--co-radius)] bg-[var(--co-danger-soft)] border border-[var(--co-danger)]/20 text-[var(--co-danger)] text-xs sm:text-sm font-medium flex items-center gap-3">
                    <AlertCircle size={18} className="shrink-0 text-[var(--co-danger)]" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit Action */}
                <FlowButton type="submit" tone="dark" fullWidth>
                  <Lock size={14} />
                  {t.payButton(total)}
                </FlowButton>

                <p className="text-center text-xs text-[var(--co-ink-soft)] leading-relaxed">
                  {t.termsNotice}
                </p>

              </form>
            </div>

            {/* ── RIGHT COLUMN: ORDER SUMMARY (5 COLS) ── */}
            <div className="lg:col-span-5">
              <div className="sticky top-24 overflow-hidden rounded-[var(--co-radius)] border border-[var(--co-line)] bg-[var(--co-panel)] shadow-sm">
                <div className="min-w-0">
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between pb-3.5 border-b border-[var(--co-line)]">
                      <h2 className="font-semibold text-[var(--co-ink)] text-base">{t.orderSummary.title}</h2>
                      <span className="text-xs font-semibold text-[var(--co-ink-soft)] bg-[var(--co-paper)] border border-[var(--co-line)] px-2.5 py-0.5 rounded-full">
                        {t.orderSummary.itemsCount(cart.reduce((s, i) => s + i.qty, 0))}
                      </span>
                    </div>

                    {/* Cart Items List */}
                    <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                      {cart.map((item) => (
                        <div
                          key={item.product.id}
                          className="flex items-center gap-3"
                        >
                          <img
                            src={item.product.img}
                            alt={item.product.name}
                            className="w-11 h-11 rounded-[var(--co-radius-sm)] object-cover border border-[var(--co-line)] shrink-0 bg-[var(--co-paper)]"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-[13px] text-[var(--co-ink)] truncate">
                              {item.product.name}
                            </div>
                            <div className="text-[11px] text-[var(--co-ink-faint)] font-medium mt-0.5">{t.orderSummary.qty(item.qty)}</div>
                          </div>
                          <span className="font-semibold text-[11px] text-[var(--co-success)]">
                            {t.orderSummary.free}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-[var(--co-line)]" />

                  {/* Price breakdown and total */}
                  <div className="p-6 space-y-2 text-[13px]">
                    <div className="flex items-center justify-between text-[var(--co-ink-soft)] font-medium">
                      <span>{t.orderSummary.stickersLabel}</span>
                      <span className="font-semibold text-[var(--co-success)]">{t.orderSummary.free}</span>
                    </div>
                    <div className="flex items-center justify-between text-[var(--co-ink-soft)] font-medium">
                      <span>{t.orderSummary.deliveryLabel}</span>
                      <span className="font-semibold text-[var(--co-success)]">{t.orderSummary.free}</span>
                    </div>
                    <div className="flex items-center justify-between text-[var(--co-ink-soft)] font-medium">
                      <span>{t.orderSummary.balanceTopupLabel}</span>
                      <span className="font-mono font-semibold text-[var(--co-ink)]">₹{total}</span>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-[var(--co-line)] text-base font-bold text-[var(--co-ink)]">
                      <span>{t.orderSummary.totalAmountLabel}</span>
                      <span className="font-mono">₹{total}</span>
                    </div>
                    <p className="text-xs font-medium text-[var(--co-success)] pt-0.5">
                      {t.orderSummary.balanceAddedNote(total)}
                    </p>

                    {/* Trust Badges */}
                    <div className="pt-3 border-t border-[var(--co-line)] space-y-1.5">
                      <div className="flex items-center gap-2 text-[11px] font-medium text-[var(--co-ink-soft)]">
                        <ShieldCheck size={14} className="text-[var(--co-success)] shrink-0" />
                        <span>{t.orderSummary.sslBadge}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-medium text-[var(--co-ink-soft)]">
                        <Truck size={14} className="text-[var(--co-ink-faint)] shrink-0" />
                        <span>{t.orderSummary.replacementBadge}</span>
                      </div>
                      </div>
                    </div>
                  </div>
              </div>
            </div>

          </div>
        )}

        {/* ── STEP: PROCESSING MODAL ── */}
        {step === 'processing' && (
          <div className="max-w-md mx-auto my-16 p-8 bg-[var(--co-panel)] rounded-[var(--co-radius)] border border-[var(--co-line)] text-center space-y-3.5">
            <div className="w-14 h-14 rounded-full border-4 border-[var(--co-accent)] border-t-transparent animate-spin mx-auto" />
            <h3 className="text-lg font-bold text-[var(--co-ink)]">{t.processing.title}</h3>
            <p className="text-sm text-[var(--co-ink-soft)]">
              {t.processing.description}
            </p>
          </div>
        )}

        {/* ── STEP: SUCCESS CONFIRMATION ── */}
        {step === 'success' && (
          <div className="max-w-xl mx-auto my-10 p-6 sm:p-8 bg-[var(--co-panel)] rounded-[var(--co-radius)] border border-[var(--co-line)] text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-[var(--co-accent-soft)] text-[var(--co-accent)] border-2 border-[var(--co-accent)] flex items-center justify-center mx-auto">
              <CheckCircle2 size={30} />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[var(--co-ink)]">{t.success.title}</h2>
              <p className="text-sm text-[var(--co-ink-soft)] mt-1.5">
                {t.success.thankYouPrefix}<span className="font-semibold text-[var(--co-ink)]">{name.trim()}</span>{t.success.orderPrefix}
                <span className="font-mono font-medium text-[var(--co-ink)] bg-[var(--co-paper)] px-2 py-0.5 rounded border border-[var(--co-line)]">
                  {orderId}
                </span>
                {t.success.confirmedPrefix}<span className="font-semibold text-[var(--co-ink)]">₹{confirmedTotal}</span>{t.success.balanceSuffix}
              </p>
            </div>

            {invoice && (
              <button
                onClick={() => setIsInvoiceModalOpen(true)}
                className="text-xs font-semibold text-[var(--co-ink-soft)] hover:text-[var(--co-ink)] underline underline-offset-2 cursor-pointer"
              >
                {t.success.viewInvoice}
              </button>
            )}

            {/* ── Register Your Sticker(s) ── */}
            {purchasedStickers.length > 0 && onRegisterSticker && (
              <div className="space-y-2 text-left">
                {purchasedStickers.map((s) => {
                  const cleanName = (s.itemName || s.category || 'Safety').replace(/\s*tag\s*$/i, '');
                  return (
                    <button
                      key={s.id}
                      onClick={() => onRegisterSticker(s.id)}
                      className="w-full py-2.5 px-4 rounded-[var(--co-radius-sm)] bg-[var(--co-panel)] hover:bg-[var(--co-paper)] text-[var(--co-ink)] border border-[var(--co-line)] hover:border-[var(--co-ink)] font-semibold text-xs transition-colors flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <span className="capitalize">{t.success.registerTag(cleanName)}</span>
                      <ArrowRight size={13} />
                    </button>
                  );
                })}
              </div>
            )}

            {recognized ? (
              <div className="flex flex-col sm:flex-row gap-2">
                <FlowButton tone="dark" size="sm" className="flex-1" onClick={onViewDashboard}>
                  {t.success.openDashboard}
                </FlowButton>
                {onTrackOrder && (
                  <FlowButton size="sm" onClick={() => onTrackOrder(orderId, phone.trim())}>
                    <Truck size={13} />
                    {t.success.trackOrder}
                  </FlowButton>
                )}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <FlowButton tone="dark" size="sm" className="flex-1" onClick={() => setDashboardAccessOpen(true)}>
                  {t.success.accessDashboard}
                </FlowButton>
                {onTrackOrder && (
                  <FlowButton size="sm" onClick={() => onTrackOrder(orderId, phone.trim())}>
                    <Truck size={13} />
                    {t.success.trackOrder}
                  </FlowButton>
                )}
              </div>
            )}

          </div>
        )}

      </main>

      {/* ── Official Tax Invoice Preview & Print Modal ── */}
      <OrderInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        invoice={invoice}
        onPrintInvoice={() => {
          if (invoice) {
            printOrderInvoice(invoice);
          }
        }}
      />

      <DashboardAccessModal
        isOpen={dashboardAccessOpen}
        initialPhone={phone}
        onClose={() => setDashboardAccessOpen(false)}
        onSuccess={() => {
          setRecognized(true);
          onViewDashboard();
        }}
      />

    </div>
  );
}

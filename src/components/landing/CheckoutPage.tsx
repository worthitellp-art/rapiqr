import React, { useEffect, useRef, useState } from 'react';
import {
  Lock,
  ShieldCheck,
  Truck,
  CheckCircle2,
  ArrowRight,
  MapPin,
  User,
  Mail,
  ArrowLeft,
  ShoppingBag,
  Clock,
  AlertCircle,
  LocateFixed,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../lib/apiClient';
import PhoneInputWithCountry from '../common/PhoneInputWithCountry';
import AutocompleteField from '../common/AutocompleteField';
import AppLogo from '../common/AppLogo';
import { INDIAN_STATES, INDIAN_CITIES, INDIAN_CITY_NAMES } from '../../data/locations';
import { OrderInvoice } from '../../types/invoice';
import { buildOrderInvoice, printOrderInvoice } from '../../services/invoiceService';
import OrderInvoiceModal from './OrderInvoiceModal';
import DashboardAccessModal from './DashboardAccessModal';

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
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState('');
  const [error, setError] = useState('');

  // Razorpay's own checkout modal already presents every payment method
  // (UPI/card/netbanking/wallets) — this is only order metadata now, not a
  // user-facing choice, so there's no in-page selector for it anymore.
  const payment = 'razorpay';

  const subtotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0);
  const deliveryFee = delivery === 'express' ? 99 : 0;
  const total = subtotal + deliveryFee;

  // Prefill from account when mounted
  useEffect(() => {
    if (profile) {
      setName(profile.fullName || '');
      setEmail(profile.email || '');
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
        const res = await fetch(`https://api.postalpincode.in/pincode/${digits}`);
        const data = await res.json();
        const office =
          data?.[0]?.Status === 'Success' ? data[0].PostOffice?.[0] : null;
        if (cancelled) return;
        if (office) {
          setCity(office.District || office.Name || '');
          setState(office.State || '');
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

  /**
   * "Use current location" — browser geolocation + a free, keyless reverse
   * geocoding lookup (BigDataCloud's client API). Fills city/state/pincode
   * and a best-effort locality line; the house/flat number still needs the
   * customer's own input since reverse geocoding can't know that.
   */
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocateError('Location is not supported on this device/browser.');
      return;
    }
    setLocating(true);
    setLocateError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const data = await res.json();
          const foundCity = data.city || data.locality || data.principalSubdivision || '';
          const foundState = data.principalSubdivision || '';
          const locality = [data.locality, data.localityInfo?.administrative?.[0]?.name]
            .filter((v, i, arr) => v && arr.indexOf(v) === i)
            .join(', ');
          if (foundCity) setCity(foundCity);
          if (foundState) setState(foundState);
          if (data.postcode) setPincode(String(data.postcode).replace(/\D/g, '').slice(0, 6));
          if (locality && !address.trim()) setAddress(locality);
        } catch {
          setLocateError("Couldn't determine your address — please enter it manually.");
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocateError('Location permission denied — please enter your address manually.');
        setLocating(false);
      },
      { timeout: 10000 }
    );
  };

  const cleanDigits = (v: string) => (v || '').replace(/\D/g, '');

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
        items: cart.map((cartItem) => ({
          id: cartItem.product.id,
          name: cartItem.product.name,
          category: cartItem.product.category,
          qty: cartItem.qty,
          price: cartItem.product.price,
        })),
        subtotal,
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
      price: i.product.price,
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
      setError(
        'Your cart total looks invalid. Please remove and re-add the affected item, then try again.'
      );
      return;
    }

    // id + category travel through to the backend so it can (a) validate price
    // against the server catalog and (b) auto-mint the right sticker category
    // per item once payment clears (see OrderModel.generateStickersForOrder).
    const items = cart.map((i) => ({
      id: i.product.id,
      name: i.product.name,
      qty: i.qty,
      price: i.product.price,
      category: i.product.category,
    }));

    let newOrderId: string = '';
    const effectiveEmail = email.trim() || `${cleanDigits(phone)}@repiqr.local`;
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
        setError(
          "We couldn't confirm your order. Please check your connection and try again."
        );
        return;
      }
    }

    const scriptOk = await loadRazorpayScript();
    if (!scriptOk) {
      setStep('details');
      setError(
        'Could not load the payment gateway. Please check your connection and try again.'
      );
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
        `${rpError || "We couldn't reach the payment gateway."} Your order ${newOrderId} has been saved — nothing was charged. Please try paying again in a moment.`
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
            `${
              err?.message || 'Payment verification failed.'
            } If money was deducted it will be reconciled automatically — quote order ID ${newOrderId} if you need to contact support.`
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
          items: cart.map((cartItem) => ({
            id: cartItem.product.id,
            name: cartItem.product.name,
            category: cartItem.product.category,
            qty: cartItem.qty,
            price: cartItem.product.price,
          })),
          subtotal,
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
          setError(
            'Payment was cancelled — nothing was charged. You can try paying again.'
          );
        },
      },
    };

    rzpOptions.order_id = rpData.razorpayOrderId;

    const rzp = new window.Razorpay(rzpOptions);

    rzp.on('payment.failed', (resp: any) => {
      setStep('details');
      setError(`Payment failed: ${resp?.error?.description || 'please try again.'}`);
    });

    rzp.open();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (
      !name.trim() ||
      !phone.trim() ||
      !address.trim() ||
      !city.trim() ||
      !pincode.trim()
    ) {
      setError('Please fill in all required fields.');
      return;
    }
    if (email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (cleanDigits(phone).length < 10) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    const isRecognized = checkRecognized();
    setRecognized(isRecognized);
    setStep('processing');
    runCheckout(isRecognized);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 pb-16">

      {/* ── TOP HEADER BAR ── */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-6">
          <button
            onClick={onBack}
            className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-500 transition-colors hover:text-gray-900"
            aria-label="Back to shop"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back to Shop</span>
            <span className="sm:hidden">Back</span>
          </button>

          <div className="flex items-center gap-2">
            <AppLogo variant="light" className="h-6 w-auto object-contain sm:h-7" />
            <span className="text-gray-300 font-medium text-sm">| Checkout</span>
          </div>

        </div>
      </header>

      {/* ── PAGE CONTENT ── */}
      <main className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8">

        {/* ── EMPTY CART STATE ── */}
        {cart.length === 0 && step !== 'success' && (
          <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-2xl border border-gray-200 shadow-sm text-center">
            <div className="w-14 h-14 rounded-xl bg-gray-100 text-[#111111] flex items-center justify-center mx-auto mb-4">
              <ShoppingBag size={26} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Your Cart is Empty</h3>
            <p className="text-sm text-gray-500 mb-6">
              Add a weatherproof smart QR safety tag to protect your vehicle, pet, or valuable assets.
            </p>
            <button
              onClick={onBack}
              className="w-full py-3 rounded-lg bg-[#111111] hover:bg-black text-white font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Browse Products</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* ── ACTIVE CHECKOUT GRID ── */}
        {cart.length > 0 && step === 'details' && (
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">

            {/* ── LEFT COLUMN: FORM DETAILS (7 COLS) ── */}
            <div className="lg:col-span-7 space-y-4">

              {/* Account Awareness Banner */}
              {isLoggedIn ? (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center gap-2.5">
                  <CheckCircle2 size={17} className="text-emerald-600 shrink-0" />
                  <div>
                    Checking out as <strong>{profile?.email || email}</strong>. Your purchased tags will be automatically linked to your account.
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs sm:text-sm flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-[#111111] shrink-0" />
                    <span>Quick guest checkout — no password required.</span>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenLogin}
                    className="font-bold text-gray-950 underline hover:text-black shrink-0 cursor-pointer"
                  >
                    Log In
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* ── 1. Contact Information ── */}
                <div className="space-y-4 rounded-[28px] border border-[#14120C]/8 bg-white p-6 sm:p-7 shadow-[0_12px_40px_-15px_rgba(20,18,12,0.05)]">
                  <div className="flex items-center gap-3 pb-3 border-b border-[#14120C]/6">
                    <span className="w-6 h-6 rounded-full bg-[#14120C] text-white text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                    <div>
                      <h2 className="font-extrabold text-sm sm:text-base text-[#14120C]">Contact Information</h2>
                      <p className="text-[11px] text-[#14120C]/50">Where should we send your order confirmation and tag updates?</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1.5">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Rahul Sharma"
                        aria-label="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-lg border border-gray-300 bg-white focus:border-black focus:ring-1 focus:ring-black text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1.5">
                        Phone Number *
                      </label>
                      <PhoneInputWithCountry
                        value={phone}
                        onChange={(full) => setPhone(full)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1.5">
                      Email Address (Optional)
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        placeholder="e.g. rahul@example.com (optional)"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-11 pl-10 pr-3.5 rounded-lg border border-gray-300 bg-white focus:border-black focus:ring-1 focus:ring-black text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* ── 2. Shipping Address ── */}
                <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 sm:p-7 shadow-xs">
                  <div className="flex items-center justify-between gap-3 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center">
                        2
                      </span>
                      <div>
                        <h2 className="font-semibold text-sm sm:text-base text-gray-900">Shipping Address</h2>
                        <p className="text-xs text-gray-500">Physical stickers delivered in 2–3 business days across India</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      disabled={locating}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-medium text-gray-700 cursor-pointer disabled:opacity-60 transition-colors"
                    >
                      {locating ? <Loader2 size={13} className="animate-spin text-gray-500" /> : <LocateFixed size={13} />}
                      <span>{locating ? 'Locating…' : 'Use location'}</span>
                    </button>
                  </div>

                  {locateError && (
                    <p className="text-xs text-red-600 font-medium -mt-1">{locateError}</p>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1.5">
                      Street Address / House / Flat *
                    </label>
                    <div className="relative">
                      <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Flat 402, Green Heights, Opp. City Park"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full h-11 pl-10 pr-3.5 rounded-lg border border-gray-300 bg-white focus:border-black focus:ring-1 focus:ring-black text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1.5">
                        Pincode *
                      </label>
                      <input
                        type="text"
                        placeholder="560001"
                        inputMode="numeric"
                        maxLength={6}
                        value={pincode}
                        onChange={(e) =>
                          setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))
                        }
                        className="w-full h-11 px-3.5 rounded-lg border border-gray-300 bg-white focus:border-black focus:ring-1 focus:ring-black text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all"
                      />
                      {pincodeStatus === 'looking' && (
                        <span className="text-xs text-gray-500 mt-1 block">
                          Looking up location…
                        </span>
                      )}
                      {pincodeStatus === 'found' && (
                        <span className="text-xs text-emerald-600 font-medium mt-1 block">
                          ✓ City &amp; State found
                        </span>
                      )}
                      {pincodeStatus === 'not-found' && (
                        <span className="text-xs text-gray-500 mt-1 block">
                          Enter city manually
                        </span>
                      )}
                    </div>

                    <AutocompleteField
                      label="City *"
                      placeholder="Bengaluru"
                      value={city}
                      onChange={setCity}
                      onSelect={(selected) => {
                        const match = INDIAN_CITIES.find((c) => c.name === selected);
                        if (match && !state.trim()) setState(match.state);
                      }}
                      suggestions={INDIAN_CITY_NAMES}
                    />

                    <AutocompleteField
                      label="State *"
                      placeholder="Karnataka"
                      value={state}
                      onChange={setState}
                      suggestions={INDIAN_STATES}
                    />
                  </div>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-medium flex items-center gap-3">
                    <AlertCircle size={18} className="shrink-0 text-red-500" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit Action */}
                <button
                  type="submit"
                  className="w-full h-11 rounded-lg bg-white hover:bg-gray-50 text-black border border-gray-300 hover:border-black font-semibold text-sm shadow-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99] group"
                >
                  <span>Pay ₹{total} Securely</span>
                  <Lock size={15} className="text-black" />
                  <ArrowRight size={16} className="text-black transition-transform group-hover:translate-x-0.5" />
                </button>

                <p className="text-center text-xs text-gray-500 leading-relaxed">
                  By proceeding you agree to RepiQR Terms of Service &amp; Privacy Policy. Free replacement within 7 days.
                </p>

              </form>
            </div>

            {/* ── RIGHT COLUMN: FINAL BILLING SUMMARY (5 COLS) ── */}
            <div className="lg:col-span-5">
              <div className="sticky top-24 space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">

                <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
                  <div className="flex items-center gap-2 font-semibold text-gray-900 text-base">
                    <Lock size={16} className="text-gray-900" />
                    <span>Order Summary</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 px-2.5 py-0.5 rounded-full">
                    {cart.reduce((s, i) => s + i.qty, 0)} Items
                  </span>
                </div>

                {/* Cart Items List */}
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="p-3 rounded-2xl bg-white border border-[#14120C]/6 flex items-center gap-3 shadow-xs"
                    >
                      <img
                        src={item.product.img}
                        alt={item.product.name}
                        className="w-12 h-12 rounded-xl object-cover border border-[#14120C]/8 shrink-0 bg-[#FAFAF8]"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[13px] text-[#14120C] truncate">
                          {item.product.name}
                        </div>
                        <div className="text-[11px] text-[#14120C]/50 font-semibold mt-0.5">Qty: {item.qty}</div>
                      </div>
                      <div className="font-extrabold text-[14px] text-[#14120C]">
                        ₹{item.product.price * item.qty}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2.5 pt-4 border-t border-[#14120C]/8 text-[13px]">
                  <div className="flex items-center justify-between text-[#14120C]/70 font-medium">
                    <span>Item Subtotal</span>
                    <span className="font-bold text-[#14120C]">₹{subtotal}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#14120C]/70 font-medium">
                    <span>Express Delivery (2-3 Days)</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-xs">
                      {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[#14120C]/70 font-medium">
                    <span>GST (18% Included)</span>
                    <span className="font-medium text-[#14120C]/50">Included</span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-[#14120C]/10 text-lg font-extrabold text-[#14120C]">
                    <span>Total Amount</span>
                    <span className="text-[#14120C] font-black">₹{total}</span>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="pt-3 border-t border-[#14120C]/8 space-y-2">
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-[#14120C]/60">
                    <ShieldCheck size={14} className="text-[#16A34A] shrink-0" />
                    <span>256-bit SSL encrypted &amp; verified payment</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-[#14120C]/60">
                    <Truck size={14} className="text-[#14120C] shrink-0" />
                    <span>Free replacement within 7 days if damaged</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* ── STEP: PROCESSING MODAL ── */}
        {step === 'processing' && (
          <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-2xl border border-gray-200 shadow-lg text-center space-y-3.5">
            <div className="w-14 h-14 rounded-full border-4 border-[#111111] border-t-transparent animate-spin mx-auto" />
            <h3 className="text-lg font-bold text-gray-950">Processing Payment Securely</h3>
            <p className="text-sm text-gray-500">
              Please do not close or refresh this page. Connecting to Razorpay…
            </p>
          </div>
        )}

        {/* ── STEP: SUCCESS CONFIRMATION ── */}
        {step === 'success' && (
          <div className="max-w-xl mx-auto my-10 p-6 sm:p-8 bg-white rounded-2xl border border-gray-200 shadow-xs text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
              <CheckCircle2 size={30} />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">Order Confirmed!</h2>
              <p className="text-sm text-gray-600 mt-1.5">
                Thank you, <span className="font-semibold text-gray-900">{name.trim()}</span>! Your order{' '}
                <span className="font-mono font-medium text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                  {orderId}
                </span>{' '}
                of <span className="font-semibold text-gray-900">₹{confirmedTotal}</span> is confirmed.
              </p>
            </div>

            {invoice && (
              <button
                onClick={() => setIsInvoiceModalOpen(true)}
                className="text-xs font-semibold text-gray-600 hover:text-black underline underline-offset-2 cursor-pointer"
              >
                View Invoice
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
                      className="w-full py-2.5 px-4 rounded-lg bg-white hover:bg-gray-50 text-black border border-gray-300 hover:border-black font-semibold text-xs transition-colors flex items-center justify-between gap-2 cursor-pointer shadow-xs"
                    >
                      <span className="capitalize">Register {cleanName} Tag</span>
                      <ArrowRight size={13} />
                    </button>
                  );
                })}
              </div>
            )}

            {recognized ? (
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={onViewDashboard}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-white hover:bg-gray-50 text-black border border-gray-300 hover:border-black font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>Open Client Dashboard</span>
                  <ArrowRight size={13} />
                </button>
                {onTrackOrder && (
                  <button
                    onClick={() => onTrackOrder(orderId, phone.trim())}
                    className="py-2.5 px-4 rounded-lg bg-white hover:bg-gray-50 text-black font-semibold text-xs border border-gray-300 hover:border-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Truck size={13} />
                    <span>Track Order</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => setDashboardAccessOpen(true)}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-white hover:bg-gray-50 text-black border border-gray-300 hover:border-black font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>Access Dashboard</span>
                  <ArrowRight size={13} />
                </button>
                {onTrackOrder && (
                  <button
                    onClick={() => onTrackOrder(orderId, phone.trim())}
                    className="py-2.5 px-4 rounded-lg bg-white hover:bg-gray-50 text-black border border-gray-300 hover:border-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Truck size={13} />
                    <span>Track Order</span>
                  </button>
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

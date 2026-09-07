import React, { useEffect, useState } from 'react';
import {
  Lock,
  ShieldCheck,
  CreditCard,
  Smartphone,
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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../lib/apiClient';
import PhoneInputWithCountry from '../common/PhoneInputWithCountry';

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
}

const PAYMENT_LOGOS = ['UPI', 'GPay', 'PhonePe', 'Paytm', 'Visa', 'Mastercard', 'RuPay'];

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
}: CheckoutPageProps) {
  const { isLoggedIn, profile } = useAuth();

  // Checkout steps: 'details' → 'processing' → 'success'
  const [step, setStep] = useState<'details' | 'processing' | 'success'>('details');
  const [orderId, setOrderId] = useState('');
  const [confirmedTotal, setConfirmedTotal] = useState(0);
  const [recognized, setRecognized] = useState(false);

  // Cart is persisted in localStorage
  const [cart, setCart] = useState<CheckoutCartItem[]>(() => {
    try {
      const saved =
        localStorage.getItem('repiqr-cart') || localStorage.getItem('namoqr-cart');
      return saved ? (JSON.parse(saved) as CheckoutCartItem[]) : [];
    } catch {
      return [];
    }
  });

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
  const [payment, setPayment] = useState<'upi' | 'card' | 'cod'>('upi');
  const [error, setError] = useState('');

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

  const finalizeLocalRecords = (id: string, isRecognized: boolean) => {
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

    const items = cart.map((i) => ({
      name: i.product.name,
      qty: i.qty,
      price: i.product.price,
    }));

    let newOrderId: string = '';
    try {
      const res = await apiClient.orders.create({
        name: name.trim(),
        email: email.trim(),
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
        email: email.trim(),
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
      prefill: {
        name: name.trim(),
        email: email.trim(),
        contact: phone.trim(),
        method: payment === 'upi' ? 'upi' : 'card',
      },
      theme: { color: '#FACC15' },
      handler: async (response: any) => {
        try {
          const verifyRes = await apiClient.payments.verify({
            orderId: newOrderId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          if (!verifyRes?.success)
            throw new Error(verifyRes?.error || 'Payment verification failed');
        } catch (err: any) {
          setStep('details');
          setError(
            `${
              err?.message || 'Payment verification failed.'
            } If money was deducted it will be reconciled automatically — quote order ID ${newOrderId} if you need to contact support.`
          );
          return;
        }

        setOrderId(newOrderId);
        setConfirmedTotal(total);
        finalizeLocalRecords(newOrderId, isRecognized);
        setStep('success');
        if (onOrderComplete) onOrderComplete();
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
      !email.trim() ||
      !phone.trim() ||
      !address.trim() ||
      !city.trim() ||
      !pincode.trim()
    ) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (cleanDigits(phone).length < 10) {
      setError('Please enter a valid phone number.');
      return;
    }

    const isRecognized = checkRecognized();
    setRecognized(isRecognized);
    setStep('processing');
    runCheckout(isRecognized);
  };

  return (
    <div className="min-h-screen bg-[#F4F1EC] font-sans text-slate-900 pb-16">
      
      {/* ── TOP HEADER BAR ── */}
      <header className="sticky top-0 z-40 border-b border-black/8 bg-[#F4F1EC]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:h-20 sm:px-6">
          <button
            onClick={onBack}
            className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-slate-950"
            aria-label="Back to shop"
          >
            <ArrowLeft size={17} />
            <span className="hidden sm:inline">Back to Shop</span>
            <span className="sm:hidden">Back</span>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400 text-sm font-black text-slate-950 shadow-xs">
              R
            </div>
            <span className="font-extrabold text-lg sm:text-xl text-slate-950 tracking-tight">
              RAPI<span className="text-amber-500">QR</span>{' '}
              <span className="text-slate-400 font-medium text-sm sm:text-base">| Checkout</span>
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            <Lock size={12} className="text-emerald-600" />
            <span className="hidden sm:inline">256-BIT SSL SECURE</span>
            <span className="sm:hidden">SECURE</span>
          </div>
        </div>
      </header>

      {/* ── PAGE CONTENT ── */}
      <main className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 sm:pt-10">
        
        {/* ── EMPTY CART STATE ── */}
        {cart.length === 0 && step !== 'success' && (
          <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-slate-200 shadow-sm text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-4">
              <ShoppingBag size={32} />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">Your Cart is Empty</h3>
            <p className="text-sm text-slate-500 mb-6">
              Add a weatherproof smart QR safety tag to protect your vehicle, pet, or valuable assets.
            </p>
            <button
              onClick={onBack}
              className="w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <span>Browse Products</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* ── ACTIVE CHECKOUT GRID ── */}
        {cart.length > 0 && step === 'details' && (
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10">
            
            {/* ── LEFT COLUMN: FORM DETAILS (7 COLS) ── */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Account Awareness Banner */}
              {isLoggedIn ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                  <div>
                    Checking out as <strong>{profile?.email || email}</strong>. Your purchased tags will be automatically linked to your account.
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-950 text-xs sm:text-sm flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <User size={17} className="text-amber-600 shrink-0" />
                    <span>Quick guest checkout — no password required.</span>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenLogin}
                    className="font-bold text-slate-950 underline hover:text-amber-700 shrink-0 cursor-pointer"
                  >
                    Log In
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* ── 1. Contact Information ── */}
                <div className="space-y-4 rounded-2xl border border-black/8 bg-white p-6 shadow-sm sm:p-7">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                    <span className="w-6 h-6 rounded-full bg-slate-950 text-amber-300 text-xs font-black flex items-center justify-center">
                      1
                    </span>
                    <h2 className="font-extrabold text-base text-slate-950">Contact Information</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        placeholder="Rahul Sharma"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-sm font-medium text-slate-900 outline-hidden transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                        Phone Number *
                      </label>
                      <PhoneInputWithCountry
                        value={phone}
                        onChange={(full) => setPhone(full)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                      Email Address (For Order Receipts &amp; Tag Activation) *
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                      <input
                        type="email"
                        placeholder="rahul@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-sm font-medium text-slate-900 outline-hidden transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* ── 2. Shipping Address ── */}
                <div className="space-y-4 rounded-2xl border border-black/8 bg-white p-6 shadow-sm sm:p-7">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                    <span className="w-6 h-6 rounded-full bg-slate-950 text-amber-300 text-xs font-black flex items-center justify-center">
                      2
                    </span>
                    <h2 className="font-extrabold text-base text-slate-950">Shipping Address</h2>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                      Street Address / House / Flat *
                    </label>
                    <div className="relative">
                      <MapPin size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Flat 402, Green Heights, Opp. City Park"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-sm font-medium text-slate-900 outline-hidden transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
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
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-sm font-medium text-slate-900 outline-hidden transition-all"
                      />
                      {pincodeStatus === 'looking' && (
                        <span className="text-[11px] text-slate-400 mt-1 block">
                          Looking up location…
                        </span>
                      )}
                      {pincodeStatus === 'found' && (
                        <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
                          ✓ City &amp; State found
                        </span>
                      )}
                      {pincodeStatus === 'not-found' && (
                        <span className="text-[11px] text-slate-400 mt-1 block">
                          Enter city manually
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                        City *
                      </label>
                      <input
                        type="text"
                        placeholder="Bengaluru"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-sm font-medium text-slate-900 outline-hidden transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                        State *
                      </label>
                      <input
                        type="text"
                        placeholder="Karnataka"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-sm font-medium text-slate-900 outline-hidden transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* ── 3. Delivery Method ── */}
                <div className="space-y-4 rounded-2xl border border-black/8 bg-white p-6 shadow-sm sm:p-7">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                    <span className="w-6 h-6 rounded-full bg-slate-950 text-amber-300 text-xs font-black flex items-center justify-center">
                      3
                    </span>
                    <h2 className="font-extrabold text-base text-slate-950">Delivery Method</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setDelivery('standard')}
                      className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        delivery === 'standard'
                          ? 'border-amber-400 bg-amber-50/60 ring-2 ring-amber-400/30'
                          : 'border-slate-200 bg-slate-50 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700">
                          <Truck size={18} />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-900">Standard Delivery</div>
                          <div className="text-xs text-slate-500">4–6 business days</div>
                        </div>
                      </div>
                      <span className="font-black text-xs text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                        FREE
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDelivery('express')}
                      className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        delivery === 'express'
                          ? 'border-amber-400 bg-amber-50/60 ring-2 ring-amber-400/30'
                          : 'border-slate-200 bg-slate-50 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700">
                          <Clock size={18} />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-900">Express Priority</div>
                          <div className="text-xs text-slate-500">1–2 business days</div>
                        </div>
                      </div>
                      <span className="font-black text-xs text-slate-900 bg-amber-200 px-2.5 py-1 rounded-full">
                        ₹99
                      </span>
                    </button>
                  </div>
                </div>

                {/* ── 4. Payment Method ── */}
                <div className="space-y-4 rounded-2xl border border-black/8 bg-white p-6 shadow-sm sm:p-7">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                    <span className="w-6 h-6 rounded-full bg-slate-950 text-amber-300 text-xs font-black flex items-center justify-center">
                      4
                    </span>
                    <h2 className="font-extrabold text-base text-slate-950">Payment Method</h2>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setPayment('upi')}
                      className={`p-4 rounded-2xl border text-center flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                        payment === 'upi'
                          ? 'border-amber-400 bg-amber-50/60 ring-2 ring-amber-400/30'
                          : 'border-slate-200 bg-slate-50 hover:bg-white'
                      }`}
                    >
                      <Smartphone size={20} className="text-amber-600" />
                      <span className="font-bold text-sm text-slate-900">UPI / QR (Instant)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPayment('card')}
                      className={`p-4 rounded-2xl border text-center flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                        payment === 'card'
                          ? 'border-amber-400 bg-amber-50/60 ring-2 ring-amber-400/30'
                          : 'border-slate-200 bg-slate-50 hover:bg-white'
                      }`}
                    >
                      <CreditCard size={20} className="text-amber-600" />
                      <span className="font-bold text-sm text-slate-900">Card / NetBanking</span>
                    </button>
                  </div>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2.5">
                    <AlertCircle size={18} className="shrink-0 text-red-500" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit Action */}
                <button
                  type="submit"
                  className="w-full py-4 rounded-2xl bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-base transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-950/20 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  <span>Pay ₹{total} Securely</span>
                  <Lock size={16} className="text-amber-400" />
                  <ArrowRight size={17} className="text-amber-400" />
                </button>

                <p className="text-center text-xs text-slate-500 leading-relaxed">
                  🔒 By proceeding you agree to RapiQR Terms of Service &amp; Privacy Policy. Free replacement within 7 days.
                </p>

              </form>
            </div>

            {/* ── RIGHT COLUMN: FINAL BILLING SUMMARY (5 COLS) ── */}
            <div className="lg:col-span-5">
              <div className="sticky top-28 space-y-6 rounded-2xl border border-black/8 bg-white p-6 shadow-sm sm:p-7">
                
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2 font-black text-slate-950 text-base">
                    <Lock size={16} className="text-amber-500" />
                    <span>Order Summary</span>
                  </div>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                    {cart.reduce((s, i) => s + i.qty, 0)} Items
                  </span>
                </div>

                {/* Cart Items List */}
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3"
                    >
                      <img
                        src={item.product.img}
                        alt={item.product.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 bg-white"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-slate-900 truncate">
                          {item.product.name}
                        </div>
                        <div className="text-xs text-slate-500 font-medium">Qty: {item.qty}</div>
                      </div>
                      <div className="font-black text-sm text-slate-950">
                        ₹{item.product.price * item.qty}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2.5 pt-4 border-t border-slate-100 text-sm">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Item Subtotal</span>
                    <span className="font-semibold text-slate-900">₹{subtotal}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Shipping</span>
                    <span className="font-semibold text-emerald-700">
                      {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>GST (18% Included)</span>
                    <span className="font-medium text-slate-500">Included</span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-base sm:text-lg font-black text-slate-950">
                    <span>Total Payable</span>
                    <span className="text-amber-600">₹{total}</span>
                  </div>
                </div>

                {/* Payment Gateway Badges */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    {PAYMENT_LOGOS.map((logo) => (
                      <span
                        key={logo}
                        className="px-2 py-1 bg-slate-100 text-slate-700 font-extrabold text-[10px] rounded-md border border-slate-200"
                      >
                        {logo}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    <span>PCI-DSS Compliant Razorpay Gateway</span>
                  </div>
                </div>

                {/* Trust Guarantee */}
                <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-950 text-xs font-semibold flex items-center gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>3-Year 3M Weatherproof tag warranty included</span>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* ── STEP: PROCESSING MODAL ── */}
        {step === 'processing' && (
          <div className="max-w-md mx-auto my-16 p-10 bg-white rounded-3xl border border-slate-200 shadow-xl text-center space-y-4">
            <div className="w-16 h-16 rounded-full border-4 border-amber-400 border-t-transparent animate-spin mx-auto" />
            <h3 className="text-xl font-extrabold text-slate-950">Processing Payment Securely</h3>
            <p className="text-sm text-slate-500">
              Please do not close or refresh this page. Connecting to Razorpay proxy…
            </p>
          </div>
        )}

        {/* ── STEP: SUCCESS CONFIRMATION ── */}
        {step === 'success' && (
          <div className="max-w-xl mx-auto my-12 p-8 sm:p-10 bg-white rounded-3xl border border-slate-200 shadow-2xl text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-md animate-bounce">
              <CheckCircle2 size={42} />
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950">Order Confirmed!</h2>
              <p className="text-sm text-slate-600 mt-2">
                Thank you, <strong>{name.trim()}</strong>! Your order{' '}
                <span className="font-mono font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  {orderId}
                </span>{' '}
                of <strong>₹{confirmedTotal}</strong> is confirmed.
              </p>
            </div>

            {recognized ? (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-left space-y-3">
                <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  <span>Order Linked to Your Account</span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Your safety tags are provisioned in your Client Dashboard. You can assign contacts and configure alert routing now.
                </p>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    onClick={onViewDashboard}
                    className="flex-1 py-3 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <span>Open Client Dashboard</span>
                    <ArrowRight size={14} className="text-amber-400" />
                  </button>
                  {onTrackOrder && (
                    <button
                      onClick={() => onTrackOrder(orderId, email.trim() || phone.trim())}
                      className="py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Truck size={14} className="text-amber-500" />
                      <span>Track Order</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-4">
                <div className="font-black text-slate-950 text-base">
                  Activate &amp; Manage Your Safety Tag
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Create a free account with your purchase email to track live scan events, set private phone numbers, and manage masked telephony.
                </p>
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-700 flex items-center gap-2">
                  <Mail size={14} className="text-amber-500" />
                  <span>{email.trim()}</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    onClick={() => onOpenSignup(email.trim())}
                    className="flex-1 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <span>Create Free Account</span>
                    <ArrowRight size={14} />
                  </button>
                  {onTrackOrder && (
                    <button
                      onClick={() => onTrackOrder(orderId, email.trim() || phone.trim())}
                      className="py-3 px-4 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Truck size={14} className="text-amber-400" />
                      <span>Track Order</span>
                    </button>
                  )}
                  <button
                    onClick={onBack}
                    className="py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 transition-colors cursor-pointer"
                  >
                    Home
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

      </main>

    </div>
  );
}

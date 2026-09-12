import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import AppLogo from '../common/AppLogo';
import { OrderInvoice } from '../../types/invoice';
import { buildOrderInvoice, printOrderInvoice } from '../../services/invoiceService';
import OrderInvoiceModal from './OrderInvoiceModal';
import OrderInvoiceCard from './OrderInvoiceCard';

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

/* ── India state/city suggestion data (static, no external dependency) ──── */

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

const INDIAN_CITIES: { name: string; state: string }[] = [
  { name: 'Visakhapatnam', state: 'Andhra Pradesh' }, { name: 'Vijayawada', state: 'Andhra Pradesh' },
  { name: 'Guntur', state: 'Andhra Pradesh' }, { name: 'Tirupati', state: 'Andhra Pradesh' },
  { name: 'Itanagar', state: 'Arunachal Pradesh' },
  { name: 'Guwahati', state: 'Assam' }, { name: 'Dibrugarh', state: 'Assam' },
  { name: 'Patna', state: 'Bihar' }, { name: 'Gaya', state: 'Bihar' }, { name: 'Muzaffarpur', state: 'Bihar' },
  { name: 'Raipur', state: 'Chhattisgarh' }, { name: 'Bhilai', state: 'Chhattisgarh' },
  { name: 'Panaji', state: 'Goa' }, { name: 'Margao', state: 'Goa' },
  { name: 'Ahmedabad', state: 'Gujarat' }, { name: 'Surat', state: 'Gujarat' }, { name: 'Vadodara', state: 'Gujarat' },
  { name: 'Rajkot', state: 'Gujarat' }, { name: 'Gandhinagar', state: 'Gujarat' },
  { name: 'Gurugram', state: 'Haryana' }, { name: 'Faridabad', state: 'Haryana' }, { name: 'Panipat', state: 'Haryana' },
  { name: 'Shimla', state: 'Himachal Pradesh' },
  { name: 'Ranchi', state: 'Jharkhand' }, { name: 'Jamshedpur', state: 'Jharkhand' }, { name: 'Dhanbad', state: 'Jharkhand' },
  { name: 'Bengaluru', state: 'Karnataka' }, { name: 'Mysuru', state: 'Karnataka' }, { name: 'Mangaluru', state: 'Karnataka' },
  { name: 'Hubballi', state: 'Karnataka' },
  { name: 'Kochi', state: 'Kerala' }, { name: 'Thiruvananthapuram', state: 'Kerala' }, { name: 'Kozhikode', state: 'Kerala' },
  { name: 'Bhopal', state: 'Madhya Pradesh' }, { name: 'Indore', state: 'Madhya Pradesh' }, { name: 'Gwalior', state: 'Madhya Pradesh' },
  { name: 'Jabalpur', state: 'Madhya Pradesh' },
  { name: 'Mumbai', state: 'Maharashtra' }, { name: 'Pune', state: 'Maharashtra' }, { name: 'Nagpur', state: 'Maharashtra' },
  { name: 'Nashik', state: 'Maharashtra' }, { name: 'Thane', state: 'Maharashtra' }, { name: 'Aurangabad', state: 'Maharashtra' },
  { name: 'Imphal', state: 'Manipur' },
  { name: 'Shillong', state: 'Meghalaya' },
  { name: 'Aizawl', state: 'Mizoram' },
  { name: 'Kohima', state: 'Nagaland' },
  { name: 'Bhubaneswar', state: 'Odisha' }, { name: 'Cuttack', state: 'Odisha' },
  { name: 'Ludhiana', state: 'Punjab' }, { name: 'Amritsar', state: 'Punjab' }, { name: 'Chandigarh', state: 'Punjab' },
  { name: 'Jaipur', state: 'Rajasthan' }, { name: 'Jodhpur', state: 'Rajasthan' }, { name: 'Udaipur', state: 'Rajasthan' },
  { name: 'Kota', state: 'Rajasthan' },
  { name: 'Gangtok', state: 'Sikkim' },
  { name: 'Chennai', state: 'Tamil Nadu' }, { name: 'Coimbatore', state: 'Tamil Nadu' }, { name: 'Madurai', state: 'Tamil Nadu' },
  { name: 'Tiruchirappalli', state: 'Tamil Nadu' }, { name: 'Salem', state: 'Tamil Nadu' },
  { name: 'Hyderabad', state: 'Telangana' }, { name: 'Warangal', state: 'Telangana' },
  { name: 'Agartala', state: 'Tripura' },
  { name: 'Lucknow', state: 'Uttar Pradesh' }, { name: 'Kanpur', state: 'Uttar Pradesh' }, { name: 'Noida', state: 'Uttar Pradesh' },
  { name: 'Ghaziabad', state: 'Uttar Pradesh' }, { name: 'Agra', state: 'Uttar Pradesh' }, { name: 'Varanasi', state: 'Uttar Pradesh' },
  { name: 'Meerut', state: 'Uttar Pradesh' }, { name: 'Prayagraj', state: 'Uttar Pradesh' },
  { name: 'Dehradun', state: 'Uttarakhand' }, { name: 'Haridwar', state: 'Uttarakhand' },
  { name: 'Kolkata', state: 'West Bengal' }, { name: 'Howrah', state: 'West Bengal' }, { name: 'Siliguri', state: 'West Bengal' },
  { name: 'Port Blair', state: 'Andaman and Nicobar Islands' },
  { name: 'Silvassa', state: 'Dadra and Nagar Haveli and Daman and Diu' },
  { name: 'New Delhi', state: 'Delhi' }, { name: 'Delhi', state: 'Delhi' },
  { name: 'Srinagar', state: 'Jammu and Kashmir' }, { name: 'Jammu', state: 'Jammu and Kashmir' },
  { name: 'Leh', state: 'Ladakh' },
  { name: 'Kavaratti', state: 'Lakshadweep' },
  { name: 'Puducherry', state: 'Puducherry' },
];

/* ── Small reusable "type to filter" suggestion field ─────────────────────── */

function AutocompleteField({
  value,
  onChange,
  onSelect,
  suggestions,
  placeholder,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect?: (v: string) => void;
  suggestions: string[];
  placeholder: string;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const matches = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return [];
    return suggestions.filter((s) => s.toLowerCase().startsWith(q) || s.toLowerCase().includes(q)).slice(0, 6);
  }, [value, suggestions]);

  return (
    <div ref={wrapRef} className="relative">
      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        autoComplete="off"
        className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15 text-sm font-medium text-gray-900 outline-hidden transition-all"
      />
      {open && matches.length > 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
          {matches.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => { onChange(s); onSelect?.(s); setOpen(false); }}
              className="block w-full px-3.5 py-2 text-left text-sm text-gray-700 hover:bg-amber-50 hover:text-gray-950 cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
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
  const [invoice, setInvoice] = useState<OrderInvoice | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Cart is persisted in localStorage
  const [cart, setCart] = useState<CheckoutCartItem[]>(() => {
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
      // No `method` forced here — Razorpay's own checkout modal presents the
      // full set of payment methods (UPI/card/netbanking/wallets) and the
      // customer picks there, not on this page.
      prefill: {
        name: name.trim(),
        email: email.trim(),
        contact: phone.trim(),
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

        const completedInvoice = buildOrderInvoice({
          orderId: newOrderId,
          customerName: name.trim(),
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
          paymentTransactionId: response.razorpay_payment_id,
          deliveryType: delivery,
        });

        setInvoice(completedInvoice);
        setOrderId(newOrderId);
        setConfirmedTotal(total);
        finalizeLocalRecords(newOrderId, isRecognized, completedInvoice);
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

  const cityNames = useMemo(() => INDIAN_CITIES.map((c) => c.name), []);

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

          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            <Lock size={12} className="text-emerald-600" />
            <span className="hidden sm:inline">256-BIT SSL SECURE</span>
            <span className="sm:hidden">SECURE</span>
          </div>
        </div>
      </header>

      {/* ── PAGE CONTENT ── */}
      <main className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8">

        {/* ── EMPTY CART STATE ── */}
        {cart.length === 0 && step !== 'success' && (
          <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-2xl border border-gray-200 shadow-sm text-center">
            <div className="w-14 h-14 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-4">
              <ShoppingBag size={26} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Your Cart is Empty</h3>
            <p className="text-sm text-gray-500 mb-6">
              Add a weatherproof smart QR safety tag to protect your vehicle, pet, or valuable assets.
            </p>
            <button
              onClick={onBack}
              className="w-full py-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-gray-950 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
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
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-950 text-xs sm:text-sm flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-amber-600 shrink-0" />
                    <span>Quick guest checkout — no password required.</span>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenLogin}
                    className="font-bold text-gray-950 underline hover:text-amber-700 shrink-0 cursor-pointer"
                  >
                    Log In
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">

                {/* ── 1. Contact Information ── */}
                <div className="space-y-3.5 rounded-xl border border-gray-200 bg-white p-5">
                  <div className="flex items-center gap-2.5 pb-2.5 border-b border-gray-100">
                    <span className="w-5 h-5 rounded-full bg-gray-950 text-amber-300 text-[11px] font-bold flex items-center justify-center">
                      1
                    </span>
                    <h2 className="font-bold text-sm text-gray-950">Contact Information</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        placeholder="Rahul Sharma"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15 text-sm font-medium text-gray-900 outline-hidden transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Phone Number *
                      </label>
                      <PhoneInputWithCountry
                        value={phone}
                        onChange={(full) => setPhone(full)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Email Address (for receipts &amp; tag activation) *
                    </label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type="email"
                        placeholder="rahul@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-gray-200 bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15 text-sm font-medium text-gray-900 outline-hidden transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* ── 2. Shipping Address ── */}
                <div className="space-y-3.5 rounded-xl border border-gray-200 bg-white p-5">
                  <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-gray-950 text-amber-300 text-[11px] font-bold flex items-center justify-center">
                        2
                      </span>
                      <h2 className="font-bold text-sm text-gray-950">Shipping Address</h2>
                    </div>
                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      disabled={locating}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-700 hover:text-amber-800 cursor-pointer disabled:opacity-60"
                    >
                      {locating ? <Loader2 size={13} className="animate-spin" /> : <LocateFixed size={13} />}
                      {locating ? 'Locating…' : 'Use current location'}
                    </button>
                  </div>

                  {locateError && (
                    <p className="text-[11px] text-red-600 -mt-1.5">{locateError}</p>
                  )}

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Street Address / House / Flat *
                    </label>
                    <div className="relative">
                      <MapPin size={15} className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Flat 402, Green Heights, Opp. City Park"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-gray-200 bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15 text-sm font-medium text-gray-900 outline-hidden transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
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
                        className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15 text-sm font-medium text-gray-900 outline-hidden transition-all"
                      />
                      {pincodeStatus === 'looking' && (
                        <span className="text-[11px] text-gray-400 mt-1 block">
                          Looking up location…
                        </span>
                      )}
                      {pincodeStatus === 'found' && (
                        <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
                          ✓ City &amp; State found
                        </span>
                      )}
                      {pincodeStatus === 'not-found' && (
                        <span className="text-[11px] text-gray-400 mt-1 block">
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
                      suggestions={cityNames}
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

                {/* ── 3. Delivery Method ── */}
                <div className="space-y-3.5 rounded-xl border border-gray-200 bg-white p-5">
                  <div className="flex items-center gap-2.5 pb-2.5 border-b border-gray-100">
                    <span className="w-5 h-5 rounded-full bg-gray-950 text-amber-300 text-[11px] font-bold flex items-center justify-center">
                      3
                    </span>
                    <h2 className="font-bold text-sm text-gray-950">Delivery Method</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <button
                      type="button"
                      onClick={() => setDelivery('standard')}
                      className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        delivery === 'standard'
                          ? 'border-amber-400 bg-amber-50/60 ring-1 ring-amber-400/30'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-700">
                          <Truck size={16} />
                        </div>
                        <div>
                          <div className="font-bold text-[13px] text-gray-900">Standard Delivery</div>
                          <div className="text-[11px] text-gray-500">4–6 business days</div>
                        </div>
                      </div>
                      <span className="font-bold text-[11px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        FREE
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDelivery('express')}
                      className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        delivery === 'express'
                          ? 'border-amber-400 bg-amber-50/60 ring-1 ring-amber-400/30'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-700">
                          <Clock size={16} />
                        </div>
                        <div>
                          <div className="font-bold text-[13px] text-gray-900">Express Priority</div>
                          <div className="text-[11px] text-gray-500">1–2 business days</div>
                        </div>
                      </div>
                      <span className="font-bold text-[11px] text-gray-900 bg-amber-200 px-2 py-0.5 rounded-full">
                        ₹99
                      </span>
                    </button>
                  </div>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2.5">
                    <AlertCircle size={17} className="shrink-0 text-red-500" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit Action — Razorpay's own modal handles payment-method choice */}
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-gray-950 hover:bg-gray-900 text-white font-bold text-[15px] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  <span>Pay ₹{total} Securely</span>
                  <Lock size={15} className="text-amber-400" />
                  <ArrowRight size={16} className="text-amber-400" />
                </button>

                <p className="text-center text-[11px] text-gray-500 leading-relaxed">
                  By proceeding you agree to RapiQR Terms of Service &amp; Privacy Policy. Free replacement within 7 days.
                </p>

              </form>
            </div>

            {/* ── RIGHT COLUMN: FINAL BILLING SUMMARY (5 COLS) ── */}
            <div className="lg:col-span-5">
              <div className="sticky top-24 space-y-4 rounded-xl border border-gray-200 bg-white p-5">

                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2 font-bold text-gray-950 text-sm">
                    <Lock size={15} className="text-amber-500" />
                    <span>Order Summary</span>
                  </div>
                  <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {cart.reduce((s, i) => s + i.qty, 0)} Items
                  </span>
                </div>

                {/* Cart Items List */}
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-2.5"
                    >
                      <img
                        src={item.product.img}
                        alt={item.product.name}
                        className="w-11 h-11 rounded-lg object-cover border border-gray-200 shrink-0 bg-white"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[13px] text-gray-900 truncate">
                          {item.product.name}
                        </div>
                        <div className="text-[11px] text-gray-500 font-medium">Qty: {item.qty}</div>
                      </div>
                      <div className="font-bold text-[13px] text-gray-950">
                        ₹{item.product.price * item.qty}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2 pt-3 border-t border-gray-100 text-[13px]">
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Item Subtotal</span>
                    <span className="font-semibold text-gray-900">₹{subtotal}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className="font-semibold text-emerald-700">
                      {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-gray-600">
                    <span>GST (18% Included)</span>
                    <span className="font-medium text-gray-500">Included</span>
                  </div>
                  <div className="flex items-center justify-between pt-2.5 border-t border-gray-200 text-base font-bold text-gray-950">
                    <span>Total Payable</span>
                    <span className="text-amber-600">₹{total}</span>
                  </div>
                </div>

                {/* Payment gateway trust line — Razorpay's own modal presents the methods */}
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500 font-medium">
                    <ShieldCheck size={13} className="text-emerald-600" />
                    <span>PCI-DSS Compliant Razorpay Gateway — UPI, cards, netbanking &amp; wallets</span>
                  </div>
                </div>

                {/* Trust Guarantee */}
                <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-950 text-[11px] font-semibold flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <span>3-Year 3M Weatherproof tag warranty included</span>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* ── STEP: PROCESSING MODAL ── */}
        {step === 'processing' && (
          <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-2xl border border-gray-200 shadow-lg text-center space-y-3.5">
            <div className="w-14 h-14 rounded-full border-4 border-amber-400 border-t-transparent animate-spin mx-auto" />
            <h3 className="text-lg font-bold text-gray-950">Processing Payment Securely</h3>
            <p className="text-sm text-gray-500">
              Please do not close or refresh this page. Connecting to Razorpay…
            </p>
          </div>
        )}

        {/* ── STEP: SUCCESS CONFIRMATION ── */}
        {step === 'success' && (
          <div className="max-w-xl mx-auto my-10 p-6 sm:p-8 bg-white rounded-2xl border border-gray-200 shadow-lg text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
              <CheckCircle2 size={36} />
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-950">Order Confirmed!</h2>
              <p className="text-sm text-gray-600 mt-2">
                Thank you, <strong>{name.trim()}</strong>! Your order{' '}
                <span className="font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  {orderId}
                </span>{' '}
                of <strong>₹{confirmedTotal}</strong> is confirmed.
              </p>
            </div>

            {/* ── Tax Invoice Details & Action Card ── */}
            {invoice && (
              <OrderInvoiceCard
                invoice={invoice}
                onViewInvoice={() => setIsInvoiceModalOpen(true)}
                onPrintInvoice={() => printOrderInvoice(invoice)}
              />
            )}

            {recognized ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-left space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
                  <CheckCircle2 size={17} className="text-emerald-600" />
                  <span>Order Linked to Your Account</span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Your safety tags are provisioned in your Client Dashboard. You can assign contacts and configure alert routing now.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={onViewDashboard}
                    className="flex-1 py-2.5 rounded-lg bg-gray-950 hover:bg-gray-900 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Open Client Dashboard</span>
                    <ArrowRight size={13} className="text-amber-400" />
                  </button>
                  {onTrackOrder && (
                    <button
                      onClick={() => onTrackOrder(orderId, email.trim() || phone.trim())}
                      className="py-2.5 px-4 rounded-lg bg-white hover:bg-gray-100 text-gray-800 font-bold text-xs border border-gray-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Truck size={13} className="text-amber-500" />
                      <span>Track Order</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-xl bg-gray-50 border border-gray-200 text-left space-y-3">
                <div className="font-bold text-gray-950 text-sm">
                  Activate &amp; Manage Your Safety Tag
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Create a free account with your purchase email to track live scan events, set private phone numbers, and manage masked telephony.
                </p>
                <div className="p-2.5 rounded-lg bg-white border border-gray-200 text-xs font-mono text-gray-700 flex items-center gap-2">
                  <Mail size={13} className="text-amber-500" />
                  <span>{email.trim()}</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => onOpenSignup(email.trim())}
                    className="flex-1 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-gray-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Create Free Account</span>
                    <ArrowRight size={13} />
                  </button>
                  {onTrackOrder && (
                    <button
                      onClick={() => onTrackOrder(orderId, email.trim() || phone.trim())}
                      className="py-2.5 px-4 rounded-lg bg-gray-950 hover:bg-gray-900 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Truck size={13} className="text-amber-400" />
                      <span>Track Order</span>
                    </button>
                  )}
                  <button
                    onClick={onBack}
                    className="py-2.5 px-4 rounded-lg bg-white hover:bg-gray-100 text-gray-700 font-bold text-xs border border-gray-200 transition-colors cursor-pointer"
                  >
                    Home
                  </button>
                </div>
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

    </div>
  );
}

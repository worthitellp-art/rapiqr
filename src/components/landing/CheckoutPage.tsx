import React, { useEffect, useState } from 'react';
import {
  Lock, ShieldCheck, CreditCard, Smartphone, Truck,
  CheckCircle2, ArrowRight, X, MapPin, User, Mail,
  ArrowLeft, ShoppingBag
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../lib/apiClient';
import PhoneInputWithCountry from '../common/PhoneInputWithCountry';
import './landing.css';

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
}

const PAYMENT_LOGOS = ['UPI', 'GPay', 'PhonePe', 'Paytm', 'Visa', 'Mastercard', 'RuPay'];

export default function CheckoutPage({
  onBack, onOpenSignup, onOpenLogin, onViewDashboard, onOrderComplete
}: CheckoutPageProps) {
  const { isLoggedIn, profile } = useAuth();

  // Checkout steps: 'details' → 'processing' → 'success'
  const [step, setStep] = useState<'details' | 'processing' | 'success'>('details');
  const [orderId, setOrderId] = useState('');
  const [confirmedTotal, setConfirmedTotal] = useState(0);
  const [recognized, setRecognized] = useState(false);

  // Cart is persisted to localStorage by the landing page
  const [cart, setCart] = useState<CheckoutCartItem[]>(() => {
    try {
      const saved = localStorage.getItem('repiqr-cart') || localStorage.getItem('namoqr-cart');
      return saved ? (JSON.parse(saved) as CheckoutCartItem[]) : [];
    } catch {
      return [];
    }
  });

  // Guest checkout form — only essentials
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
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

  const cleanDigits = (v: string) => (v || '').replace(/\D/g, '');

  // Recognized account = logged-in profile match OR stored user match by email/phone
  const checkRecognized = () => {
    const em = email.trim().toLowerCase();
    const ph = cleanDigits(phone);
    if (isLoggedIn && profile) {
      if (em && (profile.email || '').toLowerCase() === em) return true;
      const pPhone = cleanDigits(profile.phoneNumber);
      if (ph && pPhone && ph.includes(pPhone)) return true;
    }
    try {
      const saved = localStorage.getItem('repiqr-auth-user') || localStorage.getItem('namoqr-auth-user');
      if (saved) {
        const u = JSON.parse(saved);
        if (em && (u.email || '').toLowerCase() === em) return true;
        const uPhone = cleanDigits(u.phoneNumber || u.phone);
        if (ph && uPhone && ph.includes(uPhone)) return true;
      }
    } catch { /* ignore */ }
    return false;
  };

  const persistOrderAndStickers = async (isRecognized: boolean) => {
    const items = cart.map(i => ({ name: i.product.name, qty: i.qty, price: i.product.price }));

    // Real, durable order record (task.md #6 — this used to be localStorage-only,
    // invisible across devices/browsers and gone if storage was cleared).
    let id = '#NQ-' + Math.floor(100000 + Math.random() * 899999);
    try {
      const res = await apiClient.orders.create({
        name: name.trim(), email: email.trim(), phone: phone.trim(),
        items, subtotal, deliveryFee, total,
        paymentMethod: payment, deliveryMethod: delivery,
        shippingAddress: { address: address.trim(), city: city.trim(), state: state.trim(), pincode: pincode.trim() },
      });
      if (res.data?.id) id = res.data.id;
    } catch (err) {
      console.error('Failed to persist order to the server — it will NOT appear in the admin Orders tab (kept locally only):', err);
    }

    setOrderId(id);
    setConfirmedTotal(total); // capture before the parent clears the cart

    // Local receipt copy — kept for the guest "order history" fallback when the
    // backend save above didn't go through (e.g. offline).
    try {
      const orders = JSON.parse(localStorage.getItem('repiqr-orders') || localStorage.getItem('namoqr-orders') || '[]');
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
        linkedToAccount: isRecognized
      });
      localStorage.setItem('repiqr-orders', JSON.stringify(orders));
      localStorage.setItem('namoqr-orders', JSON.stringify(orders));
    } catch { /* ignore */ }

    // Create sticker records so purchased tags appear in the dashboard
    const newStickers: any[] = [];
    cart.forEach(item => {
      for (let i = 0; i < item.qty; i++) {
        const codeId = 'NQ-' + (item.product.category || 'car').slice(0, 4).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);
        newStickers.push({
          id: 'p' + Date.now() + '-' + i,
          code: codeId,
          nickname: item.product.name + (item.qty > 1 ? ` #${i + 1}` : ''),
          category: (item.product.category || 'car').toLowerCase(),
          assigned: name.trim() || 'Self',
          status: 'Active',
          scans: 0,
          lastScan: 'Just purchased',
          ownerPhone: phone.trim(),
          meta: [['Purchased', 'Just now'], ['Order ID', id]],
          docs: [],
          contacts: [[name.trim() || 'Customer', phone.trim()]],
          timeline: [['success', 'Order Completed', 'Just now', `Purchased via Order ${id}`]]
        });
      }
    });
    try {
      const existing = JSON.parse(localStorage.getItem('repiqr-client-stickers') || localStorage.getItem('namoqr-client-stickers') || '[]');
      localStorage.setItem('repiqr-client-stickers', JSON.stringify([...newStickers, ...existing]));
      localStorage.setItem('namoqr-client-stickers', JSON.stringify([...newStickers, ...existing]));
      const qrList = JSON.parse(localStorage.getItem('repiqr-qrlist') || localStorage.getItem('namoqr-qrlist') || '[]');
      const updatedQrList = [...qrList, ...newStickers.map(s => ({
        id: s.id, code: s.code, status: 'active', ownerPhone: s.ownerPhone, ownerName: s.assigned, category: s.category
      }))];
      localStorage.setItem('repiqr-qrlist', JSON.stringify(updatedQrList));
      localStorage.setItem('namoqr-qrlist', JSON.stringify(updatedQrList));
    } catch { /* ignore */ }

    return id;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !email.trim() || !phone.trim() || !address.trim() || !city.trim() || !pincode.trim()) {
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
    setTimeout(async () => {
      await persistOrderAndStickers(isRecognized);
      setStep('success');
      if (onOrderComplete) onOrderComplete();
    }, 1800);
  };

  const inputCls: React.CSSProperties = {
    width: '100%', padding: '12px 14px', fontSize: 13.5, borderRadius: 12,
    border: '1px solid var(--border)', background: 'var(--paper)', color: 'var(--ink)',
    outline: 'none', fontFamily: 'inherit', transition: 'border-color .18s ease, box-shadow .18s ease'
  };
  const labelCls: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--ink-soft)',
    textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6
  };

  return (
    <div className="co-page">
      {/* ── PAGE HEADER ── */}
      <div className="co-page-header">
        <div className="co-page-header-inner">
          <button onClick={onBack} className="co-page-back" aria-label="Back to shop">
            <ArrowLeft size={16} />
            <span>Back to Shop</span>
          </button>
          <div className="co-page-brand">
            <ShoppingBag size={17} />
            <span>RapiQR Checkout</span>
          </div>
          <div className="co-trust-chip co-page-lock">
            <Lock size={11} /> 256-bit SSL SECURE
          </div>
        </div>
      </div>

      <div className="co-page-body">
        {/* ── EMPTY STATE ── */}
        {cart.length === 0 && step !== 'success' && (
          <div className="co-page-empty">
            <ShoppingBag size={40} style={{ color: 'var(--ink-faint)' }} />
            <h3 className="co-page-empty-title">Your cart is empty</h3>
            <p className="co-page-empty-sub">Add a safety tag to get started.</p>
            <button className="co-cta-primary" onClick={onBack}>
              Browse Products <ArrowRight size={14} />
            </button>
          </div>
        )}

        {cart.length > 0 && step === 'details' && (
          <div className="co-page-grid">
            {/* ── LEFT: FORM ── */}
            <div className="co-page-form">
              {/* Account awareness */}
              {isLoggedIn ? (
                <div className="co-account-banner co-account-linked">
                  <CheckCircle2 size={15} style={{ color: '#16A34A' }} />
                  <span>
                    Checking out as <strong>{profile?.email || email}</strong> — your order will be linked to this account.
                  </span>
                </div>
              ) : (
                <div className="co-account-banner">
                  <User size={15} style={{ color: 'var(--brand)' }} />
                  <span>
                    Quick guest checkout — no account needed.{' '}
                    <button type="button" className="co-link-btn" onClick={onOpenLogin}>Have an account? Log in</button>
                  </span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="co-form">
                {/* 1. Contact */}
                <div className="co-section">
                  <div className="co-section-head">
                    <span className="co-step-num">1</span>
                    <span className="co-section-title">Contact Information</span>
                  </div>
                  <div className="co-grid-2">
                    <div>
                      <label style={labelCls}>Full Name *</label>
                      <input style={inputCls} placeholder="Rahul Sharma" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div>
                      <label style={labelCls}>Phone *</label>
                      <PhoneInputWithCountry value={phone} onChange={full => setPhone(full)} />
                    </div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <label style={labelCls}>Email Address *</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={14} style={{ position: 'absolute', left: 12, top: 13, color: 'var(--ink-faint)' }} />
                      <input
                        type="email"
                        style={{ ...inputCls, paddingLeft: 34 }}
                        placeholder="you@example.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Shipping */}
                <div className="co-section">
                  <div className="co-section-head">
                    <span className="co-step-num">2</span>
                    <span className="co-section-title">Shipping Address</span>
                  </div>
                  <div>
                    <label style={labelCls}>Street Address *</label>
                    <div style={{ position: 'relative' }}>
                      <MapPin size={14} style={{ position: 'absolute', left: 12, top: 13, color: 'var(--ink-faint)' }} />
                      <input
                        style={{ ...inputCls, paddingLeft: 34 }}
                        placeholder="Flat 402, Green Heights, Nr. City Mall"
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="co-grid-3" style={{ marginTop: 12 }}>
                    <div>
                      <label style={labelCls}>City *</label>
                      <input style={inputCls} placeholder="Rajkot" value={city} onChange={e => setCity(e.target.value)} />
                    </div>
                    <div>
                      <label style={labelCls}>State *</label>
                      <input style={inputCls} placeholder="Gujarat" value={state} onChange={e => setState(e.target.value)} />
                    </div>
                    <div>
                      <label style={labelCls}>Pincode *</label>
                      <input style={inputCls} placeholder="360001" value={pincode} onChange={e => setPincode(e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* 3. Delivery */}
                <div className="co-section">
                  <div className="co-section-head">
                    <span className="co-step-num">3</span>
                    <span className="co-section-title">Delivery Method</span>
                  </div>
                  <div className="co-grid-2">
                    <button
                      type="button"
                      onClick={() => setDelivery('standard')}
                      className={`co-pay-opt${delivery === 'standard' ? ' active' : ''}`}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Truck size={16} />
                        <div style={{ textAlign: 'left' }}>
                          <div className="co-opt-title">Standard</div>
                          <div className="co-opt-sub">4–6 business days</div>
                        </div>
                      </div>
                      <span className="co-opt-price">FREE</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDelivery('express')}
                      className={`co-pay-opt${delivery === 'express' ? ' active' : ''}`}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Truck size={16} />
                        <div style={{ textAlign: 'left' }}>
                          <div className="co-opt-title">Express</div>
                          <div className="co-opt-sub">1–2 business days</div>
                        </div>
                      </div>
                      <span className="co-opt-price">₹99</span>
                    </button>
                  </div>
                </div>

                {/* 4. Payment */}
                <div className="co-section">
                  <div className="co-section-head">
                    <span className="co-step-num">4</span>
                    <span className="co-section-title">Payment Method</span>
                  </div>
                  <div className="co-pay-row">
                    <button
                      type="button"
                      onClick={() => setPayment('upi')}
                      className={`co-pay-opt${payment === 'upi' ? ' active' : ''}`}
                    >
                      <Smartphone size={16} /> UPI
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayment('card')}
                      className={`co-pay-opt${payment === 'card' ? ' active' : ''}`}
                    >
                      <CreditCard size={16} /> Card
                    </button>
                   
                  </div>
                  <div className="co-secure-note" style={{ marginTop: 10 }}>
                    <Lock size={12} /> Your payment details are encrypted end-to-end.
                  </div>
                </div>

                {error && (
                  <div className="co-error">
                    <span>⚠</span> {error}
                  </div>
                )}

                <button type="submit" className="co-pay-btn">
                  Pay ₹{total} Securely <Lock size={13} /> <ArrowRight size={14} />
                </button>
                <p className="co-terms">
                  By continuing you agree to our Terms &amp; Privacy Policy. Free returns within 7 days.
                </p>
              </form>
            </div>

            {/* ── RIGHT: FINAL BILLING ── */}
            <div className="co-page-bill">
              <div className="co-page-bill-sticky">
                <div className="co-page-bill-head">
                  <Lock size={13} />
                  <span>Final Billing</span>
                </div>

                <div className="co-summary-items">
                  {cart.map(item => (
                    <div key={item.product.id} className="co-sum-item">
                      <img src={item.product.img} alt={item.product.name} className="co-sum-img" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="co-sum-name">{item.product.name}</div>
                        <div className="co-sum-sub">Qty {item.qty}</div>
                      </div>
                      <div className="co-sum-price">₹{item.product.price * item.qty}</div>
                    </div>
                  ))}
                </div>

                <div className="co-sum-lines">
                  <div className="co-sum-line"><span>Subtotal</span><span>₹{subtotal}</span></div>
                  <div className="co-sum-line"><span>Delivery</span><span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span></div>
                  <div className="co-sum-line"><span>GST (Included)</span><span>Incl.</span></div>
                  <div className="co-sum-line total"><span>Total Payable</span><span>₹{total}</span></div>
                </div>

                <div className="co-gateways co-page-gateways">
                  <div className="co-gateway-logos">
                    {PAYMENT_LOGOS.map(l => (
                      <span key={l} className="co-gateway-chip">{l}</span>
                    ))}
                  </div>
                  <div className="co-secure-note">
                    <ShieldCheck size={12} /> PCI-DSS compliant · Razorpay secure payments
                  </div>
                </div>

                <div className="co-page-free">
                  <CheckCircle2 size={14} style={{ color: '#16A34A' }} />
                  Free shipping · Lifetime protection included
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP: PROCESSING ── */}
        {step === 'processing' && (
          <div className="co-processing">
            <div className="co-spinner" />
            <h3 className="co-proc-title">Processing your payment securely…</h3>
            <p className="co-proc-sub">Please don't close this window. This takes a few seconds.</p>
          </div>
        )}

        {/* ── STEP: SUCCESS ── */}
        {step === 'success' && (
          <div className="co-success">
            <div className="co-success-icon">
              <CheckCircle2 size={34} />
            </div>
            <h3 className="co-success-title">Order Confirmed!</h3>
            <p className="co-success-sub">
              Thank you, <strong>{name.trim()}</strong>! Your order <strong className="co-order-id">{orderId}</strong> of ₹{confirmedTotal} is confirmed.
            </p>

            {recognized ? (
              <div className="co-nudge recognized">
                <div className="co-nudge-icon"><CheckCircle2 size={18} /></div>
                <div>
                  <div className="co-nudge-title">Order linked to your account</div>
                  <p className="co-nudge-text">
                    Your stickers are ready. Open the dashboard to activate and manage them.
                  </p>
                </div>
                <button className="co-cta-primary" onClick={onViewDashboard}>
                  Open Dashboard <ArrowRight size={14} />
                </button>
              </div>
            ) : (
              <div className="co-nudge">
                <div className="co-nudge-title">Create an account to activate and manage your sticker!</div>
                <p className="co-nudge-text">
                  One free account lets you activate your tag, manage emergency contacts and track scans — pre-filled with your order email.
                </p>
                <div className="co-nudge-email">
                  <Mail size={13} /> {email.trim()}
                </div>
                <div className="co-nudge-actions">
                  <button className="co-cta-primary" onClick={() => onOpenSignup(email.trim())}>
                    Create Free Account <ArrowRight size={14} />
                  </button>
                  <button className="co-cta-ghost" onClick={onBack}>Continue as Guest</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

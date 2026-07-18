import './landing.css';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Car, Bike, Home, Luggage, ShieldCheck, ShieldAlert, Package } from 'lucide-react';
import { InfiniteMovingCards } from '../ui/infinite-moving-cards';


const PRODUCTS = [
  {
    name: 'Car Safety Sticker', desc: 'Wrong parking, crash-assist & blocking alerts.', price: 349, mrp: 399, img: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&q=80&w=700', chip: 'Vehicle', best: true,
    features: ['Wrong parking & blocking alerts', 'AI crash-deceleration detection', 'Masked SOS hotline, one tap away', 'Weatherproof, rated 3+ years outdoors']
  },
  {
    name: 'Bike Safety Sticker', desc: 'Insurance reminders & anti-theft SOS.', price: 249, mrp: 299, img: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=700', chip: 'Vehicle',
    features: ['Anti-theft & suspicious activity alerts', 'Insurance & service due reminders', 'Masked SOS hotline, one tap away', 'Weatherproof, rated 3+ years outdoors']
  },
  {
    name: 'Home Gate Sticker', desc: 'Visitor status & courier notifications.', price: 349, mrp: 399, img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=700', chip: 'Home',
    features: ['Live availability status for visitors', 'Courier & delivery instant alerts', 'Water & gas leak urgent flagging', 'Fits any gate, door or society entrance']
  },
  {
    name: 'Luggage Tag', desc: 'Lost & found recovery, anywhere you fly.', price: 249, mrp: 299, img: 'https://images.unsplash.com/photo-1553531384-cc64ac80f931?auto=format&fit=crop&q=80&w=700', chip: 'Travel',
    features: ['Anonymous finder messaging', 'Works with any airline, any airport', 'Global lost & found recovery network', 'Durable strap-mount, rated for travel']
  },
  {
    name: 'SOS Keychain', desc: 'Medical ID card for first responders.', price: 249, mrp: 299, img: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&q=80&w=700', chip: 'Family',
    features: ['Blood group & medical notes card', 'Masked emergency call, one tap', 'Ideal for elderly parents & children', 'Compact, lightweight keychain form']
  },
  {
    name: 'Child School Bag Tag', desc: 'Bus tracking & allergy alerts for kids.', price: 249, mrp: 299, img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=700', chip: 'Family',
    features: ['School bus pickup & drop tracking', 'Allergy & medical alert card', 'Parent masked contact for staff', 'Lightweight clip, fits any bag']
  },
];

const COMBOS = [
  { name: 'Two-Wheeler Duo', includes: '1 Bike Sticker + 1 SOS Keychain', price: 449, old: 498, save: 49, pop: false },
  { name: 'Family Starter Pack', includes: '1 Car + 1 Home Gate + 1 Child Bag Tag', price: 899, old: 1047, save: 148, pop: true },
  { name: "Traveller's Kit", includes: '2 Luggage Tags + 1 SOS Keychain', price: 599, old: 747, save: 148, pop: false },
  { name: 'Full Garage Combo', includes: '1 Car Sticker + 1 Bike Sticker', price: 549, old: 598, save: 49, pop: false },
  { name: 'Whole Home Bundle', includes: '2 Gate Tags + 2 Child Bag Tags', price: 999, old: 1196, save: 197, pop: false },
];

const TESTIMONIALS = [
  { text: "Someone scanned my car sticker to tell me my cabin light was on — never would've known otherwise. Setup took two minutes.", name: 'Karan S.', label: 'Car Sticker · Delhi', img: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80&w=200' },
  { text: "Put keychains on both my parents. My father's medical notes have already helped a stranger get him water and call me in time.", name: 'Asha M.', label: 'SOS Keychain · Ahmedabad', img: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=200' },
  { text: 'The gate sticker is genuinely useful — couriers ping us directly instead of calling the wrong flat five times.', name: 'Rahul P.', label: 'Home Gate Tag · Bengaluru', img: 'https://images.unsplash.com/photo-1607346256330-dee7af15f7c5?auto=format&fit=crop&q=80&w=200' },
];

const FAQ_DATA = [
  { q: 'Does the person scanning see my phone number?', a: 'Never. All calls route through a masked number, and all messages route through our app — your real number stays private at all times.' },
  { q: 'How long does the sticker last outdoors?', a: 'Every sticker is weatherproof and UV-resistant, rated for 3+ years of outdoor exposure including rain and direct sun.' },
  { q: 'Can one account manage stickers for my whole family?', a: 'Yes — assign any sticker to a family member from your dashboard, and manage every category from one login.' },
  { q: 'Is GST invoicing available for bulk or corporate orders?', a: 'Every order — retail or bulk — ships with a GST invoice. For distributor and corporate orders, reach out via the partner form above.' },
];

function AnimatedCounter({ value, duration = 1800 }: { value: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  const match = value.match(/^([0-9.]+)(.*)$/);
  const target = match ? parseFloat(match[1]) : 0;
  const suffix = match ? match[2] : '';
  const isFloat = value.includes('.');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const startTime = performance.now();

          const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            const current = easeProgress * target;
            setCount(current);

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setCount(target);
            }
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration, hasAnimated]);

  return (
    <span ref={ref}>
      {isFloat ? count.toFixed(1) : Math.floor(count)}
      {suffix}
    </span>
  );
}

export default function LandingPageMaster({ onStart, onLogin }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [cartCount, setCartCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [qvProduct, setQvProduct] = useState(null);
  const [qvQty, setQvQty] = useState(1);
  const [toastMsg, setToastMsg] = useState('');
  const [toastShow, setToastShow] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  const toastTimer = useRef(null);
  const navRef = useRef(null);
  const qvOverlayRef = useRef(null);
  const productsRef = useRef(null);

  const filtered = activeFilter === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.chip === activeFilter);

  const showToast = useCallback((msg, duration = 2600) => {
    setToastMsg(msg);
    setToastShow(true);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastShow(false), duration);
  }, []);

  const addToCart = useCallback((name, price) => {
    setCartCount(c => c + 1);
    showToast(`${name} added to cart · ₹${price}`);
  }, [showToast]);

  const filterAndScroll = useCallback((category) => {
    setActiveFilter(category);
    setTimeout(() => {
      document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
    }, 0);
  }, []);

  const openQuickView = useCallback((idx) => {
    setQvProduct(PRODUCTS[idx]);
    setQvQty(1);
    document.body.style.overflow = 'hidden';
  }, []);

  const closeQuickView = useCallback(() => {
    setQvProduct(null);
    document.body.style.overflow = '';
  }, []);

  const changeQvQty = useCallback((delta) => {
    setQvQty(q => Math.max(1, q + delta));
  }, []);

  const addQvToCart = useCallback(() => {
    if (!qvProduct) return;
    for (let i = 0; i < qvQty; i++) addToCart(qvProduct.name, qvProduct.price);
    closeQuickView();
  }, [qvProduct, qvQty, addToCart, closeQuickView]);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    let lastScrollY = window.scrollY;
    
    const onScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Toggle scrolled class for full header transform
      nav.classList.toggle('scrolled', currentScrollY > 40);

      // Handle visibility based on scroll direction
      if (currentScrollY <= 10) {
        // At the very top of the page, always show the navbar
        nav.classList.remove('nav-hidden');
      } else if (currentScrollY > lastScrollY) {
        // Scrolling DOWN -> hide navbar
        nav.classList.add('nav-hidden');
      } else if (currentScrollY < lastScrollY) {
        // Scrolling UP -> show navbar smoothly
        nav.classList.remove('nav-hidden');
      }
      
      lastScrollY = currentScrollY;
    };
    
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!qvProduct) {
      document.body.style.overflow = '';
    }
  }, [qvProduct]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && qvProduct) closeQuickView();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [qvProduct, closeQuickView]);

  const handleDistributorSubmit = useCallback((e) => {
    e.preventDefault();
    showToast("Application received — we'll reach out within 48 hrs", 3200);
    e.target.reset();
  }, [showToast]);

  return (
    <>

      <nav className="nav" id="nav" ref={navRef}>
        <div className="wrap nav-row">
          <a href="#top" className="nav-logo">
            <svg viewBox="0 0 32 32" fill="none">
              <rect x="2" y="2" width="11" height="11" rx="3" stroke="#D9581F" strokeWidth="3" />
              <rect x="19" y="2" width="11" height="11" rx="3" stroke="#D9581F" strokeWidth="3" />
              <rect x="2" y="19" width="11" height="11" rx="3" stroke="#D9581F" strokeWidth="3" />
              <rect x="19" y="19" width="5" height="5" rx="1" fill="#D9581F" />
              <rect x="26" y="26" width="4" height="4" rx="1" fill="#D9581F" />
              <rect x="19" y="26" width="4" height="4" rx="1" fill="#D9581F" />
              <rect x="26" y="19" width="4" height="4" rx="1" fill="#D9581F" />
            </svg>
            Namo<span>QR</span>
          </a>
          <div className="nav-links">
            <div className="nav-item-mega">
              <span className="mega-trigger">Shop Stickers <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg></span>
              <div className="mega-panel">
                <div className="mega-inner">
                  <div className="mega-list">
                    <div className="mega-list-label">Browse by category</div>
                    <button onClick={() => filterAndScroll('all')}>All Stickers</button>
                    <button onClick={() => filterAndScroll('Vehicle')}>Vehicle Safety</button>
                    <button onClick={() => filterAndScroll('Home')}>Home & Family</button>
                    <button onClick={() => filterAndScroll('Travel')}>Travel & Kids</button>
                    <button onClick={() => document.getElementById('combos')?.scrollIntoView({ behavior: 'smooth' })}>Combo Packs</button>
                  </div>
                  <div className="mega-visual-grid">
                    <div className="mega-visual-card" onClick={() => filterAndScroll('Vehicle')}>
                      <img src="https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&q=80&w=400" alt="Car Sticker" loading="lazy" />
                      <span className="mega-visual-label">Car Sticker</span>
                      <span className="mega-visual-price">₹349</span>
                    </div>
                    <div className="mega-visual-card" onClick={() => filterAndScroll('Home')}>
                      <img src="https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=400" alt="Home Gate Sticker" loading="lazy" />
                      <span className="mega-visual-label">Home Gate</span>
                      <span className="mega-visual-price">₹349</span>
                    </div>
                    <div className="mega-visual-card" onClick={() => filterAndScroll('Travel')}>
                      <img src="https://images.unsplash.com/photo-1523171613936-cee4809f8c5b?auto=format&fit=crop&q=80&w=400" alt="Luggage Tag" loading="lazy" />
                      <span className="mega-visual-label">Luggage Tag</span>
                      <span className="mega-visual-price">₹249</span>
                    </div>
                    <div className="mega-visual-card" onClick={() => filterAndScroll('Family')}>
                      <img src="https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=400" alt="SOS Keychain" loading="lazy" />
                      <span className="mega-visual-label">SOS Keychain</span>
                      <span className="mega-visual-price">₹249</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <a href="#how">How it Works</a>
            <a href="#about">About Us</a>
            <a href="#distributor">Become a Partner</a>
            <a href="#faq">FAQs</a>
          </div>
          <div className="nav-actions">
            <a href="#" className="cart-btn" aria-label="My Account / Dashboard" title="My Account" onClick={(e) => { e.preventDefault(); onLogin(); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </a>
            <button className="cart-btn" onClick={() => onStart()} aria-label="Go to checkout">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              <span className="cart-count" id="cart-count">{cartCount}</span>
            </button>
            <a href="#products" className="btn btn-primary" style={{ display: 'inline-flex' }}>Shop Now</a>
            <button className="hamburger" onClick={() => setMobileOpen(true)}><span></span><span></span><span></span></button>
          </div>
        </div>
      </nav>

      <div className={`mobile-menu${mobileOpen ? ' open' : ''}`} id="mobile-menu">
        <button className="mobile-close" onClick={() => setMobileOpen(false)}>✕</button>
        <a href="#products" className="mob-link" onClick={() => setMobileOpen(false)}>Shop Stickers</a>
        <a href="#how" className="mob-link" onClick={() => setMobileOpen(false)}>How it Works</a>
        <a href="#about" className="mob-link" onClick={() => setMobileOpen(false)}>About Us</a>
        <a href="#distributor" className="mob-link" onClick={() => setMobileOpen(false)}>Become a Partner</a>
        <a href="#faq" className="mob-link" onClick={() => setMobileOpen(false)}>FAQs</a>
      </div>

      <div id="top"></div>

      <section className="hero">
        <div className="wrap">

          <div className="hero-top">
            <p className="eyebrow">Trusted by 10,000+ families across India</p>
            <h1 className="hero-title serif">One scan away<br />from <em>help</em>, always.</h1>
          </div>

          <div className="hero-products-grid">
            {PRODUCTS.map((p, i) => (
              <a href="#products" className="hero-product-card" key={i}>
                <img src={p.img} alt={p.name} loading="lazy" draggable={false} />
                <span className="hero-product-label">{p.name}</span>
              </a>
            ))}
          </div>

          <div className="hero-bottom">
            <p className="hero-sub">QR safety stickers for your car, bike, home gate, luggage and family — alerts reach you instantly, your number stays private.</p>
            <div className="hero-cta">
              <a href="#products" className="btn btn-primary">Shop Now</a>
              <a href="#how" className="btn btn-ghost">See How it Works</a>
            </div>
            <div className="secure-chip">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2 4 6v6c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V6l-8-4Z"></path>
              </svg>
              Secure checkout · SSL encrypted · GST invoice always
            </div>
            <div className="hero-trust">
              <div className="trust-item">
                <span className="trust-num serif" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AnimatedCounter value="4.8" />
                  <span style={{ fontSize: '14px', color: 'var(--orange)' }}>★</span>
                </span>
                <span className="trust-label">2,400+ Reviews</span>
              </div>
              <div className="trust-item"><span className="trust-num serif"><AnimatedCounter value="10K+" /></span><span className="trust-label">Families Protected</span></div>
              <div className="trust-item"><span className="trust-num serif">24/7</span><span className="trust-label">Alert Monitoring</span></div>
            </div>
          </div>

        </div>
        <div className="category-row">
          <div className="category-item"><Car size={18} /> Car Stickers</div>
          <div className="category-item"><Bike size={18} /> Bike Stickers</div>
          <div className="category-item"><Home size={18} /> Home Gate Tags</div>
          <div className="category-item"><Luggage size={18} /> Luggage Tags</div>
          <div className="category-item"><ShieldCheck size={18} /> Child Safety Bags</div>
          <div className="category-item"><ShieldAlert size={18} /> SOS Keychains</div>
        </div>
        <div className="scroll-cue" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>
      </section>

      <section className="sec" style={{ padding: '40px 0' }}>
        <div className="wrap">
          <div className="how reveal">
            <div className="wrap" style={{ padding: '0 44px' }}>
              <p className="eyebrow">The Mechanics</p>
              <h2 className="sec-title serif" style={{ color: 'var(--cream)', maxWidth: '560px', marginTop: '14px' }}>From a scratched sticker to a resolved alert, in three steps.</h2>
              <div className="how-grid">
                <div className="how-card">
                  <div className="how-num">01 — Stick it</div>
                  <h3 className="how-title serif">Peel, stick, register</h3>
                  <p className="how-desc">Apply the weatherproof sticker to your car, bike, gate, bag or keychain, then register it to your account in under a minute.</p>
                  <div className="how-line"></div>
                </div>
                <div className="how-card">
                  <div className="how-num">02 — Someone scans</div>
                  <h3 className="how-title serif">A bystander finds it</h3>
                  <p className="how-desc">Anyone — a guard, a courier, a stranger — scans the QR and picks a reason: parking, a lost bag, a medical emergency.</p>
                  <div className="how-line"></div>
                </div>
                <div className="how-card">
                  <div className="how-num">03 — You're notified</div>
                  <h3 className="how-title serif">Alert reaches you, privately</h3>
                  <p className="how-desc">You get an SMS, WhatsApp ping or a masked call instantly — your real number is never revealed to the scanner.</p>
                  <div className="how-line"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sec" id="how" style={{ paddingTop: 0 }}>
        <div className="wrap">

          <div className="edit-block reveal">
            <div className="edit-media">
              <img src="https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&q=80&w=900" alt="Car protected with NamoQR sticker" loading="lazy" decoding="async" />
            </div>
            <div className="edit-copy">
              <p className="eyebrow">Vehicle Safety</p>
              <h3 className="edit-title serif">Never get an angry knock at 2 AM again.</h3>
              <p className="edit-desc">Wrong parking, blocked exits, cabin lights left on — bystanders resolve it directly with you, without ever seeing your number.</p>
              <ul className="edit-list">
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  AI crash deceleration alerts (Car)
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Insurance & service reminders (Bike)
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Masked SOS hotline, one tap away
                </li>
              </ul>
              <a href="#products" className="btn btn-dark btn-sm edit-cta">Shop Car & Bike Stickers</a>
            </div>
          </div>

          <div className="edit-block rev reveal">
            <div className="edit-media">
              <img src="https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=900" alt="Home gate protected with NamoQR sticker" loading="lazy" decoding="async" />
            </div>
            <div className="edit-copy">
              <p className="eyebrow">Home & Family</p>
              <h3 className="edit-title serif">Your gate knows when you're away, so guests don't have to guess.</h3>
              <p className="edit-desc">Couriers, visitors and security get exactly the instructions you set — while your family's routine stays completely private.</p>
              <ul className="edit-list">
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Live availability status for visitors
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Water & gas leak urgent flagging
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  School bus & child bag tracking
                </li>
              </ul>
              <a href="#products" className="btn btn-dark btn-sm edit-cta">Shop Home & Family Tags</a>
            </div>
          </div>

          <div className="edit-block reveal">
            <div className="edit-media">
              <img src="https://images.unsplash.com/photo-1523171613936-cee4809f8c5b?auto=format&fit=crop&q=80&w=900" alt="Luggage and keychain protected with NamoQR" loading="lazy" decoding="async" />
            </div>
            <div className="edit-copy">
              <p className="eyebrow">On the Move</p>
              <h3 className="edit-title serif">Lost luggage finds its way back, wherever you land.</h3>
              <p className="edit-desc">From Heathrow to home, a finder can message you instantly — and your SOS keychain carries the medical details first responders need.</p>
              <ul className="edit-list">
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Works with any airline, any airport
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Blood group & allergy medical card
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Anonymous finder messaging
                </li>
              </ul>
              <a href="#products" className="btn btn-dark btn-sm edit-cta">Shop Luggage & Keychains</a>
            </div>
          </div>

        </div>
      </section>

      <section className="sec" id="products" ref={productsRef} style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec-head reveal">
            <h2 className="sec-title serif">Six ways to stay one scan away from the people who matter.</h2>
            <p className="sec-desc">Every sticker links to the same private safety network — swap categories, keep the protection.</p>
          </div>
          <div className="filter-row reveal" id="filter-row">
            {['all', 'Vehicle', 'Home', 'Travel', 'Family'].map(f => (
              <button key={f} className={`filter-chip${activeFilter === f ? ' active' : ''}`} data-filter={f} onClick={() => filterAndScroll(f)}>
                {f === 'all' ? 'All Stickers' : f}
              </button>
            ))}
          </div>
          <div className="prod-grid" id="product-grid">
            {filtered.map((p, idx) => {
              const realIdx = PRODUCTS.indexOf(p);
              return (
                <div key={p.name} className="prod-card reveal in" onClick={() => openQuickView(realIdx)} style={{ cursor: 'pointer' }}>
                  <div className="prod-media">
                    <span className="prod-chip">{p.chip}</span>
                    {p.best && (
                      <span className="prod-best">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.6L22 9.3l-5 4.9 1.2 7.1L12 17.8l-6.2 3.5L7 14.2l-5-4.9 7.1-.7z" /></svg>
                        Bestseller
                      </span>
                    )}
                    <div className="prod-peel"></div>
                    <img
                      src={p.img}
                      alt={p.name}
                      loading="lazy"
                      decoding="async"
                      onLoad={(e) => e.currentTarget.classList.add('loaded')}
                    />
                  </div>
                  <div className="prod-body">
                    <div className="prod-name serif">{p.name}</div>
                    <div className="prod-desc">{p.desc}</div>
                    <div className="prod-foot">
                      <div className="prod-price serif" aria-label={`Price: ₹${p.price}`}>₹{p.price}</div>
                      <button className="add-btn" onClick={(e) => { e.stopPropagation(); addToCart(p.name, p.price); }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="sec" id="combos">
        <div className="wrap">
          <div className="sec-head reveal">
            <h2 className="sec-title serif">Combo packs, for families who need more than one.</h2>
            <p className="sec-desc">Bundle categories and save — every combo ships together with one invoice.</p>
          </div>
          <div className="combo-scroller">
            {COMBOS.map((c, i) => (
              <div key={c.name} className={`combo-card reveal${c.pop ? ' pop' : ''}`}>
                {c.pop && <div className="combo-pop-tag">Most Loved</div>}
                <div className="combo-name serif">{c.name}</div>
                <div className="combo-includes">{c.includes}</div>
                <div className="combo-price-row">
                  <span className="combo-price serif" aria-label={`Combo price: ₹${c.price}`}>₹{c.price}</span>
                </div>
                <button className="add-btn" onClick={() => addToCart(c.name, c.price)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Add Combo
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec" id="about">
        <div className="wrap">
          <div className="about-grid">
            <div className="about-media reveal">
              <img src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&q=80&w=800" alt="NamoQR founding team at work in Rajkot" loading="lazy" decoding="async" />
            </div>
            <div className="reveal">
              <p className="eyebrow">Our Story</p>
              <p className="about-quote serif">"We built NamoQR after one too many notes under a windshield wiper. <em>Safety shouldn't cost you your privacy</em> — so we built a network where a scan can reach you without ever reaching your number."</p>
              <div className="about-attrib">
                <div className="about-attrib-photo">
                  <img src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80&w=200" alt="Founder" loading="lazy" decoding="async" />
                </div>
                <div><b>Divyang · Founder</b><span>Worthite Private Limited, Rajkot</span></div>
              </div>
              <p className="about-body">NamoQR started as a single vehicle sticker and grew into a full family-safety ecosystem — bikes, homes, luggage, keychains and school bags, all running on the same masked-calling and alert infrastructure. Every product ships with a GST invoice, is MSME-registered, and is designed in-house with a promise: no bystander, courier or stranger ever sees your real phone number.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="stats-bar reveal">
            <div className="stat">
              <div className="stat-num serif"><AnimatedCounter value="45K+" /></div>
              <div className="stat-label">Alerts Delivered</div>
            </div>
            <div className="stat">
              <div className="stat-num serif"><AnimatedCounter value="0" /></div>
              <div className="stat-label">Numbers Ever Shared</div>
            </div>
            <div className="stat">
              <div className="stat-num serif"><AnimatedCounter value="3+" /></div>
              <div className="stat-label">Year Sticker Life</div>
            </div>
            <div className="stat">
              <div className="stat-num serif"><AnimatedCounter value="100%" /></div>
              <div className="stat-label">Privacy Guaranteed</div>
            </div>
          </div>
        </div>
      </section>

      <section className="sec" id="faq">
        <div className="wrap">
          <div className="sec-head reveal">
            <h2 className="sec-title serif">Questions, answered.</h2>
          </div>
          <div className="faq-wrap reveal">
            {FAQ_DATA.map((item, i) => (
              <div key={i} className={`faq-item${openFaq === i ? ' open' : ''}`}>
                <button className="faq-q" onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                  {item.q}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
                <div className="faq-a">
                  <p>{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="cta-band reveal">
            <h3 className="serif">Your first sticker ships in 24 hours. Protect what matters, today.</h3>
            <a href="#products" className="btn btn-dark">Shop Now</a>
          </div>
        </div>
      </section>

      <section className="sec" id="distributor">
        <div className="wrap">
          <div className="distrib reveal">
            <div>
              <p className="eyebrow">Partner With Us</p>
              <h2 className="distrib-title serif">Bring NamoQR to your city, society or store.</h2>
              <p className="distrib-desc">We're onboarding distributors, housing society tie-ups, automobile dealerships and retail partners across India. Low minimum order, healthy margins, full marketing support.</p>
              <div className="distrib-points">
                <div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Territory-exclusive distributor pricing
                </div>
                <div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Co-branded marketing material provided
                </div>
                <div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Dedicated onboarding & dashboard training
                </div>
              </div>
            </div>
            <form className="distrib-form" id="distrib-form" onSubmit={handleDistributorSubmit}>
              <h4>Apply to Partner</h4>
              <div className="form-row"><label>Full Name</label><input type="text" placeholder="Your name" required /></div>
              <div className="form-row"><label>Business / City</label><input type="text" placeholder="e.g. Sharma Traders, Rajkot" required /></div>
              <div className="form-row"><label>Phone Number</label><input type="tel" placeholder="+91" required /></div>
              <div className="form-row">
                <label>Partner Type</label>
                <select required>
                  <option value="">Select one</option>
                  <option>City Distributor</option>
                  <option>Retail Store</option>
                  <option>Housing Society Tie-up</option>
                  <option>Automobile Dealership</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary">Submit Application</button>
            </form>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <div className="foot-grid">
            <div>
              <div className="foot-logo">
                <svg viewBox="0 0 32 32" fill="none">
                  <rect x="2" y="2" width="11" height="11" rx="3" stroke="#D9581F" strokeWidth="3" />
                  <rect x="19" y="2" width="11" height="11" rx="3" stroke="#D9581F" strokeWidth="3" />
                  <rect x="2" y="19" width="11" height="11" rx="3" stroke="#D9581F" strokeWidth="3" />
                  <rect x="19" y="19" width="5" height="5" rx="1" fill="#D9581F" />
                  <rect x="26" y="26" width="4" height="4" rx="1" fill="#D9581F" />
                  <rect x="19" y="26" width="4" height="4" rx="1" fill="#D9581F" />
                  <rect x="26" y="19" width="4" height="4" rx="1" fill="#D9581F" />
                </svg>
                Namo<span>QR</span>
              </div>
              <p className="foot-desc">A Worthite Private Limited venture, built in Rajkot, Gujarat. Family safety, one scan away.</p>
              <div className="foot-social" style={{ marginTop: '20px' }}>
                <a href="#"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.5-3.89 3.78-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z" /></svg></a>
                <a href="#"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.2c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85C2.38 3.9 3.9 2.38 7.15 2.27 8.42 2.21 8.8 2.2 12 2.2Zm0 5.35A4.45 4.45 0 1 0 12 16.5a4.45 4.45 0 0 0 0-8.9Zm0 7.34A2.9 2.9 0 1 1 12 9a2.9 2.9 0 0 1 0 5.8Zm4.63-7.51a1.04 1.04 0 1 1 0-2.08 1.04 1.04 0 0 1 0 2.08Z" /></svg></a>
                <a href="#"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3.5a17.4 17.4 0 0 1-2.9 1.15 4.13 4.13 0 0 0-7.15 3.75A11.7 11.7 0 0 1 2.9 4.4a4.12 4.12 0 0 0 1.28 5.5 4.06 4.06 0 0 1-1.87-.5v.05a4.13 4.13 0 0 0 3.3 4.05 4.1 4.1 0 0 1-1.86.07 4.13 4.13 0 0 0 3.86 2.87A8.3 8.3 0 0 1 2 18.13 11.7 11.7 0 0 0 8.29 20c7.55 0 11.68-6.26 11.68-11.69l-.01-.53A8.3 8.3 0 0 0 22 5.6a8.2 8.2 0 0 1-2.37.65A4.1 4.1 0 0 0 19 3.5Z" /></svg></a>
              </div>
            </div>
            <div className="foot-col">
              <h5>Shop</h5>
              <a href="#products"><Car size={16} /> Car Stickers</a>
              <a href="#products"><Bike size={16} /> Bike Stickers</a>
              <a href="#products"><Home size={16} /> Home Gate Tags</a>
              <a href="#products"><Package size={16} /> Combo Packs</a>
            </div>
            <div className="foot-col">
              <h5>Company</h5>
              <a href="#about">About Us</a>
              <a href="#distributor">Become a Partner</a>
              <a href="#faq">FAQs</a>
              <a href="#">Contact</a>
            </div>
            <div className="foot-col">
              <h5>Legal</h5>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Shipping & Returns</a>
              <a href="#">Refund Policy</a>
            </div>
          </div>
          <div className="foot-bottom">
            <p className="foot-legal">© 2026 Worthite Private Limited. NamoQR is a registered trademark application. GSTIN available on invoice.</p>
          </div>
        </div>
      </footer>

      <div className={`toast${toastShow ? ' show' : ''}`} id="toast">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span id="toast-text">{toastMsg}</span>
      </div>

      <div className={`qv-overlay${qvProduct ? ' show' : ''}`} id="qv-overlay" ref={qvOverlayRef} onClick={(e) => { if (e.target === qvOverlayRef.current) closeQuickView(); }}>
        {qvProduct && (
          <div className="qv-modal" id="qv-body-content">
            <button className="qv-close" onClick={closeQuickView}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <div className="qv-media"><img src={qvProduct.img.replace('w=700', 'w=900')} alt={qvProduct.name} /></div>
            <div className="qv-body">
              <span className="qv-chip">{qvProduct.chip}</span>
              <h3 className="qv-title serif">{qvProduct.name}</h3>
              <div className="qv-stars"><span>★★★★★</span> 4.8 · 2,400+ reviews</div>
              <p className="qv-desc">{qvProduct.desc}</p>
              <div className="qv-features">
                {qvProduct.features.map((f, i) => (
                  <div key={i}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    {f}
                  </div>
                ))}
              </div>
              <div className="qv-price-row">
                <span className="qv-price serif" aria-label={`Price: ₹${qvProduct.price}`}>₹{qvProduct.price}</span>
              </div>
              <div className="qv-qty-row">
                <div className="qv-stepper">
                  <button onClick={() => changeQvQty(-1)}>−</button>
                  <span id="qv-qty-display">{qvQty}</span>
                  <button onClick={() => changeQvQty(1)}>+</button>
                </div>
                <button className="btn btn-primary qv-add-btn" onClick={addQvToCart}>Add to Cart</button>
              </div>
              <div className="qv-ship-note">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 4 6v6c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V6l-8-4Z"></path></svg>
                Ships in 24 hrs · Secure checkout · GST invoice included
              </div>
            </div>
          </div>
        )}
      </div>

    </>
  );
}

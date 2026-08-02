import React, { useState, useEffect, useCallback, useRef } from 'react';
import './landing.css';
import {
  ShieldAlert, ShieldCheck, Car, Home, Luggage,
  CheckCircle2, ArrowRight, ShoppingBag, X, Plus, Minus,
  Smartphone, HeartPulse, Bell, ChevronDown, Check,
  MapPin, Phone, MessageSquare, AlertTriangle, Lock,
  Key, Star, RotateCcw, Eye, Navigation, Zap, Users,
  Menu, Signal, Package, LogOut, LayoutDashboard, Store
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { 
  saveDistributorApplication, 
  getUserDistributorApplication, 
  DistributorApplication 
} from '../../lib/distributorService';
import groupLogo from '../../../assets/Group 1000005716.png';
import groupLogo1 from '../../../assets/Group 1000005716-1.png';
import groupLogo2 from '../../../assets/Group 1000005716-2.png';
import logoForWhBg from '../../../assets/logo for wh bg.png';

// ── Animated Counter Component ─────────────────────────────────────────────

function AnimatedCounter({ end, prefix = '', suffix = '', duration = 1800 }: { end: number; prefix?: string; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;
    let startTime: number | null = null;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeProgress * end));

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }, [hasStarted, end, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

// ── Real SVG QR Code Component ──────────────────────────────────────────────

function RealQRCode({ size = 120, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="100" height="100" fill="white" rx="6" />

      {/* Top-Left Finder */}
      <rect x="8" y="8" width="28" height="28" fill="#0E1117" rx="4" />
      <rect x="14" y="14" width="16" height="16" fill="white" rx="2" />
      <rect x="18" y="18" width="8" height="8" fill="#0E1117" rx="1.5" />

      {/* Top-Right Finder */}
      <rect x="64" y="8" width="28" height="28" fill="#0E1117" rx="4" />
      <rect x="70" y="14" width="16" height="16" fill="white" rx="2" />
      <rect x="74" y="18" width="8" height="8" fill="#0E1117" rx="1.5" />

      {/* Bottom-Left Finder */}
      <rect x="8" y="64" width="28" height="28" fill="#0E1117" rx="4" />
      <rect x="14" y="70" width="16" height="16" fill="white" rx="2" />
      <rect x="18" y="74" width="8" height="8" fill="#0E1117" rx="1.5" />

      {/* Alignment Box */}
      <rect x="68" y="68" width="16" height="16" fill="#0E1117" rx="2" />
      <rect x="72" y="72" width="8" height="8" fill="white" rx="1" />
      <rect x="74" y="74" width="4" height="4" fill="#0E1117" rx="0.5" />

      {/* Real Data Matrix Pattern */}
      <rect x="42" y="10" width="6" height="6" fill="#0E1117" rx="1" />
      <rect x="52" y="10" width="6" height="6" fill="#0E1117" rx="1" />
      <rect x="42" y="20" width="6" height="6" fill="#0E1117" rx="1" />
      <rect x="48" y="26" width="6" height="6" fill="#0E1117" rx="1" />
      <rect x="10" y="42" width="6" height="6" fill="#0E1117" rx="1" />
      <rect x="20" y="42" width="6" height="6" fill="#0E1117" rx="1" />
      <rect x="26" y="48" width="6" height="6" fill="#0E1117" rx="1" />
      <rect x="42" y="42" width="16" height="16" fill="#0E1117" rx="3" />
      <rect x="64" y="42" width="6" height="6" fill="#0E1117" rx="1" />
      <rect x="76" y="42" width="6" height="6" fill="#0E1117" rx="1" />
      <rect x="84" y="48" width="6" height="6" fill="#0E1117" rx="1" />
      <rect x="42" y="64" width="6" height="6" fill="#0E1117" rx="1" />
      <rect x="52" y="70" width="6" height="6" fill="#0E1117" rx="1" />
      <rect x="42" y="80" width="6" height="6" fill="#0E1117" rx="1" />
      <rect x="52" y="84" width="6" height="6" fill="#0E1117" rx="1" />
      <rect x="84" y="18" width="6" height="6" fill="#0E1117" rx="1" />
      <rect x="88" y="28" width="6" height="6" fill="#0E1117" rx="1" />
    </svg>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  name: string;
  desc: string;
  price: number;
  mrp: number;
  category: 'Vehicle' | 'Home' | 'Family' | 'Travel';
  chip: string;
  badge: string;
  rating: number;
  reviewsCount: number;
  img: string;
  features: string[];
}

interface CartItem { product: Product; qty: number; }

// ── Data ───────────────────────────────────────────────────────────────────

const PRODUCTS: Product[] = [
  {
    id: 'car-qr', name: 'Automobile Safety Tag', category: 'Vehicle', chip: 'Vehicle',
    badge: 'Best Seller', rating: 4.9, reviewsCount: 3420,
    price: 349, mrp: 499,
    img: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&q=80&w=800',
    desc: 'Wrong-parking alerts, vehicle-blocking pings, and crash SOS — all without giving your number to anyone.',
    features: ['Wrong parking & obstruction alerts', 'Masked call routing — number never shown', 'Crash SOS at 40G deceleration', 'Weatherproof 3M polycarbonate, 3+ years'],
  },
  {
    id: 'bike-qr', name: 'Motorcycle & Helmet Tag', category: 'Vehicle', chip: 'Vehicle',
    badge: 'Popular', rating: 4.8, reviewsCount: 2150,
    price: 249, mrp: 399,
    img: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=800',
    desc: 'Anti-tamper movement alerts, first-responder medical access, and insurance reminders for riders.',
    features: ['Emergency hotline for first responders', 'Blood group & allergy medical card', 'Insurance & PUC service reminders', 'Scratch-resistant, fits helmet or tank'],
  },
  {
    id: 'home-qr', name: 'Residential Gate Tag', category: 'Home', chip: 'Home',
    badge: 'Smart Home', rating: 4.9, reviewsCount: 1890,
    price: 349, mrp: 499,
    img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800',
    desc: 'Courier drop-off pings, visitor check-in, and hazard reports — without publishing your number at your gate.',
    features: ['Courier drop-off WhatsApp pings', 'Visitor check-in without number exposure', 'Hazard & pipe leak reporting by neighbours', 'Heavy-duty weatherproof acrylic mount'],
  },
  {
    id: 'child-qr', name: "Pediatric School Bag Tag", category: 'Family', chip: 'Family',
    badge: "Kids Safety", rating: 5.0, reviewsCount: 1420,
    price: 249, mrp: 349,
    img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=800',
    desc: 'Emergency medical card, blood group, allergy info, and masked parent hotline — for when a stranger finds your child.',
    features: ['Blood group & allergy directives visible to finder', 'School bus pickup & drop-off alerts', 'Encrypted guardian contact for school staff', 'Child-safe non-toxic TPU clip'],
  },
  {
    id: 'senior-qr', name: 'Senior Medical Keychain', category: 'Family', chip: 'Family',
    badge: 'Senior Care', rating: 4.9, reviewsCount: 1650,
    price: 249, mrp: 349,
    img: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&q=80&w=800',
    desc: 'Vital health record access and one-tap guardian alert — essential for elderly family members out alone.',
    features: ['Medical notes & doctor contacts for responders', 'Masked phone proxy connects finder to family', 'Designed for elderly parents on walks or travel', 'Ultra-light anodised aircraft aluminium case'],
  },
  {
    id: 'luggage-qr', name: 'Smart Luggage Tag', category: 'Travel', chip: 'Travel',
    badge: 'Travel Essential', rating: 4.8, reviewsCount: 980,
    price: 249, mrp: 349,
    img: 'https://images.unsplash.com/photo-1553531384-cc64ac80f931?auto=format&fit=crop&q=80&w=800',
    desc: 'Instant scan-notification with GPS pin to your phone — and anonymous finder messaging, no address exposed.',
    features: ['Anonymous finder messaging — no address shown', 'Instant SMS & WhatsApp scan notification', 'Works across airlines, transit hubs, globally', 'Braided stainless steel cable included'],
  },
];

const COMBOS = [
  {
    id: 'starter', name: 'Starter', tag: '', popular: false,
    price: 349, mrp: 499,
    desc: 'One sticker, lifetime protection. Ideal for a single vehicle, gate, or bag.',
    items: ['1 sticker of your choice', 'Lifetime platform access', 'Unlimited scan events', 'SMS + push notifications'],
    cta: 'Get My Sticker',
  },
  {
    id: 'family', name: 'Family Bundle', tag: 'Most Popular', popular: true,
    price: 899, mrp: 1097,
    desc: 'Cover a car, your home gate, and a child — the most common family setup.',
    items: ['Automobile Safety Tag', 'Residential Gate Tag', 'Pediatric School Bag Tag', 'Opt-in medical profiles', 'Multi-sticker dashboard'],
    cta: 'Protect My Family',
  },
  {
    id: 'fleet', name: 'Society / Fleet', tag: 'Custom Quote', popular: false,
    price: 0, mrp: 0,
    desc: 'Housing societies and small fleets. Bulk pricing, central dashboard, priority support.',
    items: ['10+ stickers, custom quantity', 'Society admin dashboard', 'Gate + vehicle management', 'Dedicated onboarding call', 'Priority support SLA'],
    cta: 'Talk to Us',
  },
];

const FAQ_ITEMS = [
  {
    q: 'Does the scanner need to download an app?',
    a: 'No. Anyone who scans a RapiQR sticker lands on a secure web page that works in any phone browser — no app, no sign-in, no friction.',
  },
  {
    q: 'Will the scanner ever see my real phone number?',
    a: 'Never. All calls go through an encrypted proxy number and all messages route through our platform. Your actual number is never transmitted or stored on the scan page.',
  },
  {
    q: 'What if my sticker is lost or damaged?',
    a: "Every sticker has a permanent ID. If it's lost or damaged, log into your dashboard, mark it inactive, and instantly reprint an identical replacement — same ID, same settings, no new purchase needed.",
  },
  {
    q: 'Is my medical or family data ever shown to anyone?',
    a: "Only the data you choose to enable — and only on tags where it makes sense. Medical info (blood group, allergies, SOS contacts) is strictly opt-in, and you control exactly what appears to a scanner on each individual sticker.",
  },
  {
    q: 'Is there a subscription or renewal fee?',
    a: 'No. You pay once for the physical sticker. The platform access, alerts, and masked calling are included for the lifetime of that sticker — no monthly fee, no annual renewal.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Rajesh M.', role: 'Car Owner, Pune',
    quote: "A traffic officer scanned my tag when I was double-parked. I got an alert and moved my car in 4 minutes. He never saw my number. This is exactly what I needed.",
    stars: 5,
    avatar: 'RM',
  },
  {
    name: 'Priya S.', role: 'Parent of two, Bengaluru',
    quote: "My son's school bag has the tag. When he was on the wrong bus, his teacher scanned it and messaged me instantly — without me having published my number to 30 strangers.",
    stars: 5,
    avatar: 'PS',
  },
  {
    name: 'Arun T.', role: 'Frequent traveller, Mumbai',
    quote: "Lost my bag at Hyderabad airport. Got a scan notification with GPS in under a minute. The airline staff found it three hours later. First time in 11 years I got a bag back.",
    stars: 5,
    avatar: 'AT',
  },
  {
    name: 'Kavitha R.', role: 'Housing Society Secretary, Chennai',
    quote: "We put gate tags on our entrance pillars. Now couriers ping residents instead of buzzing the intercom all day. Complaints dropped immediately. Residents love it.",
    stars: 5,
    avatar: 'KR',
  },
];

const MEDIA_LOGOS = ['TOI Auto', 'Autocar India', 'TechCrunch India', 'Road Safety.in', 'Express Health', 'Mobility Digest', 'Safety First', 'Auto Journal'];

const CATEGORIES = [
  {
    id: 'vehicles',
    label: 'Vehicles',
    icon: Car,
    headline: 'Visible to strangers. Your number doesn\'t have to be.',
    lines: [
      'Parking alert? Get it in seconds — no windshield note.',
      'Crash SOS connects responders to family, not voicemail.',
      'Blocked driveway? WhatsApp alert before it turns ugly.',
    ],
    img: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'home',
    label: 'Home Gate',
    icon: Home,
    headline: 'Let people reach you. Keep your number off the gate.',
    lines: [
      'Courier arrives? They scan and ping you instantly.',
      'Visitors check in. You decide if you open the gate.',
      'Neighbour spots a leak? Alert hits your phone in 3 sec.',
    ],
    img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'luggage',
    label: 'Luggage',
    icon: Luggage,
    headline: 'Lost bag. Found. Returned. No address on the label.',
    lines: [
      'Finder scans → messages you. Your address stays private.',
      'You get a GPS pin of where the scan happened.',
      'Airport, hotel, train station. No app for the finder.',
    ],
    img: 'https://images.unsplash.com/photo-1553531384-cc64ac80f931?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'keychains',
    label: 'Keychains',
    icon: Key,
    headline: 'Found keys. Two-minute return. No stress.',
    lines: [
      'Finder scans, shares location, you arrange pickup.',
      'Medical ID for seniors: blood group & contacts — opt-in.',
      'Weatherproof. Clips to keys, bag straps, walking aids.',
    ],
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'family',
    label: 'Family',
    icon: Users,
    headline: 'Safety net for kids, seniors, and pets. No phone needed.',
    lines: [
      'School bag tag → teacher messages you instantly.',
      'Senior keychain shows blood group in an emergency.',
      'Pet found? Finder calls you via masked number. Done.',
    ],
    img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=800',
  },
];


const FEATURES = [
  { icon: Eye, title: 'Zero number exposure', body: 'Your real number is never shown. Not stored. Not transmitted. Ever.' },
  { icon: Navigation, title: 'Live GPS sharing', body: 'Scanners share their exact location in one tap.' },
  { icon: Bell, title: 'Multi-channel alerts', body: 'Push + SMS + WhatsApp. All at once.' },
  { icon: Smartphone, title: 'No app for scanners', body: 'Camera → page. No download. No login.' },
  { icon: AlertTriangle, title: '13 emergency types', body: 'Parking, crash, fire, medical, lost child, and more.' },
  { icon: Lock, title: 'Encrypted & access-controlled', body: 'Each sticker has rules. Only the right people see the right info.' },
  { icon: HeartPulse, title: 'Opt-in medical profile', body: 'Blood group, allergies, SOS contacts — only on tags you choose.' },
  { icon: RotateCcw, title: 'Instant sticker restore', body: 'Lost sticker? Reprint. Same ID. Same settings. Zero cost.' },
];

// Demo phone steps
const DEMO_STEPS = [
  {
    id: 'scan',
    label: 'Scan',
    heading: 'RapiQR Safe',
    subhead: 'Car Tag — KA-01-MJ-9921',
    content: 'scan',
  },
  {
    id: 'contact',
    label: 'Contact',
    heading: 'Reach the owner',
    subhead: 'Choose how to connect',
    content: 'contact',
  },
  {
    id: 'gps',
    label: 'Share GPS',
    heading: 'Your location sent',
    subhead: 'Owner has been notified',
    content: 'gps',
  },
  {
    id: 'emergency',
    label: 'Emergency',
    heading: 'Emergency Alert',
    subhead: 'Select alert type',
    content: 'emergency',
  },
];

// ── Main Component ─────────────────────────────────────────────────────────

export default function LandingPageMaster({
  onStart,
  onLogin,
  onOpenDistributorDashboard,
  onOpenCheckout,
}: {
  onStart: () => void;
  onLogin: () => void;
  onOpenDistributorDashboard?: () => void;
  onOpenCheckout?: () => void;
}) {
  const { isLoggedIn, isAdmin, profile, signOut } = useAuth();
  const [activeCategory, setActiveCategory] = useState<'All' | 'Vehicle' | 'Home' | 'Family' | 'Travel'>('All');
  // Cart persisted to localStorage so added products survive navigation & refresh
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('namoqr-cart');
      return saved ? (JSON.parse(saved) as CartItem[]) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartToast, setCartToast] = useState<{ product: Product; qty: number; ts: number; mode: 'added' | 'updated' } | null>(null);

  // Save cart whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('namoqr-cart', JSON.stringify(cart));
    } catch { /* ignore */ }
  }, [cart]);
  const [quickView, setQuickView] = useState<Product | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const lastScrollY = useRef(0);
  const [activeCat, setActiveCat] = useState(0);
  const [demoStep, setDemoStep] = useState(0);
  const [demoAlert, setDemoAlert] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [partnerForm, setPartnerForm] = useState({ name: '', phone: '', city: '', business: 'Auto Accessories Shop', tier: 'Retail Kit (50 Units)' });
  const [partnerSubmitted, setPartnerSubmitted] = useState(false);
  const [userAppStatus, setUserAppStatus] = useState<DistributorApplication | null>(null);

  // Sync user's distributor application status
  useEffect(() => {
    if (isLoggedIn && (profile?.email || profile?.phone)) {
      getUserDistributorApplication(profile?.email || profile?.phone || '').then(setUserAppStatus);
    } else {
      setUserAppStatus(null);
    }
  }, [isLoggedIn, profile, isPartnerModalOpen]);

  // Handle auto-opening distributor modal after user logs in
  useEffect(() => {
    if (isLoggedIn) {
      const pendingIntent = localStorage.getItem('namoqr-pending-distributor-intent');
      if (pendingIntent) {
        try {
          const parsed = JSON.parse(pendingIntent);
          if (parsed?.tier) {
            setPartnerForm(prev => ({ ...prev, tier: parsed.tier }));
          }
        } catch {}
        localStorage.removeItem('namoqr-pending-distributor-intent');
        setIsPartnerModalOpen(true);
      }
    }
  }, [isLoggedIn]);

  // Handler for Partner Program button clicks
  const handleOpenPartnerModal = (tier?: string) => {
    if (tier) {
      setPartnerForm(prev => ({ ...prev, tier }));
    }

    if (!isLoggedIn) {
      // User must log in first before applying
      localStorage.setItem('namoqr-pending-distributor-intent', JSON.stringify({ tier: tier || partnerForm.tier }));
      onLogin();
      return;
    }

    if (profile) {
      setPartnerForm(prev => ({
        ...prev,
        name: prev.name || profile.fullName || '',
      }));
    }
    setIsPartnerModalOpen(true);
  };

  // Submit handler for partner application
  const handlePartnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      localStorage.setItem('namoqr-pending-distributor-intent', JSON.stringify({ tier: partnerForm.tier }));
      onLogin();
      return;
    }

    const app = await saveDistributorApplication({
      userId: profile?.id,
      userName: partnerForm.name,
      userEmail: profile?.email || partnerForm.phone,
      phone: partnerForm.phone,
      city: partnerForm.city,
      business: partnerForm.business,
      tier: partnerForm.tier,
    });

    if (!app) return; // submission failed — leave the form open rather than claiming success
    setUserAppStatus(app);
    setPartnerSubmitted(true);
  };

  const filteredProducts = activeCategory === 'All'
    ? PRODUCTS
    : PRODUCTS.filter(p => p.category === activeCategory);

  const cartItemCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartSubtotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0);

  const addToCart = useCallback((product: Product, qty = 1) => {
    let mode: 'added' | 'updated' = 'added';
    let newQty = qty;
    setCart(prev => {
      const ex = prev.find(i => i.product.id === product.id);
      if (ex) {
        mode = 'updated';
        newQty = ex.qty + qty;
        return prev.map(i => i.product.id === product.id ? { ...i, qty: i.qty + qty } : i);
      }
      return [...prev, { product, qty }];
    });
    // Show a bottom-right confirmation popup instead of opening the sidebar drawer
    setCartToast({ product, qty: newQty, ts: Date.now(), mode });
  }, []);

  // Auto-dismiss the cart popup after a short delay
  useEffect(() => {
    if (!cartToast) return;
    const t = setTimeout(() => setCartToast(null), 3200);
    return () => clearTimeout(t);
  }, [cartToast]);

  // Navigate to the dedicated checkout page (separate route, not a popup)
  const openCheckout = () => {
    setCartToast(null);
    setIsCartOpen(false);
    if (onOpenCheckout) {
      onOpenCheckout();
    } else {
      onStart();
    }
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev =>
      prev.map(i => i.product.id === id ? { ...i, qty: i.qty + delta } : i)
        .filter(i => i.qty > 0)
    );
  };

  // Scroll observe reveal
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('is-visible'); });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
    const onScroll = () => {
      const y = window.scrollY;
      setIsScrolled(y > 40);
      setNavHidden(y > 80 && y > lastScrollY.current);
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { obs.disconnect(); window.removeEventListener('scroll', onScroll); };
  }, []);

  // Auto-advance demo every 3.5s if no interaction
  useEffect(() => {
    const t = setTimeout(() => setDemoStep(s => (s + 1) % DEMO_STEPS.length), 3500);
    return () => clearTimeout(t);
  }, [demoStep]);

  const handleDemoAction = (step: number) => {
    if (step === 1) setDemoAlert('📱 Parking alert dispatched. Owner notified via WhatsApp + SMS.');
    if (step === 2) setDemoAlert('📍 Your GPS location has been shared with the owner.');
    if (step === 3) setDemoAlert('🚨 Emergency alert raised. Owner + guardians notified instantly.');
    setDemoStep((step + 1) % DEMO_STEPS.length);
  };

  return (
    <div className="namo-landing">

      {/* ── NAV ─────────────────────────────────────────────────────── */}
      <nav className={`namo-nav${isScrolled ? ' scrolled' : ''}${navHidden ? ' nav-hidden' : ''}`}>
        <div className="namo-wrap flex items-center justify-between gap-6">

          {/* Logo - Text Only */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center flex-shrink-0 cursor-pointer py-1"
            aria-label="RapiQR home"
          >
            <img src={groupLogo1} alt="RapiQR Logo" className="h-6.5 sm:h-8 w-auto object-contain max-h-8" />
          </button>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-7">
            <a href="#how-it-works" className="nav-link">How It Works</a>
            <a href="#categories" className="nav-link">Use Cases</a>
            <a href="#pricing" className="nav-link">Pricing</a>
            <a href="#distributorship" className="nav-link">Partner Program</a>
            <a href="#faq" className="nav-link">FAQ</a>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(o => !o)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold transition-all cursor-pointer"
                  style={{ background: 'var(--brand)' }}
                >
                  {profile?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                </button>
                {isProfileOpen && (
                  <>
                    <div className="fixed inset-0" style={{ zIndex: 250 }} onClick={() => setIsProfileOpen(false)} />
                    <div
                      className="absolute right-0 top-full mt-2 w-56 rounded-xl shadow-lg overflow-hidden"
                      style={{ background: 'var(--paper-white)', border: '1px solid var(--border)', zIndex: 260 }}
                    >
                      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                        <p className="text-sm font-bold" style={{ color: 'var(--ink)' }}>{profile?.fullName || 'User'}</p>
                        <p className="text-xs" style={{ color: 'var(--ink-soft)' }}>{profile?.email || ''}</p>
                      </div>
                      <button
                        onClick={() => { setIsProfileOpen(false); onStart(); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-black/5"
                        style={{ color: 'var(--ink)' }}
                      >
                        <LayoutDashboard size={15} />
                        My Dashboard
                      </button>
                      <button
                        onClick={async () => { setIsProfileOpen(false); await signOut(); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-red-50"
                        style={{ color: '#DC2626' }}
                      >
                        <LogOut size={15} />
                        Log Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button onClick={onLogin} className="hidden sm:block nav-link" style={{ fontSize: 13 }}>
                Log in
              </button>
            )}
            <button onClick={onStart} className="btn-cta hidden sm:inline-flex" style={{ padding: '10px 22px', fontSize: 13 }}>
              {isLoggedIn ? <><LayoutDashboard size={14} /> My Dashboard</> : <>Get My Sticker <ArrowRight size={14} /></>}
            </button>
            <button
              className="md:hidden p-2 rounded-lg"
              style={{ background: 'var(--paper-white)', border: '1px solid var(--border)' }}
              onClick={() => setMobileMenuOpen(o => !o)}
              aria-label="Menu"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden px-4 pb-4 pt-2 flex flex-col gap-3 border-t mt-2" style={{ borderColor: 'var(--border)' }}>
            <a href="#how-it-works" className="nav-link py-1" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
            <a href="#categories" className="nav-link py-1" onClick={() => setMobileMenuOpen(false)}>Use Cases</a>
            <a href="#pricing" className="nav-link py-1" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <a href="#distributorship" className="nav-link py-1" onClick={() => setMobileMenuOpen(false)}>Partner Program</a>
            <a href="#faq" className="nav-link py-1" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
            {isLoggedIn ? (
              <>
                <div className="flex items-center gap-2 py-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ background: 'var(--brand)' }}
                  >
                    {profile?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--ink)' }}>{profile?.fullName || 'User'}</p>
                    <p className="text-xs" style={{ color: 'var(--ink-soft)' }}>{profile?.email || ''}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setMobileMenuOpen(false); onStart(); }}
                  className="btn-ghost mt-1 flex items-center gap-2 justify-center"
                >
                  <LayoutDashboard size={15} /> My Dashboard
                </button>
                <button
                  onClick={async () => { setMobileMenuOpen(false); await signOut(); }}
                  className="flex items-center gap-2 justify-center py-2 text-sm font-medium rounded-lg transition-colors hover:bg-red-50"
                  style={{ color: '#DC2626' }}
                >
                  <LogOut size={15} /> Log Out
                </button>
              </>
            ) : (
              <button onClick={() => { setMobileMenuOpen(false); onStart(); }} className="btn-cta mt-1">
                Get My Sticker <ArrowRight size={14} />
              </button>
            )}
          </div>
        )}
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section className="hero-section relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0E1117 0%, #1A3A5C 100%)' }}>
        {/* QR dot grid background */}
        <div
          className="qr-dot-bg absolute inset-0 pointer-events-none"
          aria-hidden="true"
        />

        <div className="namo-wrap relative" style={{ zIndex: 10 }}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center pb-12">

            {/* Left Column: Plus Jakarta Sans Headline & CTAs */}
            <div className="lg:col-span-6 text-left">
              <div className="reveal">
                <span className="hero-eyebrow">
                  <Signal size={12} />
                  Smart Safety Sticker
                </span>
              </div>

              <h1 className="display-title text-5xl sm:text-6xl lg:text-6xl reveal delay-1 mb-6" style={{ color: '#FFFFFF' }}>
                India's #1st 
                <br />
                <span style={{ color: 'var(--accent)' }}>Emergency Platform</span>
              </h1>

              <p className="reveal delay-2 text-base sm:text-lg leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.7)', maxWidth: 480 }}>
                Instant QR safety for your family, vehicles & home. No app needed. Zero subscription.
              </p>

              <div className="reveal delay-3 flex flex-wrap items-center gap-3 mb-8">
                <button onClick={onStart} className="btn-cta">
                  Get My Sticker <ArrowRight size={16} />
                </button>
                <a href="#demo" className="btn-ghost" style={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.2)' }}>
                  See It In Action
                </a>
              </div>

              <div className="reveal delay-4 flex items-center gap-4 text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>
                <div className="flex -space-x-2">
                  {['RM', 'PS', 'KR', 'AM'].map((av, i) => (
                    <div key={i} className="w-7 h-7 rounded-full text-white text-[10px] font-bold flex items-center justify-center border-2 border-white" style={{ background: 'var(--brand)' }}>
                      {av}
                    </div>
                  ))}
                </div>
                <span>Trusted by 10,000+ vehicle & home owners</span>
              </div>
            </div>

            {/* Right Column: Real Physical Sticker + Real Phone Scan View Mockup */}
            <div className="lg:col-span-6 reveal delay-2">
              <div className="relative flex items-center justify-center py-4">

                {/* Physical Product Sticker Mockup (Left back - Auto Floating) */}
                <div className="relative z-10 w-56 sm:w-64 bg-white p-5 rounded-3xl shadow-2xl border border-gray-200 animate-float-tag">
                  <div className="flex items-center justify-between mb-3 border-b pb-2 border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <ShieldAlert size={16} style={{ color: 'var(--accent)' }} />
                      <div className="text-xs font-extrabold text-gray-900 tracking-wider uppercase">RapiQR Safe Tag</div>
                    </div>
                  </div>

                  {/* Real SVG QR Sticker Graphic */}
                  <div className="bg-gray-950 p-4 rounded-2xl text-center relative overflow-hidden group">
                    <div className="hero-scan-beam" />
                    <RealQRCode size={128} className="mx-auto rounded-xl p-2 shadow-inner bg-white" />
                    <div className="mt-3 text-[10px] font-black text-white tracking-widest uppercase">
                      SAFETY STICKER
                    </div>
                    <div className="text-[9px] text-gray-400 font-mono">KA-01-MJ-9921</div>
                  </div>

                  <div className="text-[10px] text-gray-500 text-center mt-2.5 font-semibold">
                    Outdoor Weatherproof Tag
                  </div>
                </div>

                {/* Real Phone Scan View Screen Mockup (Right front overlap - Auto Floating) */}
                <div className="relative z-20 w-64 sm:w-72 bg-gray-950 p-3 rounded-[38px] shadow-2xl border-4 border-gray-800 -ml-14 sm:-ml-16 mt-10 animate-float-phone">
                  {/* Phone Notch */}
                  <div className="w-20 h-4 bg-gray-950 rounded-b-xl mx-auto absolute top-3 left-1/2 -translate-x-1/2 z-30" />

                  {/* Phone Screen UI */}
                  <div className="bg-[#0E1117] text-white p-4 pt-7 rounded-[30px] border border-gray-800 text-left space-y-2.5">
                    <div className="text-[10px] text-gray-400 text-center font-medium">
                      📷 Real Scanner Browser View
                    </div>

                    <div className="p-3 rounded-2xl bg-gray-900/90 border border-gray-800 space-y-1">
                      <div className="text-xs font-bold text-white flex items-center justify-between">
                        <span>Car KA-01-MJ-9921</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      </div>
                      <div className="text-[10px] text-gray-400">Owner Registered · Private Mode</div>
                    </div>

                    {/* Action Buttons */}
                    <button className="w-full py-2.5 px-3 rounded-xl bg-amber-500 text-gray-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md">
                      <Phone size={13} /> Call Owner (Private Proxy)
                    </button>

                    <button className="w-full py-2 px-3 rounded-xl bg-gray-800 text-white font-semibold text-[11px] flex items-center justify-center gap-2">
                      <MessageSquare size={12} /> Send Message
                    </button>

                    <button className="w-full py-2 px-3 rounded-xl bg-gray-800 text-amber-400 font-semibold text-[11px] flex items-center justify-center gap-2">
                      <MapPin size={12} /> Share GPS Location
                    </button>

                    <button className="w-full py-2 px-3 rounded-xl bg-red-600 text-white font-bold text-[11px] flex items-center justify-center gap-2">
                      <AlertTriangle size={12} /> Emergency SOS
                    </button>
                  </div>
                </div>

                {/* Floating Speed Badge */}
                <div className="hidden sm:flex items-center gap-2 absolute -bottom-2 right-0 bg-white px-3.5 py-2 rounded-xl shadow-xl border border-gray-100 z-30 animate-bounce-slow">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <span className="text-xs font-extrabold text-gray-900">⚡ Alert Speed &lt;1.8s</span>
                </div>

              </div>
            </div>

          </div>

          {/* Floating Command Bar Stats Dock — Ultra High End UX */}
          <div className="reveal delay-4 pt-10 pb-2 mt-8">
            <div className="max-w-5xl mx-auto bg-[#0E1117] text-white rounded-3xl p-4 sm:p-6 shadow-2xl border border-gray-800/80 relative overflow-hidden">

              {/* Ambient Glow Backlight */}
              <div className="absolute -top-24 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">

                {/* Pill 1: 10,000+ Families */}
                <div className="flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all duration-300 group cursor-default">
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-110 transition-transform">
                    🛡️
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-2xl sm:text-3xl font-black text-white tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        <AnimatedCounter end={10000} suffix="+" />
                      </span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <div className="text-[11px] font-semibold text-gray-400 tracking-wide uppercase mt-0.5">
                      Families protected
                    </div>
                  </div>
                </div>

                {/* Pill 2: <3 sec Alert Speed */}
                <div className="flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all duration-300 group cursor-default">
                  <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-110 transition-transform">
                    ⚡
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-black text-[#FF4D4D] tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      <AnimatedCounter prefix="<" end={3} suffix=" sec" />
                    </div>
                    <div className="text-[11px] font-semibold text-gray-400 tracking-wide uppercase mt-0.5">
                      Alert delivery
                    </div>
                  </div>
                </div>

                {/* Pill 3: 13 Emergency Types */}
                <div className="flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all duration-300 group cursor-default">
                  <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-110 transition-transform">
                    🚨
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-black text-sky-300 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      <AnimatedCounter end={13} />
                    </div>
                    <div className="text-[11px] font-semibold text-gray-400 tracking-wide uppercase mt-0.5">
                      Emergency types
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRODUCTS ────────────────────────────────────────────────── */}
      <section id="products" className="products-section" aria-labelledby="products-heading">
        <div className="namo-wrap">
          <div className="text-center mb-12 reveal">
            <div className="section-divider justify-center">
              <span className="section-label">Safety tags</span>
            </div>
            <h2 id="products-heading" className="display-title text-4xl sm:text-5xl mt-4" style={{ color: 'var(--ink)' }}>
              One QR. Lifetime protection.
            </h2>
            <p className="mt-4 text-sm" style={{ color: 'var(--ink-soft)', maxWidth: 360, margin: '12px auto 0' }}>
              Buy once. Stick it. Done.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap justify-center gap-3 mb-10 reveal delay-1" style={{ overflowX: 'auto' }}>
            {(['All', 'Vehicle', 'Home', 'Family', 'Travel'] as const).map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`filter-chip${activeCategory === cat ? ' active' : ''}`}>
                {cat === 'All' ? 'All Products' : cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {filteredProducts.map((product, pi) => (
              <div key={product.id} className={`prod-card reveal delay-${(pi % 3) + 1}`}>
                <div style={{ padding: '20px 20px 0' }}>
                  <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', marginBottom: 18 }}>
                    <img
                      src={product.img}
                      alt={product.name}
                      className="w-full object-cover"
                      style={{ height: 200 }}
                      loading="lazy"
                    />
                    <span style={{
                      position: 'absolute', top: 12, left: 12,
                      background: 'var(--brand)', color: 'white',
                      fontSize: 10, fontWeight: 800, padding: '4px 12px',
                      borderRadius: 99, textTransform: 'uppercase',
                    }}>{product.badge}</span>
                    <button
                      onClick={() => setQuickView(product)}
                      aria-label={`Quick view ${product.name}`}
                      style={{
                        position: 'absolute', bottom: 12, right: 12,
                        background: 'rgba(255,255,255,0.92)', border: 'none',
                        borderRadius: '50%', width: 34, height: 34, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(14,17,23,0.14)',
                        transition: 'transform 0.2s ease',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
                      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                      <Eye size={15} style={{ color: 'var(--ink)' }} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', items: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: 'var(--accent-deep)' }}>
                      <Star size={13} style={{ fill: 'var(--accent)', color: 'var(--accent)' }} />
                      {product.rating} <span style={{ color: 'var(--ink-faint)', fontWeight: 400 }}>({product.reviewsCount.toLocaleString()})</span>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--ink-faint)', textDecoration: 'line-through' }}>₹{product.mrp}</span>
                  </div>

                  <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>{product.name}</h3>
                  <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.6, marginBottom: 16 }}>{product.desc}</p>

                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, marginBottom: 0 }}>
                    {product.features.map((f, fi) => (
                      <li key={fi} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: 'var(--ink-soft)', marginBottom: 7 }}>
                        <CheckCircle2 size={14} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Card footer */}
                <div style={{
                  marginTop: 'auto', padding: '16px 20px 20px',
                  borderTop: '1px solid var(--border)',
                  display: 'flex', items: 'center', justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--ink)', lineHeight: 1 }}>₹{product.price}</div>
                    <div style={{ fontSize: 10, color: '#10B981', fontWeight: 700, marginTop: 2 }}>Lifetime · ₹0 subscription</div>
                  </div>
                  <button onClick={() => addToCart(product)} className="btn-brand" style={{ padding: '10px 18px', fontSize: 13 }}>
                    <Plus size={14} /> Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────── */}
      <section id="how-it-works" className="hiw-section" aria-labelledby="hiw-heading">
        <div className="namo-wrap max-w-3xl">
          <div className="text-center mb-16 reveal">
            <div className="section-divider justify-center">
              <span className="section-label">How it works</span>
            </div>
            <h2 id="hiw-heading" className="display-title text-4xl sm:text-5xl mt-4" style={{ color: 'var(--ink)' }}>
              Five steps. Done.
            </h2>
          </div>

          <div className="space-y-10">
            {[
              { title: 'Order your sticker', body: 'Pick a type — vehicle, gate, bag, keychain. Ships in 2–3 days.' },
              { title: 'Stick it on', body: 'Weatherproof 3M adhesive. Rated 3+ years outdoors.' },
              { title: 'Anyone scans — no app', body: 'Camera → secure page. Nothing to install.' },
              { title: 'They reach you', body: 'Call, message, GPS, or alert. Your number? Never visible.' },
              { title: 'You get pinged instantly', body: 'Push + SMS + WhatsApp. Resolve in one tap.' },
            ].map((step, i) => (
              <div key={i} className={`hiw-step reveal delay-${i + 1}`}>
                <div className="hiw-num">{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--ink)', marginBottom: 6 }}>{step.title}</div>
                  <div style={{ fontSize: 14.5, color: 'var(--ink-soft)', lineHeight: 1.65 }}>{step.body}</div>
                </div>
                {i < 4 && <div className="hiw-connector" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORY EXPLORER ───────────────────────────────────────── */}
      <section id="categories" className="cat-section" aria-labelledby="cat-heading">
        <div className="namo-wrap">
          <div className="text-center mb-12 reveal">
            <div className="section-divider justify-center">
              <span className="section-label">Use cases</span>
            </div>
            <h2 id="cat-heading" className="display-title text-4xl sm:text-5xl mt-4" style={{ color: 'var(--ink)' }}>
              One QR. Every situation.
            </h2>
          </div>

          {/* Tab bar */}
          <div className="cat-tabs-scroll flex flex-wrap gap-3 justify-center mb-10 reveal delay-1">
            {CATEGORIES.map((cat, i) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCat(i)}
                  className={`cat-tab${activeCat === i ? ' active' : ''}`}
                >
                  <Icon size={14} />
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Content panel */}
          <div style={{ position: 'relative', minHeight: 340 }}>
            {CATEGORIES.map((cat, i) => (
              <div key={cat.id} className={`cat-panel${activeCat === i ? ' active' : ''}`}>
                <div>
                  <h3 className="display-title text-2xl sm:text-3xl mb-6" style={{ color: 'var(--ink)' }}>
                    {cat.headline}
                  </h3>
                  <ul className="space-y-4">
                    {cat.lines.map((line, li) => (
                      <li key={li} className="flex items-start gap-3 text-sm leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
                        <div style={{
                          width: 20, height: 20, borderRadius: 6, background: 'var(--accent-light)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2,
                        }}>
                          <Check size={11} style={{ color: 'var(--accent)' }} />
                        </div>
                        {line}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8">
                    <button onClick={onStart} className="btn-brand">
                      Get {cat.label} Tag <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
                <div className="rounded-2xl overflow-hidden" style={{ boxShadow: 'var(--shadow-lg)' }}>
                  <img
                    src={cat.img}
                    alt={cat.label}
                    className="w-full h-72 object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURE GRID ────────────────────────────────────────────── */}
      <section className="feat-section" aria-labelledby="feat-heading">
        <div className="namo-wrap">
          <div className="text-center mb-14 reveal">
            <div className="section-divider justify-center">
              <span className="section-label">What's inside</span>
            </div>
            <h2 id="feat-heading" className="display-title text-4xl sm:text-5xl mt-4" style={{ color: 'var(--ink)' }}>
              Built to answer every doubt
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div key={i} className={`feat-card reveal delay-${(i % 4) + 1}`}>
                  <div className="feat-icon">
                    <Icon size={22} style={{ color: 'var(--accent)' }} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)', marginBottom: 8 }}>{feat.title}</div>
                  <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.6 }}>{feat.body}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── LIVE DEMO (signature interaction) ───────────────────────── */}
      <section id="demo" className="demo-section" aria-labelledby="demo-heading">
        {/* Dot grid */}
        <div className="qr-dot-bg-light absolute inset-0 pointer-events-none" aria-hidden="true" />

        <div className="namo-wrap relative">
          <div className="text-center mb-14 reveal">
            <div className="section-label mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>Try it now</div>
            <h2 id="demo-heading" className="display-title text-4xl sm:text-5xl" style={{ color: 'white' }}>
              What the scanner sees
            </h2>
            <p className="mt-4 text-base" style={{ color: 'rgba(255,255,255,0.55)', maxWidth: 380, margin: '16px auto 0' }}>
              Tap through every action. See what stays private.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20 justify-center">

            {/* Phone */}
            <div className="phone-shell flex-shrink-0 reveal delay-1">
              <div className="phone-notch" />
              <div className="phone-screen" style={{ paddingTop: 28 }}>

                {/* Step: scan landing */}
                <div className={`phone-scan-step${demoStep === 0 ? ' active-step' : ''}`}
                  style={{ padding: '12px 16px', gap: 10, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>
                    RapiQR Safe · Car Tag
                  </div>
                  <div className="py-1">
                    <RealQRCode size={110} className="mx-auto rounded-xl p-2 shadow-sm bg-white" />
                  </div>
                  <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'white' }}>KA-01-MJ-9921</div>
                  <div style={{ textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>Registered vehicle · Mumbai</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 4, fontWeight: 600 }}>TAP AN ACTION ↓</div>
                  <button className="demo-action-btn primary" style={{ fontSize: 11 }} onClick={() => setDemoStep(1)}>
                    <Phone size={12} /> Call Owner (Private)
                  </button>
                  <button className="demo-action-btn ghost" style={{ fontSize: 11 }} onClick={() => setDemoStep(1)}>
                    <MessageSquare size={12} /> Send a Message
                  </button>
                  <button className="demo-action-btn ghost" style={{ fontSize: 11, borderColor: 'rgba(240,165,0,0.3)', color: 'rgba(240,165,0,0.85)' }} onClick={() => setDemoStep(2)}>
                    <MapPin size={12} /> Share My Location
                  </button>
                  <button style={{
                    borderRadius: 12, fontSize: 11, padding: '10px 14px', background: 'var(--signal)',
                    color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: 8,
                    justifyContent: 'center', fontWeight: 700, fontFamily: 'Inter,sans-serif', cursor: 'pointer',
                  }} className="signal-pulse" onClick={() => setDemoStep(3)}>
                    <AlertTriangle size={12} /> Emergency Alert
                  </button>
                </div>

                {/* Step: contact owner */}
                <div className={`phone-scan-step${demoStep === 1 ? ' active-step' : ''}`}
                  style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button onClick={() => setDemoStep(0)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 10, cursor: 'pointer', textAlign: 'left', marginBottom: 4 }}>
                    ← Back
                  </button>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>Calling owner</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>Connected via private proxy number</div>
                  <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '16px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>📞</div>
                    <div style={{ fontSize: 12, color: 'white', fontWeight: 600 }}>+91 98×× ××××XX</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Masked proxy number · Your real number is never shared</div>
                  </div>
                  <div className="notif-toast" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: 16 }}>✅</div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>Owner notified</div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Push + SMS delivered in 0.4 sec</div>
                    </div>
                  </div>
                  <button className="demo-action-btn primary" style={{ fontSize: 11, marginTop: 4 }} onClick={() => { handleDemoAction(1); }}>
                    Next: Share Location <ArrowRight size={11} />
                  </button>
                </div>

                {/* Step: GPS shared */}
                <div className={`phone-scan-step${demoStep === 2 ? ' active-step' : ''}`}
                  style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button onClick={() => setDemoStep(0)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 10, cursor: 'pointer', textAlign: 'left', marginBottom: 4 }}>
                    ← Back
                  </button>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>Location shared</div>
                  <div style={{ background: 'rgba(240,165,0,0.08)', borderRadius: 12, padding: '14px', border: '1px solid rgba(240,165,0,0.2)' }}>
                    <div style={{ fontSize: 10, color: 'rgba(240,165,0,0.8)', fontWeight: 700, marginBottom: 6 }}>📍 GPS PIN SENT TO OWNER</div>
                    <div style={{ height: 80, background: 'rgba(255,255,255,0.04)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                      🗺️
                    </div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 6, textAlign: 'center' }}>Bandra West, Mumbai · accurate to 5m</div>
                  </div>
                  <div className="notif-toast" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: 16 }}>📱</div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>Owner sees your location</div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>They can coordinate pickup in real time</div>
                    </div>
                  </div>
                  <button className="demo-action-btn primary" style={{ fontSize: 11, marginTop: 4 }} onClick={() => { handleDemoAction(2); }}>
                    See Emergency Flow <ArrowRight size={11} />
                  </button>
                </div>

                {/* Step: Emergency alert — signal red */}
                <div className={`phone-scan-step${demoStep === 3 ? ' active-step' : ''}`}
                  style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button onClick={() => setDemoStep(0)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 10, cursor: 'pointer', textAlign: 'left' }}>
                    ← Back
                  </button>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--signal)' }}>🚨 Emergency Alert</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>Select the type of emergency</div>
                  {['Accident / Collision', 'Medical Emergency', 'Fire / Gas Leak', 'Wrong Parking'].map((type, ti) => (
                    <button
                      key={ti}
                      onClick={() => { handleDemoAction(3); }}
                      style={{
                        background: ti === 0 ? 'var(--signal)' : 'rgba(232,59,46,0.10)',
                        border: `1px solid ${ti === 0 ? 'var(--signal)' : 'rgba(232,59,46,0.25)'}`,
                        color: ti === 0 ? 'white' : 'rgba(232,59,46,0.85)',
                        borderRadius: 10, padding: '9px 12px', fontSize: 10, fontWeight: 700,
                        fontFamily: 'Inter,sans-serif', cursor: 'pointer', textAlign: 'left',
                      }}
                    >
                      {type}
                    </button>
                  ))}
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: 2 }}>
                    Alert fires instantly · Owner + guardians notified
                  </div>
                </div>

              </div>
            </div>

            {/* Explanation panel */}
            <div className="max-w-sm w-full reveal delay-2">
              {/* Step tabs */}
              <div className="flex flex-wrap gap-2 mb-8">
                {DEMO_STEPS.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => { setDemoStep(i); setDemoAlert(null); }}
                    className={`demo-step-tab${demoStep === i ? ' active' : ''}`}
                  >
                    {i + 1}. {s.label}
                  </button>
                ))}
              </div>

              <h3 className="display-title text-2xl mb-3" style={{ color: 'white' }}>
                {DEMO_STEPS[demoStep].heading}
              </h3>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginBottom: 20 }}>
                {demoStep === 0 && "The scanner lands on a clean, private page. No app download, no login. Just a clear set of actions — each of which reaches you without exposing a single character of your number."}
                {demoStep === 1 && "Every call goes through an encrypted proxy. The scanner hears a ring; you pick up. Neither party ever learns the other's real number. Your privacy is structural, not a policy."}
                {demoStep === 2 && "The scanner shares their precise GPS location in one tap. You receive a live pin via push, SMS, and WhatsApp. Useful for lost luggage, parked cars, or anything that needs a pickup."}
                {demoStep === 3 && "Emergency alerts are the only place the signal red appears on the scanner's screen — because it should mean something. Tapping fires an immediate multi-channel alert to you and your chosen SOS contacts."}
              </p>

              {demoAlert && (
                <div style={{
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 14, padding: '16px 18px', fontSize: 13, color: 'rgba(255,255,255,0.85)',
                  marginBottom: 16,
                }}>
                  {demoAlert}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {demoStep < DEMO_STEPS.length - 1 ? (
                  <button className="btn-cta" onClick={() => setDemoStep(s => s + 1)}>
                    Next: {DEMO_STEPS[demoStep + 1].label} <ArrowRight size={14} />
                  </button>
                ) : (
                  <button className="btn-cta" onClick={onStart}>
                    Get My Sticker <ArrowRight size={14} />
                  </button>
                )}
                <button className="btn-ghost" style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'white' }}
                  onClick={() => { setDemoStep(0); setDemoAlert(null); }}>
                  Restart
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

     


      {/* ── PRICING ─────────────────────────────────────────────────── */}
      <section id="pricing" className="pricing-section" aria-labelledby="pricing-heading">
        <div className="namo-wrap">
          <div className="text-center mb-14 reveal">
            <div className="section-divider justify-center">
              <span className="section-label">Pricing</span>
            </div>
            <h2 id="pricing-heading" className="display-title text-4xl sm:text-5xl mt-4" style={{ color: 'var(--ink)' }}>
              Buy once. Done forever.
            </h2>
            <p className="mt-4 text-sm" style={{ color: 'var(--ink-soft)', maxWidth: 320, margin: '12px auto 0' }}>
              No monthly fees. No renewals.
              <span style={{ color: 'var(--ink-faint)', fontStyle: 'italic' }}> (Sample prices — replace before launch.)</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {COMBOS.map((plan, pi) => (
              <div key={plan.id} className={`price-card reveal delay-${pi + 1}${plan.popular ? ' featured' : ''}`}>
                {plan.tag && (
                  <div style={{
                    display: 'inline-block', fontSize: 11, fontWeight: 800, letterSpacing: '0.06em',
                    textTransform: 'uppercase', marginBottom: 16,
                    padding: '5px 14px', borderRadius: 99,
                    background: plan.popular ? 'rgba(240,165,0,0.18)' : 'var(--accent-light)',
                    color: plan.popular ? 'var(--accent)' : 'var(--accent-deep)',
                  }}>
                    {plan.tag}
                  </div>
                )}

                <div style={{ marginBottom: 6, fontSize: 20, fontWeight: 800, color: plan.popular ? 'white' : 'var(--ink)' }}>
                  {plan.name}
                </div>
                <p style={{ fontSize: 13.5, color: plan.popular ? 'rgba(255,255,255,0.65)' : 'var(--ink-soft)', marginBottom: 24, lineHeight: 1.6 }}>
                  {plan.desc}
                </p>

                <div style={{ marginBottom: 28 }}>
                  {plan.price > 0 ? (
                    <>
                      <span style={{ fontSize: 42, fontWeight: 900, color: plan.popular ? 'white' : 'var(--ink)', lineHeight: 1 }}>
                        ₹{plan.price}
                      </span>
                      {plan.mrp > 0 && (
                        <span style={{ fontSize: 15, color: plan.popular ? 'rgba(255,255,255,0.4)' : 'var(--ink-faint)', textDecoration: 'line-through', marginLeft: 10 }}>
                          ₹{plan.mrp}
                        </span>
                      )}
                      <div style={{ fontSize: 12, color: plan.popular ? 'rgba(240,165,0,0.8)' : 'var(--ink-faint)', marginTop: 4 }}>
                        One-time · lifetime access
                      </div>
                    </>
                  ) : (
                    <span style={{ fontSize: 32, fontWeight: 800, color: plan.popular ? 'white' : 'var(--ink)', lineHeight: 1 }}>
                      Custom quote
                    </span>
                  )}
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {plan.items.map((item, ii) => (
                    <li key={ii} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 13.5, color: plan.popular ? 'rgba(255,255,255,0.8)' : 'var(--ink-soft)' }}>
                      <Check size={14} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }} />
                      {item}
                    </li>
                  ))}
                </ul>

                <div style={{ marginTop: 'auto' }}>
                  <button
                    onClick={onStart}
                    className={plan.popular ? 'btn-cta' : 'btn-ghost'}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    {plan.cta} <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DISTRIBUTORSHIP & PARTNER PROGRAM ──────────── */}
      <section id="distributorship" className="distributor-section py-20 relative overflow-hidden" style={{ background: 'var(--brand)', color: 'white' }}>
        {/* QR dot background motif */}
        <div className="qr-dot-bg-light absolute inset-0 pointer-events-none opacity-20" aria-hidden="true" />

        <div className="namo-wrap relative">

          {/* Section Header */}
          <div className="text-center mb-16 reveal">
            <h2 className="display-title text-4xl sm:text-5xl lg:text-6xl text-white mb-4">
              Become a RapiQR Distributor.
            </h2>
            <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
              High margins, zero tech hassle, and instant product demand. Sell smart QR safety stickers in your shop, city, or dealer network.
            </p>
          </div>

          {/* Highlights 4-Grid — Clean & Typography Driven */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              {
                title: '50%+ Profit Margins',
                desc: 'High retail markup per sticker. Earn healthy profits from day one with bulk wholesale pricing.',
              },
              {
                title: 'Free POS Counter Display',
                desc: 'Includes attractive acrylic counter stands, promotional posters, and QR scan demos for your shop.',
              },
              {
                title: 'Partner Admin Portal',
                desc: 'Manage inventory, assign tags to customers in 5 seconds, and track reseller commissions live.',
              },
              {
                title: 'Territory Lock Rights',
                desc: 'Exclusive city/district dealership rights available for qualified regional distributors.',
              },
            ].map((h, i) => (
              <div key={i} className={`reveal delay-${i + 1} p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all text-left`}>
                <div className="text-xl font-extrabold text-white mb-2">{h.title}</div>
                <div className="text-xs text-gray-300 leading-relaxed">{h.desc}</div>
              </div>
            ))}
          </div>

          {/* Distributor Packages / Tiers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch mb-12 text-left">

            {/* Tier 1: Retail Starter Kit */}
            <div className="reveal delay-1 p-8 rounded-3xl bg-white text-gray-900 shadow-2xl flex flex-col justify-between border border-gray-100">
              <div>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 uppercase tracking-wider">
                  Shopkeeper Starter Kit
                </span>
                <div className="text-2xl font-black text-gray-900 mt-4 mb-2">Retail Partner</div>
                <p className="text-xs text-gray-600 mb-6">Ideal for car accessory shops, helmet stores, society gates &amp; local retailers.</p>

                <div className="text-3xl font-black text-gray-900 mb-6">
                  ₹4,999 <span className="text-xs font-normal text-gray-500">/ 50 Stickers Kit</span>
                </div>

                <ul className="space-y-3 mb-8 text-xs font-medium text-gray-700">
                  <li className="flex items-center gap-2">✓ 50 Assorted Safety QR Stickers</li>
                  <li className="flex items-center gap-2">✓ Acrylic Tabletop Counter Stand Display</li>
                  <li className="flex items-center gap-2">✓ 45% Retail Profit Margin</li>
                  <li className="flex items-center gap-2">✓ Basic Partner Activation Access</li>
                </ul>
              </div>

              <button onClick={() => handleOpenPartnerModal('Retail Kit (50 Units)')} className="w-full py-3.5 rounded-xl font-bold bg-gray-900 text-white hover:bg-gray-800 transition-all text-xs flex items-center justify-center gap-2 cursor-pointer">
                Apply for Retail Kit →
              </button>
            </div>

            {/* Tier 2: Exclusive City Distributor */}
            <div className="reveal delay-2 p-8 rounded-3xl bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-400 text-gray-950 shadow-2xl flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />

              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-gray-950 text-white uppercase tracking-wider">
                    Exclusive Franchise
                  </span>
                  <span className="text-xs font-extrabold bg-white/30 text-gray-950 px-2.5 py-0.5 rounded-full">
                    High Income
                  </span>
                </div>

                <div className="text-2xl font-black text-gray-950 mb-2">City Master Distributor</div>
                <p className="text-xs text-gray-900/80 mb-6 font-medium">Exclusive supply rights for your entire city or district.</p>

                <div className="text-3xl font-black text-gray-950 mb-6">
                  ₹24,999 <span className="text-xs font-normal text-gray-900/70">/ 300 Stickers + Exclusive Lock</span>
                </div>

                <ul className="space-y-3 mb-8 text-xs font-bold text-gray-950">
                  <li className="flex items-center gap-2">✓ 300 QR Stickers + City Exclusive Rights</li>
                  <li className="flex items-center gap-2">✓ 5 Counter Stands + Marketing Banners</li>
                  <li className="flex items-center gap-2">✓ 60% Profit Margin + Sub-dealer Admin</li>
                  <li className="flex items-center gap-2">✓ Dedicated Relationship Manager &amp; Leads</li>
                </ul>
              </div>

              <button onClick={() => handleOpenPartnerModal('City Franchise (300 Units)')} className="w-full py-3.5 rounded-xl font-black bg-gray-950 text-white hover:bg-gray-900 transition-all text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer">
                Apply for City Distributorship →
              </button>
            </div>

          </div>

          <div className="text-center text-xs text-gray-300 font-medium">        Questions? Call our B2B Partner Desk directly at <span className="text-amber-400 font-bold">+91 98765 43210</span> or email <span className="text-amber-400 font-bold">b2b@rapiqr.com</span>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ────────────────────────────────────────────── */}
      <section className="proof-section" aria-labelledby="proof-heading">
        <div className="namo-wrap">
          <div className="text-center mb-12 reveal">
            <div className="section-divider justify-center">
              <span className="section-label">What people say</span>
            </div>
            <h2 id="proof-heading" className="display-title text-4xl sm:text-5xl mt-4" style={{ color: 'var(--ink)' }}>
              Real people. Real scans.
            </h2>
            <p className="mt-3 text-xs italic" style={{ color: 'var(--ink-faint)' }}>
              ↓ Sample testimonials — replace with real ones before launch
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {TESTIMONIALS.map((t, ti) => (
              <div key={ti} className={`proof-card reveal delay-${ti + 1}`}>
                <div className="proof-stars">{'★'.repeat(t.stars)}</div>
                <p style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.7, fontStyle: 'italic', flex: 1 }}>
                  "{t.quote}"
                </p>
                <div style={{ display: 'flex', items: 'center', gap: 12, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%', background: 'var(--brand-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: 12, color: 'var(--brand)', flexShrink: 0,
                  }}>
                    {t.avatar}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--ink)' }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────── */}
      <section id="faq" className="faq-section" aria-labelledby="faq-heading">
        <div className="namo-wrap" style={{ maxWidth: 720 }}>
          <div className="text-center mb-14 reveal">
            <div className="section-divider justify-center">
              <span className="section-label">FAQ</span>
            </div>
            <h2 id="faq-heading" className="display-title text-4xl sm:text-5xl mt-4" style={{ color: 'var(--ink)' }}>
              Quick answers.
            </h2>
          </div>

          <div className="reveal delay-1">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="faq-item">
                <button
                  className={`faq-question${openFaq === i ? ' open' : ''}`}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                >
                  <span>{item.q}</span>
                  <span className="faq-chevron">
                    <ChevronDown size={12} />
                  </span>
                </button>
                <div className={`faq-answer${openFaq === i ? ' open' : ''}`} aria-hidden={openFaq !== i}>
                  <div className="faq-answer-inner">{item.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA BANNER ────────────────────────────────────────── */}
      <section className="cta-banner qr-dot-bg-light" aria-labelledby="cta-heading">
        <div className="namo-wrap text-center reveal">
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(240,165,0,0.12)', border: '1px solid rgba(240,165,0,0.25)',
            borderRadius: 99, padding: '6px 16px', fontSize: 12, fontWeight: 700,
            color: 'var(--accent)', marginBottom: 28,
          }}>
            <Zap size={13} /> One-time purchase · Lifetime protection
          </div>

          <h2 id="cta-heading" className="display-title text-4xl sm:text-5xl md:text-6xl" style={{ color: 'white', maxWidth: 700, margin: '0 auto 20px' }}>
            Protect everyone you care for.<br />Keep your number private.
          </h2>

          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.60)', maxWidth: 380, margin: '0 auto 36px', lineHeight: 1.7 }}>
            Stick it on. Scan happens. You're protected.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <button onClick={onStart} className="btn-cta">
              Get My Sticker <ArrowRight size={16} />
            </button>
            <a href="#demo" className="btn-ghost" style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'white' }}>
              Try the Demo First
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer className="namo-footer" aria-label="Site footer">
        <div className="namo-wrap">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div>
              <div style={{ marginBottom: 16 }} className="flex items-center">
                <img src={groupLogo1} alt="RapiQR Logo" className="h-10 sm:h-12 w-auto object-contain" />
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.7 }}>
                One QR. Lifetime protection.
              </p>
            </div>

            {[
              {
                title: 'Product', links: ['How It Works', 'Vehicle Tags', 'Home Gate Tags', 'Family Tags', 'Luggage Tags'],
              },
              {
                title: 'Company', links: ['About', 'Partner Program', 'Privacy Policy', 'Terms of Service', 'Refund Policy', 'Contact'],
              },
              {
                title: 'Support', links: ['Help Centre', 'FAQ', 'Track Your Order', 'Replace a Sticker', 'Enterprise / Fleet'],
              },
            ].map((col, ci) => (
              <div key={ci}>
                <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 14 }}>
                  {col.title}
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {col.links.map(link => (
                    <li key={link}>
                      <a href={link === 'Partner Program' ? '#distributorship' : '#'} style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.55)', textDecoration: 'none', transition: 'color 0.2s' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}>
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 28, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 12 }}>© 2026 RapiQR. All rights reserved.</div>
            <div style={{ fontSize: 12 }}>
              Made in India 🇮🇳 · Privacy-first by design
            </div>
          </div>
        </div>
      </footer>

      {/* ── QUICK VIEW MODAL ────────────────────────────────────────── */}
      {quickView && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(14,17,23,0.6)', backdropFilter: 'blur(8px)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setQuickView(null)}
        >
          <div
            style={{ background: 'white', maxWidth: 520, width: '100%', borderRadius: 24, overflow: 'hidden', boxShadow: '0 40px 80px rgba(14,17,23,0.3)', position: 'relative' }}
            onClick={e => e.stopPropagation()}
          >
            <img src={quickView.img} alt={quickView.name} style={{ width: '100%', height: 220, objectFit: 'cover' }} />
            <button
              onClick={() => setQuickView(null)}
              style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(14,17,23,0.6)', border: 'none', borderRadius: '50%', width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              aria-label="Close"
            >
              <X size={16} style={{ color: 'white' }} />
            </button>
            <div style={{ padding: '24px 28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>{quickView.name}</h3>
                <div style={{ fontSize: 10, color: 'var(--ink-faint)', textDecoration: 'line-through' }}>₹{quickView.mrp}</div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--accent)', marginBottom: 12 }}>₹{quickView.price}</div>
              <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginBottom: 20, lineHeight: 1.65 }}>{quickView.desc}</p>
              <button onClick={() => { addToCart(quickView); setQuickView(null); }} className="btn-brand" style={{ width: '100%', justifyContent: 'center' }}>
                Add to Cart <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FLOATING CART BUTTON (bottom-right, persistent) ─────────── */}
      {cart.length > 0 && !isCartOpen && (
        <button onClick={() => { setCartToast(null); setIsCartOpen(true); }} className="floating-cart-btn" aria-label="Open cart">
          <ShoppingBag size={17} />
          <span>Cart</span>
          {cartItemCount > 0 && <span className="fab-badge">{cartItemCount}</span>}
        </button>
      )}

      {/* ── ADD-TO-CART POPUP (bottom-right, cart-based) ─────────────── */}
      {cartToast && !isCartOpen && (
        <div className="cart-toast" key={cartToast.ts}>
          <button onClick={() => setCartToast(null)} className="cart-toast-close" aria-label="Dismiss">
            <X size={14} />
          </button>
          <div className="cart-toast-row">
            <div className="cart-toast-thumb">
              <img src={cartToast.product.img} alt={cartToast.product.name} />
            </div>
            <div className="cart-toast-body">
              <div className="cart-toast-title">
                <CheckCircle2 size={13} style={{ color: 'var(--accent)' }} />
                {cartToast.mode === 'updated' ? 'Quantity Updated' : 'Added to Cart'}
              </div>
              <div className="cart-toast-name">{cartToast.product.name}</div>
              <div className="cart-toast-meta">
                {cartToast.mode === 'updated' ? 'Now ' : ''}{cartToast.qty} × ₹{cartToast.product.price}
              </div>
              <div className="cart-toast-count">
                Cart · {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'} · <strong>₹{cartSubtotal}</strong>
              </div>
            </div>
          </div>
          <div className="cart-toast-actions">
            <button onClick={() => { setIsCartOpen(true); setCartToast(null); }} className="cart-toast-view">
              View Cart <ArrowRight size={12} />
            </button>
            <button
              onClick={openCheckout}
              className="cart-toast-checkout"
            >
              Checkout
            </button>
          </div>
        </div>
      )}

      {/* ── CART DRAWER ─────────────────────────────────────────────── */}
      <div className={`cart-overlay${isCartOpen ? ' open' : ''}`} onClick={() => setIsCartOpen(false)}>
        <div className="cart-panel" onClick={e => e.stopPropagation()}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ShoppingBag size={18} style={{ color: 'var(--accent)' }} />
              <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--ink)' }}>Your Cart ({cartItemCount})</span>
            </div>
            <button onClick={() => setIsCartOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }} aria-label="Close cart">
              <X size={20} style={{ color: 'var(--ink-soft)' }} />
            </button>
          </div>

          <div className="cart-items-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--ink-faint)', fontSize: 14 }}>
                Your cart is empty.<br />
                <span style={{ fontSize: 12, marginTop: 6, display: 'block' }}>Browse our safety tags above.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {cart.map(item => (
                  <div key={item.product.id} style={{ display: 'flex', gap: 12, padding: 14, borderRadius: 14, background: 'var(--paper)', border: '1px solid var(--border)' }}>
                    <img src={item.product.img} alt={item.product.name} style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700 }}>₹{item.product.price}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <button onClick={() => updateQty(item.product.id, -1)} style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--paper-white)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Decrease qty">
                        <Minus size={11} style={{ color: 'var(--ink)' }} />
                      </button>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', width: 18, textAlign: 'center' }}>{item.qty}</span>
                      <button onClick={() => updateQty(item.product.id, 1)} style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--paper-white)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Increase qty">
                        <Plus size={11} style={{ color: 'var(--ink)' }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <div style={{ padding: '16px 24px 24px', borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>
                <span>Subtotal</span>
                <span style={{ color: 'var(--accent)' }}>₹{cartSubtotal}</span>
              </div>
              <button onClick={openCheckout} className="btn-cta" style={{ width: '100%', justifyContent: 'center' }}>
                Checkout <ArrowRight size={14} />
              </button>
              <p style={{ fontSize: 11, color: 'var(--ink-faint)', textAlign: 'center', marginTop: 10 }}>
                Free shipping · Lifetime protection included
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── DISTRIBUTORSHIP APPLICATION MODAL ── */}
      {isPartnerModalOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative border border-gray-100 p-8 text-left">
            <button
              onClick={() => { setIsPartnerModalOpen(false); setPartnerSubmitted(false); }}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
            >
              <X size={18} />
            </button>

            {userAppStatus?.status === 'approved' ? (
              <div className="py-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl font-bold">
                  ✓
                </div>
                <h3 className="text-2xl font-black text-gray-900">Distributor Verified &amp; Approved!</h3>
                <p className="text-xs text-gray-600 leading-relaxed max-w-xs mx-auto">
                  Congratulations <span className="font-bold text-gray-900">{profile?.fullName || userAppStatus.userName}</span>. Your franchise application has been verified by the admin owner. Your Distributor Dashboard is unlocked.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setIsPartnerModalOpen(false);
                      if (onOpenDistributorDashboard) onOpenDistributorDashboard();
                    }}
                    className="w-full py-3.5 rounded-xl font-black bg-amber-500 text-gray-950 hover:bg-amber-400 transition-all text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    Open Distributor Dashboard <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ) : (userAppStatus?.status === 'pending' || partnerSubmitted) ? (
              <div className="py-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto text-2xl font-bold animate-pulse">
                  ⏳
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 uppercase tracking-wider">
                  Request Sent to Owner
                </div>
                <h3 className="text-2xl font-black text-gray-900">Pending Admin Verification</h3>
                <p className="text-xs text-gray-600 leading-relaxed max-w-xs mx-auto">
                  Thank you <span className="font-bold text-gray-900">{partnerForm.name || userAppStatus?.userName || 'Partner'}</span>. Your distributor application request has been sent to the system owner.
                </p>
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600 font-medium text-left space-y-1.5">
                  <div className="flex justify-between"><span>City / Territory:</span> <span className="font-bold text-gray-900">{partnerForm.city || userAppStatus?.city || 'Pune'}</span></div>
                  <div className="flex justify-between"><span>Package Tier:</span> <span className="font-bold text-amber-600">{partnerForm.tier || userAppStatus?.tier}</span></div>
                  <div className="flex justify-between"><span>Verification Status:</span> <span className="font-bold text-amber-600">Pending Review ⏳</span></div>
                </div>
                <p className="text-[11px] text-gray-400 italic">
                  Once the admin owner verifies your request, your Distributor Dashboard will be unlocked automatically.
                </p>
                <button
                  onClick={() => { setIsPartnerModalOpen(false); setPartnerSubmitted(false); }}
                  className="px-6 py-2.5 rounded-xl font-bold bg-gray-900 text-white text-xs inline-block cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900">Become a Partner</h3>
                    <p className="text-xs text-gray-500">Apply for RapiQR Distributorship &amp; Franchise</p>
                  </div>
                </div>

                <form onSubmit={handlePartnerSubmit} className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Full Name / Company Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Auto Accessories"
                      value={partnerForm.name}
                      onChange={e => setPartnerForm({ ...partnerForm, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Phone / WhatsApp Number</label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 98765 43210"
                        value={partnerForm.phone}
                        onChange={e => setPartnerForm({ ...partnerForm, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">City &amp; State</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Pune, Maharashtra"
                        value={partnerForm.city}
                        onChange={e => setPartnerForm({ ...partnerForm, city: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Business Type</label>
                    <select
                      value={partnerForm.business}
                      onChange={e => setPartnerForm({ ...partnerForm, business: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-amber-500"
                    >
                      <option value="Auto Accessories Shop">Auto Accessories / Helmet Shop</option>
                      <option value="Car Dealership / Service Center">Car Dealership / Service Center</option>
                      <option value="Security Agency / Society Admin">Security Agency / Housing Society Admin</option>
                      <option value="Retail Store / Gift Shop">Retail Store / General Merchant</option>
                      <option value="Individual Reseller">Individual Reseller / Entrepreneur</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Interested Partner Package</label>
                    <select
                      value={partnerForm.tier}
                      onChange={e => setPartnerForm({ ...partnerForm, tier: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-amber-500"
                    >
                      <option value="Retail Kit (50 Units)">Retail Partner Kit (50 Stickers - 45% Margin)</option>
                      <option value="City Franchise (300 Units)">City Master Franchise (300 Stickers + Exclusive Lock)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl font-bold bg-amber-500 text-gray-950 text-xs flex items-center justify-center gap-2 hover:bg-amber-600 transition-all shadow-md mt-4 cursor-pointer"
                  >
                    Submit Partner Application <ArrowRight size={14} />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

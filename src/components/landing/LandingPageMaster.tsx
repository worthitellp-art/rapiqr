import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  motion,
  AnimatePresence,
  useScroll,
  useInView,
  useReducedMotion,
  useDragControls,
} from 'framer-motion';
import {
  ArrowRight,
  Plus,
  Minus,
  Menu,
  X,
  Check,
  ChevronDown,
  ShoppingBag,
  Trash2,
  Truck,
  LayoutDashboard,
  ShieldCheck,
  Phone,
  ShieldAlert,
  MessageSquare,
  QrCode,
  Globe,
  Car,
  Key,
  DoorClosed,
  Laptop,
  Smartphone,
  Compass,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { landingTranslations } from '../../i18n/landingTranslations';
import PhoneInputWithCountry from '../common/PhoneInputWithCountry';
import {
  saveDistributorApplication,
  getUserDistributorApplication,
  DistributorApplication,
} from '../../lib/distributorService';
import { apiClient } from '../../lib/apiClient';
import { SERVICE_TYPES } from '../scan/tileActions';
import { type ProductItem } from '../../data/products';
import HeroStickerShowcase from './HeroStickerShowcase';
import { FlowButton } from '../ui/flow-button';
import { MorphingPopover, MorphingPopoverContent, MorphingPopoverTrigger } from '../ui/morphing-popover';

// Brand Assets
import lightBgLogo from '../../../assets/logo for wh bg.png';

export interface LandingPageMasterProps {
  onStart?: () => void;
  onLogin?: () => void;
  onOpenDashboard?: () => void;
  onOpenDistributorDashboard?: () => void;
  onOpenDistributorApply?: () => void;
  onOpenPricing?: () => void;
  onOpenCheckout?: () => void;
  onOpenJoinUs?: (serviceType?: string) => void;
  onOpenPrivacy?: () => void;
  isEmbeddedInDashboard?: boolean;
}

interface CartItem {
  product: ProductItem;
  qty: number;
}

interface FaqItem {
  id: string;
}

// ── Clean Static Data (Truthful & Lean) ────────────────────────────────────

const HOW_IT_WORKS_STEPS = [{ step: 1 }, { step: 2 }, { step: 3 }];

const FEATURES_LIST = [
  { id: 'f1', badgeColor: 'bg-sky-50 text-sky-700 border-sky-200/70' },
  { id: 'f2', badgeColor: 'bg-amber-50 text-amber-800 border-amber-200/70' },
  { id: 'f3', badgeColor: 'bg-rose-50 text-rose-700 border-rose-200/70' },
  { id: 'f4', badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200/70' },
];

const TWO_PRODUCTS: ProductItem[] = [
  {
    id: 'adhesive-tag',
    name: 'Adhesive QR Safety Tag',
    desc: 'Flexible weatherproof adhesive tag for car windshields, motorcycle fuel tanks, and laptops.',
    price: 299,
    mrp: 599,
    category: 'Vehicle',
    badge: 'Popular',
    img: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=85',
    features: [
      'Weatherproof matte finish with durable adhesive',
      'Dual NFC tap + high-contrast QR scan',
      'Private masked calling & instant WhatsApp alerts',
    ],
  },
  {
    id: 'charm-tag',
    name: 'Safety Charm / Keyring Tag',
    desc: 'Lightweight alloy ring charm designed for keychains, pet collars, luggage, and backpacks.',
    price: 349,
    mrp: 699,
    category: 'Travel',
    badge: 'Versatile',
    img: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=1200&q=85',
    features: [
      'Lightweight durable alloy ring for keys, bags & pet collars',
      'Instant NFC tap + laser-etched QR code',
      'Private masked calling & instant WhatsApp alerts',
    ],
  },
];

const FRANCHISE_TIERS = [
  {
    id: 'starter',
    name: 'Starter Retail Kit',
    price: '₹7,450',
    moq: 'MOQ 50 Units @ ₹149/unit',
    margin: '50% margin on retail ₹299 MRP',
    popular: false,
  },
  {
    id: 'city',
    name: 'Exclusive City Franchise',
    price: '₹59,500',
    moq: 'MOQ 500 Units @ ₹119/unit',
    margin: '60% margin on retail ₹299 MRP',
    popular: true,
  },
  {
    id: 'master',
    name: 'Master State Partner',
    price: '₹2,22,500',
    moq: 'MOQ 2,500 Units @ ₹89/unit',
    margin: '70% margin on retail ₹299 MRP',
    popular: false,
  },
];

const FAQS: FaqItem[] = [
  { id: 'faq-1' },
  { id: 'faq-2' },
  { id: 'faq-3' },
  { id: 'faq-4' },
  { id: 'faq-5' },
];

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

function Reveal({
  children,
  delay = 0,
  y = 18,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  key?: React.Key;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? undefined : { opacity: 0, y }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      transition={{ duration: 0.6, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' });
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setValue(to);
      return;
    }
    const duration = 1200;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(eased * to);
      if (p < 1) frame = requestAnimationFrame(tick);
      else setValue(to);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, to, reduced]);

  return (
    <span ref={ref}>
      {Math.round(value)}
      {suffix}
    </span>
  );
}

// ── Step 01 Animated Vector Mockup: STICK ─────────────────────────────────

function StickMockup() {
  const { language } = useLanguage();
  const t = landingTranslations[language].howItWorks.stickMockup;
  return (
    <div className="relative h-48 w-full overflow-hidden rounded-md bg-gradient-to-br from-slate-50 via-sky-50/40 to-slate-100 p-4 border border-neutral-200/80 flex items-center justify-center">
      {/* Background subtle dots */}
      <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:12px_12px]" />

      {/* Physical Smart Tag with Animated Peel Corner */}
      <motion.div
        animate={{ y: [0, -3, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
        className="relative z-10 w-44 rounded-md bg-white p-3.5 border-2 border-neutral-900 shadow-md shadow-neutral-900/10"
      >
        {/* Peeling corner indicator */}
        <motion.div
          animate={{ scale: [1, 1.08, 1], rotate: [0, -2, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="absolute -top-1 -right-1 h-7 w-7 rounded-tr-md bg-gradient-to-bl from-amber-200 via-neutral-100 to-white border-b border-l border-neutral-300 shadow-xs"
        />

        <div className="flex items-center gap-2 mb-2">
          <div className="h-6 w-6 rounded-sm bg-neutral-950 text-white flex items-center justify-center">
            <QrCode size={13} />
          </div>
          <div>
            <p className="text-[10px] font-mono font-bold text-neutral-900">{t.tagName}</p>
            <p className="text-[8px] text-neutral-500 font-medium">{t.mount}</p>
          </div>
        </div>

        <div className="rounded-sm bg-neutral-50 p-2 border border-neutral-200/80 text-center">
          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
            <Check size={10} className="stroke-[3]" /> {t.peelStick}
          </span>
          <p className="text-[8px] text-neutral-500 mt-1">{t.adhesive}</p>
        </div>
      </motion.div>

      {/* Floating Status Pill */}
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 3.5, delay: 0.5, ease: 'easeInOut' }}
        className="absolute bottom-2.5 rounded-md bg-white/95 backdrop-blur-xs px-3 py-1 text-[10px] font-semibold text-neutral-800 border border-neutral-200/90 shadow-xs flex items-center gap-1.5"
      >
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>{t.weatherproof}</span>
      </motion.div>
    </div>
  );
}

// ── Step 02 Animated Vector Mockup: SCAN ──────────────────────────────────

function ScanMockup() {
  const { language } = useLanguage();
  const t = landingTranslations[language].howItWorks.scanMockup;
  return (
    <div className="relative h-48 w-full overflow-hidden rounded-md bg-neutral-950 p-4 border border-neutral-800 flex items-center justify-center text-white">
      {/* Viewfinder Target Area */}
      <div className="relative flex h-32 w-32 items-center justify-center rounded-md border border-dashed border-sky-400/40 bg-sky-950/20">
        {/* Viewfinder 4 Corner Brackets */}
        <span className="absolute -top-1 -left-1 h-3.5 w-3.5 border-t-2 border-l-2 border-sky-400 rounded-tl-sm" />
        <span className="absolute -top-1 -right-1 h-3.5 w-3.5 border-t-2 border-r-2 border-sky-400 rounded-tr-sm" />
        <span className="absolute -bottom-1 -left-1 h-3.5 w-3.5 border-b-2 border-l-2 border-sky-400 rounded-bl-sm" />
        <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 border-b-2 border-r-2 border-sky-400 rounded-br-sm" />

        {/* QR Code in center */}
        <div className="rounded-md bg-white p-2.5 shadow-md">
          <QrCode size={52} className="text-neutral-950" />
        </div>

        {/* Animated Laser Scanning Beam */}
        <motion.div
          animate={{ y: [-48, 48, -48] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
          className="absolute inset-x-1 h-0.5 bg-gradient-to-r from-transparent via-sky-400 to-transparent shadow-[0_0_10px_#38bdf8]"
        />
      </div>

      {/* Instant browser URL popup badge */}
      <motion.div
        animate={{ scale: [1, 1.03, 1], y: [0, -2, 0] }}
        transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut' }}
        className="absolute bottom-2.5 rounded-md bg-white/10 backdrop-blur-md px-3.5 py-1 text-[10px] font-mono font-medium text-sky-200 border border-white/20 shadow-lg flex items-center gap-1.5"
      >
        <Globe size={11} className="text-sky-400" />
        <span>repiqr.com/t/8a3f · {t.noAppNeeded}</span>
      </motion.div>
    </div>
  );
}

// ── Step 03 Animated Vector Mockup: GET ALERTED ───────────────────────────

function AlertMockup() {
  const { language } = useLanguage();
  const t = landingTranslations[language].howItWorks.alertMockup;
  return (
    <div className="relative h-48 w-full overflow-hidden rounded-md bg-gradient-to-br from-emerald-50/60 via-slate-50 to-emerald-100/30 p-4 border border-neutral-200/80 flex flex-col items-center justify-center gap-2">
      {/* Animated Incoming Masked Call Banner */}
      <motion.div
        animate={{ y: [0, -3, 0] }}
        transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
        className="w-full max-w-[210px] rounded-md bg-neutral-950 p-2.5 text-white shadow-md border border-neutral-800 flex items-center justify-between"
      >
        <div className="flex items-center gap-2 min-w-0">
          <motion.div
            animate={{ rotate: [-8, 8, -8] }}
            transition={{ repeat: Infinity, duration: 0.6 }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-500 text-white"
          >
            <Phone size={13} />
          </motion.div>
          <div className="min-w-0">
            <p className="truncate text-[10px] font-bold text-white">{t.maskedCall}</p>
            <p className="truncate text-[8px] text-emerald-400 font-medium">{t.numberPrivate}</p>
          </div>
        </div>
        <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[8px] font-bold text-emerald-400">
          {t.live}
        </span>
      </motion.div>

      {/* Animated WhatsApp Notification Banner */}
      <motion.div
        animate={{ y: [0, 2, 0] }}
        transition={{ repeat: Infinity, duration: 3.6, delay: 0.3, ease: 'easeInOut' }}
        className="w-full max-w-[210px] rounded-md bg-white p-2.5 text-neutral-900 shadow-sm border border-neutral-200/90 flex items-center gap-2"
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
          <MessageSquare size={13} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-bold text-neutral-900">{t.whatsappAlert}</p>
          <p className="truncate text-[8px] text-neutral-500">{t.locationPin}</p>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Page Component ───────────────────────────────────────────────────

export default function LandingPageMaster({
  onStart,
  onLogin,
  onOpenDashboard,
  onOpenDistributorDashboard,
  onOpenPricing,
  onOpenCheckout,
  onOpenJoinUs,
  onOpenPrivacy,
  isEmbeddedInDashboard = false,
}: LandingPageMasterProps) {
  const { isLoggedIn, profile } = useAuth();
  const { language } = useLanguage();
  const t = landingTranslations[language];

  // Mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Cart
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const primary = localStorage.getItem('repiqr-cart');
      if (primary) {
        const parsed = JSON.parse(primary) as CartItem[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      const saved = localStorage.getItem('namoqr-cart');
      return saved ? (JSON.parse(saved) as CartItem[]) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  // Mobile: the cart opens as a half-height sheet; tapping/dragging the handle expands it.
  const [isCartExpanded, setIsCartExpanded] = useState(false);
  const cartDrag = useDragControls();
  const [cartNotice, setCartNotice] = useState<{ name: string; qty: number } | null>(null);

  useEffect(() => {
    if (!isCartOpen) setIsCartExpanded(false);
  }, [isCartOpen]);

  useEffect(() => {
    try {
      localStorage.setItem('repiqr-cart', JSON.stringify(cart));
      localStorage.setItem('namoqr-cart', JSON.stringify(cart));
    } catch {
      /* ignore */
    }
  }, [cart]);

  useEffect(() => {
    if (!cartNotice) return;
    const timeout = window.setTimeout(() => setCartNotice(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [cartNotice]);

  // Scroll watcher for header
  const { scrollY } = useScroll();
  useEffect(() => {
    return scrollY.on('change', (y) => {
      setIsScrolled(y > 15);
    });
  }, [scrollY]);

  // FAQ accordion
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(FAQS[0].id);

  // Franchise Partner Modal
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [partnerForm, setPartnerForm] = useState({
    name: '',
    phone: '',
    city: '',
    tier: 'Starter Retail Kit (50 Units)',
  });
  const [partnerSubmitted, setPartnerSubmitted] = useState(false);
  const [userAppStatus, setUserAppStatus] = useState<DistributorApplication | null>(null);

  // Join Us State & Service Dropdown
  const [isJoinMenuOpen, setIsJoinMenuOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [selectedServiceSlug, setSelectedServiceSlug] = useState<string>(SERVICE_TYPES[0].slug);
  const [joinForm, setJoinForm] = useState({
    name: '',
    phone: '',
    city: '',
    email: '',
  });
  const [joinSubmitted, setJoinSubmitted] = useState(false);
  const [joinSubmitting, setJoinSubmitting] = useState(false);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0);
  const updateCartQty = (id: string, delta: number) =>
    setCart((prev) =>
      prev.map((i) => (i.product.id === id ? { ...i, qty: i.qty + delta } : i)).filter((i) => i.qty > 0)
    );
  const removeFromCart = (id: string) => setCart((prev) => prev.filter((i) => i.product.id !== id));

  const handleSmoothScroll = (targetId: string) => {
    setIsMobileMenuOpen(false);
    setTimeout(() => {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  };

  const handleJoinSelect = (slug: string) => {
    setIsJoinMenuOpen(false);
    setSelectedServiceSlug(slug);
    if (onOpenJoinUs) {
      onOpenJoinUs(slug);
    } else {
      setIsJoinModalOpen(true);
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinForm.name || !joinForm.phone || !joinForm.city) return;
    setJoinSubmitting(true);
    try {
      const type = SERVICE_TYPES.find((s) => s.slug === selectedServiceSlug) || SERVICE_TYPES[0];
      await apiClient.helplines.apply({
        category: type.label,
        serviceType: type.slug,
        categories: [],
        label: joinForm.name,
        phone: joinForm.phone,
        email: joinForm.email,
        city: joinForm.city,
        notes: 'Submitted via landing page partner form',
      });
      setJoinSubmitted(true);
    } catch {
      setJoinSubmitted(true);
    }
    setJoinSubmitting(false);
  };

  const addToCart = (product: ProductItem, qty = 1) => {
    if (!isLoggedIn) {
      try {
        localStorage.setItem('repiqr-redirect-after-login', 'checkout');
        localStorage.setItem('repiqr-buynow-cart', JSON.stringify([{ product, qty }]));
      } catch { /* ignore */ }
      onLogin();
      return;
    }
    let updatedCart: CartItem[];
    const existing = cart.find((item) => item.product.id === product.id);
    if (existing) {
      updatedCart = cart.map((item) =>
        item.product.id === product.id ? { ...item, qty: item.qty + qty } : item
      );
    } else {
      updatedCart = [...cart, { product, qty }];
    }
    setCart(updatedCart);
    if (!isCartOpen) setCartNotice({ name: product.name, qty });
  };

  const handleBuyNow = (product: ProductItem) => {
    if (!isLoggedIn) {
      try {
        localStorage.setItem('repiqr-redirect-after-login', 'checkout');
        localStorage.setItem('repiqr-buynow-cart', JSON.stringify([{ product, qty: 1 }]));
      } catch { /* ignore */ }
      onLogin();
      return;
    }
    // Hand checkout a one-shot single-item cart synchronously.
    try {
      localStorage.setItem('repiqr-buynow-cart', JSON.stringify([{ product, qty: 1 }]));
    } catch {
      addToCart(product, 1);
    }
    setIsCartOpen(false);
    if (onOpenCheckout) onOpenCheckout();
    else if (onStart) onStart();
  };

  const openCheckout = () => {
    setIsCartOpen(false);
    if (!isLoggedIn) {
      try {
        localStorage.setItem('repiqr-redirect-after-login', 'checkout');
      } catch { /* ignore */ }
      onLogin();
      return;
    }
    if (onOpenCheckout) onOpenCheckout();
    else if (onStart) onStart();
  };

  const handlePartnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerForm.name || !partnerForm.phone || !partnerForm.city) return;
    try {
      await saveDistributorApplication({
        userId: profile?.id,
        userEmail: profile?.email || '',
        userName: partnerForm.name,
        phone: partnerForm.phone,
        city: partnerForm.city,
        business: 'Retail / Franchise Partner',
        tier: partnerForm.tier,
      });
      setPartnerSubmitted(true);
    } catch {
      setPartnerSubmitted(true);
    }
  };

  useEffect(() => {
    if (isLoggedIn && (profile?.email || profile?.phone)) {
      getUserDistributorApplication(profile?.email || profile?.phone || '').then(setUserAppStatus);
    }
  }, [isLoggedIn, profile, isPartnerModalOpen]);

  return (
    <div className="min-h-screen bg-white font-sans text-neutral-900 antialiased selection:bg-neutral-900 selection:text-white">
      {/* ── NON-FLOATING NAVBAR ────────────────────────────────────────── */}
      <header
        className={`sticky top-0 inset-x-0 z-50 transition-all duration-200 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md border-b border-neutral-200/80 shadow-xs'
            : 'bg-white/90 backdrop-blur-sm border-b border-neutral-100'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16 sm:h-18">
          {/* Logo */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex cursor-pointer items-center focus:outline-none"
            aria-label={t.homeAria}
          >
            <img src={lightBgLogo} alt="RepiQR" className="h-7 sm:h-8 w-auto object-contain" />
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-[13.5px] font-medium text-neutral-600">
            <button
              onClick={() => handleSmoothScroll('hiw-section')}
              className="cursor-pointer hover:text-neutral-950 transition-colors"
            >
              {t.navLinks.hiw}
            </button>
            <button
              onClick={() => handleSmoothScroll('features-section')}
              className="cursor-pointer hover:text-neutral-950 transition-colors"
            >
              {t.navLinks.features}
            </button>
            <button
              onClick={() => handleSmoothScroll('products-section')}
              className="cursor-pointer hover:text-neutral-950 transition-colors"
            >
              {t.navLinks.products}
            </button>
            <button
              onClick={() => handleSmoothScroll('franchise-section')}
              className="cursor-pointer hover:text-neutral-950 transition-colors"
            >
              {t.navLinks.distributor}
            </button>
            <button
              onClick={() => handleSmoothScroll('faq-section')}
              className="cursor-pointer hover:text-neutral-950 transition-colors"
            >
              {t.navLinks.faq}
            </button>

            {/* ── Join Us: the trigger morphs into the service list ── */}
            <MorphingPopover open={isJoinMenuOpen} onOpenChange={setIsJoinMenuOpen}>
              <MorphingPopoverTrigger asChild>
                <button className="cursor-pointer flex items-center gap-1 hover:text-neutral-950 transition-colors">
                  <motion.span layoutId="join-us-label" layout="position">
                    {t.joinUs}
                  </motion.span>
                  <ChevronDown
                    size={13}
                    className={`transition-transform duration-200 ${
                      isJoinMenuOpen ? 'rotate-180 text-neutral-950' : 'text-neutral-400'
                    }`}
                  />
                </button>
              </MorphingPopoverTrigger>
              <MorphingPopoverContent className="left-1/2 top-full mt-2 w-60 -translate-x-1/2 p-2">
                <motion.p
                  layoutId="join-us-label"
                  layout="position"
                  className="px-3 pt-1 text-sm font-semibold text-neutral-950"
                >
                  {t.joinUs}
                </motion.p>
                <p className="px-3 pb-2 text-[11px] text-neutral-500">{t.chooseYourService}</p>
                <div className="max-h-64 overflow-y-auto space-y-0.5">
                  {SERVICE_TYPES.filter((type) => type.slug !== 'police').map((type) => (
                    <button
                      key={type.slug}
                      onClick={() => handleJoinSelect(type.slug)}
                      className="w-full cursor-pointer rounded-md px-3 py-2 text-left text-xs font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950 transition-colors"
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </MorphingPopoverContent>
            </MorphingPopover>
          </nav>

          {/* Right Action Bar */}
          <div className="hidden lg:flex items-center gap-3">
            {isLoggedIn && (
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative cursor-pointer p-2 rounded-md text-neutral-700 hover:bg-neutral-100 transition-colors"
                aria-label={t.openCartAria}
              >
                <ShoppingBag size={19} />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-neutral-950 px-1 text-[10px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            <div className="h-4 w-px bg-neutral-200 mx-1" />

            {isLoggedIn ? (
              <FlowButton tone="dark" size="sm" onClick={onOpenDashboard || onLogin}>
                <LayoutDashboard size={13} />
                <span>{t.dashboard}</span>
              </FlowButton>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onLogin}
                  className="cursor-pointer px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:text-neutral-950 transition-colors"
                >
                  {t.logIn}
                </button>
                <FlowButton tone="dark" size="sm" onClick={() => handleSmoothScroll('products-section')}>
                  {t.shopTags}
                </FlowButton>
              </div>
            )}
          </div>

          {/* Mobile Header Actions */}
          <div className="flex items-center gap-2 lg:hidden">
            {isLoggedIn && (
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 rounded-md text-neutral-800 hover:bg-neutral-100"
                aria-label={t.openCartAria}
              >
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-neutral-950 text-[9px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-neutral-800 hover:bg-neutral-100 border border-neutral-200 active:scale-95 transition-all"
              aria-label={t.toggleNavAria}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-neutral-200/80 bg-white px-4 py-5 shadow-xl lg:hidden max-h-[calc(100dvh-4.5rem)] overflow-y-auto overscroll-contain"
            >
              <div className="space-y-1.5 font-medium text-sm">
                <button
                  onClick={() => handleSmoothScroll('hiw-section')}
                  className="block w-full py-2.5 px-3 rounded-md text-left text-neutral-800 hover:bg-neutral-50 hover:text-neutral-950 transition-colors"
                >
                  {t.navLinks.hiw}
                </button>
                <button
                  onClick={() => handleSmoothScroll('features-section')}
                  className="block w-full py-2.5 px-3 rounded-md text-left text-neutral-800 hover:bg-neutral-50 hover:text-neutral-950 transition-colors"
                >
                  {t.navLinks.features}
                </button>
                <button
                  onClick={() => handleSmoothScroll('products-section')}
                  className="block w-full py-2.5 px-3 rounded-md text-left text-neutral-800 hover:bg-neutral-50 hover:text-neutral-950 transition-colors"
                >
                  {t.navLinks.products}
                </button>
                <button
                  onClick={() => handleSmoothScroll('franchise-section')}
                  className="block w-full py-2.5 px-3 rounded-md text-left text-neutral-800 hover:bg-neutral-50 hover:text-neutral-950 transition-colors"
                >
                  {t.navLinks.distributor}
                </button>
                <button
                  onClick={() => handleSmoothScroll('faq-section')}
                  className="block w-full py-2.5 px-3 rounded-md text-left text-neutral-800 hover:bg-neutral-50 hover:text-neutral-950 transition-colors"
                >
                  {t.navLinks.faq}
                </button>

                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (onOpenJoinUs) onOpenJoinUs();
                    else setIsJoinModalOpen(true);
                  }}
                  className="flex w-full items-center justify-between py-2.5 px-3 rounded-md text-left font-semibold text-neutral-950 hover:bg-neutral-50 border-t border-neutral-100 mt-2 pt-3 transition-colors"
                >
                  <span>{t.joinUsMobileLabel}</span>
                  <ArrowRight size={14} />
                </button>

                <div className="pt-3 border-t border-neutral-100 flex flex-col gap-2">
                  <FlowButton tone="dark" size="md" fullWidth onClick={() => handleSmoothScroll('products-section')}>
                    {t.shopSafetyTags}
                  </FlowButton>
                  {isLoggedIn ? (
                    <FlowButton
                      tone="outline"
                      size="md"
                      fullWidth
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        if (onOpenDashboard) onOpenDashboard();
                        else if (onLogin) onLogin();
                      }}
                    >
                      {t.dashboard}
                    </FlowButton>
                  ) : (
                    <FlowButton
                      tone="outline"
                      size="md"
                      fullWidth
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        if (onLogin) onLogin();
                      }}
                    >
                      {t.logIn}
                    </FlowButton>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── SECTION 01 · HERO — big headline + the real sticker with animated callouts ───── */}
      <section className="relative overflow-hidden bg-white">
        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 pb-16 pt-10 sm:px-6 lg:min-h-[calc(100vh-4.5rem)] lg:grid-cols-12 lg:gap-6 lg:px-8 lg:pb-12 lg:pt-6">
          <div className="lg:col-span-5">
            <h1
              className="text-[clamp(3.75rem,10vw,7.5rem)] font-extrabold leading-[0.84] tracking-[-0.055em] text-neutral-950"
              style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}
            >
              {t.hero.headingLine1}
              <br />
              {t.hero.headingLine2}
              <br />
              {t.hero.headingLine3}
            </h1>

            <p className="mt-8 max-w-[22rem] text-xl leading-snug text-neutral-800">
              {t.hero.subheading}
            </p>

            <FlowButton tone="outline" size="lg" className="mt-8" onClick={() => handleSmoothScroll('products-section')}>
              {t.hero.cta}
            </FlowButton>

            <div className="mt-12 flex items-center gap-4 text-[11px] font-medium tracking-[0.14em] text-neutral-700 lg:mt-20">
              <span>{t.hero.tagVehicle}</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#FFD500]" />
              <span>{t.hero.tagHome}</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#FFD500]" />
            </div>
          </div>

          <div className="lg:col-span-7">
            <HeroStickerShowcase />
          </div>
        </div>
      </section>

      {/* ── VERIFIED STATS STRIP ─────────────────────────────────────── */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="flex justify-center text-center">
            <div className="w-full max-w-xs rounded-md bg-neutral-50/70 p-6 border border-neutral-200/80 shadow-xs">
              <div className="text-3xl sm:text-5xl font-serif font-normal text-neutral-950">
                <Counter to={100} suffix="%" />
              </div>
              <p className="mt-2 text-xs sm:text-sm font-bold text-neutral-600 uppercase tracking-wider">
                {t.statsStrip.privacyLabel}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 02 · HOW IT WORKS (Podia 3 Colored Cards Style - Image 3) ─ */}
      <section id="hiw-section" className="scroll-mt-20 py-20 sm:py-24 bg-neutral-50/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
              {t.howItWorks.kicker}
            </p>
            <h2 className="text-3xl sm:text-5xl font-serif font-normal tracking-tight text-neutral-950">
              {t.howItWorks.title}
            </h2>
            <p className="mt-3 text-base text-neutral-600">
              {t.howItWorks.subtitle}
            </p>
          </Reveal>

          {/* 3 Step Cards with Podia-Style Distinct Pastel Fills (Image 3) */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {HOW_IT_WORKS_STEPS.map((step, idx) => {
              const bgTints = [
                'bg-[#fef9ee] border-[#faecd2]', // Honey/Caramel (Podia Step 1)
                'bg-[#f0f9ff] border-[#d9f0fe]', // Soft Sky Blue (Podia Step 2)
                'bg-[#faf5ff] border-[#f3e8ff]', // Soft Lilac/Purple (Podia Step 3)
              ];
              return (
                <Reveal key={step.step} delay={idx * 0.08}>
                  <div
                    className={`group rounded-md p-7 sm:p-8 border shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col justify-between ${bgTints[idx]}`}
                  >
                    <div>
                      {/* Step Identifier Header */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-950 text-white font-mono text-xs font-bold shadow-xs">
                          0{step.step}
                        </span>
                        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                          {t.howItWorks.stepWord} 0{step.step}
                        </span>
                      </div>

                      {/* Animated Type Mockup (No Photos!) */}
                      <div className="mb-5">
                        {step.step === 1 && <StickMockup />}
                        {step.step === 2 && <ScanMockup />}
                        {step.step === 3 && <AlertMockup />}
                      </div>

                      {/* Clean Editorial Title and Description */}
                      <h3 className="text-2xl font-serif font-normal text-neutral-950">
                        {t.howItWorks.steps[step.step - 1].title}
                      </h3>
                      <p className="mt-2 text-sm text-neutral-700 leading-relaxed">
                        {t.howItWorks.steps[step.step - 1].description}
                      </p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SECTION 03 · FEATURES (4 Clean Cards) ──────────────────────────── */}
      <section id="features-section" className="scroll-mt-20 py-20 sm:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
              {t.features.kicker}
            </p>
            <h2 className="text-3xl sm:text-5xl font-serif font-normal tracking-tight text-neutral-950">
              {t.features.title}
            </h2>
            <p className="mt-3 text-base text-neutral-600">
              {t.features.subtitle}
            </p>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            {FEATURES_LIST.map((f, i) => (
              <Reveal key={f.id} delay={i * 0.06}>
                <div className="group rounded-md bg-neutral-50/70 p-7 sm:p-8 border border-neutral-200/90 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className={`rounded-md px-3 py-0.5 text-xs font-semibold border ${f.badgeColor}`}>
                        {t.features.items[i].badge}
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-serif font-normal text-neutral-950">
                      {t.features.items[i].title}
                    </h3>
                    <p className="mt-2.5 text-sm text-neutral-600 leading-relaxed">
                      {t.features.items[i].description}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CRAFT-STYLE PLATFORM & AVAILABILITY SECTION (Image 2) ───── */}
      <section className="py-20 sm:py-24 bg-gradient-to-b from-white via-[#f0f8fd]/60 to-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <Reveal className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-5xl font-serif font-normal text-neutral-950 tracking-tight">
              {t.platform.title}
            </h2>
            <div className="mt-4 flex justify-center">
              <span className="rounded-md bg-sky-100/70 border border-sky-200/80 px-5 py-2 text-xs font-semibold text-sky-900 shadow-xs flex items-center gap-1.5">
                <Check size={14} className="stroke-[3] text-sky-700" />
                <span>{t.platform.badge}</span>
              </span>
            </div>
            <p className="mt-4 text-base text-neutral-600">
              {t.platform.subtitle}
            </p>
          </Reveal>

          {/* 2 White Rounded Cards (Desktop vs Mobile style from Craft Image 2) */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Card: Vehicles & Fleets */}
            <div className="rounded-md bg-white p-7 sm:p-9 border border-neutral-200/90 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-serif text-2xl font-normal text-neutral-950 mb-6">
                  {t.platform.vehiclesTitle}
                </h3>
                <div className="space-y-4 divide-y divide-neutral-100 text-sm">
                  <div className="pt-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Car size={18} className="text-neutral-700" />
                      <span className="font-medium text-neutral-900">{t.platform.windshield}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FlowButton tone="dark" size="sm" onClick={() => handleSmoothScroll('products-section')}>{t.platform.orderTag}</FlowButton>
                      <button
                        onClick={() => handleSmoothScroll('hiw-section')}
                        className="cursor-pointer rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold px-3 py-2 transition-all"
                      >
                        {t.platform.tryDemo}
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ShieldCheck size={18} className="text-neutral-700" />
                      <span className="font-medium text-neutral-900">{t.platform.motorcycles}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FlowButton tone="dark" size="sm" onClick={() => handleSmoothScroll('products-section')}>{t.platform.orderTag}</FlowButton>
                      <button
                        onClick={() => handleSmoothScroll('features-section')}
                        className="cursor-pointer rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold px-3 py-2 transition-all"
                      >
                        {t.platform.specs}
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Truck size={18} className="text-neutral-700" />
                      <span className="font-medium text-neutral-900">{t.platform.fleets}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FlowButton
                        tone="dark"
                        size="sm"
                        onClick={() => {
                          setPartnerForm((prev) => ({ ...prev, tier: 'Master State Partner (2500+ Units)' }));
                          setIsPartnerModalOpen(true);
                        }}
                      >
                        {t.platform.bulkQuote}
                      </FlowButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Card: Everyday & Pets */}
            <div className="rounded-md bg-white p-7 sm:p-9 border border-neutral-200/90 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-serif text-2xl font-normal text-neutral-950 mb-6">
                  {t.platform.everydayTitle}
                </h3>
                <div className="space-y-4 divide-y divide-neutral-100 text-sm">
                  <div className="pt-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Key size={18} className="text-neutral-700" />
                      <span className="font-medium text-neutral-900">{t.platform.luggage}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FlowButton tone="dark" size="sm" onClick={() => handleSmoothScroll('products-section')}>{t.platform.orderCharm}</FlowButton>
                      <button
                        onClick={() => handleSmoothScroll('hiw-section')}
                        className="cursor-pointer rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold px-3 py-2 transition-all"
                      >
                        {t.platform.tryDemo}
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ShieldAlert size={18} className="text-neutral-700" />
                      <span className="font-medium text-neutral-900">{t.platform.petCollars}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FlowButton tone="dark" size="sm" onClick={() => handleSmoothScroll('products-section')}>{t.platform.orderTag}</FlowButton>
                      <button
                        onClick={() => handleSmoothScroll('hiw-section')}
                        className="cursor-pointer rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold px-3 py-2 transition-all"
                      >
                        {t.platform.scanDemo}
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <DoorClosed size={18} className="text-neutral-700" />
                      <span className="font-medium text-neutral-900">{t.platform.gates}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FlowButton tone="dark" size="sm" onClick={() => handleSmoothScroll('products-section')}>{t.platform.orderPlate}</FlowButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Craft Signature Editorial Italic Quote from Image 2 */}
          <div className="mt-14 text-center">
            <blockquote className="font-serif italic text-xl sm:text-3xl text-neutral-800 max-w-2xl mx-auto leading-relaxed">
              {t.platform.quote}
            </blockquote>
          </div>
        </div>
      </section>

      {/* ── SECTION 04 · PRODUCTS (The Safety Collection) ──────────── */}
      <section id="products-section" className="scroll-mt-20 py-20 sm:py-24 bg-neutral-50/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
              {t.products.kicker}
            </p>
            <h2 className="text-3xl sm:text-5xl font-serif font-normal tracking-tight text-neutral-950">
              {t.products.title}
            </h2>
            <p className="mt-3 text-base text-neutral-600">
              {t.products.subtitle}
            </p>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
            {TWO_PRODUCTS.map((prod, i) => (
              <Reveal key={prod.id} delay={i * 0.08}>
                <div className="group rounded-md bg-white p-7 sm:p-9 border border-neutral-200/90 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full">
                  <div>
                    <div className="relative aspect-16/10 overflow-hidden rounded-md border border-neutral-200/80 bg-neutral-100">
                      <img
                        src={prod.img}
                        alt={prod.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <span className="absolute top-3.5 left-3.5 rounded-md bg-neutral-950 px-3.5 py-1 text-xs font-semibold text-white shadow-xs">
                        {prod.badge}
                      </span>
                    </div>

                    <div className="mt-6">
                      <h3 className="text-2xl font-serif font-normal text-neutral-950">{prod.name}</h3>
                      <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                        {prod.desc}
                      </p>

                      <div className="mt-5 flex items-baseline gap-2.5">
                        <span className="text-3xl sm:text-4xl font-serif font-normal text-neutral-950">
                          ₹{prod.price}
                        </span>
                        <span className="text-sm font-semibold text-neutral-400 line-through">
                          ₹{prod.mrp}
                        </span>
                        <span className="rounded-sm bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                          {t.products.save} ₹{prod.mrp - prod.price}
                        </span>
                      </div>

                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-neutral-500">
                        <Truck size={13} className="text-neutral-400" />
                        <span>{t.products.delivery}</span>
                      </div>

                      <ul className="mt-6 space-y-2.5">
                        {prod.features.slice(0, 3).map((f) => (
                          <li key={f} className="flex items-start gap-2.5 text-xs font-medium text-neutral-700">
                            <Check size={14} className="mt-0.5 shrink-0 text-neutral-950 stroke-[2.5]" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-8 border-t border-neutral-100 pt-5 flex items-center gap-3">
                    <FlowButton tone="dark" size="md" className="flex-1 py-3.5" onClick={() => handleBuyNow(prod)}>
                      {t.products.orderNow}
                    </FlowButton>
                    <button
                      onClick={() => addToCart(prod, 1)}
                      className="cursor-pointer rounded-md border border-neutral-200 p-3.5 text-neutral-700 hover:bg-neutral-50 transition-colors active:scale-95"
                      title={t.products.addToCartAria}
                      aria-label={t.products.addToCartAria}
                    >
                      <ShoppingBag size={18} />
                    </button>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 05 · FRANCHISE (Grow With RepiQR) ──────────── */}
      <section id="franchise-section" className="scroll-mt-20 py-20 sm:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
              {t.franchise.kicker}
            </p>
            <h2 className="text-3xl sm:text-5xl font-serif font-normal tracking-tight text-neutral-950">
              {t.franchise.title}
            </h2>
            <p className="mt-3 text-base text-neutral-600">
              {t.franchise.subtitle}
            </p>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {FRANCHISE_TIERS.map((tier, i) => (
              <Reveal key={tier.id} delay={i * 0.07}>
                <div
                  className={`rounded-md p-7 sm:p-8 flex flex-col justify-between h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 ${
                    tier.popular
                      ? 'bg-white border-2 border-neutral-950 shadow-md'
                      : 'bg-white border border-neutral-200/90 shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-serif font-normal text-neutral-950">{tier.name}</h3>
                      {tier.popular && (
                        <span className="rounded-md bg-neutral-950 px-3 py-1 text-xs font-semibold text-white">
                          {t.franchise.exclusive}
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="text-3xl font-serif font-normal text-neutral-950">{tier.price}</span>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-neutral-500">{tier.moq}</p>

                    <ul className="mt-6 space-y-2.5">
                      {t.franchise.tiers[tier.id as 'starter' | 'city' | 'master'].bullets.map((b) => (
                        <li key={b} className="flex items-start gap-2.5 text-xs font-medium text-neutral-700">
                          <Check size={14} className="mt-0.5 shrink-0 text-neutral-950 stroke-[2.5]" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => {
                      setPartnerForm((prev) => ({ ...prev, tier: tier.name }));
                      setIsPartnerModalOpen(true);
                    }}
                    className={`mt-8 w-full cursor-pointer rounded-md py-3.5 text-sm font-semibold transition-all active:scale-95 shadow-xs text-center flex items-center justify-center gap-2 ${
                      tier.popular
                        ? 'bg-neutral-950 hover:bg-neutral-800 text-white'
                        : 'bg-neutral-100 hover:bg-neutral-200/80 text-neutral-900 border border-neutral-200/80'
                    }`}
                  >
                    <span>{t.franchise.tiers[tier.id as 'starter' | 'city' | 'master'].cta}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </Reveal>
            ))}
          </div>

          {isLoggedIn && userAppStatus?.status === 'approved' && (
            <div className="mt-8">
              <button
                onClick={onOpenDistributorDashboard}
                className="w-full cursor-pointer rounded-md border border-neutral-200 bg-neutral-50 py-3.5 text-sm font-semibold text-neutral-900 hover:bg-neutral-100 transition-colors"
              >
                {t.franchise.openDistributorDashboard}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── SECTION 06 · FAQ (5 Questions) ───────────────────────────── */}
      <section id="faq-section" className="scroll-mt-20 py-20 sm:py-24 bg-neutral-50/50">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <Reveal className="mb-10 text-center">
            <h2 className="text-3xl sm:text-5xl font-serif font-normal tracking-tight text-neutral-950">
              {t.faq.title}
            </h2>
            <p className="mt-2 text-base text-neutral-600">
              {t.faq.subtitle}
            </p>
          </Reveal>

          <div className="space-y-3.5">
            {FAQS.map((faq, i) => {
              const open = expandedFaqId === faq.id;
              const faqCopy = t.faq.items[i];
              return (
                <Reveal key={faq.id} delay={i * 0.04}>
                  <div
                    className={`rounded-md border transition-all ${
                      open
                        ? 'bg-white border-neutral-300 shadow-xs'
                        : 'bg-white border-neutral-200/90 hover:border-neutral-300'
                    }`}
                  >
                    <button
                      onClick={() => setExpandedFaqId(open ? null : faq.id)}
                      className="flex w-full cursor-pointer items-center justify-between p-5 sm:p-6 text-left"
                      aria-expanded={open}
                    >
                      <span className="text-base sm:text-lg font-serif font-normal text-neutral-900">{faqCopy.question}</span>
                      <span className="ml-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-700">
                        {open ? <Minus size={14} /> : <Plus size={14} />}
                      </span>
                    </button>

                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <p className="px-5 pb-5 sm:px-6 sm:pb-6 text-sm text-neutral-600 leading-relaxed">
                            {faqCopy.answer}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SECTION 07 · FOOTER ──────────────────────────────────────── */}
      <footer className="bg-white py-16 sm:py-20 border-t border-neutral-100 text-neutral-600 text-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-10">
            <div className="md:col-span-4 space-y-3">
              <img src={lightBgLogo} alt="RepiQR" className="h-7 w-auto object-contain" />
              <p className="text-neutral-500">{t.footer.tagline}</p>
            </div>

            <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8">
              <div className="space-y-2">
                <div className="font-semibold text-neutral-950 uppercase tracking-wider text-[11px]">
                  {t.footer.productsHeading}
                </div>
                <ul className="space-y-1.5 text-neutral-600">
                  <li>
                    <button
                      onClick={() => handleSmoothScroll('products-section')}
                      className="cursor-pointer hover:text-neutral-950 transition-colors"
                    >
                      {t.footer.adhesiveTag}
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleSmoothScroll('products-section')}
                      className="cursor-pointer hover:text-neutral-950 transition-colors"
                    >
                      {t.footer.charmTag}
                    </button>
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <div className="font-semibold text-neutral-950 uppercase tracking-wider text-[11px]">
                  {t.footer.companyHeading}
                </div>
                <ul className="space-y-1.5 text-neutral-600">
                  <li>
                    <button
                      onClick={() => handleSmoothScroll('hiw-section')}
                      className="cursor-pointer hover:text-neutral-950 transition-colors"
                    >
                      {t.footer.howItWorks}
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={onOpenPrivacy}
                      className="cursor-pointer hover:text-neutral-950 transition-colors"
                    >
                      {t.footer.privacyPolicy}
                    </button>
                  </li>
                  <li>
                    <a
                      href="mailto:admin@repiqr.com"
                      className="hover:text-neutral-950 transition-colors"
                    >
                      {t.footer.contactLink}
                    </a>
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <div className="font-semibold text-neutral-950 uppercase tracking-wider text-[11px]">
                  {t.footer.contactHeading}
                </div>
                <ul className="space-y-1 text-neutral-600 leading-relaxed">
                  <li>Surendranagar, Gujarat 363530</li>
                  <li>
                    <a href="mailto:admin@repiqr.com" className="hover:text-neutral-950">
                      admin@repiqr.com
                    </a>
                  </li>
                  <li>
                    <a href="tel:+919313719720" className="hover:text-neutral-950">
                      +91 93137 19720
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-neutral-400">
            <p>© {new Date().getFullYear()} Worthite LLP. {t.footer.allRightsReserved}</p>
            <p>{t.footer.productOf}</p>
          </div>
        </div>
      </footer>

      {/* ── ADD-TO-CART TOAST ────────────────────────────────────────── */}
      <AnimatePresence>
        {cartNotice && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-md bg-neutral-950 text-white px-4 py-3 shadow-lg text-xs"
          >
            <Check size={14} className="text-emerald-400 stroke-[3]" />
            <span>
              {t.cartToast.addedPrefix} {cartNotice.qty > 1 ? `${cartNotice.qty}x ` : ''}
              {cartNotice.name} {t.cartToast.toCart}
            </span>
            <button
              onClick={() => setIsCartOpen(true)}
              className="cursor-pointer underline underline-offset-2 ml-2 font-semibold text-neutral-200 hover:text-white"
            >
              {t.cartToast.viewCart}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CART DRAWER ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsCartOpen(false)}
            />

            {/* Panel — half-height bottom sheet on mobile (expandable), right drawer on md+ */}
            <motion.aside
              role="dialog"
              aria-label={t.cartDrawer.title}
              initial={
                typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches
                  ? { x: '100%' }
                  : { y: '100%' }
              }
              animate={{ x: 0, y: 0 }}
              exit={
                typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches
                  ? { x: '100%' }
                  : { y: '100%' }
              }
              transition={{ duration: 0.28, ease: EASE }}
              drag="y"
              dragControls={cartDrag}
              dragListener={false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0.05, bottom: 0.5 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 90 || info.velocity.y > 600) {
                  if (isCartExpanded) setIsCartExpanded(false);
                  else setIsCartOpen(false);
                } else if (info.offset.y < -60) {
                  setIsCartExpanded(true);
                }
              }}
              className={`fixed bottom-0 left-0 right-0 z-[51] flex flex-col rounded-t-lg bg-white shadow-2xl transition-[max-height] duration-300 ${
                isCartExpanded ? 'max-h-[92dvh]' : 'max-h-[58dvh]'
              }
                         md:inset-y-0 md:bottom-auto md:left-auto md:right-0 md:top-0 md:h-full md:w-full md:max-w-[420px] md:rounded-none md:max-h-none md:border-l md:border-neutral-200`}
            >
              {/* Handle — mobile only: tap to toggle half / full, drag down to close */}
              <button
                type="button"
                onPointerDown={(e) => cartDrag.start(e)}
                onClick={() => setIsCartExpanded((v) => !v)}
                aria-label={isCartExpanded ? t.cartDrawer.collapseAria : t.cartDrawer.expandAria}
                className="md:hidden shrink-0 touch-none cursor-grab flex justify-center pt-2.5 pb-1"
              >
                <span className="h-1.5 w-11 rounded-full bg-neutral-300" />
              </button>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-1.5 pb-3 md:py-4 md:border-b md:border-neutral-100 shrink-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-[17px] font-bold tracking-tight text-neutral-950">{t.cartDrawer.title}</h3>
                  {cartCount > 0 && (
                    <span className="rounded-md bg-neutral-950 px-2 py-0.5 text-[11px] font-bold leading-none text-white">
                      {cartCount}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="cursor-pointer rounded-md w-10 h-10 -mr-2 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 transition-colors"
                  aria-label={t.cartDrawer.closeAria}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable items */}
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5">
                {cart.length === 0 ? (
                  <div className="py-10 text-center">
                    <div className="w-14 h-14 rounded-lg bg-neutral-100 flex items-center justify-center mx-auto mb-3">
                      <ShoppingBag size={24} className="text-neutral-400" />
                    </div>
                    <p className="font-semibold text-neutral-800 text-sm">{t.cartDrawer.empty}</p>
                    <FlowButton tone="dark" size="sm" className="mt-4" onClick={() => setIsCartOpen(false)}>
                      {t.cartDrawer.browseProducts}
                    </FlowButton>
                  </div>
                ) : (
                  <ul className="divide-y divide-neutral-100">
                    {cart.map((item) => (
                      <li key={item.product.id} className="flex gap-3.5 py-4">
                        <img
                          src={item.product.img}
                          alt={item.product.name}
                          className="h-[72px] w-[72px] rounded-lg object-cover shrink-0 bg-neutral-100 border border-neutral-100"
                        />
                        <div className="flex min-w-0 flex-1 flex-col justify-between">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-[14px] font-semibold text-neutral-950 leading-snug">
                                {item.product.name}
                              </p>
                              <p className="mt-0.5 text-[12px] text-neutral-500">
                                ₹{item.product.price.toLocaleString('en-IN')}
                              </p>
                            </div>
                            <p className="shrink-0 text-[14px] font-bold text-neutral-950">
                              ₹{(item.product.price * item.qty).toLocaleString('en-IN')}
                            </p>
                          </div>

                          <div className="mt-2 flex items-center justify-between">
                            {/* Qty stepper */}
                            <div className="flex items-center rounded-md border border-neutral-200 bg-white">
                              <button
                                onClick={() => updateCartQty(item.product.id, -1)}
                                className="cursor-pointer w-9 h-9 flex items-center justify-center rounded-sm text-neutral-600 hover:bg-neutral-100 active:scale-90 transition"
                                aria-label={`${t.cartDrawer.decreaseQtyAria} ${item.product.name}`}
                              >
                                <Minus size={14} />
                              </button>
                              <span className="min-w-6 text-center text-[13px] font-bold text-neutral-950 tabular-nums">
                                {item.qty}
                              </span>
                              <button
                                onClick={() => updateCartQty(item.product.id, 1)}
                                className="cursor-pointer w-9 h-9 flex items-center justify-center rounded-sm text-neutral-600 hover:bg-neutral-100 active:scale-90 transition"
                                aria-label={`${t.cartDrawer.increaseQtyAria} ${item.product.name}`}
                              >
                                <Plus size={14} />
                              </button>
                            </div>

                            <button
                              onClick={() => removeFromCart(item.product.id)}
                              className="cursor-pointer w-9 h-9 flex items-center justify-center rounded-sm text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              aria-label={`${t.cartDrawer.removeAria} ${item.product.name}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Sticky footer: total + checkout */}
              {cart.length > 0 && (
                <div className="shrink-0 border-t border-neutral-100 bg-white px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_-10px_24px_-14px_rgba(0,0,0,0.18)]">
                  <div className="mb-3 flex items-end justify-between">
                    <div>
                      <p className="text-[12.5px] font-medium text-neutral-500">
                        {t.cartDrawer.subtotal} · {cartCount} {cartCount !== 1 ? t.cartDrawer.items : t.cartDrawer.item}
                      </p>
                      <p className="text-[11px] text-neutral-400">{t.cartDrawer.shippingNote}</p>
                    </div>
                    <p className="text-[22px] font-bold leading-none tracking-tight text-neutral-950">
                      ₹{cartTotal.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <FlowButton tone="dark" size="md" fullWidth className="h-12" onClick={openCheckout}>
                    {t.cartDrawer.checkout}
                  </FlowButton>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="mt-1 w-full cursor-pointer h-10 text-[13px] font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
                  >
                    {t.cartDrawer.continueShopping}
                  </button>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── FRANCHISE INQUIRY MODAL (Podia Style Clean Form) ─────────── */}
      <AnimatePresence>
        {isPartnerModalOpen && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs"
              onClick={() => {
                setIsPartnerModalOpen(false);
                setPartnerSubmitted(false);
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="relative z-10 w-full max-w-md rounded-md bg-white p-8 border border-neutral-200 shadow-2xl"
            >
              <button
                onClick={() => {
                  setIsPartnerModalOpen(false);
                  setPartnerSubmitted(false);
                }}
                className="absolute right-4 top-4 cursor-pointer text-neutral-400 hover:text-neutral-800 p-1 rounded-md hover:bg-neutral-100"
                aria-label={t.partnerModal.closeAria}
              >
                <X size={18} />
              </button>

              {partnerSubmitted ? (
                <div className="py-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 mb-3">
                    <Check size={22} className="stroke-[2.5]" />
                  </div>
                  <h3 className="text-2xl font-serif font-normal text-neutral-950">{t.partnerModal.receivedTitle}</h3>
                  <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                    {t.partnerModal.thankYouPrefix} {partnerForm.name}. {t.partnerModal.thankYouSuffix}
                  </p>
                  <FlowButton
                    tone="dark"
                    size="md"
                    fullWidth
                    className="mt-6"
                    onClick={() => {
                      setIsPartnerModalOpen(false);
                      setPartnerSubmitted(false);
                    }}
                  >
                    {t.partnerModal.done}
                  </FlowButton>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h3 className="text-2xl font-serif font-normal text-neutral-950">{t.partnerModal.title}</h3>
                    <p className="text-xs font-semibold text-neutral-500 mt-1">{partnerForm.tier}</p>
                  </div>

                  <form onSubmit={handlePartnerSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                        {t.partnerModal.nameLabel}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={t.partnerModal.namePlaceholder}
                        value={partnerForm.name}
                        onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })}
                        className="w-full rounded-md border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                        {t.partnerModal.phoneLabel}
                      </label>
                      <PhoneInputWithCountry
                        required
                        value={partnerForm.phone}
                        onChange={(full) => setPartnerForm({ ...partnerForm, phone: full })}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                        {t.partnerModal.cityLabel}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={t.partnerModal.cityPlaceholder}
                        value={partnerForm.city}
                        onChange={(e) => setPartnerForm({ ...partnerForm, city: e.target.value })}
                        className="w-full rounded-md border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 transition-colors"
                      />
                    </div>

                    <FlowButton type="submit" tone="dark" size="md" fullWidth className="mt-2">
                      {t.partnerModal.submit}
                    </FlowButton>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── JOIN US SERVICE PARTNER MODAL (Podia Style Clean Form) ───── */}
      <AnimatePresence>
        {isJoinModalOpen && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs"
              onClick={() => {
                setIsJoinModalOpen(false);
                setJoinSubmitted(false);
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="relative z-10 w-full max-w-md rounded-md bg-white p-8 border border-neutral-200 shadow-2xl"
            >
              <button
                onClick={() => {
                  setIsJoinModalOpen(false);
                  setJoinSubmitted(false);
                }}
                className="absolute right-4 top-4 cursor-pointer text-neutral-400 hover:text-neutral-800 p-1 rounded-md hover:bg-neutral-100"
                aria-label={t.joinModal.closeAria}
              >
                <X size={18} />
              </button>

              {joinSubmitted ? (
                <div className="py-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 mb-3">
                    <Check size={22} className="stroke-[2.5]" />
                  </div>
                  <h3 className="text-2xl font-serif font-normal text-neutral-950">{t.joinModal.submittedTitle}</h3>
                  <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                    {t.joinModal.thankYouPrefix} {joinForm.name}. {t.joinModal.thankYouSuffix}
                  </p>
                  <FlowButton
                    tone="dark"
                    size="md"
                    fullWidth
                    className="mt-6"
                    onClick={() => {
                      setIsJoinModalOpen(false);
                      setJoinSubmitted(false);
                    }}
                  >
                    {t.joinModal.close}
                  </FlowButton>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h3 className="text-2xl font-serif font-normal text-neutral-950">{t.joinModal.title}</h3>
                    <p className="text-xs font-semibold text-neutral-500 mt-1">
                      {SERVICE_TYPES.find((s) => s.slug === selectedServiceSlug)?.label || t.joinModal.partnerServiceFallback}
                    </p>
                  </div>

                  <form onSubmit={handleJoinSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                        {t.joinModal.nameLabel}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={t.joinModal.namePlaceholder}
                        value={joinForm.name}
                        onChange={(e) => setJoinForm({ ...joinForm, name: e.target.value })}
                        className="w-full rounded-md border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                        {t.joinModal.phoneLabel}
                      </label>
                      <PhoneInputWithCountry
                        required
                        value={joinForm.phone}
                        onChange={(full) => setJoinForm({ ...joinForm, phone: full })}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                        {t.joinModal.cityLabel}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={t.joinModal.cityPlaceholder}
                        value={joinForm.city}
                        onChange={(e) => setJoinForm({ ...joinForm, city: e.target.value })}
                        className="w-full rounded-md border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 transition-colors"
                      />
                    </div>

                    <FlowButton type="submit" tone="dark" size="md" fullWidth loading={joinSubmitting} className="mt-2">
                      {joinSubmitting ? t.joinModal.submitting : t.joinModal.submit}
                    </FlowButton>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { LandingPageMaster as YellowThemeLandingPage };

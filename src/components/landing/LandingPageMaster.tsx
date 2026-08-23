import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  Car,
  Laptop,
  Dog,
  Luggage,
  Key,
  Shield,
  Lock,
  MessageSquare,
  Radio,
  Send,
  Download,
  Plus,
  Minus,
  Sparkles,
  ChevronRight,
  Menu,
  X,
  PhoneCall,
  Users,
  MapPin,
  CheckCircle2,
  Zap,
  Bike,
  DoorClosed,
  Boxes,
  HelpCircle,
  MessageCircle,
  Star,
  ShoppingBag,
  Eye,
  Check,
  Smartphone,
  Truck,
  RotateCcw,
  Store,
  HeartPulse,
  Umbrella,
  Play,
  Bell,
  Phone,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import PhoneInputWithCountry from '../common/PhoneInputWithCountry';
import {
  saveDistributorApplication,
  getUserDistributorApplication,
  DistributorApplication,
} from '../../lib/distributorService';

// Image assets
import stepImg1 from '../../../assets/landing-step-1.webp';
import stepImg2 from '../../../assets/landing-step-2.webp';
import stepImg3 from '../../../assets/landing-step-3.webp';
import stepImg4 from '../../../assets/landing-step-4.webp';
import stepImg5 from '../../../assets/landing-step-5.webp';
import logoForWhiteBg from '../../../assets/logo for wh bg.png';
import darkBgLogo from '../../../assets/darkbglogo.png';

// ── Types ──────────────────────────────────────────────────────────────────

export interface LandingPageMasterProps {
  onStart?: () => void;
  onLogin?: () => void;
  onOpenDistributorDashboard?: () => void;
  onOpenCheckout?: () => void;
  isEmbeddedInDashboard?: boolean;
}

interface ProductItem {
  id: string;
  name: string;
  desc: string;
  price: number;
  mrp: number;
  category: 'Vehicle' | 'Home' | 'Family' | 'Travel';
  badge: string;
  img: string;
  features: string[];
  rating?: number;
  reviewsCount?: number;
}

interface CartItem {
  product: ProductItem;
  qty: number;
}

interface AssetMockupRow {
  id: string;
  name: string;
  category: string;
  status: string;
  location: string;
  balance: string;
  icon: 'car' | 'laptop' | 'dog' | 'luggage';
}

interface FeatureItem {
  id: string;
  title: string;
  description: string;
  badge: string;
  previewTag: string;
  previewTarget: string;
  securityLevel: string;
  latency: string;
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

// ── Data Constants ─────────────────────────────────────────────────────────

const PRODUCTS: ProductItem[] = [
  {
    id: 'car-qr',
    name: 'Automobile Safety Tag',
    desc: 'Windshield and rear-glass tag that keeps your phone number off the glass.',
    price: 299,
    mrp: 599,
    category: 'Vehicle',
    badge: 'For vehicles',
    img: stepImg2,
    rating: 4.9,
    reviewsCount: 3840,
    features: ['Parking issue masked call', 'Tow & emergency alert', 'Works with any phone camera'],
  },
  {
    id: 'home-qr',
    name: 'Gate & Doorbell Plate',
    desc: 'Never miss deliveries or emergency visitors while keeping your number private.',
    price: 349,
    mrp: 699,
    category: 'Home',
    badge: 'For gates & doors',
    img: stepImg1,
    rating: 4.8,
    reviewsCount: 2190,
    features: ['Virtual visitor doorbell', 'Zero app required', 'Instant WhatsApp alert'],
  },
  {
    id: 'child-qr',
    name: 'Pet & Kid Safety Charm',
    desc: 'Compact charm for pet collars, backpacks, and school bags.',
    price: 249,
    mrp: 499,
    category: 'Family',
    badge: 'For pets & kids',
    img: stepImg5,
    rating: 4.9,
    reviewsCount: 1740,
    features: ['GPS location share', 'Multi-contact emergency tree', 'Masked call to guardians'],
  },
  {
    id: 'travel-qr',
    name: 'Luggage & Key Smart Tag',
    desc: 'Durable tag for suitcases and keychains to recover lost bags at airports.',
    price: 299,
    mrp: 599,
    category: 'Travel',
    badge: 'For bags & keys',
    img: stepImg3,
    rating: 4.9,
    reviewsCount: 2860,
    features: ['Airport baggage recovery', 'Instant finder chat', 'No app for the finder'],
  },
];

const HOW_IT_WORKS_STEPS = [
  {
    step: 1,
    title: 'Order your sticker',
    body: 'Pick a type — vehicle, gate, bag, keychain. Delivered across India.',
    img: stepImg1,
    badge: 'Pick Your Tag',
  },
  {
    step: 2,
    title: 'Stick it on',
    body: 'Peel and stick it where a finder will look first.',
    img: stepImg2,
    badge: 'Peel & Stick',
  },
  {
    step: 3,
    title: 'Anyone scans — no app',
    body: 'Camera → secure proxy page. Nothing to install or login.',
    img: stepImg5,
    badge: 'Zero App Scan',
  },
  {
    step: 4,
    title: 'They reach you',
    body: 'Call, message, GPS, or alert. Your number is never visible.',
    img: stepImg3,
    badge: 'Masked Call & GPS',
  },
  {
    step: 5,
    title: 'You get pinged instantly',
    body: 'Push + SMS + WhatsApp. Resolve any issue in one tap.',
    img: stepImg4,
    badge: 'Instant Multi-Channel Alert',
  },
];

const MOCKUP_ASSETS: AssetMockupRow[] = [
  {
    id: 'asset-1',
    name: 'BMW M340i Sedan',
    category: 'Vehicle Tag',
    status: 'Active Shield',
    location: 'Downtown Hub (Zone A)',
    balance: '₹48,500/yr',
    icon: 'car',
  },
  {
    id: 'asset-2',
    name: 'MacBook Pro 16"',
    category: 'Valuables Plate',
    status: 'Protected',
    location: 'Co-Working Studio',
    balance: '₹12,400/yr',
    icon: 'laptop',
  },
  {
    id: 'asset-3',
    name: 'Bella (Golden Retriever)',
    category: 'Pet Smart Collar',
    status: 'Safe',
    location: 'Home Perimeter',
    balance: '₹8,200/yr',
    icon: 'dog',
  },
  {
    id: 'asset-4',
    name: 'Rimowa Classic Cabin',
    category: 'Travel Luggage Tag',
    status: 'Standby',
    location: 'Terminal 3 Baggage',
    balance: '₹15,800/yr',
    icon: 'luggage',
  },
];

interface DistributorTier {
  id: string;
  name: string;
  badge: string;
  minUnits: string;
  priceDisplay: string;
  margin: string;
  desc: string;
  features: string[];
  isPopular?: boolean;
  ctaText: string;
}

const DISTRIBUTOR_TIERS: DistributorTier[] = [
  {
    id: 'retailer-starter',
    name: 'Retailer Starter Pack',
    badge: 'Garages & Retail Shops',
    minUnits: '50 - 100 Units',
    priceDisplay: 'Contact for Pricing',
    margin: '40%+ Retail Margin',
    desc: 'Ideal for auto garages, bike accessory shops, mobile stores, and local locksmiths.',
    features: [
      '50x Pre-activated 3M weatherproof smart tags',
      'Free premium acrylic POS counter display rack',
      'Full marketing promotional posters & flyers kit',
      'Dealer dashboard access with instant QR restock',
      '48-hour priority doorstep logistics',
    ],
    ctaText: 'Inquire Retail Pack',
  },
  {
    id: 'city-franchise',
    name: 'City Exclusive Franchise',
    badge: 'Exclusive Territory Partner',
    minUnits: '500 - 1,000 Units',
    priceDisplay: 'Contact for Pricing',
    margin: '50%+ Exclusive Margin',
    isPopular: true,
    desc: 'Sole exclusive distributor rights for your city or district with localized customer lead distribution.',
    features: [
      'Exclusive city territory rights & protection',
      '500x Smart QR tags across all categories',
      'Customized localized dealer branding & shop sign kit',
      'Dedicated territory account manager & priority support',
      'All local website buyer leads redirected to you',
      'Quarterly volume bonuses & maximum tier rebate',
    ],
    ctaText: 'Apply for City Franchise',
  },
  {
    id: 'master-partner',
    name: 'Master State / Fleet Partner',
    badge: 'Regional Master Rights',
    minUnits: '2,500+ Units',
    priceDisplay: 'Contact for Pricing',
    margin: '60%+ Master Margin',
    desc: 'State-level master franchise & large fleet deployments for corporate and logistics networks.',
    features: [
      'State-wide master franchise distribution exclusivity',
      'Custom white-label QR sticker batch generation',
      'Enterprise REST API & master fleet sync console',
      'Sub-dealer network management & commission control',
      '24/7 dedicated enterprise technical support',
    ],
    ctaText: 'Contact for Master Rights',
  },
];

const INFRASTRUCTURE_CARDS = [
  {
    letter: 'R',
    title: 'Global Edge Network',
    description:
      'The scan page is served from Cloudflare\u2019s edge network, so it opens quickly on a phone even on mobile data.',
    color: '#FACC15',
  },
  {
    letter: 'A',
    title: 'Backup Contacts',
    description:
      'Every tag can carry more than one contact, so an emergency alert reaches your backup people, not just you.',
    color: '#F59E0B',
  },
  {
    letter: 'P',
    title: 'Privacy-First Architecture',
    description:
      'Your name, address and number are never rendered on the scan page. A finder only ever sees what helps them help you.',
    color: '#EAB308',
  },
  {
    letter: 'I',
    title: 'Universal Zero-App Scan',
    description:
      'A plain HTTPS link that any iOS or Android camera app opens directly. No app, no login, no sign-up.',
    color: '#FBBF24',
  },
];

const FAQS: FaqItem[] = [
  {
    id: 'faq-1',
    question: 'How does the RapiQR tag protect my personal phone number?',
    answer:
      'When someone scans your QR tag, they interact with a secure proxy page. When they tap "Call Owner", our telecom cloud server connects both parties through a masked virtual line. Neither your number nor their number is ever revealed to each other.',
  },
  {
    id: 'faq-2',
    question: 'Does the person scanning my tag need to download an app?',
    answer:
      'No. The scanner simply uses their regular smartphone camera or Google Lens. The scan instantly opens a high-speed, responsive web application without requiring any software installation, login, or sign-up.',
  },
  {
    id: 'faq-3',
    question: 'Can I add multiple emergency contacts to a single sticker?',
    answer:
      'Yes. In your Client Dashboard, you can register primary, secondary, and tertiary emergency contacts. You can also specify distinct roles such as family members, vehicle insurance agents, or fleet managers.',
  },
  {
    id: 'faq-4',
    question: 'What happens if my parked car is blocking someone or in an emergency?',
    answer:
      'The person can scan your windshield tag and choose "Notify for Parking Issue", "Wrong Parking", or "Emergency". You receive an SMS, WhatsApp and email alert with their message and, if they shared it, their location.',
  },
  {
    id: 'faq-5',
    question: 'How durable are the physical tags against rain and sunlight?',
    answer:
      'Tags are printed on laminated weatherproof stock and are meant to live outdoors on a windshield, gate or collar. If a tag wears out or stops scanning, contact support and we will replace it \u2014 your tag ID and its contacts stay the same.',
  },
  {
    id: 'faq-6',
    question: 'Can I reassign or transfer a tag if I sell my car or replace an item?',
    answer:
      'Absolutely. With one click in your Client Dashboard, you can update vehicle details, change linked contact numbers, or transfer ownership of the tag securely to another user.',
  },
];

const BADGE_ITEMS = [
  { label: 'Vehicles', icon: Car },
  { label: 'Motorcycles', icon: Bike },
  { label: 'Pets', icon: Dog },
  { label: 'Luggage', icon: Luggage },
  { label: 'Electronics', icon: Laptop },
  { label: 'Keychains', icon: Key },
  { label: 'Gates & Doors', icon: DoorClosed },
  { label: 'Cargo & Fleet', icon: Boxes },
];

// ── Real QR Code SVG Component ─────────────────────────────────────────────

function RealQRCodeSvg({ size = 160 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto max-w-[160px] mx-auto shadow-sm rounded-xl"
    >
      <rect width="120" height="120" fill="white" rx="10" />
      {/* Top Left Finder */}
      <rect x="8" y="8" width="34" height="34" fill="#0F172A" rx="6" />
      <rect x="14" y="14" width="22" height="22" fill="white" rx="3" />
      <rect x="19" y="19" width="12" height="12" fill="#0F172A" rx="2" />

      {/* Top Right Finder */}
      <rect x="78" y="8" width="34" height="34" fill="#0F172A" rx="6" />
      <rect x="84" y="14" width="22" height="22" fill="white" rx="3" />
      <rect x="89" y="19" width="12" height="12" fill="#0F172A" rx="2" />

      {/* Bottom Left Finder */}
      <rect x="8" y="78" width="34" height="34" fill="#0F172A" rx="6" />
      <rect x="14" y="84" width="22" height="22" fill="white" rx="3" />
      <rect x="19" y="89" width="12" height="12" fill="#0F172A" rx="2" />

      {/* Matrix Data Modules */}
      <rect x="48" y="10" width="7" height="7" fill="#0F172A" rx="1.5" />
      <rect x="62" y="10" width="7" height="7" fill="#0F172A" rx="1.5" />
      <rect x="48" y="24" width="7" height="7" fill="#0F172A" rx="1.5" />
      <rect x="62" y="24" width="7" height="7" fill="#0F172A" rx="1.5" />
      <rect x="10" y="48" width="7" height="7" fill="#0F172A" rx="1.5" />
      <rect x="24" y="48" width="7" height="7" fill="#0F172A" rx="1.5" />
      <rect x="34" y="58" width="7" height="7" fill="#0F172A" rx="1.5" />
      <rect x="78" y="48" width="7" height="7" fill="#0F172A" rx="1.5" />
      <rect x="92" y="48" width="7" height="7" fill="#0F172A" rx="1.5" />
      <rect x="104" y="58" width="7" height="7" fill="#0F172A" rx="1.5" />
      <rect x="48" y="78" width="7" height="7" fill="#0F172A" rx="1.5" />
      <rect x="62" y="86" width="7" height="7" fill="#0F172A" rx="1.5" />
      <rect x="48" y="98" width="7" height="7" fill="#0F172A" rx="1.5" />
      <rect x="78" y="78" width="10" height="10" fill="#0F172A" rx="2" />
      <rect x="96" y="92" width="12" height="12" fill="#0F172A" rx="2" />

      {/* Center Shield / Brand Badge */}
      <rect x="43" y="43" width="34" height="34" fill="#FACC15" rx="7" stroke="#0F172A" strokeWidth="2.5" />
      <text
        x="60"
        y="65"
        fill="#0F172A"
        fontSize="13"
        fontWeight="900"
        textAnchor="middle"
        fontFamily="system-ui, sans-serif"
      >
        RQ
      </text>
    </svg>
  );
}

// ── Master Component ───────────────────────────────────────────────────────

export default function LandingPageMaster({
  onStart,
  onLogin,
  onOpenDistributorDashboard,
  onOpenCheckout,
  isEmbeddedInDashboard = false,
}: LandingPageMasterProps) {
  const { isLoggedIn, profile } = useAuth();

  // Navigation
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Cart state persisted
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('namoqr-cart');
      return saved ? (JSON.parse(saved) as CartItem[]) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<ProductItem | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('namoqr-cart', JSON.stringify(cart));
    } catch { /* ignore */ }
  }, [cart]);

  // Scroll reveal — one observer for every [data-reveal] on the page. Each
  // element is unobserved the moment it lands, so nothing is watched twice and
  // scrolling back up doesn't replay the animation.
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (!els.length) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      els.forEach((el) => el.classList.add('is-revealed'));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-revealed');
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Category filter
  const [activeCategory, setActiveCategory] = useState<'All' | 'Vehicle' | 'Home' | 'Family' | 'Travel'>('All');

  // How it works active step
  const [activeHiwStep, setActiveHiwStep] = useState(0);

  // Hero interactive state
  const [selectedAssetId, setSelectedAssetId] = useState<string>('asset-1');
  const [simulatedAlertActive, setSimulatedAlertActive] = useState(false);


  // Interactive Live Demo Simulator state
  const [demoActionAlert, setDemoActionAlert] = useState<string | null>(null);

  // FAQ accordion state
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(FAQS[0].id);

  // Partner Modal State
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [partnerForm, setPartnerForm] = useState({
    name: '',
    phone: '',
    city: '',
    business: 'Auto Accessories Shop',
    tier: 'Retail Kit (50 Units)',
  });
  const [partnerSubmitted, setPartnerSubmitted] = useState(false);
  const [userAppStatus, setUserAppStatus] = useState<DistributorApplication | null>(null);

  // Google Font Injection
  useEffect(() => {
    const link = document.createElement('link');
    link.href =
      'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  // Fetch distributor application status
  useEffect(() => {
    if (isLoggedIn && (profile?.email || profile?.phone)) {
      getUserDistributorApplication(profile?.email || profile?.phone || '').then(setUserAppStatus);
    } else {
      setUserAppStatus(null);
    }
  }, [isLoggedIn, profile, isPartnerModalOpen]);

  // Autofill partner form
  useEffect(() => {
    if (isPartnerModalOpen && profile) {
      setPartnerForm((prev) => ({
        ...prev,
        name: prev.name || profile.fullName || '',
        phone: prev.phone || profile.phoneNumber || '',
      }));
    }
  }, [isPartnerModalOpen, profile]);

  const handleSmoothScroll = (targetId: string) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleTestPing = () => {
    setSimulatedAlertActive(true);
    setTimeout(() => setSimulatedAlertActive(false), 2600);
  };

  const handleToggleFaq = (faqId: string) => {
    setExpandedFaqId((prev) => (prev === faqId ? null : faqId));
  };

  const addToCart = (product: ProductItem, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, qty: item.qty + qty } : item
        );
      }
      return [...prev, { product, qty }];
    });
    setIsCartOpen(true);
  };

  const buyNow = (product: ProductItem) => {
    addToCart(product, 1);
    openCheckout();
  };

  const openCheckout = () => {
    setIsCartOpen(false);
    if (onOpenCheckout) {
      onOpenCheckout();
    } else {
      onStart?.();
    }
  };

  const handleDemoTrigger = (actionType: 'parking' | 'gps' | 'emergency') => {
    if (actionType === 'parking') {
      setDemoActionAlert('📱 Parking issue alert sent! Owner notified via WhatsApp + SMS.');
    } else if (actionType === 'gps') {
      setDemoActionAlert('📍 GPS coordinates shared securely with the tag owner.');
    } else {
      setDemoActionAlert('🚨 Emergency alert dispatched to owner + 3 designated responders.');
    }
    setTimeout(() => setDemoActionAlert(null), 3500);
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
        business: partnerForm.business,
        tier: partnerForm.tier,
      });
      setPartnerSubmitted(true);
    } catch {
      setPartnerSubmitted(true);
    }
  };

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'All') return PRODUCTS;
    return PRODUCTS.filter((p) => p.category === activeCategory);
  }, [activeCategory]);

  const cartSubtotal = cart.reduce((sum, i) => sum + i.product.price * i.qty, 0);

  const renderAssetIcon = (icon: AssetMockupRow['icon']) => {
    switch (icon) {
      case 'car':
        return <Car size={15} className="text-amber-500" />;
      case 'laptop':
        return <Laptop size={15} className="text-blue-500" />;
      case 'dog':
        return <Dog size={15} className="text-emerald-500" />;
      case 'luggage':
        return <Luggage size={15} className="text-purple-500" />;
      default:
        return <Key size={15} className="text-amber-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-950 font-sans selection:bg-amber-400 selection:text-black">
      
      {/* ── 1. NAVBAR (FULL-WIDTH NON-FLOATING HEADER) ─────────────── */}
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/90 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          
          {/* Brand Logo */}
          <button
            onClick={() => handleSmoothScroll('hero-section')}
            className="flex items-center group cursor-pointer focus:outline-hidden"
          >
            <img
              src={logoForWhiteBg}
              alt="RapiQR Smart Safety"
              className="h-8 sm:h-9 w-auto object-contain group-hover:scale-105 transition-transform"
            />
          </button>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-xs font-bold text-slate-700">
            <button
              onClick={() => handleSmoothScroll('hiw-section')}
              className="hover:text-slate-950 transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <button
              onClick={() => handleSmoothScroll('products-section')}
              className="hover:text-slate-950 transition-colors cursor-pointer"
            >
              Products &amp; Uses
            </button>
            <button
              onClick={() => handleSmoothScroll('demo-section')}
              className="hover:text-slate-950 transition-colors cursor-pointer"
            >
              Live Scan Demo
            </button>
            <button
              onClick={() => handleSmoothScroll('distributor-section')}
              className="hover:text-slate-950 transition-colors cursor-pointer"
            >
              Franchise
            </button>
            <button
              onClick={() => handleSmoothScroll('pricing-section')}
              className="hover:text-slate-950 transition-colors cursor-pointer"
            >
              Pricing
            </button>
            <button
              onClick={() => handleSmoothScroll('faq-section')}
              className="hover:text-slate-950 transition-colors cursor-pointer"
            >
              FAQ
            </button>
          </nav>

          {/* Actions & Cart */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => setIsCartOpen(true)}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-800 relative transition-colors cursor-pointer"
              aria-label="Open Shopping Cart"
            >
              <ShoppingBag size={18} />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-amber-400 text-slate-950 font-black text-[9px] rounded-full flex items-center justify-center shadow-xs">
                {cart.length > 0 ? cart.reduce((s, i) => s + i.qty, 0) : 1}
              </span>
            </button>

            {isEmbeddedInDashboard ? (
              <button
                onClick={onOpenCheckout}
                className="px-4 py-2 text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
              >
                <Sparkles size={14} />
                <span>Order New Tags</span>
              </button>
            ) : (
              <>
                <button
                  onClick={onLogin}
                  className="text-xs font-bold text-slate-700 hover:text-slate-950 transition-colors cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={onStart || onOpenCheckout}
                  className="px-5 py-2.5 text-xs font-black text-white bg-slate-950 hover:bg-slate-850 rounded-full transition-all flex items-center gap-2 shadow-sm hover:shadow-md group cursor-pointer active:scale-95"
                >
                  <span>Get Protected</span>
                  <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform text-amber-400" />
                </button>
              </>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setIsCartOpen(true)}
              className="p-2 rounded-lg bg-slate-100 text-slate-800 relative"
            >
              <ShoppingBag size={17} />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 text-slate-950 font-bold text-[9px] rounded-full flex items-center justify-center">
                {cart.length > 0 ? cart.reduce((s, i) => s + i.qty, 0) : 1}
              </span>
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-700 hover:text-black rounded-lg focus:outline-hidden"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-5 pt-3 pb-6 space-y-3 shadow-xl animate-fade-in text-left">
            <button onClick={() => { setIsMobileMenuOpen(false); handleSmoothScroll('hiw-section'); }} className="block w-full py-2 text-sm font-bold text-slate-800">
              How It Works
            </button>
            <button onClick={() => { setIsMobileMenuOpen(false); handleSmoothScroll('products-section'); }} className="block w-full py-2 text-sm font-bold text-slate-800">
              Products &amp; Uses
            </button>
            <button onClick={() => { setIsMobileMenuOpen(false); handleSmoothScroll('demo-section'); }} className="block w-full py-2 text-sm font-bold text-slate-800">
              Live Scan Demo
            </button>
            <button onClick={() => { setIsMobileMenuOpen(false); handleSmoothScroll('distributor-section'); }} className="block w-full py-2 text-sm font-bold text-slate-800">
              Franchise Opportunity
            </button>
            <button onClick={() => { setIsMobileMenuOpen(false); handleSmoothScroll('pricing-section'); }} className="block w-full py-2 text-sm font-bold text-slate-800">
              Pricing Plans
            </button>
            <button onClick={() => { setIsMobileMenuOpen(false); handleSmoothScroll('faq-section'); }} className="block w-full py-2 text-sm font-bold text-slate-800">
              Frequently Asked Questions
            </button>

            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <button
                onClick={() => { setIsMobileMenuOpen(false); onLogin?.(); }}
                className="w-full py-3 text-center text-xs font-bold text-slate-800 bg-slate-100 rounded-xl"
              >
                Sign In to Dashboard
              </button>
              <button
                onClick={() => { setIsMobileMenuOpen(false); onStart?.(); }}
                className="w-full py-3 text-center text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-xs"
              >
                Get Started Now →
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ── 2. HERO SECTION (MINIMALIST CLEAN CANVAS WITH ANIMATED FLOW ARROWS) ── */}
      <section id="hero-section" className="relative pt-8 pb-16 sm:pt-12 sm:pb-24 overflow-hidden bg-white text-slate-950 min-h-[640px] lg:min-h-[700px] flex items-center justify-center border-b border-slate-100">
        
        {/* Crisp subtle dot grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#000 1.2px, transparent 1.2px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* ── UNIFIED HERO CANVAS CONTAINER ── */}
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 z-10">
          
          {/* Animated Connecting Flow Lines with Directional Arrows */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none hidden lg:block z-0" viewBox="0 0 1200 640" fill="none" preserveAspectRatio="none">
            <defs>
              <marker id="hero-arrow-gold" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#F59E0B" />
              </marker>
              <linearGradient id="flow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.4" />
              </linearGradient>
            </defs>

            {/* Flow Curve 1: Left Finder Scanner ➔ Center QR Hub */}
            <path
              d="M 270 230 C 370 200, 430 250, 500 260"
              stroke="url(#flow-gradient)"
              strokeWidth="2.5"
              strokeDasharray="6 6"
              className="animate-flow-line"
              markerEnd="url(#hero-arrow-gold)"
            />

            {/* Flow Curve 2: Center QR Hub ➔ Right Owner Alert */}
            <path
              d="M 700 260 C 770 250, 830 200, 930 230"
              stroke="url(#flow-gradient)"
              strokeWidth="2.5"
              strokeDasharray="6 6"
              className="animate-flow-line"
              markerEnd="url(#hero-arrow-gold)"
            />

            {/* Animated Pulsing Node Anchors */}
            <circle cx="270" cy="230" r="5" fill="#F59E0B" className="animate-pulse" />
            <circle cx="500" cy="260" r="5" fill="#F59E0B" className="animate-pulse" />
            <circle cx="700" cy="260" r="5" fill="#F59E0B" className="animate-pulse" />
            <circle cx="930" cy="230" r="5" fill="#F59E0B" className="animate-pulse" />
          </svg>

          {/* ── LEFT FLOATING CARD: Step 1 Public Scan (Finder) ── */}
          <div className="hidden lg:block absolute top-12 left-4 xl:left-8 z-20 w-[240px] xl:w-[260px] bg-white rounded-3xl p-4 border border-slate-200/90 shadow-xl shadow-slate-900/5 text-left hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-slate-950 text-amber-400 text-[10px] font-black grid place-items-center">
                  01
                </span>
                <span className="font-extrabold text-xs text-slate-900">Finder Camera</span>
              </div>
              <span className="text-[9px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">
                0.18s Scan
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 mb-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-800 mb-1">
                <span>🚗 Porsche 911 GT3</span>
                <span className="text-emerald-600 text-[10px]">● Scanned</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-snug">
                Zero app or registration required for finders.
              </p>
            </div>

            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              <span>Routing through secure IVR...</span>
            </div>
          </div>

          {/* ── RIGHT FLOATING CARD: Step 2 Masked Alert (Protected Owner) ── */}
          <div className="hidden lg:block absolute top-12 right-4 xl:right-8 z-20 w-[240px] xl:w-[260px] bg-white rounded-3xl p-4 border border-slate-200/90 shadow-xl shadow-slate-900/5 text-left hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white text-[10px] font-black grid place-items-center">
                  02
                </span>
                <span className="font-extrabold text-xs text-slate-900">Protected Owner</span>
              </div>
              <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                100% Masked
              </span>
            </div>

            <div className="space-y-1.5 mb-2">
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-800">
                <span className="flex items-center gap-1.5">📞 Cloud IVR Call</span>
                <span className="text-emerald-600 text-xs">✓</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-800">
                <span className="flex items-center gap-1.5">💬 WhatsApp SOS</span>
                <span className="text-emerald-600 text-xs">✓</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
              <span>Mobile Number:</span>
              <span className="text-slate-800 font-mono font-bold">●●●●●●8921</span>
            </div>
          </div>

          {/* ── CENTRAL HERO CONTENT (CLEAN & BALANCED) ── */}
          <div className="relative z-10 max-w-2xl sm:max-w-3xl mx-auto text-center py-4 sm:py-6">
            
            {/* Top Pill & Safety Proof */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black bg-slate-100 text-slate-900 border border-slate-200 shadow-xs mb-4">
              <span>🇮🇳</span>
              <span>India's 1st Smartest QR Security Tag</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            {/* Central Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-[66px] font-black text-slate-950 tracking-tight leading-[1.08]">
              India's 1st Smartest <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 bg-clip-text text-transparent">QR Security</span> &amp; Safety Hub
            </h1>

            <p className="text-sm sm:text-base text-slate-600 font-medium max-w-xl mx-auto mt-4 leading-relaxed">
              Instant 0.18s camera scan connects finders via masked IVR calls, WhatsApp SOS &amp; live GPS — without ever revealing your personal mobile number.
            </p>

            {/* Zero Exposure Switcher & Integrations */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-6">
              <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-1.5 rounded-full border border-slate-200 shadow-xs text-xs font-bold text-slate-800">
                <span>100% Number Private</span>
                <span className="w-7 h-4 bg-emerald-500 rounded-full flex items-center p-0.5 justify-end">
                  <span className="w-3 h-3 bg-white rounded-full shadow-xs" />
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                <span className="px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 shadow-xs">WhatsApp SOS</span>
                <span className="px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 shadow-xs">Masked IVR</span>
                <span className="px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 shadow-xs">Live GPS</span>
              </div>
            </div>

            {/* High-Converting Dual CTA Buttons */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <button
                onClick={onStart || onOpenCheckout}
                className="px-8 py-4 rounded-full bg-slate-950 hover:bg-slate-850 text-white font-black text-sm shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2.5 group"
              >
                <span>Order Smart QR Tag</span>
                <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform text-amber-400" />
              </button>

              <button
                onClick={() => handleSmoothScroll('demo-section')}
                className="px-6 py-4 rounded-full bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 font-bold text-sm shadow-sm hover:border-slate-300 transition-all cursor-pointer flex items-center gap-2"
              >
                <Smartphone size={16} className="text-amber-500" />
                <span>Try Live Demo</span>
              </button>
            </div>

            {/* Trust Micro-Bullets */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-500 font-semibold">
              <span className="flex items-center gap-1.5">🚚 Free 48h Delivery</span>
              <span className="flex items-center gap-1.5">🛡️ 3-Year 3M Adhesive</span>
              <span className="flex items-center gap-1.5">⚡ Zero App Needed</span>
            </div>

          </div>

          {/* ── MOBILE ADAPTATION: Horizontal Cards Row for small screens ── */}
          <div className="lg:hidden mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-left">
              <div className="font-extrabold text-xs text-slate-950 mb-1">01. 📱 Instant Scan (Finder)</div>
              <p className="text-[11px] text-slate-500">0.18s instant camera scan with zero app downloads.</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-left">
              <div className="font-extrabold text-xs text-slate-950 mb-1">02. 🔒 Masked IVR Alert (Owner)</div>
              <p className="text-[11px] text-slate-500">Connects calls seamlessly while keeping your phone number 100% private.</p>
            </div>
          </div>

        </div>
      </section>

      {/* ── 3. BENEFIT TRUST STRIP (THEME: SLEEK OBSIDIAN BLACK) ───────── */}
      <section className="py-8 bg-slate-950 text-white border-y border-slate-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center sm:text-left">
            <div className="flex items-center gap-3.5 justify-center sm:justify-start">
              <div className="w-11 h-11 rounded-2xl bg-amber-400/10 border border-amber-400/25 text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
                <Truck size={20} />
              </div>
              <div>
                <div className="font-extrabold text-sm text-white">Free Standard Delivery</div>
                <div className="text-xs text-slate-400">Tracked shipping across India</div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 justify-center sm:justify-start">
              <div className="w-11 h-11 rounded-2xl bg-amber-400/10 border border-amber-400/25 text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
                <Shield size={20} />
              </div>
              <div>
                <div className="font-extrabold text-sm text-white">Live Scan Alerts</div>
                <div className="text-xs text-slate-400">WhatsApp, SMS &amp; email</div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 justify-center sm:justify-start">
              <div className="w-11 h-11 rounded-2xl bg-amber-400/10 border border-amber-400/25 text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
                <Lock size={20} />
              </div>
              <div>
                <div className="font-extrabold text-sm text-white">100% Number Privacy</div>
                <div className="text-xs text-slate-400">Virtual IVR call masking</div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 justify-center sm:justify-start">
              <div className="w-11 h-11 rounded-2xl bg-amber-400/10 border border-amber-400/25 text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
                <Zap size={20} />
              </div>
              <div>
                <div className="font-extrabold text-sm text-white">Zero App Needed</div>
                <div className="text-xs text-slate-400">Standard camera scan</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. PRODUCTS & STOREFRONT SECTION (THEME: CRISP PURE WHITE) ─── */}
      <section id="products-section" className="py-20 sm:py-28 bg-white text-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-14" data-reveal>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-950 border border-amber-300 mb-3 shadow-xs">
              <ShoppingBag size={13} className="text-amber-600" />
              <span>Smart QR Safety Catalog</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight leading-tight">
              One QR. Lifetime Protection.
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-3 max-w-xl mx-auto">
              Buy once, activate in 10 seconds. Automotive-grade 3M adhesive with ₹0 recurring subscription fees.
            </p>

            {/* Elevated Category Filter Pills */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-2.5 mt-8">
              {[
                { key: 'All', label: 'All Products', icon: '✨' },
                { key: 'Vehicle', label: 'Vehicles & Bikes', icon: '🚗' },
                { key: 'Home', label: 'Home & Gates', icon: '🏠' },
                { key: 'Family', label: 'Pets & Family', icon: '🐾' },
                { key: 'Travel', label: 'Travel & Luggage', icon: '✈️' },
              ].map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key as any)}
                  className={`flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    activeCategory === cat.key
                      ? 'bg-slate-950 text-white shadow-md scale-105'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/60'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid - Clean & Simple */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div
                data-reveal
                key={product.id}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs hover:shadow-lg hover:border-amber-300 transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  {/* Media Frame */}
                  <div className="relative h-48 bg-slate-50 overflow-hidden flex items-center justify-center p-4">
                    <img
                      src={product.img}
                      alt={product.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-400 text-slate-950 shadow-xs">
                      {product.badge}
                    </span>
                    <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900/80 text-white">
                      {Math.round(((product.mrp - product.price) / product.mrp) * 100)}% OFF
                    </span>
                  </div>

                  {/* Details */}
                  <div className="p-5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block mb-1">
                      {product.category}
                    </span>
                    <h3 className="font-bold text-base text-slate-950 mb-1.5 group-hover:text-amber-600 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                      {product.desc}
                    </p>

                    {/* Price */}
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black text-slate-950">₹{product.price}</span>
                      <span className="text-xs text-slate-400 line-through font-medium">₹{product.mrp}</span>
                      <span className="ml-auto text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                        Lifetime Valid
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-5 pt-0">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => buyNow(product)}
                      className="flex-1 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-850 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <span>Buy Now</span>
                      <ArrowRight size={13} className="text-amber-400" />
                    </button>
                    <button
                      onClick={() => addToCart(product)}
                      className="p-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold transition-colors cursor-pointer"
                      aria-label="Add to cart"
                      title="Add to cart"
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Trust Assurance Strip */}
          <div className="mt-14 pt-8 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4 text-center sm:text-left">
            <div className="flex items-center gap-2.5 justify-center sm:justify-start">
              <span className="text-lg">🚚</span>
              <span className="text-xs font-bold text-slate-700">Free 48h Dispatch in India</span>
            </div>
            <div className="flex items-center gap-2.5 justify-center sm:justify-start">
              <span className="text-lg">🛡️</span>
              <span className="text-xs font-bold text-slate-700">3-Year Weatherproof Guarantee</span>
            </div>
            <div className="flex items-center gap-2.5 justify-center sm:justify-start">
              <span className="text-lg">🔒</span>
              <span className="text-xs font-bold text-slate-700">100% Masked Number Proxy</span>
            </div>
            <div className="flex items-center gap-2.5 justify-center sm:justify-start">
              <span className="text-lg">⚡</span>
              <span className="text-xs font-bold text-slate-700">Zero App Required for Finders</span>
            </div>
          </div>

        </div>
      </section>

      {/* ── 5. HOW IT WORKS FLOW WITH ARROWS & CLEAN BOXES (THEME: SLEEK OBSIDIAN) ─── */}
      <section id="hiw-section" className="py-20 sm:py-28 bg-[#0B0F19] text-white border-y border-slate-800/80 relative overflow-hidden">
        
        {/* Subtle background tech pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#FFF 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16" data-reveal>
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black bg-amber-400 text-slate-950 shadow-md mb-3">
              <Zap size={13} className="text-slate-950" />
              <span>Interactive Safety Pipeline</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              How RapiQR Works in 5 Steps
            </h2>
            <p className="text-slate-400 text-sm sm:text-base font-medium mt-2 max-w-xl mx-auto">
              From unboxing to lifetime safety — everything is automated with zero app downloads.
            </p>
          </div>

          {/* 5-Step Clean Boxes Flow Connected by Animated Arrows */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 relative items-stretch">
            {HOW_IT_WORKS_STEPS.map((step, idx) => (
              <div key={step.step} data-reveal className="relative flex flex-col">
                
                {/* Premium Obsidian Step Box */}
                <div className="h-full bg-slate-900/90 text-white rounded-3xl p-5 border border-slate-800 shadow-2xl flex flex-col justify-between relative group hover:border-amber-400 hover:shadow-amber-500/10 hover:-translate-y-2 transition-all duration-300">
                  
                  <div>
                    {/* Top Row: Number Badge & Tag */}
                    <div className="flex items-center justify-between mb-3.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-md shadow-amber-400/20">
                        0{step.step}
                      </div>
                      <span className="text-[10px] font-black text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2.5 py-0.5 rounded-md">
                        {step.badge}
                      </span>
                    </div>

                    {/* Step Image Frame */}
                    <div className="h-36 rounded-2xl bg-slate-950 overflow-hidden mb-4 border border-slate-700/60 shadow-inner relative group-hover:border-amber-400/50 transition-colors">
                      <img
                        src={step.img}
                        alt={step.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />
                    </div>

                    {/* Text Details */}
                    <h3 className="font-black text-sm sm:text-base text-white mb-1.5 group-hover:text-amber-300 transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed font-normal">
                      {step.body}
                    </p>
                  </div>

                  {/* Step Footer Indicator */}
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                    <span>Phase 0{step.step}</span>
                    <span className="text-amber-400 flex items-center gap-1 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      <span>Live Setup</span>
                    </span>
                  </div>
                </div>

                {/* Connecting Flow Arrow Between Boxes (Visible on Desktop) with Animated Pulse */}
                {idx < HOW_IT_WORKS_STEPS.length - 1 && (
                  <div className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-amber-400 text-slate-950 items-center justify-center shadow-xl border-2 border-amber-300 pointer-events-none group-hover:scale-110 transition-transform">
                    <ArrowRight size={15} className="stroke-[3] animate-pulse" />
                  </div>
                )}

              </div>
            ))}
          </div>

          {/* Bottom Journey Summary Banner */}
          <div className="mt-12 p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-lg shrink-0 shadow-md">
                ✓
              </div>
              <div>
                <div className="font-extrabold text-sm sm:text-base text-white">
                  100% Zero App &amp; Zero Number Exposure Guaranteed
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Anyone scans with their native camera to immediately initiate encrypted proxy communication.
                </div>
              </div>
            </div>

            <button
              onClick={onOpenCheckout}
              className="px-7 py-3 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap shadow-lg hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <span>Order Your Safety Kit</span>
              <ArrowRight size={15} />
            </button>
          </div>

        </div>
      </section>

    

      {/* ── 8. INFRASTRUCTURE & STATS (THEME: WARM RADIANT GOLDEN YELLOW) ── */}
      <section id="infrastructure-section" className="py-24 sm:py-32 bg-gradient-to-b from-[#FFFDF0] via-[#FEF08A] to-[#FACC15] text-slate-950 relative border-t border-amber-300">
        
        {/* Background Grid */}
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="max-w-3xl mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black bg-slate-950 text-amber-400 shadow-md mb-4">
              <span>High-Availability Cloud Network</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight leading-tight mb-4">
              Built on ultra-reliable infrastructure <br className="hidden sm:inline" />
              <span>for zero-delay safety.</span>
            </h2>
            <p className="text-base sm:text-lg text-slate-800 font-medium">
              When accidents or parking emergencies happen, every millisecond counts. 
              Our distributed architecture guarantees immediate connection.
            </p>
          </div>

          {/* 4 Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            {INFRASTRUCTURE_CARDS.map((card, idx) => (
              <div
                data-reveal
                key={idx}
                className="p-6 rounded-3xl bg-slate-950 text-white border border-slate-800 shadow-xl hover:border-amber-400 transition-all duration-300 group hover:-translate-y-1"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-base text-slate-950 mb-5 group-hover:scale-110 transition-transform shadow-md"
                  style={{ backgroundColor: card.color }}
                >
                  {card.letter}
                </div>

                <h3 className="text-base font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">
                  {card.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  {card.description}
                </p>
              </div>
            ))}
          </div>

          {/* Stats Bar */}
          <div className="pt-12 border-t border-amber-400/60 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left divide-y md:divide-y-0 md:divide-x divide-amber-400/60">
            <div className="pt-6 md:pt-0">
              <div className="text-4xl sm:text-5xl font-black text-slate-950 font-sans tracking-tight mb-1">
                0
              </div>
              <div className="text-sm font-bold text-slate-900 mb-0.5">
                Apps to install
              </div>
              <div className="text-xs text-slate-700 font-medium">
                The finder opens a link, nothing else
              </div>
            </div>

            <div className="pt-6 md:pt-0 md:pl-8">
              <div className="text-4xl sm:text-5xl font-black text-slate-950 font-sans tracking-tight mb-1">
                3
              </div>
              <div className="text-sm font-bold text-slate-900 mb-0.5">
                Alert channels per scan
              </div>
              <div className="text-xs text-slate-700 font-medium">
                WhatsApp, SMS and email, together
              </div>
            </div>

            <div className="pt-6 md:pt-0 md:pl-8">
              <div className="text-4xl sm:text-5xl font-black text-slate-950 font-sans tracking-tight mb-1">
                6
              </div>
              <div className="text-sm font-bold text-slate-900 mb-0.5">
                Tag types available
              </div>
              <div className="text-xs text-slate-700 font-medium">
                Car, bike, home, pet, kids and luggage
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── 9. PRICING BUNDLES SECTION (THEME: CRISP PURE WHITE) ──────── */}
      <section id="pricing-section" className="py-20 sm:py-28 bg-white text-slate-950 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16" data-reveal>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-950 border border-amber-300 mb-3 shadow-xs">
              <Sparkles size={13} className="text-amber-600" />
              <span>Safety Plans &amp; Pricing</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
              Pick Your Safety Pack
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-2">
              Lifetime validity with ₹0 recurring subscription fees. Contact our team for customized volume pricing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            
            {/* Plan 1 */}
            <div className="rounded-3xl p-7 bg-slate-50 border border-slate-200 flex flex-col justify-between hover:shadow-lg transition-all">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Solo Starter Pack</span>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-950">Contact Us</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">Single vehicle or personal asset safety tag</p>

                <ul className="mt-6 space-y-3 text-xs text-slate-700">
                  <li className="flex items-center gap-2">
                    <Check size={15} className="text-amber-500 shrink-0" />
                    <span>1x 3M Weatherproof Smart Sticker</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={15} className="text-amber-500 shrink-0" />
                    <span>Masked call &amp; WhatsApp alerts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={15} className="text-amber-500 shrink-0" />
                    <span>Lifetime cloud dashboard access</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => {
                  setPartnerForm((prev) => ({ ...prev, tier: 'Retail Kit (50 Units)' }));
                  setIsPartnerModalOpen(true);
                }}
                className="mt-8 w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <span>Contact for Pricing</span>
                <ArrowRight size={14} className="text-amber-400" />
              </button>
            </div>

            {/* Plan 2: Best Value */}
            <div className="rounded-3xl p-7 bg-slate-950 text-white border-2 border-amber-400 shadow-xl flex flex-col justify-between relative transform md:-translate-y-2">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 bg-amber-400 text-slate-950 font-black text-[11px] rounded-full uppercase tracking-wide shadow-sm">
                Most Popular Pack
              </span>
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Family Trio Bundle</span>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">Contact Us</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">3 Tags for car, bike, and home gate or pets</p>

                <ul className="mt-6 space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check size={15} className="text-amber-400 shrink-0" />
                    <span>3x Multi-Category Smart Tags</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={15} className="text-amber-400 shrink-0" />
                    <span>Multi-responder emergency safety tree</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={15} className="text-amber-400 shrink-0" />
                    <span>Free priority 48h doorstep shipping</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => {
                  setPartnerForm((prev) => ({ ...prev, tier: 'Retail Kit (50 Units)' }));
                  setIsPartnerModalOpen(true);
                }}
                className="mt-8 w-full py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-colors cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                <span>Contact for Pricing</span>
                <ArrowRight size={14} className="text-slate-950" />
              </button>
            </div>

            {/* Plan 3 */}
            <div className="rounded-3xl p-7 bg-slate-50 border border-slate-200 flex flex-col justify-between hover:shadow-lg transition-all">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Society &amp; Fleet</span>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-950">Contact Us</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">Bulk tags for apartments, schools &amp; logistics</p>

                <ul className="mt-6 space-y-3 text-xs text-slate-700">
                  <li className="flex items-center gap-2">
                    <Check size={15} className="text-amber-500 shrink-0" />
                    <span>Custom branded logo &amp; colors</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={15} className="text-amber-500 shrink-0" />
                    <span>Admin master fleet dashboard</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={15} className="text-amber-500 shrink-0" />
                    <span>Dedicated account relationship manager</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => {
                  setPartnerForm((prev) => ({ ...prev, tier: 'State Partner (2500+ Units)' }));
                  setIsPartnerModalOpen(true);
                }}
                className="mt-8 w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <span>Inquire Bulk Quote</span>
                <ArrowRight size={14} className="text-amber-400" />
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* ── 10. DISTRIBUTORSHIP & FRANCHISE OPPORTUNITY (THEME: SLEEK OBSIDIAN BLACK) ─── */}
      <section id="distributor-section" className="py-24 sm:py-32 bg-slate-950 text-white border-y border-amber-400/30 relative overflow-hidden">
        
        {/* Background Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16" data-reveal>
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black bg-amber-400/10 text-amber-400 border border-amber-400/30 uppercase tracking-wider mb-4 shadow-sm">
              <span>Franchise &amp; Retail Partnership</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Earn 40% to 60% Margins as a RapiQR Distributor
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-3 max-w-2xl mx-auto">
              Partner with India's fastest-growing smart QR safety brand. Supply local garages, auto accessory stores, gated societies, and retail networks in your city.
            </p>
          </div>

          {/* 3 Distributor Tier Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-16">
            {DISTRIBUTOR_TIERS.map((tier) => (
              <div
                key={tier.id}
                className={`rounded-3xl p-7 sm:p-8 flex flex-col justify-between transition-all duration-300 relative group hover:-translate-y-1.5 ${
                  tier.isPopular
                    ? 'bg-slate-900 border-2 border-amber-400 shadow-2xl ring-4 ring-amber-400/20'
                    : 'bg-slate-900/60 border border-slate-800 hover:border-amber-400/50 shadow-xl'
                }`}
              >
                {tier.isPopular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-400 text-slate-950 font-black text-[11px] rounded-full uppercase tracking-wider shadow-md">
                    🔥 Exclusive Territory
                  </span>
                )}

                <div>
                  {/* Top Details */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-black text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-md">
                      {tier.badge}
                    </span>
                    <span className="text-xs font-bold text-slate-400">{tier.minUnits}</span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-white mb-2 group-hover:text-amber-400 transition-colors">
                    {tier.name}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-6">
                    {tier.desc}
                  </p>

                  {/* Margin & Pricing Box */}
                  <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 mb-6">
                    <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                      Distributor Margin
                    </div>
                    <div className="text-2xl font-black text-amber-400 mb-1">
                      {tier.margin}
                    </div>
                    <div className="text-xs font-semibold text-slate-300">
                      Pricing: <span className="text-white font-bold">{tier.priceDisplay}</span>
                    </div>
                  </div>

                  {/* Feature Highlights */}
                  <div className="space-y-2.5 mb-6">
                    {tier.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2 text-xs text-slate-300 font-medium">
                        <CheckCircle2 size={14} className="text-amber-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card CTA */}
                <button
                  onClick={() => {
                    const tierName =
                      tier.id === 'retailer-starter'
                        ? 'Retail Kit (50 Units)'
                        : tier.id === 'city-franchise'
                        ? 'City Franchise (500 Units)'
                        : 'State Partner (2500+ Units)';
                    setPartnerForm((prev) => ({ ...prev, tier: tierName }));
                    setIsPartnerModalOpen(true);
                  }}
                  className={`w-full py-3.5 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95 ${
                    tier.isPopular
                      ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                      : 'bg-white hover:bg-slate-100 text-slate-950'
                  }`}
                >
                  <span>{tier.ctaText}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Bottom Franchise Guarantee Strip */}
          <div className="pt-8 border-t border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-6 text-center sm:text-left">
            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <span className="text-2xl">💰</span>
              <div>
                <div className="text-xs font-bold text-white">0% Royalty Fees</div>
                <div className="text-[11px] text-slate-400">Keep 100% of your earnings</div>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <span className="text-2xl">📍</span>
              <div>
                <div className="text-xs font-bold text-white">Exclusive Territory Protection</div>
                <div className="text-[11px] text-slate-400">No competing dealers in your city</div>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <span className="text-2xl">⚡</span>
              <div>
                <div className="text-xs font-bold text-white">24h Quick Onboarding</div>
                <div className="text-[11px] text-slate-400">Start selling within 1 day</div>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <span className="text-2xl">📦</span>
              <div>
                <div className="text-xs font-bold text-white">Doorstep Pan-India Logistics</div>
                <div className="text-[11px] text-slate-400">Priority insured 48h shipping</div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── 13. FAQ ACCORDION SECTION (THEME: WARM SAND YELLOW) ────────── */}
      <section id="faq-section" className="py-24 sm:py-32 bg-gradient-to-b from-[#FFFDF2] to-[#FEF9C3] text-slate-950 relative border-t border-amber-300">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="mb-14 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-slate-950 text-amber-400 mb-3 shadow-xs">
                <HelpCircle size={13} className="text-amber-400" />
                <span>Got Questions?</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950">
                Frequently asked questions
              </h2>
              <p className="text-sm sm:text-base text-slate-800 font-medium mt-2">
                Everything you need to know about safety tags, proxy calling, and privacy.
              </p>
            </div>

            <a
              href="mailto:support@rapiqr.com"
              className="self-start sm:self-auto px-5 py-2.5 text-xs font-bold text-slate-950 bg-white border border-slate-200 hover:bg-amber-100 rounded-full transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <MessageCircle size={14} className="text-amber-600" />
              <span>Contact Support</span>
            </a>
          </div>

          {/* Accordion Items */}
          <div className="divide-y divide-slate-200 bg-white rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-md">
            {FAQS.map((faq) => {
              const isExpanded = expandedFaqId === faq.id;
              return (
                <div key={faq.id} className="py-5">
                  <button
                    onClick={() => handleToggleFaq(faq.id)}
                    className="w-full flex items-center justify-between text-left gap-4 group cursor-pointer focus:outline-hidden"
                    aria-expanded={isExpanded}
                  >
                    <span className={`text-base sm:text-lg font-bold transition-colors ${
                      isExpanded ? 'text-amber-600' : 'text-slate-900 group-hover:text-amber-600'
                    }`}>
                      {faq.question}
                    </span>

                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      isExpanded ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 text-slate-600 group-hover:bg-amber-100'
                    }`}>
                      {isExpanded ? <Minus size={16} /> : <Plus size={16} />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="mt-3 pr-10 text-sm sm:text-base text-slate-600 leading-relaxed animate-fade-in">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ── 14. CTA BANNER SECTION (THEME: SLEEK OBSIDIAN BLACK) ───────── */}
      <section className="py-16 sm:py-24 bg-slate-950 text-white border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl p-8 sm:p-16 overflow-hidden bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 shadow-2xl border border-amber-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            
            {/* Ambient Lighting */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/25 rounded-full blur-3xl pointer-events-none" />

            {/* Content */}
            <div className="relative max-w-xl text-slate-950">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-950 text-amber-400 mb-4 shadow-sm">
                <Sparkles size={13} className="text-amber-400" />
                <span>Instant Dispatch &amp; Activation</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight mb-3">
                Your safety protection <br className="hidden sm:inline" />
                is seconds away.
              </h2>

              <p className="text-base sm:text-lg font-bold text-slate-900/90 leading-relaxed">
                Order your weatherproof smart tag kit today. Free 48-hour delivery with 3-year durability guarantee.
              </p>
            </div>

            {/* CTA Button */}
            <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              <button
                onClick={onStart || onOpenCheckout}
                className="px-9 py-4 bg-slate-950 hover:bg-slate-850 text-white font-black text-sm rounded-full transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-950/40 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>Get Started Now</span>
                <ArrowRight size={16} className="text-amber-400" />
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ── 15. DARK FOOTER WITH WATERMARK ──────────────────────────── */}
      <footer className="relative bg-slate-950 text-white overflow-hidden pt-16 pb-12 sm:pt-20 sm:pb-16 border-t border-slate-900">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-16 border-b border-slate-850">
            
            {/* Brand Column */}
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-2.5">
                <img
                  src={darkBgLogo}
                  alt="RapiQR Smart Safety"
                  className="h-8 sm:h-9 w-auto object-contain"
                />
              </div>

              <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                Universal Smart QR safety ecosystem. Protecting thousands of vehicles, valuables, 
                pets, and families with instant masked telephony and live scan alerts.
              </p>

              <div className="flex items-center gap-2 text-xs text-slate-400 pt-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>All proxy gateway nodes operational</span>
              </div>
            </div>

            {/* Links Grid */}
            <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 text-xs sm:text-sm">
              
              <div className="space-y-3">
                <div className="font-bold text-white uppercase tracking-wider text-[11px] text-amber-400">
                  Products
                </div>
                <ul className="space-y-2 text-slate-400">
                  <li>
                    <button onClick={onOpenCheckout} className="hover:text-white transition-colors cursor-pointer">
                      Vehicle Safety Plates
                    </button>
                  </li>
                  <li>
                    <button onClick={onOpenCheckout} className="hover:text-white transition-colors cursor-pointer">
                      Valuables &amp; Bag Tags
                    </button>
                  </li>
                  <li>
                    <button onClick={onOpenCheckout} className="hover:text-white transition-colors cursor-pointer">
                      Pet Smart Collars
                    </button>
                  </li>
                  <li>
                    <button onClick={onOpenCheckout} className="hover:text-white transition-colors cursor-pointer">
                      Custom Enterprise Tags
                    </button>
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <div className="font-bold text-white uppercase tracking-wider text-[11px] text-amber-400">
                  Platform
                </div>
                <ul className="space-y-2 text-slate-400">
                  <li>
                    <button onClick={onLogin} className="hover:text-white transition-colors cursor-pointer">
                      Client Dashboard
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setIsPartnerModalOpen(true)}
                      className="hover:text-white transition-colors cursor-pointer"
                    >
                      Distributor Portal
                    </button>
                  </li>
                  <li>
                    <a href="#privacy-section" className="hover:text-white transition-colors">
                      Privacy Architecture
                    </a>
                  </li>
                  <li>
                    <a href="#faq-section" className="hover:text-white transition-colors">
                      Help Center &amp; FAQ
                    </a>
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <div className="font-bold text-white uppercase tracking-wider text-[11px] text-amber-400">
                  Legal &amp; Trust
                </div>
                <ul className="space-y-2 text-slate-400">
                  <li>
                    <span className="hover:text-white transition-colors cursor-pointer">
                      Privacy Policy
                    </span>
                  </li>
                  <li>
                    <span className="hover:text-white transition-colors cursor-pointer">
                      Terms of Service
                    </span>
                  </li>
                  <li>
                    <span className="hover:text-white transition-colors cursor-pointer">
                      Security Whitepaper
                    </span>
                  </li>
                  <li>
                    <span className="hover:text-white transition-colors cursor-pointer">
                      3-Year Warranty
                    </span>
                  </li>
                </ul>
              </div>

            </div>

          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
            <div>
              © {new Date().getFullYear()} RapiQR Inc. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <span>Crafted with precision for instant asset safety</span>
            </div>
          </div>

        </div>

        {/* Giant Watermark Typography at bottom */}
        <div className="absolute -bottom-10 sm:-bottom-16 left-1/2 -translate-x-1/2 select-none pointer-events-none opacity-[0.03] text-[120px] sm:text-[220px] lg:text-[280px] font-black tracking-tighter text-white whitespace-nowrap uppercase font-sans">
          RAPIQR
        </div>
      </footer>

      {/* ── 16. CART DRAWER ─────────────────────────────────────────── */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[500] flex justify-end animate-fade-in">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setIsCartOpen(false)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl z-10 flex flex-col justify-between p-6 overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2 font-bold text-lg text-slate-900">
                  <ShoppingBag size={19} className="text-amber-500" />
                  <span>Your Safety Kit Cart</span>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                  <X size={18} />
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <ShoppingBag size={40} className="mx-auto mb-3 opacity-30 text-amber-500" />
                  <p className="font-semibold text-slate-800 text-sm">Your cart is empty</p>
                  <p className="text-xs text-slate-400 mt-1">Add items from the store to protect your assets</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 mt-4 space-y-4">
                  {cart.map((item) => (
                    <div key={item.product.id} className="pt-4 flex items-center justify-between gap-3">
                      <img src={item.product.img} alt={item.product.name} className="w-14 h-14 rounded-xl object-cover border border-slate-100" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs text-slate-900 truncate">{item.product.name}</h4>
                        <div className="text-xs font-bold text-slate-950 mt-1">₹{item.product.price}</div>
                      </div>
                      <div className="flex items-center gap-2 border border-slate-200 rounded-lg p-1">
                        <button
                          onClick={() => {
                            setCart((prev) =>
                              prev
                                .map((i) => (i.product.id === item.product.id ? { ...i, qty: i.qty - 1 } : i))
                                .filter((i) => i.qty > 0)
                            );
                          }}
                          className="p-1 hover:bg-slate-100 rounded-sm"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-xs font-bold px-1">{item.qty}</span>
                        <button
                          onClick={() => {
                            setCart((prev) =>
                              prev.map((i) => (i.product.id === item.product.id ? { ...i, qty: i.qty + 1 } : i))
                            );
                          }}
                          className="p-1 hover:bg-slate-100 rounded-sm"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between text-base font-black text-slate-950 mb-4">
                  <span>Subtotal:</span>
                  <span>₹{cartSubtotal}</span>
                </div>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    if (onOpenCheckout) onOpenCheckout();
                    else onStart?.();
                  }}
                  className="w-full py-3.5 rounded-xl bg-slate-950 hover:bg-slate-850 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-colors cursor-pointer"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight size={14} className="text-amber-400" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 17. DISTRIBUTORSHIP APPLICATION MODAL ───────────────────── */}
      {isPartnerModalOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative border border-gray-100 p-6 sm:p-8 text-left">
            <button
              onClick={() => { setIsPartnerModalOpen(false); setPartnerSubmitted(false); }}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors cursor-pointer"
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Phone / WhatsApp Number</label>
                      <PhoneInputWithCountry
                        required
                        value={partnerForm.phone}
                        onChange={full => setPartnerForm({ ...partnerForm, phone: full })}
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

export { LandingPageMaster as YellowThemeLandingPage };

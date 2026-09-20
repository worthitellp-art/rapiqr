import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
  useInView,
  useMotionValueEvent,
  useReducedMotion,
} from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
  Car,
  Laptop,
  Dog,
  Luggage,
  Key,
  Lock,
  Plus,
  Minus,
  Menu,
  X,
  MapPin,
  CheckCircle2,
  Zap,
  Bike,
  DoorClosed,
  Boxes,
  Check,
  Bell,
  ChevronDown,
  Handshake,
  Mail,
  Loader2,
  ShoppingBag,
  Star,
  Truck,
  LayoutDashboard,
  Shield,
  ShieldCheck,
  Phone,
  Signal,
  Wifi,
  BatteryFull,
  Send,
  MessageCircle,
  AlertTriangle,
  Siren,
  PhoneCall,
  Stethoscope,
  Wrench,
  Disc,
  ShieldAlert,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { landingTranslations } from '../../i18n/landingTranslations';
import LanguageSwitcher from '../common/LanguageSwitcher';
import PhoneInputWithCountry from '../common/PhoneInputWithCountry';
import {
  saveDistributorApplication,
  getUserDistributorApplication,
  DistributorApplication,
} from '../../lib/distributorService';
import { apiClient } from '../../lib/apiClient';
import { SERVICE_TYPES } from '../scan/tileActions';
import { getServiceMeta } from '../scan/serviceMeta';
import { STICKER_CATEGORIES } from '../../stickerModules';
import { DEFAULT_PRODUCTS, mapApiShopProduct, type ProductItem } from '../../data/products';

// Image assets
import stepImg1 from '../../../assets/landing-step-1.webp';
import stepImg2 from '../../../assets/landing-step-2.webp';
import stepImg3 from '../../../assets/landing-step-3.webp';
import stepImg4 from '../../../assets/landing-step-4.webp';
import stepImg5 from '../../../assets/landing-step-5.webp';
import darkBgLogo from '../../../assets/darkbglogo.png';
import lightBgLogo from '../../../assets/logo for wh bg.png';
/* JPEG, not the source PNGs. These are photographs — PNG stored them losslessly
   at 1.24 MB and 1.29 MB, and this is the hero's largest-contentful-paint, so
   that was 2.5 MB standing between a visitor and their first view of the page.
   Same pixels, 164 KB the pair. Regenerate with docs/hero-media.md. */

/* ──────────────────────────────────────────────────────────────────────────
   PALETTE
   Warm white paper (#FEFDF9) and near-black ink (#14120C) carry the whole
   page; amber gold (#C9A227) is the signature action color — it appears only
   on the handful of true conversion buttons (checkout, submit, primary CTA),
   never as a section wash. Pure white (#FFFFFF) is the light accent on dark
   surfaces.
   ────────────────────────────────────────────────────────────────────────── */
const INK = '#14120C';

// ── Types ──────────────────────────────────────────────────────────────────

export interface LandingPageMasterProps {
  onStart?: () => void;
  onLogin?: () => void;
  onOpenDashboard?: () => void;
  onOpenDistributorDashboard?: () => void;
  onOpenDistributorApply?: () => void;
  onOpenPricing?: () => void;
  onOpenCheckout?: () => void;
  onOpenJoinUs?: (serviceType?: string) => void;
  onOpenTrackOrder?: () => void;
  onOpenPrivacy?: () => void;
  isEmbeddedInDashboard?: boolean;
}

interface CartItem {
  product: ProductItem;
  qty: number;
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

interface DistributorTier {
  id: string;
  name: string;
  badge: string;
  minUnits: string;
  margin: string;
  desc: string;
  features: string[];
  isPopular?: boolean;
  ctaText: string;
}

// ── Data ───────────────────────────────────────────────────────────────────

/** Selling points shown beside the "Join us" provider application. */
const JOIN_BENEFITS = [
  'A scan near you rings your phone through a masked bridge — the caller never sees your number.',
  'Choose which sticker categories you cover, or serve every one of them.',
  'No listing fee. Our team verifies your details before you go live.',
];

const HOW_IT_WORKS_STEPS = [
  {
    step: 1,
    title: 'Order your sticker',
    body: 'Pick a type — vehicle, gate, bag, keychain. Delivered across India in two to three days.',
    img: stepImg1,
    badge: 'Pick your tag',
  },
  {
    step: 2,
    title: 'Stick it on',
    body: 'Peel and stick it where a finder will look first. Weatherproof adhesive, rated for years outdoors.',
    img: stepImg2,
    badge: 'Peel & stick',
  },
  {
    step: 3,
    title: 'Anyone scans — no app',
    body: 'Their camera opens a secure proxy page. Nothing to install, nothing to sign up for.',
    img: stepImg5,
    badge: 'Zero-app scan',
  },
  {
    step: 4,
    title: 'They reach you',
    body: 'Call, message, GPS or emergency alert. Your number is never rendered on the page.',
    img: stepImg3,
    badge: 'Masked call & GPS',
  },
  {
    step: 5,
    title: 'You get pinged instantly',
    body: 'SMS and WhatsApp land within seconds, carrying their message and location if they shared it.',
    img: stepImg4,
    badge: 'Instant alert',
  },
];

/* The "everything on one tag" grid. Each card borrows a step image so the
   section stays photographic instead of turning into another icon wall. */
const FEATURE_CARDS = [
  {
    id: 'masked',
    title: 'Masked telephony',
    description:
      'Calls route through a virtual bridge. The finder reaches you without either side seeing a real number.',
    img: stepImg3,
    tag: 'Privacy',
  },
  {
    id: 'alerts',
    title: 'Multi-channel alerts',
    description:
      'SMS and WhatsApp fire the moment a tag is scanned, carrying the message and the location if shared.',
    img: stepImg4,
    tag: 'Alerts',
  },
  {
    id: 'contacts',
    title: 'Backup contact tree',
    description:
      'Every tag carries more than one contact, so an emergency reaches your backup people, not just you.',
    img: stepImg5,
    tag: 'Emergency',
  },
  {
    id: 'edge',
    title: 'Opens anywhere',
    description:
      'A plain HTTPS link served from the edge. Any iOS or Android camera opens it, even on patchy mobile data.',
    img: stepImg1,
    tag: 'Reach',
  },
];

/* Deliberately verifiable numbers rather than vanity metrics — each one is
   something the product actually guarantees. */
const STATS = [
  { value: 10000, kilo: true, suffix: '+', label: 'Owners protected' },
  { value: 0, suffix: '', label: 'Numbers ever exposed' },
  { value: 8, suffix: '', label: 'Asset categories covered' },
  { value: 3, suffix: ' yrs', label: 'Outdoor-rated adhesive' },
];

const DISTRIBUTOR_TIERS: DistributorTier[] = [
  {
    id: 'retailer-starter',
    name: 'Retailer Starter Pack',
    badge: 'Garages & retail shops',
    minUnits: '50 - 100 units',
    margin: '40%+ retail margin',
    desc: 'Ideal for auto garages, bike accessory shops, mobile stores, and local locksmiths.',
    features: [
      '50x pre-activated weatherproof smart tags',
      'Free acrylic counter display rack',
      'Marketing posters and flyer kit',
      'Dealer dashboard with instant QR restock',
      '48-hour priority doorstep logistics',
    ],
    ctaText: 'Inquire retail pack',
  },
  {
    id: 'city-franchise',
    name: 'City Exclusive Franchise',
    badge: 'Exclusive territory partner',
    minUnits: '500 - 1,000 units',
    margin: '50%+ exclusive margin',
    isPopular: true,
    desc: 'Sole distributor rights for your city or district, with local buyer leads routed to you.',
    features: [
      'Exclusive city territory rights and protection',
      '500x smart QR tags across all categories',
      'Localised dealer branding and shop sign kit',
      'Dedicated territory account manager',
      'All local website buyer leads redirected to you',
      'Quarterly volume bonuses and tier rebate',
    ],
    ctaText: 'Apply for city franchise',
  },
  {
    id: 'master-partner',
    name: 'Master State / Fleet Partner',
    badge: 'Regional master rights',
    minUnits: '2,500+ units',
    margin: '60%+ master margin',
    desc: 'State-level master franchise and large fleet deployments for corporate and logistics networks.',
    features: [
      'State-wide master distribution exclusivity',
      'Custom white-label QR sticker batches',
      'Enterprise REST API and fleet sync console',
      'Sub-dealer network and commission control',
      '24/7 dedicated enterprise support',
    ],
    ctaText: 'Contact for master rights',
  },
];

const PRICING_PLANS = [
  {
    id: 'solo',
    name: 'Solo Starter',
    desc: 'One vehicle or personal asset.',
    tier: 'Retail Kit (50 Units)',
    features: [
      '1x weatherproof smart sticker',
      'Masked call and WhatsApp alerts',
      'Lifetime dashboard access',
    ],
    cta: 'Contact for pricing',
    featured: false,
  },
  {
    id: 'family',
    name: 'Family Trio',
    desc: 'Three tags for car, bike and gate or pets.',
    tier: 'Retail Kit (50 Units)',
    features: [
      '3x multi-category smart tags',
      'Multi-responder emergency tree',
      'Free priority 48h shipping',
    ],
    cta: 'Contact for pricing',
    featured: true,
  },
  {
    id: 'fleet',
    name: 'Society & Fleet',
    desc: 'Bulk tags for apartments, schools and logistics.',
    tier: 'State Partner (2500+ Units)',
    features: [
      'Custom branded logo and colours',
      'Admin master fleet dashboard',
      'Dedicated relationship manager',
    ],
    cta: 'Inquire bulk quote',
    featured: false,
  },
];

const FAQS: FaqItem[] = [
  {
    id: 'faq-1',
    question: 'How does the RepiQR tag protect my personal phone number?',
    answer:
      'When someone scans your QR tag, they interact with a secure proxy page. When they tap "Call Owner", our telecom cloud connects both parties through a masked virtual line. Neither your number nor theirs is ever revealed to the other.',
  },
  {
    id: 'faq-2',
    question: 'Does the person scanning my tag need to download an app?',
    answer:
      'No. The scanner uses their regular smartphone camera or Google Lens. The scan opens a fast, responsive web page with no software installation, login, or sign-up.',
  },
  {
    id: 'faq-3',
    question: 'Can I add multiple emergency contacts to a single sticker?',
    answer:
      'Yes. In your dashboard you can register primary, secondary and tertiary emergency contacts, and give each a role such as family member, insurance agent or fleet manager.',
  },
  {
    id: 'faq-4',
    question: 'What happens if my parked car is blocking someone, or in an emergency?',
    answer:
      'They scan your windshield tag and choose "Notify for parking issue", "Wrong parking" or "Emergency". You receive an SMS, WhatsApp and email alert with their message and, if they shared it, their location.',
  },
  {
    id: 'faq-5',
    question: 'How durable are the physical tags against rain and sunlight?',
    answer:
      'Tags are printed on laminated weatherproof stock and are meant to live outdoors on a windshield, gate or collar. If one wears out or stops scanning, contact support and we will replace it — your tag ID and its contacts stay the same.',
  },
  {
    id: 'faq-6',
    question: 'Can I reassign or transfer a tag if I sell my car or replace an item?',
    answer:
      'Yes. From your dashboard you can update vehicle details, change linked contact numbers, or transfer ownership of the tag to another user in one step.',
  },
];

const BADGE_ITEMS = [
  { label: 'Vehicles', icon: Car },
  { label: 'Motorcycles', icon: Bike },
  { label: 'Pets', icon: Dog },
  { label: 'Luggage', icon: Luggage },
  { label: 'Electronics', icon: Laptop },
  { label: 'Keychains', icon: Key },
  { label: 'Gates & doors', icon: DoorClosed },
  { label: 'Cargo & fleet', icon: Boxes },
];

/* The photo wall. Tiles are grouped into three columns that drift at different
   speeds, so the whole block breathes as it passes. */
const MOSAIC_COLUMNS = [
  [stepImg1, stepImg4, stepImg2],
  [stepImg5, stepImg2, stepImg3],
  [stepImg3, stepImg1, stepImg5],
];

// ── Motion primitives ──────────────────────────────────────────────────────

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/* React is installed without @types/react, so TS has no JSX namespace and
   checks these helpers by call signature — which means `key` has to be declared
   as a prop or every `.map()` over one fails to compile. React strips it before
   props are built, so nothing reads it at runtime. */
type Keyed = { key?: string | number };

/** Fade + rise + de-blur once, when the element first enters the viewport. */
function Reveal({
  children,
  delay = 0,
  y = 30,
  className,
}: Keyed & {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? undefined : { opacity: 0, y, filter: 'blur(8px)' }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 0.85, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** Headline that rises word by word out of a clipped line box. */
function SplitWords({
  text,
  className,
  delay = 0,
  stagger = 0.055,
  animateOnLoad = false,
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  animateOnLoad?: boolean;
}) {
  const reduced = useReducedMotion();
  const words = text.split(' ');
  if (reduced) return <span className={className}>{text}</span>;
  return (
    <span className={className}>
      {words.map((word, i) => (
        <span key={`${word}-${i}`} className="inline-block overflow-hidden align-bottom pb-[0.08em]">
          <motion.span
            className="inline-block whitespace-pre"
            initial={{ y: '115%' }}
            {...(animateOnLoad ? { animate: { y: '0%' } } : { whileInView: { y: '0%' } })}
            viewport={{ once: true, margin: '0px 0px -8% 0px' }}
            transition={{ duration: 0.9, delay: delay + i * stagger, ease: EASE }}
          >
            {i < words.length - 1 ? `${word} ` : word}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/** Vertical drift tied to the element's own trip through the viewport. */
function Parallax({
  children,
  distance = 70,
  className,
}: Keyed & {
  children: React.ReactNode;
  distance?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const raw = useTransform(scrollYProgress, [0, 1], [distance, -distance]);
  const y = useSpring(raw, { stiffness: 90, damping: 26, mass: 0.4 });
  return (
    <div ref={ref} className={className}>
      <motion.div style={reduced ? undefined : { y }}>{children}</motion.div>
    </div>
  );
}

/** Counts from zero to `to` the first time it is seen. */
function Counter({ to, suffix = '', kilo = false }: { to: number; suffix?: string; kilo?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-12%' });
  const reduced = useReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduced || to === 0) {
      setValue(to);
      return;
    }
    let frame = 0;
    const started = performance.now();
    const duration = 1500;
    const tick = (now: number) => {
      const p = Math.min(1, (now - started) / duration);
      setValue(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, to, reduced]);

  const shown = kilo ? `${Math.round(value / 1000)}K` : Math.round(value).toLocaleString('en-IN');

  return (
    <span ref={ref}>
      {shown}
      {suffix}
    </span>
  );
}

/** Edge-to-edge ticker. The row is duplicated so the loop never shows a seam. */
/**
 * Freeze the page behind a full-screen overlay.
 *
 * Without this, opening the nav drawer, the cart or the application modal on a
 * phone left the landing page scrolling underneath: a swipe over the overlay
 * moved the page, and closing it dropped the reader somewhere they never chose
 * to go. `position: fixed` is what actually stops iOS Safari — `overflow:
 * hidden` alone does not — so the scroll offset is captured, applied as a
 * negative offset to keep the view still, and restored on close.
 *
 * Compensating for the scrollbar's width keeps desktop from shifting sideways
 * as the bar disappears.
 */
function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;

    const { body } = document;
    const scrollY = window.scrollY;
    const gutter = window.innerWidth - document.documentElement.clientWidth;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      paddingRight: body.style.paddingRight,
    };

    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    if (gutter > 0) body.style.paddingRight = `${gutter}px`;

    return () => {
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.width = previous.width;
      body.style.paddingRight = previous.paddingRight;
      // Jump straight back — a smooth restore would animate the whole page.
      window.scrollTo({ top: scrollY, behavior: 'instant' as ScrollBehavior });
    };
  }, [locked]);
}

/**
 * Ultra-realistic mobile phone frame (iPhone 16/15 Pro titanium chassis)
 * displaying the live scan-proxy page mockup.
 */
function HeroScanPhoneMock({ reduced }: { reduced: boolean | null }) {
  return (
    <motion.div
      className="relative mx-auto w-full max-w-[310px] select-none sm:max-w-[335px]"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.4, ease: EASE }}
    >
      {/* Floating active status pill with #FFD444 highlight */}
      <motion.div
        animate={reduced ? undefined : { y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-4 -right-3 z-30 flex items-center gap-2 rounded-full border border-[#14120C]/10 bg-white/95 px-3.5 py-1.5 text-xs font-bold tracking-wide text-[#14120C] shadow-[0_12px_28px_-6px_rgba(20,18,12,0.18)] backdrop-blur-md"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#16A34A] opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#16A34A]" />
        </span>
        <span className="font-mono text-[10.5px] uppercase tracking-wider">RepiQR · Active</span>
        <span className="h-1.5 w-1.5 rounded-full bg-[#FFD444]" />
      </motion.div>

      {/* ── Realistic Smartphone Body (Natural Titanium Edge) ── */}
      <div className="relative rounded-[50px] p-[2.5px] bg-gradient-to-b from-[#524E4A] via-[#2A2826] to-[#45423E] shadow-[0_50px_100px_-20px_rgba(20,18,12,0.42),0_20px_40px_-15px_rgba(20,18,12,0.25)] border border-white/20">
        {/* Antenna bands */}
        <div className="absolute -left-[1px] top-24 w-[2.5px] h-1.5 bg-[#1C1A18] z-20" />
        <div className="absolute -left-[1px] bottom-24 w-[2.5px] h-1.5 bg-[#1C1A18] z-20" />
        <div className="absolute -right-[1px] top-24 w-[2.5px] h-1.5 bg-[#1C1A18] z-20" />
        <div className="absolute -right-[1px] bottom-24 w-[2.5px] h-1.5 bg-[#1C1A18] z-20" />

        {/* Physical side buttons */}
        {/* Action Button */}
        <div className="absolute -left-[4.5px] top-[92px] h-7 w-[3px] rounded-l-sm bg-gradient-to-r from-[#2F2C2A] to-[#45423E] shadow-xs" />
        {/* Volume Up */}
        <div className="absolute -left-[4.5px] top-[132px] h-12 w-[3px] rounded-l-sm bg-gradient-to-r from-[#2F2C2A] to-[#45423E] shadow-xs" />
        {/* Volume Down */}
        <div className="absolute -left-[4.5px] top-[192px] h-12 w-[3px] rounded-l-sm bg-gradient-to-r from-[#2F2C2A] to-[#45423E] shadow-xs" />
        {/* Power / Siri Button */}
        <div className="absolute -right-[4.5px] top-[148px] h-18 w-[3px] rounded-r-sm bg-gradient-to-l from-[#2F2C2A] to-[#45423E] shadow-xs" />

        {/* Inner black bezel */}
        <div className="relative rounded-[47px] bg-[#0E0D0C] p-[9px] overflow-hidden">
          {/* Top Speaker Ear-piece Slit */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 h-[3.5px] w-12 rounded-full bg-[#181615]" />

          {/* Screen Shell */}
          <div className="relative overflow-hidden rounded-[39px] bg-[#FFFFFF] border border-black/5">
            {/* Specular Diagonal Glass Reflection */}
            <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.12]" />

            {/* iOS Status Bar */}
            <div className="relative z-10 flex items-center justify-between px-6 pt-3 pb-1 text-[11px] font-bold text-[#14120C]">
              <span className="tracking-tight">9:41</span>

              {/* Dynamic Island with Real Camera Lens Glint */}
              <div className="absolute left-1/2 top-2 z-30 flex items-center justify-between px-2.5 h-[24px] w-[86px] -translate-x-1/2 rounded-full bg-black shadow-md">
                <div className="flex items-center gap-1">
                  <div className="relative h-2.5 w-2.5 rounded-full bg-[#080B14] border border-blue-900/40">
                    <span className="absolute top-0.5 left-0.5 h-1 w-1 rounded-full bg-blue-400/40" />
                  </div>
                </div>
                {/* Proximity sensor */}
                <div className="h-1.5 w-1.5 rounded-full bg-[#161616]" />
              </div>

              <div className="flex items-center gap-1.5 text-[#14120C]">
                <Signal size={12} strokeWidth={2.5} />
                <Wifi size={12} strokeWidth={2.5} />
                <BatteryFull size={14} strokeWidth={2} />
              </div>
            </div>

            {/* Screen Content (Matches Requested Mockup Exactly) */}
            <div className="max-h-[585px] overflow-y-auto p-3 space-y-2.5 bg-[#F4F6F9] scrollbar-none">
              {/* 1. TOP EMERGENCY CARD */}
              <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-b from-[#E01414] via-[#D31313] to-[#8F0808] p-4 text-white shadow-md">
                {/* Subtle Concentric Rings Top Right */}
                <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full border border-white/15" />
                <div className="pointer-events-none absolute -right-5 -top-5 h-32 w-32 rounded-full border border-white/15" />
                <div className="pointer-events-none absolute top-0 right-0 h-20 w-20 rounded-full border border-white/10" />

                {/* Top Row: Warning Icon & Siren with Radiation Lines */}
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-xs text-white shadow-xs">
                    <AlertTriangle size={18} strokeWidth={2.4} />
                  </div>

                  {/* Radiating Siren Graphic */}
                  <div className="relative flex items-center justify-center w-10 h-10">
                    <div className="absolute -top-1 w-1 h-1.5 bg-white/90 rounded-full" />
                    <div className="absolute top-0.5 -left-1 w-1.5 h-1 bg-white/90 rounded-full rotate-45" />
                    <div className="absolute top-0.5 -right-1 w-1.5 h-1 bg-white/90 rounded-full -rotate-45" />
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-xs shadow-xs">
                      <Siren size={17} className="text-white animate-pulse" />
                    </div>
                  </div>
                </div>

                {/* Headlines */}
                <div className="mt-2.5 relative z-10">
                  <h3 className="text-[16px] font-black leading-tight tracking-tight text-white">
                    This Is Emergency or an accident
                  </h3>
                  <p className="mt-0.5 text-[11px] font-medium text-white/85">
                    We've detected an emergency or accident
                  </p>
                </div>

                {/* 3 Column Quick Actions Status Bar with Dividers */}
                <div className="mt-3.5 flex items-center justify-between border-t border-white/15 pt-3 text-center relative z-10">
                  <div className="flex-1 flex flex-col items-center">
                    <MapPin size={13} className="text-white mb-0.5" />
                    <span className="text-[10px] font-bold leading-tight">Share Live</span>
                    <span className="text-[8.5px] text-white/80">Location</span>
                  </div>
                  <div className="h-6 w-px bg-white/20" />
                  <div className="flex-1 flex flex-col items-center">
                    <PhoneCall size={13} className="text-white mb-0.5" />
                    <span className="text-[10px] font-bold leading-tight">Notify</span>
                    <span className="text-[8.5px] text-white/80">Contacts</span>
                  </div>
                  <div className="h-6 w-px bg-white/20" />
                  <div className="flex-1 flex flex-col items-center">
                    <Stethoscope size={13} className="text-white mb-0.5" />
                    <span className="text-[10px] font-bold leading-tight">Request</span>
                    <span className="text-[8.5px] text-white/80">Ambulance</span>
                  </div>
                </div>

                {/* Get Help Pill Button */}
                <button
                  type="button"
                  className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-full bg-white py-2.5 font-bold text-[#C81010] shadow-md hover:bg-slate-50 transition-transform active:scale-98 relative z-10"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#C81010] text-white">
                    <Phone size={11} className="fill-white" />
                  </span>
                  <span className="text-[12.5px] font-bold tracking-tight">Get Help</span>
                </button>
              </div>

              {/* 2. QUICK ACTIONS CARD (2x3 GRID) */}
              <div className="rounded-[22px] border border-black/5 bg-white p-3 shadow-xs">
                <div className="mb-2.5 flex items-center justify-between">
                  <h4 className="text-[12px] font-bold text-slate-900">Quick Actions</h4>
                  <span className="text-[9.5px] font-medium text-slate-400">Tap on any service</span>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {/* Tow Truck */}
                  <div className="relative flex flex-col items-center rounded-xl border border-slate-100 bg-white p-2 text-center shadow-2xs transition-transform hover:scale-[1.03]">
                    <ChevronRight size={10} className="absolute right-1 top-1 text-slate-300" />
                    <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                      <Truck size={15} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-900 leading-tight">Tow Truck</span>
                    <span className="mt-0.5 text-[8px] text-slate-400">Roadside recovery</span>
                  </div>

                  {/* Mechanic */}
                  <div className="relative flex flex-col items-center rounded-xl border border-slate-100 bg-white p-2 text-center shadow-2xs transition-transform hover:scale-[1.03]">
                    <ChevronRight size={10} className="absolute right-1 top-1 text-slate-300" />
                    <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                      <Wrench size={15} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-900 leading-tight">Mechanic</span>
                    <span className="mt-0.5 text-[8px] text-slate-400">On-site repair</span>
                  </div>

                  {/* Parking Issue */}
                  <div className="relative flex flex-col items-center rounded-xl border border-slate-100 bg-white p-2 text-center shadow-2xs transition-transform hover:scale-[1.03]">
                    <ChevronRight size={10} className="absolute right-1 top-1 text-slate-300" />
                    <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#2563EB] text-white font-black text-[11px]">
                      P
                    </div>
                    <span className="text-[10px] font-bold text-slate-900 leading-tight">Parking Issue</span>
                    <span className="mt-0.5 text-[8px] text-slate-400">Blocking path</span>
                  </div>

                  {/* Flat Tyre */}
                  <div className="relative flex flex-col items-center rounded-xl border border-slate-100 bg-white p-2 text-center shadow-2xs transition-transform hover:scale-[1.03]">
                    <ChevronRight size={10} className="absolute right-1 top-1 text-slate-300" />
                    <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-700">
                      <Disc size={15} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-900 leading-tight">Flat Tyre</span>
                    <span className="mt-0.5 text-[8px] text-slate-400">Tyre assistance</span>
                  </div>

                  {/* Theft Alert */}
                  <div className="relative flex flex-col items-center rounded-xl border border-slate-100 bg-white p-2 text-center shadow-2xs transition-transform hover:scale-[1.03]">
                    <ChevronRight size={10} className="absolute right-1 top-1 text-slate-300" />
                    <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                      <ShieldAlert size={15} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-900 leading-tight">Theft Alert</span>
                    <span className="mt-0.5 text-[8px] text-slate-400">Report and alert</span>
                  </div>

                  {/* Headlights */}
                  <div className="relative flex flex-col items-center rounded-xl border border-slate-100 bg-white p-2 text-center shadow-2xs transition-transform hover:scale-[1.03]">
                    <ChevronRight size={10} className="absolute right-1 top-1 text-slate-300" />
                    <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                      <Key size={14} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-900 leading-tight">Headlights</span>
                    <span className="mt-0.5 text-[8px] text-slate-400">are on</span>
                  </div>
                </div>
              </div>

              {/* 3. MESSAGE VEHICLE OWNER CARD */}
              <div className="rounded-[22px] border border-black/5 bg-white p-3 shadow-xs space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-[#4F39F6]">
                    <MessageSquare size={16} />
                  </div>
                  <div>
                    <h4 className="text-[11.5px] font-bold text-slate-900 leading-tight">Message Vehicle Owner</h4>
                    <p className="mt-0.5 text-[9.5px] text-slate-500 leading-snug">
                      Start a private chat. The owner receives a WhatsApp alert automatically.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#4F39F6] py-2.5 font-bold text-white shadow-md shadow-indigo-500/20 hover:bg-[#432EE0] transition-transform active:scale-98"
                >
                  <MessageCircle size={14} />
                  <span className="text-[11.5px] font-bold tracking-wide">Message Owner</span>
                </button>
              </div>

              {/* 4. BOTTOM SPLIT CARD (You're Protected + 24/7 Support) */}
              <div className="rounded-2xl border border-black/5 bg-white p-2 shadow-xs flex items-center justify-between">
                {/* Left: You're Protected */}
                <div className="flex items-center gap-2 pr-2 flex-1 border-r border-slate-100">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 flex-shrink-0">
                    <ShieldCheck size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-900 leading-tight truncate">You're Protected</p>
                    <p className="text-[8px] text-slate-400 truncate">We care about your safety</p>
                  </div>
                </div>

                {/* Right: 24/7 Support */}
                <div className="flex items-center justify-between pl-2 flex-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600 flex-shrink-0">
                      <Phone size={12} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-900 leading-tight truncate">24/7 Support</p>
                      <p className="text-[8px] text-slate-400 truncate">Always here to help</p>
                    </div>
                  </div>
                  <ChevronRight size={11} className="text-slate-300 flex-shrink-0" />
                </div>
              </div>
            </div>

            {/* iOS Bottom Home Indicator Bar */}
            <div className="flex justify-center pb-2 pt-1.5">
              <div className="h-1 w-32 rounded-full bg-[#14120C]/80" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Marquee({
  children,
  reverse = false,
  duration = 38,
}: {
  children: React.ReactNode;
  reverse?: boolean;
  duration?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <div className="overflow-hidden">
      <motion.div
        className="flex w-max items-center"
        animate={reduced ? undefined : { x: reverse ? ['-50%', '0%'] : ['0%', '-50%'] }}
        transition={{ duration, ease: 'linear', repeat: Infinity }}
      >
        {/* Two wrapped copies rather than two loose ones, so the duplicated
            children never collide on React keys. */}
        <div className="flex items-center gap-3 pr-3">{children}</div>
        <div className="flex items-center gap-3 pr-3" aria-hidden="true">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

/** Slowly rotating dot field behind the closing call to action. */
function ParticleRing() {
  const reduced = useReducedMotion();
  const dots = useMemo(() => {
    const out: { x: number; y: number; r: number; o: number }[] = [];
    for (let i = 0; i < 820; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 118 + Math.sqrt(Math.random()) * 132;
      out.push({
        x: 250 + Math.cos(angle) * radius,
        y: 250 + Math.sin(angle) * radius,
        r: Math.random() * 1.2 + 0.25,
        o: Math.random() * 0.5 + 0.08,
      });
    }
    return out;
  }, []);

  return (
    <motion.svg
      viewBox="0 0 500 500"
      className="pointer-events-none absolute left-1/2 top-1/2 h-[min(118vw,780px)] w-[min(118vw,780px)] -translate-x-1/2 -translate-y-1/2"
      animate={reduced ? undefined : { rotate: 360 }}
      transition={{ duration: 190, ease: 'linear', repeat: Infinity }}
      aria-hidden="true"
    >
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#FFFFFF" opacity={d.o} />
      ))}
    </motion.svg>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function LandingPageMaster({
  onStart,
  onLogin,
  onOpenDashboard,
  onOpenDistributorDashboard,
  onOpenDistributorApply,
  onOpenPricing,
  onOpenCheckout,
  onOpenJoinUs,
  onOpenTrackOrder,
  onOpenPrivacy,
  isEmbeddedInDashboard = false,
}: LandingPageMasterProps) {
  const { isLoggedIn, profile } = useAuth();
  const { language } = useLanguage();
  const t = landingTranslations[language];
  const reduced = useReducedMotion();

  // Navigation
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Cart state persisted
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
  const [cartNotice, setCartNotice] = useState<{ name: string; qty: number } | null>(null);

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
    const timeout = window.setTimeout(() => setCartNotice(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [cartNotice]);

  // Shop catalog — admin-managed via /api/shop-products (ShopProductsPage in
  // the admin dashboard); falls back to the built-in DEFAULT_PRODUCTS if the
  // admin hasn't added any yet or the request fails, so the shop is never blank.
  const [products, setProducts] = useState<ProductItem[]>(DEFAULT_PRODUCTS);
  useEffect(() => {
    apiClient.shopProducts
      .list()
      .then((res) => {
        if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
          setProducts(res.data.map(mapApiShopProduct));
        }
      })
      .catch(() => {
        /* keep the built-in fallback catalog */
      });
  }, []);

  // Category filter
  const [activeCategory, setActiveCategory] =
    useState<'All' | 'Vehicle' | 'Home' | 'Family' | 'Travel'>('All');

  // Interactive scan demo
  const [demoActionAlert, setDemoActionAlert] = useState<string | null>(null);

  // FAQ accordion state
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(FAQS[0].id);

  // Partner modal state
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

  // ── "Join us" service-provider sign-up ──────────────────────────────────
  // The navbar dropdown picks a service type, the #join-section form collects
  // the provider's details, and the application lands in the admin's
  // Communication directory (inactive until approved).
  const [isJoinMenuOpen, setIsJoinMenuOpen] = useState(false);
  const [joinForm, setJoinForm] = useState({
    serviceType: SERVICE_TYPES[0].slug,
    label: '',
    phone: '',
    email: '',
    city: '',
    notes: '',
    categories: [] as string[],
  });
  const [joinSubmitting, setJoinSubmitting] = useState(false);
  const [joinSubmitted, setJoinSubmitted] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // ── Scroll rigs ─────────────────────────────────────────────────────────
  // Page progress bar.
  const { scrollYProgress: pageProgress, scrollY } = useScroll();
  const progressScale = useSpring(pageProgress, { stiffness: 140, damping: 30, mass: 0.3 });

  useMotionValueEvent(scrollY, 'change', (v) => {
    const past = v > 24;
    setIsScrolled((prev) => (prev === past ? prev : past));
  });

  // Any of the three full-screen overlays holds the page still behind it.
  useBodyScrollLock(isMobileMenuOpen || isCartOpen || isPartnerModalOpen);

  // Escape closes whatever is on top. A drawer you can only dismiss by finding
  // the right X is a phone problem first, but it costs nothing to fix for all.
  useEffect(() => {
    if (!isMobileMenuOpen && !isCartOpen && !isPartnerModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (isPartnerModalOpen) setIsPartnerModalOpen(false);
      else if (isCartOpen) setIsCartOpen(false);
      else setIsMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMobileMenuOpen, isCartOpen, isPartnerModalOpen]);

  // Hero: the copy floats up and out as the section scrolls past.
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroCopyY = useTransform(heroProgress, [0, 1], [0, 140]);

  // Closing call to action: the ring block eases in as it centres.
  const ctaRef = useRef<HTMLElement>(null);
  const { scrollYProgress: ctaProgress } = useScroll({
    target: ctaRef,
    offset: ['start end', 'center center'],
  });
  const ctaRingScale = useTransform(ctaProgress, [0, 1], [0.72, 1]);
  const ctaRingOpacity = useTransform(ctaProgress, [0, 0.6], [0, 1]);

  // Footer watermark drifts as the page bottoms out.
  const footerRef = useRef<HTMLElement>(null);
  const { scrollYProgress: footerProgress } = useScroll({
    target: footerRef,
    offset: ['start end', 'end end'],
  });
  const watermarkY = useTransform(footerProgress, [0, 1], [70, -10]);

  // Google Font injection
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
    // Closing the drawer releases the body scroll lock, which restores the
    // offset the page was frozen at. Scrolling in this same tick would be
    // undone by that restore, so wait for it to commit first — one frame for
    // React to re-render, a second for the unlock's scrollTo to land.
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      )
    );
  };

  const handleToggleFaq = (faqId: string) => {
    setExpandedFaqId((prev) => (prev === faqId ? null : faqId));
  };

  const addToCart = (product: ProductItem, qty = 1) => {
    let updatedCart: CartItem[];
    const existing = cart.find((item) => item.product.id === product.id);
    if (existing) {
      updatedCart = cart.map((item) =>
        item.product.id === product.id ? { ...item, qty: item.qty + qty } : item
      );
    } else {
      updatedCart = [...cart, { product, qty }];
    }
    try {
      localStorage.setItem('repiqr-cart', JSON.stringify(updatedCart));
      localStorage.setItem('namoqr-cart', JSON.stringify(updatedCart));
    } catch {
      /* ignore */
    }
    setCart(updatedCart);
    if (!isCartOpen) setCartNotice({ name: product.name, qty });
  };

  const openCheckout = () => {
    setIsCartOpen(false);
    try {
      localStorage.setItem('repiqr-cart', JSON.stringify(cart));
      localStorage.setItem('namoqr-cart', JSON.stringify(cart));
    } catch {
      /* ignore */
    }
    if (onOpenCheckout) {
      onOpenCheckout();
    } else if (onStart) {
      onStart();
    }
  };

  const handleBuyNow = (product: ProductItem) => {
    const existingItem = cart.find((item) => item.product.id === product.id);
    const updatedCart: CartItem[] = existingItem
      ? cart.map((item) =>
          item.product.id === product.id ? { ...item, qty: Math.max(1, item.qty) } : item
        )
      : [...cart, { product, qty: 1 }];

    try {
      localStorage.setItem('repiqr-cart', JSON.stringify(updatedCart));
      localStorage.setItem('namoqr-cart', JSON.stringify(updatedCart));
    } catch {
      /* ignore */
    }

    setCart(updatedCart);
    setIsCartOpen(false);

    if (onOpenCheckout) {
      onOpenCheckout();
    } else if (onStart) {
      onStart();
    }
  };

  const handleDemoTrigger = (actionType: 'parking' | 'gps' | 'emergency') => {
    if (actionType === 'parking') {
      setDemoActionAlert('Parking issue alert sent. Owner notified on WhatsApp and SMS.');
    } else if (actionType === 'gps') {
      setDemoActionAlert('Location shared securely with the tag owner.');
    } else {
      setDemoActionAlert('Emergency alert dispatched to the owner and 3 backup contacts.');
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

  const joinServiceType = useMemo(
    () => SERVICE_TYPES.find((t) => t.slug === joinForm.serviceType) || SERVICE_TYPES[0],
    [joinForm.serviceType]
  );
  const joinServiceMeta = getServiceMeta(joinForm.serviceType);

  /** Navbar dropdown -> pick the service type and scroll the form into view. */
  const handleJoinSelect = (slug: string) => {
    setIsJoinMenuOpen(false);
    setJoinForm((prev) => ({ ...prev, serviceType: slug }));
    setJoinSubmitted(false);
    setJoinError(null);
    onOpenJoinUs?.(slug);
  };

  const toggleJoinCategory = (value: string) => {
    setJoinForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(value)
        ? prev.categories.filter((c) => c !== value)
        : [...prev.categories, value],
    }));
  };

  /** Name, phone and city are what the admin needs to verify a provider. */
  const joinFormIsValid = Boolean(
    joinForm.label.trim() && joinForm.phone.trim() && joinForm.city.trim()
  );

  const resetJoinForm = () => {
    setJoinSubmitted(false);
    setJoinError(null);
    // The service type survives, so listing a second branch is one field away.
    setJoinForm((prev) => ({
      serviceType: prev.serviceType,
      label: '',
      phone: '',
      email: '',
      city: '',
      notes: '',
      categories: [],
    }));
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinFormIsValid) return;

    setJoinSubmitting(true);
    setJoinError(null);
    const type = joinServiceType;
    let saved = null;
    try {
      // The legacy label is what the bespoke car/bike scan screen looks providers
      // up by, so it stays authoritative alongside the slug.
      const res = await apiClient.helplines.apply({
        category: type.legacy || type.label,
        serviceType: type.slug,
        categories: joinForm.categories,
        label: joinForm.label.trim(),
        phone: joinForm.phone.trim(),
        email: joinForm.email.trim(),
        city: joinForm.city.trim(),
        notes: joinForm.notes.trim(),
      });
      saved = res.data || null;
    } catch (err) {
      console.warn('Provider application submit failed:', err);
    }
    setJoinSubmitting(false);

    if (saved) setJoinSubmitted(true);
    else setJoinError("We couldn't submit your application just now. Please try again in a moment.");
  };

  const filteredProducts = useMemo(
    () => (activeCategory === 'All' ? products : products.filter((p) => p.category === activeCategory)),
    [activeCategory, products]
  );

  const cartSubtotal = cart.reduce((sum, i) => sum + i.product.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const NAV_LINKS = [
    { id: 'hiw-section', label: t.navLinks.hiw },
    { id: 'trust-section', label: t.navLinks.trust },
    { id: 'products-section', label: t.navLinks.products },
    { id: 'faq-section', label: t.navLinks.faq },
  ];

  return (
    /* `overflow-x-clip` rather than `hidden`: it contains any stray horizontal
       overflow (parallax layers, the footer watermark, the CTA particle field
       all extend past the viewport by design) without making this element a
       scroll container — which `hidden` would, and which silently breaks the
       `position: sticky` the pinned How-it-works panel depends on. */
    <div className="min-h-screen overflow-x-clip bg-[#FEFDF9] font-sans text-[#14120C] antialiased selection:bg-[#14120C] selection:text-[#FFFFFF]">

      {/* ── Page scroll progress ──────────────────────────────────────── */}
      <motion.div
        style={{ scaleX: progressScale }}
        className="fixed inset-x-0 top-0 z-[80] h-[2px] origin-left bg-[#FFFFFF]"
        aria-hidden="true"
      />

      {/* ── 1. NAVBAR — modern visible frosted glass bar with prominent links ── */}
      <header
        className={`fixed inset-x-0 top-0 z-[70] transition-all duration-300 ${
          isScrolled
            ? 'bg-[#FEFDF9]/95 backdrop-blur-xl border-b border-[#14120C]/10 shadow-[0_4px_24px_rgba(20,18,12,0.06)] py-3 sm:py-3.5'
            : 'bg-[#FEFDF9]/85 backdrop-blur-md border-b border-[#14120C]/8 shadow-[0_2px_12px_rgba(20,18,12,0.03)] py-4'
        }`}
      >
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex cursor-pointer items-center focus:outline-hidden group"
            aria-label="RepiQR home"
          >
            <img src={lightBgLogo} alt="RepiQR" className="h-8 w-auto object-contain sm:h-9 transition-transform duration-200 group-hover:scale-[1.02]" />
          </button>

          <nav className="hidden items-center gap-1.5 lg:flex">
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                onClick={() => handleSmoothScroll(link.id)}
                className="cursor-pointer px-3.5 py-2 rounded-full text-[15px] font-semibold text-[#14120C]/75 hover:text-[#14120C] hover:bg-[#14120C]/[0.05] active:scale-95 transition-all duration-150"
              >
                {link.label}
              </button>
            ))}

            {/* Join Us dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setIsJoinMenuOpen(true)}
              onMouseLeave={() => setIsJoinMenuOpen(false)}
            >
              <button
                onClick={() => setIsJoinMenuOpen((open) => !open)}
                aria-haspopup="true"
                aria-expanded={isJoinMenuOpen}
                className="flex cursor-pointer items-center gap-1.5 px-3.5 py-2 rounded-full text-[15px] font-semibold text-[#14120C]/75 hover:text-[#14120C] hover:bg-[#14120C]/[0.05] active:scale-95 transition-all duration-150"
              >
                <span>{t.joinUs}</span>
                <ChevronDown
                  size={15}
                  className={`transition-transform duration-300 ${isJoinMenuOpen ? 'rotate-180 text-[#14120C]' : 'text-[#14120C]/60'}`}
                />
              </button>

              <AnimatePresence>
                {isJoinMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.2, ease: EASE }}
                    className="absolute left-1/2 top-full z-50 w-60 -translate-x-1/2 pt-2.5"
                  >
                    <div className="overflow-hidden rounded-2xl border border-[#14120C]/10 bg-white/95 backdrop-blur-xl p-2.5 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.2)]">
                      <p className="px-3 pb-2 pt-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#14120C]/45">
                        {t.chooseYourService}
                      </p>
                      <div className="grid max-h-72 overflow-y-auto space-y-0.5">
                        {SERVICE_TYPES.filter((type) => type.slug !== 'police').map((type) => (
                          <button
                            key={type.slug}
                            onClick={() => handleJoinSelect(type.slug)}
                            className="cursor-pointer rounded-xl px-3 py-2.5 text-left text-[14px] font-medium text-[#14120C]/80 transition-colors hover:bg-[#14120C]/5 hover:text-[#14120C]"
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>

          <div className="hidden items-center gap-4 lg:flex">
            <LanguageSwitcher />

            {onOpenTrackOrder && (
              <button
                onClick={onOpenTrackOrder}
                className="cursor-pointer px-3.5 py-2 rounded-full text-[14px] font-semibold text-[#14120C]/80 hover:text-[#14120C] hover:bg-[#14120C]/[0.05] transition-all flex items-center gap-2"
                title="Track order delivery"
              >
                <Truck size={16} className="text-[#14120C]/70" />
                <span>Track Order</span>
              </button>
            )}

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative cursor-pointer p-2.5 rounded-full text-[#14120C]/80 hover:text-[#14120C] hover:bg-[#14120C]/[0.05] transition-colors"
              aria-label="Open cart"
            >
              <ShoppingBag size={19} />
              {cartCount > 0 && (
                <span
                  className="absolute right-1 top-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-xs"
                  style={{ background: '#14120C' }}
                >
                  {cartCount}
                </span>
              )}
            </button>

            {isLoggedIn ? (
              <button
                onClick={onOpenDashboard || onLogin}
                className="cursor-pointer flex items-center gap-2 rounded-full bg-[#14120C] hover:bg-black px-5 py-2.5 text-[14px] font-semibold text-white shadow-sm hover:shadow-md transition-all hover:scale-[1.02] active:scale-95"
              >
                <LayoutDashboard size={15} />
                <span>{t.dashboard}</span>
              </button>
            ) : isEmbeddedInDashboard ? (
              <button
                onClick={onOpenCheckout}
                className="cursor-pointer rounded-full bg-[#14120C] hover:bg-black px-6 py-2.5 text-[14px] font-semibold text-white transition-all hover:scale-[1.02] active:scale-95"
              >
                {t.orderNewTags}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onLogin}
                  className="cursor-pointer px-4 py-2 rounded-full text-[14px] font-bold text-[#14120C] hover:text-black hover:bg-[#14120C]/[0.05] transition-all"
                >
                  {t.logIn}
                </button>
                <button
                  onClick={() => handleSmoothScroll('products-section')}
                  className="cursor-pointer rounded-full bg-[#14120C] hover:bg-black px-6 py-2.5 text-[14px] font-bold text-white shadow-[0_4px_16px_rgba(20,18,12,0.18)] hover:shadow-[0_6px_20px_rgba(20,18,12,0.28)] transition-all hover:scale-[1.02] active:scale-95"
                >
                  {t.chooseTag}
                </button>
              </div>
            )}
          </div>

          {/* Mobile triggers */}
          <div className="flex items-center gap-1 lg:hidden">
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-[#14120C]"
              aria-label="Open cart"
            >
              <ShoppingBag size={18} />
              {cartCount > 0 && (
                <span
                  className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-[#FFFFFF]"
                  style={{ background: '#14120C' }}
                >
                  {cartCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-[#14120C]"
              aria-label="Toggle navigation"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile drawer ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            /* Safe-area padding on both ends: the top clears the notch under the
               fixed header, the bottom keeps the two buttons off the iPhone
               home indicator, where they were previously unreachable. */
            className="fixed inset-0 z-[69] flex flex-col bg-[#14120C] px-6 pb-[max(2.5rem,calc(env(safe-area-inset-bottom)+1.5rem))] pt-[max(6rem,calc(env(safe-area-inset-top)+4.5rem))] lg:hidden"
          >
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <LanguageSwitcher variant="dark" className="mb-2" />

              {[...NAV_LINKS, { id: 'join-section', label: t.joinUs }].map((link, i) => (
                <motion.button
                  key={link.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 * i, duration: 0.5, ease: EASE }}
                  onClick={() => link.id === 'join-section' ? onOpenJoinUs?.() : handleSmoothScroll(link.id)}
                  className="block w-full border-b border-[#FFFFFF]/10 py-5 text-left text-2xl font-light tracking-tight text-[#FFFFFF]"
                >
                  {link.label}
                </motion.button>
              ))}

              {onOpenTrackOrder && (
                <motion.button
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.5, ease: EASE }}
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenTrackOrder();
                  }}
                  className="flex w-full items-center gap-3 border-b border-[#FFFFFF]/10 py-5 text-left text-2xl font-light tracking-tight text-[#FFFFFF]"
                >
                  <Truck size={24} />
                  <span>{t.trackOrder}</span>
                </motion.button>
              )}
            </div>

            <div className="mt-8 flex flex-col gap-3">
              {isLoggedIn ? (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    (onOpenDashboard || onLogin)?.();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#FFFFFF] py-3.5 text-sm font-semibold text-[#14120C] transition-transform active:scale-95"
                >
                  <LayoutDashboard size={16} />
                  <span>{t.goToDashboard}</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onLogin?.();
                    }}
                    className="w-full rounded-full border border-[#FFFFFF]/20 py-3.5 text-sm font-medium text-[#FFFFFF]"
                  >
                    {t.logIn}
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleSmoothScroll('products-section');
                    }}
                    className="w-full rounded-full bg-[#FFFFFF] py-3.5 text-sm font-bold text-[#14120C]"
                  >
                    {t.chooseTag}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 2. HERO — Rareblocks-style split: copy left, real sticker photo
             right, on plain white ──────────────────────────────────────── */}
      <section
        ref={heroRef}
        id="hero-section"
        className="relative flex min-h-[100svh] items-center overflow-hidden bg-[#FEFDF9]"
      >
        <motion.div
          style={reduced ? undefined : { y: heroCopyY }}
          className="relative z-10 mx-auto grid w-full max-w-[1400px] grid-cols-1 items-center gap-16 px-6 py-28 sm:px-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10"
        >
          {/* Left: copy */}
          <div className="text-left">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE }}
              className="mb-6 flex items-center gap-2.5 text-[10px] font-medium uppercase tracking-[0.2em] text-[#14120C]/60"
            >
              <span className="h-px w-8 bg-[#FFD444]" />
              {t.heroKicker}
            </motion.div>

            <h1 className="max-w-2xl text-[clamp(2.6rem,5.6vw,4.6rem)] font-medium leading-[0.98] tracking-[-0.045em] text-[#14120C]">
              <SplitWords text={t.heroHeadingLine1} delay={0.1} animateOnLoad />{' '}
              <span className="text-[#FFD444]">
                <SplitWords text={t.heroHeadingHighlight} delay={0.22} animateOnLoad />
              </span>
              <br />
              <SplitWords text={t.heroHeadingLine2} delay={0.34} animateOnLoad />
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.7, ease: EASE }}
              className="mt-7 max-w-md text-[15px] font-light leading-relaxed text-[#14120C]/70 sm:text-base"
            >
              {t.heroSubheading}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.85, ease: EASE }}
              className="mt-9 flex flex-col items-start gap-5"
            >
              <div className="flex flex-wrap items-center gap-3">
                <motion.button
                  onClick={() => handleSmoothScroll('products-section')}
                  whileHover={reduced ? undefined : { y: -3 }}
                  whileTap={reduced ? undefined : { scale: 0.97 }}
                  transition={{ duration: 0.25, ease: EASE }}
                  className="group flex cursor-pointer items-center gap-4 rounded-full bg-[#14120C] px-8 py-4 text-[15px] font-bold text-[#FFFFFF] shadow-[0_16px_40px_-18px_rgba(20,18,12,0.35)] transition-all hover:bg-black active:scale-95 sm:gap-6 sm:px-10 sm:py-5"
                >
                  <span>Get your tag</span>
                  <ArrowRight
                    size={18}
                    className="transition-transform duration-300 group-hover:translate-x-1.5 text-[#FFFFFF]"
                  />
                </motion.button>
                <button
                  onClick={() => handleSmoothScroll('hiw-section')}
                  className="cursor-pointer rounded-full border border-[#14120C]/20 bg-white px-6 py-4 text-[13px] font-semibold text-[#14120C] shadow-xs transition-colors hover:border-[#14120C]/50 hover:bg-[#F7F6F2]"
                >
                  See how it works
                </button>
              </div>

              {/* Trust list — rounded pills avoiding square edges */}
              <div className="flex flex-wrap items-center gap-2 border-t border-[#14120C]/10 pt-5">
                {['Ships in 2–3 days', 'Zero subscriptions', 'Lifetime tag validity'].map((fact) => (
                  <span
                    key={fact}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#14120C]/10 bg-white px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-[#14120C]/75 shadow-xs"
                  >
                    <Check size={13} className="text-[#16A34A]" />
                    {fact}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right: realistic mobile phone frame with scan page mock */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.4, ease: EASE }}
            className="flex justify-center lg:justify-end"
          >
            <HeroScanPhoneMock reduced={reduced} />
          </motion.div>
        </motion.div>
      </section>

      {/* ── 3. STATS BAND ───────────────────────────────────────────────── */}
      <section className="border-t border-[#FFFFFF]/10 bg-[#14120C] py-14 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-10">
          <div className="grid grid-cols-2 gap-y-12 md:grid-cols-4">
            {STATS.map((stat, i) => (
              <Reveal
                key={stat.label}
                delay={i * 0.09}
                className={`px-2 text-center ${i > 0 ? 'md:border-l md:border-[#FFFFFF]/10' : ''}`}
              >
                <div className="font-mono text-[clamp(2.2rem,5vw,3.6rem)] font-medium leading-none tracking-[-0.03em] text-[#FFFFFF]">
                  <Counter to={stat.value} suffix={stat.suffix} kilo={stat.kilo} />
                </div>
                <div className="mt-3 text-[11px] font-light uppercase tracking-[0.16em] text-[#FFFFFF]/50">
                  {stat.label}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. HOW IT WORKS ──────────────────────────────────────────────── */}
      <section id="hiw-section" className="bg-[#FEFDF9] py-24 sm:py-28">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-10">
          <Reveal className="max-w-2xl">
            <p className="mb-4 text-[11px] font-light uppercase tracking-[0.18em] text-[#14120C]/60">
              How it works
            </p>
            <h2 className="text-[clamp(1.9rem,4.2vw,3rem)] font-medium leading-[1.06] tracking-[-0.035em]">
              Getting protected takes about four minutes
            </h2>
          </Reveal>

          <div className="mt-14 divide-y divide-[#14120C]/10 border-y border-[#14120C]/10">
            {HOW_IT_WORKS_STEPS.map((step, i) => (
              <Reveal key={step.step} delay={i * 0.05}>
                <div className="group flex flex-col items-start gap-6 py-8 sm:flex-row sm:items-center sm:gap-10">
                  <div className="flex shrink-0 items-baseline gap-4 sm:w-[220px]">
                    <span className="font-mono text-[13px] text-[#14120C]/35">0{step.step}</span>
                    <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#14120C]/50">
                      {step.badge}
                    </span>
                  </div>

                  <div className="w-full shrink-0 overflow-hidden rounded-2xl sm:w-40">
                    <img
                      src={step.img}
                      alt={step.title}
                      className="aspect-4/3 w-full rounded-2xl object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-medium tracking-[-0.02em]">{step.title}</h3>
                    <p className="mt-1.5 max-w-xl text-[13px] font-light leading-relaxed text-[#14120C]/55">
                      {step.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. TRUST & PRIVACY PILLARS ──────────────────────────────────── */}
      <section id="trust-section" className="border-t border-[#FFFFFF]/10 bg-[#14120C] py-16 text-[#FFFFFF] sm:py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-10">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.18em] text-[#FFFFFF]">
              Engineered for absolute trust
            </p>
            <h2 className="text-[clamp(2rem,4.2vw,3.4rem)] font-medium leading-[1.04] tracking-[-0.035em]">
              Security and privacy in every layer
            </h2>
            <p className="mt-4 text-[15px] font-light leading-relaxed text-[#FFFFFF]/60">
              Your phone number is never exposed to strangers. Built with cloud-grade encryption,
              instant WhatsApp dispatch, and multi-contact emergency routing.
            </p>
          </Reveal>

          {/* 4 Feature Trust rows */}
          <div className="mt-14 divide-y divide-[#FFFFFF]/10 border-y border-[#FFFFFF]/10 sm:grid sm:grid-cols-2 sm:divide-y-0 sm:gap-x-10 sm:border-none">
            {FEATURE_CARDS.map((card, i) => (
              <Reveal key={card.id} delay={i * 0.08} className="border-[#FFFFFF]/10 sm:border-t sm:py-8">
                <div className="flex items-start gap-5 py-7 sm:py-0">
                  <div className="h-20 w-28 shrink-0 overflow-hidden rounded-2xl bg-[#14120C]/40 shadow-sm">
                    <img src={card.img} alt={card.title} className="h-full w-full rounded-2xl object-cover opacity-80" />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#FFFFFF]">
                      {card.tag}
                    </span>
                    <h3 className="mt-1 text-lg font-medium text-[#FFFFFF]">{card.title}</h3>
                    <p className="mt-1.5 text-[13px] font-light leading-relaxed text-[#FFFFFF]/55">
                      {card.description}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Trust Guarantees Bar with smooth rounded corners */}
          <Reveal delay={0.2} className="mt-12 rounded-3xl border border-[#FFFFFF]/10 bg-[#FFFFFF]/[0.03] p-6 shadow-sm sm:p-8">
            <div className="grid grid-cols-1 gap-6 text-center sm:grid-cols-2 sm:text-left lg:grid-cols-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#FFFFFF]/30 bg-[#FFFFFF]/10 text-[#FFFFFF] shadow-xs">
                  <Lock size={18} />
                </div>
                <div>
                  <h4 className="text-[13px] font-semibold text-[#FFFFFF]">100% Number Masking</h4>
                  <p className="text-[11px] text-[#FFFFFF]/50">Callers never see your number</p>
                </div>
              </div>
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-xs">
                  <Zap size={18} />
                </div>
                <div>
                  <h4 className="text-[13px] font-semibold text-[#FFFFFF]">0.4s Instant Alert</h4>
                  <p className="text-[11px] text-[#FFFFFF]/50">WhatsApp &amp; SMS ping within 2s</p>
                </div>
              </div>
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-500/10 text-blue-400 shadow-xs">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <h4 className="text-[13px] font-semibold text-[#FFFFFF]">No Subscription Fees</h4>
                  <p className="text-[11px] text-[#FFFFFF]/50">Pay once, protected for life</p>
                </div>
              </div>
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#FFFFFF]/20 bg-[#FFFFFF]/10 text-[#FFFFFF] shadow-xs">
                  <Truck size={18} />
                </div>
                <div>
                  <h4 className="text-[13px] font-semibold text-[#FFFFFF]">Free Shipping</h4>
                  <p className="text-[11px] text-[#FFFFFF]/50">Doorstep delivery across India</p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 6. PHOTO WALL — authentic real-world tags ───────────────────── */}
      <section className="relative overflow-hidden bg-[#14120C] py-16 sm:py-24 lg:py-32">
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <Reveal>
            <h2 className="max-w-md px-6 text-center text-[clamp(1.8rem,4.6vw,3.2rem)] font-medium leading-[1.05] tracking-[-0.035em] text-[#FFFFFF] drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)]">
              Protected by RepiQR
            </h2>
          </Reveal>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-3 px-3 opacity-45 sm:gap-4 sm:px-4">
          {MOSAIC_COLUMNS.map((column, ci) => (
            <Parallax key={ci} distance={ci === 1 ? 90 : 45}>
              <div className="space-y-3 sm:space-y-4">
                {column.map((img, ri) => (
                  <div
                    key={`${ci}-${ri}`}
                    className="overflow-hidden rounded-xl border border-[#FFFFFF]/5 sm:rounded-2xl"
                  >
                    <img src={img} alt="" aria-hidden="true" className="aspect-4/3 w-full object-cover" />
                  </div>
                ))}
              </div>
            </Parallax>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-0 z-[15] bg-gradient-to-b from-[#14120C] via-[#14120C]/55 to-[#14120C]" />
      </section>

      {/* ── 7. CATEGORY TICKER ──────────────────────────────────────────── */}
      <section className="overflow-hidden border-y border-[#FFFFFF]/10 bg-[#14120C] py-6">
        <Marquee duration={44}>
          {BADGE_ITEMS.map((item) => (
            <span
              key={`a-${item.label}`}
              className="flex items-center gap-2.5 whitespace-nowrap rounded-full border border-[#FFFFFF]/10 px-5 py-2.5 text-[13px] font-light text-[#FFFFFF]/55"
            >
              <item.icon size={15} className="text-[#FFFFFF]/35" />
              {item.label}
            </span>
          ))}
        </Marquee>
      </section>

      {/* ── 8. PRODUCTS — Choose Product & Buy Now ──────────────────────── */}
      <section id="products-section" className="bg-[#FEFDF9] py-16 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-10">
          <Reveal className="flex flex-col gap-8 border-b border-[#14120C]/10 pb-10 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.18em] text-[#14120C]/60">
                The RepiQR collection
              </p>
              <h2 className="text-[clamp(2rem,4.2vw,3.4rem)] font-medium leading-[1.02] tracking-[-0.04em]">
                <SplitWords text="Protection, made personal" />
              </h2>
              <p className="mt-4 max-w-lg text-[15px] font-light leading-relaxed text-[#14120C]/60">
                Choose a purpose-built tag for the things that move through your day.
                Every one includes lifetime validity and private contact routing.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-5 text-[11px] uppercase tracking-[0.14em] text-[#14120C]/60">
              <span><strong className="text-[#14120C]">{products.length}</strong> tag styles</span>
              <span className="h-5 w-px bg-[#14120C]/15" />
              <span><strong className="text-[#14120C]">∞</strong> validity</span>
            </div>
          </Reveal>

          {/* Tabs */}
          <Reveal delay={0.12} className="mt-10 flex flex-wrap justify-center gap-2">
            {(['All', 'Vehicle', 'Home', 'Family', 'Travel'] as const).map((cat) => {
              const on = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`relative cursor-pointer rounded-full px-5 py-2 text-[13px] font-medium transition-colors ${
                    on ? 'text-[#14120C]' : 'text-[#14120C]/55 hover:text-[#14120C]'
                  }`}
                >
                  {on && (
                    <motion.span
                      layoutId="product-tab"
                      transition={{ duration: 0.45, ease: EASE }}
                      className="absolute inset-0 rounded-full bg-[#C9A227]"
                    />
                  )}
                  <span className="relative z-10">{cat}</span>
                </button>
              );
            })}
          </Reveal>
        </div>

        {/* Product grid */}
        <div className="relative mt-12 px-6 sm:px-10">
          <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product, i) => (
                <motion.article
                  key={product.id}
                  layout
                  initial={reduced ? undefined : { opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.7, delay: i * 0.07, ease: EASE }}
                  className="group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-[#14120C] shadow-[0_24px_60px_-28px_rgba(0,0,0,0.65)]"
                >
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <img
                      src={product.img}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#14120C] via-[#14120C]/10 to-transparent" />
                    <span className="absolute left-5 top-5 rounded-full border border-[#FFFFFF]/15 bg-[#14120C]/40 px-3 py-1 text-[11px] font-light text-[#FFFFFF]/80 backdrop-blur-sm">
                      {product.badge}
                    </span>
                    <span className="absolute bottom-5 left-5 text-[11px] font-medium uppercase tracking-[0.14em] text-[#FFFFFF]/55">
                      {product.category}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-6 pt-2 text-[#FFFFFF] sm:p-7 sm:pt-3">
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="text-xl font-medium tracking-[-0.02em]">{product.name}</h3>
                        <div className="shrink-0 text-right">
                          <div className="text-lg font-medium">₹{product.price}</div>
                          <div className="text-[11px] font-light text-[#FFFFFF]/50 line-through">
                            ₹{product.mrp}
                          </div>
                        </div>
                      </div>

                      <p className="mt-2.5 text-[13px] font-light leading-relaxed text-[#FFFFFF]/55">
                        {product.desc}
                      </p>

                      <ul className="mt-5 space-y-2">
                        {product.features.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-[12px] font-light text-[#FFFFFF]/60">
                            <Check size={13} className="mt-[3px] shrink-0" style={{ color: '#FFFFFF' }} />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      {/* BUY NOW & ADD TO CART */}
                      <div className="mt-6 flex items-center gap-2.5">
                        <button
                          onClick={() => handleBuyNow(product)}
                          className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-[#FFFFFF] py-3 text-[13px] font-bold text-[#14120C] shadow-md transition-all hover:bg-neutral-100 hover:shadow-lg active:scale-95"
                        >
                          <span>Buy Now</span>
                          <ArrowRight size={15} />
                        </button>
                        <button
                          onClick={() => addToCart(product, 1)}
                          className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[#FFFFFF]/20 text-[#FFFFFF]/80 transition-all hover:border-[#FFFFFF]/50 hover:bg-[#FFFFFF]/10 hover:text-[#FFFFFF] active:scale-95"
                          title={`Add ${product.name} to cart`}
                          aria-label={`Add ${product.name} to cart`}
                        >
                          <ShoppingBag size={16} />
                        </button>
                      </div>

                      {product.rating && (
                        <div className="mt-4 flex items-center gap-1.5 text-[11px] font-light text-[#FFFFFF]/50">
                          <Star size={12} style={{ color: '#FFFFFF' }} fill="#FFFFFF" />
                          {product.rating} · {product.reviewsCount?.toLocaleString('en-IN')} owners
                        </div>
                      )}
                    </div>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ── 11. PRICING ─────────────────────────────────────────────────── */}
      <section id="pricing-section" className="bg-[#FEFDF9] py-16 sm:py-24 lg:py-32">
      
      
      
        <div className="mx-auto max-w-[1400px] px-6 sm:px-10">
          <Reveal className="text-center">
            <h2 className="text-[clamp(1.9rem,4.2vw,3.2rem)] font-medium leading-[1.05] tracking-[-0.035em]">
              Pricing plans for every need
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[15px] font-light text-[#14120C]/60">
              Lifetime validity, no recurring subscription. Talk to us for volume pricing.
            </p>
          </Reveal>

          <div className="mx-auto mt-10 grid max-w-5xl gap-5 sm:mt-16 md:grid-cols-3">
            {PRICING_PLANS.map((plan, i) => (
              <Reveal key={plan.id} delay={i * 0.1}>
                <motion.div
                  whileHover={reduced ? undefined : { y: -6 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className={`flex h-full flex-col justify-between rounded-3xl p-6 sm:p-8 ${
                    plan.featured
                      ? 'bg-[#14120C] text-[#FFFFFF]'
                      : 'border border-[#14120C]/10 bg-[#FFFFFF] text-[#14120C]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[11px] font-light uppercase tracking-[0.16em] ${
                          plan.featured ? 'text-[#FFFFFF]/50' : 'text-[#14120C]/60'
                        }`}
                      >
                        {plan.name}
                      </span>
                      {plan.featured && (
                        <span
                          className="rounded-full px-2.5 py-1 text-[10px] font-semibold text-[#14120C]"
                          style={{ background: '#FFFFFF' }}
                        >
                          Popular
                        </span>
                      )}
                    </div>

                    <div className="mt-5 text-[2rem] font-light tracking-[-0.04em]">Contact us</div>
                    <p
                      className={`mt-2 text-[13px] font-light ${
                        plan.featured ? 'text-[#FFFFFF]/50' : 'text-[#14120C]/60'
                      }`}
                    >
                      {plan.desc}
                    </p>

                    <ul className="mt-8 space-y-3">
                      {plan.features.map((f) => (
                        <li
                          key={f}
                          className={`flex items-start gap-2.5 text-[13px] font-light ${
                            plan.featured ? 'text-[#FFFFFF]/70' : 'text-[#14120C]/60'
                          }`}
                        >
                          <Check size={14} className="mt-[3px] shrink-0" style={{ color: '#FFFFFF' }} />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => {
                      setPartnerForm((prev) => ({ ...prev, tier: plan.tier }));
                      setIsPartnerModalOpen(true);
                    }}
                    className={`mt-10 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full py-3.5 text-[13px] font-semibold transition-transform hover:scale-[1.02] active:scale-95 ${
                      plan.featured
                        ? 'bg-[#FFFFFF] text-[#14120C]'
                        : 'bg-[#C9A227] text-[#14120C]'
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight size={14} />
                  </button>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 12. JOIN US — service-provider application ───────────────────── */}
      {false && <section id="join-section" className="bg-[#FEFDF9] py-16 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-10">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="mb-4 text-[11px] font-light uppercase tracking-[0.18em] text-[#14120C]/60">
              Join us
            </p>
            <h2 className="text-[clamp(1.9rem,4.2vw,3.2rem)] font-medium leading-[1.05] tracking-[-0.035em]">
              <SplitWords text="Become a service partner" />
            </h2>
            <p className="mt-4 text-[15px] font-light leading-relaxed text-[#14120C]/60">
              Ambulance, towing, mechanic, plumber, vet, security — whatever you do, get
              listed once and take masked calls the moment a nearby tag is scanned.
            </p>
          </Reveal>

          <div className="mt-14 grid items-stretch gap-5 lg:grid-cols-2">
            {/* Visual panel, retinted to the service picked in the navbar */}
            <Reveal className="h-full">
              <div className="relative flex h-full min-h-[420px] flex-col justify-end overflow-hidden rounded-3xl bg-[#14120C]">
                <img
                  src={stepImg4}
                  alt="A RepiQR scan reaching a nearby service partner"
                  className="absolute inset-0 h-full w-full object-cover opacity-40"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#14120C] via-[#14120C]/75 to-[#14120C]/25" />

                <div className="relative p-8 text-[#FFFFFF] sm:p-10">
                  <div className="inline-flex items-center gap-3 rounded-2xl border border-[#FFFFFF]/15 bg-[#FFFFFF]/10 px-3.5 py-2.5 backdrop-blur-sm">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: joinServiceMeta.bg, color: joinServiceMeta.color }}
                    >
                      <joinServiceMeta.Icon size={16} />
                    </span>
                    <span>
                      <span className="block text-[10px] font-light uppercase tracking-[0.14em] text-[#FFFFFF]/50">
                        Applying as
                      </span>
                      <span className="block text-[13px] font-medium">
                        {joinServiceType.label} provider
                      </span>
                    </span>
                  </div>

                  <h3 className="mt-7 max-w-sm text-2xl font-medium leading-snug tracking-[-0.02em]">
                    Your number stays private. The work still finds you.
                  </h3>

                  <ul className="mt-6 space-y-3.5">
                    {JOIN_BENEFITS.map((line) => (
                      <li
                        key={line}
                        className="flex items-start gap-2.5 text-[13px] font-light leading-relaxed text-[#FFFFFF]/70"
                      >
                        <CheckCircle2 size={15} className="mt-0.5 shrink-0" style={{ color: '#FFFFFF' }} />
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>

            {/* Application form */}
            <Reveal delay={0.12} className="h-full">
              <div className="h-full rounded-3xl border border-[#14120C]/8 bg-[#FFFFFF] p-7 sm:p-9">
                {joinSubmitted ? (
                  <div className="flex h-full flex-col items-center justify-center py-10 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
                      <CheckCircle2 size={26} className="text-emerald-600" />
                    </div>
                    <h3 className="mt-5 text-xl font-medium">Application received</h3>
                    <p className="mt-3 max-w-sm text-[14px] font-light leading-relaxed text-[#14120C]/55">
                      Thank you, <span className="font-medium text-[#14120C]">{joinForm.label}</span>.
                      Your <span className="font-medium text-[#14120C]">{joinServiceType.label}</span>{' '}
                      listing for <span className="font-medium text-[#14120C]">{joinForm.city}</span> is
                      pending review. We will call you on{' '}
                      <span className="font-medium text-[#14120C]">{joinForm.phone}</span> once it is
                      approved.
                    </p>
                    <button
                      onClick={resetJoinForm}
                      className="mt-7 cursor-pointer rounded-full bg-[#14120C]/5 px-6 py-3 text-[13px] font-medium text-[#14120C]/70 transition-colors hover:bg-[#14120C]/10"
                    >
                      Submit another provider
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleJoinSubmit} className="space-y-5">
                    <div>
                      <label className="mb-2 block text-[11px] font-light uppercase tracking-[0.14em] text-[#14120C]/60">
                        Service type
                      </label>
                      <select
                        value={joinForm.serviceType}
                        onChange={(e) => setJoinForm({ ...joinForm, serviceType: e.target.value })}
                        className="w-full cursor-pointer rounded-xl border border-[#14120C]/12 bg-[#FFFFFF] px-4 py-3 text-[16px] font-light outline-hidden transition-colors focus:border-[#14120C] sm:text-[14px]"
                      >
                        {SERVICE_TYPES.filter((t) => t.slug !== 'police').map((t) => (
                          <option key={t.slug} value={t.slug}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-[11px] font-light uppercase tracking-[0.14em] text-[#14120C]/60">
                        Provider / business name *
                      </label>
                      <input
                        value={joinForm.label}
                        onChange={(e) => setJoinForm({ ...joinForm, label: e.target.value })}
                        placeholder={joinServiceMeta.placeholder}
                        /* 16px on phones: iOS Safari zooms the whole page when a
                           focused field is smaller, and never zooms back out. */
                        className="w-full rounded-xl border border-[#14120C]/12 px-4 py-3 text-[16px] font-light outline-hidden transition-colors focus:border-[#14120C] sm:text-[14px]"
                      />
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-[11px] font-light uppercase tracking-[0.14em] text-[#14120C]/60">
                          Phone *
                        </label>
                        <PhoneInputWithCountry
                          value={joinForm.phone}
                          onChange={(full) => setJoinForm({ ...joinForm, phone: full })}
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-[11px] font-light uppercase tracking-[0.14em] text-[#14120C]/60">
                          City / service area *
                        </label>
                        <input
                          value={joinForm.city}
                          onChange={(e) => setJoinForm({ ...joinForm, city: e.target.value })}
                          placeholder="e.g. Pune"
                          /* 16px on phones: iOS Safari zooms the whole page when a
                           focused field is smaller, and never zooms back out. */
                        className="w-full rounded-xl border border-[#14120C]/12 px-4 py-3 text-[16px] font-light outline-hidden transition-colors focus:border-[#14120C] sm:text-[14px]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-[11px] font-light uppercase tracking-[0.14em] text-[#14120C]/60">
                        Email
                      </label>
                      <div className="relative">
                        <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#14120C]/30" />
                        <input
                          type="email"
                          value={joinForm.email}
                          onChange={(e) => setJoinForm({ ...joinForm, email: e.target.value })}
                          placeholder="you@company.com"
                          className="w-full rounded-xl border border-[#14120C]/12 py-3 pl-11 pr-4 text-[14px] font-light outline-hidden transition-colors focus:border-[#14120C]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2.5 block text-[11px] font-light uppercase tracking-[0.14em] text-[#14120C]/60">
                        Categories you cover
                        <span className="ml-2 normal-case tracking-normal text-[#14120C]/60">
                          — leave empty to cover all
                        </span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {STICKER_CATEGORIES.map((c) => {
                          const on = joinForm.categories.includes(c.value);
                          return (
                            <button
                              key={c.value}
                              type="button"
                              onClick={() => toggleJoinCategory(c.value)}
                              className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-4 py-2 text-[12px] font-light transition-all ${
                                on
                                  ? 'border-[#14120C] bg-[#14120C] text-[#FFFFFF]'
                                  : 'border-[#14120C]/12 text-[#14120C]/60 hover:border-[#14120C]/35'
                              }`}
                            >
                              {on && <Check size={11} />} {c.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-[11px] font-light uppercase tracking-[0.14em] text-[#14120C]/60">
                        Anything else we should know
                      </label>
                      <textarea
                        value={joinForm.notes}
                        onChange={(e) => setJoinForm({ ...joinForm, notes: e.target.value })}
                        rows={3}
                        placeholder="Hours, coverage radius, fleet size, licence number…"
                        className="w-full resize-none rounded-xl border border-[#14120C]/12 px-4 py-3 text-[14px] font-light outline-hidden transition-colors focus:border-[#14120C]"
                      />
                    </div>

                    {joinError && (
                      <p className="rounded-xl bg-red-50 px-4 py-3 text-[13px] font-light text-red-700">
                        {joinError}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={joinSubmitting || !joinFormIsValid}
                      className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#14120C] py-4 text-[13px] font-semibold text-[#FFFFFF] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      {joinSubmitting ? (
                        <>
                          <Loader2 size={15} className="animate-spin" /> Submitting…
                        </>
                      ) : (
                        <>
                          Submit application
                          <ArrowRight size={14} style={{ color: '#FFFFFF' }} />
                        </>
                      )}
                    </button>

                    <p className="text-center text-[11px] font-light text-[#14120C]/60">
                      We verify every provider before listing. No fee to apply.
                    </p>
                  </form>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </section>}

      {/* ── 13. FRANCHISE ───────────────────────────────────────────────── */}
      <section id="distributor-section" className="bg-[#14120C] py-16 text-[#FFFFFF] sm:py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-10">
          <Reveal className="max-w-2xl">
            <p className="mb-4 text-[11px] font-light uppercase tracking-[0.18em] text-[#FFFFFF]/50">
              Franchise
            </p>
            <h2 className="text-[clamp(1.9rem,4.2vw,3.2rem)] font-medium leading-[1.05] tracking-[-0.035em]">
              Become a RepiQR distributor
            </h2>
            <p className="mt-4 text-[15px] font-light leading-relaxed text-[#FFFFFF]/50">
              Retail kits, exclusive city territories and state-level master rights — with
              dealer dashboards, restock in a click and local leads routed to you.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-5 sm:mt-14 lg:grid-cols-3">
            {DISTRIBUTOR_TIERS.map((tier, i) => (
              <Reveal key={tier.id} delay={i * 0.1}>
                <motion.div
                  whileHover={reduced ? undefined : { y: -6 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className={`flex h-full flex-col justify-between rounded-3xl p-6 sm:p-8 ${
                    tier.isPopular ? 'bg-[#FFFFFF] text-[#14120C]' : 'border border-[#FFFFFF]/12 bg-[#FFFFFF]/[0.03]'
                  }`}
                >
                  <div>
                    <span
                      className={`text-[11px] font-light uppercase tracking-[0.16em] ${
                        tier.isPopular ? 'text-[#14120C]/60' : 'text-[#FFFFFF]/50'
                      }`}
                    >
                      {tier.badge}
                    </span>
                    <h3 className="mt-4 text-xl font-medium tracking-[-0.02em]">{tier.name}</h3>
                    <p
                      className={`mt-2.5 text-[13px] font-light leading-relaxed ${
                        tier.isPopular ? 'text-[#14120C]/60' : 'text-[#FFFFFF]/50'
                      }`}
                    >
                      {tier.desc}
                    </p>

                    <div
                      className={`mt-6 flex items-center gap-4 border-y py-4 text-[12px] font-light ${
                        tier.isPopular ? 'border-[#14120C]/10 text-[#14120C]/60' : 'border-[#FFFFFF]/10 text-[#FFFFFF]/55'
                      }`}
                    >
                      <span>{tier.minUnits}</span>
                      <span className={tier.isPopular ? 'text-[#14120C]/60' : 'text-[#FFFFFF]/50'}>·</span>
                      <span className="font-medium">{tier.margin}</span>
                    </div>

                    <ul className="mt-6 space-y-3">
                      {tier.features.map((f) => (
                        <li
                          key={f}
                          className={`flex items-start gap-2.5 text-[13px] font-light ${
                            tier.isPopular ? 'text-[#14120C]/60' : 'text-[#FFFFFF]/55'
                          }`}
                        >
                          <Check
                            size={14}
                            className="mt-[3px] shrink-0"
                            style={{ color: tier.isPopular ? '#FFFFFF' : '#FFFFFF' }}
                          />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => {
                      setPartnerForm((prev) => ({
                        ...prev,
                        tier:
                          tier.id === 'retailer-starter'
                            ? 'Retail Kit (50 Units)'
                            : tier.id === 'city-franchise'
                              ? 'City Franchise (300 Units)'
                              : 'State Partner (2500+ Units)',
                      }));
                      setIsPartnerModalOpen(true);
                    }}
                    className={`mt-10 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full py-3.5 text-[13px] font-semibold transition-transform hover:scale-[1.02] active:scale-95 ${
                      tier.isPopular ? 'bg-[#C9A227] text-[#14120C]' : 'bg-[#FFFFFF] text-[#14120C]'
                    }`}
                  >
                    {tier.ctaText}
                    <ArrowRight size={14} />
                  </button>
                </motion.div>
              </Reveal>
            ))}
          </div>

          {isLoggedIn && userAppStatus?.status === 'approved' && (
            <Reveal delay={0.2} className="mt-10">
              <button
                onClick={onOpenDistributorDashboard}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-[#FFFFFF]/15 bg-[#FFFFFF]/[0.04] py-4 text-[13px] font-medium text-[#FFFFFF] transition-colors hover:bg-[#FFFFFF]/10"
              >
                <Zap size={15} style={{ color: '#FFFFFF' }} />
                Your distributor dashboard is unlocked — open it
              </button>
            </Reveal>
          )}
        </div>
      </section>

      {/* ── 14. FAQ — full-bleed rows ───────────────────────────────────── */}
      <section id="faq-section" className="bg-[#FEFDF9] py-16 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-[1100px] px-6 sm:px-10">
          <Reveal className="mb-8 sm:mb-14">
            <h2 className="text-[clamp(1.9rem,4.2vw,3.2rem)] font-medium leading-[1.05] tracking-[-0.035em]">
              Frequently asked questions
            </h2>
          </Reveal>

          <div className="border-t border-[#14120C]/12">
            {FAQS.map((faq, i) => {
              const open = expandedFaqId === faq.id;
              return (
                <Reveal key={faq.id} delay={i * 0.05} y={16}>
                  <div className="border-b border-[#14120C]/12">
                    <button
                      onClick={() => handleToggleFaq(faq.id)}
                      aria-expanded={open}
                      className="group flex w-full cursor-pointer items-center justify-between gap-4 py-5 text-left sm:gap-6 sm:py-7"
                    >
                      <span className="text-[clamp(1.05rem,2.2vw,1.5rem)] font-light leading-snug tracking-[-0.02em] transition-colors group-hover:text-[#14120C]/60">
                        {faq.question}
                      </span>
                      <motion.span
                        animate={{ rotate: open ? 45 : 0 }}
                        transition={{ duration: 0.35, ease: EASE }}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#14120C]/12 text-[#14120C]/50"
                      >
                        <Plus size={15} />
                      </motion.span>
                    </button>

                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.45, ease: EASE }}
                          className="overflow-hidden"
                        >
                          <p className="max-w-2xl pb-8 text-[14px] font-light leading-relaxed text-[#14120C]/55">
                            {faq.answer}
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

      {/* ── 15. CLOSING CALL TO ACTION ──────────────────────────────────── */}
      <section
        ref={ctaRef}
        className="relative flex min-h-[80vh] items-center justify-center overflow-hidden bg-[#14120C] py-20 sm:py-28"
      >
        <motion.div
          style={reduced ? undefined : { scale: ctaRingScale, opacity: ctaRingOpacity }}
          className="absolute inset-0"
        >
          <ParticleRing />
        </motion.div>

        <div className="relative z-10 mx-auto max-w-2xl px-6 text-center">
          <h2 className="text-[clamp(2rem,5.4vw,3.8rem)] font-medium leading-[1.03] tracking-[-0.035em] text-[#FFFFFF]">
            Get Your
            <br />
            RepiQR tag today
          </h2>

          <Reveal delay={0.3}>
            <p className="mx-auto mt-6 max-w-md text-[15px] font-light text-[#FFFFFF]/50">
              Weatherproof tag, masked calls, lifetime dashboard. No subscription.
            </p>

            <button
              onClick={() => handleSmoothScroll('products-section')}
              className="group mt-10 inline-flex cursor-pointer items-center gap-2.5 rounded-full bg-[#FFFFFF] px-9 py-4 text-sm font-bold text-[#14120C] transition-transform hover:scale-[1.04] active:scale-95 shadow-lg"
            >
              Choose your tag
              <ArrowRight
                size={15}
                className="transition-transform group-hover:translate-x-1 text-[#14120C]"
              />
            </button>
          </Reveal>
        </div>
      </section>

      {/* ── 16. FOOTER ──────────────────────────────────────────────────── */}
      <footer
        ref={footerRef}
        className="relative overflow-hidden border-t border-[#FFFFFF]/10 bg-[#14120C] pb-32 pt-14 text-[#FFFFFF] sm:pb-40 sm:pt-20"
      >
        <div className="relative z-10 mx-auto max-w-[1400px] px-6 sm:px-10">
          <div className="grid gap-12 pb-16 md:grid-cols-12">
            <div className="space-y-4 md:col-span-4">
              <img src={darkBgLogo} alt="RepiQR" className="h-8 w-auto object-contain" />
              <p className="text-[13px] font-light text-[#FFFFFF]/50">Scan. Connect. Stay Safe.</p>
            </div>

            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-8">
              <div className="space-y-3.5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#FFFFFF]/60">
                  Product
                </div>
                <ul className="space-y-2.5 text-[13px] font-light text-[#FFFFFF]/55">
                  {['Vehicle Safety QR', 'Bike Safety QR', 'Child Safety QR', 'Home Safety QR'].map(
                    (label) => (
                      <li key={label}>
                        <button
                          onClick={onOpenCheckout}
                          className="cursor-pointer text-left transition-colors hover:text-[#FFFFFF]"
                        >
                          {label}
                        </button>
                      </li>
                    ),
                  )}
                </ul>
              </div>

              <div className="space-y-3.5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#FFFFFF]/60">
                  Company
                </div>
                <ul className="space-y-2.5 text-[13px] font-light text-[#FFFFFF]/55">
                  <li>
                    <button
                      onClick={() => handleSmoothScroll('hiw-section')}
                      className="cursor-pointer text-left transition-colors hover:text-[#FFFFFF]"
                    >
                      About Us
                    </button>
                  </li>
                  <li>
                    <a
                      href="mailto:admin@repiqr.com"
                      className="cursor-pointer text-left transition-colors hover:text-[#FFFFFF]"
                    >
                      Contact
                    </a>
                  </li>
                  <li>
                    <button
                      onClick={onOpenPrivacy}
                      className="cursor-pointer text-left transition-colors hover:text-[#FFFFFF]"
                    >
                      Privacy Policy
                    </button>
                  </li>
                  <li>Terms &amp; Conditions</li>
                </ul>
              </div>

              <div className="space-y-3.5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#FFFFFF]/60">
                  Contact
                </div>
                <ul className="space-y-2.5 text-[13px] font-light leading-relaxed text-[#FFFFFF]/55">
                  <li>
                    38 Kadambari Complex,
                    <br />
                    Opp. Asthalni Jagya, Thangadh,
                    <br />
                    Surendranagar, Gujarat 363530
                  </li>
                  <li>
                    <a href="mailto:admin@repiqr.com" className="transition-colors hover:text-[#FFFFFF]">
                      admin@repiqr.com
                    </a>
                  </li>
                  <li>
                    <a href="tel:+919313719720" className="transition-colors hover:text-[#FFFFFF]">
                      +91 93137 19720
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 border-t border-[#FFFFFF]/10 pt-8 text-[12px] font-light text-[#FFFFFF]/50">
            <p>
              <span className="font-semibold text-[#FFFFFF]/70">RepiQR</span> is a product of{' '}
              <span className="font-semibold text-[#FFFFFF]/70">Worthite LLP</span> | LLPIN: ADA-2053 |
              GSTIN: 24AAFFW7093N1ZH
            </p>
            <p className="text-[#FFFFFF]/35">
              © {new Date().getFullYear()} Worthite LLP. All rights reserved.
            </p>
          </div>
        </div>

        {/* Watermark drifts as the page bottoms out */}
        <motion.div
          style={reduced ? undefined : { y: watermarkY }}
          className="pointer-events-none absolute inset-x-0 bottom-0 select-none text-center"
          aria-hidden="true"
        >
          <span className="block whitespace-nowrap text-[clamp(5rem,20vw,17rem)] font-medium leading-none tracking-[-0.05em] text-[#FFFFFF]/[0.045]">
            RepiQR
          </span>
        </motion.div>
      </footer>

      {/* ── 17. ADD-TO-CART CONFIRMATION ───────────────────────────────── */}
      <AnimatePresence>
        {cartNotice && (
          <motion.div
            initial={{ opacity: 0, x: 28, y: 12 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 28, y: 12 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="fixed bottom-[max(1.25rem,calc(env(safe-area-inset-bottom)+0.5rem))] right-5 z-[520] flex w-[min(360px,calc(100vw-2.5rem))] items-center gap-3 rounded-2xl border border-[#14120C]/8 bg-[#FFFFFF] p-4 shadow-[0_20px_55px_-18px_rgba(0,0,0,0.45)]"
            role="status"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#14120C] text-[#FFFFFF]">
              <Check size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-[#14120C]">Added to your cart</p>
              <p className="mt-0.5 truncate text-[12px] font-light text-[#14120C]/60">
                {cartNotice.qty > 1 ? `${cartNotice.qty} × ` : ''}{cartNotice.name}
              </p>
            </div>
            <button
              onClick={() => setIsCartOpen(true)}
              className="shrink-0 cursor-pointer text-[12px] font-semibold text-[#14120C]/60 underline underline-offset-4 transition-colors hover:text-[#14120C]"
            >
              View cart
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 18. CART DRAWER ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {isCartOpen && (
          /* The wrapper is a motion component so its removal defers unmount and
             the backdrop and panel below get to play their exit. */
          <motion.div key="cart" className="fixed inset-0 z-[500] flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-[#14120C]/50 backdrop-blur-sm"
              onClick={() => setIsCartOpen(false)}
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.45, ease: EASE }}
              /* Full-bleed on a phone, a panel from tablet up. The scroller is
                 the whole aside, so its bottom padding is what lifts the
                 checkout button clear of the home indicator. */
              className="relative z-10 flex h-full w-full max-w-md flex-col justify-between overflow-y-auto overscroll-contain bg-[#FFFFFF] px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-7 sm:pb-[max(1.75rem,env(safe-area-inset-bottom))]"
            >
              <div>
                <div className="flex items-center justify-between border-b border-[#14120C]/8 pb-5">
                  <span className="text-lg font-medium tracking-[-0.02em]">Your cart</span>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="cursor-pointer rounded-full p-2 transition-colors hover:bg-[#14120C]/5"
                    aria-label="Close cart"
                  >
                    <X size={18} />
                  </button>
                </div>

                {cart.length === 0 ? (
                  <div className="py-20 text-center">
                    <ShoppingBag size={36} className="mx-auto mb-4 text-[#14120C]/15" />
                    <p className="text-[14px] font-medium">Your cart is empty</p>
                    <p className="mt-1 text-[12px] font-light text-[#14120C]/60">
                      Add a tag to start protecting something.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 space-y-5">
                    {cart.map((item) => (
                      <div key={item.product.id} className="flex items-center gap-4">
                        <img
                          src={item.product.img}
                          alt={item.product.name}
                          className="h-16 w-16 rounded-xl object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate text-[13px] font-medium">{item.product.name}</h4>
                          <div className="mt-1 text-[13px] font-light text-[#14120C]/60">
                            ₹{item.product.price}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 rounded-full border border-[#14120C]/10 p-1">
                          <button
                            onClick={() =>
                              setCart((prev) =>
                                prev
                                  .map((i) =>
                                    i.product.id === item.product.id ? { ...i, qty: i.qty - 1 } : i
                                  )
                                  .filter((i) => i.qty > 0)
                              )
                            }
                            className="cursor-pointer rounded-full p-1.5 transition-colors hover:bg-[#14120C]/5"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="min-w-4 text-center text-[12px] font-medium">{item.qty}</span>
                          <button
                            onClick={() =>
                              setCart((prev) =>
                                prev.map((i) =>
                                  i.product.id === item.product.id ? { ...i, qty: i.qty + 1 } : i
                                )
                              )
                            }
                            className="cursor-pointer rounded-full p-1.5 transition-colors hover:bg-[#14120C]/5"
                            aria-label="Increase quantity"
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
                <div className="border-t border-[#14120C]/8 pt-5">
                  <div className="mb-5 flex items-center justify-between text-base font-medium">
                    <span>Subtotal</span>
                    <span>₹{cartSubtotal}</span>
                  </div>
                  <button
                    onClick={openCheckout}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#C9A227] py-4 text-[13px] font-semibold text-[#14120C] transition-transform hover:scale-[1.01] active:scale-[0.99]"
                  >
                    Proceed to checkout
                    <ArrowRight size={14} style={{ color: '#14120C' }} />
                  </button>
                </div>
              )}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 18. DISTRIBUTOR APPLICATION MODAL ───────────────────────────── */}
      <AnimatePresence>
        {isPartnerModalOpen && (
          <motion.div
            key="partner-modal"
            className="fixed inset-0 z-[600] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-[#14120C]/60 backdrop-blur-sm"
              onClick={() => {
                setIsPartnerModalOpen(false);
                setPartnerSubmitted(false);
              }}
            />
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-[#FFFFFF] p-7 text-left sm:p-9"
            >
              <button
                onClick={() => {
                  setIsPartnerModalOpen(false);
                  setPartnerSubmitted(false);
                }}
                className="absolute right-5 top-5 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-[#14120C]/5 text-[#14120C]/50 transition-colors hover:bg-[#14120C]/10"
                aria-label="Close"
              >
                <X size={17} />
              </button>

              {userAppStatus?.status === 'approved' ? (
                <div className="space-y-5 py-6 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
                    <CheckCircle2 size={26} className="text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-medium tracking-[-0.02em]">Distributor approved</h3>
                  <p className="mx-auto max-w-xs text-[13px] font-light leading-relaxed text-[#14120C]/55">
                    Congratulations{' '}
                    <span className="font-medium text-[#14120C]">
                      {profile?.fullName || userAppStatus.userName}
                    </span>
                    . Your franchise application has been verified and your distributor dashboard
                    is unlocked.
                  </p>
                  <button
                    onClick={() => {
                      setIsPartnerModalOpen(false);
                      onOpenDistributorDashboard?.();
                    }}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#C9A227] py-3.5 text-[13px] font-semibold text-[#14120C]"
                  >
                    Open distributor dashboard <ArrowRight size={15} />
                  </button>
                </div>
              ) : userAppStatus?.status === 'pending' || partnerSubmitted ? (
                <div className="space-y-5 py-6 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#14120C]/5">
                    <Loader2 size={24} className="animate-spin text-[#14120C]/40" />
                  </div>
                  <h3 className="text-2xl font-medium tracking-[-0.02em]">Pending verification</h3>
                  <p className="mx-auto max-w-xs text-[13px] font-light leading-relaxed text-[#14120C]/55">
                    Thank you{' '}
                    <span className="font-medium text-[#14120C]">
                      {partnerForm.name || userAppStatus?.userName || 'partner'}
                    </span>
                    . Please wait — our team will accept your distributor request and contact you shortly.
                  </p>
                  <button
                    onClick={() => {
                      setIsPartnerModalOpen(false);
                      setPartnerSubmitted(false);
                    }}
                    className="cursor-pointer rounded-full bg-[#14120C]/5 px-6 py-3 text-[13px] font-medium text-[#14120C]/70 transition-colors hover:bg-[#14120C]/10"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-6 flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#14120C]/[0.04]">
                      <Handshake size={19} className="text-[#14120C]/60" />
                    </span>
                    <div>
                      <h3 className="text-xl font-medium tracking-[-0.02em]">Become a partner</h3>
                      <p className="text-[12px] font-light text-[#14120C]/60">
                        Apply for a RepiQR distributorship or franchise
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handlePartnerSubmit} className="space-y-4">
                    <div>
                      <label className="mb-2 block text-[11px] font-light uppercase tracking-[0.14em] text-[#14120C]/60">
                        Full name / company
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ramesh Auto Accessories"
                        value={partnerForm.name}
                        onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })}
                        /* 16px on phones: iOS Safari zooms the whole page when a
                           focused field is smaller, and never zooms back out. */
                        className="w-full rounded-xl border border-[#14120C]/12 px-4 py-3 text-[16px] font-light outline-hidden transition-colors focus:border-[#14120C] sm:text-[14px]"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-[11px] font-light uppercase tracking-[0.14em] text-[#14120C]/60">
                          Phone / WhatsApp
                        </label>
                        <PhoneInputWithCountry
                          required
                          value={partnerForm.phone}
                          onChange={(full) => setPartnerForm({ ...partnerForm, phone: full })}
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-[11px] font-light uppercase tracking-[0.14em] text-[#14120C]/60">
                          City &amp; state
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Pune, Maharashtra"
                          value={partnerForm.city}
                          onChange={(e) => setPartnerForm({ ...partnerForm, city: e.target.value })}
                          /* 16px on phones: iOS Safari zooms the whole page when a
                           focused field is smaller, and never zooms back out. */
                        className="w-full rounded-xl border border-[#14120C]/12 px-4 py-3 text-[16px] font-light outline-hidden transition-colors focus:border-[#14120C] sm:text-[14px]"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#C9A227] py-4 text-[13px] font-semibold text-[#14120C] transition-transform hover:scale-[1.01] active:scale-[0.99]"
                    >
                      Submit application
                      <ArrowRight size={14} style={{ color: '#14120C' }} />
                    </button>
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

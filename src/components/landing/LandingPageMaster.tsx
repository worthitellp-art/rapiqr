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
  type MotionValue,
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
  Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
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

// Image assets
import stepImg1 from '../../../assets/landing-step-1.webp';
import stepImg2 from '../../../assets/landing-step-2.webp';
import stepImg3 from '../../../assets/landing-step-3.webp';
import stepImg4 from '../../../assets/landing-step-4.webp';
import stepImg5 from '../../../assets/landing-step-5.webp';
import darkBgLogo from '../../../assets/darkbglogo.png';
/* JPEG, not the source PNGs. These are photographs — PNG stored them losslessly
   at 1.24 MB and 1.29 MB, and this is the hero's largest-contentful-paint, so
   that was 2.5 MB standing between a visitor and their first view of the page.
   Same pixels, 164 KB the pair. Regenerate with docs/hero-media.md. */
import heroImage from '../../../assets/hero-bg.jpg';
import heroImagePortrait from '../../../assets/hero-bg-portrait.jpg';
/* hero-bg.mp4, not bg.mp4. The source master is 1920×1080 at 17 Mbps with its
   moov atom written last, so a browser had to download nearly all 16 MB before
   it could show a single frame. This is the web encode: same 1080p, H.264 High
   at 2.2 Mbps, audio stripped, moov moved to the front — 2.1 MB, and it starts
   playing while it streams.

   It also loops properly. The source cuts hard at the wrap (its first and last
   frames differ by 61/255), so the encode fades up from black at the head and
   down to black at the tail; both ends now match and the seam is invisible.
   That dip to black is the loop, and it is deliberate — see docs/hero-media.md.
   Only the file imported here ships in the build. */
import heroVideo from '../../../assets/hero-bg.mp4';

/* Hero backdrop.
 *
 * Two crops of the same scene rather than one: hero.png is landscape (1717×916)
 * and gets letterboxed into a phone's tall viewport, cropping the subject out.
 * resbg.png is the portrait cut (849×1852) and is what a phone should get.
 * `<picture>` picks between them on orientation, so the browser downloads
 * exactly one — choosing in JS would download the wrong one first.
 *
 * The video is an enhancement layered on top and is never on the critical path;
 * see HeroBackdrop for when it is allowed to load at all. */
const HERO_BG_LANDSCAPE = heroImage;
const HERO_BG_PORTRAIT = heroImagePortrait;
const HERO_VIDEO = heroVideo;

/* ──────────────────────────────────────────────────────────────────────────
   PALETTE
   Near-black and warm paper carry the whole page; amber is a signature, not a
   theme — it appears only on arrow glyphs, the active progress line and a
   handful of small dots. Every panel that used to be a yellow wash is paper.
   ────────────────────────────────────────────────────────────────────────── */
const INK = '#0B0B0C';

// ── Types ──────────────────────────────────────────────────────────────────

export interface LandingPageMasterProps {
  onStart?: () => void;
  onLogin?: () => void;
  onOpenDistributorDashboard?: () => void;
  onOpenCheckout?: () => void;
  onOpenJoinUs?: (serviceType?: string) => void;
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

const PRODUCTS: ProductItem[] = [
  {
    id: 'car-qr',
    name: 'Automobile Safety Tag',
    desc: 'Windshield and rear-glass tag that keeps your phone number off the glass.',
    price: 299,
    mrp: 599,
    category: 'Vehicle',
    badge: 'For vehicles',
    img: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=85',
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
    img: 'https://images.unsplash.com/photo-1558008258-3256797b43f3?auto=format&fit=crop&w=1200&q=85',
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
    img: 'https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=1200&q=85',
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
    img: 'https://images.unsplash.com/photo-1553531384-cc64ac80f931?auto=format&fit=crop&w=1200&q=85',
    rating: 4.9,
    reviewsCount: 2860,
    features: ['Airport baggage recovery', 'Instant finder chat', 'No app for the finder'],
  },
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
 * The hero backdrop: a responsive still that paints immediately, with the
 * video fading in over it only once it can actually play.
 *
 * The still is the load-bearing part. It is what the first paint shows, what
 * the largest-contentful-paint is measured against, and what stays on screen
 * for anyone the video never reaches. The video is decoration on top — if it
 * loads late, or never, the hero is still finished and correct.
 *
 * The video is deliberately NOT loaded for everyone:
 *
 *  - `prefers-reduced-motion` — a looping backdrop is exactly what that asks
 *    us not to play.
 *  - Save-Data, or a connection reporting 2g/3g — background decoration must
 *    never spend someone's data allowance.
 *  - Coarse pointers / narrow viewports — phones get the still. At the file's
 *    current size this is the difference between a hero that appears at once
 *    and one that hijacks the connection for several seconds.
 *
 * Even when it is allowed, the fetch waits for an idle callback so it starts
 * after the page is interactive rather than competing with it, and playback is
 * suspended whenever the hero is off screen or the tab is hidden — decoding
 * video nobody can see is the usual reason a landing page scrolls badly.
 *
 * The still and the video are NOT the same footage, so the two must never be
 * visible together — see the hand-over effect below for how that is avoided.
 */
/** How long the video takes to reach full opacity while parked on its black frame 0. */
const HERO_VIDEO_FADE_MS = 500;

function HeroBackdrop({
  reduced,
  parallaxY,
  parallaxScale,
}: {
  reduced: boolean | null;
  parallaxY: MotionValue<string> | MotionValue<number>;
  parallaxScale: MotionValue<number>;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [wantsVideo, setWantsVideo] = useState(false);
  /** Opaque, but still parked on its black first frame. */
  const [videoVisible, setVideoVisible] = useState(false);
  /** Cleared to run — only once the fade above has finished. */
  const [videoPlaying, setVideoPlaying] = useState(false);

  // Decide once, on the client, whether this visitor should get the video.
  useEffect(() => {
    if (reduced) return;

    const connection = (navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }).connection;
    if (connection?.saveData) return;
    if (connection?.effectiveType && /(^|-)(2g|3g)$/.test(connection.effectiveType)) return;

    // Pointer type separates a phone from a small desktop window better than
    // width alone: resizing a laptop browser shouldn't drop the video.
    const isPhone =
      window.matchMedia('(pointer: coarse)').matches && window.matchMedia('(max-width: 1023px)').matches;
    if (isPhone) return;

    setWantsVideo(true);
  }, [reduced]);

  // Attach the source only when idle, so the fetch never competes with the
  // first paint. `preload="none"` plus no `src` means nothing is requested
  // until this runs.
  useEffect(() => {
    if (!wantsVideo) return;
    const video = videoRef.current;
    if (!video || video.src) return;

    const start = () => {
      video.src = HERO_VIDEO;
      video.load();
    };
    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(start, { timeout: 2500 })
      : window.setTimeout(start, 900);

    return () => {
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle as number);
      else clearTimeout(idle as number);
    };
  }, [wantsVideo]);

  /**
   * Hand over from the still to the video without ever showing both.
   *
   * The still and the video are different footage — a different car, framing and
   * lighting — so cross-dissolving them showed two pictures at once and read as
   * a glitch. The fix is to only ever fade while the video has nothing to show:
   * its first frame is encoded pure black, so we bring it up to full opacity
   * while it is still PAUSED on that frame. All the viewer sees is the still
   * dimming to black. Playback starts once the fade is over, revealing the
   * video out of that black exactly as the loop itself does.
   */
  useEffect(() => {
    if (!videoVisible || videoPlaying) return;
    const t = setTimeout(() => setVideoPlaying(true), HERO_VIDEO_FADE_MS + 80);
    return () => clearTimeout(t);
  }, [videoVisible, videoPlaying]);

  // Play only while the hero is actually on screen and the tab is focused.
  useEffect(() => {
    if (!videoPlaying) return;
    const video = videoRef.current;
    const section = sectionRef.current;
    if (!video || !section) return;

    let onScreen = true;
    const sync = () => {
      if (onScreen && document.visibilityState === 'visible') void video.play().catch(() => {});
      else video.pause();
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        sync();
      },
      { threshold: 0.01 }
    );
    observer.observe(section);
    document.addEventListener('visibilitychange', sync);
    sync();

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  }, [videoPlaying]);

  const parallax = reduced ? undefined : { y: parallaxY, scale: parallaxScale };

  return (
    <div ref={sectionRef} className="absolute inset-0 overflow-hidden">
      <motion.div style={parallax} className="absolute inset-0">
        <picture>
          {/* Portrait viewports get the tall crop; everything else the wide one.
              Only the matching source is ever fetched. */}
          <source media="(orientation: portrait)" srcSet={HERO_BG_PORTRAIT} />
          <img
            src={HERO_BG_LANDSCAPE}
            alt=""
            aria-hidden="true"
            /* The hero image IS the largest contentful paint — it must be
               eager and high priority, never lazy. */
            loading="eager"
            fetchPriority="high"
            decoding="async"
            /* Held slightly out of focus on purpose: it reads as depth behind
               the headline instead of competing with it. */
            className="absolute inset-0 h-full w-full object-cover object-center blur-[1px]"
          />
        </picture>

        {wantsVideo && (
          <video
            ref={videoRef}
            muted
            loop
            playsInline
            preload="none"
            aria-hidden="true"
            tabIndex={-1}
            /* Enough is buffered to show frame 0 — which is black. Become
               opaque now, while there is still nothing to see. */
            onCanPlay={() => setVideoVisible(true)}
            /* If the file fails or stalls, fall back to the still underneath —
               no error state is needed because nothing is missing without it. */
            onError={() => {
              setVideoVisible(false);
              setVideoPlaying(false);
            }}
            /* No blur here, unlike the still. The still is deliberately softened
               so it sits behind the headline; the video is the real subject once
               it takes over, and blurring it was throwing away the detail the
               higher-bitrate encode exists to deliver. The swap happens through
               black, so the difference in sharpness is never seen mid-fade. */
            style={{ transitionDuration: `${HERO_VIDEO_FADE_MS}ms` }}
            className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity ease-out ${
              videoVisible ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}
      </motion.div>
    </div>
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

/** Decorative QR mark. Deterministic, and not a scannable code. */
function QrGlyph({ size = 96, color = '#FFFFFF' }: { size?: number; color?: string }) {
  const cells = useMemo(() => {
    const grid: boolean[][] = [];
    let seed = 7;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    for (let r = 0; r < 11; r += 1) {
      grid.push(Array.from({ length: 11 }, () => rand() > 0.48));
    }
    return grid;
  }, []);

  return (
    <svg width={size} height={size} viewBox="0 0 11 11" aria-hidden="true">
      {cells.map((row, r) =>
        row.map((on, c) =>
          on ? <rect key={`${r}-${c}`} x={c} y={r} width={0.86} height={0.86} fill={color} /> : null
        )
      )}
      {[
        [0, 0],
        [8, 0],
        [0, 8],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width={3} height={3} fill={color} />
          <rect x={x + 0.75} y={y + 0.75} width={1.5} height={1.5} fill={INK} />
        </g>
      ))}
    </svg>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function LandingPageMaster({
  onStart,
  onLogin,
  onOpenDistributorDashboard,
  onOpenCheckout,
  onOpenJoinUs,
  isEmbeddedInDashboard = false,
}: LandingPageMasterProps) {
  const { isLoggedIn, profile } = useAuth();
  const reduced = useReducedMotion();

  // Navigation
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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
  const [cartNotice, setCartNotice] = useState<{ name: string; qty: number } | null>(null);

  useEffect(() => {
    try {
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

  // Category filter
  const [activeCategory, setActiveCategory] =
    useState<'All' | 'Vehicle' | 'Home' | 'Family' | 'Travel'>('All');

  // How it works — driven by the pinned track's scroll progress on desktop.
  const [activeHiwStep, setActiveHiwStep] = useState(0);

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

  // Hero: the backdrop drifts down and grows while the copy floats up and out.
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroImageY = useTransform(heroProgress, [0, 1], ['0%', '24%']);
  const heroImageScale = useTransform(heroProgress, [0, 1], [1.06, 1.28]);
  const heroCopyY = useTransform(heroProgress, [0, 1], [0, 140]);
  const heroScrimOpacity = useTransform(heroProgress, [0, 1], [0.26, 0.62]);

  // Pinned "how it works" track.
  const stepsTrackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: stepsProgress } = useScroll({
    target: stepsTrackRef,
    offset: ['start start', 'end end'],
  });
  const stepsLineHeight = useTransform(stepsProgress, [0, 1], ['0%', '100%']);

  useMotionValueEvent(stepsProgress, 'change', (v) => {
    // Below `lg` the track is display:none, so progress can arrive as NaN —
    // clamping without a finite check would index the step array with NaN.
    const raw = Math.floor(v * HOW_IT_WORKS_STEPS.length);
    const next = Number.isFinite(raw)
      ? Math.min(HOW_IT_WORKS_STEPS.length - 1, Math.max(0, raw))
      : 0;
    setActiveHiwStep((prev) => (prev === next ? prev : next));
  });

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
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, qty: item.qty + qty } : item
        );
      }
      return [...prev, { product, qty }];
    });
    setCartNotice({ name: product.name, qty });
  };

  const openCheckout = () => {
    setIsCartOpen(false);
    if (onOpenCheckout) onOpenCheckout();
    else onStart?.();
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
    () => (activeCategory === 'All' ? PRODUCTS : PRODUCTS.filter((p) => p.category === activeCategory)),
    [activeCategory]
  );

  const cartSubtotal = cart.reduce((sum, i) => sum + i.product.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const activeStep = HOW_IT_WORKS_STEPS[activeHiwStep] ?? HOW_IT_WORKS_STEPS[0];

  const NAV_LINKS = [
    { id: 'products-section', label: 'Products' },
    { id: 'hiw-section', label: 'How it works' },
    { id: 'pricing-section', label: 'Pricing' },
    { id: 'distributor-section', label: 'Franchise' },
    { id: 'faq-section', label: 'FAQ' },
  ];

  return (
    /* `overflow-x-clip` rather than `hidden`: it contains any stray horizontal
       overflow (parallax layers, the footer watermark, the CTA particle field
       all extend past the viewport by design) without making this element a
       scroll container — which `hidden` would, and which silently breaks the
       `position: sticky` the pinned How-it-works panel depends on. */
    <div className="min-h-screen overflow-x-clip bg-white font-sans text-[#0B0B0C] antialiased selection:bg-[#0B0B0C] selection:text-white">

      {/* ── Page scroll progress ──────────────────────────────────────── */}
      <motion.div
        style={{ scaleX: progressScale }}
        className="fixed inset-x-0 top-0 z-[80] h-[2px] origin-left bg-[#F6C000]"
        aria-hidden="true"
      />

      {/* ── 1. NAVBAR — transparent over the hero, glass once you move ── */}
      <header
        className={`fixed inset-x-0 top-0 z-[70] transition-all duration-500 ${
          isScrolled ? 'bg-[#0B0B0C]/85 backdrop-blur-xl border-b border-white/10' : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex cursor-pointer items-center focus:outline-hidden"
            aria-label="RepiQR home"
          >
            <img src={darkBgLogo} alt="RepiQR" className="h-7 w-auto object-contain sm:h-8" />
          </button>

          <nav className="hidden items-center gap-8 text-[13px] font-medium text-white/70 lg:flex">
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                onClick={() => handleSmoothScroll(link.id)}
                className="cursor-pointer transition-colors hover:text-white"
              >
                {link.label}
              </button>
            ))}

            {/* Join Us — the full service catalogue, so a provider can pick
                what they do before the form even loads. */}
            <div
              className="relative"
              onMouseEnter={() => setIsJoinMenuOpen(true)}
              onMouseLeave={() => setIsJoinMenuOpen(false)}
            >
              <button
                onClick={() => setIsJoinMenuOpen((open) => !open)}
                aria-haspopup="true"
                aria-expanded={isJoinMenuOpen}
                className="flex cursor-pointer items-center gap-1.5 transition-colors hover:text-white"
              >
                Join us
                <ChevronDown
                  size={13}
                  className={`transition-transform duration-300 ${isJoinMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              <AnimatePresence>
                {isJoinMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.25, ease: EASE }}
                    className="absolute left-1/2 top-full z-50 w-56 -translate-x-1/2 pt-4"
                  >
                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#171719] p-2 shadow-[0_20px_45px_-18px_rgba(0,0,0,0.8)]">
                      <p className="px-3 pb-2 pt-1 text-[10px] font-medium uppercase tracking-[0.16em] text-white/50">
                        Choose your service
                      </p>
                      <div className="grid max-h-72 overflow-y-auto">
                        {SERVICE_TYPES.filter((type) => type.slug !== 'police').map((type) => (
                          <button
                            key={type.slug}
                            onClick={() => handleJoinSelect(type.slug)}
                            className="cursor-pointer rounded-xl px-3 py-2.5 text-left text-[13px] font-light text-white/70 transition-colors hover:bg-white/10 hover:text-white"
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

          <div className="hidden items-center gap-5 lg:flex">
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative cursor-pointer p-2 text-white/70 transition-colors hover:text-white"
              aria-label="Open cart"
            >
              <ShoppingBag size={18} />
              {cartCount > 0 && (
                <span
                  className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-[#0B0B0C]"
                  style={{ background: '#F6C000' }}
                >
                  {cartCount}
                </span>
              )}
            </button>

            {isEmbeddedInDashboard ? (
              <button
                onClick={onOpenCheckout}
                className="cursor-pointer rounded-full bg-white px-6 py-2.5 text-[13px] font-semibold text-[#0B0B0C] transition-transform hover:scale-[1.03] active:scale-95"
              >
                Order new tags
              </button>
            ) : (
              <>
                <button
                  onClick={onLogin}
                  className="cursor-pointer text-[13px] font-medium text-white/70 transition-colors hover:text-white"
                >
                  Log in
                </button>
                <button
                  onClick={onStart || onOpenCheckout}
                  className="cursor-pointer rounded-full bg-white px-6 py-2.5 text-[13px] font-semibold text-[#0B0B0C] transition-transform hover:scale-[1.03] active:scale-95"
                >
                  Get started
                </button>
              </>
            )}
          </div>

          {/* Mobile triggers */}
          <div className="flex items-center gap-1 lg:hidden">
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-white"
              aria-label="Open cart"
            >
              <ShoppingBag size={18} />
              {cartCount > 0 && (
                <span
                  className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-[#0B0B0C]"
                  style={{ background: '#F6C000' }}
                >
                  {cartCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-white"
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
            className="fixed inset-0 z-[69] flex flex-col bg-[#0B0B0C] px-6 pb-[max(2.5rem,calc(env(safe-area-inset-bottom)+1.5rem))] pt-[max(6rem,calc(env(safe-area-inset-top)+4.5rem))] lg:hidden"
          >
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {[...NAV_LINKS, { id: 'join-section', label: 'Join us' }].map((link, i) => (
                <motion.button
                  key={link.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 * i, duration: 0.5, ease: EASE }}
                  onClick={() => link.id === 'join-section' ? onOpenJoinUs?.() : handleSmoothScroll(link.id)}
                  className="block w-full border-b border-white/10 py-5 text-left text-2xl font-light tracking-tight text-white"
                >
                  {link.label}
                </motion.button>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onLogin?.();
                }}
                className="w-full rounded-full border border-white/20 py-3.5 text-sm font-medium text-white"
              >
                Log in
              </button>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  (onStart || onOpenCheckout)?.();
                }}
                className="w-full rounded-full bg-white py-3.5 text-sm font-semibold text-[#0B0B0C]"
              >
                Get started
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 2. HERO — photographic backdrop, parallaxed ─────────────────── */}
      <section
        ref={heroRef}
        id="hero-section"
        className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-[#0B0B0C]"
      >
        <HeroBackdrop reduced={reduced} parallaxY={heroImageY} parallaxScale={heroImageScale} />
        {/* Scrim: dark enough for white type at AA, and it deepens on scroll. */}
        <motion.div
          style={reduced ? undefined : { opacity: heroScrimOpacity }}
          className="absolute inset-0 bg-[#0B0B0C]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0B0C]/75 via-[#0B0B0C]/15 to-[#0B0B0C]/85" />

        <motion.div
          style={reduced ? undefined : { y: heroCopyY }}
          className="relative z-10 mx-auto max-w-4xl px-6 pb-20 pt-32 text-center sm:pb-28"
        >
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE }}
            className="mb-6 text-[10px] font-medium uppercase tracking-[0.2em] text-white/85"
          >
            Built for safer everyday journeys
          </motion.div>

          <h1 className="mx-auto max-w-3xl text-[clamp(2.5rem,6vw,5.6rem)] font-medium leading-[0.94] tracking-[-0.045em] text-white drop-shadow-[0_3px_24px_rgba(0,0,0,0.5)]">
            <SplitWords text="India's 1st" delay={0.1} animateOnLoad />{' '}
            <span className="text-[#F6C000]">
              <SplitWords text="smartest" delay={0.22} animateOnLoad />
            </span>
            <br />
            <SplitWords text="QR safety platform" delay={0.34} animateOnLoad />
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.7, ease: EASE }}
            className="mx-auto mt-8 max-w-md text-[15px] font-light leading-relaxed text-white/85 sm:text-base"
          >
            One smart scan helps people reach you instantly, while your phone number stays private.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.85, ease: EASE }}
            className="mt-9 flex flex-col items-center gap-4"
          >
            <motion.button
              onClick={onStart || onOpenCheckout}
              whileHover={reduced ? undefined : { y: -3 }}
              whileTap={reduced ? undefined : { scale: 0.97 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="group flex cursor-pointer items-center gap-4 rounded-md bg-white px-8 py-4 text-[15px] font-semibold text-[#0B0B0C] shadow-[0_16px_40px_-18px_rgba(0,0,0,0.8)] sm:gap-6 sm:px-10 sm:py-5"
            >
              Get your tag
              <ArrowRight
                size={18}
                className="transition-transform duration-300 group-hover:translate-x-1.5"
                style={{ color: '#C79E00' }}
              />
            </motion.button>
            <p className="text-[12px] font-light text-white/75">Ships in 2–3 days. No app required.</p>
          </motion.div>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 1 }}
          className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
          aria-hidden="true"
        >
          <motion.div
            animate={reduced ? undefined : { y: [0, 9, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            className="flex h-9 w-[22px] items-start justify-center rounded-full border border-white/25 pt-2"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── 3. STATS BAND ───────────────────────────────────────────────── */}
      <section className="border-t border-white/10 bg-[#0B0B0C] py-14 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-10">
          <div className="grid grid-cols-2 gap-y-12 md:grid-cols-4">
            {STATS.map((stat, i) => (
              <Reveal
                key={stat.label}
                delay={i * 0.09}
                className={`px-2 text-center ${i > 0 ? 'md:border-l md:border-white/10' : ''}`}
              >
                <div className="text-[clamp(2.2rem,5vw,3.6rem)] font-light leading-none tracking-[-0.04em] text-white">
                  <Counter to={stat.value} suffix={stat.suffix} kilo={stat.kilo} />
                </div>
                <div className="mt-3 text-[11px] font-light uppercase tracking-[0.16em] text-white/50">
                  {stat.label}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. CATEGORY TICKER ──────────────────────────────────────────── */}
      <section className="overflow-hidden border-y border-white/10 bg-[#0B0B0C] py-6">
        <Marquee duration={44}>
          {BADGE_ITEMS.map((item) => (
            <span
              key={`a-${item.label}`}
              className="flex items-center gap-2.5 whitespace-nowrap rounded-full border border-white/10 px-5 py-2.5 text-[13px] font-light text-white/55"
            >
              <item.icon size={15} className="text-white/35" />
              {item.label}
            </span>
          ))}
        </Marquee>
      </section>

      {/* ── 6. PRODUCTS — tabs + horizontal rail ────────────────────────── */}
      <section id="products-section" className="bg-[#F4F1EC] py-16 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-10">
          <Reveal className="flex flex-col gap-8 border-b border-black/10 pb-10 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.18em] text-black/60">
                The RepiQR collection
              </p>
              <h2 className="text-[clamp(2rem,4.2vw,3.4rem)] font-medium leading-[1.02] tracking-[-0.04em]">
                <SplitWords text="Protection, made personal" />
              </h2>
              <p className="mt-4 max-w-lg text-[15px] font-light leading-relaxed text-black/60">
                Choose a purpose-built tag for the things that move through your day.
                Every one includes lifetime validity and private contact routing.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-5 text-[11px] uppercase tracking-[0.14em] text-black/60">
              <span><strong className="text-black">{PRODUCTS.length}</strong> tag styles</span>
              <span className="h-5 w-px bg-black/15" />
              <span><strong className="text-black">∞</strong> validity</span>
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
                    on ? 'text-white' : 'text-black/55 hover:text-black'
                  }`}
                >
                  {on && (
                    <motion.span
                      layoutId="product-tab"
                      transition={{ duration: 0.45, ease: EASE }}
                      className="absolute inset-0 rounded-full bg-[#0B0B0C]"
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
                  className="group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-[#0B0B0C] shadow-[0_24px_60px_-28px_rgba(0,0,0,0.65)]"
                >
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <img
                      src={product.img}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0C] via-[#0B0B0C]/10 to-transparent" />
                    <span className="absolute left-5 top-5 rounded-full border border-white/15 bg-black/40 px-3 py-1 text-[11px] font-light text-white/80 backdrop-blur-sm">
                      {product.badge}
                    </span>
                    <span className="absolute bottom-5 left-5 text-[11px] font-medium uppercase tracking-[0.14em] text-white/55">
                      {product.category}
                    </span>
                  </div>

                  <div className="p-6 pt-2 text-white sm:p-7 sm:pt-3">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-xl font-medium tracking-[-0.02em]">{product.name}</h3>
                      <div className="shrink-0 text-right">
                        <div className="text-lg font-medium">₹{product.price}</div>
                        <div className="text-[11px] font-light text-white/50 line-through">
                          ₹{product.mrp}
                        </div>
                      </div>
                    </div>

                    <p className="mt-2.5 text-[13px] font-light leading-relaxed text-white/55">
                      {product.desc}
                    </p>

                    <ul className="mt-5 space-y-2">
                      {product.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-[12px] font-light text-white/60">
                          <Check size={13} className="mt-[3px] shrink-0" style={{ color: '#F6C000' }} />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <div className="mt-6 flex items-center gap-2">
                      <button
                        onClick={() => addToCart(product)}
                        className="flex-1 cursor-pointer rounded-full bg-white py-3 text-[13px] font-semibold text-[#0B0B0C] transition-transform hover:scale-[1.02] active:scale-95"
                      >
                        Add to cart
                      </button>
                      <button
                        onClick={() => {
                          addToCart(product, 1);
                          openCheckout();
                        }}
                        className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:bg-white/10"
                        aria-label={`Buy ${product.name} now`}
                      >
                        <ArrowUpRight size={17} />
                      </button>
                    </div>

                    {product.rating && (
                      <div className="mt-4 flex items-center gap-1.5 text-[11px] font-light text-white/50">
                        <Star size={12} style={{ color: '#F6C000' }} fill="#F6C000" />
                        {product.rating} · {product.reviewsCount?.toLocaleString('en-IN')} owners
                      </div>
                    )}
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>

        </div>
      </section>

      {/* ── 7. HOW IT WORKS — pinned, scroll-driven on desktop ──────────── */}
      <section id="hiw-section" className="bg-[#F4F1EC]">
        {/* Desktop: a tall track whose progress drives the pinned panel. */}
        <div ref={stepsTrackRef} className="relative hidden h-[420vh] lg:block">
          <div className="sticky top-0 flex h-screen items-center overflow-hidden">
            <div className="mx-auto grid w-full max-w-[1400px] grid-cols-2 items-center gap-16 px-10">
              {/* Left: the list */}
              <div>
                <p className="mb-4 text-[11px] font-light uppercase tracking-[0.18em] text-black/60">
                  How it works
                </p>
                <h2 className="max-w-md text-[clamp(2rem,3.4vw,3rem)] font-medium leading-[1.06] tracking-[-0.035em]">
                  Getting protected takes about four minutes
                </h2>

                <div className="relative mt-12 pl-8">
                  {/* Rail + progress fill. The fill is the one saturated colour
                      in the section, and it earns it: it is the read-out for how
                      far through the story you have scrolled. */}
                  <div className="absolute left-0 top-1 h-[calc(100%-0.5rem)] w-px bg-black/10">
                    <motion.div style={{ height: stepsLineHeight }} className="w-px origin-top">
                      <div className="h-full w-px" style={{ background: '#F6C000' }} />
                    </motion.div>
                  </div>

                  <ul className="space-y-7">
                    {HOW_IT_WORKS_STEPS.map((step, i) => {
                      const on = i === activeHiwStep;
                      return (
                        <li key={step.step} className="relative">
                          <span
                            className={`absolute -left-8 top-2 h-2 w-2 -translate-x-[3.5px] rounded-full transition-all duration-500 ${
                              on ? 'scale-150' : 'scale-100'
                            }`}
                            style={{ background: on ? '#F6C000' : 'rgba(0,0,0,0.18)' }}
                          />
                          <motion.div
                            animate={{ opacity: on ? 1 : 0.32 }}
                            transition={{ duration: 0.45, ease: EASE }}
                          >
                            <h3 className="text-xl font-medium tracking-[-0.02em]">
                              <span className="mr-3 text-[13px] font-light text-black/60">
                                0{step.step}
                              </span>
                              {step.title}
                            </h3>
                            <AnimatePresence initial={false}>
                              {on && (
                                <motion.p
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.45, ease: EASE }}
                                  className="overflow-hidden text-[14px] font-light leading-relaxed text-black/55"
                                >
                                  <span className="block pt-2">{step.body}</span>
                                </motion.p>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>

              {/* Right: the image, crossfading with the active step */}
              <div className="relative aspect-square overflow-hidden rounded-[2rem] bg-[#0B0B0C]">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeStep.img}
                    src={activeStep.img}
                    alt={activeStep.title}
                    initial={{ opacity: 0, scale: 1.06 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.7, ease: EASE }}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </AnimatePresence>

                <div className="absolute bottom-6 left-6 flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-4 py-2 text-[12px] font-light text-white/85 backdrop-blur-md">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#F6C000' }} />
                  {activeStep.badge}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile: the same story, stacked. Pinning on a phone fights the
            browser's own scroll chrome, so it is not worth the jank. */}
        <div className="px-6 py-24 lg:hidden">
          <p className="mb-4 text-[11px] font-light uppercase tracking-[0.18em] text-black/60">
            How it works
          </p>
          <h2 className="text-[clamp(1.9rem,7vw,2.4rem)] font-medium leading-[1.08] tracking-[-0.035em]">
            Getting protected takes about four minutes
          </h2>

          <div className="mt-12 space-y-8">
            {HOW_IT_WORKS_STEPS.map((step, i) => (
              <Reveal key={step.step} delay={i * 0.05}>
                <div className="overflow-hidden rounded-3xl bg-[#0B0B0C]">
                  <img src={step.img} alt={step.title} className="aspect-4/3 w-full object-cover" />
                  <div className="p-6 text-white">
                    <span className="text-[12px] font-light text-white/50">0{step.step}</span>
                    <h3 className="mt-1 text-lg font-medium">{step.title}</h3>
                    <p className="mt-2 text-[13px] font-light leading-relaxed text-white/50">
                      {step.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

    

      {/* ── 10. PHOTO WALL ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0B0B0C] py-16 sm:py-24 lg:py-32">
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <Reveal>
            <h2 className="max-w-md px-6 text-center text-[clamp(1.8rem,4.6vw,3.2rem)] font-medium leading-[1.05] tracking-[-0.035em] text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)]">
              Protected by RepiQR
            </h2>
          </Reveal>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-3 px-3 opacity-45 sm:gap-4 sm:px-4">
          {MOSAIC_COLUMNS.map((column, ci) => (
            <Parallax key={ci} distance={ci === 1 ? 90 : 45}>
              {/* Spacing lives inside Parallax: its outer element only carries
                  the scroll ref, the inner one is what actually moves. */}
              <div className="space-y-3 sm:space-y-4">
                {column.map((img, ri) => (
                  <div
                    key={`${ci}-${ri}`}
                    className="overflow-hidden rounded-xl border border-white/5 sm:rounded-2xl"
                  >
                    <img src={img} alt="" aria-hidden="true" className="aspect-4/3 w-full object-cover" />
                  </div>
                ))}
              </div>
            </Parallax>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-0 z-[15] bg-gradient-to-b from-[#0B0B0C] via-[#0B0B0C]/55 to-[#0B0B0C]" />
      </section>

      {/* ── 11. PRICING ─────────────────────────────────────────────────── */}
      <section id="pricing-section" className="bg-white py-16 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-10">
          <Reveal className="text-center">
            <h2 className="text-[clamp(1.9rem,4.2vw,3.2rem)] font-medium leading-[1.05] tracking-[-0.035em]">
              Pricing plans for every need
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[15px] font-light text-black/60">
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
                      ? 'bg-[#0B0B0C] text-white'
                      : 'border border-black/10 bg-white text-[#0B0B0C]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[11px] font-light uppercase tracking-[0.16em] ${
                          plan.featured ? 'text-white/50' : 'text-black/60'
                        }`}
                      >
                        {plan.name}
                      </span>
                      {plan.featured && (
                        <span
                          className="rounded-full px-2.5 py-1 text-[10px] font-semibold text-[#0B0B0C]"
                          style={{ background: '#F6C000' }}
                        >
                          Popular
                        </span>
                      )}
                    </div>

                    <div className="mt-5 text-[2rem] font-light tracking-[-0.04em]">Contact us</div>
                    <p
                      className={`mt-2 text-[13px] font-light ${
                        plan.featured ? 'text-white/50' : 'text-black/60'
                      }`}
                    >
                      {plan.desc}
                    </p>

                    <ul className="mt-8 space-y-3">
                      {plan.features.map((f) => (
                        <li
                          key={f}
                          className={`flex items-start gap-2.5 text-[13px] font-light ${
                            plan.featured ? 'text-white/70' : 'text-black/60'
                          }`}
                        >
                          <Check size={14} className="mt-[3px] shrink-0" style={{ color: '#C79E00' }} />
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
                        ? 'bg-white text-[#0B0B0C]'
                        : 'bg-[#0B0B0C] text-white'
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
      {false && <section id="join-section" className="bg-[#F4F1EC] py-16 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-10">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="mb-4 text-[11px] font-light uppercase tracking-[0.18em] text-black/60">
              Join us
            </p>
            <h2 className="text-[clamp(1.9rem,4.2vw,3.2rem)] font-medium leading-[1.05] tracking-[-0.035em]">
              <SplitWords text="Become a service partner" />
            </h2>
            <p className="mt-4 text-[15px] font-light leading-relaxed text-black/60">
              Ambulance, towing, mechanic, plumber, vet, security — whatever you do, get
              listed once and take masked calls the moment a nearby tag is scanned.
            </p>
          </Reveal>

          <div className="mt-14 grid items-stretch gap-5 lg:grid-cols-2">
            {/* Visual panel, retinted to the service picked in the navbar */}
            <Reveal className="h-full">
              <div className="relative flex h-full min-h-[420px] flex-col justify-end overflow-hidden rounded-3xl bg-[#0B0B0C]">
                <img
                  src={stepImg4}
                  alt="A RepiQR scan reaching a nearby service partner"
                  className="absolute inset-0 h-full w-full object-cover opacity-40"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0C] via-[#0B0B0C]/75 to-[#0B0B0C]/25" />

                <div className="relative p-8 text-white sm:p-10">
                  <div className="inline-flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-3.5 py-2.5 backdrop-blur-sm">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: joinServiceMeta.bg, color: joinServiceMeta.color }}
                    >
                      <joinServiceMeta.Icon size={16} />
                    </span>
                    <span>
                      <span className="block text-[10px] font-light uppercase tracking-[0.14em] text-white/50">
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
                        className="flex items-start gap-2.5 text-[13px] font-light leading-relaxed text-white/70"
                      >
                        <CheckCircle2 size={15} className="mt-0.5 shrink-0" style={{ color: '#F6C000' }} />
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>

            {/* Application form */}
            <Reveal delay={0.12} className="h-full">
              <div className="h-full rounded-3xl border border-black/8 bg-white p-7 sm:p-9">
                {joinSubmitted ? (
                  <div className="flex h-full flex-col items-center justify-center py-10 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
                      <CheckCircle2 size={26} className="text-emerald-600" />
                    </div>
                    <h3 className="mt-5 text-xl font-medium">Application received</h3>
                    <p className="mt-3 max-w-sm text-[14px] font-light leading-relaxed text-black/55">
                      Thank you, <span className="font-medium text-[#0B0B0C]">{joinForm.label}</span>.
                      Your <span className="font-medium text-[#0B0B0C]">{joinServiceType.label}</span>{' '}
                      listing for <span className="font-medium text-[#0B0B0C]">{joinForm.city}</span> is
                      pending review. We will call you on{' '}
                      <span className="font-medium text-[#0B0B0C]">{joinForm.phone}</span> once it is
                      approved.
                    </p>
                    <button
                      onClick={resetJoinForm}
                      className="mt-7 cursor-pointer rounded-full bg-black/5 px-6 py-3 text-[13px] font-medium text-black/70 transition-colors hover:bg-black/10"
                    >
                      Submit another provider
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleJoinSubmit} className="space-y-5">
                    <div>
                      <label className="mb-2 block text-[11px] font-light uppercase tracking-[0.14em] text-black/60">
                        Service type
                      </label>
                      <select
                        value={joinForm.serviceType}
                        onChange={(e) => setJoinForm({ ...joinForm, serviceType: e.target.value })}
                        className="w-full cursor-pointer rounded-xl border border-black/12 bg-white px-4 py-3 text-[16px] font-light outline-hidden transition-colors focus:border-[#0B0B0C] sm:text-[14px]"
                      >
                        {SERVICE_TYPES.map((t) => (
                          <option key={t.slug} value={t.slug}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-[11px] font-light uppercase tracking-[0.14em] text-black/60">
                        Provider / business name *
                      </label>
                      <input
                        value={joinForm.label}
                        onChange={(e) => setJoinForm({ ...joinForm, label: e.target.value })}
                        placeholder={joinServiceMeta.placeholder}
                        /* 16px on phones: iOS Safari zooms the whole page when a
                           focused field is smaller, and never zooms back out. */
                        className="w-full rounded-xl border border-black/12 px-4 py-3 text-[16px] font-light outline-hidden transition-colors focus:border-[#0B0B0C] sm:text-[14px]"
                      />
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-[11px] font-light uppercase tracking-[0.14em] text-black/60">
                          Phone *
                        </label>
                        <PhoneInputWithCountry
                          value={joinForm.phone}
                          onChange={(full) => setJoinForm({ ...joinForm, phone: full })}
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-[11px] font-light uppercase tracking-[0.14em] text-black/60">
                          City / service area *
                        </label>
                        <input
                          value={joinForm.city}
                          onChange={(e) => setJoinForm({ ...joinForm, city: e.target.value })}
                          placeholder="e.g. Pune"
                          /* 16px on phones: iOS Safari zooms the whole page when a
                           focused field is smaller, and never zooms back out. */
                        className="w-full rounded-xl border border-black/12 px-4 py-3 text-[16px] font-light outline-hidden transition-colors focus:border-[#0B0B0C] sm:text-[14px]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-[11px] font-light uppercase tracking-[0.14em] text-black/60">
                        Email
                      </label>
                      <div className="relative">
                        <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30" />
                        <input
                          type="email"
                          value={joinForm.email}
                          onChange={(e) => setJoinForm({ ...joinForm, email: e.target.value })}
                          placeholder="you@company.com"
                          className="w-full rounded-xl border border-black/12 py-3 pl-11 pr-4 text-[14px] font-light outline-hidden transition-colors focus:border-[#0B0B0C]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2.5 block text-[11px] font-light uppercase tracking-[0.14em] text-black/60">
                        Categories you cover
                        <span className="ml-2 normal-case tracking-normal text-black/60">
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
                                  ? 'border-[#0B0B0C] bg-[#0B0B0C] text-white'
                                  : 'border-black/12 text-black/60 hover:border-black/35'
                              }`}
                            >
                              {on && <Check size={11} />} {c.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-[11px] font-light uppercase tracking-[0.14em] text-black/60">
                        Anything else we should know
                      </label>
                      <textarea
                        value={joinForm.notes}
                        onChange={(e) => setJoinForm({ ...joinForm, notes: e.target.value })}
                        rows={3}
                        placeholder="Hours, coverage radius, fleet size, licence number…"
                        className="w-full resize-none rounded-xl border border-black/12 px-4 py-3 text-[14px] font-light outline-hidden transition-colors focus:border-[#0B0B0C]"
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
                      className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#0B0B0C] py-4 text-[13px] font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      {joinSubmitting ? (
                        <>
                          <Loader2 size={15} className="animate-spin" /> Submitting…
                        </>
                      ) : (
                        <>
                          Submit application
                          <ArrowRight size={14} style={{ color: '#F6C000' }} />
                        </>
                      )}
                    </button>

                    <p className="text-center text-[11px] font-light text-black/60">
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
      <section id="distributor-section" className="bg-[#0B0B0C] py-16 text-white sm:py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-10">
          <Reveal className="max-w-2xl">
            <p className="mb-4 text-[11px] font-light uppercase tracking-[0.18em] text-white/50">
              Franchise
            </p>
            <h2 className="text-[clamp(1.9rem,4.2vw,3.2rem)] font-medium leading-[1.05] tracking-[-0.035em]">
              Become a RepiQR distributor
            </h2>
            <p className="mt-4 text-[15px] font-light leading-relaxed text-white/50">
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
                    tier.isPopular ? 'bg-white text-[#0B0B0C]' : 'border border-white/12 bg-white/[0.03]'
                  }`}
                >
                  <div>
                    <span
                      className={`text-[11px] font-light uppercase tracking-[0.16em] ${
                        tier.isPopular ? 'text-black/60' : 'text-white/50'
                      }`}
                    >
                      {tier.badge}
                    </span>
                    <h3 className="mt-4 text-xl font-medium tracking-[-0.02em]">{tier.name}</h3>
                    <p
                      className={`mt-2.5 text-[13px] font-light leading-relaxed ${
                        tier.isPopular ? 'text-black/60' : 'text-white/50'
                      }`}
                    >
                      {tier.desc}
                    </p>

                    <div
                      className={`mt-6 flex items-center gap-4 border-y py-4 text-[12px] font-light ${
                        tier.isPopular ? 'border-black/10 text-black/60' : 'border-white/10 text-white/55'
                      }`}
                    >
                      <span>{tier.minUnits}</span>
                      <span className={tier.isPopular ? 'text-black/60' : 'text-white/50'}>·</span>
                      <span className="font-medium">{tier.margin}</span>
                    </div>

                    <ul className="mt-6 space-y-3">
                      {tier.features.map((f) => (
                        <li
                          key={f}
                          className={`flex items-start gap-2.5 text-[13px] font-light ${
                            tier.isPopular ? 'text-black/60' : 'text-white/55'
                          }`}
                        >
                          <Check
                            size={14}
                            className="mt-[3px] shrink-0"
                            style={{ color: tier.isPopular ? '#C79E00' : '#F6C000' }}
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
                      tier.isPopular ? 'bg-[#0B0B0C] text-white' : 'bg-white text-[#0B0B0C]'
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
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] py-4 text-[13px] font-medium text-white transition-colors hover:bg-white/10"
              >
                <Zap size={15} style={{ color: '#F6C000' }} />
                Your distributor dashboard is unlocked — open it
              </button>
            </Reveal>
          )}
        </div>
      </section>

      {/* ── 14. FAQ — full-bleed rows ───────────────────────────────────── */}
      <section id="faq-section" className="bg-white py-16 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-[1100px] px-6 sm:px-10">
          <Reveal className="mb-8 sm:mb-14">
            <h2 className="text-[clamp(1.9rem,4.2vw,3.2rem)] font-medium leading-[1.05] tracking-[-0.035em]">
              Frequently asked questions
            </h2>
          </Reveal>

          <div className="border-t border-black/12">
            {FAQS.map((faq, i) => {
              const open = expandedFaqId === faq.id;
              return (
                <Reveal key={faq.id} delay={i * 0.05} y={16}>
                  <div className="border-b border-black/12">
                    <button
                      onClick={() => handleToggleFaq(faq.id)}
                      aria-expanded={open}
                      className="group flex w-full cursor-pointer items-center justify-between gap-4 py-5 text-left sm:gap-6 sm:py-7"
                    >
                      <span className="text-[clamp(1.05rem,2.2vw,1.5rem)] font-light leading-snug tracking-[-0.02em] transition-colors group-hover:text-black/60">
                        {faq.question}
                      </span>
                      <motion.span
                        animate={{ rotate: open ? 45 : 0 }}
                        transition={{ duration: 0.35, ease: EASE }}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/12 text-black/50"
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
                          <p className="max-w-2xl pb-8 text-[14px] font-light leading-relaxed text-black/55">
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
        className="relative flex min-h-[80vh] items-center justify-center overflow-hidden bg-[#0B0B0C] py-20 sm:py-28"
      >
        <motion.div
          style={reduced ? undefined : { scale: ctaRingScale, opacity: ctaRingOpacity }}
          className="absolute inset-0"
        >
          <ParticleRing />
        </motion.div>

        <div className="relative z-10 mx-auto max-w-2xl px-6 text-center">
          <h2 className="text-[clamp(2rem,5.4vw,3.8rem)] font-medium leading-[1.03] tracking-[-0.035em] text-white">
            Get Your
            <br />
            RepiQR tag today
          </h2>

          <Reveal delay={0.3}>
            <p className="mx-auto mt-6 max-w-md text-[15px] font-light text-white/50">
              Weatherproof tag, masked calls, lifetime dashboard. No subscription.
            </p>

            <button
              onClick={onStart || onOpenCheckout}
              className="group mt-10 inline-flex cursor-pointer items-center gap-2.5 rounded-full bg-white px-9 py-4 text-sm font-semibold text-[#0B0B0C] transition-transform hover:scale-[1.04] active:scale-95"
            >
              Get started
              <ArrowRight
                size={15}
                className="transition-transform group-hover:translate-x-1"
                style={{ color: '#C79E00' }}
              />
            </button>
          </Reveal>
        </div>
      </section>

      {/* ── 16. FOOTER ──────────────────────────────────────────────────── */}
      <footer
        ref={footerRef}
        className="relative overflow-hidden border-t border-white/10 bg-[#0B0B0C] pb-32 pt-14 text-white sm:pb-40 sm:pt-20"
      >
        <div className="relative z-10 mx-auto max-w-[1400px] px-6 sm:px-10">
          <div className="grid gap-12 pb-16 md:grid-cols-12">
            <div className="space-y-5 md:col-span-4">
              <img src={darkBgLogo} alt="RepiQR" className="h-8 w-auto object-contain" />
              <p className="max-w-xs text-[13px] font-light leading-relaxed text-white/50">
                A universal smart QR safety layer for vehicles, valuables, pets and families —
                with masked telephony and instant scan alerts.
              </p>
              <div className="flex items-center gap-2 pt-1 text-[12px] font-light text-white/50">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                All proxy gateway nodes operational
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 md:col-span-8">
              <div className="space-y-3.5">
                <div className="text-[11px] font-light uppercase tracking-[0.16em] text-white/50">
                  Products
                </div>
                <ul className="space-y-2.5 text-[13px] font-light text-white/55">
                  {PRODUCTS.map((p) => (
                    <li key={p.id}>
                      <button
                        onClick={onOpenCheckout}
                        className="cursor-pointer text-left transition-colors hover:text-white"
                      >
                        {p.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3.5">
                <div className="text-[11px] font-light uppercase tracking-[0.16em] text-white/50">
                  Platform
                </div>
                <ul className="space-y-2.5 text-[13px] font-light text-white/55">
                  <li>
                    <button onClick={onLogin} className="cursor-pointer transition-colors hover:text-white">
                      Client dashboard
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setIsPartnerModalOpen(true)}
                      className="cursor-pointer text-left transition-colors hover:text-white"
                    >
                      Distributor portal
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleSmoothScroll('join-section')}
                      className="cursor-pointer text-left transition-colors hover:text-white"
                    >
                      Service partners
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleSmoothScroll('demo-section')}
                      className="cursor-pointer text-left transition-colors hover:text-white"
                    >
                      Live scan demo
                    </button>
                  </li>
                </ul>
              </div>

              <div className="space-y-3.5">
                <div className="text-[11px] font-light uppercase tracking-[0.16em] text-white/50">
                  Company
                </div>
                <ul className="space-y-2.5 text-[13px] font-light text-white/55">
                  <li>
                    <button
                      onClick={() => handleSmoothScroll('hiw-section')}
                      className="cursor-pointer text-left transition-colors hover:text-white"
                    >
                      How it works
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleSmoothScroll('pricing-section')}
                      className="cursor-pointer text-left transition-colors hover:text-white"
                    >
                      Pricing
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleSmoothScroll('distributor-section')}
                      className="cursor-pointer text-left transition-colors hover:text-white"
                    >
                      Franchise
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleSmoothScroll('faq-section')}
                      className="cursor-pointer text-left transition-colors hover:text-white"
                    >
                      Help &amp; FAQ
                    </button>
                  </li>
                </ul>
              </div>

              <div className="space-y-3.5">
                <div className="text-[11px] font-light uppercase tracking-[0.16em] text-white/50">
                  Legal
                </div>
                <ul className="space-y-2.5 text-[13px] font-light text-white/55">
                  <li>Privacy policy</li>
                  <li>Terms of service</li>
                  <li>Security whitepaper</li>
                  <li>3-year warranty</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-[12px] font-light text-white/50 sm:flex-row">
            <span>© {new Date().getFullYear()} RepiQR. All rights reserved.</span>
            <span className="flex items-center gap-2">
              <Shield size={12} />
              Your number is never rendered on a scan page
            </span>
          </div>
        </div>

        {/* Watermark drifts as the page bottoms out */}
        <motion.div
          style={reduced ? undefined : { y: watermarkY }}
          className="pointer-events-none absolute inset-x-0 bottom-0 select-none text-center"
          aria-hidden="true"
        >
          <span className="block whitespace-nowrap text-[clamp(5rem,20vw,17rem)] font-medium leading-none tracking-[-0.05em] text-white/[0.045]">
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
            className="fixed bottom-[max(1.25rem,calc(env(safe-area-inset-bottom)+0.5rem))] right-5 z-[520] flex w-[min(360px,calc(100vw-2.5rem))] items-center gap-3 rounded-2xl border border-black/8 bg-white p-4 shadow-[0_20px_55px_-18px_rgba(0,0,0,0.45)]"
            role="status"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0B0B0C] text-[#F6C000]">
              <Check size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-[#0B0B0C]">Added to your cart</p>
              <p className="mt-0.5 truncate text-[12px] font-light text-black/60">
                {cartNotice.qty > 1 ? `${cartNotice.qty} × ` : ''}{cartNotice.name}
              </p>
            </div>
            <button
              onClick={() => setIsCartOpen(true)}
              className="shrink-0 cursor-pointer text-[12px] font-semibold text-black/60 underline underline-offset-4 transition-colors hover:text-black"
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
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
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
              className="relative z-10 flex h-full w-full max-w-md flex-col justify-between overflow-y-auto overscroll-contain bg-white px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-7 sm:pb-[max(1.75rem,env(safe-area-inset-bottom))]"
            >
              <div>
                <div className="flex items-center justify-between border-b border-black/8 pb-5">
                  <span className="text-lg font-medium tracking-[-0.02em]">Your cart</span>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="cursor-pointer rounded-full p-2 transition-colors hover:bg-black/5"
                    aria-label="Close cart"
                  >
                    <X size={18} />
                  </button>
                </div>

                {cart.length === 0 ? (
                  <div className="py-20 text-center">
                    <ShoppingBag size={36} className="mx-auto mb-4 text-black/15" />
                    <p className="text-[14px] font-medium">Your cart is empty</p>
                    <p className="mt-1 text-[12px] font-light text-black/60">
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
                          <div className="mt-1 text-[13px] font-light text-black/60">
                            ₹{item.product.price}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 rounded-full border border-black/10 p-1">
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
                            className="cursor-pointer rounded-full p-1.5 transition-colors hover:bg-black/5"
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
                            className="cursor-pointer rounded-full p-1.5 transition-colors hover:bg-black/5"
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
                <div className="border-t border-black/8 pt-5">
                  <div className="mb-5 flex items-center justify-between text-base font-medium">
                    <span>Subtotal</span>
                    <span>₹{cartSubtotal}</span>
                  </div>
                  <button
                    onClick={openCheckout}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#0B0B0C] py-4 text-[13px] font-semibold text-white transition-transform hover:scale-[1.01] active:scale-[0.99]"
                  >
                    Proceed to checkout
                    <ArrowRight size={14} style={{ color: '#F6C000' }} />
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
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
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
              className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-7 text-left sm:p-9"
            >
              <button
                onClick={() => {
                  setIsPartnerModalOpen(false);
                  setPartnerSubmitted(false);
                }}
                className="absolute right-5 top-5 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-black/5 text-black/50 transition-colors hover:bg-black/10"
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
                  <p className="mx-auto max-w-xs text-[13px] font-light leading-relaxed text-black/55">
                    Congratulations{' '}
                    <span className="font-medium text-[#0B0B0C]">
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
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#0B0B0C] py-3.5 text-[13px] font-semibold text-white"
                  >
                    Open distributor dashboard <ArrowRight size={15} />
                  </button>
                </div>
              ) : userAppStatus?.status === 'pending' || partnerSubmitted ? (
                <div className="space-y-5 py-6 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-black/5">
                    <Loader2 size={24} className="animate-spin text-black/40" />
                  </div>
                  <h3 className="text-2xl font-medium tracking-[-0.02em]">Pending verification</h3>
                  <p className="mx-auto max-w-xs text-[13px] font-light leading-relaxed text-black/55">
                    Thank you{' '}
                    <span className="font-medium text-[#0B0B0C]">
                      {partnerForm.name || userAppStatus?.userName || 'partner'}
                    </span>
                    . Your application has been sent to the RepiQR team.
                  </p>
                  <div className="space-y-2.5 rounded-2xl bg-black/[0.03] p-4 text-left text-[12px] font-light text-black/55">
                    <div className="flex justify-between">
                      <span>City / territory</span>
                      <span className="font-medium text-[#0B0B0C]">
                        {partnerForm.city || userAppStatus?.city || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Package tier</span>
                      <span className="font-medium text-[#0B0B0C]">
                        {partnerForm.tier || userAppStatus?.tier}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status</span>
                      <span className="font-medium text-[#0B0B0C]">Pending review</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsPartnerModalOpen(false);
                      setPartnerSubmitted(false);
                    }}
                    className="cursor-pointer rounded-full bg-black/5 px-6 py-3 text-[13px] font-medium text-black/70 transition-colors hover:bg-black/10"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-6 flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black/[0.04]">
                      <Handshake size={19} className="text-black/60" />
                    </span>
                    <div>
                      <h3 className="text-xl font-medium tracking-[-0.02em]">Become a partner</h3>
                      <p className="text-[12px] font-light text-black/60">
                        Apply for a RepiQR distributorship or franchise
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handlePartnerSubmit} className="space-y-4">
                    <div>
                      <label className="mb-2 block text-[11px] font-light uppercase tracking-[0.14em] text-black/60">
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
                        className="w-full rounded-xl border border-black/12 px-4 py-3 text-[16px] font-light outline-hidden transition-colors focus:border-[#0B0B0C] sm:text-[14px]"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-[11px] font-light uppercase tracking-[0.14em] text-black/60">
                          Phone / WhatsApp
                        </label>
                        <PhoneInputWithCountry
                          required
                          value={partnerForm.phone}
                          onChange={(full) => setPartnerForm({ ...partnerForm, phone: full })}
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-[11px] font-light uppercase tracking-[0.14em] text-black/60">
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
                        className="w-full rounded-xl border border-black/12 px-4 py-3 text-[16px] font-light outline-hidden transition-colors focus:border-[#0B0B0C] sm:text-[14px]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-[11px] font-light uppercase tracking-[0.14em] text-black/60">
                        Business type
                      </label>
                      <select
                        value={partnerForm.business}
                        onChange={(e) => setPartnerForm({ ...partnerForm, business: e.target.value })}
                        className="w-full cursor-pointer rounded-xl border border-black/12 bg-white px-4 py-3 text-[16px] font-light outline-hidden transition-colors focus:border-[#0B0B0C] sm:text-[14px]"
                      >
                        <option value="Auto Accessories Shop">Auto accessories / helmet shop</option>
                        <option value="Car Dealership / Service Center">
                          Car dealership / service centre
                        </option>
                        <option value="Security Agency / Society Admin">
                          Security agency / society admin
                        </option>
                        <option value="Retail Store / Gift Shop">Retail store / general merchant</option>
                        <option value="Individual Reseller">Individual reseller</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-[11px] font-light uppercase tracking-[0.14em] text-black/60">
                        Interested package
                      </label>
                      <select
                        value={partnerForm.tier}
                        onChange={(e) => setPartnerForm({ ...partnerForm, tier: e.target.value })}
                        className="w-full cursor-pointer rounded-xl border border-black/12 bg-white px-4 py-3 text-[16px] font-light outline-hidden transition-colors focus:border-[#0B0B0C] sm:text-[14px]"
                      >
                        <option value="Retail Kit (50 Units)">Retail partner kit (50 stickers)</option>
                        <option value="City Franchise (300 Units)">
                          City master franchise (300 stickers)
                        </option>
                        <option value="State Partner (2500+ Units)">
                          State master partner (2,500+ stickers)
                        </option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#0B0B0C] py-4 text-[13px] font-semibold text-white transition-transform hover:scale-[1.01] active:scale-[0.99]"
                    >
                      Submit application
                      <ArrowRight size={14} style={{ color: '#F6C000' }} />
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

/**
 * Shared purchasable-sticker catalog — the single source of truth for the
 * landing page's shop section and the client dashboard's pre-purchase shop
 * (shown to a signed-in user who owns no stickers yet). Keeping this in one
 * place means both surfaces always list the same products/prices.
 */
export interface ProductItem {
  id: string;
  name: string;
  desc: string;
  price: number;
  mrp: number;
  // Free-form on purpose: admin-added products (see ShopProductsPage) aren't
  // limited to the 4 categories the built-in catalog below ships with.
  category: string;
  badge: string;
  img: string;
  features: string[];
  rating?: number;
  reviewsCount?: number;
}

/**
 * Stickers are free — every checkout charges this flat amount instead, and
 * it's credited to the buyer's balance once the Razorpay payment is paid.
 * Must match BALANCE_TOPUP_AMOUNT in Server/controllers/orderController.js.
 */
export const BALANCE_TOPUP_AMOUNT = 150;

/**
 * Maps a `/api/shop-products` row (admin catalog, camelCase per
 * shopProductModel.js's toApi()) onto the shape the storefront/checkout UI
 * already knows how to render.
 */
export function mapApiShopProduct(api: any): ProductItem {
  return {
    id: String(api.id),
    name: api.name || 'Safety Tag',
    desc: api.description || '',
    price: Number(api.price) || 0,
    mrp: Number(api.mrp) || Number(api.price) || 0,
    category: api.category || 'Vehicle',
    badge: api.badge || '',
    img: api.imageUrl || '',
    features: Array.isArray(api.features) ? api.features : [],
    rating: typeof api.rating === 'number' && api.rating > 0 ? api.rating : undefined,
    reviewsCount: typeof api.reviewsCount === 'number' && api.reviewsCount > 0 ? api.reviewsCount : undefined,
  };
}

/** Fallback catalog shown until the admin-managed /api/shop-products list loads (or if it's empty). */
export const DEFAULT_PRODUCTS: ProductItem[] = [
  // ── Vehicle Category ──────────────────────────────────────────────────────
  {
    id: 'car-qr',
    name: 'Automobile Safety Tag',
    desc: 'Windshield and rear-glass tag that keeps your phone number off the glass while enabling parking alerts and crash SOS.',
    price: 299,
    mrp: 599,
    category: 'Vehicle',
    badge: 'Best Seller',
    img: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=85',
    rating: 4.9,
    reviewsCount: 3840,
    features: ['Parking issue masked call', 'Tow & emergency alert', 'Crash SOS notification', 'Weatherproof 3M UV laminate'],
  },
  {
    id: 'bike-qr',
    name: 'Motorcycle & Helmet Tag',
    desc: 'Anti-tamper movement alerts, first-responder medical card, and emergency hotline for bikers and riders.',
    price: 249,
    mrp: 499,
    category: 'Vehicle',
    badge: 'Rider Essential',
    img: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=85',
    rating: 4.8,
    reviewsCount: 2150,
    features: ['Emergency hotline for first responders', 'Blood group & allergy medical card', 'Anti-tamper movement ping', 'Fits curved helmets & fuel tanks'],
  },
  {
    id: 'bicycle-qr',
    name: 'Bicycle & EV Scooter Tag',
    desc: 'Compact frame tag for bicycles and electric scooters to prevent theft and enable instant finder recovery.',
    price: 199,
    mrp: 399,
    category: 'Vehicle',
    badge: 'Eco Mobility',
    img: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1200&q=85',
    rating: 4.8,
    reviewsCount: 1420,
    features: ['Frame ownership verification', 'Instant WhatsApp finder chat', 'Parking obstruction notice', 'Scratch & water-resistant 3M film'],
  },

  // ── Home Category ─────────────────────────────────────────────────────────
  {
    id: 'home-qr',
    name: 'Residential Gate & Doorbell Plate',
    desc: 'Never miss deliveries or emergency visitors while keeping your personal mobile number private at your gate.',
    price: 349,
    mrp: 699,
    category: 'Home',
    badge: 'Smart Home',
    img: 'https://images.unsplash.com/photo-1558008258-3256797b43f3?auto=format&fit=crop&w=1200&q=85',
    rating: 4.9,
    reviewsCount: 2190,
    features: ['Virtual visitor doorbell', 'Courier drop-off WhatsApp pings', 'Neighbor hazard reporting', 'Heavy-duty weatherproof acrylic mount'],
  },
  {
    id: 'apartment-qr',
    name: 'Apartment & Flat Smart Plate',
    desc: 'Doorplate for society apartments. Receive courier drop notices and society security pings with zero app required.',
    price: 299,
    mrp: 599,
    category: 'Home',
    badge: 'High Rise',
    img: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=85',
    rating: 4.8,
    reviewsCount: 1680,
    features: ['Contactless door buzzer', 'Package drop photo receipt', 'Society security hotline', 'Clean brushed metal aesthetic'],
  },
  {
    id: 'office-qr',
    name: 'Office & Commercial Entry Tag',
    desc: 'Front entrance and store QR plate for after-hours vendor deliveries, customer support, and visitor check-ins.',
    price: 399,
    mrp: 799,
    category: 'Home',
    badge: 'Commercial',
    img: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=85',
    rating: 4.9,
    reviewsCount: 1210,
    features: ['After-hours delivery dispatch', 'Multi-staff masked routing', 'Instant vendor inquiry ping', 'Tamper-proof industrial laminate'],
  },

  // ── Family Category ───────────────────────────────────────────────────────
  {
    id: 'child-qr',
    name: 'Pediatric School Bag Tag',
    desc: 'Emergency medical card, blood group, and masked parent hotline for school bags, sports kits, and field trips.',
    price: 249,
    mrp: 499,
    category: 'Family',
    badge: 'Kids Safety',
    img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=85',
    rating: 5.0,
    reviewsCount: 2420,
    features: ['Blood group & allergy directives', 'Encrypted parent hotline', 'School bus verification code', 'Child-safe non-toxic silicone loop'],
  },
  {
    id: 'pet-qr',
    name: 'Pet Smart Collar Charm',
    desc: 'Lightweight collar charm for dogs and cats with instant GPS location share and one-tap owner WhatsApp alert.',
    price: 249,
    mrp: 499,
    category: 'Family',
    badge: 'Pet Care',
    img: 'https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=1200&q=85',
    rating: 4.9,
    reviewsCount: 1980,
    features: ['Instant GPS location share on scan', 'Rabies & vaccine record badge', 'One-tap finder WhatsApp alert', 'Waterproof IP68 anodized alloy'],
  },
  {
    id: 'senior-qr',
    name: 'Senior Emergency Medical Keychain',
    desc: 'Vital health record access and one-tap guardian alert — essential for elderly family members on walks or travel.',
    price: 249,
    mrp: 499,
    category: 'Family',
    badge: 'Senior Care',
    img: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&w=1200&q=85',
    rating: 4.9,
    reviewsCount: 1650,
    features: ['Emergency medical history & doctor contact', 'Masked family guardian bridge', 'Hospital paramedic first-look card', 'Ultra-light aircraft aluminum casing'],
  },
  {
    id: 'wristband-qr',
    name: 'Medical Alert Safety Wristband',
    desc: 'Durable silicone medical wristband with QR code for diabetes, epilepsy, severe allergies, and ICE emergency contacts.',
    price: 199,
    mrp: 399,
    category: 'Family',
    badge: 'Health Guard',
    img: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=85',
    rating: 4.8,
    reviewsCount: 1120,
    features: ['Instant ICE emergency contact tree', 'Critical medication & allergy alert', 'Zero battery or charging needed', 'Hypoallergenic soft medical-grade silicone'],
  },

  // ── Travel Category ───────────────────────────────────────────────────────
  {
    id: 'travel-qr',
    name: 'Smart Luggage & Bag Tag',
    desc: 'Durable tag for suitcases, backpacks, and duffles to instantly recover lost bags at airports and transit hubs.',
    price: 299,
    mrp: 599,
    category: 'Travel',
    badge: 'Travel Essential',
    img: 'https://images.unsplash.com/photo-1553531384-cc64ac80f931?auto=format&fit=crop&w=1200&q=85',
    rating: 4.9,
    reviewsCount: 2860,
    features: ['Airport baggage recovery routing', 'Instant anonymous finder chat', 'Global transit scan GPS pings', 'Braided stainless steel cable loop'],
  },
  {
    id: 'wallet-qr',
    name: 'Valuables & Laptop Smart Plate',
    desc: 'Slim smart plate for laptops, tablet covers, passport holders, and camera equipment with reward contact mode.',
    price: 249,
    mrp: 499,
    category: 'Travel',
    badge: 'Valuables',
    img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=85',
    rating: 4.8,
    reviewsCount: 1540,
    features: ['Discreet ultra-thin metallic plate', 'Reward offered finder prompt', 'Encrypted owner contact form', 'Non-residue 3M adhesive'],
  },
  {
    id: 'keychain-qr',
    name: 'Smart Keychain & Key Ring Tag',
    desc: 'Pocket-sized key ring tag for car keys, home keys, and office fobs. Never lose your vital keys again.',
    price: 199,
    mrp: 399,
    category: 'Travel',
    badge: 'Daily EDC',
    img: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=1200&q=85',
    rating: 4.8,
    reviewsCount: 1390,
    features: ['Instant return contact for lost keys', 'No battery or app required by finder', 'Durable scratch-proof epoxy dome', 'Heavy-duty steel key loop included'],
  },
];


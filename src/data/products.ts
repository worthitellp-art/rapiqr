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

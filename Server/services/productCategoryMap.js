/**
 * Maps a purchased shop item (src/data/products.ts / admin-managed
 * /api/shop-products) onto one of the sticker categories the QR generator
 * understands (see src/stickerModules/index.ts STICKER_CATEGORIES: 'car',
 * 'bike', 'home', 'pet', 'child', 'luggage'). Needed so an order placed at
 * checkout can auto-mint the right kind of tag (OrderModel.generateStickersForOrder)
 * without an admin picking the category by hand.
 */

// Built-in catalog ids (src/data/products.ts DEFAULT_PRODUCTS) mapped directly.
const PRODUCT_ID_TO_STICKER_CATEGORY = {
  'car-qr': 'car',
  'bike-qr': 'bike',
  'bicycle-qr': 'bike',
  'home-qr': 'home',
  'apartment-qr': 'home',
  'office-qr': 'home',
  'child-qr': 'child',
  'pet-qr': 'pet',
  'senior-qr': 'child',
  'wristband-qr': 'child',
  'travel-qr': 'luggage',
  'wallet-qr': 'luggage',
  'keychain-qr': 'luggage',
};

// Fallback by the item's display category (built-in catalog's broad grouping,
// or an admin-added shop product's free-form `category` field) when the id
// itself isn't recognized.
const DISPLAY_CATEGORY_TO_STICKER_CATEGORY = {
  vehicle: 'car',
  home: 'home',
  family: 'child',
  travel: 'luggage',
};

const VALID_STICKER_CATEGORIES = new Set(['car', 'bike', 'home', 'pet', 'child', 'luggage']);

/**
 * @param {{ id?: string, category?: string }} item
 * @returns {string} a value from VALID_STICKER_CATEGORIES
 */
function mapItemToStickerCategory(item) {
  const id = String(item?.id || '').toLowerCase().trim();
  if (PRODUCT_ID_TO_STICKER_CATEGORY[id]) return PRODUCT_ID_TO_STICKER_CATEGORY[id];

  const display = String(item?.category || '').toLowerCase().trim();
  if (VALID_STICKER_CATEGORIES.has(display)) return display;
  if (DISPLAY_CATEGORY_TO_STICKER_CATEGORY[display]) return DISPLAY_CATEGORY_TO_STICKER_CATEGORY[display];

  return 'car';
}

module.exports = { mapItemToStickerCategory, VALID_STICKER_CATEGORIES };

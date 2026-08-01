/**
 * Sticker Modules — Barrel Index
 *
 * Re-exports all 4 sticker module definitions, the shared types,
 * the module registry, and all lookup helper functions.
 *
 * Usage:
 *   import { getStickerModule, VEHICLE_MODULE, StickerModuleId } from '../stickerModules';
 */

// ── Re-export types ─────────────────────────────────────────────────────────

export type { StickerModuleId, StickerModule } from './types';

// ── Re-export individual modules ────────────────────────────────────────────

export { VEHICLE_MODULE } from './vehicle';
export { HOME_MODULE } from './home';
export { KIDS_MODULE } from './kids';
export { LUGGAGE_MODULE } from './luggage';

// ── Module Registry ─────────────────────────────────────────────────────────

import type { ProductCategory } from '../types';
import type { StickerModuleId, StickerModule } from './types';
import { VEHICLE_MODULE } from './vehicle';
import { HOME_MODULE } from './home';
import { KIDS_MODULE } from './kids';
import { LUGGAGE_MODULE } from './luggage';

/**
 * Ordered array of all 4 sticker modules.
 * The order here defines the display order in UIs.
 */
export const STICKER_MODULES: StickerModule[] = [
  VEHICLE_MODULE,
  HOME_MODULE,
  KIDS_MODULE,
  LUGGAGE_MODULE,
];

// ── Lookup: module id → module ──────────────────────────────────────────────

const moduleById: Record<StickerModuleId, StickerModule> = {
  vehicle: VEHICLE_MODULE,
  home: HOME_MODULE,
  kids: KIDS_MODULE,
  luggage: LUGGAGE_MODULE,
};

// ── Lookup: ProductCategory → module id ─────────────────────────────────────

const categoryModuleMap: Partial<Record<ProductCategory, StickerModuleId>> = {};

for (const mod of STICKER_MODULES) {
  for (const cat of mod.categories) {
    categoryModuleMap[cat] = mod.id;
  }
}

// ── Category → human label ──────────────────────────────────────────────────

const CATEGORY_LABELS: Partial<Record<ProductCategory, string>> = {
  car: 'Car',
  bike: 'Motorcycle',
  bicycle: 'Bicycle',
  helmet: 'Helmet',
  home: 'Home Gate',
  door: 'Door Tag',
  apartment: 'Apartment Gate',
  employee: 'Employee ID',
  nfc: 'NFC Tag',
  child: 'School Bag',
  senior: 'Senior Keychain',
  wristband: 'Wristband',
  luggage: 'Luggage',
  travel: 'Travel Tag',
  wallet: 'Wallet',
  keychain: 'Keychain',
  pet: 'Pet Tag',
};

// ── Public Helpers ──────────────────────────────────────────────────────────

/**
 * Resolve a `ProductCategory` to its parent `StickerModule`.
 * Returns `null` if the category is unknown.
 */
export function getStickerModule(category: ProductCategory): StickerModule | null {
  const id = categoryModuleMap[category];
  return id ? moduleById[id] : null;
}

/**
 * Get the module identifier for a given category.
 * Returns `'vehicle'` as the default fallback.
 */
export function getStickerModuleId(category: ProductCategory): StickerModuleId {
  return categoryModuleMap[category] ?? 'vehicle';
}

/**
 * Return all `ProductCategory` values that belong to a given module.
 */
export function getModuleCategories(moduleId: StickerModuleId): ProductCategory[] {
  return moduleById[moduleId]?.categories ?? [];
}

/**
 * Get a `StickerModule` by its id.
 * Returns `null` if not found.
 */
export function getModuleById(moduleId: StickerModuleId): StickerModule | null {
  return moduleById[moduleId] ?? null;
}

/**
 * Check whether a category belongs to a specific module.
 */
export function isCategoryInModule(
  category: ProductCategory,
  moduleId: StickerModuleId
): boolean {
  return categoryModuleMap[category] === moduleId;
}

/**
 * Return the emoji icon for a given sticker category.
 */
export function getCategoryIcon(category: ProductCategory): string {
  const mod = getStickerModule(category);
  return mod?.icon ?? '📋';
}

/**
 * Return a human-friendly display label for a category.
 */
export function getCategoryLabel(category: ProductCategory): string {
  return CATEGORY_LABELS[category] ?? category;
}

/**
 * Sticker creation categories — shown in the admin "Generate QR" panel and
 * used to personalise the scanner activation title.
 */
export const STICKER_CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: 'car', label: 'Car & Auto & Truck' },
  { value: 'bike', label: 'Bike' },
  { value: 'home', label: 'Home & Office' },
  { value: 'pet', label: 'Pet' },
  { value: 'child', label: 'Kids' },
  { value: 'luggage', label: 'Luggage' },
];

/**
 * Human label for a sticker category value ('' when unknown).
 */
export function getStickerCategoryLabel(value?: string): string {
  return STICKER_CATEGORIES.find((c) => c.value === value)?.label ?? '';
}

/**
 * All module ids as a readonly array.
 */
export const MODULE_IDS: StickerModuleId[] = STICKER_MODULES.map((m) => m.id);

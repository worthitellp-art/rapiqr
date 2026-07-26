import type { ProductCategory } from '../types';

/** Unique identifiers for the 4 main sticker module types */
export type StickerModuleId = 'vehicle' | 'home' | 'kids' | 'luggage';

/** Full definition of a sticker module */
export interface StickerModule {
  /** Unique id for the module */
  id: StickerModuleId;
  /** Human-readable label (short) — e.g. "Vehicle" */
  label: string;
  /** Singular label — e.g. "Vehicle" */
  labelSingular: string;
  /** Plural label — e.g. "Vehicles" */
  labelPlural: string;
  /** Short tagline shown in UIs */
  tagline: string;
  /** Description displayed on cards / tooltips */
  description: string;
  /** Which ProductCategory values belong to this module */
  categories: ProductCategory[];
  /** emoji icon (lightweight, no external dep) */
  icon: string;
  /** Accent colour (hex) */
  color: string;
  /** Light tint colour (hex) for backgrounds */
  colorLight: string;
}

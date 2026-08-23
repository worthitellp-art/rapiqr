/**
 * The reusable button-action system shared by every non-car/bike scan page.
 *
 * `categoryVariants.ts` owns the copy (titles, leads, bullets, the wording of
 * each owner alert). This module owns what the buttons DO, and reduces every
 * tile to at most three reusable action types:
 *
 *   SERVICE_PROVIDER — resolve an admin-configured provider for a service type
 *                      and show its name + number so the visitor can call it.
 *   SEND_SMS         — notify the OWNER ONLY with that button's own message.
 *   CHAT_OWNER       — open (or resume) the RepiChat thread for this tag.
 *
 * A tile is service-based iff it appears in `SERVICE_TILES`; everything else is
 * asset-based and gets only SEND_SMS + CHAT_OWNER, per the spec.
 *
 * Actions the three types don't cover — public emergency dialling (108/112/101),
 * Maps lookups, the GPS pin, the composer and the assistant — are carried
 * through untouched as `OTHER`, because dropping "Call Ambulance · 108" from a
 * medical tile would be a safety regression, not a simplification.
 *
 * The bespoke car/bike screen in ScanPage.tsx does not read any of this.
 */

import type { CategoryVariant, VariantAction, VariantTile, ActionStyle } from "./categoryVariants";

/* ------------------------------------------------------------------ */
/*  Service types                                                      */
/* ------------------------------------------------------------------ */

/**
 * `legacy` is the label the admin Communication page has always stored in the
 * `category` column. It must stay exactly as-is: the bespoke car/bike screen
 * still looks providers up by that string (getAdminContacts("Towing")), and
 * rows created before the service_type migration only have that column.
 */
export interface ServiceTypeMeta {
  /** Stable slug stored in `communication.service_type`. */
  slug: string;
  /** Admin-facing name. */
  label: string;
  /** Legacy `communication.category` value, or null for types added here. */
  legacy: string | null;
  /** Button text shown to the scanner. */
  cta: string;
}

export const SERVICE_TYPES: ServiceTypeMeta[] = [
  { slug: "ambulance", label: "Ambulance", legacy: "Ambulance", cta: "Call an ambulance service" },
  { slug: "towing", label: "Towing", legacy: "Towing", cta: "Call a towing partner" },
  { slug: "mechanic", label: "Mechanic", legacy: "Mechanic", cta: "Call a mechanic" },
  { slug: "flat_tire", label: "Flat Tire", legacy: "Flat Tire", cta: "Call tyre assistance" },
  { slug: "battery", label: "Battery", legacy: "Battery", cta: "Call battery assistance" },
  { slug: "fuel", label: "Fuel", legacy: "Fuel", cta: "Call fuel delivery" },
  { slug: "parking", label: "Parking", legacy: "Parking", cta: "Call parking enforcement" },
  { slug: "police", label: "Police", legacy: "Police", cta: "Call a police helpline" },
  { slug: "theft", label: "Theft", legacy: "Theft", cta: "Call anti-theft response" },
  { slug: "headlights", label: "Headlights", legacy: "Headlights", cta: "Call roadside light assist" },
  { slug: "family", label: "Family", legacy: "Family", cta: "Call a family contact" },
  { slug: "veterinarian", label: "Veterinarian", legacy: null, cta: "Call a vet" },
  { slug: "plumber", label: "Plumber", legacy: null, cta: "Call a plumber" },
  { slug: "electrician", label: "Electrician", legacy: null, cta: "Call an electrician" },
  { slug: "locksmith", label: "Locksmith", legacy: null, cta: "Call a locksmith" },
  { slug: "lift_technician", label: "Lift Technician", legacy: null, cta: "Call a lift technician" },
  { slug: "courier", label: "Courier", legacy: null, cta: "Call a courier for pickup" },
  { slug: "lost_found", label: "Lost & Found", legacy: null, cta: "Call a lost & found desk" },
  { slug: "security", label: "Security", legacy: null, cta: "Call a security service" },
  { slug: "support", label: "Support", legacy: null, cta: "Call RepiQR support" },
];

const SERVICE_TYPE_BY_SLUG: Record<string, ServiceTypeMeta> = Object.fromEntries(
  SERVICE_TYPES.map((s) => [s.slug, s])
);

export function getServiceType(slug: string): ServiceTypeMeta | undefined {
  return SERVICE_TYPE_BY_SLUG[slugifyService(slug)];
}

/** "Flat Tire" -> "flat_tire". Mirrors the server-side slugify in helplineModel.js. */
export function slugifyService(value: string | null | undefined): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s*&\s*/g, "_")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

/* ------------------------------------------------------------------ */
/*  Which tiles are service-based                                      */
/* ------------------------------------------------------------------ */

/**
 * `"<category>:<tile title>"` → service type slug.
 *
 * Anything absent from this map is an asset-based tile: it shows only
 * SEND_SMS + CHAT_OWNER and never a Service Provider button. Keys must match
 * the tile titles in categoryVariants.ts exactly — `assertTileConfigIsValid()`
 * checks that in development.
 */
export const SERVICE_TILES: Record<string, string> = {
  /* Bicycle */
  "bicycle:Rider Down": "ambulance",
  "bicycle:Theft Alert": "theft",
  "bicycle:Roadside Fix": "mechanic",
  "bicycle:Puncture": "flat_tire",
  "bicycle:Blocking a Path": "parking",
  "bicycle:Abandoned Cycle": "support",

  /* Helmet */
  "helmet:Ambulance": "ambulance",
  "helmet:Accident Report": "police",
  "helmet:Helmet Found": "lost_found",

  /* Home gate */
  "home:Water Leak": "plumber",
  "home:Security Alert": "security",

  /* Door tag */
  "door:Leak / Damage": "plumber",
  "door:Report Issue": "support",

  /* Apartment */
  "apartment:Trapped in Lift": "lift_technician",
  "apartment:Security Alert": "security",

  /* Employee ID */
  "employee:Block Access": "support",
  "employee:Company Desk": "support",
  "employee:Drop It Off": "lost_found",
  "employee:Medical Emergency": "ambulance",
  "employee:Nearest Police": "police",

  /* NFC tag */
  "nfc:Return the Item": "courier",
  "nfc:Emergency": "ambulance",
  "nfc:Report Misuse": "support",

  /* Kids */
  "child:Nearest Police": "police",
  "child:Ambulance": "ambulance",

  /* Senior */
  "senior:Ambulance": "ambulance",
  "senior:Nearest Police": "police",

  /* Wristband */
  "wristband:Ambulance": "ambulance",
  "wristband:Nearest Hospital": "ambulance",

  /* Pet */
  "pet:Nearest Vet": "veterinarian",
  "pet:Animal Helpline": "veterinarian",
  "pet:Shelter Drop": "lost_found",

  /* Luggage */
  "luggage:Lost & Found": "lost_found",
  "luggage:Airline Desk": "support",
  "luggage:Courier Return": "courier",
  "luggage:Nearest Police": "police",

  /* Travel pouch */
  "travel:Airline Desk": "support",
  "travel:Courier Return": "courier",
  "travel:Nearest Police": "police",

  /* Wallet */
  "wallet:Nearest Police": "police",
  "wallet:Courier Return": "courier",

  /* Keychain */
  "keychain:Drop Point": "lost_found",
  "keychain:Nearest Police": "police",
  "keychain:Courier Return": "courier",
  "keychain:Report Issue": "support",
};

/* ------------------------------------------------------------------ */
/*  Button model                                                       */
/* ------------------------------------------------------------------ */

export type CategoryActionType = "SERVICE_PROVIDER" | "SEND_SMS" | "CHAT_OWNER" | "OTHER";

export type CategoryButtonAction =
  | { actionType: "SERVICE_PROVIDER"; serviceType: string }
  | { actionType: "SEND_SMS"; issue: string; message: string }
  | { actionType: "CHAT_OWNER"; message?: string }
  /* Carried through from the variant unchanged — public dial, maps, pin, write, ask. */
  | { actionType: "OTHER"; action: VariantAction };

export interface CategoryButton {
  label: string;
  style: ActionStyle;
  action: CategoryButtonAction;
}

export interface ServiceProvider {
  id?: string;
  label: string;
  phone: string;
  category?: string;
  service_type?: string;
  categories?: string[];
  active?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Config → buttons                                                   */
/* ------------------------------------------------------------------ */

/** "Message Rider's Family" → "Rider's Family"; "Message the Society" → "the Society". */
function ownerNoun(variant: CategoryVariant): string {
  return variant.owner.replace(/^Message\s+/i, "").trim() || "the owner";
}

/** Stable id for this issue — becomes the alert `type` in the admin feed. */
export function issueSlug(category: string, tileTitle: string): string {
  return `${category}_${tileTitle}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

/**
 * The message this tile's SEND_SMS button sends. Defaults to the tile's own
 * `notify` wording — already written per-button in categoryVariants.ts — and
 * falls back to the category's default alert when that tile left it blank.
 */
export function tileMessage(tile: VariantTile, variant: CategoryVariant): string {
  const notify = tile.actions.find((a) => a.action.kind === "notify");
  const text = notify && notify.action.kind === "notify" ? notify.action.text : undefined;
  return text || variant.alert;
}

/**
 * Build the button list for one tile, ordered most-urgent first:
 *
 *   1. retained public emergency numbers (108 / 112 / 101 ...)
 *   2. SERVICE_PROVIDER   — service tiles only
 *   3. SEND_SMS           — every tile
 *   4. CHAT_OWNER         — every tile
 *   5. retained Maps / GPS pin / composer / assistant
 *
 * Dialling 101 has to outrank "Send SMS to the Society" on a fire tile, so the
 * three reusable actions slot in behind the emergency lines rather than on top
 * of them.
 */
export function resolveTileButtons(
  category: string,
  tile: VariantTile,
  variant: CategoryVariant
): CategoryButton[] {
  const serviceType = SERVICE_TILES[`${category}:${tile.title}`];
  const noun = ownerNoun(variant);
  const message = tileMessage(tile, variant);

  const emergencyCalls: CategoryButton[] = [];
  const secondary: CategoryButton[] = [];

  for (const a of tile.actions) {
    // Replaced by SERVICE_PROVIDER — these carried hardcoded placeholder numbers.
    if (a.action.kind === "call" && a.action.via !== "public") continue;
    // Replaced by SEND_SMS.
    if (a.action.kind === "notify") continue;

    const button: CategoryButton = {
      label: a.label,
      style: a.action.kind === "call" ? "primary" : "ghost",
      action: { actionType: "OTHER", action: a.action },
    };
    (a.action.kind === "call" ? emergencyCalls : secondary).push(button);
  }

  const core: CategoryButton[] = [];

  if (serviceType) {
    const meta = getServiceType(serviceType);
    core.push({
      label: meta?.cta || "Find a service provider",
      style: "primary",
      action: { actionType: "SERVICE_PROVIDER", serviceType },
    });
  }

  core.push({
    label: "WhatsApp",
    style: "wa",
    action: { actionType: "SEND_SMS", issue: issueSlug(category, tile.title), message },
  });

  core.push({
    label: "Chat",
    style: "blue",
    action: { actionType: "CHAT_OWNER", message },
  });

  return [...emergencyCalls, ...core, ...secondary];
}

/* ------------------------------------------------------------------ */
/*  Provider resolution                                                */
/* ------------------------------------------------------------------ */

/**
 * Active providers matching a service type for this sticker category.
 *
 * Matches on `service_type`, falling back to the legacy `category` label so
 * rows created before Server/sql/service_providers.sql still resolve. A
 * provider with no `categories` applies to every sticker category.
 */
export function resolveServiceProviders(
  all: ServiceProvider[] | null | undefined,
  serviceType: string,
  stickerCategory?: string
): ServiceProvider[] {
  const want = slugifyService(serviceType);
  if (!want) return [];

  return (all || []).filter((p) => {
    if (!p || p.active === false || !p.phone) return false;
    if (slugifyService(p.service_type || p.category) !== want) return false;
    const cats = Array.isArray(p.categories) ? p.categories : [];
    return cats.length === 0 || !stickerCategory || cats.includes(stickerCategory);
  });
}

/* ------------------------------------------------------------------ */
/*  Dev-time config check                                              */
/* ------------------------------------------------------------------ */

/**
 * Guards the two ways `SERVICE_TILES` can silently rot: a tile title that was
 * renamed in categoryVariants.ts, or a service slug that isn't in the
 * catalogue. Logs rather than throws — a stale key degrades a tile to
 * asset-based, which is safe, but should be visible while developing.
 */
export function assertTileConfigIsValid(
  variants: Record<string, CategoryVariant>,
  bespoke: readonly string[] = []
): string[] {
  const problems: string[] = [];
  const known = new Set<string>();

  for (const [category, variant] of Object.entries(variants)) {
    if (bespoke.includes(category)) continue;
    for (const tile of variant.tiles) known.add(`${category}:${tile.title}`);
  }

  for (const [key, slug] of Object.entries(SERVICE_TILES)) {
    if (!known.has(key)) problems.push(`SERVICE_TILES key "${key}" matches no tile`);
    if (!getServiceType(slug)) problems.push(`SERVICE_TILES["${key}"] uses unknown service type "${slug}"`);
  }

  return problems;
}

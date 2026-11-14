/**
 * Crop Catalog Frontend Presentation Adapter & Display Name Separator
 *
 * Enforces strict separation between canonical, stable crop identifiers (IDs)
 * and their localized, human-readable display names across the frontend UI.
 *
 * ARCHITECTURAL BOUNDARIES:
 * 1. UI components must NEVER use display names as keys, map indices, or selection IDs.
 * 2. Stable IDs must originate from Developer 1's authoritative backend catalog (src/agronomy/crops.ts)
 *    or approved catalog-only items.
 * 3. The first six crops are rotation-engine supported:
 *    - paddy_transplanted
 *    - paddy_dsr
 *    - bread_wheat
 *    - kharif_maize
 *    - summer_moong
 *    - rabi_mustard
 * 4. The following crops are catalog-only (selectable and stored, but NOT rotation-engine calculated):
 *    - spring_sunflower
 *    - potato_early
 *    - Additional historical items: cotton, sugarcane, chickpea
 * 5. Basmati is NOT a canonical crop ID and is NOT mapped to paddy_transplanted or paddy_dsr.
 * 6. Unknown stored IDs are preserved verbatim and isolated from rotation calculation queries.
 * 7. Localization (English, Punjabi/Gurmukhi, Hindi/Devanagari) is handled purely at the presentation layer.
 */

import { CROPS_PUNJAB } from "@/agronomy/crops";

export interface CropDisplayItem {
  /** Authoritative stable identifier (e.g. "paddy_transplanted") */
  id: string;

  /** Standard English display title (e.g. "Puddled Transplanted Rice (Paddy)") */
  displayName: string;

  /** Colloquial short label for UI cards and badges (e.g. "Paddy") */
  commonName: string;

  /** Localized Punjabi (Gurmukhi) designation */
  localizedNamePunjabi?: string;

  /** Localized Hindi (Devanagari) designation */
  localizedNameHindi?: string;

  /** Season classification from catalog */
  season?: string;

  /** Season display badge text */
  seasonLabel?: string;

  /** Category classification */
  category?: "cereal" | "pulse" | "oilseed" | "fiber" | "cash";

  /** Indicates whether this crop ID is recognized in the frontend crop catalog */
  isConfirmedInCatalog: boolean;

  /** Indicates whether this crop is supported by Developer 1's rotation calculation engine */
  isRotationSupported: boolean;
}

/**
 * Exactly eight approved primary crop identifiers.
 */
export const APPROVED_EIGHT_CROP_IDS = [
  "paddy_transplanted",
  "paddy_dsr",
  "bread_wheat",
  "kharif_maize",
  "summer_moong",
  "rabi_mustard",
  "spring_sunflower",
  "potato_early",
] as const;

/**
 * Six rotation-engine supported crop identifiers.
 */
export const ROTATION_ENGINE_SUPPORTED_CROP_IDS = [
  "paddy_transplanted",
  "paddy_dsr",
  "bread_wheat",
  "kharif_maize",
  "summer_moong",
  "rabi_mustard",
] as const;

/**
 * Authoritative presentation registry mapping verified crop IDs to display metadata.
 * Extends English display names with Punjabi (Gurmukhi) and Hindi (Devanagari).
 */
const AUTHORITATIVE_DISPLAY_METADATA: Record<
  string,
  {
    commonName: string;
    displayName?: string;
    localizedNamePunjabi: string;
    localizedNameHindi: string;
    season?: string;
    seasonLabel?: string;
    category?: "cereal" | "pulse" | "oilseed" | "fiber" | "cash";
    isRotationSupported: boolean;
  }
> = {
  // 1. Puddled Transplanted Rice (Rotation-Supported)
  paddy_transplanted: {
    commonName: "Paddy (Transplanted)",
    displayName: "Puddled Transplanted Rice (Paddy)",
    localizedNamePunjabi: "ਝੋਨਾ (ਕੱਦੂ ਕਰਕੇ ਲਾਇਆ)",
    localizedNameHindi: "धान (रोपाई / कद्दू)",
    season: "kharif",
    seasonLabel: "Kharif (Monsoon)",
    category: "cereal",
    isRotationSupported: true,
  },

  // 2. Direct-Seeded Rice (Rotation-Supported)
  paddy_dsr: {
    commonName: "Direct-Seeded Rice (DSR)",
    displayName: "Direct-Seeded Rice (DSR)",
    localizedNamePunjabi: "ਸਿੱਧੀ ਬਿਜਾਈ ਵਾਲਾ ਝੋਨਾ",
    localizedNameHindi: "सीधी बिजाई वाला धान (DSR)",
    season: "kharif",
    seasonLabel: "Kharif (Monsoon / DSR)",
    category: "cereal",
    isRotationSupported: true,
  },

  // 3. Rabi Bread Wheat (Rotation-Supported)
  bread_wheat: {
    commonName: "Wheat",
    displayName: "Rabi Bread Wheat",
    localizedNamePunjabi: "ਕਣਕ",
    localizedNameHindi: "गेहूं",
    season: "rabi",
    seasonLabel: "Rabi (Winter)",
    category: "cereal",
    isRotationSupported: true,
  },

  // 4. Kharif Grain Maize (Rotation-Supported)
  kharif_maize: {
    commonName: "Maize",
    displayName: "Kharif Grain Maize",
    localizedNamePunjabi: "ਮੱਕੀ",
    localizedNameHindi: "मक्का",
    season: "kharif",
    seasonLabel: "Kharif (Monsoon)",
    category: "cereal",
    isRotationSupported: true,
  },

  // 5. Summer Moong (Rotation-Supported)
  summer_moong: {
    commonName: "Summer Moong",
    displayName: "Summer Moong (Green Gram)",
    localizedNamePunjabi: "ਮੂੰਗੀ",
    localizedNameHindi: "मूंग",
    season: "zaid",
    seasonLabel: "Zaid (Summer Catch Crop)",
    category: "pulse",
    isRotationSupported: true,
  },

  // 6. Rabi Mustard / Raya (Rotation-Supported)
  rabi_mustard: {
    commonName: "Mustard",
    displayName: "Rabi Mustard (Raya)",
    localizedNamePunjabi: "ਰ੍ਹਾਇਆ / ਸਰ੍ਹੋਂ",
    localizedNameHindi: "सरसों / राया",
    season: "rabi",
    seasonLabel: "Rabi (Winter)",
    category: "oilseed",
    isRotationSupported: true,
  },

  // 7. Spring Sunflower (Catalog-Only: Selectable in Onboarding, not calculated in engine)
  spring_sunflower: {
    commonName: "Sunflower",
    displayName: "Spring Sunflower",
    localizedNamePunjabi: "ਸੂਰਜਮੁਖੀ",
    localizedNameHindi: "सूरजमुखी",
    season: "zaid",
    seasonLabel: "Spring / Zaid",
    category: "oilseed",
    isRotationSupported: false,
  },

  // 8. Early Potato (Catalog-Only: Selectable in Onboarding, not calculated in engine)
  potato_early: {
    commonName: "Early Potato",
    displayName: "Early Potato",
    localizedNamePunjabi: "ਆਲੂ (ਅਗੇਤਾ)",
    localizedNameHindi: "आलू (अगेती)",
    season: "rabi",
    seasonLabel: "Autumn / Early Rabi",
    category: "cash",
    isRotationSupported: false,
  },

  // Historical Catalog Items (Non-Rotation Supported)
  cotton: {
    commonName: "Cotton",
    displayName: "Bt Cotton",
    localizedNamePunjabi: "ਨਰਮਾ / ਕਪਾਹ",
    localizedNameHindi: "कपास",
    season: "kharif",
    seasonLabel: "Kharif (Monsoon)",
    category: "fiber",
    isRotationSupported: false,
  },
  sugarcane: {
    commonName: "Sugarcane",
    displayName: "Sugarcane (Annual)",
    localizedNamePunjabi: "ਕਮਾਦ / ਗੰਨਾ",
    localizedNameHindi: "गन्ना",
    season: "year_round",
    seasonLabel: "Perennial / Annual",
    category: "cash",
    isRotationSupported: false,
  },
  chickpea: {
    commonName: "Chickpea",
    displayName: "Desi Chickpea (Gram)",
    localizedNamePunjabi: "ਛੋਲੇ",
    localizedNameHindi: "चना",
    season: "rabi",
    seasonLabel: "Rabi (Winter)",
    category: "pulse",
    isRotationSupported: false,
  },
};

/**
 * Checks whether an ID is one of the eight approved primary crop IDs.
 */
export function isApprovedEightCropId(cropId: string): boolean {
  return typeof cropId === "string" && APPROVED_EIGHT_CROP_IDS.includes(cropId as any);
}

/**
 * Checks whether an ID is in Developer 1's authoritative backend calculation engine (CROPS_PUNJAB).
 */
export function isAuthoritativeCropId(cropId: string): boolean {
  return typeof cropId === "string" && Boolean(CROPS_PUNJAB[cropId]);
}

/**
 * Checks whether an ID is supported by the crop rotation calculation engine.
 * Exactly 6 crops are rotation-supported.
 */
export function isRotationSupportedCropId(cropId: string): boolean {
  return typeof cropId === "string" && Boolean(AUTHORITATIVE_DISPLAY_METADATA[cropId]?.isRotationSupported);
}

/**
 * Filters a list of crop IDs, returning ONLY those supported by the rotation engine.
 * Prevents catalog-only or unknown/legacy IDs from being passed to rotation calculations.
 */
export function filterRotationSupportedCrops(cropIds: string[]): string[] {
  if (!Array.isArray(cropIds)) return [];
  return cropIds.filter((id) => isRotationSupportedCropId(id));
}

/**
 * Identifies any crops in a selection list that are catalog-only or unconfirmed.
 * Used by UI components to inform farmers transparently.
 */
export function getRotationUnsupportedCrops(cropIds: string[]): string[] {
  if (!Array.isArray(cropIds)) return [];
  return cropIds.filter((id) => !isRotationSupportedCropId(id));
}

/**
 * Resolves presentation metadata for a given crop ID.
 *
 * PHASE 6 GUARANTEE:
 * - If the ID is unknown or legacy (e.g. "basmati" or an obsolete ID), the exact ID is PRESERVED.
 * - It is NEVER automatically remapped to another crop.
 * - It is marked as `isConfirmedInCatalog: false` and `isRotationSupported: false`.
 */
export function getCropDisplay(cropId: string): CropDisplayItem {
  if (!cropId || typeof cropId !== "string") {
    return {
      id: "unknown",
      displayName: "Unknown Crop",
      commonName: "Unknown",
      isConfirmedInCatalog: false,
      isRotationSupported: false,
    };
  }

  const backendCrop = CROPS_PUNJAB[cropId];
  const metadata = AUTHORITATIVE_DISPLAY_METADATA[cropId];

  if (backendCrop) {
    return {
      id: backendCrop.id,
      displayName: metadata?.displayName ?? backendCrop.name,
      commonName: metadata?.commonName ?? backendCrop.name,
      localizedNamePunjabi: metadata?.localizedNamePunjabi,
      localizedNameHindi: metadata?.localizedNameHindi,
      season: backendCrop.season,
      seasonLabel: metadata?.seasonLabel,
      category: metadata?.category,
      isConfirmedInCatalog: true,
      isRotationSupported: true,
    };
  }

  if (metadata) {
    return {
      id: cropId,
      displayName: metadata.displayName ?? formatFallbackDisplayName(cropId),
      commonName: metadata.commonName,
      localizedNamePunjabi: metadata.localizedNamePunjabi,
      localizedNameHindi: metadata.localizedNameHindi,
      season: metadata.season,
      seasonLabel: metadata.seasonLabel,
      category: metadata.category,
      isConfirmedInCatalog: true,
      isRotationSupported: false,
    };
  }

  // Phase 6: Unknown or unconfirmed ID preservation without remapping or data loss
  return {
    id: cropId,
    displayName: formatFallbackDisplayName(cropId),
    commonName: cropId,
    isConfirmedInCatalog: false,
    isRotationSupported: false,
  };
}

/**
 * Returns the human-readable display name for a crop ID according to selected locale.
 * Supports overloaded arguments:
 * - getCropDisplayName(id, "pa") -> Punjabi name
 * - getCropDisplayName(id, "Custom Fallback") -> English name or custom fallback
 * - getCropDisplayName(id, "pa", "Custom Fallback") -> Punjabi with custom fallback
 */
export function getCropDisplayName(
  cropId: string,
  localeOrFallback?: "en" | "pa" | "hi" | string,
  explicitFallback?: string
): string {
  const isLocale =
    localeOrFallback === "en" ||
    localeOrFallback === "pa" ||
    localeOrFallback === "hi";
  const locale: "en" | "pa" | "hi" = isLocale ? (localeOrFallback as "en" | "pa" | "hi") : "en";
  const fallback = !isLocale ? localeOrFallback : explicitFallback;

  const display = getCropDisplay(cropId);
  if (!display.isConfirmedInCatalog && fallback) {
    return fallback;
  }

  if (locale === "pa" && display.localizedNamePunjabi) {
    return display.localizedNamePunjabi;
  }
  if (locale === "hi" && display.localizedNameHindi) {
    return display.localizedNameHindi;
  }

  return display.displayName;
}

/**
 * Returns the localized Punjabi display name if available.
 */
export function getCropLocalizedName(cropId: string): string | undefined {
  return getCropDisplay(cropId).localizedNamePunjabi;
}

/**
 * Returns the localized Punjabi display name if available.
 */
export function getCropLocalizedNamePunjabi(cropId: string): string | undefined {
  return getCropDisplay(cropId).localizedNamePunjabi;
}

/**
 * Returns the localized Hindi display name if available.
 */
export function getCropLocalizedNameHindi(cropId: string): string | undefined {
  return getCropDisplay(cropId).localizedNameHindi;
}

/**
 * Returns the confirmed crops from Developer 1's authoritative rotation engine.
 */
export function getConfirmedCropDisplayList(): CropDisplayItem[] {
  return Object.keys(CROPS_PUNJAB).map((id) => getCropDisplay(id));
}

/**
 * Returns the approved eight primary crops.
 */
export function getApprovedEightCropDisplayList(): CropDisplayItem[] {
  return APPROVED_EIGHT_CROP_IDS.map((id) => getCropDisplay(id));
}

/**
 * Safely transforms a snake_case or kebab-case identifier into a title-cased fallback label.
 */
function formatFallbackDisplayName(identifier: string): string {
  return identifier
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

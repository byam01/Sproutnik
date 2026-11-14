/**
 * Crop Catalog Frontend Adapter & Display Name Separator
 *
 * Enforces strict separation between canonical, stable crop identifiers (IDs)
 * and their localized, human-readable display names across the frontend UI.
 *
 * ARCHITECTURAL BOUNDARIES:
 * 1. UI components must NEVER use display names as keys, map indices, or selection IDs.
 * 2. Stable IDs must originate from Developer 1's authoritative backend catalog (src/agronomy/crops.ts).
 * 3. Do NOT invent arbitrary crop IDs.
 * 4. Any unconfirmed or external crop ID is isolated behind this adapter boundary and marked
 *    as `isConfirmedInCatalog: false`.
 * 5. Localization (English, Punjabi/Gurmukhi, transliteration) is handled purely at the presentation layer.
 */

import { CROPS_PUNJAB } from "@/agronomy/crops";

export interface CropDisplayItem {
  /** Authoritative stable identifier from backend registry (e.g. "paddy_transplanted") */
  id: string;

  /** Standard English display title (e.g. "Puddled Transplanted Rice (Paddy)") */
  displayName: string;

  /** Colloquial short label for tight UI cards and badges (e.g. "Paddy") */
  commonName: string;

  /** Localized Punjabi (Gurmukhi) designation */
  localizedNamePunjabi?: string;

  /** Season classification from catalog */
  season?: string;

  /** Indicates whether this crop ID has been verified in Developer 1's authoritative backend registry */
  isConfirmedInCatalog: boolean;
}

/**
 * Authoritative presentation registry mapping verified backend crop IDs to display metadata.
 * Sourced directly from CROPS_PUNJAB without modifying or renaming backend entities.
 */
const AUTHORITATIVE_DISPLAY_METADATA: Record<
  string,
  { commonName: string; localizedNamePunjabi: string }
> = {
  paddy_transplanted: {
    commonName: "Paddy (Transplanted)",
    localizedNamePunjabi: "ਝੋਨਾ (ਕੱਦੂ ਕਰਕੇ ਲਾਇਆ)",
  },
  paddy_dsr: {
    commonName: "Direct-Seeded Rice (DSR)",
    localizedNamePunjabi: "ਸਿੱਧੀ ਬਿਜਾਈ ਵਾਲਾ ਝੋਨਾ",
  },
  bread_wheat: {
    commonName: "Wheat",
    localizedNamePunjabi: "ਕਣਕ",
  },
  kharif_maize: {
    commonName: "Maize",
    localizedNamePunjabi: "ਮੱਕੀ",
  },
  summer_moong: {
    commonName: "Summer Moong",
    localizedNamePunjabi: "ਗਰਮ ਰੁੱਤ ਦੀ ਮੂੰਗੀ",
  },
  rabi_mustard: {
    commonName: "Mustard / Raya",
    localizedNamePunjabi: "ਸਰ੍ਹੋਂ / ਰਾਇਆ",
  },
  spring_sunflower: {
    commonName: "Sunflower",
    localizedNamePunjabi: "ਸੂਰਜਮੁਖੀ",
  },
  potato_early: {
    commonName: "Early Potato",
    localizedNamePunjabi: "ਅਗੇਤਾ ਆਲੂ",
  },
};

/**
 * Determines whether a given string is a confirmed crop ID in Developer 1's backend registry.
 */
export function isAuthoritativeCropId(cropId: string): boolean {
  return typeof cropId === "string" && Boolean(CROPS_PUNJAB[cropId]);
}

/**
 * Resolves a complete CropDisplayItem for a crop ID.
 *
 * If the crop ID is unknown or pending backend confirmation, it constructs a safe fallback
 * preserving the ID and marking `isConfirmedInCatalog: false`.
 */
export function getCropDisplay(cropId: string): CropDisplayItem {
  if (!cropId || typeof cropId !== "string") {
    return {
      id: "unknown",
      displayName: "Unknown Crop",
      commonName: "Unknown",
      isConfirmedInCatalog: false,
    };
  }

  const backendCrop = CROPS_PUNJAB[cropId];
  const metadata = AUTHORITATIVE_DISPLAY_METADATA[cropId];

  if (backendCrop) {
    return {
      id: backendCrop.id,
      displayName: backendCrop.name,
      commonName: metadata?.commonName ?? backendCrop.name,
      localizedNamePunjabi: metadata?.localizedNamePunjabi,
      season: backendCrop.season,
      isConfirmedInCatalog: true,
    };
  }

  // Fallback for unconfirmed/provisional crop IDs: never invent or mask unknown IDs
  return {
    id: cropId,
    displayName: formatFallbackDisplayName(cropId),
    commonName: cropId,
    isConfirmedInCatalog: false,
  };
}

/**
 * Returns the human-readable display name for a crop ID.
 */
export function getCropDisplayName(cropId: string, fallback?: string): string {
  const display = getCropDisplay(cropId);
  if (!display.isConfirmedInCatalog && fallback) {
    return fallback;
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
 * Returns the full list of confirmed crops available for frontend selection and display.
 */
export function getConfirmedCropDisplayList(): CropDisplayItem[] {
  return Object.keys(CROPS_PUNJAB).map((id) => getCropDisplay(id));
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

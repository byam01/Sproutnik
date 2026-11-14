/**
 * Onboarding and Farmer Profile Field Types
 *
 * Implements the approved ProfileField tri-state / multi-state status union
 * for farmer onboarding and progressive profile refinement.
 *
 * ARCHITECTURAL INTEGRITY RULES:
 * 1. The 4 states ("known", "unknown", "skipped", "not_provided") MUST remain strictly distinguishable.
 * 2. Never replace ProfileField with raw nullable/optional primitives.
 * 3. Never silently convert unknown, skipped, or not_provided states into known values.
 * 4. Never insert regional fallback defaults as if they were farmer-confirmed values.
 * 5. Keep demonstration data distinguishable from farmer-provided data (via the source attribute).
 * 6. Canonical backend FarmerProfile and runtime validation are maintained by Developer 1;
 *    this file adheres strictly to those contracts.
 */

import type {
  Location,
  ProfileLocation,
  SoilTextureType,
  IrrigationSourceType,
  FarmerProfile,
  FarmingGoal,
} from "./index";

export type { FarmingGoal };

export type ProfileFieldSource = "user" | "imported" | "verified";

export type ProfileFieldStatus = "known" | "unknown" | "skipped" | "not_provided";

/**
 * Approved canonical ProfileField union representing the provenance and confirmation
 * state of any individual farmer profile attribute.
 */
export type ProfileField<T> =
  | {
      status: "known";
      value: NonNullable<T>;
      updatedAt?: string;
      source?: ProfileFieldSource;
    }
  | { status: "unknown" }
  | { status: "skipped" }
  | { status: "not_provided" };

// ==========================================
// Field Constructor and Predicate Helpers
// ==========================================

/**
 * Creates a confirmed 'known' profile field with optional provenance source and timestamp.
 */
export function createKnownField<T>(
  value: NonNullable<T>,
  source: ProfileFieldSource = "user",
  updatedAt: string = new Date().toISOString()
): ProfileField<T> {
  return {
    status: "known",
    value,
    updatedAt,
    source,
  };
}

/**
 * Creates an 'unknown' profile field (the farmer has not yet encountered or decided on this question).
 */
export function createUnknownField<T = unknown>(): ProfileField<T> {
  return { status: "unknown" };
}

/**
 * Creates a 'skipped' profile field (the farmer explicitly chose to skip answering).
 */
export function createSkippedField<T = unknown>(): ProfileField<T> {
  return { status: "skipped" };
}

/**
 * Creates a 'not_provided' profile field (the field was presented or requested but not supplied).
 */
export function createNotProvidedField<T = unknown>(): ProfileField<T> {
  return { status: "not_provided" };
}

/**
 * Type guard for 'known' fields containing verified or user-provided values.
 */
export function isKnownField<T>(
  field: ProfileField<T>
): field is {
  status: "known";
  value: NonNullable<T>;
  updatedAt?: string;
  source?: ProfileFieldSource;
} {
  return field.status === "known" && "value" in field && field.value !== null && field.value !== undefined;
}

/**
 * Type guard for 'unknown' fields.
 */
export function isUnknownField<T>(field: ProfileField<T>): field is { status: "unknown" } {
  return field.status === "unknown";
}

/**
 * Type guard for 'skipped' fields.
 */
export function isSkippedField<T>(field: ProfileField<T>): field is { status: "skipped" } {
  return field.status === "skipped";
}

/**
 * Type guard for 'not_provided' fields.
 */
export function isNotProvidedField<T>(field: ProfileField<T>): field is { status: "not_provided" } {
  return field.status === "not_provided";
}

/**
 * Checks whether a field was directly confirmed by the farmer (as opposed to imported or unknown).
 */
export function isFarmerConfirmed<T>(field: ProfileField<T>): boolean {
  return isKnownField(field) && field.source === "user";
}

/**
 * Safely extracts the value of a ProfileField if known, or returns undefined without mutating status.
 * Crucially, does NOT insert a default value into the profile state.
 */
export function getKnownValueOrUndefined<T>(field: ProfileField<T>): NonNullable<T> | undefined {
  if (isKnownField(field)) {
    return field.value;
  }
  return undefined;
}

// ==========================================
// Frontend Onboarding State & Presentation Types
// ==========================================

export type FieldStatus = ProfileFieldStatus;

export type OnboardingMode = "welcome" | "field-guide" | "conversation";

/**
 * Regional Punjab land units:
 * - acres: Standard English acre (1 Acre = 43,560 sq ft / 1 Killa)
 * - kanals: Official Punjab statutory revenue unit (1 Acre = exactly 8 Kanals)
 * - bighas: Traditional Punjab Kacha Bigha (1 Acre ≈ 4.8 Bighas / 1 Bigha ≈ 0.208 Acre)
 * - hectares: Metric hectare (1 Hectare = 2.471 Acres)
 */
export type LandUnit = "acres" | "kanals" | "bighas" | "hectares";

/**
 * Standard demonstration coordinates for Ludhiana District, Punjab.
 * IMPORTANT: Only used as clearly identified demo data; never silently assumed.
 */
export const LUDHIANA_DEMO_LOCATION: Location = {
  latitude: 30.9,
  longitude: 75.85,
  name: "Ludhiana Demonstration Region",
  district: "Ludhiana",
  state: "Punjab",
  country: "India",
  elevationMeters: 247,
};

export interface LocationChoice {
  id: string;
  name: string;
  district: string;
  state: string;
  coordinates: { lat: number; lon: number };
  elevationMeters: number;
  description: string;
  isDemo: boolean;
}

export const RECENT_PUNJAB_LOCATIONS: LocationChoice[] = [
  {
    id: "ludhiana_demo",
    name: "Ludhiana Demonstration Region",
    district: "Ludhiana",
    state: "Punjab",
    coordinates: { lat: 30.9, lon: 75.85 },
    elevationMeters: 247,
    description: "Central intensive Rice–Wheat zone (Prototype reference dataset)",
    isDemo: true,
  },
  {
    id: "bathinda_southwest",
    name: "Bathinda South-Western Belt",
    district: "Bathinda",
    state: "Punjab",
    coordinates: { lat: 30.21, lon: 74.95 },
    elevationMeters: 211,
    description: "Cotton–Wheat semi-arid cropping zone",
    isDemo: false,
  },
  {
    id: "sangrur_plains",
    name: "Sangrur Southern Plains",
    district: "Sangrur",
    state: "Punjab",
    coordinates: { lat: 30.24, lon: 75.84 },
    elevationMeters: 232,
    description: "High groundwater stress deep tubewell zone",
    isDemo: false,
  },
  {
    id: "amritsar_majha",
    name: "Amritsar Majha Sub-Region",
    district: "Amritsar",
    state: "Punjab",
    coordinates: { lat: 31.63, lon: 74.87 },
    elevationMeters: 234,
    description: "Mixed canal-tubewell alluvial belt",
    isDemo: false,
  },
];

export interface AvailableCrop {
  id: string;
  name: string;
  localName: string;
  scientificName: string;
  season: "kharif" | "rabi" | "zaid" | "year_round";
  seasonLabel: string;
  category: "cereal" | "pulse" | "oilseed" | "fiber" | "cash";
  description: string;
}

export const PUNJAB_CROP_CATALOG: AvailableCrop[] = [
  {
    id: "paddy_transplanted",
    name: "Puddled Transplanted Rice (Paddy)",
    localName: "ਝੋਨਾ (ਕੱਦੂ ਕਰਕੇ ਲਾਇਆ) / धान (रोपाई)",
    scientificName: "Oryza sativa",
    season: "kharif",
    seasonLabel: "Kharif (Monsoon)",
    category: "cereal",
    description:
      "Traditional high-yielding flood-irrigated rice; highest groundwater demand in Punjab (~150-180 cm).",
  },
  {
    id: "paddy_dsr",
    name: "Direct Seeded Rice (DSR Tar-Wattar)",
    localName: "ਸਿੱਧੀ ਬਿਜਾਈ ਵਾਲਾ ਝੋਨਾ / सीधी बिजाई धान",
    scientificName: "Oryza sativa (DSR)",
    season: "kharif",
    seasonLabel: "Kharif (Monsoon)",
    category: "cereal",
    description:
      "PAU-recommended water-saving technology saving 15-20% water without puddling; enables earlier wheat sowing.",
  },
  {
    id: "bread_wheat",
    name: "Wheat (HD-2967 / PBW-826)",
    localName: "ਕਣਕ / गेहूं",
    scientificName: "Triticum aestivum",
    season: "rabi",
    seasonLabel: "Rabi (Winter)",
    category: "cereal",
    description:
      "Core food security cereal of Punjab; moderate water requirement (~35-40 cm) but sensitive to terminal heat.",
  },
  {
    id: "kharif_maize",
    name: "Kharif Maize (Corn)",
    localName: "ਮੱਕੀ / मक्का",
    scientificName: "Zea mays",
    season: "kharif",
    seasonLabel: "Kharif (Monsoon)",
    category: "cereal",
    description:
      "Key diversification crop recommended by PAU to replace water-intensive paddy; 60-70% lower water footprint.",
  },
  {
    id: "summer_moong",
    name: "Summer Green Gram (Moong SML-668)",
    localName: "ਮੂੰਗੀ / मूंग",
    scientificName: "Vigna radiata",
    season: "zaid",
    seasonLabel: "Zaid (Summer 60-day window)",
    category: "pulse",
    description:
      "Short-duration 60-day catch crop; fixes ~35-40 kg atmospheric nitrogen per hectare and restores soil fertility.",
  },
  {
    id: "mustard_raya",
    name: "Mustard / Raya (RLC-3 / PBR-357)",
    localName: "ਰ੍ਹਾਇਆ / ਸਰ੍ਹੋਂ / सरसों",
    scientificName: "Brassica juncea",
    season: "rabi",
    seasonLabel: "Rabi (Winter)",
    category: "oilseed",
    description:
      "Low water requirement oilseed (2-3 irrigations); ideal alternative or intercrop for moisture-stressed rabi soils.",
  },
  {
    id: "spring_sunflower",
    name: "Spring Sunflower",
    localName: "ਸੂਰਜਮੁਖੀ / सूरजमुखी",
    scientificName: "Helianthus annuus",
    season: "zaid",
    seasonLabel: "Spring / Zaid (Feb-May)",
    category: "oilseed",
    description:
      "Valuable cash oilseed grown following potato or toria; deep taproot extracts subsoil moisture.",
  },
  {
    id: "potato_early",
    name: "Early Potato (Kufri Pukhraj)",
    localName: "ਆਲੂ / आलू",
    scientificName: "Solanum tuberosum",
    season: "rabi",
    seasonLabel: "Autumn / Early Rabi",
    category: "cash",
    description:
      "High-value 75-90 day autumn cash crop; intensive input requirements; allows spring sunflower or wheat follow-on.",
  },
];

export interface OnboardingState {
  mode: OnboardingMode;
  currentStepIndex: number;

  // Location
  location: Location | null;
  locationStatus: FieldStatus;
  isDemonstrationLocation: boolean;

  // Land Area
  landArea: number | null;
  landUnit: LandUnit;
  landAreaStatus: FieldStatus;

  // Soil
  soilTexture: SoilTextureType | null;
  soilStatus: FieldStatus;

  // Irrigation
  irrigationSource: IrrigationSourceType | null;
  irrigationStatus: FieldStatus;

  // Current Crops (Canonical IDs)
  currentCrops: string[];
  cropsStatus: FieldStatus;

  // Farming Goals (Canonical IDs)
  farmingGoals: FarmingGoal[];
  goalsStatus: FieldStatus;
}

export const INITIAL_ONBOARDING_STATE: OnboardingState = {
  mode: "welcome",
  currentStepIndex: 0,
  location: null,
  locationStatus: "not_provided",
  isDemonstrationLocation: false,
  landArea: null,
  landUnit: "acres",
  landAreaStatus: "not_provided",
  soilTexture: null,
  soilStatus: "not_provided",
  irrigationSource: null,
  irrigationStatus: "not_provided",
  currentCrops: [],
  cropsStatus: "not_provided",
  farmingGoals: ["reduce_water_usage", "improve_soil_health"],
  goalsStatus: "not_provided",
};

export interface FieldGuideStepItem {
  id: string;
  title: string;
  shortDesc: string;
}

export const FIELD_GUIDE_STEPS: readonly FieldGuideStepItem[] = [
  { id: "location", title: "Define workspace", shortDesc: "Farm location & NASA grid" },
  { id: "land_area", title: "Land area", shortDesc: "Holding size & units" },
  { id: "soil", title: "Soil type", shortDesc: "Soil characteristics" },
  { id: "irrigation", title: "Irrigation", shortDesc: "Water sources" },
  { id: "current_crops", title: "Current crops", shortDesc: "Crops grown on your farm" },
  { id: "goals", title: "Farming goals", shortDesc: "Priorities to improve" },
  { id: "review", title: "Review farm details", shortDesc: "Summary & verification" },
] as const;

export interface AuditedFarmerProfileResult {
  backendProfile: FarmerProfile;
  farmerReported: {
    location: Location | null;
    locationStatus: FieldStatus;
    isDemonstrationLocation: boolean;
    landAreaHectares: number | null;
    landAreaAcres: number | null;
    landAreaStatus: FieldStatus;
    soilTexture: SoilTextureType | null;
    soilStatus: FieldStatus;
    irrigationSource: IrrigationSourceType | null;
    irrigationStatus: FieldStatus;
    currentCrops: string[];
    cropsStatus: FieldStatus;
    farmingGoals: FarmingGoal[];
    goalsStatus: FieldStatus;
  };
  regionalEstimatesApplied: {
    location?: { estimate: Location; reason: string };
    landAreaAcres?: { estimate: number; reason: string };
    landAreaHectares?: { estimate: number; reason: string };
    soilTexture?: { estimate: SoilTextureType; reason: string };
    irrigationSource?: { estimate: IrrigationSourceType; reason: string };
  };
}

export const REGIONAL_FALLBACK_ESTIMATES = {
  landAreaAcres: 5.0,
  landAreaReason:
    "Punjab average operational holding size (~5.0 acres / 2.02 ha per Agricultural Census) used for preliminary rotation modeling only. Not recorded as farmer-confirmed data.",
  soilTexture: "loam" as SoilTextureType,
  soilReason:
    "Central Alluvial plain default (loam) applied for moisture balance calculation. Not recorded as farmer-confirmed data.",
  irrigationSource: "tubewell_deep" as IrrigationSourceType,
  irrigationReason:
    "Central Punjab deep submersible tubewell default applied for water supply calculation. Not recorded as farmer-confirmed data.",
};

export const ACRE_TO_HECTARES = 0.404685642;
export const KANAL_TO_ACRES = 0.125;
export const KACHA_BIGHA_TO_ACRES = 1 / 4.8; // ~0.208333 acres per Punjab traditional kacha bigha

/**
 * Converts any supported unit to standard metric Hectares.
 * Verified conversion factors:
 * - 1 acre = 0.404685642 hectares
 * - 1 statutory Punjab kanal = 0.125 acres = 0.05058570525 hectares
 * - 1 traditional Punjab kacha bigha = (1 / 4.8) acres ≈ 0.2083 acres = 0.08430950875 hectares
 * - 1 hectare = 1 hectare
 */
export function convertToHectares(val: number, unit: LandUnit): number {
  if (val <= 0 || isNaN(val)) return 0;
  let ha: number;
  switch (unit) {
    case "hectares":
      ha = val;
      break;
    case "acres":
      ha = val * ACRE_TO_HECTARES;
      break;
    case "kanals":
      ha = val * KANAL_TO_ACRES * ACRE_TO_HECTARES;
      break;
    case "bighas":
      ha = (val / 4.8) * ACRE_TO_HECTARES;
      break;
  }
  return Number(ha.toFixed(4));
}

/**
 * Converts any supported unit to standard Acres for UI display comparison
 */
export function convertToAcres(val: number, unit: LandUnit): number {
  switch (unit) {
    case "acres":
      return val;
    case "kanals":
      // Statutory Punjab standard: 8 Kanals = 1 Acre
      return Number((val / 8).toFixed(2));
    case "bighas":
      // Documented Traditional Punjab Kacha Bigha: 1 Acre ≈ 4.8 Bighas (1 Bigha ≈ 0.208 Acre)
      return Number((val / 4.8).toFixed(2));
    case "hectares":
      // International metric standard: 1 Hectare = 2.47105 Acres
      return Number((val * 2.47105).toFixed(2));
  }
}

function toNonKnownField<T>(status: FieldStatus): ProfileField<T> {
  if (status === "unknown") return { status: "unknown" };
  if (status === "skipped") return { status: "skipped" };
  return { status: "not_provided" };
}

/**
 * Audited mapping function:
 * Strictly audits state against src/types/index.ts contracts.
 * Preserves all four ProfileField statuses: "known" | "unknown" | "skipped" | "not_provided".
 * Never overwrites unknown or skipped values with regional defaults in backendProfile.
 * Strictly conforms to validateFarmerProfileInput schema.
 */
export function mapOnboardingToFarmerProfile(
  state: OnboardingState
): AuditedFarmerProfileResult {
  const regionalEstimates: AuditedFarmerProfileResult["regionalEstimatesApplied"] = {};
  const now = new Date().toISOString();

  // 1. Location Field
  let locationField: ProfileField<ProfileLocation>;
  if (state.locationStatus === "known" && state.location) {
    locationField = {
      status: "known",
      value: {
        latitude: state.location.latitude,
        longitude: state.location.longitude,
        district: state.location.district,
        state: state.location.state,
        countryCode: "IN",
        selectionMethod: state.isDemonstrationLocation ? "map" : "gps",
        isDemonstration: state.isDemonstrationLocation,
      },
      source: state.isDemonstrationLocation ? "imported" : "user",
      updatedAt: now,
    };
  } else {
    locationField = toNonKnownField<ProfileLocation>(state.locationStatus);
    regionalEstimates.location = {
      estimate: LUDHIANA_DEMO_LOCATION,
      reason:
        "Farmer did not provide custom coordinates; Ludhiana Demonstration Region (30.90° N, 75.85° E) used as prototype reference dataset for preview.",
    };
  }

  // 2. Land Area Field (Hectares)
  let landAreaField: ProfileField<number>;
  if (state.landAreaStatus === "known" && state.landArea !== null) {
    landAreaField = {
      status: "known",
      value: convertToHectares(state.landArea, state.landUnit),
      source: "user",
      updatedAt: now,
    };
  } else {
    landAreaField = toNonKnownField<number>(state.landAreaStatus);
    regionalEstimates.landAreaHectares = {
      estimate: convertToHectares(REGIONAL_FALLBACK_ESTIMATES.landAreaAcres, "acres"),
      reason: REGIONAL_FALLBACK_ESTIMATES.landAreaReason,
    };
    regionalEstimates.landAreaAcres = {
      estimate: REGIONAL_FALLBACK_ESTIMATES.landAreaAcres,
      reason: REGIONAL_FALLBACK_ESTIMATES.landAreaReason,
    };
  }

  // 3. Soil Texture Field
  let soilField: ProfileField<SoilTextureType>;
  if (state.soilStatus === "known" && state.soilTexture) {
    soilField = {
      status: "known",
      value: state.soilTexture,
      source: "user",
      updatedAt: now,
    };
  } else {
    soilField = toNonKnownField<SoilTextureType>(state.soilStatus);
    regionalEstimates.soilTexture = {
      estimate: REGIONAL_FALLBACK_ESTIMATES.soilTexture,
      reason: REGIONAL_FALLBACK_ESTIMATES.soilReason,
    };
  }

  // 4. Irrigation Available & Source Fields
  let irrigationAvailableField: ProfileField<boolean>;
  let irrigationSourceField: ProfileField<IrrigationSourceType>;
  if (state.irrigationStatus === "known" && state.irrigationSource) {
    const isAvailable = state.irrigationSource !== "rainfed_only";
    irrigationAvailableField = {
      status: "known",
      value: isAvailable,
      source: "user",
      updatedAt: now,
    };
    irrigationSourceField = {
      status: "known",
      value: state.irrigationSource,
      source: "user",
      updatedAt: now,
    };
  } else {
    irrigationAvailableField = toNonKnownField<boolean>(state.irrigationStatus);
    irrigationSourceField = toNonKnownField<IrrigationSourceType>(state.irrigationStatus);
    regionalEstimates.irrigationSource = {
      estimate: REGIONAL_FALLBACK_ESTIMATES.irrigationSource,
      reason: REGIONAL_FALLBACK_ESTIMATES.irrigationReason,
    };
  }

  // 5. Current Crops Field (using stable crop IDs)
  let cropsField: ProfileField<string[]>;
  if (state.cropsStatus === "known") {
    cropsField = {
      status: "known",
      value: state.currentCrops,
      source: "user",
      updatedAt: now,
    };
  } else {
    cropsField = toNonKnownField<string[]>(state.cropsStatus);
  }

  // 6. Farming Goals Field
  let goalsField: ProfileField<FarmingGoal[]>;
  if (state.goalsStatus === "known") {
    goalsField = {
      status: "known",
      value: state.farmingGoals,
      source: "user",
      updatedAt: now,
    };
  } else {
    goalsField = toNonKnownField<FarmingGoal[]>(state.goalsStatus);
  }

  const backendProfile: FarmerProfile = {
    profileId: "",
    location: locationField,
    landAreaHectares: landAreaField,
    soilTexture: soilField,
    irrigationAvailable: irrigationAvailableField,
    irrigationSource: irrigationSourceField,
    currentCrops: cropsField,
    farmingGoals: goalsField,
    createdAt: now,
    updatedAt: now,
  };

  return {
    backendProfile,
    farmerReported: {
      location: state.location,
      locationStatus: state.locationStatus,
      isDemonstrationLocation: state.isDemonstrationLocation,
      landAreaHectares:
        state.landArea !== null
          ? convertToHectares(state.landArea, state.landUnit)
          : null,
      landAreaAcres:
        state.landArea !== null
          ? convertToAcres(state.landArea, state.landUnit)
          : null,
      landAreaStatus: state.landAreaStatus,
      soilTexture: state.soilTexture,
      soilStatus: state.soilStatus,
      irrigationSource: state.irrigationSource,
      irrigationStatus: state.irrigationStatus,
      currentCrops: state.currentCrops,
      cropsStatus: state.cropsStatus,
      farmingGoals: state.farmingGoals,
      goalsStatus: state.goalsStatus,
    },
    regionalEstimatesApplied: regionalEstimates,
  };
}

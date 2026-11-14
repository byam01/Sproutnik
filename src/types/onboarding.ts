import {
  Location,
  SoilTextureType,
  IrrigationSourceType,
  FarmerProfile,
} from "@/types";

/**
 * All 4 canonical field statuses required for scientific integrity:
 * - not_provided: Untouched / question not yet presented or answered
 * - known: Farmer provided an explicit confirmed answer
 * - unknown: Farmer explicitly declared they do not know (e.g. untested soil)
 * - skipped: Farmer deliberately chose to skip the question
 */
export type FieldStatus = "known" | "unknown" | "skipped" | "not_provided";

export type OnboardingMode = "welcome" | "field-guide" | "conversation";

/**
 * Regional Punjab land units:
 * - acres: Standard English acre (1 Acre = 43,560 sq ft / 1 Killa)
 * - kanals: Official Punjab statutory revenue unit (1 Acre = exactly 8 Kanals)
 * - bighas: Traditional Punjab Kacha Bigha (1 Acre ≈ 4.8 Bighas / 1 Bigha ≈ 0.208 Acre)
 * - hectares: Metric hectare (1 Hectare = 2.471 Acres)
 */
export type LandUnit = "acres" | "kanals" | "bighas" | "hectares";

export type FarmingGoal =
  | "water_saving"
  | "soil_health"
  | "climate_resilience"
  | "less_labor"
  | "crop_rotation_diversity"
  | "income_boost";

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
    description: "High-intensity tubewell irrigated plain zone",
    isDemo: false,
  },
  {
    id: "jalandhar_doaba",
    name: "Jalandhar Doaba Zone",
    district: "Jalandhar",
    state: "Punjab",
    coordinates: { lat: 31.33, lon: 75.58 },
    elevationMeters: 228,
    description: "Potato–Maize–Wheat diversified alluvial belt",
    isDemo: false,
  },
  {
    id: "patiala_east",
    name: "Patiala Eastern Border Zone",
    district: "Patiala",
    state: "Punjab",
    coordinates: { lat: 30.34, lon: 76.38 },
    elevationMeters: 250,
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
    id: "rice_paddy",
    name: "Rice (Paddy)",
    localName: "ਝੋਨਾ / धान (Jhona)",
    scientificName: "Oryza sativa",
    season: "kharif",
    seasonLabel: "Kharif (Monsoon)",
    category: "cereal",
    description: "Dominant wetland monsoon crop with high groundwater demand.",
  },
  {
    id: "wheat",
    name: "Wheat",
    localName: "ਕਣਕ / गेहूं (Kanak)",
    scientificName: "Triticum aestivum",
    season: "rabi",
    seasonLabel: "Rabi (Winter)",
    category: "cereal",
    description: "Primary winter food grain; sensitive to terminal March heat stress.",
  },
  {
    id: "summer_moong",
    name: "Summer Moong (Green Gram)",
    localName: "ਮੂੰਗੀ / मूँग (Moongi)",
    scientificName: "Vigna radiata",
    season: "zaid",
    seasonLabel: "Zaid (Summer 60-day catch crop)",
    category: "pulse",
    description: "Short-duration legume that enriches soil nitrogen between wheat and rice.",
  },
  {
    id: "maize",
    name: "Maize (Corn)",
    localName: "ਮੱਕੀ / मक्का (Makki)",
    scientificName: "Zea mays",
    season: "kharif",
    seasonLabel: "Kharif (Monsoon / Spring)",
    category: "cereal",
    description: "High-yield, water-efficient alternative to puddled paddy.",
  },
  {
    id: "basmati",
    name: "Basmati Rice (DSR / Traditional)",
    localName: "ਬਾਸਮਤੀ (Basmati)",
    scientificName: "Oryza sativa var.",
    season: "kharif",
    seasonLabel: "Kharif (Late Monsoon)",
    category: "cereal",
    description: "Aromatic premium rice; Direct Seeded Rice (DSR) saves ~25-30% water.",
  },
  {
    id: "mustard",
    name: "Mustard / Raya",
    localName: "ਸਰ੍ਹੋਂ / राया (Sarson)",
    scientificName: "Brassica juncea",
    season: "rabi",
    seasonLabel: "Rabi (Winter)",
    category: "oilseed",
    description: "Low water consumption winter oilseed with high market value.",
  },
  {
    id: "cotton",
    name: "Cotton",
    localName: "ਨਰਮਾ / कपास (Narma)",
    scientificName: "Gossypium hirsutum",
    season: "kharif",
    seasonLabel: "Kharif (South-West Belt)",
    category: "fiber",
    description: "Major commercial fiber crop suited to semi-arid southwestern districts.",
  },
  {
    id: "potato",
    name: "Potato",
    localName: "ਆਲੂ / आलू (Aloo)",
    scientificName: "Solanum tuberosum",
    season: "rabi",
    seasonLabel: "Autumn / Rabi (Central Belt)",
    category: "cash",
    description: "Short duration cash crop grown in Doaba and central Punjab.",
  },
  {
    id: "sugarcane",
    name: "Sugarcane",
    localName: "ਕਮਾਦ / गन्ना (Kamad)",
    scientificName: "Saccharum officinarum",
    season: "year_round",
    seasonLabel: "Annual (Year-round)",
    category: "cash",
    description: "Long-duration perennial cash crop requiring steady irrigation.",
  },
  {
    id: "chickpea",
    name: "Gram / Chickpea",
    localName: "ਛੋਲੇ / चना (Chana)",
    scientificName: "Cicer arietinum",
    season: "rabi",
    seasonLabel: "Rabi (Winter pulse)",
    category: "pulse",
    description: "Drought-hardy legume with minimal water requirements.",
  },
];

/**
 * Transparent regional baseline fallbacks (used ONLY for model simulation when farmer data is missing)
 */
export const REGIONAL_FALLBACK_ESTIMATES = {
  soilTexture: "loam" as SoilTextureType,
  soilReason:
    "Central Plain Zone (Ludhiana) regional baseline loam applied for climate simulation; farmer marked soil as untested/unspecified.",
  irrigationSource: "tubewell_deep" as IrrigationSourceType,
  irrigationReason:
    "Ludhiana district average (>85% tubewell extraction) applied for climate simulation; farmer marked irrigation as unspecified.",
  landAreaAcres: 5,
  landAreaReason: "Punjab average operational land holding (~5 acres / 2 hectares) applied.",
};

export interface OnboardingState {
  // Mode selection
  mode: OnboardingMode;

  // Step 1: Location
  location: Location | null;
  locationStatus: FieldStatus;
  isDemonstrationLocation: boolean; // Explicit flag: true if using Ludhiana demo reference

  // Step 2: Land Area
  landArea: number | null;
  landUnit: LandUnit;
  landAreaStatus: FieldStatus;

  // Step 3: Soil Information
  soilTexture: SoilTextureType | null;
  soilStatus: FieldStatus;

  // Step 4: Irrigation Source
  irrigationSource: IrrigationSourceType | null;
  irrigationStatus: FieldStatus;

  // Step 5: Current Crops
  currentCrops: string[];
  cropsStatus: FieldStatus;

  // Step 6: Farming Goals
  farmingGoals: FarmingGoal[];
  goalsStatus: FieldStatus;

  // Active step index (0: Location, 1: Land, 2: Soil, 3: Irrigation, 4: Crops, 5: Goals, 6: Review)
  currentStepIndex: number;
}

export const INITIAL_ONBOARDING_STATE: OnboardingState = {
  mode: "welcome",
  location: null, // Starts as null; NOT silently assumed to be Ludhiana!
  locationStatus: "not_provided",
  isDemonstrationLocation: false,
  landArea: 5,
  landUnit: "acres",
  landAreaStatus: "not_provided",
  soilTexture: null,
  soilStatus: "not_provided",
  irrigationSource: null,
  irrigationStatus: "not_provided",
  currentCrops: ["Rice (Paddy)", "Wheat"],
  cropsStatus: "not_provided",
  farmingGoals: ["water_saving", "soil_health"],
  goalsStatus: "not_provided",
  currentStepIndex: 0,
};

export const FIELD_GUIDE_STEPS = [
  { id: "location", title: "Define workspace", shortDesc: "Farm location & NASA grid" },
  { id: "land_area", title: "Land area", shortDesc: "Holding size & units" },
  { id: "soil", title: "Soil type", shortDesc: "Soil characteristics" },
  { id: "irrigation", title: "Irrigation", shortDesc: "Water sources" },
  { id: "current_crops", title: "Current crops", shortDesc: "Crops grown on your farm" },
  { id: "goals", title: "Farming goals", shortDesc: "Priorities to improve" },
  { id: "review", title: "Review farm details", shortDesc: "Summary & verification" },
] as const;

/**
 * Audited result that strictly separates raw farmer answers from regional estimates
 */
export interface AuditedFarmerProfileResult {
  // Compliant with FarmerProfile in src/types/index.ts for backend calculation
  backendProfile: FarmerProfile;

  // Exact raw farmer-reported responses without any alteration or overwriting
  farmerReported: {
    location: Location | null;
    locationStatus: FieldStatus;
    isDemonstrationLocation: boolean;
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

  // Explicitly labelled regional estimates applied for model evaluation
  regionalEstimatesApplied: {
    location?: { estimate: Location; reason: string };
    soilTexture?: { estimate: SoilTextureType; reason: string };
    irrigationSource?: { estimate: IrrigationSourceType; reason: string };
    landAreaAcres?: { estimate: number; reason: string };
  };
}

/**
 * Converts any supported unit to standard Acres
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

/**
 * Audited mapping function:
 * Strictly audits state against src/types/index.ts contracts without silently overwriting unknown/skipped statuses.
 */
export function mapOnboardingToFarmerProfile(
  state: OnboardingState
): AuditedFarmerProfileResult {
  const regionalEstimates: AuditedFarmerProfileResult["regionalEstimatesApplied"] = {};

  // 1. Location
  let effectiveLocation: Location;
  if (state.location && state.locationStatus === "known") {
    effectiveLocation = state.location;
  } else {
    effectiveLocation = LUDHIANA_DEMO_LOCATION;
    regionalEstimates.location = {
      estimate: LUDHIANA_DEMO_LOCATION,
      reason:
        "Farmer did not provide custom coordinates; Ludhiana Demonstration Region (30.90° N, 75.85° E) used as prototype reference dataset.",
    };
  }

  // 2. Land Area
  let effectiveAcres: number | undefined;
  if (state.landArea !== null && state.landAreaStatus === "known") {
    effectiveAcres = convertToAcres(state.landArea, state.landUnit);
  } else {
    effectiveAcres = REGIONAL_FALLBACK_ESTIMATES.landAreaAcres;
    regionalEstimates.landAreaAcres = {
      estimate: REGIONAL_FALLBACK_ESTIMATES.landAreaAcres,
      reason: REGIONAL_FALLBACK_ESTIMATES.landAreaReason,
    };
  }

  // 3. Soil Texture
  let effectiveSoil: SoilTextureType;
  if (state.soilTexture && state.soilStatus === "known") {
    effectiveSoil = state.soilTexture;
  } else {
    effectiveSoil = REGIONAL_FALLBACK_ESTIMATES.soilTexture;
    regionalEstimates.soilTexture = {
      estimate: REGIONAL_FALLBACK_ESTIMATES.soilTexture,
      reason: REGIONAL_FALLBACK_ESTIMATES.soilReason,
    };
  }

  // 4. Irrigation Source
  let effectiveIrrigation: IrrigationSourceType;
  if (state.irrigationSource && state.irrigationStatus === "known") {
    effectiveIrrigation = state.irrigationSource;
  } else {
    effectiveIrrigation = REGIONAL_FALLBACK_ESTIMATES.irrigationSource;
    regionalEstimates.irrigationSource = {
      estimate: REGIONAL_FALLBACK_ESTIMATES.irrigationSource,
      reason: REGIONAL_FALLBACK_ESTIMATES.irrigationReason,
    };
  }

  const backendProfile: FarmerProfile = {
    location: effectiveLocation,
    landAreaAcres: effectiveAcres,
    soilTexture: effectiveSoil,
    irrigationSource: effectiveIrrigation,
    groundwaterDepthMeters:
      effectiveIrrigation === "tubewell_deep" ? 45 : null,
    riskTolerance: state.farmingGoals.includes("income_boost")
      ? "moderate"
      : "conservative",
  };

  return {
    backendProfile,
    farmerReported: {
      location: state.location,
      locationStatus: state.locationStatus,
      isDemonstrationLocation: state.isDemonstrationLocation,
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

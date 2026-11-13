/**
 * Rotation Compass — Shared Domain Models & Contracts
 * NASA Space Apps Challenge 2026
 * 
 * Demonstrating transparent, climate-aware crop rotation planning
 * for Ludhiana district, Punjab, India.
 */

// ==========================================
// 1. Geographic & Location Contracts
// ==========================================

export interface Location {
  latitude: number;
  longitude: number;
  name?: string;
  district?: string;
  state?: string;
  country?: string;
  elevationMeters?: number;
}

// ==========================================
// 2. NASA Climate & Environmental Contracts
// ==========================================

export interface ClimatePeriod {
  startYear: number;
  endYear: number;
}

/**
 * Normalized daily climate record from NASA POWER.
 * Units:
 * - precipitationMm: mm/day (PRECTOTCORR)
 * - tempMeanC: °C (T2M)
 * - tempMaxC: °C (T2M_MAX)
 */
export interface DailyClimateRecord {
  date: string; // YYYY-MM-DD
  year: number;
  month: number; // 1 - 12
  day: number; // 1 - 31
  precipitationMm: number | null;
  tempMeanC: number | null;
  tempMaxC: number | null;
}

export type PunjabSeason = "winter" | "summer" | "monsoon";

export interface SeasonalRainfall {
  /** Winter: Nov, Dec, Jan, Feb */
  winterMm: number;
  /** Summer: Mar, Apr, May */
  summerMm: number;
  /** Monsoon: Jun, Jul, Aug, Sep */
  monsoonMm: number;
  /** October post-monsoon transitional window (mm) */
  postMonsoonMm: number;
}

export interface ClimateIndicators {
  period: ClimatePeriod;
  location: Location;
  
  /** Mean annual rainfall across complete years (mm/year) */
  meanAnnualRainfallMm: number;
  
  /** Annual rainfall values per year (for trend/distribution display) */
  annualRainfallByYear: Record<number, number>;
  
  /** Seasonal rainfall breakdown (mean mm per season across years) */
  seasonalRainfallMm: SeasonalRainfall;
  
  /** Mean annual temperature (°C) */
  meanTemperatureC: number;
  
  /** Mean annual maximum temperature (°C) */
  meanMaxTemperatureC: number;
  
  /** Mean maximum temperature by month (1=Jan .. 12=Dec) */
  monthlyMeanMaxTempC: Record<number, number>;
  
  /** Monthly precipitation totals mean (1=Jan .. 12=Dec) */
  monthlyMeanPrecipitationMm: Record<number, number>;

  /**
   * Interannual rainfall variability:
   * Coefficient of Variation (CV = (Standard Deviation / Mean) * 100)%
   * Calculated across complete calendar years.
   */
  rainfallVariabilityCvPercent: number;
  
  /**
   * Historical dry-season frequency:
   * Proportion of years where dry-season rainfall (Nov-May) was below 25th percentile or historical threshold.
   * Documented as a transparent prototype indicator.
   */
  drySeasonDeficitFrequencyPercent: number;

  /** Data quality and completeness metadata */
  quality: DataQuality;
}

export interface DataQuality {
  totalExpectedDays: number;
  totalReceivedDays: number;
  
  /** Percentage completeness for precipitation (0 - 100%) */
  precipitationCompletenessPercent: number;
  
  /** Percentage completeness for temperature (0 - 100%) */
  temperatureCompletenessPercent: number;
  
  /** Count of missing days detected in the time series */
  missingDateCount: number;
  
  /** Flag indicating whether any missing dates were detected */
  hasMissingDates: boolean;
  
  /** Years excluded from annual metrics due to completeness < provisional threshold (e.g. 90%) */
  excludedYears: number[];
  
  /** Transparent scientific disclosure */
  notes: string[];
}

// ==========================================
// 3. Agronomic Knowledge Base Contracts
// ==========================================

export type SeasonType = "kharif" | "rabi" | "zaid" | "year_round";

export type WaterDemandCategory = "very_high" | "high" | "moderate" | "low";

export interface EvidenceReference {
  id: string;
  source: string;
  title: string;
  year?: number;
  url?: string;
  isProvisional: boolean;
  notes?: string;
}

export interface CropMetadata {
  id: string;
  name: string;
  scientificName?: string;
  season: SeasonType;
  sowingWindowStart: string; // e.g. "06-15" (MM-DD)
  sowingWindowEnd: string;   // e.g. "07-15"
  harvestWindowStart: string; // e.g. "10-15"
  harvestWindowEnd: string;   // e.g. "11-15"
  durationDaysMin: number;
  durationDaysMax: number;
  
  waterDemandCategory: WaterDemandCategory;
  estimatedIrrigationRequirementsMm?: number | null; // e.g., ~1500-2000 mm for rice in Punjab
  soilSuitability: string[];
  salinityTolerance: "sensitive" | "moderately_sensitive" | "tolerant";
  
  precedingCropCompatibility: string[]; // crop IDs that can precede this
  benefits: string[]; // e.g. "atmospheric nitrogen fixation", "breaks weed cycles"
  limitations: string[]; // e.g. "high groundwater depletion", "stubble burning window"
  
  evidence: EvidenceReference[];
  unknownAttributes: string[];
}

export interface RotationDefinition {
  id: string;
  name: string;
  crops: CropMetadata[];
  cropSequence: string[]; // crop IDs in order
  turnaroundDays: number[]; // days between harvest of crop i and sowing of crop i+1
  description: string;
  evidence: EvidenceReference[];
}

// ==========================================
// 4. Farmer Profile & Context Contracts
// ==========================================

export type SoilTextureType = "clay_loam" | "sandy_loam" | "loam" | "silt_loam" | "sandy";

export type IrrigationSourceType = "tubewell_deep" | "tubewell_shallow" | "canal" | "rainfed_only" | "conjunctive";

export interface FarmerProfile {
  location: Location;
  landAreaAcres?: number;
  soilTexture: SoilTextureType;
  irrigationSource: IrrigationSourceType;
  groundwaterDepthMeters?: number | null;
  experienceWithDirectSeededRice?: boolean;
  riskTolerance?: "conservative" | "moderate" | "experimental";
}

// ==========================================
// 5. Rotation Feasibility & Comparison Contracts
// ==========================================

export interface FeasibilityCheckCriterion {
  code: string;
  name: string;
  passed: boolean;
  explanation: string;
  evidenceRefId?: string;
}

export interface RotationFeasibilityResult {
  rotationId: string;
  rotationName: string;
  isFeasible: boolean;
  rejectionReasons: string[];
  criteria: FeasibilityCheckCriterion[];
  warnings: string[];
}

export interface AssessmentTradeoff {
  dimension: "climate_compatibility" | "water_exposure" | "diversity" | "soil_health" | "turnaround_feasibility";
  scoreLabel: "favorable" | "moderate" | "unfavorable" | "caution";
  summary: string;
  advantages: string[];
  disadvantages: string[];
  provisionalWeight?: number; // transparently disclosed product choice
}

export interface RotationComparisonResult {
  rotationId: string;
  rotationName: string;
  isBaseline: boolean;
  feasibility: RotationFeasibilityResult;
  tradeoffs: AssessmentTradeoff[];
  waterDemandTotalCategory: WaterDemandCategory;
  groundwaterPressureIndex: "critical" | "high" | "moderate" | "low";
  diversificationBenefits: string[];
  keyRisks: string[];
  evidence: EvidenceReference[];
  unknowns: string[];
}

// ==========================================
// 6. SeasonShift Scenario Engine Contracts
// ==========================================

export interface ScenarioInput {
  name: string;
  /** Percentage decrease in rainfall (e.g. 15 for -15%) */
  rainfallReductionPercent?: number;
  /** Temperature increase in °C (e.g. 1.5 for +1.5°C) */
  temperatureIncreaseC?: number;
  /** Focus season for rainfall changes, or "all" */
  targetSeason?: PunjabSeason | "all";
}

export interface ScenarioImpactOnRotation {
  rotationId: string;
  rotationName: string;
  vulnerabilityLevel: "very_high" | "high" | "moderate" | "resilient";
  irrigationDeficitPressure: string;
  heatStressRisk: string;
  notes: string[];
}

export interface ScenarioOutput {
  scenario: ScenarioInput;
  baselineClimate: {
    meanAnnualRainfallMm: number;
    seasonalRainfallMm: SeasonalRainfall;
    meanTemperatureC: number;
    meanMaxTemperatureC: number;
  };
  scenarioClimate: {
    meanAnnualRainfallMm: number;
    seasonalRainfallMm: SeasonalRainfall;
    meanTemperatureC: number;
    meanMaxTemperatureC: number;
  };
  climateDeltas: {
    annualRainfallDeltaMm: number;
    annualRainfallDeltaPercent: number;
    temperatureDeltaC: number;
  };
  rotationImpacts: ScenarioImpactOnRotation[];
  scientificDisclaimer: string;
}

// ==========================================
// 7. Standard API Response & Error Contracts
// ==========================================

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    dataSource: string;
    processingTimestamp: string;
    version: string;
  };
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorDetail;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;


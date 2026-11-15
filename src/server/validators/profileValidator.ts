/**
 * Runtime Validation Engine for Farmer Profile & Onboarding Contracts
 *
 * Implements pure, zero-dependency validation for canonical FarmerProfile entities,
 * ProfileField tri-state / multi-state envelopes, and domain-specific attributes.
 *
 * VALIDATION RULES:
 * 1. ProfileField Structure:
 *    - Status must be one of: "known" | "unknown" | "skipped" | "not_provided".
 *    - "known" MUST contain a valid, non-null, non-undefined `value` matching its field schema.
 *    - "unknown", "skipped", "not_provided" MUST NOT contain a `value`.
 *    - `source`, if provided, must be one of: "user" | "imported" | "verified".
 *    - `updatedAt`, if provided, must be a valid ISO 8601 date string.
 * 2. landAreaHectares: When known, must be a strictly positive (> 0) finite number.
 * 3. SoilTextureType: Must be one of the 5 canonical Punjab soil textures.
 * 4. IrrigationSourceType: Must be one of the 5 canonical irrigation sources.
 * 5. Current Crops: Array of crop IDs, each strictly verified against CROPS_PUNJAB.
 * 6. Farming Goals: Array of goal IDs, each strictly verified against FARMING_GOALS.
 * 7. ProfileLocation: Country code and selection method mandatory; coordinates within valid ranges if provided.
 * 8. Never silently default: Malformed or missing fields trigger explicit validation errors.
 */

import {
  FARMING_GOALS,
  FarmingGoal,
  IrrigationSourceType,
  ProfileFieldSource,
  ProfileFieldStatus,
  ProfileLocation,
  SoilTextureType,
} from "@/types";
import { CROPS_PUNJAB } from "@/agronomy/crops";

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

const VALID_STATUSES: Set<ProfileFieldStatus> = new Set([
  "known",
  "unknown",
  "skipped",
  "not_provided",
]);

const VALID_SOURCES: Set<ProfileFieldSource> = new Set(["user", "imported", "verified"]);

const VALID_SOIL_TEXTURES: Set<SoilTextureType> = new Set([
  "clay_loam",
  "sandy_loam",
  "loam",
  "silt_loam",
  "sandy",
]);

const VALID_IRRIGATION_SOURCES: Set<IrrigationSourceType> = new Set([
  "tubewell_deep",
  "tubewell_shallow",
  "canal",
  "rainfed_only",
  "conjunctive",
]);

const VALID_FARMING_GOALS: Set<FarmingGoal> = new Set(FARMING_GOALS);

const VALID_SELECTION_METHODS = new Set(["gps", "map", "manual"]);

/**
 * Validates whether a string is a valid ISO 8601 date representation.
 */
function isValidIsoDate(str: string): boolean {
  if (typeof str !== "string" || str.trim() === "") return false;
  const timestamp = Date.parse(str);
  return !isNaN(timestamp);
}

// ==========================================
// Input Normalization Helpers
// ==========================================

/**
 * Normalizes user/client soil texture strings into canonical SoilTextureType or original string.
 * Supports hyphens, spaces, uppercase, and common aliases (e.g. "sandy-loam", "Sandy Loam" -> "sandy_loam").
 */
export function normalizeSoilTexture(val: unknown): string {
  if (typeof val !== "string") return val as string;
  const s = val.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (s === "sand") return "sandy";
  if (s === "sandyloam") return "sandy_loam";
  if (s === "clayloam") return "clay_loam";
  if (s === "siltloam") return "silt_loam";
  return s;
}

/**
 * Normalizes user/client irrigation source strings into canonical IrrigationSourceType or original string.
 * Handles inverted naming and common aliases (e.g. "deep_tubewell" -> "tubewell_deep", "canal_water" -> "canal").
 */
export function normalizeIrrigationSource(val: unknown): string {
  if (typeof val !== "string") return val as string;
  const s = val.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (s === "deep_tubewell" || s === "deep_borewell" || s === "tubewell_deep" || s === "borewell_deep") {
    return "tubewell_deep";
  }
  if (s === "shallow_tubewell" || s === "shallow_borewell" || s === "tubewell_shallow" || s === "borewell_shallow") {
    return "tubewell_shallow";
  }
  if (s === "canal" || s === "canal_water") {
    return "canal";
  }
  if (s === "rainfed" || s === "rain_fed" || s === "rainfed_only" || s === "rain") {
    return "rainfed_only";
  }
  if (
    s === "conjunctive" ||
    (s.includes("canal") && (s.includes("tubewell") || s.includes("borewell"))) ||
    s === "both" ||
    s === "mixed"
  ) {
    return "conjunctive";
  }
  return s;
}

/**
 * Coerces valid numeric strings to finite positive numbers for landAreaHectares.
 */
export function normalizeLandArea(val: unknown): number | unknown {
  if (typeof val === "number") return val;
  if (typeof val === "string" && val.trim() !== "") {
    const parsed = Number(val.trim());
    if (Number.isFinite(parsed) && !isNaN(parsed)) {
      return parsed;
    }
  }
  return val;
}

/**
 * Coerces string booleans ("true", "false", "yes", "no", "1", "0") to booleans.
 */
export function normalizeBoolean(val: unknown): boolean | unknown {
  if (typeof val === "boolean") return val;
  if (typeof val === "string") {
    const s = val.trim().toLowerCase();
    if (s === "true" || s === "yes" || s === "1") return true;
    if (s === "false" || s === "no" || s === "0") return false;
  }
  return val;
}

/**
 * Normalizes location object fields (countryCode casing, coordinate string coercion).
 */
export function normalizeProfileLocation(val: unknown): unknown {
  if (!val || typeof val !== "object" || Array.isArray(val)) return val;
  const loc = { ...(val as Record<string, unknown>) };
  if (typeof loc.countryCode === "string") {
    loc.countryCode = loc.countryCode.trim().toUpperCase();
  }
  if (typeof loc.selectionMethod === "string") {
    loc.selectionMethod = loc.selectionMethod.trim().toLowerCase();
  }
  if (typeof loc.latitude === "string" && (loc.latitude as string).trim() !== "") {
    const parsed = Number((loc.latitude as string).trim());
    if (Number.isFinite(parsed) && !isNaN(parsed)) {
      loc.latitude = parsed;
    }
  }
  if (typeof loc.longitude === "string" && (loc.longitude as string).trim() !== "") {
    const parsed = Number((loc.longitude as string).trim());
    if (Number.isFinite(parsed) && !isNaN(parsed)) {
      loc.longitude = parsed;
    }
  }
  return loc;
}

/**
 * Normalizes all known ProfileFields in a FarmerProfile payload before validation and storage.
 */
export function normalizeFarmerProfilePayload(payload: Record<string, unknown>): Record<string, unknown> {
  const normalized = { ...payload };

  // Strip empty/null placeholder profileId if present
  if (normalized.profileId === "" || normalized.profileId === null) {
    delete normalized.profileId;
  }

  // Normalize location
  if (normalized.location && typeof normalized.location === "object" && !Array.isArray(normalized.location)) {
    const locField = normalized.location as Record<string, unknown>;
    if (locField.status === "known" && locField.value && typeof locField.value === "object") {
      normalized.location = {
        ...locField,
        value: normalizeProfileLocation(locField.value),
      };
    }
  }

  // Normalize landAreaHectares
  if (normalized.landAreaHectares && typeof normalized.landAreaHectares === "object" && !Array.isArray(normalized.landAreaHectares)) {
    const areaField = normalized.landAreaHectares as Record<string, unknown>;
    if (areaField.status === "known" && areaField.value !== undefined && areaField.value !== null) {
      normalized.landAreaHectares = {
        ...areaField,
        value: normalizeLandArea(areaField.value),
      };
    }
  }

  // Normalize soilTexture
  if (normalized.soilTexture && typeof normalized.soilTexture === "object" && !Array.isArray(normalized.soilTexture)) {
    const soilField = normalized.soilTexture as Record<string, unknown>;
    if (soilField.status === "known" && soilField.value !== undefined && soilField.value !== null) {
      normalized.soilTexture = {
        ...soilField,
        value: normalizeSoilTexture(soilField.value),
      };
    }
  }

  // Normalize irrigationAvailable
  if (normalized.irrigationAvailable && typeof normalized.irrigationAvailable === "object" && !Array.isArray(normalized.irrigationAvailable)) {
    const irrField = normalized.irrigationAvailable as Record<string, unknown>;
    if (irrField.status === "known" && irrField.value !== undefined && irrField.value !== null) {
      normalized.irrigationAvailable = {
        ...irrField,
        value: normalizeBoolean(irrField.value),
      };
    }
  }

  // Normalize irrigationSource
  if (normalized.irrigationSource && typeof normalized.irrigationSource === "object" && !Array.isArray(normalized.irrigationSource)) {
    const srcField = normalized.irrigationSource as Record<string, unknown>;
    if (srcField.status === "known" && srcField.value !== undefined && srcField.value !== null) {
      normalized.irrigationSource = {
        ...srcField,
        value: normalizeIrrigationSource(srcField.value),
      };
    }
  }

  return normalized;
}

/**
 * Generic validator for any ProfileField<T> structure.
 */
export function validateProfileField<T>(
  fieldPath: string,
  raw: unknown,
  valueValidator?: (val: unknown, path: string) => ValidationError[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return [
      {
        field: fieldPath,
        message: `Field "${fieldPath}" must be a ProfileField object with a valid status.`,
      },
    ];
  }

  const candidate = raw as Record<string, unknown>;

  // 1. Status validation
  if (!candidate.status || typeof candidate.status !== "string") {
    return [
      {
        field: `${fieldPath}.status`,
        message: `Field "${fieldPath}.status" is required and must be one of: known, unknown, skipped, not_provided.`,
      },
    ];
  }

  if (!VALID_STATUSES.has(candidate.status as ProfileFieldStatus)) {
    return [
      {
        field: `${fieldPath}.status`,
        message: `Invalid status "${candidate.status}". Expected: known, unknown, skipped, or not_provided.`,
      },
    ];
  }

  const status = candidate.status as ProfileFieldStatus;

  // 2. Status-specific invariants
  if (status === "known") {
    if (candidate.value === undefined || candidate.value === null) {
      errors.push({
        field: `${fieldPath}.value`,
        message: `Field "${fieldPath}" has status "known" but missing or null value.`,
      });
    } else if (valueValidator) {
      errors.push(...valueValidator(candidate.value, `${fieldPath}.value`));
    }

    // Optional provenance check
    if (candidate.source !== undefined) {
      if (typeof candidate.source !== "string" || !VALID_SOURCES.has(candidate.source as ProfileFieldSource)) {
        errors.push({
          field: `${fieldPath}.source`,
          message: `Invalid source "${candidate.source}". Expected: user, imported, or verified.`,
        });
      }
    }

    // Optional timestamp check
    if (candidate.updatedAt !== undefined) {
      if (typeof candidate.updatedAt !== "string" || !isValidIsoDate(candidate.updatedAt)) {
        errors.push({
          field: `${fieldPath}.updatedAt`,
          message: `Field "${fieldPath}.updatedAt" must be a valid ISO 8601 date string.`,
        });
      }
    }
  } else {
    // Non-known states ("unknown", "skipped", "not_provided") MUST NOT carry a value
    if (candidate.value !== undefined) {
      errors.push({
        field: `${fieldPath}.value`,
        message: `Field "${fieldPath}" has status "${status}" but contains a value. Non-known fields must not carry a value.`,
      });
    }
  }

  return errors;
}

/**
 * Validates landAreaHectares value when status is "known".
 */
export function validateLandAreaHectaresValue(val: unknown, path: string): ValidationError[] {
  if (typeof val !== "number" || !Number.isFinite(val) || isNaN(val)) {
    return [{ field: path, message: `Land area in hectares must be a finite number.` }];
  }
  if (val <= 0) {
    return [{ field: path, message: `Land area in hectares must be strictly positive (> 0). Received: ${val}` }];
  }
  return [];
}

/**
 * Validates soilTexture value when status is "known".
 */
export function validateSoilTextureValue(val: unknown, path: string): ValidationError[] {
  const norm = typeof val === "string" ? normalizeSoilTexture(val) : val;
  if (typeof norm !== "string" || !VALID_SOIL_TEXTURES.has(norm as SoilTextureType)) {
    return [
      {
        field: path,
        message: `Invalid soil texture "${val}". Supported: clay_loam, sandy_loam, loam, silt_loam, sandy.`,
      },
    ];
  }
  return [];
}

/**
 * Validates irrigationAvailable value when status is "known".
 */
export function validateIrrigationAvailableValue(val: unknown, path: string): ValidationError[] {
  if (typeof val !== "boolean") {
    return [{ field: path, message: `irrigationAvailable must be a boolean.` }];
  }
  return [];
}

/**
 * Validates irrigationSource value when status is "known".
 */
export function validateIrrigationSourceValue(val: unknown, path: string): ValidationError[] {
  const norm = typeof val === "string" ? normalizeIrrigationSource(val) : val;
  if (typeof norm !== "string" || !VALID_IRRIGATION_SOURCES.has(norm as IrrigationSourceType)) {
    return [
      {
        field: path,
        message: `Invalid irrigation source "${val}". Supported: tubewell_deep, tubewell_shallow, canal, rainfed_only, conjunctive.`,
      },
    ];
  }
  return [];
}

/**
 * Validates currentCrops value when status is "known".
 *
 * Contract Semantics:
 * - Must be an array of crop ID strings (ProfileField<string[]>).
 * - An empty array `[]` is explicitly permitted for the "known" state (e.g. fallow land,
 *   new landholder, or farmer currently cultivating no standing crops).
 * - When non-empty, every supplied crop ID must strictly match an authoritative
 *   entry in the CROPS_PUNJAB registry.
 * - Non-string elements or unrecognized crop IDs trigger explicit validation errors.
 */
export function validateCurrentCropsValue(val: unknown, path: string): ValidationError[] {
  if (!Array.isArray(val)) {
    return [{ field: path, message: `currentCrops must be an array of crop ID strings.` }];
  }

  const errors: ValidationError[] = [];
  for (let i = 0; i < val.length; i++) {
    const cropId = val[i];
    if (typeof cropId !== "string" || !CROPS_PUNJAB[cropId]) {
      errors.push({
        field: `${path}[${i}]`,
        message: `Unsupported or unknown crop ID "${cropId}". Must be an authoritative crop from the registry.`,
      });
    }
  }
  return errors;
}

/**
 * Validates farmingGoals value when status is "known".
 *
 * Contract Semantics:
 * - Must be an array of canonical FarmingGoal strings (ProfileField<FarmingGoal[]>).
 * - Enforces the 7 canonical goals from src/types/index.ts (FARMING_GOALS):
 *   1. "improve_yield"
 *   2. "reduce_water_usage"
 *   3. "improve_soil_health"
 *   4. "reduce_input_costs"
 *   5. "diversify_crops"
 *   6. "improve_income_stability"
 *   7. "manage_climate_risk"
 * - An empty array `[]` is permitted (e.g. no prioritized goals selected yet).
 * - Outdated or unapproved values (e.g. "maximize_profit", "minimize_water",
 *   "improve_soil", "reduce_risk", "get_rich_quick") are strictly rejected.
 */
export function validateFarmingGoalsValue(val: unknown, path: string): ValidationError[] {
  if (!Array.isArray(val)) {
    return [{ field: path, message: `farmingGoals must be an array of farming goal strings.` }];
  }

  const errors: ValidationError[] = [];
  for (let i = 0; i < val.length; i++) {
    const goal = val[i];
    if (typeof goal !== "string" || !VALID_FARMING_GOALS.has(goal as FarmingGoal)) {
      errors.push({
        field: `${path}[${i}]`,
        message: `Invalid farming goal "${goal}". Must be one of canonical goals: ${Array.from(VALID_FARMING_GOALS).join(", ")}.`,
      });
    }
  }
  return errors;
}

/**
 * Validates ProfileLocation value when status is "known".
 */
export function validateProfileLocationValue(val: unknown, path: string): ValidationError[] {
  if (!val || typeof val !== "object" || Array.isArray(val)) {
    return [{ field: path, message: `Location must be an object.` }];
  }

  const loc = val as Partial<ProfileLocation>;
  const errors: ValidationError[] = [];

  if (!loc.countryCode || typeof loc.countryCode !== "string" || loc.countryCode.trim().length === 0) {
    errors.push({ field: `${path}.countryCode`, message: `Country code is required (e.g. "IN").` });
  }

  if (
    !loc.selectionMethod ||
    typeof loc.selectionMethod !== "string" ||
    !VALID_SELECTION_METHODS.has(loc.selectionMethod)
  ) {
    errors.push({
      field: `${path}.selectionMethod`,
      message: `selectionMethod must be one of: gps, map, manual.`,
    });
  }

  if (loc.latitude !== undefined && loc.latitude !== null) {
    const lat = typeof loc.latitude === "string" ? Number((loc.latitude as string).trim()) : loc.latitude;
    if (typeof lat !== "number" || !Number.isFinite(lat) || lat < -90 || lat > 90) {
      errors.push({ field: `${path}.latitude`, message: `Latitude must be a finite number between -90 and 90.` });
    }
  }

  if (loc.longitude !== undefined && loc.longitude !== null) {
    const lon = typeof loc.longitude === "string" ? Number((loc.longitude as string).trim()) : loc.longitude;
    if (
      typeof lon !== "number" ||
      !Number.isFinite(lon) ||
      lon < -180 ||
      lon > 180
    ) {
      errors.push({ field: `${path}.longitude`, message: `Longitude must be a finite number between -180 and 180.` });
    }
  }

  return errors;
}

/**
 * Validates a complete FarmerProfile input payload for creation (POST).
 */
export function validateFarmerProfileInput(input: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {
      isValid: false,
      errors: [{ field: "root", message: "FarmerProfile payload must be a non-null object." }],
    };
  }

  const p = input as Record<string, unknown>;

  // If profileId is supplied in body, validate non-empty string format (empty/null allowed as unassigned placeholder)
  if (p.profileId !== undefined && p.profileId !== null && p.profileId !== "") {
    if (typeof p.profileId !== "string" || p.profileId.trim() === "") {
      errors.push({ field: "profileId", message: "profileId, if provided, must be a non-empty string." });
    }
  }

  // Validate all mandatory ProfileField envelopes
  errors.push(...validateProfileField("location", p.location, validateProfileLocationValue));
  errors.push(...validateProfileField("landAreaHectares", p.landAreaHectares, validateLandAreaHectaresValue));
  errors.push(...validateProfileField("soilTexture", p.soilTexture, validateSoilTextureValue));
  errors.push(...validateProfileField("irrigationAvailable", p.irrigationAvailable, validateIrrigationAvailableValue));
  errors.push(...validateProfileField("irrigationSource", p.irrigationSource, validateIrrigationSourceValue));
  errors.push(...validateProfileField("currentCrops", p.currentCrops, validateCurrentCropsValue));
  errors.push(...validateProfileField("farmingGoals", p.farmingGoals, validateFarmingGoalsValue));

  // Reject deprecated or unauthorized legacy fields explicitly
  if ("landAreaAcres" in p) {
    errors.push({
      field: "landAreaAcres",
      message: `"landAreaAcres" is deprecated and prohibited in the canonical profile. Use "landAreaHectares".`,
    });
  }
  if ("groundwaterDepthMeters" in p) {
    errors.push({
      field: "groundwaterDepthMeters",
      message: `"groundwaterDepthMeters" is prohibited on FarmerProfile. It belongs to RotationFarmerContext.`,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a partial FarmerProfile update payload (PATCH).
 */
export function validateFarmerProfilePartialInput(input: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {
      isValid: false,
      errors: [{ field: "root", message: "Update payload must be a non-null object." }],
    };
  }

  const p = input as Record<string, unknown>;

  // Reject immutable fields when attempting to mutate
  if ("profileId" in p && p.profileId !== undefined && p.profileId !== null && p.profileId !== "") {
    errors.push({ field: "profileId", message: "profileId cannot be modified in an update." });
  }
  if ("createdAt" in p && p.createdAt !== undefined && p.createdAt !== null) {
    errors.push({ field: "createdAt", message: "createdAt cannot be modified in an update." });
  }

  // Reject legacy/unauthorized fields
  if ("landAreaAcres" in p) {
    errors.push({
      field: "landAreaAcres",
      message: `"landAreaAcres" is prohibited. Use "landAreaHectares".`,
    });
  }
  if ("groundwaterDepthMeters" in p) {
    errors.push({
      field: "groundwaterDepthMeters",
      message: `"groundwaterDepthMeters" is prohibited on FarmerProfile.`,
    });
  }

  // Validate only provided fields
  if (p.location !== undefined) {
    errors.push(...validateProfileField("location", p.location, validateProfileLocationValue));
  }
  if (p.landAreaHectares !== undefined) {
    errors.push(...validateProfileField("landAreaHectares", p.landAreaHectares, validateLandAreaHectaresValue));
  }
  if (p.soilTexture !== undefined) {
    errors.push(...validateProfileField("soilTexture", p.soilTexture, validateSoilTextureValue));
  }
  if (p.irrigationAvailable !== undefined) {
    errors.push(...validateProfileField("irrigationAvailable", p.irrigationAvailable, validateIrrigationAvailableValue));
  }
  if (p.irrigationSource !== undefined) {
    errors.push(...validateProfileField("irrigationSource", p.irrigationSource, validateIrrigationSourceValue));
  }
  if (p.currentCrops !== undefined) {
    errors.push(...validateProfileField("currentCrops", p.currentCrops, validateCurrentCropsValue));
  }
  if (p.farmingGoals !== undefined) {
    errors.push(...validateProfileField("farmingGoals", p.farmingGoals, validateFarmingGoalsValue));
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

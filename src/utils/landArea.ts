/**
 * Land Area Unit Conversion Utilities
 *
 * Provides standardized, high-precision conversion between regional agricultural
 * land measurement units used by Punjab farmers and the canonical backend unit (hectares).
 *
 * Mathematical & Regional Revenue Administration Assumptions:
 * 1. Metric:
 *    - 1 hectare = 10,000 m² = 1 hectare (exact).
 *    - 1 acre = 0.404685642 hectares (international acre, exact conversion constant).
 *
 * 2. Statutory Punjab Measurements (Punjab Land Revenue Act / Standard Revenue Administration):
 *    - 1 Karam = 5.5 feet (66 inches).
 *    - 1 Sarsahi = 1 Karam × 1 Karam = 30.25 sq ft.
 *    - 1 Marla = 9 Sarsahis = 272.25 sq ft.
 *    - 1 Statutory Punjab Kanal = 20 Marlas = 5,445 sq ft = 0.125 acres (1/8 acre).
 *    - 1 Standard Acre (Qila / Ghumaon) = 8 Kanals = 160 Marlas = 43,560 sq ft.
 *
 * 3. Traditional Punjab Kacha Bigha:
 *    - In traditional Punjab customary revenue practice, 1 Acre = 4 Bighas 16 Biswas = 4.8 Kacha Bighas.
 *    - Therefore, 1 Kacha Bigha = 1 / 4.8 acres ≈ 0.20833333333333334 acres (commonly rounded to ~0.2083 acres).
 *    - CAUTION: "Bigha" is a non-standardized customary unit across Northern India. In Haryana or
 *      Western UP, a bigha can range from 1/5 to 1/3 acre; this utility explicitly implements the
 *      traditional Central/Eastern Punjab revenue custom (4.8 Kacha Bighas per Acre).
 *
 * Canonical Backend Contract:
 * - Backend persistence and agronomic models strictly use `landAreaHectares` (number).
 * - Full floating-point precision is maintained internally; rounding is deferred to display time.
 */

export type SupportedLandAreaUnit =
  | "acres"
  | "acre"
  | "kanals"
  | "kanal"
  | "statutory_kanal"
  | "kacha_bighas"
  | "kacha_bigha"
  | "hectares"
  | "hectare"
  | "ha";

export type CanonicalLandAreaUnit = "acres" | "kanals" | "kacha_bighas" | "hectares";

/** Exact conversion factor: 1 acre = 0.404685642 hectares */
export const ACRE_TO_HECTARES = 0.404685642;

/** Statutory Punjab kanal: 1 kanal = 0.125 acres */
export const STATUTORY_KANAL_TO_ACRES = 0.125;

/** Statutory Punjab kanal directly to hectares */
export const STATUTORY_KANAL_TO_HECTARES = STATUTORY_KANAL_TO_ACRES * ACRE_TO_HECTARES; // 0.05058570525

/**
 * Traditional Punjab Kacha Bigha: 1 acre = 4.8 kacha bighas (1 / 4.8 acres per bigha ≈ 0.208333... acres).
 */
export const KACHA_BIGHA_PER_ACRE = 4.8;
export const KACHA_BIGHA_TO_ACRES = 1 / KACHA_BIGHA_PER_ACRE;

/** Traditional Punjab Kacha Bigha to hectares using 1/4.8 acre ratio */
export const KACHA_BIGHA_TO_HECTARES = KACHA_BIGHA_TO_ACRES * ACRE_TO_HECTARES; // ~0.08430950875

/** Nominal 4-decimal approximate factor: 0.2083 acres per kacha bigha */
export const KACHA_BIGHA_APPROX_ACRES = 0.2083;
export const KACHA_BIGHA_APPROX_TO_HECTARES = KACHA_BIGHA_APPROX_ACRES * ACRE_TO_HECTARES;

/**
 * Normalizes input unit strings to canonical internal keys.
 */
export function normalizeLandAreaUnit(unit: string): CanonicalLandAreaUnit {
  const normalized = unit.trim().toLowerCase();
  switch (normalized) {
    case "acre":
    case "acres":
      return "acres";
    case "kanal":
    case "kanals":
    case "statutory_kanal":
    case "statutory_kanals":
      return "kanals";
    case "kacha_bigha":
    case "kacha_bighas":
    case "bigha":
    case "bighas":
      return "kacha_bighas";
    case "ha":
    case "hectare":
    case "hectares":
      return "hectares";
    default:
      throw new TypeError(`Unsupported land area unit: "${unit}". Supported units: acres, kanals, kacha_bighas, hectares.`);
  }
}

export interface LandAreaValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates whether a value is a valid, positive, finite land area.
 */
export function validateLandAreaInput(value: unknown): LandAreaValidationResult {
  if (value === null || value === undefined) {
    return { isValid: false, error: "Land area value must not be null or undefined." };
  }
  if (typeof value !== "number") {
    return { isValid: false, error: `Land area must be a number, received ${typeof value}.` };
  }
  if (!Number.isFinite(value)) {
    return { isValid: false, error: "Land area must be a finite number." };
  }
  if (value < 0) {
    return { isValid: false, error: "Land area cannot be negative." };
  }
  return { isValid: true };
}

export interface ConvertOptions {
  /**
   * If true, uses the approximate 0.2083 factor for Kacha Bigha rather than
   * the exact Punjab revenue 1/4.8 ratio. Defaults to false.
   */
  useApproximateKachaBigha?: boolean;
}

/**
 * Converts a land area value from any supported unit into canonical hectares.
 *
 * @throws {TypeError | RangeError} If value or unit is invalid.
 */
export function convertLandAreaToHectares(
  value: number,
  fromUnit: SupportedLandAreaUnit | string,
  options?: ConvertOptions
): number {
  const validation = validateLandAreaInput(value);
  if (!validation.isValid) {
    throw new RangeError(validation.error);
  }

  const canonicalUnit = normalizeLandAreaUnit(fromUnit);

  switch (canonicalUnit) {
    case "hectares":
      return value;

    case "acres":
      return value * ACRE_TO_HECTARES;

    case "kanals":
      return value * STATUTORY_KANAL_TO_HECTARES;

    case "kacha_bighas":
      if (options?.useApproximateKachaBigha) {
        return value * KACHA_BIGHA_APPROX_TO_HECTARES;
      }
      return value * KACHA_BIGHA_TO_HECTARES;

    default: {
      const _exhaustiveCheck: never = canonicalUnit;
      return _exhaustiveCheck;
    }
  }
}

/**
 * Safe version of convertLandAreaToHectares that returns null on invalid inputs instead of throwing.
 */
export function tryConvertLandAreaToHectares(
  value: unknown,
  fromUnit: string,
  options?: ConvertOptions
): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null;
  }
  try {
    return convertLandAreaToHectares(value, fromUnit, options);
  } catch {
    return null;
  }
}

/**
 * Converts hectares back into a supported target unit for display.
 */
export function convertHectaresToTargetUnit(
  hectares: number,
  targetUnit: SupportedLandAreaUnit | string,
  options?: ConvertOptions
): number {
  const validation = validateLandAreaInput(hectares);
  if (!validation.isValid) {
    throw new RangeError(validation.error);
  }

  const canonicalUnit = normalizeLandAreaUnit(targetUnit);

  switch (canonicalUnit) {
    case "hectares":
      return hectares;

    case "acres":
      return hectares / ACRE_TO_HECTARES;

    case "kanals":
      return hectares / STATUTORY_KANAL_TO_HECTARES;

    case "kacha_bighas":
      if (options?.useApproximateKachaBigha) {
        return hectares / KACHA_BIGHA_APPROX_TO_HECTARES;
      }
      return hectares / KACHA_BIGHA_TO_HECTARES;

    default: {
      const _exhaustiveCheck: never = canonicalUnit;
      return _exhaustiveCheck;
    }
  }
}

/**
 * Formats a land area in hectares for user display with configurable decimal rounding.
 */
export function formatHectaresForDisplay(
  hectares: number,
  decimalPlaces = 2
): string {
  const validation = validateLandAreaInput(hectares);
  if (!validation.isValid) {
    return "0.00 ha";
  }
  return `${hectares.toFixed(decimalPlaces)} ha`;
}

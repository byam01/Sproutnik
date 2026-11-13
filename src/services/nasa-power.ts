import { DailyClimateRecord, Location } from "@/types";

/**
 * NASA POWER Daily Point API Client
 * Parameters:
 * - PRECTOTCORR: Precipitation Corrected (mm/day)
 * - T2M: Temperature at 2 Meters (°C)
 * - T2M_MAX: Maximum Temperature at 2 Meters (°C)
 */

export interface NasaPowerApiResponse {
  type: string;
  geometry?: {
    type: string;
    coordinates: number[];
  };
  properties?: {
    parameter?: {
      PRECTOTCORR?: Record<string, number>;
      T2M?: Record<string, number>;
      T2M_MAX?: Record<string, number>;
    };
  };
  header?: Record<string, unknown>;
  messages?: string[];
}

export interface FetchNasaClimateOptions {
  timeoutMs?: number;
  customFetch?: typeof fetch;
}

const NASA_MISSING_VALUE_THRESHOLD = -90; // NASA POWER standard fill value is -999 or -99

/**
 * Validates geographic coordinates
 */
export function validateCoordinates(lat: number, lon: number): void {
  if (typeof lat !== "number" || isNaN(lat) || lat < -90 || lat > 90) {
    throw new Error(`Invalid latitude: ${lat}. Must be between -90 and 90.`);
  }
  if (typeof lon !== "number" || isNaN(lon) || lon < -180 || lon > 180) {
    throw new Error(`Invalid longitude: ${lon}. Must be between -180 and 180.`);
  }
}

/**
 * Validates requested year range
 */
export function validateYearRange(startYear: number, endYear: number): void {
  const currentYear = new Date().getFullYear();
  if (!Number.isInteger(startYear) || startYear < 1981) {
    throw new Error(`Invalid startYear: ${startYear}. NASA POWER daily records begin in 1981.`);
  }
  if (!Number.isInteger(endYear) || endYear > currentYear + 1) {
    throw new Error(`Invalid endYear: ${endYear}. Must be <= ${currentYear + 1}.`);
  }
  if (startYear > endYear) {
    throw new Error(`startYear (${startYear}) cannot be greater than endYear (${endYear}).`);
  }
}

/**
 * Parses YYYYMMDD string to date components
 */
function parseDateKey(dateKey: string): { date: string; year: number; month: number; day: number } | null {
  if (!/^\d{8}$/.test(dateKey)) {
    return null;
  }
  const year = parseInt(dateKey.slice(0, 4), 10);
  const month = parseInt(dateKey.slice(4, 6), 10);
  const day = parseInt(dateKey.slice(6, 8), 10);

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  const mm = month < 10 ? `0${month}` : `${month}`;
  const dd = day < 10 ? `0${day}` : `${day}`;
  return {
    date: `${year}-${mm}-${dd}`,
    year,
    month,
    day,
  };
}

/**
 * Cleans a NASA parameter value:
 * Returns null if missing or fill value (< -90), preserves 0.0 and valid readings.
 */
export function cleanNasaValue(val: number | undefined | null): number | null {
  if (val === undefined || val === null || isNaN(val)) {
    return null;
  }
  if (val <= NASA_MISSING_VALUE_THRESHOLD) {
    return null;
  }
  return val;
}

/**
 * Fetches daily climate data from NASA POWER API
 */
export async function fetchNasaClimate(
  location: Location,
  startYear: number,
  endYear: number,
  options: FetchNasaClimateOptions = {}
): Promise<DailyClimateRecord[]> {
  validateCoordinates(location.latitude, location.longitude);
  validateYearRange(startYear, endYear);

  const { timeoutMs = 20000, customFetch = fetch } = options;

  const startFormatted = `${startYear}0101`;
  const endFormatted = `${endYear}1231`;

  const url = new URL("https://power.larc.nasa.gov/api/temporal/daily/point");
  url.searchParams.set("parameters", "PRECTOTCORR,T2M,T2M_MAX");
  url.searchParams.set("community", "AG");
  url.searchParams.set("longitude", location.longitude.toFixed(4));
  url.searchParams.set("latitude", location.latitude.toFixed(4));
  url.searchParams.set("start", startFormatted);
  url.searchParams.set("end", endFormatted);
  url.searchParams.set("format", "JSON");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await customFetch(url.toString(), {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`NASA POWER API request timed out after ${timeoutMs}ms.`);
    }
    throw new Error(`Network failure while requesting NASA POWER API: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    let errBody = "";
    try {
      errBody = await response.text();
    } catch {
      // ignore
    }
    throw new Error(`NASA POWER API returned HTTP ${response.status} ${response.statusText}: ${errBody.slice(0, 300)}`);
  }

  let data: NasaPowerApiResponse;
  try {
    data = (await response.json()) as NasaPowerApiResponse;
  } catch {
    throw new Error("Failed to parse JSON response from NASA POWER API.");
  }

  const parameters = data.properties?.parameter;
  if (!parameters) {
    throw new Error("Invalid response structure from NASA POWER API: missing 'properties.parameter'.");
  }

  const precipMap = parameters.PRECTOTCORR || {};
  const t2mMap = parameters.T2M || {};
  const t2mMaxMap = parameters.T2M_MAX || {};

  // Collect all unique date keys
  const dateKeys = new Set<string>([
    ...Object.keys(precipMap),
    ...Object.keys(t2mMap),
    ...Object.keys(t2mMaxMap),
  ]);

  const sortedKeys = Array.from(dateKeys).sort();

  const records: DailyClimateRecord[] = [];

  for (const dateKey of sortedKeys) {
    const parsed = parseDateKey(dateKey);
    if (!parsed) continue;

    // Filter within requested years
    if (parsed.year < startYear || parsed.year > endYear) continue;

    const precipitationMm = cleanNasaValue(precipMap[dateKey]);
    const tempMeanC = cleanNasaValue(t2mMap[dateKey]);
    const tempMaxC = cleanNasaValue(t2mMaxMap[dateKey]);

    records.push({
      date: parsed.date,
      year: parsed.year,
      month: parsed.month,
      day: parsed.day,
      precipitationMm,
      tempMeanC,
      tempMaxC,
    });
  }

  return records;
}


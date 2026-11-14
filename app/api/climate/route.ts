import { NextRequest, NextResponse } from "next/server";
import { fetchNasaClimate } from "@/services/nasa-power";
import { processClimateRecords } from "@/climate/processor";
import { MOCK_CLIMATE_INDICATORS_LUDHIANA } from "@/fixtures/climate.mock";
import { ApiResponse, ClimateIndicators, Location } from "@/types";

export const dynamic = "force-dynamic";

/**
 * Strictly parses a coordinate string into a finite float.
 * Rejects trailing characters, non-finite values, and malformed strings.
 */
function parseStrictCoordinate(value: string | null): number | null {
  if (value === null) return null;
  const trimmed = value.trim();
  if (trimmed === "") return null;
  if (!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(trimmed)) {
    return null;
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || isNaN(parsed)) {
    return null;
  }
  return parsed;
}

/**
 * Strictly parses a year parameter into an integer.
 * Rejects decimal values, non-numeric suffixes, and empty strings.
 */
function parseStrictYear(value: string | null): number | null {
  if (value === null) return null;
  const trimmed = value.trim();
  if (trimmed === "") return null;
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }
  const parsed = Number(trimmed);
  if (!Number.isSafeInteger(parsed)) {
    return null;
  }
  return parsed;
}

/**
 * GET /api/climate
 * 
 * Query parameters:
 * - lat: latitude (required, -90 to 90)
 * - lon: longitude (required, -180 to 180)
 * - startYear: start year (optional, default: 2015)
 * - endYear: end year (optional, default: 2024)
 * - mock: "true" to return calibrated mock data for rapid frontend development
 *
 * Year defaulting rules:
 * 1. If neither year is supplied: preserve default range 2015–2024.
 * 2. If only startYear is supplied: choose a valid end year not earlier than startYear and <= NASA limit
 *    (Math.min(maxSupportedYear, Math.max(DEFAULT_END_YEAR, parsedStartYear))).
 * 3. If only endYear is supplied: preserve default start year (2015), provided resulting range is valid (endYear >= 2015).
 * 4. If both are supplied: validate requested range exactly (1981 <= startYear <= endYear <= maxSupportedYear).
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<ClimateIndicators>>> {
  const { searchParams } = new URL(request.url);

  const latParam = searchParams.get("lat");
  const lonParam = searchParams.get("lon");
  const startYearParam = searchParams.get("startYear");
  const endYearParam = searchParams.get("endYear");
  const isMock = searchParams.get("mock") === "true";

  // Validate presence of lat and lon
  if (latParam === null || lonParam === null || latParam.trim() === "" || lonParam.trim() === "") {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "MISSING_COORDINATES",
          message: "Query parameters 'lat' and 'lon' are required (e.g., /api/climate?lat=30.90&lon=75.85).",
        },
      },
      { status: 400 }
    );
  }

  const lat = parseStrictCoordinate(latParam);
  if (lat === null || lat < -90 || lat > 90) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_LATITUDE",
          message: `Latitude must be a valid number between -90 and 90. Received: ${latParam}`,
        },
      },
      { status: 400 }
    );
  }

  const lon = parseStrictCoordinate(lonParam);
  if (lon === null || lon < -180 || lon > 180) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_LONGITUDE",
          message: `Longitude must be a valid number between -180 and 180. Received: ${lonParam}`,
        },
      },
      { status: 400 }
    );
  }

  const DEFAULT_START_YEAR = 2015;
  const DEFAULT_END_YEAR = 2024;
  const currentYear = new Date().getFullYear();
  const maxSupportedYear = currentYear + 1;

  let startYear: number;
  let endYear: number;

  if (startYearParam === null && endYearParam === null) {
    // Rule 1: Neither year supplied -> preserve 2015–2024
    startYear = DEFAULT_START_YEAR;
    endYear = DEFAULT_END_YEAR;
  } else if (startYearParam !== null && endYearParam === null) {
    // Rule 2: Only startYear supplied -> choose valid endYear not earlier than startYear and <= NASA limit
    const parsedStartYear = parseStrictYear(startYearParam);
    if (parsedStartYear === null || parsedStartYear < 1981 || parsedStartYear > maxSupportedYear) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_START_YEAR",
            message: `startYear must be an integer between 1981 and ${maxSupportedYear}. Received: ${startYearParam}`,
          },
        },
        { status: 400 }
      );
    }
    startYear = parsedStartYear;
    endYear = Math.min(maxSupportedYear, Math.max(DEFAULT_END_YEAR, parsedStartYear));
  } else if (startYearParam === null && endYearParam !== null) {
    // Rule 3: Only endYear supplied -> preserve default startYear (2015), provided resulting range is valid
    const parsedEndYear = parseStrictYear(endYearParam);
    if (parsedEndYear === null || parsedEndYear > maxSupportedYear) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_END_YEAR",
            message: `endYear must be an integer <= ${maxSupportedYear}. Received: ${endYearParam}`,
          },
        },
        { status: 400 }
      );
    }
    if (parsedEndYear < DEFAULT_START_YEAR) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_END_YEAR",
            message: `endYear must be an integer >= default startYear (${DEFAULT_START_YEAR}) when startYear is omitted. Received: ${endYearParam}`,
          },
        },
        { status: 400 }
      );
    }
    startYear = DEFAULT_START_YEAR;
    endYear = parsedEndYear;
  } else {
    // Rule 4: Both supplied -> validate requested range exactly
    const parsedStartYear = parseStrictYear(startYearParam);
    if (parsedStartYear === null || parsedStartYear < 1981 || parsedStartYear > maxSupportedYear) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_START_YEAR",
            message: `startYear must be an integer between 1981 and ${maxSupportedYear}. Received: ${startYearParam}`,
          },
        },
        { status: 400 }
      );
    }
    const parsedEndYear = parseStrictYear(endYearParam);
    if (parsedEndYear === null || parsedEndYear > maxSupportedYear) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_END_YEAR",
            message: `endYear must be an integer <= ${maxSupportedYear}. Received: ${endYearParam}`,
          },
        },
        { status: 400 }
      );
    }
    if (parsedEndYear < parsedStartYear) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_END_YEAR",
            message: `endYear must be an integer >= startYear (${parsedStartYear}). Received: ${endYearParam}`,
          },
        },
        { status: 400 }
      );
    }
    startYear = parsedStartYear;
    endYear = parsedEndYear;
  }

  const location: Location = {
    latitude: lat,
    longitude: lon,
    name: lat === 30.9 && lon === 75.85 ? "Ludhiana Demonstration Region" : `Point (${lat.toFixed(2)}, ${lon.toFixed(2)})`,
  };

  // Mock mode shortcut for offline UI development or testing
  if (isMock) {
    return NextResponse.json({
      success: true,
      data: {
        ...MOCK_CLIMATE_INDICATORS_LUDHIANA,
        location,
        period: { startYear, endYear },
      },
      meta: {
        dataSource: "Calibrated Mock Fixture (Punjab baseline)",
        processingTimestamp: new Date().toISOString(),
        version: "1.0.0",
      },
    });
  }

  try {
    const rawRecords = await fetchNasaClimate(location, startYear, endYear);

    if (rawRecords.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NO_DATA_RETURNED",
            message: "NASA POWER returned no records for the specified location and year range.",
          },
        },
        { status: 404 }
      );
    }

    const processedIndicators = processClimateRecords(rawRecords, location, {
      startYear,
      endYear,
    });

    return NextResponse.json({
      success: true,
      data: processedIndicators,
      meta: {
        dataSource: "NASA POWER Daily API (PRECTOTCORR, T2M, T2M_MAX)",
        processingTimestamp: new Date().toISOString(),
        version: "1.0.0",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "CLIMATE_FETCH_FAILED",
          message: `Failed to fetch or process NASA climate data: ${message}`,
        },
      },
      { status: 502 }
    );
  }
}


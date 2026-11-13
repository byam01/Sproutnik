import { NextRequest, NextResponse } from "next/server";
import { fetchNasaClimate } from "@/services/nasa-power";
import { processClimateRecords } from "@/climate/processor";
import { MOCK_CLIMATE_INDICATORS_LUDHIANA } from "@/fixtures/climate.mock";
import { ApiResponse, ClimateIndicators, Location } from "@/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/climate
 * 
 * Query parameters:
 * - lat: latitude (required, -90 to 90)
 * - lon: longitude (required, -180 to 180)
 * - startYear: start year (optional, default: 2015)
 * - endYear: end year (optional, default: 2024)
 * - mock: "true" to return calibrated mock data for rapid frontend development
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<ClimateIndicators>>> {
  const { searchParams } = new URL(request.url);

  const latParam = searchParams.get("lat");
  const lonParam = searchParams.get("lon");
  const startYearParam = searchParams.get("startYear");
  const endYearParam = searchParams.get("endYear");
  const isMock = searchParams.get("mock") === "true";

  // Validate presence of lat and lon
  if (!latParam || !lonParam) {
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

  const lat = parseFloat(latParam);
  const lon = parseFloat(lonParam);

  if (isNaN(lat) || lat < -90 || lat > 90) {
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

  if (isNaN(lon) || lon < -180 || lon > 180) {
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

  const startYear = startYearParam ? parseInt(startYearParam, 10) : 2015;
  const endYear = endYearParam ? parseInt(endYearParam, 10) : 2024;

  if (isNaN(startYear) || startYear < 1981 || startYear > 2050) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_START_YEAR",
          message: `startYear must be an integer >= 1981. Received: ${startYearParam}`,
        },
      },
      { status: 400 }
    );
  }

  if (isNaN(endYear) || endYear < startYear || endYear > 2050) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_END_YEAR",
          message: `endYear must be an integer >= startYear (${startYear}). Received: ${endYearParam}`,
        },
      },
      { status: 400 }
    );
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

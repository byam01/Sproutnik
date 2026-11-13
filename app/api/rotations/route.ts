import { NextRequest, NextResponse } from "next/server";
import { fetchNasaClimate } from "@/services/nasa-power";
import { processClimateRecords } from "@/climate/processor";
import { MOCK_CLIMATE_INDICATORS_LUDHIANA } from "@/fixtures/climate.mock";
import { CANDIDATE_ROTATIONS } from "@/agronomy/rotations";
import { compareCropRotation } from "@/engine/comparison";
import {
  ApiResponse,
  ClimateIndicators,
  FarmerProfile,
  IrrigationSourceType,
  Location,
  RotationComparisonResult,
  SoilTextureType,
} from "@/types";

export const dynamic = "force-dynamic";

export interface RotationsApiResponseData {
  location: Location;
  climateContext: {
    meanAnnualRainfallMm: number;
    seasonalRainfallMm: ClimateIndicators["seasonalRainfallMm"];
    meanTemperatureC: number;
    meanMaxTemperatureC: number;
    monthlyMeanMaxTempC: Record<number, number>;
    rainfallVariabilityCvPercent: number;
    drySeasonDeficitFrequencyPercent: number;
  };
  farmerProfile?: FarmerProfile;
  baseline: RotationComparisonResult;
  alternatives: RotationComparisonResult[];
  scientificDisclaimer: string;
}

const SCIENTIFIC_DISCLAIMER =
  "Rotation Compass provides decision support based on historical NASA environmental data and published agronomic evidence (e.g. Punjab Agricultural University). It does NOT guarantee crop yields or eliminate local weather risks. Sowing dates, pest management, and cultivar choices must be aligned with local extension advisories.";

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<RotationsApiResponseData>>> {
  const { searchParams } = new URL(request.url);

  const latParam = searchParams.get("lat");
  const lonParam = searchParams.get("lon");
  const isMock = searchParams.get("mock") === "true";

  if (!latParam || !lonParam) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "MISSING_COORDINATES",
          message: "Query parameters 'lat' and 'lon' are required (e.g. /api/rotations?lat=30.90&lon=75.85).",
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
          message: `Latitude must be between -90 and 90. Received: ${latParam}`,
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
          message: `Longitude must be between -180 and 180. Received: ${lonParam}`,
        },
      },
      { status: 400 }
    );
  }

  const startYear = searchParams.get("startYear") ? parseInt(searchParams.get("startYear")!, 10) : 2015;
  const endYear = searchParams.get("endYear") ? parseInt(searchParams.get("endYear")!, 10) : 2024;

  const soilTexture = (searchParams.get("soilTexture") as SoilTextureType) || undefined;
  const irrigationSource = (searchParams.get("irrigationSource") as IrrigationSourceType) || "tubewell_deep";
  const groundwaterDepthMeters = searchParams.get("groundwaterDepth")
    ? parseFloat(searchParams.get("groundwaterDepth")!)
    : null;

  const location: Location = {
    latitude: lat,
    longitude: lon,
    name:
      lat === 30.9 && lon === 75.85
        ? "Ludhiana Demonstration Region, Punjab"
        : `Point (${lat.toFixed(2)}, ${lon.toFixed(2)})`,
  };

  const farmerProfile: FarmerProfile = {
    location,
    soilTexture: soilTexture || "loam",
    irrigationSource,
    groundwaterDepthMeters,
  };

  let climate: ClimateIndicators;

  if (isMock) {
    climate = {
      ...MOCK_CLIMATE_INDICATORS_LUDHIANA,
      location,
      period: { startYear, endYear },
    };
  } else {
    try {
      const records = await fetchNasaClimate(location, startYear, endYear);
      if (records.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "NO_CLIMATE_DATA",
              message: "NASA POWER returned no records for the requested coordinates.",
            },
          },
          { status: 404 }
        );
      }
      climate = processClimateRecords(records, location, { startYear, endYear });
    } catch (err: unknown) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CLIMATE_FETCH_FAILED",
            message: `Could not retrieve climate data from NASA POWER: ${err instanceof Error ? err.message : String(err)}`,
          },
        },
        { status: 502 }
      );
    }
  }

  // Run Stage A & Stage B evaluation for all candidate rotations
  const evaluatedRotations = CANDIDATE_ROTATIONS.map((rotation) =>
    compareCropRotation(rotation, climate, farmerProfile)
  );

  const baseline =
    evaluatedRotations.find((r) => r.isBaseline) || evaluatedRotations[0];
  const alternatives = evaluatedRotations.filter((r) => !r.isBaseline);

  return NextResponse.json({
    success: true,
    data: {
      location,
      climateContext: {
        meanAnnualRainfallMm: climate.meanAnnualRainfallMm,
        seasonalRainfallMm: climate.seasonalRainfallMm,
        meanTemperatureC: climate.meanTemperatureC,
        meanMaxTemperatureC: climate.meanMaxTemperatureC,
        monthlyMeanMaxTempC: climate.monthlyMeanMaxTempC,
        rainfallVariabilityCvPercent: climate.rainfallVariabilityCvPercent,
        drySeasonDeficitFrequencyPercent: climate.drySeasonDeficitFrequencyPercent,
      },
      farmerProfile,
      baseline,
      alternatives,
      scientificDisclaimer: SCIENTIFIC_DISCLAIMER,
    },
    meta: {
      dataSource: isMock
        ? "Calibrated Mock Baseline + PAU Knowledge Base"
        : "NASA POWER Daily API + PAU Agronomic Evidence",
      processingTimestamp: new Date().toISOString(),
      version: "1.0.0",
    },
  });
}

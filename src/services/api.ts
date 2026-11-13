import { ApiResponse, ClimateIndicators } from "@/types";
import { RotationsApiResponseData } from "@/../app/api/rotations/route";

export interface FetchClimateParams {
  lat: number;
  lon: number;
  startYear?: number;
  endYear?: number;
  mock?: boolean;
}

export async function fetchClimateApi(
  params: FetchClimateParams
): Promise<ApiResponse<ClimateIndicators>> {
  const query = new URLSearchParams({
    lat: params.lat.toString(),
    lon: params.lon.toString(),
  });

  if (params.startYear) {
    query.set("startYear", params.startYear.toString());
  }
  if (params.endYear) {
    query.set("endYear", params.endYear.toString());
  }
  if (params.mock) {
    query.set("mock", "true");
  }

  const url = `/api/climate?${query.toString()}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const data = (await res.json()) as ApiResponse<ClimateIndicators>;
    return data;
  } catch (err) {
    return {
      success: false,
      error: {
        code: "NETWORK_REQUEST_FAILED",
        message:
          err instanceof Error
            ? err.message
            : "An unexpected network error occurred while communicating with the climate API.",
      },
    };
  }
}

export interface FetchRotationsParams {
  lat: number;
  lon: number;
  startYear?: number;
  endYear?: number;
  soilTexture?: string;
  irrigationSource?: string;
  groundwaterDepth?: number;
  mock?: boolean;
}

export async function fetchRotationsApi(
  params: FetchRotationsParams
): Promise<ApiResponse<RotationsApiResponseData>> {
  const query = new URLSearchParams({
    lat: params.lat.toString(),
    lon: params.lon.toString(),
  });

  if (params.startYear) {
    query.set("startYear", params.startYear.toString());
  }
  if (params.endYear) {
    query.set("endYear", params.endYear.toString());
  }
  if (params.soilTexture) {
    query.set("soilTexture", params.soilTexture);
  }
  if (params.irrigationSource) {
    query.set("irrigationSource", params.irrigationSource);
  }
  if (params.groundwaterDepth !== undefined && params.groundwaterDepth !== null) {
    query.set("groundwaterDepth", params.groundwaterDepth.toString());
  }
  if (params.mock) {
    query.set("mock", "true");
  }

  const url = `/api/rotations?${query.toString()}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const data = (await res.json()) as ApiResponse<RotationsApiResponseData>;
    return data;
  } catch (err) {
    return {
      success: false,
      error: {
        code: "NETWORK_REQUEST_FAILED",
        message:
          err instanceof Error
            ? err.message
            : "An unexpected network error occurred while communicating with the crop rotations API.",
      },
    };
  }
}

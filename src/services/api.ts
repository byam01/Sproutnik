import { ApiResponse, ClimateIndicators, FarmerProfile, SeasonType } from "@/types";
import { RotationsApiResponseData } from "@/../app/api/rotations/route";
import { CropCatalogItem } from "@/../app/api/crops/route";

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

export type CreateFarmerProfileInput = Omit<FarmerProfile, "profileId" | "createdAt" | "updatedAt"> & {
  profileId?: string;
  createdAt?: string;
  updatedAt?: string;
};

/**
 * POST /api/farmer-profile
 * Creates a new canonical FarmerProfile on the server.
 */
export async function createFarmerProfileApi(
  profileInput: CreateFarmerProfileInput
): Promise<ApiResponse<FarmerProfile>> {
  try {
    const res = await fetch("/api/farmer-profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "no-store",
      body: JSON.stringify(profileInput),
    });

    const data = (await res.json()) as ApiResponse<FarmerProfile>;
    return data;
  } catch (err) {
    return {
      success: false,
      error: {
        code: "NETWORK_REQUEST_FAILED",
        message:
          err instanceof Error
            ? err.message
            : "An unexpected network error occurred while creating farmer profile.",
      },
    };
  }
}

/**
 * GET /api/farmer-profile/[profileId]
 * Retrieves an existing FarmerProfile by its server-assigned ID.
 */
export async function fetchFarmerProfileApi(
  profileId: string
): Promise<ApiResponse<FarmerProfile>> {
  try {
    const res = await fetch(`/api/farmer-profile/${encodeURIComponent(profileId)}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const data = (await res.json()) as ApiResponse<FarmerProfile>;
    return data;
  } catch (err) {
    return {
      success: false,
      error: {
        code: "NETWORK_REQUEST_FAILED",
        message:
          err instanceof Error
            ? err.message
            : "An unexpected network error occurred while fetching farmer profile.",
      },
    };
  }
}

export type UpdateFarmerProfileInput = Partial<Omit<FarmerProfile, "profileId" | "createdAt">>;

/**
 * PATCH /api/farmer-profile/[profileId]
 * Partially updates an existing FarmerProfile atomically.
 */
export async function updateFarmerProfileApi(
  profileId: string,
  updates: UpdateFarmerProfileInput
): Promise<ApiResponse<FarmerProfile>> {
  try {
    const res = await fetch(`/api/farmer-profile/${encodeURIComponent(profileId)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "no-store",
      body: JSON.stringify(updates),
    });

    const data = (await res.json()) as ApiResponse<FarmerProfile>;
    return data;
  } catch (err) {
    return {
      success: false,
      error: {
        code: "NETWORK_REQUEST_FAILED",
        message:
          err instanceof Error
            ? err.message
            : "An unexpected network error occurred while updating farmer profile.",
      },
    };
  }
}

export interface FetchCropsParams {
  season?: SeasonType | "summer";
}

/**
 * GET /api/crops
 * Retrieves authoritative crop catalog from PAU registry, with optional seasonal filtering.
 */
export async function fetchCropsApi(
  params?: FetchCropsParams
): Promise<ApiResponse<CropCatalogItem[]>> {
  const query = new URLSearchParams();
  if (params?.season) {
    query.set("season", params.season);
  }
  const queryString = query.toString();
  const url = queryString ? `/api/crops?${queryString}` : "/api/crops";

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const data = (await res.json()) as ApiResponse<CropCatalogItem[]>;
    return data;
  } catch (err) {
    return {
      success: false,
      error: {
        code: "NETWORK_REQUEST_FAILED",
        message:
          err instanceof Error
            ? err.message
            : "An unexpected network error occurred while fetching crop catalog.",
      },
    };
  }
}

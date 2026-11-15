/**
 * Frontend API Client & Communication Service
 *
 * Provides typed, resilient HTTP client functions for all backend endpoints:
 * - GET /api/climate
 * - GET /api/rotations
 * - POST /api/farmer-profile
 * - GET /api/farmer-profile/[profileId]
 * - PATCH /api/farmer-profile/[profileId]
 * - GET /api/crops
 *
 * RESILIENCE & RELIABILITY GUARANTEES:
 * 1. AbortSignal Support: Callers can pass external abort signals (e.g. for React component unmount).
 * 2. Timeout Separation: Distinct error classification for REQUEST_TIMEOUT vs REQUEST_ABORTED vs NETWORK_REQUEST_FAILED.
 * 3. Event Listener Cleanup: Timeout listeners on external signals are cleaned up deterministically.
 * 4. Error Normalization: Non-2xx HTTP responses, malformed JSON, and network dropouts return structured ApiResponse envelopes.
 * 5. Cache Bypassing: Critical queries specify cache: 'no-store'.
 */

import {
  ApiResponse,
  ClimateIndicators,
  FarmerProfile,
  SeasonType,
  CreateFarmerProfileRequest,
  UpdateFarmerProfileRequest,
  FarmerProfileResponse,
} from "@/types";
import { RotationsApiResponseData } from "@/../app/api/rotations/route";
import { CropCatalogItem } from "@/../app/api/crops/route";

export interface ApiRequestOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

export interface TimeoutSignalResult {
  signal: AbortSignal;
  cleanup: () => void;
  isTimedOut: () => boolean;
  isExternalAbort: () => boolean;
}

/**
 * Creates an AbortSignal tied to an optional caller signal and an internal timeout.
 * Deterministically cleans up event listeners and distinguishes genuine timeouts from intentional cancellations.
 */
export function setupTimeoutSignal(
  options?: ApiRequestOptions,
  defaultTimeoutMs = 15000
): TimeoutSignalResult {
  const timeoutMs = options?.timeoutMs ?? defaultTimeoutMs;
  let timedOut = false;
  let externalAborted = false;

  const controller = new AbortController();

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort(new Error(`Request timed out after ${timeoutMs}ms`));
  }, timeoutMs);

  let abortHandler: (() => void) | null = null;

  if (options?.signal) {
    if (options.signal.aborted) {
      externalAborted = true;
      controller.abort(options.signal.reason);
    } else {
      abortHandler = () => {
        externalAborted = true;
        controller.abort(options.signal?.reason);
      };
      options.signal.addEventListener("abort", abortHandler, { once: true });
    }
  }

  const cleanup = () => {
    clearTimeout(timer);
    if (abortHandler && options?.signal) {
      options.signal.removeEventListener("abort", abortHandler);
      abortHandler = null;
    }
  };

  return {
    signal: controller.signal,
    cleanup,
    isTimedOut: () => timedOut,
    isExternalAbort: () => externalAborted || Boolean(options?.signal?.aborted),
  };
}

/**
 * Normalizes caught fetch errors into structured ApiResponses.
 * Strictly separates genuine request timeouts (REQUEST_TIMEOUT) from
 * intentional cancellations/unmounts (REQUEST_ABORTED) and network failures (NETWORK_REQUEST_FAILED).
 */
export function handleFetchError<T = never>(
  err: unknown,
  endpointName: string,
  state?: { isTimedOut?: () => boolean; isExternalAbort?: () => boolean }
): ApiResponse<T> {
  // 1. Genuine timeout
  if (
    state?.isTimedOut?.() ||
    (err instanceof Error && err.message.toLowerCase().includes("timed out"))
  ) {
    return {
      success: false,
      error: {
        code: "REQUEST_TIMEOUT",
        message: `Request to ${endpointName} timed out.`,
      },
    };
  }

  // 2. Intentional cancellation or component unmount
  if (
    state?.isExternalAbort?.() ||
    (err instanceof Error && err.name === "AbortError")
  ) {
    return {
      success: false,
      error: {
        code: "REQUEST_ABORTED",
        message: `Request to ${endpointName} was cancelled.`,
      },
    };
  }

  // 3. Network or other failure
  return {
    success: false,
    error: {
      code: "NETWORK_REQUEST_FAILED",
      message:
        err instanceof Error
          ? err.message
          : `An unexpected network error occurred while communicating with ${endpointName}.`,
    },
  };
}

/**
 * Safely parses an API response, preserving non-2xx statuses, backend validation errors,
 * and handles malformed JSON payloads.
 */
async function parseResponse<T>(
  res: Response,
  endpointName: string
): Promise<ApiResponse<T>> {
  try {
    let json: ApiResponse<T>;
    if (typeof res.text === "function") {
      const bodyText = await res.text();
      if (!bodyText) {
        if (res.ok) {
          return {
            success: false,
            error: {
              code: "EMPTY_RESPONSE",
              message: `Empty response received from ${endpointName}.`,
            },
          };
        }
        return {
          success: false,
          error: {
            code: `HTTP_${res.status}`,
            message: `HTTP error ${res.status} from ${endpointName}: ${res.statusText}`,
          },
        };
      }
      json = JSON.parse(bodyText) as ApiResponse<T>;
    } else if (typeof res.json === "function") {
      json = (await res.json()) as ApiResponse<T>;
    } else {
      throw new Error("Response object does not provide .text() or .json()");
    }

    if (!res.ok) {
      if (json && json.success === false && json.error) {
        return json;
      }
      return {
        success: false,
        error: {
          code: `HTTP_${res.status}`,
          message: `HTTP error ${res.status} from ${endpointName}: ${res.statusText}`,
          details: json,
        },
      };
    }

    return json;
  } catch (err) {
    if (!res.ok) {
      return {
        success: false,
        error: {
          code: `HTTP_${res.status}`,
          message: `HTTP error ${res.status} from ${endpointName}: ${res.statusText}`,
        },
      };
    }
    return {
      success: false,
      error: {
        code: "MALFORMED_RESPONSE",
        message:
          err instanceof Error
            ? err.message
            : `Failed to parse response from ${endpointName} as JSON.`,
      },
    };
  }
}

// ==========================================
// 1. Climate API
// ==========================================

export interface FetchClimateParams {
  lat: number;
  lon: number;
  startYear?: number;
  endYear?: number;
  mock?: boolean;
}

export async function fetchClimateApi(
  params: FetchClimateParams,
  options?: ApiRequestOptions
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
  const timeoutCtx = setupTimeoutSignal(options);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
      signal: timeoutCtx.signal,
    });

    return await parseResponse<ClimateIndicators>(res, url);
  } catch (err) {
    return handleFetchError<ClimateIndicators>(err, url, timeoutCtx);
  } finally {
    timeoutCtx.cleanup();
  }
}

// ==========================================
// 2. Rotations API
// ==========================================

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
  params: FetchRotationsParams,
  options?: ApiRequestOptions
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
  const timeoutCtx = setupTimeoutSignal(options);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
      signal: timeoutCtx.signal,
    });

    return await parseResponse<RotationsApiResponseData>(res, url);
  } catch (err) {
    return handleFetchError<RotationsApiResponseData>(err, url, timeoutCtx);
  } finally {
    timeoutCtx.cleanup();
  }
}

// ==========================================
// 3. Farmer Profile API
// ==========================================

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
  profileInput: CreateFarmerProfileInput | CreateFarmerProfileRequest,
  options?: ApiRequestOptions
): Promise<ApiResponse<FarmerProfileResponse>> {
  const url = "/api/farmer-profile";
  const timeoutCtx = setupTimeoutSignal(options);

  // Sanitize payload: strip empty/null placeholder profileId if caller provided an unpersisted FarmerProfile
  let cleanInput = profileInput;
  if (profileInput && typeof profileInput === "object") {
    const p = { ...(profileInput as Record<string, unknown>) };
    if (p.profileId === "" || p.profileId === null) {
      delete p.profileId;
    }
    cleanInput = p as CreateFarmerProfileInput | CreateFarmerProfileRequest;
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "no-store",
      body: JSON.stringify(cleanInput),
      signal: timeoutCtx.signal,
    });

    return await parseResponse<FarmerProfileResponse>(res, url);
  } catch (err) {
    return handleFetchError<FarmerProfileResponse>(err, url, timeoutCtx);
  } finally {
    timeoutCtx.cleanup();
  }
}

/**
 * Convenience alias for frontend onboarding harness.
 */
export const createFarmerProfile = createFarmerProfileApi;

/**
 * GET /api/farmer-profile/[profileId]
 * Retrieves an existing FarmerProfile by its server-assigned ID.
 */
export async function fetchFarmerProfileApi(
  profileId: string,
  options?: ApiRequestOptions
): Promise<ApiResponse<FarmerProfile>> {
  if (!profileId || typeof profileId !== "string" || profileId.trim().length === 0) {
    return {
      success: false,
      error: {
        code: "INVALID_PROFILE_ID",
        message: "Profile ID is required to fetch farmer profile.",
      },
    };
  }

  const url = `/api/farmer-profile/${encodeURIComponent(profileId.trim())}`;
  const timeoutCtx = setupTimeoutSignal(options);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
      signal: timeoutCtx.signal,
    });

    return await parseResponse<FarmerProfile>(res, url);
  } catch (err) {
    return handleFetchError<FarmerProfile>(err, url, timeoutCtx);
  } finally {
    timeoutCtx.cleanup();
  }
}

/**
 * Convenience alias for frontend onboarding harness.
 */
export const getFarmerProfile = fetchFarmerProfileApi;

export type UpdateFarmerProfileInput = Partial<Omit<FarmerProfile, "profileId" | "createdAt">>;

/**
 * PATCH /api/farmer-profile/[profileId]
 * Partially updates an existing FarmerProfile atomically.
 */
export async function updateFarmerProfileApi(
  profileId: string,
  updates: UpdateFarmerProfileInput | UpdateFarmerProfileRequest,
  options?: ApiRequestOptions
): Promise<ApiResponse<FarmerProfile>> {
  if (!profileId || typeof profileId !== "string" || profileId.trim().length === 0) {
    return {
      success: false,
      error: {
        code: "INVALID_PROFILE_ID",
        message: "Profile ID is required to update farmer profile.",
      },
    };
  }

  const url = `/api/farmer-profile/${encodeURIComponent(profileId.trim())}`;
  const timeoutCtx = setupTimeoutSignal(options);

  // Sanitize updates: strip immutable fields (profileId, createdAt) if caller passed full model
  let cleanUpdates = updates;
  if (updates && typeof updates === "object") {
    const { profileId: _pid, createdAt: _created, ...rest } = updates as Record<string, unknown>;
    cleanUpdates = rest as UpdateFarmerProfileInput | UpdateFarmerProfileRequest;
  }

  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "no-store",
      body: JSON.stringify(cleanUpdates),
      signal: timeoutCtx.signal,
    });

    return await parseResponse<FarmerProfile>(res, url);
  } catch (err) {
    return handleFetchError<FarmerProfile>(err, url, timeoutCtx);
  } finally {
    timeoutCtx.cleanup();
  }
}

/**
 * Convenience alias for frontend onboarding harness.
 */
export const updateFarmerProfile = updateFarmerProfileApi;

// ==========================================
// 4. Crops Catalog API
// ==========================================

export interface FetchCropsParams {
  season?: SeasonType | "summer";
}

/**
 * GET /api/crops
 * Retrieves authoritative crop catalog from PAU registry, with optional seasonal filtering.
 */
export async function fetchCropsApi(
  paramsOrOptions?: FetchCropsParams | ApiRequestOptions,
  options?: ApiRequestOptions
): Promise<ApiResponse<CropCatalogItem[]>> {
  let params: FetchCropsParams | undefined;
  let opts: ApiRequestOptions | undefined = options;

  if (paramsOrOptions) {
    if ("season" in paramsOrOptions) {
      params = paramsOrOptions as FetchCropsParams;
    } else if ("timeoutMs" in paramsOrOptions || "signal" in paramsOrOptions) {
      opts = paramsOrOptions as ApiRequestOptions;
    }
  }

  const query = new URLSearchParams();
  if (params?.season) {
    query.set("season", params.season);
  }
  const queryString = query.toString();
  const url = queryString ? `/api/crops?${queryString}` : "/api/crops";

  const timeoutCtx = setupTimeoutSignal(opts);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
      signal: timeoutCtx.signal,
    });

    return await parseResponse<CropCatalogItem[]>(res, url);
  } catch (err) {
    return handleFetchError<CropCatalogItem[]>(err, url, timeoutCtx);
  } finally {
    timeoutCtx.cleanup();
  }
}

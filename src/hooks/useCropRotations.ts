"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchRotationsApi, FetchRotationsParams } from "@/services/api";
import { RotationsApiResponseData } from "@/../app/api/rotations/route";
import { RotationFarmerContext } from "@/types";

export interface UseCropRotationsResult {
  data: RotationsApiResponseData | null;
  loading: boolean;
  error: { code: string; message: string } | null;
  refetch: () => void;
}

/**
 * Compatible context type that accepts canonical RotationFarmerContext
 * while gracefully supporting optional legacy/alternate `groundwaterDepth` naming.
 */
export type FarmerRotationContext = RotationFarmerContext & {
  groundwaterDepth?: number;
};

export function useCropRotations(
  coordinates: { lat: number; lon: number } = { lat: 30.9, lon: 75.85 },
  isMock = false,
  farmerContext?: RotationFarmerContext | FarmerRotationContext
): UseCropRotationsResult {
  const [data, setData] = useState<RotationsApiResponseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);

  const loadRotations = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Resolve groundwater depth from either canonical groundwaterDepthMeters or legacy groundwaterDepth
    const resolvedGroundwaterDepth =
      farmerContext?.groundwaterDepthMeters ??
      (farmerContext as { groundwaterDepth?: number } | undefined)?.groundwaterDepth;

    const params: FetchRotationsParams = {
      lat: coordinates.lat,
      lon: coordinates.lon,
      startYear: 2015,
      endYear: 2024,
      soilTexture: farmerContext?.soilTexture,
      irrigationSource: farmerContext?.irrigationSource,
      groundwaterDepth: resolvedGroundwaterDepth,
      mock: isMock,
    };

    const response = await fetchRotationsApi(params);

    if (response.success) {
      setData(response.data);
      setError(null);
    } else {
      setError(response.error);
      setData(null);
    }

    setLoading(false);
  }, [
    coordinates.lat,
    coordinates.lon,
    isMock,
    farmerContext?.soilTexture,
    farmerContext?.irrigationSource,
    farmerContext?.groundwaterDepthMeters,
    (farmerContext as { groundwaterDepth?: number } | undefined)?.groundwaterDepth,
  ]);

  useEffect(() => {
    loadRotations();
  }, [loadRotations]);

  return {
    data,
    loading,
    error,
    refetch: loadRotations,
  };
}

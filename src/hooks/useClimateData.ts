"use client";

import { useCallback, useEffect, useState } from "react";
import { ClimateIndicators } from "@/types";
import { fetchClimateApi, FetchClimateParams } from "@/services/api";

export interface UseClimateDataResult {
  data: ClimateIndicators | null;
  meta: {
    dataSource: string;
    processingTimestamp: string;
    version: string;
  } | null;
  loading: boolean;
  error: {
    code: string;
    message: string;
  } | null;
  isMock: boolean;
  setIsMock: (value: boolean | ((prev: boolean) => boolean)) => void;
  refetch: () => void;
  coordinates: { lat: number; lon: number };
}

export function useClimateData(initialMock = false): UseClimateDataResult {
  const [isMock, setIsMock] = useState(initialMock);
  const [data, setData] = useState<ClimateIndicators | null>(null);
  const [meta, setMeta] = useState<{
    dataSource: string;
    processingTimestamp: string;
    version: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);

  const coordinates = { lat: 30.9, lon: 75.85 };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params: FetchClimateParams = {
      lat: coordinates.lat,
      lon: coordinates.lon,
      startYear: 2015,
      endYear: 2024,
      mock: isMock,
    };

    const response = await fetchClimateApi(params);

    if (response.success) {
      setData(response.data);
      setMeta(response.meta ?? null);
      setError(null);
    } else {
      setError(response.error);
      setData(null);
      setMeta(null);
    }

    setLoading(false);
  }, [coordinates.lat, coordinates.lon, isMock]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    meta,
    loading,
    error,
    isMock,
    setIsMock,
    refetch: loadData,
    coordinates,
  };
}


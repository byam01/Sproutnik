/**
 * GET /api/crops — Authoritative Crop Catalog API
 *
 * Exposes the verified agronomic crop registry for Punjab (CROPS_PUNJAB).
 *
 * Query Parameters:
 * - season (optional): Filter by agricultural season ("kharif" | "rabi" | "zaid" | "summer").
 *
 * Guarantees:
 * - Strictly serves authoritative crop metadata from CROPS_PUNJAB.
 * - Does not invent unsupported crops or claim unverified crops are engine-supported.
 * - Enriches each crop with transparent rotation-support metadata referencing CANDIDATE_ROTATIONS.
 * - Conforms strictly to the canonical ApiResponse<T> response envelope.
 */

import { NextRequest, NextResponse } from "next/server";
import { ApiResponse, CropMetadata, RotationDefinition, SeasonType } from "@/types";
import { CROPS_PUNJAB } from "@/agronomy/crops";
import { CANDIDATE_ROTATIONS } from "@/agronomy/rotations";

export const dynamic = "force-dynamic";

export interface CropRotationSupport {
  isEvaluatedInRotations: boolean;
  candidateRotationIds: string[];
}

export interface CropCatalogItem extends CropMetadata {
  rotationSupport: CropRotationSupport;
}

export interface CropCatalogResponseMeta {
  dataSource: string;
  processingTimestamp: string;
  version: string;
  total: number;
  region: string;
  filterApplied?: {
    season?: string;
  };
}

const VALID_SEASON_FILTERS = new Set(["kharif", "rabi", "zaid", "summer"]);

/**
 * Authoritative set of rotation IDs actively evaluated by the Sproutnik rotation engine.
 * Corresponds directly to candidate rotations processed in /api/rotations via compareCropRotation.
 */
export const ENGINE_EVALUATED_ROTATION_IDS: ReadonlySet<string> = new Set(
  CANDIDATE_ROTATIONS.map((r) => r.id)
);

/**
 * Evaluates whether and how a specific crop is supported in the rotation engine.
 *
 * Rules:
 * 1. Crop ID must exist in the authoritative CROPS_PUNJAB registry.
 * 2. Real engine support requires the crop to be present in both the cropSequence
 *    (sequence evaluated for turnaround & temporal feasibility) AND crops array
 *    (metadata evaluated for water, soil, and compatibility).
 * 3. Does NOT infer support merely from a crop appearing in a candidate definition;
 *    the rotation must be an engine-evaluated candidate rotation (ENGINE_EVALUATED_ROTATION_IDS).
 * 4. Unsupported crops return `isEvaluatedInRotations: false` and `candidateRotationIds: []`.
 */
export function getCropRotationSupport(
  cropId: string,
  candidateRotations: RotationDefinition[] = CANDIDATE_ROTATIONS
): CropRotationSupport {
  if (!cropId || typeof cropId !== "string" || !CROPS_PUNJAB[cropId]) {
    return {
      isEvaluatedInRotations: false,
      candidateRotationIds: [],
    };
  }

  const verifiedRotationIds: string[] = [];

  for (const rotation of candidateRotations) {
    // 1. Must be recognized as an engine-evaluated rotation
    if (!ENGINE_EVALUATED_ROTATION_IDS.has(rotation.id)) {
      continue;
    }

    // 2. Crop must be integrated in both sequence and metadata
    const inSequence = Array.isArray(rotation.cropSequence) && rotation.cropSequence.includes(cropId);
    const inCrops = Array.isArray(rotation.crops) && rotation.crops.some((c) => c && c.id === cropId);

    // 3. Do not infer support merely from a crop appearing in a candidate definition;
    // both sequence inclusion and metadata verification are mandatory.
    if (inSequence && inCrops) {
      if (!verifiedRotationIds.includes(rotation.id)) {
        verifiedRotationIds.push(rotation.id);
      }
    }
  }

  return {
    isEvaluatedInRotations: verifiedRotationIds.length > 0,
    candidateRotationIds: verifiedRotationIds,
  };
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<CropCatalogItem[]>>> {
  const { searchParams } = new URL(request.url);
  const seasonParam = searchParams.get("season");

  let targetSeason: SeasonType | null = null;

  if (seasonParam !== null) {
    const normalized = seasonParam.trim().toLowerCase();

    if (!VALID_SEASON_FILTERS.has(normalized)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_SEASON_FILTER",
            message: `Invalid season filter "${seasonParam}". Supported filters: kharif, rabi, zaid.`,
          },
        },
        { status: 400 }
      );
    }

    // Map "summer" alias to canonical "zaid"
    targetSeason = normalized === "summer" ? "zaid" : (normalized as SeasonType);
  }

  const allCrops = Object.values(CROPS_PUNJAB);

  // Filter if season requested
  const filteredCrops = targetSeason
    ? allCrops.filter((crop) => crop.season === targetSeason)
    : allCrops;

  // Enrich with verified rotation support metadata
  const catalogItems: CropCatalogItem[] = filteredCrops.map((crop) => ({
    ...crop,
    rotationSupport: getCropRotationSupport(crop.id),
  }));

  return NextResponse.json({
    success: true,
    data: catalogItems,
    meta: {
      dataSource: "PAU Agronomic Evidence Registry (CROPS_PUNJAB)",
      processingTimestamp: new Date().toISOString(),
      version: "1.0.0",
      total: catalogItems.length,
      region: "Punjab (Ludhiana District)",
      ...(targetSeason ? { filterApplied: { season: targetSeason } } : {}),
    },
  });
}

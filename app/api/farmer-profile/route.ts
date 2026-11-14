/**
 * POST /api/farmer-profile
 *
 * Creates a new canonical FarmerProfile.
 *
 * Guarantees:
 * - Validates input using validateFarmerProfileInput.
 * - Server strictly controls profile identity (UUID v4) and timestamps (createdAt, updatedAt).
 * - Client-provided IDs or timestamps are never trusted.
 * - Stores the profile in the singleton farmerProfileStore.
 * - Returns HTTP 201 with standard ApiResponse<FarmerProfile> envelope.
 * - Returns HTTP 400 for invalid payloads.
 */

import { NextRequest, NextResponse } from "next/server";
import { ApiResponse, FarmerProfile } from "@/types";
import { validateFarmerProfileInput } from "@/server/validators/profileValidator";
import { farmerProfileStore } from "@/server/farmerProfileStore";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<FarmerProfile>>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_JSON",
          message: "Request body must be a valid JSON object.",
        },
      },
      { status: 400 }
    );
  }

  const validation = validateFarmerProfileInput(body);
  if (!validation.isValid) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_PROFILE_INPUT",
          message: "Farmer profile validation failed.",
          details: validation.errors,
        },
      },
      { status: 400 }
    );
  }

  const payload = body as Record<string, unknown>;

  // Server generates canonical immutable identity and timestamps
  const profileId = crypto.randomUUID();
  const now = new Date().toISOString();

  const profile: FarmerProfile = {
    profileId,
    location: payload.location as FarmerProfile["location"],
    landAreaHectares: payload.landAreaHectares as FarmerProfile["landAreaHectares"],
    soilTexture: payload.soilTexture as FarmerProfile["soilTexture"],
    irrigationAvailable: payload.irrigationAvailable as FarmerProfile["irrigationAvailable"],
    irrigationSource: payload.irrigationSource as FarmerProfile["irrigationSource"],
    currentCrops: payload.currentCrops as FarmerProfile["currentCrops"],
    farmingGoals: payload.farmingGoals as FarmerProfile["farmingGoals"],
    createdAt: now,
    updatedAt: now,
  };

  const storeResult = farmerProfileStore.create(profile);
  if (!storeResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: storeResult.error,
          message: storeResult.message,
        },
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      data: storeResult.profile,
    },
    { status: 201 }
  );
}

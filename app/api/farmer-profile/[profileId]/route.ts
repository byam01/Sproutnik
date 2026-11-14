/**
 * GET & PATCH /api/farmer-profile/[profileId]
 *
 * Route handlers for retrieving and partially updating canonical FarmerProfiles.
 * Follows Next.js 15 asynchronous route params convention.
 */

import { NextRequest, NextResponse } from "next/server";
import { ApiResponse, FarmerProfile } from "@/types";
import { validateFarmerProfilePartialInput } from "@/server/validators/profileValidator";
import { farmerProfileStore, ProfileUpdatePayload } from "@/server/farmerProfileStore";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ profileId: string }>;
}

/**
 * GET /api/farmer-profile/[profileId]
 *
 * Retrieves an existing farmer profile by ID.
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<FarmerProfile>>> {
  const { profileId } = await context.params;

  if (!profileId || typeof profileId !== "string" || profileId.trim() === "") {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_PROFILE_ID",
          message: "Profile ID is required and must be a non-empty string.",
        },
      },
      { status: 400 }
    );
  }

  const profile = farmerProfileStore.getById(profileId);
  if (!profile) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "PROFILE_NOT_FOUND",
          message: `Farmer profile with ID "${profileId}" was not found.`,
        },
      },
      { status: 404 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      data: profile,
    },
    { status: 200 }
  );
}

/**
 * PATCH /api/farmer-profile/[profileId]
 *
 * Atomically updates an existing farmer profile.
 * Preserves omitted fields and rejects modifications to immutable fields.
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<FarmerProfile>>> {
  const { profileId } = await context.params;

  if (!profileId || typeof profileId !== "string" || profileId.trim() === "") {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_PROFILE_ID",
          message: "Profile ID is required and must be a non-empty string.",
        },
      },
      { status: 400 }
    );
  }

  // Ensure profile exists before processing updates
  const existing = farmerProfileStore.getById(profileId);
  if (!existing) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "PROFILE_NOT_FOUND",
          message: `Farmer profile with ID "${profileId}" was not found.`,
        },
      },
      { status: 404 }
    );
  }

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

  // Validate updates atomically before mutating store
  const validation = validateFarmerProfilePartialInput(body);
  if (!validation.isValid) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_PROFILE_UPDATE",
          message: "Farmer profile partial update validation failed.",
          details: validation.errors,
        },
      },
      { status: 400 }
    );
  }

  const p = body as Record<string, unknown>;
  const now = new Date().toISOString();
  const updates: ProfileUpdatePayload = {
    updatedAt: now,
  };

  if (p.location !== undefined) {
    updates.location = p.location as FarmerProfile["location"];
  }
  if (p.landAreaHectares !== undefined) {
    updates.landAreaHectares = p.landAreaHectares as FarmerProfile["landAreaHectares"];
  }
  if (p.soilTexture !== undefined) {
    updates.soilTexture = p.soilTexture as FarmerProfile["soilTexture"];
  }
  if (p.irrigationAvailable !== undefined) {
    updates.irrigationAvailable = p.irrigationAvailable as FarmerProfile["irrigationAvailable"];
  }
  if (p.irrigationSource !== undefined) {
    updates.irrigationSource = p.irrigationSource as FarmerProfile["irrigationSource"];
  }
  if (p.currentCrops !== undefined) {
    updates.currentCrops = p.currentCrops as FarmerProfile["currentCrops"];
  }
  if (p.farmingGoals !== undefined) {
    updates.farmingGoals = p.farmingGoals as FarmerProfile["farmingGoals"];
  }

  const updateResult = farmerProfileStore.update(profileId, updates);
  if (!updateResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: updateResult.error,
          message: updateResult.message,
        },
      },
      { status: updateResult.error === "PROFILE_NOT_FOUND" ? 404 : 400 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      data: updateResult.profile,
    },
    { status: 200 }
  );
}

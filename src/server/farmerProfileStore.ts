/**
 * Farmer Profile Server-Side In-Memory Repository
 *
 * Provides isolated, in-memory CRUD operations for canonical FarmerProfile entities.
 *
 * ARCHITECTURAL CONSTRAINTS & GUARANTEES:
 * 1. Singleton In-Memory Storage: Uses a Map attached to globalThis to survive
 *    Next.js hot module reloading (HMR) during local development.
 * 2. ID Generation Invariant: NEVER generates profile IDs in this repository.
 *    The calling service/handler must generate and supply the server-issued profileId.
 * 3. Immutability Invariant: `profileId` and `createdAt` are immutable once created;
 *    updates explicitly guard against mutation of these fields.
 * 4. Atomic Patch: PATCH updates preserve all omitted fields and refresh `updatedAt`.
 * 5. Isolation: Independent of Next.js HTTP request/response handlers.
 * 6. Non-Durability Warning: In-memory persistence is ephemeral and NOT durable
 *    across server restarts, multi-instance clusters, or serverless cold starts.
 *    This will be backed by a persistent database in a future milestone.
 */

import { FarmerProfile } from "@/types";

export type CreateProfileResult =
  | { success: true; profile: FarmerProfile }
  | { success: false; error: "DUPLICATE_PROFILE_ID" | "MISSING_PROFILE_ID" | "INVALID_PAYLOAD"; message: string };

export type UpdateProfileResult =
  | { success: true; profile: FarmerProfile }
  | { success: false; error: "PROFILE_NOT_FOUND" | "INVALID_PAYLOAD"; message: string };

export type ProfileUpdatePayload = Partial<Omit<FarmerProfile, "profileId" | "createdAt">> & {
  updatedAt?: string;
  // Guard against callers inadvertently passing profileId or createdAt
  profileId?: never;
  createdAt?: never;
};

// Safe globalThis singleton pattern for Next.js HMR
const globalForStore = globalThis as unknown as {
  __sproutnikFarmerProfileStoreMap?: Map<string, FarmerProfile>;
};

export class FarmerProfileStore {
  private map: Map<string, FarmerProfile>;

  constructor() {
    if (!globalForStore.__sproutnikFarmerProfileStoreMap) {
      globalForStore.__sproutnikFarmerProfileStoreMap = new Map<string, FarmerProfile>();
    }
    this.map = globalForStore.__sproutnikFarmerProfileStoreMap;
  }

  /**
   * Persists a new canonical FarmerProfile.
   *
   * Rejects if profileId is missing, empty, or already exists in the store.
   * Clones the profile on storage to ensure callers cannot mutate internal state.
   */
  public create(profile: FarmerProfile): CreateProfileResult {
    if (!profile || typeof profile !== "object") {
      return {
        success: false,
        error: "INVALID_PAYLOAD",
        message: "Profile payload must be a non-null object.",
      };
    }

    if (!profile.profileId || typeof profile.profileId !== "string" || profile.profileId.trim() === "") {
      return {
        success: false,
        error: "MISSING_PROFILE_ID",
        message: "A non-empty profileId must be generated and provided by the caller before creating a profile.",
      };
    }

    const id = profile.profileId.trim();

    if (this.map.has(id)) {
      return {
        success: false,
        error: "DUPLICATE_PROFILE_ID",
        message: `A profile with ID "${id}" already exists.`,
      };
    }

    // Defensive clone on storage
    const stored = structuredClone(profile);
    this.map.set(id, stored);

    return {
      success: true,
      profile: structuredClone(stored),
    };
  }

  /**
   * Retrieves a FarmerProfile by ID. Returns null if not found.
   */
  public getById(profileId: string): FarmerProfile | null {
    if (!profileId || typeof profileId !== "string") {
      return null;
    }

    const existing = this.map.get(profileId.trim());
    if (!existing) {
      return null;
    }

    return structuredClone(existing);
  }

  /**
   * Applies a partial update to an existing FarmerProfile.
   *
   * Guarantees:
   * - Omitted fields in `updates` are preserved.
   * - `profileId` and `createdAt` cannot be modified by updates.
   * - Refreshes `updatedAt` with provided timestamp or current ISO string.
   */
  public update(profileId: string, updates: ProfileUpdatePayload): UpdateProfileResult {
    if (!profileId || typeof profileId !== "string") {
      return {
        success: false,
        error: "PROFILE_NOT_FOUND",
        message: "Invalid or empty profileId provided.",
      };
    }

    const id = profileId.trim();
    const existing = this.map.get(id);

    if (!existing) {
      return {
        success: false,
        error: "PROFILE_NOT_FOUND",
        message: `Profile with ID "${id}" not found.`,
      };
    }

    if (!updates || typeof updates !== "object") {
      return {
        success: false,
        error: "INVALID_PAYLOAD",
        message: "Update payload must be a non-null object.",
      };
    }

    // Extract safe fields from updates, discarding any attempt to overwrite profileId or createdAt
    const safeUpdates: Partial<FarmerProfile> = { ...updates };
    delete (safeUpdates as Record<string, unknown>).profileId;
    delete (safeUpdates as Record<string, unknown>).createdAt;

    const merged: FarmerProfile = {
      ...existing,
      ...safeUpdates,
      // Immutable invariants
      profileId: existing.profileId,
      createdAt: existing.createdAt,
      updatedAt: updates.updatedAt || new Date().toISOString(),
    };

    this.map.set(id, merged);

    return {
      success: true,
      profile: structuredClone(merged),
    };
  }

  /**
   * Deletes a profile by ID. Returns true if removed, false if not found.
   */
  public delete(profileId: string): boolean {
    if (!profileId || typeof profileId !== "string") return false;
    return this.map.delete(profileId.trim());
  }

  /**
   * Clears all stored profiles. Used primarily for test isolation.
   */
  public clear(): void {
    this.map.clear();
  }

  /**
   * Returns count of stored profiles.
   */
  public count(): number {
    return this.map.size;
  }
}

/** Singleton instance exported for server handlers */
export const farmerProfileStore = new FarmerProfileStore();

/**
 * Farmer Profile Lifecycle & Recovery Engine
 *
 * Implements a resilient client-server lifecycle management layer for Sproutnik farmer profiles:
 *
 * GUARANTEES:
 * 1. Safe Initialization: Inspects localStorage for existing profile envelopes.
 * 2. Non-Intrusive Empty State: If no profile exists, leaves the system in 'no_profile' state.
 * 3. Server Verification: If a cached profile exists, verifies identity via GET /api/farmer-profile/[profileId].
 * 4. Automatic 404 Recovery: If the server returns 404 PROFILE_NOT_FOUND (e.g. after a backend process restart),
 *    automatically re-registers the profile with valid canonical fields via POST /api/farmer-profile.
 * 5. Identity Rotation: Seamlessly replaces the stale client profileId with the newly issued server UUID v4.
 * 6. Non-Destructive Offline Handling: Network outages (NETWORK_REQUEST_FAILED) and 5xx server errors do NOT
 *    trigger recreation; cached data is preserved in an 'offline' state.
 * 7. Concurrency Protection: Concurrent initialization calls share a single in-flight promise to avoid
 *    duplicate profile creation.
 * 8. Transparency: Unsynchronized or failed recreation states are explicitly flagged; never falsely claims sync.
 */

import {
  ApiResponse,
  FarmerProfile,
} from "@/types";
import {
  readProfileEnvelope,
  writeProfileEnvelope,
  clearProfileEnvelope,
  StoredProfileEnvelope,
  StorageReadResult,
  StorageWriteResult,
} from "./profileStorage";
import {
  fetchFarmerProfileApi,
  createFarmerProfileApi,
  updateFarmerProfileApi,
  CreateFarmerProfileInput,
  UpdateFarmerProfileInput,
} from "./api";

export type ProfileSyncStatus =
  | "uninitialized"
  | "synced"
  | "recreated"
  | "offline"
  | "unsynced_error"
  | "no_profile";

export interface ProfileLifecycleState {
  profile: FarmerProfile | null;
  profileId: string | null;
  syncStatus: ProfileSyncStatus;
  isSynchronized: boolean;
  error: { code: string; message: string } | null;
  recoveryOccurred: boolean;
  lastSyncTimestamp: string | null;
}

export interface ProfileLifecycleDependencies {
  readEnvelope?: () => StorageReadResult<FarmerProfile>;
  writeEnvelope?: (envelope: StoredProfileEnvelope<FarmerProfile>) => StorageWriteResult;
  clearEnvelope?: () => boolean;
  fetchProfile?: (profileId: string) => Promise<ApiResponse<FarmerProfile>>;
  createProfile?: (input: CreateFarmerProfileInput) => Promise<ApiResponse<FarmerProfile>>;
  updateProfile?: (
    profileId: string,
    updates: UpdateFarmerProfileInput
  ) => Promise<ApiResponse<FarmerProfile>>;
}

export const INITIAL_LIFECYCLE_STATE: Readonly<ProfileLifecycleState> = {
  profile: null,
  profileId: null,
  syncStatus: "uninitialized",
  isSynchronized: false,
  error: null,
  recoveryOccurred: false,
  lastSyncTimestamp: null,
};

let inFlightInitPromise: Promise<ProfileLifecycleState> | null = null;
let currentLifecycleState: ProfileLifecycleState = { ...INITIAL_LIFECYCLE_STATE };

/**
 * Validates that a cached profile contains the mandatory canonical fields needed for recreation.
 */
function hasRequiredCanonicalFields(profile: unknown): profile is FarmerProfile {
  if (!profile || typeof profile !== "object") return false;
  const p = profile as Partial<FarmerProfile>;

  return (
    Boolean(p.location && typeof p.location === "object" && "status" in p.location) &&
    Boolean(p.landAreaHectares && typeof p.landAreaHectares === "object" && "status" in p.landAreaHectares) &&
    Boolean(p.soilTexture && typeof p.soilTexture === "object" && "status" in p.soilTexture) &&
    Boolean(p.irrigationAvailable && typeof p.irrigationAvailable === "object" && "status" in p.irrigationAvailable) &&
    Boolean(p.irrigationSource && typeof p.irrigationSource === "object" && "status" in p.irrigationSource) &&
    Boolean(p.currentCrops && typeof p.currentCrops === "object" && "status" in p.currentCrops) &&
    Boolean(p.farmingGoals && typeof p.farmingGoals === "object" && "status" in p.farmingGoals)
  );
}

/**
 * Extracts pure canonical creation fields from an existing FarmerProfile,
 * stripping client-controlled identity and timestamps.
 */
export function extractCanonicalCreationPayload(profile: FarmerProfile): CreateFarmerProfileInput {
  return {
    location: profile.location,
    landAreaHectares: profile.landAreaHectares,
    soilTexture: profile.soilTexture,
    irrigationAvailable: profile.irrigationAvailable,
    irrigationSource: profile.irrigationSource,
    currentCrops: profile.currentCrops,
    farmingGoals: profile.farmingGoals,
  };
}

/**
 * Internal execution of profile initialization and recovery.
 */
async function executeInitialization(
  deps: ProfileLifecycleDependencies = {}
): Promise<ProfileLifecycleState> {
  const readEnvelope = deps.readEnvelope ?? readProfileEnvelope;
  const writeEnvelope = deps.writeEnvelope ?? writeProfileEnvelope;
  const fetchProfile = deps.fetchProfile ?? fetchFarmerProfileApi;
  const createProfile = deps.createProfile ?? createFarmerProfileApi;

  // 1. Read stored envelope from localStorage
  const readResult = readEnvelope();

  // 2. If no profile exists, preserve existing clean state
  if (!readResult.success) {
    if (readResult.reason === "NO_STORED_PROFILE") {
      currentLifecycleState = {
        profile: null,
        profileId: null,
        syncStatus: "no_profile",
        isSynchronized: false,
        error: null,
        recoveryOccurred: false,
        lastSyncTimestamp: null,
      };
      return currentLifecycleState;
    }

    // Invalid or corrupted envelope
    currentLifecycleState = {
      profile: null,
      profileId: null,
      syncStatus: "unsynced_error",
      isSynchronized: false,
      error: {
        code: readResult.reason,
        message: "Cached farmer profile envelope is invalid or corrupted.",
      },
      recoveryOccurred: false,
      lastSyncTimestamp: null,
    };
    return currentLifecycleState;
  }

  const { envelope } = readResult;
  const cachedProfile = envelope.profile;
  const cachedProfileId = envelope.profileId;

  // 3. Verification: Attempt to retrieve existing profile from server
  const fetchResult = await fetchProfile(cachedProfileId);

  // 4. Success: Server holds canonical profile
  if (fetchResult.success) {
    const canonicalProfile = fetchResult.data;
    const now = new Date().toISOString();

    // Refresh localStorage cache with canonical server state
    writeEnvelope({
      schemaVersion: 1,
      profileId: canonicalProfile.profileId,
      profile: canonicalProfile,
      savedAt: now,
    });

    currentLifecycleState = {
      profile: canonicalProfile,
      profileId: canonicalProfile.profileId,
      syncStatus: "synced",
      isSynchronized: true,
      error: null,
      recoveryOccurred: false,
      lastSyncTimestamp: now,
    };
    return currentLifecycleState;
  }

  // 5. Profile was NOT found on server (e.g. backend process restart cleared in-memory store)
  const is404 =
    fetchResult.error.code === "PROFILE_NOT_FOUND" ||
    fetchResult.error.message.toLowerCase().includes("not found");

  if (is404) {
    // Check that the cached profile is valid for recreation
    if (!hasRequiredCanonicalFields(cachedProfile)) {
      currentLifecycleState = {
        profile: cachedProfile,
        profileId: cachedProfileId,
        syncStatus: "unsynced_error",
        isSynchronized: false,
        error: {
          code: "CORRUPT_CACHED_PROFILE",
          message: "Cached profile is missing canonical fields required for automatic recreation.",
        },
        recoveryOccurred: false,
        lastSyncTimestamp: null,
      };
      return currentLifecycleState;
    }

    // 5a. Automatic Recovery: Recreate profile using valid canonical fields
    const creationPayload = extractCanonicalCreationPayload(cachedProfile);
    const createResult = await createProfile(creationPayload);

    if (createResult.success) {
      const newCanonicalProfile = createResult.data;
      const now = new Date().toISOString();

      // 6. Save newly returned server-issued UUID and profile to localStorage
      writeEnvelope({
        schemaVersion: 1,
        profileId: newCanonicalProfile.profileId,
        profile: newCanonicalProfile,
        savedAt: now,
      });

      currentLifecycleState = {
        profile: newCanonicalProfile,
        profileId: newCanonicalProfile.profileId,
        syncStatus: "recreated",
        isSynchronized: true,
        error: null,
        recoveryOccurred: true,
        lastSyncTimestamp: now,
      };
      return currentLifecycleState;
    }

    // Recreation failed: retain cached data, but clearly expose error state
    currentLifecycleState = {
      profile: cachedProfile,
      profileId: cachedProfileId,
      syncStatus: "unsynced_error",
      isSynchronized: false,
      error: {
        code: createResult.error.code,
        message: `Profile was lost on backend and automatic recreation failed: ${createResult.error.message}`,
      },
      recoveryOccurred: false,
      lastSyncTimestamp: null,
    };
    return currentLifecycleState;
  }

  // 7. Non-404 failure (Network failure, 5xx server error, etc.):
  // NEVER recreate profile on arbitrary network errors or server downtime.
  const isNetworkFailure = fetchResult.error.code === "NETWORK_REQUEST_FAILED";

  currentLifecycleState = {
    profile: cachedProfile,
    profileId: cachedProfileId,
    syncStatus: isNetworkFailure ? "offline" : "unsynced_error",
    isSynchronized: false,
    error: fetchResult.error,
    recoveryOccurred: false,
    lastSyncTimestamp: envelope.savedAt,
  };
  return currentLifecycleState;
}

/**
 * Initializes the farmer profile lifecycle.
 * Protects against duplicate concurrent executions using an in-flight promise lock.
 */
export async function initializeProfileLifecycle(
  deps?: ProfileLifecycleDependencies
): Promise<ProfileLifecycleState> {
  if (inFlightInitPromise) {
    return inFlightInitPromise;
  }

  inFlightInitPromise = executeInitialization(deps).finally(() => {
    inFlightInitPromise = null;
  });

  return inFlightInitPromise;
}

/**
 * Updates the active farmer profile atomically via PATCH /api/farmer-profile/[profileId].
 * Always uses the active server-issued profileId (including any rotated ID after recovery).
 */
export async function updateActiveProfile(
  updates: UpdateFarmerProfileInput,
  deps: ProfileLifecycleDependencies = {}
): Promise<ProfileLifecycleState> {
  const writeEnvelope = deps.writeEnvelope ?? writeProfileEnvelope;
  const updateProfile = deps.updateProfile ?? updateFarmerProfileApi;

  if (!currentLifecycleState.profileId) {
    currentLifecycleState = {
      ...currentLifecycleState,
      syncStatus: "unsynced_error",
      isSynchronized: false,
      error: {
        code: "NO_ACTIVE_PROFILE_ID",
        message: "Cannot update profile: no server-issued profileId is available.",
      },
    };
    return currentLifecycleState;
  }

  const result = await updateProfile(currentLifecycleState.profileId, updates);

  if (result.success) {
    const updatedProfile = result.data;
    const now = new Date().toISOString();

    writeEnvelope({
      schemaVersion: 1,
      profileId: updatedProfile.profileId,
      profile: updatedProfile,
      savedAt: now,
    });

    currentLifecycleState = {
      profile: updatedProfile,
      profileId: updatedProfile.profileId,
      syncStatus: "synced",
      isSynchronized: true,
      error: null,
      recoveryOccurred: currentLifecycleState.recoveryOccurred,
      lastSyncTimestamp: now,
    };
    return currentLifecycleState;
  }

  // Update failed
  currentLifecycleState = {
    ...currentLifecycleState,
    syncStatus: "unsynced_error",
    isSynchronized: false,
    error: result.error,
  };
  return currentLifecycleState;
}

/**
 * Creates a brand new farmer profile via POST /api/farmer-profile.
 */
export async function createActiveProfile(
  input: CreateFarmerProfileInput,
  deps: ProfileLifecycleDependencies = {}
): Promise<ProfileLifecycleState> {
  const writeEnvelope = deps.writeEnvelope ?? writeProfileEnvelope;
  const createProfile = deps.createProfile ?? createFarmerProfileApi;

  const result = await createProfile(input);

  if (result.success) {
    const newProfile = result.data;
    const now = new Date().toISOString();

    writeEnvelope({
      schemaVersion: 1,
      profileId: newProfile.profileId,
      profile: newProfile,
      savedAt: now,
    });

    currentLifecycleState = {
      profile: newProfile,
      profileId: newProfile.profileId,
      syncStatus: "synced",
      isSynchronized: true,
      error: null,
      recoveryOccurred: false,
      lastSyncTimestamp: now,
    };
    return currentLifecycleState;
  }

  currentLifecycleState = {
    ...currentLifecycleState,
    syncStatus: "unsynced_error",
    isSynchronized: false,
    error: result.error,
  };
  return currentLifecycleState;
}

/**
 * Clears the active profile from both memory and localStorage.
 */
export function clearActiveProfile(deps: ProfileLifecycleDependencies = {}): ProfileLifecycleState {
  const clearEnvelope = deps.clearEnvelope ?? clearProfileEnvelope;
  clearEnvelope();

  currentLifecycleState = {
    profile: null,
    profileId: null,
    syncStatus: "no_profile",
    isSynchronized: false,
    error: null,
    recoveryOccurred: false,
    lastSyncTimestamp: null,
  };
  return currentLifecycleState;
}

/**
 * Returns current snapshot of profile lifecycle state (synchronous).
 */
export function getCurrentLifecycleState(): ProfileLifecycleState {
  return { ...currentLifecycleState };
}

/**
 * Test helper to reset internal singleton state.
 */
export function _resetLifecycleStateForTesting(): void {
  currentLifecycleState = { ...INITIAL_LIFECYCLE_STATE };
  inFlightInitPromise = null;
}

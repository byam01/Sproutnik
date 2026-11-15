/**
 * Farmer Profile Client Storage Infrastructure
 *
 * Implements client-side caching for the farmer profile using an explicit, versioned envelope.
 *
 * ARCHITECTURAL BOUNDARIES & RULES:
 * 1. Storage Key: Strictly uses `sproutnik:farmer-profile:v1`.
 * 2. Envelope Schema: Strictly version 1 (`schemaVersion: 1`).
 * 3. Never treat localStorage as authoritative backend state.
 * 4. Do not invent client-side profile IDs: a valid backend-issued or explicit `profileId` is mandatory.
 * 5. Do not write an incomplete draft profile as if it were a finalized backend profile.
 * 6. Graceful failure: QuotaExceededError or disabled storage must never throw uncaught exceptions.
 * 7. Legacy data: Existing `sproutnik_farmer_profile` data must NOT be silently migrated or deleted.
 * 8. Onboarding draft key: Strictly uses `sproutnik:onboarding-draft:v1`.
 */

import { FarmerProfile } from "@/types";

export const PROFILE_STORAGE_KEY = "sproutnik:farmer-profile:v1";
export const LEGACY_PROFILE_STORAGE_KEY = "sproutnik_farmer_profile";
export const ONBOARDING_DRAFT_STORAGE_KEY = "sproutnik:onboarding-draft:v1";

/**
 * Agreed versioned envelope for client-side profile caching.
 */
export interface StoredProfileEnvelope<T = FarmerProfile> {
  schemaVersion: 1;
  profileId: string;
  profile: T;
  savedAt: string;
}

export type StorageReadResult<T = FarmerProfile> =
  | { success: true; envelope: StoredProfileEnvelope<T> }
  | { success: false; reason: "STORAGE_UNAVAILABLE" | "NO_STORED_PROFILE" | "MALFORMED_JSON" | "INVALID_ENVELOPE" };

export type StorageWriteResult =
  | { success: true }
  | { success: false; error: string; code: "STORAGE_UNAVAILABLE" | "INVALID_ENVELOPE" | "QUOTA_EXCEEDED" | "WRITE_ERROR" };

/**
 * Safely verifies if window.localStorage is accessible in the current execution context.
 */
function isLocalStorageAvailable(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return typeof window.localStorage !== "undefined" && window.localStorage !== null;
  } catch {
    return false;
  }
}

/**
 * Validates whether an unknown object matches the StoredProfileEnvelope schema.
 */
export function isValidStoredProfileEnvelope<T>(data: unknown): data is StoredProfileEnvelope<T> {
  if (!data || typeof data !== "object") {
    return false;
  }

  const candidate = data as Partial<StoredProfileEnvelope<T>>;

  if (candidate.schemaVersion !== 1) {
    return false;
  }

  if (typeof candidate.profileId !== "string" || candidate.profileId.trim() === "") {
    return false;
  }

  if (typeof candidate.savedAt !== "string" || isNaN(Date.parse(candidate.savedAt))) {
    return false;
  }

  if (!candidate.profile || typeof candidate.profile !== "object") {
    return false;
  }

  return true;
}

/**
 * Reads and validates the profile envelope from localStorage.
 */
export function readProfileEnvelope<T = FarmerProfile>(): StorageReadResult<T> {
  if (!isLocalStorageAvailable()) {
    return { success: false, reason: "STORAGE_UNAVAILABLE" };
  }

  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
  } catch {
    return { success: false, reason: "STORAGE_UNAVAILABLE" };
  }

  if (!raw) {
    return { success: false, reason: "NO_STORED_PROFILE" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { success: false, reason: "MALFORMED_JSON" };
  }

  if (!isValidStoredProfileEnvelope<T>(parsed)) {
    return { success: false, reason: "INVALID_ENVELOPE" };
  }

  return { success: true, envelope: parsed };
}

/**
 * Writes a validated profile envelope to localStorage.
 *
 * Enforces:
 * - Non-empty, caller-supplied profileId (no client invention).
 * - Full envelope validation before serialization.
 * - Catching quota or security errors without crashing the caller.
 */
export function writeProfileEnvelope<T = FarmerProfile>(
  envelope: StoredProfileEnvelope<T>
): StorageWriteResult {
  if (!isValidStoredProfileEnvelope<T>(envelope)) {
    return {
      success: false,
      code: "INVALID_ENVELOPE",
      error: "The provided envelope does not satisfy StoredProfileEnvelope schema v1 (profileId, savedAt, and valid profile object are mandatory).",
    };
  }

  if (!isLocalStorageAvailable()) {
    return {
      success: false,
      code: "STORAGE_UNAVAILABLE",
      error: "localStorage is not available in the current environment.",
    };
  }

  try {
    const serialized = JSON.stringify(envelope);
    window.localStorage.setItem(PROFILE_STORAGE_KEY, serialized);
    return { success: true };
  } catch (err) {
    const isQuota =
      err instanceof DOMException &&
      (err.name === "QuotaExceededError" || err.name === "NS_ERROR_DOM_QUOTA_REACHED" || err.code === 22);

    return {
      success: false,
      code: isQuota ? "QUOTA_EXCEEDED" : "WRITE_ERROR",
      error: err instanceof Error ? err.message : "Unknown error while writing profile to storage.",
    };
  }
}

/**
 * Clears the stored profile envelope from localStorage.
 */
export function clearProfileEnvelope(): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }
  try {
    window.localStorage.removeItem(PROFILE_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

/**
 * Non-destructive legacy profile inspector.
 *
 * Inspects `sproutnik_farmer_profile` without mutating, removing, or guessing fields.
 * Safe migration requires Developer 1's finalized profile schema.
 */
export interface LegacyProfileInspection {
  found: boolean;
  rawData?: unknown;
  notes: string;
}

export function inspectLegacyProfile(): LegacyProfileInspection {
  if (!isLocalStorageAvailable()) {
    return {
      found: false,
      notes: "localStorage unavailable.",
    };
  }

  try {
    const legacyRaw = window.localStorage.getItem(LEGACY_PROFILE_STORAGE_KEY);
    if (!legacyRaw) {
      return {
        found: false,
        notes: `No legacy profile found at "${LEGACY_PROFILE_STORAGE_KEY}".`,
      };
    }

    let parsed: unknown = null;
    try {
      parsed = JSON.parse(legacyRaw);
    } catch {
      parsed = legacyRaw;
    }

    return {
      found: true,
      rawData: parsed,
      notes:
        "Legacy profile detected. Automatic migration is intentionally blocked to prevent guessing missing canonical fields. Preserved intact for manual or schema-guided migration.",
    };
  } catch (err) {
    return {
      found: false,
      notes: err instanceof Error ? err.message : "Error reading legacy profile key.",
    };
  }
}

// ==========================================
// ==========================================
// Convenience Wrappers for Profile Lifecycle & Frontend Storage
// ==========================================

export function loadStoredProfile(): StoredProfileEnvelope | null {
  const res = readProfileEnvelope();
  return res.success ? res.envelope : null;
}

export function saveStoredProfile(profileId: string, profile: FarmerProfile): boolean {
  const envelope: StoredProfileEnvelope = {
    schemaVersion: 1,
    profileId,
    profile,
    savedAt: new Date().toISOString(),
  };
  const res = writeProfileEnvelope(envelope);
  return res.success;
}

export function clearStoredProfile(): boolean {
  return clearProfileEnvelope();
}

// ==========================================
// Onboarding Draft Storage Infrastructure
// ==========================================

let memoryDraftCache: OnboardingDraftEnvelope | null = null;

export interface OnboardingDraftRawState {
  mode?: string;
  currentStepIndex?: number;
  landUnit?: string;
  isDemonstrationLocation?: boolean;
}

export interface OnboardingDraftEnvelope {
  schemaVersion: 1;
  draft: FarmerProfile;
  rawState?: OnboardingDraftRawState;
  savedAt: string;
}

export function isValidOnboardingDraftEnvelope(data: unknown): data is OnboardingDraftEnvelope {
  if (!data || typeof data !== "object") return false;
  const candidate = data as Partial<OnboardingDraftEnvelope>;
  if (candidate.schemaVersion !== 1) return false;
  if (typeof candidate.savedAt !== "string" || isNaN(Date.parse(candidate.savedAt))) return false;
  if (!candidate.draft || typeof candidate.draft !== "object") return false;
  return true;
}

export function loadOnboardingDraft(): OnboardingDraftEnvelope | null {
  if (!isLocalStorageAvailable()) {
    return memoryDraftCache;
  }
  try {
    const raw = window.localStorage.getItem(ONBOARDING_DRAFT_STORAGE_KEY);
    if (!raw) return memoryDraftCache;
    const parsed = JSON.parse(raw);
    if (isValidOnboardingDraftEnvelope(parsed)) {
      memoryDraftCache = parsed;
      return parsed;
    }
    return memoryDraftCache;
  } catch {
    return memoryDraftCache;
  }
}

export function saveOnboardingDraft(
  draft: FarmerProfile,
  rawState?: OnboardingDraftRawState
): boolean {
  if (!draft || typeof draft !== "object") {
    return false;
  }

  const envelope: OnboardingDraftEnvelope = {
    schemaVersion: 1,
    draft,
    rawState,
    savedAt: new Date().toISOString(),
  };

  memoryDraftCache = envelope;

  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    const serialized = JSON.stringify(envelope);
    window.localStorage.setItem(ONBOARDING_DRAFT_STORAGE_KEY, serialized);
    return true;
  } catch {
    return false;
  }
}

export function clearOnboardingDraft(): boolean {
  memoryDraftCache = null;
  if (!isLocalStorageAvailable()) return false;
  try {
    window.localStorage.removeItem(ONBOARDING_DRAFT_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

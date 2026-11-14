/**
 * Onboarding and Farmer Profile Field Types
 *
 * Implements the approved ProfileField tri-state / multi-state status union
 * for farmer onboarding and progressive profile refinement.
 *
 * ARCHITECTURAL INTEGRITY RULES:
 * 1. The 4 states ("known", "unknown", "skipped", "not_provided") MUST remain strictly distinguishable.
 * 2. Never replace ProfileField with raw nullable/optional primitives.
 * 3. Never silently convert unknown, skipped, or not_provided states into known values.
 * 4. Never insert regional fallback defaults as if they were farmer-confirmed values.
 * 5. Keep demonstration data distinguishable from farmer-provided data (via the source attribute).
 * 6. The canonical backend FarmerProfile is maintained by Developer 1; this file does NOT finalize
 *    or override canonical backend structures.
 */

export type ProfileFieldSource = "user" | "imported" | "verified";

export type ProfileFieldStatus = "known" | "unknown" | "skipped" | "not_provided";

/**
 * Approved canonical ProfileField union representing the provenance and confirmation
 * state of any individual farmer profile attribute.
 */
export type ProfileField<T> =
  | {
      status: "known";
      value: NonNullable<T>;
      updatedAt?: string;
      source?: ProfileFieldSource;
    }
  | { status: "unknown" }
  | { status: "skipped" }
  | { status: "not_provided" };

// ==========================================
// Field Constructor and Predicate Helpers
// ==========================================

/**
 * Creates a confirmed 'known' profile field with optional provenance source and timestamp.
 */
export function createKnownField<T>(
  value: NonNullable<T>,
  source: ProfileFieldSource = "user",
  updatedAt: string = new Date().toISOString()
): ProfileField<T> {
  return {
    status: "known",
    value,
    updatedAt,
    source,
  };
}

/**
 * Creates an 'unknown' profile field (the farmer has not yet encountered or decided on this question).
 */
export function createUnknownField<T = unknown>(): ProfileField<T> {
  return { status: "unknown" };
}

/**
 * Creates a 'skipped' profile field (the farmer explicitly chose to skip answering).
 */
export function createSkippedField<T = unknown>(): ProfileField<T> {
  return { status: "skipped" };
}

/**
 * Creates a 'not_provided' profile field (the field was presented or requested but not supplied).
 */
export function createNotProvidedField<T = unknown>(): ProfileField<T> {
  return { status: "not_provided" };
}

/**
 * Type guard for 'known' fields containing verified or user-provided values.
 */
export function isKnownField<T>(
  field: ProfileField<T>
): field is {
  status: "known";
  value: NonNullable<T>;
  updatedAt?: string;
  source?: ProfileFieldSource;
} {
  return field.status === "known" && "value" in field && field.value !== null && field.value !== undefined;
}

/**
 * Type guard for 'unknown' fields.
 */
export function isUnknownField<T>(field: ProfileField<T>): field is { status: "unknown" } {
  return field.status === "unknown";
}

/**
 * Type guard for 'skipped' fields.
 */
export function isSkippedField<T>(field: ProfileField<T>): field is { status: "skipped" } {
  return field.status === "skipped";
}

/**
 * Type guard for 'not_provided' fields.
 */
export function isNotProvidedField<T>(field: ProfileField<T>): field is { status: "not_provided" } {
  return field.status === "not_provided";
}

/**
 * Checks whether a field was directly confirmed by the farmer (as opposed to imported or unknown).
 */
export function isFarmerConfirmed<T>(field: ProfileField<T>): boolean {
  return isKnownField(field) && field.source === "user";
}

/**
 * Safely extracts the value of a ProfileField if known, or returns undefined without mutating status.
 * Crucially, does NOT insert a default value into the profile state.
 */
export function getKnownValueOrUndefined<T>(field: ProfileField<T>): NonNullable<T> | undefined {
  if (isKnownField(field)) {
    return field.value;
  }
  return undefined;
}

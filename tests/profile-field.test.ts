import { describe, it, expect } from "vitest";
import {
  ProfileField,
  createKnownField,
  createUnknownField,
  createSkippedField,
  createNotProvidedField,
  isKnownField,
  isUnknownField,
  isSkippedField,
  isNotProvidedField,
  isFarmerConfirmed,
  getKnownValueOrUndefined,
} from "../src/types/onboarding";

describe("ProfileField Status Preservation & Provenance", () => {
  describe("Tri-State / Multi-State Distinction", () => {
    it("maintains distinct representation for all 4 states", () => {
      const knownField = createKnownField("loam", "user");
      const unknownField = createUnknownField<string>();
      const skippedField = createSkippedField<string>();
      const notProvidedField = createNotProvidedField<string>();

      expect(knownField.status).toBe("known");
      expect(unknownField.status).toBe("unknown");
      expect(skippedField.status).toBe("skipped");
      expect(notProvidedField.status).toBe("not_provided");

      // Verify all 4 are distinguishable and not collapsed
      const statuses = [knownField.status, unknownField.status, skippedField.status, notProvidedField.status];
      const uniqueStatuses = new Set(statuses);
      expect(uniqueStatuses.size).toBe(4);
    });

    it("never silently converts unknown, skipped, or not_provided into known values", () => {
      const unknown = createUnknownField<string>();
      const skipped = createSkippedField<string>();
      const notProvided = createNotProvidedField<string>();

      expect(getKnownValueOrUndefined(unknown)).toBeUndefined();
      expect(getKnownValueOrUndefined(skipped)).toBeUndefined();
      expect(getKnownValueOrUndefined(notProvided)).toBeUndefined();

      // Ensure no default value was injected
      expect(unknown.status).toBe("unknown");
      expect(skipped.status).toBe("skipped");
      expect(notProvided.status).toBe("not_provided");
    });

    it("extracts known values accurately without mutating", () => {
      const field = createKnownField(2.5, "user");
      expect(getKnownValueOrUndefined(field)).toBe(2.5);
      expect(isKnownField(field)).toBe(true);
    });
  });

  describe("Provenance Source Verification", () => {
    it("distinguishes farmer-confirmed data from imported or demonstration data", () => {
      const farmerField = createKnownField("canal", "user");
      const importedDemoField = createKnownField("tubewell_deep", "imported");
      const verifiedExtensionField = createKnownField("sandy_loam", "verified");

      expect(isFarmerConfirmed(farmerField)).toBe(true);
      expect(isFarmerConfirmed(importedDemoField)).toBe(false);
      expect(isFarmerConfirmed(verifiedExtensionField)).toBe(false);

      if (isKnownField(farmerField)) {
        expect(farmerField.source).toBe("user");
      }
      if (isKnownField(importedDemoField)) {
        expect(importedDemoField.source).toBe("imported");
      }
      if (isKnownField(verifiedExtensionField)) {
        expect(verifiedExtensionField.source).toBe("verified");
      }
    });
  });

  describe("Serialization Round-Trip and State Preservation", () => {
    it("preserves all 4 field statuses across JSON serialization round-trips", () => {
      interface DraftProfile {
        soilTexture: ProfileField<string>;
        landAreaHectares: ProfileField<number>;
        irrigationSource: ProfileField<string>;
        groundwaterDepthMeters: ProfileField<number>;
      }

      const draft: DraftProfile = {
        soilTexture: createKnownField("clay_loam", "user"),
        landAreaHectares: createSkippedField(),
        irrigationSource: createUnknownField(),
        groundwaterDepthMeters: createNotProvidedField(),
      };

      const serialized = JSON.stringify(draft);
      const deserialized = JSON.parse(serialized) as DraftProfile;

      expect(deserialized.soilTexture.status).toBe("known");
      if (deserialized.soilTexture.status === "known") {
        expect(deserialized.soilTexture.value).toBe("clay_loam");
        expect(deserialized.soilTexture.source).toBe("user");
      }

      expect(deserialized.landAreaHectares.status).toBe("skipped");
      expect(deserialized.irrigationSource.status).toBe("unknown");
      expect(deserialized.groundwaterDepthMeters.status).toBe("not_provided");
    });
  });

  describe("Type Guard Accuracy", () => {
    it("evaluates type guards correctly for each state", () => {
      const known = createKnownField("test", "user");
      const unknown = createUnknownField();
      const skipped = createSkippedField();
      const notProvided = createNotProvidedField();

      expect(isKnownField(known)).toBe(true);
      expect(isKnownField(unknown)).toBe(false);

      expect(isUnknownField(unknown)).toBe(true);
      expect(isUnknownField(skipped)).toBe(false);

      expect(isSkippedField(skipped)).toBe(true);
      expect(isSkippedField(notProvided)).toBe(false);

      expect(isNotProvidedField(notProvided)).toBe(true);
      expect(isNotProvidedField(known)).toBe(false);
    });
  });

  describe("Canonical FarmerProfile Contract Conformance", () => {
    it("constructs a valid canonical FarmerProfile with ProfileFields", () => {
      const canonicalProfile = {
        profileId: "profile_pau_demo_01",
        location: createKnownField({
          latitude: 30.9,
          longitude: 75.85,
          district: "Ludhiana",
          countryCode: "IN",
          selectionMethod: "gps" as const,
        }),
        landAreaHectares: createKnownField(2.5),
        soilTexture: createKnownField("loam" as const),
        irrigationAvailable: createKnownField(true),
        irrigationSource: createKnownField("tubewell_deep" as const),
        currentCrops: createKnownField(["paddy_transplanted", "bread_wheat"]),
        farmingGoals: createKnownField(["reduce_water_usage" as const, "improve_soil_health" as const]),
        createdAt: "2026-11-14T12:00:00.000Z",
        updatedAt: "2026-11-14T12:00:00.000Z",
      };

      expect(canonicalProfile.profileId).toBe("profile_pau_demo_01");
      expect(canonicalProfile.landAreaHectares.status).toBe("known");
      expect(isKnownField(canonicalProfile.landAreaHectares)).toBe(true);
      if (isKnownField(canonicalProfile.farmingGoals)) {
        expect(canonicalProfile.farmingGoals.value).toContain("reduce_water_usage");
      }
    });
  });
});

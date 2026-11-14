import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  readProfileEnvelope,
  writeProfileEnvelope,
  clearProfileEnvelope,
  inspectLegacyProfile,
  isValidStoredProfileEnvelope,
  PROFILE_STORAGE_KEY,
  LEGACY_PROFILE_STORAGE_KEY,
  StoredProfileEnvelope,
} from "../src/services/profileStorage";
import { FarmerProfile } from "../src/types";

// Mock localStorage in Vitest Node environment
class MockLocalStorage {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }
}

describe("Farmer Profile Client Storage Infrastructure", () => {
  let mockStorage: MockLocalStorage;

  const validProfile: FarmerProfile = {
    location: { latitude: 30.9, longitude: 75.85, name: "Ludhiana" },
    landAreaAcres: 5,
    soilTexture: "loam",
    irrigationSource: "tubewell_deep",
    groundwaterDepthMeters: 28.5,
    riskTolerance: "conservative",
  };

  const validEnvelope: StoredProfileEnvelope = {
    schemaVersion: 1,
    profileId: "profile_ludhiana_001",
    profile: validProfile,
    savedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    mockStorage = new MockLocalStorage();
    vi.stubGlobal("window", {
      localStorage: mockStorage,
    });
  });

  describe("Validation of Envelope Schema", () => {
    it("validates a fully conforming StoredProfileEnvelope", () => {
      expect(isValidStoredProfileEnvelope(validEnvelope)).toBe(true);
    });

    it("rejects envelopes with unsupported schemaVersion", () => {
      const wrongVersion = { ...validEnvelope, schemaVersion: 2 };
      expect(isValidStoredProfileEnvelope(wrongVersion)).toBe(false);
    });

    it("rejects envelopes missing profileId or with empty string", () => {
      expect(isValidStoredProfileEnvelope({ ...validEnvelope, profileId: "" })).toBe(false);
      expect(isValidStoredProfileEnvelope({ ...validEnvelope, profileId: "   " })).toBe(false);
    });

    it("rejects envelopes missing savedAt or with invalid date string", () => {
      expect(isValidStoredProfileEnvelope({ ...validEnvelope, savedAt: "invalid-date" })).toBe(false);
      expect(isValidStoredProfileEnvelope({ ...validEnvelope, savedAt: "" })).toBe(false);
    });

    it("rejects envelopes without a valid profile object", () => {
      expect(isValidStoredProfileEnvelope({ ...validEnvelope, profile: null })).toBe(false);
      expect(isValidStoredProfileEnvelope({ ...validEnvelope, profile: undefined })).toBe(false);
      expect(isValidStoredProfileEnvelope({ ...validEnvelope, profile: "not-an-object" })).toBe(false);
    });
  });

  describe("Read and Write Lifecycle", () => {
    it("writes and reads back a valid profile envelope", () => {
      const writeResult = writeProfileEnvelope(validEnvelope);
      expect(writeResult.success).toBe(true);

      const readResult = readProfileEnvelope();
      expect(readResult.success).toBe(true);
      if (readResult.success) {
        expect(readResult.envelope.schemaVersion).toBe(1);
        expect(readResult.envelope.profileId).toBe("profile_ludhiana_001");
        expect(readResult.envelope.profile.soilTexture).toBe("loam");
        expect(readResult.envelope.profile.landAreaAcres).toBe(5);
      }
    });

    it("clears stored profile envelope successfully", () => {
      writeProfileEnvelope(validEnvelope);
      expect(readProfileEnvelope().success).toBe(true);

      const cleared = clearProfileEnvelope();
      expect(cleared).toBe(true);

      const readAfter = readProfileEnvelope();
      expect(readAfter.success).toBe(false);
      if (!readAfter.success) {
        expect(readAfter.reason).toBe("NO_STORED_PROFILE");
      }
    });

    it("rejects writing an envelope with missing profileId (never invent profileId)", () => {
      const invalid = { ...validEnvelope, profileId: "" };
      const res = writeProfileEnvelope(invalid as unknown as StoredProfileEnvelope);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.code).toBe("INVALID_ENVELOPE");
      }
    });
  });

  describe("Error and Resilience Handling", () => {
    it("returns MALFORMED_JSON when stored data is corrupt JSON", () => {
      mockStorage.setItem(PROFILE_STORAGE_KEY, "{ corrupted json ::: ");
      const res = readProfileEnvelope();
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.reason).toBe("MALFORMED_JSON");
      }
    });

    it("returns INVALID_ENVELOPE when stored data does not match envelope schema", () => {
      mockStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({ someRandomField: true }));
      const res = readProfileEnvelope();
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.reason).toBe("INVALID_ENVELOPE");
      }
    });

    it("handles QuotaExceededError gracefully without throwing", () => {
      vi.spyOn(mockStorage, "setItem").mockImplementation(() => {
        const domException = new DOMException("Quota exceeded", "QuotaExceededError");
        throw domException;
      });

      const writeResult = writeProfileEnvelope(validEnvelope);
      expect(writeResult.success).toBe(false);
      if (!writeResult.success) {
        expect(writeResult.code).toBe("QUOTA_EXCEEDED");
      }
    });

    it("handles unavailable localStorage gracefully (SSR / security exception)", () => {
      vi.stubGlobal("window", undefined);

      const readRes = readProfileEnvelope();
      expect(readRes.success).toBe(false);
      if (!readRes.success) {
        expect(readRes.reason).toBe("STORAGE_UNAVAILABLE");
      }

      const writeRes = writeProfileEnvelope(validEnvelope);
      expect(writeRes.success).toBe(false);
      if (!writeRes.success) {
        expect(writeRes.code).toBe("STORAGE_UNAVAILABLE");
      }

      const clearRes = clearProfileEnvelope();
      expect(clearRes).toBe(false);
    });
  });

  describe("Legacy Profile Inspection", () => {
    it("reports not found when legacy key does not exist", () => {
      const inspection = inspectLegacyProfile();
      expect(inspection.found).toBe(false);
    });

    it("inspects legacy profile data non-destructively without mutating or deleting it", () => {
      const legacyData = {
        name: "Test Farmer",
        acres: 4,
        district: "Ludhiana",
      };
      mockStorage.setItem(LEGACY_PROFILE_STORAGE_KEY, JSON.stringify(legacyData));

      const inspection = inspectLegacyProfile();
      expect(inspection.found).toBe(true);
      expect(inspection.rawData).toEqual(legacyData);

      // Verify the legacy key was NOT cleared or mutated
      expect(mockStorage.getItem(LEGACY_PROFILE_STORAGE_KEY)).toBe(JSON.stringify(legacyData));
      // Verify new profile storage was NOT touched
      expect(mockStorage.getItem(PROFILE_STORAGE_KEY)).toBeNull();
    });
  });
});

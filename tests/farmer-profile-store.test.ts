import { describe, it, expect, beforeEach } from "vitest";
import { FarmerProfileStore } from "../src/server/farmerProfileStore";
import { createKnownField, createUnknownField, FarmerProfile } from "../src/types";

describe("FarmerProfileStore (In-Memory Server Repository)", () => {
  let store: FarmerProfileStore;

  const sampleProfile: FarmerProfile = {
    profileId: "profile_test_101",
    location: createKnownField({
      latitude: 30.9,
      longitude: 75.85,
      district: "Ludhiana",
      countryCode: "IN",
      selectionMethod: "gps",
    }),
    landAreaHectares: createKnownField(3.5),
    soilTexture: createKnownField("loam"),
    irrigationAvailable: createKnownField(true),
    irrigationSource: createKnownField("tubewell_deep"),
    currentCrops: createKnownField(["paddy_transplanted", "bread_wheat"]),
    farmingGoals: createKnownField(["reduce_water_usage", "improve_soil_health"]),
    createdAt: "2026-11-14T10:00:00.000Z",
    updatedAt: "2026-11-14T10:00:00.000Z",
  };

  beforeEach(() => {
    store = new FarmerProfileStore();
    store.clear();
  });

  describe("Create Operations", () => {
    it("creates and retrieves a canonical FarmerProfile", () => {
      const res = store.create(sampleProfile);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.profile.profileId).toBe("profile_test_101");
        expect(res.profile.landAreaHectares.status).toBe("known");
      }

      const retrieved = store.getById("profile_test_101");
      expect(retrieved).not.toBeNull();
      expect(retrieved?.profileId).toBe("profile_test_101");
    });

    it("rejects creation with duplicate profileId", () => {
      const first = store.create(sampleProfile);
      expect(first.success).toBe(true);

      const second = store.create(sampleProfile);
      expect(second.success).toBe(false);
      if (!second.success) {
        expect(second.error).toBe("DUPLICATE_PROFILE_ID");
      }
    });

    it("rejects creation if profileId is missing or empty", () => {
      const invalid = { ...sampleProfile, profileId: "" };
      const res = store.create(invalid);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toBe("MISSING_PROFILE_ID");
      }
    });

    it("defensively clones objects so caller mutations do not alter repository state", () => {
      const mutableProfile = structuredClone(sampleProfile);
      store.create(mutableProfile);

      // Mutate caller object
      (mutableProfile.location as { status: string }).status = "mutated_status";

      const stored = store.getById("profile_test_101");
      expect(stored?.location.status).toBe("known");
    });
  });

  describe("Get Operations", () => {
    it("returns null for non-existent profile IDs", () => {
      expect(store.getById("non_existent")).toBeNull();
      expect(store.getById("")).toBeNull();
    });
  });

  describe("Update / Patch Operations", () => {
    it("applies a partial update and preserves omitted fields", () => {
      store.create(sampleProfile);

      const updateRes = store.update("profile_test_101", {
        soilTexture: createKnownField("clay_loam"),
        updatedAt: "2026-11-14T12:00:00.000Z",
      });

      expect(updateRes.success).toBe(true);
      if (updateRes.success) {
        expect(updateRes.profile.soilTexture.status).toBe("known");
        if (updateRes.profile.soilTexture.status === "known") {
          expect(updateRes.profile.soilTexture.value).toBe("clay_loam");
        }
        // Preserved omitted fields
        expect(updateRes.profile.irrigationSource.status).toBe("known");
        expect(updateRes.profile.landAreaHectares.status).toBe("known");
        expect(updateRes.profile.updatedAt).toBe("2026-11-14T12:00:00.000Z");
      }
    });

    it("strictly prevents modification of profileId and createdAt", () => {
      store.create(sampleProfile);

      // Attempt to tamper with profileId and createdAt
      const tamperUpdates = {
        soilTexture: createKnownField("sandy"),
        profileId: "tampered_id",
        createdAt: "1970-01-01T00:00:00.000Z",
      } as unknown as Parameters<typeof store.update>[1];

      const res = store.update("profile_test_101", tamperUpdates);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.profile.profileId).toBe("profile_test_101");
        expect(res.profile.createdAt).toBe("2026-11-14T10:00:00.000Z");
      }
    });

    it("returns PROFILE_NOT_FOUND when updating non-existent ID", () => {
      const res = store.update("unknown_id", {
        soilTexture: createUnknownField(),
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toBe("PROFILE_NOT_FOUND");
      }
    });
  });

  describe("Delete and Clear", () => {
    it("deletes a profile and confirms removal", () => {
      store.create(sampleProfile);
      expect(store.count()).toBe(1);

      const deleted = store.delete("profile_test_101");
      expect(deleted).toBe(true);
      expect(store.count()).toBe(0);
      expect(store.getById("profile_test_101")).toBeNull();
    });

    it("returns false when deleting non-existent profile", () => {
      expect(store.delete("ghost")).toBe(false);
    });

    it("clears all profiles", () => {
      store.create(sampleProfile);
      store.clear();
      expect(store.count()).toBe(0);
    });
  });
});

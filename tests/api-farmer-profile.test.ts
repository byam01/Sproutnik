import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../app/api/farmer-profile/route";
import { GET as getById, PATCH } from "../app/api/farmer-profile/[profileId]/route";
import { farmerProfileStore } from "../src/server/farmerProfileStore";
import { createKnownField, createUnknownField, FarmerProfile, isKnownField } from "../src/types";

describe("Farmer Profile API Routes", () => {
  beforeEach(() => {
    farmerProfileStore.clear();
  });

  const validProfileInput = {
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
  };

  describe("POST /api/farmer-profile", () => {
    it("creates a new profile with valid payload and returns 201", async () => {
      const req = new NextRequest("http://localhost:3000/api/farmer-profile", {
        method: "POST",
        body: JSON.stringify(validProfileInput),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.profileId).toBeDefined();
      expect(typeof json.data.profileId).toBe("string");
      expect(json.data.createdAt).toBeDefined();
      expect(json.data.updatedAt).toBeDefined();
      expect(isKnownField(json.data.landAreaHectares)).toBe(true);
      if (isKnownField(json.data.landAreaHectares)) {
        expect(json.data.landAreaHectares.value).toBe(2.5);
      }
      expect(isKnownField(json.data.soilTexture)).toBe(true);
      if (isKnownField(json.data.soilTexture)) {
        expect(json.data.soilTexture.value).toBe("loam");
      }

      // Verify persisted in store
      const inStore = farmerProfileStore.getById(json.data.profileId);
      expect(inStore).not.toBeNull();
      expect(inStore?.profileId).toBe(json.data.profileId);
    });

    it("enforces server-generated ID and timestamps, never trusting client-provided values", async () => {
      const clientSpoofedInput = {
        ...validProfileInput,
        profileId: "client_spoofed_uuid_12345",
        createdAt: "1990-01-01T00:00:00.000Z",
        updatedAt: "1990-01-01T00:00:00.000Z",
      };

      const req = new NextRequest("http://localhost:3000/api/farmer-profile", {
        method: "POST",
        body: JSON.stringify(clientSpoofedInput),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.success).toBe(true);

      // Server MUST NOT adopt client's spoofed ID or timestamps
      expect(json.data.profileId).not.toBe("client_spoofed_uuid_12345");
      // Must be a valid UUID v4
      expect(json.data.profileId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
      expect(json.data.createdAt).not.toBe("1990-01-01T00:00:00.000Z");
      expect(json.data.updatedAt).not.toBe("1990-01-01T00:00:00.000Z");

      // Spoofed ID does not exist in store
      expect(farmerProfileStore.getById("client_spoofed_uuid_12345")).toBeNull();
      // Server ID does exist
      expect(farmerProfileStore.getById(json.data.profileId)).not.toBeNull();
    });

    it("rejects invalid profile inputs with HTTP 400", async () => {
      const invalidPayload = {
        ...validProfileInput,
        soilTexture: createKnownField("invalid_marsh_soil" as any),
      };

      const req = new NextRequest("http://localhost:3000/api/farmer-profile", {
        method: "POST",
        body: JSON.stringify(invalidPayload),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("INVALID_PROFILE_INPUT");
      expect(json.error.details).toBeDefined();
    });

    it("rejects prohibited legacy fields (landAreaAcres and groundwaterDepthMeters)", async () => {
      const acresPayload = {
        ...validProfileInput,
        landAreaAcres: 5.0,
      };

      const reqAcres = new NextRequest("http://localhost:3000/api/farmer-profile", {
        method: "POST",
        body: JSON.stringify(acresPayload),
      });

      const resAcres = await POST(reqAcres);
      expect(resAcres.status).toBe(400);
      const jsonAcres = await resAcres.json();
      expect(jsonAcres.error.code).toBe("INVALID_PROFILE_INPUT");
      expect(jsonAcres.error.details.some((d: any) => d.field === "landAreaAcres")).toBe(true);

      const gwPayload = {
        ...validProfileInput,
        groundwaterDepthMeters: 22.0,
      };

      const reqGw = new NextRequest("http://localhost:3000/api/farmer-profile", {
        method: "POST",
        body: JSON.stringify(gwPayload),
      });

      const resGw = await POST(reqGw);
      expect(resGw.status).toBe(400);
      const jsonGw = await resGw.json();
      expect(jsonGw.error.details.some((d: any) => d.field === "groundwaterDepthMeters")).toBe(true);
    });

    it("rejects malformed JSON body with HTTP 400", async () => {
      const req = new NextRequest("http://localhost:3000/api/farmer-profile", {
        method: "POST",
        body: "{ malformed json",
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("INVALID_JSON");
    });
  });

  describe("GET /api/farmer-profile/[profileId]", () => {
    it("retrieves an existing profile successfully with HTTP 200", async () => {
      // Seed a profile into store
      const profile: FarmerProfile = {
        profileId: "seeded_test_profile_001",
        ...validProfileInput,
        createdAt: "2026-11-14T10:00:00.000Z",
        updatedAt: "2026-11-14T10:00:00.000Z",
      };
      farmerProfileStore.create(profile);

      const req = new NextRequest("http://localhost:3000/api/farmer-profile/seeded_test_profile_001");
      const res = await getById(req, {
        params: Promise.resolve({ profileId: "seeded_test_profile_001" }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.profileId).toBe("seeded_test_profile_001");
      if (isKnownField(json.data.landAreaHectares)) {
        expect(json.data.landAreaHectares.value).toBe(2.5);
      }
    });

    it("returns HTTP 404 with PROFILE_NOT_FOUND when profile does not exist", async () => {
      const req = new NextRequest("http://localhost:3000/api/farmer-profile/non_existent_profile");
      const res = await getById(req, {
        params: Promise.resolve({ profileId: "non_existent_profile" }),
      });

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("PROFILE_NOT_FOUND");
      expect(json.error.message).toContain("non_existent_profile");
    });

    it("returns HTTP 400 for empty or blank profileId", async () => {
      const req = new NextRequest("http://localhost:3000/api/farmer-profile/ ");
      const res = await getById(req, {
        params: Promise.resolve({ profileId: "   " }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("INVALID_PROFILE_ID");
    });
  });

  describe("PATCH /api/farmer-profile/[profileId]", () => {
    let seededId: string;
    const initialCreatedAt = "2026-11-14T09:00:00.000Z";
    const initialUpdatedAt = "2026-11-14T09:00:00.000Z";

    beforeEach(() => {
      seededId = "patch_test_profile_001";
      const initialProfile: FarmerProfile = {
        profileId: seededId,
        ...validProfileInput,
        createdAt: initialCreatedAt,
        updatedAt: initialUpdatedAt,
      };
      farmerProfileStore.create(initialProfile);
    });

    it("successfully applies a partial update and preserves omitted fields", async () => {
      const updates = {
        soilTexture: createKnownField("clay_loam" as const),
      };

      const req = new NextRequest(`http://localhost:3000/api/farmer-profile/${seededId}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });

      const res = await PATCH(req, {
        params: Promise.resolve({ profileId: seededId }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);

      // Updated field reflects changes
      if (isKnownField(json.data.soilTexture)) {
        expect(json.data.soilTexture.value).toBe("clay_loam");
      }

      // Preserved omitted fields
      if (isKnownField(json.data.landAreaHectares)) {
        expect(json.data.landAreaHectares.value).toBe(2.5);
      }
      if (isKnownField(json.data.location)) {
        expect(json.data.location.value.district).toBe("Ludhiana");
      }
      if (isKnownField(json.data.currentCrops)) {
        expect(json.data.currentCrops.value).toEqual(["paddy_transplanted", "bread_wheat"]);
      }
      if (isKnownField(json.data.farmingGoals)) {
        expect(json.data.farmingGoals.value).toEqual(["reduce_water_usage", "improve_soil_health"]);
      }

      // Immutability verified
      expect(json.data.profileId).toBe(seededId);
      expect(json.data.createdAt).toBe(initialCreatedAt);

      // updatedAt refreshed
      expect(json.data.updatedAt).not.toBe(initialUpdatedAt);
    });

    it("rejects attempt to mutate profileId or createdAt in update (immutable fields)", async () => {
      const tamperPayload = {
        profileId: "tampered_profile_id",
        createdAt: "2000-01-01T00:00:00.000Z",
        soilTexture: createKnownField("clay_loam" as const),
      };

      const req = new NextRequest(`http://localhost:3000/api/farmer-profile/${seededId}`, {
        method: "PATCH",
        body: JSON.stringify(tamperPayload),
      });

      const res = await PATCH(req, {
        params: Promise.resolve({ profileId: seededId }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("INVALID_PROFILE_UPDATE");
      expect(json.error.details.some((d: any) => d.field === "profileId")).toBe(true);
      expect(json.error.details.some((d: any) => d.field === "createdAt")).toBe(true);

      // Verify store data was not modified (atomic)
      const after = farmerProfileStore.getById(seededId);
      expect(after).not.toBeNull();
      if (after && isKnownField(after.soilTexture)) {
        expect(after.soilTexture.value).toBe("loam");
      }
      expect(after?.profileId).toBe(seededId);
    });

    it("ensures updates are atomic: invalid requests do not partially modify stored data", async () => {
      const multiUpdateWithOneInvalid = {
        soilTexture: createKnownField("clay_loam" as const), // valid
        landAreaHectares: createKnownField(-10), // invalid!
      };

      const req = new NextRequest(`http://localhost:3000/api/farmer-profile/${seededId}`, {
        method: "PATCH",
        body: JSON.stringify(multiUpdateWithOneInvalid),
      });

      const res = await PATCH(req, {
        params: Promise.resolve({ profileId: seededId }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);

      // Verify stored data was not partially applied
      const persisted = farmerProfileStore.getById(seededId);
      expect(persisted).not.toBeNull();
      if (persisted && isKnownField(persisted.soilTexture)) {
        expect(persisted.soilTexture.value).toBe("loam"); // unchanged!
      }
      if (persisted && isKnownField(persisted.landAreaHectares)) {
        expect(persisted.landAreaHectares.value).toBe(2.5); // unchanged!
      }
    });

    it("returns HTTP 404 when patching a non-existent profileId", async () => {
      const req = new NextRequest("http://localhost:3000/api/farmer-profile/missing_id", {
        method: "PATCH",
        body: JSON.stringify({ soilTexture: createKnownField("clay_loam" as const) }),
      });

      const res = await PATCH(req, {
        params: Promise.resolve({ profileId: "missing_id" }),
      });

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("PROFILE_NOT_FOUND");
    });
  });
});


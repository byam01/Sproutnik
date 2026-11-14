import { describe, expect, it, vi } from "vitest";
import {
  createFarmerProfileApi,
  fetchClimateApi,
  fetchCropsApi,
  fetchFarmerProfileApi,
  fetchRotationsApi,
  updateFarmerProfileApi,
} from "../src/services/api";
import { MOCK_CLIMATE_INDICATORS_LUDHIANA } from "../src/fixtures/climate.mock";
import { createKnownField, FarmerProfile, isKnownField } from "../src/types";

describe("Frontend API Service", () => {
  describe("fetchClimateApi", () => {
    it("constructs correct query parameters and parses successful climate responses", async () => {
      const mockApiResponse = {
        success: true,
        data: MOCK_CLIMATE_INDICATORS_LUDHIANA,
        meta: {
          dataSource: "NASA POWER Daily API",
          processingTimestamp: "2026-11-13T00:00:00.000Z",
          version: "1.0.0",
        },
      };

      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      });
      vi.stubGlobal("fetch", fetchSpy);

      const result = await fetchClimateApi({
        lat: 30.9,
        lon: 75.85,
        startYear: 2015,
        endYear: 2024,
        mock: true,
      });

      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/climate?lat=30.9&lon=75.85&startYear=2015&endYear=2024&mock=true",
        expect.objectContaining({
          method: "GET",
          headers: { Accept: "application/json" },
        })
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.meanAnnualRainfallMm).toBe(684.2);
        expect(result.data.meanTemperatureC).toBe(24.3);
        expect(result.data.rainfallVariabilityCvPercent).toBe(11.2);
      }

      vi.unstubAllGlobals();
    });

    it("handles network failure gracefully without throwing unhandled exceptions", async () => {
      const fetchSpy = vi.fn().mockRejectedValue(new Error("Connection refused"));
      vi.stubGlobal("fetch", fetchSpy);

      const result = await fetchClimateApi({
        lat: 30.9,
        lon: 75.85,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("NETWORK_REQUEST_FAILED");
        expect(result.error.message).toContain("Connection refused");
      }

      vi.unstubAllGlobals();
    });
  });

  describe("createFarmerProfileApi", () => {
    const sampleInput = {
      location: createKnownField({
        latitude: 30.9,
        longitude: 75.85,
        district: "Ludhiana",
        countryCode: "IN",
        selectionMethod: "gps" as const,
      }),
      landAreaHectares: createKnownField(2.0),
      soilTexture: createKnownField("loam" as const),
      irrigationAvailable: createKnownField(true),
      irrigationSource: createKnownField("tubewell_deep" as const),
      currentCrops: createKnownField(["bread_wheat"]),
      farmingGoals: createKnownField(["improve_yield" as const]),
    };

    it("sends POST request to /api/farmer-profile and parses created profile", async () => {
      const mockCreatedProfile: FarmerProfile = {
        profileId: "server_assigned_uuid_999",
        ...sampleInput,
        createdAt: "2026-11-14T12:00:00.000Z",
        updatedAt: "2026-11-14T12:00:00.000Z",
      };

      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: mockCreatedProfile,
        }),
      });
      vi.stubGlobal("fetch", fetchSpy);

      const result = await createFarmerProfileApi(sampleInput);

      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/farmer-profile",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(sampleInput),
        })
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.profileId).toBe("server_assigned_uuid_999");
        if (isKnownField(result.data.soilTexture)) {
          expect(result.data.soilTexture.value).toBe("loam");
        }
      }

      vi.unstubAllGlobals();
    });

    it("handles validation error response from server", async () => {
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          success: false,
          error: {
            code: "INVALID_PROFILE_INPUT",
            message: "Validation failed",
          },
        }),
      });
      vi.stubGlobal("fetch", fetchSpy);

      const result = await createFarmerProfileApi(sampleInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("INVALID_PROFILE_INPUT");
      }

      vi.unstubAllGlobals();
    });

    it("handles network failure on profile creation", async () => {
      const fetchSpy = vi.fn().mockRejectedValue(new Error("Network timeout"));
      vi.stubGlobal("fetch", fetchSpy);

      const result = await createFarmerProfileApi(sampleInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("NETWORK_REQUEST_FAILED");
        expect(result.error.message).toContain("Network timeout");
      }

      vi.unstubAllGlobals();
    });
  });

  describe("fetchFarmerProfileApi", () => {
    it("sends GET request to /api/farmer-profile/:id and returns profile", async () => {
      const mockProfile: FarmerProfile = {
        profileId: "test_profile_id_123",
        location: createKnownField({ countryCode: "IN", selectionMethod: "manual" as const }),
        landAreaHectares: createKnownField(3.0),
        soilTexture: createKnownField("clay_loam" as const),
        irrigationAvailable: createKnownField(true),
        irrigationSource: createKnownField("canal" as const),
        currentCrops: createKnownField(["paddy_transplanted"]),
        farmingGoals: createKnownField(["reduce_water_usage" as const]),
        createdAt: "2026-11-14T10:00:00.000Z",
        updatedAt: "2026-11-14T10:00:00.000Z",
      };

      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: mockProfile,
        }),
      });
      vi.stubGlobal("fetch", fetchSpy);

      const result = await fetchFarmerProfileApi("test_profile_id_123");

      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/farmer-profile/test_profile_id_123",
        expect.objectContaining({
          method: "GET",
          headers: { Accept: "application/json" },
        })
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.profileId).toBe("test_profile_id_123");
        if (isKnownField(result.data.soilTexture)) {
          expect(result.data.soilTexture.value).toBe("clay_loam");
        }
      }

      vi.unstubAllGlobals();
    });

    it("handles 404 PROFILE_NOT_FOUND error response", async () => {
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          success: false,
          error: {
            code: "PROFILE_NOT_FOUND",
            message: "Profile not found",
          },
        }),
      });
      vi.stubGlobal("fetch", fetchSpy);

      const result = await fetchFarmerProfileApi("missing_id");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("PROFILE_NOT_FOUND");
      }

      vi.unstubAllGlobals();
    });

    it("handles network failure on profile fetch", async () => {
      const fetchSpy = vi.fn().mockRejectedValue(new Error("Connection dropped"));
      vi.stubGlobal("fetch", fetchSpy);

      const result = await fetchFarmerProfileApi("any_id");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("NETWORK_REQUEST_FAILED");
      }

      vi.unstubAllGlobals();
    });
  });

  describe("updateFarmerProfileApi", () => {
    it("sends PATCH request to /api/farmer-profile/:id with partial updates", async () => {
      const mockUpdatedProfile: FarmerProfile = {
        profileId: "profile_update_123",
        location: createKnownField({ countryCode: "IN", selectionMethod: "manual" as const }),
        landAreaHectares: createKnownField(3.0),
        soilTexture: createKnownField("sandy_loam" as const),
        irrigationAvailable: createKnownField(true),
        irrigationSource: createKnownField("tubewell_electric" as any),
        currentCrops: createKnownField(["bread_wheat"]),
        farmingGoals: createKnownField(["improve_yield" as const]),
        createdAt: "2026-11-14T08:00:00.000Z",
        updatedAt: "2026-11-14T12:00:00.000Z",
      };

      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: mockUpdatedProfile,
        }),
      });
      vi.stubGlobal("fetch", fetchSpy);

      const updates = {
        soilTexture: createKnownField("sandy_loam" as const),
      };

      const result = await updateFarmerProfileApi("profile_update_123", updates);

      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/farmer-profile/profile_update_123",
        expect.objectContaining({
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(updates),
        })
      );

      expect(result.success).toBe(true);
      if (result.success) {
        if (isKnownField(result.data.soilTexture)) {
          expect(result.data.soilTexture.value).toBe("sandy_loam");
        }
      }

      vi.unstubAllGlobals();
    });

    it("handles update failure response", async () => {
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          success: false,
          error: {
            code: "INVALID_PROFILE_UPDATE",
            message: "Cannot modify profileId",
          },
        }),
      });
      vi.stubGlobal("fetch", fetchSpy);

      const result = await updateFarmerProfileApi("profile_123", {});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("INVALID_PROFILE_UPDATE");
      }

      vi.unstubAllGlobals();
    });
  });

  describe("fetchCropsApi", () => {
    it("calls GET /api/crops without filter when no params are passed", async () => {
      const mockCropsResponse = {
        success: true,
        data: [{ id: "paddy_transplanted", name: "Paddy" }],
      };

      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockCropsResponse,
      });
      vi.stubGlobal("fetch", fetchSpy);

      const result = await fetchCropsApi();

      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/crops",
        expect.objectContaining({
          method: "GET",
          headers: { Accept: "application/json" },
        })
      );

      expect(result.success).toBe(true);
      vi.unstubAllGlobals();
    });

    it("appends season query param when provided", async () => {
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });
      vi.stubGlobal("fetch", fetchSpy);

      await fetchCropsApi({ season: "kharif" });

      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/crops?season=kharif",
        expect.objectContaining({ method: "GET" })
      );

      await fetchCropsApi({ season: "summer" });

      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/crops?season=summer",
        expect.objectContaining({ method: "GET" })
      );

      vi.unstubAllGlobals();
    });

    it("handles API error responses and network failures gracefully", async () => {
      const fetchSpy = vi.fn().mockRejectedValue(new Error("DNS lookup failed"));
      vi.stubGlobal("fetch", fetchSpy);

      const result = await fetchCropsApi();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("NETWORK_REQUEST_FAILED");
        expect(result.error.message).toContain("DNS lookup failed");
      }

      vi.unstubAllGlobals();
    });
  });
});

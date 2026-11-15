import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  createFarmerProfile,
  getFarmerProfile,
  updateFarmerProfile,
  fetchCropsApi,
} from "../src/services/api";
import { FarmerProfile, CreateFarmerProfileRequest, UpdateFarmerProfileRequest } from "../src/types";

const TEST_PROFILE: FarmerProfile = {
  profileId: "profile_remote_001",
  location: {
    status: "known",
    value: {
      latitude: 30.9,
      longitude: 75.85,
      district: "Ludhiana",
      countryCode: "IN",
      selectionMethod: "map",
      isDemonstration: true,
    },
    source: "imported",
  },
  landAreaHectares: {
    status: "known",
    value: 2.0234,
  },
  soilTexture: {
    status: "known",
    value: "loam",
  },
  irrigationAvailable: {
    status: "known",
    value: true,
  },
  irrigationSource: {
    status: "known",
    value: "tubewell_deep",
  },
  currentCrops: {
    status: "known",
    value: ["paddy_transplanted", "bread_wheat"],
  },
  farmingGoals: {
    status: "known",
    value: ["reduce_water_usage", "improve_soil_health"],
  },
  createdAt: "2026-11-14T10:00:00.000Z",
  updatedAt: "2026-11-14T10:00:00.000Z",
};

describe("Frontend Farmer Profile API Client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("createFarmerProfile calls POST /api/farmer-profile and returns parsed profileId", async () => {
    const mockResponse = {
      success: true,
      data: {
        profileId: "profile_remote_001",
        profile: TEST_PROFILE,
      },
    };

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify(mockResponse),
    });
    vi.stubGlobal("fetch", fetchSpy);

    const req: CreateFarmerProfileRequest = {
      location: TEST_PROFILE.location,
      landAreaHectares: TEST_PROFILE.landAreaHectares,
    };

    const result = await createFarmerProfile(req);

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/farmer-profile",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          Accept: "application/json",
        }),
        body: JSON.stringify(req),
      })
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.profileId).toBe("profile_remote_001");
      expect(result.data.profile?.location.status).toBe("known");
    }
  });

  it("getFarmerProfile calls GET /api/farmer-profile/{profileId}", async () => {
    const mockResponse = {
      success: true,
      data: TEST_PROFILE,
    };

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify(mockResponse),
    });
    vi.stubGlobal("fetch", fetchSpy);

    const result = await getFarmerProfile("profile_test_999");

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/farmer-profile/profile_test_999",
      expect.objectContaining({
        method: "GET",
        headers: { Accept: "application/json" },
      })
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.landAreaHectares.status).toBe("known");
    }
  });

  it("updateFarmerProfile calls PATCH /api/farmer-profile/{profileId} with partial fields", async () => {
    const mockResponse = {
      success: true,
      data: {
        ...TEST_PROFILE,
        landAreaHectares: { status: "known", value: 3.5 },
      },
    };

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify(mockResponse),
    });
    vi.stubGlobal("fetch", fetchSpy);

    const patchReq: UpdateFarmerProfileRequest = {
      landAreaHectares: { status: "known", value: 3.5 },
    };

    const result = await updateFarmerProfile("profile_test_999", patchReq);

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/farmer-profile/profile_test_999",
      expect.objectContaining({
        method: "PATCH",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(patchReq),
      })
    );

    expect(result.success).toBe(true);
    if (result.success) {
      if (result.data.landAreaHectares.status === "known") {
        expect(result.data.landAreaHectares.value).toBe(3.5);
      }
    }
  });

  it("createFarmerProfile strips placeholder empty profileId from payload", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ success: true, data: { profileId: "new_server_id" } }),
    });
    vi.stubGlobal("fetch", fetchSpy);

    const payloadWithEmptyId: any = {
      ...TEST_PROFILE,
      profileId: "",
    };

    const res = await createFarmerProfile(payloadWithEmptyId);
    expect(res.success).toBe(true);

    const callBody = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(callBody.profileId).toBeUndefined();
  });

  it("updateFarmerProfile strips immutable fields (profileId, createdAt) from payload", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ success: true, data: TEST_PROFILE }),
    });
    vi.stubGlobal("fetch", fetchSpy);

    const fullProfileAsUpdate: any = {
      ...TEST_PROFILE,
    };

    const res = await updateFarmerProfile("profile_remote_001", fullProfileAsUpdate);
    expect(res.success).toBe(true);

    const callBody = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(callBody.profileId).toBeUndefined();
    expect(callBody.createdAt).toBeUndefined();
  });

  it("fetchCropsApi calls GET /api/crops and returns available crops catalog", async () => {
    const mockResponse = {
      success: true,
      data: [
        {
          id: "rice_paddy",
          name: "Rice (Paddy)",
          localName: "Jhona",
          scientificName: "Oryza sativa",
          season: "kharif",
          seasonLabel: "Kharif",
          category: "cereal",
          description: "Monsoon crop",
        },
      ],
    };

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify(mockResponse),
    });
    vi.stubGlobal("fetch", fetchSpy);

    const result = await fetchCropsApi();

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/crops",
      expect.objectContaining({
        method: "GET",
      })
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.length).toBe(1);
      expect(result.data[0].id).toBe("rice_paddy");
    }
  });

  it("handles HTTP error codes (e.g. 404 Not Found) with preserved error details", async () => {
    const errorResponse = {
      success: false,
      error: {
        code: "PROFILE_NOT_FOUND",
        message: "Farmer profile not found for id profile_missing",
      },
    };

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
      text: async () => JSON.stringify(errorResponse),
    });
    vi.stubGlobal("fetch", fetchSpy);

    const result = await getFarmerProfile("profile_missing");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("PROFILE_NOT_FOUND");
      expect(result.error.message).toContain("profile_missing");
    }
  });

  it("handles network failures gracefully without unhandled rejections", async () => {
    const fetchSpy = vi.fn().mockRejectedValue(new Error("Network connection dropped"));
    vi.stubGlobal("fetch", fetchSpy);

    const result = await createFarmerProfile({
      landAreaHectares: { status: "known", value: 2 },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("NETWORK_REQUEST_FAILED");
      expect(result.error.message).toContain("Network connection dropped");
    }
  });

  it("handles malformed JSON responses gracefully", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "<html>502 Bad Gateway</html>",
    });
    vi.stubGlobal("fetch", fetchSpy);

    const result = await fetchCropsApi();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("MALFORMED_RESPONSE");
    }
  });

  describe("API Cancellation and Timeout Separation", () => {
    it("reports genuine internal timeout as REQUEST_TIMEOUT", async () => {
      // Mock fetch hanging until timeout
      const fetchSpy = vi.fn().mockImplementation((_url, options) => {
        return new Promise((_resolve, reject) => {
          options.signal?.addEventListener("abort", () => {
            const err = new Error("Request timed out after 50ms");
            err.name = "AbortError";
            reject(err);
          });
        });
      });
      vi.stubGlobal("fetch", fetchSpy);

      const result = await fetchCropsApi({ timeoutMs: 50 });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("REQUEST_TIMEOUT");
        expect(result.error.message).toContain("timed out");
      }
    });

    it("reports intentional external cancellation as REQUEST_ABORTED", async () => {
      const externalController = new AbortController();

      const fetchSpy = vi.fn().mockImplementation((_url, options) => {
        return new Promise((_resolve, reject) => {
          options.signal?.addEventListener("abort", () => {
            const err = new Error("The operation was aborted");
            err.name = "AbortError";
            reject(err);
          });
        });
      });
      vi.stubGlobal("fetch", fetchSpy);

      const promise = fetchCropsApi({ signal: externalController.signal, timeoutMs: 5000 });
      // Simulate external unmount or cancel
      externalController.abort();
      const result = await promise;

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("REQUEST_ABORTED");
        expect(result.error.message).toContain("cancelled");
      }
    });

    it("handles already-aborted external signals gracefully without executing request", async () => {
      const alreadyAborted = new AbortController();
      alreadyAborted.abort();

      const fetchSpy = vi.fn().mockImplementation((_url, options) => {
        if (options.signal?.aborted) {
          const err = new Error("The operation was aborted");
          err.name = "AbortError";
          return Promise.reject(err);
        }
        return Promise.resolve({ ok: true, json: async () => ({ success: true, data: [] }) });
      });
      vi.stubGlobal("fetch", fetchSpy);

      const result = await fetchCropsApi({ signal: alreadyAborted.signal });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("REQUEST_ABORTED");
      }
    });

    it("cleans up external abort event listener upon completion", async () => {
      const externalController = new AbortController();
      const addListenerSpy = vi.spyOn(externalController.signal, "addEventListener");
      const removeListenerSpy = vi.spyOn(externalController.signal, "removeEventListener");

      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify({ success: true, data: [] }),
      });
      vi.stubGlobal("fetch", fetchSpy);

      await fetchCropsApi({ signal: externalController.signal, timeoutMs: 5000 });

      expect(addListenerSpy).toHaveBeenCalledWith("abort", expect.any(Function), { once: true });
      expect(removeListenerSpy).toHaveBeenCalledWith("abort", expect.any(Function));
    });
  });
});

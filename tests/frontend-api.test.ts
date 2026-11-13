import { describe, expect, it, vi } from "vitest";
import { fetchClimateApi } from "../src/services/api";
import { MOCK_CLIMATE_INDICATORS_LUDHIANA } from "../src/fixtures/climate.mock";

describe("Frontend API Service (fetchClimateApi)", () => {
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


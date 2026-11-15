import { describe, expect, it } from "vitest";
import { fetchNasaClimate } from "../src/services/nasa-power";
import { processClimateRecords } from "../src/climate/processor";

describe("Live NASA POWER Integration", () => {
  it("fetches and processes real 2-year data from NASA POWER for Ludhiana", async () => {
    // 2023 - 2024 for Ludhiana demonstration coordinates
    const location = { latitude: 30.9, longitude: 75.85 };
    
    let records;
    try {
      records = await fetchNasaClimate(location, 2023, 2024, { timeoutMs: 5000 });
    } catch (err: unknown) {
      if (err instanceof Error && (err.message.includes("Network failure") || err.message.includes("timed out"))) {
        console.warn("NASA POWER live API unreachable in current environment; skipping live network assertions.");
        return;
      }
      throw err;
    }
    
    expect(records.length).toBeGreaterThan(700); // ~731 days
    expect(records[0]).toHaveProperty("date");
    expect(records[0]).toHaveProperty("precipitationMm");
    expect(records[0]).toHaveProperty("tempMeanC");
    expect(records[0]).toHaveProperty("tempMaxC");

    const processed = processClimateRecords(records, location, { startYear: 2023, endYear: 2024 });
    expect(processed.meanAnnualRainfallMm).toBeGreaterThan(0);
    expect(processed.meanTemperatureC).toBeGreaterThan(15);
    expect(processed.meanTemperatureC).toBeLessThan(35);
    expect(processed.quality.totalReceivedDays).toBeGreaterThan(700);
  }, 30000);
});


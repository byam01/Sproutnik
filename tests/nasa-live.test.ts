import { describe, expect, it } from "vitest";
import { fetchNasaClimate } from "../src/services/nasa-power";
import { processClimateRecords } from "../src/climate/processor";

describe("Live NASA POWER Integration", () => {
  it("fetches and processes real 2-year data from NASA POWER for Ludhiana", async () => {
    // 2023 - 2024 for Ludhiana demonstration coordinates
    const location = { latitude: 30.9, longitude: 75.85 };
    
    // Timeout of 25 seconds for NASA server latency
    const records = await fetchNasaClimate(location, 2023, 2024, { timeoutMs: 25000 });
    
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


import { describe, expect, it } from "vitest";
import { compareCropRotation } from "../src/engine/comparison";
import { CANDIDATE_ROTATIONS } from "../src/agronomy/rotations";
import { MOCK_CLIMATE_INDICATORS_LUDHIANA } from "../src/fixtures/climate.mock";
import { FarmerProfile } from "../src/types";

describe("Stage B: Trade-Off Comparison Engine", () => {
  const riceWheat = CANDIDATE_ROTATIONS.find((r) => r.id === "rotation_rice_wheat")!;
  const maizeWheat = CANDIDATE_ROTATIONS.find((r) => r.id === "rotation_maize_wheat")!;
  const maizeMustardMoong = CANDIDATE_ROTATIONS.find((r) => r.id === "rotation_maize_mustard_moong")!;

  const profile: FarmerProfile = {
    location: { latitude: 30.9, longitude: 75.85 },
    soilTexture: "loam",
    irrigationSource: "tubewell_deep",
  };

  it("identifies baseline rice-wheat with critical groundwater pressure and unfavorable soil impact", () => {
    const result = compareCropRotation(riceWheat, MOCK_CLIMATE_INDICATORS_LUDHIANA, profile);

    expect(result.isBaseline).toBe(true);
    expect(result.waterDemandTotalCategory).toBe("very_high");
    expect(result.groundwaterPressureIndex).toBe("critical");

    const soilTradeoff = result.tradeoffs.find((t) => t.dimension === "soil_health");
    expect(soilTradeoff?.scoreLabel).toBe("unfavorable");
    expect(soilTradeoff?.disadvantages.some((d) => d.includes("hardpan"))).toBe(true);
  });

  it("evaluates maize-wheat alternative with lower water exposure and positive turnaround gap", () => {
    const result = compareCropRotation(maizeWheat, MOCK_CLIMATE_INDICATORS_LUDHIANA, profile);

    expect(result.isBaseline).toBe(false);
    expect(result.waterDemandTotalCategory).toBe("moderate");
    expect(result.groundwaterPressureIndex).toBe("low");

    const turnaround = result.tradeoffs.find((t) => t.dimension === "turnaround_feasibility");
    expect(turnaround?.scoreLabel).toBe("favorable");
    expect(turnaround?.advantages.some((a) => a.includes("30–40 day window"))).toBe(true);
  });

  it("evaluates diversified pulse-oilseed rotation with favorable agrobiodiversity and biological N2 fixation", () => {
    const result = compareCropRotation(maizeMustardMoong, MOCK_CLIMATE_INDICATORS_LUDHIANA, profile);

    expect(result.waterDemandTotalCategory).toBe("moderate");
    const diversityTradeoff = result.tradeoffs.find((t) => t.dimension === "diversity");
    expect(diversityTradeoff?.scoreLabel).toBe("favorable");
    expect(diversityTradeoff?.advantages.some((a) => a.includes("nitrogen"))).toBe(true);
    expect(result.diversificationBenefits.length).toBeGreaterThan(2);
  });

  it("accurately attaches agricultural evidence references and unknown limitations", () => {
    const result = compareCropRotation(maizeWheat, MOCK_CLIMATE_INDICATORS_LUDHIANA, profile);

    expect(result.evidence.length).toBeGreaterThan(0);
    expect(result.evidence.some((e) => e.source.includes("Punjab Agricultural University"))).toBe(true);
    expect(result.unknowns.length).toBeGreaterThan(0);
  });
});

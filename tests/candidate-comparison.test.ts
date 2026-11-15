import { describe, expect, it } from "vitest";
import { CANDIDATE_ROTATIONS } from "@/agronomy/rotations";
import { compareCropRotation } from "@/engine/comparison";
import { compareTwoRotations } from "@/engine/candidateComparison";
import { MOCK_CLIMATE_INDICATORS_LUDHIANA } from "@/fixtures/climate.mock";
import {
  recalculateRotationsForScenario,
  WhatIfScenarioState,
} from "@/utils/scenarioRecalculator";
import { RotationFarmerContext } from "@/types";

describe("Intelligent Candidate-to-Candidate Rotation Comparison Engine", () => {
  const climate = MOCK_CLIMATE_INDICATORS_LUDHIANA;

  function getRecalculatedCandidate(
    rotationId: string,
    scenario: WhatIfScenarioState = { soilTexture: null, irrigationSource: null },
    context: RotationFarmerContext = {
      soilTexture: "loam",
      irrigationSource: "tubewell_deep",
    }
  ) {
    const allEvaluated = CANDIDATE_ROTATIONS.map((r) =>
      compareCropRotation(r, climate, context)
    );
    const baseline = allEvaluated.find((r) => r.isBaseline)!;
    const alternatives = allEvaluated.filter((r) => !r.isBaseline);

    const recalculated = recalculateRotationsForScenario(
      baseline,
      alternatives,
      scenario,
      context
    );

    const all = [recalculated.baseline, ...recalculated.alternatives];
    return all.find((c) => c.rotationId === rotationId)!;
  }

  // 1. Comparison selection & quantitative deltas
  it("accurately contrasts water demand and turnaround buffers between two candidate rotations", () => {
    const maizeWheat = getRecalculatedCandidate("rotation_maize_wheat");
    const dsrWheat = getRecalculatedCandidate("rotation_dsr_wheat");

    const comparison = compareTwoRotations(maizeWheat, dsrWheat);

    // Maize–Wheat (~900 mm) vs DSR–Wheat (~1800 mm)
    expect(comparison.waterComparison.waterDemandMmA).toBe(900);
    expect(comparison.waterComparison.waterDemandMmB).toBe(1800);
    expect(comparison.waterComparison.lowerDemandCandidate).toBe("candidate_a");
    expect(comparison.waterComparison.differenceMm).toBe(-900);
    expect(comparison.waterComparison.percentDifference).toBe(50); // 900/1800 = 50%
    expect(comparison.waterComparison.summary).toContain("conserving ~900 mm/yr");

    // Turnaround: Maize–Wheat (30 days min) vs DSR–Wheat (25 days min)
    expect(comparison.turnaroundComparison.minTurnaroundA).toBe(30);
    expect(comparison.turnaroundComparison.minTurnaroundB).toBe(25);
    expect(comparison.turnaroundComparison.moreFlexibleCandidate).toBe("candidate_a");
    expect(comparison.turnaroundComparison.differenceDays).toBe(5);
    expect(comparison.turnaroundComparison.summary).toContain("5 days more buffer");
  });

  // 2. 5-Dimension trade-off evaluation
  it("objectively evaluates 5 Stage B dimensions and identifies distinct agronomic advantages", () => {
    const maizeWheat = getRecalculatedCandidate("rotation_maize_wheat");
    const mustardMoong = getRecalculatedCandidate("rotation_maize_mustard_moong");

    const comparison = compareTwoRotations(maizeWheat, mustardMoong);

    expect(comparison.dimensionComparisons.length).toBe(5);

    // Biodiversity dimension: Mustard Moong incorporates Brassica + Legume, so it has higher diversity
    const diversityDim = comparison.dimensionComparisons.find(
      (d) => d.dimension === "diversity"
    )!;
    expect(diversityDim.candidateAScore).toBe("moderate");
    expect(diversityDim.candidateBScore).toBe("favorable");
    expect(diversityDim.advantage).toBe("candidate_b");

    // Turnaround buffer comparison: Maize–Wheat has 30 days buffer vs Mustard Moong 15 days
    expect(comparison.turnaroundComparison.minTurnaroundA).toBe(30);
    expect(comparison.turnaroundComparison.minTurnaroundB).toBe(15);
    expect(comparison.turnaroundComparison.moreFlexibleCandidate).toBe("candidate_a");
    expect(comparison.turnaroundComparison.differenceDays).toBe(15);

    // Turnaround dimension against rice_wheat_moong (which has tight 10-day turnaround)
    const riceWheatMoong = getRecalculatedCandidate("rotation_rice_wheat_moong");
    const compWithMoong = compareTwoRotations(maizeWheat, riceWheatMoong);
    const moongTurnaroundDim = compWithMoong.dimensionComparisons.find(
      (d) => d.dimension === "turnaround_feasibility"
    )!;
    expect(moongTurnaroundDim.candidateAScore).toBe("favorable");
    expect(moongTurnaroundDim.candidateBScore).toBe("caution");
    expect(moongTurnaroundDim.advantage).toBe("candidate_a");

    // Trade-off highlights reflect pulse nitrogen fixation for B
    expect(
      comparison.tradeoffHighlights.reasonsToChooseB.some((r) =>
        r.includes("atmospheric N/ha")
      )
    ).toBe(true);
  });

  // 3. Scenario integration & feasibility contrast
  it("reflects active What-If scenario constraints in the head-to-head feasibility contrast", () => {
    // Under sandy soil scenario:
    const sandyScenario = { soilTexture: "sandy" as const, irrigationSource: null };
    const context: RotationFarmerContext = {
      soilTexture: "loam",
      irrigationSource: "tubewell_deep",
    };

    const maizeWheat = getRecalculatedCandidate("rotation_maize_wheat", sandyScenario, context);
    const dsrWheat = getRecalculatedCandidate("rotation_dsr_wheat", sandyScenario, context);

    const comparison = compareTwoRotations(maizeWheat, dsrWheat);

    // Maize–Wheat passes on sandy soil; DSR–Wheat fails PAU iron chlorosis rule
    expect(comparison.feasibilityComparison.isFeasibleA).toBe(true);
    expect(comparison.feasibilityComparison.isFeasibleB).toBe(false);
    expect(comparison.feasibilityComparison.feasibilityContrast).toBe("only_a_feasible");
    expect(comparison.feasibilityComparison.rejectionReasonsB.some((r) => r.includes("iron chlorosis"))).toBe(true);
    expect(comparison.feasibilityComparison.summary).toContain("physically feasible, whereas Direct-Seeded Rice");

    // Reasons to choose A includes physical feasibility
    expect(
      comparison.tradeoffHighlights.reasonsToChooseA.some((r) =>
        r.includes("Physically viable under current farm conditions")
      )
    ).toBe(true);
  });

  // 4. Feasibility changes when constraints relax
  it("updates feasibility contrast when scenario changes from restricted to viable", () => {
    // Both evaluated under loam
    const loamScenario = { soilTexture: "loam" as const, irrigationSource: null };
    const context: RotationFarmerContext = {
      soilTexture: "sandy", // saved in profile as sandy
      irrigationSource: "canal",
    };

    const maizeWheat = getRecalculatedCandidate("rotation_maize_wheat", loamScenario, context);
    const dsrWheat = getRecalculatedCandidate("rotation_dsr_wheat", loamScenario, context);

    const comparison = compareTwoRotations(maizeWheat, dsrWheat);

    // Both are now feasible under loam scenario
    expect(comparison.feasibilityComparison.feasibilityContrast).toBe("both_feasible");
    expect(comparison.feasibilityComparison.isFeasibleA).toBe(true);
    expect(comparison.feasibilityComparison.isFeasibleB).toBe(true);
    expect(comparison.feasibilityComparison.rejectionReasonsB.length).toBe(0);
  });

  // 5. Missing data handling
  it("handles missing or unconfigured farmer contexts gracefully", () => {
    const unconfiguredContext: RotationFarmerContext = {
      soilTexture: undefined,
      irrigationSource: undefined,
    };

    const maizeWheat = getRecalculatedCandidate("rotation_maize_wheat", undefined, unconfiguredContext);
    const riceWheat = getRecalculatedCandidate("rotation_rice_wheat", undefined, unconfiguredContext);

    const comparison = compareTwoRotations(maizeWheat, riceWheat);

    expect(comparison).toBeDefined();
    expect(comparison.waterComparison.waterDemandMmA).toBe(900);
    expect(comparison.waterComparison.waterDemandMmB).toBe(2150);
    expect(comparison.farmerInvestigationChecklist.length).toBeGreaterThan(0);
  });

  // 6. Swap symmetry
  it("maintains mathematical and agronomic symmetry when candidate positions are swapped", () => {
    const maizeWheat = getRecalculatedCandidate("rotation_maize_wheat");
    const dsrWheat = getRecalculatedCandidate("rotation_dsr_wheat");

    const compAB = compareTwoRotations(maizeWheat, dsrWheat);
    const compBA = compareTwoRotations(dsrWheat, maizeWheat);

    expect(compAB.waterComparison.differenceMm).toBe(-compBA.waterComparison.differenceMm);
    expect(compAB.turnaroundComparison.differenceDays).toBe(compBA.turnaroundComparison.differenceDays);
    expect(compAB.waterComparison.lowerDemandCandidate).toBe("candidate_a");
    expect(compBA.waterComparison.lowerDemandCandidate).toBe("candidate_b");
  });
});

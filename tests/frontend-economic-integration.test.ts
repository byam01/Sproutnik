import { describe, expect, it } from "vitest";
import { CANDIDATE_ROTATIONS } from "@/agronomy/rotations";
import { PUNJAB_ECONOMIC_BENCHMARKS } from "@/agronomy/economicBenchmarks";
import { compareCropRotation } from "@/engine/comparison";
import {
  calculateCropEconomics,
  calculateRotationEconomics,
} from "@/engine/economics";
import { compareTwoRotations } from "@/engine/candidateComparison";
import { recalculateRotationsForScenario } from "@/utils/scenarioRecalculator";
import {
  generateFarmerAdvisoryReport,
  renderAdvisoryReportHtml,
} from "@/reports/advisoryReportGenerator";
import { MOCK_CLIMATE_INDICATORS_LUDHIANA } from "@/fixtures/climate.mock";
import { RotationFarmerContext } from "@/types";

describe("Milestone 1C: Frontend Economic Intelligence Integration", () => {
  const climate = MOCK_CLIMATE_INDICATORS_LUDHIANA;

  // 1. Economic Field Integration & Calculation Accuracy
  it("integrates actual backend economic response fields with correct calculations", () => {
    const defaultContext: RotationFarmerContext = {
      soilTexture: "loam",
      irrigationSource: "tubewell_deep",
    };

    const riceWheat = CANDIDATE_ROTATIONS.find(
      (r) => r.id === "rotation_rice_wheat"
    )!;
    const maizeWheat = CANDIDATE_ROTATIONS.find(
      (r) => r.id === "rotation_maize_wheat"
    )!;

    const evaluatedBaseline = compareCropRotation(riceWheat, climate, defaultContext);
    expect(evaluatedBaseline.economics).toBeDefined();

    const baseEcon = evaluatedBaseline.economics!;
    expect(baseEcon.rotationId).toBe("rotation_rice_wheat");
    expect(baseEcon.netReturnInrPerHa).toBe(182250);
    expect(baseEcon.totalCultivationCostInrPerHa).toBe(104500);
    expect(baseEcon.grossRevenueInrPerHa).toBe(286750);
    expect(baseEcon.benefitCostRatio).toBe(2.74);
    // Baseline itself must not have comparisonToBaseline
    expect(baseEcon.comparisonToBaseline).toBeUndefined();

    // Evaluate alternative with baseline economics
    const evaluatedMaize = compareCropRotation(
      maizeWheat,
      climate,
      defaultContext,
      baseEcon
    );
    expect(evaluatedMaize.economics).toBeDefined();

    const maizeEcon = evaluatedMaize.economics!;
    expect(maizeEcon.rotationId).toBe("rotation_maize_wheat");
    expect(maizeEcon.netReturnInrPerHa).toBe(148350);
    expect(maizeEcon.totalCultivationCostInrPerHa).toBe(86500);
    expect(maizeEcon.grossRevenueInrPerHa).toBe(234850);
    expect(maizeEcon.benefitCostRatio).toBe(2.72);

    // Alternative must have comparisonToBaseline populated
    expect(maizeEcon.comparisonToBaseline).toBeDefined();
    const delta = maizeEcon.comparisonToBaseline!;
    expect(delta.netReturnDeltaInrPerHa).toBe(-33900);
    expect(delta.netReturnDeltaPercent).toBe(-18.6);
    expect(delta.costDeltaInrPerHa).toBe(-18000);
    expect(delta.costDeltaPercent).toBe(-17.2);
    expect(delta.waterEnergySavingsInrPerHa).toBe(1500);

    // Also evaluate triple-cropping rotation_rice_wheat_moong (higher net return than baseline)
    const riceWheatMoong = CANDIDATE_ROTATIONS.find(
      (r) => r.id === "rotation_rice_wheat_moong"
    )!;
    const evaluatedMoong = compareCropRotation(
      riceWheatMoong,
      climate,
      defaultContext,
      baseEcon
    );
    const moongEcon = evaluatedMoong.economics!;
    expect(moongEcon.netReturnInrPerHa).toBe(240950);
    expect(moongEcon.comparisonToBaseline?.netReturnDeltaInrPerHa).toBe(58700);
    expect(moongEcon.comparisonToBaseline?.netReturnDeltaPercent).toBe(32.2);
  });

  // 2. Feasibility Safeguard: Never Recommend an Infeasible Rotation
  it("never allows an economically attractive but agronomically infeasible rotation to become a recommendation", () => {
    // Sandy soil restricts DSR due to iron chlorosis and excessive percolation
    const sandyContext: RotationFarmerContext = {
      soilTexture: "sandy",
      irrigationSource: "tubewell_deep",
    };

    const dsrDef = CANDIDATE_ROTATIONS.find(
      (r) => r.id === "rotation_dsr_wheat"
    )!;
    const riceWheat = CANDIDATE_ROTATIONS.find(
      (r) => r.id === "rotation_rice_wheat"
    )!;

    const evaluatedBaseline = compareCropRotation(riceWheat, climate, sandyContext);
    const evaluatedDsr = compareCropRotation(
      dsrDef,
      climate,
      sandyContext,
      evaluatedBaseline.economics
    );

    // Stage A feasibility must fail
    expect(evaluatedDsr.feasibility.isFeasible).toBe(false);
    expect(evaluatedDsr.suitabilityStatus).toBe("unfeasible");
    expect(evaluatedDsr.criticalLimitations?.length).toBeGreaterThan(0);
    expect(
      evaluatedDsr.criticalLimitations?.some((r) => r.includes("iron chlorosis"))
    ).toBe(true);

    // Overall rationale must clearly state unfeasibility
    expect(evaluatedDsr.recommendation?.overallRationale).toContain(
      "Agronomically unfeasible"
    );

    // Head-to-head comparison must generate the feasibility warning
    const comparison = compareTwoRotations(evaluatedDsr, evaluatedBaseline);
    expect(comparison.feasibilityComparison.isFeasibleA).toBe(false);
    expect(comparison.economicComparison.feasibilityWarning).toBeDefined();
    expect(comparison.economicComparison.feasibilityWarning).toContain(
      "cannot be realized without resolving physical soil/water constraints"
    );
  });

  // 3. Explicit Handling of Missing and Null Economic Fields
  it("handles missing and null economic fields explicitly without silent zero substitution", () => {
    const riceWheat = CANDIDATE_ROTATIONS.find(
      (r) => r.id === "rotation_rice_wheat"
    )!;
    const maizeWheat = CANDIDATE_ROTATIONS.find(
      (r) => r.id === "rotation_maize_wheat"
    )!;

    const evaluatedA = compareCropRotation(riceWheat, climate);
    const evaluatedB = compareCropRotation(maizeWheat, climate);

    // Create copies with economics explicitly undefined
    const mockAWithoutEcon = { ...evaluatedA, economics: undefined };
    const mockBWithoutEcon = { ...evaluatedB, economics: undefined };

    const comp = compareTwoRotations(mockAWithoutEcon, mockBWithoutEcon);
    expect(comp.economicComparison.hasEconomics).toBe(false);
    expect(comp.economicComparison.netReturnA).toBeUndefined();
    expect(comp.economicComparison.netReturnB).toBeUndefined();
    expect(comp.economicComparison.summary).toContain("unavailable");

    // Advisory report generator should handle undefined economics without crashing
    const reportData = generateFarmerAdvisoryReport({
      mode: "baseline",
      farmContext: { locationName: "Test Farm", savedSoilTexture: "loam" },
      baselineRotation: mockAWithoutEcon,
      selectedCandidate: mockBWithoutEcon,
    });

    expect(reportData.rotations[0].economics).toBeUndefined();
    const html = renderAdvisoryReportHtml(reportData);
    expect(html).toContain("Economic cost-return data unavailable");
    // Must NOT substitute zero
    expect(html).not.toContain("₹0/ha");
  });

  // 4. Provenance Fidelity: MSP versus Market-Average
  it("preserves MSP versus market-average provenance and secondary value accounting", () => {
    // 1. Verified MSP crops
    expect(PUNJAB_ECONOMIC_BENCHMARKS.paddy_transplanted.priceType).toBe("msp_benchmark");
    expect(PUNJAB_ECONOMIC_BENCHMARKS.paddy_transplanted.provenance.isVerifiedMsp).toBe(true);
    expect(PUNJAB_ECONOMIC_BENCHMARKS.bread_wheat.priceType).toBe("msp_benchmark");
    expect(PUNJAB_ECONOMIC_BENCHMARKS.bread_wheat.provenance.isVerifiedMsp).toBe(true);
    expect(PUNJAB_ECONOMIC_BENCHMARKS.rabi_mustard.priceType).toBe("msp_benchmark");
    expect(PUNJAB_ECONOMIC_BENCHMARKS.rabi_mustard.provenance.isVerifiedMsp).toBe(true);

    // 2. Market-average crops with procurement limitations disclosed
    expect(PUNJAB_ECONOMIC_BENCHMARKS.kharif_maize.priceType).toBe("market_average");
    expect(PUNJAB_ECONOMIC_BENCHMARKS.kharif_maize.provenance.isVerifiedMsp).toBe(false);
    expect(PUNJAB_ECONOMIC_BENCHMARKS.summer_moong.priceType).toBe("market_average");
    expect(PUNJAB_ECONOMIC_BENCHMARKS.summer_moong.provenance.isVerifiedMsp).toBe(false);

    // 3. Byproduct and Nitrogen credit accounting
    expect(PUNJAB_ECONOMIC_BENCHMARKS.bread_wheat.byproductRevenueInrPerHa).toBe(12000); // Bhusa
    expect(PUNJAB_ECONOMIC_BENCHMARKS.summer_moong.nitrogenCreditInrPerHa).toBe(1400); // Biological N-fix

    // 4. Verification in crop calculation
    const wheatEcon = calculateCropEconomics("bread_wheat");
    expect(wheatEcon.byproductRevenueInrPerHa).toBe(12000);
    expect(wheatEcon.priceType).toBe("msp_benchmark");

    const moongEcon = calculateCropEconomics("summer_moong");
    expect(moongEcon.nitrogenCreditInrPerHa).toBe(1400);
    expect(moongEcon.priceType).toBe("market_average");
  });

  // 5. Deterministic Scenario Sensitivity Projections
  it("evaluates deterministic sensitivity scenarios with disclosed assumptions", () => {
    const maizeWheat = CANDIDATE_ROTATIONS.find(
      (r) => r.id === "rotation_maize_wheat"
    )!;

    const econ = calculateRotationEconomics(maizeWheat);
    const scenarios = econ.scenarios;

    expect(scenarios.conservative).toBeDefined();
    expect(scenarios.reference).toBeDefined();
    expect(scenarios.optimistic).toBeDefined();

    // Conservative net return < Reference net return < Optimistic net return
    expect(scenarios.conservative.netReturnInrPerHa).toBeLessThan(
      scenarios.reference.netReturnInrPerHa
    );
    expect(scenarios.reference.netReturnInrPerHa).toBeLessThan(
      scenarios.optimistic.netReturnInrPerHa
    );

    // Underlying scenario assumptions must be explicit strings
    expect(scenarios.conservative.assumptions).toContain("-10% yield");
    expect(scenarios.conservative.assumptions).toContain("-10%");
    expect(scenarios.reference.assumptions).toContain("benchmark yields");
    expect(scenarios.optimistic.assumptions).toContain("+10% yield");
  });

  // 6. What-If Recalculation & Context Adjustments
  it("recalculates economic returns under What-If farm context adjustments without labeling sandy soil as leaching cost", () => {
    const defaultContext: RotationFarmerContext = {
      soilTexture: "loam",
      irrigationSource: "tubewell_deep",
    };

    const riceWheat = CANDIDATE_ROTATIONS.find(
      (r) => r.id === "rotation_rice_wheat"
    )!;
    const maizeWheat = CANDIDATE_ROTATIONS.find(
      (r) => r.id === "rotation_maize_wheat"
    )!;

    const baseline = compareCropRotation(riceWheat, climate, defaultContext);
    const maize = compareCropRotation(maizeWheat, climate, defaultContext, baseline.economics);

    // Scenario 1: Test rainfed irrigation source
    const rainfedScenario = recalculateRotationsForScenario(
      baseline,
      [maize],
      { soilTexture: null, irrigationSource: "rainfed_only" },
      defaultContext
    );

    expect(rainfedScenario.isScenarioActive).toBe(true);
    // Under rainfed, pumping energy cost drops to 0
    expect(
      rainfedScenario.baseline.economics?.combinedCostBreakdown.irrigationEnergyInrPerHa
    ).toBe(0);
    expect(
      rainfedScenario.alternatives[0].economics?.combinedCostBreakdown.irrigationEnergyInrPerHa
    ).toBe(0);

    // Scenario 2: Test sandy soil adjustment
    const sandyScenario = recalculateRotationsForScenario(
      baseline,
      [maize],
      { soilTexture: "sandy", irrigationSource: null },
      defaultContext
    );

    expect(sandyScenario.isScenarioActive).toBe(true);
    // Sandy soil requires +10% fertilizer split management
    const normalFert = maize.economics!.combinedCostBreakdown.fertilizersInrPerHa;
    const sandyFert = sandyScenario.alternatives[0].economics!.combinedCostBreakdown.fertilizersInrPerHa;
    expect(sandyFert).toBe(Math.round(normalFert * 1.1));

    // Ensure observations do NOT mention "leaching cost"
    const obsText = sandyScenario.impactSummary.keyObservations.join(" ");
    expect(obsText.toLowerCase()).not.toContain("leaching cost");
  });
});

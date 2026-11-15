import { describe, expect, it } from "vitest";
import {
  CANDIDATE_ROTATIONS,
  getRotationIrrigationWaterMm,
  getRotationMinTurnaroundDays,
} from "@/agronomy/rotations";
import { compareCropRotation } from "@/engine/comparison";
import { evaluateRotationFeasibility } from "@/engine/feasibility";
import { compareTwoRotations } from "@/engine/candidateComparison";
import { MOCK_CLIMATE_INDICATORS_LUDHIANA } from "@/fixtures/climate.mock";
import {
  recalculateRotationsForScenario,
  WhatIfScenarioState,
} from "@/utils/scenarioRecalculator";
import { RotationFarmerContext } from "@/types";
import {
  generateFarmerAdvisoryReport,
  renderAdvisoryReportHtml,
} from "@/reports/advisoryReportGenerator";

describe("Agricultural Intelligence Integrity & Cross-Layer QA Audit", () => {
  const climate = MOCK_CLIMATE_INDICATORS_LUDHIANA;

  const riceWheatDef = CANDIDATE_ROTATIONS.find((r) => r.id === "rotation_rice_wheat")!;
  const dsrWheatDef = CANDIDATE_ROTATIONS.find((r) => r.id === "rotation_dsr_wheat")!;
  const maizeWheatDef = CANDIDATE_ROTATIONS.find((r) => r.id === "rotation_maize_wheat")!;
  const maizeMustardMoongDef = CANDIDATE_ROTATIONS.find(
    (r) => r.id === "rotation_maize_mustard_moong"
  )!;
  const riceWheatMoongDef = CANDIDATE_ROTATIONS.find(
    (r) => r.id === "rotation_rice_wheat_moong"
  )!;

  // 1. Water Calculation Integrity & Precise Agronomic Constants
  it("derives exact annual supplemental irrigation demand without fabrication across all 5 candidate rotations", () => {
    // Rice-Wheat: 1750 (paddy) + 400 (wheat) = 2150 mm/yr
    expect(getRotationIrrigationWaterMm("rotation_rice_wheat")).toBe(2150);

    // DSR-Wheat: 1400 (dsr) + 400 (wheat) = 1800 mm/yr
    expect(getRotationIrrigationWaterMm("rotation_dsr_wheat")).toBe(1800);

    // Maize-Wheat: 500 (maize) + 400 (wheat) = 900 mm/yr
    expect(getRotationIrrigationWaterMm("rotation_maize_wheat")).toBe(900);

    // Maize-Mustard-Moong: 500 (maize) + 280 (mustard) + 250 (moong) = 1030 mm/yr
    expect(getRotationIrrigationWaterMm("rotation_maize_mustard_moong")).toBe(1030);

    // Rice-Wheat-Moong: 1750 (paddy) + 400 (wheat) + 250 (moong) = 2400 mm/yr
    expect(getRotationIrrigationWaterMm("rotation_rice_wheat_moong")).toBe(2400);

    // Minimum turnaround calculations
    expect(getRotationMinTurnaroundDays("rotation_rice_wheat")).toBe(15);
    expect(getRotationMinTurnaroundDays("rotation_dsr_wheat")).toBe(25);
    expect(getRotationMinTurnaroundDays("rotation_maize_wheat")).toBe(30);
    expect(getRotationMinTurnaroundDays("rotation_maize_mustard_moong")).toBe(15);
    expect(getRotationMinTurnaroundDays("rotation_rice_wheat_moong")).toBe(10);
  });

  // 2. Groundwater Pressure & Irrigation Source Nuance
  it("differentiates tubewell extraction pressure from surface canal irrigation", () => {
    const tubewellContext: RotationFarmerContext = {
      soilTexture: "loam",
      irrigationSource: "tubewell_deep",
    };

    const canalContext: RotationFarmerContext = {
      soilTexture: "loam",
      irrigationSource: "canal",
    };

    const tubewellEval = compareCropRotation(riceWheatDef, climate, tubewellContext);
    const canalEval = compareCropRotation(riceWheatDef, climate, canalContext);

    // Under tubewell irrigation, Rice-Wheat has critical groundwater depletion tier
    expect(tubewellEval.groundwaterPressureIndex).toBe("critical");
    const tubewellWaterTradeoff = tubewellEval.tradeoffs.find(
      (t) => t.dimension === "water_exposure"
    )!;
    expect(tubewellWaterTradeoff.summary).toContain("Under tubewell irrigation");
    expect(tubewellWaterTradeoff.summary).toContain("critical depletion risk tier");

    // Under surface canal irrigation, direct aquifer pumping is buffered,
    // but peak flooded rice exceeds weekly Warabandi roster capacity requiring supplemental pumping (high pressure tier)
    expect(canalEval.groundwaterPressureIndex).toBe("high");
    const canalWaterTradeoff = canalEval.tradeoffs.find(
      (t) => t.dimension === "water_exposure"
    )!;
    expect(canalWaterTradeoff.summary).toContain("Under canal command");
    expect(canalWaterTradeoff.summary).toContain("Warabandi scheduling");
    expect(
      canalWaterTradeoff.disadvantages.some((d) =>
        d.includes("Rotational Warabandi canal turns cannot sustain continuous standing water")
      )
    ).toBe(true);

    // Verifies no hardcoded "Ludhiana district" in generic candidate evaluation disadvantages
    expect(tubewellWaterTradeoff.disadvantages.some((d) => d.includes("over-exploited Punjab assessment blocks"))).toBe(true);
    expect(tubewellWaterTradeoff.disadvantages.some((d) => d.includes("over-exploited Ludhiana district"))).toBe(false);
  });

  // 3. Stage A Transparency for Missing Context & Physical Feasibility Checks
  it("transparently logs default assumptions when profile fields are missing", () => {
    // Feasibility evaluation with completely empty context
    const unconfiguredFeasibility = evaluateRotationFeasibility(dsrWheatDef, {});

    expect(unconfiguredFeasibility.warnings.some((w) => w.includes("Irrigation source not specified"))).toBe(true);
    expect(unconfiguredFeasibility.warnings.some((w) => w.includes("Soil texture not specified"))).toBe(true);

    const irrigationCriterion = unconfiguredFeasibility.criteria.find(
      (c) => c.code === "IRRIGATION_FEASIBILITY"
    )!;
    expect(irrigationCriterion.explanation).toContain("regional assured irrigation assumptions");

    // Sandy soil must reject DSR on iron chlorosis grounds
    const sandyContext: RotationFarmerContext = { soilTexture: "sandy" };
    const sandyFeasibility = evaluateRotationFeasibility(dsrWheatDef, sandyContext);
    expect(sandyFeasibility.isFeasible).toBe(false);
    expect(sandyFeasibility.rejectionReasons.some((r) => r.includes("iron chlorosis"))).toBe(true);
  });

  // 4. Advisory Report Disclosure Banner Integrity & Taxonomy
  it("renders distinct banners and provenance disclosures across the 4-tier profile taxonomy", () => {
    const maizeWheat = compareCropRotation(maizeWheatDef, climate);
    const riceWheat = compareCropRotation(riceWheatDef, climate);

    // Tier 1: Regional demonstration baseline (0 user fields)
    const unconfiguredReport = generateFarmerAdvisoryReport({
      mode: "baseline",
      farmContext: {},
      baselineRotation: riceWheat,
      selectedCandidate: maizeWheat,
    });
    expect(unconfiguredReport.farmContext.completeness).toBe("regional_baseline");
    expect(unconfiguredReport.scenarioDisclosure.isProfileConfirmed).toBe(false);
    expect(unconfiguredReport.scenarioDisclosure.isSimulated).toBe(false);
    expect(unconfiguredReport.scenarioDisclosure.bannerTitle).toBe(
      "ℹ️ REGIONAL DEMONSTRATION BASELINE (CENTRAL PUNJAB)"
    );

    // Tier 2: Partially configured farm profile (1–3 fields provided)
    const partialReport = generateFarmerAdvisoryReport({
      mode: "baseline",
      farmContext: {
        savedSoilTexture: "loam",
        isSoilProvided: true,
      },
      baselineRotation: riceWheat,
      selectedCandidate: maizeWheat,
    });
    expect(partialReport.farmContext.completeness).toBe("partially_configured");
    expect(partialReport.scenarioDisclosure.isProfileConfirmed).toBe(false);
    expect(partialReport.scenarioDisclosure.bannerTitle).toBe(
      "⚠️ PARTIALLY CONFIGURED FARM PROFILE"
    );
    expect(partialReport.farmContext.unconfiguredFields).toContain("Operational Land Area");
    expect(partialReport.farmContext.unconfiguredFields).toContain("Irrigation Water Source");

    // Tier 3: Farmer-provided profile (all 4 core fields supplied)
    const confirmedReport = generateFarmerAdvisoryReport({
      mode: "baseline",
      farmContext: {
        locationName: "Bathinda, Punjab, India",
        isLocationProvided: true,
        savedSoilTexture: "loam",
        isSoilProvided: true,
        savedIrrigationSource: "tubewell_deep",
        isIrrigationProvided: true,
        landAreaHectares: 3.5,
        isLandAreaProvided: true,
      },
      baselineRotation: riceWheat,
      selectedCandidate: maizeWheat,
    });
    expect(confirmedReport.farmContext.completeness).toBe("farmer_provided");
    expect(confirmedReport.scenarioDisclosure.isProfileConfirmed).toBe(true);
    expect(confirmedReport.scenarioDisclosure.isSimulated).toBe(false);
    expect(confirmedReport.scenarioDisclosure.bannerTitle).toBe(
      "📋 FARMER-PROVIDED PROFILE & REGIONAL BASELINE"
    );

    // Tier 4: Simulated What-If scenario (hypothetical simulation active)
    const simulatedReport = generateFarmerAdvisoryReport({
      mode: "baseline",
      farmContext: {
        savedSoilTexture: "loam",
      },
      scenarioContext: {
        isScenarioActive: true,
        simulatedSoilTexture: "sandy",
      },
      baselineRotation: riceWheat,
      selectedCandidate: maizeWheat,
    });
    expect(simulatedReport.scenarioDisclosure.isSimulated).toBe(true);
    expect(simulatedReport.scenarioDisclosure.bannerTitle).toBe(
      "⚠️ WHAT-IF SCENARIO DISCLOSURE (HYPOTHETICAL SIMULATION)"
    );

    // HTML Output includes print layout rules and eliminates mm/ha
    const html = renderAdvisoryReportHtml(simulatedReport);
    expect(html).toContain("page-break-after: avoid;");
    expect(html).toContain("page-break-inside: avoid;");
    expect(html).toContain("Annual Supplemental Irrigation Requirement");
    expect(html).toContain("Does not represent measured farm groundwater metering");
    expect(html).not.toContain("mm/ha");
    expect(confirmedReport.comparisonHighlights.waterDemandContrast).not.toContain("mm/ha");
    expect(confirmedReport.comparisonHighlights.waterDemandContrast).toContain("mm/yr");
  });

  // 5. Cross-Layer Consistency
  it("guarantees mathematical and qualitative consistency across all 4 evaluation pathways", () => {
    const context: RotationFarmerContext = {
      soilTexture: "loam",
      irrigationSource: "tubewell_deep",
    };

    // Pathway 1: Raw engine evaluation
    const directEval = compareCropRotation(maizeWheatDef, climate, context);

    // Pathway 2: What-If recalculator (without scenario changes)
    const baseEval = compareCropRotation(riceWheatDef, climate, context);
    const recalcResult = recalculateRotationsForScenario(
      baseEval,
      [directEval],
      { soilTexture: null, irrigationSource: null },
      context
    );
    const recalcMaize = recalcResult.alternatives[0];

    // Pathway 3: Candidate comparison
    const candComp = compareTwoRotations(baseEval, directEval);

    // Pathway 4: Advisory report item
    const report = generateFarmerAdvisoryReport({
      mode: "baseline",
      farmContext: {
        savedSoilTexture: "loam",
        savedIrrigationSource: "tubewell_deep",
      },
      baselineRotation: baseEval,
      selectedCandidate: directEval,
    });
    const reportItem = report.rotations.find((r) => r.rotationId === "rotation_maize_wheat")!;

    // Assert absolute consistency across all pathways:
    // Water demand
    expect(directEval.waterDemandTotalCategory).toBe("moderate");
    expect(recalcMaize.waterDemandTotalCategory).toBe("moderate");
    expect(candComp.waterComparison.waterDemandMmB).toBe(900);
    expect(reportItem.waterDemandMm).toBe(900);

    // Feasibility status
    expect(directEval.feasibility.isFeasible).toBe(true);
    expect(recalcMaize.feasibility.isFeasible).toBe(true);
    expect(reportItem.isFeasible).toBe(true);

    // Groundwater pressure tier
    expect(directEval.groundwaterPressureIndex).toBe("low");
    expect(recalcMaize.groundwaterPressureIndex).toBe("low");
    expect(reportItem.groundwaterPressureIndex).toBe("low");

    // Turnaround buffer
    expect(candComp.turnaroundComparison.minTurnaroundB).toBe(30);
    expect(reportItem.minTurnaroundDays).toBe(30);
  });
});

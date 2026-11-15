import { describe, expect, it } from "vitest";
import { CANDIDATE_ROTATIONS } from "@/agronomy/rotations";
import { compareCropRotation } from "@/engine/comparison";
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

describe("Farmer Advisory Report Generator & Export Engine", () => {
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

  // 1. Baseline report generation
  it("generates a comprehensive baseline comparison advisory report with farm context and climate baseline", () => {
    const baseline = getRecalculatedCandidate("rotation_rice_wheat");
    const maizeWheat = getRecalculatedCandidate("rotation_maize_wheat");

    const report = generateFarmerAdvisoryReport({
      mode: "baseline",
      farmContext: {
        locationName: "Ludhiana District, Punjab",
        coordinates: { lat: 30.9, lon: 75.85 },
        landAreaHectares: 4.5,
        savedSoilTexture: "loam",
        savedIrrigationSource: "tubewell_deep",
      },
      climateContext: {
        periodText: "2015 – 2024 (10-Yr Baseline)",
        meanAnnualRainfallMm: 680,
        seasonalMonsoonMm: 520,
        meanTemperatureC: 24.2,
        rainfallVariabilityCvPercent: 14.5,
      },
      baselineRotation: baseline,
      selectedCandidate: maizeWheat,
    });

    expect(report.reportId).toMatch(/^SPROUTNIK-ADV-/);
    expect(report.mode).toBe("baseline");
    expect(report.farmContext.locationName).toBe("Ludhiana District, Punjab");
    expect(report.farmContext.coordinatesText).toBe("30.90° N, 75.85° E");
    expect(report.farmContext.landAreaText).toContain("4.5 ha");
    expect(report.farmContext.savedSoilLabel).toContain("Loam");
    expect(report.farmContext.savedIrrigationLabel).toContain("Deep Tubewell");

    // Climate summary
    expect(report.climateSummary.meanAnnualRainfallMm).toBe(680);
    expect(report.climateSummary.monsoonMm).toBe(520);
    expect(report.climateSummary.meanTemperatureC).toBe(24.2);

    // Rotations evaluated
    expect(report.rotations).toHaveLength(2);
    const [repBaseline, repCandidate] = report.rotations;
    expect(repBaseline.role).toBe("baseline");
    expect(repBaseline.name).toContain("Rice");
    expect(repBaseline.waterDemandMm).toBe(2150);

    expect(repCandidate.role).toBe("candidate");
    expect(repCandidate.name).toContain("Maize");
    expect(repCandidate.waterDemandMm).toBe(900);
    expect(repCandidate.isFeasible).toBe(true);

    // Stage A criteria checks
    expect(repCandidate.criteria.length).toBeGreaterThan(0);
    expect(repCandidate.criteria[0]).toHaveProperty("code");
    expect(repCandidate.criteria[0]).toHaveProperty("passed");
    expect(repCandidate.criteria[0]).toHaveProperty("explanation");

    // Stage B tradeoffs
    expect(repCandidate.tradeoffs).toHaveLength(5);

    // Water delta contrast
    expect(report.comparisonHighlights.waterDemandContrast).toContain("1250 mm/yr");
    expect(report.comparisonHighlights.waterDemandContrast).toContain("-58%");

    // Checklist & Disclaimers
    expect(report.farmerInvestigationChecklist.length).toBeGreaterThanOrEqual(3);
    expect(report.scientificDisclaimer).toContain("decision support");
  });

  // 2. Candidate comparison report generation
  it("generates a candidate-to-candidate advisory report with side-by-side trade-offs", () => {
    const maizeWheat = getRecalculatedCandidate("rotation_maize_wheat");
    const dsrWheat = getRecalculatedCandidate("rotation_dsr_wheat");

    const report = generateFarmerAdvisoryReport({
      mode: "head_to_head",
      farmContext: {
        locationName: "Jalandhar District, Punjab",
      },
      candidateA: maizeWheat,
      candidateB: dsrWheat,
    });

    expect(report.mode).toBe("head_to_head");
    expect(report.rotations).toHaveLength(2);
    expect(report.rotations[0].name).toContain("Maize");
    expect(report.rotations[1].name).toContain("Direct");

    // Quantitative contrasts
    expect(report.comparisonHighlights.waterDemandContrast).toContain("Maize");
    expect(report.comparisonHighlights.waterDemandContrast).toContain("DSR");
    expect(report.comparisonHighlights.turnaroundContrast).toBeDefined();

    // Specific reasons to choose
    expect(report.comparisonHighlights.keyTradeoffs.length).toBeGreaterThan(0);
  });

  // 3. Active What-If scenario disclosure
  it("prominently discloses active What-If simulation and distinguishes simulated vs saved profile", () => {
    const baseline = getRecalculatedCandidate("rotation_rice_wheat");
    const maizeWheat = getRecalculatedCandidate("rotation_maize_wheat");

    const report = generateFarmerAdvisoryReport({
      mode: "baseline",
      farmContext: {
        savedSoilTexture: "loam",
        savedIrrigationSource: "tubewell_deep",
      },
      scenarioContext: {
        isScenarioActive: true,
        simulatedSoilTexture: "sandy",
        simulatedIrrigationSource: "canal",
      },
      baselineRotation: baseline,
      selectedCandidate: maizeWheat,
    });

    expect(report.scenarioDisclosure.isSimulated).toBe(true);
    expect(report.scenarioDisclosure.simulatedSoilLabel).toContain("Sandy");
    expect(report.scenarioDisclosure.simulatedIrrigationLabel).toContain("Canal");
    expect(report.scenarioDisclosure.disclosureNote).toContain("NOTICE: This advisory report incorporates an active What-If simulation");
    expect(report.scenarioDisclosure.disclosureNote).toContain("hypothetical");
  });

  // 4. Missing farmer profile fields / defaults
  it("gracefully defaults missing farm profile fields without throwing", () => {
    const baseline = getRecalculatedCandidate("rotation_rice_wheat");
    const maizeWheat = getRecalculatedCandidate("rotation_maize_wheat");

    const report = generateFarmerAdvisoryReport({
      mode: "baseline",
      farmContext: {},
      baselineRotation: baseline,
      selectedCandidate: maizeWheat,
    });

    expect(report.farmContext.locationName).toBe("Ludhiana Demonstration Region, Punjab");
    expect(report.farmContext.coordinatesText).toBe("30.90° N, 75.85° E");
    expect(report.farmContext.landAreaText).toContain("Not specified");
    expect(report.farmContext.savedSoilLabel).toContain("Loam");
    expect(report.farmContext.savedIrrigationLabel).toContain("Deep Tubewell");
    expect(report.scenarioDisclosure.isSimulated).toBe(false);
  });

  // 5. Evidence and limitations handling
  it("discloses evidence sources, information gaps (unknowns), and scientific notice", () => {
    const baseline = getRecalculatedCandidate("rotation_rice_wheat");
    const moongRotation = getRecalculatedCandidate("rotation_rice_wheat_moong");

    const report = generateFarmerAdvisoryReport({
      mode: "baseline",
      farmContext: {},
      baselineRotation: baseline,
      selectedCandidate: moongRotation,
    });

    const candidate = report.rotations.find((r) => r.role === "candidate")!;
    expect(candidate.evidence.length).toBeGreaterThan(0);
    expect(candidate.evidence.some((e) => e.source.includes("PAU"))).toBe(true);
    expect(candidate.unknowns).toBeDefined();
    expect(report.scientificDisclaimer).toBeDefined();
  });

  // 6. Water values and physical feasibility integrity
  it("preserves exact agronomic water requirements and physical feasibility status", () => {
    const baseline = getRecalculatedCandidate("rotation_rice_wheat");
    const maizeWheat = getRecalculatedCandidate("rotation_maize_wheat");

    const report = generateFarmerAdvisoryReport({
      mode: "baseline",
      farmContext: {},
      baselineRotation: baseline,
      selectedCandidate: maizeWheat,
    });

    const candItem = report.rotations.find((r) => r.role === "candidate")!;
    expect(candItem.waterDemandMm).toBe(900); // 500 maize + 400 wheat
    expect(candItem.isFeasible).toBe(true);
    expect(candItem.rejectionReasons).toHaveLength(0);
  });

  // 7. Error handling & validation
  it("throws clear descriptive errors when required rotation parameters are missing", () => {
    expect(() =>
      generateFarmerAdvisoryReport({
        mode: "baseline",
        farmContext: {},
      })
    ).toThrow("Baseline assessment mode requires a selectedCandidate");

    expect(() =>
      generateFarmerAdvisoryReport({
        mode: "head_to_head",
        farmContext: {},
      })
    ).toThrow("Candidate comparison mode requires candidateA and candidateB");
  });

  // 8. HTML Renderer output format
  it("renders a printable, self-contained A4 HTML advisory document with @page CSS and tables", () => {
    const baseline = getRecalculatedCandidate("rotation_rice_wheat");
    const maizeWheat = getRecalculatedCandidate("rotation_maize_wheat");

    const report = generateFarmerAdvisoryReport({
      mode: "baseline",
      farmContext: {
        locationName: "Bathinda District, Punjab",
        coordinates: { lat: 30.2, lon: 74.95 },
      },
      scenarioContext: {
        isScenarioActive: true,
        simulatedSoilTexture: "sandy",
      },
      baselineRotation: baseline,
      selectedCandidate: maizeWheat,
    });

    const html = renderAdvisoryReportHtml(report);

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("@page {");
    expect(html).toContain("size: A4 portrait;");
    expect(html).toContain(report.reportId);
    expect(html).toContain("Bathinda District, Punjab");
    expect(html).toContain("Maize");
    expect(html).toContain("900 mm/yr");
    expect(html).toContain("WHAT-IF SCENARIO DISCLOSURE");
    expect(html).toContain("Decision Support Notice");
    expect(html).toContain("Punjab Agricultural University");
  });
});

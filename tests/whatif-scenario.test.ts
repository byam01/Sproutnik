import { describe, expect, it, vi } from "vitest";
import { CANDIDATE_ROTATIONS } from "@/agronomy/rotations";
import { compareCropRotation } from "@/engine/comparison";
import { MOCK_CLIMATE_INDICATORS_LUDHIANA } from "@/fixtures/climate.mock";
import {
  normalizeIrrigationSource,
  normalizeSoilTexture,
  recalculateRotationsForScenario,
  WhatIfScenarioState,
} from "@/utils/scenarioRecalculator";
import {
  RotationComparisonResult,
  RotationFarmerContext,
} from "@/types";

describe("What-If Agronomic Scenario Simulator", () => {
  const climate = MOCK_CLIMATE_INDICATORS_LUDHIANA;

  // Helper to generate fresh baseline comparison results using the canonical engine
  function generateCandidateResults(context?: RotationFarmerContext) {
    const allEvaluated = CANDIDATE_ROTATIONS.map((r) =>
      compareCropRotation(r, climate, context)
    );
    const baseline = allEvaluated.find((r) => r.isBaseline)!;
    const alternatives = allEvaluated.filter((r) => !r.isBaseline);
    return { baseline, alternatives };
  }

  // 1. Changing soil texture recalculates feasibility
  it("recalculates Stage A feasibility when soil texture changes", () => {
    // Saved profile is sandy soil
    const savedContext: RotationFarmerContext = {
      soilTexture: "sandy",
      irrigationSource: "tubewell_deep",
    };
    const { baseline, alternatives } = generateCandidateResults(savedContext);

    // In saved sandy soil, DSR is rejected by PAU guidelines
    const dsrInitial = alternatives.find((a) => a.rotationId === "rotation_dsr_wheat")!;
    expect(dsrInitial.feasibility.isFeasible).toBe(false);
    expect(dsrInitial.feasibility.rejectionReasons.some((r) => r.includes("iron chlorosis"))).toBe(true);

    // Farmer tests scenario: Loam soil
    const scenario: WhatIfScenarioState = {
      soilTexture: "loam",
      irrigationSource: null, // unchanged
    };

    const result = recalculateRotationsForScenario(
      baseline,
      alternatives,
      scenario,
      savedContext
    );

    expect(result.isScenarioActive).toBe(true);
    const dsrRecalculated = result.alternatives.find(
      (a) => a.rotationId === "rotation_dsr_wheat"
    )!;
    expect(dsrRecalculated.feasibility.isFeasible).toBe(true);
    expect(dsrRecalculated.changeStatus).toBe("became_feasible");
    expect(dsrRecalculated.feasibility.rejectionReasons.length).toBe(0);
  });

  // 2. Changing irrigation recalculates feasibility
  it("recalculates Stage A feasibility and rejection reasons when irrigation changes", () => {
    // Saved profile has deep tubewell
    const savedContext: RotationFarmerContext = {
      soilTexture: "loam",
      irrigationSource: "tubewell_deep",
    };
    const { baseline, alternatives } = generateCandidateResults(savedContext);

    // Initial baseline rice-wheat is feasible
    expect(baseline.feasibility.isFeasible).toBe(true);

    // Farmer simulates rainfed conditions
    const scenario: WhatIfScenarioState = {
      soilTexture: null,
      irrigationSource: "rainfed_only",
    };

    const result = recalculateRotationsForScenario(
      baseline,
      alternatives,
      scenario,
      savedContext
    );

    expect(result.isScenarioActive).toBe(true);
    expect(result.baseline.feasibility.isFeasible).toBe(false);
    expect(result.baseline.changeStatus).toBe("became_infeasible");
    expect(
      result.baseline.feasibility.rejectionReasons.some((r) =>
        r.includes("cannot be sustained under rainfed-only conditions")
      )
    ).toBe(true);
    expect(result.impactSummary.becameInfeasibleCount).toBeGreaterThanOrEqual(1);
  });

  // 3. A rejected rotation can become feasible when constraints change
  it("allows a rejected rotation to become feasible when physical constraints are relaxed", () => {
    // Saved context has sandy soil where DSR is physically restricted
    const savedContext: RotationFarmerContext = {
      soilTexture: "sandy",
      irrigationSource: "canal",
    };
    const { baseline, alternatives } = generateCandidateResults(savedContext);

    const dsrOriginal = alternatives.find((a) => a.rotationId === "rotation_dsr_wheat")!;
    expect(dsrOriginal.feasibility.isFeasible).toBe(false);

    // Change soil to sandy loam (viable for DSR in PAU guidelines)
    const scenario: WhatIfScenarioState = {
      soilTexture: "sandy_loam",
      irrigationSource: null,
    };

    const result = recalculateRotationsForScenario(
      baseline,
      alternatives,
      scenario,
      savedContext
    );

    const dsrRecalc = result.alternatives.find((a) => a.rotationId === "rotation_dsr_wheat")!;
    expect(dsrRecalc.feasibility.isFeasible).toBe(true);
    expect(dsrRecalc.changeStatus).toBe("became_feasible");
    expect(result.impactSummary.becameFeasibleCount).toBe(1);
  });

  // 4. Reset restores the saved profile conditions
  it("restores saved profile conditions when scenario is reset to null", () => {
    const savedContext: RotationFarmerContext = {
      soilTexture: "loam",
      irrigationSource: "tubewell_deep",
    };
    const { baseline, alternatives } = generateCandidateResults(savedContext);

    // 1. Activate scenario
    const activeScenario: WhatIfScenarioState = {
      soilTexture: "sandy",
      irrigationSource: "rainfed_only",
    };
    const simulated = recalculateRotationsForScenario(
      baseline,
      alternatives,
      activeScenario,
      savedContext
    );
    expect(simulated.isScenarioActive).toBe(true);
    expect(simulated.baseline.feasibility.isFeasible).toBe(false);

    // 2. Reset scenario
    const resetScenario: WhatIfScenarioState = {
      soilTexture: null,
      irrigationSource: null,
    };
    const restored = recalculateRotationsForScenario(
      baseline,
      alternatives,
      resetScenario,
      savedContext
    );

    expect(restored.isScenarioActive).toBe(false);
    expect(restored.effectiveContext.soilTexture).toBe("loam");
    expect(restored.effectiveContext.irrigationSource).toBe("tubewell_deep");
    expect(restored.baseline.feasibility.isFeasible).toBe(true);
    expect(restored.baseline.changeStatus).toBe("unchanged");
    expect(restored.impactSummary.becameFeasibleCount).toBe(0);
    expect(restored.impactSummary.becameInfeasibleCount).toBe(0);
  });

  // 5. Scenario changes never persist to the backend
  it("does not trigger any network requests or storage persistence during scenario calculations", () => {
    const fetchSpy = vi.fn();
    const setItemSpy = vi.fn();

    const originalFetch = globalThis.fetch;
    const originalLocalStorage = globalThis.localStorage;

    globalThis.fetch = fetchSpy;
    Object.defineProperty(globalThis, "localStorage", {
      value: { setItem: setItemSpy, getItem: vi.fn(), removeItem: vi.fn() },
      configurable: true,
      writable: true,
    });

    try {
      const savedContext: RotationFarmerContext = {
        soilTexture: "loam",
        irrigationSource: "canal",
      };
      const { baseline, alternatives } = generateCandidateResults(savedContext);

      // Perform multiple rapid scenario recalculations
      recalculateRotationsForScenario(
        baseline,
        alternatives,
        { soilTexture: "sandy", irrigationSource: "rainfed_only" },
        savedContext
      );
      recalculateRotationsForScenario(
        baseline,
        alternatives,
        { soilTexture: "clay_loam", irrigationSource: "tubewell_deep" },
        savedContext
      );

      // Verify zero network and storage side-effects
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(setItemSpy).not.toHaveBeenCalled();
    } finally {
      globalThis.fetch = originalFetch;
      Object.defineProperty(globalThis, "localStorage", {
        value: originalLocalStorage,
        configurable: true,
        writable: true,
      });
    }
  });

  // 6. Missing soil or irrigation information is handled transparently
  it("handles missing saved profile constraints gracefully with documented default assumptions", () => {
    // Farmer profile has no soil or irrigation specified
    const unconfiguredContext: RotationFarmerContext = {
      soilTexture: undefined,
      irrigationSource: undefined,
    };
    const { baseline, alternatives } = generateCandidateResults(unconfiguredContext);

    // Initial evaluation has warnings about unspecified soil texture
    expect(
      baseline.feasibility.warnings.some((w) => w.includes("Soil texture not specified"))
    ).toBe(true);

    // Scenario supplies a soil texture
    const scenario: WhatIfScenarioState = {
      soilTexture: "clay_loam",
      irrigationSource: null,
    };

    const result = recalculateRotationsForScenario(
      baseline,
      alternatives,
      scenario,
      unconfiguredContext
    );

    expect(result.isScenarioActive).toBe(true);
    expect(result.effectiveContext.soilTexture).toBe("clay_loam");
    // Under clay_loam, the "not specified" warning is replaced by specific soil considerations
    const maizeWheat = result.alternatives.find((a) => a.rotationId === "rotation_maize_wheat")!;
    expect(
      maizeWheat.feasibility.warnings.some((w) => w.includes("ridge planting"))
    ).toBe(true);
  });

  // 7. Existing feasibility behavior remains unchanged when no scenario is active
  it("keeps existing feasibility results completely untouched when no scenario is active", () => {
    const savedContext: RotationFarmerContext = {
      soilTexture: "loam",
      irrigationSource: "tubewell_deep",
    };
    const { baseline, alternatives } = generateCandidateResults(savedContext);

    const inactiveScenario: WhatIfScenarioState = {
      soilTexture: null,
      irrigationSource: null,
    };

    const result = recalculateRotationsForScenario(
      baseline,
      alternatives,
      inactiveScenario,
      savedContext
    );

    expect(result.isScenarioActive).toBe(false);
    expect(result.baseline.feasibility).toEqual(baseline.feasibility);
    expect(result.alternatives[0].feasibility).toEqual(alternatives[0].feasibility);
    expect(result.alternatives[1].feasibility).toEqual(alternatives[1].feasibility);
  });

  // Helper normalizers test
  it("correctly normalizes loose label strings to canonical enum values", () => {
    expect(normalizeSoilTexture("Sandy Loam")).toBe("sandy_loam");
    expect(normalizeSoilTexture("clay")).toBe("clay_loam");
    expect(normalizeSoilTexture("Clay Loam")).toBe("clay_loam");
    expect(normalizeSoilTexture("Loam")).toBe("loam");
    expect(normalizeSoilTexture("silt")).toBe("silt_loam");

    expect(normalizeIrrigationSource("Rainfed")).toBe("rainfed_only");
    expect(normalizeIrrigationSource("Canal")).toBe("canal");
    expect(normalizeIrrigationSource("Shallow Tubewell")).toBe("tubewell_shallow");
    expect(normalizeIrrigationSource("Deep Tubewell")).toBe("tubewell_deep");
    expect(normalizeIrrigationSource("deep")).toBe("tubewell_deep");
  });
});

import {
  IrrigationSourceType,
  RotationComparisonResult,
  RotationFarmerContext,
  RotationFeasibilityResult,
  SoilTextureType,
} from "@/types";
import { CANDIDATE_ROTATIONS } from "@/agronomy/rotations";
import { evaluateRotationFeasibility } from "@/engine/feasibility";
import { calculateRotationEconomics } from "@/engine/economics";

export type ScenarioChangeStatus =
  | "became_feasible"
  | "became_infeasible"
  | "remained_feasible"
  | "remained_infeasible"
  | "unchanged";

export interface WhatIfScenarioState {
  soilTexture: SoilTextureType | null;
  irrigationSource: IrrigationSourceType | null;
}

export interface RecalculatedRotation extends RotationComparisonResult {
  isScenarioActive: boolean;
  changeStatus: ScenarioChangeStatus;
  savedFeasibility?: RotationFeasibilityResult;
}

export interface ScenarioImpactSummary {
  isScenarioActive: boolean;
  totalEvaluated: number;
  feasibleCount: number;
  infeasibleCount: number;
  becameFeasibleCount: number;
  becameInfeasibleCount: number;
  keyObservations: string[];
}

export interface ScenarioRecalculationResult {
  baseline: RecalculatedRotation;
  alternatives: RecalculatedRotation[];
  isScenarioActive: boolean;
  impactSummary: ScenarioImpactSummary;
  effectiveContext: RotationFarmerContext;
}

export const SOIL_TEXTURE_OPTIONS: Array<{
  id: SoilTextureType;
  label: string;
  shortDesc: string;
  tag: string;
}> = [
    {
      id: "sandy",
      label: "Sandy",
      shortDesc: "Light, coarse grains; very rapid drainage",
      tag: "Light / Rapid Drainage",
    },
    {
      id: "sandy_loam",
      label: "Sandy Loam",
      shortDesc: "Gritty feel, drains fast, easy tillage",
      tag: "Fast Drainage",
    },
    {
      id: "loam",
      label: "Loam",
      shortDesc: "Balanced water retention and soil aeration",
      tag: "Punjab Baseline",
    },
    {
      id: "clay_loam",
      label: "Clay Loam",
      shortDesc: "Heavy, sticky soil; high water retention",
      tag: "Rice Belt Soil",
    },
    {
      id: "silt_loam",
      label: "Silt Loam",
      shortDesc: "Floury texture, smooth alluvial deposit",
      tag: "Doaba Alluvial",
    },
  ];

export const IRRIGATION_SOURCE_OPTIONS: Array<{
  id: IrrigationSourceType;
  label: string;
  shortDesc: string;
  tag: string;
}> = [
    {
      id: "rainfed_only",
      label: "Rainfed",
      shortDesc: "Rainwater only (no assured irrigation)",
      tag: "Monsoon Only (<800 mm)",
    },
    {
      id: "canal",
      label: "Canal",
      shortDesc: "Gravity canal network on fixed turns (warabandi)",
      tag: "Surface Gravity",
    },
    {
      id: "tubewell_shallow",
      label: "Shallow Tubewell",
      shortDesc: "Centrifugal pump operating within 30–100 ft",
      tag: "Centrifugal (<20 m)",
    },
    {
      id: "tubewell_deep",
      label: "Deep Tubewell",
      shortDesc: "Submersible pump drilled >150 ft into deep aquifer",
      tag: "Submersible (>50 m)",
    },
  ];

export function normalizeSoilTexture(val: string): SoilTextureType {
  const norm = val.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (norm === "sandy") return "sandy";
  if (norm === "sandy_loam") return "sandy_loam";
  if (norm === "loam") return "loam";
  if (norm === "clay_loam" || norm === "clay") return "clay_loam";
  if (norm === "silt_loam" || norm === "silt") return "silt_loam";
  return "loam";
}

export function normalizeIrrigationSource(val: string): IrrigationSourceType {
  const norm = val.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (norm === "rainfed" || norm === "rainfed_only") return "rainfed_only";
  if (norm === "canal") return "canal";
  if (
    norm === "shallow_tubewell" ||
    norm === "tubewell_shallow" ||
    norm === "shallow"
  )
    return "tubewell_shallow";
  if (
    norm === "deep_tubewell" ||
    norm === "tubewell_deep" ||
    norm === "deep"
  )
    return "tubewell_deep";
  if (norm === "conjunctive") return "conjunctive";
  return "tubewell_deep";
}

/**
 * Re-evaluates baseline and alternative rotations using the canonical evaluateRotationFeasibility engine.
 * Never mutates or overwrites saved farmer profiles or storage.
 */
export function recalculateRotationsForScenario(
  baseline: RotationComparisonResult,
  alternatives: RotationComparisonResult[],
  scenario: WhatIfScenarioState,
  savedContext?: RotationFarmerContext
): ScenarioRecalculationResult {
  const isSoilModified =
    scenario.soilTexture !== null &&
    scenario.soilTexture !== (savedContext?.soilTexture ?? null);

  const isIrrigationModified =
    scenario.irrigationSource !== null &&
    scenario.irrigationSource !== (savedContext?.irrigationSource ?? null);

  const isScenarioActive = isSoilModified || isIrrigationModified;

  const effectiveSoil = scenario.soilTexture ?? savedContext?.soilTexture;
  const effectiveIrrigation =
    scenario.irrigationSource ?? savedContext?.irrigationSource;

  const effectiveContext: RotationFarmerContext = {
    soilTexture: effectiveSoil,
    irrigationSource: effectiveIrrigation,
    groundwaterDepthMeters: savedContext?.groundwaterDepthMeters,
  };

  // If scenario is inactive, return existing results without modification
  if (!isScenarioActive) {
    const allRotations = [baseline, ...alternatives];
    const feasibleCount = allRotations.filter((r) => r.feasibility.isFeasible).length;

    return {
      baseline: {
        ...baseline,
        isScenarioActive: false,
        changeStatus: "unchanged",
      },
      alternatives: alternatives.map((alt) => ({
        ...alt,
        isScenarioActive: false,
        changeStatus: "unchanged",
      })),
      isScenarioActive: false,
      impactSummary: {
        isScenarioActive: false,
        totalEvaluated: allRotations.length,
        feasibleCount,
        infeasibleCount: allRotations.length - feasibleCount,
        becameFeasibleCount: 0,
        becameInfeasibleCount: 0,
        keyObservations: [],
      },
      effectiveContext,
    };
  }

  // Helper to re-evaluate one rotation against canonical engine
  const baselineDef = CANDIDATE_ROTATIONS.find(
    (r) => r.id === baseline.rotationId
  );
  let recalculatedBaselineEcon = baseline.economics;
  if (baselineDef && baseline.economics) {
    try {
      recalculatedBaselineEcon = calculateRotationEconomics(
        baselineDef,
        effectiveContext
      );
    } catch {
      recalculatedBaselineEcon = baseline.economics;
    }
  }

  function recalculateOne(
    original: RotationComparisonResult,
    isBaselineRotation: boolean
  ): RecalculatedRotation {
    const definition = CANDIDATE_ROTATIONS.find(
      (r) => r.id === original.rotationId
    );

    if (!definition) {
      return {
        ...original,
        isScenarioActive: true,
        changeStatus: "unchanged",
        savedFeasibility: original.feasibility,
      };
    }

    const updatedFeasibility = evaluateRotationFeasibility(
      definition,
      effectiveContext
    );

    const wasFeasible = original.feasibility.isFeasible;
    const isNowFeasible = updatedFeasibility.isFeasible;

    let changeStatus: ScenarioChangeStatus = "unchanged";
    if (!wasFeasible && isNowFeasible) {
      changeStatus = "became_feasible";
    } else if (wasFeasible && !isNowFeasible) {
      changeStatus = "became_infeasible";
    } else if (isNowFeasible) {
      changeStatus = "remained_feasible";
    } else {
      changeStatus = "remained_infeasible";
    }

    let updatedEconomics = original.economics;
    if (original.economics) {
      try {
        updatedEconomics = calculateRotationEconomics(
          definition,
          effectiveContext,
          isBaselineRotation ? undefined : recalculatedBaselineEcon
        );
      } catch {
        updatedEconomics = original.economics;
      }
    }

    return {
      ...original,
      feasibility: updatedFeasibility,
      economics: updatedEconomics,
      isScenarioActive: true,
      changeStatus,
      savedFeasibility: original.feasibility,
    };
  }

  const recalculatedBaseline = recalculateOne(baseline, true);
  const recalculatedAlternatives = alternatives.map((a) => recalculateOne(a, false));

  const allRecalculated = [recalculatedBaseline, ...recalculatedAlternatives];
  const feasibleCount = allRecalculated.filter(
    (r) => r.feasibility.isFeasible
  ).length;
  const becameFeasibleCount = allRecalculated.filter(
    (r) => r.changeStatus === "became_feasible"
  ).length;
  const becameInfeasibleCount = allRecalculated.filter(
    (r) => r.changeStatus === "became_infeasible"
  ).length;

  // Generate plain-language agronomic observations from real engine rules
  const keyObservations: string[] = [];

  if (effectiveIrrigation === "rainfed_only") {
    keyObservations.push(
      "Under rainfed conditions, all high-water rotations (>800 mm) are rejected due to Punjab's ~680 mm mean annual rainfall ceiling."
    );
  } else if (effectiveIrrigation === "tubewell_shallow") {
    keyObservations.push(
      "Shallow tubewells risk discharge failure during June–July paddy transplanting in over-exploited blocks where water tables exceed suction depth."
    );
  }

  if (effectiveSoil === "sandy") {
    keyObservations.push(
      "Sandy soil restricts Direct-Seeded Rice (DSR) due to severe iron chlorosis and high percolation loss (PAU Package of Practices)."
    );
  } else if (effectiveSoil === "clay_loam") {
    keyObservations.push(
      "Clay loam provides strong water retention for rice, but requires ridge planting for kharif maize to avert monsoon waterlogging."
    );
  }

  if (becameFeasibleCount > 0) {
    keyObservations.push(
      `${becameFeasibleCount} rotation${becameFeasibleCount > 1 ? "s" : ""} became viable under this scenario.`
    );
  }
  if (becameInfeasibleCount > 0) {
    keyObservations.push(
      `${becameInfeasibleCount} rotation${becameInfeasibleCount > 1 ? "s" : ""} became restricted under this scenario.`
    );
  }

  return {
    baseline: recalculatedBaseline,
    alternatives: recalculatedAlternatives,
    isScenarioActive: true,
    impactSummary: {
      isScenarioActive: true,
      totalEvaluated: allRecalculated.length,
      feasibleCount,
      infeasibleCount: allRecalculated.length - feasibleCount,
      becameFeasibleCount,
      becameInfeasibleCount,
      keyObservations,
    },
    effectiveContext,
  };
}

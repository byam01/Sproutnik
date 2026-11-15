import {
  CANDIDATE_ROTATIONS,
  getRotationIrrigationWaterMm,
  getRotationMinTurnaroundDays,
} from "@/agronomy/rotations";
import { RecalculatedRotation } from "@/utils/scenarioRecalculator";
import { RotationComparisonResult } from "@/types";

export interface DimensionComparison {
  dimension: string;
  name: string;
  candidateAScore: string;
  candidateBScore: string;
  advantage: "candidate_a" | "candidate_b" | "neutral";
  advantageText: string;
  summaryA: string;
  summaryB: string;
}

export interface CandidateEconomicComparison {
  hasEconomics: boolean;
  netReturnA?: number;
  netReturnB?: number;
  netReturnDiffInrPerHa?: number;
  higherNetReturnCandidate?: "candidate_a" | "candidate_b" | "equal";
  costA?: number;
  costB?: number;
  costDiffInrPerHa?: number;
  lowerCostCandidate?: "candidate_a" | "candidate_b" | "equal";
  bcrA?: number;
  bcrB?: number;
  higherBcrCandidate?: "candidate_a" | "candidate_b" | "equal";
  pumpingCostA?: number;
  pumpingCostB?: number;
  pumpingSavingsInrPerHa?: number;
  summary: string;
  feasibilityWarning?: string;
}

export interface CandidateComparisonResult {
  candidateA: RecalculatedRotation | RotationComparisonResult;
  candidateB: RecalculatedRotation | RotationComparisonResult;
  waterComparison: {
    waterDemandMmA: number;
    waterDemandMmB: number;
    differenceMm: number; // positive means A uses more; negative means A uses less
    percentDifference: number;
    lowerDemandCandidate: "candidate_a" | "candidate_b" | "equal";
    summary: string;
  };
  turnaroundComparison: {
    minTurnaroundA: number;
    minTurnaroundB: number;
    differenceDays: number;
    moreFlexibleCandidate: "candidate_a" | "candidate_b" | "equal";
    summary: string;
  };
  feasibilityComparison: {
    isFeasibleA: boolean;
    isFeasibleB: boolean;
    rejectionReasonsA: string[];
    rejectionReasonsB: string[];
    warningsA: string[];
    warningsB: string[];
    feasibilityContrast:
      | "both_feasible"
      | "both_infeasible"
      | "only_a_feasible"
      | "only_b_feasible";
    summary: string;
  };
  economicComparison: CandidateEconomicComparison;
  dimensionComparisons: DimensionComparison[];
  tradeoffHighlights: {
    reasonsToChooseA: string[];
    reasonsToChooseB: string[];
    risksA: string[];
    risksB: string[];
  };
  farmerInvestigationChecklist: string[];
}

const DIMENSION_NAMES: Record<string, string> = {
  climate_compatibility: "Climate & Thermal Risk",
  water_exposure: "Water Demand & Groundwater Impact",
  diversity: "Agrobiodiversity & Pest Cycles",
  soil_health: "Soil Health & Nutrient Cycling",
  turnaround_feasibility: "Turnaround & Residue Management",
};

const SCORE_RANKS: Record<string, number> = {
  favorable: 3,
  moderate: 2,
  caution: 1,
  unfavorable: 0,
};

/**
 * Computes an objective, explainable head-to-head comparison between two candidate crop rotations.
 * Does not generate opaque composite scores; communicates clear physical and agronomic trade-offs.
 */
export function compareTwoRotations(
  candidateA: RecalculatedRotation | RotationComparisonResult,
  candidateB: RecalculatedRotation | RotationComparisonResult
): CandidateComparisonResult {
  const waterA = getRotationIrrigationWaterMm(candidateA.rotationId);
  const waterB = getRotationIrrigationWaterMm(candidateB.rotationId);
  const diffWaterMm = waterA - waterB;
  const maxWater = Math.max(waterA, waterB);
  const pctWater = maxWater > 0 ? Math.round((Math.abs(diffWaterMm) / maxWater) * 100) : 0;

  const lowerDemandCandidate =
    waterA < waterB
      ? "candidate_a"
      : waterB < waterA
      ? "candidate_b"
      : "equal";

  let waterSummary = "";
  if (lowerDemandCandidate === "candidate_a") {
    waterSummary = `${candidateA.rotationName} requires ~${waterA} mm/yr, conserving ~${Math.abs(
      diffWaterMm
    )} mm/yr (-${pctWater}%, ≈ ${(Math.abs(diffWaterMm) * 10).toLocaleString()} m³/ha/yr) of irrigation application compared to ${candidateB.rotationName} (~${waterB} mm/yr).`;
  } else if (lowerDemandCandidate === "candidate_b") {
    waterSummary = `${candidateB.rotationName} requires ~${waterB} mm/yr, conserving ~${Math.abs(
      diffWaterMm
    )} mm/yr (-${pctWater}%, ≈ ${(Math.abs(diffWaterMm) * 10).toLocaleString()} m³/ha/yr) of irrigation application compared to ${candidateA.rotationName} (~${waterA} mm/yr).`;
  } else {
    waterSummary = `Both rotations have equivalent total irrigation requirements (~${waterA} mm/yr).`;
  }

  // Turnaround comparison
  const minTurnaroundA = getRotationMinTurnaroundDays(candidateA.rotationId);
  const minTurnaroundB = getRotationMinTurnaroundDays(candidateB.rotationId);
  const diffDays = Math.abs(minTurnaroundA - minTurnaroundB);

  const moreFlexibleCandidate =
    minTurnaroundA > minTurnaroundB
      ? "candidate_a"
      : minTurnaroundB > minTurnaroundA
      ? "candidate_b"
      : "equal";

  let turnaroundSummary = "";
  if (moreFlexibleCandidate === "candidate_a") {
    turnaroundSummary = `${candidateA.rotationName} provides a minimum turnaround of ${minTurnaroundA} days (${diffDays} days more buffer than ${candidateB.rotationName} at ${minTurnaroundB} days), reducing post-harvest rush.`;
  } else if (moreFlexibleCandidate === "candidate_b") {
    turnaroundSummary = `${candidateB.rotationName} provides a minimum turnaround of ${minTurnaroundB} days (${diffDays} days more buffer than ${candidateA.rotationName} at ${minTurnaroundA} days), reducing post-harvest rush.`;
  } else {
    turnaroundSummary = `Both cropping sequences share identical minimum turnaround intervals (${minTurnaroundA} days).`;
  }

  // Feasibility comparison
  const isFeasibleA = candidateA.feasibility.isFeasible;
  const isFeasibleB = candidateB.feasibility.isFeasible;

  let feasibilityContrast: CandidateComparisonResult["feasibilityComparison"]["feasibilityContrast"];
  let feasibilitySummary = "";

  if (isFeasibleA && isFeasibleB) {
    feasibilityContrast = "both_feasible";
    feasibilitySummary = "Both rotations satisfy all physical Stage A criteria under your current farm conditions.";
  } else if (!isFeasibleA && !isFeasibleB) {
    feasibilityContrast = "both_infeasible";
    feasibilitySummary = "Both rotations have flagged physical constraints under your current farm conditions.";
  } else if (isFeasibleA && !isFeasibleB) {
    feasibilityContrast = "only_a_feasible";
    feasibilitySummary = `${candidateA.rotationName} is physically feasible, whereas ${candidateB.rotationName} is restricted by physical constraints.`;
  } else {
    feasibilityContrast = "only_b_feasible";
    feasibilitySummary = `${candidateB.rotationName} is physically feasible, whereas ${candidateA.rotationName} is restricted by physical constraints.`;
  }

  // Dimension-by-dimension Stage B evaluations
  const dimensionComparisons: DimensionComparison[] = [];
  const allDimensions = [
    "climate_compatibility",
    "water_exposure",
    "diversity",
    "soil_health",
    "turnaround_feasibility",
  ];

  for (const dim of allDimensions) {
    const tradeA = candidateA.tradeoffs.find((t) => t.dimension === dim);
    const tradeB = candidateB.tradeoffs.find((t) => t.dimension === dim);

    const scoreA = tradeA?.scoreLabel || "moderate";
    const scoreB = tradeB?.scoreLabel || "moderate";
    const rankA = SCORE_RANKS[scoreA] ?? 1;
    const rankB = SCORE_RANKS[scoreB] ?? 1;

    let advantage: "candidate_a" | "candidate_b" | "neutral" = "neutral";
    let advantageText = "Both options perform comparably on this dimension.";

    if (rankA > rankB) {
      advantage = "candidate_a";
      advantageText = `${candidateA.rotationName} rated more favorable (${scoreA} vs. ${scoreB}).`;
    } else if (rankB > rankA) {
      advantage = "candidate_b";
      advantageText = `${candidateB.rotationName} rated more favorable (${scoreB} vs. ${scoreA}).`;
    }

    dimensionComparisons.push({
      dimension: dim,
      name: DIMENSION_NAMES[dim] || dim,
      candidateAScore: scoreA,
      candidateBScore: scoreB,
      advantage,
      advantageText,
      summaryA: tradeA?.summary || "",
      summaryB: tradeB?.summary || "",
    });
  }

  // Collect distinct reasons to choose each rotation
  const reasonsToChooseA: string[] = [];
  const reasonsToChooseB: string[] = [];

  if (waterA < waterB) {
    reasonsToChooseA.push(
      `Saves ~${Math.abs(diffWaterMm)} mm/yr (${(Math.abs(diffWaterMm) * 10).toLocaleString()} m³/ha/yr) irrigation water vs. ${candidateB.rotationName}`
    );
  } else if (waterB < waterA) {
    reasonsToChooseB.push(
      `Saves ~${Math.abs(diffWaterMm)} mm/yr (${(Math.abs(diffWaterMm) * 10).toLocaleString()} m³/ha/yr) irrigation water vs. ${candidateA.rotationName}`
    );
  }

  if (minTurnaroundA > minTurnaroundB) {
    reasonsToChooseA.push(
      `Generous ${minTurnaroundA}-day turnaround buffer simplifies residue management before next sowing`
    );
  } else if (minTurnaroundB > minTurnaroundA) {
    reasonsToChooseB.push(
      `Generous ${minTurnaroundB}-day turnaround buffer simplifies residue management before next sowing`
    );
  }

  // Check unique botanical diversity benefits
  const defA = CANDIDATE_ROTATIONS.find((r) => r.id === candidateA.rotationId);
  const defB = CANDIDATE_ROTATIONS.find((r) => r.id === candidateB.rotationId);

  const hasMoongA = defA?.crops.some((c) => c.id === "summer_moong") ?? false;
  const hasMoongB = defB?.crops.some((c) => c.id === "summer_moong") ?? false;
  const hasMustardA = defA?.crops.some((c) => c.id === "rabi_mustard") ?? false;
  const hasMustardB = defB?.crops.some((c) => c.id === "rabi_mustard") ?? false;

  if (hasMoongA && !hasMoongB) {
    reasonsToChooseA.push(
      "Includes summer moong to fix 30–40 kg atmospheric N/ha and yield high-protein pulse grain"
    );
  }
  if (hasMoongB && !hasMoongA) {
    reasonsToChooseB.push(
      "Includes summer moong to fix 30–40 kg atmospheric N/ha and yield high-protein pulse grain"
    );
  }

  if (hasMustardA && !hasMustardB) {
    reasonsToChooseA.push(
      "Rabi mustard deep taproot scavenges subsoil nutrients and suppresses fungal root pathogens"
    );
  }
  if (hasMustardB && !hasMustardA) {
    reasonsToChooseB.push(
      "Rabi mustard deep taproot scavenges subsoil nutrients and suppresses fungal root pathogens"
    );
  }

  if (isFeasibleA && !isFeasibleB) {
    reasonsToChooseA.push(
      "Physically viable under current farm conditions (no flagged constraints)"
    );
  }
  if (isFeasibleB && !isFeasibleA) {
    reasonsToChooseB.push(
      "Physically viable under current farm conditions (no flagged constraints)"
    );
  }

  // Practical farmer investigation checklist before choosing
  const farmerInvestigationChecklist: string[] = [
    "Verify local mandi procurement mechanisms and price realization for non-rice crops (e.g., maize, moong, mustard).",
    "Assess machinery availability (Super Seeder, Happy Seeder, or zero-till drill) for the harvest-to-sowing window.",
    "Perform a quick field ribbon test to confirm topsoil texture and drainage rate across field blocks.",
    "Check tubewell discharge and water table depth before committing to pre-monsoon sowing dates.",
  ];

  // Head-to-Head Economic Comparison
  const econA = candidateA.economics;
  const econB = candidateB.economics;
  let economicComparison: CandidateEconomicComparison;

  if (econA && econB) {
    const netReturnDiff = econA.netReturnInrPerHa - econB.netReturnInrPerHa;
    const costDiff = econA.totalCultivationCostInrPerHa - econB.totalCultivationCostInrPerHa;
    const higherNet =
      netReturnDiff > 0
        ? "candidate_a"
        : netReturnDiff < 0
        ? "candidate_b"
        : "equal";
    const lowerCost =
      costDiff < 0
        ? "candidate_a"
        : costDiff > 0
        ? "candidate_b"
        : "equal";
    const higherBcr =
      econA.benefitCostRatio > econB.benefitCostRatio
        ? "candidate_a"
        : econB.benefitCostRatio > econA.benefitCostRatio
        ? "candidate_b"
        : "equal";

    let summary = "";
    if (higherNet === "candidate_a") {
      summary = `${candidateA.rotationName} delivers ~₹${Math.abs(netReturnDiff).toLocaleString()}/ha higher net return (${econA.benefitCostRatio.toFixed(2)} BCR vs ${econB.benefitCostRatio.toFixed(2)} BCR) than ${candidateB.rotationName}.`;
    } else if (higherNet === "candidate_b") {
      summary = `${candidateB.rotationName} delivers ~₹${Math.abs(netReturnDiff).toLocaleString()}/ha higher net return (${econB.benefitCostRatio.toFixed(2)} BCR vs ${econA.benefitCostRatio.toFixed(2)} BCR) than ${candidateA.rotationName}.`;
    } else {
      summary = `Both rotations offer equivalent projected net returns (~₹${econA.netReturnInrPerHa.toLocaleString()}/ha).`;
    }

    let feasibilityWarning: string | undefined;
    if (!isFeasibleA && !isFeasibleB) {
      feasibilityWarning = `Both cropping systems are agronomically infeasible under your farm context. Projected financial returns cannot be realized without resolving physical soil/water constraints.`;
    } else if (!isFeasibleA) {
      feasibilityWarning = `${candidateA.rotationName} is agronomically infeasible under your farm context. Projected financial returns cannot be realized without resolving physical soil/water constraints.`;
    } else if (!isFeasibleB) {
      feasibilityWarning = `${candidateB.rotationName} is agronomically infeasible under your farm context. Projected financial returns cannot be realized without resolving physical soil/water constraints.`;
    }

    if (econA.netReturnInrPerHa > econB.netReturnInrPerHa && isFeasibleA) {
      reasonsToChooseA.push(
        `Higher net return: +₹${(econA.netReturnInrPerHa - econB.netReturnInrPerHa).toLocaleString()}/ha (BCR ${econA.benefitCostRatio.toFixed(2)} vs ${econB.benefitCostRatio.toFixed(2)})`
      );
    } else if (econB.netReturnInrPerHa > econA.netReturnInrPerHa && isFeasibleB) {
      reasonsToChooseB.push(
        `Higher net return: +₹${(econB.netReturnInrPerHa - econA.netReturnInrPerHa).toLocaleString()}/ha (BCR ${econB.benefitCostRatio.toFixed(2)} vs ${econA.benefitCostRatio.toFixed(2)})`
      );
    }

    if (econA.totalCultivationCostInrPerHa < econB.totalCultivationCostInrPerHa && isFeasibleA) {
      reasonsToChooseA.push(
        `Lower working capital: saves ₹${(econB.totalCultivationCostInrPerHa - econA.totalCultivationCostInrPerHa).toLocaleString()}/ha in cultivation costs`
      );
    } else if (econB.totalCultivationCostInrPerHa < econA.totalCultivationCostInrPerHa && isFeasibleB) {
      reasonsToChooseB.push(
        `Lower working capital: saves ₹${(econA.totalCultivationCostInrPerHa - econB.totalCultivationCostInrPerHa).toLocaleString()}/ha in cultivation costs`
      );
    }

    economicComparison = {
      hasEconomics: true,
      netReturnA: econA.netReturnInrPerHa,
      netReturnB: econB.netReturnInrPerHa,
      netReturnDiffInrPerHa: netReturnDiff,
      higherNetReturnCandidate: higherNet,
      costA: econA.totalCultivationCostInrPerHa,
      costB: econB.totalCultivationCostInrPerHa,
      costDiffInrPerHa: costDiff,
      lowerCostCandidate: lowerCost,
      bcrA: econA.benefitCostRatio,
      bcrB: econB.benefitCostRatio,
      higherBcrCandidate: higherBcr,
      pumpingCostA: econA.irrigationEnergyCostInrPerHa,
      pumpingCostB: econB.irrigationEnergyCostInrPerHa,
      pumpingSavingsInrPerHa: econB.irrigationEnergyCostInrPerHa - econA.irrigationEnergyCostInrPerHa,
      summary,
      feasibilityWarning,
    };
  } else {
    economicComparison = {
      hasEconomics: false,
      summary: "Economic benchmark comparison is unavailable because one or both candidates lack economic cost models.",
    };
  }

  return {
    candidateA,
    candidateB,
    waterComparison: {
      waterDemandMmA: waterA,
      waterDemandMmB: waterB,
      differenceMm: diffWaterMm,
      percentDifference: pctWater,
      lowerDemandCandidate,
      summary: waterSummary,
    },
    turnaroundComparison: {
      minTurnaroundA,
      minTurnaroundB,
      differenceDays: diffDays,
      moreFlexibleCandidate,
      summary: turnaroundSummary,
    },
    feasibilityComparison: {
      isFeasibleA,
      isFeasibleB,
      rejectionReasonsA: candidateA.feasibility.rejectionReasons,
      rejectionReasonsB: candidateB.feasibility.rejectionReasons,
      warningsA: candidateA.feasibility.warnings,
      warningsB: candidateB.feasibility.warnings,
      feasibilityContrast,
      summary: feasibilitySummary,
    },
    economicComparison,
    dimensionComparisons,
    tradeoffHighlights: {
      reasonsToChooseA: reasonsToChooseA.length > 0 ? reasonsToChooseA : ["Maintains established agronomic practices"],
      reasonsToChooseB: reasonsToChooseB.length > 0 ? reasonsToChooseB : ["Maintains established agronomic practices"],
      risksA: candidateA.keyRisks,
      risksB: candidateB.keyRisks,
    },
    farmerInvestigationChecklist,
  };
}

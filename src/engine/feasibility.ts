import {
  FarmerProfile,
  FeasibilityCheckCriterion,
  RotationDefinition,
  RotationFeasibilityResult,
} from "@/types";

export const MIN_TURNAROUND_DAYS_THRESHOLD = 7;
export const TIGHT_TURNAROUND_DAYS_WARNING = 15;

/**
 * Stage A: Agronomic Feasibility Filtering
 * Evaluates whether a candidate crop rotation is physically and agronomically feasible
 * given seasonal calendar constraints, sequence turnaround, soil texture, and irrigation capacity.
 *
 * Rules:
 * - Never silently discard a candidate; always return clear reasons for rejection.
 * - Missing farmer inputs are handled gracefully with documented assumptions.
 */
export function evaluateRotationFeasibility(
  rotation: RotationDefinition,
  farmerProfile?: FarmerProfile
): RotationFeasibilityResult {
  const criteria: FeasibilityCheckCriterion[] = [];
  const rejectionReasons: string[] = [];
  const warnings: string[] = [];

  // 1. Calendar Sequence & Turnaround Feasibility
  let hasTurnaroundFailure = false;
  let hasTightTurnaround = false;

  for (let i = 0; i < rotation.turnaroundDays.length; i++) {
    const days = rotation.turnaroundDays[i];
    const currentCrop = rotation.crops[i];
    const nextCrop = rotation.crops[(i + 1) % rotation.crops.length];

    if (days < MIN_TURNAROUND_DAYS_THRESHOLD) {
      hasTurnaroundFailure = true;
      rejectionReasons.push(
        `Insufficient turnaround gap (${days} days) between ${currentCrop.name} harvest and ${nextCrop.name} sowing (minimum required: ${MIN_TURNAROUND_DAYS_THRESHOLD} days).`
      );
    } else if (days < TIGHT_TURNAROUND_DAYS_WARNING) {
      hasTightTurnaround = true;
      warnings.push(
        `Tight turnaround (${days} days) between ${currentCrop.name} and ${nextCrop.name}. Requires mechanized residue management (e.g. Super Seeder/Happy Seeder) to avoid planting delays.`
      );
    }
  }

  criteria.push({
    code: "CALENDAR_TURNAROUND",
    name: "Crop Calendar & Turnaround Feasibility",
    passed: !hasTurnaroundFailure,
    explanation: hasTurnaroundFailure
      ? "One or more crop transitions have overlapping or unviable turnaround windows (< 7 days)."
      : hasTightTurnaround
      ? "Turnaround windows are feasible but require rapid mechanization between harvest and subsequent sowing."
      : "Adequate turnaround interval available between all crop phases for soil preparation.",
    evidenceRefId: "PROVISIONAL_TURNAROUND_WINDOW",
  });

  // 2. Irrigation Source & Water Availability Feasibility
  let irrigationPassed = true;
  let irrigationExplanation = "Irrigation capacity is adequate for this rotation.";

  const hasPuddleRice = rotation.crops.some((c) => c.id === "paddy_transplanted");
  const totalEstimatedWaterMm = rotation.crops.reduce(
    (sum, c) => sum + (c.estimatedIrrigationRequirementsMm || 0),
    0
  );

  if (farmerProfile?.irrigationSource === "rainfed_only") {
    if (hasPuddleRice || totalEstimatedWaterMm > 800) {
      irrigationPassed = false;
      const reason = `Rotation requires estimated ~${totalEstimatedWaterMm} mm irrigation, which cannot be sustained under rainfed-only conditions in Punjab (historical mean annual rain is ~680 mm).`;
      rejectionReasons.push(reason);
      irrigationExplanation = reason;
    }
  } else if (farmerProfile?.irrigationSource === "tubewell_shallow") {
    if (hasPuddleRice && (farmerProfile.groundwaterDepthMeters ?? 0) > 20) {
      warnings.push(
        "Shallow tubewells risk discharge failure during peak June–July paddy transplantation when local water table drops below centrifugal suction limits."
      );
    }
  }

  criteria.push({
    code: "IRRIGATION_FEASIBILITY",
    name: "Irrigation Capacity Matching",
    passed: irrigationPassed,
    explanation: irrigationExplanation,
    evidenceRefId: "CGWB_LUDHIANA_GROUNDWATER",
  });

  // 3. Soil Context Compatibility (if soil information is provided)
  let soilPassed = true;
  let soilExplanation = "Soil texture matches agronomic requirements for all crops in sequence.";

  if (farmerProfile?.soilTexture) {
    const soil = farmerProfile.soilTexture;

    // Direct Seeded Rice (DSR) is not recommended on sandy soils by PAU
    const hasDsr = rotation.crops.some((c) => c.id === "paddy_dsr");
    if (hasDsr && soil === "sandy") {
      soilPassed = false;
      const reason =
        "Direct-Seeded Rice (DSR) is agronomically unfeasible on sandy soils due to severe iron chlorosis and excessive percolation rates (PAU DSR guidelines).";
      rejectionReasons.push(reason);
      soilExplanation = reason;
    }

    // Puddled rice on coarse sandy soils has extreme percolation water loss
    if (hasPuddleRice && soil === "sandy") {
      warnings.push(
        "Puddled rice on light sandy soils leads to extreme percolation losses (>2,500 mm water) and poor nutrient retention."
      );
    }

    // Kharif maize in heavy clay loam requires careful surface drainage during monsoon flash storms
    const hasMaize = rotation.crops.some((c) => c.id === "kharif_maize");
    if (hasMaize && soil === "clay_loam") {
      warnings.push(
        "Kharif maize on clay loam soil requires ridge planting and adequate surface drainage to prevent waterlogging during monsoon downpours."
      );
    }
  } else {
    warnings.push("Soil texture not specified by farmer; evaluated under standard loam baseline assumptions.");
  }

  criteria.push({
    code: "SOIL_COMPATIBILITY",
    name: "Soil Texture Suitability",
    passed: soilPassed,
    explanation: soilExplanation,
    evidenceRefId: "PAU_DSR_GUIDELINES",
  });

  // 4. Preceding Crop Sequence Compatibility
  let sequencePassed = true;
  for (let i = 0; i < rotation.crops.length; i++) {
    const prevCrop = rotation.crops[(i - 1 + rotation.crops.length) % rotation.crops.length];
    const currentCrop = rotation.crops[i];

    if (
      currentCrop.precedingCropCompatibility.length > 0 &&
      !currentCrop.precedingCropCompatibility.includes(prevCrop.id)
    ) {
      sequencePassed = false;
      const reason = `${currentCrop.name} has documented allelopathic or disease incompatibilities immediately following ${prevCrop.name}.`;
      rejectionReasons.push(reason);
    }
  }

  criteria.push({
    code: "SEQUENCE_COMPATIBILITY",
    name: "Crop Sequence Compatibility",
    passed: sequencePassed,
    explanation: sequencePassed
      ? "All crops in rotation follow agronomically compatible preceding species."
      : "One or more crop transitions have documented agronomic sequence incompatibilities.",
  });

  const isFeasible = criteria.every((c) => c.passed);

  return {
    rotationId: rotation.id,
    rotationName: rotation.name,
    isFeasible,
    rejectionReasons,
    criteria,
    warnings,
  };
}

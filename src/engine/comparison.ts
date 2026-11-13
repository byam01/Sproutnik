import {
  AssessmentTradeoff,
  ClimateIndicators,
  FarmerProfile,
  RotationComparisonResult,
  RotationDefinition,
  WaterDemandCategory,
} from "@/types";
import { evaluateRotationFeasibility } from "./feasibility";

/**
 * Stage B: Trade-Off Comparison Engine
 * Evaluates feasible and baseline rotations across transparent, explainable agronomic dimensions:
 * 1. Climate & Thermal Compatibility
 * 2. Water-Demand & Groundwater Pressure
 * 3. Agrobiodiversity & Nutrient Cycling
 * 4. Soil-Health Potential
 * 5. Turnaround & Residue Management
 *
 * Sourced from PAU packages, CGWB groundwater surveys, and NASA POWER climate statistics.
 * Does NOT generate an opaque single score.
 */
export function compareCropRotation(
  rotation: RotationDefinition,
  climate: ClimateIndicators,
  farmerProfile?: FarmerProfile
): RotationComparisonResult {
  const feasibility = evaluateRotationFeasibility(rotation, farmerProfile);
  const isBaseline = rotation.id === "rotation_rice_wheat";

  // Calculate total water demand and deficit against historical rainfall
  const totalWaterMm = rotation.crops.reduce(
    (acc, crop) => acc + (crop.estimatedIrrigationRequirementsMm || 0),
    0
  );

  let waterDemandTotalCategory: WaterDemandCategory = "moderate";
  if (totalWaterMm > 1800) {
    waterDemandTotalCategory = "very_high";
  } else if (totalWaterMm > 1200) {
    waterDemandTotalCategory = "high";
  } else if (totalWaterMm > 600) {
    waterDemandTotalCategory = "moderate";
  } else {
    waterDemandTotalCategory = "low";
  }

  // Groundwater pressure index: deficit = Total crop water requirement - Mean annual rainfall
  const meanAnnualRain = climate.meanAnnualRainfallMm;
  const irrigationDeficitMm = Math.max(0, totalWaterMm - meanAnnualRain);

  let groundwaterPressureIndex: "critical" | "high" | "moderate" | "low" = "moderate";
  if (irrigationDeficitMm > 1200) {
    groundwaterPressureIndex = "critical";
  } else if (irrigationDeficitMm > 700) {
    groundwaterPressureIndex = "high";
  } else if (irrigationDeficitMm > 300) {
    groundwaterPressureIndex = "moderate";
  } else {
    groundwaterPressureIndex = "low";
  }

  // 1. Dimension: Climate & Thermal Compatibility
  const marchMaxTemp = climate.monthlyMeanMaxTempC[3] ?? 28.5;
  const hasWheat = rotation.crops.some((c) => c.id === "bread_wheat");
  const hasMustard = rotation.crops.some((c) => c.id === "rabi_mustard");
  const hasPaddy = rotation.crops.some((c) => c.id === "paddy_transplanted");
  const hasMaize = rotation.crops.some((c) => c.id === "kharif_maize");
  const hasMoong = rotation.crops.some((c) => c.id === "summer_moong");

  const climateTradeoff: AssessmentTradeoff = {
    dimension: "climate_compatibility",
    scoreLabel:
      hasWheat && marchMaxTemp > 31.0
        ? "caution"
        : hasMustard
        ? "favorable"
        : "moderate",
    summary:
      hasWheat && marchMaxTemp > 30.0
        ? `Historical March mean maximum temperature is ${marchMaxTemp.toFixed(1)}°C. Wheat anthesis and grain-fill are exposed to terminal heat spikes, curtailing test weight.`
        : hasMustard
        ? `Rabi mustard matures by mid-March, escaping peak late-March heatwaves (${marchMaxTemp.toFixed(1)}°C).`
        : "Cropping calendar aligns reasonably with regional thermal and monsoon distributions.",
    advantages: [
      hasMaize ? "Kharif maize leverages early monsoon showers without requiring flooded nursery conditions." : "",
      hasMustard ? "Mustard matures before March thermal surges, avoiding terminal heat shrinkage." : "",
    ].filter(Boolean),
    disadvantages: [
      hasWheat ? "Wheat grain filling is vulnerable to sudden March heat spikes (>30°C)." : "",
      hasPaddy ? "Paddy nursery establishment in May–June coincides with peak pan-evaporation (>10 mm/day)." : "",
    ].filter(Boolean),
  };

  // 2. Dimension: Water Exposure & Groundwater Pressure
  const waterTradeoff: AssessmentTradeoff = {
    dimension: "water_exposure",
    scoreLabel:
      groundwaterPressureIndex === "critical"
        ? "unfavorable"
        : groundwaterPressureIndex === "high"
        ? "caution"
        : "favorable",
    summary: `Estimated total irrigation requirement is ~${totalWaterMm} mm/year. Against historical rainfall of ~${meanAnnualRain.toFixed(0)} mm, the net groundwater draft is ~${irrigationDeficitMm.toFixed(0)} mm/year (${groundwaterPressureIndex} pressure).`,
    advantages: [
      totalWaterMm < 1200
        ? `Conserves substantial groundwater (~${(2150 - totalWaterMm).toFixed(0)} mm less than baseline rice-wheat).`
        : "",
      totalWaterMm <= 800 ? "Highly resilient against seasonal tubewell power cuts and water table drops." : "",
    ].filter(Boolean),
    disadvantages: [
      totalWaterMm >= 1800
        ? "Severely accelerates aquifer overdraft in over-exploited Ludhiana district (>150% extraction stage)."
        : "",
      hasPaddy ? "Requires continuous deep tubewell pumpage through the dry pre-monsoon weeks of June." : "",
    ].filter(Boolean),
  };

  // 3. Dimension: Agrobiodiversity & Nutrient Cycling
  const diversityTradeoff: AssessmentTradeoff = {
    dimension: "diversity",
    scoreLabel: hasMoong || (hasMaize && hasMustard) ? "favorable" : isBaseline ? "unfavorable" : "moderate",
    summary: hasMoong
      ? "Incorporates a short-duration pulse (summer moong) that fixes 30–40 kg atmospheric N/ha, enriching soil and breaking monoculture cycles."
      : isBaseline
      ? "Continuous cereal–cereal monoculture creates uniform weed pressure (e.g. Phalaris minor) and offers zero biological nitrogen fixation."
      : "Rotates botanical families (Poaceae to Brassicaceae/Fabaceae), reducing continuous disease build-up.",
    advantages: [
      hasMoong ? "Fixes atmospheric nitrogen and provides ~1.0–1.2 t/ha high-protein grain harvest." : "",
      hasMustard ? "Brassica glucosinolate root exudates suppress soil-borne fungal pathogens." : "",
      !isBaseline ? "Disrupts herbicide-resistant Phalaris minor (canary grass) life cycles." : "",
    ].filter(Boolean),
    disadvantages: [
      isBaseline ? "Encourages heavy reliance on synthetic nitrogen (120–150 kg N/ha per crop) and weedicides." : "",
    ].filter(Boolean),
  };

  // 4. Dimension: Soil Health Potential
  const soilTradeoff: AssessmentTradeoff = {
    dimension: "soil_health",
    scoreLabel: hasPaddy ? "unfavorable" : hasMoong ? "favorable" : "moderate",
    summary: hasPaddy
      ? "Puddling destroys soil macropores and forms an impermeable subsoil hardpan at 15–20 cm depth, restricting subsequent wheat root growth."
      : "Non-puddled system preserves soil aggregation, aeration, and promotes deeper root proliferation.",
    advantages: [
      !hasPaddy ? "Eliminates hardpan compaction, enabling unrestricted taproot expansion." : "",
      hasMoong ? "Pulse crop residue biomass incorporated into the topsoil builds organic carbon." : "",
    ].filter(Boolean),
    disadvantages: [
      hasPaddy
        ? "Long-term puddling degrades physical soil structure and forms an impermeable subsoil hardpan at 15–20 cm depth."
        : "",
    ].filter(Boolean),
  };

  // 5. Dimension: Turnaround & Residue Management
  const minTurnaround = Math.min(...rotation.turnaroundDays);
  const turnaroundTradeoff: AssessmentTradeoff = {
    dimension: "turnaround_feasibility",
    scoreLabel: minTurnaround < 15 ? "caution" : "favorable",
    summary:
      minTurnaround < 15
        ? `Minimum field transition is tight (${minTurnaround} days). Requires in situ residue machines (Happy Seeder/Super Seeder) to sow wheat without burning.`
        : `Ample turnaround gap (${minTurnaround} days) allows conventional field cultivation, residue decay, and timely sowing.`,
    advantages: [
      hasMaize ? "Kharif maize harvest in late September provides a generous 30–40 day window before wheat sowing." : "",
      minTurnaround >= 20 ? "Virtually eliminates seasonal pressure that historically drove paddy residue burning." : "",
    ].filter(Boolean),
    disadvantages: [
      isBaseline
        ? "Late rice harvesting in late October creates acute turnaround crunch before the Nov 15 wheat window."
        : "",
      hasMoong ? "Triple-cropping leaves narrow windows that require strict variety duration adherence." : "",
    ].filter(Boolean),
  };

  const tradeoffs: AssessmentTradeoff[] = [
    climateTradeoff,
    waterTradeoff,
    diversityTradeoff,
    soilTradeoff,
    turnaroundTradeoff,
  ];

  // Collect distinct diversification benefits and key risks
  const diversificationBenefits = [
    hasMoong ? "Biological atmospheric nitrogen fixation (30–40 kg N/ha)" : "",
    hasMaize ? "60–65% reduction in groundwater irrigation footprint vs paddy" : "",
    hasMustard ? "Diversification away from cereal monoculture with deep taproot scavenging" : "",
    !hasPaddy ? "Halts subsoil hardpan formation and improves soil infiltration capacity" : "",
  ].filter(Boolean);

  const keyRisks = [
    isBaseline ? "Groundwater over-exploitation: requires deep tubewells in an over-exploited aquifer" : "",
    hasWheat ? "March terminal heat exposure: unseasonable heatwaves (>30°C) shrink wheat yield" : "",
    hasMaize ? "Monsoon waterlogging sensitivity: requires ridge sowing or surface drainage" : "",
    minTurnaround < 15 ? "Residue turnaround bottleneck: short window between kharif harvest and rabi sowing" : "",
  ].filter(Boolean);

  // Collect all unknowns from member crops
  const unknowns = Array.from(
    new Set(rotation.crops.flatMap((c) => c.unknownAttributes))
  );

  return {
    rotationId: rotation.id,
    rotationName: rotation.name,
    isBaseline,
    feasibility,
    tradeoffs,
    waterDemandTotalCategory,
    groundwaterPressureIndex,
    diversificationBenefits,
    keyRisks,
    evidence: rotation.evidence,
    unknowns,
  };
}

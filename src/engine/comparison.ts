import {
  AgronomicRisk,
  AssessmentTradeoff,
  ClimateIndicators,
  RecommendationExplanation,
  RotationComparisonResult,
  RotationDefinition,
  RotationFarmerContext,
  SuitabilityStatus,
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
  farmerContext?: RotationFarmerContext
): RotationComparisonResult {
  const feasibility = evaluateRotationFeasibility(rotation, farmerContext);
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
  const hasDsr = rotation.crops.some((c) => c.id === "paddy_dsr");
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

  // --- AGRICULTURAL INTELLIGENCE ENHANCEMENTS ---
  // 1. Critical limitations (insurmountable hurdles under farmer context)
  const criticalLimitations: string[] = !feasibility.isFeasible
    ? feasibility.rejectionReasons.length > 0
      ? [...feasibility.rejectionReasons]
      : ["Rotation failed one or more agronomic feasibility criteria."]
    : [];

  // 2. Structured manageable risks with actionable mitigation guidance
  const manageableRisks = buildManageableRisks({
    rotation,
    climate,
    farmerContext,
    totalWaterMm,
    irrigationDeficitMm,
    marchMaxTemp,
    minTurnaround,
    hasWheat,
    hasPaddy,
    hasDsr,
    hasMaize,
    hasMustard,
    hasMoong,
    isBaseline,
  });

  // 3. Suitability status determination
  const suitabilityStatus = determineSuitabilityStatus({
    rotationId: rotation.id,
    isFeasible: feasibility.isFeasible,
    isBaseline,
    soilTexture: farmerContext?.soilTexture,
    irrigationSource: farmerContext?.irrigationSource,
    manageableRisks,
    groundwaterPressureIndex,
  });

  // 4. Concrete actionable next steps
  const actionableNextSteps = buildActionableNextSteps({
    rotationId: rotation.id,
    soilTexture: farmerContext?.soilTexture,
    irrigationSource: farmerContext?.irrigationSource,
    minTurnaround,
  });

  // 5. Dimension rationales for explainable decision support
  const recommendation: RecommendationExplanation = {
    suitabilityStatus,
    overallRationale: buildOverallRationale({
      rotationId: rotation.id,
      suitabilityStatus,
      isBaseline,
      criticalLimitations,
      irrigationDeficitMm,
      totalWaterMm,
    }),
    soilSuitabilityRationale: buildSoilSuitabilityRationale({
      rotationId: rotation.id,
      soilTexture: farmerContext?.soilTexture,
      hasPaddy,
      hasDsr,
      hasMaize,
      hasMustard,
    }),
    irrigationSuitabilityRationale: buildIrrigationSuitabilityRationale({
      irrigationSource: farmerContext?.irrigationSource,
      groundwaterDepthMeters: farmerContext?.groundwaterDepthMeters,
      totalWaterMm,
      irrigationDeficitMm,
      meanAnnualRain,
    }),
    climateCompatibilityRationale: buildClimateCompatibilityRationale({
      rotationId: rotation.id,
      marchMaxTemp,
      hasWheat,
      hasMustard,
      hasMaize,
    }),
    actionableNextSteps,
  };

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
    suitabilityStatus,
    recommendation,
    criticalLimitations,
    manageableRisks,
  };
}

// =========================================================================
// Helper Implementations for Agricultural Intelligence & Explainability
// =========================================================================

interface BuildRisksParams {
  rotation: RotationDefinition;
  climate: ClimateIndicators;
  farmerContext?: RotationFarmerContext;
  totalWaterMm: number;
  irrigationDeficitMm: number;
  marchMaxTemp: number;
  minTurnaround: number;
  hasWheat: boolean;
  hasPaddy: boolean;
  hasDsr: boolean;
  hasMaize: boolean;
  hasMustard: boolean;
  hasMoong: boolean;
  isBaseline: boolean;
}

function buildManageableRisks(params: BuildRisksParams): AgronomicRisk[] {
  const risks: AgronomicRisk[] = [];
  const soil = params.farmerContext?.soilTexture;
  const irrigation = params.farmerContext?.irrigationSource;
  const depth = params.farmerContext?.groundwaterDepthMeters ?? 0;

  // 1. Water Exposure Risks
  if (params.hasPaddy) {
    risks.push({
      category: "water",
      severity: "manageable",
      title: "Aquifer Over-Draft Under Flooded Rice",
      description: `Transplanted puddle rice requires ~1,800 mm irrigation, generating a net annual water deficit of ~${params.irrigationDeficitMm.toFixed(0)} mm against historical rainfall.`,
      mitigationGuidance:
        "Deploy PAU tensiometers to schedule irrigations 2 days after ponded water has infiltrated, reducing tubewell pumping by 20–25% without yield penalty.",
    });
  }

  if (irrigation === "tubewell_shallow" && depth > 15) {
    risks.push({
      category: "water",
      severity: "manageable",
      title: "Shallow Tubewell Suction Limit Risk",
      description:
        "Water table drop below 15–20 m during May–June can cause centrifugal pump cavitation and discharge interruption during critical crop phases.",
      mitigationGuidance:
        "Lower the centrifugal pump into a motor pit or convert to a submersible assembly; pre-irrigate fields during off-peak night electricity supply.",
    });
  }

  if (params.hasMaize && soil === "clay_loam") {
    risks.push({
      category: "water",
      severity: "manageable",
      title: "Monsoon Waterlogging & Root Hypoxia in Maize",
      description:
        "Kharif maize cannot tolerate standing water for >24 hours; heavy monsoon showers on clay loam soil cause yellowing and root asphyxiation.",
      mitigationGuidance:
        "Sow hybrid maize on raised beds (67.5 cm ridge-to-ridge) with dedicated furrow drainage connected to a field exit ditch.",
    });
  }

  if (soil === "sandy" && !params.hasDsr) {
    risks.push({
      category: "water",
      severity: "manageable",
      title: "Rapid Water Percolation in Coarse Sandy Soil",
      description:
        "Sandy soil has low moisture retention, leading to rapid gravity drainage and moisture stress during hot spells.",
      mitigationGuidance:
        "Apply lighter, more frequent irrigations and split nitrogen fertilizer into 3–4 mini-doses to avoid leaching nutrients below the root zone.",
    });
  }

  // 2. Soil Structure & Chemistry Risks
  if (params.hasPaddy) {
    risks.push({
      category: "soil",
      severity: "manageable",
      title: "Puddling Subsoil Hardpan Formation",
      description:
        "Repeated wet tillage (puddling) creates an impermeable dense plow pan at 15–20 cm depth, restricting subsequent wheat root penetration and drainage.",
      mitigationGuidance:
        "Perform deep chisel plowing or subsoiling to 35–40 cm depth every 3 years prior to wheat sowing to fracture the plow pan.",
    });
  }

  if (params.hasDsr) {
    risks.push({
      category: "soil",
      severity: "manageable",
      title: "Iron Chlorosis in Aerobic Direct-Seeded Rice",
      description:
        "Aerobic unflooded soil prevents reduction of ferric (Fe3+) iron to plant-available ferrous (Fe2+) form, causing interveinal yellowing of young leaves.",
      mitigationGuidance:
        "Spray 1% ferrous sulphate (FeSO4) solution (1 kg FeSO4 in 100 L water per acre) 2–3 times at 5–7 day intervals upon earliest detection of yellowing (15–25 DAS).",
    });
  }

  if (soil === "silt_loam") {
    risks.push({
      category: "soil",
      severity: "advisory",
      title: "Surface Soil Crusting Risk",
      description:
        "High silt fraction tends to form a dense surface crust after sudden rain showers before seedling emergence.",
      mitigationGuidance:
        "Perform blind rotary hoeing or run a light sprinkler if crust forms before coleoptile emergence to assist seedling emergence.",
    });
  }

  // 3. Turnaround & Residue Risks
  if (params.isBaseline) {
    risks.push({
      category: "turnaround",
      severity: "manageable",
      title: "Tight Post-Paddy Residue Management Window",
      description:
        "A 15-day window between combined rice harvest and optimal wheat sowing creates severe operational pressure to burn paddy residue.",
      mitigationGuidance:
        "Direct-drill wheat directly into standing rice stubble using a PAU Smart Seeder or Happy Seeder, eliminating stubble burning and conserving soil moisture.",
    });
  }

  if (params.hasMoong && params.hasWheat) {
    risks.push({
      category: "turnaround",
      severity: "manageable",
      title: "Triple-Crop Scheduling Bottleneck",
      description:
        "A 10–15 day turnaround between wheat harvest, moong sowing, and paddy transplanting leaves zero margin for weather delays.",
      mitigationGuidance:
        "Direct-drill moong immediately with a zero-till drill on the day of wheat combine harvesting; select extra-early moong variety (SML 818, 60 days) to clear field before June 20.",
    });
  }

  // 4. Climate & Thermal Risks
  if (params.hasWheat) {
    risks.push({
      category: "climate",
      severity: "manageable",
      title: "Terminal Heat Stress During March Grain-Filling",
      description: `Historical March mean maximum temperature is ${params.marchMaxTemp.toFixed(1)}°C. Temperature spikes above 30°C during grain filling accelerate maturity and reduce test weight.`,
      mitigationGuidance:
        "Complete wheat sowing by November 15 using terminal-heat tolerant varieties (PBW 826 or DBW 187); apply light canopy irrigation or 0.5% potassium nitrate spray at booting to buffer canopy temperature.",
    });
  }

  if (params.hasMustard) {
    risks.push({
      category: "climate",
      severity: "advisory",
      title: "Winter Frost Sensitivity During Mustard Flowering",
      description:
        "Rabi mustard reproductive phase in January is vulnerable to intense winter cold waves and sub-zero frost episodes.",
      mitigationGuidance:
        "Apply a light protective irrigation prior to anticipated severe frost spells (monitored via PAU Agromet advisories) to raise soil thermal mass.",
    });
  }

  // 5. Pest, Disease & Weed Risks
  if (params.isBaseline) {
    risks.push({
      category: "pest_disease",
      severity: "manageable",
      title: "Herbicide-Resistant Phalaris Minor (Gulli Danda)",
      description:
        "Decades of continuous rice-wheat monoculture have selected multiple-herbicide resistant biotypes of canary grass in central Punjab.",
      mitigationGuidance:
        "Rotate herbicide modes of action: apply pre-emergence pendimethalin or pyroxasulfone within 2 days of sowing, avoiding repeated reliance on clodinafop or sulfosulfuron.",
    });
  }

  if (params.hasDsr) {
    risks.push({
      category: "pest_disease",
      severity: "manageable",
      title: "Intense Early-Season Weed Competition in DSR",
      description:
        "Absence of a standing water blanket allows simultaneous emergence of grassy weeds (Echinochloa) and sedges alongside rice seedlings.",
      mitigationGuidance:
        "Apply pendimethalin 30 EC at 1.0 L/acre within 24 hours of dry sowing in moist seedbed; follow with post-emergence bispyribac-sodium (10 SC at 100 mL/acre) at 20–25 DAS.",
    });
  }

  if (params.hasMaize) {
    risks.push({
      category: "pest_disease",
      severity: "manageable",
      title: "Fall Armyworm (Spodoptera frugiperda) in Kharif Maize",
      description:
        "Invasive pest damaging central whorls of young maize plants during vegetative growth.",
      mitigationGuidance:
        "Inspect whorls weekly; apply whorl application of chlorantraniliprole 18.5 SC (0.4 mL/L) or neem-based insecticide (azadirachtin 1500 ppm at 5 mL/L) at first sign of pinhole leaf damage.",
    });
  }

  if (params.hasMustard) {
    risks.push({
      category: "pest_disease",
      severity: "manageable",
      title: "Mustard Aphid (Lipaphis erysimi) Infestation",
      description:
        "Aphids colonize inflorescences and pods during February, sucking sap and causing pod curling.",
      mitigationGuidance:
        "Sow mustard timely by October 25 to complete flowering before peak aphid emergence; spray thiamethoxam 25 WG (80 g/ha) if aphid colonies exceed 1.5 cm on main terminal shoot.",
    });
  }

  if (params.hasMoong) {
    risks.push({
      category: "pest_disease",
      severity: "manageable",
      title: "Yellow Mosaic Virus (YMV) in Summer Moong",
      description:
        "Whitefly-transmitted geminivirus causing yellowing, stunting, and severe yield reduction in greengram.",
      mitigationGuidance:
        "Sow certified YMV-resistant cultivars (SML 1827 or SML 818) and treat seeds with imidacloprid (5 g/kg seed) to manage early whitefly vectors.",
    });
  }

  return risks;
}

interface SuitabilityParams {
  rotationId: string;
  isFeasible: boolean;
  isBaseline: boolean;
  soilTexture?: string;
  irrigationSource?: string;
  manageableRisks: AgronomicRisk[];
  groundwaterPressureIndex: "critical" | "high" | "moderate" | "low";
}

function determineSuitabilityStatus(params: SuitabilityParams): SuitabilityStatus {
  if (!params.isFeasible) {
    return "unfeasible";
  }

  // Baseline rice-wheat is feasible with tubewells, but represents critical groundwater overdraft and hardpan
  if (params.isBaseline) {
    return "conditionally_suitable";
  }

  // DSR requires careful weed and micronutrient management
  if (params.rotationId === "rotation_dsr_wheat") {
    return "suitable_with_mitigation";
  }

  // Triple cropping intensifies calendar and water demand
  if (params.rotationId === "rotation_rice_wheat_moong") {
    return "suitable_with_mitigation";
  }

  // Maize-based rotations on fine or coarse soils require specific mitigations
  if (params.soilTexture === "clay_loam" || params.soilTexture === "sandy") {
    return "suitable_with_mitigation";
  }

  // Maize-wheat and Maize-Mustard-Moong on loam / sandy-loam with tubewell/canal are highly suitable
  if (
    (params.rotationId === "rotation_maize_wheat" ||
      params.rotationId === "rotation_maize_mustard_moong") &&
    params.groundwaterPressureIndex !== "critical"
  ) {
    return "highly_suitable";
  }

  return "suitable_with_mitigation";
}

interface ActionableStepsParams {
  rotationId: string;
  soilTexture?: string;
  irrigationSource?: string;
  minTurnaround: number;
}

function buildActionableNextSteps(params: ActionableStepsParams): string[] {
  switch (params.rotationId) {
    case "rotation_rice_wheat":
      return [
        "Deploy soil matric tensiometers to schedule paddy irrigations 2 days after ponded water infiltrates, saving 20–25% irrigation water.",
        "Adopt Happy Seeder or Super Seeder technology to direct-drill wheat directly into standing rice residue without burning.",
        "Rotate post-emergence wheat herbicides to counter Phalaris minor resistance (avoid repeating sulfosulfuron/clodinafop).",
        "Complete wheat sowing by November 15 using terminal-heat resilient cultivars (e.g., PBW 826 / DBW 303).",
      ];

    case "rotation_dsr_wheat":
      return [
        "Perform precision laser land leveling before sowing to ensure uniform seedling emergence and eliminate uneven dry patches.",
        "Apply pendimethalin 30 EC at 1.0 L/acre within 24 hours of DSR seeding in moist soil (tar-watter) to establish early weed control.",
        "Scout weekly for yellowing leaves (iron chlorosis); apply 1% ferrous sulphate foliar spray at 15–20 DAS upon earliest symptom detection.",
        "Utilize the generous 25-day turnaround window to prepare wheat seedbed without rush or stubble burning.",
      ];

    case "rotation_maize_wheat":
      return [
        params.soilTexture === "clay_loam"
          ? "Sow hybrid kharif maize (e.g. PMH 13 / PMH 1) on raised beds or ridges to facilitate root aeration and prevent monsoon water stagnation."
          : "Sow recommended hybrid maize (PMH 13 / PMH 1) in late May or early June to leverage monsoon onset with 4–5 total irrigations.",
        "Install pheromone traps for Fall Armyworm surveillance; apply targeted chlorantraniliprole 18.5 SC if central whorl pinhole damage appears.",
        "Leverage the comfortable 35-day turnaround after late-September maize harvest for thorough wheat land preparation and timely sowing by Nov 5–10.",
        "Reduce annual irrigation pumping by >50%, directly conserving aquifer levels and lowering diesel/electricity operating costs.",
      ];

    case "rotation_rice_wheat_moong":
      return [
        "Direct-drill short-duration summer moong (SML 818 or SML 1827) with a zero-till drill immediately following combine harvest of wheat by mid-April.",
        "Treat moong seed with Rhizobium inoculant and systemic fungicide to maximize biological nitrogen fixation and seedling vigor.",
        "Terminate summer moong harvest by the third week of June to enable timely paddy establishment without compromising main season yields.",
        "Deduct 30–40 kg/ha of synthetic nitrogen fertilizer from subsequent paddy basal dose in recognition of incorporated legume residue biomass.",
      ];

    case "rotation_maize_mustard_moong":
      return [
        "Sow raya/mustard (e.g. RLC 3 or PBR 357) by mid-October immediately following early maize harvest to escape peak winter aphid pressure.",
        "Implement ridge-furrow planting for kharif maize to prevent drainage saturation and ensure adequate aeration during monsoon storms.",
        "Scout mustard crop weekly starting January for aphid colonies on top 10 cm inflorescence; apply economic threshold level (ETL) management.",
        "Direct-seed summer moong in late March after mustard harvest to capture atmospheric nitrogen and produce bonus summer pulse grain.",
      ];

    default:
      return [
        "Verify certified seed availability and germination test before planting.",
        "Follow PAU regional Package of Practices for fertilizer and irrigation scheduling.",
        "Monitor local weather forecasts through District Agromet Units (DAMUs) for spray timings.",
      ];
  }
}

interface OverallRationaleParams {
  rotationId: string;
  suitabilityStatus: SuitabilityStatus;
  isBaseline: boolean;
  criticalLimitations: string[];
  irrigationDeficitMm: number;
  totalWaterMm: number;
}

function buildOverallRationale(params: OverallRationaleParams): string {
  if (params.suitabilityStatus === "unfeasible") {
    return `This rotation is agronomically unfeasible under your farm conditions because ${params.criticalLimitations.join(" ")}`;
  }

  if (params.isBaseline) {
    return `Baseline rice–wheat is viable with assured tubewell irrigation and provides market price certainty via MSP. However, it is rated conditionally suitable due to severe long-term groundwater overdraft (~${params.irrigationDeficitMm.toFixed(0)} mm annual deficit) and subsoil compaction from puddling.`;
  }

  switch (params.rotationId) {
    case "rotation_maize_wheat":
      return `Highly recommended diversification pathway for central Punjab. Slicing irrigation requirements by ~58% compared to paddy, it halts local groundwater drawdown while providing a comfortable 35-day window for field preparation before wheat.`;

    case "rotation_maize_mustard_moong":
      return `Outstanding climate-resilient cropping system offering complete diversification across three botanical families (cereal, oilseed, pulse). Conserves >1,000 mm irrigation water annually while contributing 30–40 kg/ha atmospheric nitrogen to the soil.`;

    case "rotation_dsr_wheat":
      return `A viable transition system that retains rice cultivation while reducing irrigation pumping by 15–20% and avoiding subsoil hardpan creation. Requires disciplined weed control and precision laser leveling.`;

    case "rotation_rice_wheat_moong":
      return `Intensified triple-cropping system that generates an additional high-value pulse harvest and enriches soil nitrogen between wheat and paddy. Requires rigorous calendar adherence due to narrow turnaround intervals.`;

    default:
      return `Diversified cropping system offering balanced economic and agronomic performance under Punjab conditions.`;
  }
}

interface SoilRationaleParams {
  rotationId: string;
  soilTexture?: string;
  hasPaddy: boolean;
  hasDsr: boolean;
  hasMaize: boolean;
  hasMustard: boolean;
}

function buildSoilSuitabilityRationale(params: SoilRationaleParams): string {
  if (!params.soilTexture) {
    return "Evaluated under standard central Punjab loam baseline assumptions (farmer soil texture not specified).";
  }

  switch (params.soilTexture) {
    case "sandy_loam":
      if (params.hasDsr) {
        return "Sandy loam soil has good aeration and moderate percolation, supporting DSR root establishment with manageable iron nutrition monitoring.";
      }
      if (params.hasMaize || params.hasMustard) {
        return "Sandy loam provides excellent internal drainage and warm seedbed conditions, ideal for early root anchorage of kharif maize and mustard taproots.";
      }
      return "Sandy loam requires higher puddling intensity to control water percolation in paddy, increasing pumping energy.";

    case "loam":
      return "Loam soil offers balanced moisture holding capacity and root aeration, representing optimal soil conditions across all crops in this sequence.";

    case "clay_loam":
      if (params.hasMaize) {
        return "Clay loam is highly moisture-retentive; kharif maize is prone to temporary root asphyxiation during heavy monsoon downpours unless planted on raised beds or ridges.";
      }
      if (params.hasPaddy) {
        return "Clay loam naturally restricts water percolation, making it efficient for maintaining flooded paddy conditions with lower tubewell running hours.";
      }
      return "Clay loam holds moisture well for rabi crops but requires careful tillage timing to avoid clod formation.";

    case "silt_loam":
      return "Silt loam has high available water holding capacity; monitor for surface soil crusting following post-sowing showers during seedling emergence.";

    case "sandy":
      if (params.hasDsr) {
        return "Coarse sandy soil is completely unsuitable for DSR; high permeability causes acute iron chlorosis, seedling mortality, and rapid water percolation.";
      }
      return "Coarse sandy soil has rapid drainage and low nutrient buffering; split fertilizer applications into multiple mini-doses to avoid deep leaching.";

    default:
      return "Soil physical properties align adequately with crop root zone requirements.";
  }
}

interface IrrigationRationaleParams {
  irrigationSource?: string;
  groundwaterDepthMeters?: number;
  totalWaterMm: number;
  irrigationDeficitMm: number;
  meanAnnualRain: number;
}

function buildIrrigationSuitabilityRationale(params: IrrigationRationaleParams): string {
  if (!params.irrigationSource) {
    return "Evaluated under standard central Punjab deep tubewell assumptions (irrigation source not specified by farmer).";
  }

  switch (params.irrigationSource) {
    case "rainfed_only":
      if (params.totalWaterMm > params.meanAnnualRain) {
        return `Under rainfed conditions, total water requirements (~${params.totalWaterMm} mm) far exceed historical rainfall (~${params.meanAnnualRain.toFixed(0)} mm). Irrigation-dependent kharif crops cannot be sustained without supplemental water storage.`;
      }
      return `Low water footprint (~${params.totalWaterMm} mm) can be supported under rainfed conditions with in situ moisture conservation.`;

    case "tubewell_deep":
      return `Deep tubewell infrastructure provides assured water volume across all stages (~${params.totalWaterMm} mm/year demand), but operates in an over-exploited aquifer zone where net withdrawal exceeds annual recharge by ~${params.irrigationDeficitMm.toFixed(0)} mm.`;

    case "tubewell_shallow":
      if ((params.groundwaterDepthMeters ?? 0) > 15) {
        return `Shallow tubewells risk discharge failure during peak summer extraction as water tables drop below centrifugal pump suction limits (>15 m depth). High-water crops face delivery risk.`;
      }
      return `Shallow tubewell capacity is adequate for moderate water rotations (~${params.totalWaterMm} mm/year), but pre-monsoon water table fluctuations should be monitored.`;

    case "canal":
      return "Canal irrigation provides surface water with low salinity; field applications must be synchronized with warabandi rotational supply cycles, particularly during critical flowering stages.";

    case "conjunctive":
      return "Conjunctive use of canal and tubewell water provides optimal irrigation security, enabling timely irrigations while minimizing aquifer overdraft and controlling root-zone salinity.";

    default:
      return "Irrigation source matches crop water requirements adequately.";
  }
}

interface ClimateRationaleParams {
  rotationId: string;
  marchMaxTemp: number;
  hasWheat: boolean;
  hasMustard: boolean;
  hasMaize: boolean;
}

function buildClimateCompatibilityRationale(params: ClimateRationaleParams): string {
  if (params.hasWheat) {
    return `Historical March mean maximum temperature of ${params.marchMaxTemp.toFixed(1)}°C indicates moderate terminal heat risk during wheat grain-fill; sowing before November 15 helps escape peak thermal surges.`;
  }
  if (params.hasMustard) {
    return `Rabi mustard matures by mid-March, successfully escaping late-March thermal surges (${params.marchMaxTemp.toFixed(1)}°C) and winter fog risks when sown in October.`;
  }
  if (params.hasMaize) {
    return "Kharif maize aligns with the southwest monsoon pattern, utilizing rainfall during July–August vegetative growth without requiring intense pre-monsoon nursery ponding.";
  }
  return "Cropping calendar aligns reasonably with regional thermal and monsoon distributions.";
}

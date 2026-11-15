import {
  AgronomicRisk,
  AssessmentTradeoff,
  ClimateIndicators,
  RecommendationExplanation,
  RotationComparisonResult,
  RotationDefinition,
  RotationEconomicComparison,
  RotationFarmerContext,
  SuitabilityStatus,
  WaterDemandCategory,
} from "@/types";
import { evaluateRotationFeasibility } from "./feasibility";
import { calculateRotationEconomics } from "./economics";
import { getRotationIrrigationWaterMm } from "@/agronomy/rotations";

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
  farmerContext?: RotationFarmerContext,
  providedBaselineEconomics?: RotationEconomicComparison
): RotationComparisonResult {
  const feasibility = evaluateRotationFeasibility(rotation, farmerContext);
  const isBaseline = rotation.id === "rotation_rice_wheat";

  // Calculate total supplemental irrigation water application requirement
  const totalWaterMm = getRotationIrrigationWaterMm(rotation.id);

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

  // Groundwater depletion risk tier:
  // Reflects annual supplemental irrigation intensity relative to local rainfall
  // and accounts for irrigation source (canal surface supply buffers direct aquifer pumping).
  const meanAnnualRain = climate.meanAnnualRainfallMm;
  const irrigationDeficitMm = Math.max(0, totalWaterMm - meanAnnualRain);

  const isCanal = farmerContext?.irrigationSource === "canal";
  const isConjunctive = farmerContext?.irrigationSource === "conjunctive";

  let groundwaterPressureIndex: "critical" | "high" | "moderate" | "low" = "moderate";
  if (isCanal) {
    // Surface gravity canal supply buffers direct aquifer pumping;
    // however, rotational Warabandi scheduling (typically 1 turn every 7–10 days)
    // cannot sustain high-demand continuous flooded paddy (~1750 mm Kharif)
    // without supplemental tubewell pumping during peak evapotranspiration periods.
    if (totalWaterMm > 1800) {
      groundwaterPressureIndex = "high";
    } else if (totalWaterMm > 1000) {
      groundwaterPressureIndex = "moderate";
    } else {
      groundwaterPressureIndex = "low";
    }
  } else if (isConjunctive) {
    // Combined canal + tubewell: reduces aquifer pumping by ~30–40% compared to pure tubewell
    if (irrigationDeficitMm > 1400) {
      groundwaterPressureIndex = "high";
    } else if (irrigationDeficitMm > 600) {
      groundwaterPressureIndex = "moderate";
    } else {
      groundwaterPressureIndex = "low";
    }
  } else {
    // Pure tubewell (deep/shallow) or regional baseline default (>80% tubewell irrigated in Central Punjab)
    if (irrigationDeficitMm > 1200) {
      groundwaterPressureIndex = "critical";
    } else if (irrigationDeficitMm > 700) {
      groundwaterPressureIndex = "high";
    } else if (irrigationDeficitMm > 300) {
      groundwaterPressureIndex = "moderate";
    } else {
      groundwaterPressureIndex = "low";
    }
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
      hasWheat && marchMaxTemp > 30.0
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
    summary: isCanal
      ? `Estimated annual supplemental irrigation requirement is ~${totalWaterMm} mm/yr (historical rainfall: ~${meanAnnualRain.toFixed(0)} mm/yr). Under canal command, primary demand is met by surface water, but rotational Warabandi scheduling (typically weekly turns) requires supplemental tubewell pumping during peak rice evapotranspiration (${groundwaterPressureIndex} depletion risk tier).`
      : `Estimated annual supplemental irrigation requirement is ~${totalWaterMm} mm/yr (historical rainfall: ~${meanAnnualRain.toFixed(0)} mm/yr). Under tubewell irrigation, this translates to an estimated groundwater pumping load of ~${totalWaterMm} mm/yr (${groundwaterPressureIndex} depletion risk tier).`,
    advantages: [
      totalWaterMm < 1200
        ? (isCanal
          ? `Estimated reduction in supplemental irrigation requirement: ~${(2150 - totalWaterMm).toFixed(0)} mm/yr (≈ ${((2150 - totalWaterMm) * 10).toLocaleString()} m³/ha/yr) compared to baseline rice–wheat.`
          : `Estimated reduction in supplemental irrigation requirement: ~${(2150 - totalWaterMm).toFixed(0)} mm/yr (≈ ${((2150 - totalWaterMm) * 10).toLocaleString()} m³/ha/yr), substantially mitigating groundwater overdraft.`)
        : "",
      totalWaterMm <= 800
        ? (isCanal
          ? "Low water footprint provides high buffer against canal roster supply cuts."
          : "Highly resilient against seasonal tubewell power cuts and water table drops.")
        : "",
    ].filter(Boolean),
    disadvantages: [
      totalWaterMm >= 1800
        ? (isCanal
          ? "Rotational Warabandi canal turns cannot sustain continuous standing water (~1750 mm) in June–July without supplemental tubewell pumping during off-roster days."
          : "High irrigation demand accelerates aquifer overdraft in over-exploited Punjab assessment blocks (district-level Stage of Ground Water Extraction >150% according to CGWB).")
        : "",
      hasPaddy
        ? (isCanal
          ? "Continuous standing water in June requires reliable and timely canal roster delivery."
          : "Requires continuous deep tubewell pumpage through the dry pre-monsoon weeks of June.")
        : "",
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
    hasMaize ? "60–65% reduction in seasonal irrigation application vs puddled paddy" : "",
    hasMustard ? "Diversification away from cereal monoculture with deep taproot scavenging" : "",
    !hasPaddy ? "Halts subsoil hardpan formation and improves soil infiltration capacity" : "",
  ].filter(Boolean);

  const keyRisks = [
    isBaseline ? "Heavy irrigation intensity: requires continuous deep tubewell extraction in over-exploited groundwater zones" : "",
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

  // 4. Concrete actionable next steps (tailored to farmer context and feasibility)
  const actionableNextSteps = buildActionableNextSteps({
    rotationId: rotation.id,
    isFeasible: feasibility.isFeasible,
    soilTexture: farmerContext?.soilTexture,
    irrigationSource: farmerContext?.irrigationSource,
    hasPaddy,
    hasDsr,
    hasMaize,
    hasMustard,
    hasMoong,
    hasWheat,
  });

  // 5. Plain-language recommendation rationale
  const recommendation = buildRecommendationExplanation({
    rotation,
    suitabilityStatus,
    feasibility,
    criticalLimitations,
    actionableNextSteps,
    farmerContext,
    totalWaterMm,
    irrigationDeficitMm,
    meanAnnualRain,
    marchMaxTemp,
    hasWheat,
    hasMustard,
    hasMaize,
    hasPaddy,
    hasDsr,
    hasMoong,
    isBaseline,
  });

  // 6. Calculate economics
  let economics: RotationEconomicComparison | undefined;
  try {
    economics = calculateRotationEconomics(
      rotation,
      farmerContext,
      providedBaselineEconomics
    );
  } catch {
    economics = undefined;
  }

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
    economics,
  };
}

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
    const isCanalOnly = irrigation === "canal";
    risks.push({
      category: "water",
      severity: "manageable",
      title: isCanalOnly
        ? "Water Imbalance & Canal Supply Synchronization"
        : "Aquifer Over-Draft Under Flooded Rice",
      description: isCanalOnly
        ? `Transplanted puddled rice requires an estimated ~1,750 mm water (~${params.totalWaterMm} mm for full rotation), creating delivery bottlenecks during rotational canal closures.`
        : `Transplanted puddled rice requires an estimated ~1,750 mm water (~${params.totalWaterMm} mm for full rotation), generating an estimated net annual irrigation deficit of ~${params.irrigationDeficitMm.toFixed(0)} mm against historical rainfall.`,
      mitigationGuidance: isCanalOnly
        ? "Construct an on-farm storage pond to buffer against rotational canal closures; align transplanting with peak canal supply cycles."
        : "Deploy PAU tensiometers to schedule tubewell irrigations 2 days after ponded water has infiltrated rather than maintaining continuous submergence, reducing tubewell pumping by 20–25% without yield penalty.",
    });
  }

  if (irrigation === "tubewell_shallow" && depth > 15) {
    risks.push({
      category: "water",
      severity: "manageable",
      title: "Shallow Tubewell Suction Limit Risk",
      description:
        "Water table drop below 15 m during May–June can cause centrifugal pump cavitation and discharge interruption during critical crop phases.",
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
        "Apply lighter, more frequent irrigations and split nitrogen fertilizer into 3–4 mini-doses to avoid nutrient loss below the root zone.",
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
        "Monitor crop weekly at 15–25 DAS for interveinal yellowing. If iron chlorosis appears, apply foliar ferrous sulphate sprays according to current PAU Package of Practices recommendations.",
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
        "Rotate herbicide chemistries and modes of action to manage resistance; consult current PAU weed management advisories and product labels for approved pre-emergence and post-emergence selections.",
    });
  }

  if (params.hasDsr) {
    risks.push({
      category: "pest_disease",
      severity: "manageable",
      title: "Intense Early-Season Weed Competition in DSR",
      description:
        "Absence of continuous standing water allows simultaneous germination of complex weed flora (Echinochloa crus-galli, Leptochloa chinensis, Cyperus spp.).",
      mitigationGuidance:
        "Follow PAU protocol: Apply pendimethalin within 24 hours of sowing followed by post-emergence bispyribac-sodium / penoxsulam at 20–25 DAS.",
    });
  }

  if (params.hasMaize) {
    risks.push({
      category: "pest_disease",
      severity: "manageable",
      title: "Fall Armyworm (Spodoptera frugiperda) in Maize",
      description:
        "Invasive lepidopteran pest infests central whorl of young maize plants from early whorl to tasseling.",
      mitigationGuidance:
        "Scout weekly; apply pheromone traps; apply approved PAU microbial sprays (Bt/NPV) or contact insecticides directed into the whorl upon 5% infestation threshold.",
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
  groundwaterPressureIndex: string;
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
  isFeasible: boolean;
  soilTexture?: string;
  irrigationSource?: string;
  hasPaddy: boolean;
  hasDsr: boolean;
  hasMaize: boolean;
  hasMustard: boolean;
  hasMoong: boolean;
  hasWheat: boolean;
}

function buildActionableNextSteps(params: ActionableStepsParams): string[] {
  if (!params.isFeasible) {
    if (params.rotationId === "rotation_dsr_wheat" && params.soilTexture === "sandy") {
      return [
        "Do NOT attempt DSR on coarse sandy soil. Switch to maize or consider conventional puddled rice with strict tensiometer irrigation scheduling.",
        "Submit soil samples to the nearest Krishi Vigyan Kendra (KVK) to verify clay percentage (>10% required for DSR).",
      ];
    }
    return [
      "Review physical limiting factors with local PAU / KVK agricultural extension specialists.",
      "Address irrigation or soil drainage constraints before attempting this cropping sequence.",
    ];
  }

  const steps: string[] = [];

  if (params.hasDsr) {
    steps.push("Laser-level the field in summer to ensure uniform seed placement depth (2–3 cm) and avoid water ponding pockets.");
    steps.push("Procure PAU-recommended DSR varieties (e.g. PR 126 or PR 131) and seed-drill equipped with inclined plate metering.");
  } else if (params.hasMaize) {
    steps.push("Arrange single-cross hybrid seed (PMH 13 or PMH 1) from certified Punjab State Seed Corporation outlets.");
    steps.push("Prepare ridges or raised beds (67.5 cm spacing) before monsoon onset to safeguard against seedling waterlogging.");
  } else if (params.hasPaddy) {
    steps.push("Install PAU tensiometer at 15–20 cm root depth to guide irrigation timings after initial 15-day establishment period.");
    steps.push("Direct-drill wheat into standing rice residue using a Happy Seeder or Smart Seeder to avoid straw burning penalties.");
  }

  if (params.hasMustard) {
    steps.push("Target early mustard sowing between October 10–25 to maximize vegetative growth before December chill.");
  }

  if (params.hasMoong) {
    steps.push("Inoculate summer moong seed with Rhizobium and Phosphorus Solubilizing Bacteria (PSB) biofertilizers prior to drilling.");
  }

  if (params.hasWheat) {
    steps.push("Complete wheat sowing by November 15 to safeguard against late-March terminal heat waves.");
  }

  return steps;
}

interface RecommendationRationaleParams {
  rotation: RotationDefinition;
  suitabilityStatus: SuitabilityStatus;
  feasibility: { isFeasible: boolean };
  criticalLimitations: string[];
  actionableNextSteps: string[];
  farmerContext?: RotationFarmerContext;
  totalWaterMm: number;
  irrigationDeficitMm: number;
  meanAnnualRain: number;
  marchMaxTemp: number;
  hasWheat: boolean;
  hasMustard: boolean;
  hasMaize: boolean;
  hasPaddy: boolean;
  hasDsr: boolean;
  hasMoong: boolean;
  isBaseline: boolean;
}

function buildRecommendationExplanation(params: RecommendationRationaleParams): RecommendationExplanation {
  let overallRationale = "";

  if (!params.feasibility.isFeasible) {
    overallRationale = `Agronomically unfeasible under current farm context: ${params.criticalLimitations.join("; ")}`;
  } else if (params.suitabilityStatus === "highly_suitable") {
    overallRationale = `Highly suitable diversification choice. Reduces annual water demand to ~${params.totalWaterMm} mm while breaking the continuous rice-wheat monoculture with manageable agronomic risks.`;
  } else if (params.suitabilityStatus === "suitable_with_mitigation") {
    overallRationale = `Agronomically viable and resource-efficient, but requires specific management interventions (such as weed control, raised beds, or moisture monitoring) to achieve target yield.`;
  } else {
    overallRationale = `Feasible under existing infrastructure but represents continuous aquifer depletion (~${params.irrigationDeficitMm.toFixed(0)} mm net deficit) and soil plow-pan compaction.`;
  }

  return {
    suitabilityStatus: params.suitabilityStatus,
    overallRationale,
    soilSuitabilityRationale: buildSoilSuitabilityRationale({
      soilTexture: params.farmerContext?.soilTexture,
      hasDsr: params.hasDsr,
      hasMaize: params.hasMaize,
      hasPaddy: params.hasPaddy,
      hasMustard: params.hasMustard,
    }),
    irrigationSuitabilityRationale: buildIrrigationSuitabilityRationale({
      irrigationSource: params.farmerContext?.irrigationSource,
      groundwaterDepthMeters: params.farmerContext?.groundwaterDepthMeters,
      totalWaterMm: params.totalWaterMm,
      irrigationDeficitMm: params.irrigationDeficitMm,
      meanAnnualRain: params.meanAnnualRain,
    }),
    climateCompatibilityRationale: buildClimateCompatibilityRationale({
      rotationId: params.rotation.id,
      marchMaxTemp: params.marchMaxTemp,
      hasWheat: params.hasWheat,
      hasMustard: params.hasMustard,
      hasMaize: params.hasMaize,
    }),
    actionableNextSteps: params.actionableNextSteps,
  };
}

interface SoilRationaleParams {
  soilTexture?: string;
  hasDsr: boolean;
  hasMaize: boolean;
  hasPaddy: boolean;
  hasMustard?: boolean;
}

function buildSoilSuitabilityRationale(params: SoilRationaleParams): string {
  if (!params.soilTexture) {
    return "Evaluated under standard central Punjab medium loam assumptions (soil texture not specified by farmer).";
  }

  switch (params.soilTexture) {
    case "sandy_loam":
      if (params.hasMaize || params.hasMustard) {
        return "Sandy loam provides excellent internal drainage, aeration, and warm seedbed conditions, ideal for early root anchorage of kharif maize and mustard taproots.";
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
      return "Coarse sandy soil has rapid drainage and low nutrient buffering; split fertilizer applications into multiple mini-doses to avoid nutrient loss below the root zone.";

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

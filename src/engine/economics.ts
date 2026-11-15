import {
  BaselineEconomicDelta,
  CropEconomicMetrics,
  EconomicDataProvenance,
  EconomicScenario,
  EconomicSensitivityAnalysis,
  InputCostBreakdown,
  RotationDefinition,
  RotationEconomicComparison,
  RotationFarmerContext,
  SensitivityPoint,
} from "@/types";
import {
  CropEconomicBenchmark,
  PUNJAB_ECONOMIC_BENCHMARKS,
} from "@/agronomy/economicBenchmarks";

export interface EconomicEvaluationOptions {
  yieldOverrides?: Record<string, number>;
  priceOverrides?: Record<string, number>;
}

/**
 * Calculates economic metrics for an individual crop under specific farmer context.
 * Adjusts pumping energy costs based on irrigation source, and soil-specific management costs.
 */
export function calculateCropEconomics(
  cropId: string,
  farmerContext?: RotationFarmerContext,
  overrides?: EconomicEvaluationOptions
): CropEconomicMetrics {
  const benchmark = PUNJAB_ECONOMIC_BENCHMARKS[cropId];
  if (!benchmark) {
    throw new Error(`Economic benchmark not defined for crop: ${cropId}`);
  }

  // Allow configurable yield and price overrides with safe non-negative fallbacks
  const yieldQ = Math.max(
    0,
    overrides?.yieldOverrides?.[cropId] ?? benchmark.referenceYieldQuintalsPerHa
  );
  const priceQ = Math.max(
    0,
    overrides?.priceOverrides?.[cropId] ?? benchmark.referencePriceInrPerQuintal
  );

  // Deep clone baseline costs
  const costBreakdown: InputCostBreakdown = {
    seedsInrPerHa: benchmark.costBreakdown.seedsInrPerHa,
    fertilizersInrPerHa: benchmark.costBreakdown.fertilizersInrPerHa,
    plantProtectionInrPerHa: benchmark.costBreakdown.plantProtectionInrPerHa,
    machineryLabourInrPerHa: benchmark.costBreakdown.machineryLabourInrPerHa,
    irrigationEnergyInrPerHa: benchmark.costBreakdown.irrigationEnergyInrPerHa,
    miscellaneousInrPerHa: benchmark.costBreakdown.miscellaneousInrPerHa,
    totalInrPerHa: 0,
  };

  // Farmer Context Adjustment 1: Irrigation Source & Pumping Energy
  const irrigationSource = farmerContext?.irrigationSource;
  if (irrigationSource === "rainfed_only") {
    costBreakdown.irrigationEnergyInrPerHa = 0;
  } else if (irrigationSource === "tubewell_shallow") {
    // Shallow centrifugal pumping from deeper water table requires higher motor upkeep
    const depth = farmerContext?.groundwaterDepthMeters ?? 0;
    const depthMultiplier = depth > 15 ? 1.5 : 1.25;
    costBreakdown.irrigationEnergyInrPerHa = Math.round(
      costBreakdown.irrigationEnergyInrPerHa * depthMultiplier
    );
  } else if (irrigationSource === "canal") {
    // Canal water cess (abiana) + minimal on-farm booster pumping
    costBreakdown.irrigationEnergyInrPerHa = Math.round(
      costBreakdown.irrigationEnergyInrPerHa * 1.15
    );
  } else if (irrigationSource === "conjunctive") {
    costBreakdown.irrigationEnergyInrPerHa = Math.round(
      costBreakdown.irrigationEnergyInrPerHa * 1.1
    );
  }

  // Farmer Context Adjustment 2: Soil Texture Management Needs
  const soilTexture = farmerContext?.soilTexture;
  if (soilTexture === "sandy") {
    // Coarse sandy soil suffers nutrient leaching; requires +10% split fertilizer application
    costBreakdown.fertilizersInrPerHa = Math.round(
      costBreakdown.fertilizersInrPerHa * 1.1
    );
  } else if (soilTexture === "clay_loam" && cropId === "kharif_maize") {
    // Fine-textured clay loam requires tractor-mounted raised bed / ridge sowing
    costBreakdown.machineryLabourInrPerHa += 1200;
  }

  // Calculate total cultivation cost
  costBreakdown.totalInrPerHa =
    costBreakdown.seedsInrPerHa +
    costBreakdown.fertilizersInrPerHa +
    costBreakdown.plantProtectionInrPerHa +
    costBreakdown.machineryLabourInrPerHa +
    costBreakdown.irrigationEnergyInrPerHa +
    costBreakdown.miscellaneousInrPerHa;

  const byproductRevenue = benchmark.byproductRevenueInrPerHa || 0;
  const nitrogenCredit = benchmark.nitrogenCreditInrPerHa || 0;

  // Gross Revenue = Grain Sale Value + Byproduct Value + Nitrogen Fertility Credit
  const grossRevenue = yieldQ * priceQ + byproductRevenue + nitrogenCredit;
  const netReturn = grossRevenue - costBreakdown.totalInrPerHa;

  // Safe Break-even calculations (guarding against divide-by-zero)
  const netCostToRecover = Math.max(
    0,
    costBreakdown.totalInrPerHa - byproductRevenue - nitrogenCredit
  );
  const breakEvenPrice =
    yieldQ > 0 ? Math.round(netCostToRecover / yieldQ) : 0;
  const breakEvenYield =
    priceQ > 0 ? parseFloat((netCostToRecover / priceQ).toFixed(1)) : 0;
  const benefitCostRatio =
    costBreakdown.totalInrPerHa > 0
      ? parseFloat((grossRevenue / costBreakdown.totalInrPerHa).toFixed(2))
      : 0;

  return {
    cropId: benchmark.cropId,
    cropName: benchmark.cropName,
    season: benchmark.season,
    yieldQuintalsPerHa: yieldQ,
    yieldRangeQuintalsPerHa: benchmark.yieldRangeQuintalsPerHa,
    sellingPriceInrPerQuintal: priceQ,
    priceType: benchmark.priceType,
    mspBenchmarkInrPerQuintal: benchmark.mspBenchmarkInrPerQuintal,
    grossRevenueInrPerHa: Math.round(grossRevenue),
    costOfCultivationInrPerHa: costBreakdown.totalInrPerHa,
    netReturnInrPerHa: Math.round(netReturn),
    breakEvenPriceInrPerQuintal: breakEvenPrice,
    breakEvenYieldQuintalsPerHa: breakEvenYield,
    benefitCostRatio,
    costBreakdown,
    nitrogenCreditInrPerHa: nitrogenCredit,
    byproductRevenueInrPerHa: byproductRevenue,
  };
}

/**
 * Calculates full-rotation economic comparison, aggregation, sensitivity, and scenarios.
 */
export function calculateRotationEconomics(
  rotation: RotationDefinition,
  farmerContext?: RotationFarmerContext,
  baselineEconomics?: RotationEconomicComparison,
  overrides?: EconomicEvaluationOptions
): RotationEconomicComparison {
  const cropEconomics = rotation.cropSequence.map((cropId) =>
    calculateCropEconomics(cropId, farmerContext, overrides)
  );

  // Aggregate combined cost breakdown across all crops in rotation
  const combinedCostBreakdown: InputCostBreakdown = {
    seedsInrPerHa: 0,
    fertilizersInrPerHa: 0,
    plantProtectionInrPerHa: 0,
    machineryLabourInrPerHa: 0,
    irrigationEnergyInrPerHa: 0,
    miscellaneousInrPerHa: 0,
    totalInrPerHa: 0,
  };

  let totalGrossRevenue = 0;
  let totalCultivationCost = 0;

  for (const crop of cropEconomics) {
    combinedCostBreakdown.seedsInrPerHa += crop.costBreakdown.seedsInrPerHa;
    combinedCostBreakdown.fertilizersInrPerHa += crop.costBreakdown.fertilizersInrPerHa;
    combinedCostBreakdown.plantProtectionInrPerHa += crop.costBreakdown.plantProtectionInrPerHa;
    combinedCostBreakdown.machineryLabourInrPerHa += crop.costBreakdown.machineryLabourInrPerHa;
    combinedCostBreakdown.irrigationEnergyInrPerHa += crop.costBreakdown.irrigationEnergyInrPerHa;
    combinedCostBreakdown.miscellaneousInrPerHa += crop.costBreakdown.miscellaneousInrPerHa;
    totalGrossRevenue += crop.grossRevenueInrPerHa;
    totalCultivationCost += crop.costOfCultivationInrPerHa;
  }

  combinedCostBreakdown.totalInrPerHa = totalCultivationCost;
  const netReturn = totalGrossRevenue - totalCultivationCost;
  const benefitCostRatio =
    totalCultivationCost > 0
      ? parseFloat((totalGrossRevenue / totalCultivationCost).toFixed(2))
      : 0;

  // Comparison to baseline rice-wheat if available and this is an alternative
  let comparisonToBaseline: BaselineEconomicDelta | undefined;
  if (baselineEconomics && rotation.id !== baselineEconomics.rotationId) {
    const netReturnDelta = netReturn - baselineEconomics.netReturnInrPerHa;
    const netReturnDeltaPercent =
      baselineEconomics.netReturnInrPerHa !== 0
        ? parseFloat(
            ((netReturnDelta / Math.abs(baselineEconomics.netReturnInrPerHa)) * 100).toFixed(1)
          )
        : 0;

    const costDelta = totalCultivationCost - baselineEconomics.totalCultivationCostInrPerHa;
    const costDeltaPercent =
      baselineEconomics.totalCultivationCostInrPerHa !== 0
        ? parseFloat(
            ((costDelta / baselineEconomics.totalCultivationCostInrPerHa) * 100).toFixed(1)
          )
        : 0;

    const grossRevenueDelta = totalGrossRevenue - baselineEconomics.grossRevenueInrPerHa;
    const waterEnergySavings = Math.max(
      0,
      baselineEconomics.irrigationEnergyCostInrPerHa -
        combinedCostBreakdown.irrigationEnergyInrPerHa
    );

    comparisonToBaseline = {
      netReturnDeltaInrPerHa: Math.round(netReturnDelta),
      netReturnDeltaPercent,
      costDeltaInrPerHa: Math.round(costDelta),
      costDeltaPercent,
      grossRevenueDeltaInrPerHa: Math.round(grossRevenueDelta),
      waterEnergySavingsInrPerHa: Math.round(waterEnergySavings),
    };
  }

  // Phase 3: Sensitivity Analysis (Yield, Price, Input Cost)
  const sensitivityAnalysis = calculateSensitivityAnalysis(
    cropEconomics,
    totalGrossRevenue,
    totalCultivationCost
  );

  // Phase 3: Scenarios (Conservative, Reference, Optimistic)
  const scenarios = calculateScenarios(
    cropEconomics,
    totalGrossRevenue,
    totalCultivationCost
  );

  // Phase 5: Economic Data Provenance & Disclaimers
  const provenance: EconomicDataProvenance = {
    dataSource:
      "Commission for Agricultural Costs and Prices (CACP 2024-25 Reports) & Punjab Agricultural University (PAU) Cost of Cultivation Studies",
    referenceMarketingSeason: "Kharif Marketing Season (KMS) 2024-25 & Rabi Marketing Season (RMS) 2024-25",
    isVerifiedMsp: cropEconomics.every((c) => c.priceType === "msp_benchmark"),
    priceType: cropEconomics.some((c) => c.priceType === "market_average")
      ? "market_average"
      : "msp_benchmark",
    estimationMethodology:
      "Deterministic gross margin calculation based on representative Punjab input-output budgets (Cost A2 + Family Labour proxy). Adjusted for farmer irrigation source and soil texture.",
    assumptions: [
      "Government MSP procurement fidelity is assumed high for paddy and wheat in Punjab mandis.",
      "Maize and summer moong prices reflect historical average Punjab mandi realization rather than guaranteed MSP.",
      "Electricity for agricultural tubewells in Punjab is evaluated under current state power tariff structures with motor maintenance allowances.",
      "Wheat straw (bhusa) revenue is credited at prevailing regional animal fodder market values (~₹240/quintal).",
      "Summer moong biological nitrogen fixation is credited as reduced synthetic urea requirement in succeeding crop (~₹1,400/ha).",
    ],
    limitations: [
      "Economic returns are models based on average regional productivity, not guaranteed farmer income.",
      "Individual farm realization varies with localized weather anomalies, pest pressures, and mandi marketing timing.",
      "Land lease/rental costs (Cost C2 component) are excluded to ensure applicability across owner-operators and tenant cultivators.",
    ],
  };

  return {
    rotationId: rotation.id,
    totalCultivationCostInrPerHa: totalCultivationCost,
    grossRevenueInrPerHa: totalGrossRevenue,
    netReturnInrPerHa: netReturn,
    benefitCostRatio,
    cropEconomics,
    combinedCostBreakdown,
    irrigationEnergyCostInrPerHa: combinedCostBreakdown.irrigationEnergyInrPerHa,
    comparisonToBaseline,
    sensitivityAnalysis,
    scenarios,
    provenance,
  };
}

/**
 * Helper: Computes deterministic sensitivity points for yield, price, and input costs.
 */
function calculateSensitivityAnalysis(
  cropEconomics: CropEconomicMetrics[],
  baseGrossRevenue: number,
  baseCost: number
): EconomicSensitivityAnalysis {
  const deltas = [-20, -10, 0, 10, 20];
  const costDeltas = [-10, 0, 10, 20];
  const baseNet = baseGrossRevenue - baseCost;

  // Commodity grain revenue is proportional to yield and price
  // Byproduct and N-credit do not scale directly with grain yield/price changes
  const grainRevenue = cropEconomics.reduce(
    (sum, c) => sum + c.yieldQuintalsPerHa * c.sellingPriceInrPerQuintal,
    0
  );
  const otherRevenue = baseGrossRevenue - grainRevenue;

  const yieldSensitivity: SensitivityPoint[] = deltas.map((delta) => {
    const factor = 1 + delta / 100;
    const adjustedGross = Math.round(grainRevenue * factor + otherRevenue);
    const adjustedNet = adjustedGross - baseCost;
    return {
      deltaPercent: delta,
      netReturnInrPerHa: adjustedNet,
      netReturnChangeInrPerHa: adjustedNet - baseNet,
    };
  });

  const priceSensitivity: SensitivityPoint[] = deltas.map((delta) => {
    const factor = 1 + delta / 100;
    const adjustedGross = Math.round(grainRevenue * factor + otherRevenue);
    const adjustedNet = adjustedGross - baseCost;
    return {
      deltaPercent: delta,
      netReturnInrPerHa: adjustedNet,
      netReturnChangeInrPerHa: adjustedNet - baseNet,
    };
  });

  const costSensitivity: SensitivityPoint[] = costDeltas.map((delta) => {
    const factor = 1 + delta / 100;
    const adjustedCost = Math.round(baseCost * factor);
    const adjustedNet = baseGrossRevenue - adjustedCost;
    return {
      deltaPercent: delta,
      netReturnInrPerHa: adjustedNet,
      netReturnChangeInrPerHa: adjustedNet - baseNet,
    };
  });

  return {
    yieldSensitivity,
    priceSensitivity,
    costSensitivity,
  };
}

/**
 * Helper: Computes conservative, reference, and optimistic scenarios.
 */
function calculateScenarios(
  cropEconomics: CropEconomicMetrics[],
  baseGrossRevenue: number,
  baseCost: number
): {
  conservative: EconomicScenario;
  reference: EconomicScenario;
  optimistic: EconomicScenario;
} {
  const grainRevenue = cropEconomics.reduce(
    (sum, c) => sum + c.yieldQuintalsPerHa * c.sellingPriceInrPerQuintal,
    0
  );
  const otherRevenue = baseGrossRevenue - grainRevenue;

  // 1. Conservative Scenario: -10% yield, -10% price realization, +10% input cost
  const conservativeGross = Math.round(grainRevenue * 0.9 * 0.9 + otherRevenue);
  const conservativeCost = Math.round(baseCost * 1.1);
  const conservativeNet = conservativeGross - conservativeCost;

  // 2. Reference Scenario: standard base benchmarks
  const referenceNet = baseGrossRevenue - baseCost;

  // 3. Optimistic Scenario: +10% yield, +5% price premium, -5% input efficiency
  const optimisticGross = Math.round(grainRevenue * 1.1 * 1.05 + otherRevenue);
  const optimisticCost = Math.round(baseCost * 0.95);
  const optimisticNet = optimisticGross - optimisticCost;

  return {
    conservative: {
      scenarioName: "conservative",
      label: "Conservative Scenario",
      grossRevenueInrPerHa: conservativeGross,
      totalCostInrPerHa: conservativeCost,
      netReturnInrPerHa: conservativeNet,
      assumptions:
        "Sub-optimal weather or mild pest pressure (-10% yield), mandi price discount (-10%), and higher input costs (+10%).",
    },
    reference: {
      scenarioName: "reference",
      label: "Reference Baseline Scenario",
      grossRevenueInrPerHa: baseGrossRevenue,
      totalCostInrPerHa: baseCost,
      netReturnInrPerHa: referenceNet,
      assumptions:
        "Normal seasonal weather, benchmark yields from PAU trials, official MSP / historical average mandi prices, standard cultivation costs.",
    },
    optimistic: {
      scenarioName: "optimistic",
      label: "Optimistic Scenario",
      grossRevenueInrPerHa: optimisticGross,
      totalCostInrPerHa: optimisticCost,
      netReturnInrPerHa: optimisticNet,
      assumptions:
        "Favorable weather and timely sowing (+10% yield), favorable quality price premium (+5%), and precision input efficiency (-5% cost).",
    },
  };
}

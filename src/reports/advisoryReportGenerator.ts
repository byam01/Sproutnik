import {
  IrrigationSourceType,
  SoilTextureType,
  RotationComparisonResult,
} from "@/types";
import { RecalculatedRotation } from "@/utils/scenarioRecalculator";
import { compareTwoRotations } from "@/engine/candidateComparison";
import {
  CANDIDATE_ROTATIONS,
  getRotationIrrigationWaterMm,
  getRotationMinTurnaroundDays,
} from "@/agronomy/rotations";
import { getCropDisplayName } from "@/utils/cropCatalogAdapter";

export type ProfileCompleteness = "farmer_provided" | "partially_configured" | "regional_baseline";

export interface FieldProvenanceBreakdown {
  location: "farmer_provided" | "regional_default";
  landArea: "farmer_provided" | "regional_default";
  soilTexture: "farmer_provided" | "regional_default";
  irrigationSource: "farmer_provided" | "regional_default";
}

export interface FarmerAdvisoryReportInput {
  mode: "baseline" | "head_to_head";
  generatedAt?: string;
  farmContext: {
    locationName?: string;
    coordinates?: { lat: number; lon: number };
    landAreaHectares?: number | null;
    savedSoilTexture?: SoilTextureType | null;
    savedIrrigationSource?: IrrigationSourceType | null;
    isLocationProvided?: boolean;
    isLandAreaProvided?: boolean;
    isSoilProvided?: boolean;
    isIrrigationProvided?: boolean;
  };
  climateContext?: {
    meanAnnualRainfallMm: number;
    seasonalMonsoonMm?: number;
    meanTemperatureC: number;
    rainfallVariabilityCvPercent?: number;
    periodText?: string;
  };
  scenarioContext?: {
    isScenarioActive: boolean;
    simulatedSoilTexture?: SoilTextureType | null;
    simulatedIrrigationSource?: IrrigationSourceType | null;
  };
  baselineRotation?: RecalculatedRotation | RotationComparisonResult;
  selectedCandidate?: RecalculatedRotation | RotationComparisonResult;
  candidateA?: RecalculatedRotation | RotationComparisonResult;
  candidateB?: RecalculatedRotation | RotationComparisonResult;
  scientificDisclaimer?: string;
}

export interface ReportEconomicItem {
  netReturnInrPerHa: number;
  totalCostInrPerHa: number;
  grossRevenueInrPerHa: number;
  benefitCostRatio: number;
  irrigationEnergyCostInrPerHa: number;
  comparisonToBaseline?: {
    netReturnDeltaInrPerHa: number;
    netReturnDeltaPercent: number;
    costDeltaInrPerHa: number;
    costDeltaPercent: number;
    waterEnergySavingsInrPerHa: number;
  };
  crops: Array<{
    cropName: string;
    season: string;
    yieldQuintalsPerHa: number;
    sellingPriceInrPerQuintal: number;
    priceType: string;
    grossRevenueInrPerHa: number;
    costOfCultivationInrPerHa: number;
    netReturnInrPerHa: number;
    byproductRevenueInrPerHa?: number;
    nitrogenCreditInrPerHa?: number;
  }>;
  costBreakdown: {
    seedsInrPerHa: number;
    fertilizersInrPerHa: number;
    plantProtectionInrPerHa: number;
    machineryLabourInrPerHa: number;
    irrigationEnergyInrPerHa: number;
    miscellaneousInrPerHa: number;
  };
  scenarios: {
    conservative: { netReturnInrPerHa: number; totalCostInrPerHa: number; assumptions: string };
    reference: { netReturnInrPerHa: number; totalCostInrPerHa: number; assumptions: string };
    optimistic: { netReturnInrPerHa: number; totalCostInrPerHa: number; assumptions: string };
  };
}

export interface ReportRotationItem {
  role: "baseline" | "candidate" | "candidate_a" | "candidate_b";
  rotationId: string;
  name: string;
  cropSequence: string[];
  waterDemandMm: number;
  waterDemandCategory: string;
  groundwaterPressureIndex: string;
  minTurnaroundDays: number;
  isFeasible: boolean;
  criteria: Array<{
    code: string;
    name: string;
    passed: boolean;
    explanation: string;
  }>;
  rejectionReasons: string[];
  warnings: string[];
  tradeoffs: Array<{
    dimensionName: string;
    scoreLabel: string;
    summary: string;
    advantages: string[];
    disadvantages: string[];
  }>;
  advantages: string[];
  risks: string[];
  evidence: Array<{
    id: string;
    source: string;
    year?: number;
  }>;
  unknowns: string[];
  economics?: ReportEconomicItem;
}

export interface FarmerAdvisoryReportData {
  reportId: string;
  generatedAt: string;
  formattedDate: string;
  mode: "baseline" | "head_to_head";
  farmContext: {
    locationName: string;
    coordinatesText: string;
    landAreaText: string;
    savedSoilLabel: string;
    savedIrrigationLabel: string;
    isProfileConfirmed: boolean;
    completeness: ProfileCompleteness;
    completenessLabel: string;
    fieldProvenance: FieldProvenanceBreakdown;
    unconfiguredFields: string[];
  };
  climateSummary: {
    periodText: string;
    meanAnnualRainfallMm: number;
    monsoonMm: number | null;
    meanTemperatureC: number;
    variabilityCv: number | null;
  };
  scenarioDisclosure: {
    isSimulated: boolean;
    isProfileConfirmed: boolean;
    simulatedSoilLabel: string | null;
    simulatedIrrigationLabel: string | null;
    disclosureNote: string;
    bannerTitle: string;
  };
  rotations: ReportRotationItem[];
  comparisonHighlights: {
    waterDemandContrast: string;
    turnaroundContrast: string;
    feasibilityContrast: string;
    keyTradeoffs: string[];
  };
  farmerInvestigationChecklist: string[];
  scientificDisclaimer: string;
}

const SOIL_LABELS: Record<string, string> = {
  sandy: "Sandy (Light, Coarse)",
  sandy_loam: "Sandy Loam (Rapid Drainage)",
  loam: "Loam (Balanced Alluvial)",
  clay_loam: "Clay Loam (Heavy Rice Belt)",
  silt_loam: "Silt Loam (Smooth Alluvial)",
};

const IRRIGATION_LABELS: Record<string, string> = {
  rainfed_only: "Rainfed (Monsoon Only, <800 mm)",
  canal: "Canal Gravity (Warabandi Roster)",
  tubewell_shallow: "Shallow Tubewell (Centrifugal)",
  tubewell_deep: "Deep Tubewell (Submersible)",
  conjunctive: "Conjunctive (Canal + Tubewell)",
};

const DIMENSION_NAMES: Record<string, string> = {
  climate_compatibility: "Climate & Thermal Risk",
  water_exposure: "Water Demand & Groundwater",
  diversity: "Agrobiodiversity & Pest Cycles",
  soil_health: "Soil Health & Nutrient Cycling",
  turnaround_feasibility: "Turnaround & Residue Management",
};

function mapRotationToReportItem(
  rot: RecalculatedRotation | RotationComparisonResult,
  role: ReportRotationItem["role"]
): ReportRotationItem {
  const def = CANDIDATE_ROTATIONS.find((r) => r.id === rot.rotationId);
  const cropSequence = def
    ? def.crops.map((c) => getCropDisplayName(c.id, "en"))
    : [rot.rotationName];

  return {
    role,
    rotationId: rot.rotationId,
    name: rot.rotationName,
    cropSequence,
    waterDemandMm: getRotationIrrigationWaterMm(rot.rotationId),
    waterDemandCategory: rot.waterDemandTotalCategory,
    groundwaterPressureIndex: rot.groundwaterPressureIndex,
    minTurnaroundDays: getRotationMinTurnaroundDays(rot.rotationId),
    isFeasible: rot.feasibility.isFeasible,
    criteria: rot.feasibility.criteria.map((c) => ({
      code: c.code,
      name: c.name,
      passed: c.passed,
      explanation: c.explanation,
    })),
    rejectionReasons: rot.feasibility.rejectionReasons,
    warnings: rot.feasibility.warnings,
    tradeoffs: rot.tradeoffs.map((t) => ({
      dimensionName: DIMENSION_NAMES[t.dimension] || t.dimension,
      scoreLabel: t.scoreLabel,
      summary: t.summary,
      advantages: t.advantages,
      disadvantages: t.disadvantages,
    })),
    advantages: rot.diversificationBenefits,
    risks: rot.keyRisks,
    evidence: rot.evidence.map((e) => ({
      id: e.id,
      source: e.source,
      year: e.year,
    })),
    unknowns: rot.unknowns,
    economics: rot.economics
      ? {
        netReturnInrPerHa: rot.economics.netReturnInrPerHa,
        totalCostInrPerHa: rot.economics.totalCultivationCostInrPerHa,
        grossRevenueInrPerHa: rot.economics.grossRevenueInrPerHa,
        benefitCostRatio: rot.economics.benefitCostRatio,
        irrigationEnergyCostInrPerHa: rot.economics.irrigationEnergyCostInrPerHa,
        comparisonToBaseline: rot.economics.comparisonToBaseline,
        crops: rot.economics.cropEconomics.map((c) => ({
          cropName: c.cropName,
          season: c.season,
          yieldQuintalsPerHa: c.yieldQuintalsPerHa,
          sellingPriceInrPerQuintal: c.sellingPriceInrPerQuintal,
          priceType: c.priceType,
          grossRevenueInrPerHa: c.grossRevenueInrPerHa,
          costOfCultivationInrPerHa: c.costOfCultivationInrPerHa,
          netReturnInrPerHa: c.netReturnInrPerHa,
          byproductRevenueInrPerHa: c.byproductRevenueInrPerHa,
          nitrogenCreditInrPerHa: c.nitrogenCreditInrPerHa,
        })),
        costBreakdown: rot.economics.combinedCostBreakdown,
        scenarios: rot.economics.scenarios,
      }
      : undefined,
  };
}

/**
 * Pure generator: Transforms live application state into a clean, structured advisory report.
 * Does not mutate profile, storage, or backend state.
 */
export function generateFarmerAdvisoryReport(
  input: FarmerAdvisoryReportInput
): FarmerAdvisoryReportData {
  const now = input.generatedAt ? new Date(input.generatedAt) : new Date();
  if (isNaN(now.getTime())) {
    throw new Error("Invalid generatedAt date provided for advisory report");
  }

  const reportId = `SPROUTNIK-ADV-${now.getFullYear()}${String(
    now.getMonth() + 1
  ).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.random()
    .toString(36)
    .slice(2, 7)
    .toUpperCase()}`;

  const formattedDate = now.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // 1. Farm context
  const coords = input.farmContext.coordinates;
  const coordsText = coords
    ? `${coords.lat.toFixed(2)}° N, ${coords.lon.toFixed(2)}° E`
    : "30.90° N, 75.85° E";

  const locationName =
    input.farmContext.locationName || "Ludhiana Demonstration Region, Punjab";
  const areaHa = input.farmContext.landAreaHectares;
  const landAreaText =
    areaHa !== null && areaHa !== undefined
      ? `${areaHa} ha (≈ ${(areaHa * 2.47105).toFixed(1)} acres)`
      : "Not specified (Regional typical holding applied)";

  const savedSoilLabel = input.farmContext.savedSoilTexture
    ? SOIL_LABELS[input.farmContext.savedSoilTexture] || input.farmContext.savedSoilTexture
    : "Loam (Regional Default)";

  const savedIrrigationLabel = input.farmContext.savedIrrigationSource
    ? IRRIGATION_LABELS[input.farmContext.savedIrrigationSource] || input.farmContext.savedIrrigationSource
    : "Deep Tubewell (Regional Default)";

  // 2. Climate summary
  const climateSummary = {
    periodText: input.climateContext?.periodText || "2015 – 2024 (10-Yr Baseline)",
    meanAnnualRainfallMm: input.climateContext?.meanAnnualRainfallMm ?? 680,
    monsoonMm: input.climateContext?.seasonalMonsoonMm ?? null,
    meanTemperatureC: input.climateContext?.meanTemperatureC ?? 24.2,
    variabilityCv: input.climateContext?.rainfallVariabilityCvPercent ?? null,
  };

  // 3. Scenario disclosure & Profile Provenance
  const isSimulated = Boolean(input.scenarioContext?.isScenarioActive);
  const simulatedSoilLabel = input.scenarioContext?.simulatedSoilTexture
    ? SOIL_LABELS[input.scenarioContext.simulatedSoilTexture] || input.scenarioContext.simulatedSoilTexture
    : null;
  const simulatedIrrigationLabel = input.scenarioContext?.simulatedIrrigationSource
    ? IRRIGATION_LABELS[input.scenarioContext.simulatedIrrigationSource] || input.scenarioContext.simulatedIrrigationSource
    : null;

  const isLocationProvided = input.farmContext.isLocationProvided !== undefined
    ? input.farmContext.isLocationProvided
    : Boolean(input.farmContext.locationName && !input.farmContext.locationName.includes("Demonstration"));

  const isLandAreaProvided = input.farmContext.isLandAreaProvided !== undefined
    ? input.farmContext.isLandAreaProvided
    : (input.farmContext.landAreaHectares !== null && input.farmContext.landAreaHectares !== undefined && input.farmContext.landAreaHectares > 0);

  const isSoilProvided = input.farmContext.isSoilProvided !== undefined
    ? input.farmContext.isSoilProvided
    : Boolean(input.farmContext.savedSoilTexture);

  const isIrrigationProvided = input.farmContext.isIrrigationProvided !== undefined
    ? input.farmContext.isIrrigationProvided
    : Boolean(input.farmContext.savedIrrigationSource);

  const fieldProvenance: FieldProvenanceBreakdown = {
    location: isLocationProvided ? "farmer_provided" : "regional_default",
    landArea: isLandAreaProvided ? "farmer_provided" : "regional_default",
    soilTexture: isSoilProvided ? "farmer_provided" : "regional_default",
    irrigationSource: isIrrigationProvided ? "farmer_provided" : "regional_default",
  };

  const unconfiguredFields: string[] = [];
  if (!isLocationProvided) unconfiguredFields.push("Location / District");
  if (!isLandAreaProvided) unconfiguredFields.push("Operational Land Area");
  if (!isSoilProvided) unconfiguredFields.push("Soil Texture");
  if (!isIrrigationProvided) unconfiguredFields.push("Irrigation Water Source");

  const providedCount = 4 - unconfiguredFields.length;
  let completeness: ProfileCompleteness = "regional_baseline";
  let completenessLabel = "Regional Demonstration Baseline";

  if (providedCount === 4) {
    completeness = "farmer_provided";
    completenessLabel = "Farmer-Provided Profile";
  } else if (providedCount > 0) {
    completeness = "partially_configured";
    completenessLabel = `Partially Configured Farm Profile (${providedCount}/4 attributes)`;
  }

  const isProfileConfirmed = completeness === "farmer_provided";

  let bannerTitle = "";
  let disclosureNote = "";

  if (isSimulated) {
    bannerTitle = "⚠️ WHAT-IF SCENARIO DISCLOSURE (HYPOTHETICAL SIMULATION)";
    disclosureNote = `NOTICE: This advisory report incorporates an active What-If simulation. Simulated conditions (${simulatedSoilLabel || "Saved Soil"
      } soil, ${simulatedIrrigationLabel || "Saved Irrigation"
      } water) are hypothetical and do not modify your permanent farm profile. Verify physical ground conditions and water table depth before field implementation.`;
  } else if (completeness === "farmer_provided") {
    bannerTitle = "📋 FARMER-PROVIDED PROFILE & REGIONAL BASELINE";
    disclosureNote =
      "This advisory report is evaluated against self-reported farm specifications (location, soil texture, irrigation source, land area) and historical Central Punjab agro-climatic observations (10-year NASA POWER daily records). Farm inputs are self-reported and have not been independently verified on-site.";
  } else if (completeness === "partially_configured") {
    bannerTitle = "⚠️ PARTIALLY CONFIGURED FARM PROFILE";
    disclosureNote = `NOTICE: This advisory report is evaluated with a partially configured farm profile (${providedCount}/4 core attributes supplied). The following unconfigured attributes are using Central Punjab regional demonstration defaults: ${unconfiguredFields.join(
      ", "
    )}. Complete your farm profile in Setup to tailor recommendations to your physical acreage.`;
  } else {
    bannerTitle = "ℹ️ REGIONAL DEMONSTRATION BASELINE (CENTRAL PUNJAB)";
    disclosureNote =
      "This advisory report was evaluated using regional default parameters for Central Punjab (loam soil, deep tubewell extraction) and 10-year NASA POWER daily observations. Complete your Farm Profile in Setup to tailor recommendations to your specific land and water constraints.";
  }

  // 4. Rotations & Comparison
  const rotations: ReportRotationItem[] = [];
  let waterDemandContrast = "";
  let turnaroundContrast = "";
  let feasibilityContrast = "";
  const keyTradeoffs: string[] = [];
  let farmerInvestigationChecklist: string[] = [];

  if (input.mode === "head_to_head") {
    if (!input.candidateA || !input.candidateB) {
      throw new Error(
        "Candidate comparison mode requires candidateA and candidateB"
      );
    }

    rotations.push(mapRotationToReportItem(input.candidateA, "candidate_a"));
    rotations.push(mapRotationToReportItem(input.candidateB, "candidate_b"));

    const comp = compareTwoRotations(input.candidateA, input.candidateB);
    waterDemandContrast = comp.waterComparison.summary;
    turnaroundContrast = comp.turnaroundComparison.summary;
    feasibilityContrast = comp.feasibilityComparison.summary;

    comp.tradeoffHighlights.reasonsToChooseA.forEach((r) =>
      keyTradeoffs.push(`[${input.candidateA!.rotationName}] ${r}`)
    );
    comp.tradeoffHighlights.reasonsToChooseB.forEach((r) =>
      keyTradeoffs.push(`[${input.candidateB!.rotationName}] ${r}`)
    );

    farmerInvestigationChecklist = comp.farmerInvestigationChecklist;
  } else {
    // Baseline mode
    if (!input.selectedCandidate) {
      throw new Error(
        "Baseline assessment mode requires a selectedCandidate"
      );
    }

    if (input.baselineRotation) {
      rotations.push(mapRotationToReportItem(input.baselineRotation, "baseline"));
    }
    rotations.push(
      mapRotationToReportItem(input.selectedCandidate, "candidate")
    );

    const baseWater = input.baselineRotation
      ? getRotationIrrigationWaterMm(input.baselineRotation.rotationId)
      : 2150;
    const candWater = getRotationIrrigationWaterMm(input.selectedCandidate.rotationId);
    const diffWater = baseWater - candWater;
    const pctSavings = Math.round((diffWater / baseWater) * 100);

    waterDemandContrast =
      diffWater > 0
        ? `${input.selectedCandidate.rotationName} requires ~${candWater} mm/yr, conserving ~${diffWater} mm/yr (-${pctSavings}%, ≈ ${(diffWater * 10).toLocaleString()} m³/ha/yr) of irrigation application compared to baseline Rice–Wheat (~${baseWater} mm/yr).`
        : `Requires ~${candWater} mm/yr irrigation demand.`;

    const minTurnaround = getRotationMinTurnaroundDays(input.selectedCandidate.rotationId);
    turnaroundContrast = `Provides a minimum ${minTurnaround}-day field turnaround buffer between crop phases.`;

    feasibilityContrast = input.selectedCandidate.feasibility.isFeasible
      ? "Satisfies all 4 Stage A physical criteria under active conditions."
      : `Physical constraints flagged: ${input.selectedCandidate.feasibility.rejectionReasons.join(
        "; "
      )}`;

    input.selectedCandidate.diversificationBenefits.forEach((b) =>
      keyTradeoffs.push(b)
    );

    farmerInvestigationChecklist = [
      "Confirm local mandi procurement mechanisms and prices for alternative crops before planting.",
      "Verify access to precision sowing and residue machinery (Happy Seeder, Super Seeder, or zero-till drill).",
      "Perform a topsoil ribbon test to verify soil texture and drainage rate across your acreage.",
      "Inspect tubewell motor depth and water table elevation ahead of pre-monsoon planting.",
    ];
  }

  const scientificDisclaimer =
    input.scientificDisclaimer ||
    "Rotation Compass provides decision support based on historical NASA environmental observations and published agronomic evidence (e.g. Punjab Agricultural University). It does NOT guarantee crop yields or eliminate local weather risks. Sowing dates, pest management, and cultivar choices must be aligned with local extension advisories.";

  return {
    reportId,
    generatedAt: now.toISOString(),
    formattedDate,
    mode: input.mode,
    farmContext: {
      locationName,
      coordinatesText: coordsText,
      landAreaText,
      savedSoilLabel,
      savedIrrigationLabel,
      isProfileConfirmed,
      completeness,
      completenessLabel,
      fieldProvenance,
      unconfiguredFields,
    },
    climateSummary,
    scenarioDisclosure: {
      isSimulated,
      isProfileConfirmed,
      simulatedSoilLabel,
      simulatedIrrigationLabel,
      disclosureNote,
      bannerTitle,
    },
    rotations,
    comparisonHighlights: {
      waterDemandContrast,
      turnaroundContrast,
      feasibilityContrast,
      keyTradeoffs,
    },
    farmerInvestigationChecklist,
    scientificDisclaimer,
  };
}

/**
 * Renders structured report data into a standalone, printable A4 HTML document.
 * Black-and-white print optimized with precise `@page` CSS and typographic contrast.
 */
export function renderAdvisoryReportHtml(
  report: FarmerAdvisoryReportData
): string {
  const isSimulation = report.scenarioDisclosure.isSimulated;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${report.reportId} — Sproutnik Farmer Advisory Report</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 15mm 15mm 15mm;
      @bottom-right {
        content: counter(page);
      }
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1e293b;
      background: #ffffff;
      font-size: 11pt;
      line-height: 1.45;
      padding: 0;
    }

    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .no-print {
        display: none !important;
      }
      .page-break {
        page-break-before: always;
        break-before: page;
      }
      .no-break {
        break-inside: avoid;
        page-break-inside: avoid;
      }
    }

    .report-header {
      border-bottom: 2pt solid #0f766e;
      padding-bottom: 10pt;
      margin-bottom: 12pt;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .brand-title {
      font-size: 18pt;
      font-weight: 800;
      color: #0f766e;
      letter-spacing: -0.5pt;
    }

    .brand-subtitle {
      font-size: 9pt;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5pt;
    }

    .meta-box {
      text-align: right;
      font-size: 8.5pt;
      color: #475569;
    }

    .meta-box strong {
      color: #0f172a;
    }

    .section-title {
      font-size: 11pt;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.4pt;
      border-bottom: 1pt solid #cbd5e1;
      padding-bottom: 3pt;
      margin-top: 12pt;
      margin-bottom: 6pt;
      page-break-after: avoid;
      break-after: avoid;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8pt;
    }

    .grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 6pt;
    }

    .card {
      border: 1pt solid #e2e8f0;
      border-radius: 4pt;
      padding: 6pt 8pt;
      background: #f8fafc;
    }

    .card-title {
      font-size: 8pt;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      margin-bottom: 2pt;
    }

    .card-value {
      font-size: 10.5pt;
      font-weight: 700;
      color: #0f172a;
    }

    .scenario-banner {
      border: 1.5pt solid ${isSimulation
      ? "#d97706"
      : report.farmContext?.completeness === "farmer_provided"
        ? "#0f766e"
        : report.farmContext?.completeness === "partially_configured"
          ? "#d97706"
          : "#0284c7"
    };
      background: ${isSimulation
      ? "#fffbeb"
      : report.farmContext?.completeness === "farmer_provided"
        ? "#f0fdf4"
        : report.farmContext?.completeness === "partially_configured"
          ? "#fffbeb"
          : "#f0f9ff"
    };
      border-radius: 4pt;
      padding: 8pt 10pt;
      margin: 10pt 0;
      font-size: 9.5pt;
    }

    .scenario-banner strong {
      color: ${isSimulation
      ? "#92400e"
      : report.farmContext?.completeness === "farmer_provided"
        ? "#166534"
        : report.farmContext?.completeness === "partially_configured"
          ? "#92400e"
          : "#0369a1"
    };
      display: block;
      margin-bottom: 2pt;
      font-size: 10pt;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 6pt 0 10pt 0;
      font-size: 9pt;
    }

    tr {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    th, td {
      border: 1pt solid #cbd5e1;
      padding: 5pt 7pt;
      text-align: left;
      vertical-align: top;
    }

    th {
      background: #f1f5f9;
      font-weight: 700;
      color: #334155;
      font-size: 8.5pt;
      text-transform: uppercase;
    }

    .badge {
      display: inline-block;
      padding: 1pt 5pt;
      border-radius: 3pt;
      font-size: 8pt;
      font-weight: 700;
      border: 1pt solid #94a3b8;
    }

    .badge-viable {
      background: #dcfce7;
      color: #166534;
      border-color: #86efac;
    }

    .badge-restricted {
      background: #fee2e2;
      color: #991b1b;
      border-color: #fca5a5;
    }

    .badge-favorable {
      background: #ecfdf5;
      color: #065f46;
      border-color: #a7f3d0;
    }

    .badge-caution {
      background: #fffbeb;
      color: #92400e;
      border-color: #fde68a;
    }

    .checklist-box {
      border: 1pt solid #cbd5e1;
      border-radius: 4pt;
      padding: 8pt 10pt;
      background: #fafaf9;
      margin-top: 8pt;
    }

    .checklist-item {
      font-size: 9pt;
      margin-bottom: 4pt;
      padding-left: 14pt;
      position: relative;
    }

    .checklist-item::before {
      content: "□";
      position: absolute;
      left: 0;
      top: 0;
      font-weight: bold;
      color: #0f766e;
    }

    .disclaimer-box {
      margin-top: 12pt;
      padding-top: 6pt;
      border-top: 1pt dashed #cbd5e1;
      font-size: 8pt;
      color: #64748b;
      line-height: 1.35;
    }

    .print-actions {
      position: fixed;
      bottom: 20px;
      right: 20px;
      display: flex;
      gap: 10px;
      z-index: 1000;
    }

    .btn {
      padding: 8px 16px;
      font-size: 14px;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      border: 1px solid #cbd5e1;
      background: #0f766e;
      color: #ffffff;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .btn-secondary {
      background: #ffffff;
      color: #334155;
    }
  </style>
</head>
<body>
  <!-- Print Controls (Hidden on Print) -->
  <div class="print-actions no-print">
    <button class="btn btn-secondary" onclick="window.close()">Close Preview</button>
    <button class="btn" onclick="window.print()">Print / Save PDF</button>
  </div>

  <!-- Header -->
  <div class="report-header">
    <div>
      <div class="brand-title">Rotation Compass • Sproutnik</div>
      <div class="brand-subtitle">Farmer Agro-Climatic Advisory Report</div>
    </div>
    <div class="meta-box">
      <div>Report ID: <strong>${report.reportId}</strong></div>
      <div>Date: <strong>${report.formattedDate}</strong></div>
      <div>Evaluation Mode: <strong>${report.mode === "head_to_head"
      ? "Candidate Comparison"
      : "Baseline Benchmark"
    }</strong></div>
    </div>
  </div>

  <!-- What-If Scenario / Baseline Disclosure -->
  <div class="scenario-banner">
    <strong>${report.scenarioDisclosure.bannerTitle}</strong>
    <div>${report.scenarioDisclosure.disclosureNote}</div>
  </div>

  <!-- Farm Context & Baseline Grid -->
  <div class="section-title">1. Farm & Agro-Climatic Profile</div>
  <div class="grid-3">
    <div class="card">
      <div class="card-title">Location & Holding</div>
      <div class="card-value" style="font-size: 9.5pt;">${report.farmContext.locationName
    }</div>
      <div style="font-size: 8pt; color: #64748b; margin-top: 2pt;">${report.farmContext.coordinatesText
    } • ${report.farmContext.landAreaText}</div>
      <div style="margin-top: 4pt;"><span class="badge ${report.farmContext?.fieldProvenance?.location === 'farmer_provided' ? 'badge-viable' : ''}">${report.farmContext?.fieldProvenance?.location === 'farmer_provided' ? 'Farmer-Provided' : 'Demonstration Default'}</span></div>
    </div>

    <div class="card">
      <div class="card-title">Soil Texture</div>
      <div class="card-value" style="font-size: 9.5pt;">${report.scenarioDisclosure.isSimulated &&
      report.scenarioDisclosure.simulatedSoilLabel
      ? `${report.scenarioDisclosure.simulatedSoilLabel} (Simulated)`
      : report.farmContext.savedSoilLabel
    }</div>
      <div style="font-size: 8pt; color: #64748b; margin-top: 2pt;">Saved: ${report.farmContext.savedSoilLabel
    }</div>
      <div style="margin-top: 4pt;"><span class="badge ${report.farmContext?.fieldProvenance?.soilTexture === 'farmer_provided' ? 'badge-viable' : ''}">${report.farmContext?.fieldProvenance?.soilTexture === 'farmer_provided' ? 'Farmer-Provided' : 'Regional Default (Loam)'}</span></div>
    </div>

    <div class="card">
      <div class="card-title">Irrigation Source</div>
      <div class="card-value" style="font-size: 9.5pt;">${report.scenarioDisclosure.isSimulated &&
      report.scenarioDisclosure.simulatedIrrigationLabel
      ? `${report.scenarioDisclosure.simulatedIrrigationLabel} (Simulated)`
      : report.farmContext.savedIrrigationLabel
    }</div>
      <div style="font-size: 8pt; color: #64748b; margin-top: 2pt;">Saved: ${report.farmContext.savedIrrigationLabel
    }</div>
      <div style="margin-top: 4pt;"><span class="badge ${report.farmContext?.fieldProvenance?.irrigationSource === 'farmer_provided' ? 'badge-viable' : ''}">${report.farmContext?.fieldProvenance?.irrigationSource === 'farmer_provided' ? 'Farmer-Provided' : 'Regional Default (Deep Tubewell)'}</span></div>
    </div>
  </div>
  ${report.farmContext?.completeness === "partially_configured" ? `
  <div style="margin-top: 6pt; padding: 6pt 8pt; background: #fffbeb; border: 1pt solid #fcd34d; border-radius: 4pt; font-size: 8.5pt; color: #92400e;">
    <strong>Profile Completeness Disclosure:</strong> Partially configured (${4 - (report.farmContext.unconfiguredFields?.length || 0)}/4 core attributes supplied). Unconfigured attributes using Central Punjab regional demonstration defaults: ${report.farmContext.unconfiguredFields?.join(", ")}.
  </div>` : ""}

  <div class="grid-3" style="margin-top: 6pt;">
    <div class="card">
      <div class="card-title">Mean Annual Rainfall</div>
      <div class="card-value">${report.climateSummary.meanAnnualRainfallMm
    } mm/yr</div>
      <div style="font-size: 8pt; color: #64748b;">${report.climateSummary.periodText
    }</div>
    </div>
    <div class="card">
      <div class="card-title">Monsoon Concentration</div>
      <div class="card-value">${report.climateSummary.monsoonMm !== null
      ? `${report.climateSummary.monsoonMm.toFixed(0)} mm`
      : "N/A"
    }</div>
      <div style="font-size: 8pt; color: #64748b;">June–September Kharif window</div>
    </div>
    <div class="card">
      <div class="card-title">Thermal Baseline</div>
      <div class="card-value">${report.climateSummary.meanTemperatureC.toFixed(
      1
    )}°C</div>
      <div style="font-size: 8pt; color: #64748b;">Daily mean 2m air temp</div>
    </div>
  </div>

  <!-- Evaluated Systems Table -->
  <div class="section-title">2. Evaluated Cropping Systems & Physical Feasibility</div>
  <table>
    <thead>
      <tr>
        <th style="width: 28%;">Cropping System</th>
        <th style="width: 26%;">Crop Sequence</th>
        <th style="width: 16%;">Annual Supplemental Irrigation Requirement</th>
        <th style="width: 14%;">Turnaround</th>
        <th style="width: 16%;">Physical Viability</th>
      </tr>
    </thead>
    <tbody>
      ${report.rotations
      .map(
        (r) => `
        <tr>
          <td>
            <strong>${r.name}</strong>
            <div style="font-size: 8pt; color: #64748b; text-transform: uppercase;">Role: ${r.role.replace("_", " ")
          }</div>
          </td>
          <td>${r.cropSequence.join(" → ")}</td>
          <td>
            <strong>~${r.waterDemandMm} mm/yr</strong>
            <div style="font-size: 8pt; color: #64748b;">${r.groundwaterPressureIndex.toUpperCase()} depletion tier</div>
          </td>
          <td>
            <strong>${r.minTurnaroundDays} Days</strong>
            <div style="font-size: 8pt; color: #64748b;">Minimum transition</div>
          </td>
          <td>
            <span class="badge ${r.isFeasible ? "badge-viable" : "badge-restricted"
          }">
              ${r.isFeasible ? "✓ Viable" : "⚠️ Restricted"}
            </span>
          </td>
        </tr>
      `
      )
      .join("")}
    </tbody>
  </table>
  <div style="font-size: 8pt; color: #64748b; margin-top: -6pt; margin-bottom: 8pt;">
    *Estimated annual supplemental irrigation applications based on Punjab Agricultural University (PAU) Package of Practices. Does not represent measured farm groundwater metering.
  </div>

  <!-- Rejection reasons or warnings -->
  ${report.rotations
      .filter((r) => !r.isFeasible || r.warnings.length > 0)
      .map(
        (r) => `
      <div class="no-break" style="font-size: 8.5pt; margin-bottom: 6pt; padding: 4pt 8pt; border-left: 3pt solid ${!r.isFeasible ? "#dc2626" : "#d97706"
          }; background: #f8fafc;">
        <strong>[${r.name}] ${!r.isFeasible ? "Physical Constraint:" : "Operational Warning:"
          }</strong>
        ${r.rejectionReasons.length > 0
            ? r.rejectionReasons.join(" ")
            : r.warnings.join(" ")
          }
      </div>
    `
      )
      .join("")}

  <!-- Comparative Agronomic Analysis -->
  <div class="section-title">3. Head-to-Head Agronomic Comparison & Trade-Offs</div>
  <div class="no-break">
    <div style="font-size: 9.5pt; margin-bottom: 6pt; color: #0f172a; line-height: 1.4;">
      <div>• <strong>Water Impact:</strong> ${report.comparisonHighlights.waterDemandContrast
    }</div>
      <div>• <strong>Field Turnaround:</strong> ${report.comparisonHighlights.turnaroundContrast
    }</div>
      <div>• <strong>Physical Feasibility:</strong> ${report.comparisonHighlights.feasibilityContrast
    }</div>
    </div>
  </div>

  <!-- Stage B Trade-Off Table -->
  <table class="no-break">
    <thead>
      <tr>
        <th style="width: 25%;">Dimension</th>
        ${report.rotations
      .map(
        (r) => `
          <th style="width: ${report.rotations.length === 2 ? "37.5%" : "25%"};">${r.name
          }</th>
        `
      )
      .join("")}
      </tr>
    </thead>
    <tbody>
      ${[
      "Climate & Thermal Risk",
      "Water Demand & Groundwater",
      "Agrobiodiversity & Pest Cycles",
      "Soil Health & Nutrient Cycling",
      "Turnaround & Residue Management",
    ]
      .map((dimName) => {
        return `
          <tr>
            <td><strong>${dimName}</strong></td>
            ${report.rotations
            .map((r) => {
              const tradeoff = r.tradeoffs.find(
                (t) => t.dimensionName === dimName
              );
              const score = tradeoff?.scoreLabel || "moderate";
              const badgeClass =
                score === "favorable"
                  ? "badge-favorable"
                  : score === "caution" || score === "unfavorable"
                    ? "badge-caution"
                    : "badge";

              return `
                <td>
                  <span class="badge ${badgeClass}" style="margin-bottom: 2pt;">${score.toUpperCase()}</span>
                  <div style="font-size: 8pt; color: #475569;">${tradeoff?.summary || "Standard evaluation"
                }</div>
                </td>
              `;
            })
            .join("")}
          </tr>
        `;
      })
      .join("")}
    </tbody>
  </table>

  <!-- 4. Agricultural Economic Intelligence & Financial Return Analysis -->
  <div class="no-break" style="margin-top: 10pt;">
    <div class="section-title">4. Agricultural Economic Intelligence & Financial Return Analysis</div>
    <div style="font-size: 8.5pt; color: #475569; margin-bottom: 6pt;">
      Grounded in Commission for Agricultural Costs and Prices (CACP) GoI Price Policy (2024–25) and Punjab Agricultural University (PAU) Cost of Cultivation Studies. All operational cultivation expenses reflect Cost A2 + Family Labour proxy per hectare. Non-operational land lease rent (Cost C2) is omitted to provide universal applicability across owner-cultivators and tenant farmers.
    </div>

    <!-- Feasibility Safeguard Notice (if any rotation is physically restricted) -->
    ${report.rotations.some((r) => !r.isFeasible) ? `
      <div style="margin-bottom: 8pt; padding: 6pt 8pt; background: #fffbeb; border: 1pt solid #fcd34d; border-radius: 4pt; font-size: 8.5pt; color: #92400e; line-height: 1.4;">
        <strong>⚠️ Agronomic Feasibility Safeguard:</strong> One or more evaluated systems are restricted by physical soil or irrigation criteria. Projected financial returns cannot be realized unless physical farm constraints are addressed. Economic metrics are presented for objective comparative assessment only.
      </div>
    ` : ""}

    <!-- Economic Summary Table -->
    <table>
      <thead>
        <tr>
          <th style="width: 28%;">Cropping System</th>
          <th style="width: 20%; text-align: right;">Net Return (₹/ha)</th>
          <th style="width: 20%; text-align: right;">Total Cultivation Cost</th>
          <th style="width: 14%; text-align: center;">BCR</th>
          <th style="width: 18%; text-align: right;">Baseline Delta</th>
        </tr>
      </thead>
      <tbody>
        ${report.rotations.map((r) => {
        if (!r.economics) {
          return `
              <tr>
                <td><strong>${r.name}</strong></td>
                <td colspan="4" style="color: #94a3b8; font-style: italic; text-align: center;">
                  Economic cost-return data unavailable
                </td>
              </tr>
            `;
        }

        const delta = r.economics.comparisonToBaseline;
        return `
            <tr>
              <td>
                <strong>${r.name}</strong>
                <div style="font-size: 8pt; color: #64748b; text-transform: uppercase;">
                  ${r.role.replace("_", " ")} ${!r.isFeasible ? "(Physically Restricted)" : ""}
                </div>
              </td>
              <td style="text-align: right; font-family: monospace; font-weight: bold; color: #0f766e;">
                ₹${r.economics.netReturnInrPerHa.toLocaleString()}/ha
              </td>
              <td style="text-align: right; font-family: monospace;">
                ₹${r.economics.totalCostInrPerHa.toLocaleString()}/ha
                <div style="font-size: 7.5pt; color: #64748b; font-family: sans-serif;">
                  Pumping: ₹${r.economics.irrigationEnergyCostInrPerHa.toLocaleString()}
                </div>
              </td>
              <td style="text-align: center; font-weight: bold;">
                ${r.economics.benefitCostRatio.toFixed(2)}
              </td>
              <td style="text-align: right; font-family: monospace; font-size: 8.5pt;">
                ${delta ? `
                  <span style="color: ${delta.netReturnDeltaInrPerHa >= 0 ? '#15803d' : '#b45309'}; font-weight: bold;">
                    ${delta.netReturnDeltaInrPerHa >= 0 ? '+' : ''}₹${delta.netReturnDeltaInrPerHa.toLocaleString()}
                    (${delta.netReturnDeltaPercent > 0 ? '+' : ''}${delta.netReturnDeltaPercent}%)
                  </span>
                ` : '<span style="color: #94a3b8;">Baseline Ref</span>'}
              </td>
            </tr>
          `;
      }).join("")}
      </tbody>
    </table>

    <!-- Itemized Cost Breakdown Table -->
    <div style="margin-top: 8pt;">
      <div style="font-size: 9pt; font-weight: bold; margin-bottom: 3pt; color: #0f172a;">
        Itemized Input Cost Breakdown (₹/ha)
      </div>
      <table>
        <thead>
          <tr>
            <th style="width: 25%;">Cost Component</th>
            ${report.rotations.map((r) => `
              <th style="text-align: right; width: ${report.rotations.length === 2 ? '37.5%' : '25%'};">
                ${r.name}
              </th>
            `).join("")}
          </tr>
        </thead>
        <tbody style="font-family: monospace; font-size: 8.5pt;">
          <tr>
            <td style="font-family: sans-serif;">Certified Seeds</td>
            ${report.rotations.map((r) => `<td style="text-align: right;">${r.economics ? '₹' + r.economics.costBreakdown.seedsInrPerHa.toLocaleString() : 'N/A'}</td>`).join("")}
          </tr>
          <tr>
            <td style="font-family: sans-serif;">Fertilizers &amp; Manures</td>
            ${report.rotations.map((r) => `<td style="text-align: right;">${r.economics ? '₹' + r.economics.costBreakdown.fertilizersInrPerHa.toLocaleString() : 'N/A'}</td>`).join("")}
          </tr>
          <tr>
            <td style="font-family: sans-serif;">Plant Protection / Crop Care</td>
            ${report.rotations.map((r) => `<td style="text-align: right;">${r.economics ? '₹' + r.economics.costBreakdown.plantProtectionInrPerHa.toLocaleString() : 'N/A'}</td>`).join("")}
          </tr>
          <tr>
            <td style="font-family: sans-serif;">Machinery &amp; Manual Labour</td>
            ${report.rotations.map((r) => `<td style="text-align: right;">${r.economics ? '₹' + r.economics.costBreakdown.machineryLabourInrPerHa.toLocaleString() : 'N/A'}</td>`).join("")}
          </tr>
          <tr style="background: #f0fdf4;">
            <td style="font-family: sans-serif; font-weight: bold; color: #0f766e;">Irrigation Energy (Pumping)</td>
            ${report.rotations.map((r) => `<td style="text-align: right; font-weight: bold; color: #0f766e;">${r.economics ? '₹' + r.economics.costBreakdown.irrigationEnergyInrPerHa.toLocaleString() : 'N/A'}</td>`).join("")}
          </tr>
          <tr>
            <td style="font-family: sans-serif;">Miscellaneous &amp; Mandi Transport</td>
            ${report.rotations.map((r) => `<td style="text-align: right;">${r.economics ? '₹' + r.economics.costBreakdown.miscellaneousInrPerHa.toLocaleString() : 'N/A'}</td>`).join("")}
          </tr>
          <tr style="background: #f8fafc; font-weight: bold;">
            <td style="font-family: sans-serif;">Total Cultivation Cost</td>
            ${report.rotations.map((r) => `<td style="text-align: right;">${r.economics ? '₹' + r.economics.totalCostInrPerHa.toLocaleString() : 'N/A'}</td>`).join("")}
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Sensitivity Scenarios Table -->
    <div style="margin-top: 8pt;">
      <div style="font-size: 9pt; font-weight: bold; margin-bottom: 3pt; color: #0f172a;">
        Deterministic Sensitivity Analysis (Net Return ₹/ha)
      </div>
      <table>
        <thead>
          <tr>
            <th style="width: 25%;">Cropping System</th>
            <th style="width: 25%; text-align: right;">Conservative (-10% Yield/Price, +10% Cost)</th>
            <th style="width: 25%; text-align: right;">Reference Baseline (Standard)</th>
            <th style="width: 25%; text-align: right;">Optimistic (+10% Yield, +5% Price, -5% Cost)</th>
          </tr>
        </thead>
        <tbody style="font-family: monospace; font-size: 8.5pt;">
          ${report.rotations.map((r) => {
        if (!r.economics) return "";
        return `
              <tr>
                <td style="font-family: sans-serif; font-weight: bold;">${r.name}</td>
                <td style="text-align: right; color: #92400e;">₹${r.economics.scenarios.conservative.netReturnInrPerHa.toLocaleString()}/ha</td>
                <td style="text-align: right; font-weight: bold; color: #0f766e;">₹${r.economics.scenarios.reference.netReturnInrPerHa.toLocaleString()}/ha</td>
                <td style="text-align: right; color: #15803d;">₹${r.economics.scenarios.optimistic.netReturnInrPerHa.toLocaleString()}/ha</td>
              </tr>
            `;
      }).join("")}
        </tbody>
      </table>
    </div>
  </div>

  <!-- Farmer Action Checklist -->
  <div class="no-break" style="margin-top: 10pt;">
    <div class="section-title">5. Practical On-Farm Verification Steps Before Planting</div>
    <div class="checklist-box">
      ${report.farmerInvestigationChecklist
      .map(
        (item) => `
        <div class="checklist-item">${item}</div>
      `
      )
      .join("")}
    </div>
  </div>

  <!-- Evidence & Disclaimers -->
  <div class="disclaimer-box no-break">
    <div style="margin-bottom: 4pt;">
      <strong>Scientific Attribution & Evidence:</strong>
      Punjab Agricultural University (PAU) Package of Practices; Central Ground Water Board (CGWB) Dynamic Ground Water Resources Assessment of Punjab; ICAR-IIFSR Crop Diversification Trials.
    </div>
    <div>
      <strong>Decision Support Notice:</strong> ${report.scientificDisclaimer
    }
    </div>
  </div>
</body>
</html>`;
}

/**
 * Triggers the browser's native print-to-PDF dialog on the generated advisory report.
 */
export function printAdvisoryReport(report: FarmerAdvisoryReportData): void {
  if (typeof window === "undefined") return;

  const html = renderAdvisoryReportHtml(report);
  const printWindow = window.open("", "_blank", "width=850,height=900");

  if (!printWindow) {
    // If popup is blocked, create an invisible iframe
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }
    setTimeout(() => document.body.removeChild(iframe), 60000);
    return;
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  // Allow styles to settle before invoking native print
  setTimeout(() => {
    printWindow.print();
  }, 250);
}

/**
 * Downloads the advisory report as an offline HTML file.
 */
export function downloadAdvisoryReportHtml(
  report: FarmerAdvisoryReportData
): void {
  if (typeof window === "undefined") return;

  const html = renderAdvisoryReportHtml(report);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${report.reportId}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

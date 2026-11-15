"use client";

import React, { useState, useMemo } from "react";
import {
  SproutIcon,
  AlertTriangleIcon,
  LayersIcon,
  InfoIcon,
  DropletIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  CalendarIcon,
  ArrowRightIcon,
} from "./icons";
import { RotationsApiResponseData } from "@/../app/api/rotations/route";
import {
  CANDIDATE_ROTATIONS,
  getRotationIrrigationWaterMm,
  getRotationMinTurnaroundDays,
} from "@/agronomy/rotations";
import { getCropDisplayName } from "@/utils/cropCatalogAdapter";
import { RecalculatedRotation } from "@/utils/scenarioRecalculator";
import { CandidateComparison } from "./CandidateComparison";
import {
  FarmerAdvisoryReportData,
  generateFarmerAdvisoryReport,
} from "@/reports/advisoryReportGenerator";
import { FarmerAdvisoryModal } from "./FarmerAdvisoryModal";
import { SoilTextureType, IrrigationSourceType } from "@/types";

export interface RotationOverviewProps {
  rotationsData?: RotationsApiResponseData | null;
  loading?: boolean;
  recalculatedRotations?: {
    baseline: RecalculatedRotation;
    alternatives: RecalculatedRotation[];
    isScenarioActive: boolean;
  };
  farmContext?: {
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
  scenarioContext?: {
    isScenarioActive: boolean;
    simulatedSoilTexture?: SoilTextureType | null;
    simulatedIrrigationSource?: IrrigationSourceType | null;
  };
}

type RotationResult = RotationsApiResponseData["alternatives"][number];
type Tradeoff = RotationResult["tradeoffs"][number];

const DIMENSION_LABELS: Record<Tradeoff["dimension"], string> = {
  climate_compatibility: "Climate & Thermal Compatibility",
  water_exposure: "Water Exposure & Aquifer Depletion",
  diversity: "Agrobiodiversity & Pest Cycles",
  soil_health: "Soil Health & Nutrient Cycling",
  turnaround_feasibility: "Turnaround & Residue Management",
};

function pressureBadge(value: string) {
  switch (value) {
    case "low":
      return {
        label: "Low Pressure",
        style: "bg-emerald-50 text-emerald-800 border-emerald-200",
      };
    case "moderate":
      return {
        label: "Moderate Pressure",
        style: "bg-sky-50 text-sky-800 border-sky-200",
      };
    case "high":
      return {
        label: "High Pressure",
        style: "bg-amber-50 text-amber-800 border-amber-200",
      };
    default:
      return {
        label: "Critical Pressure",
        style: "bg-rose-50 text-rose-800 border-rose-200",
      };
  }
}

function scoreStyle(value: string) {
  switch (value) {
    case "favorable":
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    case "caution":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "unfavorable":
      return "bg-rose-50 text-rose-800 border-rose-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export function RotationOverview({
  rotationsData,
  loading,
  recalculatedRotations,
  farmContext,
  scenarioContext,
}: RotationOverviewProps) {
  const [selectedAltId, setSelectedAltId] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [advisoryReport, setAdvisoryReport] = useState<FarmerAdvisoryReportData | null>(null);

  if (loading && !rotationsData) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs animate-pulse space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-forest-100" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-56 rounded bg-slate-200" />
            <div className="h-3 w-80 rounded bg-slate-100" />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-slate-100/80" />
          ))}
        </div>
      </div>
    );
  }

  if (!rotationsData) {
    return (
      <div
        id="crop-rotations"
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs"
      >
        <div className="flex items-center gap-3">
          <InfoIcon size={20} className="text-slate-400 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Crop rotation intelligence unavailable
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Climate and agronomic data could not be loaded. Please refresh the dashboard.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const effectiveBaseline = recalculatedRotations?.baseline || rotationsData.baseline;
  const effectiveAlternatives = recalculatedRotations?.alternatives || rotationsData.alternatives;
  const isScenarioActive = recalculatedRotations?.isScenarioActive ?? false;

  const [comparisonMode, setComparisonMode] = useState<"baseline" | "head_to_head">("baseline");
  const [candidateAId, setCandidateAId] = useState<string>("rotation_maize_wheat");
  const [candidateBId, setCandidateBId] = useState<string>("rotation_dsr_wheat");

  const allCandidates: RecalculatedRotation[] = useMemo(() => {
    const rawList = effectiveBaseline
      ? [effectiveBaseline, ...effectiveAlternatives]
      : effectiveAlternatives;

    return rawList.map((item) => {
      if ("changeStatus" in item && "isScenarioActive" in item) {
        return item as RecalculatedRotation;
      }
      return {
        ...item,
        isScenarioActive,
        changeStatus: "unchanged" as const,
      };
    });
  }, [effectiveBaseline, effectiveAlternatives, isScenarioActive]);

  const candidateA = useMemo(
    () => allCandidates.find((c) => c.rotationId === candidateAId) || allCandidates[0],
    [allCandidates, candidateAId]
  );
  const candidateB = useMemo(
    () => allCandidates.find((c) => c.rotationId === candidateBId) || allCandidates[1] || allCandidates[0],
    [allCandidates, candidateBId]
  );

  const selectedAlt =
    effectiveAlternatives.find((item) => item.rotationId === selectedAltId) ||
    effectiveAlternatives[0];

  const selectedDef = CANDIDATE_ROTATIONS.find(
    (r) => r.id === selectedAlt?.rotationId
  );
  const baselineDef = CANDIDATE_ROTATIONS.find(
    (r) => r.id === effectiveBaseline?.rotationId
  );

  const baselineWaterMm = baselineDef ? getRotationIrrigationWaterMm(baselineDef.id) : 2150;
  const altWaterMm = selectedDef ? getRotationIrrigationWaterMm(selectedDef.id) : 1000;
  const waterSavingsMm = Math.max(0, baselineWaterMm - altWaterMm);
  const waterSavingsPct = Math.round((waterSavingsMm / baselineWaterMm) * 100);

  const feasibility = selectedAlt?.feasibility;
  const passedChecks =
    feasibility?.criteria.filter((c) => c.passed).length ?? 0;
  const totalChecks = feasibility?.criteria.length ?? 0;

  const activeUnknowns = useMemo(() => {
    if (comparisonMode === "head_to_head" && candidateA && candidateB) {
      const set = new Set([...candidateA.unknowns, ...candidateB.unknowns]);
      return Array.from(set);
    }
    return selectedAlt?.unknowns || [];
  }, [comparisonMode, candidateA, candidateB, selectedAlt]);

  const activeEvidence = useMemo(() => {
    if (comparisonMode === "head_to_head" && candidateA && candidateB) {
      const map = new Map();
      [...candidateA.evidence, ...candidateB.evidence].forEach((e) => {
        if (!map.has(e.id)) map.set(e.id, e);
      });
      return Array.from(map.values());
    }
    return selectedAlt?.evidence || [];
  }, [comparisonMode, candidateA, candidateB, selectedAlt]);

  const handleOpenReport = () => {
    if (!rotationsData) return;
    try {
      const report = generateFarmerAdvisoryReport({
        mode: comparisonMode,
        farmContext: {
          locationName:
            farmContext?.locationName ||
            rotationsData?.location?.name ||
            "Ludhiana Demonstration Region, Punjab",
          coordinates: farmContext?.coordinates || {
            lat: rotationsData?.location?.latitude || 30.9,
            lon: rotationsData?.location?.longitude || 75.85,
          },
          landAreaHectares: farmContext?.landAreaHectares,
          savedSoilTexture: farmContext?.savedSoilTexture,
          savedIrrigationSource: farmContext?.savedIrrigationSource,
          isLocationProvided: farmContext?.isLocationProvided,
          isLandAreaProvided: farmContext?.isLandAreaProvided,
          isSoilProvided: farmContext?.isSoilProvided,
          isIrrigationProvided: farmContext?.isIrrigationProvided,
        },
        climateContext: {
          meanAnnualRainfallMm:
            rotationsData?.climateContext?.meanAnnualRainfallMm ?? 680,
          seasonalMonsoonMm:
            rotationsData?.climateContext?.seasonalRainfallMm?.monsoonMm,
          meanTemperatureC:
            rotationsData?.climateContext?.meanTemperatureC ?? 24.2,
          rainfallVariabilityCvPercent:
            rotationsData?.climateContext?.rainfallVariabilityCvPercent,
        },
        scenarioContext: {
          isScenarioActive,
          simulatedSoilTexture: scenarioContext?.simulatedSoilTexture,
          simulatedIrrigationSource: scenarioContext?.simulatedIrrigationSource,
        },
        baselineRotation: effectiveBaseline,
        selectedCandidate: selectedAlt,
        candidateA,
        candidateB,
        scientificDisclaimer: rotationsData?.scientificDisclaimer,
      });
      setAdvisoryReport(report);
      setIsReportModalOpen(true);
    } catch (err) {
      console.error("Failed to generate advisory report", err);
    }
  };

  return (
    <section
      id="crop-rotations"
      className="space-y-6 rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-xs scroll-mt-6"
    >
      {/* 1. Header with Farm Evaluation Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-start gap-3">
          <div className="rounded-xl border border-forest-100 bg-forest-50 p-2.5 text-forest-800 shrink-0 mt-0.5">
            <SproutIcon size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Crop Rotation Decision Engine
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-forest-100 text-forest-900 border border-forest-200">
                PAU Agronomic Evidence
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed max-w-2xl">
              Objective, climate-calibrated evaluation comparing Punjab&apos;s baseline Rice–Wheat monoculture against diversified, water-saving cropping patterns.
            </p>
          </div>
        </div>

        {/* Groundwater Pressure Indicator */}
        <div className="shrink-0 flex items-center gap-2">
          {effectiveBaseline && (
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${pressureBadge(
                effectiveBaseline.groundwaterPressureIndex
              ).style}`}
            >
              <DropletIcon size={14} />
              <span>Reference Water Stress: {effectiveBaseline.groundwaterPressureIndex.toUpperCase()}</span>
            </span>
          )}
        </div>
      </div>

      {/* View Mode Switcher: Baseline vs Head-to-Head */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold self-start flex-wrap">
          <button
            type="button"
            onClick={() => setComparisonMode("baseline")}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              comparisonMode === "baseline"
                ? "bg-white text-forest-900 shadow-2xs font-bold border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>🌾 Baseline Benchmark</span>
            <span className="text-[10px] text-slate-400 font-normal">
              (Rice–Wheat vs Candidate)
            </span>
          </button>
          <button
            type="button"
            onClick={() => setComparisonMode("head_to_head")}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              comparisonMode === "head_to_head"
                ? "bg-white text-forest-900 shadow-2xs font-bold border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>⚖️ Candidate vs. Candidate</span>
            <span className="text-[10px] text-slate-400 font-normal">
              (Direct Head-to-Head)
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {comparisonMode === "head_to_head" && (
            <span className="text-xs text-forest-800 font-medium bg-forest-50 px-2.5 py-1 rounded-lg border border-forest-200">
              Comparing 2 Selected Systems Head-to-Head
            </span>
          )}

          <button
            type="button"
            onClick={handleOpenReport}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-forest-300 bg-forest-50 text-xs font-semibold text-forest-900 hover:bg-forest-100 transition-colors shadow-2xs cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-forest-500"
            title="Generate and export printable Farmer Advisory Report (PDF)"
            aria-label="Export Farmer Advisory Report PDF"
          >
            <span>📄</span>
            <span>Export Advisory Report (PDF)</span>
          </button>
        </div>
      </div>

      {/* Mode-Dependent Main Content */}
      {comparisonMode === "head_to_head" ? (
        <CandidateComparison
          candidates={allCandidates}
          selectedIdA={candidateAId}
          selectedIdB={candidateBId}
          onSelectA={setCandidateAId}
          onSelectB={setCandidateBId}
          isScenarioActive={isScenarioActive}
        />
      ) : (
        <>
          {/* 2. Hero Side-by-Side Comparison: Baseline vs Selected Alternative */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Head-to-Head Agronomic Comparison
              </span>
              <span className="text-[11px] text-slate-400">
                Baseline vs. Selected Alternative
              </span>
            </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Card A: Reference Baseline */}
          {effectiveBaseline && (
            <div className="rounded-2xl border-2 border-slate-200/80 bg-slate-50/70 p-4 sm:p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 text-slate-700 uppercase tracking-wider">
                    Current Conventional Baseline
                  </span>
                  <span className="text-xs font-semibold text-rose-700 flex items-center gap-1">
                    <AlertTriangleIcon size={13} />
                    Critical Aquifer Deficit
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-900">
                  {effectiveBaseline.rotationName}
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  The prevailing two-crop cereal cycle in Central Punjab. Assured procurement and high caloric yield, but requires massive groundwater extraction.
                </p>
              </div>

              {/* Baseline Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/60">
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-0.5">
                  <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">
                    Irrigation Demand
                  </span>
                  <span className="font-bold text-slate-900 text-sm font-mono">
                    ~{baselineWaterMm} mm/yr
                  </span>
                  <span className="text-[10px] text-rose-600 block font-medium">
                    Supplemental irrigation load
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-0.5">
                  <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">
                    Turnaround Window
                  </span>
                  <span className="font-bold text-slate-900 text-sm font-mono">
                    15 Days (Tight)
                  </span>
                  <span className="text-[10px] text-amber-700 block font-medium">
                    Late Oct–Nov residue bottleneck
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-0.5">
                  <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">
                    Soil Organic Health
                  </span>
                  <span className="font-bold text-slate-800 text-xs">
                    Compaction Hardpan
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Continuous flooded puddling
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-0.5">
                  <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">
                    Projected Net Return
                  </span>
                  <span className="font-bold text-slate-900 text-sm font-mono">
                    {effectiveBaseline.economics
                      ? `₹${effectiveBaseline.economics.netReturnInrPerHa.toLocaleString()}/ha`
                      : "Unavailable"}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {effectiveBaseline.economics
                      ? `BCR: ${effectiveBaseline.economics.benefitCostRatio.toFixed(2)} · Cost: ₹${effectiveBaseline.economics.totalCultivationCostInrPerHa.toLocaleString()}`
                      : "Data not modeled"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Card B: Selected Alternative */}
          {selectedAlt && (
            <div className="rounded-2xl border-2 border-forest-600 bg-forest-50/40 p-4 sm:p-5 flex flex-col justify-between space-y-4 shadow-sm ring-1 ring-forest-500/20">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-forest-700 text-white uppercase tracking-wider">
                    Selected Resilient Alternative
                  </span>
                  <span
                    className={`text-xs font-semibold flex items-center gap-1 ${
                      feasibility?.isFeasible ? "text-emerald-700" : "text-amber-700"
                    }`}
                  >
                    {feasibility?.isFeasible ? (
                      <>
                        <ShieldCheckIcon size={14} />
                        Feasible on Your Farm
                      </>
                    ) : (
                      <>
                        <AlertTriangleIcon size={14} />
                        Specific Constraints Flagged
                      </>
                    )}
                  </span>
                </div>
                <h4 className="text-base font-bold text-forest-950">
                  {selectedAlt.rotationName}
                </h4>
                <p className="text-xs text-forest-900 mt-1 leading-relaxed">
                  {selectedDef?.description ||
                    "Evaluated candidate system designed to reduce water pressure, optimize turnaround, and diversify harvest timing."}
                </p>
              </div>

              {/* Alternative Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-forest-200/60">
                <div className="p-2.5 rounded-xl bg-white border border-forest-200 space-y-0.5">
                  <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">
                    Irrigation Demand
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-bold text-slate-900 text-sm font-mono">
                      ~{altWaterMm} mm/yr
                    </span>
                    {waterSavingsPct > 0 && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1 rounded">
                        -{waterSavingsPct}%
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-emerald-700 block font-semibold">
                    {waterSavingsMm > 0 ? `Conserves ~${waterSavingsMm} mm/yr irrigation` : "Comparable water demand"}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-forest-200 space-y-0.5">
                  <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">
                    Turnaround Windows
                  </span>
                  <span className="font-bold text-slate-900 text-sm font-mono">
                    {selectedDef ? `${selectedDef.turnaroundDays.join(" & ")} Days` : "Calculated"}
                  </span>
                  <span className="text-[10px] text-forest-800 block font-medium">
                    {selectedDef && Math.min(...selectedDef.turnaroundDays) >= 20
                      ? "Spacious mechanization gap"
                      : "Manageable field gap"}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-forest-200 space-y-0.5">
                  <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">
                    Feasibility Checks
                  </span>
                  <span className="font-bold text-slate-800 text-xs font-mono">
                    {passedChecks} / {totalChecks} Criteria Passed
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Stage A agronomic screening
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-forest-200 space-y-0.5">
                  <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">
                    Projected Net Return
                  </span>
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="font-bold text-forest-900 text-sm font-mono">
                      {selectedAlt.economics
                        ? `₹${selectedAlt.economics.netReturnInrPerHa.toLocaleString()}/ha`
                        : "Unavailable"}
                    </span>
                    {selectedAlt.economics?.comparisonToBaseline && (
                      <span
                        className={`text-[10px] font-bold px-1 rounded ${
                          selectedAlt.economics.comparisonToBaseline.netReturnDeltaInrPerHa >= 0
                            ? "text-emerald-700 bg-emerald-50"
                            : "text-amber-700 bg-amber-50"
                        }`}
                      >
                        {selectedAlt.economics.comparisonToBaseline.netReturnDeltaInrPerHa >= 0 ? "+" : ""}
                        ₹{selectedAlt.economics.comparisonToBaseline.netReturnDeltaInrPerHa.toLocaleString()} (
                        {selectedAlt.economics.comparisonToBaseline.netReturnDeltaPercent > 0 ? "+" : ""}
                        {selectedAlt.economics.comparisonToBaseline.netReturnDeltaPercent}%)
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    {selectedAlt.economics
                      ? `BCR: ${selectedAlt.economics.benefitCostRatio.toFixed(2)} · Cost: ₹${selectedAlt.economics.totalCultivationCostInrPerHa.toLocaleString()}`
                      : "Economic model pending"}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-forest-200 space-y-0.5">
                  <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">
                    Groundwater Stress
                  </span>
                  <span className="font-bold text-forest-900 text-xs capitalize">
                    {selectedAlt.groundwaterPressureIndex} Index
                  </span>
                  <span className="text-[10px] text-emerald-700 block font-medium">
                    Substantially lower tubewell draw
                  </span>
                </div>
              </div>

              {/* Feasibility Safeguard Alert (if alternative is physically unfeasible) */}
              {!feasibility?.isFeasible && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <AlertTriangleIcon size={15} className="text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold text-amber-950">Agronomic Feasibility Constraint:</strong>
                    <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                      This rotation cannot be recommended as a practical cropping choice under your current farm conditions. Projected financial returns cannot be realized without resolving physical soil/water constraints.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. Candidate Alternatives Selector Tabs / Cards */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Select an Alternative Cropping System to Evaluate
          </span>
          <span className="text-xs font-mono text-slate-400">
            {effectiveAlternatives.length} candidate rotations
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {effectiveAlternatives.map((alt) => {
            const isSelected = selectedAlt?.rotationId === alt.rotationId;
            const def = CANDIDATE_ROTATIONS.find((r) => r.id === alt.rotationId);
            const waterMm = getRotationIrrigationWaterMm(alt.rotationId);
            const savingsPct = Math.round(((baselineWaterMm - waterMm) / baselineWaterMm) * 100);
            const recalc = alt as RecalculatedRotation;

            return (
              <button
                key={alt.rotationId}
                type="button"
                onClick={() => setSelectedAltId(alt.rotationId)}
                aria-pressed={isSelected}
                className={`text-left p-3.5 rounded-xl border-2 transition-all flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? "border-forest-700 bg-forest-50/70 shadow-sm ring-1 ring-forest-600/30"
                    : "border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    {isScenarioActive && recalc.changeStatus === "became_feasible" ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-600 text-white shadow-2xs">
                        ✨ Viable in Scenario
                      </span>
                    ) : isScenarioActive && recalc.changeStatus === "became_infeasible" ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-rose-600 text-white shadow-2xs">
                        ⚠️ Infeasible in Scenario
                      </span>
                    ) : (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          alt.feasibility.isFeasible
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {alt.feasibility.isFeasible ? "Feasible" : "Constraint"}
                      </span>
                    )}
                    {savingsPct > 0 && (
                      <span className="text-[10px] font-bold text-emerald-700">
                        -{savingsPct}% water
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                    {alt.rotationName}
                  </h4>
                </div>

                {/* Crop Sequence Pills */}
                {def && (
                  <div className="flex items-center gap-1 flex-wrap text-[10px] text-slate-600 font-medium">
                    {def.crops.map((c, i) => (
                      <React.Fragment key={c.id}>
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {getCropDisplayName(c.id, "en")}
                        </span>
                        {i < def.crops.length - 1 && (
                          <span className="text-slate-400">→</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                )}

                {/* Economic Hero Metric & Comparison */}
                <div className="pt-2 border-t border-slate-100 space-y-1">
                  <div className="flex items-baseline justify-between gap-1 flex-wrap">
                    <span className="text-xs font-bold font-mono text-forest-900">
                      {alt.economics
                        ? `₹${alt.economics.netReturnInrPerHa.toLocaleString()}/ha`
                        : "Economic data unavailable"}
                    </span>
                    {alt.economics?.comparisonToBaseline && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                          alt.economics.comparisonToBaseline.netReturnDeltaInrPerHa >= 0
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}
                      >
                        {alt.economics.comparisonToBaseline.netReturnDeltaInrPerHa >= 0 ? "+" : ""}
                        ₹{alt.economics.comparisonToBaseline.netReturnDeltaInrPerHa.toLocaleString()} (
                        {alt.economics.comparisonToBaseline.netReturnDeltaPercent > 0 ? "+" : ""}
                        {alt.economics.comparisonToBaseline.netReturnDeltaPercent}%)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>
                      {alt.economics
                        ? `BCR: ${alt.economics.benefitCostRatio.toFixed(2)}`
                        : "BCR pending"}
                    </span>
                    <span>
                      {alt.economics
                        ? `Cost: ₹${alt.economics.totalCultivationCostInrPerHa.toLocaleString()}`
                        : ""}
                    </span>
                  </div>

                  {/* Feasibility Warning Badge on Card if Infeasible */}
                  {!alt.feasibility.isFeasible && (
                    <div className="pt-1">
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                        <AlertTriangleIcon size={10} />
                        Not Recommended (Constraint)
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500 capitalize">
                    {alt.waterDemandTotalCategory.replace("_", " ")} water
                  </span>
                  <span
                    className={`font-semibold ${
                      alt.groundwaterPressureIndex === "low"
                        ? "text-emerald-700"
                        : alt.groundwaterPressureIndex === "moderate"
                        ? "text-sky-700"
                        : "text-amber-700"
                    }`}
                  >
                    {alt.groundwaterPressureIndex} stress
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Crop Sequence & Sowing Timeline */}
      {selectedDef && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-2">
            <CalendarIcon size={16} className="text-forest-700" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Seasonal Sequence & Field Turnaround Calendar
            </h4>
          </div>

          <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 sm:p-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
              {selectedDef.crops.map((crop, idx) => {
                const turnaroundDays = selectedDef.turnaroundDays[idx];
                const seasonBadge: Record<string, string> = {
                  kharif: "bg-amber-100 text-amber-900 border-amber-300",
                  rabi: "bg-sky-100 text-sky-900 border-sky-300",
                  zaid: "bg-emerald-100 text-emerald-900 border-emerald-300",
                  summer: "bg-emerald-100 text-emerald-900 border-emerald-300",
                  year_round: "bg-purple-100 text-purple-900 border-purple-300",
                };
                const badgeClass = seasonBadge[crop.season] || "bg-slate-100 text-slate-800 border-slate-300";

                return (
                  <React.Fragment key={crop.id}>
                    {/* Crop Phase Box */}
                    <div className="flex-1 bg-white border border-slate-200 rounded-xl p-3 space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${badgeClass}`}
                        >
                          {crop.season}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500 font-medium">
                          {crop.durationDaysMin}–{crop.durationDaysMax} days
                        </span>
                      </div>
                      <div className="font-bold text-slate-900 text-xs sm:text-sm">
                        {crop.name}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center justify-between">
                        <span>Sow: {crop.sowingWindowStart}</span>
                        <span>Harvest: {crop.harvestWindowEnd}</span>
                      </div>
                    </div>

                    {/* Turnaround Transition Arrow */}
                    {idx < selectedDef.crops.length - 1 && (
                      <div className="flex md:flex-col items-center justify-center gap-1 text-[11px] px-2 py-1 bg-slate-100/80 rounded-lg text-slate-600 shrink-0 self-center">
                        <span className="hidden md:inline text-slate-400">➔</span>
                        <span className="font-mono font-bold text-forest-800">
                          {turnaroundDays}d
                        </span>
                        <span className="text-[9px] uppercase tracking-wider text-slate-400">
                          gap
                        </span>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 5. Stage A Feasibility Screening Engine */}
      {feasibility && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Stage A · Agronomic Feasibility Screening</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    feasibility.isFeasible
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-amber-50 text-amber-800 border-amber-200"
                  }`}
                >
                  {feasibility.isFeasible ? "System Physically Viable" : "Management Constraints Flagged"}
                </span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Physical rule-based verification evaluated against rotation calendar turnaround, soil compatibility, and irrigation capacity.
              </p>
            </div>

            <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
              {passedChecks} / {totalChecks} Criteria Satisfied
            </span>
          </div>

          {/* Scenario Opportunity or Constraint Alert */}
          {isScenarioActive && (selectedAlt as RecalculatedRotation)?.changeStatus === "became_feasible" && (
            <div className="rounded-xl border border-emerald-300 bg-emerald-50/90 p-3.5 text-xs text-emerald-900 flex items-start gap-2.5">
              <CheckCircleIcon size={18} className="text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-emerald-950 font-bold">Scenario Opportunity: Physically Viable under Simulated Conditions</strong>
                <span>This cropping sequence was restricted under your saved farm baseline, but all 4 physical Stage A criteria are now fully satisfied under your active What-If scenario.</span>
              </div>
            </div>
          )}

          {isScenarioActive && (selectedAlt as RecalculatedRotation)?.changeStatus === "became_infeasible" && (
            <div className="rounded-xl border border-rose-300 bg-rose-50/90 p-3.5 text-xs text-rose-900 flex items-start gap-2.5">
              <AlertTriangleIcon size={18} className="text-rose-700 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-rose-950 font-bold">Scenario Constraint: Infeasible under Simulated Conditions</strong>
                <span>This cropping sequence is viable under your saved farm baseline, but fails physical criteria under this simulated scenario due to soil or water constraints.</span>
              </div>
            </div>
          )}

          {/* Criteria Checklist Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {feasibility.criteria.map((criterion) => (
              <div
                key={criterion.code}
                className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/50"
              >
                {criterion.passed ? (
                  <CheckCircleIcon size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                ) : (
                  <AlertTriangleIcon size={18} className="mt-0.5 shrink-0 text-rose-600" />
                )}

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {criterion.name}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        criterion.passed ? "text-emerald-700" : "text-rose-700"
                      }`}
                    >
                      {criterion.passed ? "Passed" : "Not Passed"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {criterion.explanation}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Specific Rejection Reasons Alert */}
          {feasibility.rejectionReasons.length > 0 && (
            <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-4 space-y-1.5">
              <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                <AlertTriangleIcon size={14} className="text-rose-700" />
                Agronomic Rejection Reasons
              </span>
              <ul className="text-xs text-rose-800 space-y-1 pl-4 list-disc">
                {feasibility.rejectionReasons.map((reason, i) => (
                  <li key={i} className="leading-relaxed">
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Practical Management Considerations / Warnings */}
          {feasibility.warnings.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 space-y-1.5">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <InfoIcon size={14} className="text-amber-700" />
                Practical Farming & Residue Management Warnings
              </span>
              <ul className="text-xs text-amber-800 space-y-1 pl-4 list-disc">
                {feasibility.warnings.map((warning, i) => (
                  <li key={i} className="leading-relaxed">
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 5B. Agricultural Economic Intelligence & Financial Return Analysis */}
      {selectedAlt && (
        <div className="space-y-4 pt-2">
          <div>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span className="text-forest-700 font-bold">₹</span>
                Agricultural Economic Intelligence &amp; Cost-Return Analysis
              </h4>
              <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded-md">
                CACP 2024–25 &amp; PAU Studies
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Reflects operational cultivation costs (A2 + FL proxy) per hectare in Punjab. Excludes non-operational land lease rent (Cost C2).
            </p>
          </div>

          {selectedAlt.economics ? (
            <div className="space-y-4">
              {/* Feasibility Precondition Alert */}
              {!feasibility?.isFeasible && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                  <AlertTriangleIcon size={16} className="text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold text-amber-950">Agronomic Feasibility Precondition:</strong>
                    <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                      This rotation cannot be recommended as a practical cropping choice under your current farm conditions. Projected financial returns cannot be realized without resolving physical soil/water constraints.
                    </p>
                  </div>
                </div>
              )}

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-white border border-forest-200 shadow-2xs space-y-1">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500 block">
                    Net Operational Return
                  </span>
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="font-bold text-forest-900 text-base font-mono">
                      ₹{selectedAlt.economics.netReturnInrPerHa.toLocaleString()}/ha
                    </span>
                    {selectedAlt.economics.comparisonToBaseline && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                          selectedAlt.economics.comparisonToBaseline.netReturnDeltaInrPerHa >= 0
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}
                      >
                        {selectedAlt.economics.comparisonToBaseline.netReturnDeltaInrPerHa >= 0 ? "+" : ""}
                        ₹{selectedAlt.economics.comparisonToBaseline.netReturnDeltaInrPerHa.toLocaleString()} (
                        {selectedAlt.economics.comparisonToBaseline.netReturnDeltaPercent > 0 ? "+" : ""}
                        {selectedAlt.economics.comparisonToBaseline.netReturnDeltaPercent}%)
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    Annual return after operational costs
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500 block">
                    Total Cultivation Cost
                  </span>
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="font-bold text-slate-900 text-base font-mono">
                      ₹{selectedAlt.economics.totalCultivationCostInrPerHa.toLocaleString()}/ha
                    </span>
                    {selectedAlt.economics.comparisonToBaseline && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                          selectedAlt.economics.comparisonToBaseline.costDeltaInrPerHa <= 0
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}
                      >
                        {selectedAlt.economics.comparisonToBaseline.costDeltaInrPerHa <= 0 ? "Saves " : "+"}
                        ₹{Math.abs(selectedAlt.economics.comparisonToBaseline.costDeltaInrPerHa).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    Working capital required across seasons
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500 block">
                    Benefit-Cost Ratio (BCR)
                  </span>
                  <span className="font-bold text-slate-900 text-base font-mono">
                    {selectedAlt.economics.benefitCostRatio.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    ₹{selectedAlt.economics.benefitCostRatio.toFixed(2)} return per ₹1.00 invested
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500 block">
                    Irrigation Energy Cost
                  </span>
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="font-bold text-sky-900 text-base font-mono">
                      ₹{selectedAlt.economics.irrigationEnergyCostInrPerHa.toLocaleString()}/ha
                    </span>
                    {selectedAlt.economics.comparisonToBaseline && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1 rounded">
                        Saves ₹{selectedAlt.economics.comparisonToBaseline.waterEnergySavingsInrPerHa.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    Pumping power &amp; maintenance load
                  </span>
                </div>
              </div>

              {/* Crop-by-Crop Economics Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <div className="bg-slate-50 px-3.5 py-2.5 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Crop-by-Crop Yield, Price Benchmark &amp; Margin Breakdown
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    KMS / RMS 2024–25 Benchmarks
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100/60 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold">Crop</th>
                        <th className="py-2.5 px-3 font-semibold">Season</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Yield (q/ha)</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Selling Price</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Gross Revenue</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Cultivation Cost</th>
                        <th className="py-2.5 px-3 font-semibold text-right text-forest-900">Net Return</th>
                        <th className="py-2.5 px-3 font-semibold text-center">BCR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {selectedAlt.economics.cropEconomics.map((crop) => (
                        <tr key={crop.cropId} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 font-sans font-medium text-slate-900">
                            {crop.cropName}
                          </td>
                          <td className="py-2 px-3 font-sans capitalize text-slate-500">
                            {crop.season}
                          </td>
                          <td className="py-2 px-3 text-right">
                            {crop.yieldQuintalsPerHa}
                            <span className="text-[10px] text-slate-400 block font-sans">
                              ({crop.yieldRangeQuintalsPerHa.min}–{crop.yieldRangeQuintalsPerHa.max})
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right">
                            ₹{crop.sellingPriceInrPerQuintal.toLocaleString()}/q
                            <span
                              className={`text-[9px] px-1 rounded block font-sans font-semibold mt-0.5 ${
                                crop.priceType === "msp_benchmark"
                                  ? "text-emerald-700 bg-emerald-50"
                                  : "text-sky-700 bg-sky-50"
                              }`}
                            >
                              {crop.priceType === "msp_benchmark" ? "MSP Verified" : "Market Average"}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right">
                            ₹{crop.grossRevenueInrPerHa.toLocaleString()}
                            {(crop.byproductRevenueInrPerHa ?? 0) > 0 && (
                              <span className="text-[9px] text-emerald-700 block font-sans">
                                +₹{(crop.byproductRevenueInrPerHa ?? 0).toLocaleString()} byproduct
                              </span>
                            )}
                            {(crop.nitrogenCreditInrPerHa ?? 0) > 0 && (
                              <span className="text-[9px] text-emerald-700 block font-sans">
                                +₹{(crop.nitrogenCreditInrPerHa ?? 0).toLocaleString()} N-credit
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right">
                            ₹{crop.costOfCultivationInrPerHa.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-forest-900">
                            ₹{crop.netReturnInrPerHa.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-center font-bold">
                            {crop.benefitCostRatio.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Byproduct & Fertility Credit Footnote */}
              {(selectedAlt.economics.cropEconomics.some(
                (c) => (c.byproductRevenueInrPerHa ?? 0) > 0 || (c.nitrogenCreditInrPerHa ?? 0) > 0
              )) && (
                <div className="p-3 rounded-xl bg-forest-50/60 border border-forest-200 text-xs text-forest-950 space-y-1">
                  <span className="font-bold flex items-center gap-1.5 text-forest-900">
                    <CheckCircleIcon size={14} className="text-forest-700" />
                    Integrated Secondary Value &amp; Soil Fertility Credits:
                  </span>
                  <ul className="pl-4 list-disc space-y-0.5 text-[11px] text-forest-900">
                    {selectedAlt.economics.cropEconomics
                      .filter((c) => (c.byproductRevenueInrPerHa ?? 0) > 0)
                      .map((c) => (
                        <li key={c.cropId}>
                          <strong>{c.cropName}:</strong> Estimated byproduct revenue of ~₹{(c.byproductRevenueInrPerHa ?? 0).toLocaleString()}/ha (e.g. wheat straw / bhusa livestock commercial demand).
                        </li>
                      ))}
                    {selectedAlt.economics.cropEconomics
                      .filter((c) => (c.nitrogenCreditInrPerHa ?? 0) > 0)
                      .map((c) => (
                        <li key={c.cropId}>
                          <strong>{c.cropName}:</strong> Atmospheric biological nitrogen fixation credit of ~₹{(c.nitrogenCreditInrPerHa ?? 0).toLocaleString()}/ha (saving ~30–40 kg chemical N for the succeeding crop).
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {/* 3-Scenario Deterministic Sensitivity */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <div className="bg-slate-50 px-3.5 py-2.5 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Deterministic Sensitivity Scenarios
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Weather &amp; Mandi Volatility Stress-Testing
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 text-xs">
                  {/* Conservative */}
                  <div className="p-3.5 space-y-1.5 bg-amber-50/20">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-900">Conservative Scenario</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                        Stress Test
                      </span>
                    </div>
                    <div className="space-y-0.5 font-mono">
                      <div className="flex justify-between text-slate-600 text-[11px]">
                        <span>Gross Revenue:</span>
                        <span>₹{selectedAlt.economics.scenarios.conservative.grossRevenueInrPerHa.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 text-[11px]">
                        <span>Total Cost:</span>
                        <span>₹{selectedAlt.economics.scenarios.conservative.totalCostInrPerHa.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-bold text-amber-950 text-xs pt-1 border-t border-amber-200">
                        <span>Net Return:</span>
                        <span>₹{selectedAlt.economics.scenarios.conservative.netReturnInrPerHa.toLocaleString()}/ha</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed pt-1">
                      {selectedAlt.economics.scenarios.conservative.assumptions}
                    </p>
                  </div>

                  {/* Reference */}
                  <div className="p-3.5 space-y-1.5 bg-slate-50/40">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">Reference Baseline</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
                        PAU Benchmark
                      </span>
                    </div>
                    <div className="space-y-0.5 font-mono">
                      <div className="flex justify-between text-slate-600 text-[11px]">
                        <span>Gross Revenue:</span>
                        <span>₹{selectedAlt.economics.scenarios.reference.grossRevenueInrPerHa.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 text-[11px]">
                        <span>Total Cost:</span>
                        <span>₹{selectedAlt.economics.scenarios.reference.totalCostInrPerHa.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-bold text-forest-900 text-xs pt-1 border-t border-slate-200">
                        <span>Net Return:</span>
                        <span>₹{selectedAlt.economics.scenarios.reference.netReturnInrPerHa.toLocaleString()}/ha</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed pt-1">
                      {selectedAlt.economics.scenarios.reference.assumptions}
                    </p>
                  </div>

                  {/* Optimistic */}
                  <div className="p-3.5 space-y-1.5 bg-emerald-50/20">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-900">Optimistic Scenario</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                        Best Season
                      </span>
                    </div>
                    <div className="space-y-0.5 font-mono">
                      <div className="flex justify-between text-slate-600 text-[11px]">
                        <span>Gross Revenue:</span>
                        <span>₹{selectedAlt.economics.scenarios.optimistic.grossRevenueInrPerHa.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 text-[11px]">
                        <span>Total Cost:</span>
                        <span>₹{selectedAlt.economics.scenarios.optimistic.totalCostInrPerHa.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-bold text-emerald-950 text-xs pt-1 border-t border-emerald-200">
                        <span>Net Return:</span>
                        <span>₹{selectedAlt.economics.scenarios.optimistic.netReturnInrPerHa.toLocaleString()}/ha</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed pt-1">
                      {selectedAlt.economics.scenarios.optimistic.assumptions}
                    </p>
                  </div>
                </div>
              </div>

              {/* Economic Data Provenance & Farmer Limitations Notice */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-1 text-[11px] text-slate-600 leading-relaxed">
                <span className="font-semibold text-slate-800 block">
                  Data Provenance &amp; Cultivation Cost Methodology:
                </span>
                <p>
                  Grounded in official Commission for Agricultural Costs and Prices (CACP) Reports on Price Policy for Kharif &amp; Rabi Crops (2024–25) and Punjab Agricultural University (PAU) Cost of Cultivation Studies. All operational cultivation expenses represent Cost A2 + Family Labour proxy. Land rent / lease costs (Cost C2) are intentionally omitted to provide universal comparisons across owner-cultivators and tenant farmers. Individual farm realizations vary with local weather anomalies, pest pressures, and mandi marketing timing.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-600 leading-relaxed">
              Economic cost-return data is currently unavailable for this rotation. Agronomic feasibility and physical resource assessments are presented below.
            </div>
          )}
        </div>
      )}

      {/* 6. Stage B Five-Dimension Trade-Off Assessment */}
      {selectedAlt && (
        <div className="space-y-3 pt-2">
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Stage B · Five Dimensions of Agronomic Trade-Offs
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Transparent multidimensional evaluation. No opaque composite scoring—each dimension is independently assessed with advantages and risk trade-offs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {selectedAlt.tradeoffs.map((tradeoff) => (
              <div
                key={tradeoff.dimension}
                className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-slate-900">
                      {DIMENSION_LABELS[tradeoff.dimension]}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${scoreStyle(
                        tradeoff.scoreLabel
                      )}`}
                    >
                      {tradeoff.scoreLabel}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {tradeoff.summary}
                  </p>
                </div>

                {/* Pros and Considerations */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-[11px]">
                  {tradeoff.advantages.map((adv, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-emerald-800 leading-relaxed">
                      <span className="font-bold text-emerald-600 shrink-0">+</span>
                      <span>{adv}</span>
                    </div>
                  ))}
                  {tradeoff.disadvantages.map((dis, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-amber-800 leading-relaxed">
                      <span className="font-bold text-amber-600 shrink-0">!</span>
                      <span>{dis}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )}

  {/* 7. Information Gaps & Scientific Citations */}
  <div className="pt-2 border-t border-slate-100 space-y-3">
    {/* Information gaps */}
    {activeUnknowns.length > 0 && (
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-1.5">
        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <InfoIcon size={14} className="text-slate-500" />
          Information Gaps &amp; Assumptions Disclosed
        </span>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          The following crop parameters have incomplete local field records in the current database; regional extension advisory is recommended:
        </p>
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          {activeUnknowns.map((u, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] text-slate-600"
            >
              {u}
            </span>
          ))}
        </div>
      </div>
    )}

    {/* Scientific Evidence Sources */}
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-600">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-bold text-slate-700 flex items-center gap-1.5">
          <LayersIcon size={14} className="text-forest-700" />
          Agronomic Evidence Base:
        </span>
        {activeEvidence.map((ev) => (
          <span
            key={ev.id}
            className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px]"
          >
            {ev.source} {ev.year ? `(${ev.year})` : ""}
          </span>
        ))}
      </div>

      <span className="text-[10px] text-slate-400">
        Attributed to PAU &amp; CGWB research
      </span>
    </div>

    {/* Scientific Disclaimer */}
    <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-[10px] text-slate-500 leading-relaxed">
      <strong>Decision Support Notice:</strong> {rotationsData.scientificDisclaimer}
    </div>
  </div>

  {/* Farmer Advisory Report Modal (A4 Print / PDF Export) */}
  {advisoryReport && (
    <FarmerAdvisoryModal
      isOpen={isReportModalOpen}
      onClose={() => setIsReportModalOpen(false)}
      reportData={advisoryReport}
    />
  )}
</section>
  );
}

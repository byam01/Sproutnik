"use client";

import React, { useMemo, useState } from "react";
import { RecalculatedRotation } from "@/utils/scenarioRecalculator";
import { compareTwoRotations } from "@/engine/candidateComparison";
import { CANDIDATE_ROTATIONS } from "@/agronomy/rotations";
import { getCropDisplayName } from "@/utils/cropCatalogAdapter";
import {
  SproutIcon,
  DropletIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  CalendarIcon,
  LayersIcon,
  InfoIcon,
  ShieldCheckIcon,
} from "./icons";

interface CandidateComparisonProps {
  candidates: RecalculatedRotation[];
  selectedIdA: string;
  selectedIdB: string;
  onSelectA: (id: string) => void;
  onSelectB: (id: string) => void;
  isScenarioActive: boolean;
}

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

function scoreBadge(score: string) {
  switch (score) {
    case "favorable":
      return "bg-emerald-100 text-emerald-800 border-emerald-300";
    case "caution":
      return "bg-amber-100 text-amber-800 border-amber-300";
    case "unfavorable":
      return "bg-rose-100 text-rose-800 border-rose-300";
    default:
      return "bg-slate-100 text-slate-700 border-slate-300";
  }
}

export function CandidateComparison({
  candidates,
  selectedIdA,
  selectedIdB,
  onSelectA,
  onSelectB,
  isScenarioActive,
}: CandidateComparisonProps) {
  const candidateA = useMemo(() => {
    return (
      candidates.find((c) => c.rotationId === selectedIdA) || candidates[0]
    );
  }, [candidates, selectedIdA]);

  const candidateB = useMemo(() => {
    return (
      candidates.find((c) => c.rotationId === selectedIdB) ||
      candidates[1] ||
      candidates[0]
    );
  }, [candidates, selectedIdB]);

  const comparison = useMemo(() => {
    if (!candidateA || !candidateB) return null;
    return compareTwoRotations(candidateA, candidateB);
  }, [candidateA, candidateB]);

  const defA = useMemo(
    () => CANDIDATE_ROTATIONS.find((r) => r.id === candidateA?.rotationId),
    [candidateA]
  );
  const defB = useMemo(
    () => CANDIDATE_ROTATIONS.find((r) => r.id === candidateB?.rotationId),
    [candidateB]
  );

  const [activeScenario, setActiveScenario] = useState<
    "reference" | "conservative" | "optimistic"
  >("reference");

  const econA = candidateA?.economics;
  const econB = candidateB?.economics;
  const scenarioA = econA?.scenarios?.[activeScenario];
  const scenarioB = econB?.scenarios?.[activeScenario];

  const handleSwap = () => {
    onSelectA(candidateB.rotationId);
    onSelectB(candidateA.rotationId);
  };

  if (!comparison || !candidateA || !candidateB) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Direct Candidate-to-Candidate Rotation Comparison"
      className="space-y-6 pt-2"
    >
      {/* 1. Selector Bar */}
      <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="p-1 rounded-md bg-forest-600 text-white text-xs">âš–ï¸</span>
              Direct Candidate-to-Candidate Comparator
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select any two alternative cropping systems to evaluate physical feasibility, water savings, and trade-offs head-to-head.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSwap}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-2xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
            title="Swap candidate positions"
          >
            <span>â‡„ Swap Positions</span>
          </button>
        </div>

        {/* Dropdown Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Candidate A Selector */}
          <div className="space-y-1.5">
            <label
              htmlFor="candidate-a-select"
              className="text-xs font-bold uppercase tracking-wider text-forest-900 flex items-center gap-1.5"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-forest-700" />
              Candidate A:
            </label>
            <select
              id="candidate-a-select"
              value={candidateA.rotationId}
              onChange={(e) => onSelectA(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 shadow-2xs focus:ring-2 focus:ring-forest-600 focus:outline-none"
            >
              {candidates.map((c) => (
                <option key={c.rotationId} value={c.rotationId}>
                  {c.rotationName} {c.isBaseline ? "(Baseline)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Candidate B Selector */}
          <div className="space-y-1.5">
            <label
              htmlFor="candidate-b-select"
              className="text-xs font-bold uppercase tracking-wider text-sky-900 flex items-center gap-1.5"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-sky-700" />
              Candidate B:
            </label>
            <select
              id="candidate-b-select"
              value={candidateB.rotationId}
              onChange={(e) => onSelectB(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 shadow-2xs focus:ring-2 focus:ring-sky-600 focus:outline-none"
            >
              {candidates.map((c) => (
                <option key={c.rotationId} value={c.rotationId}>
                  {c.rotationName} {c.isBaseline ? "(Baseline)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Key Contrast Highlights Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        {/* Water Contrast Card */}
        <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
            <DropletIcon size={13} />
            Irrigation Water Footprint
          </span>
          <div className="font-bold text-slate-900 text-sm">
            {comparison.waterComparison.lowerDemandCandidate === "candidate_a" ? (
              <span className="text-emerald-700">
                {candidateA.rotationName} saves ~{Math.abs(comparison.waterComparison.differenceMm)} mm/ha (-{comparison.waterComparison.percentDifference}%)
              </span>
            ) : comparison.waterComparison.lowerDemandCandidate === "candidate_b" ? (
              <span className="text-sky-700">
                {candidateB.rotationName} saves ~{Math.abs(comparison.waterComparison.differenceMm)} mm/ha (-{comparison.waterComparison.percentDifference}%)
              </span>
            ) : (
              <span className="text-slate-700">Identical Water Demand</span>
            )}
          </div>
          <p className="text-[11px] text-slate-600 leading-snug">
            {comparison.waterComparison.summary}
          </p>
        </div>

        {/* Turnaround Contrast Card */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <CalendarIcon size={13} className="text-forest-700" />
            Field Turnaround Relief
          </span>
          <div className="font-bold text-slate-900 text-sm">
            {comparison.turnaroundComparison.moreFlexibleCandidate === "candidate_a" ? (
              <span className="text-forest-800">
                {candidateA.rotationName} (+{comparison.turnaroundComparison.differenceDays} days buffer)
              </span>
            ) : comparison.turnaroundComparison.moreFlexibleCandidate === "candidate_b" ? (
              <span className="text-sky-800">
                {candidateB.rotationName} (+{comparison.turnaroundComparison.differenceDays} days buffer)
              </span>
            ) : (
              <span className="text-slate-700">Equal Turnaround ({comparison.turnaroundComparison.minTurnaroundA} days)</span>
            )}
          </div>
          <p className="text-[11px] text-slate-600 leading-snug">
            {comparison.turnaroundComparison.summary}
          </p>
        </div>

        {/* Feasibility Contrast Card */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <ShieldCheckIcon size={13} className="text-slate-700" />
            Stage A Physical Feasibility
          </span>
          <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            {comparison.feasibilityComparison.feasibilityContrast === "both_feasible" ? (
              <span className="text-emerald-700 flex items-center gap-1">
                <CheckCircleIcon size={15} /> Both Systems Viable
              </span>
            ) : comparison.feasibilityComparison.feasibilityContrast === "both_infeasible" ? (
              <span className="text-rose-700 flex items-center gap-1">
                <AlertTriangleIcon size={15} /> Both Systems Restricted
              </span>
            ) : (
              <span className="text-amber-800 flex items-center gap-1">
                <AlertTriangleIcon size={15} /> One System Restricted
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-600 leading-snug">
            {comparison.feasibilityComparison.summary}
          </p>
        </div>
      </div>

      {/* 3. Side-by-Side Hero Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Card A */}
        <div className="rounded-2xl border-2 border-forest-200 bg-forest-50/30 p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-forest-700 text-white uppercase tracking-wider">
                Candidate A
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {isScenarioActive && candidateA.changeStatus === "became_feasible" ? (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-600 text-white shadow-2xs">
                    âœ¨ Viable in Scenario
                  </span>
                ) : isScenarioActive && candidateA.changeStatus === "became_infeasible" ? (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-600 text-white shadow-2xs">
                    âš ï¸ Infeasible in Scenario
                  </span>
                ) : (
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${candidateA.feasibility.isFeasible
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : "bg-amber-100 text-amber-800 border-amber-300"
                      }`}
                  >
                    {candidateA.feasibility.isFeasible ? "Physically Viable" : "Constraints Flagged"}
                  </span>
                )}
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${pressureBadge(candidateA.groundwaterPressureIndex).style
                    }`}
                >
                  {pressureBadge(candidateA.groundwaterPressureIndex).label}
                </span>
              </div>
            </div>

            <h4 className="text-base font-bold text-slate-900 leading-snug">
              {candidateA.rotationName}
            </h4>

            {/* Sequence */}
            {defA && (
              <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-700 font-medium pt-1">
                {defA.crops.map((c, i) => (
                  <React.Fragment key={c.id}>
                    <span className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-800 shadow-2xs">
                      {getCropDisplayName(c.id, "en")}
                    </span>
                    {i < defA.crops.length - 1 && (
                      <span className="text-slate-400 font-bold">â†’</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-forest-100">
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-0.5">
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">
                Irrigation Demand
              </span>
              <span className="font-bold text-slate-900 text-sm font-mono">
                ~{comparison.waterComparison.waterDemandMmA} mm/yr
              </span>
              <span className="text-[10px] text-slate-500 block capitalize">
                {candidateA.waterDemandTotalCategory.replace("_", " ")} demand
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-0.5">
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">
                Min. Turnaround
              </span>
              <span className="font-bold text-slate-900 text-sm font-mono">
                {comparison.turnaroundComparison.minTurnaroundA} Days
              </span>
              <span className="text-[10px] text-slate-500 block">
                {comparison.turnaroundComparison.minTurnaroundA >= 20 ? "Generous window" : "Tight transition"}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-0.5">
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">
                Projected Net Return
              </span>
              <span className="font-bold text-forest-900 text-sm font-mono">
                {econA ? `₹${econA.netReturnInrPerHa.toLocaleString()}/ha` : "Unavailable"}
              </span>
              <span className="text-[10px] text-slate-500 block">
                {econA ? `BCR: ${econA.benefitCostRatio.toFixed(2)}` : "Model pending"}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-0.5">
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">
                Working Capital Cost
              </span>
              <span className="font-bold text-slate-900 text-sm font-mono">
                {econA ? `₹${econA.totalCultivationCostInrPerHa.toLocaleString()}/ha` : "Unavailable"}
              </span>
              <span className="text-[10px] text-slate-500 block">
                {econA ? `Pumping: ₹${econA.irrigationEnergyCostInrPerHa.toLocaleString()}/ha` : "Model pending"}
              </span>
            </div>
          </div>

          {/* Rejection / Warning if any */}
          {candidateA.feasibility.rejectionReasons.length > 0 && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
              <strong className="block font-bold">Physical Constraint Flagged:</strong>
              <p className="text-[11px] leading-relaxed">
                {candidateA.feasibility.rejectionReasons[0]}
              </p>
            </div>
          )}
        </div>

        {/* Card B */}
        <div className="rounded-2xl border-2 border-sky-200 bg-sky-50/30 p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-700 text-white uppercase tracking-wider">
                Candidate B
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {isScenarioActive && candidateB.changeStatus === "became_feasible" ? (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-600 text-white shadow-2xs">
                    âœ¨ Viable in Scenario
                  </span>
                ) : isScenarioActive && candidateB.changeStatus === "became_infeasible" ? (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-600 text-white shadow-2xs">
                    âš ï¸ Infeasible in Scenario
                  </span>
                ) : (
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${candidateB.feasibility.isFeasible
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : "bg-amber-100 text-amber-800 border-amber-300"
                      }`}
                  >
                    {candidateB.feasibility.isFeasible ? "Physically Viable" : "Constraints Flagged"}
                  </span>
                )}
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${pressureBadge(candidateB.groundwaterPressureIndex).style
                    }`}
                >
                  {pressureBadge(candidateB.groundwaterPressureIndex).label}
                </span>
              </div>
            </div>

            <h4 className="text-base font-bold text-slate-900 leading-snug">
              {candidateB.rotationName}
            </h4>

            {/* Sequence */}
            {defB && (
              <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-700 font-medium pt-1">
                {defB.crops.map((c, i) => (
                  <React.Fragment key={c.id}>
                    <span className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-800 shadow-2xs">
                      {getCropDisplayName(c.id, "en")}
                    </span>
                    {i < defB.crops.length - 1 && (
                      <span className="text-slate-400 font-bold">â†’</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-sky-100">
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-0.5">
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">
                Irrigation Demand
              </span>
              <span className="font-bold text-slate-900 text-sm font-mono">
                ~{comparison.waterComparison.waterDemandMmB} mm/yr
              </span>
              <span className="text-[10px] text-slate-500 block capitalize">
                {candidateB.waterDemandTotalCategory.replace("_", " ")} demand
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-0.5">
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">
                Min. Turnaround
              </span>
              <span className="font-bold text-slate-900 text-sm font-mono">
                {comparison.turnaroundComparison.minTurnaroundB} Days
              </span>
              <span className="text-[10px] text-slate-500 block">
                {comparison.turnaroundComparison.minTurnaroundB >= 20 ? "Generous window" : "Tight transition"}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-0.5">
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">
                Projected Net Return
              </span>
              <span className="font-bold text-sky-900 text-sm font-mono">
                {econB ? `₹${econB.netReturnInrPerHa.toLocaleString()}/ha` : "Unavailable"}
              </span>
              <span className="text-[10px] text-slate-500 block">
                {econB ? `BCR: ${econB.benefitCostRatio.toFixed(2)}` : "Model pending"}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-0.5">
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">
                Working Capital Cost
              </span>
              <span className="font-bold text-slate-900 text-sm font-mono">
                {econB ? `₹${econB.totalCultivationCostInrPerHa.toLocaleString()}/ha` : "Unavailable"}
              </span>
              <span className="text-[10px] text-slate-500 block">
                {econB ? `Pumping: ₹${econB.irrigationEnergyCostInrPerHa.toLocaleString()}/ha` : "Model pending"}
              </span>
            </div>
          </div>

          {/* Rejection / Warning if any */}
          {candidateB.feasibility.rejectionReasons.length > 0 && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
              <strong className="block font-bold">Physical Constraint Flagged:</strong>
              <p className="text-[11px] leading-relaxed">
                {candidateB.feasibility.rejectionReasons[0]}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 3B. Economic Intelligence & Head-to-Head Financial Viability */}
      {comparison.economicComparison.hasEconomics && econA && econB && (
        <div className="space-y-4 pt-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span className="text-forest-700 font-bold">₹</span>
                Agricultural Economic Intelligence &amp; Cost-Return Comparison
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Grounded in CACP GoI Price Policy (2024–25) and PAU Farm Management Studies. Excludes non-operational land rent (Cost C2).
              </p>
            </div>

            {/* Scenario Selector */}
            <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 self-start sm:self-auto text-xs">
              <button
                type="button"
                onClick={() => setActiveScenario("conservative")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${activeScenario === "conservative"
                    ? "bg-amber-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                Conservative
              </button>
              <button
                type="button"
                onClick={() => setActiveScenario("reference")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${activeScenario === "reference"
                    ? "bg-forest-700 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                Reference (Default)
              </button>
              <button
                type="button"
                onClick={() => setActiveScenario("optimistic")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${activeScenario === "optimistic"
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                Optimistic
              </button>
            </div>
          </div>

          {/* Feasibility Safeguard Alert (if higher return candidate is physically infeasible) */}
          {comparison.economicComparison.feasibilityWarning && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
              <AlertTriangleIcon size={16} className="text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Agronomic Feasibility Precondition:</strong>
                <p className="mt-0.5 leading-relaxed text-amber-800">
                  {comparison.economicComparison.feasibilityWarning}
                </p>
              </div>
            </div>
          )}

          {/* Active Scenario Metrics Callout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border border-forest-200 bg-forest-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-forest-900">
                  {candidateA.rotationName} ({scenarioA?.label || "Reference"})
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-forest-100 text-forest-800 border border-forest-300">
                  BCR: {econA.benefitCostRatio.toFixed(2)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="p-2 rounded-lg bg-white border border-forest-100">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Gross Revenue</span>
                  <span className="text-xs font-bold font-mono text-slate-800">
                    ₹{(scenarioA?.grossRevenueInrPerHa ?? econA.grossRevenueInrPerHa).toLocaleString()}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-white border border-forest-100">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Total Cost</span>
                  <span className="text-xs font-bold font-mono text-slate-800">
                    ₹{(scenarioA?.totalCostInrPerHa ?? econA.totalCultivationCostInrPerHa).toLocaleString()}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-white border border-forest-100">
                  <span className="text-[9px] uppercase tracking-wider text-forest-600 block">Net Return</span>
                  <span className="text-xs font-bold font-mono text-forest-900">
                    ₹{(scenarioA?.netReturnInrPerHa ?? econA.netReturnInrPerHa).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-sky-200 bg-sky-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-900">
                  {candidateB.rotationName} ({scenarioB?.label || "Reference"})
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 border border-sky-300">
                  BCR: {econB.benefitCostRatio.toFixed(2)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="p-2 rounded-lg bg-white border border-sky-100">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Gross Revenue</span>
                  <span className="text-xs font-bold font-mono text-slate-800">
                    ₹{(scenarioB?.grossRevenueInrPerHa ?? econB.grossRevenueInrPerHa).toLocaleString()}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-white border border-sky-100">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Total Cost</span>
                  <span className="text-xs font-bold font-mono text-slate-800">
                    ₹{(scenarioB?.totalCostInrPerHa ?? econB.totalCultivationCostInrPerHa).toLocaleString()}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-white border border-sky-100">
                  <span className="text-[9px] uppercase tracking-wider text-sky-600 block">Net Return</span>
                  <span className="text-xs font-bold font-mono text-sky-900">
                    ₹{(scenarioB?.netReturnInrPerHa ?? econB.netReturnInrPerHa).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Scenario Assumptions Footnote */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
            <span className="font-semibold text-slate-800">Scenario Assumptions: </span>
            {activeScenario === "conservative" ? (
              <span>Sub-optimal weather or mild pest pressure (-10% yield), open mandi price discount (-10%), and higher input costs (+10%).</span>
            ) : activeScenario === "optimistic" ? (
              <span>Favorable weather and timely sowing (+10% yield), favorable quality price premium (+5%), and precision input efficiency (-5% cost).</span>
            ) : (
              <span>Normal seasonal weather, benchmark yields from PAU field trials, official MSP / historical average mandi prices, standard cultivation costs.</span>
            )}
          </div>

          {/* Itemized Cultivation Cost Comparison Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
            <div className="bg-slate-50 px-3.5 py-2 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Itemized Cultivation Cost &amp; Revenue Breakdown (₹/ha)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Punjab A2 + FL Operational Costs
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100/60 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3 font-semibold">Cost Component</th>
                    <th className="py-2 px-3 font-semibold text-right text-forest-900">{candidateA.rotationName}</th>
                    <th className="py-2 px-3 font-semibold text-right text-sky-900">{candidateB.rotationName}</th>
                    <th className="py-2 px-3 font-semibold text-right">Difference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  <tr>
                    <td className="py-2 px-3 font-sans text-slate-700">Certified Seeds</td>
                    <td className="py-2 px-3 text-right">₹{econA.combinedCostBreakdown.seedsInrPerHa.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right">₹{econB.combinedCostBreakdown.seedsInrPerHa.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right text-slate-500">
                      {econA.combinedCostBreakdown.seedsInrPerHa >= econB.combinedCostBreakdown.seedsInrPerHa ? "+" : "-"}
                      ₹{Math.abs(econA.combinedCostBreakdown.seedsInrPerHa - econB.combinedCostBreakdown.seedsInrPerHa).toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-sans text-slate-700">Fertilizers &amp; Manures</td>
                    <td className="py-2 px-3 text-right">₹{econA.combinedCostBreakdown.fertilizersInrPerHa.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right">₹{econB.combinedCostBreakdown.fertilizersInrPerHa.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right text-slate-500">
                      {econA.combinedCostBreakdown.fertilizersInrPerHa >= econB.combinedCostBreakdown.fertilizersInrPerHa ? "+" : "-"}
                      ₹{Math.abs(econA.combinedCostBreakdown.fertilizersInrPerHa - econB.combinedCostBreakdown.fertilizersInrPerHa).toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-sans text-slate-700">Plant Protection / Crop Care</td>
                    <td className="py-2 px-3 text-right">₹{econA.combinedCostBreakdown.plantProtectionInrPerHa.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right">₹{econB.combinedCostBreakdown.plantProtectionInrPerHa.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right text-slate-500">
                      {econA.combinedCostBreakdown.plantProtectionInrPerHa >= econB.combinedCostBreakdown.plantProtectionInrPerHa ? "+" : "-"}
                      ₹{Math.abs(econA.combinedCostBreakdown.plantProtectionInrPerHa - econB.combinedCostBreakdown.plantProtectionInrPerHa).toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-sans text-slate-700">Machinery &amp; Manual Labour</td>
                    <td className="py-2 px-3 text-right">₹{econA.combinedCostBreakdown.machineryLabourInrPerHa.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right">₹{econB.combinedCostBreakdown.machineryLabourInrPerHa.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right text-slate-500">
                      {econA.combinedCostBreakdown.machineryLabourInrPerHa >= econB.combinedCostBreakdown.machineryLabourInrPerHa ? "+" : "-"}
                      ₹{Math.abs(econA.combinedCostBreakdown.machineryLabourInrPerHa - econB.combinedCostBreakdown.machineryLabourInrPerHa).toLocaleString()}
                    </td>
                  </tr>
                  <tr className="bg-sky-50/30">
                    <td className="py-2 px-3 font-sans font-semibold text-sky-900">
                      Irrigation Energy (Pumping)
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-sky-900">₹{econA.combinedCostBreakdown.irrigationEnergyInrPerHa.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right font-bold text-sky-900">₹{econB.combinedCostBreakdown.irrigationEnergyInrPerHa.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-700">
                      {econA.combinedCostBreakdown.irrigationEnergyInrPerHa < econB.combinedCostBreakdown.irrigationEnergyInrPerHa ? (
                        <span>A saves ₹{(econB.combinedCostBreakdown.irrigationEnergyInrPerHa - econA.combinedCostBreakdown.irrigationEnergyInrPerHa).toLocaleString()}</span>
                      ) : econB.combinedCostBreakdown.irrigationEnergyInrPerHa < econA.combinedCostBreakdown.irrigationEnergyInrPerHa ? (
                        <span>B saves ₹{(econA.combinedCostBreakdown.irrigationEnergyInrPerHa - econB.combinedCostBreakdown.irrigationEnergyInrPerHa).toLocaleString()}</span>
                      ) : (
                        <span>Equal</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-sans text-slate-700">Miscellaneous &amp; Mandi Transport</td>
                    <td className="py-2 px-3 text-right">₹{econA.combinedCostBreakdown.miscellaneousInrPerHa.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right">₹{econB.combinedCostBreakdown.miscellaneousInrPerHa.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right text-slate-500">
                      {econA.combinedCostBreakdown.miscellaneousInrPerHa >= econB.combinedCostBreakdown.miscellaneousInrPerHa ? "+" : "-"}
                      ₹{Math.abs(econA.combinedCostBreakdown.miscellaneousInrPerHa - econB.combinedCostBreakdown.miscellaneousInrPerHa).toLocaleString()}
                    </td>
                  </tr>
                  <tr className="bg-slate-100 font-bold">
                    <td className="py-2 px-3 font-sans text-slate-900">Total Cultivation Cost</td>
                    <td className="py-2 px-3 text-right text-slate-900">₹{econA.totalCultivationCostInrPerHa.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right text-slate-900">₹{econB.totalCultivationCostInrPerHa.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right text-slate-700">
                      {econA.totalCultivationCostInrPerHa <= econB.totalCultivationCostInrPerHa ? (
                        <span className="text-emerald-700">A saves ₹{(econB.totalCultivationCostInrPerHa - econA.totalCultivationCostInrPerHa).toLocaleString()}</span>
                      ) : (
                        <span className="text-sky-700">B saves ₹{(econA.totalCultivationCostInrPerHa - econB.totalCultivationCostInrPerHa).toLocaleString()}</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-sans font-semibold text-slate-800">Gross Output Revenue</td>
                    <td className="py-2 px-3 text-right text-slate-800">₹{econA.grossRevenueInrPerHa.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right text-slate-800">₹{econB.grossRevenueInrPerHa.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right text-slate-500">
                      {econA.grossRevenueInrPerHa >= econB.grossRevenueInrPerHa ? "+" : "-"}
                      ₹{Math.abs(econA.grossRevenueInrPerHa - econB.grossRevenueInrPerHa).toLocaleString()}
                    </td>
                  </tr>
                  <tr className="bg-forest-50/60 font-bold text-forest-900">
                    <td className="py-2.5 px-3 font-sans">Net Operational Return</td>
                    <td className="py-2.5 px-3 text-right font-mono text-forest-900">₹{econA.netReturnInrPerHa.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-sky-900">₹{econB.netReturnInrPerHa.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-800">
                      {econA.netReturnInrPerHa > econB.netReturnInrPerHa ? (
                        <span>A delivers +₹{(econA.netReturnInrPerHa - econB.netReturnInrPerHa).toLocaleString()}</span>
                      ) : econB.netReturnInrPerHa > econA.netReturnInrPerHa ? (
                        <span>B delivers +₹{(econB.netReturnInrPerHa - econA.netReturnInrPerHa).toLocaleString()}</span>
                      ) : (
                        <span>Equal</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. Five-Dimension Stage B Head-to-Head Comparison Table */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <LayersIcon size={14} className="text-forest-700" />
            Five-Dimension Agronomic Trade-Off Comparison
          </h4>
          <span className="text-[10px] text-slate-400">
            PAU Field Evidence &amp; NASA POWER Thermal Baselines
          </span>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs divide-y divide-slate-100 text-xs">
          {comparison.dimensionComparisons.map((dim) => (
            <div
              key={dim.dimension}
              className="p-3 sm:p-4 hover:bg-slate-50/50 transition-colors space-y-2"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <span className="font-bold text-slate-900 text-sm">
                  {dim.name}
                </span>

                {/* Advantage Badge */}
                <div className="flex items-center gap-2">
                  {dim.advantage === "candidate_a" ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-forest-100 text-forest-800 border border-forest-200">
                      Advantage: {candidateA.rotationName}
                    </span>
                  ) : dim.advantage === "candidate_b" ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                      Advantage: {candidateB.rotationName}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                      Comparable Performance
                    </span>
                  )}
                </div>
              </div>

              {/* Side-by-Side Summaries */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-[11px]">
                <div className="p-2.5 rounded-lg bg-forest-50/30 border border-forest-100 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-forest-900">
                      {candidateA.rotationName}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider border ${scoreBadge(
                        dim.candidateAScore
                      )}`}
                    >
                      {dim.candidateAScore}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    {dim.summaryA}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-sky-50/30 border border-sky-100 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sky-900">
                      {candidateB.rotationName}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider border ${scoreBadge(
                        dim.candidateBScore
                      )}`}
                    >
                      {dim.candidateBScore}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    {dim.summaryB}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Why Choose Either Rotation? Practical Trade-Offs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {/* Left Column: Why Choose A */}
        <div className="p-4 rounded-xl border border-forest-200 bg-forest-50/40 space-y-3 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-forest-950 text-sm">
            <span className="text-forest-700">âœ“</span>
            Why Choose {candidateA.rotationName}?
          </div>
          <ul className="space-y-1.5 text-slate-700 text-[11px]">
            {comparison.tradeoffHighlights.reasonsToChooseA.map((reason, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-forest-600 font-bold shrink-0 mt-0.5">â€¢</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
          {comparison.tradeoffHighlights.risksA.length > 0 && (
            <div className="pt-2 border-t border-forest-100 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                Key Management Risks:
              </span>
              <ul className="space-y-1 text-slate-600 text-[11px]">
                {comparison.tradeoffHighlights.risksA.map((risk, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-600 shrink-0">!</span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Column: Why Choose B */}
        <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/40 space-y-3 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-sky-950 text-sm">
            <span className="text-sky-700">âœ“</span>
            Why Choose {candidateB.rotationName}?
          </div>
          <ul className="space-y-1.5 text-slate-700 text-[11px]">
            {comparison.tradeoffHighlights.reasonsToChooseB.map((reason, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-sky-600 font-bold shrink-0 mt-0.5">â€¢</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
          {comparison.tradeoffHighlights.risksB.length > 0 && (
            <div className="pt-2 border-t border-sky-100 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                Key Management Risks:
              </span>
              <ul className="space-y-1 text-slate-600 text-[11px]">
                {comparison.tradeoffHighlights.risksB.map((risk, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-600 shrink-0">!</span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* 6. Farmer Investigation Checklist Before Deciding */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 text-xs shadow-2xs">
        <div className="flex items-center gap-2">
          <InfoIcon size={16} className="text-forest-700" />
          <h4 className="font-bold text-slate-900">
            What to Investigate on Your Farm Before Choosing Between These Systems
          </h4>
        </div>
        <p className="text-[11px] text-slate-500">
          Scientific models evaluate regional climate and soil physics. We recommend verifying these practical ground factors:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {comparison.farmerInvestigationChecklist.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-700"
            >
              <span className="font-bold text-forest-700 shrink-0 mt-0.5">
                {idx + 1}.
              </span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

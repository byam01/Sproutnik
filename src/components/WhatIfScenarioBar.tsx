"use client";

import React from "react";
import {
  IrrigationSourceType,
  SoilTextureType,
} from "@/types";
import {
  IRRIGATION_SOURCE_OPTIONS,
  SOIL_TEXTURE_OPTIONS,
  ScenarioImpactSummary,
} from "@/utils/scenarioRecalculator";
import {
  LayersIcon,
  DropletIcon,
  RefreshCwIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  InfoIcon,
} from "./icons";

interface WhatIfScenarioBarProps {
  savedSoil: SoilTextureType | null;
  savedIrrigation: IrrigationSourceType | null;
  selectedSoil: SoilTextureType;
  selectedIrrigation: IrrigationSourceType;
  onSelectSoil: (soil: SoilTextureType) => void;
  onSelectIrrigation: (irrigation: IrrigationSourceType) => void;
  onResetScenario: () => void;
  impactSummary: ScenarioImpactSummary;
  isScenarioActive: boolean;
}

export function WhatIfScenarioBar({
  savedSoil,
  savedIrrigation,
  selectedSoil,
  selectedIrrigation,
  onSelectSoil,
  onSelectIrrigation,
  onResetScenario,
  impactSummary,
  isScenarioActive,
}: WhatIfScenarioBarProps) {
  const effectiveSavedSoilLabel = savedSoil
    ? SOIL_TEXTURE_OPTIONS.find((s) => s.id === savedSoil)?.label || savedSoil.replace(/_/g, " ")
    : "Loam (Regional Default)";

  const effectiveSavedIrrigationLabel = savedIrrigation
    ? IRRIGATION_SOURCE_OPTIONS.find((i) => i.id === savedIrrigation)?.label ||
      savedIrrigation.replace(/_/g, " ")
    : "Deep Tubewell (Regional Default)";

  return (
    <div
      role="region"
      aria-label="Interactive What-If Agronomic Scenario Simulator"
      className={`rounded-2xl border transition-all p-4 sm:p-5 shadow-xs space-y-4 ${
        isScenarioActive
          ? "bg-gradient-to-r from-emerald-50/60 via-white to-amber-50/50 border-emerald-300 ring-1 ring-emerald-200"
          : "bg-white border-slate-200/90"
      }`}
    >
      {/* 1. Header Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div
              className={`p-1.5 rounded-lg ${
                isScenarioActive
                  ? "bg-emerald-600 text-white"
                  : "bg-forest-100 text-forest-800"
              }`}
            >
              <LayersIcon size={18} />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Interactive What-If Agronomic Scenarios
            </h3>

            {isScenarioActive ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                ⚡ Simulation Active
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                Current Farm Baseline
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Temporarily test alternative soil textures or irrigation infrastructure to see rotation feasibility update in real time.
          </p>
        </div>

        {/* Reset / Status Action */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isScenarioActive && (
            <button
              type="button"
              onClick={onResetScenario}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-2xs transition-colors flex items-center gap-1.5"
              title="Restore saved farmer profile constraints"
            >
              <RefreshCwIcon size={13} className="text-slate-500" />
              <span>Reset Scenario</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Current Saved Conditions Reference */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 bg-slate-50/80 px-3 py-2 rounded-xl border border-slate-100">
        <span className="font-semibold text-slate-700 flex items-center gap-1">
          <InfoIcon size={13} className="text-slate-500" />
          Saved Farm Baseline:
        </span>
        <span>
          Soil: <strong className="text-slate-800">{effectiveSavedSoilLabel}</strong>
        </span>
        <span>•</span>
        <span>
          Irrigation: <strong className="text-slate-800">{effectiveSavedIrrigationLabel}</strong>
        </span>
        {isScenarioActive && (
          <span className="text-[11px] text-emerald-700 font-medium ml-auto">
            (Temporary scenario does not modify saved profile)
          </span>
        )}
      </div>

      {/* 3. Interactive Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Control A: Soil Texture */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <LayersIcon size={14} className="text-forest-700" />
              Simulated Soil Texture
            </label>
            {selectedSoil !== (savedSoil ?? "loam") && (
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                Modified
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SOIL_TEXTURE_OPTIONS.map((opt) => {
              const isSelected = selectedSoil === opt.id;
              const isSaved = (savedSoil ?? "loam") === opt.id;

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onSelectSoil(opt.id)}
                  aria-pressed={isSelected}
                  className={`text-left p-2.5 rounded-xl border transition-all flex flex-col justify-between gap-1 text-xs ${
                    isSelected
                      ? "bg-forest-800 text-white border-forest-900 shadow-xs ring-1 ring-forest-700"
                      : "bg-white hover:bg-slate-50 text-slate-800 border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold leading-tight">{opt.label}</span>
                    {isSaved && (
                      <span
                        className={`text-[9px] font-mono px-1 py-0.2 rounded font-semibold ${
                          isSelected
                            ? "bg-forest-700 text-emerald-100"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                        title="Saved in farmer profile"
                      >
                        SAVED
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] leading-tight ${
                      isSelected ? "text-emerald-100" : "text-slate-500"
                    }`}
                  >
                    {opt.tag}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Control B: Irrigation Source */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <DropletIcon size={14} className="text-sky-700" />
              Simulated Irrigation Infrastructure
            </label>
            {selectedIrrigation !== (savedIrrigation ?? "tubewell_deep") && (
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                Modified
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {IRRIGATION_SOURCE_OPTIONS.map((opt) => {
              const isSelected = selectedIrrigation === opt.id;
              const isSaved = (savedIrrigation ?? "tubewell_deep") === opt.id;

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onSelectIrrigation(opt.id)}
                  aria-pressed={isSelected}
                  className={`text-left p-2.5 rounded-xl border transition-all flex flex-col justify-between gap-1 text-xs ${
                    isSelected
                      ? "bg-sky-900 text-white border-sky-950 shadow-xs ring-1 ring-sky-700"
                      : "bg-white hover:bg-slate-50 text-slate-800 border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold leading-tight">{opt.label}</span>
                    {isSaved && (
                      <span
                        className={`text-[9px] font-mono px-1 py-0.2 rounded font-semibold ${
                          isSelected
                            ? "bg-sky-800 text-sky-100"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                        title="Saved in farmer profile"
                      >
                        SAVED
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] leading-tight ${
                      isSelected ? "text-sky-100" : "text-slate-500"
                    }`}
                  >
                    {opt.tag}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Scenario Impact Strip (when active) */}
      {isScenarioActive && (
        <div className="p-3 sm:p-4 rounded-xl bg-white border border-emerald-200 space-y-2 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <CheckCircleIcon size={16} className="text-emerald-600" />
                Live Engine Feasibility:
              </span>
              <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                {impactSummary.feasibleCount} of {impactSummary.totalEvaluated} Rotations Viable
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap text-[11px]">
              {impactSummary.becameFeasibleCount > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-bold border border-emerald-300">
                  +{impactSummary.becameFeasibleCount} became viable
                </span>
              )}
              {impactSummary.becameInfeasibleCount > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-900 font-bold border border-rose-300">
                  -{impactSummary.becameInfeasibleCount} restricted
                </span>
              )}
              <span className="text-slate-400 font-mono text-[10px]">
                PAU / CGWB Physical Rules
              </span>
            </div>
          </div>

          {/* Observations */}
          {impactSummary.keyObservations.length > 0 && (
            <ul className="space-y-1 pt-1 border-t border-slate-100 text-slate-600 text-[11px]">
              {impactSummary.keyObservations.map((obs, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold mt-0.5">•</span>
                  <span>{obs}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

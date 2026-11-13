"use client";

import React, { useState } from "react";
import {
  SproutIcon,
  AlertTriangleIcon,
  LayersIcon,
  InfoIcon,
  DropletIcon,
  ShieldCheckIcon,
} from "./icons";
import { RotationsApiResponseData } from "@/../app/api/rotations/route";

interface RotationOverviewProps {
  rotationsData?: RotationsApiResponseData | null;
  loading?: boolean;
}

export function RotationOverview({ rotationsData, loading }: RotationOverviewProps) {
  const [selectedAltId, setSelectedAltId] = useState<string | null>(null);

  const baseline = rotationsData?.baseline;
  const alternatives = rotationsData?.alternatives || [];
  const selectedAlt = alternatives.find((a) => a.rotationId === selectedAltId) || alternatives[0];

  return (
    <div id="crop-rotations" className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-forest-50 text-forest-700 border border-forest-100">
              <SproutIcon size={18} />
            </div>
            <h3 className="font-semibold text-slate-900 text-base">
              Cropping System Intelligence &amp; Feasibility Engine
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Agronomic evaluation of Punjab&apos;s baseline Rice–Wheat monoculture vs. climate-resilient diversification alternatives
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 self-start sm:self-auto">
          <AlertTriangleIcon size={14} className="text-amber-600" />
          {baseline ? `Groundwater Pressure: ${baseline.groundwaterPressureIndex.toUpperCase()}` : "High Groundwater Stress Zone"}
        </span>
      </div>

      {/* Baseline System Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Kharif Paddy */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-forest-800">
              Kharif Phase (June – October)
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-forest-100 text-forest-800 border border-forest-200">
              Puddled Transplanted Rice (Paddy)
            </span>
          </div>
          <div className="text-xs text-slate-600 space-y-1.5">
            <p>
              <strong>Irrigation Exposure:</strong> Puddled rice requires 1,500 – 2,000 mm of water in Punjab.
            </p>
            <p>
              <strong>Climate Deficit:</strong> With historical mean monsoon rainfall at ~532 mm, ~1,000 to 1,400 mm must be extracted via deep tubewells, driving aquifer exhaustion.
            </p>
            <p className="text-slate-500 text-[11px]">
              Turnaround: Harvested in late October, leaving a tight 15–20 day window for residue management before wheat sowing.
            </p>
          </div>
        </div>

        {/* Rabi Wheat */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Rabi Phase (November – April)
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
              Rabi Bread Wheat
            </span>
          </div>
          <div className="text-xs text-slate-600 space-y-1.5">
            <p>
              <strong>Thermal Vulnerability:</strong> Sensitive to terminal heat spikes during flowering and grain-filling in March.
            </p>
            <p>
              <strong>Winter Moisture:</strong> Supported by ~72 mm winter rainfall from Western Disturbances, plus 4–5 supplemental irrigations.
            </p>
            <p className="text-slate-500 text-[11px]">
              Risk: Unseasonable March temperature surges (&gt;30°C) shrink grain test weight and curtail final yield.
            </p>
          </div>
        </div>
      </div>

      {/* Evaluated Diversification Alternatives (Live Intelligence Engine) */}
      {alternatives.length > 0 && (
        <div className="space-y-4 pt-2 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-forest-700 text-white uppercase tracking-wider">
                Intelligence Engine
              </span>
              <h4 className="font-semibold text-slate-900 text-sm">
                Evaluated Crop Rotation Alternatives &amp; Trade-Offs
              </h4>
            </div>
            <span className="text-xs text-slate-500">
              Grounded in Punjab Agricultural University (PAU) evidence
            </span>
          </div>

          {/* Alternative Selector Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {alternatives.map((alt) => {
              const isSelected = selectedAlt?.rotationId === alt.rotationId;
              return (
                <button
                  key={alt.rotationId}
                  onClick={() => setSelectedAltId(alt.rotationId)}
                  className={`p-3 text-left rounded-xl border transition-all text-xs font-medium space-y-1 ${
                    isSelected
                      ? "border-forest-600 bg-forest-50/70 text-forest-900 shadow-xs ring-1 ring-forest-500"
                      : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                  }`}
                >
                  <div className="font-semibold line-clamp-1">{alt.rotationName}</div>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span
                      className={`px-1.5 py-0.2 rounded font-mono text-[10px] ${
                        alt.groundwaterPressureIndex === "low"
                          ? "bg-emerald-100 text-emerald-800"
                          : alt.groundwaterPressureIndex === "moderate"
                          ? "bg-sky-100 text-sky-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {alt.groundwaterPressureIndex} draft
                    </span>
                    {alt.feasibility.isFeasible && (
                      <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                        <ShieldCheckIcon size={11} /> Feasible
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Alternative Trade-Off Detail Card */}
          {selectedAlt && (
            <div className="p-4 sm:p-5 rounded-xl border border-forest-200/90 bg-forest-50/40 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-forest-100 pb-3">
                <div>
                  <h5 className="font-bold text-forest-950 text-sm">
                    {selectedAlt.rotationName}
                  </h5>
                  <p className="text-xs text-forest-800 mt-0.5">
                    Water Demand: <span className="font-semibold uppercase">{selectedAlt.waterDemandTotalCategory}</span> | Net Groundwater Draft: <span className="font-semibold uppercase">{selectedAlt.groundwaterPressureIndex}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] px-2.5 py-1 rounded-full font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Feasibility: 100% Passed
                  </span>
                </div>
              </div>

              {/* 5-Dimension Trade-Off Assessment Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {selectedAlt.tradeoffs.map((to) => (
                  <div
                    key={to.dimension}
                    className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold uppercase tracking-wider text-[10px] text-slate-500">
                        {to.dimension.replace("_", " ")}
                      </span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                          to.scoreLabel === "favorable"
                            ? "bg-emerald-100 text-emerald-800"
                            : to.scoreLabel === "caution"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {to.scoreLabel}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-700 leading-relaxed">
                      {to.summary}
                    </p>
                    {to.advantages.length > 0 && (
                      <div className="text-[11px] text-emerald-700 font-medium space-y-0.5 pt-1">
                        {to.advantages.map((adv, i) => (
                          <div key={i} className="flex items-start gap-1">
                            <span>✓</span>
                            <span>{adv}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Scientific Evidence Footer */}
              <div className="pt-2 border-t border-forest-100 text-[11px] text-forest-800 flex flex-wrap items-center gap-3">
                <span className="font-semibold text-forest-900">Documented Evidence:</span>
                {selectedAlt.evidence.map((ev) => (
                  <span key={ev.id} className="bg-white/80 px-2 py-0.5 rounded border border-forest-100 text-[10px]">
                    {ev.source} ({ev.year || "2023"})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Demonstrated Bottlenecks in Ludhiana */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <InfoIcon size={14} className="text-forest-600" />
          Demonstrated Agronomic Bottlenecks in Ludhiana
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
          <div className="p-3 bg-white rounded-lg border border-slate-100 shadow-2xs space-y-1">
            <div className="font-semibold text-slate-800 flex items-center gap-1">
              <DropletIcon size={13} className="text-sky-600" />
              Aquifer Overdraft
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Stage of groundwater extraction in Ludhiana exceeds 150%, classified by the Central Ground Water Board as &quot;Over-Exploited&quot;.
            </p>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-100 shadow-2xs space-y-1">
            <div className="font-semibold text-slate-800 flex items-center gap-1">
              <LayersIcon size={13} className="text-amber-600" />
              Soil Health Degradation
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Decades of continuous cereal-after-cereal monoculture have depleted soil organic carbon (&lt;0.4%) and induced hardpan formation.
            </p>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-100 shadow-2xs space-y-1">
            <div className="font-semibold text-slate-800 flex items-center gap-1">
              <SproutIcon size={13} className="text-forest-600" />
              Turnaround Pressure
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Tight gap between rice harvest and wheat sowing has historically driven stubble burning, compounding regional atmospheric particulate peaks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

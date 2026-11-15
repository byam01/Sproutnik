"use client";

import React from "react";
import { RotationsApiResponseData } from "@/../app/api/rotations/route";
import { ClimateIndicators, Location, RotationFarmerContext, SoilTextureType, IrrigationSourceType } from "@/types";
import { RecalculatedRotation } from "@/utils/scenarioRecalculator";
import { CANDIDATE_ROTATIONS, getRotationIrrigationWaterMm } from "@/agronomy/rotations";
import { RotationOverview } from "./RotationOverview";
import { WhatIfScenarioBar } from "./WhatIfScenarioBar";
import { ClimateMetricCard } from "./ClimateMetricCard";
import { RainfallChart } from "./RainfallChart";
import { TemperatureChart } from "./TemperatureChart";
import { SeasonalBreakdownCard } from "./SeasonalBreakdownCard";
import { DataSourceInfo } from "./DataSourceInfo";
import {
  SproutIcon,
  DropletIcon,
  CloudRainIcon,
  BarChartIcon,
  LayersIcon,
  ShieldCheckIcon,
  ActivityIcon,
  SunIcon,
  InfoIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  ThermometerIcon,
} from "./icons";

export type InsightTabId =
  | "rotations"
  | "water"
  | "climate"
  | "economics"
  | "soil"
  | "whatif"
  | "methodology";

interface DashboardInsightsTabsProps {
  activeTab: InsightTabId;
  onSelectTab: (tabId: InsightTabId) => void;
  rotationsData: RotationsApiResponseData | null;
  rotationsLoading: boolean;
  recalculatedRotations?: {
    baseline: RecalculatedRotation;
    alternatives: RecalculatedRotation[];
    isScenarioActive: boolean;
  };
  climateData: {
    location: Location;
    period: { startYear: number; endYear: number };
    meanAnnualRainfallMm: number;
    seasonalRainfallMm: ClimateIndicators["seasonalRainfallMm"];
    meanTemperatureC: number;
    meanMaxTemperatureC: number;
    monthlyMeanMaxTempC: Record<number, number>;
    monthlyMeanPrecipitationMm: Record<number, number>;
    annualRainfallByYear: Record<number, number>;
    rainfallVariabilityCvPercent: number;
    drySeasonDeficitFrequencyPercent: number;
    quality: any;
  } | null;
  meta: any;
  isMock: boolean;
  savedSoil: SoilTextureType | null;
  savedIrrigation: IrrigationSourceType | null;
  scenarioSoil: SoilTextureType | null;
  scenarioIrrigation: IrrigationSourceType | null;
  onSelectSoil: (s: SoilTextureType) => void;
  onSelectIrrigation: (i: IrrigationSourceType) => void;
  onResetScenario: () => void;
  isScenarioActive: boolean;
  scenarioResult: any;
  farmContext: any;
  scenarioContext: any;
  onOpenReport: () => void;
}

export function DashboardInsightsTabs({
  activeTab,
  onSelectTab,
  rotationsData,
  rotationsLoading,
  recalculatedRotations,
  climateData,
  meta,
  isMock,
  savedSoil,
  savedIrrigation,
  scenarioSoil,
  scenarioIrrigation,
  onSelectSoil,
  onSelectIrrigation,
  onResetScenario,
  isScenarioActive,
  scenarioResult,
  farmContext,
  scenarioContext,
  onOpenReport,
}: DashboardInsightsTabsProps) {
  const tabs: Array<{ id: InsightTabId; label: string; icon: string; count?: string }> = [
    { id: "rotations", label: "Rotation Comparison", icon: "🌾" },
    { id: "water", label: "Water & Aquifer", icon: "💧" },
    { id: "climate", label: "Climate & Weather", icon: "🌦️" },
    { id: "economics", label: "Economic Analysis", icon: "💰" },
    { id: "soil", label: "Soil & Biodiversity", icon: "🌱" },
    { id: "whatif", label: "What-If Simulator", icon: "⚡", count: isScenarioActive ? "Active" : undefined },
    { id: "methodology", label: "Evidence & Methodology", icon: "📚" },
  ];

  const effectiveBaseline = recalculatedRotations?.baseline ?? rotationsData?.baseline ?? null;
  const effectiveAlternatives = recalculatedRotations?.alternatives ?? rotationsData?.alternatives ?? [];
  const primaryCandidate = effectiveAlternatives.find((a: any) => a.feasibility?.isFeasible) ?? effectiveAlternatives[0] ?? null;

  return (
    <div className="space-y-6 pt-2">
      {/* Section Header & Tab Controls */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-stone-900 font-heading flex items-center gap-2">
              <LayersIcon size={20} className="text-forest-700" />
              <span>Deep Agricultural Insights &amp; Exploration</span>
            </h3>
            <p className="text-xs text-stone-500">
              Explore side-by-side rotation comparisons, groundwater data, climate trends, and CACP cultivation budgets
            </p>
          </div>

          {isScenarioActive && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-900 border border-purple-200 rounded-xl text-xs font-semibold self-start sm:self-auto">
              <span>⚡ Simulation Active</span>
              <button
                type="button"
                onClick={onResetScenario}
                className="underline text-purple-700 hover:text-purple-950 font-bold ml-1 cursor-pointer"
              >
                Reset to Baseline
              </button>
            </div>
          )}
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-forest-900 text-white shadow-xs font-bold"
                    : "bg-white text-stone-700 hover:bg-stone-100 border border-stone-200/90"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.count && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                      isActive ? "bg-purple-400 text-white" : "bg-purple-100 text-purple-900"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* =====================================================================
          TAB 1: CROP ROTATION COMPARISON (RotationOverview)
          ===================================================================== */}
      <div className={activeTab === "rotations" ? "block space-y-6" : "hidden"}>
        <section id="crop-rotations" className="scroll-mt-6">
          <RotationOverview
            rotationsData={rotationsData}
            loading={rotationsLoading}
            recalculatedRotations={recalculatedRotations}
            farmContext={farmContext}
            scenarioContext={scenarioContext}
          />
        </section>
      </div>

      {/* =====================================================================
          TAB 2: WATER & GROUNDWATER INSIGHTS
          ===================================================================== */}
      <div className={activeTab === "water" ? "block space-y-6" : "hidden"}>
        <div className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-stone-200 pb-4">
            <h4 className="text-base sm:text-lg font-bold text-stone-900 font-heading flex items-center gap-2">
              <DropletIcon size={20} className="text-sky-700" />
              <span>Groundwater Depletion &amp; Irrigation Requirement Analysis</span>
            </h4>
            <p className="text-xs text-stone-500 mt-0.5">
              Quantifying crop water demand (ETc) against 10-year historical monsoon rainfall and CGWB aquifer stress tiers
            </p>
          </div>

          {/* Water Comparison Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                Rice–Wheat Baseline Demand
              </span>
              <div className="text-2xl font-black text-rose-900 font-heading">
                ~2,150 <span className="text-xs font-normal text-stone-500">mm / yr</span>
              </div>
              <div className="text-xs text-rose-700 font-semibold">
                Critical Depletion Tier (&gt;150% CGWB Extraction)
              </div>
              <p className="text-[11px] text-stone-500 pt-1 border-t border-stone-200">
                Puddle flooding drives rapid water table decline of 0.5–1.0 meter/year across central Punjab.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                Recommended Diversified Demand
              </span>
              <div className="text-2xl font-black text-emerald-950 font-heading">
                ~1,500 <span className="text-xs font-normal text-stone-500">mm / yr</span>
              </div>
              <div className="text-xs text-emerald-700 font-semibold">
                Saves ~650 mm/yr (~30% reduction)
              </div>
              <p className="text-[11px] text-emerald-900 pt-1 border-t border-emerald-200">
                Substitutes flooded Kharif paddy with upland grain maize or precision DSR, dramatically slashing pumping hours.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 block">
                Annual Electricity &amp; Pumping Savings
              </span>
              <div className="text-2xl font-black text-sky-950 font-heading">
                ₹1,850 <span className="text-xs font-normal text-stone-500">/ ha saved</span>
              </div>
              <div className="text-xs text-sky-700 font-semibold">
                ~650–800 kWh electricity load avoided
              </div>
              <p className="text-[11px] text-sky-900 pt-1 border-t border-sky-200">
                Reduced motor burnout, transformer strain, and pump repair expenses over the dry pre-monsoon weeks.
              </p>
            </div>
          </div>

          {/* Water Budget Table */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
              Annual Supplemental Irrigation Demand by Cropping Sequence:
            </span>
            <div className="overflow-x-auto border border-stone-200 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-50 text-stone-700 border-b border-stone-200 text-[11px] font-bold">
                    <th className="p-3">Cropping System</th>
                    <th className="p-3 text-right">Water Demand (mm/yr)</th>
                    <th className="p-3 text-right">Delta vs Baseline</th>
                    <th className="p-3 text-right">Aquifer Stress Tier</th>
                    <th className="p-3 text-right">Feasibility</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {effectiveBaseline && (
                    <tr className="bg-stone-50/60">
                      <td className="p-3 font-bold text-stone-900">{effectiveBaseline.rotationName} (Baseline)</td>
                      <td className="p-3 text-right font-mono">~{getRotationIrrigationWaterMm(effectiveBaseline.rotationId)} mm</td>
                      <td className="p-3 text-right text-stone-400 font-mono">Baseline Reference</td>
                      <td className="p-3 text-right font-semibold text-rose-700 uppercase text-[10px]">Critical</td>
                      <td className="p-3 text-right">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900">Viable</span>
                      </td>
                    </tr>
                  )}
                  {effectiveAlternatives.map((alt: any) => {
                    const baseWater = effectiveBaseline ? getRotationIrrigationWaterMm(effectiveBaseline.rotationId) : 2150;
                    const altWater = getRotationIrrigationWaterMm(alt.rotationId);
                    const saved = baseWater - altWater;
                    const isFeasible = alt.feasibility?.isFeasible ?? true;
                    return (
                      <tr key={alt.rotationId} className="hover:bg-stone-50/40">
                        <td className="p-3 font-bold text-stone-800">{alt.rotationName}</td>
                        <td className="p-3 text-right font-mono">~{altWater} mm</td>
                        <td className="p-3 text-right font-mono text-emerald-700 font-semibold">
                          {saved > 0 ? `-${saved} mm (-${Math.round((saved / baseWater) * 100)}%)` : "0 mm"}
                        </td>
                        <td className="p-3 text-right font-semibold text-stone-600 uppercase text-[10px]">
                          {alt.groundwaterPressureIndex}
                        </td>
                        <td className="p-3 text-right">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isFeasible
                                ? "bg-emerald-100 text-emerald-900"
                                : "bg-rose-100 text-rose-900"
                            }`}
                          >
                            {isFeasible ? "✓ Viable" : "⚠️ Restricted"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          TAB 3: CLIMATE & WEATHER TRENDS
          ===================================================================== */}
      <div className={activeTab === "climate" ? "block space-y-6" : "hidden"}>
        <section id="climate-insights" className="space-y-6 scroll-mt-6">
          {climateData && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/80 pb-4">
                <div>
                  <h4 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight font-heading flex items-center gap-2">
                    <ActivityIcon size={20} className="text-forest-700" />
                    <span>NASA POWER Agro-Climatic Observations</span>
                  </h4>
                  <p className="text-xs text-stone-500 mt-0.5">
                    10-year daily solar radiation, temperature, and precipitation observations governing water balance and heat risk
                  </p>
                </div>
                <span className="self-start sm:self-auto text-xs font-mono text-stone-600 bg-stone-100 px-3 py-1 rounded-lg border border-stone-200">
                  {climateData.period.startYear} – {climateData.period.endYear} (10-Yr Baseline)
                </span>
              </div>

              {/* 4 Focused Agro-Climatic Metric Cards */}
              <div id="climate-card" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <ClimateMetricCard
                  title="Mean Annual Rainfall"
                  value={climateData.meanAnnualRainfallMm.toFixed(1)}
                  unit="mm/yr"
                  description="Average yearly precipitation across verified complete calendar years."
                  contextNote={`Dry deficit frequency: ${climateData.drySeasonDeficitFrequencyPercent.toFixed(0)}%`}
                  badge={{ label: "Water Baseline", variant: "success" }}
                  icon={<CloudRainIcon size={18} />}
                />
                <ClimateMetricCard
                  title="Monsoon Rainfall"
                  value={climateData.seasonalRainfallMm.monsoonMm.toFixed(1)}
                  unit="mm"
                  description={`Concentrates ${((climateData.seasonalRainfallMm.monsoonMm / climateData.meanAnnualRainfallMm) * 100).toFixed(1)}% of annual rain during June–Sept Kharif.`}
                  contextNote={`Winter rain: ${climateData.seasonalRainfallMm.winterMm.toFixed(1)} mm`}
                  badge={{ label: "Kharif Core", variant: "warning" }}
                  icon={<SunIcon size={18} />}
                />
                <ClimateMetricCard
                  title="Mean Air Temperature"
                  value={climateData.meanTemperatureC.toFixed(1)}
                  unit="°C"
                  description="Average daily 2-meter air temperature (T2M) over historical baseline."
                  contextNote={`Mean daily max: ${climateData.meanMaxTemperatureC.toFixed(1)}°C`}
                  badge={{ label: "Thermal Baseline", variant: "neutral" }}
                  icon={<ThermometerIcon size={18} />}
                />
                <ClimateMetricCard
                  title="Rainfall Variability"
                  value={climateData.rainfallVariabilityCvPercent.toFixed(1)}
                  unit="% CV"
                  description="Interannual coefficient of variation: StdDev / Mean * 100% across years."
                  contextNote="Indicates moderate year-to-year stability"
                  badge={{
                    label: climateData.rainfallVariabilityCvPercent < 15 ? "Moderate Risk" : "High Risk",
                    variant: "info",
                  }}
                  icon={<ActivityIcon size={18} />}
                />
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RainfallChart
                  annualRainfallByYear={climateData.annualRainfallByYear}
                  monthlyMeanPrecipitationMm={climateData.monthlyMeanPrecipitationMm}
                  meanAnnualRainfallMm={climateData.meanAnnualRainfallMm}
                />
                <TemperatureChart
                  monthlyMeanMaxTempC={climateData.monthlyMeanMaxTempC}
                  meanTemperatureC={climateData.meanTemperatureC}
                  meanMaxTemperatureC={climateData.meanMaxTemperatureC}
                />
              </div>

              <SeasonalBreakdownCard
                seasonalRainfallMm={climateData.seasonalRainfallMm}
                meanAnnualRainfallMm={climateData.meanAnnualRainfallMm}
              />
            </>
          )}
        </section>
      </div>

      {/* =====================================================================
          TAB 4: ECONOMIC ANALYSIS & COST OF CULTIVATION
          ===================================================================== */}
      <div className={activeTab === "economics" ? "block space-y-6" : "hidden"}>
        <div className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-stone-200 pb-4">
            <h4 className="text-base sm:text-lg font-bold text-stone-900 font-heading flex items-center gap-2">
              <BarChartIcon size={20} className="text-forest-800" />
              <span>CACP Cost of Cultivation &amp; Financial Return Analysis</span>
            </h4>
            <p className="text-xs text-stone-500 mt-0.5">
              Deterministic gross margins based on representative Punjab input-output budgets (Cost A2 + Family Labour proxy)
            </p>
          </div>

          {/* Cost Comparison Table */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
              Cultivation Cost Breakdown &amp; Net Returns (₹/ha):
            </span>
            <div className="overflow-x-auto border border-stone-200 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-50 text-stone-700 border-b border-stone-200 text-[11px] font-bold">
                    <th className="p-3">Cost Item</th>
                    {effectiveBaseline?.economics && (
                      <th className="p-3 text-right">{effectiveBaseline.rotationName} (Baseline)</th>
                    )}
                    {effectiveAlternatives.map((alt: any) => (
                      <th key={alt.rotationId} className="p-3 text-right">{alt.rotationName}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-mono text-[11px]">
                  <tr>
                    <td className="p-3 font-sans font-medium text-stone-800">Seed &amp; Nursery Cost</td>
                    {effectiveBaseline?.economics && (
                      <td className="p-3 text-right">₹{effectiveBaseline.economics.combinedCostBreakdown.seedsInrPerHa.toLocaleString()}</td>
                    )}
                    {effectiveAlternatives.map((alt: any) => (
                      <td key={alt.rotationId} className="p-3 text-right">₹{alt.economics ? alt.economics.combinedCostBreakdown.seedsInrPerHa.toLocaleString() : "N/A"}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-sans font-medium text-stone-800">Fertilizer &amp; Nutrients</td>
                    {effectiveBaseline?.economics && (
                      <td className="p-3 text-right">₹{effectiveBaseline.economics.combinedCostBreakdown.fertilizersInrPerHa.toLocaleString()}</td>
                    )}
                    {effectiveAlternatives.map((alt: any) => (
                      <td key={alt.rotationId} className="p-3 text-right">₹{alt.economics ? alt.economics.combinedCostBreakdown.fertilizersInrPerHa.toLocaleString() : "N/A"}</td>
                    ))}
                  </tr>
                  <tr className="bg-emerald-50/50">
                    <td className="p-3 font-sans font-medium text-emerald-900">Irrigation Pumping Energy</td>
                    {effectiveBaseline?.economics && (
                      <td className="p-3 text-right font-bold text-emerald-900">₹{effectiveBaseline.economics.combinedCostBreakdown.irrigationEnergyInrPerHa.toLocaleString()}</td>
                    )}
                    {effectiveAlternatives.map((alt: any) => (
                      <td key={alt.rotationId} className="p-3 text-right font-bold text-emerald-900">₹{alt.economics ? alt.economics.combinedCostBreakdown.irrigationEnergyInrPerHa.toLocaleString() : "N/A"}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-sans font-medium text-stone-800">Machinery &amp; Manual Labour</td>
                    {effectiveBaseline?.economics && (
                      <td className="p-3 text-right">₹{effectiveBaseline.economics.combinedCostBreakdown.machineryLabourInrPerHa.toLocaleString()}</td>
                    )}
                    {effectiveAlternatives.map((alt: any) => (
                      <td key={alt.rotationId} className="p-3 text-right">₹{alt.economics ? alt.economics.combinedCostBreakdown.machineryLabourInrPerHa.toLocaleString() : "N/A"}</td>
                    ))}
                  </tr>
                  <tr className="bg-stone-50 font-bold border-t border-stone-200">
                    <td className="p-3 font-sans text-stone-900">Total Cultivation Cost</td>
                    {effectiveBaseline?.economics && (
                      <td className="p-3 text-right">₹{effectiveBaseline.economics.totalCultivationCostInrPerHa.toLocaleString()}/ha</td>
                    )}
                    {effectiveAlternatives.map((alt: any) => (
                      <td key={alt.rotationId} className="p-3 text-right">₹{alt.economics ? alt.economics.totalCultivationCostInrPerHa.toLocaleString() : "N/A"}/ha</td>
                    ))}
                  </tr>
                  <tr className="bg-forest-50 font-black border-t-2 border-forest-600 text-xs">
                    <td className="p-3 font-sans text-forest-950">Net Return (Gross Margin)</td>
                    {effectiveBaseline?.economics && (
                      <td className="p-3 text-right text-stone-900">₹{effectiveBaseline.economics.netReturnInrPerHa.toLocaleString()}/ha</td>
                    )}
                    {effectiveAlternatives.map((alt: any) => (
                      <td key={alt.rotationId} className="p-3 text-right text-forest-900">₹{alt.economics ? alt.economics.netReturnInrPerHa.toLocaleString() : "N/A"}/ha</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          TAB 5: SOIL HEALTH & AGROBIODIVERSITY
          ===================================================================== */}
      <div className={activeTab === "soil" ? "block space-y-6" : "hidden"}>
        <div className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-stone-200 pb-4">
            <h4 className="text-base sm:text-lg font-bold text-stone-900 font-heading flex items-center gap-2">
              <SproutIcon size={20} className="text-forest-700" />
              <span>Soil Health, Residue &amp; Pest Break Benefits</span>
            </h4>
            <p className="text-xs text-stone-500 mt-0.5">
              Evaluating long-term soil structure, organic matter retention, and pest cycle interruption across cropping systems
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                Puddle Hardpan Prevention
              </h5>
              <p className="text-xs text-stone-600 leading-relaxed">
                Repeated puddling in conventional rice–wheat creates a dense, impermeable hardpan at 15–20 cm depth that impedes subsequent wheat root penetration. Direct seeding or maize breaks this compaction layer.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-950">
                Biological Nitrogen Fixation
              </h5>
              <p className="text-xs text-emerald-900 leading-relaxed">
                Incorporating summer moong (greengram) fixes 30–40 kg atmospheric N/ha into the soil, credited as ~₹1,400/ha reduced synthetic urea requirements for the succeeding Kharif crop.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-sky-950">
                Weed Cycle Interruption
              </h5>
              <p className="text-xs text-sky-900 leading-relaxed">
                Monoculture cereal sequences foster severe herbicide-resistant weeds like <em>Phalaris minor</em> (Gulli danda). Crop rotation with broadleaf pulses or maize dramatically disrupts weed seedbanks.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          TAB 6: WHAT-IF SCENARIO SIMULATOR
          ===================================================================== */}
      <div className={activeTab === "whatif" ? "block space-y-6" : "hidden"}>
        <div id="what-if-simulator" className="space-y-4">
          <div className="p-4 bg-purple-50/80 border border-purple-200 rounded-2xl text-xs text-purple-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <strong className="block font-bold">Interactive What-If Scenario Sandbox:</strong>
              <span>Test changing your soil texture or irrigation source in real-time. This adjusts physical feasibility and pumping load without altering your saved profile.</span>
            </div>
            {isScenarioActive && (
              <button
                type="button"
                onClick={onResetScenario}
                className="px-3.5 py-1.5 bg-purple-900 text-white font-semibold rounded-xl text-xs shrink-0 cursor-pointer"
              >
                Reset Scenario
              </button>
            )}
          </div>

          <WhatIfScenarioBar
            savedSoil={savedSoil}
            savedIrrigation={savedIrrigation}
            selectedSoil={scenarioSoil ?? savedSoil ?? "loam"}
            selectedIrrigation={scenarioIrrigation ?? savedIrrigation ?? "tubewell_deep"}
            onSelectSoil={onSelectSoil}
            onSelectIrrigation={onSelectIrrigation}
            onResetScenario={onResetScenario}
            impactSummary={
              scenarioResult?.impactSummary ?? {
                isScenarioActive,
                totalEvaluated: 5,
                feasibleCount: 5,
                infeasibleCount: 0,
                becameFeasibleCount: 0,
                becameInfeasibleCount: 0,
                keyObservations: [],
              }
            }
            isScenarioActive={isScenarioActive}
          />
        </div>
      </div>

      {/* =====================================================================
          TAB 7: EVIDENCE, SOURCES & DATA STORAGE POLICY
          ===================================================================== */}
      <div className={activeTab === "methodology" ? "block space-y-6" : "hidden"}>
        <section id="data-sources" className="space-y-6 scroll-mt-6">
          {climateData && (
            <DataSourceInfo
              location={climateData.location}
              period={climateData.period}
              quality={climateData.quality}
              meta={meta}
              isMock={isMock}
            />
          )}

          {/* Explicit Data Storage & Privacy Policy (Priority 4) */}
          <div className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
            <h4 className="text-base font-bold text-stone-900 font-heading flex items-center gap-2">
              <ShieldCheckIcon size={20} className="text-forest-700" />
              <span>Data Storage Policy, Client Persistence &amp; Multi-User Architecture</span>
            </h4>
            <div className="space-y-3 text-xs text-stone-600 leading-relaxed">
              <p>
                <strong>Browser-Based Advisory MVP:</strong> Sproutnik operates on a privacy-first, client-side storage model. Your farm profile specifications (district, acreage, soil texture, irrigation water source) are stored exclusively in your browser&apos;s <code>localStorage</code> cache.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-stone-700">
                <li><strong>No Device-to-Device Sync:</strong> Your saved profile remains on this specific device and browser. Opening Sproutnik on another device will start a fresh session.</li>
                <li><strong>Browser Clearing:</strong> Clearing your browser history or website cache will reset your saved farm profile to demonstration mode.</li>
                <li><strong>Ephemeral Server Caching:</strong> Backend profile records are held in an in-memory repository for session synchronization; when server instances restart, the frontend automatically re-synchronizes your profile envelope without data loss.</li>
                <li><strong>Multi-User Isolation:</strong> Every profile is stamped with a unique, server-issued UUID. Demonstration mode never modifies or overwrites personal farmer profiles, and resetting a profile completely deletes its stored envelope.</li>
                <li><strong>Report Downloads:</strong> Exported advisory documents (HTML and PDF) are generated and saved directly to your local device download folder.</li>
              </ul>
              <div className="pt-2 border-t border-stone-100 text-[11px] text-stone-400">
                Future production roadmap: Persistent relational storage with PostgreSQL, authenticated farmer accounts, server-side authorization, and encrypted cloud backups.
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { useClimateData } from "@/hooks/useClimateData";
import { Sidebar } from "./Sidebar";
import { DashboardHeader } from "./DashboardHeader";
import { ClimateMetricCard } from "./ClimateMetricCard";
import { RainfallChart } from "./RainfallChart";
import { TemperatureChart } from "./TemperatureChart";
import { SeasonalBreakdownCard } from "./SeasonalBreakdownCard";
import { RotationOverview } from "./RotationOverview";
import { DataSourceInfo } from "./DataSourceInfo";
import { DashboardLoading } from "./DashboardLoading";
import { DashboardError } from "./DashboardError";
import {
  CloudRainIcon,
  ActivityIcon,
  ThermometerIcon,
  SunIcon,
  ShieldCheckIcon,
} from "./icons";

export function DashboardView() {
  const {
    data,
    meta,
    loading,
    error,
    isMock,
    setIsMock,
    refetch,
    coordinates,
  } = useClimateData(false);

  const [activeSection, setActiveSection] = useState("overview");

  const handleToggleMock = () => {
    setIsMock((prev) => !prev);
  };

  const handleScrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#f8faf8] text-[#1c2621]">
      {/* Sidebar Navigation */}
      <Sidebar
        isMock={isMock}
        onToggleMock={handleToggleMock}
        activeSection={activeSection}
        onSelectSection={handleScrollToSection}
      />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Top Header */}
        <DashboardHeader
          isMock={isMock}
          onToggleMock={handleToggleMock}
          onRefresh={refetch}
          loading={loading}
          periodText={
            data
              ? `${data.period.startYear} – ${data.period.endYear}`
              : "2015 – 2024"
          }
          locationName={
            data?.location.name || "Ludhiana Demonstration Region, Punjab"
          }
          coordsText={`${coordinates.lat.toFixed(2)}° N, ${coordinates.lon.toFixed(2)}° E`}
        />

        {/* Loading State */}
        {loading && <DashboardLoading />}

        {/* Error State */}
        {!loading && error && (
          <DashboardError
            error={error}
            onRetry={refetch}
            onUseMock={() => setIsMock(true)}
            isMock={isMock}
          />
        )}

        {/* Success State with Loaded Data */}
        {!loading && data && (
          <div className="space-y-8">
            {/* 1. Overview Section: Metric Cards */}
            <section id="overview" className="space-y-3 scroll-mt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    Climate Overview &amp; Historical Baselines
                  </h2>
                  <p className="text-xs text-slate-500">
                    Transparent environmental indicators derived from NASA POWER Daily observations
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                  {data.period.startYear} – {data.period.endYear} (10-Yr Baseline)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {/* Metric 1: Mean Annual Rainfall */}
                <ClimateMetricCard
                  title="Mean Annual Rainfall"
                  value={data.meanAnnualRainfallMm.toFixed(1)}
                  unit="mm/yr"
                  description="Average yearly precipitation across verified complete calendar years."
                  contextNote={`Dry deficit frequency: ${data.drySeasonDeficitFrequencyPercent.toFixed(0)}%`}
                  badge={{
                    label: "Water Baseline",
                    variant: "success",
                  }}
                  icon={<CloudRainIcon size={18} />}
                />

                {/* Metric 2: Rainfall Variability (CV%) */}
                <ClimateMetricCard
                  title="Rainfall Variability"
                  value={data.rainfallVariabilityCvPercent.toFixed(1)}
                  unit="% CV"
                  description="Interannual coefficient of variation: StdDev / Mean * 100% across years."
                  contextNote="Indicates moderate year-to-year stability"
                  badge={{
                    label:
                      data.rainfallVariabilityCvPercent < 15
                        ? "Moderate Risk"
                        : "High Risk",
                    variant: "info",
                  }}
                  icon={<ActivityIcon size={18} />}
                />

                {/* Metric 3: Mean Temperature */}
                <ClimateMetricCard
                  title="Mean Air Temperature"
                  value={data.meanTemperatureC.toFixed(1)}
                  unit="°C"
                  description="Average daily 2-meter air temperature (T2M) over historical baseline."
                  contextNote={`Mean daily max: ${data.meanMaxTemperatureC.toFixed(1)}°C`}
                  badge={{
                    label: "Thermal Baseline",
                    variant: "neutral",
                  }}
                  icon={<ThermometerIcon size={18} />}
                />

                {/* Metric 4: Monsoon Concentration */}
                <ClimateMetricCard
                  title="Monsoon Rainfall"
                  value={data.seasonalRainfallMm.monsoonMm.toFixed(1)}
                  unit="mm"
                  description={`Concentrates ${(
                    (data.seasonalRainfallMm.monsoonMm /
                      data.meanAnnualRainfallMm) *
                    100
                  ).toFixed(1)}% of annual precipitation during the June–September Kharif window.`}
                  contextNote={`Winter rain: ${data.seasonalRainfallMm.winterMm.toFixed(1)} mm`}
                  badge={{
                    label: "Kharif Core",
                    variant: "warning",
                  }}
                  icon={<SunIcon size={18} />}
                />

                {/* Metric 5: Data Quality Score */}
                <ClimateMetricCard
                  title="Record Completeness"
                  value={data.quality.precipitationCompletenessPercent.toFixed(1)}
                  unit="%"
                  description={`${data.quality.totalReceivedDays} of ${data.quality.totalExpectedDays} calendar days verified without null estimation.`}
                  contextNote={
                    data.quality.hasMissingDates
                      ? `${data.quality.missingDateCount} missing dates flagged`
                      : "0 missing dates detected"
                  }
                  badge={{
                    label:
                      data.quality.excludedYears.length === 0
                        ? "Verified Quality"
                        : `${data.quality.excludedYears.length} Excluded`,
                    variant:
                      data.quality.excludedYears.length === 0
                        ? "success"
                        : "warning",
                  }}
                  icon={<ShieldCheckIcon size={18} />}
                />
              </div>
            </section>

            {/* 2. Climate Insights Section: Charts */}
            <section id="climate-insights" className="space-y-4 scroll-mt-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Climate Visualizations &amp; Trends
                </h2>
                <p className="text-xs text-slate-500">
                  Explore precipitation distributions and temperature thresholds impacting seasonal cropping
                </p>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RainfallChart
                  annualRainfallByYear={data.annualRainfallByYear}
                  monthlyMeanPrecipitationMm={data.monthlyMeanPrecipitationMm}
                  meanAnnualRainfallMm={data.meanAnnualRainfallMm}
                />

                <TemperatureChart
                  monthlyMeanMaxTempC={data.monthlyMeanMaxTempC}
                  meanTemperatureC={data.meanTemperatureC}
                  meanMaxTemperatureC={data.meanMaxTemperatureC}
                />
              </div>

              {/* Seasonal Rainfall Allocation Breakdown */}
              <SeasonalBreakdownCard
                seasonalRainfallMm={data.seasonalRainfallMm}
                meanAnnualRainfallMm={data.meanAnnualRainfallMm}
              />
            </section>

            {/* 3. Crop Rotations Section */}
            <section className="scroll-mt-6">
              <RotationOverview />
            </section>

            {/* 4. Data Sources & Transparency Section */}
            <section className="scroll-mt-6">
              <DataSourceInfo
                location={data.location}
                period={data.period}
                quality={data.quality}
                meta={meta}
                isMock={isMock}
              />
            </section>
          </div>
        )}
      </main>
    </div>
  );
}


"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useClimateData } from "@/hooks/useClimateData";
import { useCropRotations } from "@/hooks/useCropRotations";
import { loadStoredProfile } from "@/services/profileStorage";
import { FarmerProfile, isKnownField, SoilTextureType, IrrigationSourceType } from "@/types";
import { FarmerProfileBanner } from "./FarmerProfileBanner";
import { WhatIfScenarioBar } from "./WhatIfScenarioBar";
import { recalculateRotationsForScenario } from "@/utils/scenarioRecalculator";
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
  const [storedProfile, setStoredProfile] = useState<FarmerProfile | null>(null);
  const [storedProfileId, setStoredProfileId] = useState<string | null>(null);

  useEffect(() => {
    const envelope = loadStoredProfile();
    if (envelope && envelope.profile) {
      setStoredProfile({
        ...envelope.profile,
        profileId: envelope.profileId,
      });
      setStoredProfileId(envelope.profileId);
    }
  }, []);

  const customCoordinates = useMemo(() => {
    if (storedProfile && isKnownField(storedProfile.location)) {
      const loc = storedProfile.location.value;
      if (
        typeof loc.latitude === "number" &&
        typeof loc.longitude === "number" &&
        !isNaN(loc.latitude) &&
        !isNaN(loc.longitude)
      ) {
        return { lat: loc.latitude, lon: loc.longitude };
      }
    }
    return undefined;
  }, [storedProfile]);

  const farmerContext = useMemo(() => {
    if (!storedProfile) return undefined;
    return {
      soilTexture: isKnownField(storedProfile.soilTexture)
        ? storedProfile.soilTexture.value
        : undefined,
      irrigationSource: isKnownField(storedProfile.irrigationSource)
        ? storedProfile.irrigationSource.value
        : undefined,
    };
  }, [storedProfile]);

  const {
    data,
    meta,
    loading,
    error,
    isMock,
    setIsMock,
    refetch,
    coordinates,
  } = useClimateData(false, customCoordinates);

  const { data: rotationsData, loading: rotationsLoading } = useCropRotations(
    coordinates,
    isMock,
    farmerContext
  );

  const savedSoil: SoilTextureType | null = useMemo(() => {
    if (storedProfile && isKnownField(storedProfile.soilTexture)) {
      return storedProfile.soilTexture.value;
    }
    return null;
  }, [storedProfile]);

  const savedIrrigation: IrrigationSourceType | null = useMemo(() => {
    if (storedProfile && isKnownField(storedProfile.irrigationSource)) {
      return storedProfile.irrigationSource.value;
    }
    return null;
  }, [storedProfile]);

  // Scenario state (strictly in-memory; never writes to localStorage or backend)
  const [scenarioSoil, setScenarioSoil] = useState<SoilTextureType | null>(null);
  const [scenarioIrrigation, setScenarioIrrigation] = useState<IrrigationSourceType | null>(null);

  const effectiveSoil: SoilTextureType = scenarioSoil ?? savedSoil ?? "loam";
  const effectiveIrrigation: IrrigationSourceType = scenarioIrrigation ?? savedIrrigation ?? "tubewell_deep";

  const isScenarioActive = useMemo(() => {
    const soilChanged =
      scenarioSoil !== null && scenarioSoil !== (savedSoil ?? "loam");
    const irrChanged =
      scenarioIrrigation !== null &&
      scenarioIrrigation !== (savedIrrigation ?? "tubewell_deep");
    return soilChanged || irrChanged;
  }, [scenarioSoil, scenarioIrrigation, savedSoil, savedIrrigation]);

  const scenarioResult = useMemo(() => {
    if (!rotationsData) return null;

    return recalculateRotationsForScenario(
      rotationsData.baseline,
      rotationsData.alternatives,
      { soilTexture: scenarioSoil, irrigationSource: scenarioIrrigation },
      {
        soilTexture: savedSoil ?? undefined,
        irrigationSource: savedIrrigation ?? undefined,
      }
    );
  }, [rotationsData, scenarioSoil, scenarioIrrigation, savedSoil, savedIrrigation]);

  const profileDistrict = useMemo(() => {
    if (storedProfile && isKnownField(storedProfile.location) && storedProfile.location.value.district) {
      return storedProfile.location.value.district;
    }
    return null;
  }, [storedProfile]);

  const headerLocationName = useMemo(() => {
    if (profileDistrict) {
      if (isMock) {
        return `${profileDistrict}, Punjab (Ludhiana Reference Grid)`;
      }
      return `${profileDistrict}, Punjab, India`;
    }
    return data?.location.name || "Ludhiana Demonstration Region, Punjab";
  }, [profileDistrict, isMock, data?.location.name]);

  const handleSelectSoil = (soil: SoilTextureType) => {
    setScenarioSoil(soil);
  };

  const handleSelectIrrigation = (irr: IrrigationSourceType) => {
    setScenarioIrrigation(irr);
  };

  const handleResetScenario = () => {
    setScenarioSoil(null);
    setScenarioIrrigation(null);
  };

  const [activeSection, setActiveSection] = useState("crop-rotations");

  useEffect(() => {
    if (loading || !data) return;
    const sectionIds = ["crop-rotations", "climate-insights", "data-sources"];
    const handleIntersect: IntersectionObserverCallback = (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
          break;
        }
      }
    };

    const observer = new IntersectionObserver(handleIntersect, {
      root: null,
      rootMargin: "-20% 0px -60% 0px",
      threshold: 0,
    });

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [loading, data]);

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
          locationName={headerLocationName}
          coordsText={`${coordinates.lat.toFixed(2)}° N, ${coordinates.lon.toFixed(2)}° E`}
        />

        {/* Personalized Farmer Profile Banner */}
        <FarmerProfileBanner
          profile={storedProfile}
          profileId={storedProfileId ?? undefined}
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
            {/* Interactive What-If Scenario Bar */}
            <WhatIfScenarioBar
              savedSoil={savedSoil}
              savedIrrigation={savedIrrigation}
              selectedSoil={effectiveSoil}
              selectedIrrigation={effectiveIrrigation}
              onSelectSoil={handleSelectSoil}
              onSelectIrrigation={handleSelectIrrigation}
              onResetScenario={handleResetScenario}
              impactSummary={
                scenarioResult?.impactSummary ?? {
                  isScenarioActive: false,
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

            {/* 1. Crop Rotations Advisory & Decision Engine (Farmer-First) */}
            <section id="crop-rotations" className="scroll-mt-6">
              <RotationOverview
                rotationsData={rotationsData}
                loading={rotationsLoading}
                recalculatedRotations={
                  scenarioResult
                    ? {
                      baseline: scenarioResult.baseline,
                      alternatives: scenarioResult.alternatives,
                      isScenarioActive,
                    }
                    : undefined
                }
                farmContext={{
                  locationName: profileDistrict
                    ? `${profileDistrict}, Punjab, India`
                    : undefined,
                  coordinates,
                  landAreaHectares:
                    storedProfile &&
                      isKnownField(storedProfile.landAreaHectares)
                      ? storedProfile.landAreaHectares.value
                      : undefined,
                  savedSoilTexture: savedSoil,
                  savedIrrigationSource: savedIrrigation,
                  isLocationProvided: Boolean(profileDistrict),
                  isLandAreaProvided: Boolean(
                    storedProfile &&
                    isKnownField(storedProfile.landAreaHectares) &&
                    (storedProfile.landAreaHectares.value ?? 0) > 0
                  ),
                  isSoilProvided: Boolean(savedSoil),
                  isIrrigationProvided: Boolean(savedIrrigation),
                }}
                scenarioContext={{
                  isScenarioActive,
                  simulatedSoilTexture: scenarioSoil,
                  simulatedIrrigationSource: scenarioIrrigation,
                }}
              />
            </section>

            {/* 2. Climate Trends & Environmental Risk Drivers */}
            <section id="climate-insights" className="space-y-6 scroll-mt-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <ActivityIcon size={20} className="text-forest-700" />
                    Climate Risk &amp; Environmental Drivers
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    10-year historical agro-climatic indicators from NASA POWER daily observations governing crop water demand and thermal windows
                  </p>
                </div>
                <span className="self-start sm:self-auto text-xs font-mono text-slate-600 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                  {data.period.startYear} – {data.period.endYear} (10-Yr Baseline)
                </span>
              </div>

              {/* 4 Focused Agro-Climatic Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

                {/* Metric 2: Monsoon Concentration */}
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

                {/* Metric 4: Rainfall Variability (CV%) */}
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

            {/* 3. Data Sources & Transparency Section */}
            <section id="data-sources" className="scroll-mt-6">
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


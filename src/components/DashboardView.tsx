"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useClimateData } from "@/hooks/useClimateData";
import { useCropRotations } from "@/hooks/useCropRotations";
import { useFarmerProfile } from "@/hooks/useFarmerProfile";
import { FarmerProfile, isKnownField, SoilTextureType, IrrigationSourceType } from "@/types";
import { FarmerProfileBanner } from "./FarmerProfileBanner";
import { recalculateRotationsForScenario } from "@/utils/scenarioRecalculator";
import { Sidebar } from "./Sidebar";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardLoading } from "./DashboardLoading";
import { DashboardError } from "./DashboardError";
import { DashboardGate } from "./DashboardGate";
import { PrimaryRecommendationCard } from "./PrimaryRecommendationCard";
import { DashboardInsightsTabs, InsightTabId } from "./DashboardInsightsTabs";
import { FarmerAdvisoryModal } from "./FarmerAdvisoryModal";
import { generateFarmerAdvisoryReport, FarmerAdvisoryReportData } from "@/reports/advisoryReportGenerator";
import { CANDIDATE_ROTATIONS, getRotationIrrigationWaterMm } from "@/agronomy/rotations";

export function DashboardView() {
  const {
    profile: activeProfile,
    profileId: activeProfileId,
    syncStatus,
    isSynchronized,
    error: profileError,
    recoveryOccurred,
    clearProfile,
    loading: profileLoading,
  } = useFarmerProfile();

  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<InsightTabId>("rotations");
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [advisoryReport, setAdvisoryReport] = useState<FarmerAdvisoryReportData | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("demo") === "true") {
        setIsDemoMode(true);
      }
    }
    setIsHydrated(true);
  }, []);

  const handleClearProfile = () => {
    clearProfile();
    setIsDemoMode(true); // Revert cleanly to demonstration mode
  };

  const customCoordinates = useMemo(() => {
    if (activeProfile && isKnownField(activeProfile.location)) {
      const loc = activeProfile.location.value;
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
  }, [activeProfile]);

  const farmerContext = useMemo(() => {
    if (!activeProfile) return undefined;
    return {
      soilTexture: isKnownField(activeProfile.soilTexture)
        ? activeProfile.soilTexture.value
        : undefined,
      irrigationSource: isKnownField(activeProfile.irrigationSource)
        ? activeProfile.irrigationSource.value
        : undefined,
    };
  }, [activeProfile]);

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
    if (activeProfile && isKnownField(activeProfile.soilTexture)) {
      return activeProfile.soilTexture.value;
    }
    return null;
  }, [activeProfile]);

  const savedIrrigation: IrrigationSourceType | null = useMemo(() => {
    if (activeProfile && isKnownField(activeProfile.irrigationSource)) {
      return activeProfile.irrigationSource.value;
    }
    return null;
  }, [activeProfile]);

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
    if (activeProfile && isKnownField(activeProfile.location) && activeProfile.location.value.district) {
      return activeProfile.location.value.district;
    }
    return null;
  }, [activeProfile]);

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

  const handleToggleMock = () => {
    setIsMock((prev) => !prev);
  };

  const handleScrollToSection = (sectionId: string) => {
    if (sectionId === "crop-rotations") {
      setActiveTab("rotations");
    } else if (sectionId === "climate-insights") {
      setActiveTab("climate");
    } else if (sectionId === "data-sources") {
      setActiveTab("methodology");
    }
    setActiveSection(sectionId);
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }, 50);
  };

  const effectiveBaseline =
    scenarioResult?.baseline ?? rotationsData?.baseline ?? null;
  const effectiveAlternatives =
    scenarioResult?.alternatives ?? rotationsData?.alternatives ?? [];
  const primaryCandidate =
    effectiveAlternatives.find((a) => a.feasibility.isFeasible) ??
    effectiveAlternatives[0] ??
    null;

  const handleOpenReport = () => {
    if (!primaryCandidate) return;
    try {
      const report = generateFarmerAdvisoryReport({
        mode: "baseline",
        farmContext: {
          locationName: profileDistrict
            ? `${profileDistrict}, Punjab, India`
            : undefined,
          coordinates,
          landAreaHectares:
            activeProfile && isKnownField(activeProfile.landAreaHectares)
              ? activeProfile.landAreaHectares.value
              : undefined,
          savedSoilTexture: savedSoil,
          savedIrrigationSource: savedIrrigation,
          isLocationProvided: Boolean(profileDistrict),
          isLandAreaProvided: Boolean(
            activeProfile &&
            isKnownField(activeProfile.landAreaHectares) &&
            (activeProfile.landAreaHectares.value ?? 0) > 0
          ),
          isSoilProvided: Boolean(savedSoil),
          isIrrigationProvided: Boolean(savedIrrigation),
        },
        climateContext: data
          ? {
            meanAnnualRainfallMm: data.meanAnnualRainfallMm,
            seasonalMonsoonMm: data.seasonalRainfallMm?.monsoonMm,
            meanTemperatureC: data.meanTemperatureC,
            rainfallVariabilityCvPercent: data.rainfallVariabilityCvPercent,
            periodText: `${data.period.startYear} – ${data.period.endYear}`,
          }
          : undefined,
        scenarioContext: {
          isScenarioActive,
          simulatedSoilTexture: scenarioSoil,
          simulatedIrrigationSource: scenarioIrrigation,
        },
        baselineRotation: effectiveBaseline ?? undefined,
        selectedCandidate: primaryCandidate,
        scientificDisclaimer: rotationsData?.scientificDisclaimer,
      });
      setAdvisoryReport(report);
      setIsReportModalOpen(true);
    } catch (err) {
      console.error("Failed to generate advisory report", err);
    }
  };

  // Route protection gate check
  if (!isHydrated || profileLoading) {
    return <DashboardLoading />;
  }

  if (!activeProfile && !isDemoMode) {
    return <DashboardGate onEnableDemo={() => setIsDemoMode(true)} />;
  }

  // 4 Critical Farm Indicators calculation
  const baselineWaterMm = effectiveBaseline ? getRotationIrrigationWaterMm(effectiveBaseline.rotationId) : 2150;
  const recWaterMm = primaryCandidate ? getRotationIrrigationWaterMm(primaryCandidate.rotationId) : 1500;
  const waterSavedMm = Math.max(0, baselineWaterMm - recWaterMm);
  const waterSavedPct = Math.round((waterSavedMm / baselineWaterMm) * 100);
  const recNetReturn = primaryCandidate?.economics?.netReturnInrPerHa ?? 212000;
  const netReturnDelta = primaryCandidate?.economics?.comparisonToBaseline?.netReturnDeltaInrPerHa ?? 29750;
  const netReturnPercent = primaryCandidate?.economics?.comparisonToBaseline?.netReturnDeltaPercent ?? 16.3;
  const isCandidateFeasible = primaryCandidate?.feasibility.isFeasible ?? true;

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
          profile={activeProfile}
          profileId={activeProfileId ?? undefined}
          onClearProfile={handleClearProfile}
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
          <div className="space-y-6">
            {/* HERO SECTION: Primary Recommendation Card (The Hero) */}
            <PrimaryRecommendationCard
              candidate={primaryCandidate}
              baseline={effectiveBaseline}
              savedSoil={savedSoil}
              savedIrrigation={savedIrrigation}
              isScenarioActive={isScenarioActive}
              onOpenReport={handleOpenReport}
              onSelectTab={(tabId) => setActiveTab(tabId as InsightTabId)}
            />

            {/* ESSENTIAL 4 INDICATORS: 4 Critical Numbers Only */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Baseline Water Demand */}
              <div className="bg-white border border-stone-200/90 rounded-2xl p-4 shadow-2xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                    Baseline Water Demand
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                    Monoculture
                  </span>
                </div>
                <div className="text-2xl font-black text-stone-900 font-heading">
                  ~{baselineWaterMm.toLocaleString()} <span className="text-xs font-normal text-stone-500">mm / yr</span>
                </div>
                <p className="text-xs text-stone-500">
                  Conventional Rice–Wheat flooding baseline
                </p>
              </div>

              {/* 2. Recommended Water Demand */}
              <div className="bg-white border border-stone-200/90 rounded-2xl p-4 shadow-2xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                    Recommended Demand
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                    -{waterSavedPct}% Savings
                  </span>
                </div>
                <div className="text-2xl font-black text-sky-950 font-heading">
                  ~{recWaterMm.toLocaleString()} <span className="text-xs font-normal text-stone-500">mm / yr</span>
                </div>
                <p className="text-xs text-sky-700 font-medium">
                  Saves ~{waterSavedMm.toLocaleString()} mm groundwater extraction
                </p>
              </div>

              {/* 3. Expected Net Return */}
              <div className="bg-white border border-stone-200/90 rounded-2xl p-4 shadow-2xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                    Expected Net Return
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    +{netReturnPercent.toFixed(1)}% Return
                  </span>
                </div>
                <div className="text-2xl font-black text-forest-950 font-heading">
                  ₹{recNetReturn.toLocaleString()} <span className="text-xs font-normal text-stone-500">/ ha</span>
                </div>
                <p className="text-xs text-emerald-700 font-medium">
                  +₹{netReturnDelta.toLocaleString()}/ha vs Rice–Wheat baseline
                </p>
              </div>

              {/* 4. Agronomic Feasibility Status */}
              <div className="bg-white border border-stone-200/90 rounded-2xl p-4 shadow-2xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                    Agronomic Feasibility
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isCandidateFeasible
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-rose-50 text-rose-800 border border-rose-200"
                      }`}
                  >
                    {isCandidateFeasible ? "✓ Viable" : "⚠️ Restricted"}
                  </span>
                </div>
                <div className="text-2xl font-black text-stone-900 font-heading">
                  {isCandidateFeasible ? "4 of 4 Passed" : "Constraints"}
                </div>
                <p className="text-xs text-stone-500">
                  {isCandidateFeasible
                    ? "Soil, water, turnaround & thermal verified"
                    : "Physical soil or water limitations identified"}
                </p>
              </div>
            </div>

            {/* EXPANDABLE/TABBED SECTION: 7 Deep Insights Tabs */}
            <DashboardInsightsTabs
              activeTab={activeTab}
              onSelectTab={setActiveTab}
              rotationsData={rotationsData}
              rotationsLoading={rotationsLoading}
              recalculatedRotations={
                scenarioResult
                  ? {
                    baseline: scenarioResult.baseline,
                    alternatives: scenarioResult.alternatives,
                    isScenarioActive,
                  }
                  : undefined
              }
              climateData={data}
              meta={meta}
              isMock={isMock}
              savedSoil={savedSoil}
              savedIrrigation={savedIrrigation}
              scenarioSoil={scenarioSoil}
              scenarioIrrigation={scenarioIrrigation}
              onSelectSoil={handleSelectSoil}
              onSelectIrrigation={handleSelectIrrigation}
              onResetScenario={handleResetScenario}
              isScenarioActive={isScenarioActive}
              scenarioResult={scenarioResult}
              farmContext={{
                locationName: profileDistrict
                  ? `${profileDistrict}, Punjab, India`
                  : undefined,
                coordinates,
                landAreaHectares:
                  activeProfile && isKnownField(activeProfile.landAreaHectares)
                    ? activeProfile.landAreaHectares.value
                    : undefined,
                savedSoilTexture: savedSoil,
                savedIrrigationSource: savedIrrigation,
                isLocationProvided: Boolean(profileDistrict),
                isLandAreaProvided: Boolean(
                  activeProfile &&
                  isKnownField(activeProfile.landAreaHectares) &&
                  (activeProfile.landAreaHectares.value ?? 0) > 0
                ),
                isSoilProvided: Boolean(savedSoil),
                isIrrigationProvided: Boolean(savedIrrigation),
              }}
              scenarioContext={{
                isScenarioActive,
                simulatedSoilTexture: scenarioSoil,
                simulatedIrrigationSource: scenarioIrrigation,
              }}
              onOpenReport={handleOpenReport}
            />

            {/* Farmer Advisory Report Modal (A4 Print / Save as PDF) */}
            {advisoryReport && (
              <FarmerAdvisoryModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                reportData={advisoryReport}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import {
  OnboardingState,
  LandUnit,
  FarmingGoal,
  FIELD_GUIDE_STEPS,
  PUNJAB_CROP_CATALOG,
  AvailableCrop,
  LUDHIANA_DEMO_LOCATION,
  REGIONAL_FALLBACK_ESTIMATES,
  convertToAcres,
} from "@/types/onboarding";
import {
  isRotationSupportedCropId,
  getCropDisplayName,
  getCropDisplay,
} from "@/utils/cropCatalogAdapter";
import {
  getApprovedFarmingGoalsList,
  getLocalizedGoal,
  canonicalizeFarmingGoal,
} from "@/utils/farmingGoalsAdapter";
import { fetchCropsApi } from "@/services/api";
import { ProfileSyncStatus } from "./OnboardingHarness";
import {
  SoilTextureType,
  IrrigationSourceType,
  Location,
} from "@/types";
import { LocationWorkspaceMap } from "./LocationWorkspaceMap";
import { LocationWorkspacePanel } from "./LocationWorkspacePanel";
import {
  CompassIcon,
  LayersIcon,
  DropletIcon,
  SproutIcon,
  MapPinIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  InfoIcon,
  SearchIcon,
  ChevronRightIcon,
  EditIcon,
  ArrowLeftIcon,
} from "../icons";

interface OnboardingFieldGuideProps {
  state: OnboardingState;
  onChange: React.Dispatch<React.SetStateAction<OnboardingState>>;
  onSwitchToConversation: () => void;
  onComplete: () => void;
  onExit: () => void;
  locale?: "en" | "pa" | "hi";
  syncStatus?: ProfileSyncStatus;
  syncErrorMessage?: string | null;
  onProceedOffline?: () => void;
}

export function OnboardingFieldGuide({
  state,
  onChange,
  onSwitchToConversation,
  onComplete,
  onExit,
  locale = "en",
  syncStatus = "idle",
  syncErrorMessage,
  onProceedOffline,
}: OnboardingFieldGuideProps) {
  const currentStep = state.currentStepIndex;
  const totalSteps = FIELD_GUIDE_STEPS.length;
  const [cropSearch, setCropSearch] = useState("");
  const [catalogCrops, setCatalogCrops] = useState<AvailableCrop[]>(PUNJAB_CROP_CATALOG);
  const [catalogSource, setCatalogSource] = useState<"api" | "local">("local");

  // Load authoritative crops from GET /api/crops with local adapter fallback
  useEffect(() => {
    let isMounted = true;
    fetchCropsApi()
      .then((res) => {
        if (isMounted && res.success && Array.isArray(res.data) && res.data.length > 0) {
          const mapped: AvailableCrop[] = res.data.map((item) => {
            const display = getCropDisplay(item.id);
            return {
              id: item.id,
              name: item.name,
              localName: display.localizedNamePunjabi ?? item.name,
              scientificName: (item as any).scientificName ?? "",
              season: (item.season as any) ?? "kharif",
              seasonLabel: display.seasonLabel ?? item.season,
              category: display.category ?? "cereal",
              description: (item as any).description ?? display.displayName,
            };
          });
          setCatalogCrops(mapped);
          setCatalogSource("api");
        }
      })
      .catch(() => {
        // Fall back gracefully to approved static crop catalog
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      onChange((prev) => ({ ...prev, currentStepIndex: prev.currentStepIndex + 1 }));
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      onChange((prev) => ({ ...prev, currentStepIndex: prev.currentStepIndex - 1 }));
    } else {
      onExit();
    }
  };

  const goToStep = (stepIdx: number) => {
    onChange((prev) => ({ ...prev, currentStepIndex: stepIdx }));
  };

  // Step 1: Location Handlers
  const handleLocationSelect = (loc: Location, isDemo: boolean) => {
    onChange((prev) => ({
      ...prev,
      location: loc,
      isDemonstrationLocation: isDemo,
      locationStatus: "known",
    }));
  };

  // Step 2: Land Area Handlers
  const handleLandAreaChange = (val: number | null) => {
    onChange((prev) => ({
      ...prev,
      landArea: val,
      landAreaStatus: val !== null ? "known" : "not_provided",
    }));
  };

  const handleUnitChange = (unit: LandUnit) => {
    onChange((prev) => ({ ...prev, landUnit: unit }));
  };

  const handleLandAreaSkip = () => {
    onChange((prev) => ({
      ...prev,
      landArea: null,
      landAreaStatus: "skipped",
    }));
    nextStep();
  };

  // Step 3: Soil Handlers
  const handleSoilSelect = (soil: SoilTextureType | null, status: "known" | "unknown") => {
    onChange((prev) => ({
      ...prev,
      soilTexture: soil,
      soilStatus: status,
    }));
  };

  const handleSoilSkip = () => {
    onChange((prev) => ({
      ...prev,
      soilTexture: null,
      soilStatus: "skipped",
    }));
    nextStep();
  };

  // Step 4: Irrigation Handlers
  const handleIrrigationSelect = (
    irr: IrrigationSourceType | null,
    status: "known" | "unknown"
  ) => {
    onChange((prev) => ({
      ...prev,
      irrigationSource: irr,
      irrigationStatus: status,
    }));
  };

  const handleIrrigationSkip = () => {
    onChange((prev) => ({
      ...prev,
      irrigationSource: null,
      irrigationStatus: "skipped",
    }));
    nextStep();
  };

  // Step 5: Crop Handlers
  const toggleCrop = (cropId: string) => {
    onChange((prev) => {
      const exists = prev.currentCrops.includes(cropId);
      const updated = exists
        ? prev.currentCrops.filter((c) => c !== cropId)
        : [...prev.currentCrops, cropId];
      return {
        ...prev,
        currentCrops: updated,
        cropsStatus: updated.length > 0 ? "known" : "skipped",
      };
    });
  };

  const handleCropsSkip = () => {
    onChange((prev) => ({
      ...prev,
      currentCrops: [],
      cropsStatus: "skipped",
    }));
    nextStep();
  };

  // Step 6: Goal Handlers
  const toggleGoal = (goal: FarmingGoal) => {
    onChange((prev) => {
      const exists = prev.farmingGoals.includes(goal);
      const updated = exists
        ? prev.farmingGoals.filter((g) => g !== goal)
        : [...prev.farmingGoals, goal];
      return {
        ...prev,
        farmingGoals: updated,
        goalsStatus: updated.length > 0 ? "known" : "skipped",
      };
    });
  };

  // Helper for Land Unit Conversions (Punjab Revenue Standard)
  const currentAcres =
    state.landArea !== null ? convertToAcres(state.landArea, state.landUnit) : 5;
  const equivalentKanals = (currentAcres * 8).toFixed(1);
  const equivalentHectares = (currentAcres / 2.47105).toFixed(2);
  const equivalentBighas = (currentAcres * 4.8).toFixed(1);

  // Filter crops from live catalog or fallback
  const filteredCrops = catalogCrops.filter(
    (c) =>
      c.name.toLowerCase().includes(cropSearch.toLowerCase()) ||
      c.localName.toLowerCase().includes(cropSearch.toLowerCase()) ||
      c.category.toLowerCase().includes(cropSearch.toLowerCase())
  );

  // Mobile view toggle for Location Workspace (Search Panel vs Satellite Map)
  const [mobileTab, setMobileTab] = useState<"panel" | "map">("panel");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const v = params.get("view");
      if (v === "map" || v === "panel") {
        setMobileTab(v);
      }
    }
  }, []);

  // ==========================================
  // RENDER STEP 0: DEFINE YOUR WORKSPACE (Full Split Layout matching locationpng.png)
  // ==========================================
  if (currentStep === 0) {
    return (
      <div className="w-full h-[calc(100vh-50px)] min-h-[640px] flex flex-col">
        {/* Compact Workspace Header Bar */}
        <div className="h-12 bg-white border-b border-stone-200/90 px-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 font-mono">
              Step 1 of 7
            </span>
            <span className="text-stone-300">|</span>
            <span className="text-xs font-bold text-stone-900">
              Define your workspace
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Tab Switcher */}
            <div className="flex lg:hidden bg-stone-100 p-0.5 rounded-lg border border-stone-200 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setMobileTab("panel")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  mobileTab === "panel"
                    ? "bg-white text-forest-900 shadow-2xs font-bold"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => setMobileTab("map")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  mobileTab === "map"
                    ? "bg-white text-forest-900 shadow-2xs font-bold"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                Satellite Map
              </button>
            </div>

            <button
              type="button"
              onClick={onSwitchToConversation}
              className="text-xs font-semibold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-lg border border-stone-200 transition-colors hidden sm:inline-flex items-center gap-1"
            >
              💬 Start a conversation
            </button>
            <button
              type="button"
              onClick={onExit}
              className="text-xs text-stone-500 hover:text-stone-800 px-2 py-1"
            >
              Exit
            </button>
          </div>
        </div>

        {/* 30% / 70% Split Workspace Layout */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          {/* Left Panel (~30% / 410px width) */}
          <div
            className={`w-full lg:w-[410px] xl:w-[440px] shrink-0 h-full ${
              mobileTab === "panel" ? "flex" : "hidden lg:flex"
            }`}
          >
            <LocationWorkspacePanel
              location={state.location}
              isDemo={state.isDemonstrationLocation}
              onSelectLocation={handleLocationSelect}
              onConfirm={nextStep}
              onBack={prevStep}
            />
          </div>

          {/* Right Satellite Map Area (~70% width) */}
          <div
            className={`flex-1 relative h-full ${
              mobileTab === "map" ? "flex" : "hidden lg:flex"
            }`}
          >
            <LocationWorkspaceMap
              location={state.location}
              isDemo={state.isDemonstrationLocation}
              onLocationChange={handleLocationSelect}
            />
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER STEPS 1 - 6: FOCUSED STEPPER CONTAINER
  // ==========================================
  return (
    <div className="w-full max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6 space-y-6">
      {/* Top Navigation & Step Tracker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-forest-900 text-white flex items-center justify-center">
            <CompassIcon size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-forest-800 uppercase tracking-wider">
                Step {currentStep + 1} of {totalSteps}
              </span>
              <span className="text-stone-300">·</span>
              <span className="text-xs font-semibold text-stone-500">
                {FIELD_GUIDE_STEPS[currentStep].shortDesc}
              </span>
            </div>
            <h2 className="text-sm font-bold text-stone-900 leading-tight">
              {FIELD_GUIDE_STEPS[currentStep].title}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={onSwitchToConversation}
            className="px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition-colors"
          >
            💬 Start a conversation
          </button>
          <button
            type="button"
            onClick={onExit}
            className="text-xs text-stone-500 hover:text-stone-800 px-2 py-1"
          >
            Exit
          </button>
        </div>
      </div>

      {/* Step Progress Line */}
      <div className="grid grid-cols-7 gap-1.5 w-full">
        {FIELD_GUIDE_STEPS.map((s, idx) => (
          <button
            key={s.id}
            type="button"
            onClick={() => goToStep(idx)}
            className={`h-1.5 rounded-full transition-all ${idx < currentStep
                ? "bg-forest-800"
                : idx === currentStep
                  ? "bg-forest-600 ring-2 ring-forest-600/30"
                  : "bg-stone-200"
              }`}
            title={`Step ${idx + 1}: ${s.title}`}
          />
        ))}
      </div>

      {/* =========================================================================
          STEP 2: LAND AREA (Screen 2)
      ========================================================================= */}
      {currentStep === 1 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 space-y-7 shadow-xs">
          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
              How much land do you farm?
            </h2>
            <p className="text-xs sm:text-sm text-stone-600">
              Enter the approximate area of the land you want to plan crops for.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Input & Unit Switcher */}
            <div className="md:col-span-7 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-600 block">
                  Cultivated Land Area
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0.1"
                    step="0.5"
                    value={state.landArea ?? ""}
                    onChange={(e) => {
                      const v = e.target.value === "" ? null : parseFloat(e.target.value);
                      handleLandAreaChange(v);
                    }}
                    placeholder="e.g. 5"
                    className="w-40 py-3 px-4 text-xl font-bold font-mono bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-forest-700 focus:border-forest-700 text-stone-900"
                  />

                  {/* Unit Selector */}
                  <div className="flex p-1 bg-stone-100 rounded-xl border border-stone-200 text-xs font-semibold">
                    {(["acres", "hectares", "bighas", "kanals"] as LandUnit[]).map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => handleUnitChange(u)}
                        className={`px-3 py-2 rounded-lg capitalize transition-colors ${state.landUnit === u
                            ? "bg-white text-forest-900 shadow-2xs font-bold"
                            : "text-stone-600 hover:text-stone-900"
                          }`}
                      >
                        {u === "acres"
                          ? "Acres"
                          : u === "bighas"
                            ? "Kacha Bigha"
                            : u}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Conversion Preview Card */}
              {state.landArea !== null && (
                <div className="p-4 rounded-xl bg-forest-50/70 border border-forest-200/80 space-y-2 text-xs">
                  <span className="font-bold text-forest-900 block">
                    Equivalent Holding Size:
                  </span>
                  <div className="grid grid-cols-3 gap-2 font-mono text-forest-950">
                    <div className="bg-white p-2 rounded-lg border border-forest-200">
                      <span className="text-[10px] text-stone-500 block">Statutory Kanals:</span>
                      <span className="font-bold">{equivalentKanals} Kanals</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-forest-200">
                      <span className="text-[10px] text-stone-500 block">Metric Hectares:</span>
                      <span className="font-bold">{equivalentHectares} Ha</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-forest-200">
                      <span className="text-[10px] text-stone-500 block">Punjab Kacha Bigha:</span>
                      <span className="font-bold">{equivalentBighas} Bighas</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Documented Regional Definition */}
              <div className="p-3.5 rounded-xl bg-[#faf9f5] border border-stone-200 text-xs text-stone-600 space-y-1">
                <span className="font-bold text-stone-800 block">
                  Punjab Land Records Definition:
                </span>
                <p className="text-[11px] leading-relaxed">
                  Statutory revenue unit is the <strong>Acre (Killa) = 8 Kanals</strong>. The traditional Punjab <strong>Kacha Bigha</strong> equals approximately 0.208 Acres (1 Acre ≈ 4.8 Bighas).
                </p>
              </div>

              {/* Skip Option */}
              <button
                type="button"
                onClick={handleLandAreaSkip}
                className="text-xs text-stone-500 hover:text-stone-800 underline underline-offset-4"
              >
                Skip land area for now (Use Punjab operational average ~5 acres)
              </button>
            </div>

            {/* Visual Holding Scale */}
            <div className="md:col-span-5 p-4 rounded-xl bg-[#faf9f5] border border-stone-200 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-600 block">
                Punjab Holding Classification
              </span>
              <div className="space-y-2 text-xs">
                {[
                  { label: "Smallholding (< 2.5 Acres)", range: "< 2.5 ac" },
                  { label: "Semi-Medium (2.5 – 5 Acres)", range: "2.5 – 5 ac" },
                  { label: "Medium Holding (5 – 10 Acres)", range: "5 – 10 ac" },
                  { label: "Commercial (> 10 Acres)", range: "> 10 ac" },
                ].map((tier, i) => (
                  <div
                    key={i}
                    className={`p-2.5 rounded-lg border flex justify-between items-center ${currentAcres >= (i === 0 ? 0 : i === 1 ? 2.5 : i === 2 ? 5 : 10) &&
                        currentAcres < (i === 0 ? 2.5 : i === 1 ? 5 : i === 2 ? 10 : 999)
                        ? "bg-forest-100/70 border-forest-400 font-bold text-forest-950"
                        : "bg-white border-stone-200 text-stone-600"
                      }`}
                  >
                    <span>{tier.label}</span>
                    <span className="font-mono text-[11px]">{tier.range}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          STEP 3: SOIL TYPE (Screen 3)
      ========================================================================= */}
      {currentStep === 2 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 space-y-7 shadow-xs">
          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
              What type of soil do you have?
            </h2>
            <p className="text-xs sm:text-sm text-stone-600">
              Choose the option that best describes the soil in your fields.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                id: "loam" as SoilTextureType,
                name: "Balanced Loam",
                desc: "Holds shape when wet, crumbles easily in fingers. Balanced water retention and aeration. Ideal for wheat, maize, and pulses.",
                badge: "Central Punjab Baseline",
              },
              {
                id: "clay_loam" as SoilTextureType,
                name: "Clay Loam",
                desc: "Heavy, sticky soil that forms long ribbons (>5 cm). Retains high water volume, puddles well for paddy, but crusts when dry.",
                badge: "Rice Belt Soil",
              },
              {
                id: "sandy_loam" as SoilTextureType,
                name: "Sandy Loam",
                desc: "Feels gritty between fingers, drains fast, easy to till. Warm spring soil suited to maize, groundnut, and vegetables.",
                badge: "Fast Drainage",
              },
              {
                id: "silt_loam" as SoilTextureType,
                name: "Silt Loam",
                desc: "Smooth and floury texture when dry. Moderate water holding capacity, vulnerable to compaction under heavy machinery.",
                badge: "Doaba Alluvial",
              },
              {
                id: "sandy" as SoilTextureType,
                name: "Sandy Soil",
                desc: "Loose, coarse grains that cannot form a ball. Very rapid water infiltration; requires frequent light irrigation.",
                badge: "South-West Belt",
              },
            ].map((soil) => {
              const isSelected = state.soilTexture === soil.id && state.soilStatus === "known";
              return (
                <button
                  key={soil.id}
                  type="button"
                  onClick={() => handleSoilSelect(soil.id, "known")}
                  className={`text-left p-5 rounded-2xl border-2 transition-all flex flex-col justify-between space-y-3 ${isSelected
                      ? "border-forest-700 bg-forest-50/50 shadow-xs"
                      : "border-stone-200 hover:border-stone-300 bg-white"
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-stone-900 text-sm">{soil.name}</h3>
                      <span className="text-[10px] font-mono text-forest-800 bg-forest-100/70 px-2 py-0.5 rounded">
                        {soil.badge}
                      </span>
                    </div>
                    {isSelected && (
                      <CheckCircleIcon size={18} className="text-forest-700 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">{soil.desc}</p>
                </button>
              );
            })}

            {/* "I'm not sure" Option */}
            <button
              type="button"
              onClick={() => handleSoilSelect(null, "unknown")}
              className={`text-left p-5 rounded-2xl border-2 transition-all flex flex-col justify-between space-y-3 ${state.soilStatus === "unknown"
                  ? "border-amber-600 bg-amber-50/50 shadow-xs"
                  : "border-stone-200 hover:border-stone-300 bg-white"
                }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">I'm not sure</h3>
                  <span className="text-[10px] font-mono text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded">
                    Untested Soil
                  </span>
                </div>
                {state.soilStatus === "unknown" && (
                  <CheckCircleIcon size={18} className="text-amber-700 shrink-0" />
                )}
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                We will preserve your answer as unknown. A separate regional central Punjab loam baseline will be applied for climate simulation.
              </p>
            </button>
          </div>

          {/* Contextual Soil Ribbon Test Guide */}
          <div className="p-4 rounded-xl bg-[#faf9f5] border border-stone-200 space-y-1.5 text-xs text-stone-600">
            <span className="font-bold text-stone-800 block flex items-center gap-1.5">
              <InfoIcon size={14} className="text-forest-700" />
              Quick Field Ribbon Test Guide:
            </span>
            <p className="text-[11px] leading-relaxed">
              Take a golf-ball sized soil sample, moisten it, and squeeze it into a flat ribbon between your thumb and forefinger. If it forms a ribbon over 5 cm without breaking, it has high clay content. If it breaks at 2–5 cm, it is loam. If it falls apart instantly, it is sand.
            </p>
          </div>
        </div>
      )}

      {/* =========================================================================
          STEP 4: IRRIGATION (Screen 4)
      ========================================================================= */}
      {currentStep === 3 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 space-y-7 shadow-xs">
          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
              How do you water your fields?
            </h2>
            <p className="text-xs sm:text-sm text-stone-600">
              Tell us where your irrigation water comes from.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                id: "tubewell_deep" as IrrigationSourceType,
                name: "Deep tubewell",
                desc: "Submersible pump installed below 150 ft. Heavy electricity / diesel requirement; primary driver of Punjab groundwater decline.",
                badge: "High Power Demand",
              },
              {
                id: "tubewell_shallow" as IrrigationSourceType,
                name: "Shallow tubewell",
                desc: "Centrifugal or shallow pump operating within 30–100 ft in zones with higher water tables.",
                badge: "Centrifugal Pump",
              },
              {
                id: "canal" as IrrigationSourceType,
                name: "Canal water",
                desc: "Canal network water received on fixed rotational warabandi turns. Low cost but requires scheduling crop water demand to canal turns.",
                badge: "Surface Gravity",
              },
              {
                id: "conjunctive" as IrrigationSourceType,
                name: "More than one water source",
                desc: "Canal water supplemented by deep or shallow tubewells during critical growth stages.",
                badge: "Canal + Tubewell",
              },
              {
                id: "rainfed_only" as IrrigationSourceType,
                name: "Rainfed (rainwater only)",
                desc: "No assured irrigation; crops depend entirely on monsoon and winter rainfall.",
                badge: "Monsoon Dependent",
              },
            ].map((irr) => {
              const isSelected =
                state.irrigationSource === irr.id && state.irrigationStatus === "known";
              return (
                <button
                  key={irr.id}
                  type="button"
                  onClick={() => handleIrrigationSelect(irr.id, "known")}
                  className={`text-left p-5 rounded-2xl border-2 transition-all flex flex-col justify-between space-y-3 ${isSelected
                      ? "border-forest-700 bg-forest-50/50 shadow-xs"
                      : "border-stone-200 hover:border-stone-300 bg-white"
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-stone-900 text-sm">{irr.name}</h3>
                      <span className="text-[10px] font-mono text-forest-800 bg-forest-100/70 px-2 py-0.5 rounded">
                        {irr.badge}
                      </span>
                    </div>
                    {isSelected && (
                      <CheckCircleIcon size={18} className="text-forest-700 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">{irr.desc}</p>
                </button>
              );
            })}

            {/* "I'm not sure" Option */}
            <button
              type="button"
              onClick={() => handleIrrigationSelect(null, "unknown")}
              className={`text-left p-5 rounded-2xl border-2 transition-all flex flex-col justify-between space-y-3 ${state.irrigationStatus === "unknown"
                  ? "border-amber-600 bg-amber-50/50 shadow-xs"
                  : "border-stone-200 hover:border-stone-300 bg-white"
                }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">I'm not sure</h3>
                  <span className="text-[10px] font-mono text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded">
                    Unspecified Source
                  </span>
                </div>
                {state.irrigationStatus === "unknown" && (
                  <CheckCircleIcon size={18} className="text-amber-700 shrink-0" />
                )}
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                We will preserve your answer as unknown. A separate regional average tubewell reliance will be estimated for water stress calculations.
              </p>
            </button>
          </div>

          {/* Contextual Groundwater Note */}
          <div className="p-4 rounded-xl bg-[#faf9f5] border border-stone-200 space-y-1.5 text-xs text-stone-600">
            <span className="font-bold text-stone-800 block flex items-center gap-1.5">
              <DropletIcon size={14} className="text-forest-700" />
              Groundwater Context for Punjab:
            </span>
            <p className="text-[11px] leading-relaxed">
              Over 85% of central Punjab relies on submersible tubewells deeper than 150 ft. Diversifying with short-duration crops like summer moong or maize reduces pumping hours, saving significant electricity and preserving the aquifer.
            </p>
          </div>
        </div>
      )}

      {/* =========================================================================
          STEP 5: CURRENT CROPS (Screen 5)
      ========================================================================= */}
      {currentStep === 4 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 space-y-7 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                Which crops are you growing?
              </h2>
              <p className="text-xs sm:text-sm text-stone-600">
                Select the crops currently grown on your farm. Select multiple as needed.
              </p>
            </div>

            <span className="text-xs font-mono font-bold bg-forest-50 text-forest-800 px-3 py-1.5 rounded-xl border border-forest-200 self-start sm:self-auto">
              {state.currentCrops.length} crops selected
            </span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
              <SearchIcon size={16} />
            </div>
            <input
              type="text"
              value={cropSearch}
              onChange={(e) => setCropSearch(e.target.value)}
              placeholder="Search crops by common or local name..."
              className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-forest-700 focus:bg-white"
            />
          </div>

          {/* Crop Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 max-h-[380px] overflow-y-auto pr-1">
            {filteredCrops.map((crop) => {
              const isSelected = state.currentCrops.includes(crop.id);
              const isRotationSupported = isRotationSupportedCropId(crop.id);
              return (
                <button
                  key={crop.id}
                  type="button"
                  onClick={() => toggleCrop(crop.id)}
                  className={`text-left p-4 rounded-xl border-2 transition-all flex flex-col justify-between space-y-2 group ${isSelected
                      ? "border-forest-700 bg-forest-50/60 shadow-xs"
                      : "border-stone-200 hover:border-stone-300 bg-white"
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-stone-900 group-hover:text-forest-900">
                        {crop.name}
                      </h4>
                      <span className="text-[11px] text-stone-500 font-medium block">
                        {crop.localName}
                      </span>
                    </div>
                    {isSelected ? (
                      <CheckCircleIcon size={18} className="text-forest-700 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-stone-300 group-hover:border-forest-500 shrink-0" />
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-stone-500 font-mono border-t border-stone-100 pt-1.5 gap-2">
                    <span className="bg-stone-100 px-1.5 py-0.5 rounded text-stone-700 truncate">
                      {crop.seasonLabel}
                    </span>
                    {!isRotationSupported && (
                      <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[9px] px-1.5 py-0.2 rounded font-sans shrink-0">
                        Catalog only
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-stone-100 text-xs">
            <button
              type="button"
              onClick={handleCropsSkip}
              className="text-stone-500 hover:text-stone-800 underline underline-offset-4"
            >
              Skip crop selection for now
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          STEP 6: FARMING GOALS (Screen 6)
      ========================================================================= */}
      {currentStep === 5 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 space-y-7 shadow-xs">
          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
              What would you like to improve?
            </h2>
            <p className="text-xs sm:text-sm text-stone-600">
              Choose one or more priorities for your upcoming crop rotation plan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {getApprovedFarmingGoalsList(locale).map((goal) => {
              const isSelected = state.farmingGoals.includes(goal.id);
              return (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => toggleGoal(goal.id)}
                  className={`text-left p-5 rounded-2xl border-2 transition-all flex items-start gap-4 ${isSelected
                      ? "border-forest-700 bg-forest-50/60 shadow-xs"
                      : "border-stone-200 hover:border-stone-300 bg-white"
                    }`}
                >
                  <span className="text-2xl shrink-0 mt-0.5">{goal.icon}</span>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-stone-900 text-sm">{goal.title}</h3>
                      {isSelected && (
                        <CheckCircleIcon size={18} className="text-forest-700 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed">{goal.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          STEP 7: PROFILE REVIEW (Screen 7)
      ========================================================================= */}
      {currentStep === 6 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 space-y-7 shadow-xs">
          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
              Review your farm details
            </h2>
            <p className="text-xs sm:text-sm text-stone-600">
              Verify your information before creating your farm workspace.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Column 1: Information Provided by Farmer */}
            <div className="p-5 rounded-2xl bg-[#faf9f5] border border-stone-200 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-900 block flex items-center gap-2">
                <CheckCircleIcon size={14} className="text-forest-700" />
                Information Provided By You
              </span>

              <div className="space-y-2.5 text-xs">
                {/* Location */}
                <div className="p-3 bg-white rounded-xl border border-stone-200 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-stone-400 block">Farm Location:</span>
                    <span className="font-bold text-stone-900">
                      {state.location ? state.location.district : "Not specified"}
                    </span>
                    {state.isDemonstrationLocation && (
                      <span className="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 font-mono block mt-0.5">
                        Demo Reference Dataset
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => goToStep(0)}
                    className="text-xs text-forest-700 hover:text-forest-900 flex items-center gap-1 font-semibold"
                  >
                    <EditIcon size={13} />
                    Edit
                  </button>
                </div>

                {/* Land Area */}
                <div className="p-3 bg-white rounded-xl border border-stone-200 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-stone-400 block">Land Area:</span>
                    <span className="font-bold text-stone-900 font-mono">
                      {state.landArea !== null
                        ? `${state.landArea} ${state.landUnit}`
                        : "Skipped by farmer"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => goToStep(1)}
                    className="text-xs text-forest-700 hover:text-forest-900 flex items-center gap-1 font-semibold"
                  >
                    <EditIcon size={13} />
                    Edit
                  </button>
                </div>

                {/* Soil */}
                <div className="p-3 bg-white rounded-xl border border-stone-200 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-stone-400 block">Soil Type:</span>
                    <span className="font-bold text-stone-900 capitalize">
                      {state.soilTexture
                        ? state.soilTexture.replace("_", " ")
                        : state.soilStatus === "unknown"
                          ? "Marked as I'm not sure"
                          : "Skipped"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => goToStep(2)}
                    className="text-xs text-forest-700 hover:text-forest-900 flex items-center gap-1 font-semibold"
                  >
                    <EditIcon size={13} />
                    Edit
                  </button>
                </div>

                {/* Irrigation */}
                <div className="p-3 bg-white rounded-xl border border-stone-200 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-stone-400 block">Irrigation Source:</span>
                    <span className="font-bold text-stone-900 capitalize">
                      {state.irrigationSource
                        ? state.irrigationSource.replace("_", " ")
                        : state.irrigationStatus === "unknown"
                          ? "Marked as I'm not sure"
                          : "Skipped"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => goToStep(3)}
                    className="text-xs text-forest-700 hover:text-forest-900 flex items-center gap-1 font-semibold"
                  >
                    <EditIcon size={13} />
                    Edit
                  </button>
                </div>

                {/* Crops */}
                <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-stone-400 block">Current Crops:</span>
                    <button
                      type="button"
                      onClick={() => goToStep(4)}
                      className="text-xs text-forest-700 hover:text-forest-900 flex items-center gap-1 font-semibold"
                    >
                      <EditIcon size={13} />
                      Edit
                    </button>
                  </div>
                  <span className="font-bold text-stone-900 block">
                    {state.currentCrops.length > 0
                      ? state.currentCrops
                          .map((id) => getCropDisplayName(id, locale))
                          .join(", ")
                      : "None recorded"}
                  </span>
                </div>

                {/* Farming Goals */}
                <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-stone-400 block">Farming Goals:</span>
                    <button
                      type="button"
                      onClick={() => goToStep(5)}
                      className="text-xs text-forest-700 hover:text-forest-900 flex items-center gap-1 font-semibold"
                    >
                      <EditIcon size={13} />
                      Edit
                    </button>
                  </div>
                  <span className="font-bold text-stone-900 block">
                    {state.farmingGoals.length > 0
                      ? state.farmingGoals
                          .map((id) => getLocalizedGoal(id, locale).title)
                          .join(", ")
                      : "None selected"}
                  </span>
                </div>
              </div>
            </div>

            {/* Column 2: Regional Estimates Applied */}
            <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900 block flex items-center gap-2">
                <InfoIcon size={14} className="text-amber-700" />
                Regional Estimates Applied For Climate Modeling
              </span>

              <p className="text-xs text-stone-600 leading-relaxed">
                When specific farm parameters are marked as unknown or skipped, Sproutnik applies regional scientific baselines for climate simulation without overwriting your profile.
              </p>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-1">
                  <span className="text-[10px] text-stone-400 block font-mono">Location Reference</span>
                  <p className="text-stone-800 leading-tight">
                    {state.location
                      ? `${state.location.district} NASA Grid (0.5° × 0.5°)`
                      : "Ludhiana Demonstration Region (30.90° N, 75.85° E)"}
                  </p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-1">
                  <span className="text-[10px] text-stone-400 block font-mono">Soil Simulation Baseline</span>
                  <p className="text-stone-800 leading-tight">
                    {state.soilTexture
                      ? `Farmer-verified ${state.soilTexture.replace("_", " ")}`
                      : "Central Punjab Plain Zone regional baseline Loam"}
                  </p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-1">
                  <span className="text-[10px] text-stone-400 block font-mono">Water Stress Model</span>
                  <p className="text-stone-800 leading-tight">
                    {state.irrigationSource
                      ? `Farmer-verified ${state.irrigationSource.replace("_", " ")}`
                      : "District average (>85% deep tubewell extraction)"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sync Status Notifications */}
          {syncStatus === "saving" && (
            <div className="p-4 rounded-xl bg-forest-50 border border-forest-200 flex items-center gap-3 text-xs text-forest-900">
              <div className="w-4 h-4 border-2 border-forest-700 border-t-transparent rounded-full animate-spin shrink-0" />
              <span className="font-semibold">
                Connecting to backend API and saving farmer profile...
              </span>
            </div>
          )}

          {syncStatus === "error" && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 space-y-2 text-xs text-red-900">
              <div className="flex items-center gap-2 font-bold">
                <span>⚠️</span>
                <span>Profile Synchronization Notice</span>
              </div>
              <p className="text-[11px] text-red-800 leading-relaxed">
                {syncErrorMessage ?? "The remote profile endpoint could not be reached. Your farm inputs are verified and safely retained."}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={onComplete}
                  className="px-3 py-1.5 bg-red-800 hover:bg-red-900 text-white rounded-lg font-semibold text-[11px]"
                >
                  Retry Synchronization
                </button>
                {onProceedOffline && (
                  <button
                    type="button"
                    onClick={onProceedOffline}
                    className="px-3 py-1.5 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 rounded-lg font-semibold text-[11px]"
                  >
                    Proceed to Dashboard (Offline Preview)
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stepper Navigation Buttons (for Steps 1-6) */}
      <div className="flex items-center justify-between pt-4 border-t border-stone-200">
        <button
          type="button"
          onClick={prevStep}
          className="py-2.5 px-5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 font-semibold text-xs sm:text-sm transition-colors flex items-center gap-1.5"
        >
          <ArrowLeftIcon size={16} />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={nextStep}
          disabled={syncStatus === "saving"}
          className={`py-3 px-6 rounded-xl font-semibold text-xs sm:text-sm shadow-xs transition-all flex items-center gap-2 ${
            syncStatus === "saving"
              ? "bg-forest-700/60 text-white/80 cursor-not-allowed"
              : "bg-forest-800 hover:bg-forest-900 text-white"
          }`}
        >
          <span>
            {currentStep === totalSteps - 1
              ? syncStatus === "saving"
                ? "Connecting..."
                : "Create my farm workspace"
              : "Continue"}
          </span>
          <ChevronRightIcon size={16} />
        </button>
      </div>
    </div>
  );
}

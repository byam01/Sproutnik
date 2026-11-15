import React from "react";
import {
  SoilTextureType,
  IrrigationSourceType,
} from "@/types";
import { LandUnit } from "@/types/onboarding";
import {
  MapPinIcon,
  DropletIcon,
  LayersIcon,
  SproutIcon,
  InfoIcon,
  ShieldCheckIcon,
} from "../icons";

/**
 * 1. Location Visualizer: Ludhiana Agro-Climatic Context
 */
export function LocationVisualizer({
  isDemoLocation,
  locationName,
}: {
  isDemoLocation: boolean;
  locationName?: string;
}) {
  return (
    <div className="bg-[#fcfbf9] border border-stone-200/90 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
          <MapPinIcon size={13} className="text-forest-700" />
          Field Reference Data
        </span>
        <span className="text-[10px] font-mono bg-stone-200/70 text-stone-700 px-2 py-0.5 rounded">
          Central Plain Zone (Punjab)
        </span>
      </div>

      {/* Mini Schematic Grid */}
      <div className="p-4 bg-white rounded-xl border border-stone-200 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-stone-500">Selected Node:</span>
          <span className="font-mono font-bold text-stone-900">
            {locationName || "Ludhiana Prototype"}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-stone-500">Grid Coordinates:</span>
          <span className="font-mono text-stone-800">30.90° N, 75.85° E</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-stone-500">Elevation:</span>
          <span className="font-mono text-stone-800">247 m above sea level</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-stone-500">Rainfall Regime:</span>
          <span className="font-semibold text-forest-800">684 mm/yr (77.8% Monsoon)</span>
        </div>
      </div>

      <div
        className={`p-3 rounded-xl border text-xs space-y-1 ${
          isDemoLocation
            ? "bg-amber-50/80 border-amber-200 text-amber-950"
            : "bg-forest-50/80 border-forest-200 text-forest-950"
        }`}
      >
        <div className="font-bold flex items-center gap-1">
          <InfoIcon size={14} className={isDemoLocation ? "text-amber-700" : "text-forest-700"} />
          {isDemoLocation ? "Demonstration Dataset Notice" : "Location Status"}
        </div>
        <p className="leading-relaxed text-[11px]">
          {isDemoLocation
            ? "Ludhiana coordinates are used as a demonstration baseline dataset. If your farm is in another district, you can enter your coordinates or update this anytime."
            : "Your custom farm coordinates will calibrate local historical precipitation and heat stress intervals."}
        </p>
      </div>
    </div>
  );
}

/**
 * 2. Land Area Visualizer: Verified Punjab Revenue Unit Conversions
 */
export function LandAreaVisualizer({
  landArea,
  landUnit,
  onUnitChange,
}: {
  landArea: number | null;
  landUnit: LandUnit;
  onUnitChange: (unit: LandUnit) => void;
}) {
  const rawValue = landArea ?? 5;

  // Documented conversions:
  // 1 Acre = 8 Kanals (official Punjab statutory unit)
  // 1 Acre ≈ 4.8 Bighas (traditional Punjab Kacha Bigha: ~1,008 sq yd)
  // 1 Hectare = 2.471 Acres
  let acresEquivalent = rawValue;
  if (landUnit === "kanals") {
    acresEquivalent = rawValue / 8;
  } else if (landUnit === "bighas") {
    acresEquivalent = rawValue / 4.8;
  } else if (landUnit === "hectares") {
    acresEquivalent = rawValue * 2.471;
  }

  const roundedAcres = Number(acresEquivalent.toFixed(2));
  const kanalsEquivalent = Number((roundedAcres * 8).toFixed(1));
  const kachaBighasEquivalent = Number((roundedAcres * 4.8).toFixed(1));
  const hectaresEquivalent = Number((roundedAcres * 0.404686).toFixed(2));

  return (
    <div className="bg-[#fcfbf9] border border-stone-200/90 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
          <LayersIcon size={13} className="text-forest-700" />
          Punjab Land Revenue Units
        </span>

        {/* Unit Selector */}
        <div className="flex items-center bg-stone-200/70 p-0.5 rounded-lg text-[10px] font-medium">
          {(["acres", "kanals", "bighas", "hectares"] as LandUnit[]).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => onUnitChange(u)}
              className={`px-2 py-0.5 rounded-md capitalize transition-all ${
                landUnit === u
                  ? "bg-white text-stone-900 font-bold shadow-2xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              {u === "kanals" ? "Kanal" : u === "bighas" ? "Bigha" : u}
            </button>
          ))}
        </div>
      </div>

      {/* Schematic Field Plot Graphic */}
      <div className="p-4 bg-white rounded-xl border border-stone-200 text-center space-y-2">
        <div className="h-24 w-full bg-[#f4f7f2] border-2 border-dashed border-forest-300 rounded-lg flex flex-col items-center justify-center p-2">
          <span className="text-xl font-mono font-extrabold text-forest-900">
            {rawValue} {landUnit}
          </span>
          <span className="text-[11px] text-stone-600 mt-0.5">
            = <strong>{roundedAcres} Acres (Killa)</strong> · {kanalsEquivalent} Kanals
          </span>
        </div>

        <div className="text-[11px] text-stone-600 text-left space-y-1 pt-1">
          <div className="flex justify-between border-b border-stone-100 pb-1">
            <span>Punjab Kanal (Statutory):</span>
            <span className="font-mono font-medium">{kanalsEquivalent} Kanals (8 Kanals = 1 Acre)</span>
          </div>
          <div className="flex justify-between border-b border-stone-100 pb-1">
            <span>Punjab Kacha Bigha (Traditional):</span>
            <span className="font-mono font-medium">≈ {kachaBighasEquivalent} Bighas (1 Acre ≈ 4.8 Bighas)</span>
          </div>
          <div className="flex justify-between">
            <span>Metric Equivalent:</span>
            <span className="font-mono font-medium">{hectaresEquivalent} Hectares</span>
          </div>
        </div>
      </div>

      <div className="p-2.5 rounded-xl bg-stone-100 border border-stone-200/80 text-[10px] text-stone-600 space-y-1">
        <span className="font-bold text-stone-800 block">Documented Regional Definition:</span>
        <p className="leading-relaxed">
          In official Punjab revenue records, <strong>1 Acre = exactly 8 Kanals = 160 Marlas</strong>. Traditional Bighas in Punjab vary regionally between 2 Bighas/acre (Pukka) and 4.8 Bighas/acre (Kacha). We use the documented Punjab Kacha baseline here.
        </p>
      </div>
    </div>
  );
}

/**
 * 3. Soil Ribbon & Texture Visualizer: Extension Hand-Feel Guide
 */
export function SoilRibbonVisualizer({
  selectedSoil,
}: {
  selectedSoil: SoilTextureType | null;
}) {
  const soilProfiles: Record<
    string,
    { ribbonLength: string; waterHolding: string; drainage: string; bestCrops: string }
  > = {
    loam: {
      ribbonLength: "2.5 – 5.0 cm (Forms pliable ribbon that crumbles under moderate pressure)",
      waterHolding: "High & balanced (optimal available water capacity)",
      drainage: "Moderate, well aerated",
      bestCrops: "Universal: Wheat, Maize, Moong, Mustard, Cotton",
    },
    clay_loam: {
      ribbonLength: "> 5.0 cm (Very flexible, shiny ribbon; sticky wet)",
      waterHolding: "Very high (slow percolation, puddles easily)",
      drainage: "Slow; prone to surface waterlogging and hardpan",
      bestCrops: "Rice (paddy), Wheat, Sugarcane",
    },
    sandy_loam: {
      ribbonLength: "< 2.5 cm (Crumbles easily; feels noticeably gritty)",
      waterHolding: "Moderate to low (requires frequent light irrigation)",
      drainage: "Rapid infiltration",
      bestCrops: "Maize, Summer Moong, Groundnut, Cotton",
    },
    silt_loam: {
      ribbonLength: "2.5 – 4.0 cm (Feels smooth and floury like talcum powder)",
      waterHolding: "High; vulnerable to surface compaction",
      drainage: "Moderate",
      bestCrops: "Wheat, Vegetables, Pulses, Mustard",
    },
    sandy: {
      ribbonLength: "Cannot form ribbon (falls apart immediately)",
      waterHolding: "Very low; high nutrient leaching",
      drainage: "Excessive",
      bestCrops: "Pearl millet (Bajra), Pulses with drip irrigation",
    },
  };

  const currentKey = selectedSoil || "loam";
  const profile = soilProfiles[currentKey] || soilProfiles.loam;

  return (
    <div className="bg-[#fcfbf9] border border-stone-200/90 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
          <ShieldCheckIcon size={13} className="text-forest-700" />
          Extension Hand-Feel Guide
        </span>
        <span className="text-[10px] font-mono bg-forest-100 text-forest-800 px-2 py-0.5 rounded capitalize font-bold">
          {selectedSoil ? selectedSoil.replace("_", " ") : "Not Selected Yet"}
        </span>
      </div>

      <div className="p-4 bg-white rounded-xl border border-stone-200 space-y-3 text-xs">
        <div>
          <span className="text-stone-500 text-[11px] block">Ribbon Test Behavior:</span>
          <span className="font-semibold text-stone-900">{profile.ribbonLength}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-100">
          <div>
            <span className="text-stone-500 text-[11px] block">Water Retention:</span>
            <span className="font-medium text-stone-800">{profile.waterHolding}</span>
          </div>
          <div>
            <span className="text-stone-500 text-[11px] block">Infiltration Rate:</span>
            <span className="font-medium text-stone-800">{profile.drainage}</span>
          </div>
        </div>
        <div className="pt-1 border-t border-stone-100">
          <span className="text-stone-500 text-[11px] block">Agronomic Compatibility:</span>
          <span className="font-semibold text-forest-800">{profile.bestCrops}</span>
        </div>
      </div>

      <p className="text-[11px] text-stone-500 leading-relaxed">
        {selectedSoil === null
          ? "If you do not know your exact soil texture, choose 'I haven't tested'. It will be preserved as 'unknown', and regional loam baseline will be separately labelled."
          : "Heavier clay soils hold ponded water needed for rice but restrict root respiration for sensitive legumes. Lighter sandy loams allow rapid diversification with moong or maize."}
      </p>
    </div>
  );
}

/**
 * 4. Irrigation & Aquifer Depth Visualizer
 */
export function IrrigationAquiferVisualizer({
  selectedIrrigation,
}: {
  selectedIrrigation: IrrigationSourceType | null;
}) {
  return (
    <div className="bg-[#fcfbf9] border border-stone-200/90 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
          <DropletIcon size={13} className="text-sky-700" />
          Aquifer Depth &amp; Energy Exposure
        </span>
        <span className="text-[10px] font-mono bg-sky-100 text-sky-800 px-2 py-0.5 rounded capitalize font-bold">
          {selectedIrrigation ? selectedIrrigation.replace("_", " ") : "Not Selected Yet"}
        </span>
      </div>

      {/* Cross Section Schematic */}
      <div className="p-4 bg-white rounded-xl border border-stone-200 space-y-2.5 text-xs">
        <div className="flex items-center justify-between p-2 rounded-lg bg-sky-50/70 border border-sky-100">
          <div className="font-semibold text-sky-950 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            Canal Surface Water (Sirhind / Bist Doab)
          </div>
          <span className="text-[10px] text-sky-800 font-mono">Gravity / Zero Lift</span>
        </div>

        <div className="flex items-center justify-between p-2 rounded-lg bg-stone-50 border border-stone-200">
          <div className="font-semibold text-stone-800 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            Shallow Alluvial Aquifer (&lt; 150 ft)
          </div>
          <span className="text-[10px] text-stone-500 font-mono">Seasonal Recharge</span>
        </div>

        <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50/70 border border-amber-200">
          <div className="font-semibold text-amber-950 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            Deep Over-Exploited Strata (&gt; 150 ft)
          </div>
          <span className="text-[10px] text-rose-700 font-mono font-bold">15-25 HP Submersible</span>
        </div>
      </div>

      <p className="text-[11px] text-stone-500 leading-relaxed">
        In deep tubewell tracts, each extra irrigation for paddy consumes ~35 kWh per acre. Substituting 2 floodings with short-duration crops protects farm margins against power cuts and tariff spikes.
      </p>
    </div>
  );
}

/**
 * 5. Cropping Calendar Visualizer
 */
export function CropCalendarVisualizer({ selectedCrops }: { selectedCrops: string[] }) {
  return (
    <div className="bg-[#fcfbf9] border border-stone-200/90 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
          <SproutIcon size={13} className="text-forest-700" />
          Punjab Annual Cropping Calendar
        </span>
        <span className="text-[10px] font-mono bg-forest-100 text-forest-800 px-2 py-0.5 rounded font-bold">
          {selectedCrops.length} Active Crops
        </span>
      </div>

      <div className="p-4 bg-white rounded-xl border border-stone-200 space-y-2 text-xs">
        <div className="space-y-1">
          <div className="flex justify-between font-bold text-stone-900">
            <span>Kharif (Monsoon)</span>
            <span className="text-stone-500 font-normal">June – October</span>
          </div>
          <div className="w-full h-2 rounded-full bg-forest-100 overflow-hidden">
            <div className="w-full h-full bg-forest-600 rounded-full" />
          </div>
          <span className="text-[11px] text-stone-500">
            {selectedCrops.includes("Rice (Paddy)") ? "Paddy Rice (flooded)" : "Diversified Kharif"}
          </span>
        </div>

        <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-900 space-y-0.5">
          <strong className="block font-bold">Critical Turnaround Window (15–20 Days):</strong>
          <span>Late October: Stubble clearing between paddy harvest and wheat sowing.</span>
        </div>

        <div className="space-y-1 pt-1">
          <div className="flex justify-between font-bold text-stone-900">
            <span>Rabi (Winter)</span>
            <span className="text-stone-500 font-normal">November – April</span>
          </div>
          <div className="w-full h-2 rounded-full bg-amber-100 overflow-hidden">
            <div className="w-full h-full bg-amber-600 rounded-full" />
          </div>
          <span className="text-[11px] text-stone-500">
            {selectedCrops.includes("Wheat") ? "Wheat (vulnerable to March heat)" : "Rabi crops"}
          </span>
        </div>
      </div>
    </div>
  );
}

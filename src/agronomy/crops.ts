import { CropMetadata } from "@/types";
import { AGRONOMIC_EVIDENCE } from "./evidence";

export const CROPS_PUNJAB: Record<string, CropMetadata> = {
  paddy_transplanted: {
    id: "paddy_transplanted",
    name: "Puddled Transplanted Rice (Paddy)",
    scientificName: "Oryza sativa",
    season: "kharif",
    sowingWindowStart: "06-15",
    sowingWindowEnd: "07-05",
    harvestWindowStart: "10-15",
    harvestWindowEnd: "11-05",
    durationDaysMin: 120,
    durationDaysMax: 145,
    waterDemandCategory: "very_high",
    estimatedIrrigationRequirementsMm: 1750, // 1500 - 2000 mm in Punjab
    soilSuitability: ["clay_loam", "loam", "silt_loam"],
    salinityTolerance: "moderately_sensitive",
    precedingCropCompatibility: ["bread_wheat", "summer_moong", "rabi_mustard"],
    benefits: [
      "High yield reliability under guaranteed tubewell irrigation",
      "Established Minimum Support Price (MSP) and procurement infrastructure in Punjab",
      "High tolerance to temporary water stagnation during monsoon surges",
    ],
    limitations: [
      "Extremely high groundwater draft (~1,500–2,000 mm total water requirement)",
      "Continuous puddling destroys soil physical structure, forming an impermeable subsoil hardpan",
      "Late harvest in late October/early November creates a severe 10–20 day bottleneck before wheat sowing, historically incentivizing stubble burning",
      "Contributes to regional aquifer depletion in central Punjab over-exploited blocks",
    ],
    evidence: [AGRONOMIC_EVIDENCE.PAU_KHARIF_PADDY, AGRONOMIC_EVIDENCE.CGWB_LUDHIANA_GROUNDWATER],
    unknownAttributes: [
      "Exact micro-scale evapotranspiration on coarse sand inclusions",
      "Dynamic field-scale methane emission variations by irrigation schedule",
    ],
  },

  paddy_dsr: {
    id: "paddy_dsr",
    name: "Direct-Seeded Rice (DSR)",
    scientificName: "Oryza sativa (Direct Seeded)",
    season: "kharif",
    sowingWindowStart: "06-01",
    sowingWindowEnd: "06-25",
    harvestWindowStart: "10-05",
    harvestWindowEnd: "10-25",
    durationDaysMin: 115,
    durationDaysMax: 135,
    waterDemandCategory: "high",
    estimatedIrrigationRequirementsMm: 1400, // ~15-20% savings over puddled
    soilSuitability: ["clay_loam", "loam"], // unsuitable for light sandy soils
    salinityTolerance: "moderately_sensitive",
    precedingCropCompatibility: ["bread_wheat", "summer_moong", "rabi_mustard"],
    benefits: [
      "Eliminates puddled transplanting and nursery raising, saving 15–20% irrigation water",
      "Avoids hardpan compaction, improving soil aeration for subsequent rabi wheat",
      "Harvests 7–10 days earlier than puddled rice, easing turnaround window for residue management",
    ],
    limitations: [
      "Highly vulnerable to iron chlorosis on light sandy or alkaline soils",
      "Severe early weed competition requiring precision pre-emergence herbicidal management",
      "Unsuitable for sandy or highly permeable fields with poor moisture retention",
    ],
    evidence: [AGRONOMIC_EVIDENCE.PAU_DSR_GUIDELINES, AGRONOMIC_EVIDENCE.CGWB_LUDHIANA_GROUNDWATER],
    unknownAttributes: [
      "Multi-year yield stability under erratic monsoon break spells",
    ],
  },

  bread_wheat: {
    id: "bread_wheat",
    name: "Rabi Bread Wheat",
    scientificName: "Triticum aestivum",
    season: "rabi",
    sowingWindowStart: "10-25",
    sowingWindowEnd: "11-15",
    harvestWindowStart: "04-10",
    harvestWindowEnd: "04-30",
    durationDaysMin: 140,
    durationDaysMax: 160,
    waterDemandCategory: "moderate",
    estimatedIrrigationRequirementsMm: 400, // 350 - 450 mm across 4-5 irrigations
    soilSuitability: ["clay_loam", "loam", "silt_loam", "sandy_loam"],
    salinityTolerance: "moderately_sensitive",
    precedingCropCompatibility: ["paddy_transplanted", "paddy_dsr", "kharif_maize", "summer_moong"],
    benefits: [
      "Staple cereal with guaranteed procurement (MSP) in Punjab mandis",
      "Responds exceptionally well to cool, clear Punjab winter conditions (Western Disturbances)",
      "Compatible with Happy Seeder / Smart Seeder zero-tillage in standing rice residue",
    ],
    limitations: [
      "Highly vulnerable to March terminal heat surges (>30°C) during anthesis and grain-fill",
      "Continuous cereal-cereal cycle fosters herbicide-resistant weeds like Phalaris minor (gulli danda)",
      "Subsoil hardpan from previous puddled rice restricts deep root penetration",
    ],
    evidence: [AGRONOMIC_EVIDENCE.PAU_RABI_WHEAT],
    unknownAttributes: [
      "Site-specific canopy temperature depression under localized heatwaves",
    ],
  },

  kharif_maize: {
    id: "kharif_maize",
    name: "Kharif Grain Maize",
    scientificName: "Zea mays",
    season: "kharif",
    sowingWindowStart: "05-25",
    sowingWindowEnd: "06-25",
    harvestWindowStart: "09-10",
    harvestWindowEnd: "09-30",
    durationDaysMin: 95,
    durationDaysMax: 110,
    waterDemandCategory: "moderate",
    estimatedIrrigationRequirementsMm: 500, // 450 - 600 mm (saves 65-70% water vs paddy)
    soilSuitability: ["loam", "sandy_loam", "silt_loam", "clay_loam"],
    salinityTolerance: "moderately_sensitive",
    precedingCropCompatibility: ["bread_wheat", "rabi_mustard", "summer_moong"],
    benefits: [
      "Consumes 65–70% less irrigation water than puddled paddy, halting groundwater drawdown",
      "Matures in late September, providing a wide 25–40 day window for optimal wheat sowing",
      "Disrupts aquatic weed and insect pest cycles of continuous rice",
      "Deep fibrous root system improves soil aeration without puddling",
    ],
    limitations: [
      "Highly susceptible to waterlogging and poor drainage during heavy monsoon flash floods",
      "Market price realization is more volatile than paddy without universal mandi procurement",
      "Fall Armyworm (Spodoptera frugiperda) monitoring required during vegetative phase",
    ],
    evidence: [AGRONOMIC_EVIDENCE.PAU_KHARIF_MAIZE, AGRONOMIC_EVIDENCE.ICAR_IIFSR_DIVERSIFICATION],
    unknownAttributes: [
      "Farm-gate price variance between silage and food-grade grain contracts",
    ],
  },

  summer_moong: {
    id: "summer_moong",
    name: "Summer Moong (Greengram)",
    scientificName: "Vigna radiata",
    season: "zaid",
    sowingWindowStart: "03-20",
    sowingWindowEnd: "04-10",
    harvestWindowStart: "05-25",
    harvestWindowEnd: "06-15",
    durationDaysMin: 60,
    durationDaysMax: 70,
    waterDemandCategory: "low",
    estimatedIrrigationRequirementsMm: 250, // 3 - 4 light irrigations
    soilSuitability: ["loam", "sandy_loam", "silt_loam", "clay_loam"],
    salinityTolerance: "moderately_sensitive",
    precedingCropCompatibility: ["bread_wheat", "rabi_mustard"],
    benefits: [
      "Biological nitrogen fixation adds 30–40 kg N/ha, reducing chemical fertilizer needs for succeeding kharif crop",
      "Short catch-crop duration (60–65 days) fits squarely in the fallow window between wheat and rice/maize",
      "In situ incorporation of crop residue enhances soil organic matter and moisture retention",
      "High protein pulse providing additional farm income",
    ],
    limitations: [
      "Requires timely sowing by early April to avoid monsoon onset during pod maturation",
      "Excessive irrigation or pre-monsoon showers during maturity can cause vegetative re-growth and pod shattering",
      "Requires 3–4 timely irrigations during hot pre-monsoon summer (April–May)",
    ],
    evidence: [AGRONOMIC_EVIDENCE.PAU_SUMMER_MOONG, AGRONOMIC_EVIDENCE.ICAR_IIFSR_DIVERSIFICATION],
    unknownAttributes: [
      "Exact rhizobial nodulation efficiency under high summer surface soil temperatures (>42°C)",
    ],
  },

  rabi_mustard: {
    id: "rabi_mustard",
    name: "Rabi Mustard / Raya",
    scientificName: "Brassica juncea",
    season: "rabi",
    sowingWindowStart: "10-10",
    sowingWindowEnd: "10-31",
    harvestWindowStart: "03-10",
    harvestWindowEnd: "03-31",
    durationDaysMin: 135,
    durationDaysMax: 155,
    waterDemandCategory: "low",
    estimatedIrrigationRequirementsMm: 280, // 2 - 3 irrigations
    soilSuitability: ["sandy_loam", "loam", "clay_loam"],
    salinityTolerance: "tolerant",
    precedingCropCompatibility: ["kharif_maize", "paddy_dsr"],
    benefits: [
      "Requires only 250–300 mm water (2–3 irrigations), using ~30% less water than wheat",
      "Harvests in mid-March, escaping late March terminal heatwaves and freeing the field early for summer pulses",
      "Deep taproot scavenges moisture and nutrients from deeper soil profiles",
      "Breaks continuous cereal monoculture disease and weed complexes",
    ],
    limitations: [
      "Aphid (Lipaphis erysimi) susceptibility during flowering and pod development",
      "Susceptible to frost/cold injury during December–January cold waves",
      "Early sowing requirement (October) requires an early-maturing preceding crop (cannot follow long-duration puddled rice)",
    ],
    evidence: [AGRONOMIC_EVIDENCE.PAU_RABI_MUSTARD],
    unknownAttributes: [
      "Localized oil content response to late-season temperature anomalies",
    ],
  },
};

import { InputCostBreakdown, PriceBenchmarkType, SeasonType } from "@/types";

export interface CropEconomicBenchmark {
  cropId: string;
  cropName: string;
  season: SeasonType;
  referenceYieldQuintalsPerHa: number;
  yieldRangeQuintalsPerHa: { min: number; max: number };
  mspBenchmarkInrPerQuintal: number;
  marketingSeason: string;
  referencePriceInrPerQuintal: number;
  priceType: PriceBenchmarkType;
  costBreakdown: InputCostBreakdown;
  byproductRevenueInrPerHa: number;
  nitrogenCreditInrPerHa: number;
  provenance: {
    source: string;
    referencePeriod: string;
    isVerifiedMsp: boolean;
    notes: string;
  };
}

/**
 * Curated Punjab Agricultural Cost & Revenue Benchmarks.
 * Grounded in CACP (Commission for Agricultural Costs and Prices, GoI) Reports on Price Policy (2024-25)
 * and PAU (Punjab Agricultural University) Cost of Cultivation and Farm Management Studies.
 *
 * All figures reflect operational cultivation costs (A2 + Family Labour proxy) per hectare in Punjab.
 */
export const PUNJAB_ECONOMIC_BENCHMARKS: Record<string, CropEconomicBenchmark> = {
  paddy_transplanted: {
    cropId: "paddy_transplanted",
    cropName: "Puddled Transplanted Rice (Paddy)",
    season: "kharif",
    referenceYieldQuintalsPerHa: 70.0, // ~28.3 quintals/acre
    yieldRangeQuintalsPerHa: { min: 62.0, max: 78.0 },
    mspBenchmarkInrPerQuintal: 2300, // Kharif Marketing Season (KMS) 2024-25 MSP for Common Paddy
    marketingSeason: "KMS 2024-25",
    referencePriceInrPerQuintal: 2300, // Government procurement at MSP is assured in Punjab
    priceType: "msp_benchmark",
    costBreakdown: {
      seedsInrPerHa: 1600, // Certified hybrid/varietal nursery seed
      fertilizersInrPerHa: 8500, // Urea, DAP, Zinc Sulphate
      plantProtectionInrPerHa: 4800, // Herbicides, insecticides, fungicides
      machineryLabourInrPerHa: 38600, // Puddling, nursery raising, manual transplanting labour, combine harvest
      irrigationEnergyInrPerHa: 2500, // Subsidized tubewell maintenance & power baseline
      miscellaneousInrPerHa: 4500, // Transport to mandi, interest on working capital
      totalInrPerHa: 60500,
    },
    byproductRevenueInrPerHa: 0, // Paddy straw currently yields negligible net farm-gate value in Punjab
    nitrogenCreditInrPerHa: 0,
    provenance: {
      source: "CACP Price Policy for Kharif Crops 2024-25 & PAU Farm Management Guidelines",
      referencePeriod: "2024-25 Kharif Marketing Season",
      isVerifiedMsp: true,
      notes: "MSP procurement is near 100% in Punjab mandis; cost includes manual transplanting labour (~₹8,500/ha).",
    },
  },

  paddy_dsr: {
    cropId: "paddy_dsr",
    cropName: "Direct-Seeded Rice (DSR)",
    season: "kharif",
    referenceYieldQuintalsPerHa: 65.0, // ~26.3 quintals/acre
    yieldRangeQuintalsPerHa: { min: 58.0, max: 72.0 },
    mspBenchmarkInrPerQuintal: 2300, // Same MSP as common paddy
    marketingSeason: "KMS 2024-25",
    referencePriceInrPerQuintal: 2300,
    priceType: "msp_benchmark",
    costBreakdown: {
      seedsInrPerHa: 1900, // Direct drilling seed rate (20-25 kg/ha)
      fertilizersInrPerHa: 9200, // Urea, DAP, Ferrous Sulphate foliar sprays
      plantProtectionInrPerHa: 6400, // Weed management (pre + post emergence weedicides)
      machineryLabourInrPerHa: 27500, // Laser leveling, seed drill, combine harvest; saves nursery & transplanting
      irrigationEnergyInrPerHa: 2000, // 15-20% lower pumping hours than puddled rice
      miscellaneousInrPerHa: 4500,
      totalInrPerHa: 51500,
    },
    byproductRevenueInrPerHa: 0,
    nitrogenCreditInrPerHa: 0,
    provenance: {
      source: "PAU Guidelines for Direct Seeded Rice (DSR) & CACP Price Policy 2024-25",
      referencePeriod: "2024-25 Kharif Season",
      isVerifiedMsp: true,
      notes: "Saves ~₹9,000/ha in nursery preparation and manual transplanting; weed management cost is higher.",
    },
  },

  bread_wheat: {
    cropId: "bread_wheat",
    cropName: "Rabi Bread Wheat",
    season: "rabi",
    referenceYieldQuintalsPerHa: 50.0, // ~20.2 quintals/acre
    yieldRangeQuintalsPerHa: { min: 44.0, max: 56.0 },
    mspBenchmarkInrPerQuintal: 2275, // Rabi Marketing Season (RMS) 2024-25 MSP
    marketingSeason: "RMS 2024-25",
    referencePriceInrPerQuintal: 2275, // High MSP procurement fidelity in Punjab
    priceType: "msp_benchmark",
    costBreakdown: {
      seedsInrPerHa: 3600, // Certified seed (100 kg/ha)
      fertilizersInrPerHa: 7600, // Urea, DAP, biofertilizers
      plantProtectionInrPerHa: 3400, // Phalaris minor weedicides, fungicide
      machineryLabourInrPerHa: 23900, // Smart Seeder/Happy Seeder, harvesting, threshing
      irrigationEnergyInrPerHa: 1500, // 4-5 irrigations tubewell baseline
      miscellaneousInrPerHa: 4000,
      totalInrPerHa: 44000,
    },
    byproductRevenueInrPerHa: 12000, // Wheat straw (bhusa/turi) has high commercial livestock demand (~₹240/quintal)
    nitrogenCreditInrPerHa: 0,
    provenance: {
      source: "CACP Price Policy for Rabi Crops 2024-25 & PAU Cost of Cultivation Studies",
      referencePeriod: "2024-25 Rabi Season",
      isVerifiedMsp: true,
      notes: "Wheat straw (bhusa) provides dependable secondary revenue (~₹12,000/ha) in northwest India.",
    },
  },

  kharif_maize: {
    cropId: "kharif_maize",
    cropName: "Kharif Grain Maize",
    season: "kharif",
    referenceYieldQuintalsPerHa: 52.0, // ~21.0 quintals/acre
    yieldRangeQuintalsPerHa: { min: 45.0, max: 60.0 },
    mspBenchmarkInrPerQuintal: 2225, // KMS 2024-25 MSP
    marketingSeason: "KMS 2024-25",
    referencePriceInrPerQuintal: 2050, // Open market price discount: MSP procurement is limited for maize in Punjab
    priceType: "market_average",
    costBreakdown: {
      seedsInrPerHa: 4600, // Single-cross hybrid seed (PMH 13/PMH 1)
      fertilizersInrPerHa: 7800, // Urea, DAP, MOP, Zinc
      plantProtectionInrPerHa: 4200, // Fall Armyworm & weed management
      machineryLabourInrPerHa: 21400, // Ridge sowing, de-tasseling, inter-culture, combine harvest
      irrigationEnergyInrPerHa: 1000, // ~4-5 irrigations; 60% lower pumping energy than paddy
      miscellaneousInrPerHa: 3500,
      totalInrPerHa: 42500,
    },
    byproductRevenueInrPerHa: 2500, // Stover/stalk residue used as fodder/biomass
    nitrogenCreditInrPerHa: 0,
    provenance: {
      source: "CACP Price Policy for Kharif Crops 2024-25 & Punjab Mandi Board Historical Trends",
      referencePeriod: "2024-25 Kharif Season",
      isVerifiedMsp: false,
      notes: "MSP is ₹2,225/q; however, open market realization typically averages ₹1,950–₹2,150/q due to limited state procurement.",
    },
  },

  rabi_mustard: {
    cropId: "rabi_mustard",
    cropName: "Rabi Mustard / Raya",
    season: "rabi",
    referenceYieldQuintalsPerHa: 20.0, // ~8.1 quintals/acre
    yieldRangeQuintalsPerHa: { min: 16.0, max: 24.0 },
    mspBenchmarkInrPerQuintal: 5650, // RMS 2024-25 MSP
    marketingSeason: "RMS 2024-25",
    referencePriceInrPerQuintal: 5650, // Strong edible oil demand maintains market price near or above MSP
    priceType: "msp_benchmark",
    costBreakdown: {
      seedsInrPerHa: 1200, // Low seed rate (3.5-4.0 kg/ha)
      fertilizersInrPerHa: 5400, // Single Super Phosphate (Sulphur source) & Urea
      plantProtectionInrPerHa: 2800, // Aphid scouting & targeted management
      machineryLabourInrPerHa: 14600, // Line sowing, thinning, threshing
      irrigationEnergyInrPerHa: 800, // 2-3 light irrigations only
      miscellaneousInrPerHa: 3000,
      totalInrPerHa: 27800,
    },
    byproductRevenueInrPerHa: 1500, // Mustard stalks/husk
    nitrogenCreditInrPerHa: 0,
    provenance: {
      source: "CACP Price Policy for Rabi Crops 2024-25 & PAU Raya Cultivation Guidelines",
      referencePeriod: "2024-25 Rabi Season",
      isVerifiedMsp: true,
      notes: "High return-to-cost ratio due to low water and fertilizer inputs; oilseed deficit in India supports strong market prices.",
    },
  },

  summer_moong: {
    cropId: "summer_moong",
    cropName: "Summer Moong (Greengram)",
    season: "zaid",
    referenceYieldQuintalsPerHa: 11.0, // ~4.5 quintals/acre
    yieldRangeQuintalsPerHa: { min: 8.5, max: 13.5 },
    mspBenchmarkInrPerQuintal: 8682, // KMS 2024-25 MSP
    marketingSeason: "KMS 2024-25",
    referencePriceInrPerQuintal: 7800, // Market average: summer catch crop often trades at slight discount to peak kharif pulse
    priceType: "market_average",
    costBreakdown: {
      seedsInrPerHa: 3200, // Short duration seed (SML 818, 30 kg/ha) + Rhizobium inoculant
      fertilizersInrPerHa: 3600, // Starter DAP dose only (fixes own nitrogen)
      plantProtectionInrPerHa: 3800, // Whitefly & pod borer management
      machineryLabourInrPerHa: 14200, // Zero-till drill sowing into wheat stubble, harvest
      irrigationEnergyInrPerHa: 1200, // 3-4 light summer irrigations
      miscellaneousInrPerHa: 2500,
      totalInrPerHa: 28500,
    },
    byproductRevenueInrPerHa: 0,
    nitrogenCreditInrPerHa: 1400, // Atmospheric N fixation credits ~35 kg N/ha, saving ~1.5 bags of urea for subsequent kharif crop
    provenance: {
      source: "CACP Price Policy for Kharif Crops 2024-25 & PAU Summer Moong Recommendations",
      referencePeriod: "2024-25 Zaid/Summer Season",
      isVerifiedMsp: false,
      notes: "MSP is ₹8,682/q; market realization typically averages ₹7,500–₹8,200/q. Atmospheric N credit reduces fertilizer cost in succeeding crop.",
    },
  },
};

import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../app/api/rotations/route";
import {
  calculateCropEconomics,
  calculateRotationEconomics,
} from "../src/engine/economics";
import { compareCropRotation } from "../src/engine/comparison";
import { CANDIDATE_ROTATIONS } from "../src/agronomy/rotations";
import { PUNJAB_ECONOMIC_BENCHMARKS } from "../src/agronomy/economicBenchmarks";
import { MOCK_CLIMATE_INDICATORS_LUDHIANA } from "../src/fixtures/climate.mock";
import { RotationFarmerContext } from "../src/types";

describe("Milestone 1C: Agricultural Economic Intelligence Engine", () => {
  const riceWheat = CANDIDATE_ROTATIONS.find((r) => r.id === "rotation_rice_wheat")!;
  const dsrWheat = CANDIDATE_ROTATIONS.find((r) => r.id === "rotation_dsr_wheat")!;
  const maizeWheat = CANDIDATE_ROTATIONS.find((r) => r.id === "rotation_maize_wheat")!;
  const riceWheatMoong = CANDIDATE_ROTATIONS.find((r) => r.id === "rotation_rice_wheat_moong")!;
  const maizeMustardMoong = CANDIDATE_ROTATIONS.find((r) => r.id === "rotation_maize_mustard_moong")!;

  const standardProfile: RotationFarmerContext = {
    soilTexture: "loam",
    irrigationSource: "tubewell_deep",
  };

  describe("Phase 2 — Crop Economic Benchmarks & Calculations", () => {
    it("calculates baseline puddled paddy economics accurately from CACP/PAU benchmarks", () => {
      const paddyEcon = calculateCropEconomics("paddy_transplanted", standardProfile);

      expect(paddyEcon.cropId).toBe("paddy_transplanted");
      expect(paddyEcon.yieldQuintalsPerHa).toBe(70.0);
      expect(paddyEcon.sellingPriceInrPerQuintal).toBe(2300); // KMS 2024-25 MSP
      expect(paddyEcon.priceType).toBe("msp_benchmark");

      // Gross revenue = 70 * 2300 = 161000
      expect(paddyEcon.grossRevenueInrPerHa).toBe(161000);
      expect(paddyEcon.costOfCultivationInrPerHa).toBe(60500);

      // Net return = 161000 - 60500 = 100500
      expect(paddyEcon.netReturnInrPerHa).toBe(100500);

      // Break-even price = 60500 / 70 = ~864 INR/q
      expect(paddyEcon.breakEvenPriceInrPerQuintal).toBe(864);
      // Break-even yield = 60500 / 2300 = ~26.3 q/ha
      expect(paddyEcon.breakEvenYieldQuintalsPerHa).toBe(26.3);

      expect(paddyEcon.benefitCostRatio).toBeGreaterThan(2.0);

      // Cost breakdown verification
      expect(paddyEcon.costBreakdown.seedsInrPerHa).toBe(1600);
      expect(paddyEcon.costBreakdown.fertilizersInrPerHa).toBe(8500);
      expect(paddyEcon.costBreakdown.plantProtectionInrPerHa).toBe(4800);
      expect(paddyEcon.costBreakdown.machineryLabourInrPerHa).toBe(38600);
      expect(paddyEcon.costBreakdown.irrigationEnergyInrPerHa).toBe(2500);
    });

    it("calculates rabi wheat economics including secondary straw/bhusa value", () => {
      const wheatEcon = calculateCropEconomics("bread_wheat", standardProfile);

      expect(wheatEcon.yieldQuintalsPerHa).toBe(50.0);
      expect(wheatEcon.sellingPriceInrPerQuintal).toBe(2275); // RMS 2024-25 MSP

      // Gross revenue = (50 * 2275) + 12000 (bhusa) = 113750 + 12000 = 125750
      expect(wheatEcon.grossRevenueInrPerHa).toBe(125750);
      expect(wheatEcon.costOfCultivationInrPerHa).toBe(44000);
      expect(wheatEcon.netReturnInrPerHa).toBe(81750);

      // Break even price accounts for byproduct value: (44000 - 12000) / 50 = 640 INR/q
      expect(wheatEcon.breakEvenPriceInrPerQuintal).toBe(640);
    });

    it("transparently reflects market price discount for kharif maize", () => {
      const maizeEcon = calculateCropEconomics("kharif_maize", standardProfile);

      expect(maizeEcon.mspBenchmarkInrPerQuintal).toBe(2225);
      expect(maizeEcon.sellingPriceInrPerQuintal).toBe(2050); // Market realization discount
      expect(maizeEcon.priceType).toBe("market_average");

      expect(maizeEcon.grossRevenueInrPerHa).toBe(52 * 2050 + 2500);
      expect(maizeEcon.costOfCultivationInrPerHa).toBe(42500);
    });

    it("credits biological nitrogen fixation in summer moong", () => {
      const moongEcon = calculateCropEconomics("summer_moong", standardProfile);

      expect(moongEcon.nitrogenCreditInrPerHa).toBe(1400);
      expect(moongEcon.priceType).toBe("market_average");

      // Net cost to recover deducts nitrogen credit
      const expectedNetCost = 28500 - 1400;
      expect(moongEcon.breakEvenPriceInrPerQuintal).toBe(Math.round(expectedNetCost / 11.0));
    });
  });

  describe("Phase 3 — Rotation Economics & Baseline Comparison", () => {
    it("evaluates baseline rice-wheat rotation economics correctly", () => {
      const baselineEcon = calculateRotationEconomics(riceWheat, standardProfile);

      expect(baselineEcon.rotationId).toBe("rotation_rice_wheat");
      expect(baselineEcon.cropEconomics.length).toBe(2);

      // Total cost = 60500 + 44000 = 104500
      expect(baselineEcon.totalCultivationCostInrPerHa).toBe(104500);
      // Total gross = 161000 + 125750 = 286750
      expect(baselineEcon.grossRevenueInrPerHa).toBe(286750);
      // Total net = 286750 - 104500 = 182250
      expect(baselineEcon.netReturnInrPerHa).toBe(182250);

      // Combined input breakdown
      expect(baselineEcon.combinedCostBreakdown.machineryLabourInrPerHa).toBe(38600 + 23900);
      expect(baselineEcon.combinedCostBreakdown.fertilizersInrPerHa).toBe(8500 + 7600);
      expect(baselineEcon.combinedCostBreakdown.irrigationEnergyInrPerHa).toBe(2500 + 1500);
      expect(baselineEcon.comparisonToBaseline).toBeUndefined(); // Baseline has no self-delta
    });

    it("computes economic delta for maize-wheat alternative vs baseline rice-wheat", () => {
      const baselineEcon = calculateRotationEconomics(riceWheat, standardProfile);
      const maizeWheatEcon = calculateRotationEconomics(maizeWheat, standardProfile, baselineEcon);

      expect(maizeWheatEcon.comparisonToBaseline).toBeDefined();
      const delta = maizeWheatEcon.comparisonToBaseline!;

      // Cultivation costs should be lower for maize-wheat (saves transplanting & water pumping)
      expect(maizeWheatEcon.totalCultivationCostInrPerHa).toBeLessThan(baselineEcon.totalCultivationCostInrPerHa);
      expect(delta.costDeltaInrPerHa).toBeLessThan(0);
      expect(delta.costDeltaPercent).toBeLessThan(0);

      // Water energy savings must be positive
      expect(delta.waterEnergySavingsInrPerHa).toBeGreaterThan(0);

      // Net return difference transparently reflects market price realization
      expect(delta.netReturnDeltaInrPerHa).toBe(maizeWheatEcon.netReturnInrPerHa - baselineEcon.netReturnInrPerHa);
    });

    it("evaluates highly diversified maize-mustard-moong rotation with superior net returns", () => {
      const baselineEcon = calculateRotationEconomics(riceWheat, standardProfile);
      const mmmEcon = calculateRotationEconomics(maizeMustardMoong, standardProfile, baselineEcon);

      expect(mmmEcon.cropEconomics.length).toBe(3);
      expect(mmmEcon.comparisonToBaseline).toBeDefined();

      // Triple crop achieves higher net return due to high mustard and moong value
      expect(mmmEcon.netReturnInrPerHa).toBeGreaterThan(baselineEcon.netReturnInrPerHa);
      expect(mmmEcon.comparisonToBaseline!.netReturnDeltaInrPerHa).toBeGreaterThan(0);
      expect(mmmEcon.benefitCostRatio).toBeGreaterThan(baselineEcon.benefitCostRatio);
    });
  });

  describe("Phase 3 & 5 — Sensitivity Analysis & Scenarios", () => {
    it("generates deterministic yield, price, and cost sensitivity curves", () => {
      const econ = calculateRotationEconomics(maizeWheat, standardProfile);

      expect(econ.sensitivityAnalysis.yieldSensitivity.length).toBe(5); // -20%, -10%, 0%, 10%, 20%
      expect(econ.sensitivityAnalysis.priceSensitivity.length).toBe(5);
      expect(econ.sensitivityAnalysis.costSensitivity.length).toBe(4); // -10%, 0%, 10%, 20%

      // Reference point delta = 0 should have netReturnChange = 0
      const refYield = econ.sensitivityAnalysis.yieldSensitivity.find((p) => p.deltaPercent === 0);
      expect(refYield?.netReturnInrPerHa).toBe(econ.netReturnInrPerHa);
      expect(refYield?.netReturnChangeInrPerHa).toBe(0);

      // -20% yield should yield strictly lower net return
      const minus20Yield = econ.sensitivityAnalysis.yieldSensitivity.find((p) => p.deltaPercent === -20);
      expect(minus20Yield!.netReturnInrPerHa).toBeLessThan(econ.netReturnInrPerHa);

      // +20% price should yield strictly higher net return
      const plus20Price = econ.sensitivityAnalysis.priceSensitivity.find((p) => p.deltaPercent === 20);
      expect(plus20Price!.netReturnInrPerHa).toBeGreaterThan(econ.netReturnInrPerHa);

      // +20% cost should reduce net return
      const plus20Cost = econ.sensitivityAnalysis.costSensitivity.find((p) => p.deltaPercent === 20);
      expect(plus20Cost!.netReturnInrPerHa).toBeLessThan(econ.netReturnInrPerHa);
    });

    it("generates conservative, reference, and optimistic scenarios with transparent assumptions", () => {
      const econ = calculateRotationEconomics(riceWheat, standardProfile);

      expect(econ.scenarios.conservative).toBeDefined();
      expect(econ.scenarios.reference).toBeDefined();
      expect(econ.scenarios.optimistic).toBeDefined();

      expect(econ.scenarios.conservative.netReturnInrPerHa).toBeLessThan(econ.scenarios.reference.netReturnInrPerHa);
      expect(econ.scenarios.optimistic.netReturnInrPerHa).toBeGreaterThan(econ.scenarios.reference.netReturnInrPerHa);

      expect(econ.scenarios.conservative.assumptions).toContain("-10%");
      expect(econ.scenarios.optimistic.assumptions).toContain("+10%");
    });
  });

  describe("Phase 4 — Farmer Context Adjustments", () => {
    it("adjusts irrigation energy costs for shallow tubewells experiencing deep water tables", () => {
      const deepWaterShallowProfile: RotationFarmerContext = {
        soilTexture: "loam",
        irrigationSource: "tubewell_shallow",
        groundwaterDepthMeters: 22,
      };

      const econStandard = calculateCropEconomics("paddy_transplanted", standardProfile);
      const econShallow = calculateCropEconomics("paddy_transplanted", deepWaterShallowProfile);

      // Shallow tubewell at >15m depth has higher energy/maintenance cost (+50%)
      expect(econShallow.costBreakdown.irrigationEnergyInrPerHa).toBeGreaterThan(
        econStandard.costBreakdown.irrigationEnergyInrPerHa
      );
      expect(econShallow.costBreakdown.irrigationEnergyInrPerHa).toBe(Math.round(2500 * 1.5));
    });

    it("eliminates irrigation energy cost under rainfed conditions", () => {
      const rainfedProfile: RotationFarmerContext = {
        soilTexture: "loam",
        irrigationSource: "rainfed_only",
      };

      const econRainfed = calculateCropEconomics("kharif_maize", rainfedProfile);
      expect(econRainfed.costBreakdown.irrigationEnergyInrPerHa).toBe(0);
    });

    it("adds raised bed machinery expense for kharif maize on clay loam", () => {
      const clayLoamProfile: RotationFarmerContext = {
        soilTexture: "clay_loam",
        irrigationSource: "tubewell_deep",
      };

      const econLoam = calculateCropEconomics("kharif_maize", standardProfile);
      const econClay = calculateCropEconomics("kharif_maize", clayLoamProfile);

      expect(econClay.costBreakdown.machineryLabourInrPerHa).toBe(
        econLoam.costBreakdown.machineryLabourInrPerHa + 1200
      );
    });

    it("increases fertilizer cost on coarse sandy soil due to leaching mitigation", () => {
      const sandyProfile: RotationFarmerContext = {
        soilTexture: "sandy",
        irrigationSource: "tubewell_deep",
      };

      const econLoam = calculateCropEconomics("bread_wheat", standardProfile);
      const econSandy = calculateCropEconomics("bread_wheat", sandyProfile);

      expect(econSandy.costBreakdown.fertilizersInrPerHa).toBe(
        Math.round(econLoam.costBreakdown.fertilizersInrPerHa * 1.1)
      );
    });
  });

  describe("Robustness, Missing & Extreme Input Handling", () => {
    it("handles zero and negative crop yield/price overrides safely without NaN or division by zero", () => {
      const zeroCrop = calculateCropEconomics("kharif_maize", standardProfile, {
        yieldOverrides: { kharif_maize: 0 },
        priceOverrides: { kharif_maize: 0 },
      });

      expect(zeroCrop.yieldQuintalsPerHa).toBe(0);
      expect(zeroCrop.sellingPriceInrPerQuintal).toBe(0);
      expect(zeroCrop.breakEvenPriceInrPerQuintal).toBe(0); // Guarded
      expect(zeroCrop.breakEvenYieldQuintalsPerHa).toBe(0); // Guarded
      expect(isNaN(zeroCrop.netReturnInrPerHa)).toBe(false);
      expect(isNaN(zeroCrop.benefitCostRatio)).toBe(false);
    });

    it("clamps negative override inputs to zero", () => {
      const clampedCrop = calculateCropEconomics("bread_wheat", standardProfile, {
        yieldOverrides: { bread_wheat: -25 },
        priceOverrides: { bread_wheat: -500 },
      });

      expect(clampedCrop.yieldQuintalsPerHa).toBe(0);
      expect(clampedCrop.sellingPriceInrPerQuintal).toBe(0);
    });
  });

  describe("Phase 6 — API Integration & Backwards Compatibility", () => {
    it("returns complete economic intelligence within GET /api/rotations response", async () => {
      const req = new NextRequest("http://localhost:3000/api/rotations?lat=30.90&lon=75.85&mock=true");
      const res = await GET(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);

      // Verify baseline economics
      const baselineEcon = json.data.baseline.economics;
      expect(baselineEcon).toBeDefined();
      expect(baselineEcon.totalCultivationCostInrPerHa).toBeGreaterThan(50000);
      expect(baselineEcon.grossRevenueInrPerHa).toBeGreaterThan(150000);
      expect(baselineEcon.cropEconomics.length).toBe(2);
      expect(baselineEcon.provenance.dataSource).toContain("CACP");

      // Verify alternative economics and comparison delta
      const altMaize = json.data.alternatives.find((a: any) => a.rotationId === "rotation_maize_wheat");
      expect(altMaize).toBeDefined();
      expect(altMaize.economics).toBeDefined();
      expect(altMaize.economics.comparisonToBaseline).toBeDefined();
      expect(altMaize.economics.comparisonToBaseline.costDeltaInrPerHa).toBeLessThan(0);
      expect(altMaize.economics.scenarios.conservative).toBeDefined();
      expect(altMaize.economics.sensitivityAnalysis.yieldSensitivity.length).toBe(5);

      // Verify existing fields remain completely intact (backwards compatibility)
      expect(json.data.location).toBeDefined();
      expect(json.data.climateContext).toBeDefined();
      expect(json.data.provenance).toBeDefined();
      expect(json.data.provenance.agronomicEvidenceSources.some((s: string) => s.includes("CACP"))).toBe(true);
      expect(json.data.scientificDisclaimer).toBeDefined();
      expect(json.data.baseline.tradeoffs.length).toBe(5);
      expect(json.data.baseline.suitabilityStatus).toBe("conditionally_suitable");
    });
  });
});

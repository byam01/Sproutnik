import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../app/api/rotations/route";
import { compareCropRotation } from "../src/engine/comparison";
import { CANDIDATE_ROTATIONS } from "../src/agronomy/rotations";
import { MOCK_CLIMATE_INDICATORS_LUDHIANA } from "../src/fixtures/climate.mock";
import { RotationFarmerContext } from "../src/types";

describe("Agricultural Intelligence & Explainable Recommendations", () => {
  const riceWheat = CANDIDATE_ROTATIONS.find((r) => r.id === "rotation_rice_wheat")!;
  const dsrWheat = CANDIDATE_ROTATIONS.find((r) => r.id === "rotation_dsr_wheat")!;
  const maizeWheat = CANDIDATE_ROTATIONS.find((r) => r.id === "rotation_maize_wheat")!;
  const maizeMustardMoong = CANDIDATE_ROTATIONS.find((r) => r.id === "rotation_maize_mustard_moong")!;

  const standardLoamProfile: RotationFarmerContext = {
    soilTexture: "loam",
    irrigationSource: "tubewell_deep",
  };

  describe("Baseline Rice–Wheat Explainability & Trade-offs", () => {
    it("rates feasible rice-wheat as conditionally_suitable with transparent groundwater and hardpan rationales", () => {
      const result = compareCropRotation(riceWheat, MOCK_CLIMATE_INDICATORS_LUDHIANA, standardLoamProfile);

      expect(result.isBaseline).toBe(true);
      expect(result.feasibility.isFeasible).toBe(true);
      expect(result.suitabilityStatus).toBe("conditionally_suitable");
      expect(result.criticalLimitations).toEqual([]);

      // Recommendation Rationales
      expect(result.recommendation).toBeDefined();
      expect(result.recommendation?.suitabilityStatus).toBe("conditionally_suitable");
      expect(result.recommendation?.overallRationale).toContain("conditionally suitable");
      expect(result.recommendation?.overallRationale).toContain("groundwater overdraft");
      expect(result.recommendation?.overallRationale).toContain("subsoil compaction");

      // Actionable steps
      expect(result.recommendation?.actionableNextSteps.length).toBeGreaterThanOrEqual(3);
      expect(
        result.recommendation?.actionableNextSteps.some((step) => step.toLowerCase().includes("tensiometer"))
      ).toBe(true);
      expect(
        result.recommendation?.actionableNextSteps.some((step) => step.toLowerCase().includes("happy seeder"))
      ).toBe(true);

      // Manageable risks with mitigation guidance
      expect(result.manageableRisks?.length).toBeGreaterThan(0);
      const waterRisk = result.manageableRisks?.find((r) => r.category === "water");
      expect(waterRisk).toBeDefined();
      expect(waterRisk?.mitigationGuidance).toContain("tensiometer");

      const soilRisk = result.manageableRisks?.find((r) => r.category === "soil");
      expect(soilRisk?.title).toContain("Hardpan");
      expect(soilRisk?.mitigationGuidance).toContain("chisel plowing");

      const pestRisk = result.manageableRisks?.find((r) => r.category === "pest_disease");
      expect(pestRisk?.title).toContain("Phalaris Minor");
      expect(pestRisk?.mitigationGuidance).toContain("pendimethalin");
    });

    it("identifies rice-wheat as unfeasible under rainfed-only conditions with explicit critical limitation", () => {
      const rainfedProfile: RotationFarmerContext = {
        soilTexture: "loam",
        irrigationSource: "rainfed_only",
      };

      const result = compareCropRotation(riceWheat, MOCK_CLIMATE_INDICATORS_LUDHIANA, rainfedProfile);

      expect(result.feasibility.isFeasible).toBe(false);
      expect(result.suitabilityStatus).toBe("unfeasible");
      expect(result.criticalLimitations?.length).toBeGreaterThan(0);
      expect(result.criticalLimitations?.[0]).toContain("rainfed-only");
      expect(result.recommendation?.overallRationale).toContain("agronomically unfeasible");
    });
  });

  describe("Alternative Rotations & Mitigation Guidance", () => {
    it("evaluates maize-wheat as highly_suitable on loam soil with ~58% water savings", () => {
      const result = compareCropRotation(maizeWheat, MOCK_CLIMATE_INDICATORS_LUDHIANA, standardLoamProfile);

      expect(result.suitabilityStatus).toBe("highly_suitable");
      expect(result.criticalLimitations).toEqual([]);
      expect(result.recommendation?.overallRationale).toContain("58%");
      expect(result.recommendation?.overallRationale).toContain("35-day window");

      // Verify actionable steps for maize-wheat
      expect(result.recommendation?.actionableNextSteps.length).toBeGreaterThanOrEqual(3);
      expect(
        result.recommendation?.actionableNextSteps.some((s) => s.includes("PMH 13") || s.includes("hybrid"))
      ).toBe(true);
      expect(
        result.recommendation?.actionableNextSteps.some((s) => s.includes("Fall Armyworm"))
      ).toBe(true);
    });

    it("evaluates maize-wheat on clay_loam as suitable_with_mitigation and prescribes ridge planting", () => {
      const clayLoamProfile: RotationFarmerContext = {
        soilTexture: "clay_loam",
        irrigationSource: "tubewell_deep",
      };

      const result = compareCropRotation(maizeWheat, MOCK_CLIMATE_INDICATORS_LUDHIANA, clayLoamProfile);

      expect(result.suitabilityStatus).toBe("suitable_with_mitigation");
      expect(result.recommendation?.soilSuitabilityRationale).toContain("Clay loam");
      expect(result.recommendation?.soilSuitabilityRationale).toContain("raised beds or ridges");

      // Manageable risk for waterlogging
      const waterloggingRisk = result.manageableRisks?.find((r) => r.title.includes("Waterlogging"));
      expect(waterloggingRisk).toBeDefined();
      expect(waterloggingRisk?.mitigationGuidance).toContain("raised beds");
    });

    it("evaluates DSR-wheat on coarse sandy soil as unfeasible due to iron chlorosis", () => {
      const sandyProfile: RotationFarmerContext = {
        soilTexture: "sandy",
        irrigationSource: "tubewell_deep",
      };

      const result = compareCropRotation(dsrWheat, MOCK_CLIMATE_INDICATORS_LUDHIANA, sandyProfile);

      expect(result.feasibility.isFeasible).toBe(false);
      expect(result.suitabilityStatus).toBe("unfeasible");
      expect(result.criticalLimitations?.some((l) => l.includes("iron chlorosis"))).toBe(true);
      expect(result.recommendation?.overallRationale).toContain("agronomically unfeasible");
    });

    it("evaluates DSR-wheat on loam as suitable_with_mitigation with weed and foliar Fe mitigations", () => {
      const result = compareCropRotation(dsrWheat, MOCK_CLIMATE_INDICATORS_LUDHIANA, standardLoamProfile);

      expect(result.feasibility.isFeasible).toBe(true);
      expect(result.suitabilityStatus).toBe("suitable_with_mitigation");

      const weedRisk = result.manageableRisks?.find((r) => r.title.includes("Weed Competition"));
      expect(weedRisk).toBeDefined();
      expect(weedRisk?.mitigationGuidance).toContain("pendimethalin");

      const feRisk = result.manageableRisks?.find((r) => r.title.includes("Iron Chlorosis"));
      expect(feRisk).toBeDefined();
      expect(feRisk?.mitigationGuidance).toContain("ferrous sulphate");

      expect(
        result.recommendation?.actionableNextSteps.some((s) => s.toLowerCase().includes("laser"))
      ).toBe(true);
    });

    it("evaluates maize-mustard-moong with aphid scouting and biological N2 fixation benefits", () => {
      const result = compareCropRotation(maizeMustardMoong, MOCK_CLIMATE_INDICATORS_LUDHIANA, standardLoamProfile);

      expect(result.suitabilityStatus).toBe("highly_suitable");
      expect(result.recommendation?.overallRationale).toContain("three botanical families");
      expect(result.recommendation?.overallRationale).toContain("atmospheric nitrogen");

      const aphidRisk = result.manageableRisks?.find((r) => r.title.includes("Aphid"));
      expect(aphidRisk).toBeDefined();
      expect(aphidRisk?.mitigationGuidance).toContain("thiamethoxam");

      expect(
        result.recommendation?.actionableNextSteps.some((s) => s.toLowerCase().includes("raya/mustard"))
      ).toBe(true);
    });
  });

  describe("Farmer Context Differentiation & Defaults", () => {
    it("transparently uses documented defaults when farmer context is omitted", () => {
      const result = compareCropRotation(maizeWheat, MOCK_CLIMATE_INDICATORS_LUDHIANA, undefined);

      expect(result.feasibility.isFeasible).toBe(true);
      expect(result.feasibility.warnings.some((w) => w.includes("Soil texture not specified"))).toBe(true);
      expect(result.feasibility.warnings.some((w) => w.includes("Irrigation source not specified"))).toBe(true);
      expect(result.recommendation?.soilSuitabilityRationale).toContain("farmer soil texture not specified");
      expect(result.recommendation?.irrigationSuitabilityRationale).toContain("irrigation source not specified");
    });

    it("adapts irrigation rationale to shallow tubewell depth risks", () => {
      const shallowDeepWaterProfile: RotationFarmerContext = {
        soilTexture: "loam",
        irrigationSource: "tubewell_shallow",
        groundwaterDepthMeters: 22,
      };

      const result = compareCropRotation(riceWheat, MOCK_CLIMATE_INDICATORS_LUDHIANA, shallowDeepWaterProfile);

      expect(result.recommendation?.irrigationSuitabilityRationale).toContain("suction limits");
      const shallowRisk = result.manageableRisks?.find((r) => r.title.includes("Shallow Tubewell"));
      expect(shallowRisk).toBeDefined();
      expect(shallowRisk?.mitigationGuidance).toContain("submersible");
    });

    it("adapts irrigation rationale to canal warabandi scheduling", () => {
      const canalProfile: RotationFarmerContext = {
        soilTexture: "loam",
        irrigationSource: "canal",
      };

      const result = compareCropRotation(maizeWheat, MOCK_CLIMATE_INDICATORS_LUDHIANA, canalProfile);

      expect(result.recommendation?.irrigationSuitabilityRationale).toContain("warabandi");
    });

    it("adapts irrigation rationale to conjunctive water management", () => {
      const conjunctiveProfile: RotationFarmerContext = {
        soilTexture: "loam",
        irrigationSource: "conjunctive",
      };

      const result = compareCropRotation(maizeWheat, MOCK_CLIMATE_INDICATORS_LUDHIANA, conjunctiveProfile);

      expect(result.recommendation?.irrigationSuitabilityRationale).toContain("salinity");
    });
  });

  describe("API Response Data Provenance & Modeling Disclosures", () => {
    it("returns comprehensive data provenance and modeling disclosure in GET /api/rotations", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/rotations?lat=30.90&lon=75.85&mock=true&soilTexture=sandy_loam&irrigationSource=canal"
      );
      const res = await GET(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);

      // Verify Provenance
      const provenance = json.data.provenance;
      expect(provenance).toBeDefined();
      expect(provenance.isMock).toBe(true);
      expect(provenance.climateObservationPeriod).toContain("2015");
      expect(provenance.agronomicEvidenceSources.some((src: string) => src.includes("Punjab Agricultural University"))).toBe(true);
      expect(provenance.agronomicEvidenceSources.some((src: string) => src.includes("CGWB"))).toBe(true);
      expect(provenance.modelingNotice).toContain("agronomic simulation models");
      expect(provenance.farmerContextApplied.soilTexture).toBe("sandy_loam");
      expect(provenance.farmerContextApplied.isSoilTextureReported).toBe(true);
      expect(provenance.farmerContextApplied.irrigationSource).toBe("canal");
      expect(provenance.farmerContextApplied.isIrrigationSourceReported).toBe(true);

      // Verify enriched baseline intelligence
      expect(json.data.baseline.suitabilityStatus).toBe("conditionally_suitable");
      expect(json.data.baseline.recommendation.actionableNextSteps.length).toBeGreaterThanOrEqual(3);
      expect(json.data.baseline.manageableRisks.length).toBeGreaterThan(0);

      // Verify alternative intelligence
      const altMaizeWheat = json.data.alternatives.find((a: any) => a.rotationId === "rotation_maize_wheat");
      expect(altMaizeWheat).toBeDefined();
      expect(altMaizeWheat.suitabilityStatus).toBe("highly_suitable");
      expect(altMaizeWheat.recommendation.actionableNextSteps.length).toBeGreaterThanOrEqual(3);
      expect(altMaizeWheat.criticalLimitations).toEqual([]);
    });

    it("correctly identifies unprovided farmer context flags in provenance", async () => {
      const req = new NextRequest("http://localhost:3000/api/rotations?lat=30.90&lon=75.85&mock=true");
      const res = await GET(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      const provenance = json.data.provenance;
      expect(provenance.farmerContextApplied.isSoilTextureReported).toBe(false);
      expect(provenance.farmerContextApplied.soilTexture).toContain("default assumption");
      expect(provenance.farmerContextApplied.isIrrigationSourceReported).toBe(false);
      expect(provenance.farmerContextApplied.irrigationSource).toContain("default assumption");
    });
  });
});

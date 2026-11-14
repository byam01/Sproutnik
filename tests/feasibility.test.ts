import { describe, expect, it } from "vitest";
import { evaluateRotationFeasibility } from "../src/engine/feasibility";
import { CANDIDATE_ROTATIONS } from "../src/agronomy/rotations";
import { CROPS_PUNJAB } from "../src/agronomy/crops";
import { RotationDefinition, RotationFarmerContext } from "../src/types";

describe("Stage A: Rotation Feasibility Engine", () => {
  const riceWheat = CANDIDATE_ROTATIONS.find((r) => r.id === "rotation_rice_wheat")!;
  const dsrWheat = CANDIDATE_ROTATIONS.find((r) => r.id === "rotation_dsr_wheat")!;
  const maizeWheat = CANDIDATE_ROTATIONS.find((r) => r.id === "rotation_maize_wheat")!;

  it("evaluates baseline rice-wheat as feasible with adequate tubewell irrigation", () => {
    const profile: RotationFarmerContext = {
      irrigationSource: "tubewell_deep",
      soilTexture: "clay_loam",
    };

    const result = evaluateRotationFeasibility(riceWheat, profile);
    expect(result.isFeasible).toBe(true);
    expect(result.rejectionReasons.length).toBe(0);
    expect(result.criteria.every((c) => c.passed)).toBe(true);
  });

  it("rejects puddled rice rotation under rainfed-only irrigation profile", () => {
    const rainfedProfile: RotationFarmerContext = {
      irrigationSource: "rainfed_only",
      soilTexture: "loam",
    };

    const result = evaluateRotationFeasibility(riceWheat, rainfedProfile);
    expect(result.isFeasible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.includes("rainfed-only"))).toBe(true);
  });

  it("rejects Direct-Seeded Rice (DSR) on sandy soil according to PAU guidelines", () => {
    const sandyProfile: RotationFarmerContext = {
      irrigationSource: "tubewell_deep",
      soilTexture: "sandy",
    };

    const result = evaluateRotationFeasibility(dsrWheat, sandyProfile);
    expect(result.isFeasible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.includes("iron chlorosis"))).toBe(true);
  });

  it("rejects rotation with impossible turnaround gap (< 7 days)", () => {
    const impossibleRotation: RotationDefinition = {
      id: "impossible_short_turnaround",
      name: "Impossible Turnaround Rotation",
      description: "Test rotation with 3 days between crops",
      crops: [CROPS_PUNJAB.paddy_transplanted, CROPS_PUNJAB.bread_wheat],
      cropSequence: ["paddy_transplanted", "bread_wheat"],
      turnaroundDays: [3, 45], // 3 days turnaround fails!
      evidence: [],
    };

    const result = evaluateRotationFeasibility(impossibleRotation);
    expect(result.isFeasible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.includes("Insufficient turnaround gap"))).toBe(true);
  });

  it("handles missing farmer profile gracefully with documented default assumptions", () => {
    const result = evaluateRotationFeasibility(maizeWheat, undefined);
    expect(result.isFeasible).toBe(true);
    expect(result.warnings.some((w) => w.includes("Soil texture not specified"))).toBe(true);
  });
});

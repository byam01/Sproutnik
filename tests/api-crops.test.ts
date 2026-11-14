import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET, getCropRotationSupport, ENGINE_EVALUATED_ROTATION_IDS } from "../app/api/crops/route";
import { CROPS_PUNJAB } from "../src/agronomy/crops";
import { CANDIDATE_ROTATIONS } from "../src/agronomy/rotations";
import { RotationDefinition } from "../src/types";

describe("GET /api/crops — Authoritative Crop Catalog API", () => {
  it("returns all 6 authoritative crops with rotation support metadata", async () => {
    const req = new NextRequest("http://localhost:3000/api/crops");
    const res = await GET(req);

    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.length).toBe(6);
    expect(json.meta.total).toBe(6);
    expect(json.meta.region).toContain("Punjab");

    const expectedCropIds = Object.keys(CROPS_PUNJAB);
    for (const crop of json.data) {
      expect(expectedCropIds).toContain(crop.id);
      expect(crop.rotationSupport).toBeDefined();
      expect(crop.rotationSupport.isEvaluatedInRotations).toBe(true);
      expect(crop.rotationSupport.candidateRotationIds.length).toBeGreaterThan(0);
    }
  });

  it("filters crops by season: kharif", async () => {
    const req = new NextRequest("http://localhost:3000/api/crops?season=kharif");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);

    const kharifIds = json.data.map((c: { id: string }) => c.id);
    expect(kharifIds).toContain("paddy_transplanted");
    expect(kharifIds).toContain("paddy_dsr");
    expect(kharifIds).toContain("kharif_maize");
    expect(kharifIds).not.toContain("bread_wheat");
    expect(json.data.every((c: { season: string }) => c.season === "kharif")).toBe(true);
  });

  it("filters crops by season: rabi", async () => {
    const req = new NextRequest("http://localhost:3000/api/crops?season=rabi");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);

    const rabiIds = json.data.map((c: { id: string }) => c.id);
    expect(rabiIds).toContain("bread_wheat");
    expect(rabiIds).toContain("rabi_mustard");
    expect(rabiIds).not.toContain("paddy_transplanted");
    expect(json.data.every((c: { season: string }) => c.season === "rabi")).toBe(true);
  });

  it("filters crops by season: zaid (and alias summer)", async () => {
    const reqZaid = new NextRequest("http://localhost:3000/api/crops?season=zaid");
    const resZaid = await GET(reqZaid);
    expect(resZaid.status).toBe(200);
    const jsonZaid = await resZaid.json();
    expect(jsonZaid.success).toBe(true);
    expect(jsonZaid.data.length).toBe(1);
    expect(jsonZaid.data[0].id).toBe("summer_moong");

    const reqSummer = new NextRequest("http://localhost:3000/api/crops?season=summer");
    const resSummer = await GET(reqSummer);
    expect(resSummer.status).toBe(200);
    const jsonSummer = await resSummer.json();
    expect(jsonSummer.success).toBe(true);
    expect(jsonSummer.data.length).toBe(1);
    expect(jsonSummer.data[0].id).toBe("summer_moong");
  });

  it("returns 400 for invalid season filter", async () => {
    const req = new NextRequest("http://localhost:3000/api/crops?season=autumn");
    const res = await GET(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("INVALID_SEASON_FILTER");
    expect(json.error.message).toContain("autumn");
  });

  describe("Crop Rotation Support Verification (Supported vs Unsupported Cases)", () => {
    it("confirms engine-evaluated rotation support for all 6 authoritative Punjab crops", () => {
      // 1. paddy_transplanted
      const paddyTrans = getCropRotationSupport("paddy_transplanted");
      expect(paddyTrans.isEvaluatedInRotations).toBe(true);
      expect(paddyTrans.candidateRotationIds).toEqual([
        "rotation_rice_wheat",
        "rotation_rice_wheat_moong",
      ]);

      // 2. paddy_dsr
      const paddyDsr = getCropRotationSupport("paddy_dsr");
      expect(paddyDsr.isEvaluatedInRotations).toBe(true);
      expect(paddyDsr.candidateRotationIds).toEqual(["rotation_dsr_wheat"]);

      // 3. bread_wheat
      const wheat = getCropRotationSupport("bread_wheat");
      expect(wheat.isEvaluatedInRotations).toBe(true);
      expect(wheat.candidateRotationIds).toEqual([
        "rotation_rice_wheat",
        "rotation_dsr_wheat",
        "rotation_maize_wheat",
        "rotation_rice_wheat_moong",
      ]);

      // 4. kharif_maize
      const maize = getCropRotationSupport("kharif_maize");
      expect(maize.isEvaluatedInRotations).toBe(true);
      expect(maize.candidateRotationIds).toEqual([
        "rotation_maize_wheat",
        "rotation_maize_mustard_moong",
      ]);

      // 5. summer_moong
      const moong = getCropRotationSupport("summer_moong");
      expect(moong.isEvaluatedInRotations).toBe(true);
      expect(moong.candidateRotationIds).toEqual([
        "rotation_rice_wheat_moong",
        "rotation_maize_mustard_moong",
      ]);

      // 6. rabi_mustard
      const mustard = getCropRotationSupport("rabi_mustard");
      expect(mustard.isEvaluatedInRotations).toBe(true);
      expect(mustard.candidateRotationIds).toEqual(["rotation_maize_mustard_moong"]);
    });

    it("returns isEvaluatedInRotations = false and empty candidateRotationIds for unsupported crops", () => {
      // Crops not present in CROPS_PUNJAB
      expect(getCropRotationSupport("spring_sunflower")).toEqual({
        isEvaluatedInRotations: false,
        candidateRotationIds: [],
      });
      expect(getCropRotationSupport("potato_early")).toEqual({
        isEvaluatedInRotations: false,
        candidateRotationIds: [],
      });
      expect(getCropRotationSupport("cotton_bt")).toEqual({
        isEvaluatedInRotations: false,
        candidateRotationIds: [],
      });
      expect(getCropRotationSupport("")).toEqual({
        isEvaluatedInRotations: false,
        candidateRotationIds: [],
      });
    });

    it("does NOT infer support merely from a crop appearing in a candidate definition metadata without sequence inclusion", () => {
      // Mock rotation definition where bread_wheat is listed in `crops` metadata but omitted from `cropSequence`
      const incompleteRotation: RotationDefinition = {
        id: "rotation_rice_wheat",
        name: "Incomplete Test Rotation",
        cropSequence: ["paddy_transplanted"], // bread_wheat omitted from sequence!
        crops: [CROPS_PUNJAB.paddy_transplanted, CROPS_PUNJAB.bread_wheat],
        turnaroundDays: [15],
        description: "Test rotation missing sequence entry",
        evidence: [],
      };

      const support = getCropRotationSupport("bread_wheat", [incompleteRotation]);
      // Must NOT infer support merely from metadata presence in candidate definition
      expect(support.isEvaluatedInRotations).toBe(false);
      expect(support.candidateRotationIds).toEqual([]);
    });

    it("does NOT infer support for a candidate rotation that is not evaluated by the rotation engine", () => {
      // Mock candidate rotation with an un-evaluated rotation ID (outside ENGINE_EVALUATED_ROTATION_IDS)
      const unEvaluatedRotation: RotationDefinition = {
        id: "rotation_unsupported_prototype",
        name: "Prototype Experimental Rotation",
        cropSequence: ["paddy_transplanted", "bread_wheat"],
        crops: [CROPS_PUNJAB.paddy_transplanted, CROPS_PUNJAB.bread_wheat],
        turnaroundDays: [15, 30],
        description: "Not registered in ENGINE_EVALUATED_ROTATION_IDS",
        evidence: [],
      };

      expect(ENGINE_EVALUATED_ROTATION_IDS.has(unEvaluatedRotation.id)).toBe(false);

      const support = getCropRotationSupport("paddy_transplanted", [unEvaluatedRotation]);
      // Must NOT infer support merely because rotation definition exists
      expect(support.isEvaluatedInRotations).toBe(false);
      expect(support.candidateRotationIds).toEqual([]);
    });
  });
});

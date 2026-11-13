import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../app/api/rotations/route";

describe("GET /api/rotations API Route", () => {
  it("returns 400 when coordinates are missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/rotations");
    const res = await GET(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("MISSING_COORDINATES");
  });

  it("returns 400 when latitude is invalid", async () => {
    const req = new NextRequest("http://localhost:3000/api/rotations?lat=120&lon=75.85");
    const res = await GET(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("INVALID_LATITUDE");
  });

  it("returns complete rotation intelligence response in mock mode", async () => {
    const req = new NextRequest("http://localhost:3000/api/rotations?lat=30.90&lon=75.85&mock=true");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.location.latitude).toBe(30.9);
    expect(json.data.baseline).toBeDefined();
    expect(json.data.baseline.rotationId).toBe("rotation_rice_wheat");
    expect(json.data.baseline.isBaseline).toBe(true);
    expect(json.data.alternatives.length).toBeGreaterThanOrEqual(3);

    // Verify tradeoffs structure
    const firstAlt = json.data.alternatives[0];
    expect(firstAlt.tradeoffs.length).toBe(5);
    expect(firstAlt.feasibility).toBeDefined();
    expect(json.data.scientificDisclaimer).toContain("decision support");
  });

  it("surfaces feasibility rejections when rainfed_only is requested", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/rotations?lat=30.90&lon=75.85&mock=true&irrigationSource=rainfed_only"
    );
    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.baseline.feasibility.isFeasible).toBe(false);
    expect(
      json.data.baseline.feasibility.rejectionReasons.some((r: string) => r.includes("rainfed-only"))
    ).toBe(true);
  });
});

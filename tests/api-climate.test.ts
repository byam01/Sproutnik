import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../app/api/climate/route";

describe("GET /api/climate API Route", () => {
  it("returns 400 error when coordinates are missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/climate");
    const res = await GET(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("MISSING_COORDINATES");
  });

  it("returns 400 error when latitude is out of bounds", async () => {
    const req = new NextRequest("http://localhost:3000/api/climate?lat=95&lon=75.85");
    const res = await GET(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("INVALID_LATITUDE");
  });

  it("returns 400 error when longitude is out of bounds", async () => {
    const req = new NextRequest("http://localhost:3000/api/climate?lat=30.90&lon=195");
    const res = await GET(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("INVALID_LONGITUDE");
  });

  it("returns 400 error when year range is invalid", async () => {
    const req = new NextRequest("http://localhost:3000/api/climate?lat=30.90&lon=75.85&startYear=2024&endYear=2015");
    const res = await GET(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("INVALID_END_YEAR");
  });

  it("returns calibrated mock response when mock=true is specified", async () => {
    const req = new NextRequest("http://localhost:3000/api/climate?lat=30.90&lon=75.85&mock=true");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.location.latitude).toBe(30.9);
    expect(json.data.location.longitude).toBe(75.85);
    expect(json.data.meanAnnualRainfallMm).toBeGreaterThan(500);
    expect(json.data.seasonalRainfallMm).toHaveProperty("monsoonMm");
    expect(json.data.seasonalRainfallMm).toHaveProperty("winterMm");
    expect(json.data.seasonalRainfallMm).toHaveProperty("summerMm");
    expect(json.data.quality.precipitationCompletenessPercent).toBe(100);
    expect(json.meta.dataSource).toContain("Mock Fixture");
  });
});


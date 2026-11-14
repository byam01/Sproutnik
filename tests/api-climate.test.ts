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

  it("returns 400 error when latitude has a numeric suffix", async () => {
    const req = new NextRequest("http://localhost:3000/api/climate?lat=30.90abc&lon=75.85");
    const res = await GET(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("INVALID_LATITUDE");
  });

  it("returns 400 error when longitude has a numeric suffix", async () => {
    const req = new NextRequest("http://localhost:3000/api/climate?lat=30.90&lon=75.85xyz");
    const res = await GET(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("INVALID_LONGITUDE");
  });

  it("returns 400 error when coordinates are non-finite", async () => {
    const req1 = new NextRequest("http://localhost:3000/api/climate?lat=Infinity&lon=75.85");
    const res1 = await GET(req1);
    expect(res1.status).toBe(400);
    const json1 = await res1.json();
    expect(json1.error.code).toBe("INVALID_LATITUDE");

    const req2 = new NextRequest("http://localhost:3000/api/climate?lat=30.90&lon=-Infinity");
    const res2 = await GET(req2);
    expect(res2.status).toBe(400);
    const json2 = await res2.json();
    expect(json2.error.code).toBe("INVALID_LONGITUDE");

    const req3 = new NextRequest("http://localhost:3000/api/climate?lat=NaN&lon=75.85");
    const res3 = await GET(req3);
    expect(res3.status).toBe(400);
    const json3 = await res3.json();
    expect(json3.error.code).toBe("INVALID_LATITUDE");
  });

  it("returns 400 error when year has a suffix, decimal, or is empty", async () => {
    // Suffix
    const req1 = new NextRequest("http://localhost:3000/api/climate?lat=30.90&lon=75.85&startYear=2024abc");
    const res1 = await GET(req1);
    expect(res1.status).toBe(400);
    const json1 = await res1.json();
    expect(json1.error.code).toBe("INVALID_START_YEAR");

    const req2 = new NextRequest("http://localhost:3000/api/climate?lat=30.90&lon=75.85&endYear=2024abc");
    const res2 = await GET(req2);
    expect(res2.status).toBe(400);
    const json2 = await res2.json();
    expect(json2.error.code).toBe("INVALID_END_YEAR");

    // Decimal
    const req3 = new NextRequest("http://localhost:3000/api/climate?lat=30.90&lon=75.85&startYear=2020.5");
    const res3 = await GET(req3);
    expect(res3.status).toBe(400);
    const json3 = await res3.json();
    expect(json3.error.code).toBe("INVALID_START_YEAR");

    const req4 = new NextRequest("http://localhost:3000/api/climate?lat=30.90&lon=75.85&endYear=2024.1");
    const res4 = await GET(req4);
    expect(res4.status).toBe(400);
    const json4 = await res4.json();
    expect(json4.error.code).toBe("INVALID_END_YEAR");

    // Empty string
    const req5 = new NextRequest("http://localhost:3000/api/climate?lat=30.90&lon=75.85&startYear=");
    const res5 = await GET(req5);
    expect(res5.status).toBe(400);
    const json5 = await res5.json();
    expect(json5.error.code).toBe("INVALID_START_YEAR");

    const req6 = new NextRequest("http://localhost:3000/api/climate?lat=30.90&lon=75.85&endYear=");
    const res6 = await GET(req6);
    expect(res6.status).toBe(400);
    const json6 = await res6.json();
    expect(json6.error.code).toBe("INVALID_END_YEAR");
  });

  it("returns 400 error when startYear or endYear is outside supported NASA range", async () => {
    // Start year before 1981
    const req1 = new NextRequest("http://localhost:3000/api/climate?lat=30.90&lon=75.85&startYear=1980");
    const res1 = await GET(req1);
    expect(res1.status).toBe(400);
    const json1 = await res1.json();
    expect(json1.error.code).toBe("INVALID_START_YEAR");

    // End year beyond currentYear + 1
    const currentYear = new Date().getFullYear();
    const futureYear = currentYear + 2;
    const req2 = new NextRequest(`http://localhost:3000/api/climate?lat=30.90&lon=75.85&endYear=${futureYear}`);
    const res2 = await GET(req2);
    expect(res2.status).toBe(400);
    const json2 = await res2.json();
    expect(json2.error.code).toBe("INVALID_END_YEAR");
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

  describe("Year defaulting behavior", () => {
    it("case 1: preserves 2015-2024 when neither startYear nor endYear is supplied", async () => {
      const req = new NextRequest("http://localhost:3000/api/climate?lat=30.90&lon=75.85&mock=true");
      const res = await GET(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.period).toEqual({ startYear: 2015, endYear: 2024 });
    });

    it("case 2: chooses a valid end year when only startYear is supplied", async () => {
      // startYear <= 2024 defaults endYear to 2024
      const req1 = new NextRequest("http://localhost:3000/api/climate?lat=30.90&lon=75.85&startYear=2020&mock=true");
      const res1 = await GET(req1);
      expect(res1.status).toBe(200);
      const json1 = await res1.json();
      expect(json1.data.period).toEqual({ startYear: 2020, endYear: 2024 });

      // startYear > 2024 chooses endYear >= startYear and <= NASA limit (2025 -> 2025)
      const req2 = new NextRequest("http://localhost:3000/api/climate?lat=30.90&lon=75.85&startYear=2025&mock=true");
      const res2 = await GET(req2);
      expect(res2.status).toBe(200);
      const json2 = await res2.json();
      expect(json2.data.period).toEqual({ startYear: 2025, endYear: 2025 });
    });

    it("case 3: preserves default startYear (2015) when only endYear is supplied, if range is valid", async () => {
      // Valid endYear >= 2015
      const req1 = new NextRequest("http://localhost:3000/api/climate?lat=30.90&lon=75.85&endYear=2022&mock=true");
      const res1 = await GET(req1);
      expect(res1.status).toBe(200);
      const json1 = await res1.json();
      expect(json1.data.period).toEqual({ startYear: 2015, endYear: 2022 });

      // Invalid endYear < 2015
      const req2 = new NextRequest("http://localhost:3000/api/climate?lat=30.90&lon=75.85&endYear=2010&mock=true");
      const res2 = await GET(req2);
      expect(res2.status).toBe(400);
      const json2 = await res2.json();
      expect(json2.error.code).toBe("INVALID_END_YEAR");
    });

    it("case 4: validates requested range exactly when both startYear and endYear are supplied", async () => {
      // Valid exact range
      const req1 = new NextRequest("http://localhost:3000/api/climate?lat=30.90&lon=75.85&startYear=2018&endYear=2023&mock=true");
      const res1 = await GET(req1);
      expect(res1.status).toBe(200);
      const json1 = await res1.json();
      expect(json1.data.period).toEqual({ startYear: 2018, endYear: 2023 });

      // Invalid range (endYear < startYear)
      const req2 = new NextRequest("http://localhost:3000/api/climate?lat=30.90&lon=75.85&startYear=2024&endYear=2015&mock=true");
      const res2 = await GET(req2);
      expect(res2.status).toBe(400);
      const json2 = await res2.json();
      expect(json2.error.code).toBe("INVALID_END_YEAR");
    });
  });
});


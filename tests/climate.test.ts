import { describe, expect, it } from "vitest";
import {
  calculateAnnualRainfallByYear,
  calculateCoefficientOfVariation,
  calculateDrySeasonDeficitFrequency,
  calculateMean,
  calculateMonthlyMeans,
  calculateSampleStandardDeviation,
  calculateSeasonalRainfall,
  getPunjabSeason,
} from "../src/climate/calculations";
import { evaluateDataQuality, generateExpectedDates, isLeapYear } from "../src/climate/quality";
import { processClimateRecords } from "../src/climate/processor";
import { cleanNasaValue, validateCoordinates, validateYearRange } from "../src/services/nasa-power";
import { DailyClimateRecord, Location } from "../src/types";

describe("NASA Service Utilities", () => {
  it("validates coordinates correctly", () => {
    expect(() => validateCoordinates(30.9, 75.85)).not.toThrow();
    expect(() => validateCoordinates(95, 75.85)).toThrow(/Invalid latitude/);
    expect(() => validateCoordinates(30.9, 190)).toThrow(/Invalid longitude/);
  });

  it("validates year ranges correctly", () => {
    expect(() => validateYearRange(2015, 2024)).not.toThrow();
    expect(() => validateYearRange(1975, 2024)).toThrow(/1981/);
    expect(() => validateYearRange(2024, 2015)).toThrow(/cannot be greater/);
  });

  it("handles NASA missing fill values vs zero properly", () => {
    // NASA fill values
    expect(cleanNasaValue(-999)).toBeNull();
    expect(cleanNasaValue(-999.0)).toBeNull();
    expect(cleanNasaValue(-99)).toBeNull();

    // Valid zero rainfall should NOT be turned into null
    expect(cleanNasaValue(0)).toBe(0);
    expect(cleanNasaValue(0.0)).toBe(0);

    // Valid positive and negative temperatures
    expect(cleanNasaValue(25.4)).toBe(25.4);
    expect(cleanNasaValue(-5.2)).toBe(-5.2);
  });
});

describe("Climate Quality Evaluation", () => {
  it("correctly identifies leap years", () => {
    expect(isLeapYear(2016)).toBe(true);
    expect(isLeapYear(2020)).toBe(true);
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2015)).toBe(false);
    expect(isLeapYear(2023)).toBe(false);
    expect(isLeapYear(1900)).toBe(false);
    expect(isLeapYear(2000)).toBe(true);
  });

  it("generates correct count of expected dates including leap years", () => {
    // 2015 has 365 days, 2016 has 366 days -> total 731
    const dates = generateExpectedDates(2015, 2016);
    expect(dates.length).toBe(731);
    expect(dates[0]).toBe("2015-01-01");
    expect(dates[dates.length - 1]).toBe("2016-12-31");
  });

  it("detects missing dates and computes independent completeness", () => {
    // Create 364 records for 2015 (omitting 2015-07-15)
    const records: DailyClimateRecord[] = [];
    const expected = generateExpectedDates(2015, 2015);

    for (const d of expected) {
      if (d === "2015-07-15") continue; // drop one day

      const [y, m, day] = d.split("-").map(Number);
      records.push({
        date: d,
        year: y,
        month: m,
        day,
        precipitationMm: 0,
        tempMeanC: m === 1 ? null : 25, // January has null temperatures
        tempMaxC: 30,
      });
    }

    const quality = evaluateDataQuality(records, 2015, 2015);
    expect(quality.totalExpectedDays).toBe(365);
    expect(quality.totalReceivedDays).toBe(364);
    expect(quality.missingDateCount).toBe(1);
    expect(quality.hasMissingDates).toBe(true);

    // Precip completeness: 364 / 365 = 99.73%
    expect(quality.precipitationCompletenessPercent).toBeCloseTo(99.73, 1);
    // Temp completeness: 364 - 31 (Jan nulls) = 333 / 365 = 91.23%
    expect(quality.temperatureCompletenessPercent).toBeCloseTo(91.23, 1);
  });

  it("flags incomplete years (< 90%) for exclusion", () => {
    // Only 100 days for 2015 (completeness ~27%)
    const records: DailyClimateRecord[] = [];
    const expected = generateExpectedDates(2015, 2015).slice(0, 100);

    for (const d of expected) {
      const [y, m, day] = d.split("-").map(Number);
      records.push({
        date: d,
        year: y,
        month: m,
        day,
        precipitationMm: 1.0,
        tempMeanC: 20.0,
        tempMaxC: 25.0,
      });
    }

    const quality = evaluateDataQuality(records, 2015, 2015);
    expect(quality.excludedYears).toContain(2015);
  });
});

describe("Climate Calculations", () => {
  it("maps months to Punjab prototype seasons accurately", () => {
    expect(getPunjabSeason(11)).toBe("winter");
    expect(getPunjabSeason(12)).toBe("winter");
    expect(getPunjabSeason(1)).toBe("winter");
    expect(getPunjabSeason(2)).toBe("winter");

    expect(getPunjabSeason(3)).toBe("summer");
    expect(getPunjabSeason(4)).toBe("summer");
    expect(getPunjabSeason(5)).toBe("summer");

    expect(getPunjabSeason(6)).toBe("monsoon");
    expect(getPunjabSeason(7)).toBe("monsoon");
    expect(getPunjabSeason(8)).toBe("monsoon");
    expect(getPunjabSeason(9)).toBe("monsoon");

    expect(getPunjabSeason(10)).toBe("post_monsoon");
  });

  it("calculates mean, sample standard deviation, and CV% correctly", () => {
    // Sample: [10, 20, 30]
    // Mean = 20
    // s^2 = ((10-20)^2 + (20-20)^2 + (30-20)^2) / (3 - 1) = (100 + 0 + 100) / 2 = 100
    // s = 10
    // CV = (10 / 20) * 100 = 50%
    const sample = [10, 20, 30];
    expect(calculateMean(sample)).toBe(20);
    expect(calculateSampleStandardDeviation(sample)).toBe(10);
    expect(calculateCoefficientOfVariation(sample)).toBe(50);
  });

  it("does NOT treat missing data as zero in calculations", () => {
    const records: DailyClimateRecord[] = [
      {
        date: "2015-07-01",
        year: 2015,
        month: 7,
        day: 1,
        precipitationMm: null, // missing, not 0
        tempMeanC: 30,
        tempMaxC: 35,
      },
      {
        date: "2015-07-02",
        year: 2015,
        month: 7,
        day: 2,
        precipitationMm: 15.0,
        tempMeanC: 28,
        tempMaxC: 33,
      },
      {
        date: "2015-07-03",
        year: 2015,
        month: 7,
        day: 3,
        precipitationMm: 0.0, // real zero
        tempMeanC: 29,
        tempMaxC: 34,
      },
    ];

    const annual = calculateAnnualRainfallByYear(records);
    // Total should be 15.0 (ignoring null), not erroring out
    expect(annual[2015]).toBe(15.0);
  });

  it("processes complete time series into verified climate indicators", () => {
    const testLocation: Location = { latitude: 30.9, longitude: 75.85 };
    const records: DailyClimateRecord[] = [];

    // Create 2 years of complete synthetic records: 2015 and 2016
    for (const year of [2015, 2016]) {
      const dates = generateExpectedDates(year, year);
      for (const d of dates) {
        const [y, m, day] = d.split("-").map(Number);
        // 2mm rain every day in monsoon (Jun-Sep), 0 elsewhere
        const isMonsoon = m >= 6 && m <= 9;
        records.push({
          date: d,
          year: y,
          month: m,
          day,
          precipitationMm: isMonsoon ? 2.0 : 0.0,
          tempMeanC: 25.0,
          tempMaxC: 32.0,
        });
      }
    }

    const indicators = processClimateRecords(records, testLocation, {
      startYear: 2015,
      endYear: 2016,
    });

    expect(indicators.location.latitude).toBe(30.9);
    expect(indicators.quality.precipitationCompletenessPercent).toBe(100);
    expect(indicators.quality.hasMissingDates).toBe(false);
    expect(indicators.quality.excludedYears.length).toBe(0);

    // In Jun-Sep (122 days total: 30+31+31+30 = 122 days * 2mm = 244 mm per year)
    expect(indicators.meanAnnualRainfallMm).toBe(244);
    expect(indicators.seasonalRainfallMm.monsoonMm).toBe(244);
    expect(indicators.seasonalRainfallMm.winterMm).toBe(0);
    expect(indicators.meanTemperatureC).toBe(25);
    expect(indicators.meanMaxTemperatureC).toBe(32);
    expect(indicators.rainfallVariabilityCvPercent).toBe(0); // identical both years
  });
});

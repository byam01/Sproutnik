import { describe, expect, it } from "vitest";
import {
  calculateAnnualRainfallByYear,
  calculateCoefficientOfVariation,
  calculateDrySeasonDeficitFrequency,
  calculateDrySeasonDeficitFrequencyWithAvailability,
  calculateMean,
  calculateMonthlyMeans,
  calculateMonthlyMeansWithAvailability,
  calculateSampleStandardDeviation,
  calculateSeasonalRainfall,
  calculateSeasonalRainfallWithAvailability,
  getAgriculturalSeasonYear,
  getExpectedSeasonDays,
  getPunjabSeason,
} from "../src/climate/calculations";
import {
  evaluateDataQuality,
  generateExpectedDates,
  isLeapYear,
  isValidDate,
  isValidDateString,
} from "../src/climate/quality";
import { processClimateRecords } from "../src/climate/processor";
import {
  cleanNasaValue,
  parseDateKey,
  validateCoordinates,
  validateYearRange,
} from "../src/services/nasa-power";
import { DailyClimateRecord, Location } from "../src/types";

describe("NASA Service Utilities", () => {
  it("validates coordinates correctly", () => {
    expect(() => validateCoordinates(30.9, 75.85)).not.toThrow();
    expect(() => validateCoordinates(95, 75.85)).toThrow(/Invalid latitude/);
    expect(() => validateCoordinates(30.9, 190)).toThrow(/Invalid longitude/);
  });

  it("rejects non-finite coordinates", () => {
    expect(() => validateCoordinates(NaN, 75.85)).toThrow(/Invalid latitude/);
    expect(() => validateCoordinates(30.9, Infinity)).toThrow(/Invalid longitude/);
    expect(() => validateCoordinates(-Infinity, 75.85)).toThrow(/Invalid latitude/);
  });

  it("validates year ranges correctly", () => {
    expect(() => validateYearRange(2015, 2024)).not.toThrow();
    expect(() => validateYearRange(1975, 2024)).toThrow(/1981/);
    expect(() => validateYearRange(2024, 2015)).toThrow(/cannot be greater/);
  });

  it("validates Gregorian dates in parseDateKey correctly", () => {
    // Valid leap days
    expect(parseDateKey("20240229")).toEqual({ date: "2024-02-29", year: 2024, month: 2, day: 29 });
    expect(parseDateKey("20000229")).toEqual({ date: "2000-02-29", year: 2000, month: 2, day: 29 });

    // Invalid non-leap days
    expect(parseDateKey("20230229")).toBeNull();
    expect(parseDateKey("19000229")).toBeNull();

    // Invalid month lengths (31 days on 30-day months)
    expect(parseDateKey("20240431")).toBeNull();
    expect(parseDateKey("20240631")).toBeNull();
    expect(parseDateKey("20240931")).toBeNull();
    expect(parseDateKey("20241131")).toBeNull();

    // Out of bounds months or days
    expect(parseDateKey("20241301")).toBeNull();
    expect(parseDateKey("20240001")).toBeNull();
    expect(parseDateKey("20240132")).toBeNull();
    expect(parseDateKey("20240100")).toBeNull();

    // Malformed keys
    expect(parseDateKey("abc")).toBeNull();
    expect(parseDateKey("2024022")).toBeNull();
    expect(parseDateKey("202402299")).toBeNull();
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

  it("validates Gregorian dates via isValidDate and isValidDateString", () => {
    expect(isValidDate(2024, 2, 29)).toBe(true);
    expect(isValidDate(2023, 2, 29)).toBe(false);
    expect(isValidDate(2024, 4, 31)).toBe(false);
    expect(isValidDate(2024, 13, 1)).toBe(false);
    expect(isValidDate(2024, 0, 1)).toBe(false);
    expect(isValidDate(2024, 1, 0)).toBe(false);

    expect(isValidDateString("2024-02-29")).toBe(true);
    expect(isValidDateString("2023-02-29")).toBe(false);
    expect(isValidDateString("2024-04-31")).toBe(false);
    expect(isValidDateString("invalid-date")).toBe(false);
    expect(isValidDateString("2024/02/29")).toBe(false);
  });

  it("handles duplicate dates without inflating received days or completeness", () => {
    const records: DailyClimateRecord[] = [];
    const expected = generateExpectedDates(2015, 2015);

    // Add all 365 days
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

    // Add 10 duplicate records for the first 10 days
    for (let i = 0; i < 10; i++) {
      const d = expected[i];
      const [y, m, day] = d.split("-").map(Number);
      records.push({
        date: d,
        year: y,
        month: m,
        day,
        precipitationMm: 2.0,
        tempMeanC: 22.0,
        tempMaxC: 27.0,
      });
    }

    const quality = evaluateDataQuality(records, 2015, 2015);
    expect(quality.totalExpectedDays).toBe(365);
    expect(quality.totalReceivedDays).toBe(365);
    expect(quality.precipitationCompletenessPercent).toBe(100);
    expect(quality.temperatureCompletenessPercent).toBe(100);
    expect(quality.notes.some((n) => n.includes("deduplicated 10 duplicate date entries"))).toBe(true);
  });

  it("excludes out-of-period records from completeness accounting", () => {
    const records: DailyClimateRecord[] = [];
    const expected = generateExpectedDates(2015, 2015);

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

    // Add 5 records from 2014
    for (let i = 1; i <= 5; i++) {
      const dd = i < 10 ? `0${i}` : `${i}`;
      records.push({
        date: `2014-01-${dd}`,
        year: 2014,
        month: 1,
        day: i,
        precipitationMm: 5.0,
        tempMeanC: 15.0,
        tempMaxC: 20.0,
      });
    }

    const quality = evaluateDataQuality(records, 2015, 2015);
    expect(quality.totalExpectedDays).toBe(365);
    expect(quality.totalReceivedDays).toBe(365);
    expect(quality.precipitationCompletenessPercent).toBe(100);
    expect(quality.notes.some((n) => n.includes("outside requested range [2015-2015]"))).toBe(true);
  });

  it("handles malformed date records gracefully without increasing completeness", () => {
    const records: DailyClimateRecord[] = [];
    const expected = generateExpectedDates(2015, 2015);

    // Provide 364 valid days (drop the last day 2015-12-31)
    for (let i = 0; i < expected.length - 1; i++) {
      const d = expected[i];
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

    // Add malformed dates: non-existent leap day in non-leap year and string garbage
    records.push({
      date: "2015-02-29",
      year: 2015,
      month: 2,
      day: 29,
      precipitationMm: 10.0,
      tempMeanC: 20.0,
      tempMaxC: 25.0,
    });
    records.push({
      date: "not-a-date",
      year: 2015,
      month: 1,
      day: 1,
      precipitationMm: 10.0,
      tempMeanC: 20.0,
      tempMaxC: 25.0,
    });

    const quality = evaluateDataQuality(records, 2015, 2015);
    expect(quality.totalExpectedDays).toBe(365);
    expect(quality.totalReceivedDays).toBe(364);
    expect(quality.missingDateCount).toBe(1);
    expect(quality.precipitationCompletenessPercent).toBeCloseTo((364 / 365) * 100, 2);
    expect(quality.notes.some((n) => n.includes("malformed or invalid calendar date(s)"))).toBe(true);
  });

  it("rejects records where record.year disagrees with valid date string", () => {
    const records: DailyClimateRecord[] = [
      {
        date: "2015-05-10",
        year: 2014, // Disagrees with 2015
        month: 5,
        day: 10,
        precipitationMm: 10.0,
        tempMeanC: 25.0,
        tempMaxC: 30.0,
      },
    ];
    const quality = evaluateDataQuality(records, 2015, 2015);
    expect(quality.totalReceivedDays).toBe(0);
    expect(quality.precipitationCompletenessPercent).toBe(0);
    expect(quality.notes.some((n) => n.includes("inconsistent"))).toBe(true);
  });

  it("rejects records where record.month disagrees with valid date string", () => {
    const records: DailyClimateRecord[] = [
      {
        date: "2015-05-10",
        year: 2015,
        month: 6, // Disagrees with 5
        day: 10,
        precipitationMm: 10.0,
        tempMeanC: 25.0,
        tempMaxC: 30.0,
      },
    ];
    const quality = evaluateDataQuality(records, 2015, 2015);
    expect(quality.totalReceivedDays).toBe(0);
    expect(quality.precipitationCompletenessPercent).toBe(0);
    expect(quality.notes.some((n) => n.includes("inconsistent"))).toBe(true);
  });

  it("rejects records where record.day disagrees with valid date string", () => {
    const records: DailyClimateRecord[] = [
      {
        date: "2015-05-10",
        year: 2015,
        month: 5,
        day: 11, // Disagrees with 10
        precipitationMm: 10.0,
        tempMeanC: 25.0,
        tempMaxC: 30.0,
      },
    ];
    const quality = evaluateDataQuality(records, 2015, 2015);
    expect(quality.totalReceivedDays).toBe(0);
    expect(quality.precipitationCompletenessPercent).toBe(0);
    expect(quality.notes.some((n) => n.includes("inconsistent"))).toBe(true);
  });

  it("handles repeated malformed records without classifying them as valid duplicate dates", () => {
    const records: DailyClimateRecord[] = [
      {
        date: "invalid-date-string",
        year: 2015,
        month: 1,
        day: 1,
        precipitationMm: 10.0,
        tempMeanC: 20.0,
        tempMaxC: 25.0,
      },
      {
        date: "invalid-date-string", // Repeated malformed
        year: 2015,
        month: 1,
        day: 1,
        precipitationMm: 10.0,
        tempMeanC: 20.0,
        tempMaxC: 25.0,
      },
      {
        date: "2015-02-29", // Invalid leap date in non-leap year
        year: 2015,
        month: 2,
        day: 29,
        precipitationMm: 5.0,
        tempMeanC: 15.0,
        tempMaxC: 20.0,
      },
      {
        date: "2015-02-29", // Repeated invalid leap date
        year: 2015,
        month: 2,
        day: 29,
        precipitationMm: 5.0,
        tempMeanC: 15.0,
        tempMaxC: 20.0,
      },
    ];

    const quality = evaluateDataQuality(records, 2015, 2015);
    expect(quality.totalReceivedDays).toBe(0);
    expect(quality.precipitationCompletenessPercent).toBe(0);
    expect(quality.notes.some((n) => n.includes("duplicate date entries"))).toBe(false);
    expect(quality.notes.some((n) => n.includes("4 malformed"))).toBe(true);
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

    // Empty or invalid input handling
    expect(calculateMean([])).toBeNull();
    expect(calculateSampleStandardDeviation([])).toBeNull();
    expect(calculateSampleStandardDeviation([10])).toBeNull();
    expect(calculateCoefficientOfVariation([])).toBeNull();
    expect(calculateCoefficientOfVariation([10])).toBeNull();

    // Genuine zero preservation
    expect(calculateMean([0, 0, 0])).toBe(0);
    expect(calculateMean([10, -10, 0])).toBe(0);
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

  describe("Agricultural Winter Rainfall Aggregation", () => {
    it("groups November–December of Year Y and January–February of Year Y+1 into Winter Y", () => {
      const records: DailyClimateRecord[] = [];

      // Create complete Winter 2015-16:
      // Nov 2015 (30 days @ 1mm = 30mm)
      // Dec 2015 (31 days @ 1mm = 31mm)
      // Jan 2016 (31 days @ 2mm = 62mm)
      // Feb 2016 (29 days in leap 2016 @ 2mm = 58mm)
      // Total expected = 30 + 31 + 62 + 58 = 181 mm
      for (let d = 1; d <= 30; d++) {
        const dd = d < 10 ? `0${d}` : `${d}`;
        records.push({ date: `2015-11-${dd}`, year: 2015, month: 11, day: d, precipitationMm: 1.0, tempMeanC: 18, tempMaxC: 25 });
      }
      for (let d = 1; d <= 31; d++) {
        const dd = d < 10 ? `0${d}` : `${d}`;
        records.push({ date: `2015-12-${dd}`, year: 2015, month: 12, day: d, precipitationMm: 1.0, tempMeanC: 14, tempMaxC: 20 });
      }
      for (let d = 1; d <= 31; d++) {
        const dd = d < 10 ? `0${d}` : `${d}`;
        records.push({ date: `2016-01-${dd}`, year: 2016, month: 1, day: d, precipitationMm: 2.0, tempMeanC: 12, tempMaxC: 18 });
      }
      for (let d = 1; d <= 29; d++) {
        const dd = d < 10 ? `0${d}` : `${d}`;
        records.push({ date: `2016-02-${dd}`, year: 2016, month: 2, day: d, precipitationMm: 2.0, tempMeanC: 15, tempMaxC: 22 });
      }

      const seasonal = calculateSeasonalRainfall(records);
      expect(seasonal.winterMm).toBe(181);
    });

    it("excludes incomplete boundary winter seasons from winter rainfall average", () => {
      const records: DailyClimateRecord[] = [];

      // Add complete Winter 2015-16 (121 days @ 1mm = 121mm)
      for (let d = 1; d <= 30; d++) {
        const dd = d < 10 ? `0${d}` : `${d}`;
        records.push({ date: `2015-11-${dd}`, year: 2015, month: 11, day: d, precipitationMm: 1.0, tempMeanC: 18, tempMaxC: 25 });
      }
      for (let d = 1; d <= 31; d++) {
        const dd = d < 10 ? `0${d}` : `${d}`;
        records.push({ date: `2015-12-${dd}`, year: 2015, month: 12, day: d, precipitationMm: 1.0, tempMeanC: 14, tempMaxC: 20 });
      }
      for (let d = 1; d <= 31; d++) {
        const dd = d < 10 ? `0${d}` : `${d}`;
        records.push({ date: `2016-01-${dd}`, year: 2016, month: 1, day: d, precipitationMm: 1.0, tempMeanC: 12, tempMaxC: 18 });
      }
      for (let d = 1; d <= 29; d++) {
        const dd = d < 10 ? `0${d}` : `${d}`;
        records.push({ date: `2016-02-${dd}`, year: 2016, month: 2, day: d, precipitationMm: 1.0, tempMeanC: 15, tempMaxC: 22 });
      }

      // Add boundary fragment: Jan-Feb 2015 only (missing Nov-Dec 2014) with 500mm
      for (let d = 1; d <= 31; d++) {
        const dd = d < 10 ? `0${d}` : `${d}`;
        records.push({ date: `2015-01-${dd}`, year: 2015, month: 1, day: d, precipitationMm: 10.0, tempMeanC: 12, tempMaxC: 18 });
      }
      for (let d = 1; d <= 28; d++) {
        const dd = d < 10 ? `0${d}` : `${d}`;
        records.push({ date: `2015-02-${dd}`, year: 2015, month: 2, day: d, precipitationMm: 10.0, tempMeanC: 15, tempMaxC: 22 });
      }

      // Add boundary fragment: Nov-Dec 2016 only (missing Jan-Feb 2017) with 300mm
      for (let d = 1; d <= 30; d++) {
        const dd = d < 10 ? `0${d}` : `${d}`;
        records.push({ date: `2016-11-${dd}`, year: 2016, month: 11, day: d, precipitationMm: 10.0, tempMeanC: 18, tempMaxC: 25 });
      }
      for (let d = 1; d <= 31; d++) {
        const dd = d < 10 ? `0${d}` : `${d}`;
        records.push({ date: `2016-12-${dd}`, year: 2016, month: 12, day: d, precipitationMm: 10.0, tempMeanC: 14, tempMaxC: 20 });
      }

      // Because Winter 2014 has only 59 days (< 90% of 120) and Winter 2016 has only 61 days (< 90% of 120),
      // only Winter 2015 (121 days) is complete and its mean must be 121.0 mm (not distorted by boundary fragments).
      const seasonal = calculateSeasonalRainfall(records);
      expect(seasonal.winterMm).toBe(121);
    });

    it("preserves genuine zero winter rainfall across all days", () => {
      const records: DailyClimateRecord[] = [];

      // Complete Winter 2015-16 with genuine 0.0mm every day
      for (let d = 1; d <= 30; d++) {
        const dd = d < 10 ? `0${d}` : `${d}`;
        records.push({ date: `2015-11-${dd}`, year: 2015, month: 11, day: d, precipitationMm: 0.0, tempMeanC: 18, tempMaxC: 25 });
      }
      for (let d = 1; d <= 31; d++) {
        const dd = d < 10 ? `0${d}` : `${d}`;
        records.push({ date: `2015-12-${dd}`, year: 2015, month: 12, day: d, precipitationMm: 0.0, tempMeanC: 14, tempMaxC: 20 });
      }
      for (let d = 1; d <= 31; d++) {
        const dd = d < 10 ? `0${d}` : `${d}`;
        records.push({ date: `2016-01-${dd}`, year: 2016, month: 1, day: d, precipitationMm: 0.0, tempMeanC: 12, tempMaxC: 18 });
      }
      for (let d = 1; d <= 29; d++) {
        const dd = d < 10 ? `0${d}` : `${d}`;
        records.push({ date: `2016-02-${dd}`, year: 2016, month: 2, day: d, precipitationMm: 0.0, tempMeanC: 15, tempMaxC: 22 });
      }

      const seasonal = calculateSeasonalRainfall(records);
      expect(seasonal.winterMm).toBe(0);
    });
  });

  describe("Dry-Season Deficit Calculation", () => {
    it("aggregates continuous 7-month dry season across calendar years (Nov Y - May Y+1)", () => {
      const records: DailyClimateRecord[] = [];

      // Helper to generate a complete dry season
      const generateDrySeason = (startYear: number, dailyMm: number) => {
        // Nov (30) + Dec (31) of startYear
        for (let d = 1; d <= 30; d++) {
          const dd = d < 10 ? `0${d}` : `${d}`;
          records.push({ date: `${startYear}-11-${dd}`, year: startYear, month: 11, day: d, precipitationMm: dailyMm, tempMeanC: 20, tempMaxC: 28 });
        }
        for (let d = 1; d <= 31; d++) {
          const dd = d < 10 ? `0${d}` : `${d}`;
          records.push({ date: `${startYear}-12-${dd}`, year: startYear, month: 12, day: d, precipitationMm: dailyMm, tempMeanC: 15, tempMaxC: 22 });
        }
        // Jan (31), Feb (28/29), Mar (31), Apr (30), May (31) of startYear + 1
        const y2 = startYear + 1;
        const febDays = isLeapYear(y2) ? 29 : 28;
        for (let d = 1; d <= 31; d++) {
          const dd = d < 10 ? `0${d}` : `${d}`;
          records.push({ date: `${y2}-01-${dd}`, year: y2, month: 1, day: d, precipitationMm: dailyMm, tempMeanC: 12, tempMaxC: 18 });
        }
        for (let d = 1; d <= febDays; d++) {
          const dd = d < 10 ? `0${d}` : `${d}`;
          records.push({ date: `${y2}-02-${dd}`, year: y2, month: 2, day: d, precipitationMm: dailyMm, tempMeanC: 15, tempMaxC: 22 });
        }
        for (let d = 1; d <= 31; d++) {
          const dd = d < 10 ? `0${d}` : `${d}`;
          records.push({ date: `${y2}-03-${dd}`, year: y2, month: 3, day: d, precipitationMm: dailyMm, tempMeanC: 22, tempMaxC: 30 });
        }
        for (let d = 1; d <= 30; d++) {
          const dd = d < 10 ? `0${d}` : `${d}`;
          records.push({ date: `${y2}-04-${dd}`, year: y2, month: 4, day: d, precipitationMm: dailyMm, tempMeanC: 28, tempMaxC: 36 });
        }
        for (let d = 1; d <= 31; d++) {
          const dd = d < 10 ? `0${d}` : `${d}`;
          records.push({ date: `${y2}-05-${dd}`, year: y2, month: 5, day: d, precipitationMm: dailyMm, tempMeanC: 32, tempMaxC: 40 });
        }
      };

      // Season 2015-16: 213 days * 1.0mm = 213 mm
      generateDrySeason(2015, 1.0);
      // Season 2016-17: 212 days * 0.5mm = 106 mm
      generateDrySeason(2016, 0.5);

      // Mean dry-season total = (213 + 106) / 2 = 159.5 mm
      // Deficit threshold = 159.5 * 0.75 = 119.625 mm
      // Season 2016-17 (106 mm < 119.6 mm) is in deficit (1 of 2 seasons = 50.0%)
      const deficitFreq = calculateDrySeasonDeficitFrequency(records);
      expect(deficitFreq).toBe(50.0);
    });

    it("excludes incomplete boundary dry seasons from deficit accounting", () => {
      const records: DailyClimateRecord[] = [];

      // Create 2 complete seasons:
      // Season 2015-16: 213 days * 1.0mm = 213 mm
      // Season 2016-17: 212 days * 0.5mm = 106 mm (Deficit)
      const generateDrySeason = (startYear: number, dailyMm: number) => {
        for (let d = 1; d <= 30; d++) {
          const dd = d < 10 ? `0${d}` : `${d}`;
          records.push({ date: `${startYear}-11-${dd}`, year: startYear, month: 11, day: d, precipitationMm: dailyMm, tempMeanC: 20, tempMaxC: 28 });
        }
        for (let d = 1; d <= 31; d++) {
          const dd = d < 10 ? `0${d}` : `${d}`;
          records.push({ date: `${startYear}-12-${dd}`, year: startYear, month: 12, day: d, precipitationMm: dailyMm, tempMeanC: 15, tempMaxC: 22 });
        }
        const y2 = startYear + 1;
        const febDays = isLeapYear(y2) ? 29 : 28;
        for (let d = 1; d <= 31; d++) {
          const dd = d < 10 ? `0${d}` : `${d}`;
          records.push({ date: `${y2}-01-${dd}`, year: y2, month: 1, day: d, precipitationMm: dailyMm, tempMeanC: 12, tempMaxC: 18 });
        }
        for (let d = 1; d <= febDays; d++) {
          const dd = d < 10 ? `0${d}` : `${d}`;
          records.push({ date: `${y2}-02-${dd}`, year: y2, month: 2, day: d, precipitationMm: dailyMm, tempMeanC: 15, tempMaxC: 22 });
        }
        for (let d = 1; d <= 31; d++) {
          const dd = d < 10 ? `0${d}` : `${d}`;
          records.push({ date: `${y2}-03-${dd}`, year: y2, month: 3, day: d, precipitationMm: dailyMm, tempMeanC: 22, tempMaxC: 30 });
        }
        for (let d = 1; d <= 30; d++) {
          const dd = d < 10 ? `0${d}` : `${d}`;
          records.push({ date: `${y2}-04-${dd}`, year: y2, month: 4, day: d, precipitationMm: dailyMm, tempMeanC: 28, tempMaxC: 36 });
        }
        for (let d = 1; d <= 31; d++) {
          const dd = d < 10 ? `0${d}` : `${d}`;
          records.push({ date: `${y2}-05-${dd}`, year: y2, month: 5, day: d, precipitationMm: dailyMm, tempMeanC: 32, tempMaxC: 40 });
        }
      };

      generateDrySeason(2015, 1.0);
      generateDrySeason(2016, 0.5);

      // Add boundary fragment: Jan-May 2015 with 5 mm (would falsely trigger deficit if included)
      for (let m = 1; m <= 5; m++) {
        const mm = m < 10 ? `0${m}` : `${m}`;
        records.push({ date: `2015-${mm}-01`, year: 2015, month: m, day: 1, precipitationMm: 1.0, tempMeanC: 20, tempMaxC: 25 });
      }

      // Add boundary fragment: Nov-Dec 2017 with 2 mm
      records.push({ date: `2017-11-01`, year: 2017, month: 11, day: 1, precipitationMm: 1.0, tempMeanC: 20, tempMaxC: 25 });
      records.push({ date: `2017-12-01`, year: 2017, month: 12, day: 1, precipitationMm: 1.0, tempMeanC: 20, tempMaxC: 25 });

      // Incomplete fragments must be excluded, leaving exactly the 2 complete seasons -> 50.0%
      const deficitFreq = calculateDrySeasonDeficitFrequency(records);
      expect(deficitFreq).toBe(50.0);
    });

    it("flags complete dry season with genuine zero rainfall as a deficit", () => {
      const records: DailyClimateRecord[] = [];

      const generateDrySeason = (startYear: number, dailyMm: number) => {
        for (let d = 1; d <= 30; d++) {
          const dd = d < 10 ? `0${d}` : `${d}`;
          records.push({ date: `${startYear}-11-${dd}`, year: startYear, month: 11, day: d, precipitationMm: dailyMm, tempMeanC: 20, tempMaxC: 28 });
        }
        for (let d = 1; d <= 31; d++) {
          const dd = d < 10 ? `0${d}` : `${d}`;
          records.push({ date: `${startYear}-12-${dd}`, year: startYear, month: 12, day: d, precipitationMm: dailyMm, tempMeanC: 15, tempMaxC: 22 });
        }
        const y2 = startYear + 1;
        const febDays = isLeapYear(y2) ? 29 : 28;
        for (let d = 1; d <= 31; d++) {
          const dd = d < 10 ? `0${d}` : `${d}`;
          records.push({ date: `${y2}-01-${dd}`, year: y2, month: 1, day: d, precipitationMm: dailyMm, tempMeanC: 12, tempMaxC: 18 });
        }
        for (let d = 1; d <= febDays; d++) {
          const dd = d < 10 ? `0${d}` : `${d}`;
          records.push({ date: `${y2}-02-${dd}`, year: y2, month: 2, day: d, precipitationMm: dailyMm, tempMeanC: 15, tempMaxC: 22 });
        }
        for (let d = 1; d <= 31; d++) {
          const dd = d < 10 ? `0${d}` : `${d}`;
          records.push({ date: `${y2}-03-${dd}`, year: y2, month: 3, day: d, precipitationMm: dailyMm, tempMeanC: 22, tempMaxC: 30 });
        }
        for (let d = 1; d <= 30; d++) {
          const dd = d < 10 ? `0${d}` : `${d}`;
          records.push({ date: `${y2}-04-${dd}`, year: y2, month: 4, day: d, precipitationMm: dailyMm, tempMeanC: 28, tempMaxC: 36 });
        }
        for (let d = 1; d <= 31; d++) {
          const dd = d < 10 ? `0${d}` : `${d}`;
          records.push({ date: `${y2}-05-${dd}`, year: y2, month: 5, day: d, precipitationMm: dailyMm, tempMeanC: 32, tempMaxC: 40 });
        }
      };

      // Season 1: 213 mm
      generateDrySeason(2015, 1.0);
      // Season 2: Genuine 0.0 mm for all 212 days
      generateDrySeason(2016, 0.0);

      // Mean = (213 + 0) / 2 = 106.5 mm
      // Threshold = 106.5 * 0.75 = 79.875 mm
      // Season 2 (0.0 mm < 79.9 mm) is in deficit -> 1 of 2 = 50.0%
      const deficitFreq = calculateDrySeasonDeficitFrequency(records);
      expect(deficitFreq).toBe(50.0);
    });
  });

  describe("Monthly and Annual Temperature Aggregation", () => {
    it("gives each year equal weight in monthly temperature normals regardless of day count", () => {
      const records: DailyClimateRecord[] = [];

      // Year 2015 January: 31 days with tempMaxC = 10.0°C (yearly Jan mean = 10.0°C)
      for (let d = 1; d <= 31; d++) {
        const dd = d < 10 ? `0${d}` : `${d}`;
        records.push({ date: `2015-01-${dd}`, year: 2015, month: 1, day: d, precipitationMm: 0, tempMeanC: 8, tempMaxC: 10.0 });
      }

      // Year 2016 January: 28 days (3 days missing, 28/31 = 90.3% complete) with tempMaxC = 20.0°C (yearly Jan mean = 20.0°C)
      for (let d = 1; d <= 28; d++) {
        const dd = d < 10 ? `0${d}` : `${d}`;
        records.push({ date: `2016-01-${dd}`, year: 2016, month: 1, day: d, precipitationMm: 0, tempMeanC: 16, tempMaxC: 20.0 });
      }

      // Two-stage climatological average: (10.0 + 20.0) / 2 = 15.0°C.
      // (If pooled by days, it would be (31*10 + 28*20)/59 = 14.7°C, which would incorrectly overweight 2015).
      const means = calculateMonthlyMeans(records);
      expect(means.monthlyMeanMaxTempC[1]).toBe(15.0);
    });

    it("preserves zero-degree temperature readings as valid observations", () => {
      const records: DailyClimateRecord[] = [];

      for (let d = 1; d <= 31; d++) {
        const dd = d < 10 ? `0${d}` : `${d}`;
        records.push({ date: `2015-01-${dd}`, year: 2015, month: 1, day: d, precipitationMm: 0, tempMeanC: 0.0, tempMaxC: 0.0 });
      }

      const means = calculateMonthlyMeans(records);
      expect(means.monthlyMeanMaxTempC[1]).toBe(0.0);
    });
  });

  describe("Data-Quality Propagation in Processor", () => {
    it("emits explicit diagnostic note when all years are excluded due to poor completeness", () => {
      const testLocation: Location = { latitude: 30.9, longitude: 75.85 };
      const records: DailyClimateRecord[] = [];

      // Provide only 10 days of data for 2015 and 10 days for 2016 (< 90% threshold)
      for (let d = 1; d <= 10; d++) {
        const dd = d < 10 ? `0${d}` : `${d}`;
        records.push({ date: `2015-01-${dd}`, year: 2015, month: 1, day: d, precipitationMm: 5.0, tempMeanC: 15.0, tempMaxC: 20.0 });
        records.push({ date: `2016-01-${dd}`, year: 2016, month: 1, day: d, precipitationMm: 5.0, tempMeanC: 15.0, tempMaxC: 20.0 });
      }

      const indicators = processClimateRecords(records, testLocation, {
        startYear: 2015,
        endYear: 2016,
      });

      expect(indicators.quality.excludedYears).toEqual([2015, 2016]);
      expect(indicators.meanAnnualRainfallMm).toBe(0);
      expect(indicators.quality.notes.some((n) => n.includes("No complete years met the 90% completeness threshold"))).toBe(true);
    });
  });

  describe("Indicator Availability and Independent Seasonal Quality", () => {
    it("accepts a complete winter season even when an adjacent calendar year is excluded", () => {
      const records: DailyClimateRecord[] = [];

      // Complete Winter 2015-16 (121 days in leap year 2016):
      // Nov 2015 (30 days @ 1mm)
      // Dec 2015 (31 days @ 1mm)
      // Jan 2016 (31 days @ 2mm)
      // Feb 2016 (29 days @ 2mm)
      // Total = 30 + 31 + 62 + 58 = 181 mm
      for (let d = 1; d <= 30; d++) {
        const dd = d < 10 ? `0${d}` : `${d}`;
        records.push({ date: `2015-11-${dd}`, year: 2015, month: 11, day: d, precipitationMm: 1.0, tempMeanC: 18, tempMaxC: 25 });
      }
      for (let d = 1; d <= 31; d++) {
        const dd = d < 10 ? `0${d}` : `${d}`;
        records.push({ date: `2015-12-${dd}`, year: 2015, month: 12, day: d, precipitationMm: 1.0, tempMeanC: 14, tempMaxC: 20 });
      }
      for (let d = 1; d <= 31; d++) {
        const dd = d < 10 ? `0${d}` : `${d}`;
        records.push({ date: `2016-01-${dd}`, year: 2016, month: 1, day: d, precipitationMm: 2.0, tempMeanC: 12, tempMaxC: 18 });
      }
      for (let d = 1; d <= 29; d++) {
        const dd = d < 10 ? `0${d}` : `${d}`;
        records.push({ date: `2016-02-${dd}`, year: 2016, month: 2, day: d, precipitationMm: 2.0, tempMeanC: 15, tempMaxC: 22 });
      }

      // Add just 10 days for July 2015 (causing calendar year 2015 to fail annual completeness)
      for (let d = 1; d <= 10; d++) {
        const dd = d < 10 ? `0${d}` : `${d}`;
        records.push({ date: `2015-07-${dd}`, year: 2015, month: 7, day: d, precipitationMm: 5.0, tempMeanC: 30, tempMaxC: 35 });
      }

      const res = calculateSeasonalRainfallWithAvailability(records);
      expect(res.seasonalRainfallMm.winterMm).toBe(181);
      expect(res.availability.winter.available).toBe(true);
      expect(res.availability.winter.validYearCount).toBe(1);
    });

    it("accepts a complete dry season even when an adjacent calendar year is excluded", () => {
      const records: DailyClimateRecord[] = [];

      const generateDrySeason = (startYear: number, dailyMm: number) => {
        for (let d = 1; d <= 30; d++) {
          const dd = d < 10 ? `0${d}` : `${d}`;
          records.push({ date: `${startYear}-11-${dd}`, year: startYear, month: 11, day: d, precipitationMm: dailyMm, tempMeanC: 20, tempMaxC: 28 });
        }
        for (let d = 1; d <= 31; d++) {
          const dd = d < 10 ? `0${d}` : `${d}`;
          records.push({ date: `${startYear}-12-${dd}`, year: startYear, month: 12, day: d, precipitationMm: dailyMm, tempMeanC: 15, tempMaxC: 22 });
        }
        const y2 = startYear + 1;
        const febDays = isLeapYear(y2) ? 29 : 28;
        for (let d = 1; d <= 31; d++) {
          const dd = d < 10 ? `0${d}` : `${d}`;
          records.push({ date: `${y2}-01-${dd}`, year: y2, month: 1, day: d, precipitationMm: dailyMm, tempMeanC: 12, tempMaxC: 18 });
        }
        for (let d = 1; d <= febDays; d++) {
          const dd = d < 10 ? `0${d}` : `${d}`;
          records.push({ date: `${y2}-02-${dd}`, year: y2, month: 2, day: d, precipitationMm: dailyMm, tempMeanC: 15, tempMaxC: 22 });
        }
        for (let d = 1; d <= 31; d++) {
          const dd = d < 10 ? `0${d}` : `${d}`;
          records.push({ date: `${y2}-03-${dd}`, year: y2, month: 3, day: d, precipitationMm: dailyMm, tempMeanC: 22, tempMaxC: 30 });
        }
        for (let d = 1; d <= 30; d++) {
          const dd = d < 10 ? `0${d}` : `${d}`;
          records.push({ date: `${y2}-04-${dd}`, year: y2, month: 4, day: d, precipitationMm: dailyMm, tempMeanC: 28, tempMaxC: 36 });
        }
        for (let d = 1; d <= 31; d++) {
          const dd = d < 10 ? `0${d}` : `${d}`;
          records.push({ date: `${y2}-05-${dd}`, year: y2, month: 5, day: d, precipitationMm: dailyMm, tempMeanC: 32, tempMaxC: 40 });
        }
      };

      // Create 2 complete dry seasons (2015-16 and 2016-17)
      generateDrySeason(2015, 1.0);
      generateDrySeason(2016, 0.5);

      // Add 5 days in August 2015 (so calendar year 2015 fails annual completeness)
      for (let d = 1; d <= 5; d++) {
        const dd = d < 10 ? `0${d}` : `${d}`;
        records.push({ date: `2015-08-${dd}`, year: 2015, month: 8, day: d, precipitationMm: 10, tempMeanC: 30, tempMaxC: 35 });
      }

      const res = calculateDrySeasonDeficitFrequencyWithAvailability(records);
      expect(res.availability.available).toBe(true);
      expect(res.availability.validYearCount).toBe(2);
      expect(res.frequencyPercent).toBe(50.0);
    });

    it("distinguishes genuine zero rainfall from unavailable rainfall", () => {
      const recordsZero: DailyClimateRecord[] = [];
      // Complete Winter 2015-16 with 0.0mm every day
      for (let d = 1; d <= 30; d++) {
        const dd = d < 10 ? `0${d}` : `${d}`;
        recordsZero.push({ date: `2015-11-${dd}`, year: 2015, month: 11, day: d, precipitationMm: 0.0, tempMeanC: 18, tempMaxC: 25 });
      }
      for (let d = 1; d <= 31; d++) {
        const dd = d < 10 ? `0${d}` : `${d}`;
        recordsZero.push({ date: `2015-12-${dd}`, year: 2015, month: 12, day: d, precipitationMm: 0.0, tempMeanC: 14, tempMaxC: 20 });
      }
      for (let d = 1; d <= 31; d++) {
        const dd = d < 10 ? `0${d}` : `${d}`;
        recordsZero.push({ date: `2016-01-${dd}`, year: 2016, month: 1, day: d, precipitationMm: 0.0, tempMeanC: 12, tempMaxC: 18 });
      }
      for (let d = 1; d <= 29; d++) {
        const dd = d < 10 ? `0${d}` : `${d}`;
        recordsZero.push({ date: `2016-02-${dd}`, year: 2016, month: 2, day: d, precipitationMm: 0.0, tempMeanC: 15, tempMaxC: 22 });
      }

      const resZero = calculateSeasonalRainfallWithAvailability(recordsZero);
      expect(resZero.seasonalRainfallMm.winterMm).toBe(0);
      expect(resZero.availability.winter.available).toBe(true);
      expect(resZero.availability.winter.validYearCount).toBe(1);

      // Empty records (unavailable)
      const resEmpty = calculateSeasonalRainfallWithAvailability([]);
      expect(resEmpty.seasonalRainfallMm.winterMm).toBe(0); // Numeric fallback
      expect(resEmpty.availability.winter.available).toBe(false);
      expect(resEmpty.availability.winter.validYearCount).toBe(0);
      expect(resEmpty.availability.winter.reason).toContain("threshold");
    });

    it("marks monthly indicators unavailable when no qualifying years exist", () => {
      const records: DailyClimateRecord[] = [];
      // Provide only 5 days in January 2015 (< 90% threshold)
      for (let d = 1; d <= 5; d++) {
        const dd = d < 10 ? `0${d}` : `${d}`;
        records.push({ date: `2015-01-${dd}`, year: 2015, month: 1, day: d, precipitationMm: 1.0, tempMeanC: 10, tempMaxC: 15 });
      }

      const res = calculateMonthlyMeansWithAvailability(records);
      expect(res.monthlyMeanPrecipitationMm[1]).toBe(0);
      expect(res.monthlyPrecipitationAvailability[1].available).toBe(false);
      expect(res.monthlyMeanMaxTempC[1]).toBe(0);
      expect(res.monthlyMaxTemperatureAvailability[1].available).toBe(false);
    });

    it("identifies single-year monthly results as isMultiYear = false", () => {
      const records: DailyClimateRecord[] = [];
      // Complete January 2015 (31 days)
      for (let d = 1; d <= 31; d++) {
        const dd = d < 10 ? `0${d}` : `${d}`;
        records.push({ date: `2015-01-${dd}`, year: 2015, month: 1, day: d, precipitationMm: 2.0, tempMeanC: 10, tempMaxC: 15 });
      }

      const res = calculateMonthlyMeansWithAvailability(records);
      expect(res.monthlyPrecipitationAvailability[1].available).toBe(true);
      expect(res.monthlyPrecipitationAvailability[1].validYearCount).toBe(1);
      expect(res.monthlyPrecipitationAvailability[1].isMultiYear).toBe(false);

      expect(res.monthlyMaxTemperatureAvailability[1].available).toBe(true);
      expect(res.monthlyMaxTemperatureAvailability[1].validYearCount).toBe(1);
      expect(res.monthlyMaxTemperatureAvailability[1].isMultiYear).toBe(false);
    });

    it("marks rainfall variability unavailable when fewer than 2 complete years exist", () => {
      const testLocation: Location = { latitude: 30.9, longitude: 75.85 };
      const records: DailyClimateRecord[] = [];
      // Exactly 1 complete year (2015)
      const dates = generateExpectedDates(2015, 2015);
      for (const d of dates) {
        const [y, m, day] = d.split("-").map(Number);
        records.push({ date: d, year: y, month: m, day, precipitationMm: 2.0, tempMeanC: 25, tempMaxC: 30 });
      }

      const indicators = processClimateRecords(records, testLocation, { startYear: 2015, endYear: 2015 });
      expect(indicators.rainfallVariabilityCvPercent).toBe(0);
      expect(indicators.availability?.rainfallVariability.available).toBe(false);
      expect(indicators.availability?.rainfallVariability.reason).toContain("At least 2 complete years");
    });

    it("marks dry-season deficit unavailable when fewer than 2 complete seasons exist", () => {
      const records: DailyClimateRecord[] = [];
      // Only 1 complete dry season (2015-16)
      const startYear = 2015;
      for (let d = 1; d <= 30; d++) {
        const dd = d < 10 ? `0${d}` : `${d}`;
        records.push({ date: `${startYear}-11-${dd}`, year: startYear, month: 11, day: d, precipitationMm: 1.0, tempMeanC: 20, tempMaxC: 28 });
      }
      for (let d = 1; d <= 31; d++) {
        const dd = d < 10 ? `0${d}` : `${d}`;
        records.push({ date: `${startYear}-12-${dd}`, year: startYear, month: 12, day: d, precipitationMm: 1.0, tempMeanC: 15, tempMaxC: 22 });
      }
      for (let d = 1; d <= 31; d++) {
        const dd = d < 10 ? `0${d}` : `${d}`;
        records.push({ date: `2016-01-${dd}`, year: 2016, month: 1, day: d, precipitationMm: 1.0, tempMeanC: 12, tempMaxC: 18 });
      }
      for (let d = 1; d <= 29; d++) {
        const dd = d < 10 ? `0${d}` : `${d}`;
        records.push({ date: `2016-02-${dd}`, year: 2016, month: 2, day: d, precipitationMm: 1.0, tempMeanC: 15, tempMaxC: 22 });
      }
      for (let d = 1; d <= 31; d++) {
        const dd = d < 10 ? `0${d}` : `${d}`;
        records.push({ date: `2016-03-${dd}`, year: 2016, month: 3, day: d, precipitationMm: 1.0, tempMeanC: 22, tempMaxC: 30 });
      }
      for (let d = 1; d <= 30; d++) {
        const dd = d < 10 ? `0${d}` : `${d}`;
        records.push({ date: `2016-04-${dd}`, year: 2016, month: 4, day: d, precipitationMm: 1.0, tempMeanC: 28, tempMaxC: 36 });
      }
      for (let d = 1; d <= 31; d++) {
        const dd = d < 10 ? `0${d}` : `${d}`;
        records.push({ date: `2016-05-${dd}`, year: 2016, month: 5, day: d, precipitationMm: 1.0, tempMeanC: 32, tempMaxC: 40 });
      }

      const res = calculateDrySeasonDeficitFrequencyWithAvailability(records);
      expect(res.frequencyPercent).toBe(0);
      expect(res.availability.available).toBe(false);
      expect(res.availability.reason).toContain("At least 2 complete");
    });

    it("marks dry-season deficit unavailable when reference mean is zero", () => {
      const records: DailyClimateRecord[] = [];
      const generateZeroDrySeason = (startYear: number) => {
        for (let d = 1; d <= 30; d++) {
          const dd = d < 10 ? `0${d}` : `${d}`;
          records.push({ date: `${startYear}-11-${dd}`, year: startYear, month: 11, day: d, precipitationMm: 0.0, tempMeanC: 20, tempMaxC: 28 });
        }
        for (let d = 1; d <= 31; d++) {
          const dd = d < 10 ? `0${d}` : `${d}`;
          records.push({ date: `${startYear}-12-${dd}`, year: startYear, month: 12, day: d, precipitationMm: 0.0, tempMeanC: 15, tempMaxC: 22 });
        }
        const y2 = startYear + 1;
        const febDays = isLeapYear(y2) ? 29 : 28;
        for (let d = 1; d <= 31; d++) {
          const dd = d < 10 ? `0${d}` : `${d}`;
          records.push({ date: `${y2}-01-${dd}`, year: y2, month: 1, day: d, precipitationMm: 0.0, tempMeanC: 12, tempMaxC: 18 });
        }
        for (let d = 1; d <= febDays; d++) {
          const dd = d < 10 ? `0${d}` : `${d}`;
          records.push({ date: `${y2}-02-${dd}`, year: y2, month: 2, day: d, precipitationMm: 0.0, tempMeanC: 15, tempMaxC: 22 });
        }
        for (let d = 1; d <= 31; d++) {
          const dd = d < 10 ? `0${d}` : `${d}`;
          records.push({ date: `${y2}-03-${dd}`, year: y2, month: 3, day: d, precipitationMm: 0.0, tempMeanC: 22, tempMaxC: 30 });
        }
        for (let d = 1; d <= 30; d++) {
          const dd = d < 10 ? `0${d}` : `${d}`;
          records.push({ date: `${y2}-04-${dd}`, year: y2, month: 4, day: d, precipitationMm: 0.0, tempMeanC: 28, tempMaxC: 36 });
        }
        for (let d = 1; d <= 31; d++) {
          const dd = d < 10 ? `0${d}` : `${d}`;
          records.push({ date: `${y2}-05-${dd}`, year: y2, month: 5, day: d, precipitationMm: 0.0, tempMeanC: 32, tempMaxC: 40 });
        }
      };

      generateZeroDrySeason(2015);
      generateZeroDrySeason(2016);

      const res = calculateDrySeasonDeficitFrequencyWithAvailability(records);
      expect(res.frequencyPercent).toBe(0);
      expect(res.availability.available).toBe(false);
      expect(res.availability.reason).toContain("zero");
    });
  });

});


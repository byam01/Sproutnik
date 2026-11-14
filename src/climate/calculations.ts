import {
  DailyClimateRecord,
  IndicatorAvailabilityItem,
  PunjabSeason,
  SeasonalRainfall,
  SeasonalRainfallAvailability,
} from "@/types";
import { isLeapYear } from "./quality";

/**
 * Maps calendar month (1 - 12) to Punjab prototype reporting season:
 * - Winter: Nov (11), Dec (12), Jan (1), Feb (2)
 * - Summer: Mar (3), Apr (4), May (5)
 * - Monsoon: Jun (6), Jul (7), Aug (8), Sep (9)
 * - Post-monsoon / transition: Oct (10)
 */
export function getPunjabSeason(month: number): PunjabSeason | "post_monsoon" {
  if (month === 11 || month === 12 || month === 1 || month === 2) {
    return "winter";
  }
  if (month >= 3 && month <= 5) {
    return "summer";
  }
  if (month >= 6 && month <= 9) {
    return "monsoon";
  }
  return "post_monsoon";
}

/**
 * Maps a calendar date to its agricultural season-year:
 * - Winter: spans November of Year Y through February of Year Y+1 (Rabi window).
 *   Nov and Dec of Year Y belong to season-year Y (Winter Y-(Y+1)).
 *   Jan and Feb of Year Y belong to season-year Y - 1 (Winter (Y-1)-Y).
 * - Summer, Monsoon, Post-monsoon: contained within calendar year Y (season-year Y).
 */
export function getAgriculturalSeasonYear(
  year: number,
  month: number,
  season: PunjabSeason | "post_monsoon"
): number {
  if (season === "winter") {
    return month === 1 || month === 2 ? year - 1 : year;
  }
  return year;
}

/**
 * Returns number of calendar days in a month.
 */
export function getDaysInMonth(year: number, month: number): number {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }
  if (month === 4 || month === 6 || month === 9 || month === 11) {
    return 30;
  }
  return 31;
}

/**
 * Returns the expected number of calendar days in an agricultural season:
 * - Winter (Nov Y - Feb Y+1): 30 + 31 + 31 + (28 or 29 in Y+1) = 120 or 121 days.
 * - Summer (Mar Y - May Y): 31 + 30 + 31 = 92 days.
 * - Monsoon (Jun Y - Sep Y): 30 + 31 + 31 + 30 = 122 days.
 * - Post-monsoon (Oct Y): 31 days.
 */
export function getExpectedSeasonDays(
  season: PunjabSeason | "post_monsoon",
  seasonYear: number
): number {
  if (season === "winter") {
    return isLeapYear(seasonYear + 1) ? 121 : 120;
  }
  if (season === "summer") {
    return 92;
  }
  if (season === "monsoon") {
    return 122;
  }
  return 31;
}

/**
 * Calculates arithmetic mean of an array of numbers.
 * Returns null if the array is empty or contains no valid finite numbers.
 * Genuine 0.0 is preserved as a valid observation.
 */
export function calculateMean(values: number[]): number | null {
  if (!values || values.length === 0) return null;
  const valid = values.filter((v) => typeof v === "number" && Number.isFinite(v));
  if (valid.length === 0) return null;
  const sum = valid.reduce((acc, val) => acc + val, 0);
  return sum / valid.length;
}

/**
 * Calculates sample standard deviation:
 * s = sqrt( (1 / (N - 1)) * sum((x_i - mean)^2) )
 * Returns null if fewer than 2 valid observations are available.
 */
export function calculateSampleStandardDeviation(values: number[]): number | null {
  if (!values || values.length < 2) return null;
  const valid = values.filter((v) => typeof v === "number" && Number.isFinite(v));
  if (valid.length < 2) return null;
  const mean = calculateMean(valid);
  if (mean === null) return null;
  const sumSquaredDiffs = valid.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0);
  return Math.sqrt(sumSquaredDiffs / (valid.length - 1));
}

/**
 * Calculates Coefficient of Variation (CV%):
 * CV = (sampleStdDev / mean) * 100%
 * Returns null if fewer than 2 values exist or if mean is 0.
 */
export function calculateCoefficientOfVariation(values: number[]): number | null {
  if (!values || values.length < 2) return null;
  const mean = calculateMean(values);
  if (mean === null || mean === 0) return null;
  const std = calculateSampleStandardDeviation(values);
  if (std === null) return null;
  return (std / mean) * 100;
}

/**
 * Aggregates annual rainfall for complete/valid years.
 * Missing days are NOT treated as 0: if a year is in excludedYears, it is omitted.
 * Genuine zero rainfall across all days is preserved as 0.0 mm.
 */
export function calculateAnnualRainfallByYear(
  records: DailyClimateRecord[],
  excludedYears: number[] = []
): Record<number, number> {
  const excludedSet = new Set(excludedYears);
  const yearlyTotals: Record<number, number> = {};

  for (const rec of records) {
    if (excludedSet.has(rec.year)) continue;
    if (rec.precipitationMm === null || !Number.isFinite(rec.precipitationMm)) continue;

    yearlyTotals[rec.year] = (yearlyTotals[rec.year] || 0) + rec.precipitationMm;
  }

  // Round to 1 decimal place
  const rounded: Record<number, number> = {};
  for (const [y, total] of Object.entries(yearlyTotals)) {
    rounded[Number(y)] = Number(total.toFixed(1));
  }
  return rounded;
}

export interface SeasonalRainfallCalculationResult {
  seasonalRainfallMm: SeasonalRainfall;
  availability: SeasonalRainfallAvailability;
}

/**
 * Calculates seasonal rainfall averages and availability across valid complete agricultural seasons.
 *
 * Seasonal grouping and quality rules:
 * - A season is evaluated independently using its own observations and completeness (>= 90% of expected days).
 * - A complete season is NOT rejected solely because an adjacent calendar year failed annual completeness.
 * - Winter: Nov Y, Dec Y, Jan Y+1, Feb Y+1 (Winter Y-(Y+1)).
 *   Boundary fragments and incomplete seasons (< 90% completeness) are excluded.
 * - Summer, Monsoon, Post-monsoon: grouped within calendar year Y.
 *   Incomplete seasons (< 90% completeness) are excluded.
 * - Genuine 0.0 mm rainfall across all days in a season is preserved as 0.0 mm.
 */
export function calculateSeasonalRainfallWithAvailability(
  records: DailyClimateRecord[]
): SeasonalRainfallCalculationResult {
  // Group by (season, seasonYear) to collect sums and valid day counts
  const seasonStats: Record<string, Record<number, { sum: number; count: number }>> = {
    winter: {},
    summer: {},
    monsoon: {},
    post_monsoon: {},
  };

  for (const rec of records) {
    if (rec.precipitationMm === null || !Number.isFinite(rec.precipitationMm)) continue;

    const season = getPunjabSeason(rec.month);
    const seasonYear = getAgriculturalSeasonYear(rec.year, rec.month, season);

    if (!seasonStats[season][seasonYear]) {
      seasonStats[season][seasonYear] = { sum: 0, count: 0 };
    }
    seasonStats[season][seasonYear].sum += rec.precipitationMm;
    seasonStats[season][seasonYear].count += 1;
  }

  // Filter seasons independently by their own completeness (>= 90% of expected days)
  const completeSeasonTotals: Record<string, number[]> = {
    winter: [],
    summer: [],
    monsoon: [],
    post_monsoon: [],
  };
  const seasonObservationCounts: Record<string, number> = {
    winter: 0,
    summer: 0,
    monsoon: 0,
    post_monsoon: 0,
  };

  for (const season of ["winter", "summer", "monsoon", "post_monsoon"] as const) {
    for (const [syStr, stats] of Object.entries(seasonStats[season])) {
      const sy = Number(syStr);
      const expectedDays = getExpectedSeasonDays(season, sy);

      if (stats.count / expectedDays >= 0.90) {
        completeSeasonTotals[season].push(stats.sum);
        seasonObservationCounts[season] += stats.count;
      }
    }
  }

  const buildSeasonItem = (
    seasonKey: string
  ): { mean: number; item: IndicatorAvailabilityItem } => {
    const totals = completeSeasonTotals[seasonKey];
    if (totals.length === 0) {
      return {
        mean: 0,
        item: {
          available: false,
          validObservationCount: 0,
          validYearCount: 0,
          isMultiYear: false,
          reason: `No complete ${seasonKey} seasons met the 90% seasonal completeness threshold.`,
        },
      };
    }
    const meanVal = calculateMean(totals);
    const roundedMean = meanVal !== null ? Number(meanVal.toFixed(1)) : 0;
    return {
      mean: roundedMean,
      item: {
        available: true,
        validObservationCount: seasonObservationCounts[seasonKey],
        validYearCount: totals.length,
        isMultiYear: totals.length > 1,
      },
    };
  };

  const winterRes = buildSeasonItem("winter");
  const summerRes = buildSeasonItem("summer");
  const monsoonRes = buildSeasonItem("monsoon");
  const postMonsoonRes = buildSeasonItem("post_monsoon");

  return {
    seasonalRainfallMm: {
      winterMm: winterRes.mean,
      summerMm: summerRes.mean,
      monsoonMm: monsoonRes.mean,
      postMonsoonMm: postMonsoonRes.mean,
    },
    availability: {
      winter: winterRes.item,
      summer: summerRes.item,
      monsoon: monsoonRes.item,
      postMonsoon: postMonsoonRes.item,
    },
  };
}

/**
 * Backward-compatible wrapper returning SeasonalRainfall
 */
export function calculateSeasonalRainfall(
  records: DailyClimateRecord[],
  _excludedYears: number[] = []
): SeasonalRainfall {
  return calculateSeasonalRainfallWithAvailability(records).seasonalRainfallMm;
}

export interface MonthlyMeansCalculationResult {
  monthlyMeanPrecipitationMm: Record<number, number>;
  monthlyMeanMaxTempC: Record<number, number>;
  monthlyPrecipitationAvailability: Record<number, IndicatorAvailabilityItem>;
  monthlyMaxTemperatureAvailability: Record<number, IndicatorAvailabilityItem>;
}

/**
 * Calculates monthly mean values and availability for precipitation and maximum temperature.
 *
 * Methodological rules:
 * - Two-stage climatological aggregation: monthly means are first computed per year,
 *   then averaged across valid non-excluded years (giving each year equal weight).
 * - Genuine 0.0°C and 0.0 mm observations remain valid.
 * - Missing values are excluded, not converted to zero.
 */
export function calculateMonthlyMeansWithAvailability(
  records: DailyClimateRecord[],
  excludedYears: number[] = []
): MonthlyMeansCalculationResult {
  const excludedSet = new Set(excludedYears);

  // For precipitation: sum per month per year
  const precipByMonthYear: Record<number, Record<number, { sum: number; count: number }>> = {};
  // For temperature: daily values per month per year
  const tempByMonthYear: Record<number, Record<number, number[]>> = {};

  for (let m = 1; m <= 12; m++) {
    precipByMonthYear[m] = {};
    tempByMonthYear[m] = {};
  }

  for (const rec of records) {
    if (excludedSet.has(rec.year)) continue;

    if (rec.precipitationMm !== null && Number.isFinite(rec.precipitationMm)) {
      if (!precipByMonthYear[rec.month][rec.year]) {
        precipByMonthYear[rec.month][rec.year] = { sum: 0, count: 0 };
      }
      precipByMonthYear[rec.month][rec.year].sum += rec.precipitationMm;
      precipByMonthYear[rec.month][rec.year].count += 1;
    }

    if (rec.tempMaxC !== null && Number.isFinite(rec.tempMaxC)) {
      if (!tempByMonthYear[rec.month][rec.year]) {
        tempByMonthYear[rec.month][rec.year] = [];
      }
      tempByMonthYear[rec.month][rec.year].push(rec.tempMaxC);
    }
  }

  const monthlyMeanPrecipitationMm: Record<number, number> = {};
  const monthlyMeanMaxTempC: Record<number, number> = {};
  const monthlyPrecipitationAvailability: Record<number, IndicatorAvailabilityItem> = {};
  const monthlyMaxTemperatureAvailability: Record<number, IndicatorAvailabilityItem> = {};

  for (let m = 1; m <= 12; m++) {
    // Precipitation
    const yearlyPrecipTotals: number[] = [];
    let precipObsCount = 0;
    for (const [yStr, stats] of Object.entries(precipByMonthYear[m])) {
      const y = Number(yStr);
      const daysInMonth = getDaysInMonth(y, m);
      if (stats.count / daysInMonth >= 0.90) {
        yearlyPrecipTotals.push(stats.sum);
        precipObsCount += stats.count;
      }
    }
    const pYearCount = yearlyPrecipTotals.length;
    if (pYearCount > 0) {
      const meanPrecip = calculateMean(yearlyPrecipTotals);
      monthlyMeanPrecipitationMm[m] = meanPrecip !== null ? Number(meanPrecip.toFixed(1)) : 0;
      monthlyPrecipitationAvailability[m] = {
        available: true,
        validObservationCount: precipObsCount,
        validYearCount: pYearCount,
        isMultiYear: pYearCount > 1,
      };
    } else {
      monthlyMeanPrecipitationMm[m] = 0;
      monthlyPrecipitationAvailability[m] = {
        available: false,
        validObservationCount: 0,
        validYearCount: 0,
        isMultiYear: false,
        reason: "No years met the 90% monthly completeness threshold.",
      };
    }

    // Temperature
    const yearlyMonthlyTempMeans: number[] = [];
    let tempObsCount = 0;
    for (const [yStr, dailyTemps] of Object.entries(tempByMonthYear[m])) {
      const y = Number(yStr);
      const daysInMonth = getDaysInMonth(y, m);
      if (dailyTemps.length / daysInMonth >= 0.90) {
        const yMonthMean = calculateMean(dailyTemps);
        if (yMonthMean !== null) {
          yearlyMonthlyTempMeans.push(yMonthMean);
          tempObsCount += dailyTemps.length;
        }
      }
    }
    const tYearCount = yearlyMonthlyTempMeans.length;
    if (tYearCount > 0) {
      const meanTemp = calculateMean(yearlyMonthlyTempMeans);
      monthlyMeanMaxTempC[m] = meanTemp !== null ? Number(meanTemp.toFixed(1)) : 0;
      monthlyMaxTemperatureAvailability[m] = {
        available: true,
        validObservationCount: tempObsCount,
        validYearCount: tYearCount,
        isMultiYear: tYearCount > 1,
      };
    } else {
      monthlyMeanMaxTempC[m] = 0;
      monthlyMaxTemperatureAvailability[m] = {
        available: false,
        validObservationCount: 0,
        validYearCount: 0,
        isMultiYear: false,
        reason: "No years met the 90% monthly completeness threshold.",
      };
    }
  }

  return {
    monthlyMeanPrecipitationMm,
    monthlyMeanMaxTempC,
    monthlyPrecipitationAvailability,
    monthlyMaxTemperatureAvailability,
  };
}

/**
 * Backward-compatible wrapper returning monthly means
 */
export function calculateMonthlyMeans(
  records: DailyClimateRecord[],
  excludedYears: number[] = []
): {
  monthlyMeanPrecipitationMm: Record<number, number>;
  monthlyMeanMaxTempC: Record<number, number>;
} {
  const res = calculateMonthlyMeansWithAvailability(records, excludedYears);
  return {
    monthlyMeanPrecipitationMm: res.monthlyMeanPrecipitationMm,
    monthlyMeanMaxTempC: res.monthlyMeanMaxTempC,
  };
}

export interface DrySeasonDeficitCalculationResult {
  frequencyPercent: number;
  availability: IndicatorAvailabilityItem;
}

/**
 * Calculates historical dry-season deficit frequency and availability.
 *
 * Agricultural dry season in Punjab: Nov through May (7 continuous months across calendar years).
 * - Nov Y and Dec Y belong to Dry Season Y (Dry Season Y-(Y+1)).
 * - Jan Y+1 through May Y+1 belong to Dry Season Y (Dry Season Y-(Y+1)).
 * - Evaluated independently: a complete dry season is not rejected solely because an adjacent calendar year failed annual completeness.
 * - Incomplete dry seasons (boundary fragments, missing months) are excluded.
 * - Deficit condition: seasonal rainfall < 75% of multi-year mean dry-season total.
 * - Genuine 0.0 mm rainfall across all days is preserved and flagged as a deficit.
 * - If mean reference rainfall is zero, the deficit calculation is undefined and marked unavailable.
 */
export function calculateDrySeasonDeficitFrequencyWithAvailability(
  records: DailyClimateRecord[]
): DrySeasonDeficitCalculationResult {
  const drySeasonStats: Record<number, { sum: number; count: number }> = {};

  for (const rec of records) {
    if (rec.precipitationMm === null || !Number.isFinite(rec.precipitationMm)) continue;

    // Months 11, 12, 1, 2, 3, 4, 5
    if (rec.month === 11 || rec.month === 12 || rec.month <= 5) {
      const seasonYear = rec.month === 11 || rec.month === 12 ? rec.year : rec.year - 1;

      if (!drySeasonStats[seasonYear]) {
        drySeasonStats[seasonYear] = { sum: 0, count: 0 };
      }
      drySeasonStats[seasonYear].sum += rec.precipitationMm;
      drySeasonStats[seasonYear].count += 1;
    }
  }

  // Filter complete dry seasons by their own completeness (>= 90% of expected days)
  const completeDrySeasonTotals: number[] = [];
  let totalObsCount = 0;

  for (const [syStr, stats] of Object.entries(drySeasonStats)) {
    const sy = Number(syStr);
    const expectedDays = isLeapYear(sy + 1) ? 213 : 212;

    if (stats.count / expectedDays >= 0.90) {
      completeDrySeasonTotals.push(stats.sum);
      totalObsCount += stats.count;
    }
  }

  const validSeasonCount = completeDrySeasonTotals.length;

  // Requirement: Minimum of 2 complete seasons required
  if (validSeasonCount < 2) {
    return {
      frequencyPercent: 0,
      availability: {
        available: false,
        validObservationCount: totalObsCount,
        validYearCount: validSeasonCount,
        isMultiYear: false,
        reason: "At least 2 complete 7-month dry seasons are required to calculate deficit frequency.",
      },
    };
  }

  const meanDryTotal = calculateMean(completeDrySeasonTotals);

  // Requirement: If mean reference rainfall is zero, deficit calculation is undefined
  if (meanDryTotal === null || meanDryTotal === 0) {
    return {
      frequencyPercent: 0,
      availability: {
        available: false,
        validObservationCount: totalObsCount,
        validYearCount: validSeasonCount,
        isMultiYear: true,
        reason: "Mean reference dry-season rainfall is zero; deficit frequency is undefined.",
      },
    };
  }

  const deficitThreshold = meanDryTotal * 0.75; // below 75% of average dry-season rain
  const deficitCount = completeDrySeasonTotals.filter((t) => t < deficitThreshold).length;
  const frequencyPercent = Number(((deficitCount / validSeasonCount) * 100).toFixed(1));

  return {
    frequencyPercent,
    availability: {
      available: true,
      validObservationCount: totalObsCount,
      validYearCount: validSeasonCount,
      isMultiYear: true,
    },
  };
}

/**
 * Backward-compatible wrapper returning deficit frequency percentage
 */
export function calculateDrySeasonDeficitFrequency(
  records: DailyClimateRecord[],
  _excludedYears: number[] = []
): number {
  return calculateDrySeasonDeficitFrequencyWithAvailability(records).frequencyPercent;
}

import { DailyClimateRecord, PunjabSeason, SeasonalRainfall } from "@/types";

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
 * Calculates arithmetic mean of an array of numbers, ignoring null/undefined
 */
export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}

/**
 * Calculates sample standard deviation:
 * s = sqrt( (1 / (N - 1)) * sum((x_i - mean)^2) )
 */
export function calculateSampleStandardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = calculateMean(values);
  const sumSquaredDiffs = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0);
  return Math.sqrt(sumSquaredDiffs / (values.length - 1));
}

/**
 * Calculates Coefficient of Variation (CV%):
 * CV = (sampleStdDev / mean) * 100%
 */
export function calculateCoefficientOfVariation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = calculateMean(values);
  if (mean === 0) return 0;
  const std = calculateSampleStandardDeviation(values);
  return (std / mean) * 100;
}

/**
 * Aggregates annual rainfall for complete/valid years.
 * Missing days are NOT treated as 0: if a year is in excludedYears, it is omitted.
 */
export function calculateAnnualRainfallByYear(
  records: DailyClimateRecord[],
  excludedYears: number[] = []
): Record<number, number> {
  const excludedSet = new Set(excludedYears);
  const yearlyTotals: Record<number, number> = {};

  for (const rec of records) {
    if (excludedSet.has(rec.year)) continue;
    if (rec.precipitationMm === null) continue;

    yearlyTotals[rec.year] = (yearlyTotals[rec.year] || 0) + rec.precipitationMm;
  }

  // Round to 1 decimal place
  const rounded: Record<number, number> = {};
  for (const [y, total] of Object.entries(yearlyTotals)) {
    rounded[Number(y)] = Number(total.toFixed(1));
  }
  return rounded;
}

/**
 * Calculates seasonal rainfall averages across valid years.
 */
export function calculateSeasonalRainfall(
  records: DailyClimateRecord[],
  excludedYears: number[] = []
): SeasonalRainfall {
  const excludedSet = new Set(excludedYears);

  // Group by (year, season) to find annual totals per season first
  const seasonTotalsPerYear: Record<string, Record<number, number>> = {
    winter: {},
    summer: {},
    monsoon: {},
    post_monsoon: {},
  };

  for (const rec of records) {
    if (excludedSet.has(rec.year)) continue;
    if (rec.precipitationMm === null) continue;

    const season = getPunjabSeason(rec.month);
    seasonTotalsPerYear[season][rec.year] =
      (seasonTotalsPerYear[season][rec.year] || 0) + rec.precipitationMm;
  }

  const getMean = (seasonKey: string) => {
    const vals = Object.values(seasonTotalsPerYear[seasonKey]);
    return vals.length > 0 ? Number(calculateMean(vals).toFixed(1)) : 0;
  };

  return {
    winterMm: getMean("winter"),
    summerMm: getMean("summer"),
    monsoonMm: getMean("monsoon"),
    postMonsoonMm: getMean("post_monsoon"),
  };
}

/**
 * Calculates monthly mean values for precipitation and maximum temperature.
 */
export function calculateMonthlyMeans(
  records: DailyClimateRecord[],
  excludedYears: number[] = []
): {
  monthlyMeanPrecipitationMm: Record<number, number>;
  monthlyMeanMaxTempC: Record<number, number>;
} {
  const excludedSet = new Set(excludedYears);

  // For precipitation: sum per month per year, then average across years
  const precipMonthlyPerYear: Record<number, Record<number, number>> = {};
  // For temp: collect daily max temps directly for the month
  const tempMonthlyDailyValues: Record<number, number[]> = {};

  for (let m = 1; m <= 12; m++) {
    precipMonthlyPerYear[m] = {};
    tempMonthlyDailyValues[m] = [];
  }

  for (const rec of records) {
    if (excludedSet.has(rec.year)) continue;

    if (rec.precipitationMm !== null) {
      precipMonthlyPerYear[rec.month][rec.year] =
        (precipMonthlyPerYear[rec.month][rec.year] || 0) + rec.precipitationMm;
    }

    if (rec.tempMaxC !== null) {
      tempMonthlyDailyValues[rec.month].push(rec.tempMaxC);
    }
  }

  const monthlyMeanPrecipitationMm: Record<number, number> = {};
  const monthlyMeanMaxTempC: Record<number, number> = {};

  for (let m = 1; m <= 12; m++) {
    const pYearlyVals = Object.values(precipMonthlyPerYear[m]);
    monthlyMeanPrecipitationMm[m] =
      pYearlyVals.length > 0 ? Number(calculateMean(pYearlyVals).toFixed(1)) : 0;

    const tVals = tempMonthlyDailyValues[m];
    monthlyMeanMaxTempC[m] =
      tVals.length > 0 ? Number(calculateMean(tVals).toFixed(1)) : 0;
  }

  return {
    monthlyMeanPrecipitationMm,
    monthlyMeanMaxTempC,
  };
}

/**
 * Calculates historical dry-season deficit frequency.
 * Dry season in Punjab: Nov through May (7 months: non-monsoon).
 * A year is deemed in deficit if its dry-season total falls below 75% of the multi-year mean dry-season total.
 */
export function calculateDrySeasonDeficitFrequency(
  records: DailyClimateRecord[],
  excludedYears: number[] = []
): number {
  const excludedSet = new Set(excludedYears);
  const drySeasonTotalsPerYear: Record<number, number> = {};

  for (const rec of records) {
    if (excludedSet.has(rec.year)) continue;
    if (rec.precipitationMm === null) continue;

    // Months 11, 12, 1, 2, 3, 4, 5
    if (rec.month === 11 || rec.month === 12 || rec.month <= 5) {
      drySeasonTotalsPerYear[rec.year] =
        (drySeasonTotalsPerYear[rec.year] || 0) + rec.precipitationMm;
    }
  }

  const totals = Object.values(drySeasonTotalsPerYear);
  if (totals.length < 2) return 0;

  const meanDryTotal = calculateMean(totals);
  const deficitThreshold = meanDryTotal * 0.75; // below 75% of average dry-season rain

  const deficitCount = totals.filter((t) => t < deficitThreshold).length;
  return Number(((deficitCount / totals.length) * 100).toFixed(1));
}

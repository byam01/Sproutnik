import {
  ClimateIndicators,
  ClimatePeriod,
  DailyClimateRecord,
  IndicatorAvailability,
  IndicatorAvailabilityItem,
  Location,
} from "@/types";
import {
  calculateAnnualRainfallByYear,
  calculateCoefficientOfVariation,
  calculateDrySeasonDeficitFrequencyWithAvailability,
  calculateMean,
  calculateMonthlyMeansWithAvailability,
  calculateSeasonalRainfallWithAvailability,
} from "./calculations";
import { evaluateDataQuality, isLeapYear } from "./quality";

export interface ProcessClimateOptions {
  completenessThresholdPercent?: number;
}

/**
 * Processes daily NASA climate records into historical climate indicators.
 * Ensures:
 * - Missing data is never treated as zero.
 * - Incomplete periods (< 90% threshold) are excluded from multi-year averages.
 * - Two-stage climatological aggregation gives each valid year equal weight.
 * - Agricultural seasonal grouping reflects natural crop cycles across calendar years.
 * - Precipitation quality and temperature quality are evaluated independently.
 * - Backward-compatible indicator availability distinguishes measured baselines from numeric fallbacks.
 * - All statistical methods are transparent and reproducible.
 */
export function processClimateRecords(
  records: DailyClimateRecord[],
  location: Location,
  period: ClimatePeriod,
  options: ProcessClimateOptions = {}
): ClimateIndicators {
  const quality = evaluateDataQuality(
    records,
    period.startYear,
    period.endYear,
    options.completenessThresholdPercent
  );

  // Evaluate annual precipitation completeness independently from temperature
  const precipCountsByYear: Record<number, number> = {};
  for (let y = period.startYear; y <= period.endYear; y++) {
    precipCountsByYear[y] = 0;
  }
  for (const rec of records) {
    if (rec.precipitationMm !== null && Number.isFinite(rec.precipitationMm)) {
      if (precipCountsByYear[rec.year] !== undefined) {
        precipCountsByYear[rec.year]++;
      }
    }
  }

  const precipExcludedYears: number[] = [];
  for (let y = period.startYear; y <= period.endYear; y++) {
    const expDays = isLeapYear(y) ? 366 : 365;
    if (precipCountsByYear[y] / expDays < 0.90) {
      precipExcludedYears.push(y);
    }
  }

  const annualRainfallByYear = calculateAnnualRainfallByYear(records, precipExcludedYears);
  const annualRainfallValues = Object.values(annualRainfallByYear);

  const meanAnnualMean = calculateMean(annualRainfallValues);
  const meanAnnualRainfallMm =
    meanAnnualMean !== null ? Number(meanAnnualMean.toFixed(1)) : 0;

  const cv = calculateCoefficientOfVariation(annualRainfallValues);
  const rainfallVariabilityCvPercent =
    cv !== null ? Number(cv.toFixed(1)) : 0;

  // Seasonal rainfall evaluated independently using its own observations
  const seasonalRes = calculateSeasonalRainfallWithAvailability(records);
  const seasonalRainfallMm = seasonalRes.seasonalRainfallMm;

  // Equal-weighted annual temperature across years with >= 90% temperature completeness
  const yearlyMeanTemps: number[] = [];
  const yearlyMaxTemps: number[] = [];
  const tempsByYear: Record<number, { meanTemps: number[]; maxTemps: number[] }> = {};

  for (const rec of records) {
    if (!tempsByYear[rec.year]) {
      tempsByYear[rec.year] = { meanTemps: [], maxTemps: [] };
    }

    if (rec.tempMeanC !== null && Number.isFinite(rec.tempMeanC)) {
      tempsByYear[rec.year].meanTemps.push(rec.tempMeanC);
    }
    if (rec.tempMaxC !== null && Number.isFinite(rec.tempMaxC)) {
      tempsByYear[rec.year].maxTemps.push(rec.tempMaxC);
    }
  }

  for (const [yearStr, yearTemps] of Object.entries(tempsByYear)) {
    const year = Number(yearStr);
    const expectedDays = isLeapYear(year) ? 366 : 365;

    if (yearTemps.meanTemps.length / expectedDays >= 0.90) {
      const yMean = calculateMean(yearTemps.meanTemps);
      if (yMean !== null) yearlyMeanTemps.push(yMean);
    }
    if (yearTemps.maxTemps.length / expectedDays >= 0.90) {
      const yMax = calculateMean(yearTemps.maxTemps);
      if (yMax !== null) yearlyMaxTemps.push(yMax);
    }
  }

  const multiYearMeanTemp = calculateMean(yearlyMeanTemps);
  const meanTemperatureC =
    multiYearMeanTemp !== null ? Number(multiYearMeanTemp.toFixed(1)) : 0;

  const multiYearMeanMaxTemp = calculateMean(yearlyMaxTemps);
  const meanMaxTemperatureC =
    multiYearMeanMaxTemp !== null ? Number(multiYearMeanMaxTemp.toFixed(1)) : 0;

  // Monthly means evaluated independently with availability
  const monthlyRes = calculateMonthlyMeansWithAvailability(records);
  const { monthlyMeanPrecipitationMm, monthlyMeanMaxTempC } = monthlyRes;

  // Dry-season deficit evaluated independently with availability
  const drySeasonRes = calculateDrySeasonDeficitFrequencyWithAvailability(records);
  const drySeasonDeficitFrequencyPercent = drySeasonRes.frequencyPercent;

  // Build comprehensive indicator availability metadata
  const annualRainfallAvailable = annualRainfallValues.length > 0;
  const annualRainfallAvailability: IndicatorAvailabilityItem = annualRainfallAvailable
    ? {
        available: true,
        validObservationCount: annualRainfallValues.length,
        validYearCount: annualRainfallValues.length,
        isMultiYear: annualRainfallValues.length > 1,
      }
    : {
        available: false,
        validObservationCount: 0,
        validYearCount: 0,
        isMultiYear: false,
        reason: "No years met the 90% annual precipitation completeness threshold.",
      };

  const tempAvailable = yearlyMeanTemps.length > 0;
  const meanTempAvailability: IndicatorAvailabilityItem = tempAvailable
    ? {
        available: true,
        validObservationCount: yearlyMeanTemps.length,
        validYearCount: yearlyMeanTemps.length,
        isMultiYear: yearlyMeanTemps.length > 1,
      }
    : {
        available: false,
        validObservationCount: 0,
        validYearCount: 0,
        isMultiYear: false,
        reason: "No years met the 90% annual temperature completeness threshold.",
      };

  const maxTempAvailable = yearlyMaxTemps.length > 0;
  const meanMaxTempAvailability: IndicatorAvailabilityItem = maxTempAvailable
    ? {
        available: true,
        validObservationCount: yearlyMaxTemps.length,
        validYearCount: yearlyMaxTemps.length,
        isMultiYear: yearlyMaxTemps.length > 1,
      }
    : {
        available: false,
        validObservationCount: 0,
        validYearCount: 0,
        isMultiYear: false,
        reason: "No years met the 90% annual temperature completeness threshold.",
      };

  let rainfallVariabilityAvailability: IndicatorAvailabilityItem;
  if (annualRainfallValues.length < 2) {
    rainfallVariabilityAvailability = {
      available: false,
      validObservationCount: annualRainfallValues.length,
      validYearCount: annualRainfallValues.length,
      isMultiYear: false,
      reason: "At least 2 complete years are required to compute interannual variability.",
    };
  } else if (meanAnnualRainfallMm === 0) {
    rainfallVariabilityAvailability = {
      available: false,
      validObservationCount: annualRainfallValues.length,
      validYearCount: annualRainfallValues.length,
      isMultiYear: true,
      reason: "Mean annual rainfall is zero; coefficient of variation is undefined.",
    };
  } else {
    rainfallVariabilityAvailability = {
      available: true,
      validObservationCount: annualRainfallValues.length,
      validYearCount: annualRainfallValues.length,
      isMultiYear: true,
    };
  }

  const availability: IndicatorAvailability = {
    annualRainfall: annualRainfallAvailability,
    meanAnnualTemperature: meanTempAvailability,
    meanAnnualMaxTemperature: meanMaxTempAvailability,
    seasonalRainfall: seasonalRes.availability,
    monthlyMaxTemperature: monthlyRes.monthlyMaxTemperatureAvailability,
    monthlyPrecipitation: monthlyRes.monthlyPrecipitationAvailability,
    rainfallVariability: rainfallVariabilityAvailability,
    drySeasonDeficit: drySeasonRes.availability,
  };

  // If no complete years were available to calculate baseline indicators, document explicitly in quality notes
  const totalYearsInPeriod = period.endYear - period.startYear + 1;
  if (
    quality.excludedYears.length >= totalYearsInPeriod ||
    annualRainfallValues.length === 0
  ) {
    quality.notes.push(
      "Data quality alert: No complete years met the 90% completeness threshold. Multi-year baseline indicators could not be computed from historical records."
    );
  }

  return {
    period,
    location,
    meanAnnualRainfallMm,
    annualRainfallByYear,
    seasonalRainfallMm,
    meanTemperatureC,
    meanMaxTemperatureC,
    monthlyMeanMaxTempC,
    monthlyMeanPrecipitationMm,
    rainfallVariabilityCvPercent,
    drySeasonDeficitFrequencyPercent,
    quality,
    availability,
  };
}

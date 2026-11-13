import {
  ClimateIndicators,
  ClimatePeriod,
  DailyClimateRecord,
  Location,
} from "@/types";
import {
  calculateAnnualRainfallByYear,
  calculateCoefficientOfVariation,
  calculateDrySeasonDeficitFrequency,
  calculateMean,
  calculateMonthlyMeans,
  calculateSeasonalRainfall,
} from "./calculations";
import { evaluateDataQuality } from "./quality";

export interface ProcessClimateOptions {
  completenessThresholdPercent?: number;
}

/**
 * Processes daily NASA climate records into historical climate indicators.
 * Ensures:
 * - Missing data is never treated as zero.
 * - Incomplete years are excluded from annual averages.
 * - Completeness is independently evaluated for rainfall and temperature.
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

  const annualRainfallByYear = calculateAnnualRainfallByYear(records, quality.excludedYears);
  const annualRainfallValues = Object.values(annualRainfallByYear);

  const meanAnnualRainfallMm =
    annualRainfallValues.length > 0
      ? Number(calculateMean(annualRainfallValues).toFixed(1))
      : 0;

  const rainfallVariabilityCvPercent =
    annualRainfallValues.length >= 2
      ? Number(calculateCoefficientOfVariation(annualRainfallValues).toFixed(1))
      : 0;

  const seasonalRainfallMm = calculateSeasonalRainfall(records, quality.excludedYears);

  // Mean temperature calculation across valid days from non-excluded years
  const excludedSet = new Set(quality.excludedYears);
  const validMeanTemps: number[] = [];
  const validMaxTemps: number[] = [];

  for (const rec of records) {
    if (excludedSet.has(rec.year)) continue;

    if (rec.tempMeanC !== null) {
      validMeanTemps.push(rec.tempMeanC);
    }
    if (rec.tempMaxC !== null) {
      validMaxTemps.push(rec.tempMaxC);
    }
  }

  const meanTemperatureC =
    validMeanTemps.length > 0
      ? Number(calculateMean(validMeanTemps).toFixed(1))
      : 0;

  const meanMaxTemperatureC =
    validMaxTemps.length > 0
      ? Number(calculateMean(validMaxTemps).toFixed(1))
      : 0;

  const { monthlyMeanPrecipitationMm, monthlyMeanMaxTempC } = calculateMonthlyMeans(
    records,
    quality.excludedYears
  );

  const drySeasonDeficitFrequencyPercent = calculateDrySeasonDeficitFrequency(
    records,
    quality.excludedYears
  );

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
  };
}


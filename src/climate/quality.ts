import { DailyClimateRecord, DataQuality } from "@/types";

/**
 * Checks whether a year is a leap year (Gregorian calendar)
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Returns expected number of days in a year
 */
export function getExpectedDaysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365;
}

/**
 * Generates all expected YYYY-MM-DD dates in a given year range
 */
export function generateExpectedDates(startYear: number, endYear: number): string[] {
  const dates: string[] = [];
  for (let year = startYear; year <= endYear; year++) {
    const daysInMonths = [
      31,
      isLeapYear(year) ? 29 : 28,
      31,
      30,
      31,
      30,
      31,
      31,
      30,
      31,
      30,
      31,
    ];
    for (let m = 0; m < 12; m++) {
      const monthNum = m + 1;
      const mm = monthNum < 10 ? `0${monthNum}` : `${monthNum}`;
      for (let d = 1; d <= daysInMonths[m]; d++) {
        const dd = d < 10 ? `0${d}` : `${d}`;
        dates.push(`${year}-${mm}-${dd}`);
      }
    }
  }
  return dates;
}

export const PROVISIONAL_COMPLETENESS_THRESHOLD_PERCENT = 90.0;

/**
 * Evaluates the quality and completeness of daily climate records.
 * 
 * Important scientific rules:
 * - Missing data is never treated as zero.
 * - Completeness is computed independently for rainfall and temperature.
 * - Missing dates in the daily series are detected.
 * - Incomplete years (< threshold) are flagged for exclusion from annual aggregates.
 */
export function evaluateDataQuality(
  records: DailyClimateRecord[],
  startYear: number,
  endYear: number,
  completenessThresholdPercent: number = PROVISIONAL_COMPLETENESS_THRESHOLD_PERCENT
): DataQuality {
  const expectedDates = generateExpectedDates(startYear, endYear);
  const totalExpectedDays = expectedDates.length;
  const totalReceivedDays = records.length;

  const receivedDatesMap = new Map<string, DailyClimateRecord>();
  const duplicates: string[] = [];

  for (const record of records) {
    if (receivedDatesMap.has(record.date)) {
      duplicates.push(record.date);
    } else {
      receivedDatesMap.set(record.date, record);
    }
  }

  const missingDates: string[] = [];
  for (const expDate of expectedDates) {
    if (!receivedDatesMap.has(expDate)) {
      missingDates.push(expDate);
    }
  }

  // Count non-null values per variable
  let validPrecipCount = 0;
  let validTempCount = 0;

  // Track per-year counts to identify incomplete years
  const yearlyPrecipCounts: Record<number, number> = {};
  const yearlyTempCounts: Record<number, number> = {};

  for (let y = startYear; y <= endYear; y++) {
    yearlyPrecipCounts[y] = 0;
    yearlyTempCounts[y] = 0;
  }

  for (const rec of Array.from(receivedDatesMap.values())) {
    if (rec.precipitationMm !== null) {
      validPrecipCount++;
      if (yearlyPrecipCounts[rec.year] !== undefined) {
        yearlyPrecipCounts[rec.year]++;
      }
    }
    if (rec.tempMeanC !== null) {
      validTempCount++;
      if (yearlyTempCounts[rec.year] !== undefined) {
        yearlyTempCounts[rec.year]++;
      }
    }
  }

  const precipitationCompletenessPercent =
    totalExpectedDays > 0 ? (validPrecipCount / totalExpectedDays) * 100 : 0;
  const temperatureCompletenessPercent =
    totalExpectedDays > 0 ? (validTempCount / totalExpectedDays) * 100 : 0;

  // Determine excluded years (where precipitation or temperature falls below threshold)
  const excludedYears: number[] = [];
  for (let y = startYear; y <= endYear; y++) {
    const expectedDaysThisYear = getExpectedDaysInYear(y);
    const pComp = (yearlyPrecipCounts[y] / expectedDaysThisYear) * 100;
    const tComp = (yearlyTempCounts[y] / expectedDaysThisYear) * 100;

    if (pComp < completenessThresholdPercent || tComp < completenessThresholdPercent) {
      excludedYears.push(y);
    }
  }

  const notes: string[] = [];
  if (missingDates.length > 0) {
    notes.push(
      `Detected ${missingDates.length} missing calendar days in historical series between ${startYear} and ${endYear}.`
    );
  }
  if (duplicates.length > 0) {
    notes.push(`Detected and deduplicated ${duplicates.length} duplicate date entries.`);
  }
  if (excludedYears.length > 0) {
    notes.push(
      `Excluded year(s) [${excludedYears.join(", ")}] from annual baseline indicators due to completeness < ${completenessThresholdPercent}%.`
    );
  }
  notes.push(
    `Completeness threshold of ${completenessThresholdPercent}% is a provisional engineering rule, not an established scientific threshold.`
  );

  return {
    totalExpectedDays,
    totalReceivedDays,
    precipitationCompletenessPercent: Number(precipitationCompletenessPercent.toFixed(2)),
    temperatureCompletenessPercent: Number(temperatureCompletenessPercent.toFixed(2)),
    missingDateCount: missingDates.length,
    hasMissingDates: missingDates.length > 0,
    excludedYears,
    notes,
  };
}

import { DailyClimateRecord, DataQuality } from "@/types";

/**
 * Checks whether a year is a leap year (Gregorian calendar)
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Validates whether a given year, month, and day constitute a real Gregorian calendar date.
 */
export function isValidDate(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }
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
  return day <= daysInMonths[month - 1];
}

/**
 * Validates whether a string is a valid YYYY-MM-DD Gregorian calendar date.
 */
export function isValidDateString(dateStr: string): boolean {
  if (typeof dateStr !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }
  const parts = dateStr.split("-").map((p) => parseInt(p, 10));
  return isValidDate(parts[0], parts[1], parts[2]);
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
  const expectedDatesSet = new Set(expectedDates);
  const totalExpectedDays = expectedDates.length;

  const seenValidDates = new Set<string>();
  const duplicateValidDates: string[] = [];
  const validReceivedDatesMap = new Map<string, DailyClimateRecord>();
  let outOfRangeCount = 0;
  let malformedOrInconsistentCount = 0;

  for (const record of records) {
    // 1. Validate date string format and Gregorian calendar date validity
    if (!isValidDateString(record.date)) {
      malformedOrInconsistentCount++;
      continue;
    }

    // 2. Confirm that embedded year, month, and day agree with record.year, record.month, record.day
    const parts = record.date.split("-").map((p) => parseInt(p, 10));
    const embYear = parts[0];
    const embMonth = parts[1];
    const embDay = parts[2];

    if (
      record.year !== embYear ||
      record.month !== embMonth ||
      record.day !== embDay
    ) {
      malformedOrInconsistentCount++;
      continue;
    }

    // 3. Detect duplicates among valid dates, not malformed or inconsistent records
    if (seenValidDates.has(record.date)) {
      duplicateValidDates.push(record.date);
      continue;
    }
    seenValidDates.add(record.date);

    // 4. Ensure out-of-period records cannot increase completeness
    if (expectedDatesSet.has(record.date)) {
      validReceivedDatesMap.set(record.date, record);
    } else {
      outOfRangeCount++;
    }
  }

  // totalReceivedDays represents unique valid calendar dates within the requested period
  const totalReceivedDays = validReceivedDatesMap.size;

  const missingDates: string[] = [];
  for (const expDate of expectedDates) {
    if (!validReceivedDatesMap.has(expDate)) {
      missingDates.push(expDate);
    }
  }

  // Count non-null observations per variable independently
  let validPrecipCount = 0;
  let validTempCount = 0;

  // Track per-year counts to identify incomplete years
  const yearlyPrecipCounts: Record<number, number> = {};
  const yearlyTempCounts: Record<number, number> = {};

  for (let y = startYear; y <= endYear; y++) {
    yearlyPrecipCounts[y] = 0;
    yearlyTempCounts[y] = 0;
  }

  for (const rec of Array.from(validReceivedDatesMap.values())) {
    if (
      rec.precipitationMm !== null &&
      !isNaN(rec.precipitationMm) &&
      Number.isFinite(rec.precipitationMm)
    ) {
      validPrecipCount++;
      if (yearlyPrecipCounts[rec.year] !== undefined) {
        yearlyPrecipCounts[rec.year]++;
      }
    }
    if (
      rec.tempMeanC !== null &&
      !isNaN(rec.tempMeanC) &&
      Number.isFinite(rec.tempMeanC)
    ) {
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
  if (duplicateValidDates.length > 0) {
    notes.push(`Detected and deduplicated ${duplicateValidDates.length} duplicate date entries.`);
  }
  if (outOfRangeCount > 0) {
    notes.push(`Detected and excluded ${outOfRangeCount} record(s) outside requested range [${startYear}-${endYear}].`);
  }
  if (malformedOrInconsistentCount > 0) {
    notes.push(
      `Detected and excluded ${malformedOrInconsistentCount} malformed or invalid calendar date(s) / inconsistent record(s).`
    );
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

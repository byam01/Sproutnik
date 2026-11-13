import { ClimateIndicators, DailyClimateRecord, Location } from "@/types";

export const MOCK_LUDHIANA_LOCATION: Location = {
  latitude: 30.9,
  longitude: 75.85,
  name: "Ludhiana Demonstration Site",
  district: "Ludhiana",
  state: "Punjab",
  country: "India",
  elevationMeters: 247,
};

export const MOCK_CLIMATE_INDICATORS_LUDHIANA: ClimateIndicators = {
  period: {
    startYear: 2015,
    endYear: 2024,
  },
  location: MOCK_LUDHIANA_LOCATION,
  meanAnnualRainfallMm: 684.2,
  annualRainfallByYear: {
    2015: 712.4,
    2016: 589.1,
    2017: 645.8,
    2018: 730.2,
    2019: 780.5,
    2020: 695.0,
    2021: 610.4,
    2022: 662.8,
    2023: 812.3, // wet monsoon flood events in northern India
    2024: 603.5,
  },
  seasonalRainfallMm: {
    winterMm: 72.4, // Nov - Feb (Western Disturbances)
    summerMm: 58.6, // Mar - May
    monsoonMm: 532.1, // Jun - Sep (Southwest Monsoon)
    postMonsoonMm: 21.1, // Oct
  },
  meanTemperatureC: 24.3,
  meanMaxTemperatureC: 30.8,
  monthlyMeanMaxTempC: {
    1: 18.8,
    2: 22.4,
    3: 28.5,
    4: 35.6,
    5: 39.8,
    6: 40.2,
    7: 35.4,
    8: 33.8,
    9: 33.5,
    10: 31.9,
    11: 26.8,
    12: 20.6,
  },
  monthlyMeanPrecipitationMm: {
    1: 22.1,
    2: 28.4,
    3: 20.5,
    4: 15.2,
    5: 22.9,
    6: 62.4,
    7: 198.5,
    8: 185.2,
    9: 86.0,
    10: 21.1,
    11: 6.2,
    12: 15.7,
  },
  rainfallVariabilityCvPercent: 11.2,
  drySeasonDeficitFrequencyPercent: 20.0,
  quality: {
    totalExpectedDays: 3652,
    totalReceivedDays: 3652,
    precipitationCompletenessPercent: 100.0,
    temperatureCompletenessPercent: 100.0,
    missingDateCount: 0,
    hasMissingDates: false,
    excludedYears: [],
    notes: [
      "Mock calibrated climate indicators representing historical observations for Ludhiana, Punjab (2015-2024).",
      "Completeness threshold of 90% is a provisional engineering rule, not an established scientific threshold.",
    ],
  },
};

/**
 * Generates sample daily records for testing processing logic
 */
export function generateMockDailyRecords(startYear: number, endYear: number): DailyClimateRecord[] {
  const records: DailyClimateRecord[] = [];
  for (let year = startYear; year <= endYear; year++) {
    for (let month = 1; month <= 12; month++) {
      const daysInMonth = month === 2 ? 28 : [4, 6, 9, 11].includes(month) ? 30 : 31;
      for (let day = 1; day <= daysInMonth; day++) {
        const mm = month < 10 ? `0${month}` : `${month}`;
        const dd = day < 10 ? `0${day}` : `${day}`;

        // Simple monsoon-heavy pattern
        let precipitationMm = 0;
        if (month >= 6 && month <= 9) {
          // Monsoon rainfall events
          precipitationMm = (day % 3 === 0) ? 15.0 : (day % 7 === 0) ? 35.0 : 0.0;
        } else if (month === 1 || month === 2) {
          precipitationMm = day === 15 ? 12.0 : 0.0;
        }

        // Seasonal temp pattern
        const tempMeanC = month >= 5 && month <= 8 ? 32.0 : month <= 2 ? 14.0 : 25.0;
        const tempMaxC = tempMeanC + 6.0;

        records.push({
          date: `${year}-${mm}-${dd}`,
          year,
          month,
          day,
          precipitationMm,
          tempMeanC,
          tempMaxC,
        });
      }
    }
  }
  return records;
}

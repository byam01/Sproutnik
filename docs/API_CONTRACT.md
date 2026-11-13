# Rotation Compass — Frontend API Contract & Integration Guide

**Project:** Rotation Compass (NASA Space Apps Challenge 2026)  
**Target Region:** Ludhiana District, Punjab, India (30.90° N, 75.85° E)  
**Developer 2 (Frontend) Status:** Ready for Integration

---

## 1. Overview & Core Contract Principles

1. **Strict Response Wrapping:** All endpoints return `{ "success": true, "data": ... }` on success, or `{ "success": false, "error": { "code": string, "message": string } }` on error.
2. **Offline / Dev Mock Support:** Append `&mock=true` to any request to immediately receive calibrated, validated Punjab baseline data without hitting external NASA servers.
3. **No Frontend Calculations:** The frontend only visualizes the returned climate and agronomic indicators. All statistical metrics (CV%, seasonal sums, completeness) are computed by the backend.

---

## 2. Milestone 1 & 2: Climate Indicators Endpoint

### `GET /api/climate`

Retrieves historical environmental records from the **NASA POWER Daily Point API**, evaluates time series completeness, checks for missing dates, and calculates validated climate indicators.

#### Query Parameters
| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `lat` | `number` | **Yes** | - | Latitude (-90.0 to 90.0), e.g., `30.90` |
| `lon` | `number` | **Yes** | - | Longitude (-180.0 to 180.0), e.g., `75.85` |
| `startYear` | `integer` | No | `2015` | Start year (>= 1981) |
| `endYear` | `integer` | No | `2024` | End year (<= current year) |
| `mock` | `boolean` | No | `false` | Pass `"true"` for instantaneous calibrated fixture |

#### Example Request
```http
GET /api/climate?lat=30.90&lon=75.85&startYear=2015&endYear=2024
```

#### Example Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "period": {
      "startYear": 2015,
      "endYear": 2024
    },
    "location": {
      "latitude": 30.9,
      "longitude": 75.85,
      "name": "Ludhiana Demonstration Region"
    },
    "meanAnnualRainfallMm": 684.2,
    "annualRainfallByYear": {
      "2015": 712.4,
      "2016": 589.1,
      "2017": 645.8,
      "2018": 730.2,
      "2019": 780.5,
      "2020": 695.0,
      "2021": 610.4,
      "2022": 662.8,
      "2023": 812.3,
      "2024": 603.5
    },
    "seasonalRainfallMm": {
      "winterMm": 72.4,
      "summerMm": 58.6,
      "monsoonMm": 532.1,
      "postMonsoonMm": 21.1
    },
    "meanTemperatureC": 24.3,
    "meanMaxTemperatureC": 30.8,
    "monthlyMeanMaxTempC": {
      "1": 18.8,
      "2": 22.4,
      "3": 28.5,
      "4": 35.6,
      "5": 39.8,
      "6": 40.2,
      "7": 35.4,
      "8": 33.8,
      "9": 33.5,
      "10": 31.9,
      "11": 26.8,
      "12": 20.6
    },
    "monthlyMeanPrecipitationMm": {
      "1": 22.1,
      "2": 28.4,
      "3": 20.5,
      "4": 15.2,
      "5": 22.9,
      "6": 62.4,
      "7": 198.5,
      "8": 185.2,
      "9": 86.0,
      "10": 21.1,
      "11": 6.2,
      "12": 15.7
    },
    "rainfallVariabilityCvPercent": 11.2,
    "drySeasonDeficitFrequencyPercent": 20.0,
    "quality": {
      "totalExpectedDays": 3652,
      "totalReceivedDays": 3652,
      "precipitationCompletenessPercent": 100.0,
      "temperatureCompletenessPercent": 100.0,
      "missingDateCount": 0,
      "hasMissingDates": false,
      "excludedYears": [],
      "notes": [
        "Completeness threshold of 90% is a provisional engineering rule, not an established scientific threshold."
      ]
    }
  },
  "meta": {
    "dataSource": "NASA POWER Daily API (PRECTOTCORR, T2M, T2M_MAX)",
    "processingTimestamp": "2026-11-13T10:55:24.797Z",
    "version": "1.0.0"
  }
}
```

#### Example Error Response (`400 Bad Request`)
```json
{
  "success": false,
  "error": {
    "code": "MISSING_COORDINATES",
    "message": "Query parameters 'lat' and 'lon' are required (e.g., /api/climate?lat=30.90&lon=75.85)."
  }
}
```

---

## 3. Scientific Reporting Windows & Definitions (Punjab Prototype)

- **Winter:** November, December, January, February (Western Disturbances).
- **Summer:** March, April, May (Pre-monsoon heat window).
- **Monsoon:** June, July, August, September (Southwest Monsoon).
- **Post-Monsoon:** October (Transitional kharif harvest / rabi sowing window).
- **Rainfall Variability ($CV\%$):** $\frac{\sigma}{\mu} \times 100\%$ calculated across valid complete calendar years.
- **Dry Season Deficit Frequency:** Percentage of evaluated years where dry-season (Nov–May) rainfall was below 75% of multi-year mean dry-season rainfall.
- **Completeness Rule:** Calculated independently for rainfall and temperature. Years with completeness $< 90\%$ are excluded from baseline averages to prevent artificial skew.

---

## 4. Frontend Integration Snippet (TypeScript)

Import types directly from `@/types`:

```typescript
import type { ApiResponse, ClimateIndicators } from "@/types";

export async function fetchClimateIndicators(
  lat: number,
  lon: number,
  useMock = false
): Promise<ClimateIndicators> {
  const url = `/api/climate?lat=${lat}&lon=${lon}${useMock ? "&mock=true" : ""}`;
  const res = await fetch(url);
  const json: ApiResponse<ClimateIndicators> = await res.json();

  if (!json.success) {
    throw new Error(`[${json.error.code}] ${json.error.message}`);
  }

  return json.data;
}
```


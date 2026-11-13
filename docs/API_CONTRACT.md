# Rotation Compass — Frontend API Contract & Integration Guide

**Project:** Rotation Compass (NASA Space Apps Challenge 2026)  
**Target Region:** Ludhiana District, Punjab, India (30.90° N, 75.85° E)  
**Backend & Intelligence Engine:** Active

---

## 1. Overview & Core Contract Principles

1. **Strict Response Envelope:** All endpoints return `{ "success": true, "data": ... }` on success, or `{ "success": false, "error": { "code": string, "message": string } }` on error.
2. **Offline / Dev Mock Support:** Append `&mock=true` to any request to immediately receive calibrated, validated Punjab baseline data without hitting external NASA servers.
3. **No Frontend Calculations:** The frontend visualizes the returned climate and agronomic indicators. All statistical metrics (CV%, seasonal sums, completeness, feasibility, trade-offs) are computed by the backend.

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

#### Example Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "period": { "startYear": 2015, "endYear": 2024 },
    "location": { "latitude": 30.9, "longitude": 75.85, "name": "Ludhiana Demonstration Region" },
    "meanAnnualRainfallMm": 684.2,
    "annualRainfallByYear": { "2015": 712.4, "2016": 589.1, ... },
    "seasonalRainfallMm": { "winterMm": 72.4, "summerMm": 58.6, "monsoonMm": 532.1, "postMonsoonMm": 21.1 },
    "meanTemperatureC": 24.3,
    "meanMaxTemperatureC": 30.8,
    "rainfallVariabilityCvPercent": 11.2,
    "drySeasonDeficitFrequencyPercent": 20.0,
    "quality": {
      "precipitationCompletenessPercent": 100.0,
      "temperatureCompletenessPercent": 100.0,
      "missingDateCount": 0,
      "hasMissingDates": false
    }
  }
}
```

---

## 3. Milestone 4 & 5: Crop Rotation Intelligence Endpoint

### `GET /api/rotations`

Evaluates candidate crop rotations for Punjab using:
1. **Stage A Feasibility Filtering:** Calendar sequence turnaround, irrigation availability, soil texture compatibility, preceding crop suitability.
2. **Stage B 5-Dimension Trade-Off Assessment:** Climate compatibility, groundwater exposure, agrobiodiversity, soil health, and residue turnaround feasibility.

#### Query Parameters
| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `lat` | `number` | **Yes** | - | Latitude, e.g. `30.90` |
| `lon` | `number` | **Yes** | - | Longitude, e.g. `75.85` |
| `soilTexture` | `string` | No | `"loam"` | `"clay_loam"` \| `"sandy_loam"` \| `"loam"` \| `"silt_loam"` \| `"sandy"` |
| `irrigationSource` | `string` | No | `"tubewell_deep"` | `"tubewell_deep"` \| `"tubewell_shallow"` \| `"canal"` \| `"rainfed_only"` |
| `groundwaterDepth` | `number` | No | - | Water table depth in meters (e.g. `28.5`) |
| `mock` | `boolean` | No | `false` | Pass `"true"` for instant calibrated baseline evaluation |

#### Example Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "location": { "latitude": 30.9, "longitude": 75.85, "name": "Ludhiana Demonstration Region, Punjab" },
    "climateContext": {
      "meanAnnualRainfallMm": 684.2,
      "seasonalRainfallMm": { "winterMm": 72.4, "summerMm": 58.6, "monsoonMm": 532.1, "postMonsoonMm": 21.1 },
      "meanTemperatureC": 24.3,
      "meanMaxTemperatureC": 30.8,
      "rainfallVariabilityCvPercent": 11.2,
      "drySeasonDeficitFrequencyPercent": 20.0
    },
    "farmerProfile": {
      "soilTexture": "loam",
      "irrigationSource": "tubewell_deep"
    },
    "baseline": {
      "rotationId": "rotation_rice_wheat",
      "rotationName": "Rice–Wheat (Baseline Monoculture)",
      "isBaseline": true,
      "waterDemandTotalCategory": "very_high",
      "groundwaterPressureIndex": "critical",
      "feasibility": { "isFeasible": true, "rejectionReasons": [], "criteria": [...] },
      "tradeoffs": [
        {
          "dimension": "water_exposure",
          "scoreLabel": "unfavorable",
          "summary": "Estimated total irrigation requirement is ~2150 mm/year...",
          "advantages": [],
          "disadvantages": ["Severely accelerates aquifer overdraft in over-exploited Ludhiana district."]
        }
      ],
      "evidence": [...]
    },
    "alternatives": [
      {
        "rotationId": "rotation_maize_wheat",
        "rotationName": "Kharif Maize – Wheat (Diversified Cereal)",
        "isBaseline": false,
        "waterDemandTotalCategory": "moderate",
        "groundwaterPressureIndex": "low",
        "feasibility": { "isFeasible": true, "rejectionReasons": [], "criteria": [...] },
        "tradeoffs": [...],
        "diversificationBenefits": ["60–65% reduction in groundwater irrigation footprint vs paddy"],
        "keyRisks": ["Monsoon waterlogging sensitivity: requires ridge sowing or surface drainage"],
        "evidence": [...]
      }
    ],
    "scientificDisclaimer": "Rotation Compass provides decision support based on historical NASA environmental data and published agronomic evidence (e.g. Punjab Agricultural University). It does NOT guarantee crop yields or eliminate local weather risks."
  },
  "meta": {
    "dataSource": "NASA POWER Daily API + PAU Agronomic Evidence",
    "processingTimestamp": "2026-11-13T13:20:00.000Z",
    "version": "1.0.0"
  }
}
```

---

## 4. Frontend Integration Snippet (TypeScript)

```typescript
import { fetchClimateApi, fetchRotationsApi } from "@/services/api";
import { useCropRotations } from "@/hooks/useCropRotations";

// In React components:
const { data, loading, error, refetch } = useCropRotations({ lat: 30.9, lon: 75.85 }, false);
```

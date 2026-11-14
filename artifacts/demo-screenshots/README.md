# Sproutnik Organiser Demonstration Screenshot Package

This directory contains genuine, high-resolution browser screenshots captured from the live, running Sproutnik production application (`http://localhost:3000`) using Google Chrome.

All screenshots use clearly labeled demonstration data for the Central Punjab Rice–Wheat zone (Ludhiana District) and expose zero private information, secrets, or API keys.

---

## Screenshot Inventory

| # | Filename | Description | Key Demonstration Highlights |
|---|---|---|---|
| **01** | `01-landing-page.png` | Landing page before onboarding | Unpersonalized demonstration baseline with amber "Demonstration Mode Active" notice for Central Punjab reference data. |
| **02** | `02-onboarding-welcome.png` | Farmer onboarding welcome screen | Dual-mode selection offering Guided Field Guide vs Conversational Mode, with PAU reference disclosures. |
| **03** | `03-location-step.png` | Step 0: Location workspace | Interactive dual-panel combining search, presets (Ludhiana District), manual coordinates, and high-res satellite imagery. |
| **04** | `04-land-area-step.png` | Step 1: Operational land holding | Real-time conversion across acres, kanals, and traditional Punjab kacha bighas into canonical hectares (`2.02 ha`). |
| **05** | `05-soil-step.png` | Step 2: Soil texture selection | Canonical texture selection (`loam`, `sandy_loam`, `clay_loam`, `silt_loam`) with PAU agronomic descriptions. |
| **06** | `06-irrigation-step.png` | Step 3: Irrigation infrastructure | Water source selection (`tubewell_deep`, `canal`, `tubewell_shallow`, `rainfed_only`) driving rotation feasibility constraints. |
| **07** | `07-crop-selection.png` | Step 4: Canonical crop catalog | 8 approved crops with multi-lingual badges (English, Gurmukhi, Devanagari) and transparent rotation-support badges. |
| **08** | `08-farming-goal-selection.png` | Step 5: Canonical farming priorities | 7 approved goals (`improve_yield`, `reduce_water_usage`, `improve_soil_health`, `reduce_input_costs`, etc.) with localized titles. |
| **09** | `09-completed-profile-review.png` | Step 6: Profile review & verification | Aggregated summary of confirmed inputs, tagging regional fallback estimates, with direct submission action. |
| **10** | `10-main-dashboard.png` | Main dashboard with personalized banner | Personalized `FarmerProfileBanner` showing holding size in ha & acres, soil, water source, crops, goals, and persistence disclaimer. |
| **11** | `11-climate-insights.png` | Historical NASA climate insights | 10-year historical NASA POWER meteorological records showing mean annual precipitation, monsoon distribution, and temperature trends. |
| **12** | `12-crop-rotation-recommendations.png` | Crop rotation recommendations | Context-aware alternative rotations (e.g. Maize–Wheat, DSR–Wheat, Summer Moong) scored against the farmer's specific profile. |
| **13** | `13-dashboard-after-refresh.png` | Persistence after browser refresh | Page reload (`F5`) demonstration confirming profile envelope hydration from `sproutnik:farmer-profile:v1` in `localStorage`. |
| **14** | `14-mobile-dashboard.png` | Mobile viewport dashboard (375x812) | Fully responsive mobile dashboard layout showing stacked cards, navigation, and metrics without horizontal overflow. |
| **15** | `15-mobile-onboarding.png` | Mobile viewport onboarding (375x812) | Mobile-optimized onboarding interface with fluid touch targets, responsive progress indicator, and accessible controls. |

---

## Technical Attributions & Persistence Architecture
- **Meteorological Data:** NASA POWER Daily API (10-year historical baseline for Ludhiana: 30.90° N, 75.85° E).
- **Agronomic Knowledge Base:** Published agronomic evidence from Punjab Agricultural University (PAU), Ludhiana.
- **Persistence Architecture:** Profile data is securely cached in local device storage (`localStorage`) and synchronized with server in-memory state. Remote server cache clears on full process restart.

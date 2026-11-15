# Sproutnik (Rotation Compass) — Design System & Human-Centered UX Foundations

**NASA Space Apps Challenge 2026** — Climate-Aware Crop Rotation Planning  
*Design Direction: Polished Agricultural Intelligence Platform (Natural, Trustworthy, Farmer-Friendly)*

---

## 1. Approved Design Reference & Visual System

Sproutnik's user experience is anchored on the approved production design reference:
- **`locationpng.png`**: Primary reference for workspace layout, two-tone typography, satellite mapping, and information density.
- **`home.png`**: Brand identity, agricultural landscape imagery, and clean hero typography.
- **`AIAssistant.png`**: Conversational guidance layout, prompt bars, and live workspace context sidebar.

### Core Visual Principles
1. **Split-Screen Workspace Layout**:
   - Desktop: ~30% left control panel (w-full lg:w-[410px] xl:w-[440px]), ~70% right satellite map area.
   - Mobile: Clean intelligent stack with search and selected location immediately accessible.
2. **Distinctive Typography**:
   - Two-tone headings with italicized accent words: *"Define your Workspace."*, *"Cultivating the Future of Agriculture."*
   - Section headers in small, tracked uppercase font (`text-[11px] font-bold uppercase tracking-wider text-stone-500`).
   - Minimum 16px input font size to eliminate iOS auto-zoom (`mobile-native` standard).
3. **Restrained Agricultural Palette**:
   - Deep forest green (`#1a3b2b`, `#16251c`), muted sage (`#5a7c5b`, `#8a9a7b`), warm off-white canvas (`#faf9f5`), and crisp borders (`#e7e5e4`).
4. **Radical Data Truthfulness**:
   - Zero invented metrics (no fabricated soil moisture percentages or NDVI yield indicators).
   - Accurate representation of NASA POWER 0.5° × 0.5° satellite grid cell resolution (~50 km) and historical data series.
5. **Zero-Penalty Uncertainty**:
   - Every question supports an explicit `"I'm not sure"` and `"Skip for now"` without penalizing the farmer.

---

## 2. Terminology & UI Language Standards

To maintain trust and clarity for growers and extension workers, technical jargon is translated into direct, natural terminology:

| Avoid | Use Instead | Agronomic & UX Rationale |
| :--- | :--- | :--- |
| **Grid Intelligence** | **Local climate information** | Natural language explaining local temperature, rainfall, and heat stress. |
| **Environmental Sync** | **Climate data for your location** | Direct description of NASA POWER satellite observation retrieval. |
| **Spatial intelligence node** | **Farm location** | Clear physical identification of the farm's geographic coordinates. |
| **Geospatial configuration** | **Define your workspace** | Inviting, purposeful setup action for planning crops. |
| **Aquifer Depth** | **Groundwater depth** | Familiar term used by Punjab farmers discussing tubewell water levels. |
| **Crop Compatibility** | **Crop suitability** | Clear explanation of agronomic fit, rotation synergy, and turnaround time. |
| **Execute Rotation** | **View crop rotation plan** | Action-oriented user goal without software jargon. |
| **Initialize Profile** | **Create my farm workspace** | Welcoming milestone marking completion of onboarding. |
| **AI Agronomist** | **Sproutnik assistant** | Honest technological attribution without claiming human credentials. |
| **Unknown** | **I'm not sure** | Gentle, non-stigmatizing choice for untested fields. |
| **Configure** | **Set up** | Plain, accessible language. |
| **Optimize** | **Improve** | Straightforward action label. |

---

## 3. Onboarding Architecture: Two Equal Modes

The onboarding journey starts at **exactly ONE unified welcome screen**:

### A. Unified Welcome Screen
- Single entry point with two balanced options:
  - **Option 1: Use the step-by-step guide** ("Answer a few simple questions about your farm, one step at a time.")
  - **Option 2: Start a conversation** ("Tell us about your farm naturally, and we'll guide you through the details.")
- Reassurance note: *"You can skip questions you are unsure about and update your answers at any time. Your farm details are saved safely for this planning session."*

### B. Screen 1 — Define Your Workspace (30/70 Split Layout)
- **Left Panel (30%)**:
  - Title: *Define your Workspace.*
  - Description: *"Select your farm's location so Sproutnik can explore local climate conditions and environmental data for your crop rotation plan."*
  - Search input: *"Search for your farm"* with placeholder *"Enter a village, district, address or coordinates"*.
  - *"Use my current location"* action with explicit HTML5 Geolocation permission handling and graceful error recovery.
  - Recent Locations list (Ludhiana Prototype Reference, Bathinda, Sangrur, Jalandhar, Patiala).
  - Selected location summary card with confirmed status badge and coordinate details.
  - Informational callout explaining NASA POWER 0.5° × 0.5° grid resolution (~50 km) and 10–15 year historical series.
  - Back and Confirm location buttons.
- **Right Map (70%)**:
  - High-resolution agricultural satellite view with parcel boundaries and canal corridors.
  - Interactive pan and zoom controls (+ / - and mouse wheel/drag).
  - Click-to-adjust pin positioning anywhere across the field parcel.
  - Pulsing radar reticle marker with luminous green center and floating callout tag matching `locationpng.png`.
  - Floating Top-Right HUD overlay: Real climate information (district name, coordinates, elevation, NASA POWER source).
  - Floating Bottom-Left card: Selected farm summary and pin refinement guidance.
  - Resilient offline fallback: Vector-rendered agricultural field grid ensures zero broken images or missing tile errors.

### C. Remaining Field Guide Steps (Screens 2 to 7)
- **Screen 2 — Land Area**: Large numeric input, unit switcher (Acres, Hectares, statutory Kanals, and documented Punjab Kacha Bighas: 1 Acre ≈ 4.8 Bighas), conversion preview, visual holding scale, and skip option.
- **Screen 3 — Soil Type**: Clear options (Balanced Loam, Clay Loam, Sandy Loam, Silt Loam, Sandy), "I'm not sure" option, and contextual soil ribbon test guide.
- **Screen 4 — Irrigation**: Understandable water sources (Deep tubewell, shallow tubewell, canal water, rainfed, conjunctive/more than one source, and "I'm not sure"), plus groundwater context.
- **Screen 5 — Current Crops**: Searchable Punjab crop catalog (Rice/Paddy, Wheat, Summer Moong, Maize, Basmati DSR, Cotton, Mustard/Raya, Sugarcane, Potato, Chickpea), Kharif/Rabi/Zaid season tags, multi-select, and skip option.
- **Screen 6 — Farming Goals**: 5 clear priorities (Save water, Improve soil health, Build climate resilience, Reduce farm workload, Explore better crop rotations), multi-select.
- **Screen 7 — Profile Review**: Side-by-side audit separating *Information Provided By You* (preserving raw `known`, `unknown`, `skipped`, and `not_provided` statuses) from *Regional Estimates Applied for Climate Modeling* (explicitly labeled simulation baselines). Primary CTA: *"Create my farm workspace"*.

### D. Conversational Mode (Sproutnik Assistant)
- Structured dialogue stream with suggested reply chips, natural responses, and custom input.
- Real-time *Workspace Context / Active Profile* sidebar displaying live synchronized answers and canonical status badges.
- Instant switch to Field Guide with zero state loss.

---

## 4. Multi-Language Localization Readiness

All labels, descriptions, and helper texts are abstracted into `src/content/onboardingContent.ts` with complete dictionaries for:
1. **English (`en`)**
2. **Punjabi (`pa`) — ਪੰਜਾਬੀ** (Gurmukhi script)
3. **Hindi (`hi`) — हिन्दी** (Devanagari script)

An interactive language switcher in the header/footer allows instant live toggling, verifying full localization architecture.

---

## 5. Component Attribution & Design Resources

| UI Resource | Integration Type | Component / Pattern in Sproutnik |
| :--- | :--- | :--- |
| **`locationpng.png`** | Reference Benchmark | 30/70 split workspace, two-tone italic headings, satellite reticle marker, floating HUD cards, and dark callout boxes. |
| **`home.png`** | Reference Benchmark | Brand typography, landscape imagery, and clean card hierarchy. |
| **`AIAssistant.png`** | Reference Benchmark | Conversational assistant stream, prompt bar, and live workspace context sidebar. |
| **Beautiful UI** (`beautifului.dev`) | Direct Pattern Integration | Conversational message bubbles, suggestion reply chips, and structured step indicators. |
| **Rare UI** (`rareui.com`) | Direct Pattern Integration | Selection card interaction states, micro-badges, and unit toggle controls. |
| **Emil Kowalski Skills** | Engineering Standards | `mobile-native` (minimum 16px input font size, 48px touch targets), `learn-taste` (data honesty, zero fabricated metrics), and `break-ui` (resilient responsive layouts). |

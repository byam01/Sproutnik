import { EvidenceReference } from "@/types";

/**
 * Transparent Agronomic Evidence References for Punjab Cropping Systems.
 * NASA Space Apps Challenge 2026 — Rotation Compass.
 *
 * Sourced from Punjab Agricultural University (PAU), Central Ground Water Board (CGWB),
 * and peer-reviewed agro-ecological literature.
 */

export const AGRONOMIC_EVIDENCE: Record<string, EvidenceReference> = {
  PAU_KHARIF_PADDY: {
    id: "PAU_KHARIF_PADDY",
    source: "Punjab Agricultural University (PAU) Ludhiana",
    title: "Package of Practices for the Kharif Crops of Punjab: Rice Cultivation",
    year: 2023,
    url: "https://pau.edu/content/ccil/pf/pp_kharif.pdf",
    isProvisional: false,
    notes:
      "Recommended nursery sowing mid-May to early June; transplanting mid-to-late June under Punjab Preservation of Subsoil Water Act (2009) to avoid peak May-June evaporative demand.",
  },
  PAU_DSR_GUIDELINES: {
    id: "PAU_DSR_GUIDELINES",
    source: "Punjab Agricultural University (PAU) Ludhiana",
    title: "Direct Seeded Rice (DSR) Package of Practices and Weed Management Guidelines",
    year: 2022,
    url: "https://pau.edu",
    isProvisional: false,
    notes:
      "DSR saves approximately 15–20% irrigation water and reduces nursery labour, but requires medium-to-heavy textured soils to prevent severe iron chlorosis and weed flushes.",
  },
  PAU_RABI_WHEAT: {
    id: "PAU_RABI_WHEAT",
    source: "Punjab Agricultural University (PAU) Ludhiana",
    title: "Package of Practices for the Rabi Crops of Punjab: Bread Wheat",
    year: 2023,
    url: "https://pau.edu/content/ccil/pf/pp_rabi.pdf",
    isProvisional: false,
    notes:
      "Optimum sowing window: October 25 to November 15. Delay beyond Nov 20 curtails grain-filling duration due to terminal heat stress (>30°C in March), leading to 150-200 kg/ha yield drop per week of delay.",
  },
  PAU_KHARIF_MAIZE: {
    id: "PAU_KHARIF_MAIZE",
    source: "Punjab Agricultural University (PAU) Ludhiana",
    title: "Package of Practices for Kharif Maize in Central Punjab",
    year: 2023,
    url: "https://pau.edu/content/ccil/pf/pp_kharif.pdf",
    isProvisional: false,
    notes:
      "Total water requirement is 450–600 mm compared to 1,500–2,000 mm for puddle-transplanted rice. Harvests in September, providing a generous 30–45 day turnaround before wheat sowing.",
  },
  PAU_SUMMER_MOONG: {
    id: "PAU_SUMMER_MOONG",
    source: "Punjab Agricultural University (PAU) Ludhiana",
    title: "Cultivation of Summer Moong (Vigna radiata) SML 668/SML 832 as Catch Crop",
    year: 2022,
    url: "https://pau.edu",
    isProvisional: false,
    notes:
      "Short duration (60–65 days) pulse sown in late March/early April after wheat harvest and harvested before kharif rice/maize. Fixes 30–40 kg atmospheric N/ha and improves soil organic carbon.",
  },
  PAU_RABI_MUSTARD: {
    id: "PAU_RABI_MUSTARD",
    source: "Punjab Agricultural University (PAU) Ludhiana",
    title: "Package of Practices: Gobhi Sarson and Indian Mustard (Raya)",
    year: 2022,
    url: "https://pau.edu/content/ccil/pf/pp_rabi.pdf",
    isProvisional: false,
    notes:
      "Deep taproot oilseed with lower water requirements (250–350 mm, 2–3 irrigations) than wheat. Provides pest break against cereal nematodes and root rot pathogens.",
  },
  CGWB_LUDHIANA_GROUNDWATER: {
    id: "CGWB_LUDHIANA_GROUNDWATER",
    source: "Central Ground Water Board (CGWB), Ministry of Jal Shakti, Government of India",
    title: "Dynamic Ground Water Resources of Punjab State: Ludhiana District Assessment",
    year: 2023,
    url: "http://cgwb.gov.in",
    isProvisional: false,
    notes:
      "Stage of groundwater extraction in Ludhiana district exceeds 150%, categorized as 'Over-Exploited'. Water table decline rates in blocks like Ludhiana and Khanna exceed 0.5–0.8 m/year.",
  },
  ICAR_IIFSR_DIVERSIFICATION: {
    id: "ICAR_IIFSR_DIVERSIFICATION",
    source: "ICAR-Indian Institute of Farming Systems Research (IIFSR)",
    title: "Alternative Cropping Systems for Groundwater Conservation in Northwest IGP",
    year: 2021,
    url: "https://iifsr.icar.gov.in",
    isProvisional: false,
    notes:
      "Replacing rice with maize reduces irrigation application by ~60%. Incorporating summer legumes yields positive soil nitrogen balances and breaks continuous cereal herbicide resistance.",
  },
  PROVISIONAL_TURNAROUND_WINDOW: {
    id: "PROVISIONAL_TURNAROUND_WINDOW",
    source: "Rotation Compass Engineering & Agronomic Model",
    title: "Provisional Minimum Turnaround Interval for Punjab Crop Rotations",
    year: 2026,
    isProvisional: true,
    notes:
      "Provisional engineering threshold: a turnaround window < 10 days between harvest and next sowing is flagged as infeasible or high-risk for field preparation and residue incorporation.",
  },
  PROVISIONAL_GROUNDWATER_EXPOSURE_INDEX: {
    id: "PROVISIONAL_GROUNDWATER_EXPOSURE_INDEX",
    source: "Rotation Compass Engineering & Agronomic Model",
    title: "Provisional Irrigation Deficit and Groundwater Pressure Indexing",
    year: 2026,
    isProvisional: true,
    notes:
      "Provisional product scoring: calculates groundwater deficit as Estimated Crop Water Demand minus Historical Sensed Rainfall. Categorized as critical when deficit > 900 mm/year.",
  },
};

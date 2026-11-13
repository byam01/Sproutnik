import { RotationDefinition } from "@/types";
import { CROPS_PUNJAB } from "./crops";
import { AGRONOMIC_EVIDENCE } from "./evidence";

export const CANDIDATE_ROTATIONS: RotationDefinition[] = [
  {
    id: "rotation_rice_wheat",
    name: "Rice–Wheat (Baseline Monoculture)",
    description:
      "The dominant cereal cropping system of Punjab covering >2.8 million hectares. Characterized by high yields and assured procurement, but driving severe groundwater depletion and post-harvest residue bottlenecks.",
    cropSequence: ["paddy_transplanted", "bread_wheat"],
    crops: [CROPS_PUNJAB.paddy_transplanted, CROPS_PUNJAB.bread_wheat],
    turnaroundDays: [15, 45], // 15 days Oct/Nov, 45 days May/Jun
    evidence: [
      AGRONOMIC_EVIDENCE.PAU_KHARIF_PADDY,
      AGRONOMIC_EVIDENCE.PAU_RABI_WHEAT,
      AGRONOMIC_EVIDENCE.CGWB_LUDHIANA_GROUNDWATER,
    ],
  },
  {
    id: "rotation_dsr_wheat",
    name: "Direct-Seeded Rice (DSR) – Wheat",
    description:
      "A climate-smart adaptation of the baseline system that replaces flooded puddling with precision direct drilling on non-puddled soil. Saves 15–20% irrigation water and vacates the field 7–10 days earlier.",
    cropSequence: ["paddy_dsr", "bread_wheat"],
    crops: [CROPS_PUNJAB.paddy_dsr, CROPS_PUNJAB.bread_wheat],
    turnaroundDays: [25, 35],
    evidence: [
      AGRONOMIC_EVIDENCE.PAU_DSR_GUIDELINES,
      AGRONOMIC_EVIDENCE.PAU_RABI_WHEAT,
      AGRONOMIC_EVIDENCE.CGWB_LUDHIANA_GROUNDWATER,
    ],
  },
  {
    id: "rotation_maize_wheat",
    name: "Kharif Maize – Wheat (Diversified Cereal)",
    description:
      "Replaces water-intensive kharif rice with grain maize. Reduces total irrigation water consumption by 60–65%, halts groundwater drawdown, and provides a comfortable 30–40 day window for wheat field preparation.",
    cropSequence: ["kharif_maize", "bread_wheat"],
    crops: [CROPS_PUNJAB.kharif_maize, CROPS_PUNJAB.bread_wheat],
    turnaroundDays: [35, 30],
    evidence: [
      AGRONOMIC_EVIDENCE.PAU_KHARIF_MAIZE,
      AGRONOMIC_EVIDENCE.PAU_RABI_WHEAT,
      AGRONOMIC_EVIDENCE.ICAR_IIFSR_DIVERSIFICATION,
    ],
  },
  {
    id: "rotation_rice_wheat_moong",
    name: "Rice – Wheat – Summer Moong (Legume Intensified)",
    description:
      "Integrates a 60-day summer pulse (greengram) into the fallow period between wheat harvest and rice transplanting. Fixes 30–40 kg atmospheric N/ha and improves soil organic carbon, but tightens management windows.",
    cropSequence: ["paddy_transplanted", "bread_wheat", "summer_moong"],
    crops: [
      CROPS_PUNJAB.paddy_transplanted,
      CROPS_PUNJAB.bread_wheat,
      CROPS_PUNJAB.summer_moong,
    ],
    turnaroundDays: [15, 10, 15],
    evidence: [
      AGRONOMIC_EVIDENCE.PAU_SUMMER_MOONG,
      AGRONOMIC_EVIDENCE.PAU_KHARIF_PADDY,
      AGRONOMIC_EVIDENCE.PAU_RABI_WHEAT,
      AGRONOMIC_EVIDENCE.PROVISIONAL_TURNAROUND_WINDOW,
    ],
  },
  {
    id: "rotation_maize_mustard_moong",
    name: "Maize – Mustard – Summer Moong (High Diversity)",
    description:
      "A fully diversified cereal–oilseed–pulse rotation completely free of flooded paddy. Minimizes total water footprint (~1,000 mm total), breaks continuous weed cycles, and maximizes biological nitrogen cycling.",
    cropSequence: ["kharif_maize", "rabi_mustard", "summer_moong"],
    crops: [
      CROPS_PUNJAB.kharif_maize,
      CROPS_PUNJAB.rabi_mustard,
      CROPS_PUNJAB.summer_moong,
    ],
    turnaroundDays: [20, 15, 20],
    evidence: [
      AGRONOMIC_EVIDENCE.PAU_KHARIF_MAIZE,
      AGRONOMIC_EVIDENCE.PAU_RABI_MUSTARD,
      AGRONOMIC_EVIDENCE.PAU_SUMMER_MOONG,
      AGRONOMIC_EVIDENCE.ICAR_IIFSR_DIVERSIFICATION,
    ],
  },
];

/**
 * Farming Goals Presentation Adapter & Canonical Registry
 *
 * Enforces strict alignment with Developer 1's frozen canonical farming goals:
 * 1. improve_yield
 * 2. reduce_water_usage
 * 3. improve_soil_health
 * 4. reduce_input_costs
 * 5. diversify_crops
 * 6. improve_income_stability
 * 7. manage_climate_risk
 *
 * Localized across English, Punjabi (Gurmukhi), and Hindi (Devanagari).
 *
 * ARCHITECTURAL INTEGRITY RULES:
 * - NO silent fallback to "improve_yield" for unknown, malformed, or unmapped goals.
 * - "less_labor" is NOT mapped to "reduce_input_costs" (operational workload != financial spend).
 * - Unrecognized values are preserved transparently without corrupting canonical payloads.
 */

import { CanonicalFarmingGoal } from "@/types";

export interface FarmingGoalDisplayItem {
  id: CanonicalFarmingGoal;
  icon: string;
  titleEn: string;
  titlePa: string;
  titleHi: string;
  descEn: string;
  descPa: string;
  descHi: string;
}

export const APPROVED_SEVEN_FARMING_GOAL_IDS: readonly CanonicalFarmingGoal[] = [
  "improve_yield",
  "reduce_water_usage",
  "improve_soil_health",
  "reduce_input_costs",
  "diversify_crops",
  "improve_income_stability",
  "manage_climate_risk",
] as const;

export const AUTHORITATIVE_FARMING_GOALS: Record<CanonicalFarmingGoal, FarmingGoalDisplayItem> = {
  improve_yield: {
    id: "improve_yield",
    icon: "🌾",
    titleEn: "Improve Crop Yield",
    titlePa: "ਫ਼ਸਲ ਦਾ ਝਾੜ ਵਧਾਉਣਾ",
    titleHi: "फसल की उपज बढ़ाना",
    descEn: "Maximize harvest productivity and production volume per hectare through optimized crop sequence and balanced soil nutrition.",
    descPa: "ਸਹੀ ਫ਼ਸਲੀ ਚੱਕਰ ਅਤੇ ਜ਼ਮੀਨੀ ਖੁਰਾਕ ਨਾਲ ਪ੍ਰਤੀ ਏਕੜ ਉਤਪਾਦਨ ਅਤੇ ਝਾੜ ਵਧਾਉਣਾ।",
    descHi: "उचित फसल चक्र और मृदा पोषण प्रबंधन के साथ प्रति हेक्टेयर अधिकतम पैदावार प्राप्त करना।",
  },
  reduce_water_usage: {
    id: "reduce_water_usage",
    icon: "💧",
    titleEn: "Reduce Water Usage",
    titlePa: "ਪਾਣੀ ਦੀ ਬੱਚਤ (ਟਿਊਬਵੈੱਲ ਬਿਜਲੀ/ਡੀਜ਼ਲ)",
    titleHi: "पानी की बचत (भूजल संरक्षण)",
    descEn: "Cut tubewell pumping hours, power consumption, and conserve depleting groundwater tables with low-water crops.",
    descPa: "ਘੱਟ ਪਾਣੀ ਵਾਲੀਆਂ ਫ਼ਸਲਾਂ ਚੁਣ ਕੇ ਧਰਤੀ ਹੇਠਲੇ ਪਾਣੀ ਅਤੇ ਟਿਊਬਵੈੱਲ ਦੇ ਖ਼ਰਚੇ ਦੀ ਬੱਚਤ ਕਰਨਾ।",
    descHi: "कम पानी वाली फसलें अपनाकर गिरते भूजल स्तर को बचाना और सिंचाई बिजली खर्च घटाना।",
  },
  improve_soil_health: {
    id: "improve_soil_health",
    icon: "🌱",
    titleEn: "Improve Soil Health",
    titlePa: "ਜ਼ਮੀਨ ਦੀ ਉਪਜਾਊ ਸ਼ਕਤੀ ਅਤੇ ਜੈਵਿਕ ਮਾਦਾ",
    titleHi: "मृदा स्वास्थ्य और जैविक उर्वरता",
    descEn: "Rebuild soil organic carbon, fix biological atmospheric nitrogen with legumes, and break continuous hardpan compaction.",
    descPa: "ਦਾਲਾਂ ਨਾਲ ਕੁਦਰਤੀ ਨਾਈਟ੍ਰੋਜਨ ਪੈਦਾ ਕਰਨਾ ਅਤੇ ਝੋਨਾ-ਕਣਕ ਦੇ ਲਗਾਤਾਰ ਚੱਕਰ ਨਾਲ ਸਖ਼ਤ ਹੋਈ ਮਿੱਟੀ ਨੂੰ ਸੁਧਾਰਨਾ।",
    descHi: "दलहनी फसलों से प्राकृतिक नाइट्रोजन जोड़ना और लगातार धान-गेहूं से कठोर हुई मिट्टी को पुनर्जीवित करना।",
  },
  reduce_input_costs: {
    id: "reduce_input_costs",
    icon: "📉",
    titleEn: "Reduce Input Costs",
    titlePa: "ਖੇਤੀ ਲਾਗਤ ਖ਼ਰਚਾ ਘਟਾਉਣਾ",
    titleHi: "खेती की लागत घटाना",
    descEn: "Lower operational expenses on chemical fertilizers, diesel fuel, pest sprays, and intensive land preparation.",
    descPa: "ਰਸਾਇਣਕ ਖਾਦਾਂ, ਡੀਜ਼ਲ, ਕੀਟਨਾਸ਼ਕਾਂ ਅਤੇ ਜ਼ਮੀਨ ਤਿਆਰੀ ਦੇ ਬੇਲੋੜੇ ਖ਼ਰਚੇ ਘਟਾਉਣਾ।",
    descHi: "रासायनिक खाद, डीजल, कीटनाशक और खेत की तैयारी के भारी खर्चों में कटौती करना।",
  },
  diversify_crops: {
    id: "diversify_crops",
    icon: "🔄",
    titleEn: "Diversify Beyond Rice–Wheat",
    titlePa: "ਫ਼ਸਲੀ ਵਿਭਿੰਨਤਾ (ਝੋਨਾ-ਕਣਕ ਚੱਕਰ ਤੋਂ ਬਦਲ)",
    titleHi: "फसल विविधीकरण (धान-गेहूं से इतर विकल्प)",
    descEn: "Incorporate high-value pulses, oilseeds, and coarse cereals to reduce market dependence on monoculture crops.",
    descPa: "ਮੂੰਗੀ, ਮੱਕੀ ਅਤੇ ਸਰ੍ਹੋਂ ਵਰਗੀਆਂ ਬਦਲਵੀਂਆਂ ਫ਼ਸਲਾਂ ਸ਼ਾਮਲ ਕਰਕੇ ਇਕੋ ਫ਼ਸਲ 'ਤੇ ਨਿਰਭਰਤਾ ਖ਼ਤਮ ਕਰਨਾ।",
    descHi: "मक्का, मूँग, सरसों और दलहन को शामिल कर केवल धान-गेहूं की खेती के जोखिम को घटाना।",
  },
  improve_income_stability: {
    id: "improve_income_stability",
    icon: "💰",
    titleEn: "Improve Income Stability",
    titlePa: "ਆਮਦਨ ਦੀ ਸਥਿਰਤਾ ਅਤੇ ਮੁਨਾਫ਼ਾ",
    titleHi: "आय की निरंतरता और स्थिरता",
    descEn: "Distribute harvest revenue evenly across the agricultural year and buffer against single-crop market price collapses.",
    descPa: "ਸਾਲ ਭਰ ਨਿਯਮਿਤ ਆਮਦਨ ਪ੍ਰਾਪਤ ਕਰਨਾ ਅਤੇ ਮੰਡੀ ਵਿੱਚ ਫ਼ਸਲਾਂ ਦੇ ਭਾਅ ਡਿੱਗਣ ਦੇ ਨੁਕਸਾਨ ਤੋਂ ਬਚਣਾ।",
    descHi: "वर्ष भर नियमित नकदी प्रवाह सुनिश्चित करना और बाजार में फसलों के गिरते दामों के जोखिम से बचना।",
  },
  manage_climate_risk: {
    id: "manage_climate_risk",
    icon: "🛡️",
    titleEn: "Manage Climate Risk",
    titlePa: "ਮੌਸਮੀ ਜੋਖਮ ਅਤੇ ਗਰਮੀ ਤੋਂ ਬਚਾਅ",
    titleHi: "जलवायु जोखिम और मौसमी तनाव प्रबंधन",
    descEn: "Shield rabi wheat from terminal March heat stress and buffer kharif crops against monsoon delays or excessive rains.",
    descPa: "ਮਾਰਚ ਦੀ ਅਗੇਤੀ ਗਰਮੀ ਅਤੇ ਮਾਨਸੂਨ ਦੇ ਅਨਿਸ਼ਚਿਤ ਮੀਂਹ ਦੇ ਨੁਕਸਾਨ ਤੋਂ ਫ਼ਸਲਾਂ ਦੀ ਰੱਖਿਆ ਕਰਨਾ।",
    descHi: "मार्च की अचानक गर्मी (हीटवेव) और अनियमित मानसूनी बारिश से फसलों को सुरक्षित रखना।",
  },
};

/**
 * Maps legacy goal identifiers to approved canonical farming goal IDs.
 *
 * GUARANTEES:
 * 1. Returns null if the goal cannot be unambiguously mapped to one of the seven canonical goals.
 * 2. Does NOT silently fallback to "improve_yield".
 * 3. "less_labor" returns null (operational workload is distinct from financial input cost reduction).
 */
export function canonicalizeFarmingGoal(goal: unknown): CanonicalFarmingGoal | null {
  if (typeof goal !== "string") {
    return null;
  }

  const normalized = goal.trim();

  switch (normalized) {
    case "improve_yield":
      return "improve_yield";
    case "reduce_water_usage":
    case "water_saving":
      return "reduce_water_usage";
    case "improve_soil_health":
    case "soil_health":
      return "improve_soil_health";
    case "reduce_input_costs":
      return "reduce_input_costs";
    case "diversify_crops":
    case "crop_rotation_diversity":
      return "diversify_crops";
    case "improve_income_stability":
    case "income_boost":
      return "improve_income_stability";
    case "manage_climate_risk":
    case "climate_resilience":
      return "manage_climate_risk";
    case "less_labor":
      // Deliberately unmapped: operational workload reduction != financial input costs
      return null;
    default:
      // Strict: Never silently coerce unknown or malformed input into "improve_yield"
      return null;
  }
}

/**
 * Returns localized title and description for a goal given the user's active locale.
 * Preserves unmapped or legacy goals with transparent descriptors instead of fake mappings.
 */
export function getLocalizedGoal(
  goalId: string,
  locale: "en" | "pa" | "hi" = "en"
): { id: string; title: string; desc: string; icon: string; isCanonical: boolean } {
  const canonical = canonicalizeFarmingGoal(goalId);

  if (canonical && AUTHORITATIVE_FARMING_GOALS[canonical]) {
    const goal = AUTHORITATIVE_FARMING_GOALS[canonical];
    if (locale === "pa") {
      return { id: goal.id, title: goal.titlePa, desc: goal.descPa, icon: goal.icon, isCanonical: true };
    }
    if (locale === "hi") {
      return { id: goal.id, title: goal.titleHi, desc: goal.descHi, icon: goal.icon, isCanonical: true };
    }
    return { id: goal.id, title: goal.titleEn, desc: goal.descEn, icon: goal.icon, isCanonical: true };
  }

  // Preserved legacy display for less_labor (workload relief)
  if (goalId === "less_labor") {
    return {
      id: "less_labor",
      title:
        locale === "pa"
          ? "ਖੇਤੀ ਦਾ ਕੰਮ ਘਟਾਉਣਾ"
          : locale === "hi"
            ? "कार्यभार घटाना"
            : "Reduce Farm Workload",
      desc:
        locale === "pa"
          ? "ਵੱਧ ਸਮਾਂ ਅਤੇ ਸੁਖਾਲਾ ਫ਼ਸਲੀ ਚੱਕਰ (ਪੁਰਾਣੀ ਚੋਣ)"
          : locale === "hi"
            ? "कार्यभार और बुवाई खिड़की में सुगमता (पुरानी प्राथमिकता)"
            : "Wider turnaround windows and operational labor relief (Legacy selection).",
      icon: "⏱️",
      isCanonical: false,
    };
  }

  // Transparent representation for unknown/malformed identifiers
  return {
    id: String(goalId),
    title: String(goalId),
    desc: `Unrecognized goal identifier: "${goalId}".`,
    icon: "📋",
    isCanonical: false,
  };
}

/**
 * Filters a list of farming goals, returning ONLY verified canonical goals
 * safe to transmit to Developer 1's backend API.
 */
export function filterCanonicalFarmingGoals(goals: unknown[]): CanonicalFarmingGoal[] {
  if (!Array.isArray(goals)) return [];
  const canonicalSet: CanonicalFarmingGoal[] = [];

  for (const g of goals) {
    const canonical = canonicalizeFarmingGoal(g);
    if (canonical && !canonicalSet.includes(canonical)) {
      canonicalSet.push(canonical);
    }
  }

  return canonicalSet;
}

/**
 * Returns the list of all seven approved farming goals in canonical order for presentation.
 */
export function getApprovedFarmingGoalsList(locale: "en" | "pa" | "hi" = "en"): Array<{
  id: CanonicalFarmingGoal;
  title: string;
  desc: string;
  icon: string;
  isCanonical: true;
}> {
  return APPROVED_SEVEN_FARMING_GOAL_IDS.map((id) => {
    const loc = getLocalizedGoal(id, locale);
    return {
      id,
      title: loc.title,
      desc: loc.desc,
      icon: loc.icon,
      isCanonical: true,
    };
  });
}

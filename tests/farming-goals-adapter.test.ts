import { describe, expect, it } from "vitest";
import {
  APPROVED_SEVEN_FARMING_GOAL_IDS,
  AUTHORITATIVE_FARMING_GOALS,
  canonicalizeFarmingGoal,
  getApprovedFarmingGoalsList,
  getLocalizedGoal,
  filterCanonicalFarmingGoals,
} from "../src/utils/farmingGoalsAdapter";

describe("Farming Goals Presentation Adapter", () => {
  it("contains exactly the seven approved canonical goals", () => {
    expect(APPROVED_SEVEN_FARMING_GOAL_IDS).toEqual([
      "improve_yield",
      "reduce_water_usage",
      "improve_soil_health",
      "reduce_input_costs",
      "diversify_crops",
      "improve_income_stability",
      "manage_climate_risk",
    ]);
    expect(APPROVED_SEVEN_FARMING_GOAL_IDS).toHaveLength(7);
  });

  it("provides complete trilingual localization for each of the seven goals", () => {
    for (const goalId of APPROVED_SEVEN_FARMING_GOAL_IDS) {
      const en = getLocalizedGoal(goalId, "en");
      const pa = getLocalizedGoal(goalId, "pa");
      const hi = getLocalizedGoal(goalId, "hi");

      expect(en.title).toBeTruthy();
      expect(en.desc).toBeTruthy();
      expect(en.icon).toBeTruthy();
      expect(en.isCanonical).toBe(true);

      expect(pa.title).toBeTruthy();
      expect(pa.desc).toBeTruthy();
      expect(pa.isCanonical).toBe(true);

      expect(hi.title).toBeTruthy();
      expect(hi.desc).toBeTruthy();
      expect(hi.isCanonical).toBe(true);
    }
  });

  it("canonicalizes approved legacy goal identifiers seamlessly", () => {
    expect(canonicalizeFarmingGoal("water_saving")).toBe("reduce_water_usage");
    expect(canonicalizeFarmingGoal("soil_health")).toBe("improve_soil_health");
    expect(canonicalizeFarmingGoal("climate_resilience")).toBe("manage_climate_risk");
    expect(canonicalizeFarmingGoal("crop_rotation_diversity")).toBe("diversify_crops");
    expect(canonicalizeFarmingGoal("income_boost")).toBe("improve_income_stability");
    expect(canonicalizeFarmingGoal("improve_yield")).toBe("improve_yield");
  });

  it("does NOT map less_labor to reduce_input_costs (preserves distinction between workload and finances)", () => {
    expect(canonicalizeFarmingGoal("less_labor")).toBeNull();

    const localized = getLocalizedGoal("less_labor", "en");
    expect(localized.isCanonical).toBe(false);
    expect(localized.title).toBe("Reduce Farm Workload");
    expect(localized.icon).toBe("⏱️");
  });

  it("does NOT silently fallback to improve_yield for unknown or malformed identifiers", () => {
    expect(canonicalizeFarmingGoal("unknown_experimental_goal")).toBeNull();
    expect(canonicalizeFarmingGoal("random_string_123")).toBeNull();
    expect(canonicalizeFarmingGoal("")).toBeNull();
    expect(canonicalizeFarmingGoal(null)).toBeNull();
    expect(canonicalizeFarmingGoal(undefined)).toBeNull();
    expect(canonicalizeFarmingGoal(123 as unknown as string)).toBeNull();

    // Verify getLocalizedGoal transparently shows unrecognized without claiming improve_yield
    const localized = getLocalizedGoal("unknown_experimental_goal", "en");
    expect(localized.isCanonical).toBe(false);
    expect(localized.title).toBe("unknown_experimental_goal");
    expect(localized.title).not.toBe("Improve Crop Yield");
  });

  it("filterCanonicalFarmingGoals returns strictly canonical goals for backend transmission", () => {
    const rawGoals = [
      "water_saving",
      "soil_health",
      "less_labor",
      "invalid_goal",
      "improve_yield",
    ];

    const filtered = filterCanonicalFarmingGoals(rawGoals);

    expect(filtered).toEqual(["reduce_water_usage", "improve_soil_health", "improve_yield"]);
    expect(filtered).not.toContain("less_labor");
    expect(filtered).not.toContain("invalid_goal");
  });

  it("getApprovedFarmingGoalsList returns all 7 goals in canonical order", () => {
    const list = getApprovedFarmingGoalsList("en");
    expect(list).toHaveLength(7);
    expect(list.map((g) => g.id)).toEqual([
      "improve_yield",
      "reduce_water_usage",
      "improve_soil_health",
      "reduce_input_costs",
      "diversify_crops",
      "improve_income_stability",
      "manage_climate_risk",
    ]);
  });
});

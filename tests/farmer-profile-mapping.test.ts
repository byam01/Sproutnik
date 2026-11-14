import { describe, expect, it } from "vitest";
import {
  convertToHectares,
  mapOnboardingToFarmerProfile,
  INITIAL_ONBOARDING_STATE,
  OnboardingState,
  LUDHIANA_DEMO_LOCATION,
} from "../src/types/onboarding";

describe("Land Area Conversion (convertToHectares)", () => {
  it("converts 5 acres to approximately 2.0234 hectares", () => {
    const ha = convertToHectares(5, "acres");
    expect(ha).toBe(2.0234);
  });

  it("converts 8 statutory Punjab kanals to approximately 0.4047 hectares", () => {
    const ha = convertToHectares(8, "kanals");
    expect(ha).toBe(0.4047);
  });

  it("converts 4.8 traditional Punjab kacha bighas to approximately 0.4047 hectares", () => {
    const ha = convertToHectares(4.8, "bighas");
    expect(ha).toBe(0.4047);
  });

  it("converts 2 metric hectares to 2 hectares", () => {
    const ha = convertToHectares(2, "hectares");
    expect(ha).toBe(2);
  });

  it("returns 0 for negative or invalid area inputs", () => {
    expect(convertToHectares(0, "acres")).toBe(0);
    expect(convertToHectares(-5, "acres")).toBe(0);
    expect(convertToHectares(NaN, "hectares")).toBe(0);
  });
});

describe("Farmer Profile Mapping (mapOnboardingToFarmerProfile)", () => {
  it("preserves known answers with exact values and metadata", () => {
    const customState: OnboardingState = {
      ...INITIAL_ONBOARDING_STATE,
      location: {
        latitude: 31.33,
        longitude: 75.58,
        district: "Jalandhar",
        state: "Punjab",
        country: "India",
      },
      locationStatus: "known",
      isDemonstrationLocation: false,
      landArea: 10,
      landUnit: "acres",
      landAreaStatus: "known",
      soilTexture: "sandy_loam",
      soilStatus: "known",
      irrigationSource: "canal",
      irrigationStatus: "known",
      currentCrops: ["bread_wheat", "kharif_maize"],
      cropsStatus: "known",
      farmingGoals: ["reduce_water_usage", "improve_soil_health"],
      goalsStatus: "known",
    };

    const { backendProfile, farmerReported } = mapOnboardingToFarmerProfile(customState);

    // Location
    expect(backendProfile.location.status).toBe("known");
    if (backendProfile.location.status === "known") {
      expect(backendProfile.location.value.latitude).toBe(31.33);
      expect(backendProfile.location.value.district).toBe("Jalandhar");
      expect(backendProfile.location.value.isDemonstration).toBe(false);
      expect(backendProfile.location.source).toBe("user");
    }

    // Land Area
    expect(backendProfile.landAreaHectares.status).toBe("known");
    if (backendProfile.landAreaHectares.status === "known") {
      expect(backendProfile.landAreaHectares.value).toBe(4.0469);
    }

    // Soil
    expect(backendProfile.soilTexture.status).toBe("known");
    if (backendProfile.soilTexture.status === "known") {
      expect(backendProfile.soilTexture.value).toBe("sandy_loam");
    }

    // Irrigation
    expect(backendProfile.irrigationSource.status).toBe("known");
    if (backendProfile.irrigationSource.status === "known") {
      expect(backendProfile.irrigationSource.value).toBe("canal");
    }

    // Stable Crop IDs
    expect(backendProfile.currentCrops.status).toBe("known");
    if (backendProfile.currentCrops.status === "known") {
      expect(backendProfile.currentCrops.value).toEqual(["bread_wheat", "kharif_maize"]);
    }

    // Farming Goals
    expect(backendProfile.farmingGoals.status).toBe("known");
    if (backendProfile.farmingGoals.status === "known") {
      expect(backendProfile.farmingGoals.value).toEqual(["reduce_water_usage", "improve_soil_health"]);
    }

    // Farmer-reported raw data
    expect(farmerReported.landAreaHectares).toBe(4.0469);
    expect(farmerReported.landAreaAcres).toBe(10);
  });

  it("maps approved canonical farming goals correctly into FarmerProfile", () => {
    const canonicalGoalsState: OnboardingState = {
      ...INITIAL_ONBOARDING_STATE,
      farmingGoals: [
        "improve_yield",
        "reduce_water_usage",
        "improve_soil_health",
        "reduce_input_costs",
        "diversify_crops",
        "improve_income_stability",
        "manage_climate_risk",
      ],
      goalsStatus: "known",
    };

    const { backendProfile } = mapOnboardingToFarmerProfile(canonicalGoalsState);

    expect(backendProfile.farmingGoals.status).toBe("known");
    if (backendProfile.farmingGoals.status === "known") {
      expect(backendProfile.farmingGoals.value).toHaveLength(7);
      expect(backendProfile.farmingGoals.value).toContain("improve_yield");
      expect(backendProfile.farmingGoals.value).toContain("manage_climate_risk");
    }
  });

  it("distinguishes demonstration coordinates from farmer-confirmed coordinates", () => {
    const demoState: OnboardingState = {
      ...INITIAL_ONBOARDING_STATE,
      location: LUDHIANA_DEMO_LOCATION,
      locationStatus: "known",
      isDemonstrationLocation: true,
    };

    const { backendProfile } = mapOnboardingToFarmerProfile(demoState);

    expect(backendProfile.location.status).toBe("known");
    if (backendProfile.location.status === "known") {
      expect(backendProfile.location.value.isDemonstration).toBe(true);
      expect(backendProfile.location.source).toBe("imported");
    }
  });

  it("preserves 'unknown', 'skipped', and 'not_provided' statuses without replacing them with defaults in backendProfile", () => {
    const sparseState: OnboardingState = {
      ...INITIAL_ONBOARDING_STATE,
      location: null,
      locationStatus: "skipped",
      landArea: null,
      landAreaStatus: "unknown",
      soilTexture: null,
      soilStatus: "unknown",
      irrigationSource: null,
      irrigationStatus: "skipped",
      currentCrops: [],
      cropsStatus: "not_provided",
      farmingGoals: [],
      goalsStatus: "not_provided",
    };

    const { backendProfile, regionalEstimatesApplied } = mapOnboardingToFarmerProfile(sparseState);

    // Backend profile MUST retain the true field status
    expect(backendProfile.location.status).toBe("skipped");
    expect(backendProfile.landAreaHectares.status).toBe("unknown");
    expect(backendProfile.soilTexture.status).toBe("unknown");
    expect(backendProfile.irrigationSource.status).toBe("skipped");
    expect(backendProfile.currentCrops.status).toBe("not_provided");
    expect(backendProfile.farmingGoals.status).toBe("not_provided");

    // Regional baseline estimates must remain clearly labelled separately in regionalEstimatesApplied
    expect(regionalEstimatesApplied.location).toBeDefined();
    expect(regionalEstimatesApplied.soilTexture?.estimate).toBe("loam");
    expect(regionalEstimatesApplied.irrigationSource?.estimate).toBe("tubewell_deep");
    expect(regionalEstimatesApplied.landAreaHectares?.estimate).toBe(2.0234);
  });
});

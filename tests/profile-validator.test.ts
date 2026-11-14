import { describe, it, expect } from "vitest";
import {
  validateProfileField,
  validateLandAreaHectaresValue,
  validateSoilTextureValue,
  validateIrrigationAvailableValue,
  validateIrrigationSourceValue,
  validateCurrentCropsValue,
  validateFarmingGoalsValue,
  validateProfileLocationValue,
  validateFarmerProfileInput,
  validateFarmerProfilePartialInput,
} from "../src/server/validators/profileValidator";
import {
  createKnownField,
  createNotProvidedField,
  createSkippedField,
  createUnknownField,
  FARMING_GOALS,
} from "../src/types";

describe("Profile Validation Engine", () => {
  describe("validateProfileField Structure", () => {
    it("passes for valid 'known' status with value", () => {
      const field = createKnownField("loam", "user");
      const errors = validateProfileField("soilTexture", field, (val) =>
        val === "loam" ? [] : [{ field: "soilTexture.value", message: "invalid" }]
      );
      expect(errors.length).toBe(0);
    });

    it("fails for 'known' status if value is null or undefined", () => {
      const field = { status: "known", value: null };
      const errors = validateProfileField("soilTexture", field);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.field === "soilTexture.value")).toBe(true);
    });

    it("passes for non-known statuses ('unknown', 'skipped', 'not_provided') without value", () => {
      expect(validateProfileField("test", createUnknownField()).length).toBe(0);
      expect(validateProfileField("test", createSkippedField()).length).toBe(0);
      expect(validateProfileField("test", createNotProvidedField()).length).toBe(0);
    });

    it("fails for non-known statuses if a value is attached", () => {
      const invalid = { status: "skipped", value: "unexpected_val" };
      const errors = validateProfileField("test", invalid);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.message.includes("Non-known fields must not carry a value"))).toBe(true);
    });

    it("rejects invalid status strings", () => {
      const invalid = { status: "invalid_status" };
      const errors = validateProfileField("test", invalid);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.message.includes("Invalid status"))).toBe(true);
    });

    it("rejects invalid provenance sources", () => {
      const invalid = { status: "known", value: "loam", source: "random_agent" };
      const errors = validateProfileField("soilTexture", invalid);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.message.includes("Invalid source"))).toBe(true);
    });

    it("rejects invalid ISO dates in updatedAt", () => {
      const invalid = { status: "known", value: "loam", updatedAt: "not-a-date" };
      const errors = validateProfileField("soilTexture", invalid);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.message.includes("ISO 8601"))).toBe(true);
    });
  });

  describe("Domain Value Validators", () => {
    it("validates landAreaHectares (positive finite number)", () => {
      expect(validateLandAreaHectaresValue(2.5, "area").length).toBe(0);
      expect(validateLandAreaHectaresValue(0.1, "area").length).toBe(0);

      expect(validateLandAreaHectaresValue(0, "area").length).toBeGreaterThan(0);
      expect(validateLandAreaHectaresValue(-5, "area").length).toBeGreaterThan(0);
      expect(validateLandAreaHectaresValue(NaN, "area").length).toBeGreaterThan(0);
      expect(validateLandAreaHectaresValue(Infinity, "area").length).toBeGreaterThan(0);
      expect(validateLandAreaHectaresValue("2.5", "area").length).toBeGreaterThan(0);
    });

    it("validates soilTexture against 5 canonical Punjab textures", () => {
      expect(validateSoilTextureValue("clay_loam", "soil").length).toBe(0);
      expect(validateSoilTextureValue("sandy_loam", "soil").length).toBe(0);
      expect(validateSoilTextureValue("loam", "soil").length).toBe(0);
      expect(validateSoilTextureValue("silt_loam", "soil").length).toBe(0);
      expect(validateSoilTextureValue("sandy", "soil").length).toBe(0);

      expect(validateSoilTextureValue("peat", "soil").length).toBeGreaterThan(0);
      expect(validateSoilTextureValue("black_cotton", "soil").length).toBeGreaterThan(0);
    });

    it("validates irrigationAvailable", () => {
      expect(validateIrrigationAvailableValue(true, "irr").length).toBe(0);
      expect(validateIrrigationAvailableValue(false, "irr").length).toBe(0);
      expect(validateIrrigationAvailableValue("yes", "irr").length).toBeGreaterThan(0);
    });

    it("validates irrigationSource against 5 canonical sources", () => {
      expect(validateIrrigationSourceValue("tubewell_deep", "src").length).toBe(0);
      expect(validateIrrigationSourceValue("tubewell_shallow", "src").length).toBe(0);
      expect(validateIrrigationSourceValue("canal", "src").length).toBe(0);
      expect(validateIrrigationSourceValue("rainfed_only", "src").length).toBe(0);
      expect(validateIrrigationSourceValue("conjunctive", "src").length).toBe(0);

      expect(validateIrrigationSourceValue("river", "src").length).toBeGreaterThan(0);
    });

    describe("currentCrops validation", () => {
      it("validates currentCrops strictly against CROPS_PUNJAB", () => {
        expect(validateCurrentCropsValue(["paddy_transplanted", "bread_wheat"], "crops").length).toBe(0);
        expect(validateCurrentCropsValue(["kharif_maize", "summer_moong", "rabi_mustard", "paddy_dsr"], "crops").length).toBe(0);

        const invalid = validateCurrentCropsValue(["paddy_transplanted", "unsupported_avocado"], "crops");
        expect(invalid.length).toBeGreaterThan(0);
        expect(invalid[0].message).toContain("unsupported_avocado");
      });

      it("accepts an empty array [] in known state representing fallow or transitioning land", () => {
        // Documented behavior: An empty array is valid for a farmer who currently cultivates no crops
        const validationErrors = validateCurrentCropsValue([], "currentCrops.value");
        expect(validationErrors.length).toBe(0);

        const knownEmptyField = createKnownField<string[]>([]);
        const fieldErrors = validateProfileField("currentCrops", knownEmptyField, validateCurrentCropsValue);
        expect(fieldErrors.length).toBe(0);
      });

      it("rejects non-array inputs for currentCrops", () => {
        expect(validateCurrentCropsValue("paddy_transplanted", "crops").length).toBeGreaterThan(0);
        expect(validateCurrentCropsValue(null, "crops").length).toBeGreaterThan(0);
        expect(validateCurrentCropsValue({ crop: "paddy_transplanted" }, "crops").length).toBeGreaterThan(0);
      });
    });

    describe("farmingGoals validation", () => {
      it("accepts all 7 canonical FARMING_GOALS individually", () => {
        // Enforce all 7 canonical goals from src/types/index.ts
        expect(FARMING_GOALS.length).toBe(7);

        for (const goal of FARMING_GOALS) {
          const errors = validateFarmingGoalsValue([goal], "goals");
          expect(errors.length).toBe(0);
        }
      });

      it("accepts an array containing all 7 canonical FARMING_GOALS simultaneously", () => {
        const allGoals = [...FARMING_GOALS];
        const errors = validateFarmingGoalsValue(allGoals, "goals");
        expect(errors.length).toBe(0);
      });

      it("accepts an empty array [] for farmingGoals", () => {
        const errors = validateFarmingGoalsValue([], "goals");
        expect(errors.length).toBe(0);
      });

      it("rejects unapproved or outdated goal values", () => {
        // Explicitly test unapproved/outdated goals
        const outdatedGoals = [
          "maximize_profit",
          "minimize_water",
          "improve_soil",
          "reduce_risk",
          "get_rich_quick",
          "unknown_goal",
        ];

        for (const invalidGoal of outdatedGoals) {
          const errors = validateFarmingGoalsValue([invalidGoal], "goals");
          expect(errors.length).toBeGreaterThan(0);
          expect(errors[0].message).toContain(invalidGoal);
        }
      });

      it("rejects mixed arrays with valid and invalid goals at the exact element path", () => {
        const mixed = ["improve_yield", "maximize_profit", "reduce_water_usage"];
        const errors = validateFarmingGoalsValue(mixed, "goals");
        expect(errors.length).toBe(1);
        expect(errors[0].field).toBe("goals[1]");
        expect(errors[0].message).toContain("maximize_profit");
      });

      it("rejects non-array values for farmingGoals", () => {
        expect(validateFarmingGoalsValue("improve_yield", "goals").length).toBeGreaterThan(0);
        expect(validateFarmingGoalsValue(null, "goals").length).toBeGreaterThan(0);
      });
    });

    it("validates ProfileLocation", () => {
      const valid = {
        countryCode: "IN",
        selectionMethod: "gps",
        latitude: 30.9,
        longitude: 75.85,
        district: "Ludhiana",
      };
      expect(validateProfileLocationValue(valid, "loc").length).toBe(0);

      expect(validateProfileLocationValue({ selectionMethod: "gps" }, "loc").length).toBeGreaterThan(0);
      expect(validateProfileLocationValue({ countryCode: "IN", selectionMethod: "telepathy" }, "loc").length).toBeGreaterThan(0);
      expect(validateProfileLocationValue({ countryCode: "IN", selectionMethod: "gps", latitude: 120 }, "loc").length).toBeGreaterThan(0);
    });
  });

  describe("Complete FarmerProfile Validation", () => {
    const validFullPayload = {
      location: createKnownField({
        countryCode: "IN",
        selectionMethod: "manual",
        district: "Ludhiana",
      }),
      landAreaHectares: createKnownField(2.0),
      soilTexture: createKnownField("loam"),
      irrigationAvailable: createKnownField(true),
      irrigationSource: createKnownField("tubewell_deep"),
      currentCrops: createKnownField(["bread_wheat"]),
      farmingGoals: createKnownField(["improve_yield"]),
    };

    it("passes for a fully valid FarmerProfile creation payload", () => {
      const result = validateFarmerProfileInput(validFullPayload);
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it("passes when currentCrops is an empty known array (fallow land)", () => {
      const fallowPayload = {
        ...validFullPayload,
        currentCrops: createKnownField<string[]>([]),
      };
      const result = validateFarmerProfileInput(fallowPayload);
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it("passes when fields have valid unknown/skipped status", () => {
      const draftPayload = {
        ...validFullPayload,
        landAreaHectares: createUnknownField(),
        soilTexture: createSkippedField(),
      };
      const result = validateFarmerProfileInput(draftPayload);
      expect(result.isValid).toBe(true);
    });

    it("explicitly rejects prohibited legacy 'landAreaAcres'", () => {
      const invalid = {
        ...validFullPayload,
        landAreaAcres: 5,
      };
      const result = validateFarmerProfileInput(invalid);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "landAreaAcres")).toBe(true);
    });

    it("explicitly rejects prohibited 'groundwaterDepthMeters'", () => {
      const invalid = {
        ...validFullPayload,
        groundwaterDepthMeters: 25.0,
      };
      const result = validateFarmerProfileInput(invalid);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "groundwaterDepthMeters")).toBe(true);
    });
  });

  describe("Partial Update Validation (PATCH)", () => {
    it("passes for a valid partial field update", () => {
      const update = {
        soilTexture: createKnownField("clay_loam"),
      };
      const result = validateFarmerProfilePartialInput(update);
      expect(result.isValid).toBe(true);
    });

    it("rejects attempt to mutate profileId or createdAt in update", () => {
      const tamper = {
        profileId: "new_id",
        createdAt: "2020-01-01T00:00:00.000Z",
      };
      const result = validateFarmerProfilePartialInput(tamper);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "profileId")).toBe(true);
      expect(result.errors.some((e) => e.field === "createdAt")).toBe(true);
    });
  });
});

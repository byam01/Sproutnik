import { describe, it, expect } from "vitest";
import {
  convertLandAreaToHectares,
  tryConvertLandAreaToHectares,
  convertHectaresToTargetUnit,
  formatHectaresForDisplay,
  normalizeLandAreaUnit,
  validateLandAreaInput,
  ACRE_TO_HECTARES,
  STATUTORY_KANAL_TO_HECTARES,
  KACHA_BIGHA_TO_HECTARES,
} from "../src/utils/landArea";

describe("Land Area Conversion Utilities", () => {
  describe("Canonical Conversion to Hectares", () => {
    it("converts 5 acres to ~2.0234 hectares", () => {
      const ha = convertLandAreaToHectares(5, "acres");
      // 5 * 0.404685642 = 2.02342821
      expect(ha).toBeCloseTo(2.0234, 4);
    });

    it("converts 8 statutory kanals to ~0.4047 hectares (1 acre)", () => {
      const ha = convertLandAreaToHectares(8, "kanals");
      // 8 * 0.125 acres = 1 acre = 0.404685642 ha
      expect(ha).toBeCloseTo(0.4047, 4);
      expect(ha).toBe(ACRE_TO_HECTARES);
    });

    it("converts 4.8 traditional Punjab kacha bighas to ~0.4047 hectares (1 acre)", () => {
      const ha = convertLandAreaToHectares(4.8, "kacha_bighas");
      // 4.8 * (1 / 4.8) = 1 acre = 0.404685642 ha
      expect(ha).toBeCloseTo(0.4047, 4);
      expect(ha).toBeCloseTo(ACRE_TO_HECTARES, 8);
    });

    it("supports nominal 0.2083 kacha bigha approximation when requested", () => {
      const ha = convertLandAreaToHectares(4.8, "kacha_bighas", { useApproximateKachaBigha: true });
      // 4.8 * 0.2083 * 0.404685642 = 0.404620988...
      expect(ha).toBeCloseTo(0.4047, 3);
    });

    it("preserves 2 hectares as exactly 2 hectares", () => {
      const ha = convertLandAreaToHectares(2, "hectares");
      expect(ha).toBe(2);
    });

    it("supports unit aliases and case-insensitivity", () => {
      expect(convertLandAreaToHectares(1, "acre")).toBe(ACRE_TO_HECTARES);
      expect(convertLandAreaToHectares(1, "ACRES")).toBe(ACRE_TO_HECTARES);
      expect(convertLandAreaToHectares(1, "statutory_kanal")).toBe(STATUTORY_KANAL_TO_HECTARES);
      expect(convertLandAreaToHectares(1, "bigha")).toBe(KACHA_BIGHA_TO_HECTARES);
      expect(convertLandAreaToHectares(1, "ha")).toBe(1);
    });
  });

  describe("Validation and Invalid Inputs", () => {
    it("rejects negative values with RangeError", () => {
      expect(() => convertLandAreaToHectares(-1, "acres")).toThrow(RangeError);
      expect(() => convertLandAreaToHectares(-0.001, "hectares")).toThrow(RangeError);
    });

    it("rejects non-finite values (NaN, Infinity)", () => {
      expect(() => convertLandAreaToHectares(NaN, "acres")).toThrow(RangeError);
      expect(() => convertLandAreaToHectares(Infinity, "acres")).toThrow(RangeError);
      expect(() => convertLandAreaToHectares(-Infinity, "kanals")).toThrow(RangeError);
    });

    it("rejects non-numeric inputs in validateLandAreaInput", () => {
      expect(validateLandAreaInput(null).isValid).toBe(false);
      expect(validateLandAreaInput(undefined).isValid).toBe(false);
      expect(validateLandAreaInput("5").isValid).toBe(false);
      expect(validateLandAreaInput({}).isValid).toBe(false);
    });

    it("rejects unsupported units with TypeError", () => {
      expect(() => convertLandAreaToHectares(10, "sq_yards")).toThrow(TypeError);
      expect(() => convertLandAreaToHectares(10, "murdabba")).toThrow(TypeError);
    });

    it("tryConvertLandAreaToHectares returns null on invalid inputs without throwing", () => {
      expect(tryConvertLandAreaToHectares(-5, "acres")).toBeNull();
      expect(tryConvertLandAreaToHectares(NaN, "acres")).toBeNull();
      expect(tryConvertLandAreaToHectares("invalid", "acres")).toBeNull();
      expect(tryConvertLandAreaToHectares(10, "unknown_unit")).toBeNull();
      expect(tryConvertLandAreaToHectares(10, "acres")).toBeCloseTo(4.0469, 4);
    });
  });

  describe("Inverse Conversion (Hectares to Target Unit)", () => {
    it("converts hectares back to acres accurately", () => {
      const ha = 2.02342821;
      const acres = convertHectaresToTargetUnit(ha, "acres");
      expect(acres).toBeCloseTo(5.0, 4);
    });

    it("converts hectares back to statutory kanals", () => {
      const ha = ACRE_TO_HECTARES; // 1 acre
      const kanals = convertHectaresToTargetUnit(ha, "kanals");
      expect(kanals).toBeCloseTo(8.0, 4);
    });

    it("converts hectares back to traditional kacha bighas", () => {
      const ha = ACRE_TO_HECTARES; // 1 acre
      const bighas = convertHectaresToTargetUnit(ha, "kacha_bighas");
      expect(bighas).toBeCloseTo(4.8, 4);
    });
  });

  describe("Display Formatting", () => {
    it("formats hectares with custom decimal rounding", () => {
      expect(formatHectaresForDisplay(2.02342821, 2)).toBe("2.02 ha");
      expect(formatHectaresForDisplay(2.02342821, 4)).toBe("2.0234 ha");
      expect(formatHectaresForDisplay(-1)).toBe("0.00 ha");
    });
  });
});

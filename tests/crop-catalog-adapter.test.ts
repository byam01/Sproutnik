import { describe, it, expect } from "vitest";
import {
  APPROVED_EIGHT_CROP_IDS,
  ROTATION_ENGINE_SUPPORTED_CROP_IDS,
  getCropDisplay,
  getCropDisplayName,
  getCropLocalizedName,
  getCropLocalizedNamePunjabi,
  getCropLocalizedNameHindi,
  getConfirmedCropDisplayList,
  getApprovedEightCropDisplayList,
  isApprovedEightCropId,
  isAuthoritativeCropId,
  isRotationSupportedCropId,
  filterRotationSupportedCrops,
  getRotationUnsupportedCrops,
} from "../src/utils/cropCatalogAdapter";
import { CROPS_PUNJAB } from "../src/agronomy/crops";

describe("Crop Catalog Frontend Adapter (Authoritative & Presentation)", () => {
  describe("Separation of Stable Identifiers and Display Names", () => {
    it("resolves confirmed crops with stable identifiers and correct display labels", () => {
      const paddy = getCropDisplay("paddy_transplanted");
      expect(paddy.id).toBe("paddy_transplanted");
      expect(paddy.displayName).toBe("Puddled Transplanted Rice (Paddy)");
      expect(paddy.commonName).toBe("Paddy (Transplanted)");
      expect(paddy.localizedNamePunjabi).toBe("ਝੋਨਾ (ਕੱਦੂ ਕਰਕੇ ਲਾਇਆ)");
      expect(paddy.isConfirmedInCatalog).toBe(true);

      const wheat = getCropDisplay("bread_wheat");
      expect(wheat.id).toBe("bread_wheat");
      expect(wheat.displayName).toBe("Rabi Bread Wheat");
      expect(wheat.commonName).toBe("Wheat");
      expect(wheat.localizedNamePunjabi).toBe("ਕਣਕ");
      expect(wheat.isConfirmedInCatalog).toBe(true);
    });

    it("verifies isAuthoritativeCropId against Developer 1's backend catalog", () => {
      expect(isAuthoritativeCropId("paddy_transplanted")).toBe(true);
      expect(isAuthoritativeCropId("bread_wheat")).toBe(true);
      expect(isAuthoritativeCropId("kharif_maize")).toBe(true);
      expect(isAuthoritativeCropId("summer_moong")).toBe(true);
      expect(isAuthoritativeCropId("non_existent_crop")).toBe(false);
      expect(isAuthoritativeCropId("")).toBe(false);
    });

    it("handles unconfirmed/unknown crop IDs gracefully without inventing canonical data", () => {
      const unknown = getCropDisplay("experimental_quinoa");
      expect(unknown.id).toBe("experimental_quinoa");
      expect(unknown.displayName).toBe("Experimental Quinoa");
      expect(unknown.isConfirmedInCatalog).toBe(false);
      expect(unknown.localizedNamePunjabi).toBeUndefined();
    });

    it("returns all confirmed crops from the authoritative registry", () => {
      const list = getConfirmedCropDisplayList();
      const authoritativeKeys = Object.keys(CROPS_PUNJAB);

      expect(list.length).toBe(authoritativeKeys.length);
      for (const item of list) {
        expect(authoritativeKeys).toContain(item.id);
        expect(item.isConfirmedInCatalog).toBe(true);
        expect(item.displayName.length).toBeGreaterThan(0);
      }
    });

    it("provides convenience getters with fallback support", () => {
      expect(getCropDisplayName("bread_wheat")).toBe("Rabi Bread Wheat");
      expect(getCropDisplayName("unknown_crop", "Custom Fallback")).toBe("Custom Fallback");
      expect(getCropLocalizedName("kharif_maize")).toBe("ਮੱਕੀ");
      expect(getCropLocalizedName("unknown_crop")).toBeUndefined();
    });
  });

  describe("Approved Eight Crops & Localization Specification (Stage 2B)", () => {
    it("includes exactly the eight approved canonical crop IDs", () => {
      expect(APPROVED_EIGHT_CROP_IDS).toEqual([
        "paddy_transplanted",
        "paddy_dsr",
        "bread_wheat",
        "kharif_maize",
        "summer_moong",
        "rabi_mustard",
        "spring_sunflower",
        "potato_early",
      ]);

      for (const id of APPROVED_EIGHT_CROP_IDS) {
        expect(isApprovedEightCropId(id)).toBe(true);
        const display = getCropDisplay(id);
        expect(display.id).toBe(id);
        expect(display.isConfirmedInCatalog).toBe(true);
        expect(display.displayName.length).toBeGreaterThan(0);
        expect(display.commonName.length).toBeGreaterThan(0);
      }
    });

    it("preserves stable crop IDs across English, Punjabi and Hindi localization", () => {
      for (const id of APPROVED_EIGHT_CROP_IDS) {
        const display = getCropDisplay(id);
        expect(display.id).toBe(id);

        const en = getCropDisplayName(id, "en");
        const pa = getCropDisplayName(id, "pa");
        const hi = getCropDisplayName(id, "hi");

        expect(typeof en).toBe("string");
        expect(typeof pa).toBe("string");
        expect(typeof hi).toBe("string");

        expect(getCropLocalizedNamePunjabi(id)).toBe(display.localizedNamePunjabi);
        expect(getCropLocalizedNameHindi(id)).toBe(display.localizedNameHindi);
      }
    });

    it("marks exactly the first six crops as rotation-supported", () => {
      expect(ROTATION_ENGINE_SUPPORTED_CROP_IDS).toEqual([
        "paddy_transplanted",
        "paddy_dsr",
        "bread_wheat",
        "kharif_maize",
        "summer_moong",
        "rabi_mustard",
      ]);

      for (const id of ROTATION_ENGINE_SUPPORTED_CROP_IDS) {
        expect(isRotationSupportedCropId(id)).toBe(true);
        expect(isAuthoritativeCropId(id)).toBe(true);
        expect(CROPS_PUNJAB[id]).toBeDefined();

        const display = getCropDisplay(id);
        expect(display.isRotationSupported).toBe(true);
      }
    });

    it("keeps spring_sunflower and potato_early confirmed in catalog but unsupported for rotation calculations", () => {
      const sunflower = getCropDisplay("spring_sunflower");
      expect(sunflower.id).toBe("spring_sunflower");
      expect(sunflower.isConfirmedInCatalog).toBe(true);
      expect(sunflower.isRotationSupported).toBe(false);
      expect(isRotationSupportedCropId("spring_sunflower")).toBe(false);
      expect(isAuthoritativeCropId("spring_sunflower")).toBe(false);

      const potato = getCropDisplay("potato_early");
      expect(potato.id).toBe("potato_early");
      expect(potato.isConfirmedInCatalog).toBe(true);
      expect(potato.isRotationSupported).toBe(false);
      expect(isRotationSupportedCropId("potato_early")).toBe(false);
      expect(isAuthoritativeCropId("potato_early")).toBe(false);
    });

    it("filters out unknown and catalog-only IDs from rotation calculations", () => {
      const mixedFarmerSelections = [
        "paddy_transplanted",
        "spring_sunflower",
        "bread_wheat",
        "potato_early",
        "experimental_quinoa",
        "summer_moong",
      ];

      const supported = filterRotationSupportedCrops(mixedFarmerSelections);
      expect(supported).toEqual(["paddy_transplanted", "bread_wheat", "summer_moong"]);

      const unsupported = getRotationUnsupportedCrops(mixedFarmerSelections);
      expect(unsupported).toEqual(["spring_sunflower", "potato_early", "experimental_quinoa"]);
    });

    it("keeps cotton, sugarcane and chickpea catalog-only and not rotation-supported", () => {
      for (const id of ["cotton", "sugarcane", "chickpea"]) {
        const display = getCropDisplay(id);
        expect(display.id).toBe(id);
        expect(display.isConfirmedInCatalog).toBe(true);
        expect(display.isRotationSupported).toBe(false);
        expect(isRotationSupportedCropId(id)).toBe(false);
        expect(isAuthoritativeCropId(id)).toBe(false);
      }
    });

    it("does not automatically map basmati to paddy_transplanted or paddy_dsr", () => {
      const basmati = getCropDisplay("basmati");
      expect(basmati.id).toBe("basmati");
      expect(basmati.id).not.toBe("paddy_transplanted");
      expect(basmati.id).not.toBe("paddy_dsr");
      expect(basmati.isConfirmedInCatalog).toBe(false);
      expect(basmati.isRotationSupported).toBe(false);
    });

    it("falls back to default/custom display name without mutating stored crop identifier", () => {
      const unknownId = "custom_local_crop_xyz";
      const displayName = getCropDisplayName(unknownId, "en", "My Custom Local Crop");
      expect(displayName).toBe("My Custom Local Crop");

      const item = getCropDisplay(unknownId);
      expect(item.id).toBe("custom_local_crop_xyz");

      expect(getCropDisplayName("bread_wheat", "en")).toBe("Rabi Bread Wheat");
      expect(getCropDisplayName("bread_wheat", "pa")).toBe("ਕਣਕ");
      expect(getCropDisplayName("bread_wheat", "hi")).toBe("गेहूं");

      expect(getCropDisplayName(unknownId, "pa")).toBe("Custom Local Crop Xyz");
      expect(getCropDisplayName(unknownId, "hi")).toBe("Custom Local Crop Xyz");
    });
  });
});

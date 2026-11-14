import { describe, it, expect } from "vitest";
import {
  getCropDisplay,
  getCropDisplayName,
  getCropLocalizedName,
  getConfirmedCropDisplayList,
  isAuthoritativeCropId,
} from "../src/utils/cropCatalogAdapter";
import { CROPS_PUNJAB } from "../src/agronomy/crops";

describe("Crop Catalog Frontend Adapter", () => {
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
});

import { expect, test } from "@playwright/test";

const fontFamilyOf = async (page: import("@playwright/test").Page, selector: string) =>
  page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) throw new Error(`${sel} not found`);
    return getComputedStyle(element).fontFamily;
  }, selector);

test.describe("Rule: The page font falls back to a generic sans-serif family", () => {
  test.describe("The heading lists Lato then a generic sans-serif fallback", () => {
    test("The heading lists Lato then a generic sans-serif fallback", async ({ page }) => {
      await page.goto("./");
      const fontFamily = await fontFamilyOf(page, "h1");
      expect(fontFamily).toMatch(/Lato.*,\s*sans-serif/);
    });
  });

  test.describe("The paragraph text lists Lato then a generic sans-serif fallback", () => {
    test("The paragraph text lists Lato then a generic sans-serif fallback", async ({ page }) => {
      await page.goto("./");
      const fontFamily = await fontFamilyOf(page, "p");
      expect(fontFamily).toMatch(/Lato.*,\s*sans-serif/);
    });
  });
});

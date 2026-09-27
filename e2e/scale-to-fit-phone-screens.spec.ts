import { expect, test } from "@playwright/test";
import { advance, heightOf, oneBox, openGame, settle } from "./probe.ts";
import type { Sample } from "./probe.ts";

const canvasBox = async (page: import("@playwright/test").Page) => {
  const box = await page.locator("#game_div canvas").boundingBox();
  return box as NonNullable<typeof box>;
};

test.describe("Rule: The canvas scales to fit the viewport", () => {
  test.describe("A phone-width viewport shows the whole game with no scrollbar", () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test("A phone-width viewport shows the whole game with no scrollbar", async ({ page }) => {
      await page.goto("./");
      const box = await canvasBox(page);
      expect(box.width).toBeGreaterThan(300);
      expect(box.width).toBeLessThanOrEqual(375);
      expect(box.height).toBeLessThanOrEqual(667);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.y + box.height).toBeLessThanOrEqual(667);
      const centre = box.x + box.width / 2;
      expect(Math.abs(centre - 375 / 2)).toBeLessThanOrEqual(1);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBe(0);
    });
  });

  test.describe("A short landscape viewport shows the whole game with no cropping", () => {
    test.use({ viewport: { width: 667, height: 375 } });

    test("A short landscape viewport shows the whole game with no cropping", async ({ page }) => {
      await page.goto("./");
      const box = await canvasBox(page);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.y + box.height).toBeLessThanOrEqual(375);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(667);
      const hOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(hOverflow).toBe(0);
    });
  });

  test.describe("A desktop viewport keeps the original canvas size and position", () => {
    test.use({ viewport: { width: 1024, height: 768 } });

    test("A desktop viewport keeps the original canvas size and position", async ({ page }) => {
      await page.goto("./");
      const box = await canvasBox(page);
      expect(box).toMatchObject({ width: 400, height: 490 });
      const centre = box.x + box.width / 2;
      expect(Math.abs(centre - 1024 / 2)).toBeLessThanOrEqual(1);
    });
  });

  test.describe("The canvas recovers its full size after a resize away from a cramped viewport", () => {
    test.use({ viewport: { width: 667, height: 375 } });

    test("The canvas recovers its full size after a resize away from a cramped viewport", async ({ page }) => {
      await page.goto("./");
      const cramped = await canvasBox(page);
      expect(cramped.width).toBeLessThan(400);
      await page.setViewportSize({ width: 1024, height: 768 });
      await expect.poll(async () => (await canvasBox(page)).width).toBe(400);
      const recovered = await canvasBox(page);
      expect(recovered).toMatchObject({ width: 400, height: 490 });
    });
  });

  test.describe("The canvas tracks repeated rotation and resize without getting stuck", () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test("The canvas tracks repeated rotation and resize without getting stuck", async ({ page }) => {
      await page.goto("./");
      const portrait = await canvasBox(page);
      expect(portrait.width).toBeGreaterThan(300);

      await page.setViewportSize({ width: 667, height: 375 });
      await expect.poll(async () => (await canvasBox(page)).width).toBeLessThan(300);

      await page.setViewportSize({ width: 375, height: 667 });
      await expect
        .poll(async () => (await canvasBox(page)).width)
        .toBeCloseTo(portrait.width, 0);

      await page.setViewportSize({ width: 1024, height: 768 });
      await expect.poll(async () => (await canvasBox(page)).width).toBe(400);
      const desktop = await canvasBox(page);
      expect(desktop).toMatchObject({ width: 400, height: 490 });
    });
  });
});

test.describe("Rule: Touch input on the game does not move the page", () => {
  test.describe("The canvas opts out of the browser's default touch scrolling and zooming", () => {
    test.use({ viewport: { width: 375, height: 667 }, hasTouch: true });

    test("The canvas opts out of the browser's default touch scrolling and zooming", async ({ page }) => {
      await page.goto("./");
      const touchAction = await page.evaluate(
        () => getComputedStyle(document.querySelector("#game_div canvas") as Element).touchAction,
      );
      expect(touchAction).toBe("none");
      const viewportMeta = await page.evaluate(
        () => document.querySelector('meta[name="viewport"]')?.getAttribute("content") ?? "",
      );
      expect(viewportMeta).toContain("width=device-width");
      expect(viewportMeta).toMatch(/user-scalable=no|maximum-scale=1/);
    });
  });

  test.describe("Tapping the canvas still jumps on a touch viewport", () => {
    test.use({ viewport: { width: 375, height: 667 }, hasTouch: true });

    test("Tapping the canvas still jumps on a touch viewport", async ({ page }) => {
      await openGame(page, oneBox);
      const box = await canvasBox(page);
      await page.locator("#game_div canvas").tap({ position: { x: box.width / 2, y: box.height / 2 } });
      await settle(page);
      const samples = await advance(page, 100);
      expect(heightOf(samples[0] as Sample)).toBeGreaterThan(0);
      expect(await page.evaluate(() => window.scrollY)).toBe(0);
    });
  });
});

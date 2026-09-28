import { expect, test } from "@playwright/test";
import { advance, first, heightOf, oneBox, openGame, settle, startRun } from "./probe.ts";

const canvasBox = async (page: import("@playwright/test").Page) => {
  const box = await page.locator("#game_div canvas").boundingBox();
  if (!box) throw new Error("canvas has no bounding box");
  return box;
};

// The fit runs after the page loads and again on every resize, so a size read
// the instant a page or viewport changes can catch it mid-layout (seen in CI:
// a portrait baseline of 308px against a settled 332px). A measurement a test
// compares against is taken only once three reads 100ms apart agree.
const settledCanvasBox = async (page: import("@playwright/test").Page) => {
  let last = await canvasBox(page);
  let steady = 0;
  for (let i = 0; i < 150 && steady < 2; i++) {
    await page.waitForTimeout(100);
    const next = await canvasBox(page);
    steady = next.width === last.width && next.height === last.height ? steady + 1 : 0;
    last = next;
  }
  return last;
};

// Resizes are handled asynchronously; under load the default 5s poll is too short.
const poll = { timeout: 15_000 };

test.describe("Rule: The canvas scales to fit the viewport", () => {
  test.describe("A phone-width viewport shows the whole game with no scrollbar", () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test("A phone-width viewport shows the whole game with no scrollbar", async ({ page }) => {
      await page.goto("./");
      const box = await settledCanvasBox(page);
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
      const box = await settledCanvasBox(page);
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
      const box = await settledCanvasBox(page);
      expect(box).toMatchObject({ width: 400, height: 490 });
      const centre = box.x + box.width / 2;
      expect(Math.abs(centre - 1024 / 2)).toBeLessThanOrEqual(1);
    });
  });

  test.describe("The canvas recovers its full size after a resize away from a cramped viewport", () => {
    test.use({ viewport: { width: 667, height: 375 } });

    test("The canvas recovers its full size after a resize away from a cramped viewport", async ({ page }) => {
      await page.goto("./");
      const cramped = await settledCanvasBox(page);
      expect(cramped.width).toBeLessThan(400);
      await page.setViewportSize({ width: 1024, height: 768 });
      await expect.poll(async () => (await canvasBox(page)).width, poll).toBe(400);
      const recovered = await settledCanvasBox(page);
      expect(recovered).toMatchObject({ width: 400, height: 490 });
    });
  });

  test.describe("The canvas tracks repeated rotation and resize without getting stuck", () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test("The canvas tracks repeated rotation and resize without getting stuck", async ({ page }) => {
      await page.goto("./");
      const portrait = await settledCanvasBox(page);
      expect(portrait.width).toBeGreaterThan(300);

      await page.setViewportSize({ width: 667, height: 375 });
      await expect.poll(async () => (await canvasBox(page)).width, poll).toBeLessThan(300);

      await page.setViewportSize({ width: 375, height: 667 });
      await expect
        .poll(async () => (await canvasBox(page)).width, poll)
        .toBeCloseTo(portrait.width, 0);

      await page.setViewportSize({ width: 1024, height: 768 });
      await expect.poll(async () => (await canvasBox(page)).width, poll).toBe(400);
      const desktop = await settledCanvasBox(page);
      expect(desktop).toMatchObject({ width: 400, height: 490 });
    });
  });
});

test.describe("Rule: Touch input on the game does not move the page", () => {
  test.describe("The canvas opts out of the browser's default touch scrolling and zooming", () => {
    test.use({ viewport: { width: 375, height: 667 }, hasTouch: true });

    test("The canvas opts out of the browser's default touch scrolling and zooming", async ({ page }) => {
      await page.goto("./");
      const touchAction = await page.evaluate(() => {
        const canvas = document.querySelector("#game_div canvas");
        if (!canvas) throw new Error("canvas not found");
        return getComputedStyle(canvas).touchAction;
      });
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
      await startRun(page);
      const box = await settledCanvasBox(page);
      await page.locator("#game_div canvas").tap({ position: { x: box.width / 2, y: box.height / 2 } });
      await settle(page);
      const samples = await advance(page, 100);
      expect(heightOf(first(samples))).toBeGreaterThan(0);
      expect(await page.evaluate(() => window.scrollY)).toBe(0);
    });
  });
});

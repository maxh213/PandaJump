import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { advance, oneBox, openGame, sample, settle, startRun } from "./probe.ts";

const targets: Record<string, (page: Page) => Promise<void>> = {
  "page heading": (page) => page.locator("h1").dblclick(),
  "Controls paragraph": (page) => page.locator("p", { hasText: "Controls:" }).dblclick(),
};

const selection = (page: Page) => page.evaluate(() => window.getSelection()?.toString());

test.describe("Rule: Double-clicking page text selects nothing and still double jumps", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 1400 });
  });

  for (const [target, doubleClick] of Object.entries(targets)) {
    test(`Double-clicking the ${target} selects no text`, async ({ page }) => {
      await openGame(page, oneBox);
      await startRun(page);
      await doubleClick(page);
      await settle(page);
      expect(await selection(page)).toBe("");
      const samples = await advance(page, 16);
      expect(samples.some((entry) => entry.viewAirPuff !== null)).toBe(true);
    });
  }
});

test.describe("Rule: The page allows scrolling and taps but not double-tap zoom", () => {
  test("Touch actions and text selection are set on the page", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    const canvas = await page.locator("#game_div canvas").evaluate((element) => getComputedStyle(element).touchAction);
    const styles = await page.evaluate(() => ({
      html: getComputedStyle(document.documentElement).touchAction,
      body: getComputedStyle(document.body).touchAction,
      userSelect: getComputedStyle(document.body).userSelect,
    }));
    expect(styles).toEqual({ html: "manipulation", body: "manipulation", userSelect: "none" });
    expect(canvas).toBe("none");
  });
});

test.describe("Rule: A link is still a link", () => {
  test("Clicking the GitHub link does not jump", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    await page.evaluate(() => {
      document.querySelector("a")?.addEventListener("click", (event) => {
        event.preventDefault();
      });
    });
    await page.locator("a", { hasText: "Github" }).click();
    await settle(page);
    expect((await sample(page)).panda.bottom).toBe(426);
  });

  test("Clicking the GitHub link still follows the link", async ({ page }) => {
    await page.route("https://github.com/**", (route) => route.fulfill({ body: "github", contentType: "text/html" }));
    await openGame(page, oneBox);
    await page.locator("a", { hasText: "Github" }).click();
    await page.waitForURL("https://github.com/maxh213/PandaJump");
  });
});

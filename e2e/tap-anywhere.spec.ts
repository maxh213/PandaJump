import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { advance, advanceTo, oneBox, openGame, press, sample, settle, standardRandom, startRun, untilGameOver } from "./probe.ts";

const targets: Record<string, (page: Page) => Promise<void>> = {
  "page heading": (page) => page.locator("h1").click(),
  "Controls paragraph": (page) => page.locator("p", { hasText: "Controls:" }).click(),
  "black area beside the canvas": (page) => page.mouse.click(2, 300),
  "black area below the canvas": async (page) => {
    const viewport = page.viewportSize();
    await page.mouse.click(10, (viewport?.height ?? 720) - 2);
  },
};

const clickCanvas = (page: Page) => page.locator("#game_div canvas").click({ position: { x: 200, y: 200 } });

test.describe("Rule: A click outside the canvas does what a click on the canvas does", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 1400 });
  });

  for (const [target, click] of Object.entries(targets)) {
    test(`Clicking the ${target} makes a standing panda jump`, async ({ page }) => {
      await openGame(page, oneBox);
      await startRun(page);
      await click(page);
      await settle(page);
      const samples = await advance(page, 100);
      expect(samples.at(-1)?.panda.bottom).toBeLessThan(426);
    });
  }

  const secondJumpAdds = async (page: Page) => {
    await advance(page, 100);
    const before = await sample(page);
    await page.keyboard.press("Space");
    await settle(page);
    const after = await advance(page, 16);
    expect(after[0]?.panda.bottom).toBeLessThan(before.panda.bottom - 1);
  };

  test("One click on the canvas is exactly one jump", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    await clickCanvas(page);
    await settle(page);
    await secondJumpAdds(page);
  });

  test("One click outside the canvas is exactly one jump", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    await page.locator("h1").click();
    await settle(page);
    await secondJumpAdds(page);
  });

  test("Clicking outside the canvas during a pause starts the countdown", async ({ page }) => {
    await openGame(page, standardRandom());
    await startRun(page);
    await advanceTo(page, 1000);
    await press(page, "p");
    await page.locator("h1").click();
    await settle(page);
    const resumed = await sample(page);
    expect(resumed.pauseTitle.visible).toBe(false);
    expect(resumed.pausePrompt.visible).toBe(false);
    expect(resumed.panda.bottom).toBe(426);
    expect(resumed.countdownText).toMatchObject({ text: "3", x: 200, y: 190, color: "#ffffff", fontSize: "40px", visible: true });
  });

  test("Clicking outside the canvas restarts the run only after the game-over freeze", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    await untilGameOver(page);
    await page.locator("h1").click();
    await settle(page);
    expect((await sample(page)).restarts).toBe(0);
    await advance(page, 500);
    await page.locator("h1").click();
    await settle(page);
    expect((await sample(page)).restarts).toBe(1);
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
    const samples = await advance(page, 100);
    expect(samples.at(-1)?.panda.bottom).toBe(426);
  });

  test("Clicking the GitHub link still follows the link", async ({ page }) => {
    await page.route("https://github.com/**", (route) => route.fulfill({ body: "github", contentType: "text/html" }));
    await openGame(page, oneBox);
    await page.locator("a", { hasText: "Github" }).click();
    await page.waitForURL("https://github.com/maxh213/PandaJump");
  });
});

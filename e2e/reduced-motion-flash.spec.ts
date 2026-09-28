import { expect, test } from "@playwright/test";
import { advance, oneBox, openGame, untilGameOver } from "./probe.ts";

const HIT_TINT = 0xff6666;

test.describe("Rule: With reduced motion the flash stays invisible for the whole game-over screen", () => {
  test("The flash never shows at the instant of death or at any later step", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openGame(page, oneBox);
    const { after } = await untilGameOver(page);
    expect(after.gameOver).toBe(true);
    expect(after.deathFlash.alpha).toBe(0);
    const later = await advance(page, 1000);
    expect(later.length).toBeGreaterThan(0);
    expect(later.map((entry) => entry.deathFlash.alpha).every((alpha) => alpha === 0)).toBe(true);
  });
});

test.describe("Rule: Everything else about death is unchanged with reduced motion", () => {
  test("The hit column is still tinted, the panda still tumbles and the game-over texts still appear", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openGame(page, oneBox);
    const { after } = await untilGameOver(page);
    expect(after.viewDeathFlash).toBeGreaterThan(0);
    expect(after.boxes.length).toBeGreaterThan(0);
    expect(after.boxes.every((box) => box.tint === HIT_TINT)).toBe(true);
    expect(after.panda.flipY).toBe(true);
    expect(after.gameOverTitle.text).toBe("Game over");
    expect(after.gameOverTitle.visible).toBe(true);
  });
});

test.describe("Rule: Without the preference the flash is exactly as before", () => {
  test("The flash still snaps to 0.6 at death when no reduced motion is asked for", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await openGame(page, oneBox);
    const { after } = await untilGameOver(page);
    expect(after.deathFlash.alpha).toBeCloseTo(0.6, 1);
  });
});

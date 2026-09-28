import { expect, test } from "@playwright/test";
import { advanceTo, oneBox, openGame, press, sample, startRun, untilGameOver } from "./probe.ts";

test.describe("Rule: The panda's angle tracks its vertical speed while the run is alive", () => {
  test("The panda stays level while it runs along the floor", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    await advanceTo(page, 500);
    expect((await sample(page)).panda.angle).toBe(0);
  });

  test("A floor jump tilts the nose up immediately", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    await press(page, "Space");
    expect((await sample(page)).panda.angle).toBe(-25);
  });

  test("The panda passes back through level at the top of its jump", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    await press(page, "Space");
    await advanceTo(page, 580);
    expect((await sample(page)).panda.angle).toBeCloseTo(0);
  });

  test("The panda tilts its nose down as it falls, clamped in a long fall", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    await press(page, "Space");
    await advanceTo(page, 900);
    const falling = (await sample(page)).panda.angle;
    expect(falling).toBeGreaterThan(0);
    expect(falling).toBeLessThanOrEqual(25);
    await advanceTo(page, 1100);
    expect((await sample(page)).panda.angle).toBe(25);
  });

  test("Landing levels the panda back out", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    await press(page, "Space");
    await advanceTo(page, 1200);
    expect((await sample(page)).panda.angle).toBe(0);
  });
});

test.describe("Rule: Death replaces the tilt with the existing upside-down flip", () => {
  test("The panda's angle resets to 0 the moment it dies, mid-fall", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    const { after: diedAt } = await untilGameOver(page);
    expect(diedAt.panda.flipY).toBe(true);
    expect(diedAt.panda.angle).toBe(0);
  });
});

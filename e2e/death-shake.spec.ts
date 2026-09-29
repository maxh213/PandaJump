import { expect, test } from "@playwright/test";
import type { Sample } from "./probe.ts";
import { advance, oneBox, openGame, sample, settle, startRun, untilGameOver } from "./probe.ts";

const isStill = (entry: Sample): boolean => entry.cameraScroll.x === 0 && entry.cameraScroll.y === 0;

test.describe("Rule: The view is still while the run is live", () => {
  test("The camera does not move during ordinary play", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    expect(isStill(await sample(page))).toBe(true);
    const steps = await advance(page, 1000);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps.every(isStill)).toBe(true);
  });
});

test.describe("Rule: The view shakes for 200ms after the hit, within 6px, and then stays still", () => {
  test("Running into a column shakes the camera and never by more than 6 px", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    const { after } = await untilGameOver(page);
    expect(after.gameOver).toBe(true);
    expect(Math.abs(after.time - 2875)).toBeLessThanOrEqual(16);
    expect(isStill(after)).toBe(false);
    const during = await advance(page, 176);
    const shaken = [after, ...during].filter((entry) => !isStill(entry));
    expect(shaken.length).toBeGreaterThan(1);
    [after, ...during].forEach((entry) => {
      expect(Math.abs(entry.cameraScroll.x)).toBeLessThanOrEqual(6);
      expect(Math.abs(entry.cameraScroll.y)).toBeLessThanOrEqual(6);
      expect(entry.cameraScroll).toEqual(entry.viewDeathShake);
    });
  });

  test("The camera is exactly still from 200ms after death on", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    await untilGameOver(page);
    await advance(page, 184);
    const at200 = (await advance(page, 16)).at(-1);
    expect(at200 && isStill(at200)).toBe(true);
    const later = await advance(page, 800);
    expect(later.length).toBeGreaterThan(0);
    expect(later.every(isStill)).toBe(true);
  });
});

test.describe("Rule: The shake is the same every time and ends with the restart", () => {
  test("Two runs with the same random values and steps give the same offsets", async ({ page }) => {
    const offsetsOfARun = async () => {
      await openGame(page, oneBox);
      await startRun(page);
      const { after } = await untilGameOver(page);
      const during = await advance(page, 208);
      return [after, ...during].map((entry) => entry.cameraScroll);
    };
    const firstRun = await offsetsOfARun();
    const secondRun = await offsetsOfARun();
    expect(firstRun.length).toBeGreaterThan(1);
    expect(secondRun).toEqual(firstRun);
  });

  test("Restarting leaves the camera still", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    await untilGameOver(page);
    await advance(page, 500);
    await page.locator("#game_div canvas").click({ position: { x: 200, y: 200 } });
    await settle(page);
    const afterRestart = await sample(page);
    expect(afterRestart.restarts).toBe(1);
    expect(afterRestart.gameOver).toBe(false);
    expect(isStill(afterRestart)).toBe(true);
  });
});

test.describe("Rule: With reduced motion the view never shakes", () => {
  test("The camera stays still through the whole hit and game over", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openGame(page, oneBox);
    await startRun(page);
    const { after } = await untilGameOver(page);
    expect(after.gameOver).toBe(true);
    expect(after.viewDeathShake).not.toEqual({ x: 0, y: 0 });
    const later = await advance(page, 1000);
    expect(later.length).toBeGreaterThan(0);
    expect([after, ...later].every(isStill)).toBe(true);
  });
});

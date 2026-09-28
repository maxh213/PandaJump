import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { advance, advanceTo, oneBox, openGame, pressSpace, startRun, untilGameOver, untilRestart } from "./probe.ts";

declare global {
  interface Window {
    vibrateCalls: number[];
  }
}

const stubVibrate = (page: Page) =>
  page.addInitScript(() => {
    window.vibrateCalls = [];
    Object.defineProperty(navigator, "vibrate", {
      configurable: true,
      writable: true,
      value: (pattern: number) => {
        window.vibrateCalls.push(pattern);
        return true;
      },
    });
  });

const removeVibrate = (page: Page) =>
  page.addInitScript(() => {
    Object.defineProperty(navigator, "vibrate", { configurable: true, writable: true, value: undefined });
  });

const vibrateCalls = (page: Page): Promise<number[]> => page.evaluate(() => window.vibrateCalls);

test.describe("Rule: A supporting device vibrates exactly once, on the frame the panda dies", () => {
  test("The device vibrates once the moment the panda touches a column", async ({ page }) => {
    await stubVibrate(page);
    await openGame(page, oneBox);
    await startRun(page);
    const { after } = await untilGameOver(page);
    expect(after.gameOver).toBe(true);
    expect(await vibrateCalls(page)).toEqual([100]);
  });

  test("navigator.vibrate is not called again while the game over screen stays up", async ({ page }) => {
    await stubVibrate(page);
    await openGame(page, oneBox);
    await startRun(page);
    await untilGameOver(page);
    await advance(page, 3000);
    expect(await vibrateCalls(page)).toEqual([100]);
  });

  test("A run that never dies never vibrates", async ({ page }) => {
    await stubVibrate(page);
    await openGame(page, oneBox);
    await startRun(page);
    await advanceTo(page, 2700);
    await pressSpace(page);
    await advanceTo(page, 3340);
    expect(await vibrateCalls(page)).toEqual([]);
  });

  test("Restarting and dying again vibrates once more, for the new death", async ({ page }) => {
    await stubVibrate(page);
    await openGame(page, oneBox);
    await startRun(page);
    await untilRestart(page);
    expect(await vibrateCalls(page)).toEqual([100]);
    const { after } = await untilGameOver(page);
    expect(after.gameOver).toBe(true);
    expect(await vibrateCalls(page)).toEqual([100, 100]);
  });
});

test.describe("Rule: A device without the Vibration API is unaffected", () => {
  test("Dying normally on a device where navigator.vibrate is undefined", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await removeVibrate(page);
    await openGame(page, oneBox);
    await startRun(page);
    const { after } = await untilGameOver(page);
    expect(after.gameOver).toBe(true);
    expect(errors).toEqual([]);
  });
});

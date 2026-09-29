import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { advance, oneBox, openGame, sample, settle, startRun, untilGameOver } from "./probe.ts";

interface CapturedShare {
  text?: string;
  url?: string;
}

declare global {
  interface Window {
    __reportDeathFlashShare: (data: CapturedShare) => void;
  }
}

const mockSupportedShare = async (page: Page): Promise<CapturedShare[]> => {
  const calls: CapturedShare[] = [];
  await page.exposeFunction("__reportDeathFlashShare", (data: CapturedShare) => {
    calls.push(data);
  });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: (data: CapturedShare) => {
        window.__reportDeathFlashShare(data);
        return Promise.resolve();
      },
    });
  });
  return calls;
};

test.describe("Rule: The flash is invisible while the run is live", () => {
  test("The flash stays fully transparent during ordinary play", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    const last = (await advance(page, 1000)).at(-1);
    expect(last?.deathFlash.alpha).toBe(0);
    expect(last?.viewDeathFlash).toBe(0);
  });
});

test.describe("Rule: The flash jumps to its peak opacity the instant the panda dies", () => {
  test("Running into a column snaps the flash to 0.6 the moment gameOver first becomes true", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    const { after } = await untilGameOver(page);
    expect(after.gameOver).toBe(true);
    expect(Math.abs(after.time - 2890)).toBeLessThanOrEqual(16);
    expect(after.deathFlash.alpha).toBeCloseTo(0.6, 1);
    expect(after.viewDeathFlash).toBeCloseTo(0.6, 1);
  });
});

test.describe("Rule: The flash fades out in a straight line over 200ms and then stays gone", () => {
  test("The flash is half faded at 100ms after death and fully gone by 200ms and 1000ms", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    await untilGameOver(page);
    const at100 = (await advance(page, 100)).at(-1);
    expect(at100?.deathFlash.alpha).toBeCloseTo(0.3, 1);
    const at200 = (await advance(page, 100)).at(-1);
    expect(at200?.deathFlash.alpha).toBe(0);
    const at1000 = (await advance(page, 800)).at(-1);
    expect(at1000?.deathFlash.alpha).toBe(0);
  });
});

test.describe("Rule: The flash covers the whole canvas, is white, and never gets in the way of the game-over screen", () => {
  test("The flash is a full-canvas white rectangle layered above the action and below the game-over texts", async ({
    page,
  }) => {
    await openGame(page, oneBox);
    await startRun(page);
    const { after } = await untilGameOver(page);
    expect(after.boxes.length).toBeGreaterThan(0);
    expect(after.deathFlash).toMatchObject({ x: 0, y: 0, width: 400, height: 490, color: "#ffffff" });
    expect(after.deathFlash.depth).toBeGreaterThan(after.panda.depth);
    after.boxes.forEach((box) => {
      expect(after.deathFlash.depth).toBeGreaterThan(box.depth);
    });
    expect(after.deathFlash.depth).toBeLessThan(after.gameOverTitle.depth);
  });
});

test.describe("Rule: Restart and Share score keep working exactly as before, and the flash resets on restart", () => {
  test("Restart and Share score still work exactly as before, and the flash resets to 0 in the new run", async ({
    page,
  }) => {
    const calls = await mockSupportedShare(page);
    await openGame(page, oneBox);
    await startRun(page);
    await untilGameOver(page);
    await advance(page, 500);
    await page.locator("#game_div canvas").click({ position: { x: 200, y: 200 } });
    await settle(page);
    const afterRestart = await sample(page);
    expect(afterRestart.restarts).toBe(1);
    expect(afterRestart.gameOver).toBe(false);
    expect(afterRestart.deathFlash.alpha).toBe(0);
    expect(afterRestart.viewDeathFlash).toBe(0);

    await untilGameOver(page);
    await advance(page, 500);
    const { gameOverShare } = await sample(page);
    await page.locator("#game_div canvas").click({ position: { x: gameOverShare.x, y: gameOverShare.y } });
    await settle(page);
    expect(calls).toHaveLength(1);
    const afterShare = await sample(page);
    expect(afterShare.restarts).toBe(1);
    expect(afterShare.gameOver).toBe(true);
  });
});

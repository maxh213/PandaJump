import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { advance, columnsAt, heightOf, last, oneBox, openGame, play, pressSpace, sample, settle, untilGameOver } from "./probe.ts";
import type { Sample } from "./probe.ts";

const peakOf = (samples: Sample[]) => samples.reduce((best, entry) => (heightOf(entry) > heightOf(best) ? entry : best));

test.describe("Rule: A fresh page load waits on a ready screen and nothing moves", () => {
  test("The ready prompt is shown and no game-over text is visible", async ({ page }) => {
    await openGame(page, [0]);
    const start = await sample(page);
    expect(start.readyPrompt).toMatchObject({
      text: "Tap or press Space to start",
      x: 200,
      y: 320,
      color: "#ffffff",
      fontSize: "20px",
      visible: true,
    });
    expect(start.readyPrompt.originX).toBeCloseTo(0.5);
    expect(start.readyPrompt.originY).toBeCloseTo(0.5);
    expect(start.gameOverTitle.visible).toBe(false);
    expect(start.gameOverScore.visible).toBe(false);
    expect(start.gameOverBest.visible).toBe(false);
    expect(start.gameOverPrompt.visible).toBe(false);
    expect(start.gameOverRuns.visible).toBe(false);
  });

  test("With no input, the clock, score, boxes, panda and clouds all stay put", async ({ page }) => {
    await openGame(page, [0]);
    const before = await sample(page);
    const after = last(await advance(page, 5000));
    expect(after.time).toBe(0);
    expect(after.ready).toBe(true);
    expect(after.score.text).toBe("0");
    expect(after.boxes).toEqual([]);
    expect(after.gameOver).toBe(false);
    expect(after.panda.bottom).toBe(426);
    expect(after.viewClouds).toEqual(before.viewClouds);
    expect(after.rock.scroll).toBe(before.rock.scroll);
    expect(after.grass.scroll).toBe(before.grass.scroll);
  });
});

test.describe("Rule: The player's first input starts the run without jumping", () => {
  const controls: Record<string, (page: Page) => Promise<void>> = {
    "click the canvas": (page) => page.locator("#game_div canvas").click({ position: { x: 200, y: 200 } }),
    "tap the canvas": (page) => page.locator("#game_div canvas").tap({ position: { x: 200, y: 200 } }),
    "press Space": (page) => page.keyboard.press("Space"),
  };

  for (const [action, act] of Object.entries(controls)) {
    test.describe(action, () => {
      test.use({ hasTouch: action === "tap the canvas" });

      test(`Each control starts the run on the first press, without a jump: ${action}`, async ({ page }) => {
        await openGame(page, oneBox);
        await act(page);
        await settle(page);
        const justStarted = await sample(page);
        expect(justStarted.ready).toBe(false);
        expect(justStarted.readyPrompt.visible).toBe(false);
        expect(justStarted.panda.bottom).toBe(426);
        const after = last(await advance(page, 1500));
        expect(columnsAt(after).map((column) => column.x)).toEqual([400]);
      });
    });
  }

  test("Every press after the first works as a normal jump, including a double jump", async ({ page }) => {
    await openGame(page, oneBox);
    await pressSpace(page);
    await pressSpace(page);
    const first = await advance(page, 100);
    expect(heightOf(last(first))).toBeGreaterThan(0);
    const samples = await play(page, [580], 1300);
    expect(Math.abs(heightOf(peakOf(samples)) - 199)).toBeLessThanOrEqual(3);
  });
});

test.describe("Rule: Restarting after death stays instant and skips the ready screen", () => {
  test("Restarting from the game-over screen does not show the ready prompt again", async ({ page }) => {
    await openGame(page, oneBox);
    await pressSpace(page);
    await untilGameOver(page);
    await advance(page, 500);
    await pressSpace(page);
    await settle(page);
    const after = await sample(page);
    expect(after.ready).toBe(false);
    expect(after.readyPrompt.visible).toBe(false);
    expect(after.gameOver).toBe(false);
    const later = last(await advance(page, 1500));
    expect(columnsAt(later).map((column) => column.x)).toEqual([400]);
  });
});

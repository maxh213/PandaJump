import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { advanceAlive, oneBox, openGame, playToScore, sample, startRun, untilRestart } from "./probe.ts";
import type { Sample } from "./probe.ts";

const EXTRA_COLUMNS = 3;
const STARS = 12;

const rampedRandom = (column: number, box = oneBox): number[] =>
  Array.from({ length: column + EXTRA_COLUMNS }, () => box).flat();

const playThroughColumn = async (page: Page, column: number, box = oneBox): Promise<void> => {
  await openGame(page, rampedRandom(column, box));
  await startRun(page);
  await playToScore(page, column);
};

const positions = (state: Sample): string[] => state.stars.map((star) => `${String(star.x)},${String(star.y)}`).sort();

test.describe("Rule: Stars fade in over 3000 ms once the score reaches 60", () => {
  test("No star is visible at a score of 59", async ({ page }) => {
    test.setTimeout(240_000);
    await playThroughColumn(page, 59);
    const state = await sample(page);
    expect(state.score.text).toBe("59");
    expect(state.stars).toEqual([]);
  });

  test("Stars fade from absent to fully opaque over 3000 ms at score 60", async ({ page }) => {
    test.setTimeout(240_000);
    await playThroughColumn(page, 60);
    const start = await sample(page);
    expect(start.score.text).toBe("60");
    expect(start.stars).toEqual([]);
    await advanceAlive(page, 1500);
    const mid = await sample(page);
    expect(mid.stars).toHaveLength(STARS);
    mid.stars.forEach((star) => {
      expect(star.y).toBeLessThan(200);
      expect(star.radius).toBe(2);
      expect(star.color).toBe(0xffffff);
      expect(star.alpha).toBeCloseTo(0.5, 5);
    });
    await advanceAlive(page, 1500);
    const end = await sample(page);
    expect(end.stars).toHaveLength(STARS);
    end.stars.forEach((star) => {
      expect(star.alpha).toBe(1);
    });
  });
});

test.describe("Rule: The stars are the same on every run and every page load", () => {
  test("Different random values give the same star positions", async ({ page }) => {
    test.setTimeout(240_000);
    await playThroughColumn(page, 60);
    await advanceAlive(page, 3000);
    const first = positions(await sample(page));
    await playThroughColumn(page, 60, [0.25, 0.5, 0.9]);
    await advanceAlive(page, 3000);
    const second = positions(await sample(page));
    expect(first).toHaveLength(STARS);
    expect(second).toEqual(first);
  });
});

test.describe("Rule: The stars stay on the game-over screen and go away on restart", () => {
  test("Stars stay visible after a death at a score of 60 or more", async ({ page }) => {
    test.setTimeout(240_000);
    await playThroughColumn(page, 60);
    await advanceAlive(page, 3000);
    const restart = await untilRestart(page);
    expect(restart.diedAt.gameOver).toBe(true);
    expect(restart.diedAt.stars).toHaveLength(STARS);
  });

  test("No star is visible after restarting", async ({ page }) => {
    test.setTimeout(240_000);
    await playThroughColumn(page, 60);
    await advanceAlive(page, 3000);
    const restart = await untilRestart(page);
    expect(restart.after.score.text).toBe("0");
    expect(restart.after.stars).toEqual([]);
  });
});

test.describe("Rule: Stars draw behind everything else", () => {
  test("Every star has a lower depth than the clouds, box columns and panda", async ({ page }) => {
    test.setTimeout(240_000);
    await playThroughColumn(page, 60);
    await advanceAlive(page, 3000);
    const state = await sample(page);
    expect(state.clouds.length).toBeGreaterThan(0);
    expect(state.boxes.length).toBeGreaterThan(0);
    state.stars.forEach((star) => {
      state.clouds.forEach((cloud) => {
        expect(star.depth).toBeLessThan(cloud.depth);
      });
      state.boxes.forEach((box) => {
        expect(star.depth).toBeLessThan(box.depth);
      });
      expect(star.depth).toBeLessThan(state.panda.depth);
    });
  });
});

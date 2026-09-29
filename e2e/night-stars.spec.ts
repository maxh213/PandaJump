import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { columnClearTime, oneBox, openGame, play, sample, spawnTimeOf, untilRestart } from "./probe.ts";
import type { Sample } from "./probe.ts";

const EXTRA_COLUMNS = 3;
const JUMP_OFFSET = 788;
const CLEAR_BUFFER = 20;
const STARS = 12;

const rampedRandom = (column: number, box = oneBox): number[] =>
  Array.from({ length: column + EXTRA_COLUMNS }, () => box).flat();

const jumpTimesFor = (from: number, to: number): number[] =>
  Array.from({ length: to - from + 1 }, (_, index) => spawnTimeOf(from + index) + JUMP_OFFSET);

const scoreReadAt = (column: number): number => columnClearTime(column) + CLEAR_BUFFER;

const playThroughColumn = async (page: Page, column: number, box = oneBox): Promise<void> => {
  await openGame(page, rampedRandom(column, box));
  await play(page, jumpTimesFor(1, column), scoreReadAt(column));
};

const positions = (state: Sample): string[] => state.stars.map((star) => `${String(star.x)},${String(star.y)}`).sort();

test.describe("Rule: Stars appear the instant the score reaches 40", () => {
  test("No star is visible at a score of 39", async ({ page }) => {
    test.setTimeout(120_000);
    await playThroughColumn(page, 39);
    const state = await sample(page);
    expect(state.score.text).toBe("39");
    expect(state.stars).toEqual([]);
  });

  test("Exactly 12 stars are visible at a score of 40, all high in the sky", async ({ page }) => {
    test.setTimeout(120_000);
    await playThroughColumn(page, 40);
    const state = await sample(page);
    expect(state.score.text).toBe("40");
    expect(state.stars).toHaveLength(STARS);
    state.stars.forEach((star) => {
      expect(star.y).toBeLessThan(200);
      expect(star.radius).toBe(2);
      expect(star.color).toBe(0xffffff);
    });
  });
});

test.describe("Rule: The stars are the same on every run and every page load", () => {
  test("Different random values give the same star positions", async ({ page }) => {
    test.setTimeout(120_000);
    await playThroughColumn(page, 40);
    const first = positions(await sample(page));
    await playThroughColumn(page, 40, [0.25, 0.5, 0.9]);
    const second = positions(await sample(page));
    expect(first).toHaveLength(STARS);
    expect(second).toEqual(first);
  });
});

test.describe("Rule: The stars stay on the game-over screen and go away on restart", () => {
  test("Stars stay visible after a death at a score of 40 or more", async ({ page }) => {
    test.setTimeout(120_000);
    await playThroughColumn(page, 40);
    const restart = await untilRestart(page);
    expect(restart.diedAt.gameOver).toBe(true);
    expect(restart.diedAt.stars).toHaveLength(STARS);
  });

  test("No star is visible after restarting", async ({ page }) => {
    test.setTimeout(120_000);
    await playThroughColumn(page, 40);
    const restart = await untilRestart(page);
    expect(restart.after.score.text).toBe("0");
    expect(restart.after.stars).toEqual([]);
  });
});

test.describe("Rule: Stars draw behind everything else", () => {
  test("Every star has a lower depth than the clouds, box columns and panda", async ({ page }) => {
    test.setTimeout(120_000);
    await playThroughColumn(page, 40);
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

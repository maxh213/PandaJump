import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { advance, advanceTo, columnClearTime, oneBox, openGame, play, press, pressSpace, sample, spawnTimeOf, startRun, untilGameOver, untilRestart } from "./probe.ts";
import type { Sample } from "./probe.ts";

const EXTRA_COLUMNS = 3;
const JUMP_OFFSET = 788;
const CLEAR_BUFFER = 20;
const HILLS_REPEAT = 160;
const FLOOR_REPEAT = 64;
const DAY = "#4a9ba6";
const SUNSET = "#c97b3a";
const NIGHT = "#1a1b2b";

const rampedRandom = (column: number): number[] => Array.from({ length: column + EXTRA_COLUMNS }, () => oneBox).flat();

const jumpTimesFor = (from: number, to: number): number[] =>
  Array.from({ length: to - from + 1 }, (_, index) => spawnTimeOf(from + index) + JUMP_OFFSET);

const playThroughColumn = async (page: Page, column: number): Promise<void> => {
  await openGame(page, rampedRandom(column));
  await startRun(page);
  await play(page, jumpTimesFor(1, column), columnClearTime(column) + CLEAR_BUFFER);
};

const wrapped = (delta: number, repeat: number): number => ((delta % repeat) + repeat) % repeat;

const expectQuarterSpeed = (steps: Sample[], start: Sample): void => {
  let previous = start;
  steps.forEach((step) => {
    const floorMoved = wrapped(step.floorScroll - previous.floorScroll, FLOOR_REPEAT);
    const hillsMoved = wrapped(step.viewHills.scroll - previous.viewHills.scroll, HILLS_REPEAT);
    expect(Math.abs(hillsMoved - floorMoved / 4)).toBeLessThanOrEqual(1);
    expect(Math.abs(wrapped(step.hills.scroll - previous.hills.scroll, HILLS_REPEAT) - floorMoved / 4)).toBeLessThanOrEqual(1);
    previous = step;
  });
};

const hillsOf = (state: Sample) => ({ view: state.viewHills, drawn: state.hills });

test.describe("Rule: The hills sit in front of the sky and behind everything else", () => {
  test("The hills are visible at the start of a run, in front of clouds and stars and behind boxes, panda and shadow", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    await advanceTo(page, 1600);
    const state = await sample(page);
    expect(state.hills.visible).toBe(true);
    expect(state.clouds.length).toBeGreaterThan(0);
    state.clouds.forEach((cloud) => {
      expect(state.hills.depth).toBeGreaterThan(cloud.depth);
    });
    expect(state.boxes.length).toBeGreaterThan(0);
    state.boxes.forEach((box) => {
      expect(state.hills.depth).toBeLessThan(box.depth);
    });
    expect(state.hills.depth).toBeLessThan(state.panda.depth);
    expect(state.hills.depth).toBeLessThan(state.pandaShadow.depth);
  });

  test("The hills are drawn in front of the stars at night", async ({ page }) => {
    test.setTimeout(120_000);
    await playThroughColumn(page, 40);
    const state = await sample(page);
    expect(state.stars.length).toBeGreaterThan(0);
    state.stars.forEach((star) => {
      expect(state.hills.depth).toBeGreaterThan(star.depth);
    });
  });

  test("No part of the hills is drawn above y 300", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    const { hills } = await sample(page);
    expect(hills.y).toBeGreaterThanOrEqual(300);
    expect(hills.y + hills.height).toBe(392);
  });
});

test.describe("Rule: The hills scroll at a quarter of the floor's speed", () => {
  test("Below a score of 20 the hills move a quarter as far as the floor", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    const start = await sample(page);
    expectQuarterSpeed(await advance(page, 1000), start);
    expect((await sample(page)).viewHills.scroll).toBeCloseTo(50);
  });

  test("After the first speed-up at score 20 the hills still move a quarter as far as the floor", async ({ page }) => {
    test.setTimeout(60_000);
    await playThroughColumn(page, 20);
    const start = await sample(page);
    expect(start.score.text).toBe("20");
    expectQuarterSpeed(await advance(page, 300), start);
  });
});

test.describe("Rule: The hills stand still whenever game time stands still", () => {
  test("A paused run does not move the hills", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    await advanceTo(page, 1000);
    await press(page, "p");
    const frozen = await sample(page);
    await advance(page, 2000);
    expect(hillsOf(await sample(page))).toEqual(hillsOf(frozen));
  });

  test("The countdown's frozen time does not move the hills", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    await advanceTo(page, 1000);
    await press(page, "p");
    const frozen = await sample(page);
    await pressSpace(page);
    expect((await sample(page)).countdownText.visible).toBe(true);
    await advance(page, 400);
    const counting = await sample(page);
    expect(counting.countdownText.visible).toBe(true);
    expect(hillsOf(counting)).toEqual(hillsOf(frozen));
  });

  test("The game-over screen does not move the hills", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    const { after } = await untilGameOver(page);
    await advance(page, 1000);
    const later = await sample(page);
    expect(later.gameOver).toBe(true);
    expect(hillsOf(later)).toEqual(hillsOf(after));
  });
});

test.describe("Rule: The hill colour follows the sky", () => {
  test("The hills are the day colour at the start of a run", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    const state = await sample(page);
    expect(state.viewHills.color).toBe(DAY);
    expect(state.hills.key).toBe(`hills-${DAY}`);
  });

  test("The hills turn sunset-coloured at score 20", async ({ page }) => {
    test.setTimeout(60_000);
    await playThroughColumn(page, 20);
    const state = await sample(page);
    expect(state.sky).toBe("#f4a261");
    expect(state.viewHills.color).toBe(SUNSET);
    expect(state.hills.key).toBe(`hills-${SUNSET}`);
  });

  test("The hills turn night-coloured at score 40", async ({ page }) => {
    test.setTimeout(120_000);
    await playThroughColumn(page, 40);
    const state = await sample(page);
    expect(state.sky).toBe("#2b2d42");
    expect(state.viewHills.color).toBe(NIGHT);
    expect(state.hills.key).toBe(`hills-${NIGHT}`);
  });

  test("The same score always gives the same hill colour, and a restart returns to the day colour", async ({ page }) => {
    test.setTimeout(120_000);
    await playThroughColumn(page, 40);
    expect((await sample(page)).hills.key).toBe(`hills-${NIGHT}`);
    const restart = await untilRestart(page);
    expect(restart.after.score.text).toBe("0");
    expect(restart.after.viewHills.color).toBe(DAY);
    expect(restart.after.hills.key).toBe(`hills-${DAY}`);
  });
});

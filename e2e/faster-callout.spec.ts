import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { advance, hidePage, oneBox, openGame, play, sample, untilRestart } from "./probe.ts";
import type { Sample } from "./probe.ts";

const EXTRA_COLUMNS = 3;
const JUMP_OFFSET = 788;
const CLEAR_BUFFER = 20;
const JUST_BEFORE_CLEAR = 1750;
const POLL_STEP = 1;

const rampedRandom = (column: number): number[] => Array.from({ length: column + EXTRA_COLUMNS }, () => oneBox).flat();

const jumpTimesFor = (from: number, to: number): number[] =>
  Array.from({ length: to - from + 1 }, (_, index) => 1500 * (from + index) + JUMP_OFFSET);

const scoreReadAt = (column: number): number => 1500 * column + 1820 + CLEAR_BUFFER;

const playThroughColumn = async (page: Page, column: number): Promise<void> => {
  await openGame(page, rampedRandom(column));
  await play(page, jumpTimesFor(1, column), scoreReadAt(column));
};

const waitForScore = async (page: Page, target: string): Promise<Sample> => {
  let current = await sample(page);
  while (current.score.text !== target) {
    await advance(page, POLL_STEP);
    current = await sample(page);
  }
  return current;
};

const playToTheInstantScoreReaches = async (page: Page, column: number): Promise<Sample> => {
  await openGame(page, rampedRandom(column));
  await play(page, jumpTimesFor(1, column), 1500 * column + JUST_BEFORE_CLEAR);
  return waitForScore(page, String(column));
};

const CALLOUT: { text: string; x: number; y: number; color: string; fontSize: string } = {
  text: "Faster!",
  x: 200,
  y: 120,
  color: "#ffd700",
  fontSize: "24px",
};

test.describe("Rule: The callout is hidden until the speed first changes", () => {
  test("No callout shows while the score stays below the first ramp at 20", async ({ page }) => {
    test.setTimeout(60_000);
    await playThroughColumn(page, 19);
    const state = await sample(page);
    expect(state.score.text).toBe("19");
    expect(state.speedUp.visible).toBe(false);
  });
});

test.describe("Rule: The callout fires the instant the speed changes, for 800ms of game time", () => {
  test("The callout appears the moment the score reaches 20 and hides 800ms later", async ({ page }) => {
    test.setTimeout(60_000);
    const atRamp = await playToTheInstantScoreReaches(page, 20);
    expect(atRamp.score.text).toBe("20");
    expect(atRamp.speedUp).toMatchObject({ ...CALLOUT, visible: true });
    expect(atRamp.speedUp.originX).toBeCloseTo(0.5);
    expect(atRamp.speedUp.originY).toBeCloseTo(0.5);
    await advance(page, 799);
    expect((await sample(page)).speedUp.visible).toBe(true);
    await advance(page, 1);
    expect((await sample(page)).speedUp.visible).toBe(false);
  });
});

test.describe("Rule: The callout fires again at every later ramp step, but not once the speed hits its cap", () => {
  test("The callout appears again when the score reaches the next ramp step at 30", async ({ page }) => {
    test.setTimeout(60_000);
    await playThroughColumn(page, 30);
    const state = await sample(page);
    expect(state.score.text).toBe("30");
    expect(state.speedUp.visible).toBe(true);
  });

  test("The callout does not appear at score 70, since the speed already capped at 60", async ({ page }) => {
    test.setTimeout(120_000);
    await playThroughColumn(page, 60);
    const atCap = await sample(page);
    expect(atCap.score.text).toBe("60");
    expect(atCap.speedUp.visible).toBe(true);
    await play(page, jumpTimesFor(61, 70), scoreReadAt(70));
    const later = await sample(page);
    expect(later.score.text).toBe("70");
    expect(later.speedUp.visible).toBe(false);
  });
});

test.describe("Rule: The callout never shows on the game-over or pause screens, and a restart hides it", () => {
  test("The callout hides once the run ends, even moments after the speed just changed", async ({ page }) => {
    test.setTimeout(60_000);
    await playThroughColumn(page, 20);
    expect((await sample(page)).speedUp.visible).toBe(true);
    const restart = await untilRestart(page);
    expect(restart.diedAt.speedUp.visible).toBe(false);
    expect(restart.diedAt.gameOverTitle.visible).toBe(true);
    expect(restart.after.score.text).toBe("0");
    expect(restart.after.speedUp.visible).toBe(false);
  });

  test("The callout hides while the game is paused, even moments after the speed just changed", async ({ page }) => {
    test.setTimeout(60_000);
    await playThroughColumn(page, 20);
    expect((await sample(page)).speedUp.visible).toBe(true);
    await hidePage(page);
    expect((await sample(page)).speedUp.visible).toBe(false);
  });
});

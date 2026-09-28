import { expect, test } from "@playwright/test";
import {
  advanceTo,
  columnsAt,
  last,
  oneBox,
  openGame,
  play,
  sample,
  standardJumps,
  standardRandom,
  untilGameOver,
  untilRestart,
} from "./probe.ts";

const UNTINTED = 0xffffff;
const HIT_TINT = 0xff6666;
const SECOND_COLUMN_SCRIPT = [0.25, 0, 0];

test.describe("Rule: Only the boxes of the column that killed the panda are tinted red", () => {
  test("Dying against the front column of a double column tints only that column", async ({ page }) => {
    await openGame(page, standardRandom({ 13: SECOND_COLUMN_SCRIPT }));
    await play(page, standardJumps(19500), 19500);
    expect((await sample(page)).score.text).toBe("11");
    const { after: diedAt } = await untilGameOver(page);
    const columns = columnsAt(diedAt);
    expect(columns).toHaveLength(2);
    const [front, second] = columns;
    expect(front?.boxes.length).toBeGreaterThan(0);
    expect(front?.boxes.every((box) => box.tint === HIT_TINT)).toBe(true);
    expect(second?.boxes.length).toBeGreaterThan(0);
    expect(second?.boxes.every((box) => box.tint === UNTINTED)).toBe(true);
  });
});

test.describe("Rule: No box is tinted while the run is live", () => {
  test("Box columns are untinted while the panda is still running", async ({ page }) => {
    await openGame(page, oneBox);
    const live = last(await advanceTo(page, 1600));
    expect(live.boxes.length).toBeGreaterThan(0);
    expect(live.boxes.every((box) => box.tint === UNTINTED)).toBe(true);
  });
});

test.describe("Rule: A restart clears every tint, even on a reused box image", () => {
  test("No box carries a stale tint into the next run", async ({ page }) => {
    await openGame(page, oneBox);
    const { after } = await untilRestart(page);
    expect(after.boxes).toEqual([]);
    const nextRun = last(await advanceTo(page, 1600));
    expect(nextRun.boxes.length).toBeGreaterThan(0);
    expect(nextRun.boxes.every((box) => box.tint === UNTINTED)).toBe(true);
  });
});

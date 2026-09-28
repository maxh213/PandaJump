import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { TILE_SIZE } from "../src/rules/index.ts";
import { advance, openGame, play, sample } from "./probe.ts";

const CLEAR_BUFFER = 20;
const WINDOW_MS = 100;
const EXTRA_COLUMNS = 3;

const oneBoxColumns = [0.25, 0.5, 0];

const randomThrough = (column: number): number[] =>
  Array.from({ length: column + EXTRA_COLUMNS }, () => oneBoxColumns).flat();

const JUMP_OFFSET = 788;

const jumpsThrough = (column: number): number[] =>
  Array.from({ length: column }, (_, index) => 1500 * (index + 1) + JUMP_OFFSET);

const scoreReadAt = (column: number): number => 1500 * column + 1820 + CLEAR_BUFFER;

const playThroughColumn = async (page: Page, column: number): Promise<void> => {
  await openGame(page, randomThrough(column));
  await play(page, jumpsThrough(column), scoreReadAt(column));
};

const speedOverWindow = async (page: Page): Promise<{ columnPxPerSecond: number; floorPxPerSecond: number }> => {
  const before = await sample(page);
  const beforeX = Math.max(...before.boxes.map((box) => box.x));
  const beforeScroll = before.rock.scroll;
  await advance(page, WINDOW_MS);
  const after = await sample(page);
  const afterX = Math.max(...after.boxes.map((box) => box.x));
  const afterScroll = after.rock.scroll;
  const columnDistance = beforeX - afterX;
  const floorDistance = ((afterScroll - beforeScroll) % TILE_SIZE + TILE_SIZE) % TILE_SIZE;
  return {
    columnPxPerSecond: (columnDistance / WINDOW_MS) * 1000,
    floorPxPerSecond: (floorDistance / WINDOW_MS) * 1000,
  };
};

test.describe("Rule: Every column and the floor move at a flat 200 px/s below a score of 20", () => {
  test("The speed has not changed just before the ramp starts", async ({ page }) => {
    test.setTimeout(120_000);
    await playThroughColumn(page, 19);
    expect((await sample(page)).score.text).toBe("19");
    const speed = await speedOverWindow(page);
    expect(speed.columnPxPerSecond).toBeCloseTo(200);
    expect(speed.floorPxPerSecond).toBeCloseTo(200);
  });
});

test.describe("Rule: From score 20 the speed increases in fixed 20 px/s steps every 10 points", () => {
  test("The speed steps up the moment the score reaches 20", async ({ page }) => {
    test.setTimeout(120_000);
    await playThroughColumn(page, 20);
    expect((await sample(page)).score.text).toBe("20");
    const speed = await speedOverWindow(page);
    expect(speed.columnPxPerSecond).toBeCloseTo(220);
    expect(speed.floorPxPerSecond).toBeCloseTo(220);
  });

  test("The speed steps up again at the next 10-point mark", async ({ page }) => {
    test.setTimeout(120_000);
    await playThroughColumn(page, 30);
    expect((await sample(page)).score.text).toBe("30");
    const speed = await speedOverWindow(page);
    expect(speed.columnPxPerSecond).toBeCloseTo(240);
  });
});

test.describe("Rule: The ramp never exceeds a hard cap of 300 px/s", () => {
  test("The speed reaches its cap by score 60", async ({ page }) => {
    test.setTimeout(120_000);
    await playThroughColumn(page, 60);
    expect((await sample(page)).score.text).toBe("60");
    const speed = await speedOverWindow(page);
    expect(speed.columnPxPerSecond).toBeCloseTo(300);
  });

  test("The speed does not exceed the cap past score 60", async ({ page }) => {
    test.setTimeout(120_000);
    await playThroughColumn(page, 70);
    expect((await sample(page)).score.text).toBe("70");
    const speed = await speedOverWindow(page);
    expect(speed.columnPxPerSecond).toBeCloseTo(300);
  });
});

test.describe("Rule: The floor and the columns never desync", () => {
  test("The floor and a column travel the same distance at every sampled score", async ({ page }) => {
    test.setTimeout(120_000);
    await playThroughColumn(page, 45);
    expect((await sample(page)).score.text).toBe("45");
    const speed = await speedOverWindow(page);
    expect(speed.floorPxPerSecond).toBeCloseTo(speed.columnPxPerSecond);
  });
});

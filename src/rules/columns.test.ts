import { expect, test } from "vitest";
import { boxesOf, countCleared, hitsPanda, moveColumns, spawnColumns } from "./columns.ts";

const sequence = (...values: number[]) => () => values.shift() ?? 0.5;

const oneBox = { spawnedAt: 1500, offset: 0, boxes: 1, scores: true };
const twoBoxes = { ...oneBox, boxes: 2 };

test("a low height draw spawns one box at the spawn time", () => {
  expect(spawnColumns(1500, 0, sequence(0.25, 0.5))).toEqual([oneBox]);
});

test("a high height draw spawns two boxes", () => {
  expect(spawnColumns(1500, 0, sequence(0.75, 0.5))).toEqual([twoBoxes]);
});

test("a second column draw is ignored while the score is 10", () => {
  expect(spawnColumns(1500, 10, sequence(0.25, 0))).toEqual([oneBox]);
});

test("a second column follows 64 px behind above a score of 10 and only it scores", () => {
  expect(spawnColumns(1500, 11, sequence(0.75, 0))).toEqual([
    { ...twoBoxes, scores: false },
    { ...twoBoxes, offset: 64 },
  ]);
});

test("no second column above 10 without the draw", () => {
  expect(spawnColumns(1500, 11, sequence(0.25, 0.4))).toEqual([oneBox]);
});

test("a column is cleared once its right edge reaches x 100", () => {
  expect(countCleared([oneBox], 3319)).toBe(0);
  expect(countCleared([oneBox], 3320)).toBe(1);
  expect(countCleared([{ ...oneBox, scores: false }], 3320)).toBe(0);
});

test("moving marks cleared columns as scored and drops columns off screen", () => {
  expect(moveColumns([oneBox], 3000)).toEqual([oneBox]);
  expect(moveColumns([oneBox], 3320)).toEqual([{ ...oneBox, scores: false }]);
  expect(moveColumns([oneBox], 3820)).toEqual([]);
});

test("a column touches the panda while they overlap and the panda is below its top", () => {
  expect(hitsPanda([oneBox], 2875, 0)).toBe(false);
  expect(hitsPanda([oneBox], 2876, 63)).toBe(true);
  expect(hitsPanda([oneBox], 2876, 64)).toBe(false);
  expect(hitsPanda([twoBoxes], 3000, 127)).toBe(true);
  expect(hitsPanda([oneBox], 3320, 0)).toBe(false);
});

test("boxes stack up from the floor at the column's position", () => {
  expect(boxesOf([twoBoxes, { ...oneBox, offset: 64 }], 1600)).toEqual([
    { x: 380, y: 362 },
    { x: 380, y: 298 },
    { x: 444, y: 362 },
  ]);
});

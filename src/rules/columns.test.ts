import { expect, test } from "vitest";
import {
  bestColumnMarker,
  boxesOf,
  countCleared,
  hitsPanda,
  moveColumns,
  spawnColumns,
  touchingColumn,
} from "./columns.ts";
import type { Column } from "./columns.ts";

const sequence = (...values: number[]) => () => values.shift() ?? 0.5;

const oneBox: Column = { spawnDistance: 300, offset: 0, boxes: 1, scoresWhenCleared: true, texture: "dirt_06.png" };
const twoBoxes: Column = { ...oneBox, boxes: 2 };

test("a low height draw spawns one box at the spawn distance", () => {
  expect(spawnColumns(300, 0, sequence(0.25, 0.5, 0))).toEqual([oneBox]);
});

test("a high height draw spawns two boxes", () => {
  expect(spawnColumns(300, 0, sequence(0.75, 0.5, 0))).toEqual([twoBoxes]);
});

test("a second column draw is ignored while the score is 10", () => {
  expect(spawnColumns(300, 10, sequence(0.25, 0, 0))).toEqual([oneBox]);
});

test("a second column follows 64 px behind above a score of 10 and only it scores", () => {
  expect(spawnColumns(300, 11, sequence(0.75, 0, 0))).toEqual([
    { ...twoBoxes, scoresWhenCleared: false },
    { ...twoBoxes, offset: 64 },
  ]);
});

test("no second column above 10 without the draw", () => {
  expect(spawnColumns(300, 11, sequence(0.25, 0.4, 0))).toEqual([oneBox]);
});

const textureCases: [number, string][] = [
  [0, "dirt_06.png"],
  [19, "dirt_06.png"],
  [20, "sand_06.png"],
  [40, "ice_06.png"],
  [60, "metal_06.png"],
  [80, "dirt_06.png"],
];

test("a column takes the texture of the biome its score is in", () => {
  textureCases.forEach(([score, texture]) => {
    const [column] = spawnColumns(300, score, sequence(0.25, 0.5, 0));
    expect(column?.texture).toBe(texture);
  });
});

test("the texture value each column draws no longer changes its texture", () => {
  const [column] = spawnColumns(300, 0, sequence(0.25, 0.5, 0.9));
  expect(column?.texture).toBe("dirt_06.png");
});

test("a second column shares the same texture as the front column it follows", () => {
  const columns = spawnColumns(300, 21, sequence(0.75, 0, 0));
  expect(columns.map((column) => column.texture)).toEqual(["sand_06.png", "sand_06.png"]);
});

test("a column is cleared once its right edge reaches x 100", () => {
  expect(countCleared([oneBox], 663)).toBe(0);
  expect(countCleared([oneBox], 664)).toBe(1);
  expect(countCleared([{ ...oneBox, scoresWhenCleared: false }], 664)).toBe(0);
});

test("moving marks cleared columns as scored and drops columns off screen", () => {
  expect(moveColumns([oneBox], 600)).toEqual([oneBox]);
  expect(moveColumns([oneBox], 664)).toEqual([{ ...oneBox, scoresWhenCleared: false }]);
  expect(moveColumns([oneBox], 764)).toEqual([]);
});

test("a column touches the panda only inside x 103 to 122 and below its top minus 4 px", () => {
  expect(hitsPanda([oneBox], 577, 0)).toBe(false);
  expect(hitsPanda([oneBox], 578.1, 59.9)).toBe(true);
  expect(hitsPanda([oneBox], 578.1, 60)).toBe(false);
  expect(hitsPanda([twoBoxes], 600, 123.9)).toBe(true);
  expect(hitsPanda([twoBoxes], 600, 124)).toBe(false);
  expect(hitsPanda([oneBox], 577.9, 0)).toBe(false);
  expect(hitsPanda([oneBox], 660.9, 0)).toBe(true);
  expect(hitsPanda([oneBox], 661, 0)).toBe(false);
  expect(hitsPanda([oneBox], 664, 0)).toBe(false);
});

test("boxes stack up from the floor at the column's position", () => {
  expect(boxesOf([twoBoxes, { ...oneBox, offset: 64, texture: "ice_06.png" }], 320, null)).toEqual([
    { x: 380, y: 362, texture: "dirt_06.png", hit: false },
    { x: 380, y: 298, texture: "dirt_06.png", hit: false },
    { x: 444, y: 362, texture: "ice_06.png", hit: false },
  ]);
});

test("a column touching the panda is the one returned as the touching column", () => {
  expect(touchingColumn([oneBox], 578, 0)).toBeNull();
  expect(touchingColumn([oneBox], 578.1, 59.9)).toEqual(oneBox);
  expect(touchingColumn([oneBox], 578.1, 60)).toBeNull();
});

test("boxesOf marks every box of the hit column as hit and leaves every other box untouched", () => {
  const second: Column = { ...oneBox, offset: 64, texture: "ice_06.png" };
  expect(boxesOf([twoBoxes, second], 320, twoBoxes)).toEqual([
    { x: 380, y: 362, texture: "dirt_06.png", hit: true },
    { x: 380, y: 298, texture: "dirt_06.png", hit: true },
    { x: 444, y: 362, texture: "ice_06.png", hit: false },
  ]);
  expect(boxesOf([twoBoxes, second], 320, second)).toEqual([
    { x: 380, y: 362, texture: "dirt_06.png", hit: false },
    { x: 380, y: 298, texture: "dirt_06.png", hit: false },
    { x: 444, y: 362, texture: "ice_06.png", hit: true },
  ]);
});

test("bestColumnMarker is null when the stored best is 0", () => {
  expect(bestColumnMarker([oneBox], 320, { score: 0, best: 0 })).toBeNull();
});

test("bestColumnMarker is null once the score has passed the best", () => {
  expect(bestColumnMarker([oneBox], 320, { score: 2, best: 1 })).toBeNull();
});

test("bestColumnMarker sits over the column whose clearing would take the score to best + 1", () => {
  expect(bestColumnMarker([oneBox], 320, { score: 1, best: 1 })).toEqual({ x: 412, y: 354 });
});

test("bestColumnMarker sits over the later of two uncleared columns when score trails best by more than one clear", () => {
  const later: Column = { ...oneBox, spawnDistance: 600 };
  expect(bestColumnMarker([oneBox, later], 668, { score: 2, best: 3 })).toEqual({ x: 364, y: 354 });
});

test("bestColumnMarker is null when the target column has not spawned yet", () => {
  expect(bestColumnMarker([oneBox], 320, { score: 0, best: 2 })).toBeNull();
});

test("bestColumnMarker sits over the rear column of a back-to-back pair, not the front one", () => {
  const pair = spawnColumns(300, 11, sequence(0.75, 0, 0));
  expect(bestColumnMarker(pair, 320, { score: 1, best: 1 })).toEqual({ x: 476, y: 290 });
});

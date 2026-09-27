import { expect, test } from "vitest";
import { boxesOf, countCleared, hitsPanda, moveColumns, spawnColumns } from "./columns.ts";
import type { Column } from "./columns.ts";

const sequence = (...values: number[]) => () => values.shift() ?? 0.5;

const oneBox: Column = { spawnedAt: 1500, offset: 0, boxes: 1, scoresWhenCleared: true, texture: "dirt_06.png" };
const twoBoxes: Column = { ...oneBox, boxes: 2 };

test("a low height draw spawns one box at the spawn time", () => {
  expect(spawnColumns(1500, 0, sequence(0.25, 0.5, 0))).toEqual([oneBox]);
});

test("a high height draw spawns two boxes", () => {
  expect(spawnColumns(1500, 0, sequence(0.75, 0.5, 0))).toEqual([twoBoxes]);
});

test("a second column draw is ignored while the score is 10", () => {
  expect(spawnColumns(1500, 10, sequence(0.25, 0, 0))).toEqual([oneBox]);
});

test("a second column follows 64 px behind above a score of 10 and only it scores", () => {
  expect(spawnColumns(1500, 11, sequence(0.75, 0, 0))).toEqual([
    { ...twoBoxes, scoresWhenCleared: false },
    { ...twoBoxes, offset: 64 },
  ]);
});

test("no second column above 10 without the draw", () => {
  expect(spawnColumns(1500, 11, sequence(0.25, 0.4, 0))).toEqual([oneBox]);
});

const textureCases: [number, string][] = [
  [0, "dirt_06.png"],
  [0.2, "ice_06.png"],
  [0.4, "metal_06.png"],
  [0.6, "sand_06.png"],
  [0.8, "snow_06.png"],
  [1, "snow_06.png"],
];

test("a texture draw picks one of the five ground textures deterministically", () => {
  textureCases.forEach(([value, texture]) => {
    const [column] = spawnColumns(1500, 0, sequence(0.25, 0.5, value));
    expect(column?.texture).toBe(texture);
  });
});

test("a second column shares the same texture as the front column it follows", () => {
  const columns = spawnColumns(1500, 11, sequence(0.75, 0, 0.6));
  expect(columns.map((column) => column.texture)).toEqual(["sand_06.png", "sand_06.png"]);
});

test("a column is cleared once its right edge reaches x 100", () => {
  expect(countCleared([oneBox], 3319)).toBe(0);
  expect(countCleared([oneBox], 3320)).toBe(1);
  expect(countCleared([{ ...oneBox, scoresWhenCleared: false }], 3320)).toBe(0);
});

test("moving marks cleared columns as scored and drops columns off screen", () => {
  expect(moveColumns([oneBox], 3000)).toEqual([oneBox]);
  expect(moveColumns([oneBox], 3320)).toEqual([{ ...oneBox, scoresWhenCleared: false }]);
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
  expect(boxesOf([twoBoxes, { ...oneBox, offset: 64, texture: "ice_06.png" }], 1600)).toEqual([
    { x: 380, y: 362, texture: "dirt_06.png" },
    { x: 380, y: 298, texture: "dirt_06.png" },
    { x: 444, y: 362, texture: "ice_06.png" },
  ]);
});

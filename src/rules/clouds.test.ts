import { expect, test } from "vitest";
import { cloudsOf, initialClouds, moveClouds } from "./clouds.ts";
import type { CloudState } from "./clouds.ts";

const sequence = (...values: number[]) => () => values.shift() ?? 0.5;

const boom = (): number => {
  throw new Error("random should not be drawn");
};

test("three clouds start spread across the canvas with heights from the random source", () => {
  expect(initialClouds(sequence(0, 0.5, 1))).toEqual([
    { spawnedAt: 0, startX: 0, y: 6, texture: "cloud_02.png" },
    { spawnedAt: 0, startX: 150, y: 100, texture: "cloud_05.png" },
    { spawnedAt: 0, startX: 300, y: 194, texture: "cloud_02.png" },
  ]);
});

test("a cloud still on screen drifts left and is not redrawn", () => {
  const cloud: CloudState = { spawnedAt: 0, startX: 300, y: 50, texture: "cloud_02.png" };
  expect(moveClouds([cloud], 5000, boom)).toEqual([cloud]);
});

test("a cloud one pixel from fully leaving the left edge is not yet replaced", () => {
  const cloud: CloudState = { spawnedAt: 0, startX: 0, y: 50, texture: "cloud_02.png" };
  expect(moveClouds([cloud], 1249, boom)).toEqual([cloud]);
});

test("a cloud fully off the left edge respawns off the right edge with a drawn height and swapped texture", () => {
  const cloud: CloudState = { spawnedAt: 0, startX: 0, y: 50, texture: "cloud_02.png" };
  expect(moveClouds([cloud], 1250, sequence(0.25))).toEqual([
    { spawnedAt: 1250, startX: 400, y: 53, texture: "cloud_05.png" },
  ]);
});

test("a respawn swaps back from the second texture to the first", () => {
  const cloud: CloudState = { spawnedAt: 0, startX: 0, y: 50, texture: "cloud_05.png" };
  expect(moveClouds([cloud], 1250, sequence(0))).toEqual([
    { spawnedAt: 1250, startX: 400, y: 6, texture: "cloud_02.png" },
  ]);
});

test("cloudsOf reports the drift position with no bob at the start of the cycle", () => {
  const cloud: CloudState = { spawnedAt: 0, startX: 300, y: 100, texture: "cloud_02.png" };
  expect(cloudsOf([cloud], 0)).toEqual([{ x: 300, y: 100, texture: "cloud_02.png" }]);
});

test("cloudsOf bobs up a quarter cycle in and down three quarters in", () => {
  const cloud: CloudState = { spawnedAt: 0, startX: 300, y: 100, texture: "cloud_02.png" };
  const up = cloudsOf([cloud], 750)[0];
  expect(up?.x).toBeCloseTo(270);
  expect(up?.y).toBeCloseTo(106);
  const down = cloudsOf([cloud], 2250)[0];
  expect(down?.y).toBeCloseTo(94);
});

test("cloudsOf returns to the base height after a full 3 second cycle", () => {
  const cloud: CloudState = { spawnedAt: 500, startX: 300, y: 100, texture: "cloud_02.png" };
  expect(cloudsOf([cloud], 3500)[0]?.y).toBeCloseTo(100);
});

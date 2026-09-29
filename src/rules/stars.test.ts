import { expect, test } from "vitest";
import { CANVAS_WIDTH } from "./world.ts";
import { starsFor } from "./stars.ts";

test("no stars below a score of 60", () => {
  expect(starsFor(0)).toEqual([]);
  expect(starsFor(59)).toEqual([]);
});

test("twelve stars from a score of 60 and above", () => {
  expect(starsFor(60)).toHaveLength(12);
  expect(starsFor(69)).toHaveLength(12);
});

test("the stars are the same fixed list every time", () => {
  expect(starsFor(60)).toEqual(starsFor(75));
  expect(starsFor(60)[0]).toEqual({ x: 24, y: 90 });
});

test("every star sits in the top of the canvas, clear of the floor and columns", () => {
  starsFor(60).forEach((star) => {
    expect(star.y).toBeGreaterThanOrEqual(0);
    expect(star.y).toBeLessThan(200);
    expect(star.x).toBeGreaterThanOrEqual(0);
    expect(star.x).toBeLessThanOrEqual(CANVAS_WIDTH);
  });
});

test("no two stars share a position", () => {
  const keys = new Set(starsFor(60).map((star) => `${String(star.x)},${String(star.y)}`));
  expect(keys.size).toBe(12);
});

import { expect, test } from "vitest";
import { spawnGapForScore, speedForScore } from "./world.ts";

test("the speed stays at 200 px/s for every score below 20", () => {
  expect(speedForScore(0)).toBeCloseTo(0.2);
  expect(speedForScore(19)).toBeCloseTo(0.2);
});

test("the speed steps up by 20 px/s at score 20 and every 10 points after", () => {
  expect(speedForScore(20)).toBeCloseTo(0.22);
  expect(speedForScore(29)).toBeCloseTo(0.22);
  expect(speedForScore(30)).toBeCloseTo(0.24);
});

test("the speed never exceeds the 300 px/s cap", () => {
  expect(speedForScore(60)).toBeCloseTo(0.3);
  expect(speedForScore(70)).toBeCloseTo(0.3);
  expect(speedForScore(1000)).toBeCloseTo(0.3);
});

test("the spawn gap is 1500 ms for every score below 20", () => {
  expect(spawnGapForScore(0)).toBe(1500);
  expect(spawnGapForScore(19)).toBe(1500);
});

test("the spawn gap shrinks by 50 ms at score 20 and every 10 points after", () => {
  expect(spawnGapForScore(20)).toBe(1450);
  expect(spawnGapForScore(29)).toBe(1450);
  expect(spawnGapForScore(30)).toBe(1400);
  expect(spawnGapForScore(40)).toBe(1350);
  expect(spawnGapForScore(50)).toBe(1300);
  expect(spawnGapForScore(60)).toBe(1250);
});

test("the spawn gap never drops below 1250 ms", () => {
  expect(spawnGapForScore(90)).toBe(1250);
  expect(spawnGapForScore(1000)).toBe(1250);
});

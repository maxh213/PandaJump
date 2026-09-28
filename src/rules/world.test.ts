import { expect, test } from "vitest";
import { speedForScore } from "./world.ts";

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

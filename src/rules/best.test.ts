import { expect, test } from "vitest";
import { nextBest } from "./best.ts";

test("a higher score becomes the new best", () => {
  expect(nextBest(5, 8)).toBe(8);
});

test("a lower or equal score keeps the current best", () => {
  expect(nextBest(5, 5)).toBe(5);
  expect(nextBest(5, 3)).toBe(5);
});

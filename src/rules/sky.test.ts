import { expect, test } from "vitest";
import { skyFor } from "./sky.ts";

test("day sky below a score of 20", () => {
  expect(skyFor(0)).toBe("#71c5cf");
  expect(skyFor(19)).toBe("#71c5cf");
});

test("sunset sky from a score of 20 to 39", () => {
  expect(skyFor(20)).toBe("#f4a261");
  expect(skyFor(39)).toBe("#f4a261");
});

test("night sky from a score of 40 and above", () => {
  expect(skyFor(40)).toBe("#2b2d42");
  expect(skyFor(100)).toBe("#2b2d42");
});

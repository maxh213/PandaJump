import { expect, test } from "vitest";
import { HILLS_REPEAT_WIDTH, hillColorFor, hillsScrollFor } from "./hills.ts";

test("hills start at zero scroll", () => {
  expect(hillsScrollFor(0)).toBe(0);
});

test("hills scroll a quarter of the distance travelled", () => {
  expect(hillsScrollFor(100)).toBe(25);
  expect(hillsScrollFor(6.4)).toBeCloseTo(1.6);
});

test("hills wrap at the repeat width", () => {
  expect(hillsScrollFor(HILLS_REPEAT_WIDTH * 4)).toBe(0);
  expect(hillsScrollFor(HILLS_REPEAT_WIDTH * 4 + 40)).toBe(10);
});

test("day hills below a score of 20", () => {
  expect(hillColorFor(0)).toBe("#4a9ba6");
  expect(hillColorFor(19)).toBe("#4a9ba6");
});

test("sunset hills from a score of 20 to 39", () => {
  expect(hillColorFor(20)).toBe("#c97b3a");
  expect(hillColorFor(39)).toBe("#c97b3a");
});

test("night hills from a score of 40 and above", () => {
  expect(hillColorFor(40)).toBe("#1a1b2b");
  expect(hillColorFor(100)).toBe("#1a1b2b");
});

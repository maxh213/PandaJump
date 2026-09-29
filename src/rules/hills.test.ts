import { expect, test } from "vitest";
import { HILLS_REPEAT_WIDTH, hillsScrollFor } from "./hills.ts";

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

import { expect, test } from "vitest";
import { medalFor } from "./medal.ts";

test("no medal below a score of 10", () => {
  expect(medalFor(0)).toBe("none");
  expect(medalFor(9)).toBe("none");
});

test("Bronze from a score of 10 to 19", () => {
  expect(medalFor(10)).toBe("Bronze");
  expect(medalFor(19)).toBe("Bronze");
});

test("Silver from a score of 20 to 29", () => {
  expect(medalFor(20)).toBe("Silver");
  expect(medalFor(29)).toBe("Silver");
});

test("Gold from a score of 30 to 39", () => {
  expect(medalFor(30)).toBe("Gold");
  expect(medalFor(39)).toBe("Gold");
});

test("Platinum from a score of 40 and above", () => {
  expect(medalFor(40)).toBe("Platinum");
  expect(medalFor(100)).toBe("Platinum");
});

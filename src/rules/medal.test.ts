import { expect, test } from "vitest";
import { medalFor, medalGoalFor, shareTextFor } from "./medal.ts";

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

test("the goal names the bronze threshold only when no medal was earned", () => {
  expect(medalGoalFor("none")).toBe("Bronze medal at 10");
  expect(medalGoalFor("Bronze")).toBe("");
  expect(medalGoalFor("Platinum")).toBe("");
});

test("the share text names no medal below a score of 10", () => {
  expect(shareTextFor(0, "none")).toBe("I scored 0 on Panda Jump!");
  expect(shareTextFor(9, "none")).toBe("I scored 9 on Panda Jump!");
});

test("the share text names each earned medal", () => {
  expect(shareTextFor(12, "Bronze")).toBe("I scored 12 and earned a Bronze medal on Panda Jump!");
  expect(shareTextFor(21, "Silver")).toBe("I scored 21 and earned a Silver medal on Panda Jump!");
  expect(shareTextFor(35, "Gold")).toBe("I scored 35 and earned a Gold medal on Panda Jump!");
  expect(shareTextFor(40, "Platinum")).toBe("I scored 40 and earned a Platinum medal on Panda Jump!");
});

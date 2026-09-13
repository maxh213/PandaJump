import { expect, test } from "vitest";
import { fall, jump, standingPanda } from "./panda.ts";

test("a jump from the floor sets speed 580 and allows one air jump", () => {
  expect(jump(standingPanda)).toEqual({ height: 0, speed: 580, airJump: true });
});

test("a jump in the air sets speed 250 and uses the air jump", () => {
  expect(jump({ height: 50, speed: -10, airJump: true })).toEqual({ height: 50, speed: 250, airJump: false });
});

test("a jump pressed twice before moving uses the air jump", () => {
  expect(jump(jump(standingPanda))).toEqual({ height: 0, speed: 250, airJump: false });
});

test("a third jump in the air is ignored", () => {
  const panda = { height: 50, speed: 100, airJump: false };
  expect(jump(panda)).toBe(panda);
});

test("falling follows constant gravity exactly", () => {
  const panda = fall(jump(standingPanda), 580);
  expect(panda.height).toBeCloseTo(168.2);
  expect(panda.speed).toBeCloseTo(0);
});

test("falling through the floor lands the panda and keeps its air jump flag", () => {
  expect(fall({ height: 1, speed: -100, airJump: true }, 100)).toEqual({ height: 0, speed: 0, airJump: true });
});

test("a panda standing on the floor stays there", () => {
  expect(fall(standingPanda, 16)).toEqual(standingPanda);
});

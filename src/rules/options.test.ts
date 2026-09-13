import { expect, test } from "vitest";
import { readOptions } from "./options.ts";

const fixed = () => 0.42;

test("normal play uses the given random source and real time", () => {
  const options = readOptions("", fixed);
  expect(options.random()).toBe(0.42);
  expect(options.timeScale).toBe(1);
});

test("a manual clock stops game time", () => {
  expect(readOptions("?clock=manual", fixed).timeScale).toBe(0);
});

test("a scripted random source repeats its values in order", () => {
  const { random } = readOptions("?random=0.25,0.5,0", fixed);
  expect([random(), random(), random(), random()]).toEqual([0.25, 0.5, 0, 0.25]);
});

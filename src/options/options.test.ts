import { expect, test } from "vitest";
import { readOptions } from "./index.ts";

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

test("normal play draws clouds from the same given random source", () => {
  expect(readOptions("", fixed).cloudRandom()).toBe(0.42);
});

test("the scripted cloud random source repeats the same script independently of the column draws", () => {
  const { random, cloudRandom } = readOptions("?random=0.25,0.5,0", fixed);
  expect(random()).toBe(0.25);
  expect(random()).toBe(0.5);
  expect(cloudRandom()).toBe(0.25);
  expect(cloudRandom()).toBe(0.5);
});

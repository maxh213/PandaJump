import { expect, test } from "vitest";
import { insertScore, parseTopScores, seedTopScores } from "./top-scores.ts";

test("a score goes into its place, highest first", () => {
  expect(insertScore([5, 3], 4)).toEqual([5, 4, 3]);
});

test("duplicates are kept", () => {
  expect(insertScore([5, 3], 3)).toEqual([5, 3, 3]);
});

test("a score of 0 is never listed", () => {
  expect(insertScore([5], 0)).toEqual([5]);
  expect(insertScore([], 0)).toEqual([]);
});

test("only the five highest scores are kept", () => {
  expect(insertScore([9, 8, 7, 6, 5], 4)).toEqual([9, 8, 7, 6, 5]);
  expect(insertScore([9, 8, 7, 6, 5], 10)).toEqual([10, 9, 8, 7, 6]);
});

test("the input list is not changed", () => {
  const scores = [5, 3];
  insertScore(scores, 4);
  expect(scores).toEqual([5, 3]);
});

test("a stored list of integers is read back highest first", () => {
  expect(parseTopScores("[3,9,5]")).toEqual([9, 5, 3]);
  expect(parseTopScores("[]")).toEqual([]);
});

test("a stored list longer than five is cut to the five highest", () => {
  expect(parseTopScores("[1,2,3,4,5,6,7]")).toEqual([7, 6, 5, 4, 3]);
});

test("a missing, unparsable or malformed stored list is unreadable", () => {
  expect(parseTopScores(null)).toBeNull();
  expect(parseTopScores("not json")).toBeNull();
  expect(parseTopScores("{}")).toBeNull();
  expect(parseTopScores('["7"]')).toBeNull();
  expect(parseTopScores("[1.5]")).toBeNull();
  expect(parseTopScores("[0]")).toBeNull();
  expect(parseTopScores("[-2]")).toBeNull();
});

test("the seed holds the stored best when it is above 0, otherwise nothing", () => {
  expect(seedTopScores(7)).toEqual([7]);
  expect(seedTopScores(0)).toEqual([]);
});

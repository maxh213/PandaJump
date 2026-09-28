import { expect, test } from "vitest";
import { createRun } from "./index.ts";
import type { Run } from "./index.ts";

const noStore = { load: () => 0, save: () => undefined };

const ONE_BOX = [0.25, 0.5, 0];
const TWO_BOXES = [0.75, 0.5, 0];
const DOUBLE_COLUMN = [0.75, 0, 0.6];
const LAST_ONE_BOX_COLUMN = 64;
const RAMPED_OFFSET = 788;
const BRIDGE_OFFSETS = [708, 628, 548];
const FIRST_BRIDGE_COLUMN = 62;
const CAPPED_SINGLE_OFFSET = 480;
const CAPPED_DOUBLE_OFFSET = 590;

interface Spawn {
  readonly time: number;
  readonly score: number;
}

const columnRandom = (patternFor: (column: number) => number[]) => {
  let draws = 0;
  return (): number => {
    const column = Math.floor(draws / 3) + 1;
    const value = patternFor(column)[draws % 3] ?? 0;
    draws += 1;
    return value;
  };
};

const offsetFor = (column: number, capped: number): number => {
  if (column < FIRST_BRIDGE_COLUMN) return RAMPED_OFFSET;
  return BRIDGE_OFFSETS[column - FIRST_BRIDGE_COLUMN] ?? capped;
};

const frontOf = (run: Run): number => Math.max(-Infinity, ...run.view().boxes.map((box) => box.x));

const newPilot = (run: Run, capped: number) => {
  const spawns: Spawn[] = [];
  const jumps: number[] = [];
  const jumpTimes: number[] = [];
  let front = -Infinity;
  const watchSpawns = (time: number, score: number): void => {
    const now = frontOf(run);
    if (now > front) {
      spawns.push({ time, score });
      jumps.push(time + offsetFor(spawns.length, capped));
    }
    front = now;
  };
  const jumpWhenDue = (time: number): void => {
    if (jumps[0] === undefined || time < jumps[0]) return;
    jumps.shift();
    jumpTimes.push(time);
    run.jump();
  };
  const tick = (): void => {
    run.advance(1);
    const view = run.view();
    watchSpawns(view.time, Number(view.score));
    jumpWhenDue(view.time);
  };
  return { spawns, jumpTimes, tick };
};

const fly = (capped: number, cappedPattern: number[], columnsToClear: number) => {
  const run = createRun(
    columnRandom((column) => (column <= LAST_ONE_BOX_COLUMN ? ONE_BOX : cappedPattern)),
    columnRandom(() => ONE_BOX),
    noStore,
  );
  const pilot = newPilot(run, capped);
  const target = LAST_ONE_BOX_COLUMN + columnsToClear + 4;
  while (!run.view().gameOver && pilot.spawns.length < target) {
    pilot.tick();
  }
  return { run, spawns: pilot.spawns, jumpTimes: pilot.jumpTimes };
};

const gapAfter = (spawns: readonly Spawn[], index: number): number => {
  const current = spawns[index];
  const next = spawns[index + 1];
  if (current === undefined || next === undefined) throw new Error("missing spawn");
  return next.time - current.time;
};

test("the gap between column spawns follows the score at the moment each column spawns", () => {
  const { spawns } = fly(CAPPED_SINGLE_OFFSET, TWO_BOXES, 10);
  const first = spawns[0];
  expect(first?.time).toBe(1500);
  const gaps = spawns.slice(0, -1).map((spawn, index) => ({ score: spawn.score, gap: gapAfter(spawns, index) }));
  const expected = (score: number): number => Math.max(1250, score < 20 ? 1500 : 1500 - (Math.floor((score - 20) / 10) + 1) * 50);
  expect(gaps.every(({ score, gap }) => gap === expected(score))).toBe(true);
  expect(new Set(gaps.map(({ gap }) => gap))).toEqual(new Set([1500, 1450, 1400, 1350, 1300, 1250]));
});

test("a capped run of single 2-box columns, one floor jump per column, clears 10 columns in a row", () => {
  const { run, jumpTimes } = fly(CAPPED_SINGLE_OFFSET, TWO_BOXES, 10);
  const view = run.view();
  expect(view.gameOver).toBe(false);
  expect(Number(view.score)).toBeGreaterThanOrEqual(LAST_ONE_BOX_COLUMN + 6);
  expect(jumpTimes.length).toBeGreaterThan(LAST_ONE_BOX_COLUMN + 10);
});

test("a capped run of double columns clears 5 in a row with one floor jump per double column", () => {
  const { run, spawns, jumpTimes } = fly(CAPPED_DOUBLE_OFFSET, DOUBLE_COLUMN, 5);
  const view = run.view();
  expect(view.gameOver).toBe(false);
  expect(Number(view.score)).toBeGreaterThanOrEqual(LAST_ONE_BOX_COLUMN + 1);
  expect(jumpTimes.length).toBeLessThanOrEqual(spawns.length);
});

test("two runs given the same random values place every column identically at the same game times", () => {
  const first = fly(CAPPED_SINGLE_OFFSET, TWO_BOXES, 3);
  const second = fly(CAPPED_SINGLE_OFFSET, TWO_BOXES, 3);
  expect(second.spawns).toEqual(first.spawns);
  expect(second.run.view().boxes).toEqual(first.run.view().boxes);
});

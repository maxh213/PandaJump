import { SPAWN_EVERY, boxesOf, countCleared, hitsPanda, moveColumns, spawnColumns } from "./columns.ts";
import type { Box, Column, Random } from "./columns.ts";
import { fall, jump, standingPanda } from "./panda.ts";
import type { Panda } from "./panda.ts";

export interface View {
  readonly time: number;
  readonly restarts: number;
  readonly score: string;
  readonly pandaBottom: number;
  readonly pandaFrame: number;
  readonly floorScroll: number;
  readonly boxes: Box[];
}

export interface Run {
  readonly jump: () => void;
  readonly advance: (ms: number) => void;
  readonly view: () => View;
}

interface State {
  readonly time: number;
  readonly restarts: number;
  readonly score: number;
  readonly nextSpawn: number;
  readonly panda: Panda;
  readonly columns: Column[];
}

const MAX_STEP = 10;
const FLOOR_Y = 426;
const TILE_SIZE = 64;
const SCROLL_SPEED = 0.2;
const FIRST_RUN_FRAME = 17;
const RUN_FRAMES = 6;
const FRAMES_PER_MS = 15 / 1000;

const freshState = (restarts: number): State => ({
  time: 0,
  restarts,
  score: 0,
  nextSpawn: SPAWN_EVERY,
  panda: standingPanda,
  columns: [],
});

const spawnDue = (state: State, random: Random): Column[] =>
  state.time >= state.nextSpawn ? spawnColumns(state.nextSpawn, state.score, random) : [];

const step = (state: State, ms: number, random: Random): State => {
  const time = state.time + ms;
  const panda = fall(state.panda, ms);
  const score = state.score + countCleared(state.columns, time);
  const moved = { ...state, time, panda, score, columns: moveColumns(state.columns, time) };
  const spawned = spawnDue(moved, random);
  const columns = [...moved.columns, ...spawned];
  const nextSpawn = state.nextSpawn + (spawned.length > 0 ? SPAWN_EVERY : 0);
  return hitsPanda(columns, time, panda.height) ? freshState(state.restarts + 1) : { ...moved, columns, nextSpawn };
};

const advanceState = (state: State, ms: number, random: Random): State => {
  let current = state;
  for (let left = ms; left > 0; left -= MAX_STEP) {
    current = step(current, Math.min(left, MAX_STEP), random);
  }
  return current;
};

const viewOf = (state: State): View => ({
  time: state.time,
  restarts: state.restarts,
  score: String(state.score),
  pandaBottom: FLOOR_Y - state.panda.height,
  pandaFrame: FIRST_RUN_FRAME + (Math.floor(state.time * FRAMES_PER_MS) % RUN_FRAMES),
  floorScroll: (state.time * SCROLL_SPEED) % TILE_SIZE,
  boxes: boxesOf(state.columns, state.time),
});

export const createRun = (random: Random): Run => {
  let state = freshState(0);
  return {
    jump: () => {
      state = { ...state, panda: jump(state.panda) };
    },
    advance: (ms) => {
      state = advanceState(state, ms, random);
    },
    view: () => viewOf(state),
  };
};

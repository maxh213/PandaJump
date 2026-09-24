import { SPAWN_EVERY, boxesOf, countCleared, hitsPanda, moveColumns, spawnColumns } from "./columns.ts";
import type { Box, Column, Random } from "./columns.ts";
import { cloudsOf, initialClouds, moveClouds } from "./clouds.ts";
import type { Cloud, CloudState } from "./clouds.ts";
import { fall, jump, standingPanda } from "./panda.ts";
import type { Panda } from "./panda.ts";
import { FLOOR_Y, PANDA_X, SCROLL_PX_PER_MS, TILE_SIZE } from "./world.ts";

interface View {
  readonly time: number;
  readonly restarts: number;
  readonly score: string;
  readonly pandaX: number;
  readonly pandaBottom: number;
  readonly pandaFrame: number;
  readonly floorScroll: number;
  readonly boxes: Box[];
  readonly clouds: Cloud[];
}

export interface Run {
  readonly jump: () => void;
  readonly advance: (ms: number) => void;
  readonly view: () => View;
}

interface Randoms {
  readonly columns: Random;
  readonly clouds: Random;
}

interface State {
  readonly time: number;
  readonly restarts: number;
  readonly score: number;
  readonly nextSpawn: number;
  readonly panda: Panda;
  readonly columns: readonly Column[];
  readonly clouds: readonly CloudState[];
}

const MAX_STEP = 10;
const FIRST_RUN_FRAME = 17;
const RUN_FRAMES = 6;
const FRAMES_PER_MS = 15 / 1000;
const NO_COLUMNS: readonly Column[] = [];

const freshState = (restarts: number, randoms: Randoms): State => ({
  time: 0,
  restarts,
  score: 0,
  nextSpawn: SPAWN_EVERY,
  panda: standingPanda,
  columns: NO_COLUMNS,
  clouds: initialClouds(randoms.clouds),
});

const moveOn = (state: State, ms: number, randoms: Randoms): State => {
  const time = state.time + ms;
  return {
    ...state,
    time,
    panda: fall(state.panda, ms),
    score: state.score + countCleared(state.columns, time),
    columns: moveColumns(state.columns, time),
    clouds: moveClouds(state.clouds, time, randoms.clouds),
  };
};

const spawnIfDue = (state: State, random: Random): State =>
  state.time < state.nextSpawn
    ? state
    : {
        ...state,
        columns: [...state.columns, ...spawnColumns(state.nextSpawn, state.score, random)],
        nextSpawn: state.nextSpawn + SPAWN_EVERY,
      };

const step = (state: State, ms: number, randoms: Randoms): State => {
  const next = spawnIfDue(moveOn(state, ms, randoms), randoms.columns);
  return hitsPanda(next.columns, next.time, next.panda.height) ? freshState(state.restarts + 1, randoms) : next;
};

const stepsOf = (ms: number): number[] =>
  Array.from({ length: Math.ceil(ms / MAX_STEP) }, (_, index) => Math.min(MAX_STEP, ms - index * MAX_STEP));

const advanceState = (state: State, ms: number, randoms: Randoms): State =>
  stepsOf(ms).reduce((current, part) => step(current, part, randoms), state);

const viewOf = (state: State): View => ({
  time: state.time,
  restarts: state.restarts,
  score: String(state.score),
  pandaX: PANDA_X,
  pandaBottom: FLOOR_Y - state.panda.height,
  pandaFrame: FIRST_RUN_FRAME + (Math.floor(state.time * FRAMES_PER_MS) % RUN_FRAMES),
  floorScroll: (state.time * SCROLL_PX_PER_MS) % TILE_SIZE,
  boxes: boxesOf(state.columns, state.time),
  clouds: cloudsOf(state.clouds, state.time),
});

export const createRun = (random: Random, cloudRandom: Random): Run => {
  const randoms: Randoms = { columns: random, clouds: cloudRandom };
  let state = freshState(0, randoms);
  return {
    jump: () => {
      state = { ...state, panda: jump(state.panda) };
    },
    advance: (ms) => {
      state = advanceState(state, ms, randoms);
    },
    view: () => viewOf(state),
  };
};

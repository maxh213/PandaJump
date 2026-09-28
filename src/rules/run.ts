import { nextBest } from "./best.ts";
import type { BestStore } from "./best.ts";
import { SPAWN_EVERY, boxesOf, countCleared, hitsPanda, moveColumns, spawnColumns } from "./columns.ts";
import type { Box, Column, Random } from "./columns.ts";
import { cloudsOf, initialClouds, moveClouds } from "./clouds.ts";
import type { Cloud, CloudState } from "./clouds.ts";
import { fall, jump, standingPanda } from "./panda.ts";
import type { Panda } from "./panda.ts";
import { FLOOR_Y, PANDA_X, TILE_SIZE, speedForScore } from "./world.ts";

interface View {
  readonly time: number;
  readonly restarts: number;
  readonly score: string;
  readonly best: string;
  readonly newBest: boolean;
  readonly pandaX: number;
  readonly pandaBottom: number;
  readonly pandaFrame: number;
  readonly floorScroll: number;
  readonly boxes: Box[];
  readonly clouds: Cloud[];
  readonly gameOver: boolean;
  readonly canRestart: boolean;
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
  readonly rampTime: number;
  readonly rampDistance: number;
  readonly restarts: number;
  readonly score: number;
  readonly best: number;
  readonly calloutStart: number | null;
  readonly nextSpawn: number;
  readonly panda: Panda;
  readonly columns: readonly Column[];
  readonly clouds: readonly CloudState[];
  readonly deathElapsed: number | null;
}

const MAX_STEP = 10;
const FIRST_RUN_FRAME = 17;
const RUN_FRAMES = 6;
const FRAMES_PER_MS = 15 / 1000;
const NO_COLUMNS: readonly Column[] = [];
const RESTART_FREEZE_MS = 500;
const CALLOUT_DURATION_MS = 600;

const freshState = (restarts: number, best: number, randoms: Randoms): State => ({
  time: 0,
  rampTime: 0,
  rampDistance: 0,
  restarts,
  score: 0,
  best,
  calloutStart: null,
  nextSpawn: SPAWN_EVERY,
  panda: standingPanda,
  columns: NO_COLUMNS,
  clouds: initialClouds(randoms.clouds),
  deathElapsed: null,
});

const distanceAt = (state: State, time: number): number =>
  state.rampDistance + speedForScore(state.score) * (time - state.rampTime);

const currentDistance = (state: State): number => distanceAt(state, state.time);

const moveOn = (state: State, ms: number, randoms: Randoms): State => {
  const time = state.time + ms;
  const distance = distanceAt(state, time);
  const score = state.score + countCleared(state.columns, distance);
  const rampChanged = speedForScore(score) !== speedForScore(state.score);
  const best = nextBest(state.best, score);
  const calloutStart = state.calloutStart === null && best > state.best ? time : state.calloutStart;
  return {
    ...state,
    time,
    rampTime: rampChanged ? time : state.rampTime,
    rampDistance: rampChanged ? distance : state.rampDistance,
    panda: fall(state.panda, ms),
    score,
    best,
    calloutStart,
    columns: moveColumns(state.columns, distance),
    clouds: moveClouds(state.clouds, time, randoms.clouds),
  };
};

const spawnIfDue = (state: State, random: Random): State =>
  state.time < state.nextSpawn
    ? state
    : {
        ...state,
        columns: [...state.columns, ...spawnColumns(distanceAt(state, state.nextSpawn), state.score, random)],
        nextSpawn: state.nextSpawn + SPAWN_EVERY,
      };

const step = (state: State, ms: number, randoms: Randoms): State => {
  if (state.deathElapsed !== null) {
    return { ...state, deathElapsed: state.deathElapsed + ms };
  }
  const next = spawnIfDue(moveOn(state, ms, randoms), randoms.columns);
  return hitsPanda(next.columns, currentDistance(next), next.panda.height) ? { ...next, deathElapsed: 0 } : next;
};

const stepsOf = (ms: number): number[] =>
  Array.from({ length: Math.ceil(ms / MAX_STEP) }, (_, index) => Math.min(MAX_STEP, ms - index * MAX_STEP));

const advanceState = (state: State, ms: number, randoms: Randoms): State =>
  stepsOf(ms).reduce((current, part) => step(current, part, randoms), state);

const canRestart = (state: State): boolean => state.deathElapsed !== null && state.deathElapsed >= RESTART_FREEZE_MS;

const viewOf = (state: State): View => ({
  time: state.time,
  restarts: state.restarts,
  score: String(state.score),
  best: String(state.best),
  newBest: state.calloutStart !== null && state.time - state.calloutStart < CALLOUT_DURATION_MS,
  pandaX: PANDA_X,
  pandaBottom: FLOOR_Y - state.panda.height,
  pandaFrame: FIRST_RUN_FRAME + (Math.floor(state.time * FRAMES_PER_MS) % RUN_FRAMES),
  floorScroll: currentDistance(state) % TILE_SIZE,
  boxes: boxesOf(state.columns, currentDistance(state)),
  clouds: cloudsOf(state.clouds, state.time),
  gameOver: state.deathElapsed !== null,
  canRestart: canRestart(state),
});

const act = (state: State, randoms: Randoms): State => {
  if (state.deathElapsed === null) {
    return { ...state, panda: jump(state.panda) };
  }
  return canRestart(state) ? freshState(state.restarts + 1, state.best, randoms) : state;
};

export const createRun = (random: Random, cloudRandom: Random, store: BestStore): Run => {
  const randoms: Randoms = { columns: random, clouds: cloudRandom };
  let state = freshState(0, store.load(), randoms);
  return {
    jump: () => {
      state = act(state, randoms);
    },
    advance: (ms) => {
      const next = advanceState(state, ms, randoms);
      if (next.best !== state.best) {
        store.save(next.best);
      }
      state = next;
    },
    view: () => viewOf(state),
  };
};

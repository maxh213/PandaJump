import { nextBest } from "./best.ts";
import type { BestStore } from "./best.ts";
import { SPAWN_EVERY, bestColumnMarker, boxesOf, countCleared, hitsPanda, moveColumns, spawnColumns } from "./columns.ts";
import type { Box, Column, Random } from "./columns.ts";
import { cloudsOf, initialClouds, moveClouds } from "./clouds.ts";
import type { Cloud, CloudState } from "./clouds.ts";
import { medalFor } from "./medal.ts";
import type { Medal } from "./medal.ts";
import { fall, jump, standingPanda } from "./panda.ts";
import type { Panda } from "./panda.ts";
import { FLOOR_Y, PANDA_X, TILE_SIZE, speedForScore } from "./world.ts";

interface View {
  readonly time: number;
  readonly restarts: number;
  readonly score: string;
  readonly scoreScale: number;
  readonly best: string;
  readonly newBest: boolean;
  readonly overtookBest: boolean;
  readonly speedUp: boolean;
  readonly medal: Medal;
  readonly pandaX: number;
  readonly pandaBottom: number;
  readonly pandaFrame: number;
  readonly floorScroll: number;
  readonly boxes: Box[];
  readonly clouds: Cloud[];
  readonly gameOver: boolean;
  readonly canRestart: boolean;
  readonly paused: boolean;
  readonly pandaUpsideDown: boolean;
  readonly bestMarker: { x: number; y: number } | null;
  readonly deathFlash: number;
}

export interface Run {
  readonly jump: () => void;
  readonly pause: () => void;
  readonly pauseOrResume: () => void;
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
  readonly scorePopStart: number | null;
  readonly best: number;
  readonly startingBest: number;
  readonly calloutStart: number | null;
  readonly speedUpStart: number | null;
  readonly nextSpawn: number;
  readonly panda: Panda;
  readonly columns: readonly Column[];
  readonly clouds: readonly CloudState[];
  readonly deathElapsed: number | null;
  readonly paused: boolean;
}

const MAX_STEP = 10;
const FIRST_RUN_FRAME = 17;
const RUN_FRAMES = 6;
const FRAMES_PER_MS = 15 / 1000;
const NO_COLUMNS: readonly Column[] = [];
const RESTART_FREEZE_MS = 500;
const CALLOUT_DURATION_MS = 600;
const SCORE_POP_PEAK = 1.3;
const SCORE_POP_DURATION_MS = 150;
const SPEED_UP_DURATION_MS = 800;
const DEATH_FLASH_PEAK = 0.6;
const DEATH_FLASH_DURATION_MS = 200;

const freshState = (restarts: number, best: number, randoms: Randoms): State => ({
  time: 0,
  rampTime: 0,
  rampDistance: 0,
  restarts,
  score: 0,
  scorePopStart: null,
  best,
  startingBest: best,
  calloutStart: null,
  speedUpStart: null,
  nextSpawn: SPAWN_EVERY,
  panda: standingPanda,
  columns: NO_COLUMNS,
  clouds: initialClouds(randoms.clouds),
  deathElapsed: null,
  paused: false,
});

const distanceAt = (state: State, time: number): number =>
  state.rampDistance + speedForScore(state.score) * (time - state.rampTime);

const currentDistance = (state: State): number => distanceAt(state, state.time);

interface Advance {
  readonly time: number;
  readonly distance: number;
  readonly score: number;
}

interface Ramp extends Pick<State, "rampTime" | "rampDistance"> {
  readonly changed: boolean;
}

const nextRamp = (state: State, advance: Advance): Ramp =>
  speedForScore(advance.score) !== speedForScore(state.score)
    ? { rampTime: advance.time, rampDistance: advance.distance, changed: true }
    : { rampTime: state.rampTime, rampDistance: state.rampDistance, changed: false };

const nextSpeedUpStart = (state: State, ramp: Ramp, time: number): number | null =>
  ramp.changed ? time : state.speedUpStart;

const moveOn = (state: State, ms: number, randoms: Randoms): State => {
  const time = state.time + ms;
  const distance = distanceAt(state, time);
  const score = state.score + countCleared(state.columns, distance);
  const best = nextBest(state.best, score);
  const calloutStart = state.calloutStart === null && best > state.best ? time : state.calloutStart;
  const scorePopStart = score > state.score ? time : state.scorePopStart;
  const ramp = nextRamp(state, { time, distance, score });
  return {
    ...state,
    time,
    rampTime: ramp.rampTime,
    rampDistance: ramp.rampDistance,
    panda: fall(state.panda, ms),
    score,
    scorePopStart,
    best,
    calloutStart,
    speedUpStart: nextSpeedUpStart(state, ramp, time),
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
    return { ...state, deathElapsed: state.deathElapsed + ms, panda: fall(state.panda, ms) };
  }
  const next = spawnIfDue(moveOn(state, ms, randoms), randoms.columns);
  return hitsPanda(next.columns, currentDistance(next), next.panda.height)
    ? { ...next, panda: { ...next.panda, speed: 0 }, deathElapsed: 0 }
    : next;
};

const stepsOf = (ms: number): number[] =>
  Array.from({ length: Math.ceil(ms / MAX_STEP) }, (_, index) => Math.min(MAX_STEP, ms - index * MAX_STEP));

const advanceState = (state: State, ms: number, randoms: Randoms): State =>
  stepsOf(ms).reduce((current, part) => step(current, part, randoms), state);

const canRestart = (state: State): boolean => state.deathElapsed !== null && state.deathElapsed >= RESTART_FREEZE_MS;

const scoreScaleOf = (state: State): number => {
  if (state.scorePopStart === null) return 1;
  const elapsed = state.time - state.scorePopStart;
  return elapsed >= SCORE_POP_DURATION_MS
    ? 1
    : SCORE_POP_PEAK - (SCORE_POP_PEAK - 1) * (elapsed / SCORE_POP_DURATION_MS);
};

const isLive = (state: State): boolean => state.deathElapsed === null && !state.paused;

const isSpeedUp = (state: State): boolean =>
  isLive(state) && state.speedUpStart !== null && state.time - state.speedUpStart < SPEED_UP_DURATION_MS;

const liveBestMarker = (state: State): { x: number; y: number } | null =>
  isLive(state)
    ? bestColumnMarker(state.columns, currentDistance(state), { score: state.score, best: state.startingBest })
    : null;

const deathFlashOf = (deathElapsed: number | null): number =>
  deathElapsed === null ? 0 : Math.max(0, DEATH_FLASH_PEAK * (1 - deathElapsed / DEATH_FLASH_DURATION_MS));

const viewOf = (state: State): View => ({
  time: state.time,
  restarts: state.restarts,
  score: String(state.score),
  scoreScale: scoreScaleOf(state),
  best: String(state.best),
  newBest: state.calloutStart !== null && state.time - state.calloutStart < CALLOUT_DURATION_MS,
  overtookBest: state.calloutStart !== null,
  speedUp: isSpeedUp(state),
  medal: medalFor(state.score),
  pandaX: PANDA_X,
  pandaBottom: FLOOR_Y - state.panda.height,
  pandaFrame: FIRST_RUN_FRAME + (Math.floor(state.time * FRAMES_PER_MS) % RUN_FRAMES),
  floorScroll: currentDistance(state) % TILE_SIZE,
  boxes: boxesOf(state.columns, currentDistance(state)),
  clouds: cloudsOf(state.clouds, state.time),
  gameOver: state.deathElapsed !== null,
  canRestart: canRestart(state),
  paused: state.paused,
  pandaUpsideDown: state.deathElapsed !== null,
  bestMarker: liveBestMarker(state),
  deathFlash: deathFlashOf(state.deathElapsed),
});

const act = (state: State, randoms: Randoms): State => {
  if (state.paused) {
    return { ...state, paused: false };
  }
  if (state.deathElapsed === null) {
    return { ...state, panda: jump(state.panda) };
  }
  return canRestart(state) ? freshState(state.restarts + 1, state.best, randoms) : state;
};

const pausedState = (state: State): State => (state.deathElapsed === null ? { ...state, paused: true } : state);

const togglePause = (state: State): State => (state.paused ? { ...state, paused: false } : pausedState(state));

export const createRun = (random: Random, cloudRandom: Random, store: BestStore): Run => {
  const randoms: Randoms = { columns: random, clouds: cloudRandom };
  let state = freshState(0, store.load(), randoms);
  return {
    jump: () => {
      state = act(state, randoms);
    },
    pause: () => {
      state = pausedState(state);
    },
    pauseOrResume: () => {
      state = togglePause(state);
    },
    advance: (ms) => {
      if (state.paused) return;
      const next = advanceState(state, ms, randoms);
      if (next.best !== state.best) {
        store.save(next.best);
      }
      state = next;
    },
    view: () => viewOf(state),
  };
};

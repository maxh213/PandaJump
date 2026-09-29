import { nextBest } from "./best.ts";
import type { BestStore } from "./best.ts";
import {
  bestColumnMarker,
  boxesOf,
  countCleared,
  moveColumns,
  spawnColumns,
  touchingColumn,
} from "./columns.ts";
import type { Box, Column, Random } from "./columns.ts";
import { cloudsOf, initialClouds, moveClouds } from "./clouds.ts";
import type { Cloud, CloudState } from "./clouds.ts";
import { hillColorFor, hillsScrollFor } from "./hills.ts";
import { medalFor, medalGoalFor } from "./medal.ts";
import type { Medal } from "./medal.ts";
import { fall, jump, standingPanda } from "./panda.ts";
import type { Panda } from "./panda.ts";
import { skyFor } from "./sky.ts";
import { starsFor } from "./stars.ts";
import type { Star } from "./stars.ts";
import { FLOOR_Y, PANDA_X, TILE_SIZE, spawnGapForScore, speedForScore } from "./world.ts";

interface View {
  readonly ready: boolean;
  readonly time: number;
  readonly restarts: number;
  readonly score: string;
  readonly gameOverScore: string;
  readonly scoreScale: number;
  readonly best: string;
  readonly newBest: boolean;
  readonly overtookBest: boolean;
  readonly speedUp: boolean;
  readonly medal: Medal;
  readonly medalGoal: string;
  readonly sky: string;
  readonly stars: readonly Star[];
  readonly pandaX: number;
  readonly pandaBottom: number;
  readonly pandaFrame: number;
  readonly floorScroll: number;
  readonly hillsScroll: number;
  readonly hillColor: string;
  readonly boxes: Box[];
  readonly clouds: Cloud[];
  readonly gameOver: boolean;
  readonly canRestart: boolean;
  readonly paused: boolean;
  readonly countdown: number | null;
  readonly pandaUpsideDown: boolean;
  readonly bestMarker: { x: number; y: number } | null;
  readonly deathFlash: number;
  readonly pandaAngle: number;
  readonly airPuff: { x: number; y: number; alpha: number } | null;
  readonly doubleJumpHint: boolean;
  readonly pandaShadow: { x: number; y: number; scale: number };
  readonly landingPuff: { x: number; y: number; alpha: number } | null;
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
  readonly ready: boolean;
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
  readonly hitColumn: Column | null;
  readonly paused: boolean;
  readonly resumeElapsed: number | null;
  readonly airPuffStart: number | null;
  readonly airPuffBottom: number;
  readonly hintPending: boolean;
  readonly bufferedAt: number | null;
  readonly landingStart: number | null;
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
const MAX_PANDA_ANGLE = 25;
const PANDA_ANGLE_PER_SPEED = 20;
const COUNTDOWN_MS = 1500;
const COUNTDOWN_STEP_MS = 500;
const AIR_PUFF_DURATION_MS = 250;
const SHADOW_PEAK_HEIGHT = 168;
const LANDING_PUFF_DURATION_MS = 200;
const HINT_BELOW_SCORE = 3;
const JUMP_BUFFER_MS = 100;
const PANDA_CENTER_X = PANDA_X + 12.5;

type Carried = Pick<State, "restarts" | "best" | "hintPending">;

const freshState = ({ restarts, best, hintPending }: Carried, randoms: Randoms): State => ({
  ready: false,
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
  nextSpawn: spawnGapForScore(0),
  panda: standingPanda,
  columns: NO_COLUMNS,
  clouds: initialClouds(randoms.clouds),
  deathElapsed: null,
  hitColumn: null,
  paused: false,
  resumeElapsed: null,
  airPuffStart: null,
  airPuffBottom: 0,
  hintPending,
  bufferedAt: null,
  landingStart: null,
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

const nextLandingStart = (state: State, panda: Panda, time: number): number | null =>
  state.panda.height > 0 && panda.height === 0 ? time : state.landingStart;

const moveOn = (state: State, ms: number, randoms: Randoms): State => {
  const time = state.time + ms;
  const distance = distanceAt(state, time);
  const score = state.score + countCleared(state.columns, distance);
  const best = nextBest(state.best, score);
  const calloutStart = state.calloutStart === null && best > state.best ? time : state.calloutStart;
  const scorePopStart = score > state.score ? time : state.scorePopStart;
  const ramp = nextRamp(state, { time, distance, score });
  const panda = fall(state.panda, ms);
  return {
    ...state,
    time,
    rampTime: ramp.rampTime,
    rampDistance: ramp.rampDistance,
    panda,
    landingStart: nextLandingStart(state, panda, time),
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
        nextSpawn: state.nextSpawn + spawnGapForScore(state.score),
      };

const landedFrom = (before: Panda, state: State): boolean => before.height > 0 && state.panda.height === 0;

const settleBuffer = (state: State, bufferedAt: number): State => ({
  ...state,
  panda: state.time - bufferedAt <= JUMP_BUFFER_MS ? jump(state.panda) : state.panda,
  bufferedAt: null,
});

const reboundIfBuffered = (before: Panda, state: State): State =>
  state.bufferedAt !== null && landedFrom(before, state) ? settleBuffer(state, state.bufferedAt) : state;

const step = (state: State, ms: number, randoms: Randoms): State => {
  if (state.deathElapsed !== null) {
    return { ...state, deathElapsed: state.deathElapsed + ms, panda: fall(state.panda, ms) };
  }
  const next = spawnIfDue(moveOn(state, ms, randoms), randoms.columns);
  const hitColumn = touchingColumn(next.columns, currentDistance(next), next.panda.height);
  return hitColumn !== null
    ? { ...next, panda: { ...next.panda, speed: 0 }, deathElapsed: 0, hitColumn }
    : reboundIfBuffered(state.panda, next);
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

const pandaAngleFor = (state: State): number => {
  if (state.deathElapsed !== null) return 0;
  const raw = -state.panda.speed / PANDA_ANGLE_PER_SPEED;
  return Math.max(-MAX_PANDA_ANGLE, Math.min(MAX_PANDA_ANGLE, raw)) + 0;
};

const countdownDigit = (elapsed: number): number => 3 - Math.min(2, Math.floor(elapsed / COUNTDOWN_STEP_MS));

interface Ticked {
  readonly state: State;
  readonly worldMs: number;
}

const tickCountdown = (state: State, elapsed: number, ms: number): Ticked => {
  const total = elapsed + ms;
  return total < COUNTDOWN_MS
    ? { state: { ...state, resumeElapsed: total }, worldMs: 0 }
    : { state: { ...state, paused: false, resumeElapsed: null }, worldMs: total - COUNTDOWN_MS };
};

const stepAdvance = (state: State, ms: number, randoms: Randoms): State => {
  const ticked = state.resumeElapsed === null ? { state, worldMs: ms } : tickCountdown(state, state.resumeElapsed, ms);
  return advanceState(ticked.state, ticked.worldMs, randoms);
};

const airPuffOf = (state: State): View["airPuff"] => {
  if (state.airPuffStart === null || state.deathElapsed !== null) return null;
  const elapsed = state.time - state.airPuffStart;
  return elapsed < AIR_PUFF_DURATION_MS
    ? { x: PANDA_CENTER_X, y: state.airPuffBottom, alpha: 1 - elapsed / AIR_PUFF_DURATION_MS }
    : null;
};

const landingPuffOf = (state: State): View["landingPuff"] => {
  if (state.landingStart === null || state.deathElapsed !== null) return null;
  const elapsed = state.time - state.landingStart;
  return elapsed < LANDING_PUFF_DURATION_MS
    ? { x: PANDA_CENTER_X, y: FLOOR_Y, alpha: 1 - elapsed / LANDING_PUFF_DURATION_MS }
    : null;
};

const doubleJumpHintOf = (state: State): boolean =>
  state.hintPending && !state.ready && isLive(state) && state.score < HINT_BELOW_SCORE;

const pandaFrameOf = (state: State): number =>
  isLive(state) && state.panda.height > 0
    ? FIRST_RUN_FRAME
    : FIRST_RUN_FRAME + (Math.floor(state.time * FRAMES_PER_MS) % RUN_FRAMES);

const pandaShadowOf = (state: State): View["pandaShadow"] => ({
  x: PANDA_CENTER_X,
  y: FLOOR_Y,
  scale: 1 - (0.5 * Math.min(state.panda.height, SHADOW_PEAK_HEIGHT)) / SHADOW_PEAK_HEIGHT,
});

const gameOverScoreOf = (state: State): string =>
  state.deathElapsed === null || state.deathElapsed >= RESTART_FREEZE_MS
    ? String(state.score)
    : String(Math.floor((state.score * state.deathElapsed) / RESTART_FREEZE_MS));

const viewOf = (state: State): View => ({
  ready: state.ready,
  time: state.time,
  restarts: state.restarts,
  score: String(state.score),
  gameOverScore: gameOverScoreOf(state),
  scoreScale: scoreScaleOf(state),
  best: String(state.best),
  newBest: state.calloutStart !== null && state.time - state.calloutStart < CALLOUT_DURATION_MS,
  overtookBest: state.calloutStart !== null,
  speedUp: isSpeedUp(state),
  medal: medalFor(state.score),
  medalGoal: medalGoalFor(medalFor(state.score)),
  sky: skyFor(state.score),
  stars: starsFor(state.score),
  pandaX: PANDA_X,
  pandaBottom: FLOOR_Y - state.panda.height,
  pandaFrame: pandaFrameOf(state),
  floorScroll: currentDistance(state) % TILE_SIZE,
  hillsScroll: hillsScrollFor(currentDistance(state)),
  hillColor: hillColorFor(state.score),
  boxes: boxesOf(state.columns, currentDistance(state), state.hitColumn),
  clouds: cloudsOf(state.clouds, state.time),
  gameOver: state.deathElapsed !== null,
  canRestart: canRestart(state),
  paused: state.paused && state.resumeElapsed === null,
  countdown: state.resumeElapsed === null ? null : countdownDigit(state.resumeElapsed),
  pandaUpsideDown: state.deathElapsed !== null,
  bestMarker: liveBestMarker(state),
  deathFlash: deathFlashOf(state.deathElapsed),
  pandaAngle: pandaAngleFor(state),
  airPuff: airPuffOf(state),
  doubleJumpHint: doubleJumpHintOf(state),
  pandaShadow: pandaShadowOf(state),
  landingPuff: landingPuffOf(state),
});

const resume = (state: State): State => (state.resumeElapsed === null ? { ...state, resumeElapsed: 0 } : state);

const airPuffAfterJump = (state: State, panda: Panda): Pick<State, "airPuffStart" | "airPuffBottom"> =>
  state.panda.airJump && !panda.airJump
    ? { airPuffStart: state.time, airPuffBottom: FLOOR_Y - state.panda.height }
    : { airPuffStart: state.airPuffStart, airPuffBottom: state.airPuffBottom };

const hintAfterJump = (state: State, panda: Panda): Pick<State, "hintPending"> => ({
  hintPending: state.hintPending && !(state.panda.airJump && !panda.airJump),
});

const jumpLive = (state: State): State => {
  const panda = jump(state.panda);
  const bufferedAt = panda === state.panda ? state.time : state.bufferedAt;
  return { ...state, panda, bufferedAt, ...hintAfterJump(state, panda), ...airPuffAfterJump(state, panda) };
};

const frozenAct = (state: State): State | null => {
  if (state.ready) return { ...state, ready: false };
  if (state.paused) return resume(state);
  return null;
};

const act = (state: State, randoms: Randoms): State => {
  const frozen = frozenAct(state);
  if (frozen !== null) return frozen;
  if (state.deathElapsed === null) {
    return jumpLive(state);
  }
  return canRestart(state) ? freshState({ restarts: state.restarts + 1, best: state.best, hintPending: state.hintPending }, randoms) : state;
};

const isFrozen = (state: State): boolean => state.ready || (state.paused && state.resumeElapsed === null);

const pausedState = (state: State): State =>
  state.ready || state.deathElapsed !== null
    ? state
    : { ...state, paused: true, resumeElapsed: null, bufferedAt: null };

const togglePause = (state: State): State => (state.paused ? resume(state) : pausedState(state));

export const createRun = (random: Random, cloudRandom: Random, store: BestStore): Run => {
  const randoms: Randoms = { columns: random, clouds: cloudRandom };
  const loadedBest = store.load();
  let state: State = {
    ...freshState({ restarts: 0, best: loadedBest, hintPending: loadedBest === 0 }, randoms),
    ready: true,
  };
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
      if (isFrozen(state)) return;
      const next = stepAdvance(state, ms, randoms);
      if (next.best !== state.best) {
        store.save(next.best);
      }
      state = next;
    },
    view: () => viewOf(state),
  };
};

import { nextBest } from "./best.ts";
import type { BestStore } from "./best.ts";
import {
  bestColumnMarker,
  boxesOf,
  columnX,
  countCleared,
  moveColumns,
  spawnColumns,
  surfaceHeightUnder,
  touchingColumn,
} from "./columns.ts";
import type { Box, Column, Random } from "./columns.ts";
import { cloudsOf, initialClouds, moveClouds } from "./clouds.ts";
import type { Cloud, CloudState } from "./clouds.ts";
import { BIOME_FADE_MS, biomeFadeProgress, biomeFor, mixHex, starsAlphaFor } from "./biome.ts";
import type { Biome } from "./biome.ts";
import { hillsScrollFor } from "./hills.ts";
import { medalFor, medalGoalFor } from "./medal.ts";
import type { Medal } from "./medal.ts";
import { fall, jump, standingPanda } from "./panda.ts";
import type { Panda } from "./panda.ts";
import { starsForFade } from "./stars.ts";
import type { Star } from "./stars.ts";
import { insertScore } from "./top-scores.ts";
import type { TopScoresStore } from "./top-scores.ts";
import { FLOOR_Y, PANDA_X, TILE_SIZE, spawnGapForScore, speedForScore } from "./world.ts";

export type Placing = 0 | 2 | 3 | 4 | 5;

interface View {
  readonly ready: boolean;
  readonly time: number;
  readonly restarts: number;
  readonly score: string;
  readonly gameOverScore: string;
  readonly scoreScale: number;
  readonly best: string;
  readonly topScores: readonly number[];
  readonly newBest: boolean;
  readonly overtookBest: boolean;
  readonly placing: Placing;
  readonly speedUp: boolean;
  readonly medal: Medal;
  readonly medalGoal: string;
  readonly biome: Biome;
  readonly sky: string;
  readonly stars: readonly Star[];
  readonly starsAlpha: number;
  readonly sceneryFrom: Biome;
  readonly sceneryTo: Biome;
  readonly sceneryFade: number;
  readonly sceneryLayer: {
    readonly base: Biome;
    readonly overlay: Biome;
    readonly baseAlpha: number;
    readonly overlayAlpha: number;
    readonly overlayVisible: boolean;
  };
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
  readonly deathShake: { x: number; y: number };
  readonly pandaAngle: number;
  readonly pandaScaleX: number;
  readonly pandaScaleY: number;
  readonly airPuff: { x: number; y: number; alpha: number } | null;
  readonly doubleJumpHint: boolean;
  readonly pandaShadow: { x: number; y: number; scale: number };
  readonly landingPuff: { x: number; y: number; alpha: number } | null;
  readonly impactBurst: { x: number; y: number; progress: number } | null;
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
  readonly idle: number;
  readonly rampTime: number;
  readonly rampDistance: number;
  readonly restarts: number;
  readonly score: number;
  readonly scorePopStart: number | null;
  readonly best: number;
  readonly topScores: readonly number[];
  readonly startingBest: number;
  readonly placing: Placing;
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
  readonly jumpStart: number | null;
  readonly fadeFrom: Biome | null;
  readonly fadeStart: number | null;
  readonly pandaX: number;
  readonly knockbackEndX: number;
  readonly impactX: number;
  readonly impactY: number;
}

interface Squash {
  readonly x: number;
  readonly y: number;
}

const MAX_STEP = 10;
const FIRST_RUN_FRAME = 17;
const RUN_FRAMES = 6;
const FRAMES_PER_MS = 15 / 1000;
const NO_COLUMNS: readonly Column[] = [];
const NO_SCORES: readonly number[] = [];
const RESTART_FREEZE_MS = 500;
const NOT_PLACED: Placing = 0;
const SHOWN_PLACINGS = [2, 3, 4, 5] as const;
const CALLOUT_DURATION_MS = 600;
const SCORE_POP_PEAK = 1.3;
const SCORE_POP_DURATION_MS = 150;
const SPEED_UP_DURATION_MS = 800;
const DEATH_FLASH_PEAK = 0.6;
const DEATH_FLASH_DURATION_MS = 200;
const DEATH_SHAKE_PEAK = 6;
const DEATH_SHAKE_DURATION_MS = 200;
const DEATH_SHAKE_X_RATE = Math.PI / 25;
const DEATH_SHAKE_Y_RATE = Math.PI / 20;
const NO_SHAKE = { x: 0, y: 0 };
const MAX_PANDA_ANGLE = 25;
const PANDA_ANGLE_PER_SPEED = 20;
const COUNTDOWN_MS = 1500;
const COUNTDOWN_STEP_MS = 500;
const AIR_PUFF_DURATION_MS = 250;
const SHADOW_PEAK_HEIGHT = 168;
const LANDING_PUFF_DURATION_MS = 200;
const HINT_BELOW_SCORE = 3;
const JUMP_BUFFER_MS = 100;
const SQUASH_MS = 120;
const STRETCH: Squash = { x: 0.8, y: 1.2 };
const SQUASH: Squash = { x: 1.2, y: 0.8 };
const IMPACT_SQUASH: Squash = { x: 0.8, y: 1.15 };
const PANDA_HALF = 12.5;
const HITBOX_RIGHT_OFFSET = 22;
const KNOCKBACK_CLEARANCE = 2;
const KNOCKBACK_MS = 250;
const IMPACT_BURST_MS = 250;
const DEATH_BOUNCE_SPEED = 200;

type Carried = Pick<State, "restarts" | "best" | "topScores" | "hintPending">;

const freshState = ({ restarts, best, topScores, hintPending }: Carried, randoms: Randoms): State => ({
  ready: false,
  time: 0,
  idle: 0,
  rampTime: 0,
  rampDistance: 0,
  restarts,
  score: 0,
  scorePopStart: null,
  best,
  topScores,
  startingBest: best,
  placing: NOT_PLACED,
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
  jumpStart: null,
  fadeFrom: null,
  fadeStart: null,
  pandaX: PANDA_X,
  knockbackEndX: PANDA_X,
  impactX: 0,
  impactY: 0,
});

const distanceAt = (state: State, time: number): number =>
  state.rampDistance + speedForScore(state.score) * (time - state.rampTime);

const clockOf = (state: State): number => state.time + state.idle;

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

const fadeDone = (state: State, time: number): boolean =>
  state.fadeStart !== null && time - state.fadeStart >= BIOME_FADE_MS;

const nextFade = (state: State, score: number, time: number): Pick<State, "fadeFrom" | "fadeStart"> =>
  biomeFor(score) === biomeFor(state.score)
    ? fadeDone(state, time)
      ? { fadeFrom: null, fadeStart: null }
      : { fadeFrom: state.fadeFrom, fadeStart: state.fadeStart }
    : { fadeFrom: biomeFor(state.score), fadeStart: time };

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
    clouds: moveClouds(state.clouds, time + state.idle, randoms.clouds),
    ...nextFade(state, score, time),
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

const jumpStartAfter = (state: State, panda: Panda): number | null =>
  state.panda.height === 0 && panda !== state.panda ? state.time : state.jumpStart;

const settleBuffer = (state: State, bufferedAt: number): State => {
  const panda = state.time - bufferedAt <= JUMP_BUFFER_MS ? jump(state.panda) : state.panda;
  return { ...state, panda, jumpStart: jumpStartAfter(state, panda), bufferedAt: null };
};

const reboundIfBuffered = (before: Panda, state: State): State =>
  state.bufferedAt !== null && landedFrom(before, state) ? settleBuffer(state, state.bufferedAt) : state;

const knockbackProgress = (deathElapsed: number): number => {
  const t = Math.min(1, deathElapsed / KNOCKBACK_MS);
  return 1 - (1 - t) * (1 - t);
};

const pandaXAt = (knockbackEndX: number, deathElapsed: number): number =>
  PANDA_X + (knockbackEndX - PANDA_X) * knockbackProgress(deathElapsed);

const CORNER_CLIP = 12;

const impactPoint = (column: Column, distance: number, height: number): { x: number; y: number } => {
  const left = columnX(column, distance);
  const columnTop = column.boxes * TILE_SIZE;
  const corner = height >= columnTop - CORNER_CLIP;
  return { x: left, y: FLOOR_Y - (corner ? columnTop : height) };
};

const knockbackEndFor = (column: Column, distance: number): number =>
  columnX(column, distance) - HITBOX_RIGHT_OFFSET - KNOCKBACK_CLEARANCE;

const dieAgainst = (state: State, hitColumn: Column): State => {
  const distance = currentDistance(state);
  const impact = impactPoint(hitColumn, distance, state.panda.height);
  return {
    ...state,
    panda: { ...state.panda, speed: DEATH_BOUNCE_SPEED },
    deathElapsed: 0,
    hitColumn,
    knockbackEndX: knockbackEndFor(hitColumn, distance),
    impactX: impact.x,
    impactY: impact.y,
  };
};

const stepDeath = (state: State, deathElapsed: number, ms: number): State => {
  const nextElapsed = deathElapsed + ms;
  return {
    ...state,
    deathElapsed: nextElapsed,
    panda: fall(state.panda, ms),
    pandaX: pandaXAt(state.knockbackEndX, nextElapsed),
  };
};

const step = (state: State, ms: number, randoms: Randoms): State => {
  if (state.deathElapsed !== null) {
    return stepDeath(state, state.deathElapsed, ms);
  }
  const next = spawnIfDue(moveOn(state, ms, randoms), randoms.columns);
  const hitColumn = touchingColumn(next.columns, currentDistance(next), next.panda.height);
  return hitColumn !== null ? dieAgainst(next, hitColumn) : reboundIfBuffered(state.panda, next);
};

const idleStep = (state: State, ms: number, randoms: Randoms): State => ({
  ...state,
  idle: state.idle + ms,
  rampDistance: state.rampDistance + speedForScore(0) * ms,
  clouds: moveClouds(state.clouds, state.idle + ms, randoms.clouds),
});

const stepsOf = (ms: number): number[] =>
  Array.from({ length: Math.ceil(ms / MAX_STEP) }, (_, index) => Math.min(MAX_STEP, ms - index * MAX_STEP));

const advanceState = (state: State, ms: number, randoms: Randoms): State =>
  stepsOf(ms).reduce((current, part) => step(current, part, randoms), state);

const idleAdvance = (state: State, ms: number, randoms: Randoms): State =>
  stepsOf(ms).reduce((current, part) => idleStep(current, part, randoms), state);

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

const deathShakeOf = (deathElapsed: number | null): View["deathShake"] => {
  if (deathElapsed === null || deathElapsed >= DEATH_SHAKE_DURATION_MS) return NO_SHAKE;
  const amplitude = DEATH_SHAKE_PEAK * (1 - deathElapsed / DEATH_SHAKE_DURATION_MS);
  return {
    x: amplitude * Math.sin(deathElapsed * DEATH_SHAKE_X_RATE) + 0,
    y: amplitude * Math.cos(deathElapsed * DEATH_SHAKE_Y_RATE) + 0,
  };
};

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

const easedScale = (peak: number, elapsed: number): number =>
  1 + (peak - 1) * Math.max(0, 1 - elapsed / SQUASH_MS);

const startOf = (time: number | null): number => time ?? -Infinity;

const latestSquash = (state: State): { start: number; shape: Squash } =>
  startOf(state.landingStart) > startOf(state.jumpStart)
    ? { start: startOf(state.landingStart), shape: SQUASH }
    : { start: startOf(state.jumpStart), shape: STRETCH };

const pandaScaleOf = (state: State): Squash => {
  if (state.deathElapsed !== null) {
    return {
      x: easedScale(IMPACT_SQUASH.x, state.deathElapsed),
      y: easedScale(IMPACT_SQUASH.y, state.deathElapsed),
    };
  }
  const { start, shape } = latestSquash(state);
  const elapsed = state.time - start;
  return { x: easedScale(shape.x, elapsed), y: easedScale(shape.y, elapsed) };
};

const pandaScaleFieldsOf = (state: State): Pick<View, "pandaScaleX" | "pandaScaleY"> => {
  const { x, y } = pandaScaleOf(state);
  return { pandaScaleX: x, pandaScaleY: y };
};

const airPuffOf = (state: State): View["airPuff"] => {
  if (state.airPuffStart === null || state.deathElapsed !== null) return null;
  const elapsed = state.time - state.airPuffStart;
  return elapsed < AIR_PUFF_DURATION_MS
    ? { x: state.pandaX + PANDA_HALF, y: state.airPuffBottom, alpha: 1 - elapsed / AIR_PUFF_DURATION_MS }
    : null;
};

const landingPuffOf = (state: State): View["landingPuff"] => {
  if (state.landingStart === null || state.deathElapsed !== null) return null;
  const elapsed = state.time - state.landingStart;
  return elapsed < LANDING_PUFF_DURATION_MS
    ? { x: state.pandaX + PANDA_HALF, y: FLOOR_Y, alpha: 1 - elapsed / LANDING_PUFF_DURATION_MS }
    : null;
};

const impactBurstOf = (state: State): View["impactBurst"] => {
  if (state.deathElapsed === null || state.deathElapsed >= IMPACT_BURST_MS) return null;
  return {
    x: state.impactX,
    y: state.impactY,
    progress: state.deathElapsed / IMPACT_BURST_MS,
  };
};

const doubleJumpHintOf = (state: State): boolean =>
  state.hintPending && !state.ready && isLive(state) && state.score < HINT_BELOW_SCORE;

const pandaFrameOf = (state: State): number =>
  isLive(state) && state.panda.height > 0
    ? FIRST_RUN_FRAME
    : FIRST_RUN_FRAME + (Math.floor(clockOf(state) * FRAMES_PER_MS) % RUN_FRAMES);

const pandaShadowOf = (state: State): View["pandaShadow"] => {
  const x = state.pandaX + PANDA_HALF;
  const surfaceHeight = surfaceHeightUnder(state.columns, currentDistance(state), x);
  const heightAbove = Math.max(0, state.panda.height - surfaceHeight);
  return {
    x,
    y: FLOOR_Y - surfaceHeight,
    scale: 1 - (0.5 * Math.min(heightAbove, SHADOW_PEAK_HEIGHT)) / SHADOW_PEAK_HEIGHT,
  };
};

const gameOverScoreOf = (state: State): string =>
  state.deathElapsed === null || state.deathElapsed >= RESTART_FREEZE_MS
    ? String(state.score)
    : String(Math.floor((state.score * state.deathElapsed) / RESTART_FREEZE_MS));

const placingOf = (state: State): Placing => (canRestart(state) ? state.placing : NOT_PLACED);

const topScoresOf = (state: State): readonly number[] => (state.ready ? state.topScores : NO_SCORES);

const scoreViewOf = (state: State) => ({
  score: String(state.score),
  gameOverScore: gameOverScoreOf(state),
  scoreScale: scoreScaleOf(state),
  best: String(state.best),
  topScores: topScoresOf(state),
  newBest: state.calloutStart !== null && state.time - state.calloutStart < CALLOUT_DURATION_MS,
  overtookBest: state.calloutStart !== null,
  placing: placingOf(state),
  speedUp: isSpeedUp(state),
  medal: medalFor(state.score),
  medalGoal: medalGoalFor(medalFor(state.score)),
  bestMarker: liveBestMarker(state),
});

const fadeElapsed = (state: State): number | null =>
  state.fadeStart === null ? null : state.time - state.fadeStart;

const sceneryPairOf = (state: State) => {
  const to = biomeFor(state.score);
  return {
    from: state.fadeFrom ?? to,
    to,
    progress: biomeFadeProgress(fadeElapsed(state)),
  };
};

const sceneryLayerOf = (from: Biome, to: Biome, progress: number) => {
  const fading = Number(progress < 1);
  return {
    base: fading === 0 ? to : from,
    overlay: to,
    baseAlpha: 1 - fading * progress,
    overlayAlpha: fading * progress,
    overlayVisible: Boolean(fading),
  };
};

const sceneryViewOf = (state: State) => {
  const { from, to, progress } = sceneryPairOf(state);
  return {
    biome: to,
    sky: mixHex(from.sky, to.sky, progress),
    stars: starsForFade(from, to, progress),
    starsAlpha: starsAlphaFor(from, to, progress),
    sceneryFrom: from,
    sceneryTo: to,
    sceneryFade: progress,
    sceneryLayer: sceneryLayerOf(from, to, progress),
    floorScroll: currentDistance(state) % TILE_SIZE,
    hillsScroll: hillsScrollFor(currentDistance(state)),
    hillColor: mixHex(from.hills, to.hills, progress),
    boxes: boxesOf(state.columns, currentDistance(state), state.hitColumn),
    clouds: cloudsOf(state.clouds, clockOf(state)),
  };
};

const pandaViewOf = (state: State) => ({
  pandaX: state.pandaX,
  pandaBottom: FLOOR_Y - state.panda.height,
  pandaFrame: pandaFrameOf(state),
  pandaUpsideDown: state.deathElapsed !== null,
  pandaAngle: pandaAngleFor(state),
  ...pandaScaleFieldsOf(state),
  airPuff: airPuffOf(state),
  pandaShadow: pandaShadowOf(state),
  landingPuff: landingPuffOf(state),
  impactBurst: impactBurstOf(state),
});

const viewOf = (state: State): View => ({
  ready: state.ready,
  time: state.time,
  restarts: state.restarts,
  ...scoreViewOf(state),
  ...sceneryViewOf(state),
  ...pandaViewOf(state),
  gameOver: state.deathElapsed !== null,
  canRestart: canRestart(state),
  paused: state.paused && state.resumeElapsed === null,
  countdown: state.resumeElapsed === null ? null : countdownDigit(state.resumeElapsed),
  deathFlash: deathFlashOf(state.deathElapsed),
  deathShake: deathShakeOf(state.deathElapsed),
  doubleJumpHint: doubleJumpHintOf(state),
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
  return { ...state, panda, bufferedAt, jumpStart: jumpStartAfter(state, panda), ...hintAfterJump(state, panda), ...airPuffAfterJump(state, panda) };
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
  const carried: Carried = {
    restarts: state.restarts + 1,
    best: state.best,
    topScores: state.topScores,
    hintPending: state.hintPending,
  };
  return canRestart(state) ? freshState(carried, randoms) : state;
};

const isFrozen = (state: State): boolean => state.paused && state.resumeElapsed === null;

const pausedState = (state: State): State =>
  state.ready || state.deathElapsed !== null
    ? state
    : { ...state, paused: true, resumeElapsed: null, bufferedAt: null };

const togglePause = (state: State): State => (state.paused && state.resumeElapsed === null ? resume(state) : pausedState(state));

const noTopScores: TopScoresStore = { load: () => NO_SCORES, save: () => undefined };

const rankedPlacing = (before: State, after: State): Placing => {
  const placing = 1 + before.topScores.filter((kept) => kept > after.score).length;
  return SHOWN_PLACINGS.find((shown) => shown === placing) ?? NOT_PLACED;
};

const shownPlacing = (before: State, after: State): Placing =>
  after.score > 0 && after.calloutStart === null ? rankedPlacing(before, after) : NOT_PLACED;

const recordFinishedRun = (before: State, after: State, store: TopScoresStore): State => {
  if (before.deathElapsed !== null || after.deathElapsed === null) return after;
  const topScores = insertScore(after.topScores, after.score);
  store.save(topScores);
  return { ...after, topScores, placing: shownPlacing(before, after) };
};

const reconcileTopScores = (best: number, loaded: readonly number[], store: TopScoresStore): readonly number[] => {
  if (best <= 0 || loaded.some((score) => score >= best)) return loaded;
  const merged = insertScore(loaded, best);
  store.save(merged);
  return merged;
};

export const createRun = (random: Random, cloudRandom: Random, store: BestStore): Run => {
  const topScoresStore = store.topScores ?? noTopScores;
  const randoms: Randoms = { columns: random, clouds: cloudRandom };
  const loadedBest = store.load();
  let state: State = {
    ...freshState(
      { restarts: 0, best: loadedBest, topScores: reconcileTopScores(loadedBest, topScoresStore.load(), topScoresStore), hintPending: loadedBest === 0 },
      randoms,
    ),
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
      if (state.ready) {
        state = idleAdvance(state, ms, randoms);
        return;
      }
      if (isFrozen(state)) return;
      const next = stepAdvance(state, ms, randoms);
      if (next.best !== state.best) {
        store.save(next.best);
      }
      state = recordFinishedRun(state, next, topScoresStore);
    },
    view: () => viewOf(state),
  };
};

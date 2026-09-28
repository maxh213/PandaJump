export const CANVAS_WIDTH = 400;
export const CANVAS_HEIGHT = 490;
export const FLOOR_Y = 426;
export const TILE_SIZE = 64;
const SCROLL_PX_PER_MS = 0.2;
export const PANDA_X = 100;

const RAMP_START_SCORE = 20;
const RAMP_STEP_SCORE = 10;
const RAMP_STEP_PX_PER_MS = 0.02;
const RAMP_MAX_PX_PER_MS = 0.3;

export const speedForScore = (score: number): number => {
  if (score < RAMP_START_SCORE) return SCROLL_PX_PER_MS;
  const steps = Math.floor((score - RAMP_START_SCORE) / RAMP_STEP_SCORE) + 1;
  return Math.min(SCROLL_PX_PER_MS + steps * RAMP_STEP_PX_PER_MS, RAMP_MAX_PX_PER_MS);
};

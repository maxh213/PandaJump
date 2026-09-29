export const HILLS_REPEAT_WIDTH = 160;
const HILLS_SPEED_RATIO = 4;

const HILL_THRESHOLDS: readonly (readonly [number, string])[] = [
  [0, "#4a9ba6"],
  [20, "#c97b3a"],
  [40, "#1a1b2b"],
];

export const hillsScrollFor = (distance: number): number => (distance / HILLS_SPEED_RATIO) % HILLS_REPEAT_WIDTH;

export const hillColorFor = (score: number): string =>
  HILL_THRESHOLDS.reduce((color, [threshold, candidate]) => (score >= threshold ? candidate : color), "#4a9ba6");

const SKY_THRESHOLDS: readonly (readonly [number, string])[] = [
  [0, "#71c5cf"],
  [20, "#f4a261"],
  [40, "#2b2d42"],
];

export const skyFor = (score: number): string =>
  SKY_THRESHOLDS.reduce((sky, [threshold, candidate]) => (score >= threshold ? candidate : sky), "#71c5cf");

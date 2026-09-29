import { biomeFor, starsAlphaFor } from "./biome.ts";
import type { Biome } from "./biome.ts";

export interface Star {
  readonly x: number;
  readonly y: number;
}

const NIGHT_STARS: readonly Star[] = [
  { x: 24, y: 90 },
  { x: 71, y: 132 },
  { x: 108, y: 18 },
  { x: 152, y: 96 },
  { x: 189, y: 140 },
  { x: 226, y: 52 },
  { x: 263, y: 128 },
  { x: 298, y: 24 },
  { x: 331, y: 88 },
  { x: 362, y: 158 },
  { x: 384, y: 46 },
  { x: 47, y: 186 },
];

export const starsFor = (score: number): readonly Star[] => (biomeFor(score).stars ? NIGHT_STARS : []);

export const starsForFade = (from: Biome, to: Biome, progress: number): readonly Star[] =>
  starsAlphaFor(from, to, progress) > 0 ? NIGHT_STARS : [];

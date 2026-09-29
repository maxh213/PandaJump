import type { TopScoresStore } from "./top-scores.ts";

export interface BestStore {
  readonly load: () => number;
  readonly save: (best: number) => void;
  readonly topScores?: TopScoresStore;
}

export const nextBest = (best: number, score: number): number => (score > best ? score : best);

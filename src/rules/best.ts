export interface BestStore {
  readonly load: () => number;
  readonly save: (best: number) => void;
}

export const nextBest = (best: number, score: number): number => (score > best ? score : best);

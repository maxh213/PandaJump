export interface TopScoresStore {
  readonly load: () => readonly number[];
  readonly save: (scores: readonly number[]) => void;
}

const TOP_SCORE_COUNT = 5;

const isScore = (value: unknown): value is number => Number.isInteger(value) && (value as number) > 0;

const parseJson = (raw: string | null): unknown => {
  try {
    return JSON.parse(raw ?? "");
  } catch {
    return null;
  }
};

export const insertScore = (scores: readonly number[], score: number): readonly number[] =>
  [...scores, score].filter(isScore).sort((a, b) => b - a).slice(0, TOP_SCORE_COUNT);

export const parseTopScores = (raw: string | null): readonly number[] | null => {
  const value = parseJson(raw);
  return Array.isArray(value) && value.every(isScore) ? insertScore(value, 0) : null;
};

export const seedTopScores = (best: number): readonly number[] => insertScore([], best);

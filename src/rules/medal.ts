export type Medal = "none" | "Bronze" | "Silver" | "Gold" | "Platinum";

const MEDAL_THRESHOLDS: readonly (readonly [number, Medal])[] = [
  [0, "none"],
  [10, "Bronze"],
  [20, "Silver"],
  [30, "Gold"],
  [40, "Platinum"],
];

const FIRST_MEDAL_THRESHOLD = 10;

export const medalGoalFor = (medal: Medal): string => (medal === "none" ? `Bronze medal at ${String(FIRST_MEDAL_THRESHOLD)}` : "");

export const medalFor = (score: number): Medal =>
  MEDAL_THRESHOLDS.reduce<Medal>((medal, [threshold, candidate]) => (score >= threshold ? candidate : medal), "none");

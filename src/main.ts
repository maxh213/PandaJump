import { readOptions } from "./options/index.ts";
import { createRun } from "./rules/index.ts";
import type { BestStore } from "./rules/index.ts";
import { startGame } from "./scenes/index.ts";

const BEST_KEY = "pandaJump.best";

const loadBest = (): number => {
  try {
    const value = Number(localStorage.getItem(BEST_KEY));
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
};

const saveBest = (best: number): void => {
  try {
    localStorage.setItem(BEST_KEY, String(best));
  } catch {
    return;
  }
};

const bestStore: BestStore = { load: loadBest, save: saveBest };

const options = readOptions(window.location.search, Math.random);
const run = createRun(options.random, bestStore);
const game = startGame(run, options.timeScale);

Object.assign(window, { pandaJump: { run, game } });

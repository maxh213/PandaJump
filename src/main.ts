import { readOptions } from "./options/index.ts";
import { CANVAS_HEIGHT, CANVAS_WIDTH, createRun, parseTopScores, seedTopScores } from "./rules/index.ts";
import type { BestStore, TopScoresStore } from "./rules/index.ts";
import { startGame } from "./scenes/index.ts";

const BEST_KEY = "pandaJump.best";
const TOP_SCORES_KEY = "pandaJump.topScores";

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

const loadTopScores = (): readonly number[] => {
  try {
    return parseTopScores(localStorage.getItem(TOP_SCORES_KEY)) ?? seedTopScores(loadBest());
  } catch {
    return seedTopScores(loadBest());
  }
};

const saveTopScores = (scores: readonly number[]): void => {
  try {
    localStorage.setItem(TOP_SCORES_KEY, JSON.stringify(scores));
  } catch {
    return;
  }
};

const topScoresStore: TopScoresStore = { load: loadTopScores, save: saveTopScores };

const bestStore: BestStore = { load: loadBest, save: saveBest, topScores: topScoresStore };

const fitGameContainer = (): void => {
  const gameDiv = document.getElementById("game_div");
  if (!gameDiv) return;
  gameDiv.style.width = "";
  const chromeHeight = document.documentElement.scrollHeight - gameDiv.getBoundingClientRect().height;
  const availableHeight = window.innerHeight - chromeHeight;
  const widthFromHeight = (availableHeight * CANVAS_WIDTH) / CANVAS_HEIGHT;
  const widthFromContainer = gameDiv.parentElement?.clientWidth ?? window.innerWidth;
  const width = Math.max(0, Math.min(CANVAS_WIDTH, widthFromContainer, widthFromHeight));
  gameDiv.style.width = `${width.toFixed(3)}px`;
};

fitGameContainer();
window.addEventListener("resize", fitGameContainer);

const options = readOptions(window.location.search, Math.random);
const run = createRun(options.random, options.cloudRandom, bestStore);
const game = startGame(run, options.timeScale, window.matchMedia("(prefers-reduced-motion: reduce)").matches);

Object.assign(window, { pandaJump: { run, game } });

const registerServiceWorker = (): void => {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker
    .register("sw.js")
    .then((registration) => registration.update())
    .catch(() => undefined);
};

registerServiceWorker();

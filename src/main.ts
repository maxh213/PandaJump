import { readOptions } from "./options/index.ts";
import { CANVAS_HEIGHT, CANVAS_WIDTH, createRun } from "./rules/index.ts";
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
const game = startGame(run, options.timeScale);

Object.assign(window, { pandaJump: { run, game } });

const registerServiceWorker = (): void => {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("sw.js").catch(() => undefined);
};

registerServiceWorker();

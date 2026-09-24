import { readOptions } from "./options/index.ts";
import { CANVAS_HEIGHT, CANVAS_WIDTH, createRun } from "./rules/index.ts";
import { startGame } from "./scenes/index.ts";

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
const run = createRun(options.random);
const game = startGame(run, options.timeScale);

Object.assign(window, { pandaJump: { run, game } });

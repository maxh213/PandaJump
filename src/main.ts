import { createRun, readOptions } from "./rules/index.ts";
import { startGame } from "./scenes/index.ts";

const options = readOptions(window.location.search, Math.random);
const run = createRun(options.random);
const game = startGame(run, options.timeScale);

Object.assign(window, { pandaJump: { run, game } });

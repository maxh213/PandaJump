import Phaser from "phaser";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../rules/index.ts";
import type { Run } from "../rules/index.ts";
import { RunScene } from "./run-scene.ts";

export const startGame = (run: Run, timeScale: number): Phaser.Game =>
  new Phaser.Game({
    type: Phaser.AUTO,
    backgroundColor: "#71c5cf",
    pixelArt: true,
    scene: new RunScene(run, timeScale),
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      parent: "game_div",
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
    },
  });

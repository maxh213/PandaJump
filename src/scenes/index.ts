import Phaser from "phaser";
import type { Run } from "../rules/index.ts";
import { RunScene } from "./run-scene.ts";

export const startGame = (run: Run, timeScale: number): Phaser.Game =>
  new Phaser.Game({
    type: Phaser.AUTO,
    width: 400,
    height: 490,
    parent: "game_div",
    backgroundColor: "#71c5cf",
    pixelArt: true,
    scene: new RunScene(run, timeScale),
  });

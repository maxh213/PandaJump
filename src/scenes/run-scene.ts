import Phaser from "phaser";
import pandaUrl from "../../assets/Panda.png?no-inline";
import dirtUrl from "../../assets/dirt_06.png?no-inline";
import iceUrl from "../../assets/ice_06.png?no-inline";
import metalUrl from "../../assets/metal_06.png?no-inline";
import sandUrl from "../../assets/sand_06.png?no-inline";
import snowUrl from "../../assets/snow_06.png?no-inline";
import rockUrl from "../../assets/rock_06.png?no-inline";
import grassUrl from "../../assets/top_grass_01.png?no-inline";
import cloud02Url from "../../assets/cloud_02.png?no-inline";
import cloud05Url from "../../assets/cloud_05.png?no-inline";
import { CANVAS_WIDTH, FLOOR_Y, TILE_SIZE } from "../rules/index.ts";
import type { Box, Cloud, Run } from "../rules/index.ts";

const GRASS_Y = 392;
const PANDA_SCALE = 1.25;
const CLOUD_DEPTH = -1;
const CENTER_X = CANVAS_WIDTH / 2;
const GAME_OVER_Y = 190;
const GAME_OVER_SCORE_Y = 250;
const GAME_OVER_BEST_Y = 280;
const GAME_OVER_PROMPT_Y = 320;
const GAME_OVER_SHARE_Y = 360;
const GAME_OVER_RUNS_Y = 400;
const BEST_COLORS: Record<"true" | "false", string> = { true: "#ffd700", false: "#ffffff" };
const GAME_OVER_BEST_LABELS: Record<"true" | "false", string> = { true: "New best", false: "Best" };
const shareSupported = typeof navigator.share === "function";
const PAGE_TITLE = "Panda Jump";

export class RunScene extends Phaser.Scene {
  private readonly run: Run;
  private readonly timeScale: number;
  private panda!: Phaser.GameObjects.Sprite;
  private boxes!: Phaser.GameObjects.Group;
  private clouds!: Phaser.GameObjects.Group;
  private rock!: Phaser.GameObjects.TileSprite;
  private grass!: Phaser.GameObjects.TileSprite;
  private score!: Phaser.GameObjects.Text;
  private best!: Phaser.GameObjects.Text;
  private gameOverTitle!: Phaser.GameObjects.Text;
  private gameOverScore!: Phaser.GameObjects.Text;
  private gameOverBest!: Phaser.GameObjects.Text;
  private gameOverPrompt!: Phaser.GameObjects.Text;
  private gameOverShare!: Phaser.GameObjects.Text;
  private gameOverRuns!: Phaser.GameObjects.Text;
  private pauseTitle!: Phaser.GameObjects.Text;
  private pausePrompt!: Phaser.GameObjects.Text;

  constructor(run: Run, timeScale: number) {
    super("run");
    this.run = run;
    this.timeScale = timeScale;
  }

  preload(): void {
    this.load.spritesheet("Panda.png", pandaUrl, { frameWidth: 20, frameHeight: 21 });
    this.load.image("dirt_06.png", dirtUrl);
    this.load.image("ice_06.png", iceUrl);
    this.load.image("metal_06.png", metalUrl);
    this.load.image("sand_06.png", sandUrl);
    this.load.image("snow_06.png", snowUrl);
    this.load.image("rock_06.png", rockUrl);
    this.load.image("top_grass_01.png", grassUrl);
    this.load.image("cloud_02.png", cloud02Url);
    this.load.image("cloud_05.png", cloud05Url);
  }

  create(): void {
    this.clouds = this.add.group({ classType: Phaser.GameObjects.Image, defaultKey: "cloud_02.png", name: "clouds" });
    this.panda = this.add
      .sprite(0, 0, "Panda.png")
      .setOrigin(0, 1)
      .setScale(PANDA_SCALE)
      .setName("panda");
    this.boxes = this.add.group({ classType: Phaser.GameObjects.Image, defaultKey: "dirt_06.png", name: "boxes" });
    this.rock = this.addFloorStrip(FLOOR_Y, "rock_06.png").setName("rock");
    this.grass = this.addFloorStrip(GRASS_Y, "top_grass_01.png").setName("grass");
    this.score = this.add
      .text(20, 20, "0", { fontFamily: "Arial", fontSize: "30px", color: "#ffffff" })
      .setName("score");
    this.best = this.add
      .text(20, 450, "Best: 0", { fontFamily: "Arial", fontSize: "20px", color: "#ffffff" })
      .setOrigin(0, 1)
      .setName("best");
    this.createGameOverTexts();
    this.createPauseTexts();
    this.input.on("pointerdown", this.jump);
    this.input.on("gameobjectdown", this.shareScore);
    [this.input.keyboard]
      .filter((keyboard) => keyboard !== null)
      .forEach((keyboard) => {
        this.listenForJumpKeys(keyboard);
      });
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    this.draw();
  }

  override update(_time: number, delta: number): void {
    this.run.advance(delta * this.timeScale);
    this.draw();
  }

  private readonly jump = (): void => {
    this.run.jump();
  };

  private readonly handleVisibilityChange = (): void => {
    [document.visibilityState === "hidden"].filter(Boolean).forEach(() => {
      this.run.pause();
    });
  };

  private readonly shareScore = (
    _pointer: Phaser.Input.Pointer,
    _gameObject: Phaser.GameObjects.GameObject,
    event: { stopPropagation: () => void },
  ): void => {
    event.stopPropagation();
    navigator.share({ text: `I scored ${this.run.view().score} on Panda Jump!`, url: window.location.href }).catch(() => undefined);
  };

  private centeredText(y: number, text: string, fontSize: string): Phaser.GameObjects.Text {
    return this.add.text(CENTER_X, y, text, { fontFamily: "Arial", fontSize, color: "#ffffff" }).setOrigin(0.5);
  }

  private createGameOverTexts(): void {
    this.gameOverTitle = this.centeredText(GAME_OVER_Y, "Game over", "40px").setName("gameOverTitle");
    this.gameOverScore = this.centeredText(GAME_OVER_SCORE_Y, "", "20px").setName("gameOverScore");
    this.gameOverBest = this.centeredText(GAME_OVER_BEST_Y, "", "20px").setName("gameOverBest");
    this.gameOverPrompt = this.centeredText(
      GAME_OVER_PROMPT_Y,
      "Tap, press Space or the Up Arrow key to play again",
      "20px",
    ).setName("gameOverPrompt");
    this.gameOverShare = this.centeredText(GAME_OVER_SHARE_Y, "Share score", "20px")
      .setName("gameOverShare")
      .setInteractive();
    this.gameOverRuns = this.centeredText(GAME_OVER_RUNS_Y, "", "20px").setName("gameOverRuns");
  }

  private createPauseTexts(): void {
    this.pauseTitle = this.centeredText(GAME_OVER_Y, "Paused", "40px").setName("pauseTitle");
    this.pausePrompt = this.centeredText(GAME_OVER_PROMPT_Y, "Tap or press Space to continue", "20px").setName(
      "pausePrompt",
    );
  }

  private addFloorStrip(y: number, texture: string): Phaser.GameObjects.TileSprite {
    return this.add.tileSprite(0, y, CANVAS_WIDTH, TILE_SIZE, texture).setOrigin(0, 0);
  }

  private listenForJumpKeys(keyboard: Phaser.Input.Keyboard.KeyboardPlugin): void {
    keyboard.addCapture(["SPACE", "UP"]);
    keyboard.on("keydown-SPACE", this.jump);
    keyboard.on("keydown-UP", this.jump);
  }

  private draw(): void {
    const view = this.run.view();
    this.panda.setPosition(view.pandaX, view.pandaBottom).setFrame(view.pandaFrame).setFlipY(view.pandaUpsideDown);
    this.rock.tilePositionX = view.floorScroll;
    this.grass.tilePositionX = view.floorScroll;
    this.score.setText(view.score);
    const titles: Record<"true" | "false", string> = { true: PAGE_TITLE, false: `${view.score} - ${PAGE_TITLE}` };
    document.title = titles[String(view.score === "0") as "true" | "false"];
    this.best.setText(`Best: ${view.best}`).setColor(BEST_COLORS[String(view.newBest) as "true" | "false"]);
    this.gameOverTitle.setVisible(view.gameOver);
    this.gameOverScore.setVisible(view.gameOver).setText(`Score: ${view.score}`);
    const overtookBest = String(view.overtookBest) as "true" | "false";
    this.gameOverBest
      .setVisible(view.gameOver)
      .setText(`${GAME_OVER_BEST_LABELS[overtookBest]}: ${view.best}`)
      .setColor(BEST_COLORS[overtookBest]);
    this.gameOverPrompt.setVisible(view.canRestart);
    this.gameOverShare.setVisible([view.canRestart, shareSupported].every(Boolean));
    this.gameOverRuns.setVisible(view.gameOver).setText(`Run ${String(view.restarts + 1)}`);
    this.pauseTitle.setVisible(view.paused);
    this.pausePrompt.setVisible(view.paused);
    this.boxes.getChildren().forEach((box) => {
      this.boxes.killAndHide(box);
    });
    view.boxes.forEach((box) => {
      this.showBox(box);
    });
    this.clouds.getChildren().forEach((cloud) => {
      this.clouds.killAndHide(cloud);
    });
    view.clouds.forEach((cloud) => {
      this.showCloud(cloud);
    });
  }

  private showBox(box: Box): void {
    const image = this.boxes.get(box.x, box.y) as Phaser.GameObjects.Image;
    image
      .setTexture(box.texture)
      .setOrigin(0, 0)
      .setPosition(box.x, box.y)
      .setActive(true)
      .setVisible(true)
      .setName("box");
  }

  private showCloud(cloud: Cloud): void {
    const image = this.clouds.get(cloud.x, cloud.y) as Phaser.GameObjects.Image;
    image
      .setTexture(cloud.texture)
      .setOrigin(0, 0)
      .setPosition(cloud.x, cloud.y)
      .setDepth(CLOUD_DEPTH)
      .setActive(true)
      .setVisible(true)
      .setName("cloud");
  }
}

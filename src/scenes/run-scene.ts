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
import { CANVAS_HEIGHT, CANVAS_WIDTH, FLOOR_Y, TILE_SIZE } from "../rules/index.ts";
import type { Box, Cloud, Medal, Run } from "../rules/index.ts";

const HIT_COLUMN_TINT = 0xff6666;
const TINT_ACTIONS: Record<"true" | "false", (image: Phaser.GameObjects.Image) => void> = {
  true: (image) => {
    image.setTint(HIT_COLUMN_TINT);
  },
  false: (image) => {
    image.clearTint();
  },
};
const GRASS_Y = 392;
const AIR_PUFF_RADIUS = 8;
const PANDA_SCALE = 1.25;
const PANDA_FRAME_WIDTH = 20;
const PANDA_FRAME_HEIGHT = 21;
const PANDA_HALF_WIDTH = (PANDA_FRAME_WIDTH * PANDA_SCALE) / 2;
const PANDA_HALF_HEIGHT = (PANDA_FRAME_HEIGHT * PANDA_SCALE) / 2;
const CLOUD_DEPTH = -1;
const CENTER_X = CANVAS_WIDTH / 2;
const SPEED_UP_Y = 120;
const GAME_OVER_Y = 190;
const GAME_OVER_MEDAL_Y = 226;
const GAME_OVER_SCORE_Y = 250;
const GAME_OVER_BEST_Y = 280;
const GAME_OVER_PROMPT_Y = 320;
const GAME_OVER_SHARE_Y = 360;
const GAME_OVER_RUNS_Y = 400;
const BEST_COLORS: Record<"true" | "false", string> = { true: "#ffd700", false: "#ffffff" };
const GAME_OVER_BEST_LABELS: Record<"true" | "false", string> = { true: "New best", false: "Best" };
const MEDAL_LABELS: Record<Medal, string> = {
  none: "",
  Bronze: "Bronze medal",
  Silver: "Silver medal",
  Gold: "Gold medal",
  Platinum: "Platinum medal",
};
const MEDAL_COLORS: Record<Medal, string> = {
  none: "#ffffff",
  Bronze: "#cd7f32",
  Silver: "#c0c0c0",
  Gold: "#ffd700",
  Platinum: "#e5e4e2",
};
const DEATH_FLASH_DEPTH = 1;
const GAME_OVER_DEPTH = 2;
const DEATH_FLASH_COLOR = 0xffffff;
const shareSupported = typeof navigator.share === "function";
const PAGE_TITLE = "Panda Jump";
const clipboardSupported = typeof (navigator as { clipboard?: Clipboard }).clipboard?.writeText === "function";
const COUNTDOWN_LABELS: Record<"3" | "2" | "1" | "null", string> = { "3": "3", "2": "2", "1": "1", null: "" };
const hasValue = <T>(value: T | null): value is T => value !== null;

export class RunScene extends Phaser.Scene {
  private readonly run: Run;
  private readonly timeScale: number;
  private panda!: Phaser.GameObjects.Sprite;
  private airPuff!: Phaser.GameObjects.Graphics;
  private boxes!: Phaser.GameObjects.Group;
  private clouds!: Phaser.GameObjects.Group;
  private rock!: Phaser.GameObjects.TileSprite;
  private grass!: Phaser.GameObjects.TileSprite;
  private score!: Phaser.GameObjects.Text;
  private best!: Phaser.GameObjects.Text;
  private speedUp!: Phaser.GameObjects.Text;
  private deathFlash!: Phaser.GameObjects.Rectangle;
  private gameOverTitle!: Phaser.GameObjects.Text;
  private gameOverMedal!: Phaser.GameObjects.Text;
  private gameOverScore!: Phaser.GameObjects.Text;
  private gameOverBest!: Phaser.GameObjects.Text;
  private gameOverPrompt!: Phaser.GameObjects.Text;
  private gameOverShare!: Phaser.GameObjects.Text;
  private gameOverRuns!: Phaser.GameObjects.Text;
  private pauseTitle!: Phaser.GameObjects.Text;
  private pausePrompt!: Phaser.GameObjects.Text;
  private gameOverCopy!: Phaser.GameObjects.Text;
  private bestMarker!: Phaser.GameObjects.Text;
  private countdownText!: Phaser.GameObjects.Text;

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
      .setOrigin(0.5, 0.5)
      .setScale(PANDA_SCALE)
      .setName("panda");
    this.airPuff = this.add.graphics().setName("airPuff");
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
    this.speedUp = this.add
      .text(CENTER_X, SPEED_UP_Y, "Faster!", { fontFamily: "Arial", fontSize: "24px", color: "#ffd700" })
      .setOrigin(0.5)
      .setName("speedUp");
    this.deathFlash = this.add
      .rectangle(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, DEATH_FLASH_COLOR)
      .setOrigin(0, 0)
      .setDepth(DEATH_FLASH_DEPTH)
      .setAlpha(0)
      .setName("deathFlash");
    this.createGameOverTexts();
    this.createPauseTexts();
    this.bestMarker = this.add
      .text(0, 0, "Best", { fontFamily: "Arial", fontSize: "16px", color: "#ffd700" })
      .setOrigin(0.5, 1)
      .setName("bestMarker");
    this.countdownText = this.centeredText(GAME_OVER_Y, "", "40px").setName("countdownText");
    this.wireInput();
    this.draw();
  }

  private wireInput(): void {
    this.input.on("pointerdown", this.jump);
    this.input.on("gameobjectdown", this.shareScore);
    this.input.on("gameobjectdown", this.copyScore);
    [this.input.keyboard]
      .filter((keyboard) => keyboard !== null)
      .forEach((keyboard) => {
        this.listenForJumpKeys(keyboard);
        this.listenForPauseKeys(keyboard);
      });
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
  }

  override update(_time: number, delta: number): void {
    this.run.advance(delta * this.timeScale);
    this.draw();
  }

  private readonly jump = (): void => {
    this.run.jump();
  };

  private readonly pauseOrResume = (): void => {
    this.run.pauseOrResume();
  };

  private readonly handleVisibilityChange = (): void => {
    [document.visibilityState === "hidden"].filter(Boolean).forEach(() => {
      this.run.pause();
    });
  };

  private readonly jumpUnlessRepeating = (event: KeyboardEvent): void => {
    [event]
      .filter((keyEvent) => !keyEvent.repeat)
      .forEach(() => {
        this.jump();
      });
  };

  private readonly shareScore = (
    _pointer: Phaser.Input.Pointer,
    gameObject: Phaser.GameObjects.GameObject,
    event: { stopPropagation: () => void },
  ): void => {
    [gameObject]
      .filter((target) => target === this.gameOverShare)
      .forEach(() => {
        event.stopPropagation();
        navigator.share({ text: `I scored ${this.run.view().score} on Panda Jump!`, url: window.location.href }).catch(() => undefined);
      });
  };

  private readonly copyScore = (
    _pointer: Phaser.Input.Pointer,
    gameObject: Phaser.GameObjects.GameObject,
    event: { stopPropagation: () => void },
  ): void => {
    [gameObject]
      .filter((target) => target === this.gameOverCopy)
      .forEach(() => {
        event.stopPropagation();
        navigator.clipboard
          .writeText(`I scored ${this.run.view().score} on Panda Jump! ${window.location.href}`)
          .catch(() => undefined);
      });
  };

  private centeredText(y: number, text: string, fontSize: string): Phaser.GameObjects.Text {
    return this.add
      .text(CENTER_X, y, text, { fontFamily: "Arial", fontSize, color: "#ffffff" })
      .setOrigin(0.5)
      .setDepth(GAME_OVER_DEPTH);
  }

  private createGameOverTexts(): void {
    this.gameOverTitle = this.centeredText(GAME_OVER_Y, "Game over", "40px").setName("gameOverTitle");
    this.gameOverMedal = this.centeredText(GAME_OVER_MEDAL_Y, "", "16px").setName("gameOverMedal");
    this.gameOverScore = this.centeredText(GAME_OVER_SCORE_Y, "", "20px").setName("gameOverScore");
    this.gameOverBest = this.centeredText(GAME_OVER_BEST_Y, "", "20px").setName("gameOverBest");
    this.gameOverPrompt = this.centeredText(
      GAME_OVER_PROMPT_Y,
      "Tap, press Space or the Up Arrow key to play again",
      "16px",
    ).setName("gameOverPrompt");
    this.gameOverShare = this.centeredText(GAME_OVER_SHARE_Y, "Share score", "20px")
      .setName("gameOverShare")
      .setInteractive();
    this.gameOverRuns = this.centeredText(GAME_OVER_RUNS_Y, "", "20px").setName("gameOverRuns");
    this.gameOverCopy = this.centeredText(GAME_OVER_SHARE_Y, "Copy score", "20px")
      .setName("gameOverCopy")
      .setInteractive();
  }

  private createPauseTexts(): void {
    this.pauseTitle = this.centeredText(GAME_OVER_Y, "Paused", "40px").setName("pauseTitle");
    this.pausePrompt = this.centeredText(
      GAME_OVER_PROMPT_Y,
      "Tap, press Space or the Up Arrow key to continue",
      "16px",
    ).setName("pausePrompt");
  }

  private addFloorStrip(y: number, texture: string): Phaser.GameObjects.TileSprite {
    return this.add.tileSprite(0, y, CANVAS_WIDTH, TILE_SIZE, texture).setOrigin(0, 0);
  }

  private listenForJumpKeys(keyboard: Phaser.Input.Keyboard.KeyboardPlugin): void {
    keyboard.addCapture(["SPACE", "UP"]);
    keyboard.on("keydown-SPACE", this.jumpUnlessRepeating);
    keyboard.on("keydown-UP", this.jumpUnlessRepeating);
  }

  private listenForPauseKeys(keyboard: Phaser.Input.Keyboard.KeyboardPlugin): void {
    keyboard.addCapture(["P", "ESC"]);
    keyboard.on("keydown-P", this.pauseOrResume);
    keyboard.on("keydown-ESC", this.pauseOrResume);
  }

  private drawPanda(view: ReturnType<Run["view"]>): void {
    this.panda
      .setPosition(view.pandaX + PANDA_HALF_WIDTH, view.pandaBottom - PANDA_HALF_HEIGHT)
      .setFrame(view.pandaFrame)
      .setFlipY(view.pandaUpsideDown)
      .setAngle(view.pandaAngle);
  }

  private draw(): void {
    const view = this.run.view();
    this.drawPanda(view);
    this.drawAirPuff(view.airPuff);
    this.rock.tilePositionX = view.floorScroll;
    this.grass.tilePositionX = view.floorScroll;
    this.score.setText(view.score).setScale(view.scoreScale);
    const titles: Record<"true" | "false", string> = { true: PAGE_TITLE, false: `${view.score} - ${PAGE_TITLE}` };
    document.title = titles[String(view.score === "0") as "true" | "false"];
    this.best.setText(`Best: ${view.best}`).setColor(BEST_COLORS[String(view.newBest) as "true" | "false"]);
    this.speedUp.setVisible(view.speedUp);
    this.deathFlash.setAlpha(view.deathFlash);
    this.drawGameOver(view);
    this.pauseTitle.setVisible(view.paused);
    this.pausePrompt.setVisible(view.paused);
    this.gameOverCopy.setVisible([view.canRestart, !shareSupported, clipboardSupported].every(Boolean));
    this.drawBestMarker(view.bestMarker);
    const countdownKey = String(view.countdown) as "3" | "2" | "1" | "null";
    this.countdownText.setVisible(view.countdown !== null).setText(COUNTDOWN_LABELS[countdownKey]);
    this.refreshGroup(this.boxes, view.boxes, (box) => {
      this.showBox(box);
    });
    this.refreshGroup(this.clouds, view.clouds, (cloud) => {
      this.showCloud(cloud);
    });
  }

  private refreshGroup<T>(group: Phaser.GameObjects.Group, items: readonly T[], show: (item: T) => void): void {
    group.getChildren().forEach((child) => {
      group.killAndHide(child);
    });
    items.forEach((item) => {
      show(item);
    });
  }

  private drawBestMarker(marker: { x: number; y: number } | null): void {
    this.bestMarker.setVisible(marker !== null);
    [marker]
      .filter((candidate): candidate is { x: number; y: number } => candidate !== null)
      .forEach((candidate) => {
        this.bestMarker.setPosition(candidate.x, candidate.y);
      });
  }

  private drawGameOver(view: ReturnType<Run["view"]>): void {
    this.gameOverTitle.setVisible(view.gameOver);
    this.gameOverMedal
      .setVisible([view.gameOver, view.medal !== "none"].every(Boolean))
      .setText(MEDAL_LABELS[view.medal])
      .setColor(MEDAL_COLORS[view.medal]);
    this.gameOverScore.setVisible(view.gameOver).setText(`Score: ${view.score}`);
    const overtookBest = String(view.overtookBest) as "true" | "false";
    this.gameOverBest
      .setVisible(view.gameOver)
      .setText(`${GAME_OVER_BEST_LABELS[overtookBest]}: ${view.best}`)
      .setColor(BEST_COLORS[overtookBest]);
    this.gameOverPrompt.setVisible(view.canRestart);
    this.gameOverShare.setVisible([view.canRestart, shareSupported].every(Boolean));
    this.gameOverRuns.setVisible(view.gameOver).setText(`Run ${String(view.restarts + 1)}`);
  }

  private drawAirPuff(airPuff: { x: number; y: number; alpha: number } | null): void {
    this.airPuff.clear().setVisible(false);
    [airPuff].filter(hasValue).forEach((puff) => {
      this.airPuff
        .fillStyle(0xffffff, 1)
        .fillCircle(0, 0, AIR_PUFF_RADIUS)
        .setPosition(puff.x, puff.y)
        .setAlpha(puff.alpha)
        .setVisible(true);
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
    TINT_ACTIONS[String(box.hit) as "true" | "false"](image);
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

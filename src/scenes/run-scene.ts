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
import { BIOMES, MEADOW, CANVAS_HEIGHT, CANVAS_WIDTH, FLOOR_Y, HILLS_REPEAT_WIDTH, TILE_SIZE } from "../rules/index.ts";
import type { Biome, Box, Cloud, Medal, Run, Star } from "../rules/index.ts";

const OUTLINE = { stroke: "#000000", strokeThickness: 4 };
const HIT_COLUMN_TINT = 0xff6666;
const TINT_ACTIONS: Record<"true" | "false", (image: Phaser.GameObjects.Image) => void> = {
  true: (image) => {
    image.setTint(HIT_COLUMN_TINT);
  },
  false: (image) => {
    image.clearTint();
  },
};
const PAD_JUMP_BUTTON = 0;
const PAD_PAUSE_BUTTON = 9;
const GRASS_Y = 392;
const GRASS_SURFACE_Y = GRASS_Y + 32;
const SOLID_TOP_Y = GRASS_SURFACE_Y - 1;
const TOP_STRIP_Y: Record<Biome["top"], number> = {
  "top_grass_01.png": GRASS_Y,
  "sand_06.png": SOLID_TOP_Y,
  "snow_06.png": SOLID_TOP_Y,
  "metal_06.png": SOLID_TOP_Y,
};
const AIR_PUFF_RADIUS = 8;
const LANDING_PUFF_RADIUS = 5;
const LANDING_PUFF_OFFSET = 10;
const LANDING_PUFF_COLOR = 0xd2b48c;
const PANDA_SCALE = 1.25;
const SCALE_STEPS = 1024;
const PANDA_FRAME_WIDTH = 20;
const PANDA_FRAME_HEIGHT = 21;
const PANDA_HALF_WIDTH = (PANDA_FRAME_WIDTH * PANDA_SCALE) / 2;
const CLOUD_DEPTH = -1;
const STAR_DEPTH = -2;
const HILLS_DEPTH = -0.5;
const HILLS_TOP = 300;
const HILLS_HEIGHT = GRASS_SURFACE_Y - HILLS_TOP;
const HILL_SHAPES: readonly (readonly [number, number, number])[] = [
  [45, 45, 50],
  [125, 45, HILLS_HEIGHT],
];
const DAY_HILL_COLOR = MEADOW.hills;
const STAR_RADIUS = 2;
const STAR_COLOR = 0xffffff;
const CENTER_X = CANVAS_WIDTH / 2;
const SPEED_UP_Y = 120;
const DOUBLE_JUMP_HINT_Y = 150;
const TOP_SCORES_HEADING_Y = 166;
const TOP_SCORES_FIRST_Y = 196;
const TOP_SCORES_LINE_HEIGHT = 20;
const TOP_SCORES_LINES = 5;
const GAME_OVER_Y = 190;
const GAME_OVER_MEDAL_Y = 226;
const GAME_OVER_SCORE_Y = 252;
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
const MEDAL_BADGE_RADIUS = 10;
const MEDAL_BADGE_GAP = 18;
const MEDAL_BADGE_STROKE_WIDTH = 2;
const DEATH_FLASH_DEPTH = 1;
const GAME_OVER_DEPTH = 2;
const SHADOW_DEPTH = 0.25;
const PANDA_DEPTH = 0.5;
const AIR_PUFF_DEPTH = 0.75;
const SHADOW_WIDTH = 24;
const SHADOW_HEIGHT = 6;
const SHADOW_ALPHA = 0.3;
const DEATH_FLASH_COLOR = 0xffffff;
const shareSupported = typeof navigator.share === "function";
const PAGE_TITLE = "Panda Jump";
const clipboardSupported = typeof (navigator as { clipboard?: Clipboard }).clipboard?.writeText === "function";
const COUNTDOWN_LABELS: Record<"3" | "2" | "1" | "null", string> = { "3": "3", "2": "2", "1": "1", null: "" };
const hillKey = (color: string): string => `hills-${color}`;
const hasValue = <T>(value: T | null): value is T => value !== null;
const DEATH_VIBRATION_MS = 100;

interface NavigatorWithVibrate {
  vibrate?: (pattern: number) => boolean;
}
const COPY_LABELS: Record<"true" | "false", string> = { true: "Copied!", false: "Copy score" };

export class RunScene extends Phaser.Scene {
  private readonly run: Run;
  private readonly timeScale: number;
  private readonly reducedMotion: boolean;
  private panda!: Phaser.GameObjects.Sprite;
  private pandaShadow!: Phaser.GameObjects.Ellipse;
  private airPuff!: Phaser.GameObjects.Graphics;
  private landingPuff!: Phaser.GameObjects.Graphics;
  private boxes!: Phaser.GameObjects.Group;
  private clouds!: Phaser.GameObjects.Group;
  private stars!: Phaser.GameObjects.Group;
  private hills!: Phaser.GameObjects.TileSprite;
  private rock!: Phaser.GameObjects.TileSprite;
  private grass!: Phaser.GameObjects.TileSprite;
  private score!: Phaser.GameObjects.Text;
  private best!: Phaser.GameObjects.Text;
  private speedUp!: Phaser.GameObjects.Text;
  private deathFlash!: Phaser.GameObjects.Rectangle;
  private gameOverTitle!: Phaser.GameObjects.Text;
  private gameOverMedal!: Phaser.GameObjects.Text;
  private gameOverMedalBadge!: Phaser.GameObjects.Graphics;
  private gameOverScore!: Phaser.GameObjects.Text;
  private gameOverBest!: Phaser.GameObjects.Text;
  private gameOverPrompt!: Phaser.GameObjects.Text;
  private gameOverShare!: Phaser.GameObjects.Text;
  private gameOverRuns!: Phaser.GameObjects.Text;
  private pauseTitle!: Phaser.GameObjects.Text;
  private pausePrompt!: Phaser.GameObjects.Text;
  private pauseButton!: Phaser.GameObjects.Text;
  private gameOverCopy!: Phaser.GameObjects.Text;
  private bestMarker!: Phaser.GameObjects.Text;
  private doubleJumpHint!: Phaser.GameObjects.Text;
  private countdownText!: Phaser.GameObjects.Text;
  private wasGameOver = false;
  private copied = false;
  private readyPrompt!: Phaser.GameObjects.Text;
  private topScoresHeading!: Phaser.GameObjects.Text;
  private topScoreLines!: Phaser.GameObjects.Text[];

  constructor(run: Run, timeScale: number, reducedMotion: boolean) {
    super("run");
    this.reducedMotion = reducedMotion;
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
    this.stars = this.add.group({ classType: Phaser.GameObjects.Arc, name: "stars" });
    this.clouds = this.add.group({ classType: Phaser.GameObjects.Image, defaultKey: "cloud_02.png", name: "clouds" });
    this.createHills();
    this.createPandaAndEffects();
    this.boxes = this.add.group({ classType: Phaser.GameObjects.Image, defaultKey: "dirt_06.png", name: "boxes" });
    this.rock = this.addFloorStrip(FLOOR_Y, "rock_06.png").setName("rock");
    this.grass = this.addFloorStrip(GRASS_Y, "top_grass_01.png").setName("grass");
    this.score = this.add
      .text(20, 20, "0", { fontFamily: "Arial", fontSize: "30px", color: "#ffffff", ...OUTLINE })
      .setName("score");
    this.best = this.add
      .text(20, 450, "Best: 0", { fontFamily: "Arial", fontSize: "20px", color: "#ffffff", ...OUTLINE })
      .setOrigin(0, 1)
      .setName("best");
    this.speedUp = this.add
      .text(CENTER_X, SPEED_UP_Y, "Faster!", { fontFamily: "Arial", fontSize: "24px", color: "#ffd700", ...OUTLINE })
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
      .text(0, 0, "Best", { fontFamily: "Arial", fontSize: "16px", color: "#ffd700", ...OUTLINE })
      .setOrigin(0.5, 1)
      .setName("bestMarker");
    this.doubleJumpHint = this.hintText();
    this.countdownText = this.centeredText(GAME_OVER_Y, "", "40px").setName("countdownText");
    this.readyPrompt = this.centeredText(GAME_OVER_PROMPT_Y, "Tap or press Space to start", "20px").setName("readyPrompt");
    this.createTopScoresTexts();
    this.wireInput();
    this.draw();
  }

  private createTopScoresTexts(): void {
    this.topScoresHeading = this.centeredText(TOP_SCORES_HEADING_Y, "Your best runs", "20px").setName("topScoresHeading");
    this.topScoreLines = Array.from({ length: TOP_SCORES_LINES }, (_, index) =>
      this.centeredText(TOP_SCORES_FIRST_Y + index * TOP_SCORES_LINE_HEIGHT, "", "16px").setName(`topScoreLine${String(index)}`),
    );
  }

  private drawReady(view: ReturnType<Run["view"]>): void {
    this.readyPrompt.setVisible(view.ready);
    this.drawTopScores(view.topScores);
  }

  private drawTopScores(scores: readonly number[]): void {
    this.topScoresHeading.setVisible(scores.length > 0);
    this.topScoreLines.forEach((line, index) => {
      line.setVisible(index < scores.length).setText(`${String(index + 1)}. ${String(scores[index])}`);
    });
  }

  private createHills(): void {
    BIOMES.forEach(({ hills }) => {
      this.makeHillTexture(hills);
    });
    this.hills = this.add
      .tileSprite(0, HILLS_TOP, CANVAS_WIDTH, HILLS_HEIGHT, hillKey(DAY_HILL_COLOR))
      .setOrigin(0, 0)
      .setDepth(HILLS_DEPTH)
      .setName("hills");
  }

  private makeHillTexture(color: string): void {
    const graphics = this.add.graphics().fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 1);
    HILL_SHAPES.forEach(([x, radiusX, radiusY]) => {
      [x, x - HILLS_REPEAT_WIDTH].forEach((left) => {
        graphics.fillEllipse(left, HILLS_HEIGHT, radiusX * 2, radiusY * 2);
      });
    });
    graphics.generateTexture(hillKey(color), HILLS_REPEAT_WIDTH, HILLS_HEIGHT).destroy();
  }

  private createPandaAndEffects(): void {
    this.panda = this.add
      .sprite(0, 0, "Panda.png")
      .setOrigin(0.5, 0.5)
      .setScale(PANDA_SCALE)
      .setDepth(PANDA_DEPTH)
      .setName("panda");
    this.pandaShadow = this.add
      .ellipse(0, 0, SHADOW_WIDTH, SHADOW_HEIGHT, 0x000000, SHADOW_ALPHA)
      .setDepth(SHADOW_DEPTH)
      .setName("pandaShadow");
    this.airPuff = this.add.graphics().setDepth(AIR_PUFF_DEPTH).setName("airPuff");
    this.landingPuff = this.add.graphics().setDepth(AIR_PUFF_DEPTH).setName("landingPuff");
  }

  private wireInput(): void {
    this.input.on("pointerdown", this.jump);
    this.input.on("gameobjectdown", this.shareScore);
    this.input.on("gameobjectdown", this.copyScore);
    this.input.on("gameobjectdown", this.tapPauseButton);
    [this.input.keyboard]
      .filter((keyboard) => keyboard !== null)
      .forEach((keyboard) => {
        this.listenForJumpKeys(keyboard);
        this.listenForPauseKeys(keyboard);
      });
    [this.input.gamepad]
      .filter((gamepad) => gamepad !== null)
      .forEach((gamepad) => {
        gamepad.on("down", this.handlePadButton);
      });
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    window.addEventListener("blur", this.handleWindowBlur);
    document.addEventListener("pointerdown", this.jumpOffCanvas);
  }

  override update(_time: number, delta: number): void {
    this.run.advance(delta * this.timeScale);
    this.draw();
  }

  private readonly jump = (): void => {
    this.run.jump();
  };

  private readonly jumpOffCanvas = (event: PointerEvent): void => {
    [event.target]
      .filter((target): target is Element => target instanceof Element)
      .filter((target) => target.closest("canvas, a") === null)
      .forEach(() => {
        this.jump();
      });
  };

  private readonly pauseOrResume = (): void => {
    this.run.pauseOrResume();
  };

  private readonly handlePadButton = (_pad: Phaser.Input.Gamepad.Gamepad, button: Phaser.Input.Gamepad.Button): void => {
    [button.index]
      .filter((index) => index === PAD_JUMP_BUTTON)
      .forEach(this.jump);
    [button.index]
      .filter((index) => index === PAD_PAUSE_BUTTON)
      .forEach(this.pauseOrResume);
  };

  private readonly handleVisibilityChange = (): void => {
    [document.visibilityState === "hidden"].filter(Boolean).forEach(() => {
      this.run.pause();
    });
  };

  private readonly handleWindowBlur = (): void => {
    this.run.pause();
  };

  private readonly pauseOrResumeUnlessRepeating = (event: KeyboardEvent): void => {
    [event]
      .filter((keyEvent) => !keyEvent.repeat)
      .forEach(this.pauseOrResume);
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
          .then(() => {
            this.copied = true;
          })
          .catch(() => undefined);
      });
  };

  private readonly tapPauseButton = (
    _pointer: Phaser.Input.Pointer,
    gameObject: Phaser.GameObjects.GameObject,
    event: { stopPropagation: () => void },
  ): void => {
    [gameObject]
      .filter((target) => target === this.pauseButton)
      .forEach(() => {
        event.stopPropagation();
        this.run.pause();
      });
  };

  private trackCopied(gameOver: boolean): void {
    [gameOver]
      .filter((stillOver) => !stillOver)
      .forEach(() => {
        this.copied = false;
      });
  }

  private centeredText(y: number, text: string, fontSize: string): Phaser.GameObjects.Text {
    return this.add
      .text(CENTER_X, y, text, { fontFamily: "Arial", fontSize, color: "#ffffff", ...OUTLINE })
      .setOrigin(0.5)
      .setDepth(GAME_OVER_DEPTH);
  }

  private hintText(): Phaser.GameObjects.Text {
    return this.add
      .text(CENTER_X, DOUBLE_JUMP_HINT_Y, "Tap again in mid-air to double jump", {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#ffffff",
        ...OUTLINE,
      })
      .setOrigin(0.5)
      .setName("doubleJumpHint");
  }

  private createGameOverTexts(): void {
    this.gameOverTitle = this.centeredText(GAME_OVER_Y, "Game over", "40px").setName("gameOverTitle");
    this.gameOverMedal = this.centeredText(GAME_OVER_MEDAL_Y, "", "16px").setName("gameOverMedal");
    this.gameOverMedalBadge = this.add
      .graphics()
      .setDepth(GAME_OVER_DEPTH)
      .setName("gameOverMedalBadge");
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
    this.pauseButton = this.add
      .text(CANVAS_WIDTH - 20, 20, "II", { fontFamily: "Arial", fontSize: "24px", color: "#ffffff", ...OUTLINE })
      .setOrigin(1, 0)
      .setName("pauseButton")
      .setInteractive();
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
    keyboard.on("keydown-P", this.pauseOrResumeUnlessRepeating);
    keyboard.on("keydown-ESC", this.pauseOrResumeUnlessRepeating);
  }

  private drawPanda(view: ReturnType<Run["view"]>): void {
    const scaleY = Math.round(PANDA_SCALE * view.pandaScaleY * SCALE_STEPS) / SCALE_STEPS;
    this.panda
      .setPosition(view.pandaX + PANDA_HALF_WIDTH, view.pandaBottom - (PANDA_FRAME_HEIGHT * scaleY) / 2)
      .setScale(PANDA_SCALE * view.pandaScaleX, scaleY)
      .setFrame(view.pandaFrame)
      .setFlipY(view.pandaUpsideDown)
      .setAngle(view.pandaAngle);
  }

  private drawScore(view: ReturnType<Run["view"]>): void {
    this.score.setText(view.score).setScale(view.scoreScale);
    const colour = MEDAL_COLORS[view.medal];
    const recolour: Record<"true" | "false", () => void> = {
      true: () => this.score.setColor(colour),
      false: () => undefined,
    };
    recolour[String(this.score.style.color !== colour) as "true" | "false"]();
  }

  private draw(): void {
    const view = this.run.view();
    this.cameras.main.setBackgroundColor(view.sky);
    this.drawPanda(view);
    this.pandaShadow.setPosition(view.pandaShadow.x, view.pandaShadow.y).setScale(view.pandaShadow.scale);
    this.drawAirPuff(view.airPuff);
    this.drawLandingPuff(view.landingPuff);
    this.hills.setTexture(hillKey(view.hillColor)).setTilePosition(view.hillsScroll, 0);
    this.rock.setTexture(view.biome.floor).tilePositionX = view.floorScroll;
    this.grass.setTexture(view.biome.top).setY(TOP_STRIP_Y[view.biome.top]).tilePositionX = view.floorScroll;
    this.drawScore(view);
    const titles: Record<"true" | "false", string> = { true: PAGE_TITLE, false: `${view.score} - ${PAGE_TITLE}` };
    document.title = titles[String(view.score === "0") as "true" | "false"];
    this.best.setText(`Best: ${view.best}`).setColor(BEST_COLORS[String(view.newBest) as "true" | "false"]);
    this.speedUp.setVisible(view.speedUp);
    this.doubleJumpHint.setVisible(view.doubleJumpHint);
    this.drawDeathEffects(view);
    this.drawGameOverTexts(view);
    this.pauseTitle.setVisible(view.paused);
    this.pausePrompt.setVisible(view.paused);
    this.pauseButton.setVisible([!view.paused, !view.gameOver, !view.ready].every(Boolean));
    this.gameOverCopy
      .setVisible([view.canRestart, !shareSupported, clipboardSupported].every(Boolean))
      .setText(COPY_LABELS[String(this.copied) as "true" | "false"]);
    this.trackCopied(view.gameOver);
    this.drawBestMarker(view.bestMarker);
    const countdownKey = String(view.countdown) as "3" | "2" | "1" | "null";
    this.countdownText.setVisible(view.countdown !== null).setText(COUNTDOWN_LABELS[countdownKey]);
    this.vibrateOnDeath(view.gameOver);
    this.drawReady(view);
    this.refreshGroup(this.boxes, view.boxes, (box) => {
      this.showBox(box);
    });
    this.refreshGroup(this.stars, view.stars, (star) => {
      this.showStar(star);
    });
    this.refreshGroup(this.clouds, view.clouds, (cloud) => {
      this.showCloud(cloud);
    });
  }

  private drawDeathEffects(view: ReturnType<Run["view"]>): void {
    const motion = Number(!this.reducedMotion);
    this.cameras.main.setScroll(view.deathShake.x * motion, view.deathShake.y * motion);
    this.deathFlash.setAlpha(view.deathFlash * motion);
  }

  private drawGameOverTexts(view: ReturnType<Run["view"]>): void {
    this.gameOverTitle.setVisible(view.gameOver);
    this.gameOverMedal
      .setVisible(view.gameOver)
      .setText({ ...MEDAL_LABELS, none: view.medalGoal }[view.medal])
      .setColor(MEDAL_COLORS[view.medal]);
    this.drawMedalBadge(view.gameOver, view.medal);
    this.gameOverScore.setVisible(view.gameOver).setText(`Score: ${view.gameOverScore}`);
    const overtookBest = String(view.overtookBest) as "true" | "false";
    this.gameOverBest
      .setVisible(view.gameOver)
      .setText(`${GAME_OVER_BEST_LABELS[overtookBest]}: ${view.best}`)
      .setColor(BEST_COLORS[overtookBest]);
    this.gameOverPrompt.setVisible(view.canRestart);
    this.gameOverShare.setVisible([view.canRestart, shareSupported].every(Boolean));
    this.gameOverRuns.setVisible(view.gameOver).setText(`Run ${String(view.restarts + 1)}`);
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

  private drawMedalBadge(gameOver: boolean, medal: Medal): void {
    const shown = [gameOver, medal !== "none"].every(Boolean);
    const color = Phaser.Display.Color.HexStringToColor(MEDAL_COLORS[medal]).color;
    this.gameOverMedalBadge
      .clear()
      .fillStyle(color, 1)
      .fillCircle(0, 0, MEDAL_BADGE_RADIUS)
      .lineStyle(MEDAL_BADGE_STROKE_WIDTH, 0x000000, 1)
      .strokeCircle(0, 0, MEDAL_BADGE_RADIUS)
      .setPosition(this.gameOverMedal.x - this.gameOverMedal.width / 2 - MEDAL_BADGE_GAP, GAME_OVER_MEDAL_Y)
      .setVisible(shown);
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
  private drawLandingPuff(landingPuff: { x: number; y: number; alpha: number } | null): void {
    this.landingPuff.clear().setVisible(false);
    [landingPuff].filter(hasValue).forEach((puff) => {
      this.landingPuff
        .fillStyle(LANDING_PUFF_COLOR, 1)
        .fillCircle(-LANDING_PUFF_OFFSET, 0, LANDING_PUFF_RADIUS)
        .fillCircle(LANDING_PUFF_OFFSET, 0, LANDING_PUFF_RADIUS)
        .setPosition(puff.x, puff.y)
        .setAlpha(puff.alpha)
        .setVisible(true);
    });
  }

  private readonly vibrateOnDeath = (gameOver: boolean): void => {
    [gameOver]
      .filter((current) => current)
      .filter(() => !this.wasGameOver)
      .forEach(() => {
        this.vibrate();
      });
    this.wasGameOver = gameOver;
  };

  private readonly vibrate = (): void => {
    const vibrate = (navigator as NavigatorWithVibrate).vibrate;
    [vibrate]
      .filter((fn) => fn !== undefined)
      .forEach((fn) => {
        fn.call(navigator, DEATH_VIBRATION_MS);
      });
  };

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

  private showStar(star: Star): void {
    const dot = this.stars.get(star.x, star.y) as Phaser.GameObjects.Arc;
    dot
      .setRadius(STAR_RADIUS)
      .setFillStyle(STAR_COLOR)
      .setPosition(star.x, star.y)
      .setDepth(STAR_DEPTH)
      .setActive(true)
      .setVisible(true)
      .setName("star");
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

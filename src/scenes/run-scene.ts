import Phaser from "phaser";
import pandaUrl from "../../assets/Panda.png?no-inline";
import dirtUrl from "../../assets/dirt_06.png?no-inline";
import rockUrl from "../../assets/rock_06.png?no-inline";
import grassUrl from "../../assets/top_grass_01.png?no-inline";
import cloud02Url from "../../assets/cloud_02.png?no-inline";
import cloud05Url from "../../assets/cloud_05.png?no-inline";
import { CANVAS_WIDTH, FLOOR_Y, TILE_SIZE } from "../rules/index.ts";
import type { Box, Cloud, Run } from "../rules/index.ts";

const GRASS_Y = 392;
const PANDA_SCALE = 1.25;
const CLOUD_DEPTH = -1;

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

  constructor(run: Run, timeScale: number) {
    super("run");
    this.run = run;
    this.timeScale = timeScale;
  }

  preload(): void {
    this.load.spritesheet("Panda.png", pandaUrl, { frameWidth: 20, frameHeight: 21 });
    this.load.image("dirt_06.png", dirtUrl);
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
    this.input.on("pointerdown", this.jump);
    [this.input.keyboard]
      .filter((keyboard) => keyboard !== null)
      .forEach((keyboard) => {
        this.listenForSpace(keyboard);
      });
    this.draw();
  }

  override update(_time: number, delta: number): void {
    this.run.advance(delta * this.timeScale);
    this.draw();
  }

  private readonly jump = (): void => {
    this.run.jump();
  };

  private addFloorStrip(y: number, texture: string): Phaser.GameObjects.TileSprite {
    return this.add.tileSprite(0, y, CANVAS_WIDTH, TILE_SIZE, texture).setOrigin(0, 0);
  }

  private listenForSpace(keyboard: Phaser.Input.Keyboard.KeyboardPlugin): void {
    keyboard.addCapture("SPACE");
    keyboard.on("keydown-SPACE", this.jump);
  }

  private draw(): void {
    const view = this.run.view();
    this.panda.setPosition(view.pandaX, view.pandaBottom).setFrame(view.pandaFrame);
    this.rock.tilePositionX = view.floorScroll;
    this.grass.tilePositionX = view.floorScroll;
    this.score.setText(view.score);
    this.best.setText(`Best: ${view.best}`);
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
    image.setOrigin(0, 0).setPosition(box.x, box.y).setActive(true).setVisible(true).setName("box");
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

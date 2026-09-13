import Phaser from "phaser";
import pandaUrl from "../../assets/Panda.png?no-inline";
import dirtUrl from "../../assets/dirt_06.png?no-inline";
import rockUrl from "../../assets/rock_06.png?no-inline";
import grassUrl from "../../assets/top_grass_01.png?no-inline";
import type { Run, View } from "../rules/index.ts";

type Box = View["boxes"][number];

export class RunScene extends Phaser.Scene {
  private readonly run: Run;
  private readonly timeScale: number;
  private panda!: Phaser.GameObjects.Sprite;
  private boxes!: Phaser.GameObjects.Group;
  private rock!: Phaser.GameObjects.TileSprite;
  private grass!: Phaser.GameObjects.TileSprite;
  private score!: Phaser.GameObjects.Text;

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
  }

  create(): void {
    this.panda = this.add.sprite(100, 426, "Panda.png", 17).setOrigin(0, 1).setScale(1.25).setName("panda");
    this.boxes = this.add.group({ classType: Phaser.GameObjects.Image, defaultKey: "dirt_06.png", name: "boxes" });
    this.rock = this.add.tileSprite(0, 426, 400, 64, "rock_06.png").setOrigin(0, 0).setName("rock");
    this.grass = this.add.tileSprite(0, 392, 400, 64, "top_grass_01.png").setOrigin(0, 0).setName("grass");
    this.score = this.add
      .text(20, 20, "0", { fontFamily: "Arial", fontSize: "30px", color: "#ffffff" })
      .setName("score");
    this.input.on("pointerdown", () => {
      this.run.jump();
    });
    [this.input.keyboard]
      .filter((keyboard) => keyboard !== null)
      .forEach((keyboard) => {
        this.listenForSpace(keyboard);
      });
    this.draw();
  }

  private listenForSpace(keyboard: Phaser.Input.Keyboard.KeyboardPlugin): void {
    keyboard.addCapture("SPACE");
    keyboard.on("keydown-SPACE", () => {
      this.run.jump();
    });
  }

  override update(_time: number, delta: number): void {
    this.run.advance(delta * this.timeScale);
    this.draw();
  }

  private draw(): void {
    const view = this.run.view();
    this.panda.setY(view.pandaBottom).setFrame(view.pandaFrame);
    this.rock.tilePositionX = view.floorScroll;
    this.grass.tilePositionX = view.floorScroll;
    this.score.setText(view.score);
    this.boxes.getChildren().forEach((box) => {
      this.boxes.killAndHide(box);
    });
    view.boxes.forEach((box) => {
      this.showBox(box);
    });
  }

  private showBox(box: Box): void {
    const image = this.boxes.get(box.x, box.y) as Phaser.GameObjects.Image;
    image.setOrigin(0, 0).setPosition(box.x, box.y).setActive(true).setVisible(true);
  }
}

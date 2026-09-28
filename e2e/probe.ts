import type { Page } from "@playwright/test";
import type { Run } from "../src/rules/index.ts";

type View = ReturnType<Run["view"]>;

interface CenteredText {
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize: string;
  originX: number;
  originY: number;
  visible: boolean;
}

export interface Sample {
  time: number;
  restarts: number;
  gameOver: boolean;
  score: { text: string; x: number; y: number; color: string; fontSize: string };
  best: { text: string; x: number; y: number; color: string; fontSize: string };
  gameOverTitle: CenteredText;
  gameOverScore: CenteredText;
  gameOverBest: CenteredText;
  gameOverPrompt: CenteredText;
  gameOverShare: CenteredText;
  gameOverRuns: CenteredText;
  panda: { x: number; bottom: number; width: number; height: number; frame: number; cutY: number; cutHeight: number; key: string };
  rock: { y: number; scroll: number; key: string };
  grass: { y: number; scroll: number; key: string };
  boxes: { x: number; y: number; width: number; key: string }[];
  clouds: { x: number; y: number; depth: number; key: string }[];
  viewClouds: View["clouds"];
}

interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
  bottom: number;
}

export interface GameText {
  text: string;
  x: number;
  y: number;
  style: { color: string; fontSize: string };
  originX: number;
  originY: number;
  visible: boolean;
  getBounds: () => Bounds;
}

interface GameSprite {
  frame: { name: number; cutY: number; cutHeight: number };
  texture: { key: string };
  getBounds: () => Bounds;
}

interface GameTileSprite {
  y: number;
  tilePositionX: number;
  texture: { key: string };
}

interface GameNode {
  visible: boolean;
  type: string;
  name: string;
  x: number;
  y: number;
  depth: number;
  displayWidth: number;
  texture: { key: string };
}

interface GameScene {
  update: (time: number, delta: number) => void;
  children: {
    getByName: (name: string) => unknown;
    list: readonly GameNode[];
  };
}

interface RunHandle {
  run: Run;
  game: {
    scene: {
      getScene: (key: string) => GameScene;
      isActive: (key: string) => boolean;
    };
  };
}

interface ProbeHandle {
  sample: () => Sample;
  advance: (ms: number) => Sample[];
  untilGameOver: (limit: number) => { before: Sample; after: Sample };
  untilRestart: (limit: number) => { before: Sample; diedAt: Sample; after: Sample };
}

declare global {
  interface Window {
    pandaJump?: RunHandle;
    probe: ProbeHandle;
  }
}

const installProbe = () => {
  const handle = window.pandaJump;
  if (!handle) throw new Error("PandaJump has not started");
  const scene = handle.game.scene.getScene("run");
  const named = (name: string) => scene.children.getByName(name);
  const centeredText = (name: string): CenteredText => {
    const text = named(name) as GameText;
    return {
      text: text.text,
      x: text.x,
      y: text.y,
      color: text.style.color,
      fontSize: text.style.fontSize,
      originX: text.originX,
      originY: text.originY,
      visible: text.visible,
    };
  };
  const sample = (): Sample => {
    scene.update(0, 0);
    const view = handle.run.view();
    const panda = named("panda") as GameSprite;
    const score = named("score") as GameText;
    const best = named("best") as GameText;
    const rock = named("rock") as GameTileSprite;
    const grass = named("grass") as GameTileSprite;
    const bounds = panda.getBounds();
    return {
      time: view.time,
      restarts: view.restarts,
      gameOver: view.gameOver,
      score: { text: score.text, x: score.x, y: score.y, color: score.style.color, fontSize: score.style.fontSize },
      best: { text: best.text, x: best.x, y: best.y, color: best.style.color, fontSize: best.style.fontSize },
      gameOverTitle: centeredText("gameOverTitle"),
      gameOverScore: centeredText("gameOverScore"),
      gameOverBest: centeredText("gameOverBest"),
      gameOverPrompt: centeredText("gameOverPrompt"),
      gameOverShare: centeredText("gameOverShare"),
      gameOverRuns: centeredText("gameOverRuns"),
      panda: {
        x: bounds.x,
        bottom: bounds.bottom,
        width: bounds.width,
        height: bounds.height,
        frame: panda.frame.name,
        cutY: panda.frame.cutY,
        cutHeight: panda.frame.cutHeight,
        key: panda.texture.key,
      },
      rock: { y: rock.y, scroll: rock.tilePositionX, key: rock.texture.key },
      grass: { y: grass.y, scroll: grass.tilePositionX, key: grass.texture.key },
      boxes: scene.children.list
        .filter((child) => child.visible && child.type === "Image" && child.name === "box")
        .map((child) => ({ x: child.x, y: child.y, width: child.displayWidth, key: child.texture.key })),
      clouds: scene.children.list
        .filter((child) => child.visible && child.type === "Image" && child.name === "cloud")
        .map((child) => ({ x: child.x, y: child.y, depth: child.depth, key: child.texture.key })),
      viewClouds: view.clouds,
    };
  };
  const advance = (ms: number): Sample[] => {
    const samples: Sample[] = [];
    for (let done = 0; done < ms; done += 16) {
      handle.run.advance(Math.min(16, ms - done));
      samples.push(sample());
    }
    return samples;
  };
  const untilGameOver = (limit: number): { before: Sample; after: Sample } => {
    let before = sample();
    for (let done = 0; done < limit; done += 16) {
      handle.run.advance(16);
      const after = sample();
      if (after.gameOver) return { before, after };
      before = after;
    }
    throw new Error("the run did not end");
  };
  const untilRestart = (limit: number): { before: Sample; diedAt: Sample; after: Sample } => {
    const { before, after: diedAt } = untilGameOver(limit);
    handle.run.advance(500);
    handle.run.jump();
    return { before, diedAt, after: sample() };
  };
  window.probe = { sample, advance, untilGameOver, untilRestart };
};

export const openGame = async (page: Page, random: number[]): Promise<void> => {
  await page.goto(`./?clock=manual&random=${random.join(",")}`);
  await page.waitForFunction(() => window.pandaJump?.game.scene.isActive("run"));
  await page.evaluate(installProbe);
};

export const reload = async (page: Page): Promise<void> => {
  await page.reload();
  await page.waitForFunction(() => window.pandaJump?.game.scene.isActive("run"));
  await page.evaluate(installProbe);
};

export const sample = (page: Page): Promise<Sample> => page.evaluate(() => window.probe.sample());

export const advance = (page: Page, ms: number): Promise<Sample[]> =>
  page.evaluate((duration) => window.probe.advance(duration), ms);

export const advanceTo = async (page: Page, time: number): Promise<Sample[]> => {
  const now = await sample(page);
  return advance(page, time - now.time);
};

export const untilGameOver = (page: Page, limit = 30_000): Promise<{ before: Sample; after: Sample }> =>
  page.evaluate((duration) => window.probe.untilGameOver(duration), limit);

export const untilRestart = (page: Page, limit = 30_000): Promise<{ before: Sample; diedAt: Sample; after: Sample }> =>
  page.evaluate((duration) => window.probe.untilRestart(duration), limit);

export const settle = (page: Page) =>
  page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));

export const pressSpace = async (page: Page) => {
  await page.keyboard.press("Space");
  await settle(page);
};

export const play = async (page: Page, jumps: number[], until: number): Promise<Sample[]> => {
  const samples: Sample[] = [];
  for (const jump of jumps) {
    samples.push(...(await advanceTo(page, jump)));
    await pressSpace(page);
  }
  samples.push(...(await advanceTo(page, until)));
  return samples;
};

export const pixelRows = async (page: Page, rows: number[]): Promise<number[][][]> => {
  await settle(page);
  const shot = await page.locator("#game_div canvas").screenshot();
  return page.evaluate(
    async ({ data, wanted }) => {
      const blob = await (await fetch(`data:image/png;base64,${data}`)).blob();
      const bitmap = await createImageBitmap(blob);
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("2d context is not available");
      context.drawImage(bitmap, 0, 0);
      return wanted.map((y) => {
        const bytes = Array.from(context.getImageData(0, y, bitmap.width, 1).data);
        return Array.from({ length: bitmap.width }, (_, x) => bytes.slice(x * 4, x * 4 + 3));
      });
    },
    { data: shot.toString("base64"), wanted: rows },
  );
};

export const heightOf = (entry: Sample) => 426 - entry.panda.bottom;

export interface Column {
  x: number;
  boxes: Sample["boxes"];
}

export const columnsAt = (entry: Sample): Column[] => {
  const lefts = [...new Set(entry.boxes.map((box) => box.x))].sort((a, b) => a - b);
  return lefts.map((x) => ({ x, boxes: entry.boxes.filter((box) => box.x === x) }));
};

export const oneBox = [0.25, 0.5, 0];
export const twoBoxes = [0.75, 0.5, 0];
export const oneBoxAndSecond = [0.25, 0, 0];
export const twoBoxesAndSecond = [0.75, 0, 0];

export const standardRandom = (exceptions: Record<number, number[]> = {}) =>
  Array.from({ length: 40 }, (_, index) => exceptions[index + 1] ?? oneBox).flat();

export const standardJumps = (until: number) =>
  Array.from({ length: 40 }, (_, index) => 1500 * (index + 1) + 1200).filter((time) => time <= until);

export const at = <T>(items: readonly T[], index: number): T => {
  const item = items.at(index);
  if (item === undefined) throw new Error(`expected an element at index ${String(index)}`);
  return item;
};

export const first = <T>(items: readonly T[]): T => at(items, 0);
export const last = <T>(items: readonly T[]): T => at(items, -1);

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
  bounds: Bounds;
  depth: number;
}

export interface Sample {
  time: number;
  restarts: number;
  ready: boolean;
  gameOver: boolean;
  score: { text: string; x: number; y: number; color: string; fontSize: string; scale: number };
  best: { text: string; x: number; y: number; color: string; fontSize: string };
  speedUp: CenteredText;
  doubleJumpHint: CenteredText;
  readyPrompt: CenteredText;
  gameOverTitle: CenteredText;
  gameOverMedal: CenteredText;
  gameOverScore: CenteredText;
  gameOverBest: CenteredText;
  gameOverPrompt: CenteredText;
  gameOverShare: CenteredText;
  gameOverRuns: CenteredText;
  pauseTitle: CenteredText;
  pausePrompt: CenteredText;
  pauseButton: CenteredText;
  gameOverCopy: CenteredText;
  bestMarker: CenteredText;
  countdownText: CenteredText;
  panda: {
    x: number;
    bottom: number;
    width: number;
    height: number;
    frame: number;
    cutY: number;
    cutHeight: number;
    key: string;
    flipY: boolean;
    depth: number;
    angle: number;
    scaleX: number;
    scaleY: number;
  };
  hills: { y: number; height: number; depth: number; scroll: number; key: string; visible: boolean };
  viewHills: { scroll: number; color: string };
  floorScroll: number;
  rock: { y: number; scroll: number; key: string };
  grass: { y: number; scroll: number; key: string };
  boxes: { x: number; y: number; width: number; key: string; depth: number; tint: number }[];
  clouds: { x: number; y: number; depth: number; key: string }[];
  stars: { x: number; y: number; depth: number; radius: number; color: number }[];
  deathFlash: { x: number; y: number; width: number; height: number; alpha: number; color: string; depth: number };
  viewClouds: View["clouds"];
  viewDeathFlash: View["deathFlash"];
  pandaShadow: {
    x: number;
    y: number;
    scale: number;
    visible: boolean;
    width: number;
    height: number;
    alpha: number;
    color: string;
    depth: number;
    order: number;
  };
  viewPandaShadow: View["pandaShadow"];
  order: { rock: number; grass: number; panda: number };
  depth: { rock: number; grass: number; panda: number };
  airPuff: { x: number; y: number; alpha: number; visible: boolean };
  gameOverMedalBadge: {
    x: number;
    y: number;
    visible: boolean;
    depth: number;
    fill: string;
    radius: number;
    strokeWidth: number;
    stroke: string;
    strokeRadius: number;
  };
  viewAirPuff: View["airPuff"];
  landingPuff: { x: number; y: number; alpha: number; visible: boolean };
  viewLandingPuff: View["landingPuff"];
  sky: string;
  cameraSky: string;
  biome: string;
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
  scale: number;
  depth: number;
  getBounds: () => Bounds;
}

interface GameSprite {
  frame: { name: number; cutY: number; cutHeight: number };
  texture: { key: string };
  flipY: boolean;
  depth: number;
  angle: number;
  scaleX: number;
  scaleY: number;
  getBounds: () => Bounds;
}

interface GameRectangle {
  x: number;
  y: number;
  displayWidth: number;
  displayHeight: number;
  alpha: number;
  fillColor: number;
  depth: number;
}

interface GameTileSprite {
  y: number;
  height: number;
  visible: boolean;
  depth: number;
  tilePositionX: number;
  texture: { key: string };
}

interface GameEllipse {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  visible: boolean;
  displayWidth: number;
  displayHeight: number;
  fillAlpha: number;
  fillColor: number;
  depth: number;
}

interface GameGraphics {
  x: number;
  y: number;
  alpha: number;
  visible: boolean;
  depth: number;
  commandBuffer: number[];
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
  tint: number;
  radius: number;
  fillColor: number;
}

interface GameScene {
  update: (time: number, delta: number) => void;
  children: {
    getByName: (name: string) => unknown;
    list: readonly GameNode[];
  };
  cameras: { main: { backgroundColor: { color: number } } };
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
  hideShadow: () => void;
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

export const installProbe = () => {
  const handle = window.pandaJump;
  if (!handle) throw new Error("PandaJump has not started");
  const scene = handle.game.scene.getScene("run");
  const named = (name: string) => scene.children.getByName(name);
  const centeredText = (name: string): CenteredText => {
    const text = named(name) as GameText;
    const rect = text.getBounds();
    return {
      text: text.text,
      x: text.x,
      y: text.y,
      color: text.style.color,
      fontSize: text.style.fontSize,
      originX: text.originX,
      originY: text.originY,
      visible: text.visible,
      bounds: { x: rect.x, y: rect.y, width: rect.width, height: rect.height, bottom: rect.bottom },
      depth: text.depth,
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
    const hills = named("hills") as GameTileSprite;
    const deathFlash = named("deathFlash") as GameRectangle;
    const airPuff = named("airPuff") as GameGraphics;
    const badge = named("gameOverMedalBadge") as GameGraphics;
    const command = (index: number): number => badge.commandBuffer[index] ?? Number.NaN;
    const hex = (color: number): string => `#${color.toString(16).padStart(6, "0")}`;
    const shadow = named("pandaShadow") as GameEllipse;
    const orderOf = (name: string) => scene.children.list.indexOf(named(name) as object as (typeof scene.children.list)[number]);
    const landingPuff = named("landingPuff") as GameGraphics;
    const bounds = panda.getBounds();
    return {
      time: view.time,
      restarts: view.restarts,
      ready: view.ready,
      gameOver: view.gameOver,
      score: {
        text: score.text,
        x: score.x,
        y: score.y,
        color: score.style.color,
        fontSize: score.style.fontSize,
        scale: score.scale,
      },
      best: { text: best.text, x: best.x, y: best.y, color: best.style.color, fontSize: best.style.fontSize },
      speedUp: centeredText("speedUp"),
      doubleJumpHint: centeredText("doubleJumpHint"),
      readyPrompt: centeredText("readyPrompt"),
      gameOverTitle: centeredText("gameOverTitle"),
      gameOverMedal: centeredText("gameOverMedal"),
      gameOverScore: centeredText("gameOverScore"),
      gameOverBest: centeredText("gameOverBest"),
      gameOverPrompt: centeredText("gameOverPrompt"),
      gameOverShare: centeredText("gameOverShare"),
      gameOverRuns: centeredText("gameOverRuns"),
      pauseTitle: centeredText("pauseTitle"),
      pausePrompt: centeredText("pausePrompt"),
      pauseButton: centeredText("pauseButton"),
      gameOverCopy: centeredText("gameOverCopy"),
      bestMarker: centeredText("bestMarker"),
      countdownText: centeredText("countdownText"),
      panda: {
        x: bounds.x,
        bottom: bounds.bottom,
        width: bounds.width,
        height: bounds.height,
        frame: panda.frame.name,
        cutY: panda.frame.cutY,
        cutHeight: panda.frame.cutHeight,
        key: panda.texture.key,
        flipY: panda.flipY,
        depth: panda.depth,
        angle: panda.angle,
        scaleX: panda.scaleX,
        scaleY: panda.scaleY,
      },
      hills: {
        y: hills.y,
        height: hills.height,
        depth: hills.depth,
        scroll: hills.tilePositionX,
        key: hills.texture.key,
        visible: hills.visible,
      },
      viewHills: { scroll: view.hillsScroll, color: view.hillColor },
      floorScroll: view.floorScroll,
      rock: { y: rock.y, scroll: rock.tilePositionX, key: rock.texture.key },
      grass: { y: grass.y, scroll: grass.tilePositionX, key: grass.texture.key },
      boxes: scene.children.list
        .filter((child) => child.visible && child.type === "Image" && child.name === "box")
        .map((child) => ({
          x: child.x,
          y: child.y,
          width: child.displayWidth,
          key: child.texture.key,
          depth: child.depth,
          tint: child.tint,
        })),
      clouds: scene.children.list
        .filter((child) => child.visible && child.type === "Image" && child.name === "cloud")
        .map((child) => ({ x: child.x, y: child.y, depth: child.depth, key: child.texture.key })),
      stars: scene.children.list
        .filter((child) => child.visible && child.name === "star")
        .map((child) => ({ x: child.x, y: child.y, depth: child.depth, radius: child.radius, color: child.fillColor })),
      deathFlash: {
        x: deathFlash.x,
        y: deathFlash.y,
        width: deathFlash.displayWidth,
        height: deathFlash.displayHeight,
        alpha: deathFlash.alpha,
        color: `#${deathFlash.fillColor.toString(16).padStart(6, "0")}`,
        depth: deathFlash.depth,
      },
      viewClouds: view.clouds,
      viewDeathFlash: view.deathFlash,
      pandaShadow: {
        x: shadow.x,
        y: shadow.y,
        scale: shadow.scaleX,
        visible: shadow.visible,
        width: shadow.displayWidth / shadow.scaleX,
        height: shadow.displayHeight / shadow.scaleY,
        alpha: shadow.fillAlpha,
        color: `#${shadow.fillColor.toString(16).padStart(6, "0")}`,
        depth: shadow.depth,
        order: orderOf("pandaShadow"),
      },
      viewPandaShadow: view.pandaShadow,
      order: { rock: orderOf("rock"), grass: orderOf("grass"), panda: orderOf("panda") },
      depth: { rock: rock.depth, grass: grass.depth, panda: panda.depth },
      airPuff: { x: airPuff.x, y: airPuff.y, alpha: airPuff.alpha, visible: airPuff.visible },
      gameOverMedalBadge: {
        x: badge.x,
        y: badge.y,
        visible: badge.visible,
        depth: badge.depth,
        fill: hex(command(1)),
        radius: command(7),
        strokeWidth: command(14),
        stroke: hex(command(15)),
        strokeRadius: command(21),
      },
      viewAirPuff: view.airPuff,
      landingPuff: { x: landingPuff.x, y: landingPuff.y, alpha: landingPuff.alpha, visible: landingPuff.visible },
      viewLandingPuff: view.landingPuff,
      sky: view.sky,
      cameraSky: `#${scene.cameras.main.backgroundColor.color.toString(16).padStart(6, "0")}`,
      biome: view.biome.name,
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
  const hideShadow = () => {
    (named("pandaShadow") as GameEllipse).visible = false;
  };
  window.probe = { sample, hideShadow, advance, untilGameOver, untilRestart };
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

export const press = async (page: Page, key: string) => {
  await page.keyboard.press(key);
  await settle(page);
};

export const pressSpace = (page: Page) => press(page, "Space");

const setVisibilityState = (page: Page, state: "hidden" | "visible") =>
  page.evaluate((value) => {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => value });
    document.dispatchEvent(new Event("visibilitychange"));
  }, state);

export const hidePage = async (page: Page) => {
  await setVisibilityState(page, "hidden");
  await settle(page);
};

export const showPage = async (page: Page) => {
  await setVisibilityState(page, "visible");
  await settle(page);
};

export const spaceDown = async (page: Page) => {
  await page.keyboard.down("Space");
  await settle(page);
};

export const spaceUp = async (page: Page) => {
  await page.keyboard.up("Space");
  await settle(page);
};

export const startRun = (page: Page) => press(page, "Space");

export const play = async (page: Page, jumps: number[], until: number, key = "Space"): Promise<Sample[]> => {
  const samples: Sample[] = [];
  for (const jump of jumps) {
    samples.push(...(await advanceTo(page, jump)));
    await press(page, key);
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

const SCHEDULED_COLUMNS = 80;
const COLUMN_TRAVEL_PX = 364;

const pxPerMsAt = (score: number): number => (score < 20 ? 0.2 : Math.min(0.2 + (Math.floor((score - 20) / 10) + 1) * 0.02, 0.3));

const gapAt = (score: number): number => (score < 20 ? 1500 : Math.max(1500 - (Math.floor((score - 20) / 10) + 1) * 50, 1250));

const clearTimeOf = (spawn: number, clears: readonly number[]): number => {
  let time = spawn;
  let cleared = clears.filter((clear) => clear <= spawn).length;
  let remaining = COLUMN_TRAVEL_PX;
  for (;;) {
    const speed = pxPerMsAt(cleared);
    const change = clears[cleared] ?? Infinity;
    if (speed * (change - time) >= remaining) return time + remaining / speed;
    remaining -= speed * (change - time);
    time = change;
    cleared += 1;
  }
};

const buildSchedule = (): { spawns: number[]; clears: number[] } => {
  const spawns: number[] = [];
  const clears: number[] = [];
  let spawn = gapAt(0);
  for (let column = 1; column <= SCHEDULED_COLUMNS; column += 1) {
    spawns.push(spawn);
    clears.push(clearTimeOf(spawn, clears));
    spawn += gapAt(clears.filter((clear) => clear <= spawn).length);
  }
  return { spawns, clears };
};

const schedule = buildSchedule();

export const spawnTimeOf = (column: number): number => at(schedule.spawns, column - 1);

export const columnClearTime = (column: number): number => Math.ceil(at(schedule.clears, column - 1));

export const standardJumps = (until: number) =>
  Array.from({ length: 40 }, (_, index) => spawnTimeOf(index + 1) + 1200).filter((time) => time <= until);

export const at = <T>(items: readonly T[], index: number): T => {
  const item = items.at(index);
  if (item === undefined) throw new Error(`expected an element at index ${String(index)}`);
  return item;
};

export const first = <T>(items: readonly T[]): T => at(items, 0);
export const last = <T>(items: readonly T[]): T => at(items, -1);

export interface SpawnRecord {
  time: number;
  score: number;
}

export const spawnLog = (page: Page, jumps: number[], until: number): Promise<SpawnRecord[]> =>
  page.evaluate(
    ({ jumpTimes, end }) => {
      const handle = window.pandaJump;
      if (!handle) throw new Error("PandaJump has not started");
      const spawns: { time: number; score: number }[] = [];
      const pending = [...jumpTimes];
      let front = -Infinity;
      while (handle.run.view().time < end) {
        handle.run.advance(1);
        const view = handle.run.view();
        const now = Math.max(-Infinity, ...view.boxes.map((box) => box.x));
        if (now > front) spawns.push({ time: view.time, score: Number(view.score) });
        front = now;
        if (pending[0] !== undefined && view.time >= pending[0]) {
          pending.shift();
          handle.run.jump();
        }
      }
      return spawns;
    },
    { jumpTimes: jumps, end: until },
  );

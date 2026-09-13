import type { Page } from "@playwright/test";

export interface Sample {
  time: number;
  restarts: number;
  score: { text: string; x: number; y: number; color: string; fontSize: string };
  panda: { x: number; bottom: number; width: number; height: number; frame: number; cutY: number; cutHeight: number; key: string };
  rock: { y: number; scroll: number; key: string };
  grass: { y: number; scroll: number; key: string };
  boxes: { x: number; y: number; width: number; key: string }[];
}

const installProbe = () => {
  const handle = (window as any).pandaJump;
  const scene = handle.game.scene.getScene("run");
  const named = (name: string) => scene.children.getByName(name);
  const sample = () => {
    scene.update(0, 0);
    const view = handle.run.view();
    const panda = named("panda");
    const score = named("score");
    const rock = named("rock");
    const grass = named("grass");
    const bounds = panda.getBounds();
    return {
      time: view.time,
      restarts: view.restarts,
      score: { text: score.text, x: score.x, y: score.y, color: score.style.color, fontSize: score.style.fontSize },
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
        .filter((child: any) => child.visible && child.type === "Image")
        .map((child: any) => ({ x: child.x, y: child.y, width: child.displayWidth, key: child.texture.key })),
    };
  };
  const advance = (ms: number) => {
    const samples = [];
    for (let done = 0; done < ms; done += 16) {
      handle.run.advance(Math.min(16, ms - done));
      samples.push(sample());
    }
    return samples;
  };
  const untilRestart = (limit: number) => {
    const restarts = handle.run.view().restarts;
    const before = [];
    for (let done = 0; done < limit; done += 16) {
      const last = sample();
      handle.run.advance(16);
      const next = sample();
      if (next.restarts !== restarts) return { before: last, after: next, samples: before };
      before.push(next);
    }
    throw new Error("the run did not restart");
  };
  (window as any).probe = { sample, advance, untilRestart };
};

export const openGame = async (page: Page, random: number[]) => {
  await page.goto(`./?clock=manual&random=${random.join(",")}`);
  await page.waitForFunction(() => (window as any).pandaJump?.game.scene.isActive("run"));
  await page.evaluate(installProbe);
};

export const sample = (page: Page): Promise<Sample> => page.evaluate(() => (window as any).probe.sample());

export const advance = (page: Page, ms: number): Promise<Sample[]> =>
  page.evaluate((duration) => (window as any).probe.advance(duration), ms);

export const advanceTo = async (page: Page, time: number): Promise<Sample[]> => {
  const now = await sample(page);
  return advance(page, time - now.time);
};

export const untilRestart = (page: Page, limit = 30_000): Promise<{ before: Sample; after: Sample; samples: Sample[] }> =>
  page.evaluate((duration) => (window as any).probe.untilRestart(duration), limit);

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
      const context = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D;
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

export const columnsAt = (entry: Sample) => {
  const lefts = [...new Set(entry.boxes.map((box) => box.x))].sort((a, b) => a - b);
  return lefts.map((x) => ({ x, boxes: entry.boxes.filter((box) => box.x === x) }));
};

export const oneBox = [0.25, 0.5];
export const twoBoxes = [0.75, 0.5];
export const oneBoxAndSecond = [0.25, 0];
export const twoBoxesAndSecond = [0.75, 0];

export const standardRandom = (exceptions: Record<number, number[]> = {}) =>
  Array.from({ length: 40 }, (_, index) => exceptions[index + 1] ?? oneBox).flat();

export const standardJumps = (until: number) =>
  Array.from({ length: 40 }, (_, index) => 1500 * (index + 1) + 1200).filter((time) => time <= until);

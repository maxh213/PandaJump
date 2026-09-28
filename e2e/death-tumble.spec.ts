import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import {
  advance,
  last,
  oneBox,
  openGame,
  play,
  press,
  sample,
  startRun,
  twoBoxes,
  untilGameOver,
  untilRestart,
} from "./probe.ts";
import type { Sample } from "./probe.ts";

const mockSupportedShare = (page: Page) =>
  page.addInitScript(() => {
    Object.defineProperty(navigator, "share", { configurable: true, value: () => Promise.resolve() });
  });

const dieAboveTheFloor = async (page: Page): Promise<{ before: Sample; after: Sample }> => {
  await openGame(page, twoBoxes);
  await startRun(page);
  await play(page, [2300], 2875);
  return untilGameOver(page);
};

test.describe("Rule: A panda that dies above the floor keeps falling until it lands", () => {
  test("Dying on top of a two-box column drops the panda straight down to the floor", async ({ page }) => {
    const { after: diedAt } = await dieAboveTheFloor(page);
    expect(diedAt.panda.bottom).toBeLessThan(426);

    let previous = diedAt.panda.bottom;
    for (const entry of await advance(page, 1000)) {
      expect(entry.panda.bottom).toBeGreaterThanOrEqual(previous);
      expect(entry.panda.bottom).toBeLessThanOrEqual(426);
      previous = entry.panda.bottom;
    }
    expect(previous).toBe(426);

    const settled = last(await advance(page, 100));
    expect(settled.panda.bottom).toBe(426);
  });
});

test.describe("Rule: Everything except the panda's height stays frozen while it falls after death", () => {
  test("Game time, score, the columns, the clouds and the floor scroll do not move while the panda falls", async ({
    page,
  }) => {
    const { after: diedAt } = await dieAboveTheFloor(page);
    const later = last(await advance(page, 1000));
    expect(later.panda.bottom).not.toBe(diedAt.panda.bottom);
    expect(later.time).toBe(diedAt.time);
    expect(later.score.text).toBe(diedAt.score.text);
    expect(later.boxes.map((box) => box.x)).toEqual(diedAt.boxes.map((box) => box.x));
    expect(later.viewClouds).toEqual(diedAt.viewClouds);
    expect(later.rock.scroll).toBe(diedAt.rock.scroll);
    expect(later.grass.scroll).toBe(diedAt.grass.scroll);
  });
});

test.describe("Rule: The panda is drawn upside down for exactly as long as the game is over", () => {
  test("The panda flips the instant it dies and flips back the instant it restarts", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    expect((await sample(page)).panda.flipY).toBe(false);
    const { after: diedAt } = await untilGameOver(page);
    expect(diedAt.panda.flipY).toBe(true);
    const restart = await untilRestart(page);
    expect(restart.after.panda.flipY).toBe(false);
  });
});

test.describe("Rule: A panda that dies already on the floor does not need to fall", () => {
  test("Dying without ever leaving the floor keeps the panda's feet at y 426", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    const { after: diedAt } = await untilGameOver(page);
    expect(diedAt.panda.bottom).toBe(426);
    const later = last(await advance(page, 500));
    expect(later.panda.bottom).toBe(426);
  });
});

test.describe("Rule: The death tumble does not change the restart freeze or restart behaviour", () => {
  test("The restart freeze, restart and Share score behave exactly as before after a mid-air death", async ({
    page,
  }) => {
    await mockSupportedShare(page);
    const { after: diedAt } = await dieAboveTheFloor(page);
    expect(diedAt.gameOverPrompt.visible).toBe(false);
    const ready = last(await advance(page, 600));
    expect(ready.gameOverPrompt).toMatchObject({
      text: "Tap, press Space or the Up Arrow key to play again",
      visible: true,
    });
    expect(ready.gameOverShare.visible).toBe(true);
    await press(page, "Space");
    const after = await sample(page);
    expect(after.restarts).toBe(1);
    expect(after.gameOver).toBe(false);
    expect(after.score.text).toBe("0");
    expect(after.panda).toMatchObject({ x: 100, bottom: 426, flipY: false });
    expect(after.boxes).toEqual([]);
  });
});

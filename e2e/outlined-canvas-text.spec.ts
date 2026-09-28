import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { oneBox, openGame, play, sample, startRun, untilGameOver } from "./probe.ts";

const EXTRA_COLUMNS = 3;
const JUMP_OFFSET = 788;
const CLEAR_BUFFER = 20;
const RAMP_COLUMN = 20;

const NAMES = [
  "score",
  "best",
  "speedUp",
  "gameOverTitle",
  "gameOverMedal",
  "gameOverScore",
  "gameOverBest",
  "gameOverPrompt",
  "gameOverShare",
  "gameOverCopy",
  "gameOverRuns",
  "pauseTitle",
  "pausePrompt",
  "bestMarker",
  "countdownText",
];

interface Outline {
  name: string;
  stroke: string;
  strokeThickness: number;
  color: string;
}

interface OutlineStyle {
  stroke: string;
  strokeThickness: number;
  color: string;
}

const outlines = (page: Page): Promise<Outline[]> =>
  page.evaluate((names) => {
    const handle = window.pandaJump;
    if (!handle) throw new Error("PandaJump has not started");
    const scene = handle.game.scene.getScene("run");
    return names.map((name) => {
      const style = (scene.children.getByName(name) as { style: OutlineStyle }).style;
      return { name, stroke: style.stroke, strokeThickness: style.strokeThickness, color: style.color };
    });
  }, NAMES);

const expectAllOutlined = async (page: Page): Promise<void> => {
  const found = await outlines(page);
  expect(found.map((entry) => entry.name)).toEqual(NAMES);
  for (const entry of found) {
    expect(entry.stroke, entry.name).toBe("#000000");
    expect(entry.strokeThickness, entry.name).toBe(4);
  }
};

test.describe("Rule: Every text is outlined while the run is live", () => {
  test("The texts are outlined the moment a run starts", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    await expectAllOutlined(page);
  });
});

test.describe("Rule: Every text is still outlined after a death", () => {
  test("The texts are outlined on the game-over screen", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    await untilGameOver(page);
    expect((await sample(page)).gameOverTitle.visible).toBe(true);
    await expectAllOutlined(page);
  });
});

test.describe("Rule: The gold callout is outlined while the sunset sky shows", () => {
  test("The \"Faster!\" callout is gold and outlined on the sunset sky", async ({ page }) => {
    test.setTimeout(60_000);
    const random = Array.from({ length: RAMP_COLUMN + EXTRA_COLUMNS }, () => oneBox).flat();
    await openGame(page, random);
    await startRun(page);
    const jumps = Array.from({ length: RAMP_COLUMN }, (_, index) => 1500 * (index + 1) + JUMP_OFFSET);
    await play(page, jumps, 1500 * RAMP_COLUMN + 1820 + CLEAR_BUFFER);
    const state = await sample(page);
    expect(state.sky).toBe("#f4a261");
    expect(state.cameraSky).toBe("#f4a261");
    expect(state.speedUp.visible).toBe(true);
    expect(state.speedUp.color).toBe("#ffd700");
    const callout = (await outlines(page)).find((entry) => entry.name === "speedUp");
    expect(callout).toMatchObject({ stroke: "#000000", strokeThickness: 4, color: "#ffd700" });
  });
});

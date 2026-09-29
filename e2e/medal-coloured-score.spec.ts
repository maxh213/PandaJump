import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { columnClearTime, last, oneBox, openGame, play, sample, spawnTimeOf, startRun, untilGameOver, untilRestart } from "./probe.ts";

const JUMP_OFFSET = 788;
const EXTRA_COLUMNS = 3;

const clearedBy = (column: number): number => columnClearTime(column) + 200;

const rampedRandom = (column: number): number[] => Array.from({ length: column + EXTRA_COLUMNS }, () => oneBox).flat();

const jumpTimesFor = (column: number): number[] =>
  Array.from({ length: column }, (_, index) => spawnTimeOf(index + 1) + JUMP_OFFSET);

const colourFor = (score: number): string => {
  if (score >= 40) return "#e5e4e2";
  if (score >= 30) return "#ffd700";
  if (score >= 20) return "#c0c0c0";
  if (score >= 10) return "#cd7f32";
  return "#ffffff";
};

const playThroughColumn = async (page: Page, column: number) => {
  await openGame(page, rampedRandom(column));
  await startRun(page);
  return play(page, jumpTimesFor(column), clearedBy(column));
};

const outline = (page: Page) =>
  page.evaluate(() => {
    const handle = window.pandaJump;
    if (!handle) throw new Error("PandaJump has not started");
    const text = handle.game.scene.getScene("run").children.getByName("score") as {
      style: { stroke: string; strokeThickness: number };
    };
    return { stroke: text.style.stroke, strokeThickness: text.style.strokeThickness };
  });

test.describe("Rule: The score stays white below a score of 10", () => {
  test("Scores 0 to 9 are white", async ({ page }) => {
    const samples = await playThroughColumn(page, 9);
    expect(Number(last(samples).score.text)).toBe(9);
    for (const entry of samples) expect(entry.score.color).toBe("#ffffff");
  });
});

test.describe("Rule: The score takes the colour of the medal the run has earned", () => {
  for (const [column, colour] of [
    [10, "#cd7f32"],
    [20, "#c0c0c0"],
    [30, "#ffd700"],
    [40, "#e5e4e2"],
  ] as const) {
    test(`Reaching ${String(column)} recolours the score to ${colour} on the frame the number changes`, async ({ page }) => {
      test.setTimeout(120_000);
      const samples = await playThroughColumn(page, column);
      for (const entry of samples) {
        expect(entry.score.color, `score ${entry.score.text}`).toBe(colourFor(Number(entry.score.text)));
      }
      const before = samples.filter((entry) => entry.score.text === String(column - 1));
      const after = samples.filter((entry) => entry.score.text === String(column));
      expect(before.length).toBeGreaterThan(0);
      expect(last(before).score.color).not.toBe(colour);
      expect(after.length).toBeGreaterThan(0);
      expect(after.every((entry) => entry.score.color === colour)).toBe(true);
    });
  }
});

test.describe("Rule: The outline, position and pop are unchanged", () => {
  test("A coloured score keeps its outline, position and pop", async ({ page }) => {
    const samples = await playThroughColumn(page, 10);
    const popped = samples.filter((entry) => entry.score.text === "10");
    expect(Math.max(...popped.map((entry) => entry.score.scale))).toBeCloseTo(1.3, 1);
    const now = await sample(page);
    expect(now.score).toMatchObject({ x: 20, y: 20, color: "#cd7f32" });
    expect(await outline(page)).toEqual({ stroke: "#000000", strokeThickness: 4 });
  });
});

test.describe("Rule: A restart returns the score to white", () => {
  test("The score is white again after a bronze run restarts", async ({ page }) => {
    await playThroughColumn(page, 10);
    const { after: diedAt } = await untilGameOver(page);
    expect(diedAt.score.color).toBe("#cd7f32");
    const restart = await untilRestart(page);
    expect(restart.after.score).toMatchObject({ text: "0", color: "#ffffff" });
    expect(await outline(page)).toEqual({ stroke: "#000000", strokeThickness: 4 });
  });
});

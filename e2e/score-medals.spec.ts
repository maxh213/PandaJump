import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import {
  advance,
  last,
  oneBox,
  openGame,
  play,
  sample,
  standardJumps,
  startRun,
  untilGameOver,
  untilRestart,
} from "./probe.ts";
import type { GameText, Sample } from "./probe.ts";

const jumpTimeFor = (column: number): number => 1500 * column + 1200;

const playThroughColumn = async (page: Page, column: number): Promise<void> => {
  await play(page, standardJumps(jumpTimeFor(column)), jumpTimeFor(column));
};

const medalBounds = (page: Page) =>
  page.evaluate(() => {
    const handle = window.pandaJump;
    if (!handle) throw new Error("PandaJump has not started");
    const scene = handle.game.scene.getScene("run");
    const named = (name: string) => {
      const bounds = (scene.children.getByName(name) as GameText).getBounds();
      return { y: bounds.y, bottom: bounds.bottom };
    };
    return { title: named("gameOverTitle"), medal: named("gameOverMedal"), score: named("gameOverScore") };
  });

const expectGoal = (after: Sample): void => {
  expect(after.gameOverMedal).toMatchObject({
    text: "Bronze medal at 10",
    x: 200,
    y: 226,
    color: "#ffffff",
    fontSize: "16px",
    visible: true,
  });
  expect(after.gameOverMedalBadge.visible).toBe(false);
};

const expectBadge = (after: Sample, fill: string): void => {
  const { gameOverMedal: medal, gameOverMedalBadge: badge } = after;
  expect(badge).toMatchObject({
    visible: true,
    y: 226,
    fill,
    radius: 10,
    strokeRadius: 10,
    strokeWidth: 2,
    stroke: "#000000",
    depth: medal.depth,
  });
  expect(badge.x).toBeCloseTo(medal.x - medal.bounds.width / 2 - 18);
};

test.describe("Rule: A run that ends below a score of 10 shows the goal instead of a medal", () => {
  test("A run that dies at score 0 shows no medal", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    const { after: diedAt } = await untilGameOver(page);
    expect(diedAt.gameOverScore.text).toBe("Score: 0");
    expectGoal(diedAt);
  });

  test("A run that dies at score 9 shows no medal", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    await playThroughColumn(page, 9);
    const { after: diedAt } = await untilGameOver(page);
    expect(last(await advance(page, 500)).gameOverScore.text).toBe("Score: 9");
    expectGoal(diedAt);
  });
});

test.describe("Rule: The game-over screen shows the medal that matches the final score", () => {
  test("A run that dies at score 10 shows a bronze medal", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    await playThroughColumn(page, 10);
    const { after: diedAt } = await untilGameOver(page);
    expect(last(await advance(page, 500)).gameOverScore.text).toBe("Score: 10");
    expect(diedAt.gameOverMedal).toMatchObject({
      text: "Bronze medal",
      x: 200,
      y: 226,
      color: "#cd7f32",
      fontSize: "16px",
      visible: true,
    });
    expect(diedAt.gameOverMedal.originX).toBeCloseTo(0.5);
    expect(diedAt.gameOverMedal.originY).toBeCloseTo(0.5);
    const bounds = await medalBounds(page);
    expect(bounds.medal.y).toBeGreaterThanOrEqual(bounds.title.bottom);
    expect(bounds.score.y).toBeGreaterThanOrEqual(bounds.medal.bottom);
    expectBadge(diedAt, "#cd7f32");
  });

  test("A run that dies at score 20 shows a silver medal", async ({ page }) => {
    test.setTimeout(60_000);
    await openGame(page, oneBox);
    await startRun(page);
    await playThroughColumn(page, 20);
    const { after: diedAt } = await untilGameOver(page);
    expect(last(await advance(page, 500)).gameOverScore.text).toBe("Score: 20");
    expect(diedAt.gameOverMedal).toMatchObject({
      text: "Silver medal",
      x: 200,
      y: 226,
      color: "#c0c0c0",
      fontSize: "16px",
      visible: true,
    });
    expectBadge(diedAt, "#c0c0c0");
  });
});

test.describe("Rule: The goal line only shows on a game-over screen", () => {
  test("The goal line is hidden while live, paused and after restart until the next game over", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    expect((await sample(page)).gameOverMedal.visible).toBe(false);
    await page.keyboard.press("p");
    const paused = await sample(page);
    expect(paused.pauseTitle.visible).toBe(true);
    expect(paused.gameOverMedal.visible).toBe(false);
    await page.keyboard.press("p");
    const { after: diedAt } = await untilGameOver(page);
    expectGoal(diedAt);
    const restart = await untilRestart(page);
    expect(restart.after.gameOverMedal.visible).toBe(false);
    const { after: diedAgain } = await untilGameOver(page);
    expectGoal(diedAgain);
  });
});

test.describe("Rule: The medal only shows on a game-over screen for the run that earned it", () => {
  test("The medal is hidden while the run is live and disappears after restart", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    await playThroughColumn(page, 10);
    const live = await sample(page);
    expect(live.gameOverMedal.visible).toBe(false);
    expect(live.gameOverMedalBadge.visible).toBe(false);
    const { after: diedAt } = await untilGameOver(page);
    expect(diedAt.gameOverMedal).toMatchObject({ text: "Bronze medal", visible: true });
    const restart = await untilRestart(page);
    expect(restart.after.restarts).toBe(1);
    expect(restart.after.gameOverMedal.visible).toBe(false);
    expect(restart.after.gameOverMedalBadge.visible).toBe(false);
    const { after: diedAgain } = await untilGameOver(page);
    expect(diedAgain.gameOverScore.text).toBe("Score: 0");
    expectGoal(diedAgain);
  });
});

test.describe("Rule: The game-over medal has a coloured disc beside its name", () => {
  for (const [medal, fill] of [
    ["Gold", "#ffd700"],
    ["Platinum", "#e5e4e2"],
  ] as const) {
    test(`A ${medal.toLowerCase()} medal gets a ${medal.toLowerCase()} disc`, async ({ page }) => {
      await openGame(page, oneBox);
      await page.evaluate((chosen) => {
        const handle = window.pandaJump;
        if (!handle) throw new Error("PandaJump has not started");
        const original = handle.run.view.bind(handle.run);
        Object.defineProperty(handle.run, "view", {
          value: () => ({ ...original(), gameOver: true, medal: chosen }),
        });
      }, medal);
      const shown = await sample(page);
      expect(shown.gameOverMedal.text).toBe(`${medal} medal`);
      expectBadge(shown, fill);
    });
  }

  test("The disc is hidden while paused", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    await playThroughColumn(page, 10);
    await page.keyboard.press("p");
    const paused = await sample(page);
    expect(paused.pauseTitle.visible).toBe(true);
    expect(paused.gameOverMedalBadge.visible).toBe(false);
  });

  test("The disc is hidden during the resume countdown", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    await playThroughColumn(page, 10);
    await page.keyboard.press("p");
    await page.keyboard.press("p");
    const counting = await sample(page);
    expect(counting.countdownText.visible).toBe(true);
    expect(counting.gameOverMedalBadge.visible).toBe(false);
  });
});

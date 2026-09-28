import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { advance, last, oneBox, openGame, play, sample, standardJumps, untilGameOver, untilRestart } from "./probe.ts";
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

test.describe("Rule: No medal shows below a score of 10", () => {
  test("A run that dies at score 0 shows no medal", async ({ page }) => {
    await openGame(page, oneBox);
    const { after: diedAt } = await untilGameOver(page);
    expect(diedAt.gameOverScore.text).toBe("Score: 0");
    expect(diedAt.gameOverMedal.visible).toBe(false);
    expect(diedAt.gameOverMedalBadge.visible).toBe(false);
  });

  test("A run that dies at score 9 shows no medal", async ({ page }) => {
    await openGame(page, oneBox);
    await playThroughColumn(page, 9);
    const { after: diedAt } = await untilGameOver(page);
    expect(last(await advance(page, 500)).gameOverScore.text).toBe("Score: 9");
    expect(diedAt.gameOverMedal.visible).toBe(false);
    expect(diedAt.gameOverMedalBadge.visible).toBe(false);
  });
});

test.describe("Rule: The game-over screen shows the medal that matches the final score", () => {
  test("A run that dies at score 10 shows a bronze medal", async ({ page }) => {
    await openGame(page, oneBox);
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

test.describe("Rule: The medal only shows on a game-over screen for the run that earned it", () => {
  test("The medal is hidden while the run is live and disappears after restart", async ({ page }) => {
    await openGame(page, oneBox);
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
    expect(diedAgain.gameOverMedal.visible).toBe(false);
    expect(diedAgain.gameOverMedalBadge.visible).toBe(false);
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
    await playThroughColumn(page, 10);
    await page.keyboard.press("p");
    const paused = await sample(page);
    expect(paused.pauseTitle.visible).toBe(true);
    expect(paused.gameOverMedalBadge.visible).toBe(false);
  });

  test("The disc is hidden during the resume countdown", async ({ page }) => {
    await openGame(page, oneBox);
    await playThroughColumn(page, 10);
    await page.keyboard.press("p");
    await page.keyboard.press("p");
    const counting = await sample(page);
    expect(counting.countdownText.visible).toBe(true);
    expect(counting.gameOverMedalBadge.visible).toBe(false);
  });
});

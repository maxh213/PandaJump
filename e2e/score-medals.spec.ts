import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { oneBox, openGame, play, sample, standardJumps, untilGameOver, untilRestart } from "./probe.ts";
import type { GameText } from "./probe.ts";

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

test.describe("Rule: No medal shows below a score of 10", () => {
  test("A run that dies at score 0 shows no medal", async ({ page }) => {
    await openGame(page, oneBox);
    const { after: diedAt } = await untilGameOver(page);
    expect(diedAt.gameOverScore.text).toBe("Score: 0");
    expect(diedAt.gameOverMedal.visible).toBe(false);
  });

  test("A run that dies at score 9 shows no medal", async ({ page }) => {
    await openGame(page, oneBox);
    await playThroughColumn(page, 9);
    const { after: diedAt } = await untilGameOver(page);
    expect(diedAt.gameOverScore.text).toBe("Score: 9");
    expect(diedAt.gameOverMedal.visible).toBe(false);
  });
});

test.describe("Rule: The game-over screen shows the medal that matches the final score", () => {
  test("A run that dies at score 10 shows a bronze medal", async ({ page }) => {
    await openGame(page, oneBox);
    await playThroughColumn(page, 10);
    const { after: diedAt } = await untilGameOver(page);
    expect(diedAt.gameOverScore.text).toBe("Score: 10");
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
  });

  test("A run that dies at score 20 shows a silver medal", async ({ page }) => {
    test.setTimeout(60_000);
    await openGame(page, oneBox);
    await playThroughColumn(page, 20);
    const { after: diedAt } = await untilGameOver(page);
    expect(diedAt.gameOverScore.text).toBe("Score: 20");
    expect(diedAt.gameOverMedal).toMatchObject({
      text: "Silver medal",
      x: 200,
      y: 226,
      color: "#c0c0c0",
      fontSize: "16px",
      visible: true,
    });
  });
});

test.describe("Rule: The medal only shows on a game-over screen for the run that earned it", () => {
  test("The medal is hidden while the run is live and disappears after restart", async ({ page }) => {
    await openGame(page, oneBox);
    await playThroughColumn(page, 10);
    expect((await sample(page)).gameOverMedal.visible).toBe(false);
    const { after: diedAt } = await untilGameOver(page);
    expect(diedAt.gameOverMedal).toMatchObject({ text: "Bronze medal", visible: true });
    const restart = await untilRestart(page);
    expect(restart.after.restarts).toBe(1);
    expect(restart.after.gameOverMedal.visible).toBe(false);
    const { after: diedAgain } = await untilGameOver(page);
    expect(diedAgain.gameOverScore.text).toBe("Score: 0");
    expect(diedAgain.gameOverMedal.visible).toBe(false);
  });
});

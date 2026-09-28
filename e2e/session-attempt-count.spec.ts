import { expect, test } from "@playwright/test";
import { oneBox, openGame, reload, sample, standardRandom, startRun, untilGameOver, untilRestart } from "./probe.ts";

test.describe("Rule: The game over screen shows the attempt number for this session", () => {
  test("The first death reads Run 1", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    const { after: diedAt } = await untilGameOver(page);
    expect(Math.abs(diedAt.time - 2875)).toBeLessThanOrEqual(16);
    expect(diedAt.gameOverRuns).toMatchObject({
      text: "Run 1",
      x: 200,
      y: 400,
      color: "#ffffff",
      fontSize: "20px",
      visible: true,
    });
    expect(diedAt.gameOverRuns.originX).toBeCloseTo(0.5);
    expect(diedAt.gameOverRuns.originY).toBeCloseTo(0.5);
    expect(diedAt.gameOverTitle.y).toBeLessThan(diedAt.gameOverRuns.y);
    expect(diedAt.gameOverScore.y).toBeLessThan(diedAt.gameOverRuns.y);
    expect(diedAt.gameOverBest.y).toBeLessThan(diedAt.gameOverRuns.y);
    expect(diedAt.gameOverPrompt.y).toBeLessThan(diedAt.gameOverRuns.y);
    expect(diedAt.gameOverShare.y).toBeLessThan(diedAt.gameOverRuns.y);
  });

  test("The count is not shown while the run is live", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    expect((await sample(page)).gameOverRuns.visible).toBe(false);
  });

  test("Each restart increases the attempt number by one", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    const first = await untilGameOver(page);
    expect(first.after.gameOverRuns.text).toBe("Run 1");
    const restart = await untilRestart(page);
    expect(restart.after.restarts).toBe(1);
    const second = await untilGameOver(page);
    expect(second.after.gameOverRuns.text).toBe("Run 2");
  });
});

test.describe("Rule: The attempt count is per session only, not persisted", () => {
  test("A full page reload resets the count back to Run 1", async ({ page }) => {
    await openGame(page, standardRandom());
    await startRun(page);
    await untilRestart(page);
    await untilRestart(page);
    await reload(page);
    await startRun(page);
    const { after: diedAt } = await untilGameOver(page);
    expect(diedAt.gameOverRuns.text).toBe("Run 1");
  });
});

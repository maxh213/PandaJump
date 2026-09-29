import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { advance, oneBox, openGame, play, press, sample, spawnTimeOf, startRun, untilGameOver } from "./probe.ts";

const seedStorage = (page: Page, top: string, best: string) =>
  page.addInitScript(
    (seeded) => {
      localStorage.setItem("pandaJump.topScores", seeded.top);
      localStorage.setItem("pandaJump.best", seeded.best);
    },
    { top, best },
  );

const runToGameOver = async (page: Page, score: number): Promise<void> => {
  const jumps = Array.from({ length: score }, (_, index) => spawnTimeOf(index + 1) + 1200);
  await startRun(page);
  await play(page, jumps, jumps.at(-1) ?? 0);
  await untilGameOver(page);
};

const scoreLineOnceRestartAllowed = async (page: Page): Promise<string> => {
  await advance(page, 500);
  return (await sample(page)).gameOverScore.text;
};

const finish = async (page: Page, top: string, best: string, score: number): Promise<string> => {
  await seedStorage(page, top, best);
  await openGame(page, oneBox);
  await runToGameOver(page, score);
  return scoreLineOnceRestartAllowed(page);
};

test.describe("Rule: The game-over score line says when a run placed 2nd to 5th", () => {
  test("A run ending on 15 among [30,20,10] is the 3rd best", async ({ page }) => {
    expect(await finish(page, "[30,20,10]", "30", 15)).toBe("Score: 15 (3rd best)");
  });

  test("A run ending on 6 among [8,5,3] is the 2nd best", async ({ page }) => {
    expect(await finish(page, "[8,5,3]", "8", 6)).toBe("Score: 6 (2nd best)");
  });

  test("A run ending on 5 among [30,20,10] is the 4th best", async ({ page }) => {
    expect(await finish(page, "[30,20,10]", "30", 5)).toBe("Score: 5 (4th best)");
  });

  test("A run outside a full top five shows no suffix", async ({ page }) => {
    expect(await finish(page, "[50,40,30,20,10]", "50", 5)).toBe("Score: 5");
  });

  test("A run that overtakes the stored best shows no suffix and still says New best", async ({ page }) => {
    await seedStorage(page, "[3,2]", "3");
    await openGame(page, oneBox);
    await runToGameOver(page, 4);
    expect(await scoreLineOnceRestartAllowed(page)).toBe("Score: 4");
    expect((await sample(page)).gameOverBest.text).toBe("New best: 4");
  });

  test("A run equal to the stored best shows no suffix", async ({ page }) => {
    expect(await finish(page, "[3,2]", "3", 3)).toBe("Score: 3");
  });

  test("A run ending on 0 shows no suffix", async ({ page }) => {
    expect(await finish(page, "[3,2]", "3", 0)).toBe("Score: 0");
  });

  test("While the count-up is running the line has no suffix", async ({ page }) => {
    await seedStorage(page, "[30,20,10]", "30");
    await openGame(page, oneBox);
    await runToGameOver(page, 5);
    const counting = (await advance(page, 250)).at(-1);
    expect(counting?.gameOverPrompt.visible).toBe(false);
    expect(counting?.gameOverScore.text).toMatch(/^Score: \d+$/);
    expect(await scoreLineOnceRestartAllowed(page)).toBe("Score: 5 (4th best)");
  });

  test("The next game-over screen computes its suffix afresh", async ({ page }) => {
    await seedStorage(page, "[30,20,10]", "30");
    await openGame(page, oneBox);
    await runToGameOver(page, 2);
    expect(await scoreLineOnceRestartAllowed(page)).toBe("Score: 2 (4th best)");
    await press(page, "Space");
    await untilGameOver(page);
    expect(await scoreLineOnceRestartAllowed(page)).toBe("Score: 0");
  });
});

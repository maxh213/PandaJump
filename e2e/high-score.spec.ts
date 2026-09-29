import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { advanceTo, columnClearTime, oneBox, openGame, play, sample, standardJumps, standardRandom, startRun, untilRestart } from "./probe.ts";
import type { GameText } from "./probe.ts";

const BEST_KEY = "pandaJump.best";

const seedBest = (page: Page, value: number) =>
  page.addInitScript((seeded) => {
    localStorage.setItem("pandaJump.best", String(seeded));
  }, value);

const blockLocalStorage = (page: Page) =>
  page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("blocked");
      },
    });
  });

const reloadAndReadBest = async (page: Page): Promise<string> => {
  await page.reload();
  await page.waitForFunction(() => window.pandaJump?.game.scene.isActive("run"));
  return page.evaluate(() => {
    const handle = window.pandaJump;
    if (!handle) throw new Error("PandaJump has not started");
    return handle.run.view().best;
  });
};

test.describe("Rule: The best score is drawn and kept live", () => {
  test("A first-time player sees a best of 0, drawn bottom-left in white 20px Arial", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    const start = await sample(page);
    expect(start.best).toEqual({ text: "Best: 0", x: 20, y: 450, color: "#ffffff", fontSize: "20px" });
  });

  test("The best updates the instant the live score passes it, not only at death", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    await play(page, [2700], 3300);
    const beforeClear = await sample(page);
    expect(beforeClear.best.text).toBe("Best: 0");
    expect(beforeClear.score.text).toBe("0");
    const afterClear = (await advanceTo(page, 3340)).at(-1);
    expect(afterClear).toMatchObject({ score: { text: "1" }, best: { text: "Best: 1" }, restarts: 0 });
  });

  test("Dying does not reset the best already reached", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    await play(page, [2700], 3340);
    expect((await sample(page)).best.text).toBe("Best: 1");
    const restart = await untilRestart(page);
    expect(restart.after.restarts).toBe(1);
    const after = await sample(page);
    expect(after.score.text).toBe("0");
    expect(after.best.text).toBe("Best: 1");
  });

  test("A lower score never lowers the best", async ({ page }) => {
    await seedBest(page, 5);
    await openGame(page, oneBox);
    await startRun(page);
    expect((await sample(page)).best.text).toBe("Best: 5");
    await untilRestart(page);
    const after = await sample(page);
    expect(after.score.text).toBe("0");
    expect(after.best.text).toBe("Best: 5");
  });
});

test.describe("Rule: The best is kept in the browser between visits", () => {
  test("A returning player sees their stored best on load", async ({ page }) => {
    await seedBest(page, 7);
    await openGame(page, oneBox);
    await startRun(page);
    expect((await sample(page)).best.text).toBe("Best: 7");
  });

  test("Beating the stored best persists it across a reload", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    await play(page, [2700], 3340);
    expect((await sample(page)).best.text).toBe("Best: 1");
    expect(await page.evaluate((key) => localStorage.getItem(key), BEST_KEY)).toBe("1");
    expect(await reloadAndReadBest(page)).toBe("1");
  });

  test("The stored best is not overwritten by a lower score", async ({ page }) => {
    await seedBest(page, 5);
    await openGame(page, oneBox);
    await startRun(page);
    await untilRestart(page);
    expect(await reloadAndReadBest(page)).toBe("5");
  });
});

test.describe("Rule: The best is kept in the browser between visits, across tabs", () => {
  test("A second open tab never lowers the stored best", async ({ page }) => {
    await seedBest(page, 5);
    await openGame(page, standardRandom());
    await page.evaluate((key) => {
      localStorage.setItem(key, "30");
    }, BEST_KEY);
    await startRun(page);
    const until = columnClearTime(7) + 50;
    await play(page, standardJumps(until), until);
    expect((await sample(page)).score.text).toBe("7");
    await untilRestart(page);
    expect(await page.evaluate((key) => localStorage.getItem(key), BEST_KEY)).toBe("30");
  });

  test("A score above the stored best is still stored", async ({ page }) => {
    await seedBest(page, 5);
    await openGame(page, standardRandom());
    await startRun(page);
    const until = columnClearTime(7) + 50;
    await play(page, standardJumps(until), until);
    await untilRestart(page);
    expect(await page.evaluate((key) => localStorage.getItem(key), BEST_KEY)).toBe("7");
  });
});

test.describe("Rule: A missing, corrupt or blocked store never breaks the game", () => {
  test("No stored value yet is treated as a best of 0, with no error", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await openGame(page, oneBox);
    await startRun(page);
    expect((await sample(page)).best.text).toBe("Best: 0");
    expect(errors).toEqual([]);
  });

  test("A non-numeric stored value is treated as a best of 0, with no error", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript((key) => {
      localStorage.setItem(key, "not-a-number");
    }, BEST_KEY);
    await openGame(page, oneBox);
    await startRun(page);
    expect((await sample(page)).best.text).toBe("Best: 0");
    expect(errors).toEqual([]);
  });

  test("A blocked localStorage is treated as a best of 0 and play still works", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await blockLocalStorage(page);
    await openGame(page, oneBox);
    await startRun(page);
    expect((await sample(page)).best.text).toBe("Best: 0");
    await play(page, [2700], 3340);
    expect((await sample(page)).best.text).toBe("Best: 1");
    expect(errors).toEqual([]);
  });
});

test.describe("Rule: The existing run keeps its own behaviour", () => {
  test("The best text sits clear of the row the floor-seam check samples", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    const bounds = await page.evaluate(() => {
      const handle = window.pandaJump;
      if (!handle) throw new Error("PandaJump has not started");
      const scene = handle.game.scene.getScene("run");
      const best = scene.children.getByName("best") as GameText;
      const box = best.getBounds();
      return { top: box.y, bottom: box.bottom };
    });
    expect(bounds.bottom).toBeLessThanOrEqual(460);
  });
});

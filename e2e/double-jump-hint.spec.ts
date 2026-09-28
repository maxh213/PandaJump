import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import {
  advance,
  advanceTo,
  hidePage,
  openGame,
  play,
  pressSpace,
  reload,
  sample,
  standardJumps,
  standardRandom,
  untilGameOver,
  untilRestart,
} from "./probe.ts";

const HINT = { text: "Tap again in mid-air to double jump", x: 200, y: 150, color: "#ffffff", fontSize: "16px" };

const seedBest = (page: Page, value: number) =>
  page.addInitScript((seeded) => {
    localStorage.setItem("pandaJump.best", String(seeded));
  }, value);

const airJump = async (page: Page) => {
  await pressSpace(page);
  await advance(page, 100);
  await pressSpace(page);
};

test.describe("Rule: The hint shows to a first-time player on a live run", () => {
  test("The hint is visible at the start of the run", async ({ page }) => {
    await openGame(page, standardRandom());
    const start = await sample(page);
    expect(start.doubleJumpHint).toMatchObject({ ...HINT, visible: true, originX: 0.5, originY: 0.5 });
  });

  test("A floor jump does not hide the hint", async ({ page }) => {
    await openGame(page, standardRandom());
    await pressSpace(page);
    await advance(page, 100);
    expect((await sample(page)).doubleJumpHint.visible).toBe(true);
  });
});

test.describe("Rule: The hint disappears at the first air jump and stays hidden for the page session", () => {
  test("The hint hides the moment I jump again in mid-air, and stays hidden after I die and restart", async ({ page }) => {
    await openGame(page, standardRandom());
    await pressSpace(page);
    await advance(page, 100);
    await pressSpace(page);
    expect((await sample(page)).doubleJumpHint.visible).toBe(false);
    const restart = await untilRestart(page);
    expect(restart.after.score.text).toBe("0");
    expect(restart.after.doubleJumpHint.visible).toBe(false);
  });
});

test.describe("Rule: The hint hides once the score reaches 3 and returns at score 0 of the next run", () => {
  test("The hint hides at score 3 and shows again after a restart", async ({ page }) => {
    await openGame(page, standardRandom());
    await play(page, standardJumps(5900), 6000);
    const atTwo = await sample(page);
    expect(atTwo.score.text).toBe("2");
    expect(atTwo.doubleJumpHint.visible).toBe(true);
    await advanceTo(page, 6400);
    const atThree = await sample(page);
    expect(atThree.score.text).toBe("3");
    expect(atThree.doubleJumpHint.visible).toBe(false);
    const restart = await untilRestart(page);
    expect(restart.after.score.text).toBe("0");
    expect(restart.after.doubleJumpHint.visible).toBe(true);
  });
});

test.describe("Rule: The hint hides on the game-over screen, the Paused screen and the resume countdown", () => {
  test("The hint hides on the Paused screen and during the countdown", async ({ page }) => {
    await openGame(page, standardRandom());
    await hidePage(page);
    expect((await sample(page)).doubleJumpHint.visible).toBe(false);
    await pressSpace(page);
    const counting = await sample(page);
    expect(counting.countdownText.visible).toBe(true);
    expect(counting.doubleJumpHint.visible).toBe(false);
    await advanceTo(page, 1500);
    const after = await sample(page);
    expect(after.countdownText.visible).toBe(false);
    expect(after.doubleJumpHint.visible).toBe(true);
  });

  test("The hint hides on the game-over screen", async ({ page }) => {
    await openGame(page, standardRandom());
    const { after } = await untilGameOver(page);
    expect(after.gameOverTitle.visible).toBe(true);
    expect(after.doubleJumpHint.visible).toBe(false);
  });
});

test.describe("Rule: A player with a stored best never sees the hint, and a reload shows it again", () => {
  test("With a stored best of 1 the hint never appears", async ({ page }) => {
    await seedBest(page, 1);
    await openGame(page, standardRandom());
    expect((await sample(page)).doubleJumpHint.visible).toBe(false);
    await advance(page, 100);
    expect((await sample(page)).doubleJumpHint.visible).toBe(false);
  });

  test("Reloading with no stored best shows the hint again after an air jump", async ({ page }) => {
    await openGame(page, standardRandom());
    await airJump(page);
    expect((await sample(page)).doubleJumpHint.visible).toBe(false);
    await reload(page);
    expect((await sample(page)).doubleJumpHint.visible).toBe(true);
  });
});

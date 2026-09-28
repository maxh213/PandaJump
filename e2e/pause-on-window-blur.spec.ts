import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { advance, advanceTo, oneBox, openGame, play, press, pressSpace, sample, settle, standardRandom, untilGameOver } from "./probe.ts";

const dispatchOnWindow = async (page: Page, type: "blur" | "focus") => {
  await page.evaluate((name) => window.dispatchEvent(new Event(name)), type);
  await settle(page);
};

const blurAt = async (page: Page, time: number) => {
  await advanceTo(page, time);
  await dispatchOnWindow(page, "blur");
};

test.describe("Rule: Losing focus during a live run pauses it at once and shows the pause texts", () => {
  test("The pause texts appear as soon as the window loses focus", async ({ page }) => {
    await openGame(page, standardRandom());
    await blurAt(page, 1000);
    const paused = await sample(page);
    expect(paused.pauseTitle).toMatchObject({ text: "Paused", x: 200, y: 190, color: "#ffffff", fontSize: "40px", visible: true });
    expect(paused.pausePrompt).toMatchObject({
      text: "Tap, press Space or the Up Arrow key to continue",
      x: 200,
      y: 320,
      color: "#ffffff",
      fontSize: "16px",
      visible: true,
    });
    expect(await page.evaluate(() => window.pandaJump?.run.view().paused)).toBe(true);
  });

  test("A run paused by losing focus does not advance time, the columns or the score", async ({ page }) => {
    await openGame(page, standardRandom());
    await blurAt(page, 1000);
    const frozen = await sample(page);
    await advance(page, 2000);
    const after = await sample(page);
    expect(after.time).toBe(1000);
    expect(after.boxes).toEqual([]);
    expect(after.score.text).toBe("0");
    expect(after).toEqual(frozen);
  });

  test("Regaining focus on its own does not resume the run", async ({ page }) => {
    await openGame(page, standardRandom());
    await blurAt(page, 1000);
    await dispatchOnWindow(page, "focus");
    await advance(page, 2000);
    const after = await sample(page);
    expect(after.pauseTitle.visible).toBe(true);
    expect(after.time).toBe(1000);
  });
});

test.describe("Rule: A run paused by losing focus resumes with the usual 3, 2, 1 countdown", () => {
  const controls: Record<string, (page: Page) => Promise<void>> = {
    "press Space": (page) => pressSpace(page),
    "press Up Arrow": (page) => press(page, "ArrowUp"),
    "click the canvas": (page) => page.locator("#game_div canvas").click({ position: { x: 200, y: 200 } }),
    "tap the canvas": (page) => page.locator("#game_div canvas").tap({ position: { x: 200, y: 200 } }),
  };

  for (const [action, act] of Object.entries(controls)) {
    test.describe(action, () => {
      test.use({ hasTouch: action === "tap the canvas" });

      test(`Each control starts a countdown and the run then continues: ${action}`, async ({ page }) => {
        await openGame(page, standardRandom());
        await blurAt(page, 1000);
        await dispatchOnWindow(page, "focus");
        await act(page);
        const started = await sample(page);
        expect(started.countdownText).toMatchObject({ text: "3", x: 200, y: 190, color: "#ffffff", fontSize: "40px", visible: true });
        expect(started.pauseTitle.visible).toBe(false);
        expect(started.pausePrompt.visible).toBe(false);
        expect(started.panda.bottom).toBe(426);

        await advance(page, 1500);
        const resumed = await sample(page);
        expect(resumed.countdownText.visible).toBe(false);
        expect(resumed.time).toBe(1000);

        await advanceTo(page, 1500);
        expect((await sample(page)).boxes).toEqual([
          { x: 400, y: 362, width: 64, key: "dirt_06.png", depth: 0, tint: 0xffffff },
        ]);
        await play(page, [2700], 3340);
        expect((await sample(page)).score.text).toBe("1");
      });
    });
  }
});

test.describe("Rule: Losing focus during the resume countdown returns to the paused screen", () => {
  test("The countdown is replaced by the pause texts", async ({ page }) => {
    await openGame(page, standardRandom());
    await blurAt(page, 1000);
    await pressSpace(page);
    await advance(page, 500);
    expect((await sample(page)).countdownText.text).toBe("2");

    await dispatchOnWindow(page, "blur");
    const repaused = await sample(page);
    expect(repaused.pauseTitle).toMatchObject({ text: "Paused", visible: true });
    expect(repaused.countdownText.visible).toBe(false);
    expect(repaused.time).toBe(1000);
  });
});

test.describe("Rule: Losing focus has no effect on the game-over screen", () => {
  test('Losing focus while the game-over screen is shown does not show "Paused", and restart still works', async ({ page }) => {
    await openGame(page, oneBox);
    await untilGameOver(page);
    await dispatchOnWindow(page, "blur");
    const stillGameOver = await sample(page);
    expect(stillGameOver.pauseTitle.visible).toBe(false);
    expect(stillGameOver.gameOverTitle.visible).toBe(true);
    await advance(page, 500);
    await pressSpace(page);
    const after = await sample(page);
    expect(after.restarts).toBe(1);
    expect(after.gameOverTitle.visible).toBe(false);
  });
});

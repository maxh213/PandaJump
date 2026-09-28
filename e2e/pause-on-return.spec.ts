import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { advance, advanceTo, hidePage, oneBox, openGame, play, pressSpace, sample, showPage, standardRandom, untilGameOver } from "./probe.ts";

const pauseAt = async (page: Page, time: number) => {
  await advanceTo(page, time);
  await hidePage(page);
  await showPage(page);
};

test.describe("Rule: Hiding then showing the tab during a live run pauses it and shows the pause texts", () => {
  test("The pause texts appear once the tab is shown again", async ({ page }) => {
    await openGame(page, standardRandom());
    await pauseAt(page, 1000);
    const paused = await sample(page);
    expect(paused.pauseTitle).toMatchObject({ text: "Paused", x: 200, y: 190, color: "#ffffff", fontSize: "40px", visible: true });
    expect(paused.pauseTitle.originX).toBeCloseTo(0.5);
    expect(paused.pauseTitle.originY).toBeCloseTo(0.5);
    expect(paused.pausePrompt).toMatchObject({
      text: "Tap, press Space or the Up Arrow key to continue",
      x: 200,
      y: 320,
      color: "#ffffff",
      fontSize: "16px",
      visible: true,
    });
    expect(paused.pausePrompt.originX).toBeCloseTo(0.5);
    expect(paused.pausePrompt.originY).toBeCloseTo(0.5);
    expect(paused.pausePrompt.bounds.x).toBeGreaterThanOrEqual(0);
    expect(paused.pausePrompt.bounds.x + paused.pausePrompt.bounds.width).toBeLessThanOrEqual(400);
  });

  test("A paused run does not advance time, the panda, the columns, the clouds or the floor", async ({ page }) => {
    await openGame(page, standardRandom());
    await pauseAt(page, 1000);
    const frozen = await sample(page);
    await advance(page, 2000);
    const after = await sample(page);
    expect(after.time).toBe(1000);
    expect(after.boxes).toEqual([]);
    expect(after.panda.bottom).toBe(426);
    expect(after).toEqual(frozen);
  });
});

test.describe("Rule: Resuming a paused run does not make the panda jump, and the run then continues normally", () => {
  const controls: Record<string, (page: Page) => Promise<void>> = {
    "press Space": (page) => pressSpace(page),
    "click the canvas": (page) => page.locator("#game_div canvas").click({ position: { x: 200, y: 200 } }),
    "tap the canvas": (page) => page.locator("#game_div canvas").tap({ position: { x: 200, y: 200 } }),
  };

  for (const [action, act] of Object.entries(controls)) {
    test.describe(action, () => {
      test.use({ hasTouch: action === "tap the canvas" });

      test(`Each control resumes the run without a jump: ${action}`, async ({ page }) => {
        await openGame(page, standardRandom());
        await pauseAt(page, 1000);
        await act(page);
        const resumed = await sample(page);
        expect(resumed.pauseTitle.visible).toBe(false);
        expect(resumed.pausePrompt.visible).toBe(false);
        expect(resumed.panda.bottom).toBe(426);
        await advanceTo(page, 1499);
        expect((await sample(page)).boxes).toEqual([]);
        await advanceTo(page, 1500);
        expect((await sample(page)).boxes).toEqual([{ x: 400, y: 362, width: 64, key: "dirt_06.png", depth: 0 }]);
        await play(page, [2700], 3340);
        expect((await sample(page)).score.text).toBe("1");
      });
    });
  }
});

test.describe("Rule: Pausing has no effect on the game-over screen", () => {
  test('Hiding the tab while the game-over screen is shown does not show "Paused", and restart still works', async ({
    page,
  }) => {
    await openGame(page, oneBox);
    await untilGameOver(page);
    await hidePage(page);
    await showPage(page);
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

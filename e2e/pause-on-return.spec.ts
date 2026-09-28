import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { advance, advanceTo, hidePage, oneBox, openGame, play, pressSpace, sample, showPage, standardRandom, startRun, untilGameOver } from "./probe.ts";

const pauseAt = async (page: Page, time: number) => {
  await advanceTo(page, time);
  await hidePage(page);
  await showPage(page);
};

test.describe("Rule: Hiding then showing the tab during a live run pauses it and shows the pause texts", () => {
  test("The pause texts appear once the tab is shown again", async ({ page }) => {
    await openGame(page, standardRandom());
    await startRun(page);
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
    await startRun(page);
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

test.describe("Rule: Resuming a paused run counts down 3, 2, 1 before the run continues", () => {
  const controls: Record<string, (page: Page) => Promise<void>> = {
    "press Space": (page) => pressSpace(page),
    "click the canvas": (page) => page.locator("#game_div canvas").click({ position: { x: 200, y: 200 } }),
    "tap the canvas": (page) => page.locator("#game_div canvas").tap({ position: { x: 200, y: 200 } }),
  };

  for (const [action, act] of Object.entries(controls)) {
    test.describe(action, () => {
      test.use({ hasTouch: action === "tap the canvas" });

      test(`Each control starts a countdown without a jump: ${action}`, async ({ page }) => {
        await openGame(page, standardRandom());
        await startRun(page);
        await pauseAt(page, 1000);
        await act(page);
        const started = await sample(page);
        expect(started.countdownText).toMatchObject({
          text: "3",
          x: 200,
          y: 190,
          color: "#ffffff",
          fontSize: "40px",
          visible: true,
        });
        expect(started.pauseTitle.visible).toBe(false);
        expect(started.pausePrompt.visible).toBe(false);
        expect(started.panda.bottom).toBe(426);
        expect(started.time).toBe(1000);

        await advance(page, 500);
        expect((await sample(page)).countdownText).toMatchObject({ text: "2", visible: true });

        await advance(page, 500);
        expect((await sample(page)).countdownText).toMatchObject({ text: "1", visible: true });

        await advance(page, 500);
        const resumed = await sample(page);
        expect(resumed.countdownText.visible).toBe(false);
        expect(resumed.time).toBe(1000);
        expect(resumed.panda.bottom).toBe(426);

        await advanceTo(page, 1499);
        expect((await sample(page)).boxes).toEqual([]);
        await advanceTo(page, 1500);
        expect((await sample(page)).boxes).toEqual([
          { x: 400, y: 362, width: 64, key: "dirt_06.png", depth: 0, tint: 0xffffff },
        ]);
        await play(page, [2700], 3340);
        expect((await sample(page)).score.text).toBe("1");
      });
    });
  }

  test("A jump pressed during the countdown neither jumps nor restarts the countdown", async ({ page }) => {
    await openGame(page, standardRandom());
    await startRun(page);
    await pauseAt(page, 1000);
    await pressSpace(page);
    await advance(page, 500);
    expect((await sample(page)).countdownText.text).toBe("2");

    await pressSpace(page);
    const stillTwo = await sample(page);
    expect(stillTwo.countdownText.text).toBe("2");
    expect(stillTwo.panda.bottom).toBe(426);

    await advance(page, 500);
    expect((await sample(page)).countdownText.text).toBe("1");
  });

  test("A panda paused mid-air is still at the same height when the countdown ends", async ({ page }) => {
    await openGame(page, standardRandom());
    await startRun(page);
    await pressSpace(page);
    await advance(page, 300);
    const midAir = await sample(page);
    expect(midAir.panda.bottom).toBeLessThan(426);

    await hidePage(page);
    await showPage(page);
    await pressSpace(page);
    await advance(page, 1499);
    expect((await sample(page)).panda.bottom).toBe(midAir.panda.bottom);

    await advance(page, 1);
    expect((await sample(page)).panda.bottom).toBe(midAir.panda.bottom);
  });
});

test.describe("Rule: Pausing has no effect on the game-over screen", () => {
  test('Hiding the tab while the game-over screen is shown does not show "Paused", and restart still works', async ({
    page,
  }) => {
    await openGame(page, oneBox);
    await startRun(page);
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

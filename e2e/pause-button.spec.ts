import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { advance, advanceTo, oneBox, openGame, play, pressSpace, sample, settle, startRun, standardRandom, untilGameOver } from "./probe.ts";

const tapPauseButton = async (page: Page): Promise<void> => {
  const { pauseButton } = await sample(page);
  const x = pauseButton.bounds.x + pauseButton.bounds.width / 2;
  const y = pauseButton.bounds.y + pauseButton.bounds.height / 2;
  await page.locator("#game_div canvas").click({ position: { x, y } });
  await settle(page);
};

const pauseWithButton = async (page: Page, time: number) => {
  await advanceTo(page, time);
  await tapPauseButton(page);
};

test.describe('Rule: The "II" button shows during a live run, top-right and fully on screen', () => {
  test('The button reads "II" in white Arial 24px, right-aligned inside the canvas', async ({ page }) => {
    await openGame(page, standardRandom());
    await startRun(page);
    await advanceTo(page, 1000);
    const live = await sample(page);
    expect(live.pauseButton).toMatchObject({
      text: "II",
      x: 380,
      y: 20,
      color: "#ffffff",
      fontSize: "24px",
      originX: 1,
      originY: 0,
      visible: true,
    });
    expect(live.pauseButton.bounds.x).toBeGreaterThanOrEqual(0);
    expect(live.pauseButton.bounds.x + live.pauseButton.bounds.width).toBeLessThanOrEqual(400);
  });
});

test.describe('Rule: Tapping "II" pauses the run and shows the pause texts, without making the panda jump', () => {
  test("Tapping the button pauses the run", async ({ page }) => {
    await openGame(page, standardRandom());
    await startRun(page);
    await pauseWithButton(page, 1000);
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
  });

  test("Tapping the button does not change the panda's height", async ({ page }) => {
    await openGame(page, standardRandom());
    await startRun(page);
    await advanceTo(page, 1000);
    const before = await sample(page);
    await tapPauseButton(page);
    const after = await sample(page);
    expect(after.panda.bottom).toBe(before.panda.bottom);
  });

  test("A run paused with the button does not advance time, the panda or the floor", async ({ page }) => {
    await openGame(page, standardRandom());
    await startRun(page);
    await pauseWithButton(page, 1000);
    const frozen = await sample(page);
    await advance(page, 2000);
    const after = await sample(page);
    expect(after.time).toBe(1000);
    expect(after.boxes).toEqual([]);
    expect(after.panda.bottom).toBe(426);
    expect(after).toEqual(frozen);
  });
});

const tapCanvas = async (page: Page, x: number, y: number): Promise<void> => {
  await page.locator("#game_div canvas").click({ position: { x, y } });
  await settle(page);
};

test.describe("Rule: The button's tap area is at least 48 by 48 canvas pixels and reaches into the top-right corner", () => {
  const corners: { x: number; y: number }[] = [
    { x: 396, y: 4 },
    { x: 356, y: 44 },
  ];
  for (const { x, y } of corners) {
    test(`Tapping (${String(x)}, ${String(y)}) pauses the run without a jump`, async ({ page }) => {
      await openGame(page, standardRandom());
      await advanceTo(page, 1000);
      const before = await sample(page);
      await tapCanvas(page, x, y);
      const after = await sample(page);
      expect(after.pauseTitle).toMatchObject({ text: "Paused", visible: true });
      expect(after.panda.bottom).toBe(before.panda.bottom);
    });
  }

  test("Tapping elsewhere on the canvas still jumps and does not pause", async ({ page }) => {
    await openGame(page, standardRandom());
    await advanceTo(page, 1000);
    await tapCanvas(page, 200, 300);
    await advance(page, 100);
    const after = await sample(page);
    expect(after.pauseTitle.visible).toBe(false);
    expect(after.panda.bottom).toBeLessThan(426);
  });

  test("The corner area is an ordinary canvas tap while paused and on the game-over screen", async ({ page }) => {
    await openGame(page, oneBox);
    await pauseWithButton(page, 1000);
    await tapCanvas(page, 396, 4);
    const resumed = await sample(page);
    expect(resumed.pauseTitle.visible).toBe(false);
    expect(resumed.countdownText).toMatchObject({ text: "3", visible: true });
    await advance(page, 1500);
    await untilGameOver(page);
    await advance(page, 500);
    await tapCanvas(page, 396, 4);
    const restarted = await sample(page);
    expect(restarted.restarts).toBe(1);
    expect(restarted.pauseTitle.visible).toBe(false);
  });
});

test.describe('Rule: The button is hidden while paused, on the game-over screen, and until a new run is live', () => {
  test("The button disappears the moment the run pauses", async ({ page }) => {
    await openGame(page, standardRandom());
    await startRun(page);
    await pauseWithButton(page, 1000);
    const paused = await sample(page);
    expect(paused.pauseButton.visible).toBe(false);
  });

  test("The button is hidden on the game-over screen and returns once the new run is live", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    await untilGameOver(page);
    expect((await sample(page)).pauseButton.visible).toBe(false);
    await advance(page, 500);
    expect((await sample(page)).pauseButton.visible).toBe(false);
    await page.locator("#game_div canvas").click({ position: { x: 200, y: 200 } });
    await settle(page);
    const after = await sample(page);
    expect(after.restarts).toBe(1);
    expect(after.gameOver).toBe(false);
    expect(after.pauseButton.visible).toBe(true);
  });
});

test.describe('Rule: Resuming a pause started with "II" works exactly like resuming a P or Escape pause', () => {
  test("Space starts the same 3, 2, 1 countdown as resuming a P or Escape pause, without a jump, and the run continues normally", async ({
    page,
  }) => {
    await openGame(page, standardRandom());
    await startRun(page);
    await pauseWithButton(page, 1000);
    await pressSpace(page);
    const resumed = await sample(page);
    expect(resumed.pauseTitle.visible).toBe(false);
    expect(resumed.pausePrompt.visible).toBe(false);
    expect(resumed.panda.bottom).toBe(426);
    expect(resumed.countdownText).toMatchObject({ text: "3", x: 200, y: 190, color: "#ffffff", fontSize: "40px", visible: true });

    await advance(page, 500);
    expect((await sample(page)).countdownText).toMatchObject({ text: "2", visible: true });
    await advance(page, 500);
    expect((await sample(page)).countdownText).toMatchObject({ text: "1", visible: true });
    await advance(page, 500);
    const afterCountdown = await sample(page);
    expect(afterCountdown.countdownText.visible).toBe(false);
    expect(afterCountdown.time).toBe(1000);
    expect(afterCountdown.panda.bottom).toBe(426);

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

test.describe('Rule: The button is hidden on the ready screen, so a tap there starts the run like any other first tap', () => {
  test("The button is not shown on a fresh page load", async ({ page }) => {
    await openGame(page, standardRandom());
    expect((await sample(page)).pauseButton.visible).toBe(false);
  });

  test("A tap where the button sits during a live run starts the run without pausing it", async ({ page }) => {
    await openGame(page, standardRandom());
    await tapPauseButton(page);
    const started = await sample(page);
    expect(started.readyPrompt.visible).toBe(false);
    expect(started.panda.bottom).toBe(426);
    expect(started.pauseTitle.visible).toBe(false);
    await advanceTo(page, 1499);
    expect((await sample(page)).boxes).toEqual([]);
    await advanceTo(page, 1500);
    expect((await sample(page)).boxes).toHaveLength(1);
  });

  test("The button appears the moment the first input starts the run", async ({ page }) => {
    await openGame(page, standardRandom());
    await startRun(page);
    expect((await sample(page)).pauseButton).toMatchObject({
      text: "II",
      x: 380,
      y: 20,
      color: "#ffffff",
      fontSize: "24px",
      originX: 1,
      originY: 0,
      visible: true,
    });
  });
});

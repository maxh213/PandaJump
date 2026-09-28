import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { advance, advanceTo, oneBox, openGame, play, press, pressSpace, sample, standardRandom, startRun, untilGameOver } from "./probe.ts";

const KEYS = ["p", "Escape"] as const;

const pauseAt = async (page: Page, time: number, key: string) => {
  await advanceTo(page, time);
  await press(page, key);
};

test.describe("Rule: Pressing P or Escape during a live run pauses it and shows the pause texts", () => {
  for (const key of KEYS) {
    test(`The pause texts appear as soon as the key is pressed: ${key}`, async ({ page }) => {
      await openGame(page, standardRandom());
      await startRun(page);
      await pauseAt(page, 1000, key);
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

    test(`A run paused with the key does not advance time, the panda or the floor: ${key}`, async ({ page }) => {
      await openGame(page, standardRandom());
      await startRun(page);
      await pauseAt(page, 1000, key);
      const frozen = await sample(page);
      await advance(page, 2000);
      const after = await sample(page);
      expect(after.time).toBe(1000);
      expect(after.boxes).toEqual([]);
      expect(after.panda.bottom).toBe(426);
      expect(after).toEqual(frozen);
    });
  }
});

test.describe("Rule: Pressing P or Escape while paused starts the same 3, 2, 1 countdown as any other control", () => {
  for (const key of KEYS) {
    test(`The pausing key starts a countdown without a jump: ${key}`, async ({ page }) => {
      await openGame(page, standardRandom());
      await startRun(page);
      await pauseAt(page, 1000, key);
      await press(page, key);
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
  }

  test("Tap, Space and the Up Arrow key still start the countdown on a run paused with P or Escape", async ({ page }) => {
    await openGame(page, standardRandom());
    await startRun(page);
    await pauseAt(page, 1000, "p");
    await pressSpace(page);
    const resumed = await sample(page);
    expect(resumed.pauseTitle.visible).toBe(false);
    expect(resumed.pausePrompt.visible).toBe(false);
    expect(resumed.panda.bottom).toBe(426);
    expect(resumed.countdownText).toMatchObject({ text: "3", visible: true });
  });
});

test.describe("Rule: Pressing P or Escape on the game-over screen does nothing", () => {
  for (const key of KEYS) {
    test(`The key neither restarts the run nor shows the pause texts: ${key}`, async ({ page }) => {
      await openGame(page, oneBox);
      await startRun(page);
      await untilGameOver(page);
      await press(page, key);
      const stillGameOver = await sample(page);
      expect(stillGameOver.pauseTitle.visible).toBe(false);
      expect(stillGameOver.gameOverTitle.visible).toBe(true);
      expect(stillGameOver.restarts).toBe(0);
    });
  }
});

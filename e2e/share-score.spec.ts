import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { advance, oneBox, openGame, play, sample, settle, standardJumps, startRun, untilGameOver } from "./probe.ts";

interface CapturedShare {
  text?: string;
  url?: string;
  title?: string;
}

declare global {
  interface Window {
    __reportShare: (data: CapturedShare) => void;
  }
}

const mockUnsupportedShare = (page: Page) =>
  page.addInitScript(() => {
    Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
  });

const mockSupportedShare = async (page: Page): Promise<CapturedShare[]> => {
  const calls: CapturedShare[] = [];
  await page.exposeFunction("__reportShare", (data: CapturedShare) => {
    calls.push(data);
  });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: (data: CapturedShare) => {
        window.__reportShare(data);
        return Promise.resolve();
      },
    });
  });
  return calls;
};

const tapSharePrompt = async (page: Page): Promise<void> => {
  const { gameOverShare } = await sample(page);
  await page.locator("#game_div canvas").click({ position: { x: gameOverShare.x, y: gameOverShare.y } });
  await settle(page);
};

test.describe('Rule: Once the restart freeze has passed, a supported browser shows a "Share score" prompt', () => {
  test("The share prompt appears alongside the restart prompt once the freeze has elapsed", async ({ page }) => {
    await mockSupportedShare(page);
    await openGame(page, oneBox);
    await startRun(page);
    await untilGameOver(page);
    expect((await sample(page)).gameOverShare.visible).toBe(false);
    const stillFrozen = (await advance(page, 499)).at(-1);
    expect(stillFrozen?.gameOverShare.visible).toBe(false);
    const ready = (await advance(page, 1)).at(-1);
    expect(ready?.gameOverShare).toMatchObject({
      text: "Share score",
      visible: true,
      color: "#ffffff",
      fontSize: "20px",
    });
    expect(ready?.gameOverShare.y).toBeGreaterThan(ready?.gameOverPrompt.y ?? 0);
  });
});

test.describe("Rule: Tapping the share prompt shares the run's score and the page URL, and does not restart", () => {
  test('Tapping "Share score" calls navigator.share with the run\'s score and the page URL', async ({ page }) => {
    const calls = await mockSupportedShare(page);
    await openGame(page, oneBox);
    await startRun(page);
    await untilGameOver(page);
    await advance(page, 500);
    await tapSharePrompt(page);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.text).toBe("I scored 0 on Panda Jump!");
    expect(calls[0]?.url).toBe(page.url());
    const after = await sample(page);
    expect(after.restarts).toBe(0);
    expect(after.gameOver).toBe(true);
    expect(after.gameOverTitle.visible).toBe(true);
    expect(after.gameOverScore.text).toBe("Score: 0");
  });
});

test.describe("Rule: A run that earned a medal shares the medal's name", () => {
  test("Tapping \"Share score\" after a score of 12 names the Bronze medal", async ({ page }) => {
    const calls = await mockSupportedShare(page);
    await openGame(page, oneBox);
    await startRun(page);
    await play(page, standardJumps(1500 * 12 + 1200), 1500 * 12 + 1200);
    await untilGameOver(page);
    await advance(page, 500);
    await tapSharePrompt(page);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.text).toBe("I scored 12 and earned a Bronze medal on Panda Jump!");
    expect(calls[0]?.url).toBe(page.url());
  });
});

test.describe("Rule: On a browser without navigator.share, the prompt never shows and the screen behaves as before", () => {
  test("The share prompt is not shown when sharing is unsupported", async ({ page }) => {
    await mockUnsupportedShare(page);
    await openGame(page, oneBox);
    await startRun(page);
    await untilGameOver(page);
    await advance(page, 500);
    const after = await sample(page);
    expect(after.gameOverPrompt.visible).toBe(true);
    expect(after.gameOverShare.visible).toBe(false);
  });

  test("Tapping anywhere on the game-over screen still restarts when sharing is unsupported", async ({ page }) => {
    await mockUnsupportedShare(page);
    await openGame(page, oneBox);
    await startRun(page);
    await untilGameOver(page);
    await advance(page, 500);
    await page.locator("#game_div canvas").click({ position: { x: 200, y: 200 } });
    await settle(page);
    const after = await sample(page);
    expect(after.restarts).toBe(1);
    expect(after.gameOver).toBe(false);
  });
});

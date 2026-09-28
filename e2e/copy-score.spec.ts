import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { advance, oneBox, openGame, sample, settle, startRun, untilGameOver, untilRestart } from "./probe.ts";

interface CapturedWrite {
  text?: string;
}

declare global {
  interface Window {
    __reportClipboardWrite: (data: CapturedWrite) => void;
  }
}

const mockUnsupportedShare = (page: Page) =>
  page.addInitScript(() => {
    Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
  });

const mockUnsupportedClipboard = (page: Page) =>
  page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
  });

const mockSupportedClipboard = async (page: Page): Promise<CapturedWrite[]> => {
  const calls: CapturedWrite[] = [];
  await page.exposeFunction("__reportClipboardWrite", (data: CapturedWrite) => {
    calls.push(data);
  });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: (text: string) => {
          window.__reportClipboardWrite({ text });
          return Promise.resolve();
        },
      },
    });
  });
  return calls;
};

const mockRejectingClipboard = async (page: Page): Promise<void> => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: () => Promise.reject(new Error("denied")),
      },
    });
  });
};

const tapCopyPrompt = async (page: Page): Promise<void> => {
  const { gameOverCopy } = await sample(page);
  await page.locator("#game_div canvas").click({ position: { x: gameOverCopy.x, y: gameOverCopy.y } });
  await settle(page);
};

test.describe(
  'Rule: Once the restart freeze has passed, a browser without sharing but with clipboard support shows a "Copy score" prompt',
  () => {
    test("The copy prompt appears alongside the restart prompt once the freeze has elapsed", async ({ page }) => {
      await mockUnsupportedShare(page);
      await mockSupportedClipboard(page);
      await openGame(page, oneBox);
      await startRun(page);
      await untilGameOver(page);
      expect((await sample(page)).gameOverCopy.visible).toBe(false);
      const stillFrozen = (await advance(page, 499)).at(-1);
      expect(stillFrozen?.gameOverCopy.visible).toBe(false);
      const ready = (await advance(page, 1)).at(-1);
      expect(ready?.gameOverCopy).toMatchObject({
        text: "Copy score",
        visible: true,
        color: "#ffffff",
        fontSize: "20px",
      });
      expect(ready?.gameOverCopy.y).toBeGreaterThan(ready?.gameOverPrompt.y ?? 0);
    });
  },
);

test.describe("Rule: Tapping the copy prompt copies the run's score and the page URL, and does not restart", () => {
  test('Tapping "Copy score" calls navigator.clipboard.writeText with the run\'s score and the page URL', async ({
    page,
  }) => {
    await mockUnsupportedShare(page);
    const calls = await mockSupportedClipboard(page);
    await openGame(page, oneBox);
    await startRun(page);
    await untilGameOver(page);
    await advance(page, 500);
    await tapCopyPrompt(page);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.text).toBe(`I scored 0 on Panda Jump! ${page.url()}`);
    const after = await sample(page);
    expect(after.restarts).toBe(0);
    expect(after.gameOver).toBe(true);
    expect(after.gameOverTitle.visible).toBe(true);
    expect(after.gameOverScore.text).toBe("Score: 0");
  });
});

test.describe("Rule: Tapping the copy prompt confirms the copy by changing its text, until the next run starts", () => {
  test('Tapping "Copy score" changes the prompt to "Copied!" once the clipboard write resolves', async ({ page }) => {
    await mockUnsupportedShare(page);
    await mockSupportedClipboard(page);
    await openGame(page, oneBox);
    await startRun(page);
    await untilGameOver(page);
    await advance(page, 500);
    const before = await sample(page);
    await tapCopyPrompt(page);
    const after = await sample(page);
    expect(after.gameOverCopy).toMatchObject({
      text: "Copied!",
      x: before.gameOverCopy.x,
      y: before.gameOverCopy.y,
      color: before.gameOverCopy.color,
      fontSize: before.gameOverCopy.fontSize,
    });
    expect(after.restarts).toBe(0);
    expect(after.gameOver).toBe(true);
    expect(after.gameOverTitle.visible).toBe(true);
    expect(after.gameOverScore.text).toBe("Score: 0");
  });

  test('The prompt stays "Copy score" when the clipboard write is rejected', async ({ page }) => {
    await mockUnsupportedShare(page);
    await mockRejectingClipboard(page);
    await openGame(page, oneBox);
    await startRun(page);
    await untilGameOver(page);
    await advance(page, 500);
    await tapCopyPrompt(page);
    expect((await sample(page)).gameOverCopy.text).toBe("Copy score");
  });

  test('A new run\'s game-over screen reads "Copy score" again after a previous copy succeeded', async ({ page }) => {
    await mockUnsupportedShare(page);
    await mockSupportedClipboard(page);
    await openGame(page, oneBox);
    await startRun(page);
    await untilGameOver(page);
    await advance(page, 500);
    await tapCopyPrompt(page);
    expect((await sample(page)).gameOverCopy.text).toBe("Copied!");
    const restart = await untilRestart(page);
    expect(restart.after.restarts).toBe(1);
    await untilGameOver(page);
    await advance(page, 500);
    expect((await sample(page)).gameOverCopy.text).toBe("Copy score");
  });
});

test.describe(
  "Rule: On a browser with neither navigator.share nor navigator.clipboard.writeText, no prompt shows and the screen behaves as before",
  () => {
    test("Neither prompt is shown when sharing and copying are both unsupported", async ({ page }) => {
      await mockUnsupportedShare(page);
      await mockUnsupportedClipboard(page);
      await openGame(page, oneBox);
      await startRun(page);
      await untilGameOver(page);
      await advance(page, 500);
      const after = await sample(page);
      expect(after.gameOverPrompt.visible).toBe(true);
      expect(after.gameOverShare.visible).toBe(false);
      expect(after.gameOverCopy.visible).toBe(false);
    });

    test("Tapping anywhere on the game-over screen still restarts when sharing and copying are both unsupported", async ({
      page,
    }) => {
      await mockUnsupportedShare(page);
      await mockUnsupportedClipboard(page);
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
  },
);

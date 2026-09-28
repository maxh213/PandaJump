import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import {
  advance,
  last,
  oneBox,
  openGame,
  play,
  sample,
  settle,
  untilGameOver,
} from "./probe.ts";

interface Captured {
  text?: string;
}

declare global {
  interface Window {
    __reportCountUpShare: (data: Captured) => void;
    __reportCountUpCopy: (data: Captured) => void;
  }
}

const mockShareAndClipboard = async (
  page: Page,
  shareSupported = true,
): Promise<{ shares: Captured[]; copies: Captured[] }> => {
  const shares: Captured[] = [];
  const copies: Captured[] = [];
  await page.exposeFunction("__reportCountUpShare", (data: Captured) => {
    shares.push(data);
  });
  await page.exposeFunction("__reportCountUpCopy", (data: Captured) => {
    copies.push(data);
  });
  await page.addInitScript((withShare) => {
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: withShare
        ? (data: Captured) => {
            window.__reportCountUpShare(data);
            return Promise.resolve();
          }
        : undefined,
    });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: (text: string) => {
          window.__reportCountUpCopy({ text });
          return Promise.resolve();
        },
      },
    });
  }, shareSupported);
  return { shares, copies };
};

const dieAtScoreThree = async (page: Page) => {
  await openGame(page, oneBox);
  await play(page, [2700, 4200, 5700], 7300);
  return untilGameOver(page);
};

test.describe("Rule: The game-over score counts up from 0 to the final score over the 500 ms restart freeze", () => {
  test("The score reads 0 at death, partway through and the final score at 500 ms", async ({
    page,
  }) => {
    const { after: diedAt } = await dieAtScoreThree(page);
    expect(diedAt.gameOverScore).toMatchObject({
      text: "Score: 0",
      visible: true,
    });
    const midway = last(await advance(page, 250));
    const shown = Number(midway.gameOverScore.text.replace("Score: ", ""));
    expect(shown).toBeGreaterThan(0);
    expect(shown).toBeLessThan(3);
    const almost = last(await advance(page, 249));
    expect(almost.gameOverScore.text).toBe("Score: 2");
    const done = last(await advance(page, 1));
    expect(done.gameOverScore.text).toBe("Score: 3");
    const later = last(await advance(page, 300));
    expect(later.gameOverScore.text).toBe("Score: 3");
  });

  test("A run that dies at score 0 reads Score: 0 throughout", async ({
    page,
  }) => {
    await openGame(page, oneBox);
    await untilGameOver(page);
    expect(last(await advance(page, 250)).gameOverScore.text).toBe("Score: 0");
    expect(last(await advance(page, 300)).gameOverScore.text).toBe("Score: 0");
  });
});

test.describe("Rule: Everything else keeps showing the final score while the count runs", () => {
  test("The top-left score, the tab title and the medal do not count up", async ({
    page,
  }) => {
    await dieAtScoreThree(page);
    const midway = last(await advance(page, 250));
    expect(midway.score.text).toBe("3");
    expect(await page.title()).toContain("3");
    expect(midway.gameOverMedal.visible).toBe(false);
  });

  test("Share score sends the final score", async ({ page }) => {
    const { shares } = await mockShareAndClipboard(page);
    await dieAtScoreThree(page);
    await advance(page, 500);
    const { gameOverShare } = await sample(page);
    await page
      .locator("#game_div canvas")
      .click({ position: { x: gameOverShare.x, y: gameOverShare.y } });
    await settle(page);
    expect(shares.map((share) => share.text)).toEqual([
      "I scored 3 on Panda Jump!",
    ]);
  });

  test("Copy score sends the final score", async ({ page }) => {
    const { copies } = await mockShareAndClipboard(page, false);
    await dieAtScoreThree(page);
    await advance(page, 500);
    const { gameOverCopy } = await sample(page);
    await page
      .locator("#game_div canvas")
      .click({ position: { x: gameOverCopy.x, y: gameOverCopy.y } });
    await settle(page);
    expect(copies).toHaveLength(1);
    expect(copies[0]?.text).toContain("I scored 3 on Panda Jump!");
  });
});

test.describe("Rule: Restarting works exactly as before", () => {
  test("The restart prompt appears at 500 ms and a tap then restarts", async ({
    page,
  }) => {
    await dieAtScoreThree(page);
    expect(last(await advance(page, 499)).gameOverPrompt.visible).toBe(false);
    expect(last(await advance(page, 1)).gameOverPrompt.visible).toBe(true);
    await page
      .locator("#game_div canvas")
      .click({ position: { x: 200, y: 200 } });
    await settle(page);
    const after = await sample(page);
    expect(after.restarts).toBe(1);
    expect(after.gameOver).toBe(false);
  });
});

import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { oneBox, openGame, play, press, reload, sample as probeSample, spawnTimeOf, startRun, untilGameOver, untilRestart } from "./probe.ts";

const TOP_SCORES_KEY = "pandaJump.topScores";

const seedStorage = (page: Page, entries: Record<string, string>) =>
  page.addInitScript((seeded) => {
    Object.entries(seeded).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
  }, entries);

const throwOn = (page: Page, methods: string[]) =>
  page.addInitScript((names) => {
    names.forEach((name) => {
      Object.defineProperty(Storage.prototype, name, {
        value() {
          throw new Error("blocked");
        },
      });
    });
  }, methods);

interface ListText {
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize: string;
  originX: number;
  originY: number;
  visible: boolean;
}

interface Listing {
  topScoresHeading: ListText;
  topScoreLines: ListText[];
  ready: boolean;
  restarts: number;
}

const LINE_NAMES = ["topScoreLine0", "topScoreLine1", "topScoreLine2", "topScoreLine3", "topScoreLine4"];

const sample = (page: Page): Promise<Listing> =>
  page.evaluate((lineNames) => {
    const handle = window.pandaJump;
    if (!handle) throw new Error("PandaJump has not started");
    const scene = handle.game.scene.getScene("run");
    scene.update(0, 0);
    const read = (name: string): ListText => {
      const text = scene.children.getByName(name) as ListText & { style: { color: string; fontSize: string } };
      return {
        text: text.text,
        x: text.x,
        y: text.y,
        color: text.style.color,
        fontSize: text.style.fontSize,
        originX: text.originX,
        originY: text.originY,
        visible: text.visible,
      };
    };
    const view = handle.run.view();
    return {
      topScoresHeading: read("topScoresHeading"),
      topScoreLines: lineNames.map(read),
      ready: view.ready,
      restarts: view.restarts,
    };
  }, LINE_NAMES);

const listed = (entry: Listing): string[] =>
  entry.topScoreLines.filter((line) => line.visible).map((line) => line.text);

const playRun = async (page: Page, score: number): Promise<void> => {
  const jumps = Array.from({ length: score }, (_, index) => spawnTimeOf(index + 1) + 1200);
  await play(page, jumps, jumps.at(-1) ?? 0);
  await untilRestart(page);
};

const playRuns = async (page: Page, scores: number[]): Promise<void> => {
  await startRun(page);
  for (const score of scores) await playRun(page, score);
};

const expectNothingListed = (entry: Listing): void => {
  expect(entry.topScoresHeading.visible).toBe(false);
  expect(listed(entry)).toEqual([]);
};

test.describe("Rule: The start screen lists the player's best runs", () => {
  test("With no stored data, a fresh load lists nothing", async ({ page }) => {
    await openGame(page, oneBox);
    const entry = await sample(page);
    expect(entry.ready).toBe(true);
    expect((await probeSample(page)).readyPrompt).toMatchObject({ text: "Tap or press Space to start", visible: true });
    expectNothingListed(entry);
  });

  test("A stored best with no stored list seeds a list of one", async ({ page }) => {
    await seedStorage(page, { "pandaJump.best": "7" });
    await openGame(page, oneBox);
    const entry = await sample(page);
    expect(entry.topScoresHeading).toMatchObject({ text: "Your best runs", x: 200, y: 166, visible: true });
    expect(listed(entry)).toEqual(["1. 7"]);
    expect(entry.topScoreLines[0]).toMatchObject({ x: 200, y: 196 });
  });

  test("Runs ending on 3, 0, 5 and 3 are listed as 5, 3, 3 after a reload, and a 0 is never listed", async ({ page }) => {
    await openGame(page, oneBox);
    await playRuns(page, [3, 0, 5, 3]);
    expect(await page.evaluate((key) => localStorage.getItem(key), TOP_SCORES_KEY)).toBe("[5,3,3]");
    await reload(page);
    expect(listed(await sample(page))).toEqual(["1. 5", "2. 3", "3. 3"]);
  });

  test("After six runs with distinct scores, exactly the five highest are listed, highest first", async ({ page }) => {
    await openGame(page, oneBox);
    await playRuns(page, [2, 5, 1, 6, 3, 4]);
    await reload(page);
    const entry = await sample(page);
    expect(listed(entry)).toEqual(["1. 6", "2. 5", "3. 4", "4. 3", "5. 2"]);
    expect(entry.topScoreLines.map((line) => line.y)).toEqual([196, 216, 236, 256, 276]);
  });

  test("A run ending on 0 is not listed even when the list is empty", async ({ page }) => {
    await openGame(page, oneBox);
    await playRuns(page, [0]);
    await reload(page);
    expectNothingListed(await sample(page));
  });
});

test.describe("Rule: The list keeps in step with the stored best", () => {
  test("A stored best above every listed score is merged in and the stored list is repaired", async ({ page }) => {
    await seedStorage(page, { "pandaJump.best": "15", [TOP_SCORES_KEY]: "[10,8]" });
    await openGame(page, oneBox);
    expect((await probeSample(page)).best.text).toBe("Best: 15");
    expect(listed(await sample(page))).toEqual(["1. 15", "2. 10", "3. 8"]);
    expect(await page.evaluate((key) => localStorage.getItem(key), TOP_SCORES_KEY)).toBe("[15,10,8]");
  });

  test("A stored best already at the top of the list is not listed twice", async ({ page }) => {
    await seedStorage(page, { "pandaJump.best": "10", [TOP_SCORES_KEY]: "[10,8]" });
    await openGame(page, oneBox);
    expect(listed(await sample(page))).toEqual(["1. 10", "2. 8"]);
    expect(await page.evaluate((key) => localStorage.getItem(key), TOP_SCORES_KEY)).toBe("[10,8]");
  });

  test("A run closed after beating the best but before the panda dies still lists that best", async ({ page }) => {
    await openGame(page, oneBox);
    await page.evaluate((key) => {
      localStorage.setItem("pandaJump.best", "1");
      localStorage.setItem(key, "[1]");
    }, TOP_SCORES_KEY);
    await reload(page);
    await startRun(page);
    const jumps = [1, 2].map((column) => spawnTimeOf(column) + 1200);
    await play(page, jumps, (jumps.at(-1) ?? 0) + 800);
    const live = await probeSample(page);
    expect(live).toMatchObject({ gameOver: false, best: { text: "Best: 2" } });
    await reload(page);
    const entry = await sample(page);
    expect((await probeSample(page)).best.text).toBe("Best: 2");
    expect(listed(entry)[0]).toBe("1. 2");
  });

  test("With no stored best and no stored list nothing is listed", async ({ page }) => {
    await openGame(page, oneBox);
    expectNothingListed(await sample(page));
  });
});

test.describe("Rule: The list only shows on the start screen", () => {
  test("The list and heading are gone right after the first tap or Space press", async ({ page }) => {
    await seedStorage(page, { [TOP_SCORES_KEY]: "[4,2]" });
    await openGame(page, oneBox);
    expect(listed(await sample(page))).toEqual(["1. 4", "2. 2"]);
    await startRun(page);
    expectNothingListed(await sample(page));
  });

  test("The list is gone after a tap", async ({ page }) => {
    await seedStorage(page, { [TOP_SCORES_KEY]: "[4,2]" });
    await openGame(page, oneBox);
    await page.mouse.click(200, 200);
    expectNothingListed(await sample(page));
  });

  test("The list is never shown during a run, while paused, or on the game-over screen or after restarting", async ({ page }) => {
    await seedStorage(page, { [TOP_SCORES_KEY]: "[4,2]" });
    await openGame(page, oneBox);
    await startRun(page);
    await play(page, [2700], 3400);
    expect((await probeSample(page)).gameOver).toBe(false);
    expectNothingListed(await sample(page));
    await press(page, "p");
    expect((await probeSample(page)).pauseTitle.visible).toBe(true);
    expectNothingListed(await sample(page));
    await press(page, "p");
    const { after } = await untilGameOver(page);
    expect(after.gameOverTitle.visible).toBe(true);
    expectNothingListed(await sample(page));
    const restart = await untilRestart(page);
    expect(restart.after.restarts).toBe(1);
    expectNothingListed(await sample(page));
  });
});

test.describe("Rule: The list is drawn as outlined white Arial", () => {
  test("The heading and lines are white Arial with a black 4px outline, at 20px and 16px", async ({ page }) => {
    await seedStorage(page, { [TOP_SCORES_KEY]: "[5,4,3,2,1]" });
    await openGame(page, oneBox);
    const entry = await sample(page);
    expect(entry.topScoresHeading).toMatchObject({ color: "#ffffff", fontSize: "20px", originX: 0.5, originY: 0.5 });
    entry.topScoreLines.forEach((line) => {
      expect(line).toMatchObject({ x: 200, color: "#ffffff", fontSize: "16px", originX: 0.5, originY: 0.5 });
    });
    const styles = await page.evaluate(() => {
      const handle = window.pandaJump;
      if (!handle) throw new Error("PandaJump has not started");
      const scene = handle.game.scene.getScene("run");
      const names = ["topScoresHeading", "topScoreLine0", "topScoreLine1", "topScoreLine2", "topScoreLine3", "topScoreLine4"];
      return names.map((name) => {
        const style = (scene.children.getByName(name) as { style: Record<string, string | number> }).style;
        return { name, family: style.fontFamily, stroke: style.stroke, thickness: style.strokeThickness };
      });
    });
    styles.forEach((style) => {
      expect(style).toMatchObject({ family: "Arial", stroke: "#000000", thickness: 4 });
    });
    expect(listed(entry)).toEqual(["1. 5", "2. 4", "3. 3", "4. 2", "5. 1"]);
  });
});

test.describe("Rule: Unreadable or blocked storage never breaks the game", () => {
  test("Invalid JSON with a stored best seeds the list from the best", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await seedStorage(page, { [TOP_SCORES_KEY]: "not json", "pandaJump.best": "6" });
    await openGame(page, oneBox);
    expect(listed(await sample(page))).toEqual(["1. 6"]);
    await playRuns(page, [1]);
    expect(errors).toEqual([]);
  });

  test("Invalid JSON with no stored best shows no list", async ({ page }) => {
    await seedStorage(page, { [TOP_SCORES_KEY]: "{oops" });
    await openGame(page, oneBox);
    expectNothingListed(await sample(page));
  });

  test("A list that is not an array of positive integers is ignored", async ({ page }) => {
    await seedStorage(page, { [TOP_SCORES_KEY]: '["9",0]' });
    await openGame(page, oneBox);
    expectNothingListed(await sample(page));
  });

  test("localStorage that throws on every read and write still loads, runs and restarts with no list", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        get() {
          throw new Error("blocked");
        },
      });
    });
    await openGame(page, oneBox);
    expectNothingListed(await sample(page));
    await playRuns(page, [2]);
    expect((await sample(page)).restarts).toBe(1);
    expect(errors).toEqual([]);
  });

  test("getItem that throws shows no list and does not stop a run", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await throwOn(page, ["getItem"]);
    await openGame(page, oneBox);
    expectNothingListed(await sample(page));
    await playRuns(page, [1]);
    expect(errors).toEqual([]);
  });

  test("setItem that throws never stops a run from ending and restarting", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await throwOn(page, ["setItem"]);
    await openGame(page, oneBox);
    await playRuns(page, [2]);
    expect((await sample(page)).restarts).toBe(1);
    expect(errors).toEqual([]);
  });
});

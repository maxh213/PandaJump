import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { advanceAlive, oneBox, openGame, playToScore, sample, startRun, untilRestart } from "./probe.ts";
import type { Sample } from "./probe.ts";

const EXTRA_COLUMNS = 3;

const rampedRandom = (column: number): number[] => Array.from({ length: column + EXTRA_COLUMNS }, () => oneBox).flat();

const playThroughColumn = async (page: Page, column: number): Promise<void> => {
  await openGame(page, rampedRandom(column));
  await startRun(page);
  await playToScore(page, column);
};

const expectSky = (state: Sample, sky: string): void => {
  expect(state.sky).toBe(sky);
  expect(state.cameraSky).toBe(sky);
};

test.describe("Rule: The sky is day-blue below a score of 20", () => {
  test("The sky is day-blue the moment a run starts", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    expectSky(await sample(page), "#71c5cf");
  });

  test("The sky is still day-blue just before the sunset threshold", async ({ page }) => {
    test.setTimeout(60_000);
    await playThroughColumn(page, 19);
    const state = await sample(page);
    expect(state.score.text).toBe("19");
    expectSky(state, "#71c5cf");
  });
});

test.describe("Rule: The sky turns sunset-orange over 3000 ms once the score reaches 20, and stays there below 40", () => {
  test("The sky crossfades to sunset once the score reaches 20", async ({ page }) => {
    test.setTimeout(60_000);
    await playThroughColumn(page, 20);
    const start = await sample(page);
    expect(start.score.text).toBe("20");
    expectSky(start, "#71c5cf");
    await advanceAlive(page, 1500);
    expectSky(await sample(page), "#b3b498");
    await advanceAlive(page, 1500);
    expectSky(await sample(page), "#f4a261");
  });

  test("The sky is still sunset just before the snowfield threshold", async ({ page }) => {
    test.setTimeout(120_000);
    await playThroughColumn(page, 39);
    const state = await sample(page);
    expect(state.score.text).toBe("39");
    expectSky(state, "#f4a261");
  });
});

test.describe("Rule: The sky turns pale snowfield-blue over 3000 ms once the score reaches 40", () => {
  test("The sky crossfades to pale blue once the score reaches 40", async ({ page }) => {
    test.setTimeout(120_000);
    await playThroughColumn(page, 40);
    const start = await sample(page);
    expect(start.score.text).toBe("40");
    expectSky(start, "#f4a261");
    await advanceAlive(page, 3000);
    expectSky(await sample(page), "#a9c9e0");
  });
});

test.describe("Rule: The sky turns dusk-grey over 3000 ms once the score reaches 60", () => {
  test("The sky is still pale blue just before the industrial threshold", async ({ page }) => {
    test.setTimeout(240_000);
    await playThroughColumn(page, 59);
    const state = await sample(page);
    expect(state.score.text).toBe("59");
    expectSky(state, "#a9c9e0");
  });

  test("The sky crossfades to dusk-grey once the score reaches 60", async ({ page }) => {
    test.setTimeout(240_000);
    await playThroughColumn(page, 60);
    const start = await sample(page);
    expect(start.score.text).toBe("60");
    expectSky(start, "#a9c9e0");
    await advanceAlive(page, 3000);
    expectSky(await sample(page), "#4a4e69");
  });
});

test.describe("Rule: A new run always starts back at day, even after a snowfield death", () => {
  test("The sky resets to day after a restart following a death at score 40 or more", async ({ page }) => {
    test.setTimeout(120_000);
    await openGame(page, rampedRandom(40));
    await startRun(page);
    await playToScore(page, 40);
    await advanceAlive(page, 3000);
    expectSky(await sample(page), "#a9c9e0");
    const restart = await untilRestart(page);
    expect(restart.after.score.text).toBe("0");
    expectSky(restart.after, "#71c5cf");
  });
});

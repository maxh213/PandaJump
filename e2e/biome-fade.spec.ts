import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { advance, advanceAlive, oneBox, openGame, playToScore, press, sample, startRun, untilRestart } from "./probe.ts";
import type { Sample } from "./probe.ts";

const EXTRA_COLUMNS = 3;
const MEADOW_SKY = "#71c5cf";
const DESERT_SKY = "#f4a261";
const MID_SKY = "#b3b498";
const MEADOW_HILLS = "#4a9ba6";
const DESERT_HILLS = "#c97b3a";

const rampedRandom = (column: number): number[] => Array.from({ length: column + EXTRA_COLUMNS }, () => oneBox).flat();

const reachScore = async (page: Page, column: number): Promise<void> => {
  await openGame(page, rampedRandom(column));
  await startRun(page);
  await playToScore(page, column);
};

const channel = (hex: string, index: number): number => parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16);

const expectSkyWithin = (state: Sample, wanted: string, tolerance: number): void => {
  [0, 1, 2].forEach((index) => {
    expect(Math.abs(channel(state.sky, index) - channel(wanted, index))).toBeLessThanOrEqual(tolerance);
    expect(Math.abs(channel(state.cameraSky, index) - channel(wanted, index))).toBeLessThanOrEqual(tolerance);
  });
};

const expectDesertOverMeadow = (state: Sample, alpha: number): void => {
  expect(state.rock.key).toBe("rock_06.png");
  expect(state.grass.key).toBe("top_grass_01.png");
  expect(state.rockFade.key).toBe("sand_06.png");
  expect(state.grassFade.key).toBe("sand_06.png");
  expect(state.rock.alpha).toBeCloseTo(1 - alpha, 5);
  expect(state.grass.alpha).toBeCloseTo(1 - alpha, 5);
  expect(state.rockFade.alpha).toBeCloseTo(alpha, 5);
  expect(state.grassFade.alpha).toBeCloseTo(alpha, 5);
  expect(state.hills.key).toBe(`hills-${MEADOW_HILLS}`);
  expect(state.hillsFade.key).toBe(`hills-${DESERT_HILLS}`);
  expect(state.hills.alpha).toBeCloseTo(1 - alpha, 5);
  expect(state.hillsFade.alpha).toBeCloseTo(alpha, 5);
  expect(state.hillsFade.visible).toBe(alpha < 1);
  expect(state.sceneryFade).toBeCloseTo(alpha, 5);
};

test.describe("Rule: A run starts with no fade", () => {
  test("Score 0 at the start of a run is pure meadow", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    const start = await sample(page);
    expect(start.score.text).toBe("0");
    expect(start.sky).toBe(MEADOW_SKY);
    expect(start.sceneryFade).toBe(1);
    expect(start.rock.key).toBe("rock_06.png");
    expect(start.grass.key).toBe("top_grass_01.png");
    expect(start.hills.key).toBe(`hills-${MEADOW_HILLS}`);
    expect(start.hillsFade.visible).toBe(false);
    expect(start.stars).toEqual([]);
  });
});

test.describe("Rule: The desert scenery crossfades in over 3000 ms from the step score becomes 20", () => {
  test("At score 20 the sky is still meadow, at 1500 ms it is the midpoint, at 3000 ms it is desert", async ({ page }) => {
    test.setTimeout(90_000);
    await reachScore(page, 20);
    const start = await sample(page);
    expect(start.score.text).toBe("20");
    expectSkyWithin(start, MEADOW_SKY, 1);
    expectDesertOverMeadow(start, 0);
    await advanceAlive(page, 1500);
    const mid = await sample(page);
    expectSkyWithin(mid, MID_SKY, 2);
    expectDesertOverMeadow(mid, 0.5);
    await advanceAlive(page, 1500);
    const end = await sample(page);
    expect(end.sky).toBe(DESERT_SKY);
    expect(end.cameraSky).toBe(DESERT_SKY);
    expect(end.sceneryFade).toBe(1);
    expect(end.rock.key).toBe("sand_06.png");
    expect(end.grass.key).toBe("sand_06.png");
    expect(end.rock.alpha).toBe(1);
    expect(end.hills.key).toBe(`hills-${DESERT_HILLS}`);
    expect(end.hills.alpha).toBe(1);
    expect(end.hillsFade.visible).toBe(false);
  });
});

test.describe("Rule: Stars fade in entering industrial and out leaving it", () => {
  test("Stars fade from alpha 0 to 1 over 3000 ms when the score reaches 60", async ({ page }) => {
    test.setTimeout(240_000);
    await reachScore(page, 60);
    const start = await sample(page);
    expect(start.score.text).toBe("60");
    expect(start.stars).toEqual([]);
    expect(start.starsAlpha).toBe(0);
    await advanceAlive(page, 1500);
    const mid = await sample(page);
    expect(mid.stars).toHaveLength(12);
    expect(mid.starsAlpha).toBeCloseTo(0.5, 5);
    mid.stars.forEach((star) => {
      expect(star.alpha).toBeCloseTo(0.5, 5);
    });
    await advanceAlive(page, 1500);
    const end = await sample(page);
    expect(end.stars).toHaveLength(12);
    expect(end.starsAlpha).toBe(1);
    end.stars.forEach((star) => {
      expect(star.alpha).toBe(1);
    });
  });

  test("Stars fade from alpha 1 to 0 over 3000 ms when the score reaches 80", async ({ page }) => {
    test.setTimeout(400_000);
    await reachScore(page, 80);
    const start = await sample(page);
    expect(start.score.text).toBe("80");
    expect(start.stars).toHaveLength(12);
    expect(start.starsAlpha).toBe(1);
    await advanceAlive(page, 1500);
    const mid = await sample(page);
    expect(mid.stars).toHaveLength(12);
    expect(mid.starsAlpha).toBeCloseTo(0.5, 5);
    await advanceAlive(page, 1500);
    const end = await sample(page);
    expect(end.stars).toEqual([]);
    expect(end.starsAlpha).toBe(0);
  });
});

test.describe("Rule: Pausing or dying freezes a fade; restart snaps to meadow", () => {
  test("Pausing halfway through the desert fade freezes the sky and layer alphas", async ({ page }) => {
    test.setTimeout(120_000);
    await reachScore(page, 20);
    await advanceAlive(page, 1500);
    const frozen = await sample(page);
    expect(frozen.sceneryFade).toBeCloseTo(0.5, 5);
    await press(page, "p");
    await advance(page, 2000);
    const paused = await sample(page);
    expect(paused.sky).toBe(frozen.sky);
    expect(paused.sceneryFade).toBe(frozen.sceneryFade);
    expect(paused.rockFade.alpha).toBe(frozen.rockFade.alpha);
    expect(paused.hillsFade.alpha).toBe(frozen.hillsFade.alpha);
  });

  test("Dying mid-fade freezes the scenery, and a restart shows pure meadow", async ({ page }) => {
    test.setTimeout(120_000);
    await reachScore(page, 20);
    await advanceAlive(page, 1000);
    const mid = await sample(page);
    expect(mid.sceneryFade).toBeCloseTo(1 / 3, 5);
    const restart = await untilRestart(page);
    expect(restart.diedAt.sceneryFade).toBeGreaterThan(0);
    expect(restart.diedAt.sceneryFade).toBeLessThan(1);
    expect(restart.diedAt.sky).not.toBe(MEADOW_SKY);
    expect(restart.diedAt.sky).not.toBe(DESERT_SKY);
    expect(restart.after.score.text).toBe("0");
    expect(restart.after.sky).toBe(MEADOW_SKY);
    expect(restart.after.sceneryFade).toBe(1);
    expect(restart.after.rock.key).toBe("rock_06.png");
    expect(restart.after.grass.key).toBe("top_grass_01.png");
    expect(restart.after.hills.key).toBe(`hills-${MEADOW_HILLS}`);
    expect(restart.after.stars).toEqual([]);
  });
});

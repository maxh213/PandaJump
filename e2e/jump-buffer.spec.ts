import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import {
  advance,
  advanceTo,
  heightOf,
  hidePage,
  last,
  openGame,
  press,
  pressSpace,
  sample,
  showPage,
  spaceDown,
  spaceUp,
  standardRandom,
  twoBoxes,
  untilGameOver,
} from "./probe.ts";

const bufferedSequence = async (page: Page, pressAt: number) => {
  await openGame(page, standardRandom());
  await pressSpace(page);
  await advanceTo(page, 580);
  await pressSpace(page);
  await advanceTo(page, pressAt);
  await pressSpace(page);
};

test.describe("Rule: A late press made 100 ms or less before landing jumps the moment the panda lands", () => {
  test("The panda leaves the floor again by itself with the floor jump speed", async ({ page }) => {
    await bufferedSequence(page, 1400);
    const landing = await advanceTo(page, 1480);
    expect(heightOf(last(landing))).toBeGreaterThan(0);
    expect(heightOf(last(landing))).toBeLessThan(15);
    const rest = await advanceTo(page, 2100);
    const peak = Math.max(...[...landing, ...rest].map(heightOf).filter((height) => height > 0));
    expect(peak).toBeGreaterThan(160);
    expect(peak).toBeLessThan(170);
  });

  test("It can still double jump during the buffered jump", async ({ page }) => {
    await bufferedSequence(page, 1400);
    await advanceTo(page, 1480);
    await pressSpace(page);
    expect((await sample(page)).viewAirPuff).not.toBeNull();
  });

  test("The buffered jump does not show the double jump puff", async ({ page }) => {
    await bufferedSequence(page, 1400);
    const samples = await advanceTo(page, 1700);
    expect(samples.every((entry) => entry.viewAirPuff === null && !entry.airPuff.visible)).toBe(true);
    expect(heightOf(last(samples))).toBeGreaterThan(0);
  });

  test("A press exactly 100 ms before the landing step is still buffered", async ({ page }) => {
    await bufferedSequence(page, 1370);
    await advanceTo(page, 1500);
    expect(heightOf(await sample(page))).toBeGreaterThan(0);
  });
});

test.describe("Rule: A late press made more than 100 ms before landing is dropped", () => {
  test("The panda lands and stays on the floor", async ({ page }) => {
    await bufferedSequence(page, 1340);
    const samples = await advanceTo(page, 1970);
    expect(heightOf(last(samples))).toBe(0);
    expect((await sample(page)).time).toBe(1970);
  });
});

test.describe("Rule: A press while the double jump is still available is still an immediate air jump", () => {
  test("The second press in the air jumps at once and shows the puff", async ({ page }) => {
    await openGame(page, standardRandom());
    await pressSpace(page);
    await advanceTo(page, 100);
    await pressSpace(page);
    expect((await sample(page)).viewAirPuff).not.toBeNull();
  });
});

test.describe("Rule: A buffered press is discarded by a pause, a death or a restart", () => {
  const settleOnFloor = async (page: Page) => {
    await advance(page, 2500);
    expect(heightOf(await sample(page))).toBe(0);
  };

  for (const key of ["p", "Escape"]) {
    test(`Pausing with ${key} before landing drops the press`, async ({ page }) => {
      await bufferedSequence(page, 1400);
      await press(page, key);
      await pressSpace(page);
      await settleOnFloor(page);
    });
  }

  test("Hiding the tab before landing drops the press", async ({ page }) => {
    await bufferedSequence(page, 1400);
    await hidePage(page);
    await showPage(page);
    await pressSpace(page);
    await settleOnFloor(page);
  });

  test("Dying before landing drops the press", async ({ page }) => {
    await openGame(page, standardRandom({ 1: twoBoxes }));
    await advanceTo(page, 2600);
    await pressSpace(page);
    await advanceTo(page, 2800);
    await pressSpace(page);
    await pressSpace(page);
    await untilGameOver(page);
    await advance(page, 500);
    await pressSpace(page);
    await advance(page, 500);
    const fresh = await sample(page);
    expect(fresh.restarts).toBe(1);
    expect(fresh.gameOver).toBe(false);
    expect(heightOf(fresh)).toBe(0);
  });
});

test.describe("Rule: Holding Space adds no jumps from auto-repeat", () => {
  test("The held key's repeats are not buffered", async ({ page }) => {
    await openGame(page, standardRandom());
    await spaceDown(page);
    await advanceTo(page, 580);
    await spaceDown(page);
    await advanceTo(page, 1400);
    await spaceDown(page);
    await advanceTo(page, 2000);
    expect(heightOf(await sample(page))).toBe(0);
    await spaceUp(page);
  });
});

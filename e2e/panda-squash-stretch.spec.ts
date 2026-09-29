import { expect, test } from "@playwright/test";
import { advance, advanceTo, openGame, pressSpace, sample, standardRandom, startRun, untilGameOver, untilRestart } from "./probe.ts";

const scaleOf = async (page: Parameters<typeof sample>[0]) => {
  const { panda } = await sample(page);
  return [panda.scaleX, panda.scaleY];
};

const expectScale = (actual: number[], x: number, y: number) => {
  expect(actual[0]).toBeCloseTo(x, 2);
  expect(actual[1]).toBeCloseTo(y, 2);
};

test.describe("Rule: A jump off the floor stretches the panda tall", () => {
  test("The panda stretches at takeoff and eases back over 120 ms", async ({ page }) => {
    await openGame(page, standardRandom());
    await startRun(page);
    expectScale(await scaleOf(page), 1.25, 1.25);
    await pressSpace(page);
    expectScale(await scaleOf(page), 1.0, 1.5);
    await advanceTo(page, 60);
    expectScale(await scaleOf(page), 1.125, 1.375);
    await advanceTo(page, 120);
    expectScale(await scaleOf(page), 1.25, 1.25);
    await advanceTo(page, 300);
    expectScale(await scaleOf(page), 1.25, 1.25);
  });

  test("A double jump in mid-air does not change the scale", async ({ page }) => {
    await openGame(page, standardRandom());
    await startRun(page);
    await pressSpace(page);
    await advanceTo(page, 300);
    await pressSpace(page);
    expectScale(await scaleOf(page), 1.25, 1.25);
  });
});

test.describe("Rule: Landing squashes the panda wide", () => {
  test("The panda squashes on the frame it lands and its feet stay on the floor", async ({ page }) => {
    await openGame(page, standardRandom());
    await startRun(page);
    await pressSpace(page);
    await advanceTo(page, 1000);
    let landing = await sample(page);
    while (landing.panda.bottom < 425) landing = (await advance(page, 10)).at(-1) ?? landing;
    expectScale([landing.panda.scaleX, landing.panda.scaleY], 1.5, 1.0);
    expect(landing.panda.bottom).toBeCloseTo(426, 0);
    await advanceTo(page, landing.time + 60);
    const mid = await sample(page);
    expect(mid.panda.bottom).toBeCloseTo(426, 0);
    expectScale([mid.panda.scaleX, mid.panda.scaleY], 1.375, 1.125);
    await advanceTo(page, landing.time + 120);
    expectScale(await scaleOf(page), 1.25, 1.25);
  });
});

test.describe("Rule: The panda is normal at game over and after a restart", () => {
  test("The scale is 1.25 by 1.25 on the game-over screen and after restarting", async ({ page }) => {
    await openGame(page, standardRandom());
    await startRun(page);
    await pressSpace(page);
    const { after } = await untilGameOver(page);
    expect(after.gameOver).toBe(true);
    expectScale([after.panda.scaleX, after.panda.scaleY], 1.25, 1.25);
    const restarted = await untilRestart(page);
    expectScale([restarted.after.panda.scaleX, restarted.after.panda.scaleY], 1.25, 1.25);
  });
});

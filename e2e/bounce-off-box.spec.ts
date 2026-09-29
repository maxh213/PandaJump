import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import {
  advance,
  last,
  oneBox,
  openGame,
  play,
  sample,
  startRun,
  twoBoxes,
  untilGameOver,
  untilRestart,
} from "./probe.ts";
import type { Sample } from "./probe.ts";

const hitColumnLeft = (state: Sample): number =>
  Math.min(...state.boxes.filter((box) => box.tint === 0xff6666).map((box) => box.x));

const hitboxRight = (state: Sample): number => state.viewPandaX + 22;

const overlapInto = (state: Sample, columnLeft: number): number =>
  Math.max(0, hitboxRight(state) - columnLeft);

const dieAboveTheFloor = async (page: Page): Promise<{ before: Sample; after: Sample }> => {
  await openGame(page, twoBoxes);
  await startRun(page);
  await play(page, [2300], 2875);
  return untilGameOver(page);
};

test.describe("Rule: Running into a column knocks the panda left and bounces it onto the floor", () => {
  test("Dying on the floor against a one-box column knockbacks left and pops up then lands", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    const { after: diedAt } = await untilGameOver(page);
    expect(diedAt.viewPandaX).toBe(100);
    expect(diedAt.panda.bottom).toBe(426);
    const columnLeft = hitColumnLeft(diedAt);
    let previousX = diedAt.viewPandaX;
    let rose = false;
    for (const entry of await advance(page, 250)) {
      expect(entry.viewPandaX).toBeLessThanOrEqual(previousX);
      if (entry.panda.bottom < 426) rose = true;
      previousX = entry.viewPandaX;
    }
    const cleared = await sample(page);
    expect(hitboxRight(cleared)).toBeLessThanOrEqual(columnLeft - 2);
    expect(rose).toBe(true);
    await advance(page, 500);
    expect((await sample(page)).panda.bottom).toBe(426);
  });
});

test.describe("Rule: Dying above the floor clears the column without deepening the overlap", () => {
  test("Dying on top of a two-box column knocks left clear and lands in front of it", async ({ page }) => {
    const { after: diedAt } = await dieAboveTheFloor(page);
    expect(diedAt.panda.bottom).toBeLessThan(426);
    const columnLeft = hitColumnLeft(diedAt);
    const hitOverlap = overlapInto(diedAt, columnLeft);
    for (let elapsed = 0; elapsed < 1000; elapsed += 10) {
      const entry = last(await advance(page, 10));
      expect(overlapInto(entry, columnLeft)).toBeLessThanOrEqual(hitOverlap);
      if (elapsed >= 250) {
        expect(overlapInto(entry, columnLeft)).toBe(0);
        expect(hitboxRight(entry)).toBeLessThanOrEqual(columnLeft - 2);
      }
    }
    const settled = await sample(page);
    expect(settled.panda.bottom).toBe(426);
    expect(hitboxRight(settled)).toBeLessThanOrEqual(columnLeft - 2);
  });
});

test.describe("Rule: An impact burst and squash mark the hit, and respect reduced motion", () => {
  test("The burst and squash play on a floor death then clear", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    const { after: diedAt } = await untilGameOver(page);
    expect(diedAt.viewImpactBurst).not.toBeNull();
    expect(diedAt.impactBurst.visible).toBe(true);
    expect(diedAt.panda.scaleX).toBeCloseTo(1.0, 1);
    expect(diedAt.panda.scaleY).toBeCloseTo(1.4375, 1);
    await advance(page, 120);
    const afterSquash = await sample(page);
    expect(afterSquash.panda.scaleX).toBeCloseTo(1.25, 1);
    expect(afterSquash.panda.scaleY).toBeCloseTo(1.25, 1);
    await advance(page, 130);
    const gone = await sample(page);
    expect(gone.viewImpactBurst).toBeNull();
    expect(gone.impactBurst.visible).toBe(false);
  });

  test("With reduced motion the burst stays full size and there is no squash", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openGame(page, oneBox);
    await startRun(page);
    const { after: diedAt } = await untilGameOver(page);
    expect(diedAt.viewImpactBurst).not.toBeNull();
    expect(diedAt.panda.scaleX).toBeCloseTo(1.25, 1);
    expect(diedAt.panda.scaleY).toBeCloseTo(1.25, 1);
    expect(diedAt.impactBurst.bounds.width).toBeGreaterThanOrEqual(28);
    expect(diedAt.impactBurst.bounds.height).toBeGreaterThanOrEqual(28);
    const columnLeft = hitColumnLeft(diedAt);
    const startAlpha = diedAt.impactBurst.alpha;
    const hitWidth = diedAt.impactBurst.bounds.width;
    const hitHeight = diedAt.impactBurst.bounds.height;
    await advance(page, 100);
    const mid = await sample(page);
    expect(mid.impactBurst.visible).toBe(true);
    expect(mid.impactBurst.alpha).toBeLessThan(startAlpha);
    expect(mid.impactBurst.bounds.width).toBeCloseTo(hitWidth, 0);
    expect(mid.impactBurst.bounds.height).toBeCloseTo(hitHeight, 0);
    expect(mid.panda.scaleX).toBeCloseTo(1.25, 1);
    await advance(page, 150);
    expect((await sample(page)).viewImpactBurst).toBeNull();
    await advance(page, 500);
    const landed = await sample(page);
    expect(landed.panda.bottom).toBe(426);
    expect(hitboxRight(landed)).toBeLessThanOrEqual(columnLeft - 2);
  });
});

test.describe("Rule: Restart clears the bounce state", () => {
  test("After restart the panda is back at x 100, bottom 426, upright, with no burst", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    const restart = await untilRestart(page);
    expect(restart.after.viewPandaX).toBe(100);
    expect(restart.after.panda).toMatchObject({ bottom: 426, flipY: false });
    expect(restart.after.viewImpactBurst).toBeNull();
    expect(restart.after.impactBurst.visible).toBe(false);
  });
});

import { expect, test } from "@playwright/test";
import { advance, advanceTo, openGame, oneBox, pressSpace, sample, startRun, untilGameOver } from "./probe.ts";

test.describe("Rule: The dust appears only when the panda lands from a jump", () => {
  test("No dust while the panda is in the air", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    await pressSpace(page);
    await advanceTo(page, 290);
    expect((await sample(page)).viewLandingPuff).toBeNull();
    await advanceTo(page, 580);
    const peak = await sample(page);
    expect(peak.viewLandingPuff).toBeNull();
    expect(peak.landingPuff.visible).toBe(false);
  });

  test("The dust appears on landing and fades to gone over 200 ms", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    await pressSpace(page);
    await advanceTo(page, 1000);
    let landed = await sample(page);
    while (landed.panda.bottom < 426) {
      await advance(page, 10);
      landed = await sample(page);
    }
    expect(landed.viewLandingPuff).toEqual({ x: 112.5, y: 426, alpha: 1 });
    expect(landed.landingPuff).toMatchObject({ x: 112.5, y: 426, alpha: 1, visible: true });
    await advance(page, 100);
    const fading = await sample(page);
    expect(fading.landingPuff.alpha).toBeCloseTo(0.5);
    expect(fading.landingPuff.visible).toBe(true);
    await advance(page, 100);
    const gone = await sample(page);
    expect(gone.viewLandingPuff).toBeNull();
    expect(gone.landingPuff.visible).toBe(false);
  });
});

test.describe("Rule: A dead panda kicks up no dust", () => {
  test("Falling to the floor during game over shows no dust", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    await advanceTo(page, 2300);
    await pressSpace(page);
    const { after } = await untilGameOver(page);
    expect(after.gameOver).toBe(true);
    await advance(page, 1000);
    const fallen = await sample(page);
    expect(fallen.panda.bottom).toBeGreaterThanOrEqual(426);
    expect(fallen.viewLandingPuff).toBeNull();
    expect(fallen.landingPuff.visible).toBe(false);
  });
});

import { expect, test } from "@playwright/test";
import { advanceTo, oneBox, openGame, pixelRows, press, pressSpace, sample, startRun, untilGameOver } from "./probe.ts";

test.describe("Rule: The shadow sits on the ground under the panda and shrinks with height", () => {
  test("A soft black ellipse is centred on the floor and full size while the panda stands", async ({ page }) => {
    await openGame(page, oneBox);
    const start = await sample(page);
    expect(start.pandaShadow).toMatchObject({
      x: 112.5,
      y: 426,
      scale: 1,
      visible: true,
      width: 24,
      height: 6,
      alpha: 0.3,
      color: "#000000",
    });
    expect(start.viewPandaShadow).toEqual({ x: 112.5, y: 426, scale: 1 });
  });

  test("It shrinks while the panda is in the air and grows back on landing", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    await pressSpace(page);
    await advanceTo(page, 290);
    const rising = await sample(page);
    expect(rising.pandaShadow).toMatchObject({ x: 112.5, y: 426, visible: true });
    expect(rising.pandaShadow.scale).toBeLessThan(1);
    expect(rising.pandaShadow.scale).toBeGreaterThan(0.5);
    await advanceTo(page, 580);
    expect((await sample(page)).pandaShadow.scale).toBeCloseTo(0.5, 2);
    await advanceTo(page, 1200);
    expect((await sample(page)).pandaShadow.scale).toBe(1);
  });
});

test.describe("Rule: The shadow is drawn above the floor and below the panda", () => {
  test("Depth and display order put it between the floor strips and the panda", async ({ page }) => {
    await openGame(page, oneBox);
    const start = await sample(page);
    const floorDepth = Math.max(start.depth.rock, start.depth.grass);
    expect(start.pandaShadow.depth).toBeGreaterThan(floorDepth);
    expect(start.pandaShadow.depth).toBeLessThan(start.depth.panda);
  });

  test("The painted pixels under the panda are darker than the floor without the shadow", async ({ page }) => {
    await openGame(page, oneBox);
    const [lit] = await pixelRows(page, [428]);
    await page.evaluate(() => {
      window.probe.hideShadow();
    });
    const [bare] = await pixelRows(page, [428]);
    const brightness = (row: number[][] | undefined) => (row?.[112] ?? []).reduce((total, value) => total + value, 0);
    expect(brightness(lit)).toBeLessThan(brightness(bare));
  });
});

test.describe("Rule: The shadow stays visible in every state", () => {
  test("It is still shown while paused", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    await pressSpace(page);
    await advanceTo(page, 290);
    await press(page, "KeyP");
    const paused = await sample(page);
    expect(paused.pandaShadow.visible).toBe(true);
    expect(paused.pandaShadow.scale).toBeLessThan(1);
  });

  test("It is still shown at game over", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    const { after } = await untilGameOver(page);
    expect(after.gameOver).toBe(true);
    expect(after.pandaShadow).toMatchObject({ x: 112.5, y: 426, visible: true });
  });
});

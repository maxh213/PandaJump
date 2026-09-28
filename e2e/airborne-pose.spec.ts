import { expect, test } from "@playwright/test";
import { advanceTo, oneBox, openGame, press, sample } from "./probe.ts";

test.describe("Rule: While the panda is in the air it shows the still pose", () => {
  test("A floor jump holds frame 17 at every moment in the air", async ({ page }) => {
    await openGame(page, oneBox);
    await press(page, "Space");
    for (const time of [100, 300, 580, 900]) {
      await advanceTo(page, time);
      const air = await sample(page);
      expect(air.panda.bottom).toBeLessThan(426);
      expect(air.panda.frame).toBe(17);
    }
  });

  test("A double jump keeps holding frame 17", async ({ page }) => {
    await openGame(page, oneBox);
    await press(page, "Space");
    await advanceTo(page, 580);
    await press(page, "Space");
    for (const time of [700, 1000]) {
      await advanceTo(page, time);
      const air = await sample(page);
      expect(air.panda.bottom).toBeLessThan(426);
      expect(air.panda.frame).toBe(17);
    }
  });
});

test.describe("Rule: On the floor the panda keeps its running cycle", () => {
  test("The frame cycles through 17 to 22 while the panda runs", async ({ page }) => {
    await openGame(page, oneBox);
    const frames = (await advanceTo(page, 400)).map((entry) => entry.panda.frame);
    expect(new Set(frames).size).toBeGreaterThan(1);
    expect(Math.min(...frames)).toBe(17);
    expect(Math.max(...frames)).toBe(22);
  });

  test("The running cycle picks up from game time the moment the panda lands", async ({ page }) => {
    await openGame(page, oneBox);
    await press(page, "Space");
    await advanceTo(page, 1300);
    const landed = await sample(page);
    expect(landed.panda.bottom).toBe(426);
    expect(landed.panda.frame).toBe(18);
  });
});

test.describe("Rule: Pause and game over look as they always did", () => {
  test("Pausing mid-jump shows the frame game time gives", async ({ page }) => {
    await openGame(page, oneBox);
    await press(page, "Space");
    await advanceTo(page, 300);
    await press(page, "KeyP");
    const paused = await sample(page);
    expect(paused.time).toBe(300);
    expect(paused.panda.frame).toBe(21);
  });
});

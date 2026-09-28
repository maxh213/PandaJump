import { expect, test } from "@playwright/test";
import { advance, advanceTo, oneBox, openGame, play, sample, untilRestart } from "./probe.ts";

const FONT = { color: "#ffffff", fontSize: "30px" };

test.describe("Rule: The score pops the instant a column is cleared, then eases back to normal size", () => {
  test("The score starts at scale 1 and stays there until the first column is cleared", async ({ page }) => {
    await openGame(page, oneBox);
    expect((await sample(page)).score).toMatchObject({ text: "0", scale: 1 });
    await play(page, [2700], 3300);
    expect((await sample(page)).score).toMatchObject({ text: "0", scale: 1 });
  });

  test("The score jumps to scale 1.3 the instant it changes, then eases back to 1 over 150 ms", async ({ page }) => {
    await openGame(page, oneBox);
    await play(page, [2700], 3300);
    const ticks = [];
    for (let step = 0; step < 10; step += 1) {
      ticks.push(...(await advance(page, 10)));
    }
    const popped = ticks.find((tick) => tick.score.text === "1");
    if (!popped) throw new Error("the column was not cleared within the sampled window");
    expect(Math.abs(popped.score.scale - 1.3)).toBeLessThanOrEqual(0.01);
    await advanceTo(page, popped.time + 75);
    expect(Math.abs((await sample(page)).score.scale - 1.15)).toBeLessThanOrEqual(0.02);
    await advanceTo(page, popped.time + 150);
    expect((await sample(page)).score.scale).toBe(1);
    await advanceTo(page, popped.time + 500);
    expect((await sample(page)).score.scale).toBe(1);
  });

  test("The score text never moves or changes font while it pops", async ({ page }) => {
    await openGame(page, oneBox);
    expect((await sample(page)).score).toMatchObject({ x: 20, y: 20, ...FONT });
    await play(page, [2700], 3300);
    expect((await sample(page)).score).toMatchObject({ x: 20, y: 20, ...FONT });
    const ticks = await advance(page, 100);
    ticks.forEach((tick) => {
      expect(tick.score).toMatchObject({ x: 20, y: 20, ...FONT });
    });
    await advanceTo(page, 3700);
    expect((await sample(page)).score).toMatchObject({ x: 20, y: 20, ...FONT });
  });
});

test.describe("Rule: A restart clears the pop along with everything else", () => {
  test("Dying and tapping to play again leaves the score at scale 1", async ({ page }) => {
    await openGame(page, oneBox);
    await play(page, [2700], 3340);
    expect((await sample(page)).score).toMatchObject({ text: "1" });
    expect((await sample(page)).score.scale).toBeGreaterThan(1);
    const restart = await untilRestart(page);
    expect(restart.after.score).toMatchObject({ text: "0", scale: 1 });
  });
});

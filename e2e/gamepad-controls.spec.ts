import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { advance, advanceTo, heightOf, oneBox, openGame, sample, settle, standardRandom, untilGameOver } from "./probe.ts";

const installPad = () => {
  const pressed = new Set<number>();
  let stamp = 0;
  const buttons = () =>
    Array.from({ length: 17 }, (_, index) => ({ pressed: pressed.has(index), touched: pressed.has(index), value: pressed.has(index) ? 1 : 0 }));
  const pad = () => ({
    id: "Standard Gamepad",
    index: 0,
    connected: true,
    mapping: "standard",
    timestamp: performance.now() + (stamp += 1),
    axes: [0, 0, 0, 0],
    buttons: buttons(),
    vibrationActuator: null,
  });
  const fake = window as unknown as { fakePad: { down: (index: number) => void; up: (index: number) => void } };
  fake.fakePad = {
    down: (index) => pressed.add(index),
    up: (index) => pressed.delete(index),
  };
  navigator.getGamepads = () => [pad() as unknown as Gamepad, null, null, null];
  window.dispatchEvent(Object.assign(new Event("gamepadconnected"), { gamepad: pad() }));
};

const withPad = async (page: Page, random: number[]) => {
  await page.addInitScript(installPad);
  await openGame(page, random);
};

const padDown = async (page: Page, index: number) => {
  await page.evaluate((value) => {
    (window as unknown as { fakePad: { down: (i: number) => void } }).fakePad.down(value);
  }, index);
  await settle(page);
};

const padUp = async (page: Page, index: number) => {
  await page.evaluate((value) => {
    (window as unknown as { fakePad: { up: (i: number) => void } }).fakePad.up(value);
  }, index);
  await settle(page);
};

const padPress = async (page: Page, index: number) => {
  await padDown(page, index);
  await padUp(page, index);
};

test.describe("Rule: The bottom face button jumps and double jumps like Space", () => {
  test("Button 0 jumps and a second press in mid-air double jumps", async ({ page }) => {
    await withPad(page, standardRandom());
    await padPress(page, 0);
    await advance(page, 200);
    const first = heightOf(await sample(page));
    expect(first).toBeGreaterThan(0);
    await padPress(page, 0);
    await advance(page, 200);
    expect(heightOf(await sample(page))).toBeGreaterThan(first);
  });

  test("Holding button 0 across many frames produces exactly one jump", async ({ page }) => {
    await withPad(page, standardRandom());
    await padDown(page, 0);
    await advance(page, 100);
    expect(heightOf(await sample(page))).toBeGreaterThan(0);
    await advance(page, 1400);
    await settle(page);
    const landed = await sample(page);
    expect(landed.panda.bottom).toBe(426);
    await advance(page, 300);
    expect((await sample(page)).panda.bottom).toBe(426);
  });
});

test.describe("Rule: The bottom face button resumes a paused run and restarts after game over", () => {
  test("Button 0 while paused starts the countdown", async ({ page }) => {
    await withPad(page, standardRandom());
    await advanceTo(page, 1000);
    await padPress(page, 9);
    await padPress(page, 0);
    const resumed = await sample(page);
    expect(resumed.pauseTitle.visible).toBe(false);
    expect(resumed.panda.bottom).toBe(426);
    expect(resumed.countdownText).toMatchObject({ text: "3", visible: true });
  });

  test("Button 0 restarts the run after the 500 ms freeze", async ({ page }) => {
    await withPad(page, oneBox);
    await untilGameOver(page);
    await padPress(page, 0);
    expect((await sample(page)).restarts).toBe(0);
    await advance(page, 500);
    await padPress(page, 0);
    expect((await sample(page)).restarts).toBe(1);
  });
});

test.describe("Rule: The Start button pauses and resumes like P", () => {
  test("Button 9 pauses without a jump and a second press starts the countdown", async ({ page }) => {
    await withPad(page, standardRandom());
    await advanceTo(page, 1000);
    await padPress(page, 9);
    const paused = await sample(page);
    expect(paused.pauseTitle).toMatchObject({ text: "Paused", visible: true });
    expect(paused.panda.bottom).toBe(426);
    await padPress(page, 9);
    const resumed = await sample(page);
    expect(resumed.pauseTitle.visible).toBe(false);
    expect(resumed.panda.bottom).toBe(426);
    expect(resumed.countdownText).toMatchObject({ text: "3", visible: true });
  });
});

test.describe("Rule: Other buttons do nothing", () => {
  test("Button 1 neither jumps nor pauses", async ({ page }) => {
    await withPad(page, standardRandom());
    await advanceTo(page, 1000);
    await padPress(page, 1);
    const after = await sample(page);
    expect(after.panda.bottom).toBe(426);
    expect(after.pauseTitle.visible).toBe(false);
  });
});

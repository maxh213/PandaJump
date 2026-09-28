import { expect, test } from "@playwright/test";
import { advanceTo, oneBox, openGame, play, sample } from "./probe.ts";

const CLOUD_SCRIPT = [0, 0.5, 1];

test.describe("Rule: Clouds sit behind everything else", () => {
  test("Every cloud renders behind the floor, boxes, panda and score, using the two cloud textures", async ({ page }) => {
    await openGame(page, CLOUD_SCRIPT);
    const start = await sample(page);
    expect(start.clouds).toHaveLength(3);
    expect(start.clouds.every((cloud) => cloud.depth < 0)).toBe(true);
    expect(start.clouds.every((cloud) => ["cloud_02.png", "cloud_05.png"].includes(cloud.key))).toBe(true);
  });
});

test.describe("Rule: Clouds drift left at a steady speed while bobbing over a 3 second cycle", () => {
  test("A cloud drifts 40 px per second and bobs up 6 px then back past its base", async ({ page }) => {
    await openGame(page, CLOUD_SCRIPT);
    const cloudAt = async (time: number) => {
      const samples = await advanceTo(page, time);
      const cloud = (samples.at(-1) ?? (await sample(page))).viewClouds[1];
      return cloud as { x: number; y: number; texture: string };
    };
    const at750 = await cloudAt(750);
    expect(at750.x).toBeCloseTo(120);
    expect(at750.y).toBeCloseTo(106);
    const at1500 = await cloudAt(1500);
    expect(at1500.x).toBeCloseTo(90);
    expect(at1500.y).toBeCloseTo(100);
    const at2250 = await cloudAt(2250);
    expect(at2250.x).toBeCloseTo(60);
    expect(at2250.y).toBeCloseTo(94);
  });
});

test.describe("Rule: A cloud leaving the left edge is replaced from the right edge", () => {
  test("The leftmost cloud respawns off the right edge with a freshly drawn height and swapped texture", async ({ page }) => {
    await openGame(page, CLOUD_SCRIPT);
    const before = (await advanceTo(page, 1249)).at(-1)?.viewClouds[0];
    expect(before?.x).toBeLessThan(-49);
    expect(before?.x).toBeGreaterThan(-50);
    const after = (await advanceTo(page, 1250)).at(-1);
    expect(after?.viewClouds).toHaveLength(3);
    expect(after?.viewClouds[0]).toEqual({ x: 400, y: 6, texture: "cloud_05.png" });
  });
});

test.describe("Rule: Exactly 3 clouds are always on screen within the top 200 px", () => {
  test("Clouds stay at 3 and within y 0-200 across many respawns", async ({ page }) => {
    await openGame(page, CLOUD_SCRIPT);
    for (let time = 0; time <= 20000; time += 1250) {
      const now = (await advanceTo(page, time)).at(-1) ?? (await sample(page));
      expect(now.viewClouds).toHaveLength(3);
      now.viewClouds.forEach((cloud) => {
        expect(cloud.y).toBeGreaterThanOrEqual(0);
        expect(cloud.y).toBeLessThanOrEqual(200);
      });
    }
  });
});

test.describe("Rule: Clouds never affect collisions or score", () => {
  test("Clearing a column scores the same with clouds on screen as it would with none", async ({ page }) => {
    await openGame(page, oneBox);
    await play(page, [2700], 2700);
    const early = await sample(page);
    expect(early.viewClouds).toHaveLength(3);
    await advanceTo(page, 3300);
    expect((await sample(page)).score.text).toBe("0");
    await advanceTo(page, 3340);
    const cleared = await sample(page);
    expect(cleared.score.text).toBe("1");
    expect(cleared.restarts).toBe(0);
  });
});

test.describe("Rule: Clouds are deterministic under the injected random source and clock", () => {
  test("Two runs with the same random source and clock draw identical clouds at every sampled moment", async ({ browser }, testInfo) => {
    testInfo.setTimeout(testInfo.timeout * 3);
    const first = await browser.newPage();
    const second = await browser.newPage();
    await openGame(first, CLOUD_SCRIPT);
    await openGame(second, CLOUD_SCRIPT);
    for (let time = 0; time <= 20000; time += 1250) {
      const a = (await advanceTo(first, time)).at(-1)?.viewClouds ?? (await sample(first)).viewClouds;
      const b = (await advanceTo(second, time)).at(-1)?.viewClouds ?? (await sample(second)).viewClouds;
      expect(a).toEqual(b);
    }
    await first.close();
    await second.close();
  });
});

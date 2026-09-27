import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { advanceTo, columnsAt, openGame, pressSpace, sample } from "./probe.ts";

const TEXTURE_SCRIPT = [0.25, 0.5, 0, 0.25, 0.5, 0.2, 0.25, 0.5, 0.4, 0.25, 0.5, 0.6, 0.25, 0.5, 0.8];
const STACKED_SCRIPT = [0.75, 0.5, 0];

const SPAWN_TEXTURES = ["dirt_06.png", "ice_06.png", "metal_06.png", "sand_06.png", "snow_06.png"];

const clearColumnAt = async (page: Page, spawnTime: number) => {
  await advanceTo(page, spawnTime + 1200);
  await pressSpace(page);
};

test.describe("Rule: Box columns draw from a small set of ground textures", () => {
  test("Five columns in a row use five different ground textures from the random source", async ({ page }) => {
    await openGame(page, TEXTURE_SCRIPT);
    for (const [index, texture] of SPAWN_TEXTURES.entries()) {
      const spawnTime = 1500 * (index + 1);
      await advanceTo(page, spawnTime + 100);
      const column = columnsAt(await sample(page)).find((entry) => entry.x === 380);
      expect(column?.boxes).toHaveLength(1);
      expect(column?.boxes.every((box) => box.key === texture)).toBe(true);
      await clearColumnAt(page, spawnTime);
    }
  });
});

test.describe("Rule: Every box in one column uses the same texture as the rest of that column", () => {
  test("Both boxes of a two-box column render with the same texture", async ({ page }) => {
    await openGame(page, STACKED_SCRIPT);
    await advanceTo(page, 1600);
    const column = columnsAt(await sample(page)).find((entry) => entry.x === 380);
    expect(column?.boxes.map((box) => box.key)).toEqual(["dirt_06.png", "dirt_06.png"]);
  });
});

test.describe("Rule: Box textures are deterministic under the injected random source", () => {
  test("Two runs opened with the same texture source draw the same texture sequence", async ({ browser }) => {
    const first = await browser.newPage();
    const second = await browser.newPage();
    await openGame(first, TEXTURE_SCRIPT);
    await openGame(second, TEXTURE_SCRIPT);
    for (const [index, texture] of SPAWN_TEXTURES.entries()) {
      const spawnTime = 1500 * (index + 1);
      await advanceTo(first, spawnTime + 100);
      await advanceTo(second, spawnTime + 100);
      const a = columnsAt(await sample(first)).find((entry) => entry.x === 380);
      const b = columnsAt(await sample(second)).find((entry) => entry.x === 380);
      expect(a?.boxes.map((box) => box.key)).toEqual([texture]);
      expect(b?.boxes.map((box) => box.key)).toEqual([texture]);
      await clearColumnAt(first, spawnTime);
      await clearColumnAt(second, spawnTime);
    }
    await first.close();
    await second.close();
  });
});

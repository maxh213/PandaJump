import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { advanceTo, columnsAt, openGame, play, pressSpace, sample, standardJumps, standardRandom, startRun } from "./probe.ts";

const TEXTURE_SCRIPT = [0.25, 0.5, 0, 0.25, 0.5, 0.2, 0.25, 0.5, 0.4, 0.25, 0.5, 0.6, 0.25, 0.5, 0.8];
const STACKED_SCRIPT = [0.75, 0.5, 0];
const PAIRED_TEXTURE_SCRIPT = [0.25, 0, 0.6];
const MEADOW_TEXTURE = "dirt_06.png";

const SPAWN_COLUMNS = [1, 2, 3, 4, 5];

const clearColumnAt = async (page: Page, spawnTime: number) => {
  await advanceTo(page, spawnTime + 1200);
  await pressSpace(page);
};

test.describe("Rule: Box columns take the texture of their biome", () => {
  test("Five meadow columns in a row all use the meadow texture whatever the random source draws", async ({ page }) => {
    await openGame(page, TEXTURE_SCRIPT);
    await startRun(page);
    for (const number of SPAWN_COLUMNS) {
      const spawnTime = 1500 * number;
      await advanceTo(page, spawnTime + 100);
      const column = columnsAt(await sample(page)).find((entry) => entry.x === 380);
      expect(column?.boxes).toHaveLength(1);
      expect(column?.boxes.every((box) => box.key === MEADOW_TEXTURE)).toBe(true);
      await clearColumnAt(page, spawnTime);
    }
  });
});

test.describe("Rule: Every box in one column uses the same texture as the rest of that column", () => {
  test("Both boxes of a two-box column render with the same texture", async ({ page }) => {
    await openGame(page, STACKED_SCRIPT);
    await startRun(page);
    await advanceTo(page, 1600);
    const column = columnsAt(await sample(page)).find((entry) => entry.x === 380);
    expect(column?.boxes.map((box) => box.key)).toEqual(["dirt_06.png", "dirt_06.png"]);
  });

  test("A front column and its trailing second column render with the same texture", async ({ page }) => {
    test.setTimeout(120_000);
    await openGame(page, standardRandom({ 13: PAIRED_TEXTURE_SCRIPT }));
    await startRun(page);
    await play(page, standardJumps(19500), 19500);
    expect((await sample(page)).score.text).toBe("11");
    await advanceTo(page, 20000);
    const columns = columnsAt(await sample(page)).filter((column) => column.x >= 100);
    expect(columns.map((column) => column.x)).toEqual([300, 364]);
    for (const column of columns) {
      expect(column.boxes.map((box) => box.key)).toEqual([MEADOW_TEXTURE]);
    }
  });
});

test.describe("Rule: Box textures are deterministic under the injected random source", () => {
  test("Two runs opened with the same texture source draw the same texture sequence", async ({ browser }) => {
    const first = await browser.newPage();
    const second = await browser.newPage();
    await openGame(first, TEXTURE_SCRIPT);
    await startRun(first);
    await openGame(second, TEXTURE_SCRIPT);
    await startRun(second);
    for (const column of SPAWN_COLUMNS) {
      const spawnTime = 1500 * column;
      await advanceTo(first, spawnTime + 100);
      await advanceTo(second, spawnTime + 100);
      const a = columnsAt(await sample(first)).find((entry) => entry.x === 380);
      const b = columnsAt(await sample(second)).find((entry) => entry.x === 380);
      expect(a?.boxes.map((box) => box.key)).toEqual([MEADOW_TEXTURE]);
      expect(b?.boxes.map((box) => box.key)).toEqual([MEADOW_TEXTURE]);
      await clearColumnAt(first, spawnTime);
      await clearColumnAt(second, spawnTime);
    }
    await first.close();
    await second.close();
  });
});

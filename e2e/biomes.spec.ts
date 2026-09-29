import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { advance, columnClearTime, oneBox, openGame, play, sample, spawnTimeOf, startRun, untilRestart } from "./probe.ts";
import type { Sample } from "./probe.ts";

const EXTRA_COLUMNS = 3;
const JUMP_OFFSET = 788;
const CLEAR_BUFFER = 20;
const NEXT_COLUMN_VISIBLE_MS = 200;

interface Look {
  biome: string;
  floor: string;
  top: string;
  column: string;
  sky: string;
  hills: string;
}

const MEADOW: Look = {
  biome: "meadow",
  floor: "rock_06.png",
  top: "top_grass_01.png",
  column: "dirt_06.png",
  sky: "#71c5cf",
  hills: "#4a9ba6",
};
const DESERT: Look = {
  biome: "desert",
  floor: "sand_06.png",
  top: "sand_06.png",
  column: "sand_06.png",
  sky: "#f4a261",
  hills: "#c97b3a",
};
const SNOWFIELD: Look = {
  biome: "snowfield",
  floor: "snow_06.png",
  top: "snow_06.png",
  column: "ice_06.png",
  sky: "#a9c9e0",
  hills: "#ffffff",
};
const INDUSTRIAL: Look = {
  biome: "industrial",
  floor: "rock_06.png",
  top: "metal_06.png",
  column: "metal_06.png",
  sky: "#4a4e69",
  hills: "#22223b",
};

const rampedRandom = (column: number): number[] => Array.from({ length: column + EXTRA_COLUMNS }, () => oneBox).flat();

const jumpTimesFor = (from: number, to: number): number[] =>
  Array.from({ length: to - from + 1 }, (_, index) => spawnTimeOf(from + index) + JUMP_OFFSET);

const playFromTo = async (page: Page, from: number, to: number): Promise<Sample> => {
  await play(page, jumpTimesFor(from, to), columnClearTime(to) + CLEAR_BUFFER);
  await advance(page, NEXT_COLUMN_VISIBLE_MS);
  return sample(page);
};

const lookOf = (state: Sample, biome: string): Look => ({
  biome,
  floor: state.rock.key,
  top: state.grass.key,
  column: [...new Set(state.boxes.filter((box) => box.x > 100).map((box) => box.key))].join(","),
  sky: state.sky,
  hills: state.viewHills.color,
});

const expectLook = (state: Sample, expected: Look): void => {
  expect(lookOf(state, expected.biome)).toEqual(expected);
  expect(state.cameraSky).toBe(expected.sky);
  expect(state.hills.key).toBe(`hills-${expected.hills}`);
};

test.describe("Rule: The biome is decided from the score", () => {
  test("A run starts in the meadow", async ({ page }) => {
    await openGame(page, oneBox);
    await startRun(page);
    const first = await sample(page);
    expect(first.biome).toBe("meadow");
    expect(first.rock.key).toBe(MEADOW.floor);
    expect(first.grass.key).toBe(MEADOW.top);
    expect(first.sky).toBe(MEADOW.sky);
    expect(first.cameraSky).toBe(MEADOW.sky);
    expect(first.hills.key).toBe(`hills-${MEADOW.hills}`);
    await play(page, [], 1600);
    expectLook(await sample(page), MEADOW);
  });

  test("The desert starts at 20, the snowfield at 40 and the industrial biome at 60", async ({ page }) => {
    test.setTimeout(300_000);
    await openGame(page, rampedRandom(62));
    await startRun(page);
    const desert = await playFromTo(page, 1, 22);
    expect(desert.score.text).toBe("22");
    expectLook(desert, DESERT);
    const snowfield = await playFromTo(page, 23, 42);
    expect(snowfield.score.text).toBe("42");
    expectLook(snowfield, SNOWFIELD);
    const industrial = await playFromTo(page, 43, 62);
    expect(industrial.score.text).toBe("62");
    expectLook(industrial, INDUSTRIAL);
  });
});

test.describe("Rule: A new run always starts back in the meadow", () => {
  test("Restarting after a death in the desert returns to the meadow", async ({ page }) => {
    test.setTimeout(120_000);
    await openGame(page, rampedRandom(22));
    await startRun(page);
    expectLook(await playFromTo(page, 1, 22), DESERT);
    const restart = await untilRestart(page);
    expect(restart.after.score.text).toBe("0");
    expect(restart.after.biome).toBe("meadow");
    expect(restart.after.rock.key).toBe(MEADOW.floor);
    expect(restart.after.grass.key).toBe(MEADOW.top);
    expect(restart.after.sky).toBe(MEADOW.sky);
    expect(restart.after.viewHills.color).toBe(MEADOW.hills);
  });
});

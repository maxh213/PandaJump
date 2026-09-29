import { expect, test } from "vitest";
import { BIOME_FADE_MS, BIOMES, biomeFadeProgress, biomeFor, mixHex, starsAlphaFor } from "./biome.ts";

const [meadow, desert, snowfield, industrial] = BIOMES;

test("meadow below a score of 20, with the day sky", () => {
  expect(biomeFor(0)).toBe(meadow);
  expect(biomeFor(19)).toBe(meadow);
  expect(meadow.sky).toBe("#71c5cf");
  expect(meadow.hills).toBe("#4a9ba6");
});

test("desert from a score of 20 to 39, with the sunset sky", () => {
  expect(biomeFor(20)).toBe(desert);
  expect(biomeFor(39)).toBe(desert);
  expect(desert.sky).toBe("#f4a261");
  expect(desert.hills).toBe("#c97b3a");
});

test("snowfield from a score of 40 to 59", () => {
  expect(biomeFor(40)).toBe(snowfield);
  expect(biomeFor(59)).toBe(snowfield);
});

test("industrial from a score of 60 to 79, under a night sky with stars", () => {
  expect(biomeFor(60)).toBe(industrial);
  expect(biomeFor(79)).toBe(industrial);
  expect(industrial.stars).toBe(true);
});

test("the sequence repeats from a score of 80", () => {
  expect(biomeFor(80)).toBe(meadow);
  expect(biomeFor(100)).toBe(desert);
  expect(biomeFor(140)).toBe(industrial);
});

test("each biome changes the floor, the columns, the sky and the hills", () => {
  BIOMES.forEach((biome, index) => {
    BIOMES.slice(index + 1).forEach((other) => {
      expect(biome.column).not.toBe(other.column);
      expect(biome.sky).not.toBe(other.sky);
      expect(biome.hills).not.toBe(other.hills);
      expect(`${biome.floor}${biome.top}`).not.toBe(`${other.floor}${other.top}`);
    });
  });
});

test("only the industrial biome shows stars", () => {
  expect(BIOMES.filter((biome) => biome.stars)).toEqual([industrial]);
});

test("mixHex lerps each channel and biomeFadeProgress clamps over BIOME_FADE_MS", () => {
  expect(BIOME_FADE_MS).toBe(3000);
  expect(mixHex("#71c5cf", "#f4a261", 0)).toBe("#71c5cf");
  expect(mixHex("#71c5cf", "#f4a261", 1)).toBe("#f4a261");
  expect(mixHex("#71c5cf", "#f4a261", 0.5)).toBe("#b3b498");
  expect(biomeFadeProgress(null)).toBe(1);
  expect(biomeFadeProgress(0)).toBe(0);
  expect(biomeFadeProgress(1500)).toBe(0.5);
  expect(biomeFadeProgress(3000)).toBe(1);
  expect(biomeFadeProgress(4000)).toBe(1);
});

test("starsAlphaFor fades in entering industrial and out leaving it", () => {
  expect(starsAlphaFor(meadow, desert, 0.5)).toBe(0);
  expect(starsAlphaFor(snowfield, industrial, 0)).toBe(0);
  expect(starsAlphaFor(snowfield, industrial, 0.5)).toBe(0.5);
  expect(starsAlphaFor(snowfield, industrial, 1)).toBe(1);
  expect(starsAlphaFor(industrial, meadow, 0)).toBe(1);
  expect(starsAlphaFor(industrial, meadow, 0.5)).toBe(0.5);
  expect(starsAlphaFor(industrial, meadow, 1)).toBe(0);
});

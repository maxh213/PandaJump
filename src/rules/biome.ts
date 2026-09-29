export type BoxTexture = "dirt_06.png" | "ice_06.png" | "metal_06.png" | "sand_06.png" | "snow_06.png";

type FloorTexture = "rock_06.png" | "sand_06.png" | "snow_06.png";
type TopTexture = "top_grass_01.png" | "sand_06.png" | "snow_06.png" | "metal_06.png";

export interface Biome {
  readonly name: string;
  readonly sky: string;
  readonly hills: string;
  readonly column: BoxTexture;
  readonly floor: FloorTexture;
  readonly top: TopTexture;
  readonly stars: boolean;
}

const BIOME_SCORES = 20;

export const BIOME_FADE_MS = 3000;

export const MEADOW: Biome = {
  name: "meadow",
  sky: "#71c5cf",
  hills: "#4a9ba6",
  column: "dirt_06.png",
  floor: "rock_06.png",
  top: "top_grass_01.png",
  stars: false,
};

export const BIOMES: readonly [Biome, Biome, Biome, Biome] = [
  MEADOW,
  { name: "desert", sky: "#f4a261", hills: "#c97b3a", column: "sand_06.png", floor: "sand_06.png", top: "sand_06.png", stars: false },
  { name: "snowfield", sky: "#a9c9e0", hills: "#ffffff", column: "ice_06.png", floor: "snow_06.png", top: "snow_06.png", stars: false },
  { name: "industrial", sky: "#4a4e69", hills: "#22223b", column: "metal_06.png", floor: "rock_06.png", top: "metal_06.png", stars: true },
];

type BiomeIndex = 0 | 1 | 2 | 3;

export const biomeFor = (score: number): Biome => BIOMES[(Math.floor(score / BIOME_SCORES) % 4) as BiomeIndex];

const hexChannel = (hex: string, index: number): number => parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16);

const mixChannel = (from: number, to: number, t: number): number => Math.round(from + (to - from) * t);

export const mixHex = (from: string, to: string, t: number): string => {
  const progress = Math.min(1, Math.max(0, t));
  return `#${[0, 1, 2]
    .map((index) => mixChannel(hexChannel(from, index), hexChannel(to, index), progress).toString(16).padStart(2, "0"))
    .join("")}`;
};

export const biomeFadeProgress = (elapsed: number | null): number =>
  Math.min(1, Math.max(0, (elapsed ?? BIOME_FADE_MS) / BIOME_FADE_MS));

export const starsAlphaFor = (from: Biome, to: Biome, progress: number): number =>
  Number(from.stars) * (1 - progress) + Number(to.stars) * progress;
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

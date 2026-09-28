import { CANVAS_WIDTH, FLOOR_Y, PANDA_X, TILE_SIZE } from "./world.ts";

export type Random = () => number;

type BoxTexture = "dirt_06.png" | "ice_06.png" | "metal_06.png" | "sand_06.png" | "snow_06.png";

export interface Column {
  readonly spawnDistance: number;
  readonly offset: number;
  readonly boxes: number;
  readonly scoresWhenCleared: boolean;
  readonly texture: BoxTexture;
}

export interface Box {
  readonly x: number;
  readonly y: number;
  readonly texture: BoxTexture;
}

const PANDA_WIDTH = 25;
const SECOND_COLUMN_SCORE = 10;

const DEFAULT_TEXTURE: BoxTexture = "dirt_06.png";

const TEXTURE_THRESHOLDS: readonly (readonly [number, BoxTexture])[] = [
  [0, DEFAULT_TEXTURE],
  [0.2, "ice_06.png"],
  [0.4, "metal_06.png"],
  [0.6, "sand_06.png"],
  [0.8, "snow_06.png"],
];

export const SPAWN_EVERY = 1500;

const columnX = (column: Column, distance: number): number =>
  CANVAS_WIDTH + column.offset - (distance - column.spawnDistance);

const drawTexture = (random: Random): BoxTexture => {
  const value = random();
  return TEXTURE_THRESHOLDS.reduce<BoxTexture>(
    (texture, [threshold, candidate]) => (value >= threshold ? candidate : texture),
    DEFAULT_TEXTURE,
  );
};

export const spawnColumns = (distance: number, score: number, random: Random): Column[] => {
  const boxes = Math.floor(random() * 2) + 1;
  const second = Math.floor(random() * 3) === 0 && score > SECOND_COLUMN_SCORE;
  const texture = drawTexture(random);
  const front = { spawnDistance: distance, offset: 0, boxes, scoresWhenCleared: !second, texture };
  return second ? [front, { ...front, offset: TILE_SIZE, scoresWhenCleared: true }] : [front];
};

const isCleared = (column: Column, distance: number): boolean =>
  column.scoresWhenCleared && columnX(column, distance) + TILE_SIZE <= PANDA_X;

export const countCleared = (columns: readonly Column[], distance: number): number =>
  columns.filter((column) => isCleared(column, distance)).length;

export const moveColumns = (columns: readonly Column[], distance: number): Column[] =>
  columns
    .filter((column) => columnX(column, distance) + TILE_SIZE > 0)
    .map((column) => (isCleared(column, distance) ? { ...column, scoresWhenCleared: false } : column));

const touches = (column: Column, distance: number, height: number): boolean => {
  const x = columnX(column, distance);
  return x < PANDA_X + PANDA_WIDTH && x + TILE_SIZE > PANDA_X && height < column.boxes * TILE_SIZE;
};

export const hitsPanda = (columns: readonly Column[], distance: number, height: number): boolean =>
  columns.some((column) => touches(column, distance, height));

export const boxesOf = (columns: readonly Column[], distance: number): Box[] =>
  columns.flatMap((column) =>
    Array.from({ length: column.boxes }, (_, index) => ({
      x: columnX(column, distance),
      y: FLOOR_Y - TILE_SIZE * (index + 1),
      texture: column.texture,
    })),
  );

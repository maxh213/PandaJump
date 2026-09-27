import { CANVAS_WIDTH, FLOOR_Y, PANDA_X, SCROLL_PX_PER_MS, TILE_SIZE } from "./world.ts";

export type Random = () => number;

type BoxTexture = "dirt_06.png" | "ice_06.png" | "metal_06.png" | "sand_06.png" | "snow_06.png";

export interface Column {
  readonly spawnedAt: number;
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

const columnX = (column: Column, time: number): number =>
  CANVAS_WIDTH + column.offset - SCROLL_PX_PER_MS * (time - column.spawnedAt);

const drawTexture = (random: Random): BoxTexture => {
  const value = random();
  return TEXTURE_THRESHOLDS.reduce<BoxTexture>(
    (texture, [threshold, candidate]) => (value >= threshold ? candidate : texture),
    DEFAULT_TEXTURE,
  );
};

export const spawnColumns = (time: number, score: number, random: Random): Column[] => {
  const boxes = Math.floor(random() * 2) + 1;
  const second = Math.floor(random() * 3) === 0 && score > SECOND_COLUMN_SCORE;
  const texture = drawTexture(random);
  const front = { spawnedAt: time, offset: 0, boxes, scoresWhenCleared: !second, texture };
  return second ? [front, { ...front, offset: TILE_SIZE, scoresWhenCleared: true }] : [front];
};

const isCleared = (column: Column, time: number): boolean =>
  column.scoresWhenCleared && columnX(column, time) + TILE_SIZE <= PANDA_X;

export const countCleared = (columns: readonly Column[], time: number): number =>
  columns.filter((column) => isCleared(column, time)).length;

export const moveColumns = (columns: readonly Column[], time: number): Column[] =>
  columns
    .filter((column) => columnX(column, time) + TILE_SIZE > 0)
    .map((column) => (isCleared(column, time) ? { ...column, scoresWhenCleared: false } : column));

const touches = (column: Column, time: number, height: number): boolean => {
  const x = columnX(column, time);
  return x < PANDA_X + PANDA_WIDTH && x + TILE_SIZE > PANDA_X && height < column.boxes * TILE_SIZE;
};

export const hitsPanda = (columns: readonly Column[], time: number, height: number): boolean =>
  columns.some((column) => touches(column, time, height));

export const boxesOf = (columns: readonly Column[], time: number): Box[] =>
  columns.flatMap((column) =>
    Array.from({ length: column.boxes }, (_, index) => ({
      x: columnX(column, time),
      y: FLOOR_Y - TILE_SIZE * (index + 1),
      texture: column.texture,
    })),
  );

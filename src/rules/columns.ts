import { biomeFor } from "./biome.ts";
import type { BoxTexture } from "./biome.ts";
import { CANVAS_WIDTH, FLOOR_Y, PANDA_X, TILE_SIZE } from "./world.ts";

export type Random = () => number;

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
  readonly hit: boolean;
}

const HITBOX_LEFT = PANDA_X + 3;
const HITBOX_RIGHT = PANDA_X + 22;
const FEET_FORGIVENESS = 4;
const SECOND_COLUMN_SCORE = 10;
const MARKER_GAP = 8;

const columnX = (column: Column, distance: number): number =>
  CANVAS_WIDTH + column.offset - (distance - column.spawnDistance);

const skipTextureDraw = (random: Random): void => {
  random();
};

export const spawnColumns = (distance: number, score: number, random: Random): Column[] => {
  const boxes = Math.floor(random() * 2) + 1;
  const second = Math.floor(random() * 3) === 0 && score > SECOND_COLUMN_SCORE;
  skipTextureDraw(random);
  const texture = biomeFor(score).column;
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
  return x < HITBOX_RIGHT && x + TILE_SIZE > HITBOX_LEFT && height < column.boxes * TILE_SIZE - FEET_FORGIVENESS;
};

export const touchingColumn = (columns: readonly Column[], distance: number, height: number): Column | null =>
  columns.find((column) => touches(column, distance, height)) ?? null;

export const hitsPanda = (columns: readonly Column[], distance: number, height: number): boolean =>
  touchingColumn(columns, distance, height) !== null;

export const boxesOf = (columns: readonly Column[], distance: number, hitColumn: Column | null): Box[] =>
  columns.flatMap((column) =>
    Array.from({ length: column.boxes }, (_, index) => ({
      x: columnX(column, distance),
      y: FLOOR_Y - TILE_SIZE * (index + 1),
      texture: column.texture,
      hit: column === hitColumn,
    })),
  );

export interface Progress {
  readonly score: number;
  readonly best: number;
}

export const bestColumnMarker = (
  columns: readonly Column[],
  distance: number,
  progress: Progress,
): { x: number; y: number } | null => {
  if (progress.best <= 0 || progress.score > progress.best) return null;
  const target = columns.filter((column) => column.scoresWhenCleared).at(progress.best - progress.score);
  return target
    ? { x: columnX(target, distance) + TILE_SIZE / 2, y: FLOOR_Y - TILE_SIZE * target.boxes - MARKER_GAP }
    : null;
};

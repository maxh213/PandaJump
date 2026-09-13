import { CANVAS_WIDTH, FLOOR_Y, PANDA_X, SCROLL_PX_PER_MS, TILE_SIZE } from "./world.ts";

export type Random = () => number;

export interface Column {
  readonly spawnedAt: number;
  readonly offset: number;
  readonly boxes: number;
  readonly scoresWhenCleared: boolean;
}

export interface Box {
  readonly x: number;
  readonly y: number;
}

const PANDA_WIDTH = 25;
const SECOND_COLUMN_SCORE = 10;

export const SPAWN_EVERY = 1500;

const columnX = (column: Column, time: number): number =>
  CANVAS_WIDTH + column.offset - SCROLL_PX_PER_MS * (time - column.spawnedAt);

export const spawnColumns = (time: number, score: number, random: Random): Column[] => {
  const boxes = Math.floor(random() * 2) + 1;
  const second = Math.floor(random() * 3) === 0 && score > SECOND_COLUMN_SCORE;
  const front = { spawnedAt: time, offset: 0, boxes, scoresWhenCleared: !second };
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
    })),
  );

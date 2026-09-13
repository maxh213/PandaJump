export type Random = () => number;

export interface Column {
  readonly spawnedAt: number;
  readonly offset: number;
  readonly boxes: number;
  readonly scores: boolean;
}

export interface Box {
  readonly x: number;
  readonly y: number;
}

const BOX_SIZE = 64;
const SPAWN_X = 400;
const SPEED = 0.2;
const FLOOR_Y = 426;
const PANDA_LEFT = 100;
const PANDA_RIGHT = 125;
const SECOND_COLUMN_SCORE = 10;

export const SPAWN_EVERY = 1500;

const columnX = (column: Column, time: number): number =>
  SPAWN_X + column.offset - SPEED * (time - column.spawnedAt);

export const spawnColumns = (time: number, score: number, random: Random): Column[] => {
  const boxes = Math.floor(random() * 2) + 1;
  const second = Math.floor(random() * 3) === 0 && score > SECOND_COLUMN_SCORE;
  const front = { spawnedAt: time, offset: 0, boxes, scores: !second };
  return second ? [front, { ...front, offset: BOX_SIZE, scores: true }] : [front];
};

const isCleared = (column: Column, time: number): boolean =>
  column.scores && columnX(column, time) + BOX_SIZE <= PANDA_LEFT;

export const countCleared = (columns: readonly Column[], time: number): number =>
  columns.filter((column) => isCleared(column, time)).length;

export const moveColumns = (columns: readonly Column[], time: number): Column[] =>
  columns
    .filter((column) => columnX(column, time) + BOX_SIZE > 0)
    .map((column) => (isCleared(column, time) ? { ...column, scores: false } : column));

const touches = (column: Column, time: number, height: number): boolean => {
  const x = columnX(column, time);
  return x < PANDA_RIGHT && x + BOX_SIZE > PANDA_LEFT && height < column.boxes * BOX_SIZE;
};

export const hitsPanda = (columns: readonly Column[], time: number, height: number): boolean =>
  columns.some((column) => touches(column, time, height));

export const boxesOf = (columns: readonly Column[], time: number): Box[] =>
  columns.flatMap((column) =>
    Array.from({ length: column.boxes }, (_, index) => ({
      x: columnX(column, time),
      y: FLOOR_Y - BOX_SIZE * (index + 1),
    })),
  );

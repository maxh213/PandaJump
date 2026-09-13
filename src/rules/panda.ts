export interface Panda {
  readonly height: number;
  readonly speed: number;
  readonly airJump: boolean;
}

const GRAVITY = 1000;
const FLOOR_JUMP = 580;
const AIR_JUMP = 250;

export const standingPanda: Panda = { height: 0, speed: 0, airJump: false };

const isOnFloor = (panda: Panda): boolean => panda.height === 0 && panda.speed <= 0;

const airJump = (panda: Panda): Panda => (panda.airJump ? { ...panda, speed: AIR_JUMP, airJump: false } : panda);

export const jump = (panda: Panda): Panda =>
  isOnFloor(panda) ? { ...panda, speed: FLOOR_JUMP, airJump: true } : airJump(panda);

export const fall = (panda: Panda, ms: number): Panda => {
  const seconds = ms / 1000;
  const height = panda.height + panda.speed * seconds - (GRAVITY * seconds * seconds) / 2;
  return height > 0 ? { ...panda, height, speed: panda.speed - GRAVITY * seconds } : { ...panda, height: 0, speed: 0 };
};

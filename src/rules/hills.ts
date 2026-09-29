export const HILLS_REPEAT_WIDTH = 160;
const HILLS_SPEED_RATIO = 4;

export const hillsScrollFor = (distance: number): number => (distance / HILLS_SPEED_RATIO) % HILLS_REPEAT_WIDTH;

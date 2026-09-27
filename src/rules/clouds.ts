import { CANVAS_WIDTH } from "./world.ts";

export type Random = () => number;

type CloudTexture = "cloud_02.png" | "cloud_05.png";

export interface CloudState {
  readonly spawnedAt: number;
  readonly startX: number;
  readonly y: number;
  readonly texture: CloudTexture;
}

export interface Cloud {
  readonly x: number;
  readonly y: number;
  readonly texture: CloudTexture;
}

const CLOUD_WIDTH = 50;
const SPEED_PX_PER_MS = 0.04;
const BOB_AMPLITUDE = 6;
const BOB_PERIOD_MS = 3000;
const MIN_Y = BOB_AMPLITUDE;
const Y_RANGE = 200 - BOB_AMPLITUDE * 2;
const INITIAL_START_X: readonly number[] = [0, 150, 300];

const drawY = (random: Random): number => MIN_Y + random() * Y_RANGE;

const otherTexture = (texture: CloudTexture): CloudTexture =>
  texture === "cloud_02.png" ? "cloud_05.png" : "cloud_02.png";

const cloudX = (cloud: CloudState, time: number): number =>
  cloud.startX - SPEED_PX_PER_MS * (time - cloud.spawnedAt);

const isOffscreen = (cloud: CloudState, time: number): boolean => cloudX(cloud, time) + CLOUD_WIDTH <= 0;

const respawn = (cloud: CloudState, time: number, random: Random): CloudState => ({
  spawnedAt: time,
  startX: CANVAS_WIDTH,
  y: drawY(random),
  texture: otherTexture(cloud.texture),
});

export const initialClouds = (random: Random): CloudState[] =>
  INITIAL_START_X.map((startX, index) => ({
    spawnedAt: 0,
    startX,
    y: drawY(random),
    texture: index % 2 === 0 ? "cloud_02.png" : "cloud_05.png",
  }));

export const moveClouds = (clouds: readonly CloudState[], time: number, random: Random): CloudState[] =>
  clouds.map((cloud) => (isOffscreen(cloud, time) ? respawn(cloud, time, random) : cloud));

const bob = (cloud: CloudState, time: number): number =>
  BOB_AMPLITUDE * Math.sin((2 * Math.PI * (time - cloud.spawnedAt)) / BOB_PERIOD_MS);

export const cloudsOf = (clouds: readonly CloudState[], time: number): Cloud[] =>
  clouds.map((cloud) => ({ x: cloudX(cloud, time), y: cloud.y + bob(cloud, time), texture: cloud.texture }));

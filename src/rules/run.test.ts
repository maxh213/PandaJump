import { expect, test } from "vitest";
import { createRun } from "./index.ts";

const oneBoxEach = () => {
  let draws = 0;
  return () => {
    draws += 1;
    return draws % 2 === 1 ? 0.25 : 0.5;
  };
};

const noStore = { load: () => 0, save: () => undefined };

test("a run starts with the panda on the floor, score 0 and no boxes", () => {
  expect(createRun(oneBoxEach(), oneBoxEach(), noStore).view()).toEqual({
    time: 0,
    restarts: 0,
    score: "0",
    best: "0",
    pandaX: 100,
    pandaBottom: 426,
    pandaFrame: 17,
    floorScroll: 0,
    boxes: [],
    clouds: [
      { x: 0, y: 53, texture: "cloud_02.png" },
      { x: 150, y: 100, texture: "cloud_05.png" },
      { x: 300, y: 53, texture: "cloud_02.png" },
    ],
    gameOver: false,
  });
});

test("time moves the floor and cycles the run frames at 15 per second", () => {
  const run = createRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(100);
  expect(run.view().floorScroll).toBe(20);
  run.advance(233);
  expect(run.view().pandaFrame).toBe(21);
  run.advance(1);
  expect(run.view().pandaFrame).toBe(22);
  run.advance(66);
  expect(run.view()).toMatchObject({ time: 400, pandaFrame: 17, floorScroll: 16 });
  run.advance(600);
  expect(run.view().pandaFrame).toBe(20);
});

test("a jump peaks 168 px up at 580 ms", () => {
  const run = createRun(oneBoxEach(), oneBoxEach(), noStore);
  run.jump();
  run.advance(580);
  expect(run.view().pandaBottom).toBeCloseTo(426 - 168.2);
});

test("a column spawns every 1500 ms at the right edge", () => {
  const run = createRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(1499);
  expect(run.view().boxes).toEqual([]);
  run.advance(1);
  expect(run.view().boxes).toEqual([{ x: 400, y: 362, texture: "ice_06.png" }]);
  run.advance(100);
  expect(run.view().boxes).toEqual([{ x: 380, y: 362, texture: "ice_06.png" }]);
});

test("touching a column freezes the run and shows game over instead of restarting at once", () => {
  const run = createRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(2880);
  const frozen = run.view();
  expect(frozen).toMatchObject({ restarts: 0, score: "0", gameOver: true });
  expect(frozen.boxes).not.toEqual([]);
  run.advance(10);
  expect(run.view()).toEqual(frozen);
});

test("no click, tap or Space input restarts the run during the first 500ms after death", () => {
  const run = createRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(2880);
  const frozen = run.view();
  run.advance(499);
  run.jump();
  expect(run.view()).toMatchObject({ ...frozen, restarts: 0, gameOver: true });
});

test("a click, tap or Space input after 500ms starts a fresh run at score 0 and clears the game over screen", () => {
  const run = createRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(2880);
  run.advance(500);
  run.jump();
  expect(run.view()).toMatchObject({ restarts: 1, time: 0, boxes: [], score: "0", gameOver: false });
});

test("the restarts counter increments by exactly 1 on every restart", () => {
  const run = createRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(2880);
  run.advance(500);
  run.jump();
  expect(run.view().restarts).toBe(1);
  run.advance(2880);
  run.advance(500);
  run.jump();
  expect(run.view().restarts).toBe(2);
});

test("a fresh run still has no boxes and score 0 after one step", () => {
  const run = createRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(10);
  expect(run.view()).toMatchObject({ time: 10, boxes: [], score: "0" });
});

test("the result does not depend on how time is sliced", () => {
  const whole = createRun(oneBoxEach(), oneBoxEach(), noStore);
  const sliced = createRun(oneBoxEach(), oneBoxEach(), noStore);
  whole.jump();
  sliced.jump();
  whole.advance(25);
  sliced.advance(10);
  sliced.advance(10);
  sliced.advance(5);
  expect(whole.view()).toEqual(sliced.view());
  expect(whole.view().time).toBe(25);
});

test("cloud spawning draws from a random cursor independent of column spawning", () => {
  const run = createRun(oneBoxEach(), () => 0.5, noStore);
  run.advance(1600);
  expect(run.view().boxes).toEqual([{ x: 380, y: 362, texture: "ice_06.png" }]);
});

test("clearing a column scores once when its right edge passes the panda", () => {
  const run = createRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(2700);
  run.jump();
  run.advance(600);
  expect(run.view().score).toBe("0");
  run.advance(40);
  expect(run.view()).toMatchObject({ score: "1", restarts: 0 });
  run.advance(900);
  expect(run.view().score).toBe("1");
});

test("a run starts with the best loaded from the store", () => {
  const run = createRun(oneBoxEach(), oneBoxEach(), { load: () => 5, save: () => undefined });
  expect(run.view().best).toBe("5");
});

test("the best updates the moment the live score beats it, and is saved", () => {
  const saved: number[] = [];
  const store = { load: () => 0, save: (best: number) => saved.push(best) };
  const run = createRun(oneBoxEach(), oneBoxEach(), store);
  run.advance(2700);
  run.jump();
  run.advance(600);
  expect(run.view().best).toBe("0");
  expect(saved).toEqual([]);
  run.advance(40);
  expect(run.view()).toMatchObject({ score: "1", best: "1" });
  expect(saved).toEqual([1]);
});

test("the best is not saved again once the score falls back below it", () => {
  const saved: number[] = [];
  const store = { load: () => 0, save: (best: number) => saved.push(best) };
  const run = createRun(oneBoxEach(), oneBoxEach(), store);
  run.advance(2700);
  run.jump();
  run.advance(640);
  expect(saved).toEqual([1]);
  run.advance(1040);
  expect(run.view()).toMatchObject({ restarts: 0, score: "1", best: "1", gameOver: true });
  run.advance(600);
  run.jump();
  expect(run.view()).toMatchObject({ restarts: 1, score: "0", best: "1", gameOver: false });
  expect(saved).toEqual([1]);
});

test("dying keeps the best score reached so far", () => {
  const run = createRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(2700);
  run.jump();
  run.advance(640);
  expect(run.view().best).toBe("1");
  run.advance(1040);
  expect(run.view()).toMatchObject({ restarts: 0, score: "1", best: "1", gameOver: true });
  run.advance(600);
  run.jump();
  expect(run.view()).toMatchObject({ restarts: 1, score: "0", best: "1" });
});

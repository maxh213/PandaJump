import { expect, test } from "vitest";
import { createRun } from "./index.ts";

const oneBoxEach = () => {
  let draws = 0;
  return () => {
    draws += 1;
    return draws % 2 === 1 ? 0.25 : 0.5;
  };
};

test("a run starts with the panda on the floor, score 0 and no boxes", () => {
  expect(createRun(oneBoxEach()).view()).toEqual({
    time: 0,
    restarts: 0,
    score: "0",
    pandaBottom: 426,
    pandaFrame: 17,
    floorScroll: 0,
    boxes: [],
  });
});

test("time moves the floor and cycles the run frames at 15 per second", () => {
  const run = createRun(oneBoxEach());
  run.advance(333);
  expect(run.view().pandaFrame).toBe(21);
  run.advance(1);
  expect(run.view().pandaFrame).toBe(22);
  run.advance(66);
  expect(run.view()).toMatchObject({ time: 400, pandaFrame: 17, floorScroll: 16 });
  run.advance(600);
  expect(run.view().pandaFrame).toBe(20);
});

test("a jump peaks 168 px up at 580 ms", () => {
  const run = createRun(oneBoxEach());
  run.jump();
  run.advance(580);
  expect(run.view().pandaBottom).toBeCloseTo(426 - 168.2);
});

test("a column spawns every 1500 ms at the right edge", () => {
  const run = createRun(oneBoxEach());
  run.advance(1499);
  expect(run.view().boxes).toEqual([]);
  run.advance(101);
  expect(run.view().boxes).toEqual([{ x: 380, y: 362 }]);
});

test("running into a column restarts the run", () => {
  const run = createRun(oneBoxEach());
  run.advance(2880);
  expect(run.view()).toMatchObject({ restarts: 1, time: 0, boxes: [], score: "0" });
});

test("clearing a column scores once when its right edge passes the panda", () => {
  const run = createRun(oneBoxEach());
  run.advance(2700);
  run.jump();
  run.advance(600);
  expect(run.view().score).toBe("0");
  run.advance(40);
  expect(run.view()).toMatchObject({ score: "1", restarts: 0 });
  run.advance(900);
  expect(run.view().score).toBe("1");
});

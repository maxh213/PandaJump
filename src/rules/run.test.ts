import { expect, test } from "vitest";
import { BIOMES, createRun, mixHex } from "./index.ts";
import type { Run } from "./index.ts";
import { spawnGapForScore, speedForScore } from "./world.ts";

const oneBoxEach = () => {
  let draws = 0;
  return () => {
    draws += 1;
    return draws % 2 === 1 ? 0.25 : 0.5;
  };
};

const standardColumns = () => {
  const values = [0.25, 0.5, 0];
  let index = 0;
  return (): number => {
    const value = values.at(index % values.length) ?? 0;
    index += 1;
    return value;
  };
};

const twoBoxColumns = () => {
  const values = [0.75, 0.5, 0];
  let index = 0;
  return (): number => {
    const value = values.at(index % values.length) ?? 0;
    index += 1;
    return value;
  };
};

const doubleColumnRandom = () => {
  const singleColumn = [0.25, 0.5, 0];
  const doubleColumn = [0.75, 0, 0.6];
  let draws = 0;
  return (): number => {
    draws += 1;
    return draws <= 45 ? (singleColumn[(draws - 1) % 3] ?? 0) : (doubleColumn[(draws - 46) % 3] ?? 0);
  };
};

const naturalShape = { pandaAngle: 0, pandaScaleX: 1, pandaScaleY: 1 };

const noStore = { load: () => 0, save: () => undefined };

const createStartedRun = (...args: Parameters<typeof createRun>): Run => {
  const run = createRun(...args);
  run.jump();
  return run;
};

const untilDead = (run: Run): ReturnType<Run["view"]> => {
  while (!run.view().gameOver) run.advance(10);
  return run.view();
};

const untilFloor = (run: Run): void => {
  let steps = 0;
  while (run.view().pandaBottom < 426) {
    steps += 1;
    if (steps > 1000) throw new Error("the panda never reached the floor");
    run.advance(10);
  }
};

const hitColumnLeft = (view: ReturnType<Run["view"]>): number =>
  Math.min(...view.boxes.filter((box) => box.hit).map((box) => box.x));

const assertKnockbackClears = (run: Run, hitLeft: number, hitOverlap: number): void => {
  let previousX = run.view().pandaX;
  Array.from({ length: 25 }, () => {
    run.advance(10);
    const current = run.view();
    expect(current.pandaX).toBeLessThanOrEqual(previousX);
    expect(Math.max(0, current.pandaX + 22 - hitLeft)).toBeLessThanOrEqual(hitOverlap);
    previousX = current.pandaX;
  });
  expect(run.view().pandaX + 22).toBeLessThanOrEqual(hitLeft - 2);
};

const startingClouds = [
  { x: 0, y: 53, texture: "cloud_02.png" },
  { x: 150, y: 100, texture: "cloud_05.png" },
  { x: 300, y: 53, texture: "cloud_02.png" },
];

const startingScoreView = {
  score: "0",
  gameOverScore: "0",
  scoreScale: 1,
  best: "0",
  topScores: [],
  newBest: false,
  overtookBest: false,
  placing: 0,
  speedUp: false,
  medal: "none",
  medalGoal: "Bronze medal at 10",
};

const startingSceneryView = {
  biome: BIOMES[0],
  sky: "#71c5cf",
  stars: [],
  starsAlpha: 0,
  sceneryFrom: BIOMES[0],
  sceneryTo: BIOMES[0],
  sceneryFade: 1,
  sceneryLayer: {
    base: BIOMES[0],
    overlay: BIOMES[0],
    baseAlpha: 1,
    overlayAlpha: 0,
    overlayVisible: false,
  },
};

test("a run starts ready, with the panda on the floor, score 0 and no boxes", () => {
  expect(createRun(oneBoxEach(), oneBoxEach(), noStore).view()).toEqual({
    ready: true,
    time: 0,
    restarts: 0,
    ...startingScoreView,
    ...startingSceneryView,
    pandaX: 100,
    pandaBottom: 426,
    pandaFrame: 17,
    floorScroll: 0,
    hillsScroll: 0,
    hillColor: "#4a9ba6",
    boxes: [],
    clouds: startingClouds,
    gameOver: false,
    canRestart: false,
    paused: false,
    countdown: null,
    pandaUpsideDown: false,
    bestMarker: null,
    deathFlash: 0,
    deathShake: { x: 0, y: 0 },
    ...naturalShape,
    airPuff: null,
    doubleJumpHint: false,
    pandaShadow: { x: 112.5, y: 426, scale: 1 },
    landingPuff: null,
    impactBurst: null,
  });
});

test("while ready, advancing keeps the clock, score, columns and panda's feet still", () => {
  const run = createRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(1000);
  expect(run.view()).toMatchObject({ ready: true, time: 0, score: "0", boxes: [], gameOver: false, pandaBottom: 426 });
});

test("while ready, the panda cycles its running frames, the floor and hills scroll at 0.2 px/ms and clouds drift", () => {
  const run = createRun(oneBoxEach(), oneBoxEach(), noStore);
  const before = run.view();
  run.advance(100);
  const after = run.view();
  expect(after.pandaFrame).toBe(18);
  expect(after.floorScroll).toBeCloseTo(20);
  expect(after.hillsScroll).toBeCloseTo(5);
  expect(after.clouds[1]?.x).toBeCloseTo((before.clouds[1]?.x ?? 0) - 4);
  expect(after.clouds).not.toEqual(before.clouds);
});

test("while ready, a cloud that drifts off the left respawns from its own random cursor", () => {
  const run = createRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(1300);
  expect(run.view().clouds[0]?.x).toBeGreaterThan(300);
  expect(run.view().boxes).toEqual([]);
});

test("starting after waiting keeps the floor, hills and clouds where they were and spawns column 1 after 1500 ms", () => {
  const run = createRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(1000);
  const before = run.view();
  run.jump();
  const started = run.view();
  expect(started).toMatchObject({ ready: false, time: 0, pandaBottom: 426, floorScroll: before.floorScroll, hillsScroll: before.hillsScroll });
  expect(started.clouds).toEqual(before.clouds);
  run.advance(1500);
  expect(run.view().boxes).toEqual([{ x: 400, y: 362, texture: "dirt_06.png", hit: false }]);
});

test("two runs given the same waits and inputs show identical scenery", () => {
  const play = () => {
    const run = createRun(oneBoxEach(), oneBoxEach(), noStore);
    run.advance(1234);
    run.jump();
    run.advance(1600);
    const { floorScroll, hillsScroll, clouds, boxes } = run.view();
    return { floorScroll, hillsScroll, clouds, boxes };
  };
  expect(play()).toEqual(play());
});

test("the first jump leaves ready without making the panda jump, and starts the run from time 0", () => {
  const run = createRun(oneBoxEach(), oneBoxEach(), noStore);
  run.jump();
  expect(run.view()).toMatchObject({ ready: false, time: 0, pandaBottom: 426 });
  run.advance(1500);
  expect(run.view().boxes).toEqual([{ x: 400, y: 362, texture: "dirt_06.png", hit: false }]);
});

test("restarting from the game-over screen stays instant and does not return to ready", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(2895);
  run.advance(500);
  run.jump();
  expect(run.view()).toMatchObject({ ready: false, restarts: 1, time: 0 });
  run.advance(1500);
  expect(run.view().boxes.every((box) => box.x === 400)).toBe(true);
  expect(run.view().boxes).not.toEqual([]);
});

test("time moves the floor and cycles the run frames at 15 per second", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
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

test("the panda holds frame 17 for the whole time it is in the air, including after a double jump", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  run.jump();
  [100, 250, 400, 580].forEach((time) => {
    run.advance(time - run.view().time);
    expect(run.view().pandaBottom).toBeLessThan(426);
    expect(run.view().pandaFrame).toBe(17);
  });
  run.jump();
  [700, 850, 1000].forEach((time) => {
    run.advance(time - run.view().time);
    expect(run.view().pandaBottom).toBeLessThan(426);
    expect(run.view().pandaFrame).toBe(17);
  });
});

test("the running cycle resumes from the time-based formula the moment the panda lands", () => {
  const run = createRun(oneBoxEach(), oneBoxEach(), noStore);
  run.jump();
  run.advance(1300);
  expect(run.view()).toMatchObject({ pandaBottom: 426, pandaFrame: 18 });
  run.advance(67);
  expect(run.view().pandaFrame).toBe(19);
});

test("pausing mid-jump shows the time-based frame, not the air pose", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  run.jump();
  run.advance(300);
  expect(run.view().pandaFrame).toBe(17);
  run.pause();
  expect(run.view()).toMatchObject({ time: 300, pandaFrame: 21 });
});

test("a panda that dies in the air shows the time-based frame, not the air pose", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(2000);
  run.jump();
  run.advance(1050);
  expect(run.view()).toMatchObject({ gameOver: true, time: 3050, pandaFrame: 20 });
  expect(run.view().pandaBottom).toBeLessThan(426);
});

test("the resume countdown after a mid-jump pause shows the time-based frame, not the air pose", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  run.jump();
  run.advance(300);
  run.pause();
  run.jump();
  run.advance(100);
  expect(run.view()).toMatchObject({ countdown: 3, time: 300, pandaFrame: 21 });
  expect(run.view().pandaBottom).toBeLessThan(426);
});

test("a jump peaks 168 px up at 580 ms", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  run.jump();
  run.advance(580);
  expect(run.view().pandaBottom).toBeCloseTo(426 - 168.2);
});

test("a column spawns every 1500 ms at the right edge", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(1499);
  expect(run.view().boxes).toEqual([]);
  run.advance(1);
  expect(run.view().boxes).toEqual([{ x: 400, y: 362, texture: "dirt_06.png", hit: false }]);
  run.advance(100);
  expect(run.view().boxes).toEqual([{ x: 380, y: 362, texture: "dirt_06.png", hit: false }]);
});

test("touching a column freezes the world while the panda still bounces", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(2895);
  run.advance(200);
  const frozen = run.view();
  expect(frozen).toMatchObject({ restarts: 0, score: "0", gameOver: true, canRestart: false, deathFlash: 0, deathShake: { x: 0, y: 0 } });
  expect(frozen.boxes).not.toEqual([]);
  run.advance(10);
  const later = run.view();
  expect(later).toMatchObject({
    time: frozen.time,
    score: frozen.score,
    boxes: frozen.boxes,
    clouds: frozen.clouds,
    floorScroll: frozen.floorScroll,
    canRestart: false,
  });
  expect(later.pandaX !== frozen.pandaX || later.pandaBottom !== frozen.pandaBottom).toBe(true);
});

test("deathFlash is 0 through a live run, jumps to 0.6 the instant the panda dies and fades to 0 by 200ms", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(2885);
  expect(run.view().deathFlash).toBe(0);
  run.advance(6);
  const death = run.view();
  expect(death.gameOver).toBe(true);
  expect(death.deathFlash).toBeCloseTo(0.6, 1);
  run.advance(100);
  expect(run.view().deathFlash).toBeCloseTo(0.3, 1);
  run.advance(100);
  expect(run.view().deathFlash).toBe(0);
  run.advance(800);
  expect(run.view().deathFlash).toBe(0);
});

test("deathShake is still through a live run, shakes within 6px for 200ms after the hit and is exactly 0 from 200ms on", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(2885);
  expect(run.view().deathShake).toEqual({ x: 0, y: 0 });
  run.advance(6);
  expect(run.view().gameOver).toBe(true);
  const offsets = Array.from({ length: 20 }, () => {
    run.advance(10);
    return run.view().deathShake;
  });
  expect(offsets.some((offset) => offset.x !== 0 && offset.y !== 0)).toBe(true);
  expect(offsets.every((offset) => Math.abs(offset.x) <= 6 && Math.abs(offset.y) <= 6)).toBe(true);
  run.advance(200);
  expect(run.view().deathShake).toEqual({ x: 0, y: 0 });
  run.advance(800);
  expect(run.view().deathShake).toEqual({ x: 0, y: 0 });
});

test("deathShake follows the same offsets for the same steps and is 0 again after a restart", () => {
  const first = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  const second = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  first.advance(2895);
  second.advance(2895);
  expect(first.view().deathShake).toEqual(second.view().deathShake);
  expect(first.view().deathShake).not.toEqual({ x: 0, y: 0 });
  first.advance(500);
  first.jump();
  expect(first.view().deathShake).toEqual({ x: 0, y: 0 });
});

test("no click, tap or Space input restarts the run during the first 500ms after death, and canRestart stays false", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(2895);
  run.advance(499);
  const beforeJump = run.view();
  expect(beforeJump).toMatchObject({ gameOver: true, canRestart: false });
  run.jump();
  expect(run.view()).toEqual(beforeJump);
});

test("canRestart becomes true once 500ms have passed since death, before any input arrives", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(2895);
  run.advance(500);
  expect(run.view()).toMatchObject({ restarts: 0, gameOver: true, canRestart: true });
});

test("a click, tap or Space input after 500ms starts a fresh run at score 0 and clears the game over screen", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(2895);
  run.advance(500);
  run.jump();
  expect(run.view()).toMatchObject({
    restarts: 1,
    time: 0,
    boxes: [],
    score: "0",
    gameOver: false,
    canRestart: false,
    deathFlash: 0,
  });
});

test("the restarts counter increments by exactly 1 on every restart", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(2895);
  run.advance(500);
  run.jump();
  expect(run.view().restarts).toBe(1);
  run.advance(2895);
  run.advance(500);
  run.jump();
  expect(run.view().restarts).toBe(2);
});

test("a fresh run still has no boxes and score 0 after one step", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(10);
  expect(run.view()).toMatchObject({ time: 10, boxes: [], score: "0" });
});

test("the result does not depend on how time is sliced", () => {
  const whole = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  const sliced = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
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
  const run = createStartedRun(oneBoxEach(), () => 0.5, noStore);
  run.advance(1600);
  expect(run.view().boxes).toEqual([{ x: 380, y: 362, texture: "dirt_06.png", hit: false }]);
});

test("clearing a column scores once when its right edge passes the panda", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(2700);
  run.jump();
  run.advance(600);
  expect(run.view().score).toBe("0");
  run.advance(40);
  expect(run.view()).toMatchObject({ score: "1", restarts: 0 });
  run.advance(900);
  expect(run.view().score).toBe("1");
});

test("scoreScale starts at 1, pops to 1.3 the instant the score increases, then falls linearly back to 1 over 150ms", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  expect(run.view().scoreScale).toBe(1);
  run.advance(2700);
  run.jump();
  run.advance(600);
  expect(run.view()).toMatchObject({ score: "0", scoreScale: 1 });
  while (run.view().score === "0") {
    run.advance(10);
  }
  expect(run.view().scoreScale).toBe(1.3);
  const poppedAt = run.view().time;
  let elapsed = poppedAt;
  const advanceTo = (time: number) => {
    run.advance(time - elapsed);
    elapsed = time;
  };
  advanceTo(poppedAt + 75);
  expect(run.view().scoreScale).toBeCloseTo(1.15, 2);
  advanceTo(poppedAt + 149);
  expect(run.view().scoreScale).toBeGreaterThan(1);
  advanceTo(poppedAt + 150);
  expect(run.view().scoreScale).toBe(1);
  advanceTo(poppedAt + 1000);
  expect(run.view().scoreScale).toBe(1);
});

test("scoring a further column pops the scale back to 1.3, even once the previous pop has already settled", () => {
  const run = createStartedRun(repeatingOneBox(), oneBoxEach(), noStore);
  let elapsed = 0;
  const advanceTo = (time: number) => {
    run.advance(time - elapsed);
    elapsed = time;
  };
  advanceTo(1500 + 1200);
  run.jump();
  advanceTo(1500 + 1820);
  expect(run.view()).toMatchObject({ score: "1", scoreScale: 1.3 });
  advanceTo(1500 + 1820 + 150);
  expect(run.view().scoreScale).toBe(1);
  advanceTo(3000 + 1200);
  run.jump();
  advanceTo(3000 + 1820);
  expect(run.view()).toMatchObject({ score: "2", scoreScale: 1.3 });
});

test("restarting after death resets the score pop to scale 1", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(2700);
  run.jump();
  run.advance(640);
  expect(run.view()).toMatchObject({ score: "1" });
  expect(run.view().scoreScale).toBeGreaterThan(1);
  run.advance(1060);
  expect(run.view()).toMatchObject({ restarts: 0, score: "1", gameOver: true });
  run.advance(600);
  run.jump();
  expect(run.view()).toMatchObject({ restarts: 1, score: "0", scoreScale: 1 });
});

test("a run starts with the best loaded from the store, even while ready", () => {
  const run = createRun(oneBoxEach(), oneBoxEach(), { load: () => 5, save: () => undefined });
  expect(run.view().best).toBe("5");
});

test("the best updates the moment the live score beats it, and is saved", () => {
  const saved: number[] = [];
  const store = { load: () => 0, save: (best: number) => saved.push(best) };
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), store);
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
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), store);
  run.advance(2700);
  run.jump();
  run.advance(640);
  expect(saved).toEqual([1]);
  run.advance(1060);
  expect(run.view()).toMatchObject({ restarts: 0, score: "1", best: "1", gameOver: true });
  run.advance(600);
  run.jump();
  expect(run.view()).toMatchObject({ restarts: 1, score: "0", best: "1", gameOver: false });
  expect(saved).toEqual([1]);
});

const repeatingOneBox = () => {
  const values = [0.25, 0.5, 0];
  let index = 0;
  return () => {
    const value = values[index % values.length] ?? 0;
    index += 1;
    return value;
  };
};

test("the floor and columns speed up once the score passes 20", () => {
  const run = createStartedRun(repeatingOneBox(), oneBoxEach(), noStore);
  let elapsed = 0;
  const advanceTo = (time: number) => {
    run.advance(time - elapsed);
    elapsed = time;
  };
  for (let column = 1; column <= 20; column += 1) {
    advanceTo(1500 * column + 1200);
    run.jump();
  }
  advanceTo(1500 * 20 + 1840);
  expect(run.view().score).toBe("20");
  const before = run.view().floorScroll;
  run.advance(100);
  const after = run.view().floorScroll;
  expect(((after - before) + 64) % 64).toBeCloseTo(22);
});

const COLUMN_CLEAR_DISTANCE = 364;

const clearTimeFor = (spawn: number, clears: readonly number[]): number => {
  let time = spawn;
  let cleared = clears.filter((clear) => clear <= spawn).length;
  let remaining = COLUMN_CLEAR_DISTANCE;
  for (;;) {
    const speed = speedForScore(cleared);
    const change = clears[cleared] ?? Infinity;
    if (speed * (change - time) >= remaining) return time + remaining / speed;
    remaining -= speed * (change - time);
    time = change;
    cleared += 1;
  }
};

const spawnTimesFor = (count: number): number[] => {
  const spawns: number[] = [];
  const clears: number[] = [];
  let spawn = spawnGapForScore(0);
  for (let column = 1; column <= count; column += 1) {
    spawns.push(spawn);
    clears.push(clearTimeFor(spawn, clears));
    spawn += spawnGapForScore(clears.filter((clear) => clear <= spawn).length);
  }
  return spawns;
};

const spawnTimes = spawnTimesFor(80);

const rampedJumpAt = (column: number): number => (spawnTimes[column - 1] ?? 0) + 788;

const advanceToColumn = (run: Run, from: number, to: number): void => {
  for (let column = from; column <= to; column += 1) {
    run.advance(rampedJumpAt(column) - run.view().time);
    run.jump();
  }
  while (run.view().score !== String(to) && !run.view().gameOver) {
    run.advance(1);
  }
  expect(run.view().gameOver).toBe(false);
};

const advanceAlive = (run: Run, ms: number): void => {
  const target = run.view().time + ms;
  let nextColumn = Number(run.view().score) + 1;
  while (run.view().time < target && !run.view().gameOver) {
    nextColumn = stepAlive(run, target, nextColumn);
  }
  expect(run.view().gameOver).toBe(false);
  expect(run.view().time).toBe(target);
};

const stepAlive = (run: Run, target: number, nextColumn: number): number => {
  const jumpAt = rampedJumpAt(nextColumn);
  if (run.view().time < jumpAt && jumpAt <= target) {
    run.advance(jumpAt - run.view().time);
    run.jump();
    return nextColumn + 1;
  }
  run.advance(Math.min(10, target - run.view().time));
  return nextColumn;
};

test("speedUp is visible for exactly 800ms of game time from the instant the score first reaches the ramp threshold of 20", () => {
  const run = createStartedRun(repeatingOneBox(), oneBoxEach(), noStore);
  advanceToColumn(run, 1, 19);
  expect(run.view()).toMatchObject({ score: "19", speedUp: false });
  advanceToColumn(run, 20, 20);
  expect(run.view()).toMatchObject({ score: "20", speedUp: true });
  run.advance(799);
  expect(run.view()).toMatchObject({ score: "20", speedUp: true });
  run.advance(1);
  expect(run.view()).toMatchObject({ score: "20", speedUp: false });
});

test("speedUp appears again the moment the score reaches the next ramp threshold of 30", () => {
  const run = createStartedRun(repeatingOneBox(), oneBoxEach(), noStore);
  advanceToColumn(run, 1, 20);
  expect(run.view()).toMatchObject({ score: "20", speedUp: true });
  advanceToColumn(run, 21, 29);
  expect(run.view()).toMatchObject({ score: "29", speedUp: false });
  advanceToColumn(run, 30, 30);
  expect(run.view()).toMatchObject({ score: "30", speedUp: true });
});

test("speedUp does not reappear at score 70 since the speed already reached its cap at 60", () => {
  const run = createStartedRun(repeatingOneBox(), oneBoxEach(), noStore);
  advanceToColumn(run, 1, 60);
  expect(run.view()).toMatchObject({ score: "60", speedUp: true });
  advanceToColumn(run, 61, 70);
  expect(run.view()).toMatchObject({ score: "70", speedUp: false });
});

test("speedUp is never visible on the game-over screen, even moments after the ramp changed", () => {
  const run = createStartedRun(repeatingOneBox(), oneBoxEach(), noStore);
  advanceToColumn(run, 1, 20);
  expect(run.view()).toMatchObject({ score: "20", speedUp: true });
  run.advance(5000);
  expect(run.view()).toMatchObject({ gameOver: true, speedUp: false });
});

test("speedUp is hidden while the run is paused, even moments after the ramp changed", () => {
  const run = createStartedRun(repeatingOneBox(), oneBoxEach(), noStore);
  advanceToColumn(run, 1, 20);
  expect(run.view()).toMatchObject({ score: "20", speedUp: true });
  run.pause();
  expect(run.view()).toMatchObject({ paused: true, speedUp: false });
});

test("a restart hides speedUp until the next run's score reaches a ramp threshold again", () => {
  const run = createStartedRun(repeatingOneBox(), oneBoxEach(), noStore);
  advanceToColumn(run, 1, 20);
  run.advance(5000);
  expect(run.view().gameOver).toBe(true);
  run.advance(500);
  run.jump();
  expect(run.view()).toMatchObject({ restarts: 1, score: "0", speedUp: false });
});

test("dying keeps the best score reached so far", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(2700);
  run.jump();
  run.advance(640);
  expect(run.view().best).toBe("1");
  run.advance(1060);
  expect(run.view()).toMatchObject({ restarts: 0, score: "1", best: "1", gameOver: true });
  run.advance(600);
  run.jump();
  expect(run.view()).toMatchObject({ restarts: 1, score: "0", best: "1" });
});

test("a first-time player's first cleared column triggers the new-best callout, for a fixed duration", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(2700);
  run.jump();
  run.advance(600);
  expect(run.view().newBest).toBe(false);
  run.advance(40);
  expect(run.view()).toMatchObject({ score: "1", best: "1", newBest: true });
  run.advance(579);
  expect(run.view().newBest).toBe(true);
  run.advance(1);
  expect(run.view().newBest).toBe(false);
});

test("clearing further columns after already holding the best does not retrigger the callout", () => {
  const run = createStartedRun(standardColumns(), oneBoxEach(), noStore);
  run.advance(2700);
  run.jump();
  run.advance(640);
  expect(run.view()).toMatchObject({ score: "1", best: "1", newBest: true });
  run.advance(580);
  expect(run.view().newBest).toBe(false);
  run.advance(280);
  run.jump();
  run.advance(640);
  expect(run.view()).toMatchObject({ score: "2", best: "2", newBest: false });
});

test("pause freezes a live run", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(1000);
  run.pause();
  expect(run.view()).toMatchObject({ paused: true, gameOver: false });
});

test("advance does not move time, the panda, the columns, the clouds or the floor while paused", () => {
  const run = createStartedRun(standardColumns(), oneBoxEach(), noStore);
  run.advance(1000);
  run.pause();
  const frozen = run.view();
  run.advance(2000);
  expect(run.view()).toEqual(frozen);
});

test("the resume control starts a 1500 ms countdown instead of resuming at once", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(1000);
  run.pause();
  run.jump();
  expect(run.view()).toMatchObject({ paused: false, countdown: 3, pandaBottom: 426 });
});

test("the countdown shows 2 after 500 ms, 1 after 1000 ms and ends after 1500 ms", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(1000);
  run.pause();
  run.jump();
  run.advance(500);
  expect(run.view().countdown).toBe(2);
  run.advance(500);
  expect(run.view().countdown).toBe(1);
  run.advance(500);
  expect(run.view()).toMatchObject({ countdown: null, paused: false });
});

test("the world does not move during the countdown and advances normally once it ends", () => {
  const run = createStartedRun(standardColumns(), oneBoxEach(), noStore);
  run.advance(1000);
  run.pause();
  run.jump();
  const frozen = run.view();
  run.advance(1499);
  expect(run.view()).toMatchObject({
    time: frozen.time,
    pandaBottom: frozen.pandaBottom,
    boxes: frozen.boxes,
    clouds: frozen.clouds,
  });
  run.advance(1);
  expect(run.view()).toMatchObject({ countdown: null, time: 1000 });
  run.advance(500);
  expect(run.view().time).toBe(1500);
});

test("a single advance() call that crosses the countdown boundary carries the leftover ms into world movement", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(1000);
  run.pause();
  run.jump();
  run.advance(1700);
  expect(run.view()).toMatchObject({ countdown: null, paused: false, time: 1200 });
});

test("a jump pressed during the countdown neither jumps nor restarts the countdown", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(1000);
  run.pause();
  run.jump();
  run.advance(500);
  expect(run.view().countdown).toBe(2);
  run.jump();
  expect(run.view()).toMatchObject({ countdown: 2, paused: false, pandaBottom: 426 });
  run.advance(500);
  expect(run.view().countdown).toBe(1);
});

test("pausing again during the countdown cancels it and shows Paused instead", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(1000);
  run.pause();
  run.jump();
  run.advance(500);
  expect(run.view().countdown).toBe(2);
  run.pause();
  expect(run.view()).toMatchObject({ paused: true, countdown: null });
});

test("a jump pressed after the countdown ends jumps as normal", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(1000);
  run.pause();
  run.jump();
  run.advance(1500);
  run.jump();
  run.advance(580);
  expect(run.view().pandaBottom).toBeCloseTo(426 - 168.2);
});

test("pause is ignored while the run is still ready, so the ready screen never shows both prompts", () => {
  const run = createRun(oneBoxEach(), oneBoxEach(), noStore);
  expect(run.view().ready).toBe(true);
  run.pause();
  expect(run.view()).toMatchObject({ ready: true, paused: false });
});

test("pause is ignored while the game-over screen is shown", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(2895);
  expect(run.view()).toMatchObject({ gameOver: true, canRestart: false, paused: false });
  run.pause();
  expect(run.view().paused).toBe(false);
  run.advance(500);
  expect(run.view()).toMatchObject({ gameOver: true, canRestart: true });
});

test("pauseOrResume pauses a live run", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(1000);
  run.pauseOrResume();
  expect(run.view()).toMatchObject({ paused: true, gameOver: false });
});

test("pauseOrResume resumes a paused run without making the panda jump", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(1000);
  run.pauseOrResume();
  run.pauseOrResume();
  expect(run.view()).toMatchObject({ paused: false, pandaBottom: 426 });
});

test("pauseOrResume during the countdown cancels it and shows Paused again", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(1000);
  run.pauseOrResume();
  run.pauseOrResume();
  run.advance(600);
  expect(run.view().countdown).toBe(2);
  run.pauseOrResume();
  expect(run.view()).toMatchObject({ paused: true, countdown: null });
  run.advance(2000);
  expect(run.view()).toMatchObject({ paused: true, countdown: null, time: 1000, pandaBottom: 426 });
  run.pauseOrResume();
  expect(run.view()).toMatchObject({ paused: false, countdown: 3 });
});

test("pauseOrResume is ignored while the game-over screen is shown", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(2895);
  expect(run.view()).toMatchObject({ gameOver: true, paused: false });
  run.pauseOrResume();
  expect(run.view().paused).toBe(false);
  run.advance(500);
  expect(run.view()).toMatchObject({ gameOver: true, canRestart: true });
});

test("overtookBest is false until the run overtakes the stored best, then stays true through death, and resets on restart", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  expect(run.view().overtookBest).toBe(false);
  run.advance(2700);
  run.jump();
  run.advance(640);
  expect(run.view()).toMatchObject({ score: "1", best: "1", overtookBest: true });
  run.advance(1060);
  expect(run.view()).toMatchObject({ restarts: 0, score: "1", best: "1", gameOver: true, overtookBest: true });
  run.advance(600);
  run.jump();
  expect(run.view()).toMatchObject({ restarts: 1, score: "0", best: "1", overtookBest: false });
});

test("tying the stored best does not count as overtaking it", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), { load: () => 1, save: () => undefined });
  run.advance(2700);
  run.jump();
  run.advance(640);
  expect(run.view()).toMatchObject({ score: "1", best: "1", overtookBest: false });
});

test("dying and restarting resets the callout so beating the new, higher best triggers it again", () => {
  const run = createStartedRun(standardColumns(), oneBoxEach(), noStore);
  run.advance(2700);
  run.jump();
  run.advance(640);
  expect(run.view()).toMatchObject({ score: "1", best: "1", newBest: true });
  run.advance(1060);
  expect(run.view()).toMatchObject({ restarts: 0, gameOver: true, newBest: false });
  run.advance(600);
  run.jump();
  expect(run.view()).toMatchObject({ restarts: 1, score: "0", best: "1", newBest: false });
  run.advance(2700);
  run.jump();
  run.advance(660);
  expect(run.view()).toMatchObject({ score: "1", best: "1", newBest: false });
  run.advance(840);
  run.jump();
  run.advance(660);
  expect(run.view()).toMatchObject({ score: "2", best: "2", newBest: true });
});

test("a panda that dies while rising gets an upward bounce then falls to the floor", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(2885);
  run.jump();
  run.advance(10);
  const diedAt = run.view();
  expect(diedAt.gameOver).toBe(true);
  expect(diedAt.pandaBottom).toBeLessThan(426);
  run.advance(10);
  expect(run.view().pandaBottom).toBeLessThan(diedAt.pandaBottom);
  untilFloor(run);
  expect(run.view().pandaBottom).toBe(426);
});

test("a panda that dies above the floor bounces left clear of the column and settles on the floor", () => {
  const run = createStartedRun(twoBoxColumns(), oneBoxEach(), noStore);
  run.advance(2300);
  run.jump();
  const diedAt = untilDead(run);
  expect(diedAt.pandaBottom).toBeLessThan(426);
  expect(diedAt.pandaX).toBe(100);
  const hitLeft = hitColumnLeft(diedAt);
  assertKnockbackClears(run, hitLeft, Math.max(0, diedAt.pandaX + 22 - hitLeft));
  untilFloor(run);
  expect(run.view()).toMatchObject({ pandaBottom: 426 });
  expect(run.view().pandaX + 22).toBeLessThanOrEqual(hitLeft - 2);
});

test("a panda that dies already on the floor pops up then settles back at pandaBottom 426", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  const diedAt = untilDead(run);
  expect(diedAt.pandaBottom).toBe(426);
  expect(diedAt.pandaX).toBe(100);
  run.advance(50);
  expect(run.view().pandaBottom).toBeLessThan(426);
  run.advance(500);
  expect(run.view().pandaBottom).toBe(426);
  expect(run.view().pandaX + 22).toBeLessThanOrEqual(hitColumnLeft(run.view()) - 2);
});

test("a corner hit on a two-box column knocks the panda left clear and lands it on the floor", () => {
  const run = createStartedRun(twoBoxColumns(), oneBoxEach(), noStore);
  run.advance(2300);
  run.jump();
  const diedAt = untilDead(run);
  expect(diedAt.pandaBottom).toBeLessThan(426);
  expect(diedAt.pandaBottom).toBeGreaterThan(298);
  expect(diedAt.impactBurst?.y).toBe(298);
  expect(diedAt.impactBurst?.progress).toBe(0);
  const hitLeft = hitColumnLeft(diedAt);
  expect(diedAt.impactBurst?.x).toBe(hitLeft);
  run.advance(250);
  expect(run.view().pandaX + 22).toBeLessThanOrEqual(hitLeft - 2);
  untilFloor(run);
  expect(run.view().pandaBottom).toBe(426);
});

test("impactBurst appears on the hit step and is gone after 250ms", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  expect(untilDead(run).impactBurst).toMatchObject({ progress: 0 });
  run.advance(125);
  expect(run.view().impactBurst?.progress).toBeCloseTo(0.5);
  run.advance(125);
  expect(run.view().impactBurst).toBeNull();
});

test("death impact squash starts at 0.8 by 1.15 and eases to 1 over 120ms", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  untilDead(run);
  expect(run.view().pandaScaleX).toBe(0.8);
  expect(run.view().pandaScaleY).toBe(1.15);
  run.advance(60);
  expect(run.view().pandaScaleX).toBeCloseTo(0.9);
  expect(run.view().pandaScaleY).toBeCloseTo(1.075);
  run.advance(60);
  expect(run.view().pandaScaleX).toBe(1);
  expect(run.view().pandaScaleY).toBe(1);
});

test("dying against the front of a double column marks only its boxes as hit", () => {
  const run = createStartedRun(doubleColumnRandom(), oneBoxEach(), noStore);
  advanceToColumn(run, 1, 15);
  expect(run.view().score).toBe("15");
  let steps = 0;
  while (!run.view().gameOver) {
    steps += 1;
    if (steps > 1000) throw new Error("the run never ended");
    run.advance(10);
  }
  const boxes = run.view().boxes;
  expect(boxes).toHaveLength(4);
  const [frontX, secondX] = [...new Set(boxes.map((box) => box.x))].sort((a, b) => a - b);
  expect(boxes.filter((box) => box.x === frontX).every((box) => box.hit)).toBe(true);
  expect(boxes.filter((box) => box.x === secondX).some((box) => box.hit)).toBe(false);
});

test("pandaUpsideDown is true exactly while gameOver is true, and resets on restart", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  expect(run.view().pandaUpsideDown).toBe(false);
  run.advance(2895);
  expect(run.view()).toMatchObject({ gameOver: true, pandaUpsideDown: true });
  run.advance(500);
  run.jump();
  expect(run.view()).toMatchObject({ gameOver: false, pandaUpsideDown: false });
});

test("bestMarker shows over the column that would beat the stored best while live, and hides on pause or game over", () => {
  const store = { load: () => 1, save: () => undefined };
  const run = createStartedRun(standardColumns(), oneBoxEach(), store);
  run.advance(2700);
  run.jump();
  run.advance(640);
  expect(run.view()).toMatchObject({ score: "1", bestMarker: { x: 364, y: 354 } });
  run.pause();
  expect(run.view().bestMarker).toBeNull();
  run.jump();
  run.advance(1500);
  expect(run.view().bestMarker).not.toBeNull();
  run.advance(1060);
  expect(run.view()).toMatchObject({ gameOver: true, bestMarker: null });
});

test("pandaAngle is 0 while the panda stands on the floor", () => {
  const run = createRun(oneBoxEach(), oneBoxEach(), noStore);
  expect(run.view().pandaAngle).toBe(0);
});

test("pandaAngle is -25, clamped nose up, immediately after a floor jump", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  run.jump();
  expect(run.view().pandaAngle).toBe(-25);
});

test("pandaAngle returns to 0 at the top of a jump, where speed is 0", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  run.jump();
  run.advance(580);
  expect(run.view().pandaAngle).toBeCloseTo(0);
});

test("pandaAngle is positive but at most 25 while the panda is falling", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  run.jump();
  run.advance(600);
  const angle = run.view().pandaAngle;
  expect(angle).toBeGreaterThan(0);
  expect(angle).toBeLessThanOrEqual(25);
});

test("pandaAngle clamps at 25, nose down, during a long fall", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  run.jump();
  run.advance(1100);
  expect(run.view().pandaBottom).toBeLessThan(426);
  expect(run.view().pandaAngle).toBe(25);
});

test("pandaAngle is 0 during game over even though the panda is still falling", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(2895);
  expect(run.view()).toMatchObject({ gameOver: true, pandaAngle: 0 });
});

test("no airPuff appears after a single floor jump", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  run.jump();
  expect(run.view().airPuff).toBeNull();
});

test("an air jump shows a puff at the panda's centre and its bottom at that moment, fading from alpha 1 to null over 250ms", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  run.jump();
  run.advance(580);
  const bottomAtAirJump = run.view().pandaBottom;
  run.jump();
  expect(run.view().airPuff).toEqual({ x: 112.5, y: bottomAtAirJump, alpha: 1 });
  run.advance(125);
  expect(run.view().airPuff?.alpha).toBeCloseTo(0.5);
  run.advance(125);
  expect(run.view().airPuff).toBeNull();
});

test("a third jump in the air, with the air jump already used, does not create or extend a puff", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  run.jump();
  run.advance(580);
  run.jump();
  run.advance(100);
  const beforeThirdTap = run.view().airPuff;
  run.jump();
  expect(run.view().airPuff).toEqual(beforeThirdTap);
});

test("airPuff clears immediately on death instead of freezing mid-fade", () => {
  const run = createStartedRun(twoBoxColumns(), oneBoxEach(), noStore);
  run.advance(2600);
  run.jump();
  run.advance(200);
  const bottomAtAirJump = run.view().pandaBottom;
  run.jump();
  expect(run.view().airPuff).toEqual({ x: 112.5, y: bottomAtAirJump, alpha: 1 });
  run.advance(100);
  expect(run.view().gameOver).toBe(true);
  expect(run.view().airPuff).toBeNull();
});

test("time, score, columns, clouds and floor scroll stay frozen while the panda falls after a mid-air death", () => {
  const run = createStartedRun(twoBoxColumns(), oneBoxEach(), noStore);
  run.advance(2300);
  run.jump();
  run.advance(900);
  const diedAt = run.view();
  expect(diedAt.gameOver).toBe(true);
  run.advance(200);
  const later = run.view();
  expect(later.pandaBottom).not.toBe(diedAt.pandaBottom);
  expect(later).toMatchObject({
    time: diedAt.time,
    score: diedAt.score,
    boxes: diedAt.boxes,
    clouds: diedAt.clouds,
    floorScroll: diedAt.floorScroll,
  });
});

const freshRun = (best = 0): Run => createStartedRun(standardColumns(), standardColumns(), { load: () => best, save: () => undefined });

const playToScore = (run: Run, columns: number, from = 1): void => {
  Array.from({ length: columns - from + 1 }, (_, index) => 1500 * (from + index) + 1200).forEach((jumpAt) => {
    run.advance(jumpAt - run.view().time);
    run.jump();
  });
  run.advance(1500 * columns + 1840 - run.view().time);
};

const dieAndRestart = (run: Run): void => {
  while (!run.view().gameOver) run.advance(16);
  run.advance(500);
  run.jump();
};

test("doubleJumpHint is true on a live run with no stored best, and a floor jump does not hide it", () => {
  const run = freshRun();
  expect(run.view().doubleJumpHint).toBe(true);
  run.jump();
  run.advance(100);
  expect(run.view().doubleJumpHint).toBe(true);
});

test("doubleJumpHint hides the moment the first air jump is made and stays hidden through a restart", () => {
  const run = freshRun();
  run.jump();
  run.advance(100);
  run.jump();
  expect(run.view().doubleJumpHint).toBe(false);
  dieAndRestart(run);
  expect(run.view()).toMatchObject({ restarts: 1, score: "0", doubleJumpHint: false });
});

test("a jump in mid-air with the air jump already spent leaves the flag as it was", () => {
  const run = freshRun();
  run.jump();
  run.advance(100);
  run.jump();
  run.jump();
  expect(run.view().doubleJumpHint).toBe(false);
});

test("doubleJumpHint hides at score 3 and shows again at score 0 of the next run", () => {
  const run = freshRun();
  playToScore(run, 2);
  expect(run.view()).toMatchObject({ score: "2", doubleJumpHint: true });
  playToScore(run, 3, 3);
  expect(run.view()).toMatchObject({ score: "3", doubleJumpHint: false });
  dieAndRestart(run);
  expect(run.view()).toMatchObject({ restarts: 1, score: "0", doubleJumpHint: true });
});

test("doubleJumpHint is hidden on the game-over screen, the Paused screen and the resume countdown", () => {
  const run = freshRun();
  run.pause();
  expect(run.view()).toMatchObject({ paused: true, doubleJumpHint: false });
  run.jump();
  expect(run.view()).toMatchObject({ countdown: 3, doubleJumpHint: false });
  run.advance(1500);
  expect(run.view().doubleJumpHint).toBe(true);
  while (!run.view().gameOver) run.advance(16);
  expect(run.view().doubleJumpHint).toBe(false);
});

test("doubleJumpHint never shows when a best of 1 or more was stored at page load, even at score 0", () => {
  const run = freshRun(1);
  expect(run.view().doubleJumpHint).toBe(false);
  run.advance(100);
  expect(run.view().doubleJumpHint).toBe(false);
});

test("doubleJumpHint stays visible on a restart after the score set a best this session, until an air jump", () => {
  const run = freshRun();
  playToScore(run, 1);
  dieAndRestart(run);
  expect(run.view()).toMatchObject({ best: "1", score: "0", doubleJumpHint: true });
});

test("a new page session with no stored best shows the hint again", () => {
  const first = freshRun();
  first.jump();
  first.advance(100);
  first.jump();
  expect(first.view().doubleJumpHint).toBe(false);
  expect(freshRun().view().doubleJumpHint).toBe(true);
});

const bufferedRun = (pressAt: number): Run => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  run.jump();
  run.advance(580);
  run.jump();
  run.advance(pressAt - 580);
  run.jump();
  return run;
};

test("a jump pressed 70ms before landing fires the moment the panda lands, with a full floor jump and a fresh air jump", () => {
  const run = bufferedRun(1400);
  run.advance(60);
  expect(run.view().pandaBottom).toBeLessThan(426);
  run.advance(10);
  expect(run.view().pandaBottom).toBe(426);
  run.advance(10);
  expect(426 - run.view().pandaBottom).toBeCloseTo(5.75);
  run.advance(560);
  expect(run.view().pandaBottom).toBeLessThan(426 - 160);
  run.jump();
  expect(run.view().airPuff).not.toBeNull();
});

test("a jump pressed 100ms before landing is still buffered", () => {
  const run = bufferedRun(1370);
  run.advance(120);
  expect(run.view().pandaBottom).toBeLessThan(426);
});

test("a jump pressed more than 100ms before landing is dropped", () => {
  const run = bufferedRun(1360);
  run.advance(300);
  expect(run.view().pandaBottom).toBe(426);
});

test("a buffered jump fires once and is cleared", () => {
  const run = bufferedRun(1400);
  run.advance(1800);
  untilFloor(run);
  expect(run.view().pandaBottom).toBe(426);
});

test("a buffered jump does not show the double jump puff", () => {
  const run = bufferedRun(1400);
  run.advance(200);
  expect(run.view().airPuff).toBeNull();
});

test("a press with the air jump still available is an immediate air jump and buffers nothing", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  run.jump();
  run.advance(100);
  run.jump();
  run.advance(1500);
  expect(run.view().pandaBottom).toBe(426);
});

test("a buffered jump is discarded when the run is paused before landing", () => {
  const run = bufferedRun(1400);
  run.pause();
  run.jump();
  run.advance(1500);
  run.advance(300);
  expect(run.view().pandaBottom).toBe(426);
});

test("a buffered jump is discarded when the panda dies before landing", () => {
  const run = createStartedRun(twoBoxColumns(), oneBoxEach(), noStore);
  run.advance(2600);
  run.jump();
  run.advance(200);
  run.jump();
  run.jump();
  run.advance(100);
  expect(run.view().gameOver).toBe(true);
  run.advance(2000);
  run.jump();
  run.advance(500);
  expect(run.view()).toMatchObject({ gameOver: false, pandaBottom: 426, restarts: 1 });
});

test("the panda shadow shrinks from 1 towards 0.5 as the panda rises and stays at 0.5 from 168 px up", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  expect(run.view().pandaShadow).toEqual({ x: 112.5, y: 426, scale: 1 });
  run.jump();
  run.advance(290);
  const partway = run.view().pandaShadow;
  expect(partway.scale).toBeGreaterThan(0.5);
  expect(partway.scale).toBeLessThan(1);
  expect(partway).toMatchObject({ x: 112.5, y: 426 });
  run.advance(290);
  expect(run.view().pandaShadow.scale).toBeCloseTo(0.5);
  run.jump();
  run.advance(100);
  expect(run.view().pandaShadow.scale).toBe(0.5);
});

const shadowOverColumn = (run: Run): boolean =>
  run.view().boxes.some((box) => box.x <= 112.5 && box.x + 64 > 112.5);

test("the panda shadow sits on a one-box column top while the shadow centre is over it, and on the floor before and after", () => {
  const run = createStartedRun(standardColumns(), oneBoxEach(), noStore);
  run.advance(2700);
  run.jump();
  run.advance(230);
  expect(shadowOverColumn(run)).toBe(false);
  expect(run.view().pandaShadow.y).toBe(426);
  run.advance(20);
  expect(shadowOverColumn(run)).toBe(true);
  expect(run.view().pandaShadow.y).toBe(362);
  while (shadowOverColumn(run)) run.advance(10);
  expect(run.view().pandaShadow.y).toBe(426);
  expect(run.view().gameOver).toBe(false);
});

test("the panda shadow sits on a two-box column top at y 298 while over it", () => {
  const run = createStartedRun(twoBoxColumns(), oneBoxEach(), noStore);
  run.advance(2400);
  run.jump();
  run.advance(540);
  expect(shadowOverColumn(run)).toBe(true);
  expect(run.view().pandaShadow.y).toBe(298);
  expect(run.view().gameOver).toBe(false);
});

test("shadow scale 20 px above a one-box column top matches 20 px above the floor", () => {
  const floor = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  floor.jump();
  while (Math.abs(426 - floor.view().pandaBottom - 20) > 0.5) floor.advance(1);
  const floorScale = floor.view().pandaShadow.scale;

  const over = createStartedRun(standardColumns(), oneBoxEach(), noStore);
  over.advance(2770);
  over.jump();
  while (!(shadowOverColumn(over) && Math.abs(426 - over.view().pandaBottom - 84) <= 0.5)) {
    over.advance(1);
  }
  expect(over.view().pandaShadow.y).toBe(362);
  expect(over.view().pandaShadow.scale).toBeCloseTo(floorScale, 2);
});

const runDiedAtScore = (columns: number): Run => {
  const run = createStartedRun(standardColumns(), standardColumns(), noStore);
  for (let column = 1; column <= columns; column += 1) {
    run.advance(1500 * column + 1200 - run.view().time);
    run.jump();
  }
  while (!run.view().gameOver) run.advance(16);
  return run;
};

test("gameOverScore counts up from 0 to the final score over the 500 ms restart freeze", () => {
  const run = runDiedAtScore(12);
  expect(run.view()).toMatchObject({ score: "12", gameOverScore: "0" });
  run.advance(250);
  expect(run.view()).toMatchObject({ score: "12", gameOverScore: "6" });
  run.advance(250);
  expect(run.view().gameOverScore).toBe("12");
  run.advance(300);
  expect(run.view().gameOverScore).toBe("12");
});

test("gameOverScore equals the score while the run is live", () => {
  const run = createStartedRun(standardColumns(), standardColumns(), noStore);
  for (let column = 1; column <= 5; column += 1) {
    run.advance(1500 * column + 1200 - run.view().time);
    run.jump();
  }
  run.advance(1500 * 5 + 1820 - run.view().time);
  expect(run.view()).toMatchObject({ gameOver: false, score: "5", gameOverScore: "5" });
});

test("gameOverScore stays 0 for a run that died with score 0", () => {
  const run = runDiedAtScore(0);
  expect(run.view().gameOverScore).toBe("0");
  run.advance(250);
  expect(run.view().gameOverScore).toBe("0");
  run.advance(250);
  expect(run.view().gameOverScore).toBe("0");
  run.advance(300);
  expect(run.view().gameOverScore).toBe("0");
});

const landedRun = () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  run.jump();
  run.advance(1000);
  while (run.view().pandaBottom < 426) run.advance(10);
  return run;
};

test("landingPuff is null in the air, appears on landing at the feet and fades over 200ms", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  expect(run.view().landingPuff).toBeNull();
  run.jump();
  run.advance(500);
  expect(run.view().landingPuff).toBeNull();
  const landed = landedRun();
  expect(landed.view().landingPuff).toEqual({ x: 112.5, y: 426, alpha: 1 });
  landed.advance(100);
  expect(landed.view().landingPuff?.alpha).toBeCloseTo(0.5);
  landed.advance(100);
  expect(landed.view().landingPuff).toBeNull();
});

test("landingPuff stays null when a dead panda falls to the floor", () => {
  const run = createStartedRun(twoBoxColumns(), oneBoxEach(), noStore);
  run.advance(2300);
  run.jump();
  run.advance(900);
  expect(run.view().gameOver).toBe(true);
  run.advance(1000);
  expect(run.view().pandaBottom).toBe(426);
  expect(run.view().landingPuff).toBeNull();
});

test("landingPuff is null right after a restart", () => {
  const run = createStartedRun(twoBoxColumns(), oneBoxEach(), noStore);
  run.advance(2300);
  run.jump();
  run.advance(900);
  run.advance(1000);
  run.jump();
  expect(run.view()).toMatchObject({ gameOver: false, landingPuff: null });
});

test("the view scrolls the hills a quarter of the floor's distance and colours them by score", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(1000);
  expect(run.view().hillsScroll).toBeCloseTo(50);
  expect(run.view().hillColor).toBe("#4a9ba6");
});

test("the view names the biome for the score, sky, hills and columns included, and a restart returns to the meadow", () => {
  const run = createStartedRun(repeatingOneBox(), oneBoxEach(), noStore);
  advanceToColumn(run, 1, 19);
  expect(run.view()).toMatchObject({ biome: BIOMES[0], sky: "#71c5cf", hillColor: "#4a9ba6", stars: [], sceneryFade: 1 });
  advanceToColumn(run, 20, 20);
  expect(run.view()).toMatchObject({
    biome: BIOMES[1],
    sky: "#71c5cf",
    hillColor: "#4a9ba6",
    sceneryFrom: BIOMES[0],
    sceneryTo: BIOMES[1],
    sceneryFade: 0,
  });
  advanceAlive(run, 1500);
  expect(run.view().sky).toBe("#b3b498");
  expect(run.view().hillColor).toBe(mixHex(BIOMES[0].hills, BIOMES[1].hills, 0.5));
  expect(run.view().sceneryFade).toBe(0.5);
  advanceAlive(run, 1500);
  expect(run.view()).toMatchObject({ biome: BIOMES[1], sky: "#f4a261", hillColor: "#c97b3a", sceneryFade: 1 });
  advanceToColumn(run, Number(run.view().score) + 1, 40);
  expect(run.view()).toMatchObject({ biome: BIOMES[2], sky: BIOMES[1].sky, sceneryFade: 0 });
  advanceAlive(run, 3000);
  expect(run.view()).toMatchObject({ biome: BIOMES[2], sky: BIOMES[2].sky, hillColor: "#ffffff", stars: [], sceneryFade: 1 });
  advanceToColumn(run, Number(run.view().score) + 1, 60);
  expect(run.view().biome).toBe(BIOMES[3]);
  expect(run.view().stars).toEqual([]);
  expect(run.view().starsAlpha).toBe(0);
  expect(run.view().sceneryFade).toBe(0);
  advanceAlive(run, 1500);
  expect(run.view().stars).toHaveLength(12);
  expect(run.view().starsAlpha).toBe(0.5);
  advanceAlive(run, 1500);
  expect(run.view().stars).toHaveLength(12);
  expect(run.view().starsAlpha).toBe(1);
  expect(run.view().sceneryFade).toBe(1);
  while (!run.view().canRestart) run.advance(10);
  run.jump();
  expect(run.view()).toMatchObject({ score: "0", biome: BIOMES[0], sky: "#71c5cf", sceneryFade: 1, starsAlpha: 0 });
});

test("pausing or dying mid-biome-fade freezes the sky colour, and a restart snaps to meadow", () => {
  const run = createStartedRun(repeatingOneBox(), oneBoxEach(), noStore);
  advanceToColumn(run, 1, 20);
  advanceAlive(run, 1500);
  const mid = run.view();
  expect(mid.sceneryFade).toBe(0.5);
  expect(mid.sky).toBe("#b3b498");
  run.pause();
  run.advance(2000);
  expect(run.view().sky).toBe(mid.sky);
  expect(run.view().sceneryFade).toBe(0.5);
  run.pauseOrResume();
  run.advance(1500);
  expect(run.view().sceneryFade).toBe(0.5);
  while (!run.view().gameOver) run.advance(10);
  const died = run.view();
  expect(died.sceneryFade).toBeLessThan(1);
  const skyAtDeath = died.sky;
  const fadeAtDeath = died.sceneryFade;
  run.advance(500);
  expect(run.view().sky).toBe(skyAtDeath);
  expect(run.view().sceneryFade).toBe(fadeAtDeath);
  while (!run.view().canRestart) run.advance(10);
  run.jump();
  expect(run.view()).toMatchObject({ score: "0", biome: BIOMES[0], sky: "#71c5cf", sceneryFade: 1, stars: [] });
});

const scaleOf = (run: Run) => [run.view().pandaScaleX, run.view().pandaScaleY];

test("a floor jump stretches the panda tall and eases back to 1 over 120ms", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  expect(scaleOf(run)).toEqual([1, 1]);
  run.jump();
  expect(scaleOf(run)).toEqual([0.8, 1.2]);
  run.advance(60);
  expect(scaleOf(run)[0]).toBeCloseTo(0.9);
  expect(scaleOf(run)[1]).toBeCloseTo(1.1);
  run.advance(60);
  expect(scaleOf(run)).toEqual([1, 1]);
  run.advance(50);
  expect(scaleOf(run)).toEqual([1, 1]);
});

test("an air jump leaves the panda's scale alone", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  run.jump();
  run.advance(300);
  run.jump();
  expect(scaleOf(run)).toEqual([1, 1]);
});

test("landing squashes the panda wide and eases back to 1 over 120ms", () => {
  const landed = landedRun();
  expect(scaleOf(landed)).toEqual([1.2, 0.8]);
  landed.advance(60);
  expect(scaleOf(landed)[0]).toBeCloseTo(1.1);
  expect(scaleOf(landed)[1]).toBeCloseTo(0.9);
  landed.advance(60);
  expect(scaleOf(landed)).toEqual([1, 1]);
});

test("a jump right after landing stretches the panda instead of squashing it", () => {
  const landed = landedRun();
  landed.jump();
  expect(scaleOf(landed)).toEqual([0.8, 1.2]);
});

test("a buffered jump that fires on landing stretches the panda", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  run.jump();
  run.advance(300);
  run.jump();
  while (run.view().pandaBottom < 400) run.advance(10);
  run.jump();
  while (scaleOf(run)[1] === 1) run.advance(10);
  expect(scaleOf(run)).toEqual([0.8, 1.2]);
  run.advance(10);
  expect(run.view().pandaBottom).toBeLessThan(426);
});

test("the panda's scale is the impact squash at death, then 1 after 120ms and after a restart", () => {
  const run = createStartedRun(twoBoxColumns(), oneBoxEach(), noStore);
  run.advance(2300);
  run.jump();
  untilDead(run);
  expect(scaleOf(run)).toEqual([0.8, 1.15]);
  run.advance(120);
  expect(scaleOf(run)).toEqual([1, 1]);
  run.advance(880);
  run.jump();
  expect(scaleOf(run)).toEqual([1, 1]);
});

test("the shape holds while paused", () => {
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), noStore);
  run.jump();
  run.advance(60);
  run.pause();
  run.advance(500);
  expect(scaleOf(run)[1]).toBeCloseTo(1.1);
});

const recordingTopScores = (loaded: readonly number[]) => {
  const saves: (readonly number[])[] = [];
  return { saves, store: { load: () => 0, save: () => undefined, topScores: { load: () => loaded, save: (scores: readonly number[]) => saves.push(scores) } } };
};

test("the ready view lists the stored top scores, and the list is gone once the run starts", () => {
  const { store } = recordingTopScores([7, 4]);
  const run = createRun(oneBoxEach(), oneBoxEach(), store);
  expect(run.view().topScores).toEqual([7, 4]);
  run.jump();
  expect(run.view().topScores).toEqual([]);
});

test("a run that ends above 0 is inserted into the top scores and saved once", () => {
  const { saves, store } = recordingTopScores([7, 1]);
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), store);
  run.advance(2700);
  run.jump();
  run.advance(3000);
  expect(run.view()).toMatchObject({ gameOver: true, score: "1", topScores: [] });
  expect(saves).toEqual([[7, 1, 1]]);
  run.advance(600);
  expect(saves).toHaveLength(1);
});

test("a run that ends on 0 saves nothing new to the top scores", () => {
  const { saves, store } = recordingTopScores([]);
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), store);
  run.advance(5000);
  expect(run.view()).toMatchObject({ gameOver: true, score: "0" });
  expect(saves).toEqual([[]]);
});

test("restarting keeps the top scores so later runs add to them", () => {
  const { saves, store } = recordingTopScores([]);
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), store);
  run.advance(2700);
  run.jump();
  run.advance(3000);
  run.advance(600);
  run.jump();
  run.advance(2700);
  run.jump();
  run.advance(3000);
  expect(saves).toEqual([[1], [1, 1]]);
});

const storeWithBest = (best: number, loaded: readonly number[]) => {
  const saves: (readonly number[])[] = [];
  return { saves, store: { load: () => best, save: () => undefined, topScores: { load: () => loaded, save: (scores: readonly number[]) => saves.push(scores) } } };
};

test("a stored best above every stored top score is merged into the list and the list is saved", () => {
  const { saves, store } = storeWithBest(15, [10, 8]);
  expect(createRun(oneBoxEach(), oneBoxEach(), store).view().topScores).toEqual([15, 10, 8]);
  expect(saves).toEqual([[15, 10, 8]]);
});

test("a stored best already in the list leaves the list alone and unsaved", () => {
  const { saves, store } = storeWithBest(10, [10, 8]);
  expect(createRun(oneBoxEach(), oneBoxEach(), store).view().topScores).toEqual([10, 8]);
  expect(saves).toEqual([]);
});

test("a stored best of 0 adds nothing to the list", () => {
  const { saves, store } = storeWithBest(0, []);
  expect(createRun(oneBoxEach(), oneBoxEach(), store).view().topScores).toEqual([]);
  expect(saves).toEqual([]);
});

test("merging the stored best keeps the list to five entries", () => {
  const { store } = storeWithBest(9, [5, 4, 3, 2, 1]);
  expect(createRun(oneBoxEach(), oneBoxEach(), store).view().topScores).toEqual([9, 5, 4, 3, 2]);
});

interface Setup {
  readonly topScores: readonly number[];
  readonly best: number;
  readonly jumped: boolean;
  readonly ms: number;
}

const placingAfter = ({ topScores, best, jumped, ms }: Setup) => {
  const store = { load: () => best, save: () => undefined, topScores: { load: () => topScores, save: () => undefined } };
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), store);
  if (jumped) {
    run.advance(2700);
    run.jump();
  }
  while (!run.view().gameOver) run.advance(10);
  run.advance(ms);
  return run.view().placing;
};

test.each([
  [[30], 2],
  [[30, 20], 3],
  [[30, 20, 10], 4],
  [[30, 20, 10, 9], 5],
])("a run of 1 against %j reports placing %i once restart is allowed", (list, expected) => {
  expect(placingAfter({ topScores: list, best: 30, jumped: true, ms: 600 })).toBe(expected);
});

test("the placing stays hidden while the score counts up, and for a first, sixth, zero or best-overtaking run", () => {
  expect(placingAfter({ topScores: [30, 20, 10], best: 30, jumped: true, ms: 0 })).toBe(0);
  expect(placingAfter({ topScores: [], best: 0, jumped: true, ms: 600 })).toBe(0);
  expect(placingAfter({ topScores: [1], best: 1, jumped: true, ms: 600 })).toBe(0);
  expect(placingAfter({ topScores: [50, 40, 30, 20, 10], best: 50, jumped: true, ms: 600 })).toBe(0);
  expect(placingAfter({ topScores: [9], best: 9, jumped: false, ms: 600 })).toBe(0);
  expect(placingAfter({ topScores: [3], best: 0, jumped: true, ms: 600 })).toBe(0);
});

test("the placing is cleared on restart and has nothing to show before the next run ends", () => {
  const store = { load: () => 30, save: () => undefined, topScores: { load: () => [30, 20, 10], save: () => undefined } };
  const run = createStartedRun(oneBoxEach(), oneBoxEach(), store);
  run.advance(2700);
  run.jump();
  while (!run.view().canRestart) run.advance(10);
  expect(run.view().placing).toBe(4);
  run.jump();
  expect(run.view()).toMatchObject({ gameOver: false, placing: 0 });
});

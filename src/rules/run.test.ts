import { expect, test } from "vitest";
import { createRun } from "./index.ts";
import type { Run } from "./index.ts";

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

const noStore = { load: () => 0, save: () => undefined };

test("a run starts with the panda on the floor, score 0 and no boxes", () => {
  expect(createRun(oneBoxEach(), oneBoxEach(), noStore).view()).toEqual({
    time: 0,
    restarts: 0,
    score: "0",
    scoreScale: 1,
    best: "0",
    newBest: false,
    overtookBest: false,
    speedUp: false,
    medal: "none",
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
    canRestart: false,
    paused: false,
    countdown: null,
    pandaUpsideDown: false,
    bestMarker: null,
    deathFlash: 0,
    pandaAngle: 0,
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
  expect(run.view().boxes).toEqual([{ x: 400, y: 362, texture: "ice_06.png", hit: false }]);
  run.advance(100);
  expect(run.view().boxes).toEqual([{ x: 380, y: 362, texture: "ice_06.png", hit: false }]);
});

test("touching a column freezes the run and shows game over instead of restarting at once", () => {
  const run = createRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(2880);
  run.advance(200);
  const frozen = run.view();
  expect(frozen).toMatchObject({ restarts: 0, score: "0", gameOver: true, canRestart: false, deathFlash: 0 });
  expect(frozen.boxes).not.toEqual([]);
  run.advance(10);
  expect(run.view()).toEqual(frozen);
});

test("deathFlash is 0 through a live run, jumps to 0.6 the instant the panda dies and fades to 0 by 200ms", () => {
  const run = createRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(2870);
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

test("no click, tap or Space input restarts the run during the first 500ms after death, and canRestart stays false", () => {
  const run = createRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(2880);
  const frozen = run.view();
  run.advance(499);
  expect(run.view()).toMatchObject({ gameOver: true, canRestart: false });
  run.jump();
  expect(run.view()).toMatchObject({ ...frozen, restarts: 0, gameOver: true, canRestart: false, deathFlash: 0 });
});

test("canRestart becomes true once 500ms have passed since death, before any input arrives", () => {
  const run = createRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(2880);
  run.advance(500);
  expect(run.view()).toMatchObject({ restarts: 0, gameOver: true, canRestart: true });
});

test("a click, tap or Space input after 500ms starts a fresh run at score 0 and clears the game over screen", () => {
  const run = createRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(2880);
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
  expect(run.view().boxes).toEqual([{ x: 380, y: 362, texture: "ice_06.png", hit: false }]);
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

test("scoreScale starts at 1, pops to 1.3 the instant the score increases, then falls linearly back to 1 over 150ms", () => {
  const run = createRun(oneBoxEach(), oneBoxEach(), noStore);
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
  const run = createRun(repeatingOneBox(), oneBoxEach(), noStore);
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
  const run = createRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(2700);
  run.jump();
  run.advance(640);
  expect(run.view()).toMatchObject({ score: "1" });
  expect(run.view().scoreScale).toBeGreaterThan(1);
  run.advance(1040);
  expect(run.view()).toMatchObject({ restarts: 0, score: "1", gameOver: true });
  run.advance(600);
  run.jump();
  expect(run.view()).toMatchObject({ restarts: 1, score: "0", scoreScale: 1 });
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
  const run = createRun(repeatingOneBox(), oneBoxEach(), noStore);
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

const rampedJumpAt = (column: number): number => 1500 * column + 788;

const advanceToColumn = (run: Run, from: number, to: number): void => {
  for (let column = from; column <= to; column += 1) {
    run.advance(rampedJumpAt(column) - run.view().time);
    run.jump();
  }
  while (run.view().score !== String(to)) {
    run.advance(1);
  }
};

test("speedUp is visible for exactly 800ms of game time from the instant the score first reaches the ramp threshold of 20", () => {
  const run = createRun(repeatingOneBox(), oneBoxEach(), noStore);
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
  const run = createRun(repeatingOneBox(), oneBoxEach(), noStore);
  advanceToColumn(run, 1, 20);
  expect(run.view()).toMatchObject({ score: "20", speedUp: true });
  advanceToColumn(run, 21, 29);
  expect(run.view()).toMatchObject({ score: "29", speedUp: false });
  advanceToColumn(run, 30, 30);
  expect(run.view()).toMatchObject({ score: "30", speedUp: true });
});

test("speedUp does not reappear at score 70 since the speed already reached its cap at 60", () => {
  const run = createRun(repeatingOneBox(), oneBoxEach(), noStore);
  advanceToColumn(run, 1, 60);
  expect(run.view()).toMatchObject({ score: "60", speedUp: true });
  advanceToColumn(run, 61, 70);
  expect(run.view()).toMatchObject({ score: "70", speedUp: false });
});

test("speedUp is never visible on the game-over screen, even moments after the ramp changed", () => {
  const run = createRun(repeatingOneBox(), oneBoxEach(), noStore);
  advanceToColumn(run, 1, 20);
  expect(run.view()).toMatchObject({ score: "20", speedUp: true });
  run.advance(5000);
  expect(run.view()).toMatchObject({ gameOver: true, speedUp: false });
});

test("speedUp is hidden while the run is paused, even moments after the ramp changed", () => {
  const run = createRun(repeatingOneBox(), oneBoxEach(), noStore);
  advanceToColumn(run, 1, 20);
  expect(run.view()).toMatchObject({ score: "20", speedUp: true });
  run.pause();
  expect(run.view()).toMatchObject({ paused: true, speedUp: false });
});

test("a restart hides speedUp until the next run's score reaches a ramp threshold again", () => {
  const run = createRun(repeatingOneBox(), oneBoxEach(), noStore);
  advanceToColumn(run, 1, 20);
  run.advance(5000);
  expect(run.view().gameOver).toBe(true);
  run.advance(500);
  run.jump();
  expect(run.view()).toMatchObject({ restarts: 1, score: "0", speedUp: false });
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

test("a first-time player's first cleared column triggers the new-best callout, for a fixed duration", () => {
  const run = createRun(oneBoxEach(), oneBoxEach(), noStore);
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
  const run = createRun(standardColumns(), oneBoxEach(), noStore);
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
  const run = createRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(1000);
  run.pause();
  expect(run.view()).toMatchObject({ paused: true, gameOver: false });
});

test("advance does not move time, the panda, the columns, the clouds or the floor while paused", () => {
  const run = createRun(standardColumns(), oneBoxEach(), noStore);
  run.advance(1000);
  run.pause();
  const frozen = run.view();
  run.advance(2000);
  expect(run.view()).toEqual(frozen);
});

test("the resume control starts a 1500 ms countdown instead of resuming at once", () => {
  const run = createRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(1000);
  run.pause();
  run.jump();
  expect(run.view()).toMatchObject({ paused: false, countdown: 3, pandaBottom: 426 });
});

test("the countdown shows 2 after 500 ms, 1 after 1000 ms and ends after 1500 ms", () => {
  const run = createRun(oneBoxEach(), oneBoxEach(), noStore);
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
  const run = createRun(standardColumns(), oneBoxEach(), noStore);
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
  const run = createRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(1000);
  run.pause();
  run.jump();
  run.advance(1700);
  expect(run.view()).toMatchObject({ countdown: null, paused: false, time: 1200 });
});

test("a jump pressed during the countdown neither jumps nor restarts the countdown", () => {
  const run = createRun(oneBoxEach(), oneBoxEach(), noStore);
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

test("a jump pressed after the countdown ends jumps as normal", () => {
  const run = createRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(1000);
  run.pause();
  run.jump();
  run.advance(1500);
  run.jump();
  run.advance(580);
  expect(run.view().pandaBottom).toBeCloseTo(426 - 168.2);
});

test("pause is ignored while the game-over screen is shown", () => {
  const run = createRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(2880);
  expect(run.view()).toMatchObject({ gameOver: true, canRestart: false, paused: false });
  run.pause();
  expect(run.view().paused).toBe(false);
  run.advance(500);
  expect(run.view()).toMatchObject({ gameOver: true, canRestart: true });
});

test("pauseOrResume pauses a live run", () => {
  const run = createRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(1000);
  run.pauseOrResume();
  expect(run.view()).toMatchObject({ paused: true, gameOver: false });
});

test("pauseOrResume resumes a paused run without making the panda jump", () => {
  const run = createRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(1000);
  run.pauseOrResume();
  run.pauseOrResume();
  expect(run.view()).toMatchObject({ paused: false, pandaBottom: 426 });
});

test("pauseOrResume is ignored while the game-over screen is shown", () => {
  const run = createRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(2880);
  expect(run.view()).toMatchObject({ gameOver: true, paused: false });
  run.pauseOrResume();
  expect(run.view().paused).toBe(false);
  run.advance(500);
  expect(run.view()).toMatchObject({ gameOver: true, canRestart: true });
});

test("overtookBest is false until the run overtakes the stored best, then stays true through death, and resets on restart", () => {
  const run = createRun(oneBoxEach(), oneBoxEach(), noStore);
  expect(run.view().overtookBest).toBe(false);
  run.advance(2700);
  run.jump();
  run.advance(640);
  expect(run.view()).toMatchObject({ score: "1", best: "1", overtookBest: true });
  run.advance(1040);
  expect(run.view()).toMatchObject({ restarts: 0, score: "1", best: "1", gameOver: true, overtookBest: true });
  run.advance(600);
  run.jump();
  expect(run.view()).toMatchObject({ restarts: 1, score: "0", best: "1", overtookBest: false });
});

test("tying the stored best does not count as overtaking it", () => {
  const run = createRun(oneBoxEach(), oneBoxEach(), { load: () => 1, save: () => undefined });
  run.advance(2700);
  run.jump();
  run.advance(640);
  expect(run.view()).toMatchObject({ score: "1", best: "1", overtookBest: false });
});

test("dying and restarting resets the callout so beating the new, higher best triggers it again", () => {
  const run = createRun(standardColumns(), oneBoxEach(), noStore);
  run.advance(2700);
  run.jump();
  run.advance(640);
  expect(run.view()).toMatchObject({ score: "1", best: "1", newBest: true });
  run.advance(1040);
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

test("a panda that dies while still rising has its speed zeroed so it never rises again", () => {
  const run = createRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(2870);
  run.jump();
  run.advance(10);
  const diedAt = run.view();
  expect(diedAt.gameOver).toBe(true);
  expect(diedAt.pandaBottom).toBeLessThan(426);
  run.advance(10);
  expect(run.view().pandaBottom).toBeGreaterThan(diedAt.pandaBottom);
});

test("a panda that dies above the floor keeps falling every step until it settles exactly on the floor, then stays there", () => {
  const run = createRun(twoBoxColumns(), oneBoxEach(), noStore);
  run.advance(2300);
  run.jump();
  run.advance(900);
  const diedAt = run.view();
  expect(diedAt.gameOver).toBe(true);
  expect(diedAt.pandaBottom).toBeLessThan(426);
  let previous = diedAt.pandaBottom;
  let steps = 0;
  while (previous < 426) {
    steps += 1;
    if (steps > 1000) throw new Error("the panda never reached the floor");
    run.advance(10);
    const current = run.view().pandaBottom;
    expect(current).toBeGreaterThan(previous);
    expect(current).toBeLessThanOrEqual(426);
    previous = current;
  }
  run.advance(50);
  expect(run.view().pandaBottom).toBe(426);
});

test("a panda that dies already on the floor stays at pandaBottom 426", () => {
  const run = createRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(2880);
  const diedAt = run.view();
  expect(diedAt.gameOver).toBe(true);
  expect(diedAt.pandaBottom).toBe(426);
  run.advance(300);
  expect(run.view().pandaBottom).toBe(426);
});

test("dying against the front of a double column marks only its boxes as hit", () => {
  const run = createRun(doubleColumnRandom(), oneBoxEach(), noStore);
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
  const run = createRun(oneBoxEach(), oneBoxEach(), noStore);
  expect(run.view().pandaUpsideDown).toBe(false);
  run.advance(2880);
  expect(run.view()).toMatchObject({ gameOver: true, pandaUpsideDown: true });
  run.advance(500);
  run.jump();
  expect(run.view()).toMatchObject({ gameOver: false, pandaUpsideDown: false });
});

test("bestMarker shows over the column that would beat the stored best while live, and hides on pause or game over", () => {
  const store = { load: () => 1, save: () => undefined };
  const run = createRun(standardColumns(), oneBoxEach(), store);
  run.advance(2700);
  run.jump();
  run.advance(640);
  expect(run.view()).toMatchObject({ score: "1", bestMarker: { x: 364, y: 354 } });
  run.pause();
  expect(run.view().bestMarker).toBeNull();
  run.jump();
  expect(run.view().bestMarker).not.toBeNull();
  run.advance(1040);
  expect(run.view()).toMatchObject({ gameOver: true, bestMarker: null });
});

test("pandaAngle is 0 while the panda stands on the floor", () => {
  const run = createRun(oneBoxEach(), oneBoxEach(), noStore);
  expect(run.view().pandaAngle).toBe(0);
});

test("pandaAngle is -25, clamped nose up, immediately after a floor jump", () => {
  const run = createRun(oneBoxEach(), oneBoxEach(), noStore);
  run.jump();
  expect(run.view().pandaAngle).toBe(-25);
});

test("pandaAngle returns to 0 at the top of a jump, where speed is 0", () => {
  const run = createRun(oneBoxEach(), oneBoxEach(), noStore);
  run.jump();
  run.advance(580);
  expect(run.view().pandaAngle).toBeCloseTo(0);
});

test("pandaAngle is positive but at most 25 while the panda is falling", () => {
  const run = createRun(oneBoxEach(), oneBoxEach(), noStore);
  run.jump();
  run.advance(600);
  const angle = run.view().pandaAngle;
  expect(angle).toBeGreaterThan(0);
  expect(angle).toBeLessThanOrEqual(25);
});

test("pandaAngle clamps at 25, nose down, during a long fall", () => {
  const run = createRun(oneBoxEach(), oneBoxEach(), noStore);
  run.jump();
  run.advance(1100);
  expect(run.view().pandaBottom).toBeLessThan(426);
  expect(run.view().pandaAngle).toBe(25);
});

test("pandaAngle is 0 during game over even though the panda is still falling", () => {
  const run = createRun(oneBoxEach(), oneBoxEach(), noStore);
  run.advance(2880);
  expect(run.view()).toMatchObject({ gameOver: true, pandaAngle: 0 });
});

test("time, score, columns, clouds and floor scroll stay frozen while the panda falls after a mid-air death", () => {
  const run = createRun(twoBoxColumns(), oneBoxEach(), noStore);
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

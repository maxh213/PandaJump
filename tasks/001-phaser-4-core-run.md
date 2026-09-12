# Panda Jump on Phaser 4, slice 1: run, jump, die, restart

This is slice 1 of three that rebuild Panda Jump on a modern stack. The design decisions below are fixed across all three; deliver only this slice.

The game today is `main.js` on Phaser 1.1.5, with the library copied into the repo as `phaser.min.js` and loaded by `index.html`. It was written in 2014 and nothing about its tooling survives.

## Design decisions, fixed

- **Phaser 4 on Vite and TypeScript.** `phaser` at `^4.2.1` from npm, TypeScript strict. `npm run dev` serves the game; `npm run build` produces a static `dist/` that runs from any file host. The repo root holds `package.json`, `index.html`, `src/` and the existing `assets/`.
- **The old game is deleted, not kept beside the new one.** `main.js` and `phaser.min.js` go in this slice. `git log` holds them for reference; read `main.js` from `git show HEAD~1:main.js` or the first commit when you need it.
- **Rules live apart from Phaser.** Jump eligibility, double-jump state, obstacle spawning, scoring and the high score are plain TypeScript under `src/rules`, with no Phaser import, so they can be tested without a canvas. Scenes render what those rules decide. `.dependency-cruiser.cjs` enforces this. `src/main.ts` boots the game.
- **Scenes are proved in the browser, not in unit tests.** Phaser scenes live under `src/scenes`, which is excluded from unit coverage and mutation testing. Keep them thin: they wire rules to sprites, physics and input and make no decisions of their own. What a scene renders is proved by the Playwright suite in `[qa]`, so every scenario about what the player sees or does runs there against the real game.
- **Randomness and time are injected.** Spawning takes a random source and the game loop takes elapsed time, so tests and the Playwright suite can make a run deterministic.
- **Same size, same art.** The canvas stays 400×490 and uses the existing PNGs in `assets/`. A redraw at Game Boy resolution (160×144, 4 shades) for sharing art with [pandajump-gameboy](https://github.com/maxh213/pandajump-gameboy) is a later, separate decision; it is not in this series.
- **The page around the game keeps its content.** Title "Panda Jump", the GitHub link, and the controls line. The Lato font loads over `https`.

## This slice

A player opens the page and the panda is running on a scrolling grass-and-rock floor. They click, tap or press Space to jump, and can jump once more in mid-air. Box columns come from the right; the score goes up each time the panda clears one. Touching a box restarts the run at score 0.

## Values

- Canvas 400×490, background `#71c5cf`.
- Panda spritesheet `assets/Panda.png`: frames are 20px wide, the run cycle is frames 17–22 at 15 fps, drawn at 1.25× scale. The sheet is 713px tall for 34 frames, so frame height is not a whole number; slice it so every frame of the run cycle shows the whole panda without a strip from the neighbouring frame.
- Panda starts at x 100. Gravity 1000 px/s². A jump from the floor sets vertical velocity to -580; one further jump in the air sets it to -250; no third jump until the panda lands.
- The floor is `rock_06.png` tiles (64px) with a surface at y 426, topped by `top_grass_01.png` at y 392, both scrolling left at 200 px/s with no visible gap or seam.
- A box column spawns at the right edge every 1500 ms and moves left at 200 px/s. It is 1 or 2 `dirt_06.png` boxes (64px) stacked on the floor, with equal chance.
- Once the score is above 10, a column has a 1 in 3 chance of a second column directly behind it (64px further right, same height).
- The score is drawn top-left at (20, 20), white, 30px. It goes up by exactly 1 when a column's right edge passes the panda's left edge, once per column; the two-column case counts as one clear.

## Must not change

`index.html` stays the entry page, and the page text stays the same. The files in `assets/` are used as they are, not edited or moved.

## Out of scope

The high score and its storage (slice 2). Clouds, sound, and a deploy to GitHub Pages (slice 3). New art, a new resolution, difficulty changes, and anything the original game did not do.

## Deliberate departures from the original

These were bugs in `main.js`. The specifier pins the new behaviour, not the old:

- The original decided "on the floor" by the panda's y being between 390 and 470. Use the physics body's floor contact instead.
- The original counted a point when a column *spawned*, hiding it behind a `firstbox` flag. Count it when the column is cleared.
- The original faked the scrolling floor with three stacked tile groups and a -10px fudge. Use a single scrolling tile layer per strip.
- The original removed its timers after restarting the state. Restart the scene cleanly so no timer or spawned column survives a death.

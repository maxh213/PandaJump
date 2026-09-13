PandaJump
=========

A simple box jumping game (flappy bird spin off) made in TypeScript with Phaser 4.

Controls: Click/touch to jump (you can double jump).

Development
-----------

- `npm run dev` serves the game.
- `npm run build` writes a static site to `dist/` that runs from any file host.
- `npm test` runs the unit tests for the game rules in `src/rules/`.
- `npx playwright test` plays the real game in a browser, following `features/phaser-4-core-run.feature`.

The rules (jumping, box columns, scoring) are plain TypeScript in `src/rules/`. The Phaser scene in `src/scenes/` draws what they decide. Art lives in `assets/`. `src/main.ts` reads the page options from `src/options/` and wires the rules to the scene; `.dependency-cruiser.cjs` keeps each of these folders to its own imports.

Adding `?clock=manual` to the page URL stops game time so a test can step it through `window.pandaJump.run.advance(ms)`. Adding `?random=0.25,0.5` replaces `Math.random` with those values, repeated in order; each column draws two values, the first for its height and the second for a following column.

Feel free to send me feedback or let me know if there's an error/bug at mh568@kent.ac.uk

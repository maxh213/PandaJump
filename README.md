PandaJump
=========

A simple box jumping game (flappy bird spin off) made in TypeScript with Phaser 4.

Play it at https://maxh213.github.io/PandaJump/.

Controls: Click, tap or press Space to jump (you can double jump).

Development
-----------

- Requires Node >=22.12.0 (vitest 5's minimum); `npm ci` fails fast with a clear error on older Node.
- `npm run dev` serves the game.
- `npm run build` writes a static site to `dist/` that runs from any file host.
- `npm test` runs the unit tests for the game rules in `src/rules/`.
- `npm run lint` lints the project with ESLint.
- `npx playwright test` plays the real game in a browser, following every feature file under `features/`, each with a matching spec in `e2e/`.

The rules (jumping, box columns, scoring, clouds, high score) are plain TypeScript in `src/rules/`. The Phaser scene in `src/scenes/` draws what they decide. Art lives in `assets/`. `src/main.ts` reads the page options from `src/options/` and wires the rules to the scene; `.dependency-cruiser.cjs` keeps each of these folders to its own imports.

Adding `?clock=manual` to the page URL stops game time so a test can step it through `window.pandaJump.run.advance(ms)`. Adding `?random=0.25,0.5,0` replaces `Math.random` with those values, repeated in order; each column draws three values: the first for its height, the second for a following column, and the third for which of the five ground textures (`dirt_06.png`, `ice_06.png`, `metal_06.png`, `sand_06.png` or `snow_06.png`) that column's boxes use. Clouds draw their respawn height from the same `?random=` values, but through their own independent cursor over that list, so column behaviour is unaffected by how many clouds have respawned.


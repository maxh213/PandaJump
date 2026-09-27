# Panda Jump on Phaser 4, slice 2: the high score

This is slice 2 of three that rebuild Panda Jump on a modern stack. It takes the design decisions slice 1 (`tasks/001-phaser-4-core-run.md`) fixed: rules live apart from Phaser under `src/rules` with no Phaser or DOM import, `.dependency-cruiser.cjs` enforces that, scenes are proved in the browser via `features/` and the Playwright suite in `e2e/`, and randomness and time are injected.

## This slice

A player who has played Panda Jump before sees their best score the moment the page loads, and watches it climb past its old value without needing to die first. The best is kept in the browser between visits.

## Values

- The rule that decides a new best is plain TypeScript in `src/rules`, with no import of Phaser, `window` or `localStorage`. It takes the current best and the live score and returns the new best.
- Storage is injected into `createRun`, the same way the random source already is: `src/main.ts` is the only file that reads or writes `localStorage`, under the key `pandaJump.best`, and passes a small adapter (`load`/`save`) into the rules layer.
- A missing key, a value that throws on access (as `localStorage` does in some browsers' private-browsing mode), or a value that is not a number are all treated as a best of 0. None of them throws or logs an error to the player.
- `Best: N` is drawn bottom-left at (20, 450), white, 20px Arial, anchored the same way the top-left score at (20, 20) is anchored to its corner: the text grows away from the edge it is pinned to, so the bottom-left anchor keeps it clear of the floor's scrolling tiles below.
- The best on screen updates the instant the live score overtakes it, not only when the panda dies. Dying does not reset it.
- The best that gets written to `localStorage` is only overwritten when a new score beats it, and it survives a page reload.

## Must not change

Everything slice 1 fixed: the run, jump, columns and live score behave exactly as `features/phaser-4-core-run.feature` describes. The floor's scrolling tiles keep no seam, including in the rows the new bottom-left text sits above.

## Out of scope

Clouds, sound and the deploy to GitHub Pages (slice 3). A game-over screen in place of the instant restart is a later, separate decision; it is not in this slice.

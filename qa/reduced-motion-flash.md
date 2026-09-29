# QA: Panda Jump on Phaser 4, slice: skip the full-screen white death flash for players who ask for reduced motion

Use a desktop browser with dev tools. In Chrome dev tools, open Rendering and set "Emulate CSS media
feature prefers-reduced-motion" to "reduce" (or turn on reduce motion in your operating system).

1. Run `npm ci` then `npm run dev` and open the URL it prints, with reduced motion on.
2. Play and let the panda hit a column. **Expected:** no white flash at all. The hit column turns
   red, the panda tumbles upside down and falls, and the "Game over" texts appear as usual.
3. Open `./?clock=manual&random=0.25,0.5,0`, run `window.pandaJump.run.advance(2895)` and then
   `window.pandaJump.game.scene.getScene('run').children.getByName('deathFlash').alpha`.
   **Expected:** 0. Repeat with `advance(50)` a few times. **Expected:** always 0.
4. Set the emulation back to "no preference" and reload. **Expected:** the flash is back exactly as
   described in `qa/death-flash.md`.
5. Run `npx playwright test`. **Expected:** every scenario in `features/reduced-motion-flash.feature`
   and `features/death-flash.feature` has a passing test.

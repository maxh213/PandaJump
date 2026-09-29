# QA: Panda Jump on Phaser 4, slice: shake the view briefly when the panda hits a column

Use a desktop browser with dev tools. Playing at normal speed the shake lasts only 200ms; the console
steps below use `?clock=manual` to see it frame by frame instead.

1. Run `npm ci` then `npm run dev` and open the URL it prints.
2. Play normally and let the panda hit a column. **Expected:** at the instant of impact the whole
   view jolts a few pixels and settles within a fraction of a second, together with the white flash.
   The shake is small and never leaves the picture off-centre afterwards.
3. Open `./?clock=manual&random=0.25,0.5,0` in the console and run
   `window.pandaJump.run.advance(2880); window.pandaJump.run.view().deathShake`. **Expected:** an
   object with a non-zero `x` or `y`, each between -6 and 6.
4. Keep calling `window.pandaJump.run.advance(50); window.pandaJump.run.view().deathShake` a few
   times. **Expected:** the offsets shrink and are exactly `{ x: 0, y: 0 }` once 200ms have passed
   since the panda died, and stay that way.
5. Run `window.pandaJump.game.scene.getScene('run').cameras.main.scrollX` after each step.
   **Expected:** it matches `deathShake.x` (and `scrollY` matches `deathShake.y`) once the scene has
   drawn a frame.
6. With the game over screen showing (500ms after death), tap or press Space. **Expected:** the run
   restarts and the view is perfectly still, camera scroll 0 on both axes.
7. Enable "reduce motion" in your operating system (or emulate `prefers-reduced-motion: reduce` in
   dev tools), reload and let the panda hit a column. **Expected:** no flash and no shake; the camera
   scroll stays 0 on both axes, while the tinted column and the game-over screen still appear.
8. Run `npx playwright test`. **Expected:** every scenario in `features/death-shake.feature`, and the
   rest of the Playwright suite, has a passing test.

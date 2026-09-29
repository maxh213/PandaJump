# QA: Panda Jump scrolls a row of distant hills behind the columns at a quarter of the floor's speed

Use a desktop browser with dev tools. Heights are in px from the top of the canvas.

1. Run `npm ci` then `npm run dev` and open the URL it prints. **Expected:** the console shows no errors, and a row of rounded, solid-coloured hills sits directly on the green top of the grass with no strip of sky between them, darker than the sky.
2. Look at how high the hills reach. **Expected:** their tops are never above y 300, so they never sit behind the score, the callouts or the game-over text.
3. Look at what overlaps what. **Expected:** the hills are in front of the clouds (and the stars at night) and behind the columns, the panda and its shadow.
4. Watch a run for a few seconds. **Expected:** the hills drift left slowly, at a quarter of the speed the floor moves, and loop seamlessly with no visible jump.
5. Keep scoring past 20. **Expected:** the floor and columns speed up and the hills speed up with them, still much slower than the floor.
6. Press P to pause, then Space to start the countdown. **Expected:** the hills stand still while paused and during the countdown, and move again when it ends.
7. Let the panda hit a column. **Expected:** the hills stop on the game-over screen.
8. Reach a score of 20, then 40. **Expected:** the hills change colour with the sky: brown-orange under the sunset sky, near-black blue under the night sky, each darker than its sky. Restart. **Expected:** the day colour is back.
9. Open the page with `?clock=manual`, and in the console run `window.pandaJump.run.advance(1000); window.pandaJump.run.view().hillsScroll`. **Expected:** 50 (a quarter of the 200 px the floor moves).
10. Run `npx playwright test`. **Expected:** every scenario in `features/parallax-hills.feature` has a passing test.

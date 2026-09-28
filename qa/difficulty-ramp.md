# QA: Panda Jump ramps column and floor speed up as the score climbs

Use a desktop browser with dev tools.

1. Run `npm ci` then `npm run dev` and open the URL it prints. **Expected:** the console shows no errors.
2. Play normally and watch the floor and columns for the first 15-20 points. **Expected:** they keep moving at the same steady speed as always, exactly like before this change.
3. Keep playing past a score of 20. **Expected:** the floor and every column on screen visibly speed up together, at the same moment the score crosses 20 - never one before the other.
4. Keep playing to a score of 30, then 40, then 50, then 60. **Expected:** the game gets a little faster at each of those marks, then stops getting any faster once it reaches score 60 - even much later runs (score 100, 200) feel no faster than score 60.
5. Open the console at any point after score 20 and run `window.pandaJump.run.view().floorScroll` twice a few hundred ms apart, then compare to how far a box moved on screen in the same window. **Expected:** the two distances match - the floor and the boxes never drift apart.
6. Watch a long run and count the time between one column appearing on the right edge and the next. **Expected:** it is 1.5 seconds early on, and the columns arrive slightly closer together at score 20, 30, 40, 50 and 60 (1.45, 1.4, 1.35, 1.3 and 1.25 seconds) and no closer after that, so a long run is harder rather than easier.
7. Open the page twice with the same `?random=0.25,0.5,0&clock=manual`, call `window.pandaJump.run.advance(...)` to the same times, and compare `window.pandaJump.run.view().boxes`. **Expected:** the column positions are identical on both pages.
8. Run `git diff master -- features/phaser-4-core-run.feature features/high-score.feature features/box-column-textures.feature features/drifting-bobbing-clouds.feature`. **Expected:** nothing prints - none of the pinned feature files changed.
9. Run `npx playwright test`. **Expected:** every scenario in `features/difficulty-ramp.feature`, and every scenario in the four feature files from step 8, has a passing test.

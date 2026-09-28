# QA: Panda Jump shows a brief "Faster!" callout each time the game speeds up

Use a desktop browser with dev tools.

1. Run `npm ci` then `npm run dev` and open the URL it prints. **Expected:** the console shows no errors, and no "Faster!" text is visible.
2. Play normally and watch the centre of the screen as your score climbs past 20. **Expected:** the instant the floor and columns visibly speed up, gold "Faster!" text appears centred a little above the middle of the screen, then fades from view about 800ms later on its own (no fade animation, it just disappears).
3. Keep playing to a score of 30, then 40, then 50, then 60. **Expected:** "Faster!" appears again at each of those marks, each time for about 800ms.
4. Keep playing well past 60, for example to 100 or 200. **Expected:** "Faster!" never appears again after 60, since the speed is already at its cap and stops changing.
5. Deliberately touch a column shortly after "Faster!" has appeared, before it would have hidden on its own. **Expected:** the game-over screen shows immediately, and "Faster!" is not visible anywhere on it.
6. From that game-over screen, wait for the freeze to pass and tap to play again. **Expected:** the run restarts at score 0 and "Faster!" is not visible.
7. Play until "Faster!" appears again, then switch to another browser tab or minimise the window before it would have hidden on its own, then switch back. **Expected:** the "Paused" screen showed while the tab was hidden, and "Faster!" was not visible on it; once resumed, check the console for `window.pandaJump.run.view().speedUp` - it should read `false`.
8. In the console, run `window.pandaJump.run.view()` at any point while "Faster!" is showing. **Expected:** `speedUp` reads `true`, matching the callout's visibility.
9. Run `git diff master -- features/phaser-4-core-run.feature features/difficulty-ramp.feature features/new-best-callout.feature`. **Expected:** nothing prints - none of the pinned feature files changed.
10. Run `npx playwright test`. **Expected:** every scenario in `features/faster-callout.feature`, and every scenario in the three feature files from step 9, has a passing test.

# QA: Panda Jump on Phaser 4, slice: the new-best callout

Use a desktop browser with dev tools. Clear localStorage for the page's origin before step 1 (Application tab → Local Storage → right-click → Clear, or `localStorage.clear()` in the console).

1. Run `npm ci` then `npm run dev` and open the URL it prints. **Expected:** bottom-left near the floor, the page reads "Best: 0" in white.
2. Play until your live score passes 0 (clear a single column). **Expected:** the instant the score ticks up and "Best: N" updates to match it, the "Best: N" text turns gold (`#ffd700`) instead of white.
3. Keep watching without doing anything else. **Expected:** about 600ms after it turned gold, "Best: N" returns to its normal white colour, same size and position as before.
4. Keep playing past that first new best, clearing more columns without dying. **Expected:** "Best: N" keeps climbing but stays white — the gold flash does not happen again this run, even though each cleared column is a new best.
5. Deliberately touch a column, wait for the game-over screen's freeze to pass, then tap to play again. **Expected:** the run restarts, the score drops to 0, "Best: N" keeps the value you reached and shows it in white (no gold flash on restart).
6. Play the new run past the best you reached in step 2–4. **Expected:** the instant your live score in this new run exceeds the stored best again, "Best: N" flashes gold again, then returns to white about 600ms later — the same as step 2–3.
7. In the console, run `localStorage.setItem('pandaJump.best', '0')`, then reload and clear your very first column of that fresh page load. **Expected:** the callout fires on that very first cleared column too, since a stored best of 0 counts as "overtaken" the moment the score reaches 1.
8. Run `npx playwright test`. **Expected:** every scenario in `features/phaser-4-core-run.feature`, `features/high-score.feature` and `features/new-best-callout.feature` has a passing test.

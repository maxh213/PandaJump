# QA: Panda Jump best-column marker

Use a desktop browser with dev tools. Clear localStorage for the page's origin before step 1 (Application tab → Local Storage → right-click → Clear, or `localStorage.clear()` in the console).

1. In the console, run `localStorage.setItem('pandaJump.best', '3')`, then run `npm ci`, `npm run dev` and open the URL it prints. **Expected:** the run starts as normal, with "Best: 3" bottom-left.
2. Play until your live score is one clear away from beating 3 (i.e. your next cleared column would take the score to 4) and a column is on screen ahead of the panda. **Expected:** a gold (`#ffd700`) "Best" label floats above that column, roughly centred over it and just above its topmost box.
3. Keep playing without dying. **Expected:** the label scrolls left with that same column, staying centred above it and 8px clear of its top box, exactly like the score display or a box texture would.
4. Clear that column so your score reaches 4 (one past the stored best of 3). **Expected:** the "Best" label disappears the moment the score passes 3 — no label shows again for the rest of this run unless you die and restart with the new, higher best.
5. Deliberately touch a column and let the game freeze. **Expected:** the "Best" label is not visible on the game-over or paused screens.
6. Tap to play again, then hide the browser tab (switch tabs) while a column carrying the label is on screen. **Expected:** the game pauses and the "Best" label disappears with everything else; showing the tab again resumes the run and the label reappears if it is still due.
7. In the console, run `localStorage.setItem('pandaJump.best', '0')`, reload, and play a full run (or let the panda die on the first column). **Expected:** the "Best" label never appears at any point in this run, since a stored best of 0 has no column that would "beat" it in the marker's sense.
8. Run `npx playwright test`. **Expected:** every scenario in `features/phaser-4-core-run.feature`, `features/high-score.feature` and `features/best-column-marker.feature` has a passing test.

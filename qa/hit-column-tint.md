# QA: Panda Jump tints the column that killed the panda red on the game-over screen

Use a desktop browser with dev tools.

1. Run `npm ci` then `npm run dev` and open the URL it prints.
2. Play until the score is above 10, then let a double column arrive (a second, trailing column spawns 64 px behind a front column). Run straight into the front column without jumping. **Expected:** the moment the game freezes, the front column's box (or boxes) turn red. The trailing column stays its normal ground texture colour, not red.
3. Reload and die against a single column early in a run (no second column present). **Expected:** that column's box (or boxes) turn red, same as step 2.
4. While a run is still live, watch any box column on screen. **Expected:** no box is ever tinted red before a death — the red tint only appears the instant the game freezes.
5. After a death, wait out the 500ms freeze and tap, click or press Space to restart. **Expected:** the game-over screen and its red box disappear immediately; the panda stands on the floor and no box is on screen.
6. Keep playing after that restart until several new columns have arrived, including one at the same on-screen slot a previously-tinted box used. **Expected:** none of the new run's boxes are red — the red tint never reappears on its own.
7. Repeat step 2 several times in a row (dying, restarting, dying again). **Expected:** every death tints only the column that was actually touched, never a neighbouring column, and every restart clears it.
8. Run `npx playwright test`. **Expected:** every scenario in `features/hit-column-tint.feature` and `features/phaser-4-core-run.feature` has a passing test.

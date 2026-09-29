# QA: Panda Jump on Phaser 4, slice: the game-over rank

Use a desktop browser with dev tools.

1. Run `npm ci` then `npm run dev` and open the URL it prints. In the console run `localStorage.setItem('pandaJump.topScores', '[30,20,10]'); localStorage.setItem('pandaJump.best', '30')` and reload.
2. Start a run, clear a single column and let the panda hit the next one. **Expected:** the score line counts up to "Score: 1", and once the restart prompt appears it reads "Score: 1 (4th best)".
3. Restart and die at once without scoring. **Expected:** the score line reads "Score: 0" with no suffix.
4. Set `pandaJump.topScores` to `[8,5,3]` and `pandaJump.best` to `8`, reload, and finish a run on 6. **Expected:** "Score: 6 (2nd best)" once restart is allowed; runs on 4 and on 3 both read "(3rd best)", since only 8 and 5 are strictly higher.
5. Set `pandaJump.topScores` to `[50,40,30,20,10]` and `pandaJump.best` to `50`, reload, and finish a run on 5. **Expected:** "Score: 5" with no suffix.
6. Set `pandaJump.topScores` to `[3,2]` and `pandaJump.best` to `3`, reload, and finish a run on 4. **Expected:** "Score: 4" with no suffix and the best line reads "New best: 4" in gold. A run that ends on exactly 3 shows no suffix either.
7. While the score counts up after dying (the first half second), **Expected:** the line shows no suffix; it appears only when the restart prompt does.
8. Tap Share or Copy on any game-over screen. **Expected:** the text still reads "I scored N on Panda Jump!" with no rank; the top-left score, tab title and medal are unchanged.
9. Run `npx playwright test`. **Expected:** every scenario in `features/game-over-rank.feature` has a passing test in `e2e/game-over-rank.spec.ts`.

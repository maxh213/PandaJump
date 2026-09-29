# QA: Panda Jump on Phaser 4, slice: the player's five best runs on the start screen

Use a desktop browser with dev tools. Clear localStorage for the page's origin before step 1 (Application tab → Local Storage → right-click → Clear, or `localStorage.clear()` in the console).

1. Run `npm ci` then `npm run dev` and open the URL it prints. **Expected:** the middle of the canvas shows only "Tap or press Space to start"; there is no "Your best runs" heading and no numbered line.
2. Press Space, clear one column, then touch the next one. Wait for the game-over freeze, tap to play again, and this time touch the first column straight away. **Expected:** no list appears on the game-over screen or during either run.
3. Reload the page. **Expected:** "Your best runs" is drawn in white 20px Arial with a black outline above the middle of the canvas, and "1. 1" is drawn under it in white 16px Arial with a black outline. The run that scored 0 is not listed. In Local Storage, `pandaJump.topScores` reads `[1]`.
4. Play several more runs ending on different scores, reloading now and then. **Expected:** after a reload the list shows the scores highest first, equal scores appear more than once, and at most five lines are shown: the five highest.
5. Press Space (or tap) on the start screen. **Expected:** the heading and every line vanish at once, and stay gone during the run, while paused (P), on the game-over screen and after restarting.
6. In the console, run `localStorage.removeItem('pandaJump.topScores')`, keep `pandaJump.best` at a value above 0, then reload. **Expected:** the list shows one line, "1. N", where N is the stored best.
7. In the console, run `localStorage.setItem('pandaJump.topScores', 'not json')`, then reload. **Expected:** the page loads with no console error and the list is again seeded from `pandaJump.best`. Then run `localStorage.setItem('pandaJump.topScores', '["9",0]')` and reload. **Expected:** the same seeded list, with no error.
8. Run `localStorage.clear()` and reload. **Expected:** no list is drawn.
9. In the console, before reloading, run:
    ```js
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } });
    ```
    then reload. **Expected:** the page loads with no list, and you can play, die and restart with no uncaught error from Panda Jump.
10. In the console, run `localStorage.setItem('pandaJump.best', '15'); localStorage.setItem('pandaJump.topScores', '[10,8]')`, then reload. **Expected:** the list reads "1. 15", "2. 10", "3. 8", and `pandaJump.topScores` in Local Storage now reads `[15,10,8]`. Set both keys to `10` and `[10,8]` and reload. **Expected:** the list is unchanged, "1. 10" and "2. 8" only.
11. Start a run and clear a column so the score passes the "Best:" value, then reload the page before the panda dies. **Expected:** "1." in the list shows the same number as "Best:".
12. Check the bottom-left "Best: N" and the `pandaJump.best` key in Local Storage while playing. **Expected:** they behave exactly as described in `qa/high-score.md`.
13. Run `npx playwright test`. **Expected:** every scenario in `features/top-five-runs.feature` has a passing test in `e2e/top-five-runs.spec.ts`, and `features/high-score.feature` still passes.

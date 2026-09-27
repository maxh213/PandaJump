# QA: Panda Jump on Phaser 4, slice 2: the high score

Use a desktop browser with dev tools. Clear localStorage for the page's origin before step 1 (Application tab → Local Storage → right-click → Clear, or `localStorage.clear()` in the console).

1. Run `npm ci` then `npm run dev` and open the URL it prints. **Expected:** below the score, bottom-left near the floor, the page reads "Best: 0" in white 20px text.
2. Open the Application tab and look at Local Storage for the page's origin. **Expected:** no `pandaJump.best` key yet (or it appears once you play, see step 3).
3. Play until your live score passes 0 (clear a single column). **Expected:** the moment the score ticks up, "Best: N" updates to match it too, before you die.
4. Deliberately touch a column, wait for the game-over screen's 500ms freeze to pass, then tap to play again. **Expected:** the run restarts, the score drops back to 0, but "Best: N" keeps the value you reached — it does not reset.
5. Reload the page. **Expected:** "Best: N" shows the same value you reached before reloading, read back from `pandaJump.best` in Local Storage.
6. Play again and reach a lower score than your stored best before dying. **Expected:** "Best: N" is unchanged, and the `pandaJump.best` value in Local Storage is unchanged.
7. Play again and beat your stored best. **Expected:** "Best: N" updates live, and once it does, the `pandaJump.best` value in Local Storage updates to match without needing to die or reload first.
8. In the console, run `localStorage.setItem('pandaJump.best', 'not-a-number')`, then reload. **Expected:** the page reads "Best: 0", the console shows no error, and play still works normally.
9. In the console, run `localStorage.removeItem('pandaJump.best')`, then reload. **Expected:** the page reads "Best: 0" with no error.
10. In the console, before reloading, run:
    ```js
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } });
    ```
    then reload. **Expected:** the page still loads and plays, the console shows no uncaught error from Panda Jump, and "Best: N" reads "Best: 0" and updates live as you play (it just won't survive this particular reload, since storage is blocked for the whole session).
11. Watch the floor scroll for a few seconds with the best text on screen. **Expected:** no seam or flicker in the floor tiles behind or around the "Best: N" text, same as slice 1.
12. Run `npx playwright test`. **Expected:** every scenario in `features/phaser-4-core-run.feature` and `features/high-score.feature` has a passing test.

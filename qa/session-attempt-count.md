# QA: Panda Jump shows the session's attempt count on the game over screen

Use a desktop browser with dev tools.

1. Run `npm ci` then `npm run dev` and open the URL it prints. **Expected:** the console shows no errors.
2. Let the panda run into the first column without jumping. **Expected:** the game over screen shows "Game over", "Score: 0", "Best: 0", "Tap or press Space to play again", and below those a new line reading "Run 1" in white 20px Arial text, none of them overlapping.
3. Watch the screen while the run is live (before any death). **Expected:** "Run 1" is not shown; the run-count text only appears once the game over screen does.
4. Tap or press Space to play again, then let the panda die a second time. **Expected:** the game over screen now reads "Run 2".
5. Die and restart a few more times. **Expected:** the number goes up by exactly one after each restart: "Run 3", "Run 4", and so on.
6. Reload the page. **Expected:** the counter is back to page load; the next death reads "Run 1" again, not the count from before the reload.
7. Open dev tools' Application tab and check Local Storage for the page's origin before and after playing several runs. **Expected:** no new key is added for the attempt count — only `pandaJump.best` is stored, same as before this change.
8. Run `npx playwright test`. **Expected:** every scenario in `features/phaser-4-core-run.feature` and `features/session-attempt-count.feature` has a passing test.

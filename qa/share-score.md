# QA: Panda Jump on Phaser 4, slice: share score from the game-over screen

Use a desktop browser with dev tools. Chrome on Windows/macOS usually has no `navigator.share`, so
step 2 covers that browser as-is; to see the supported path in a browser that does not have it,
run `navigator.share = () => Promise.resolve()` in the console before step 4.

1. Run `npm ci` then `npm run dev` and open the URL it prints. In the console, run
   `typeof navigator.share`. **Expected:** most desktop browsers print `"undefined"`.
2. Play until the panda touches a column, then wait for the game over screen's 500ms freeze to
   pass. **Expected:** the page reads "Game over", "Score: N", "Best: N" and "Tap or press Space to
   play again" as before, but no "Share score" prompt appears anywhere on the screen.
3. Tap or click anywhere on the game-over screen. **Expected:** the run restarts exactly as it did
   before this change.
4. In the console, run `navigator.share = (data) => { console.log(data); return Promise.resolve(); }`,
   then reload the page. Play until the panda touches a column and wait for the 500ms freeze to
   pass. **Expected:** a "Share score" prompt appears under "Tap, press Space or the Up Arrow key to play again", in
   white 20px Arial, only after the freeze has elapsed (not before).
5. Tap or click "Share score". **Expected:** the console logs an object with a `text` field like
   "I scored 3 on Panda Jump!" (matching the score on screen) and a `url` field with the page's
   current URL. The run does not restart: the game over screen, score and best stay exactly as they
   were before the tap.
6. Tap or click elsewhere on the game-over screen (not on "Share score"). **Expected:** the run
   restarts as usual.
7. Run `npx playwright test`. **Expected:** every scenario in `features/phaser-4-core-run.feature`
   and `features/share-score.feature` has a passing test.

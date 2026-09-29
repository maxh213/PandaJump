# QA: Panda Jump on Phaser 4, slice: copy score from the game-over screen

Use a desktop browser with dev tools. Chrome on Windows/macOS usually has no `navigator.share` but
does have `navigator.clipboard.writeText`, so step 2 covers that browser as-is.

1. Run `npm ci` then `npm run dev` and open the URL it prints. In the console, run
   `typeof navigator.share` and `typeof navigator.clipboard?.writeText`. **Expected:** most desktop
   browsers print `"undefined"` then `"function"`.
2. Play until the panda touches a column, then wait for the game over screen's 500ms freeze to
   pass. **Expected:** the page reads "Game over", "Score: N", "Best: N" and "Tap, press Space or the Up Arrow key
   to play again" as before, and a "Copy score" prompt appears in the same spot "Share score" used to,
   in white 20px Arial.
3. Tap or click "Copy score". **Expected:** the clipboard now holds text like
   "I scored 3 on Panda Jump! " (from a score of 10 up, "I scored 20 and earned a Silver medal on Panda Jump! ",
   naming Bronze, Silver, Gold or Platinum) followed by the page's current URL (paste it somewhere to check),
   and the prompt's text changes to "Copied!" in the same spot, colour and size. The run does not
   restart: the game over screen, score and best stay exactly as they were before the tap.
4. Tap or click elsewhere on the game-over screen (not on "Copy score"/"Copied!"). **Expected:** the
   run restarts as usual.
5. Play until the panda touches another column and wait for the freeze to pass. **Expected:** the
   prompt reads "Copy score" again, not "Copied!".
6. In the console, run `Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: () => Promise.reject(new Error("denied")) } })`,
   then reload the page. Play until the panda touches a column and wait for the 500ms freeze to
   pass, then tap "Copy score". **Expected:** the prompt still reads "Copy score" after the tap.
7. In the console, run `Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined })`,
   then reload the page. Play until the panda touches a column and wait for the 500ms freeze to
   pass. **Expected:** no "Share score" or "Copy score" prompt appears anywhere on the screen, only
   "Tap, press Space or the Up Arrow key to play again".
8. Tap or click anywhere on the game-over screen. **Expected:** the run restarts exactly as it did
   before this change.
9. Run `npx playwright test`. **Expected:** every scenario in `features/phaser-4-core-run.feature`,
   `features/share-score.feature` and `features/copy-score.feature` has a passing test.

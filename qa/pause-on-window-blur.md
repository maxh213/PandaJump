# QA: Panda Jump holds a run paused when the browser window loses focus

Use a desktop browser, ideally with a second application or a second monitor to click on.

1. Run `npm ci` then `npm run dev` and open the URL it prints. Let the run start.
2. Click another application, or a window on another monitor, while the game window stays visible.
   **Expected:** the game shows "Paused" centred in white 40px and "Tap, press Space or the Up Arrow
   key to continue" centred in white 16px below it. The panda, the columns and the floor stop
   exactly where they were.
3. Click back on the game window and wait a couple of seconds without touching anything.
   **Expected:** the run stays paused; returning focus does not resume it.
4. Click, tap or press Space or the Up Arrow key. **Expected:** the pause texts disappear and a white
   "3" appears, then "2", then "1", half a second each, with nothing moving and no jump. After that
   the run continues where it stopped.
5. Resume as in step 4 and, while a digit is showing, click another application again.
   **Expected:** the digit disappears and "Paused" is shown again.
6. Press P or Escape during a run. **Expected:** it still pauses and resumes as before. Switch to
   another browser tab and back. **Expected:** the run is paused as before.
7. Let the panda die and wait for "Game over". Click another application and back.
   **Expected:** the game over screen is unchanged, and after about half a second a tap or Space
   restarts the run.
8. Run `npx playwright test`. **Expected:** every scenario in `features/pause-on-window-blur.feature`,
   and the rest of the Playwright suite, has a passing test.

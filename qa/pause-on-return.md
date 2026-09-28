# QA: Panda Jump holds a run paused after the player leaves the tab

Use a desktop browser with dev tools. Chrome and Firefox both let you simulate a hidden tab from
dev tools; alternatively switch to another tab or app for a few seconds and switch back.

1. Run `npm ci` then `npm run dev` and open the URL it prints. Let the run start.
2. Switch to another browser tab (or another app on a phone) for a couple of seconds, then switch
   back. **Expected:** the game shows "Paused" centred in white 40px where "Game over" normally
   appears, and "Tap or press Space to continue" centred in white 20px below it. The panda, the
   columns and the floor are exactly where they were the moment you left.
3. Wait a couple more seconds without touching anything. **Expected:** nothing moves; the run is
   still paused and no column appears even if enough real time has passed for one to have spawned.
4. Click, tap or press Space. **Expected:** both pause texts disappear immediately, the panda does
   not jump, and the run continues exactly where it paused. Keep playing. **Expected:** columns
   keep arriving and the score keeps counting as normal, picking up as if the pause had never
   happened.
5. Let the panda die and wait for "Game over" to appear. Switch away and back again as in step 2.
   **Expected:** the game over screen is unaffected: no "Paused" text appears, "Game over" stays
   on screen, and after about half a second, tapping, clicking or pressing Space restarts the run
   as before.
6. Run `npx playwright test`. **Expected:** every scenario in `features/pause-on-return.feature`,
   and the rest of the Playwright suite, has a passing test.

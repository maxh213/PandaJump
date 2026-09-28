# QA: Panda Jump holds a run paused after the player leaves the tab

Use a desktop browser with dev tools. Chrome and Firefox both let you simulate a hidden tab from
dev tools; alternatively switch to another tab or app for a few seconds and switch back.

1. Run `npm ci` then `npm run dev` and open the URL it prints. Let the run start.
2. Switch to another browser tab (or another app on a phone) for a couple of seconds, then switch
   back. **Expected:** the game shows "Paused" centred in white 40px where "Game over" normally
   appears, and "Tap, press Space or the Up Arrow key to continue" centred in white 16px below it,
   fully on screen with no letters cut off at either edge. The panda, the
   columns and the floor are exactly where they were the moment you left.
3. Wait a couple more seconds without touching anything. **Expected:** nothing moves; the run is
   still paused and no column appears even if enough real time has passed for one to have spawned.
4. Click, tap or press Space. **Expected:** both pause texts disappear immediately and a white "3"
   appears centred at (200, 190) in 40px Arial, in the same spot "Paused" was shown. The panda
   does not jump and nothing on screen moves. About half a second later the digit changes to "2",
   then "1" after another half second, then disappears after a final half second (1500 ms in
   total), all without the panda, the columns or the floor moving. Pressing a control again while
   a digit is showing does nothing: no jump, and the digit keeps counting down from where it was,
   not restarting at "3".
5. Once the digit disappears, the run continues exactly where it paused. Keep playing.
   **Expected:** columns keep arriving and the score keeps counting as normal, picking up as if
   the pause had never happened.
6. Jump so the panda is mid-air, then switch away and back and resume as in steps 2 and 4.
   **Expected:** the panda stays at the same height throughout the countdown and only resumes
   falling or moving once the digit disappears.
7. Let the panda die and wait for "Game over" to appear. Switch away and back again as in step 2.
   **Expected:** the game over screen is unaffected: no "Paused" text and no countdown digit
   appears, "Game over" stays on screen, and after about half a second, tapping, clicking or
   pressing Space restarts the run as before.
8. Run `npx playwright test`. **Expected:** every scenario in `features/pause-on-return.feature`,
   and the rest of the Playwright suite, has a passing test.

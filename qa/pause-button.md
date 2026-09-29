# QA: A player can pause a run with an on-screen "II" button

Use a phone, or a desktop browser with dev tools set to a mobile viewport.

1. Run `npm ci` then `npm run dev` and open the URL it prints. Let the run start. **Expected:** a
   small white "II" appears in the top-right corner of the canvas, fully on screen with no letters
   cut off at the edge.
2. Tap "II". **Expected:** the game shows "Paused" centred in white 40px where "Game over" normally
   appears, and "Tap, press Space or the Up Arrow key to continue" centred in white 16px below it.
   The panda does not jump: it stays exactly where it was the instant before the tap. The "II"
   button itself disappears.
3. Wait a couple of seconds without touching anything. **Expected:** nothing moves; the run is
   still paused and no column appears even if enough real time has passed for one to have spawned.
4. Tap anywhere on the canvas (or press Space). **Expected:** both pause texts disappear
   immediately, the panda does not jump, and a white "3" appears centred at (200, 190) in 40px
   Arial, in the same spot "Paused" was shown, counting down through "2" and "1" every half second
   before disappearing after 1500 ms in total, exactly as `qa/pause-on-return.md` describes.
   Nothing on screen moves during the countdown. Once the digit disappears the run continues
   exactly where it paused, and the "II" button reappears. Keep playing. **Expected:** columns
   keep arriving and the score keeps counting as normal, picking up as if the pause had never
   happened.
5. Let the panda die and wait for "Game over" to appear. **Expected:** the "II" button is gone from
   the screen for as long as the game-over screen shows.
6. Tap anywhere on the game-over screen to restart. **Expected:** once the new run is live, the
   "II" button is back in the top-right corner.
7. Check that pressing P or Escape still pauses and resumes exactly as before, as in
   `qa/pause-key.md`, and that hiding and showing the tab still pauses exactly as before, as in
   `qa/pause-on-return.md`.
8. Reload the page and look at the ready screen before touching anything. **Expected:** "Tap or
   press Space to start" shows and there is no "II" in the top-right corner.
9. Tap the top-right corner, where "II" sits during a run. **Expected:** the run starts like any
   other first tap: the ready prompt disappears, the panda stays on the floor, the game is not
   paused, and the "II" button appears in the top-right corner.
10. Run `npx playwright test`. **Expected:** every scenario in `features/pause-button.feature`, and
   the rest of the Playwright suite, has a passing test.

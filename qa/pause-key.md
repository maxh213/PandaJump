# QA: A player can pause and resume a run on purpose with the P or Escape key

Use a desktop browser and keyboard.

1. Run `npm ci` then `npm run dev` and open the URL it prints. Let the run start.
2. Press P. **Expected:** the game shows "Paused" centred in white 40px where "Game over" normally
   appears, and "Tap or press Space to continue" centred in white 20px below it. The panda, the
   columns and the floor stop exactly where they were.
3. Wait a couple of seconds without touching anything. **Expected:** nothing moves; the run is
   still paused and no column appears even if enough real time has passed for one to have spawned.
4. Press P again. **Expected:** both pause texts disappear immediately, the panda does not jump,
   and a white "3" appears centred at (200, 190) in 40px Arial, in the same spot "Paused" was
   shown, counting down through "2" and "1" every half second before disappearing after 1500 ms
   in total, exactly as `qa/pause-on-return.md` describes. Nothing on screen moves during the
   countdown. Once the digit disappears the run continues exactly where it paused. Keep playing.
   **Expected:** columns keep arriving and the score keeps counting as normal, picking up as if
   the pause had never happened.
5. Press Escape instead of P and repeat steps 2 to 4. **Expected:** the same behaviour in both
   directions: Escape pauses a live run and starts the same countdown on a paused one, without
   jumping.
6. Check that click, tap, Space and the Up Arrow key still start the same countdown on a run that
   was paused with P or Escape, exactly as they do on a run paused by hiding the tab.
7. Let the panda die and wait for "Game over" to appear. Press P, then Escape. **Expected:**
   neither key does anything: no "Paused" text appears, "Game over" stays on screen, and the run
   does not restart. After about half a second, tapping, clicking or pressing Space still restarts
   the run as before.
8. Switch to another browser tab (or another app on a phone) for a couple of seconds during a live
   run, then switch back, as in `qa/pause-on-return.md`. **Expected:** this still pauses the run
   exactly as before; pausing with the P or Escape key has not changed it.
9. Run `npx playwright test`. **Expected:** every scenario in `features/pause-key.feature`, and
   the rest of the Playwright suite, has a passing test.

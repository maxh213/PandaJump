# QA: A player can play Panda Jump with a game controller

Use a desktop browser and a real Xbox, PlayStation or Switch Pro controller (standard mapping).

1. Run `npm ci` then `npm run dev`, connect the controller, open the URL it prints and press any
   controller button so the browser notices it. Let the run start.
2. Press the bottom face button (A on Xbox, Cross on PlayStation, B on Switch Pro). **Expected:**
   the panda jumps exactly as it does for Space. Press it again in mid-air. **Expected:** the panda
   double jumps.
3. Hold the bottom face button down for a couple of seconds. **Expected:** the panda jumps once
   and does not jump again until the button is released and pressed again.
4. Press the Start button (Options on PlayStation, Plus on Switch Pro). **Expected:** the game shows
   "Paused" and everything stops, without a jump. Press Start again. **Expected:** the "3, 2, 1"
   countdown runs and the run continues without a jump.
5. Pause with Start, then press the bottom face button. **Expected:** the same countdown starts.
6. Let the panda die and wait for "Game over". Press the bottom face button straight away.
   **Expected:** nothing happens during the first half second; after that, pressing it restarts the
   run. Press Start on the game-over screen. **Expected:** nothing happens.
7. Press the other buttons and the sticks. **Expected:** nothing happens.
8. Disconnect the controller and play with keyboard, mouse and touch. **Expected:** they behave as
   before.
9. Run `npx playwright test`. **Expected:** every scenario in `features/gamepad-controls.feature`,
   and the rest of the Playwright suite, has a passing test.

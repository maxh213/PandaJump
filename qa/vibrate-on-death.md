# QA: Vibrate the device the instant the panda dies

A real phone with the Vibration API (most Android browsers; iOS Safari does not support it) is
needed to feel the pulse itself. A desktop browser's console can confirm the call is made.

1. Run `npm ci` then `npm run dev` and open the URL it prints on an Android phone (or an Android
   emulator with haptics enabled). **Expected:** the phone buzzes briefly, once, the instant the
   panda touches a column and "Game over" appears — not before, and not repeatedly while the game
   over screen stays up.
2. Stay on the game over screen for a few seconds without tapping. **Expected:** only the one
   buzz from step 1 happens; the phone does not keep buzzing.
3. Tap to play again once the 500ms freeze has passed, then die a second time. **Expected:** a
   second single buzz happens for the new death.
4. Play a run that never dies (e.g. keep clearing columns). **Expected:** the phone never
   vibrates.
5. On a desktop browser, open the console before playing and run:
   ```js
   const calls = [];
   navigator.vibrate = (pattern) => { calls.push(pattern); return true; };
   ```
   Then play until the panda dies. **Expected:** `calls` holds exactly one entry, a short
   millisecond pattern (e.g. `100`).
6. In the console, before reloading, run:
   ```js
   Object.defineProperty(navigator, 'vibrate', { value: undefined, configurable: true });
   ```
   then reload and play until the panda dies. **Expected:** the panda dies normally, "Game over"
   is shown, and the console shows no uncaught error.
7. Run `npx playwright test`. **Expected:** every scenario in `features/vibrate-on-death.feature`,
   and the rest of the Playwright suite, has a passing test.

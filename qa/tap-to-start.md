# QA: Wait for the player's first tap or Space press before the run starts

Use a desktop browser with dev tools, and a phone or touch emulation for step 4. Heights are in px above the floor surface (y 426), as in qa/phaser-4-core-run.md.

1. Run `npm run dev` and open the URL it prints, without touching anything. **Expected:** the panda stands still on the floor, no box column is on screen, the score reads "0", and the page shows "Tap or press Space to start" centred in white 20px under the Best line, in the same spot the "Game over" restart prompt uses. No "Game over" text is visible.
2. Wait 5 seconds without touching anything. **Expected:** nothing moves: the panda stays on the floor, the floor does not scroll, the clouds do not drift, and no column spawns.
3. Press Space. **Expected:** the "Tap or press Space to start" prompt disappears immediately, the panda stays on the floor (this first press does not jump), and about 1.5 s later the first box column enters from the right edge, exactly as it would after a normal run start.
4. Reload the page and tap the canvas on a touch device (or click it with a mouse) instead of pressing Space. **Expected:** the same as step 3: the prompt disappears, the panda does not jump, and a column arrives after about 1.5 s.
5. Reload the page, press Space, then press Space again right away. **Expected:** the first press starts the run (no jump); the second press makes the panda jump about 168 px high, exactly like the very first jump in qa/phaser-4-core-run.md.
6. Reload the page, press Space to start, then jump and press Space again near the top of the jump. **Expected:** a double jump to about 199 px, exactly as qa/phaser-4-core-run.md describes.
7. Reload the page, press Space to start, then do not jump. **Expected:** the panda touches the first column at about 2875 ms and the game-over screen appears, exactly as qa/phaser-4-core-run.md describes. Wait for the restart prompt and press Space to play again. **Expected:** a fresh run starts immediately, at score "0", with no "Tap or press Space to start" screen shown; a new column still arrives about 1.5 s later.
8. Run `npx playwright test`. **Expected:** every scenario in `features/tap-to-start.feature` has a passing test, and every scenario in `features/phaser-4-core-run.feature` and the other existing feature files still passes.

# QA: A tap anywhere on the page jumps, not only a tap on the game canvas

Use a phone or a narrow desktop window so the page shows text below the game.

1. Run `npm ci` then `npm run dev` and open the URL it prints.
2. Tap the "Panda Jump" heading, then the Controls paragraph, then the black area beside and below
   the game. **Expected:** each tap makes the panda jump exactly as a tap on the game does.
3. Tap once on the game, then once more while the panda is in the air. **Expected:** a single tap
   is a single jump; the second tap gives the smaller double jump.
4. Press P, then tap the heading. **Expected:** the "Paused" texts disappear and the 3, 2, 1
   countdown starts; the panda does not jump.
5. Let the panda die. Tap the heading right away. **Expected:** nothing happens. After about half a
   second, tap the heading again. **Expected:** a fresh run starts.
6. Tap the "Github" link. **Expected:** the panda does not jump and the browser opens
   https://github.com/maxh213/PandaJump.
7. Let the panda die, wait for the "Share score" or "Copy score" prompt and tap it.
   **Expected:** it works as before and does not also restart the run.
8. Run `npx playwright test`. **Expected:** every scenario in `features/tap-anywhere.feature`, and
   the rest of the Playwright suite, has a passing test.

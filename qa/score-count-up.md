# QA: Panda Jump on Phaser 4, slice: count the game-over score up from 0 to the final score

Use a desktop browser with dev tools. The count-up lasts only half a second at normal speed, so the
console steps below use `?clock=manual` to walk through it.

1. Run `npm ci` then `npm run dev` and open the URL it prints.
2. Play a few columns, then let the panda hit one. **Expected:** the "Score: N" line on the game-over
   screen ticks up quickly from 0 to your final score, finishing just as the "Tap to play again"
   prompt appears, and never overshoots.
3. Open `./?clock=manual&random=0.25,0.5,0` in the console and run
   `window.pandaJump.run.advance(2895); window.pandaJump.run.view().gameOverScore`. **Expected:**
   `"0"` (a run that dies at score 0 shows 0 at every moment).
4. While the count runs, check the top-left score and the tab title. **Expected:** both show your final
   score at once, and the medal (from 10 points up) shows at once too.
5. After the count reaches your score (500 ms), tap "Share score" or "Copy score". **Expected:** the
   text sent says `I scored <final score> on Panda Jump!`, or `I scored <final score> and earned a <Medal> medal on
   Panda Jump!` from 10 points up.
6. Tap or press Space once the prompt shows. **Expected:** the run restarts exactly as before; there
   is no extra delay, and the new run starts with the game-over score line hidden.
7. Run `npx playwright test`. **Expected:** every scenario in `features/score-count-up.feature`, and
   the rest of the Playwright suite, has a passing test.

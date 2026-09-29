# QA: Panda Jump scatters a few white stars across the dusk sky once the score reaches 60

Use a desktop browser with dev tools.

1. Run `npm ci` then `npm run dev` and open the URL it prints. **Expected:** the console shows no errors and no stars are in the sky.
2. Play to a score of 59. **Expected:** the sky is pale snowfield blue and still no stars are visible.
3. Reach a score of 60. **Expected:** the sky turns grey dusk and 12 small white dots appear at once, all in the upper part of the screen, none near the floor or the columns.
4. Watch the stars while you keep playing. **Expected:** they hold still, sit behind the clouds, the columns and the panda, and never hide the score or best text.
5. Let the panda hit a column. **Expected:** the stars stay in the sky on the game-over screen.
6. Tap to play again. **Expected:** the stars are gone and the sky is day blue.
7. Reload the page and reach 60 again. **Expected:** the stars are at exactly the same places as before.
8. In the console run `window.pandaJump.run.view().stars.length` at a score of 59 and at 60. **Expected:** `0` then `12`.
9. Run `npx playwright test`. **Expected:** every scenario in `features/night-stars.feature`, and every scenario in `features/sky-by-score.feature`, has a passing test.

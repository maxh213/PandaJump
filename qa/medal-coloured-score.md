# QA: Panda Jump colours the live score by medal

Use a desktop browser with dev tools.

1. Run `npm ci` then `npm run dev` and open the URL it prints. **Expected:** the top-left score is white with a black outline.
2. Clear columns up to a score of 9. **Expected:** the score stays white.
3. Clear the 10th column. **Expected:** on the same frame the number becomes 10 it turns bronze (`#cd7f32`), still popping briefly to 1.3x and keeping its black outline and position.
4. Keep going to 20, 30 and 40. **Expected:** the score turns silver (`#c0c0c0`), gold (`#ffd700`) and platinum (`#e5e4e2`) as the number reaches each.
5. Die and restart. **Expected:** the score reads 0 in white again. The game over medal line and disc, "Best: N" and the tab title look as before.
6. Run `npx playwright test`. **Expected:** every scenario in `features/medal-coloured-score.feature` has a passing test.

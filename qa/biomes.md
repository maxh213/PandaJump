# QA: Panda Jump moves the run through a new biome every 20 points

Use a desktop browser with dev tools.

1. Run `npm ci` then `npm run dev` and open the URL it prints. **Expected:** the console shows no errors and the familiar meadow shows: day-blue sky, teal hills, a grass-topped rocky floor and brown dirt columns.
2. Play to a score of 20. **Expected:** the instant the score reaches 20 the sky turns warm orange, the hills sandy brown and the floor sand. Columns that spawn from then on are sand-coloured; columns already on screen finish crossing as they were.
3. Play to a score of 40. **Expected:** a snowfield: pale blue sky, white hills, a snowy floor and ice columns.
4. Play to a score of 60. **Expected:** an industrial biome: grey dusk sky with stars, dark hills, a rocky floor with a metal top edge and metal columns.
5. Keep playing to 80. **Expected:** the meadow returns and the sequence repeats.
6. Read the score and best text in every biome. **Expected:** both stay white with their black outline and easy to read.
7. Die in any biome other than the meadow, then tap to play again. **Expected:** the new run starts in the meadow from the first frame.
8. In the console, run `window.pandaJump.run.view().biome.name` at scores 0, 20, 40, 60 and 80. **Expected:** `"meadow"`, `"desert"`, `"snowfield"`, `"industrial"`, `"meadow"`.
9. Run `npx playwright test`. **Expected:** every scenario in `features/biomes.feature` and `features/sky-by-score.feature` has a passing test.

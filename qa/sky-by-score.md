# QA: Panda Jump changes the sky with the biome at scores 20, 40 and 60

Use a desktop browser with dev tools.

1. Run `npm ci` then `npm run dev` and open the URL it prints. **Expected:** the console shows no errors, and the page background is the familiar light day-blue (`#71c5cf`).
2. Play normally and watch the background as your score climbs past 20. **Expected:** the instant the score reaches 20, the whole background changes to a warm sunset orange (`#f4a261`), with no fade or delay.
3. Keep playing to a score of 40. **Expected:** the instant the score reaches 40, the background changes to a pale snowfield blue (`#a9c9e0`).
4. Keep playing to 60. **Expected:** the instant the score reaches 60, the background changes to a grey dusk (`#4a4e69`). Play on to 80. **Expected:** the day-blue sky returns and the sequence repeats.
5. Read the HUD score and best text at every point in steps 1-4. **Expected:** both stay white and easy to read against every one of these backgrounds.
6. Deliberately touch a column while the sky is sunset, snowfield or dusk, then tap to play again once the freeze passes. **Expected:** the new run's background is day-blue (`#71c5cf`) again from the very first frame.
7. In the console, run `window.pandaJump.run.view().sky` at any point. **Expected:** it reads `"#71c5cf"`, `"#f4a261"`, `"#a9c9e0"` or `"#4a4e69"` matching what the background actually shows.
8. Run `git diff master -- features/phaser-4-core-run.feature features/difficulty-ramp.feature`. **Expected:** nothing prints - neither pinned feature file changed.
9. Run `npx playwright test`. **Expected:** every scenario in `features/sky-by-score.feature`, and every scenario in the two feature files from step 8, has a passing test.

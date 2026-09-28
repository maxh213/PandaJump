# QA: Panda Jump awards a medal on the game-over screen

Use a desktop browser with dev tools.

1. Run `npm ci` then `npm run dev` and open the URL it prints. **Expected:** the console shows no errors.
2. Let the panda run into the first column without jumping. **Expected:** the game over screen shows "Game over", "Score: 0" and "Best: 0" as before, with no medal text anywhere on the screen.
3. Play until you die with a score from 1 to 9 (for example, clear 5 columns then stop jumping). **Expected:** the game over screen still shows no medal text.
4. Play until you die with a score from 10 to 19. **Expected:** between "Game over" and "Score: N", the game over screen now reads "Bronze medal" in a bronze/copper colour (`#cd7f32`), in smaller 16px text, not overlapping either line.
5. Play until you die with a score from 20 to 29. **Expected:** the medal line reads "Silver medal" in a silver-grey colour (`#c0c0c0`).
6. Play until you die with a score from 30 to 39. **Expected:** the medal line reads "Gold medal" in gold (`#ffd700`).
7. Play until you die with a score of 40 or more. **Expected:** the medal line reads "Platinum medal" in a pale platinum colour (`#e5e4e2`).
8. While a run is live (before any death), watch the screen closely. **Expected:** no medal text is ever shown during play, even once your live score has passed 10.
9. From a game over screen showing a medal, tap or press Space to restart, then immediately let the panda die again without scoring. **Expected:** the new game over screen shows no medal text, since this run's score is 0 — the previous run's medal does not carry over.
10. Run `npx playwright test`. **Expected:** every scenario in `features/phaser-4-core-run.feature` and `features/score-medals.feature` has a passing test.

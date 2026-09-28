# QA: Panda Jump outlines every piece of canvas text in black

Use a desktop browser with dev tools.

1. Run `npm ci` then `npm run dev` and open the URL it prints. **Expected:** the console shows no errors, and the score and "Best: 0" text have a black outline against the blue sky.
2. Play until your score reaches 20. **Expected:** the sky turns orange and the gold "Faster!" text appears with a clear black outline, easy to read on the orange.
3. Keep playing to 40. **Expected:** the sky turns dark blue and the score and best text are still crisp with their black outline.
4. Touch a column. **Expected:** the game-over screen text (title, medal, score, best, runs, share and copy lines, and the restart prompt) all have a black outline; the colours, sizes and positions are the same as before.
5. Press P to pause. **Expected:** "Paused" and its prompt have a black outline.
6. Play until you beat your best. **Expected:** the gold "Best" marker on the column and the "New best" callout are outlined too.
7. In the console, run `window.pandaJump.game.scene.getScene("run").children.getByName("score").style.stroke`. **Expected:** `#000000`, and `strokeThickness` reads `4`.
8. Run `npx playwright test`. **Expected:** every scenario in `features/outlined-canvas-text.feature` has a passing test.

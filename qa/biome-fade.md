# QA: Panda Jump crossfades the sky, hills, ground and stars over 3 seconds when entering a new biome

Use a desktop browser with dev tools. The fade is easiest to see under `?clock=manual`.

1. Run `npm ci` then `npm run dev` and open the URL it prints with `?clock=manual&random=` values that let the panda clear columns of 1 box each.
2. Play to a score of 20. **Expected:** on the frame the score becomes 20 the sky is still meadow day-blue `#71c5cf`, the floor is still grass over rock, and desert sand is not yet visible.
3. Advance 1500 ms of game time. **Expected:** the sky is a warm mix of meadow and desert, and desert sand / hills are halfway faded in over the meadow.
4. Advance another 1500 ms. **Expected:** the sky is solid desert `#f4a261`, the floor is sand and the hills are desert-coloured.
5. Play on to score 60. **Expected:** stars are absent on the threshold frame, half-visible after 1500 ms, fully visible after 3000 ms.
6. Reach a score of 20, advance 1500 ms, then press P. Advance more time. **Expected:** the mixed sky and half-faded layers stay frozen while paused.
7. Die mid-fade, wait, then tap to play again. **Expected:** the new run opens on pure meadow with no residual fade.
8. Run `npx playwright test e2e/biome-fade.spec.ts`. **Expected:** every scenario in `features/biome-fade.feature` passes.

# QA: Panda Jump on Phaser 4, slice: the dead panda tumbles to the floor

Use a desktop browser with dev tools. Heights are in px above the floor surface (y 426).

1. Run `npm ci` then `npm run dev` and open the URL it prints.
2. Wait for a two-box column (or any column tall enough to catch the panda mid-jump). Jump once, with no second jump, timed so the panda comes down onto the column's top instead of clearing it (see `qa/phaser-4-core-run.md` step 14 for the timing). **Expected:** instead of freezing upright in mid-air or falling through the boxes, the panda knocks left clear of the column, bounces a little, lands on the floor left of it, and stays there for the rest of the game-over screen.
3. While the panda is mid-tumble on the game-over screen, watch closely. **Expected:** the score, the best text, any box columns on screen and the floor/rock scroll all stay completely still — only the panda's position changes.
4. Watch the panda's sprite as it dies. **Expected:** the instant it dies, the panda flips upside down (its running pose drawn head-down) instead of just freezing right-side up; it stays upside down, still on its frozen running frame (no new animation), for the whole game-over screen.
5. Wait out the game-over screen and tap, click or press Space to restart. **Expected:** the panda flips back right-side up the instant the run restarts, and stands on the floor at its usual position (x 100, feet at y 426) as normal.
6. Deliberately die without ever leaving the ground (don't jump; let the panda run straight into the first column). **Expected:** the panda's feet are at the floor when it dies, it pops up a little from the knockback bounce, then settles back at y 426 while upside down.
7. Repeat step 2, but this time do nothing for the first 499ms after death, then click/tap/press Space. **Expected:** nothing happens — no restart prompt yet, matching the existing 500ms freeze from `qa/phaser-4-core-run.md` step 8. At 500ms the "Tap, press Space or the Up Arrow key to play again" prompt appears (and "Share score" too, on a browser that supports the Web Share API), and only then does an input restart the run.
8. Run `npx playwright test`. **Expected:** every scenario in `features/phaser-4-core-run.feature` and `features/death-tumble.feature` has a passing test.

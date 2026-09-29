# QA: Panda Jump on Phaser 4, slice: squash and stretch

Use a desktop browser with dev tools.

1. Run `npm ci` then `npm run dev` and open the URL it prints. **Expected:** the console shows no errors and the panda stands on the floor at its normal size.
2. Tap or press Space to jump. **Expected:** for a split second the panda looks taller and thinner, then eases back to normal.
3. Watch the panda land. **Expected:** for a split second it looks shorter and wider with its feet on the floor, then eases back to normal.
4. Jump, then double jump in mid-air. **Expected:** the second jump does not stretch the panda.
5. Jump, then press P. **Expected:** the panda holds its shape while paused and carries on easing after the countdown.
6. Run into a column, then restart. **Expected:** the panda is normal size on the game-over screen and after restarting.
7. Run `git diff master -- assets/`. **Expected:** nothing prints.
8. Run `npx playwright test`. **Expected:** every scenario in `features/panda-squash-stretch.feature` has a passing test.

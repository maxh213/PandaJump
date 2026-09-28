# QA: Panda Jump on Phaser 4, slice: the score pop

Use a desktop browser with dev tools.

1. Run `npm ci` then `npm run dev` and open the URL it prints. **Expected:** the score reads "0" top-left in white 30px text, at its normal size.
2. Clear a single column. **Expected:** the instant the score ticks up, the score number visibly grows larger, then eases back down to its normal size over a fraction of a second (about 150ms) — quick enough to read as a "pop", not a bounce or wobble.
3. Watch the score's position while it pops. **Expected:** the number stays anchored at the same top-left spot (it does not shift right or down as it grows), and it stays white Arial throughout.
4. Keep clearing columns one after another. **Expected:** every single column cleared gives its own pop, not just the first.
5. Clear a column, then immediately clear another in quick succession if you can manage it (e.g. two close columns). **Expected:** the second pop restarts the grow-and-shrink from its full size rather than the score looking like it is mid-shrink from the first pop.
6. Deliberately die, wait for the restart prompt, and tap to play again. **Expected:** the score resets to "0" at its normal size, with no pop left over from the previous run.
7. Run `npx playwright test`. **Expected:** every scenario in `features/score-pop.feature` has a passing test.

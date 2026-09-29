# QA: Panda Jump on Phaser 4, slice: bounce off a box on death

Use a desktop browser with dev tools.

1. Run `npm ci` then `npm run dev` and open the URL it prints. **Expected:** the console shows no errors.
2. Die without jumping into the first one-box column. **Expected:** the panda knocks left off the column, pops up a little, lands on the floor in front of it, and a short spark burst flashes at the contact point then fades. The panda flips upside down as usual.
3. Die by coming down onto a two-box column's top. **Expected:** the panda bounces left clear of the boxes instead of falling through them, and settles on the floor left of the column.
4. Watch the burst and the panda's body on a hit. **Expected:** a small star of light strokes expands and fades in about a quarter of a second, and the panda briefly squashes on impact then returns to normal.
5. In DevTools, set prefers-reduced-motion to reduce and die again. **Expected:** the burst still appears and fades but does not grow, the squash is skipped, and the knockback and bounce still happen.
6. Wait out the restart freeze and tap to play again. **Expected:** the panda is upright at x 100 on the floor with no burst.
7. Run `git diff master -- assets/`. **Expected:** nothing prints.
8. Run `npx playwright test`. **Expected:** every scenario in `features/bounce-off-box.feature` has a passing test.

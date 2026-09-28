# QA: Panda Jump on Phaser 4, slice: the double-jump puff

Use a desktop browser with dev tools.

1. Run `npm ci` then `npm run dev` and open the URL it prints. **Expected:** the console shows no errors.
2. Tap or press Space once to jump from the floor, and do not press again. **Expected:** the panda rises and falls back to the floor with no white circle appearing under it at any point.
3. Tap or press Space to jump, then tap again while the panda is still in the air (the double jump). **Expected:** the instant the second tap lands, a small white circle appears right where the panda's feet were at that moment.
4. Keep watching without tapping again. **Expected:** the white circle fades out smoothly over about a quarter of a second, then disappears, while the panda keeps rising away from it, leaving the circle behind at the point where the double jump fired.
5. While the circle is still fading, tap a third time. **Expected:** nothing happens (the air jump is already used) and no second circle appears; the first circle keeps fading on the same schedule as before.
6. Land, then jump and double jump again. **Expected:** the puff appears again, in the same way, every time the double jump fires.
7. Run `git diff master -- assets/`. **Expected:** nothing prints — no asset was added, edited, moved or removed.
8. Run `npx playwright test`. **Expected:** every scenario in `features/double-jump-puff.feature` and `features/phaser-4-core-run.feature` has a passing test.

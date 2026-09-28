# QA: Panda Jump on Phaser 4, slice: the landing dust puff

Use a desktop browser with dev tools.

1. Run `npm ci` then `npm run dev` and open the URL it prints. **Expected:** the console shows no errors.
2. Tap or press Space once and watch the panda in the air. **Expected:** no dust appears under it while it is airborne.
3. Watch the panda touch down. **Expected:** the instant it lands, two small sand-coloured circles appear on the floor just left and right of its feet.
4. Keep watching. **Expected:** the circles fade out smoothly over about a fifth of a second, then disappear.
5. Jump and land repeatedly. **Expected:** the dust appears every time the panda lands.
6. Hit a column in mid-air and watch the panda fall. **Expected:** no dust appears when it reaches the floor, and none after you restart.
7. Double jump. **Expected:** the white air puff still appears as before.
8. Run `git diff master -- assets/`. **Expected:** nothing prints.
9. Run `npx playwright test`. **Expected:** every scenario in `features/landing-dust.feature` has a passing test.

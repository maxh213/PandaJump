# QA: Panda Jump on Phaser 4, slice: the airborne pose

Use a desktop browser with dev tools.

1. Run `npm ci` then `npm run dev` and open the URL it prints. **Expected:** the console shows no errors.
2. Watch the panda run along the floor. **Expected:** its legs cycle through the running frames.
3. Tap or press Space to jump. **Expected:** the instant the panda leaves the floor its legs stop and it holds one still pose until it lands.
4. Jump and double jump. **Expected:** the panda keeps that same still pose through both jumps.
5. Watch the panda land. **Expected:** the legs start running again straight away.
6. Jump, then press P mid-air. **Expected:** the paused panda looks as it did before this change.
7. Run into a box. **Expected:** the upside-down game-over panda looks as it did before this change.
8. Run `git diff master -- assets/`. **Expected:** nothing prints — no asset was added, edited, moved or removed.
9. Run `npx playwright test`. **Expected:** every scenario in `features/airborne-pose.feature` has a passing test.

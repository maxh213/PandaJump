# QA: Panda Jump box columns draw from a small set of ground textures

Use a desktop browser with dev tools.

1. Run `npm ci` then `npm run dev` and open the URL it prints. **Expected:** the console shows no errors.
2. Watch several box columns arrive from the right over 10-15 seconds. **Expected:** columns are not all the same texture; alongside the familiar dirt blocks you also see icy, metallic, sandy and snowy-looking columns from `assets/ice_06.png`, `assets/metal_06.png`, `assets/sand_06.png` and `assets/snow_06.png`.
3. Look closely at any column with two stacked boxes. **Expected:** both boxes in that column always match — never a dirt box under an ice box, for example.
4. Play past a score of 10 and watch for a second column trailing close behind a front column. **Expected:** the trailing column always matches the front column's texture — never a dirt column trailed by an ice column, for example.
5. Reload the page a few times and watch the first several columns. **Expected:** the columns keep arriving at the same steady rate and still behave exactly as before (height, second columns, scoring, collisions) — only the look of the boxes changed.
6. Open the page twice with the same query, e.g. `?clock=manual&random=0.25,0.5,0,0.25,0.5,0.2,0.25,0.5,0.4,0.25,0.5,0.6,0.25,0.5,0.8`, and in the console of each tab run `window.pandaJump.run.advance(1600); window.pandaJump.run.view().boxes`. **Expected:** both tabs print the identical array of box positions and textures.
7. Run `git diff master -- assets/`. **Expected:** nothing prints — no asset was added, edited, moved or removed.
8. Run `npx playwright test`. **Expected:** every scenario in `features/box-column-textures.feature` and `features/phaser-4-core-run.feature` has a passing test.

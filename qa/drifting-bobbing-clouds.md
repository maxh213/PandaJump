# QA: Panda Jump on Phaser 4, slice 3: drifting, bobbing clouds

Use a desktop browser with dev tools. Heights are in px from the top of the canvas (y 0 to y 200 is where clouds draw).

1. Run `npm ci` then `npm run dev` and open the URL it prints. **Expected:** the console shows no errors, and above the floor and boxes you can see soft clouds in the sky.
2. Watch the sky for a few seconds without touching anything. **Expected:** clouds drift steadily left, each gently bobbing up and down; they never go below roughly the upper half of the canvas (well above the floor and any boxes).
3. Watch a cloud reach the left edge and fully disappear. **Expected:** a new cloud enters from the right edge shortly after, and there are always 3 clouds visible (never more, never fewer, aside from the instant one leaves and another enters).
4. Look at the clouds' shapes. **Expected:** two distinct cloud images are used (`assets/cloud_02.png` and `assets/cloud_05.png`), and every cloud is drawn behind the floor, the boxes, the panda and the score text — never on top of them, even when a cloud's position overlaps the score in the top-left corner.
5. Play a normal run: jump over columns, let the panda die, watch the score. **Expected:** the clouds never change what happens when the panda touches a column or clears one; the run behaves exactly as it did before clouds were added.
6. Open the page twice with the same query, e.g. `?clock=manual&random=0,0.5,1`, and in the console of each tab run `window.pandaJump.run.advance(5000); window.pandaJump.run.view().clouds`. **Expected:** both tabs print the identical array of cloud positions and textures.
7. Run `npx playwright test`. **Expected:** every scenario in `features/drifting-bobbing-clouds.feature` and `features/phaser-4-core-run.feature` has a passing test.

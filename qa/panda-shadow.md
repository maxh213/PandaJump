# QA: Panda Jump on Phaser 4, slice: the ground shadow

Use a desktop browser with dev tools.

1. Run `npm ci` then `npm run dev` and open the URL it prints. **Expected:** the console shows no errors, and a soft dark oval sits on the floor line directly under the panda.
2. Tap or press Space to jump with no column under the panda. **Expected:** the oval stays on the floor while the panda rises, and it gets smaller the higher the panda goes, reaching about half its size as the panda climbs 168 px above the floor.
3. Let the panda fall back down. **Expected:** the oval grows back to full size as the panda lands.
4. Jump over a box column. **Expected:** the moment the oval's centre sits over the column, the oval snaps up onto the top of that column (one box: just above the single box; two boxes: on the upper box). It snaps back to the floor when the column scrolls past. No tween between those heights.
5. While the oval is on a box top, look at the top face of the column and at the floor under the panda. **Expected:** the top of the box looks darkened by the oval; the floor under the panda is not.
6. Double jump. **Expected:** the oval never gets smaller than about half its size, however high the panda goes above the surface it sits on.
7. Look closely at the panda standing on the floor. **Expected:** the oval is drawn over the grass and rock floor and under the panda, never over the panda.
8. Jump, then press P. **Expected:** the oval stays on screen at the size it had when the game paused.
9. Run into a column. **Expected:** the oval is still shown under the panda on the game over screen.
10. Run `git diff master -- assets/`. **Expected:** nothing prints — no asset was added, edited, moved or removed.
11. Run `npx playwright test`. **Expected:** every scenario in `features/panda-shadow.feature` has a passing test.

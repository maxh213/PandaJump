# QA: Panda Jump on Phaser 4, slice: the ground shadow

Use a desktop browser with dev tools.

1. Run `npm ci` then `npm run dev` and open the URL it prints. **Expected:** the console shows no errors, and a soft dark oval sits on the floor line directly under the panda.
2. Tap or press Space to jump. **Expected:** the oval stays on the floor while the panda rises, and it gets smaller the higher the panda goes, reaching about half its size at the top of the jump.
3. Let the panda fall back down. **Expected:** the oval grows back to full size as the panda lands.
4. Double jump. **Expected:** the oval never gets smaller than about half its size, however high the panda goes.
5. Look closely at the panda standing on the floor. **Expected:** the oval is drawn over the grass and rock floor and under the panda, never over the panda.
6. Jump, then press P. **Expected:** the oval stays on screen at the size it had when the game paused.
7. Run into a column. **Expected:** the oval is still shown on the floor under the panda on the game over screen.
8. Run `git diff master -- assets/`. **Expected:** nothing prints — no asset was added, edited, moved or removed.
9. Run `npx playwright test`. **Expected:** every scenario in `features/panda-shadow.feature` has a passing test.

# QA: Panda Jump on Phaser 4, slice: flash the screen white for an instant when the panda hits a column

Use a desktop browser with dev tools. Playing at normal speed the flash lasts only 200ms, so slow
motion or frame-stepping helps you see it; the console steps below use `?clock=manual` to see it frame
by frame instead.

1. Run `npm ci` then `npm run dev` and open the URL it prints.
2. Play normally and let the panda hit a column. **Expected:** at the instant of impact, the whole
   screen flashes white for a fraction of a second, then fades away quickly, before the "Game over"
   text and score appear. You can tell immediately that you died, without having to notice the "Game
   over" text first.
3. Open `./?clock=manual&random=0.25,0.5,0` in the console and run
   `window.pandaJump.run.advance(2880); window.pandaJump.run.view().deathFlash`. **Expected:** a
   number around 0.5–0.6 (the flash is near its peak just after death).
4. Keep calling `window.pandaJump.run.advance(50); window.pandaJump.run.view().deathFlash` a few more
   times. **Expected:** the number falls smoothly towards 0 and reaches exactly 0 once about 200ms
   have passed since the panda died, then stays 0 no matter how many more times you call `advance`.
5. In the console, run `window.pandaJump.game.scene.getScene('run').children.getByName('deathFlash')`.
   **Expected:** an object with `displayWidth` 400, `displayHeight` 490, `x` 0, `y` 0 and `fillColor`
   `0xffffff` — the rectangle covers the whole canvas and is pure white.
6. With the game over screen showing (500ms after death), tap or press Space. **Expected:** the run
   restarts exactly as before this change: score resets to 0, the panda stands on the floor, and no
   trace of the flash is visible in the new run.
7. If `navigator.share` is available (or after running
   `navigator.share = (data) => { console.log(data); return Promise.resolve(); }` in the console and
   reloading), let the panda die, wait for the 500ms freeze, then tap "Share score". **Expected:** the
   share prompt fires exactly as it did before this change and the run does not restart; the white
   flash never intercepts the tap.
8. Run `npx playwright test`. **Expected:** every scenario in `features/death-flash.feature`, and the
   rest of the Playwright suite, has a passing test.

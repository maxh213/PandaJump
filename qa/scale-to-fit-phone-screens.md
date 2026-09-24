# QA: Scale the game to fit phone screens

Use a desktop browser with dev tools' device toolbar, and a real phone or touch emulation for steps 4-5.

1. Run `npm ci` then `npm run dev` and open the URL it prints with a desktop-width window (e.g. 1024 px). **Expected:** the game canvas is 400x490 px and centred, exactly as before this change; no visible scaling artefact.
2. Open dev tools' device toolbar and pick a narrow phone (e.g. 375x667 px, "iPhone SE"). **Expected:** the whole canvas is visible, scaled down and centred horizontally; the page has no horizontal scrollbar and nothing is cropped.
3. Resize the browser window from wide to narrow and back. **Expected:** the canvas smoothly rescales and stays centred; it never exceeds 400x490 px even in a very wide window.
4. On the narrow phone emulation (or a real phone), tap the canvas. **Expected:** the panda jumps, exactly as a click does on desktop; the page does not scroll or pinch-zoom.
5. On the narrow phone emulation, try to drag or pinch on the canvas. **Expected:** the page does not pan or zoom; only the game responds.
6. View page source. **Expected:** `<head>` has a `viewport` meta tag with `width=device-width` and disables user scaling.
7. Run `npx playwright test`. **Expected:** every scenario in `features/scale-to-fit-phone-screens.feature`, and every scenario in `features/phaser-4-core-run.feature`, has a passing test.

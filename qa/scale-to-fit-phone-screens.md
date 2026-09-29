# QA: Scale the game to fit phone screens

Use a desktop browser with dev tools' device toolbar, and a real phone or touch emulation for steps 4-5.

1. Run `npm ci` then `npm run dev` and open the URL it prints with a desktop-width window (e.g. 1024 px). **Expected:** the game canvas is 400x490 px and centred, exactly as before this change, with the "Panda Jump" title above it; no visible scaling artefact.
2. Open dev tools' device toolbar and pick a narrow phone (e.g. 375x667 px, "iPhone SE"). **Expected:** the whole canvas is visible at load without scrolling, at least 370 px wide and centred horizontally; the title, controls and GitHub link are below it, reachable by scrolling; the page has no horizontal scrollbar and nothing is cropped.
3. Resize the browser window from wide to narrow and back. **Expected:** the canvas smoothly rescales and stays centred; it never exceeds 400x490 px in a window tall enough to show the title and text alongside it (in a short window it fills the viewport instead, see 3a), and it returns to exactly 400x490 px once the window is wide again, even after having been shrunk.
3a. Switch the device toolbar to a short landscape phone size (e.g. 667x375 px). **Expected:** the canvas fills the viewport (at least 360 px tall), floor and panda included, fully visible at load without scrolling and with no horizontal scrollbar. The title, controls line and GitHub link are below it, reachable by scrolling.
4. On the narrow phone emulation (or a real phone), tap the canvas. **Expected:** the panda jumps, exactly as a click does on desktop; the page does not scroll or pinch-zoom.
5. On the narrow phone emulation, try to drag or pinch on the canvas. **Expected:** the page does not pan or zoom; only the game responds.
6. View page source. **Expected:** `<head>` has a `viewport` meta tag with `width=device-width` and disables user scaling.
7. On an iPhone with a notch, add the game to the home screen and open it from there. **Expected:** the score at the top-left and the "II" pause button at the top-right sit below the status bar and notch, not under them, and the whole canvas is visible without scrolling.
7a. In Playwright (or with an injected `body { padding-top: 47px; }` style) at a short 390 by 500 px viewport. **Expected:** the canvas starts at least 47 px from the top and its bottom edge stays within 500 px with no page scroll — proving the fit also shrinks the canvas for the inset, not only pads it.
7b. With an injected `body { padding-left: 47px; padding-right: 47px; }` style at 390 by 844 px. **Expected:** the canvas is no wider than 296 px and the page has no horizontal scrollbar.
8. View page source. **Expected:** the `viewport` meta tag also contains `viewport-fit=cover`, and the `apple-mobile-web-app-status-bar-style` meta tag is still `black-translucent`.
9. Run `npx playwright test`. **Expected:** every scenario in `features/scale-to-fit-phone-screens.feature`, and every scenario in `features/phaser-4-core-run.feature`, has a passing test.

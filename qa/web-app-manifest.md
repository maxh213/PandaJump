# QA: Panda Jump advertises itself with a web app manifest

Use an Android phone with Chrome, or desktop Chrome's device toolbar plus dev tools' Application panel.

1. Run `npm ci` then `npm run dev` and open the URL it prints. **Expected:** the console shows no errors.
2. View page source. **Expected:** `<head>` has `<link rel="manifest" href="manifest.json">` and `<meta name="theme-color" content="#000000">`.
3. Open dev tools' Application panel and select "Manifest". **Expected:** it shows name and short name "Panda Jump", start URL set, display "standalone", background and theme colour both black, and a square icon that renders a single Panda frame (not a broken image icon, and not the tall, squashed sprite sheet).
4. Fetch the manifest directly, e.g. open `http://localhost:5180/manifest.json` in a new tab. **Expected:** the browser shows formatted JSON with `name`, `short_name`, `start_url`, `display`, `background_color`, `theme_color` and an `icons` entry pointing at `icon.png` with `sizes` "192x192".
5. Open `http://localhost:5180/icon.png` directly. **Expected:** the browser shows a square image of a single Panda pose, not a 404 and not a narrow vertical strip.
6. On an Android phone with Chrome, open the deployed page and use the "Add to Home Screen" menu item. **Expected:** the install prompt shows a square Panda icon and the name "Panda Jump", not a generic icon, a distorted smear, or the raw URL; the installed shortcut opens in its own standalone window instead of a browser tab.
7. Run `git diff master -- assets/`. **Expected:** nothing prints — no asset was added, edited, moved or removed.
8. Run `npm run build`, then inspect `dist/manifest.json`. **Expected:** it sits at `dist/manifest.json` (not hashed into `dist/assets/`), and its `icons[0].src` still names `icon.png`, which the build keeps unhashed at `dist/icon.png`, so it resolves once deployed.
9. Run `npx playwright test`. **Expected:** every scenario in `features/web-app-manifest.feature` passes, and `features/phaser-4-core-run.feature`'s "The production build runs from a plain file host" scenario (which serves `dist/` from the deployed `/PandaJump/` path prefix) also checks the manifest's icon and start_url.
10. Back in dev tools' Application panel, look at the "Manifest" icon's mask previews (circle, squircle, rounded square). **Expected:** `icons[0]` shows `"purpose": "maskable"`, and none of the mask shapes clip the panda's ears or feet, because the artwork sits well inside the centred safe zone the masks reveal.

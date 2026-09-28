# QA: Panda Jump advertises itself with a web app manifest

Use an Android phone with Chrome, or desktop Chrome's device toolbar plus dev tools' Application panel.

1. Run `npm ci` then `npm run dev` and open the URL it prints. **Expected:** the console shows no errors.
2. View page source. **Expected:** `<head>` has `<link rel="manifest" href="manifest.json">` and `<meta name="theme-color" content="#000000">`.
3. Open dev tools' Application panel and select "Manifest". **Expected:** it shows name and short name "Panda Jump", start URL set, display "standalone", background and theme colour both black, and an icon that renders the Panda sprite (not a broken image icon).
4. Fetch the manifest directly, e.g. open `http://localhost:5180/manifest.json` in a new tab. **Expected:** the browser shows formatted JSON with `name`, `short_name`, `start_url`, `display`, `background_color`, `theme_color` and an `icons` entry pointing at `assets/Panda.png`.
5. Open `http://localhost:5180/assets/Panda.png` directly. **Expected:** the browser shows the Panda image, not a 404.
6. On an Android phone with Chrome, open the deployed page and use the "Add to Home Screen" menu item. **Expected:** the install prompt shows the Panda icon and the name "Panda Jump", not a generic icon and the raw URL; the installed shortcut opens in its own standalone window instead of a browser tab.
7. Run `git diff master -- assets/`. **Expected:** nothing prints — no asset was added, edited, moved or removed.
8. Run `npx playwright test`. **Expected:** every scenario in `features/web-app-manifest.feature` has a passing test.

# QA: Sans-serif fallback for the page font

1. Open `css/style.css`. **Expected:** both the `h1` and `p` rules declare `font: 100 1em/1.5em 'Lato', sans-serif`, listing a generic `sans-serif` fallback after `'Lato'`.
2. Run `npm run dev`, open the URL it prints, then block the request to `fonts.googleapis.com` (e.g. dev tools' network request blocking) and reload. **Expected:** the title and paragraph text render in the browser's default sans-serif font, not serif.
3. Run `npx playwright test`. **Expected:** every scenario in `features/sans-serif-font-fallback.feature` has a passing test, and the rest of the suite (including `features/phaser-4-core-run.feature`) still passes.

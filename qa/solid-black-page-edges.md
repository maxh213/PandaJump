# QA: Panda Jump reads solid black edge-to-edge

Use a desktop browser with dev tools' device toolbar.

1. Run `npm ci` then `npm run dev` and open the URL it prints.
2. Open dev tools' device toolbar and pick a phone size (e.g. 375x812, "iPhone X"). **Expected:** no light-coloured strip is visible around any edge of the page; the page reads solid black right up to all four corners.
3. With the device toolbar still open, set a custom size that is much taller than the page's content, e.g. 1024x1400. **Expected:** the page still reads solid black all the way to the bottom of the viewport; there is no light-coloured band below the "Controls" paragraph.
4. In the console, run `getComputedStyle(document.body).marginTop`. **Expected:** it reads "0px".
5. In the console, run `getComputedStyle(document.documentElement).backgroundColor` and `getComputedStyle(document.body).backgroundColor`. **Expected:** both read `rgb(0, 0, 0)`.
6. Run `npx playwright test`. **Expected:** every scenario in `features/solid-black-page-edges.feature`, and the rest of the Playwright suite, has a passing test.

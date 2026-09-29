# QA: Panda Jump blocks the page's pull-to-refresh gesture

Use a desktop browser with dev tools, and ideally an Android Chrome phone.

1. Run `npm ci` then `npm run dev` and open the URL it prints.
2. In the console, run `getComputedStyle(document.documentElement).overscrollBehaviorY` and `getComputedStyle(document.body).overscrollBehaviorY`. **Expected:** both read something other than `"auto"` (e.g. `"contain"`).
3. On an Android Chrome phone (or dev tools' device emulation with touch enabled), open the page and drag down from near the very top of the screen. **Expected:** the page does not show the pull-to-refresh spinner and does not reload.
4. Open dev tools' device toolbar and pick a phone size (e.g. 375x812, "iPhone X"). **Expected:** no light-coloured strip is visible around any edge of the page; the page still reads solid black right up to the two bottom corners (the game fills the top of a phone screen), matching `qa/solid-black-page-edges.md`.
5. Run `npx playwright test`. **Expected:** every scenario in `features/disable-pull-to-refresh.feature`, and the rest of the Playwright suite including `features/solid-black-page-edges.feature`, has a passing test.

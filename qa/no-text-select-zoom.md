# QA: Double-taps outside the game canvas do not select page text or zoom the page

Use a desktop browser first, then an iPhone or iPad if you have one.

1. Run `npm ci` then `npm run dev` and open the URL it prints. Start a run.
2. Double-click the "Panda Jump" heading, then the Controls paragraph. **Expected:** no text is
   highlighted, and the second click gives the panda its double jump.
3. On a phone, quickly double-tap the heading, the Controls text and the black area. **Expected:**
   the page does not zoom, and no text is selected or offered a copy/look-up callout.
4. On a phone, drag a finger on the page outside the game. **Expected:** the page still scrolls
   when it is taller than the screen.
5. Tap the "Github" link. **Expected:** the panda does not jump and the browser opens
   https://github.com/maxh213/PandaJump.
6. Run `npx playwright test`. **Expected:** every scenario in `features/no-text-select-zoom.feature`,
   and the rest of the Playwright suite, has a passing test.

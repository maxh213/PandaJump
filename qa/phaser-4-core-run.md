# QA: Panda Jump on Phaser 4, slice 1

Use a desktop browser with dev tools, and a phone or touch emulation for step 9. Heights are in px above the floor surface (y 426).

1. Run `git ls-files main.js phaser.min.js` and `git diff master -- assets/`. **Expected:** both print nothing: the old game is gone and no asset changed.
2. Run `npm ci` then `npm run dev` and open the URL it prints. **Expected:** the page title and heading read "Panda Jump"; below the 400×490 game the page reads "Check it out on Github" (link to https://github.com/maxh213/PandaJump) and "Controls: Click/touch to jump (you can double jump)".
3. Open the Network tab and reload. **Expected:** the Lato font loads over `https://`; no request uses `http://`; nothing requests `main.js` or `phaser.min.js`; the console shows no errors.
4. Look at the game without touching anything. **Expected:** light blue `#71c5cf` background; score "0" in white at the top left; the panda stands on the floor near the left (left edge at x 100) and plays a looping run animation.
5. Pause the animation in dev tools or record the screen and step through a full run cycle. **Expected:** each of the 6 frames shows the whole panda with no sliver of another pose along its top or bottom edge.
6. Watch the floor for 10 seconds. **Expected:** rock with grass on top scrolls left steadily; no blue gap, seam or flicker between tiles.
7. Wait about 1.5 s after load. **Expected:** a column of 1 or 2 dirt boxes enters from the right edge, sitting on the floor, and moves left at the floor's speed. A new column follows every 1.5 s.
8. Do not jump. **Expected:** when the panda touches the first column the run restarts at once: score "0", no boxes on screen, panda back at x 100 on the floor; the next column enters about 1.5 s later.
9. Tap the canvas on a touch device, click it with a mouse, and press Space with the page focused. Then make the window short (e.g. 800×500) so the page scrolls, scroll to the top and press Space. **Expected:** each makes the panda jump about 168 px high and land again; Space does not scroll the page.
10. Jump, then press Space again near the top of the jump. **Expected:** the panda gets a smaller second boost to about 199 px high.
11. Jump, jump again in the air, then press Space a third time before landing. **Expected:** the third press does nothing. After landing, a jump and a double jump both work again.
12. Jump over a one-box column. **Expected:** the score stays at its value while the column is beside or under the panda and goes up by exactly 1 as the column's right edge passes the panda's left edge; it does not rise again for that column, and a column appearing on the right never changes the score.
13. Clear a two-box column using a double jump. **Expected:** the score goes up by exactly 1.
14. Wait for a two-box column. Jump once, with no second jump, when the column's left edge is about 130 px (roughly five panda widths) ahead of the panda's front; anything from about 85 to 170 px works. **Expected:** the panda rises above the column and the run restarts at score "0" as it comes down onto the column's top.
15. Die three times in a row, then watch 4 s. **Expected:** after each restart no old box remains, and columns still arrive one every 1.5 s, never two at once from the right edge while the score is 10 or less.
16. Play until the score is above 10 and watch 15 columns. **Expected:** some columns (about a third) arrive with an identical column directly behind them; clearing such a pair adds exactly 1.
17. Stop the dev server. Run `npm run build`, then serve `dist/` from a subfolder, e.g. `mkdir -p /tmp/host/PandaJump && cp -r dist/. /tmp/host/PandaJump && npx serve /tmp/host`, and open `/PandaJump/`. **Expected:** the same page and game as step 4, every asset loads with status 200, and steps 7–9 behave the same.
18. Run `npx playwright test`. **Expected:** every scenario in `features/phaser-4-core-run.feature` has a passing test.

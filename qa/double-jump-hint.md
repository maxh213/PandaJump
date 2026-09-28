# QA: Panda Jump tells a first-time player on the canvas that they can tap again in mid-air to double jump

Use a desktop browser with dev tools.

1. Open the game in a fresh profile or run `localStorage.clear()` in the console and reload. **Expected:** white "Tap again in mid-air to double jump" text shows centred a little above the middle of the canvas as soon as the page loads.
2. Tap or press Space once to jump off the floor. **Expected:** the hint stays visible.
3. Tap or press Space again in mid-air. **Expected:** the hint disappears immediately.
4. Die and restart, several times. **Expected:** the hint never comes back.
5. Reload the page, then only ever jump from the floor. **Expected:** the hint shows again, and hides when your score reaches 3. After you die and restart, it shows again at score 0.
6. While the hint is showing, press P, then press Space to resume. **Expected:** the hint is hidden on the "Paused" screen and during the 3-2-1 countdown, and returns after it. It is also hidden on the "Game over" screen.
7. Run `localStorage.setItem("pandaJump.best", "1")` and reload. **Expected:** the hint never appears.
8. In the console, `window.pandaJump.run.view().doubleJumpHint` reads `true` exactly while the hint is visible.
9. Run `npx playwright test`. **Expected:** every scenario in `features/double-jump-hint.feature` has a passing test.

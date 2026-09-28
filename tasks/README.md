# Writing tasks

One task is one pipeline run: specifier, critic, coder, cleaner, architect, hardener, QA. Write it so that run ends with something a user could do that they could not do before.

- **Slice vertically.** Name the user and the outcome: "a donor gives 50 zł by card through the new widget". Reach every layer that outcome needs and no wider. "Build the amounts component" is a layer, not a task.
- **Keep it thin.** One payment method, one variant, one route. The next slice adds the next one. If the task needs a list of sub-features, it is several tasks.
- **Say what must not change.** Existing routes, contracts, and behaviour the slice touches. The specifier pins these in scenarios.
- **Give the values.** Amounts, currencies, error messages, locales. Concrete values become concrete scenarios.
- **Put the rules in the gate, not the task.** Coverage, complexity, comments, and Sonar are already enforced. Mention a rule only when this task needs a different one.
- **Refactors are the exception.** A task that changes no behaviour says so in the first line and freezes everything; the critic will not demand a user-visible outcome.
- **Order slices in a file** when several belong together, and run them one after another; the architect reshapes modules between them.

Name files `NNN-short-name.md`. The specifier writes `features/short-name.feature` and `qa/short-name.md` to match.

## The order they run in

Panda Jump moves from Phaser 1.1.5 (2014, `main.js` and a copied-in `phaser.min.js`) to Phaser 4 on Vite and TypeScript.

| Task | Delivers |
|---|---|
| 001 | the panda runs, jumps and double jumps over box columns, dies and restarts, with a live score |
| 002 | the high score, kept across visits and shown bottom-left |

All of the above have shipped, along with these slices that had no task file written (one per line, so adding one never conflicts with another):

- Clouds drifting and bobbing
- The game scaling to fit phone screens
- A game over screen replacing the instant restart
- Box columns drawing from different ground textures
- A web app manifest so Android/Chrome's "Add to Home Screen" shows the Panda icon and name
- Apple-mobile-web-app-capable meta tags so iOS's "Add to Home Screen" opens the game standalone without Safari's address bar or tab bar
- The favicon
- The apple-touch-icon
- The meta description and Open Graph tags
- Twitter/X Card meta tags so links to the game preview with its title, description and icon
- The lang attribute on `<html>`
- The Space key jump and restart controls
- The build published to GitHub Pages
- A 512x512 'any'-purpose manifest icon alongside the maskable one for full PWA installability
- The Android adaptive-icon safe-zone padding on the home-screen icon so the adaptive mask doesn't clip the panda
- A sans-serif fallback for the page's Lato font so a failed Google Fonts load doesn't switch the page to serif text
- Removing the default body margin so the page reads solid black edge-to-edge with no light-coloured border or gap
- Preconnecting the Google Fonts origins (fonts.googleapis.com and fonts.gstatic.com) so the page font loads faster
- A gold callout on the bottom-left best text for 600ms the instant a run's live score first overtakes the stored best
- A "New best" label in gold on the game-over screen's best line when the run that just ended overtook the stored best
- Containing vertical overscroll on `html` and `body` so a drag near the top of the page can't trigger the browser's pull-to-refresh reload
- A "Share score" prompt on the game-over screen that uses the browser's Web Share API to share the run's score and the page URL
- A difficulty ramp that steps the floor and column speed up from 200 px/s to a 300 px/s cap as the score climbs past 20, so a long run feels harder than the first few columns
- Holding a run paused with a "Paused" screen the instant the tab is hidden, until the player taps or presses Space, which starts a 1500ms 3-2-1 countdown, frozen like the pause itself, before the run continues moving
- A generated service worker that precaches the built app shell so the installed PWA opens and plays offline, with its cache name tied to the build output so a redeploy replaces it on the next visit
- Letting a panda that dies in mid-air keep falling under gravity until it lands, flipped upside down for the whole game-over screen, instead of freezing upright where it was hit
- A bronze, silver, gold or platinum medal drawn as text on the game-over screen for a final score of 10, 20, 30 or 40 and above
- Letting a player pause and resume a live run on purpose by pressing P or Escape, showing the same "Paused" screen as hiding the tab does, without the resuming key making the panda jump
- Showing the live score in the browser tab title once a run is under way
- Locking the installed PWA to portrait orientation to match the game's fixed portrait canvas
- Making the iOS standalone status bar black to match the page's solid-black theme
- Popping the top-left score number to 1.3x size the instant a column is cleared, easing back to its normal size over the next 150ms, so a cleared column is easy to notice mid-jump with no sound
- A gold "Faster!" callout centred on screen for 800ms of game time each time the difficulty ramp changes the floor and column speed, so a long run's mid-air speed-ups are as legible as the difficulty ramp itself
- A "Copy score" prompt in the "Share score" prompt's slot for browsers without navigator.share but with navigator.clipboard.writeText
- A gold "Best" label floating above whichever on-screen column would beat the stored best if cleared, tracking that column left as it scrolls and disappearing once the run's score passes the stored best, dies or pauses
- Tilting the panda's nose up while it rises and nose down while it falls, clamped to 25 degrees either way and levelling out at 0 degrees during game over so the existing upside-down flip still reads clearly
- Tinting the column that killed the panda red (0xff6666) on the game-over screen, so a double-column death shows which box to watch next time
- A small white puff drawn under the panda's feet for 250ms, fading out, the instant a double jump fires, so a second tap in the air is never a silently dropped input

Sound is not planned: CLAUDE.md's rules say the repository has no audio assets.

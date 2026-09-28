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

All of the above have shipped, along with slices that had no task file written: clouds drifting and bobbing, the game scaling to fit phone screens, a game over screen replacing the instant restart, box columns drawing from different ground textures, a web app manifest so Android/Chrome's "Add to Home Screen" shows the Panda icon and name, apple-mobile-web-app-capable meta tags so iOS's "Add to Home Screen" opens the game standalone without Safari's address bar or tab bar, the favicon, the apple-touch-icon, the meta description and Open Graph tags, Twitter/X Card meta tags so links to the game preview with its title, description and icon, the lang attribute on `<html>`, the Space key jump and restart controls, the build published to GitHub Pages, a 512x512 'any'-purpose manifest icon alongside the maskable one for full PWA installability, the Android adaptive-icon safe-zone padding on the home-screen icon so the adaptive mask doesn't clip the panda, a sans-serif fallback for the page's Lato font so a failed Google Fonts load doesn't switch the page to serif text, removing the default body margin so the page reads solid black edge-to-edge with no light-coloured border or gap, preconnecting the Google Fonts origins (fonts.googleapis.com and fonts.gstatic.com) so the page font loads faster, a gold callout on the bottom-left best text for 600ms the instant a run's live score first overtakes the stored best, a "New best" label in gold on the game-over screen's best line when the run that just ended overtook the stored best, containing vertical overscroll on `html` and `body` so a drag near the top of the page can't trigger the browser's pull-to-refresh reload, a "Share score" prompt on the game-over screen that uses the browser's Web Share API to share the run's score and the page URL, a difficulty ramp that steps the floor and column speed up from 200 px/s to a 300 px/s cap as the score climbs past 20, so a long run feels harder than the first few columns, holding a run paused with a "Paused" screen the instant the tab is hidden, until the player taps or presses Space to continue, a generated service worker that precaches the built app shell so the installed PWA opens and plays offline, with its cache name tied to the build output so a redeploy replaces it on the next visit, and letting a panda that dies in mid-air keep falling under gravity until it lands, flipped upside down for the whole game-over screen, instead of freezing upright where it was hit. Sound is not planned: CLAUDE.md's rules say the repository has no audio assets.

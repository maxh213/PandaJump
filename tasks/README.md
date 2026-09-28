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

All of the above have shipped, along with slices that had no task file written: clouds drifting and bobbing, the game scaling to fit phone screens, a game over screen replacing the instant restart, box columns drawing from different ground textures, a web app manifest so Android/Chrome's "Add to Home Screen" shows the Panda icon and name, apple-mobile-web-app-capable meta tags so iOS's "Add to Home Screen" opens the game standalone without Safari's address bar or tab bar, the favicon, the apple-touch-icon, the meta description and Open Graph tags, the lang attribute on `<html>`, the Space key jump and restart controls, and the build published to GitHub Pages. Sound is not planned: CLAUDE.md's rules say the repository has no audio assets.

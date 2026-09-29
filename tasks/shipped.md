# Shipped without a task file

The slices below shipped without a task file of their own. One per line: add a
new line for a new slice and never rewrite or re-wrap the others. This file is
merged with git's `union` driver (see `.gitattributes`), so two beads that each
add a line merge cleanly instead of conflicting.

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
- The sky changing from day to a sunset orange at score 20 and to a night blue at score 40, instantly and reset to day on restart
- A single short vibration on a supporting phone the instant the panda dies
- A "Run N" attempt count on the game-over screen counting restarts for the current page session, starting at "Run 1" and never read from or written to any store
- The Up Arrow key also jumps and restarts, like Space
- Pausing a live run when the browser window loses focus (a window blur), not only when the tab is hidden, so switching to another application never costs a run
- An on-screen "II" pause button in the canvas's top-right corner for phone players, hidden while paused or on the game-over screen, that pauses the run on tap without also jumping
- Changing the "Copy score" prompt to "Copied!" once the clipboard write resolves, reverting to "Copy score" on the next run
- Every piece of canvas text outlined in black so it stays readable on the day, sunset and night skies
- A "Tap again in mid-air to double jump" hint on the canvas for a player with no stored best, shown at scores 0 to 2 until their first air jump of the page session
- A tap or click anywhere on the page outside the game canvas jumps, resumes and restarts like a canvas tap, except on the GitHub link
- A white flash over the whole canvas the instant the panda hits a column, fading from 0.6 opacity to nothing over 200ms
- Columns spawn closer together as the score climbs (1450 ms at score 20 down to 1250 ms at score 60) so the difficulty ramp keeps long runs harder
- A jump pressed up to 100ms before the panda lands is remembered and fires the moment it touches the floor, instead of being thrown away
- A coloured medal disc drawn beside the medal name on the game-over screen, matching the medal's colour
- The full-screen white death flash stays invisible for players whose device asks for reduced motion
- The panda holds one still frame while it is in the air and only runs its legs on the floor
- A soft black ground shadow under the panda, drawn above the floor and below the panda, that shrinks from full size on the floor to half size at a floor jump's peak and stays visible while paused and at game over
- The game-over "Score: N" line counts up from 0 to the final score over the 500ms restart freeze, while the top-left score, tab title, medal and shared text show the final score at once
- A few small white stars scattered across the night sky once the score reaches 40, kept on the game-over screen and cleared on restart
- A small sand-coloured dust puff at the panda's feet for 200 ms whenever it lands from a jump
- A ready screen on page load that waits for the first tap, click, Space or Up Arrow press before the first run starts, without that input making the panda jump; restarting after game over stays instant
- The game-over screen shows "Bronze medal at 10" in white on the medal line when a run ends below a score of 10, so early runs see the first medal to aim for
- Game controller support: the bottom face button (A, Cross) jumps, resumes a paused run and restarts after game over, and the Start button pauses and resumes

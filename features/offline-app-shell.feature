Feature: Panda Jump caches its app shell so the installed PWA opens offline
  As a player who has installed Panda Jump to their home screen
  I want the game to open and play even with no network connection
  So that the standalone app I installed behaves like a real app, not a broken shortcut

  "The app shell" means the built index.html, its JS and CSS bundle, manifest.json, the icons
  and every image the game draws: the panda spritesheet, the ground and box textures and the clouds.
  These scenarios build and serve dist/ the same way as features/phaser-4-core-run.feature's
  "The production build runs from a plain file host" scenario, from the deployed /PandaJump/ path prefix.

  Background:
    Given "npm run build" has produced "dist/"
    And "dist/" is served by a static file server under the path "/PandaJump/"

  Rule: The built site registers a service worker that caches the app shell

    Scenario: Visiting the built site registers an active service worker
      When I open the Panda Jump page
      Then a service worker registration exists for the page
      And the service worker becomes active

  Rule: A player who has visited once can open and play a full run with no network at all

    Scenario: Reloading offline after one visit still plays a full run to game over
      Given I open the Panda Jump page and the service worker has taken control
      When the network is switched off
      And I reload the Panda Jump page
      Then the page still loads and box columns still appear
      And every response the page receives comes from the service worker's cache, not the network
      When I press Space to clear the first column
      Then the score reads "1"
      And the run continues offline until the panda touches a later column
      Then the page reads "Game over"

  Rule: A new deploy is not stuck being served from a previous build's cache

    Scenario: The generated service worker's cache name changes when the built output changes
      Given "npm run build" has produced "dist/sw.js" once
      When a build output file's contents change and "npm run build" runs again
      Then the regenerated "dist/sw.js" has different bytes and a different cache name than before

    Scenario: A revisit after a redeploy serves the new build and drops the old cache
      Given I open the Panda Jump page and the service worker has taken control
      And exactly one cache holds the first build's files
      When a build output file's contents change and "npm run build" runs again
      And I reload the Panda Jump page
      Then the new service worker installs and takes control
      And after one more reload fetching the changed file now returns its new contents
      And only the new build's cache remains; the previous build's cache is gone

  Rule: A new deploy's service worker taking control never reloads the page

    Scenario: A new worker taking control on the start screen does not reload the page
      Given I open the Panda Jump page and the service worker has taken control
      And the page is on the start screen with a marker set on window
      When a redeploy's new service worker installs and takes control
      Then the page has not reloaded and the marker is still on window

    Scenario: A new worker taking control during a live run does not reload the page
      Given I open the Panda Jump page and the service worker has taken control
      And a run is live with a marker set on window
      When a redeploy's new service worker installs and takes control
      Then the page has not reloaded and the marker is still on window

    Scenario: A new deploy never reloads the page in the middle of a run
      Given I open the Panda Jump page and the service worker has taken control
      And I press Space to start the run and 1000 ms of game time pass
      When a build output file's contents change and "npm run build" runs again
      And the page triggers a service worker update and the new service worker takes control
      Then the page does not reload and a value set on the page before the update is still there
      And the run's view reports ready false and gameOver false and its time is still 1000 ms

  Rule: The unbuilt dev server never registers a service worker

    Scenario: Running npm run dev does not install an offline cache
      When I open the Panda Jump page served by the unbuilt Vite dev server
      Then no service worker is registered for that page

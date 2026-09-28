Feature: Panda Jump advertises itself with a web app manifest
  As a player who adds Panda Jump to their phone's home screen
  I want Chrome to show the Panda icon and the name "Panda Jump"
  So that the shortcut opens like a real app, not a browser tab pointed at a raw URL

  The manifest's icon and start_url surviving the production build's asset hashing is proved
  by features/phaser-4-core-run.feature's "The production build runs from a plain file host"
  scenario, which already builds and serves dist/ once for the whole suite.

  Background:
    Given I open the Panda Jump page

  Rule: The page links a web app manifest and a matching theme colour

    Scenario: index.html links the manifest and sets a matching theme-color meta tag
      Then the page has a <link rel="manifest"> pointing at "manifest.json"
      And the page has a <meta name="theme-color"> tag set to "#000000"

  Rule: The manifest describes Panda Jump as an installable, standalone app

    Scenario: The manifest fetches as JSON with the app's name, short name and display mode
      Then the manifest fetches as JSON
      And the manifest's "name" is "Panda Jump"
      And the manifest's "short_name" is "Panda Jump"
      And the manifest's "start_url" is set
      And the manifest's "display" is "standalone"
      And the manifest's "background_color" and "theme_color" are both "#000000"

  Rule: The manifest's icon is a single square Panda icon, not the raw sprite sheet

    Scenario: The manifest's icon URL resolves to a square image matching its declared sizes
      Then the manifest's icon does not point at "assets/Panda.png"
      And the manifest's icon URL responds with 200 and image content
      And the icon image's width equals its height
      And the manifest's "sizes" field matches the icon's actual width and height

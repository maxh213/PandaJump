Feature: Panda Jump advertises itself with a web app manifest
  As a player who adds Panda Jump to their phone's home screen
  I want Chrome to show the Panda icon and the name "Panda Jump"
  So that the shortcut opens like a real app, not a browser tab pointed at a raw URL

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

  Rule: The manifest's icon points at the real Panda image

    Scenario: The manifest's icon URL resolves to the Panda.png asset
      Then the manifest's icon URL responds with 200 and image content

  Rule: The manifest survives the production build's asset hashing

    Scenario: The manifest's icon and start_url resolve against the manifest's own hashed-build URL
      Given the production build is served from its deployed path prefix
      Then the manifest's icon URL responds with 200 and image content
      And the manifest's start_url responds with 200

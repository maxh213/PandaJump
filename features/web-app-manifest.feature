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

  Rule: The manifest's icon is padded for Android's adaptive-icon mask

    Scenario: The manifest's icon keeps every panda pixel inside the maskable safe zone
      Then the manifest's icon is marked "maskable"
      And every non-transparent pixel in the icon image lies within the adaptive-icon safe zone

  Rule: The manifest includes a full-bleed 512x512 icon for full install-prompt eligibility

    Scenario: The manifest's any-purpose icon resolves to a 512x512-or-larger image matching its declared sizes
      Then the manifest has an icon marked "any" or with no purpose
      And that icon's URL responds with 200 and image content
      And the manifest's "sizes" field for that icon matches its actual width and height
      And that icon is at least 512x512

    Scenario: The any-purpose icon's artwork extends past the maskable safe zone, unlike the maskable icon
      Then some non-transparent pixel in the any-purpose icon image lies outside the adaptive-icon safe zone

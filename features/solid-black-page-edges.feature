Feature: Panda Jump reads solid black edge-to-edge
  As a player opening Panda Jump, including one who has added it to their home screen
  I want the whole page to read solid black with no light-coloured border or gap
  So that the page matches the black theme-color and manifest colours already committed to

  Background:
    Given I open the Panda Jump page

  Rule: The page has no default-coloured margin or gap anywhere

    Scenario: A small phone-sized viewport is solid black at every corner and below the content
      Given the browser viewport is 375 by 812 px
      Then the pixel colour at each of the four page corners is pure black
      And the pixel colour below the visible content is pure black
      And the html and body backgrounds are pure black with no body margin

    Scenario: A viewport taller than the page's content is solid black at every corner and below the content
      Given the browser viewport is 1024 by 1400 px
      Then the pixel colour at each of the four page corners is pure black
      And the pixel colour below the visible content is pure black
      And the html and body backgrounds are pure black with no body margin

  Rule: iOS's standalone status bar matches the page's black theme

    Scenario: index.html sets the apple-mobile-web-app-status-bar-style meta tag to black-translucent
      Then the page has a <meta name="apple-mobile-web-app-status-bar-style"> tag set to "black-translucent"

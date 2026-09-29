Feature: Panda Jump scales to fit phone screens
  As a player opening Panda Jump on a phone
  I want the game to fill my narrow screen without cropping, scrolling or zooming
  So that I can play comfortably on any device

  The logical canvas stays 400 by 490 px and every rule coordinate is unchanged.
  When the viewport cannot show the canvas at 400 by 490 px alongside the page text, the canvas fills the whole viewport at that aspect ratio and the title, controls and GitHub link sit below it, reachable by scrolling.
  Widths, heights and positions below are the canvas's rendered CSS size, not its internal resolution.

  Background:
    Given I open the Panda Jump page

  Rule: The canvas scales to fit the viewport

    Scenario: A phone-width viewport shows the whole game with no scrollbar
      Given the browser viewport is 375 by 667 px
      Then the canvas is no wider than 375 px and no taller than 667 px
      And the canvas is at least 370 px wide
      And the canvas is fully visible without scrolling
      And the canvas is centred horizontally in the viewport
      And the page has no horizontal scrollbar
      And the title, controls and GitHub link are still on the page and reachable by scrolling

    Scenario: A short landscape viewport fills the screen and shows the whole game
      Given the browser viewport is 667 by 375 px
      Then the canvas is at least 360 px tall
      And the canvas is fully visible without scrolling
      And the page has no horizontal scrollbar
      And the title, controls and GitHub link are still on the page and reachable by scrolling

    Scenario: A desktop viewport keeps the original canvas size and position
      Given the browser viewport is 1024 by 768 px
      Then the canvas is 400 by 490 px
      And the canvas is centred horizontally in the viewport
      And the title is above the canvas
      And the title, controls and GitHub link are still on the page and reachable by scrolling

    Scenario: The canvas recovers its full size after a resize away from a cramped viewport
      Given the browser viewport is 667 by 375 px
      When the browser viewport is resized to 1024 by 768 px
      Then the canvas is 400 by 490 px

    Scenario: The canvas tracks repeated rotation and resize without getting stuck
      Given the browser viewport is 375 by 667 px
      When the browser viewport is resized to 667 by 375 px
      And the browser viewport is resized to 375 by 667 px
      And the browser viewport is resized to 1024 by 768 px
      Then the canvas is 400 by 490 px

  Rule: The canvas stays clear of the device's safe area

    Scenario: A notch or status bar inset at the top pushes the canvas below it
      Given the device reports a 47 px safe area at the top of the screen
      And the browser viewport is 390 by 844 px
      Then the canvas starts at least 47 px from the top of the page
      And the canvas is fully visible without scrolling
      And the page has no horizontal scrollbar

    Scenario: A short phone with a top inset shrinks the canvas so it still fits
      Given the device reports a 47 px safe area at the top of the screen
      And the browser viewport is 390 by 500 px
      Then the canvas starts at least 47 px from the top of the page
      And the canvas is fully visible without scrolling
      And the page has no horizontal scrollbar

    Scenario: Side safe-area insets shrink the canvas so it still fits
      Given the device reports a 47 px safe area on the left and right of the screen
      And the browser viewport is 390 by 844 px
      Then the canvas is no wider than 296 px
      And the page has no horizontal scrollbar

    Scenario: The viewport meta tag lets the page extend under the status bar
      Then the viewport meta tag asks for viewport-fit cover
      And the viewport meta tag still disables user scaling

  Rule: Touch input on the game does not move the page

    Scenario: The canvas opts out of the browser's default touch scrolling and zooming
      Given the browser viewport is 375 by 667 px
      Then the canvas has touch-action "none"
      And the viewport meta tag disables user scaling

    Scenario: Tapping the canvas still jumps on a touch viewport
      Given the browser viewport is 375 by 667 px
      When I tap the canvas
      Then the panda leaves the floor
      And the page has not scrolled

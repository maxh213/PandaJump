Feature: Panda Jump scales to fit phone screens
  As a player opening Panda Jump on a phone
  I want the game to fill my narrow screen without cropping, scrolling or zooming
  So that I can play comfortably on any device

  The logical canvas stays 400 by 490 px and every rule coordinate is unchanged.
  Widths, heights and positions below are the canvas's rendered CSS size, not its internal resolution.

  Background:
    Given I open the Panda Jump page

  Rule: The canvas scales to fit the viewport

    Scenario: A phone-width viewport shows the whole game with no scrollbar
      Given the browser viewport is 375 by 667 px
      Then the canvas is no wider than 375 px and no taller than 667 px
      And the canvas is wider than 300 px
      And the canvas is centred horizontally in the viewport
      And the page has no horizontal scrollbar

    Scenario: A short landscape viewport shows the whole game with no cropping
      Given the browser viewport is 667 by 375 px
      Then the canvas fits entirely inside the viewport
      And the page has no horizontal scrollbar

    Scenario: A desktop viewport keeps the original canvas size and position
      Given the browser viewport is 1024 by 768 px
      Then the canvas is 400 by 490 px
      And the canvas is centred horizontally in the viewport

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

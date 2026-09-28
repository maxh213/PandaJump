Feature: Panda Jump scatters a few white stars across the night sky once the score reaches 40
  As a player who has reached the night sky
  I want a few stars to appear
  So that arriving at night feels like arriving somewhere special

  "The ramped schedule" and "column n is cleared" are as defined in features/sky-by-score.feature.
  A star is a game object named "star": a small white dot of radius 2. There are 12 of them, at fixed
  positions that never depend on the random source, all with y below 200 so none sit on the floor or the columns.
  `window.pandaJump.run.view().stars` lists the same positions.

  Background:
    Given I open the Panda Jump page
    And the run has just started

  Rule: Stars appear the instant the score reaches 40

    Scenario: No star is visible at a score of 39
      Given I play the ramped schedule through column 39
      Then the score reads "39"
      And no star is visible

    Scenario: Exactly 12 stars are visible at a score of 40, all high in the sky
      Given I play the ramped schedule through column 40
      Then the score reads "40"
      And exactly 12 stars are visible
      And every star is a white dot of radius 2 with y below 200

  Rule: The stars are the same on every run and every page load

    Scenario: Different random values give the same star positions
      Given I play the ramped schedule through column 40 with one random source
      And I play the ramped schedule through column 40 with a different random source on a fresh page load
      Then both runs show the stars at the same positions

  Rule: The stars stay on the game-over screen and go away on restart

    Scenario: Stars stay visible after a death at a score of 40 or more
      Given I play the ramped schedule through column 40 and then stop jumping
      When the panda touches the next column
      Then the game-over screen shows and exactly 12 stars are visible

    Scenario: No star is visible after restarting
      Given I have died at a score of 40 or more
      When I tap to play again
      Then no star is visible

  Rule: Stars draw behind everything else

    Scenario: Every star has a lower depth than the clouds, box columns and panda
      Given I play the ramped schedule through column 40
      Then every star is drawn at a lower depth than the clouds, the box columns and the panda

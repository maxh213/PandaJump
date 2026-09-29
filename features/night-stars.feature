Feature: Panda Jump scatters a few white stars across the dusk sky once the score reaches 60
  As a player who has reached the industrial dusk sky
  I want a few stars to appear
  So that arriving at night feels like arriving somewhere special

  "The ramped schedule" and "column n is cleared" are as defined in features/sky-by-score.feature.
  The stars belong to the industrial biome of features/biomes.feature: they show from a score of 60 to 79 and again in every
  later industrial biome, and never in the meadow, desert or snowfield.
  A star is a game object named "star": a small white dot of radius 2. There are 12 of them, at fixed
  positions that never depend on the random source, all with y below 200 so none sit on the floor or the columns.
  `window.pandaJump.run.view().stars` lists the same positions.

  Background:
    Given I open the Panda Jump page
    And the run has just started

  Rule: Stars appear the instant the score reaches 60

    Scenario: No star is visible at a score of 59
      Given I play the ramped schedule through column 59
      Then the score reads "59"
      And no star is visible

    Scenario: Exactly 12 stars are visible at a score of 60, all high in the sky
      Given I play the ramped schedule through column 60
      Then the score reads "60"
      And exactly 12 stars are visible
      And every star is a white dot of radius 2 with y below 200

  Rule: The stars are the same on every run and every page load

    Scenario: Different random values give the same star positions
      Given I play the ramped schedule through column 60 with one random source
      And I play the ramped schedule through column 60 with a different random source on a fresh page load
      Then both runs show the stars at the same positions

  Rule: The stars stay on the game-over screen and go away on restart

    Scenario: Stars stay visible after a death at a score of 60 or more
      Given I play the ramped schedule through column 60 and then stop jumping
      When the panda touches the next column
      Then the game-over screen shows and exactly 12 stars are visible

    Scenario: No star is visible after restarting
      Given I have died at a score of 60 or more
      When I tap to play again
      Then no star is visible

  Rule: Stars draw behind everything else

    Scenario: Every star has a lower depth than the clouds, box columns and panda
      Given I play the ramped schedule through column 60
      Then every star is drawn at a lower depth than the clouds, the box columns and the panda

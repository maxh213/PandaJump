Feature: Panda Jump changes the sky with the biome at scores 20, 40 and 60
  As a player on a long run
  I want the sky to change as my score climbs
  So that a long run feels like a journey and mastery is rewarded with something to see

  Times use the same conventions as features/phaser-4-core-run.feature.
  "The ramped schedule" is as defined in features/difficulty-ramp.feature: the random source
  picks 1 box and no second column for every column, and I press Space 788 ms after each column
  spawns rather than 1200 ms, since a jump timed for the flat 200 px/s schedule lands too late
  once the difficulty ramp has sped columns up. Columns spawn 1500 ms apart until the score reaches
  20 and then closer together, as features/difficulty-ramp.feature describes; the score reads n the
  moment column n is cleared.
  "The sky" means both `window.pandaJump.run.view().sky` and the main camera's background colour,
  which always match, and which are part of the biome as features/biomes.feature describes: "#71c5cf" (day)
  below a score of 20, "#f4a261" (sunset) from 20 to 39, "#a9c9e0" (pale snowfield blue) from 40 to 59 and
  "#4a4e69" (industrial dusk grey) from 60 to 79, after which the sequence repeats.

  Background:
    Given I open the Panda Jump page
    And the run has just started

  Rule: The sky is day-blue below a score of 20

    Scenario: The sky is day-blue the moment a run starts
      Then the sky is "#71c5cf"

    Scenario: The sky is still day-blue just before the sunset threshold
      Given I play the ramped schedule through column 19
      Then the score reads "19"
      And the sky is "#71c5cf"

  Rule: The sky turns sunset-orange the instant the score reaches 20, and stays there below 40

    Scenario: The sky turns sunset the moment the score reaches 20
      Given I play the ramped schedule through column 20
      Then the score reads "20"
      And the sky is "#f4a261"

    Scenario: The sky is still sunset just before the snowfield threshold
      Given I play the ramped schedule through column 39
      Then the score reads "39"
      And the sky is "#f4a261"

  Rule: The sky turns pale snowfield-blue the instant the score reaches 40

    Scenario: The sky turns pale blue the moment the score reaches 40
      Given I play the ramped schedule through column 40
      Then the score reads "40"
      And the sky is "#a9c9e0"

  Rule: The sky turns dusk-grey the instant the score reaches 60

    Scenario: The sky is still pale blue just before the industrial threshold
      Given I play the ramped schedule through column 59
      Then the score reads "59"
      And the sky is "#a9c9e0"

    Scenario: The sky turns dusk-grey the moment the score reaches 60
      Given I play the ramped schedule through column 60
      Then the score reads "60"
      And the sky is "#4a4e69"

  Rule: A new run always starts back at day, even after a snowfield death

    Scenario: The sky resets to day after a restart following a death at score 40 or more
      Given I play the ramped schedule through column 40 and then stop jumping
      Then the sky is "#a9c9e0"
      When the panda touches the next column, the game freezes, and tapping to play again restarts it
      Then the score reads "0"
      And the sky is "#71c5cf"

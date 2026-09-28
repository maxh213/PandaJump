Feature: Panda Jump turns the sky to sunset at score 20 and to night at score 40
  As a player on a long run
  I want the sky to change as my score climbs
  So that a long run feels like a journey and mastery is rewarded with something to see

  Times use the same conventions as features/phaser-4-core-run.feature.
  "The ramped schedule" is as defined in features/difficulty-ramp.feature: the random source
  picks 1 box and no second column for every column, and I press Space 788 ms after each column
  spawns rather than 1200 ms, since a jump timed for the flat 200 px/s schedule lands too late
  once the difficulty ramp has sped columns up. Column n is cleared at 1500 x n + 1820 ms and the
  score reads n from that moment.
  "The sky" means both `window.pandaJump.run.view().sky` and the main camera's background colour,
  which always match: "#71c5cf" (day) below a score of 20, "#f4a261" (sunset) from 20 to 39, and
  "#2b2d42" (night) from 40 upward.

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

    Scenario: The sky is still sunset just before the night threshold
      Given I play the ramped schedule through column 39
      Then the score reads "39"
      And the sky is "#f4a261"

  Rule: The sky turns night-blue the instant the score reaches 40

    Scenario: The sky turns night the moment the score reaches 40
      Given I play the ramped schedule through column 40
      Then the score reads "40"
      And the sky is "#2b2d42"

  Rule: A new run always starts back at day, even after a night-time death

    Scenario: The sky resets to day after a restart following a death at score 40 or more
      Given I play the ramped schedule through column 40 and then stop jumping
      Then the sky is "#2b2d42"
      When the panda touches the next column, the game freezes, and tapping to play again restarts it
      Then the score reads "0"
      And the sky is "#71c5cf"

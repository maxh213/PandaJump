Feature: Panda Jump scrolls a row of distant hills behind the columns at a quarter of the floor's speed
  As a player on the Panda Jump page
  I want a slow-moving row of hills far behind the action
  So that a run feels like travel and the difficulty ramp's speed-ups show in the background too

  Times use the same conventions as features/phaser-4-core-run.feature.
  "The hills" means the repeating hill layer, drawn with shapes rather than art from assets/. It sits on the grass
  line and spans y 300 to y 424, so no part of it is drawn above y 300. It is drawn in front of every cloud and
  star and behind every box, the panda and its shadow.
  The hills scroll left by exactly one quarter of the distance the floor scrolls, so they follow the difficulty
  ramp's speed-ups, and they stand still whenever game time stands still.
  "The hill colour" is one solid colour per sky, always darker than that sky: "#4a9ba6" under the day sky
  (#71c5cf), "#c97b3a" under the sunset sky (#f4a261) and "#1a1b2b" under the night sky (#2b2d42).
  "The ramped schedule" is as defined in features/sky-by-score.feature.

  Background:
    Given I open the Panda Jump page with a manual clock
    And the run has just started

  Rule: The hills sit in front of the sky and behind everything else

    Scenario: The hills are visible at the start of a run, in front of clouds and stars and behind boxes, panda and shadow
      Then the hills are visible
      And the hills are drawn at a higher depth than every cloud and star
      And the hills are drawn at a lower depth than the boxes, the panda and its shadow

    Scenario: No part of the hills is drawn above y 300
      Then the top of the hills is at y 300 or lower
      And the bottom of the hills is at the top of the grass, y 424

  Rule: The hills scroll at a quarter of the floor's speed

    Scenario: Below a score of 20 the hills move a quarter as far as the floor
      When 1000 ms pass in steps of 16 ms
      Then at every step the hills moved left by a quarter of the distance the floor moved, within 1 px

    Scenario: After the first speed-up at score 20 the hills still move a quarter as far as the floor
      Given I play the ramped schedule through column 20
      When 1000 ms pass in steps of 16 ms
      Then at every step the hills moved left by a quarter of the distance the floor moved, within 1 px

  Rule: The hills stand still whenever game time stands still

    Scenario: A paused run does not move the hills
      Given 1000 ms have passed
      When I press "p"
      And 2000 ms pass
      Then the hills are exactly where they were when I paused

    Scenario: The countdown's frozen time does not move the hills
      Given 1000 ms have passed
      And I have paused
      When I press Space to resume
      And 1000 ms pass, still inside the countdown
      Then the hills are exactly where they were when I paused

    Scenario: The game-over screen does not move the hills
      When the panda dies on the first column
      And 1000 ms pass
      Then the hills are exactly where they were at the moment of death

  Rule: The hill colour follows the sky

    Scenario: The hills are the day colour at the start of a run
      Then the hill colour is "#4a9ba6"

    Scenario: The hills turn sunset-coloured at score 20
      Given I play the ramped schedule through column 20
      Then the sky is "#f4a261"
      And the hill colour is "#c97b3a"

    Scenario: The hills turn night-coloured at score 40
      Given I play the ramped schedule through column 40
      Then the sky is "#2b2d42"
      And the hill colour is "#1a1b2b"

    Scenario: The same score always gives the same hill colour, and a restart returns to the day colour
      Given I play the ramped schedule through column 40
      When the panda dies and I restart
      Then the score reads "0"
      And the hill colour is "#4a9ba6"

  Rule: The bottom of the hills meets the top of the ground

    Scenario: The hills sit on the grass with no sky between them at the start and after the floor has scrolled
      Then in the rows just above and just below y 424 no pixel across the canvas is the sky colour
      And no pixel in the row at y 424 is the hill colour
      When 37, 211 and 640 ms pass
      Then those same rows still hold no sky-coloured pixel and no hill-coloured pixel at y 424

    Scenario: The hills meet the ground under the sunset sky
      Given I play the ramped schedule through column 20
      Then no pixel in the rows around y 424 is the sky colour, at the same scroll offsets

    Scenario: The hills meet the ground under the night sky
      Given I play the ramped schedule through column 40
      Then no pixel in the rows around y 424 is the sky colour, at the same scroll offsets

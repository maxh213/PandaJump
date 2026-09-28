Feature: Panda Jump ramps column and floor speed up as the score climbs
  As a player who keeps playing past the early columns
  I want the game to speed up the longer I survive
  So that a long run feels harder than the first few columns, giving the high score a reason to chase

  Times use the same conventions as features/phaser-4-core-run.feature.
  "The standard schedule" here keeps the random source picking 1 box and no second column for
  every column, as in features/phaser-4-core-run.feature, but presses Space 788 ms after each
  column spawns rather than 1200 ms: once the ramp has sped columns up, a jump timed for the flat
  200 px/s schedule lands too late and the panda is hit, so every scenario below jumps earlier to
  clear the ramped columns. Column n is still cleared at 1500 × n + 1820 ms and the score reads n
  from that moment, matching features/phaser-4-core-run.feature's timing.
  "Speed" means the distance a column on screen, or the floor's own scroll offset, travels over a
  fixed 100 ms window, expressed in px per second.

  Background:
    Given I open the Panda Jump page
    And the run has just started

  Rule: Every column and the floor move at a flat 200 px/s below a score of 20

    Scenario: The speed has not changed just before the ramp starts
      Given I play the standard schedule through column 19
      Then the score reads "19"
      And over the next 100 ms a column on screen moves at exactly 200 px per second
      And the floor scrolls at exactly 200 px per second over the same 100 ms

  Rule: From score 20 the speed increases in fixed 20 px/s steps every 10 points

    Scenario: The speed steps up the moment the score reaches 20
      Given I play the standard schedule through column 20
      Then the score reads "20"
      And over the next 100 ms a column on screen moves at exactly 220 px per second
      And the floor scrolls at exactly 220 px per second over the same 100 ms

    Scenario: The speed steps up again at the next 10-point mark
      Given I play the standard schedule through column 30
      Then the score reads "30"
      And over the next 100 ms a column on screen moves at exactly 240 px per second

  Rule: The ramp never exceeds a hard cap of 300 px/s

    Scenario: The speed reaches its cap by score 60
      Given I play the standard schedule through column 60
      Then the score reads "60"
      And over the next 100 ms a column on screen moves at exactly 300 px per second

    Scenario: The speed does not exceed the cap past score 60
      Given I play the standard schedule through column 70
      Then the score reads "70"
      And over the next 100 ms a column on screen moves at exactly 300 px per second

  Rule: The floor and the columns never desync

    Scenario: The floor and a column travel the same distance at every sampled score
      Given I play the standard schedule through column 45
      Then the score reads "45"
      And over the next 100 ms the floor's scroll offset and a column's left edge move the same distance

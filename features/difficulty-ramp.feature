Feature: Panda Jump ramps column and floor speed up as the score climbs
  As a player who keeps playing past the early columns
  I want the game to speed up the longer I survive
  So that a long run feels harder than the first few columns, giving the high score a reason to chase

  Times use the same conventions as features/phaser-4-core-run.feature.
  "The standard schedule" here keeps the random source picking 1 box and no second column for
  every column, as in features/phaser-4-core-run.feature, but presses Space 788 ms after each
  column spawns rather than 1200 ms: once the ramp has sped columns up, a jump timed for the flat
  200 px/s schedule lands too late and the panda is hit, so every scenario below jumps earlier to
  clear the ramped columns. Columns spawn 1500 ms apart until the score reaches 20 and then closer
  together (see the spawn-gap rule below), so the schedule follows each column's own spawn time
  rather than 1500 × n; the score reads n the moment column n is cleared.
  "The spawn gap" is the game time between one column spawning and the next; it depends on the
  score at the moment a column spawns.
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

  Rule: The gap between column spawns shrinks as the score climbs and never drops below 1250 ms

    Scenario: The gap is 1500 ms below score 20 and 1450 ms once the score reaches 20
      Given I play the standard schedule through column 25
      Then the first column spawned at 1500 ms
      And every column that spawned while the score was below 20 spawned 1500 ms after the one before
      And the first column that spawned while the score was 20 or more spawned 1450 ms after the one before

    Scenario: The gap keeps shrinking in 50 ms steps every 10 points down to 1250 ms
      Given I play the standard schedule through column 70
      Then columns that spawned at scores 30, 40, 50 and 60 or more each spawned 1400, 1350, 1300 and 1250 ms after the one before
      And no column spawned less than 1250 ms after the one before

    Scenario: Loading the page twice with the same random values gives the same column positions
      Given I open the page twice with the same "?random=" and "?clock=manual" inputs
      When I play the standard schedule through column 25 on both
      Then every column sits at the same position at the same game time on both pages

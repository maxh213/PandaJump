Feature: Panda Jump box columns draw from a small set of ground textures
  As a player on the Panda Jump page
  I want box columns to look different from one another
  So that the run does not look like the same dirt block forever

  Times are game time in ms since the page loaded, driven by an injected clock.
  Column n (n = 1, 2, 3, ...) spawns at 1500 × n ms, same as in features/phaser-4-core-run.feature.
  A column's texture comes from the biome its score is in, as features/biomes.feature describes: "dirt_06.png" in
  the meadow, below a score of 20. "The texture source" means a random source that repeats the 15 values
  0.25, 0.5, 0, 0.25, 0.5, 0.2, 0.25, 0.5, 0.4, 0.25, 0.5, 0.6, 0.25, 0.5, 0.8 in order: each column
  draws a height (0.25, always 1 box), a "no second column" value (0.5) and a third value that is still drawn
  so that every random source keeps its meaning, but no longer changes the texture.
  Pressing Space 1200 ms after a column spawns clears it, same as the standard schedule in
  features/phaser-4-core-run.feature.

  For the paired-column scenario, columns follow the standard schedule from features/phaser-4-core-run.feature
  (1 box, no second column, pressing Space 1200 ms after each spawn) through column 12, so the score
  reads "11" once column 13 spawns at 19500 ms, above the score of 10 that a second column needs. Column 13
  instead draws 1 box, and a second column, so a front column and a trailing column 64 px
  behind it spawn together at 19500 ms.

  Background:
    Given I open the Panda Jump page with the texture source and a manual clock

  Rule: Box columns take the texture of their biome

    Scenario: Five meadow columns in a row all use the meadow texture whatever the random source draws
      When 1600 ms pass
      Then the column at x 380 uses "dirt_06.png"
      When I press Space at 2700 ms
      And 1500 ms pass
      Then the column at x 380 uses "dirt_06.png"
      When I press Space at 4200 ms
      And 1500 ms pass
      Then the column at x 380 uses "dirt_06.png"
      When I press Space at 5700 ms
      And 1500 ms pass
      Then the column at x 380 uses "dirt_06.png"
      When I press Space at 7200 ms
      And 1500 ms pass
      Then the column at x 380 uses "dirt_06.png"
      And the run has not restarted

  Rule: Every box in one column uses the same texture as the rest of that column

    Scenario: Both boxes of a two-box column render with the same texture
      Given the random source picks 2 boxes for the first column
      When 1600 ms pass
      Then the column at x 380 has 2 boxes and every box in it uses "dirt_06.png"

    Scenario: A front column and its trailing second column render with the same texture
      Given I play the standard schedule, except that the random source picks a second column for column 13
      Then the score reads "11" at 19500 ms
      When 500 ms pass
      Then the column at x 300 and the column at x 364, both spawned at 19500 ms, use "dirt_06.png" for every box

  Rule: Box textures are deterministic under the injected random source

    Scenario: Two runs opened with the same texture source draw the same texture sequence
      Given a second run is opened with the same texture source and manual clock
      When 7600 ms pass on both runs, sampled every 1500 ms, pressing Space 1200 ms after each column spawns
      Then both runs show the same box textures at every sampled column

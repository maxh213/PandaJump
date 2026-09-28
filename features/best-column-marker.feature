Feature: Panda Jump on Phaser 4, slice: the best-column marker
  As a player on the Panda Jump page
  I want to see which column is my record-breaking column before I reach it
  So that the run builds tension and I know exactly what I need to clear to set a new best

  Times are game time in ms since the page loaded, same conventions as features/phaser-4-core-run.feature.
  "The stored best" is as defined in features/high-score.feature. The random source picks 1 box and
  no second column for every column, so column n spawns at 1500 x n ms and, once jumped 1200 ms after
  it spawns, is cleared at 1500 x n + 1820 ms.
  "The marker" means a text reading "Best" in gold (#ffd700), 16px Arial, centred horizontally over a
  column and with its bottom 8px above that column's top box.
  The scoring columns not yet cleared are cleared in order, so with a stored best of 1 the column whose
  clearing takes the score to 2 (best + 1) is column 2, the second not-yet-cleared column: clearing
  column 1 only ties the stored best.

  Background:
    Given I open the Panda Jump page

  Rule: The marker sits over the column whose clearing would beat the stored best

    Scenario: No marker shows before that column has spawned
      Given the stored best is 1
      When 1600 ms pass
      Then no marker is visible

    Scenario: The marker appears over that column once it spawns, and moves left with it
      Given the stored best is 1
      When I press Space at 2700 ms
      And 3100 ms pass
      Then the marker is visible over the column at x 380, 8px above its top box
      When 500 more ms pass
      Then the marker has moved further left, still over the same column

  Rule: The marker disappears once the run overtakes the stored best

    Scenario: Clearing the marked column takes the score past the stored best and hides the marker
      Given the stored best is 1
      When I press Space at 2700 and 4200 ms
      And 4900 ms pass
      Then the score reads "2"
      And no marker is visible

  Rule: With no stored best, the marker never appears

    Scenario: A run with no stored best never shows a marker, even as columns spawn and the panda dies
      Given the stored best is 0
      When 1600 ms pass
      Then no marker is visible
      When I do not jump
      Then the panda touches the first column, freezing the run
      And no marker is visible

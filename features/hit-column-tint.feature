Feature: Panda Jump tints the column that killed the panda red on the game-over screen
  As a player on the Panda Jump page
  I want the exact column that killed me tinted red
  So that a death against a double column reads as fair and I can learn which box to watch next time

  Times, "the standard schedule" and "column n spawns at 1500 × n ms" are as defined in
  features/phaser-4-core-run.feature. "Tinted red" means the box image's tint is 0xff6666.
  "Untinted" means the box image's tint is 0xffffff, Phaser's default for a box with no tint applied.

  Background:
    Given I open the Panda Jump page
    And the run has just started

  Rule: Only the boxes of the column that killed the panda are tinted red

    Scenario: Dying against the front column of a double column tints only that column
      Given I play the standard schedule, except that the random source picks a second column for column 13
      Then the score reads "11" at 19500 ms
      When I do not jump again
      Then the panda touches the front column of the pair at about 20875 ms
      And every box of the front column, spawned at 19500 ms with its left edge at x 300, is tinted red
      And every box of the second column, spawned at 19500 ms with its left edge at x 364, is untinted

  Rule: No box is tinted while the run is live

    Scenario: Box columns are untinted while the panda is still running
      Given the random source picks 1 box for the first column
      When 1600 ms pass
      Then the column on screen is untinted
      And the run has not restarted

  Rule: A restart clears every tint, even on a reused box image

    Scenario: No box carries a stale tint into the next run
      Given the random source picks 1 box for the first column
      When I do not jump
      Then the panda touches the column and the run freezes
      When 500 ms pass and I tap to play again
      Then the run restarts
      When 1600 ms pass
      Then the next column on screen is untinted

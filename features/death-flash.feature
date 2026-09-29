Feature: Panda Jump on Phaser 4, slice: flash the screen white for an instant when the panda hits a column
  As a player on the Panda Jump page, including one playing with the sound off
  I want a clear visual cue the instant the panda hits a box column
  So that I know right away that I died instead of wondering whether the game froze or missed my input

  Times are game time in ms since the run started, same as features/phaser-4-core-run.feature.
  Column 1 spawns at 1500 ms and touches an idle panda at about 2890 ms, as in features/phaser-4-core-run.feature.
  "The flash" means the full-canvas white rectangle named "deathFlash", drawn above the panda, the
  boxes and the floor and below the "Game over" title. Its opacity is 0 during a live run, jumps to
  0.6 the instant the panda dies, then falls in a straight line to 0 as the 200 ms after death pass,
  and stays 0 after that until the next death.

  Background:
    Given I open the Panda Jump page
    And the run has just started

  Rule: The flash is invisible while the run is live

    Scenario: The flash stays fully transparent during ordinary play
      Given the random source picks 1 box for the first column
      When 1000 ms pass
      Then the deathFlash rectangle has alpha 0

  Rule: The flash jumps to its peak opacity the instant the panda dies

    Scenario: Running into a column snaps the flash to 0.6 the moment gameOver first becomes true
      Given the random source picks 1 box for the first column
      When I do not jump
      Then the panda touches the column at about 2890 ms
      And the deathFlash rectangle has alpha 0.6, within 0.05, on the first frame where the game is over

  Rule: The flash fades out in a straight line over 200ms and then stays gone

    Scenario: The flash is half faded at 100ms after death and fully gone by 200ms
      Given the random source picks 1 box for the first column
      When I do not jump
      And the panda touches the column
      Then the deathFlash rectangle has alpha 0.3, within 0.05, at 100 ms after death
      And the deathFlash rectangle has alpha exactly 0 at 200 ms after death
      And the deathFlash rectangle has alpha exactly 0 at 1000 ms after death

  Rule: The flash covers the whole canvas, is white, and never gets in the way of the game-over screen

    Scenario: The flash is a full-canvas white rectangle layered above the action and below the game-over texts
      Given the random source picks 1 box for the first column
      When I do not jump
      And the panda touches the column
      Then the deathFlash rectangle covers the whole 400 by 490 canvas
      And the deathFlash rectangle is white, #ffffff
      And the deathFlash rectangle is drawn above the panda and the boxes
      And the deathFlash rectangle is drawn below the "Game over" title

    Scenario: Restart and Share score still work exactly as before, and the flash resets to 0 in the new run
      Given sharing is supported
      And the random source picks 1 box and no second column for every column
      And I do not jump
      And the panda touches the column
      And 500 ms pass
      When I tap to play again
      Then the run restarts
      And the deathFlash rectangle has alpha 0
      When the panda touches the next column
      And 500 ms pass
      When I tap "Share score"
      Then navigator.share is called
      And the run has not restarted a second time

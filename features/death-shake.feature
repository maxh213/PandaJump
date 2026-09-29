Feature: Panda Jump on Phaser 4, slice: shake the view briefly when the panda hits a column
  As a player on the Panda Jump page, including one playing with the sound off
  I want the whole view to jolt for an instant when the panda hits a box column
  So that the hit feels physical and I know right away that I died

  Times are game time in ms since the run started, same as features/phaser-4-core-run.feature.
  Column 1 spawns at 1500 ms and touches an idle panda at about 2875 ms, as in features/phaser-4-core-run.feature.
  "The shake" means the offset of the main camera's scroll, in pixels on each axis. It is 0 on both
  axes during a live run, is non-zero from the instant the panda dies, never exceeds 6 px on either
  axis and dies away in a straight line to 0 over the 200 ms after death, and is exactly 0 on both
  axes from 200 ms after death on. The offsets follow a fixed pattern of game time only, so the same
  ?random= values and the same steps always give the same offsets. Players who ask for reduced
  motion never get it, the same way they never get the flash in features/death-flash.feature.

  Background:
    Given I open the Panda Jump page
    And the run has just started

  Rule: The view is still while the run is live

    Scenario: The camera does not move during ordinary play
      Given the random source picks 1 box for the first column
      When 1000 ms pass
      Then the camera scroll is 0 on both axes

  Rule: The view shakes for 200ms after the hit, within 6px, and then stays still

    Scenario: Running into a column shakes the camera and never by more than 6 px
      Given the random source picks 1 box for the first column
      When I do not jump
      And the panda touches the column
      Then the camera scroll is non-zero on the first frame where the game is over
      And the camera scroll never exceeds 6 px on either axis in the following 200 ms

    Scenario: The camera is exactly still from 200ms after death on
      Given the random source picks 1 box for the first column
      When I do not jump
      And the panda touches the column
      Then the camera scroll is 0 on both axes at 200 ms after death
      And the camera scroll is 0 on both axes at 1000 ms after death

  Rule: The shake is the same every time and ends with the restart

    Scenario: Two runs with the same random values and steps give the same offsets
      Given the random source picks 1 box for the first column
      When I do not jump
      And the panda touches the column
      Then a second run with the same values and the same steps gives identical camera offsets

    Scenario: Restarting leaves the camera still
      Given the random source picks 1 box for the first column
      And I do not jump
      And the panda touches the column
      And 500 ms pass
      When I tap to play again
      Then the run restarts
      And the camera scroll is 0 on both axes

  Rule: With reduced motion the view never shakes

    Scenario: The camera stays still through the whole hit and game over
      Given the browser asks for reduced motion
      And the random source picks 1 box for the first column
      When I do not jump
      And the panda touches the column
      And 1000 ms pass
      Then the camera scroll is 0 on both axes at every step

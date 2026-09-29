Feature: Panda Jump on Phaser 4, slice: the dead panda tumbles to the floor
  As a player on the Panda Jump page
  I want the panda to fall and land after it dies in mid-air
  So that a death reads as an unmistakable, slightly comic tumble instead of a freeze-frame glitch

  Heights, times and "the random source picks" are as defined in features/phaser-4-core-run.feature.
  "Upside down" means the panda sprite is flipped vertically, matching the rules' pandaUpsideDown flag.
  "The two-box column scenario" means: the random source picks 2 boxes for the first column, and I
  press Space at 2300 ms; with no further input the panda rises, comes back down onto the column's
  top and touches it at about 3165 ms, above the floor.

  Background:
    Given I open the Panda Jump page
    And the run has just started

  Rule: A panda that dies above the floor keeps falling until it lands

    Scenario: Dying on top of a two-box column drops the panda straight down to the floor
      Given the two-box column scenario
      Then the panda is above the floor the instant the run ends
      When time passes while the game-over screen is shown
      Then the panda sinks lower every following moment, never higher than the frame before
      And the panda never rises again after the hit
      And the panda comes to rest with its feet exactly at the floor, y 426, and stays there

  Rule: Everything except the panda's height stays frozen while it falls after death

    Scenario: Game time, score, the columns, the clouds and the floor scroll do not move while the panda falls
      Given the two-box column scenario
      When 1000 ms pass while the game-over screen is shown
      Then the game time, the score, every box's x position, the clouds and the floor scroll are exactly
        as they were the instant the run ended, even though the panda's height has changed

  Rule: The panda is drawn upside down for exactly as long as the game is over

    Scenario: The panda flips the instant it dies and flips back the instant it restarts
      Given the random source picks 1 box for the first column
      When I do not jump
      Then the panda is drawn right-side up while the run is live
      When the panda touches the column
      Then the panda is drawn upside down
      When 500 ms pass and I tap to play again
      Then the panda is drawn right-side up again

  Rule: A panda that dies already on the floor does not need to fall

    Scenario: Dying without ever leaving the floor keeps the panda's feet at y 426
      Given the random source picks 1 box for the first column
      When I do not jump
      Then the panda touches the column at about 2890 ms with its feet already at the floor, y 426
      And the panda's feet stay at y 426 for as long as the game-over screen is shown

  Rule: The death tumble does not change the restart freeze or restart behaviour

    Scenario: The restart freeze, restart and Share score behave exactly as before after a mid-air death
      Given the two-box column scenario
      Then the page does not yet invite a tap, click or Space press to restart
      When enough time passes for the restart freeze described in features/phaser-4-core-run.feature to elapse
      Then the page reads "Tap, press Space or the Up Arrow key to play again"
      And, where the Web Share API is available, "Share score" is shown
      When I tap to play again
      Then the run restarts, the score reads "0", the panda stands on the floor with its left edge
        at x 100, right-side up, and no box is on screen

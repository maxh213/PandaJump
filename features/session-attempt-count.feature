Feature: Panda Jump shows the session's attempt count on the game over screen
  As a player on the Panda Jump page
  I want to see how many times I have played this session
  So that I have a sense of how many runs I have made without tracking it myself

  Heights and times use the same conventions as features/phaser-4-core-run.feature.
  "The standard schedule" is as defined in features/phaser-4-core-run.feature.
  The attempt number is restarts + 1: it reads "Run 1" for the very first death, before any
  restart has happened, and "Run N" for the death that follows the (N-1)th restart.
  The attempt number is kept only for the current page session; it is never read from or
  written to any store.

  Background:
    Given I open the Panda Jump page
    And the run has just started

  Rule: The game over screen shows the attempt number for this session

    Scenario: The first death reads Run 1
      Given the random source picks 1 box for the first column
      When I do not jump
      Then the panda touches the column at about 2875 ms
      And the page reads "Run 1" centred in white 20px Arial text on the game over screen
      And "Run 1" does not overlap "Game over", "Score: 0", "Best: 0" or "Tap, press Space or the Up Arrow key to play again"

    Scenario: The count is not shown while the run is live
      Then no text reading "Run 1" is visible

    Scenario: Each restart increases the attempt number by one
      Given the random source picks 1 box for the first column
      When I do not jump
      Then the panda touches the column at about 2875 ms
      And the page reads "Run 1" on the game over screen
      When 500 ms pass
      And I press Space
      Then the run restarts
      When I do not jump
      Then the panda touches the column at about 2875 ms after the latest restart
      And the page reads "Run 2" on the game over screen

  Rule: The attempt count is per session only, not persisted

    Scenario: A full page reload resets the count back to Run 1
      Given the random source picks 1 box and no second column for every column
      And I do not jump, and 500 ms after each death I tap to play again, until the panda has died 2 times
      When I reload the Panda Jump page
      And the random source picks 1 box for the first column
      And I do not jump
      Then the page reads "Run 1" on the game over screen

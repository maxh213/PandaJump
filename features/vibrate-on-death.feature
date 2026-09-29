Feature: Vibrate the device the instant the panda dies
  As a player on a phone that supports the Vibration API
  I want a short haptic pulse the instant the panda dies
  So that I feel the death immediately, matching the on-screen "Game over"

  Times and the standard schedule use the same conventions as features/phaser-4-core-run.feature.

  Background:
    Given I open the Panda Jump page

  Rule: A supporting device vibrates exactly once, on the frame the panda dies

    Scenario: The device vibrates once the moment the panda touches a column
      Given the random source picks 1 box for the first column
      When I do not jump
      Then the panda touches the column at about 2890 ms
      And navigator.vibrate has been called exactly once, with a short pattern
      And navigator.vibrate is not called again while the game over screen stays up

    Scenario: A run that never dies never vibrates
      Given I play the standard schedule, except that I stop jumping after clearing the first column
      Then the score reads "1" at 3340 ms
      And navigator.vibrate is never called

    Scenario: Restarting and dying again vibrates once more, for the new death
      Given the random source picks 1 box and no second column for every column
      When I do not jump
      And the panda touches the column, the game freezes, and tapping to play again restarts it
      And navigator.vibrate has been called exactly once so far
      And I do not jump again
      Then the panda touches the next column
      And navigator.vibrate has been called exactly twice in total, once per death

  Rule: A device without the Vibration API is unaffected

    Scenario: Dying normally on a device where navigator.vibrate is undefined
      Given navigator.vibrate is undefined
      And the random source picks 1 box for the first column
      When I do not jump
      Then the panda touches the column at about 2890 ms
      And the page reads "Game over"
      And no error is thrown or logged

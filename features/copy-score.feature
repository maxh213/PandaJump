Feature: Panda Jump on Phaser 4, slice: copy score from the game-over screen
  As a player on a browser without the Web Share API
  I want to copy my score once I die
  So that I can still paste it into a message myself

  Times are game time in ms since the run started, same as features/phaser-4-core-run.feature.
  "The restart freeze" is the 500ms window after death during which the game over screen does not
  yet invite a tap, click or Space press to restart, as in features/phaser-4-core-run.feature.
  "Sharing is supported" and "copying is supported" mean the browser's navigator.share and
  navigator.clipboard.writeText exist, as functions, same as features/share-score.feature.

  Background:
    Given I open the Panda Jump page
    And the run has just started

  Rule: Once the restart freeze has passed, a browser without sharing but with clipboard support shows a "Copy score" prompt

    Scenario: The copy prompt appears alongside the restart prompt once the freeze has elapsed
      Given sharing is not supported
      And copying is supported
      And the random source picks 1 box for the first column
      When I do not jump
      And the panda touches the column
      Then the page does not yet read "Copy score"
      When 499 ms pass
      Then the page still does not read "Copy score"
      When 1 more ms passes
      Then the page reads "Copy score" under the "Tap or press Space to play again" prompt, in white 20px Arial

  Rule: Tapping the copy prompt copies the run's score and the page URL, and does not restart

    Scenario: Tapping "Copy score" calls navigator.clipboard.writeText with the run's score and the page URL
      Given sharing is not supported
      And copying is supported
      And the random source picks 1 box and no second column for every column
      And I press Space at 2700 ms and then stop jumping
      When the panda touches the next column
      And 500 ms pass
      When I tap "Copy score"
      Then navigator.clipboard.writeText is called once, with "I scored 1 on Panda Jump! " followed by the page's URL
      And the run has not restarted
      And the page still reads "Game over"
      And the page still reads "Score: 1"

  Rule: On a browser with neither navigator.share nor navigator.clipboard.writeText, no prompt shows and the screen behaves as before

    Scenario: Neither prompt is shown when sharing and copying are both unsupported
      Given sharing is not supported
      And copying is not supported
      And the random source picks 1 box for the first column
      When I do not jump
      And the panda touches the column
      And 500 ms pass
      Then the page reads "Tap or press Space to play again"
      And the page does not read "Share score"
      And the page does not read "Copy score"

    Scenario: Tapping anywhere on the game-over screen still restarts when sharing and copying are both unsupported
      Given sharing is not supported
      And copying is not supported
      And the random source picks 1 box for the first column
      When I do not jump
      And the panda touches the column
      And 500 ms pass
      When I tap the canvas
      Then the run restarts

Feature: Panda Jump on Phaser 4, slice: share score from the game-over screen
  As a player on the Panda Jump page
  I want to share my score once I die
  So that other people can see how I did and try the game themselves

  Times are game time in ms since the run started, same as features/phaser-4-core-run.feature.
  "The restart freeze" is the 500ms window after death during which the game over screen does not
  yet invite a tap, click or Space press to restart, as in features/phaser-4-core-run.feature.
  "Sharing is supported" means the browser's navigator.share exists, as a function.

  Background:
    Given I open the Panda Jump page
    And the run has just started

  Rule: Once the restart freeze has passed, a supported browser shows a "Share score" prompt

    Scenario: The share prompt appears alongside the restart prompt once the freeze has elapsed
      Given sharing is supported
      And the random source picks 1 box for the first column
      When I do not jump
      And the panda touches the column
      Then the page does not yet read "Share score"
      When 499 ms pass
      Then the page still does not read "Share score"
      When 1 more ms passes
      Then the page reads "Share score" under the "Tap or press Space to play again" prompt, in white 20px Arial

  Rule: Tapping the share prompt shares the run's score and the page URL, and does not restart

    Scenario: Tapping "Share score" calls navigator.share with the run's score and the page URL
      Given sharing is supported
      And the random source picks 1 box and no second column for every column
      And I press Space at 2700 ms and then stop jumping
      When the panda touches the next column
      And 500 ms pass
      When I tap "Share score"
      Then navigator.share is called once, with text "I scored 1 on Panda Jump!" and the page's URL
      And the run has not restarted
      And the page still reads "Game over"
      And the page still reads "Score: 1"

  Rule: On a browser without navigator.share, the prompt never shows and the screen behaves as before

    Scenario: The share prompt is not shown when sharing is unsupported
      Given sharing is not supported
      And the random source picks 1 box for the first column
      When I do not jump
      And the panda touches the column
      And 500 ms pass
      Then the page reads "Tap or press Space to play again"
      And the page does not read "Share score"

    Scenario: Tapping anywhere on the game-over screen still restarts when sharing is unsupported
      Given sharing is not supported
      And the random source picks 1 box for the first column
      When I do not jump
      And the panda touches the column
      And 500 ms pass
      When I tap the canvas
      Then the run restarts

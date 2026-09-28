Feature: Panda Jump on Phaser 4, slice: count the game-over score up from 0 to the final score
  As a player who has just died
  I want the "Score: N" line on the game-over screen to tick up from 0 to my final score
  So that the end of every run feels like a small payoff without slowing the instant restart

  Times are game time in ms, same as features/phaser-4-core-run.feature.
  "The standard schedule" is as defined in features/phaser-4-core-run.feature.
  The count-up runs for the 500 ms restart freeze: at death the line reads "Score: 0", and
  deathElapsed ms later it reads floor(final score * deathElapsed / 500), reaching "Score: <final
  score>" at 500 ms and staying there. Only the "Score: N" line on the game-over screen counts:
  the top-left score, the tab title, the medal, and the text that "Share score" and "Copy score"
  send always use the final score.

  Background:
    Given I open the Panda Jump page
    And the run has just started

  Rule: The game-over score counts up from 0 to the final score over the 500 ms restart freeze

    Scenario: A run that dies at score 3 counts up during the freeze
      Given the random source picks 1 box and no second column for every column
      And I press Space at 2700 ms, 4200 ms and 5700 ms and then stop jumping
      When the panda touches the column
      Then the page reads "Score: 0" on the game-over screen
      When 250 ms pass
      Then the page reads a number strictly between 0 and 3 on the game-over screen
      When 250 ms pass
      Then the page reads "Score: 3" on the game-over screen
      When 300 ms pass
      Then the page reads "Score: 3" on the game-over screen

    Scenario: A run that dies at score 0 reads "Score: 0" throughout
      Given the random source picks 1 box for the first column
      When I do not jump
      And the panda touches the column
      Then the page reads "Score: 0" on the game-over screen
      When 800 ms pass
      Then the page reads "Score: 0" on the game-over screen

  Rule: Everything else keeps showing the final score while the count runs

    Scenario: The top-left score and the tab title show the final score during the count-up
      Given I die at score 3 as above
      When 250 ms pass
      Then the top-left score reads "3"
      And the tab title contains "3"

    Scenario: Share score and Copy score send the final score
      Given I die at score 3 as above
      And 500 ms pass
      When I tap "Share score"
      Then navigator.share is called with the text "I scored 3 on Panda Jump!"
      When sharing is unsupported and I tap "Copy score" on a fresh run
      Then navigator.clipboard.writeText is called with text containing "I scored 3 on Panda Jump!"

  Rule: Restarting works exactly as before

    Scenario: The restart prompt appears at 500 ms and a tap then restarts
      Given I die at score 3 as above
      When 499 ms pass
      Then the restart prompt is hidden
      When 1 ms passes
      Then the restart prompt is shown
      When I tap to play again
      Then the run restarts

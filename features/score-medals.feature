Feature: Panda Jump awards a medal on the game-over screen
  As a player who dies with a meaningful score
  I want a bronze, silver, gold or platinum medal on the game-over screen
  So that I have a readable step to aim for between my current level and my best

  Heights and times use the same conventions as features/phaser-4-core-run.feature.
  "The standard schedule" is as defined in features/phaser-4-core-run.feature: the random source
  picks 1 box and no second column for every column, and I press Space 1200 ms after each column
  spawns.
  The medal is drawn as text centred at (200, 226) in 16px Arial, between the "Game over" title
  and the "Score: N" line: "Bronze medal" in #cd7f32 for a final score of 10 to 19, "Silver medal"
  in #c0c0c0 for 20 to 29, "Gold medal" in #ffd700 for 30 to 39, "Platinum medal" in #e5e4e2 for
  40 and above, and no medal text for a score below 10.

  Background:
    Given I open the Panda Jump page
    And the run has just started

  Rule: No medal shows below a score of 10

    Scenario: A run that dies at score 0 shows no medal
      Given the random source picks 1 box for the first column
      When I do not jump
      Then the panda touches the column at about 2875 ms
      And the page reads "Score: 0" on the game-over screen
      And no medal text is shown

    Scenario: A run that dies at score 9 shows no medal
      Given I play the standard schedule through column 9 and then stop jumping
      Then the page reads "Score: 9" on the game-over screen
      And no medal text is shown

  Rule: The game-over screen shows the medal that matches the final score

    Scenario: A run that dies at score 10 shows a bronze medal
      Given I play the standard schedule through column 10 and then stop jumping
      Then the page reads "Score: 10" on the game-over screen
      And the page reads "Bronze medal" centred at (200, 226) in 16px Arial, in #cd7f32
      And "Bronze medal" does not overlap "Game over" or "Score: 10"

    Scenario: A run that dies at score 20 shows a silver medal
      Given I play the standard schedule through column 20 and then stop jumping
      Then the page reads "Score: 20" on the game-over screen
      And the page reads "Silver medal" centred at (200, 226) in 16px Arial, in #c0c0c0

  Rule: The medal only shows on a game-over screen for the run that earned it

    Scenario: The medal is hidden while the run is live and disappears after restart
      Given I play the standard schedule through column 10
      Then no medal text is visible while the run has not yet frozen
      When the panda touches the next column, the game freezes
      Then the page reads "Bronze medal" on the game-over screen
      When 500 ms pass
      And I press Space
      Then the run restarts
      And no medal text is visible
      When I do not jump again
      Then the panda touches the first column of the new run, freezing it
      And the page reads "Score: 0" on the game-over screen
      And no medal text is shown

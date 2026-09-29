Feature: Panda Jump on Phaser 4, slice: the game-over rank
  As a player on the Panda Jump page
  I want the game-over screen to say when a run placed 2nd to 5th among my best runs
  So that I see my progress without any pressure to keep playing

  "The top five" is the list stored under pandaJump.topScores before the run ended.
  "The placing" is 1 plus the number of scores in that list strictly greater than the final score.
  "Restart is allowed" means the 500 ms score count-up on the game-over screen has finished.

  Background:
    Given I open the Panda Jump page
    And the run has just started

  Rule: A run that placed 2nd to 5th says so once restart is allowed

    Scenario: A run ending on 15 among 30, 20 and 10 is the 3rd best
      Given the stored best is 30 and the top five is [30,20,10]
      When the run ends on 15
      Then the game-over score line reads "Score: 15 (3rd best)" once restart is allowed

    Scenario: A run ending on 6 among 8, 5 and 3 is the 2nd best
      Given the stored best is 8 and the top five is [8,5,3]
      When the run ends on 6
      Then the game-over score line reads "Score: 6 (2nd best)" once restart is allowed

    Scenario: A run ending on 5 among 30, 20 and 10 is the 4th best
      Given the stored best is 30 and the top five is [30,20,10]
      When the run ends on 5
      Then the game-over score line reads "Score: 5 (4th best)" once restart is allowed

  Rule: Nothing is added when the run did not place 2nd to 5th

    Scenario: A run outside a full top five shows no suffix
      Given the stored best is 50 and the top five is [50,40,30,20,10]
      When the run ends on 5
      Then the game-over score line reads "Score: 5"

    Scenario: A run that overtakes the stored best shows no suffix and still says New best
      Given the stored best is 3 and the top five is [3,2]
      When the run ends on 4
      Then the game-over score line reads "Score: 4" and the best line reads "New best: 4"

    Scenario: A run that equals the stored best shows no suffix
      Given the stored best is 3 and the top five is [3,2]
      When the run ends on 3
      Then the game-over score line reads "Score: 3"

    Scenario: A run ending on 0 shows no suffix
      Given the stored best is 3 and the top five is [3,2]
      When the run ends on 0
      Then the game-over score line reads "Score: 0"

  Rule: The suffix waits for the count-up

    Scenario: While the score counts up the line has no suffix
      Given the stored best is 30 and the top five is [30,20,10]
      When the run ends on 5 and 250 ms have passed
      Then the game-over score line reads "Score: N" with no suffix
      And it reads "Score: 5 (4th best)" once restart is allowed

  Rule: The suffix is worked out afresh for every game-over screen

    Scenario: Restarting clears the suffix
      Given the stored best is 30 and the top five is [30,20,10]
      When the run ends on 2 and I restart and the next run ends on 0
      Then the second game-over score line reads "Score: 0"

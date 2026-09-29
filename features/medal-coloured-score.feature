Feature: Panda Jump colours the live score by medal
  As a player in the middle of a run
  I want the top-left score to turn bronze, silver, gold or platinum the moment I earn that medal
  So that I notice I have reached a goal without any sound

  Times and the standard schedule are as defined in features/phaser-4-core-run.feature:
  the random source picks 1 box and no second column for every column, and I press Space
  1200 ms after each column spawns.
  The score text sits at (20, 20) in 30px Arial with a black outline (stroke #000000,
  thickness 4). Its colour is #ffffff for a score of 0 to 9, #cd7f32 for 10 to 19, #c0c0c0
  for 20 to 29, #ffd700 for 30 to 39 and #e5e4e2 for 40 and above, and it changes on the same
  frame as the number.

  Background:
    Given I open the Panda Jump page
    And the run has just started

  Rule: The score stays white below a score of 10

    Scenario: Scores 0 to 9 are white
      Given I play the standard schedule through column 9
      Then on every frame the score text is #ffffff

  Rule: The score takes the colour of the medal the run has earned

    Scenario: Each medal threshold recolours the score on the frame the number changes
      Given I play the standard schedule through column 40
      Then the score is #ffffff up to 9, #cd7f32 at 10, #c0c0c0 at 20, #ffd700 at 30 and #e5e4e2 at 40
      And on every frame the colour matches the number shown

  Rule: The outline, position and pop are unchanged

    Scenario: A coloured score keeps its outline, position and pop
      Given I play the standard schedule through column 10
      Then the score text is at (20, 20) with stroke #000000 and thickness 4
      And it pops to scale 1.3 when column 10 is cleared

  Rule: A restart returns the score to white

    Scenario: The score is white again after a bronze run restarts
      Given I play the standard schedule through column 10 and then stop jumping
      When the game freezes and I restart
      Then the score reads "0" in #ffffff

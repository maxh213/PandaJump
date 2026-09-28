Feature: Panda Jump on Phaser 4, slice: the score pop
  As a player on the Panda Jump page
  I want the top-left score number to briefly grow each time I clear a column
  So that I notice the point mid-jump, with no sound to rely on

  Times and the standard schedule are as defined in features/phaser-4-core-run.feature:
  the random source picks 1 box and no second column for every column, and I press Space
  1200 ms after each column spawns, so column n spawns at 1500 x n ms and is cleared at
  1500 x n + 1820 ms.
  "The pop" means the score text's scale: 1 normally, 1.3 the instant the live score goes
  up, falling in a straight line back to 1 over the next 150 ms of game time. If the score
  goes up again before the 150 ms has passed, the pop starts over from 1.3 at that moment.
  The score text sits at (20, 20) in white 30px Arial throughout, unchanged by the pop.

  Background:
    Given I open the Panda Jump page
    And the run has just started

  Rule: The score pops the instant a column is cleared, then eases back to normal size

    Scenario: The score starts at scale 1 and stays there until the first column is cleared
      Given the random source picks 1 box and no second column for every column
      When I press Space at 2700 ms
      Then the score reads "0" at scale 1 at 3300 ms, before the column is cleared

    Scenario: The score jumps to scale 1.3 the instant it changes, then eases back to 1 over 150 ms
      Given the random source picks 1 box and no second column for every column
      When I press Space at 2700 ms
      Then the score reads "1" at scale 1.3 (within 0.01) the instant it changes, around 3320 ms
      And 75 ms later the scale reads 1.15 (within 0.02)
      And from 150 ms after that instant onward the scale reads exactly 1

    Scenario: The score text never moves or changes font while it pops
      Given the random source picks 1 box and no second column for every column
      When I press Space at 2700 ms
      Then the score text sits at (20, 20) in white 30px Arial before, during and after the pop

  Rule: A restart clears the pop along with everything else

    Scenario: Dying and tapping to play again leaves the score at scale 1
      Given the random source picks 1 box and no second column for every column
      When I press Space at 2700 ms and then stop jumping
      Then the score reads "1" and the panda touches the next column, freezing the run
      When the panda touches the next column, the game freezes, and tapping to play again restarts it
      Then the score reads "0" at scale 1

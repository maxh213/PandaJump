Feature: Panda Jump on Phaser 4, slice 2: the high score
  As a player on the Panda Jump page
  I want my best score kept between visits
  So that I can see how I compare to my past runs without writing it down myself

  Heights and times use the same conventions as features/phaser-4-core-run.feature.
  "The stored best" means the value under the key "pandaJump.best" in the browser's localStorage.
  Unless a scenario says otherwise, the stored best is empty before the page opens.
  "The standard schedule" is as defined in features/phaser-4-core-run.feature: the random source
  picks 1 box and no second column for every column, and I press Space 1200 ms after each column
  spawns, so a column is cleared 1820 ms after it spawns.

  Background:
    Given I open the Panda Jump page
    And the run has just started

  Rule: The best score is drawn and kept live

    Scenario: A first-time player sees a best of 0
      Then the page reads "Best: 0" in white 20px Arial text anchored bottom-left at (20, 450)

    Scenario: The best updates the instant the live score passes it, not only at death
      Given the stored best is 0
      When I press Space at 2700 ms
      Then the page reads "Best: 0" at 3300 ms, before the column is cleared
      And the page reads "Best: 1" at 3340 ms, the same moment the score reads "1"
      And the run has not restarted

    Scenario: Dying does not reset the best already reached
      Given the stored best is 0
      When I press Space at 2700 ms and then stop jumping
      Then the page reads "Best: 1" at 3340 ms
      When the panda touches the next column, the game freezes, and tapping to play again restarts it
      Then the score reads "0"
      And the page still reads "Best: 1"

    Scenario: A lower score never lowers the best
      Given the stored best is 5
      Then the page reads "Best: 5"
      When I press Space at 2700 ms and then stop jumping
      And the panda touches the next column, the game freezes, and tapping to play again restarts it
      Then the score reads "0"
      And the page still reads "Best: 5"

  Rule: The best is kept in the browser between visits

    Scenario: A returning player sees their stored best on load
      Given the stored best is 7
      When I open the Panda Jump page
      Then the page reads "Best: 7"

    Scenario: Beating the stored best persists it across a reload
      Given the stored best is 0
      When I press Space at 2700 ms
      And I wait until the page reads "Best: 1"
      And I reload the Panda Jump page
      Then the page reads "Best: 1"

    Scenario: The stored best is not overwritten by a lower score
      Given the stored best is 5
      When I press Space at 2700 ms and then stop jumping
      And the panda touches the next column, the game freezes, and tapping to play again restarts it
      And I reload the Panda Jump page
      Then the page reads "Best: 5"

  Rule: A missing, corrupt or blocked store never breaks the game

    Scenario: No stored value yet is treated as a best of 0
      Given there is no value under "pandaJump.best"
      Then the page reads "Best: 0"
      And no error is thrown or logged

    Scenario: A non-numeric stored value is treated as a best of 0
      Given the value under "pandaJump.best" is "not-a-number"
      Then the page reads "Best: 0"
      And no error is thrown or logged

    Scenario: A blocked localStorage is treated as a best of 0
      Given localStorage throws whenever it is read or written
      Then the page reads "Best: 0"
      And no error is thrown or logged
      When I press Space at 2700 ms
      Then the page reads "Best: 1" at 3340 ms
      And no error is thrown or logged

  Rule: The existing run keeps its own behaviour

    Scenario: The floor still scrolls without a seam under the new text
      When 2000 ms pass
      Then the rock and grass tiles have moved 400 px to the left with no seam
      And no pixel in the bottom-left best text's row is mistaken for a moved floor tile

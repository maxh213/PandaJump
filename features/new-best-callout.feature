Feature: Panda Jump on Phaser 4, slice: the new-best callout
  As a player on the Panda Jump page
  I want a visible acknowledgment the instant my live score beats my stored best
  So that I notice the accomplishment instead of just seeing a digit change mid-jump

  Heights and times use the same conventions as features/phaser-4-core-run.feature.
  "The stored best" and "the standard schedule" are as defined in features/high-score.feature:
  the random source picks 1 box and no second column for every column, and I press Space
  1200 ms after each column spawns, so column n spawns at 1500 x n ms and is cleared at
  1500 x n + 1820 ms.
  "The callout" means the bottom-left best text turns gold (#ffd700) instead of its normal
  white (#ffffff), for exactly 600 ms, then returns to white.

  Background:
    Given I open the Panda Jump page
    And the run has just started

  Rule: The callout fires the instant the live score first overtakes the stored best

    Scenario: A first-time player's first cleared column triggers the callout, since the stored best was 0
      Given the stored best is 0
      When I press Space at 2700 ms
      Then the page reads "Best: 0" in white at 3300 ms, before the column is cleared
      And the page reads "Best: 1" in gold (#ffd700) at 3340 ms, the same moment the score reads "1"
      And the page reads "Best: 1" in gold (#ffd700) at 3700 ms, still within the 600 ms callout
      And the page reads "Best: 1" in white again at 4000 ms, after the 600 ms callout has elapsed
      And the run has not restarted

    Scenario: A returning player beating a non-zero stored best also gets the callout
      Given the stored best is 5
      When I press Space at 2700, 4200, 5700, 7200, 8700 and 10200 ms
      Then the page reads "Best: 5" in white at 10150 ms, before the sixth column is cleared
      And the page reads "Best: 6" in gold (#ffd700) at 10840 ms, the same moment the score reads "6"

  Rule: The callout fires at most once per run

    Scenario: Clearing a further column after already holding the best does not retrigger the callout
      Given the stored best is 0
      When I press Space at 2700 ms
      Then the page reads "Best: 1" in gold (#ffd700) at 3340 ms
      And the page reads "Best: 1" in white again at 4000 ms, after the 600 ms callout has elapsed
      When I press Space at 4200 ms
      Then the page reads "Best: 2" in white at 4840 ms, the same moment the score reads "2"
      And the run has not restarted

  Rule: Dying and restarting resets the callout state

    Scenario: A later run beating the now-higher stored best triggers the callout again
      Given the stored best is 0
      When I press Space at 2700 ms and then stop jumping
      Then the page reads "Best: 1" in gold (#ffd700) at 3340 ms
      When the panda touches the next column, the game freezes, and tapping to play again restarts it
      Then the score reads "0"
      And the page reads "Best: 1" in white
      When I press Space at 2700 and 4200 ms after the restart
      Then the page reads "Best: 1" in white at 3340 ms after the restart, the same moment the score reads "1", since it only matches the stored best and does not overtake it
      And the page reads "Best: 2" in gold (#ffd700) at 4840 ms after the restart, the same moment the score reads "2"

Feature: Panda Jump shows a brief "Faster!" callout each time the game speeds up
  As a player whose run has just gotten harder
  I want a clear on-screen signal the instant the speed changes
  So that I know the game sped up rather than think my timing has slipped

  Times use the same conventions as features/phaser-4-core-run.feature.
  "The ramped schedule" is as defined in features/difficulty-ramp.feature: the random source
  picks 1 box and no second column for every column, and I press Space 788 ms after each column
  spawns rather than 1200 ms, since once the ramp has sped columns up a jump timed for the flat
  200 px/s schedule lands too late. Column n is cleared at 1500 x n + 1820 ms and the score reads
  n from that moment.
  "The callout" means centred text reading "Faster!" in gold (#ffd700) 24px Arial at (200, 120).

  Background:
    Given I open the Panda Jump page
    And the run has just started

  Rule: The callout is hidden until the speed first changes

    Scenario: No callout shows while the score stays below the first ramp at 20
      Given I play the ramped schedule through column 19
      Then the score reads "19"
      And the callout is not visible

  Rule: The callout fires the instant the speed changes, for 800ms of game time

    Scenario: The callout appears the moment the score reaches 20 and hides 800ms later
      Given I play the ramped schedule through column 20
      Then the score reads "20"
      And the callout is visible
      When 799 ms more pass
      Then the callout is still visible
      When 1 ms more passes
      Then the callout is hidden

  Rule: The callout fires again at every later ramp step, but not once the speed hits its cap

    Scenario: The callout appears again when the score reaches the next ramp step at 30
      Given I play the ramped schedule through column 30
      Then the score reads "30"
      And the callout is visible

    Scenario: The callout does not appear at score 70, since the speed already capped at 60
      Given I play the ramped schedule through column 60
      Then the score reads "60"
      And the callout is visible
      When I keep playing the ramped schedule through column 70
      Then the score reads "70"
      And the callout is not visible

  Rule: The callout never shows on the game-over or pause screens, and a restart hides it

    Scenario: The callout hides once the run ends, even moments after the speed just changed
      Given I play the ramped schedule through column 20 and then stop jumping
      Then the callout is visible
      When the panda touches the next column, the game freezes, and tapping to play again restarts it
      Then the callout is not visible on the game-over screen
      And the score reads "0"
      And the callout is not visible after the restart

    Scenario: The callout hides while the game is paused, even moments after the speed just changed
      Given I play the ramped schedule through column 20
      Then the callout is visible
      When the page becomes hidden
      Then the callout is not visible

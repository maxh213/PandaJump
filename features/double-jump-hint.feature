Feature: Panda Jump tells a first-time player on the canvas that they can tap again in mid-air to double jump
  As a player who has never scored in this browser
  I want the game to show me the double jump before I need it
  So that I am never surprised by a double column I could not have known how to clear

  Times use the same conventions as features/phaser-4-core-run.feature.
  "The hint" means centred text reading "Tap again in mid-air to double jump" in white 16px Arial at (200, 150).
  "A first-time player" is one whose stored best is 0 when the page opens. The hint shows only for them,
  only while the run is live, and only while the score is below 3.

  Background:
    Given I open the Panda Jump page with no stored best
    And the run has just started

  Rule: The hint shows to a first-time player on a live run

    Scenario: The hint is visible at the start of the run
      Then the hint is visible
      And the hint is centred at (200, 150) in white 16px Arial

    Scenario: A floor jump does not hide the hint
      When I press Space and 100 ms pass
      Then the hint is visible

  Rule: The hint disappears at the first air jump and stays hidden for the page session

    Scenario: The hint hides the moment I jump again in mid-air, and stays hidden after I die and restart
      When I press Space, 100 ms pass, and I press Space again
      Then the hint is hidden
      When the panda touches a column, the game freezes, and tapping to play again restarts it
      Then the score reads "0"
      And the hint is hidden

  Rule: The hint hides once the score reaches 3 and returns at score 0 of the next run

    Scenario: The hint hides at score 3 and shows again after a restart
      Given I press Space 1200 ms after each column spawns and never jump in mid-air
      Then the hint is visible while the score reads "2"
      And the hint is hidden once the score reads "3"
      When the panda touches a column, the game freezes, and tapping to play again restarts it
      Then the score reads "0"
      And the hint is visible

  Rule: The hint hides on the game-over screen, the Paused screen and the resume countdown

    Scenario: The hint hides on the Paused screen and during the countdown
      When the page becomes hidden
      Then the hint is hidden
      When I tap to resume
      Then the hint is hidden while the countdown shows
      And the hint is visible once the countdown ends

    Scenario: The hint hides on the game-over screen
      When the panda touches a column and the game freezes
      Then the hint is hidden

  Rule: A player with a stored best never sees the hint, and a reload shows it again

    Scenario: With a stored best of 1 the hint never appears
      Given I open the Panda Jump page with a stored best of 1
      Then the hint is hidden
      When 100 ms pass
      Then the hint is hidden

    Scenario: Reloading with no stored best shows the hint again after an air jump
      When I press Space, 100 ms pass, and I press Space again
      And I reload the page
      Then the hint is visible

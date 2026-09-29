Feature: A player can play Panda Jump with a game controller
  As a player with an Xbox, PlayStation or Switch Pro pad
  I want the bottom face button to jump and the Start button to pause
  So that I can play without reaching for the keyboard

  Heights and times use the same conventions as features/phaser-4-core-run.feature.

  Background:
    Given I open the Panda Jump page
    And a standard-mapping game controller is connected
    And the run has just started

  Rule: The bottom face button jumps and double jumps like Space

    Scenario: Button 0 jumps and a second press in mid-air double jumps
      And the random source picks 1 box for every column
      When I press the bottom face button
      And 200 ms pass
      Then the panda is above the floor
      When I press the bottom face button
      And 200 ms pass
      Then the panda is higher than before

    Scenario: Holding the bottom face button across many frames produces exactly one jump
      And the random source picks 1 box for every column
      When I hold the bottom face button down
      And 100 ms pass
      Then the panda is above the floor
      When 1700 ms pass
      Then the panda is back on the floor and stays there

  Rule: The bottom face button resumes a paused run and restarts after game over

    Scenario: Button 0 while paused starts the countdown
      And the random source picks 1 box for every column
      When 1000 ms pass
      And I press the Start button
      And I press the bottom face button
      Then the pause texts are gone
      And the page reads "3" centred in white 40px at (200, 190)
      And the panda is still on the floor

    Scenario: Button 0 restarts the run after the 500 ms freeze
      And the random source picks 1 box for every column
      When I do not jump
      Then the game over screen shows
      When I press the bottom face button
      Then the run has not restarted
      When 500 ms pass
      And I press the bottom face button
      Then the run has restarted

  Rule: The Start button pauses and resumes like P

    Scenario: Button 9 pauses without a jump and a second press starts the countdown
      And the random source picks 1 box for every column
      When 1000 ms pass
      And I press the Start button
      Then the page reads "Paused" centred in white 40px at (200, 190)
      And the panda still stands on the floor
      When I press the Start button
      Then the pause texts are gone
      And the page reads "3" centred in white 40px at (200, 190)
      And the panda is still on the floor

  Rule: Other buttons do nothing

    Scenario: Button 1 neither jumps nor pauses
      And the random source picks 1 box for every column
      When 1000 ms pass
      And I press the right face button
      Then the panda still stands on the floor
      And the page does not read "Paused"

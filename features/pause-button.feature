Feature: A player can pause a run with an on-screen "II" button
  As a player on a phone with no P or Escape key
  I want a button I can tap to pause a run on purpose
  So that I can step away without switching tabs or losing my run

  Heights and times use the same conventions as features/phaser-4-core-run.feature.

  Background:
    Given I open the Panda Jump page
    And the run has just started
    And the random source picks 1 box for every column

  Rule: The "II" button shows during a live run, top-right and fully on screen

    Scenario: The button reads "II" in white Arial 24px, right-aligned inside the canvas
      When 1000 ms pass
      Then the page reads "II" in white Arial 24px with its right edge at (380, 20)
      And the button fits fully inside the 400px-wide canvas

  Rule: Tapping "II" pauses the run and shows the pause texts, without making the panda jump

    Scenario: Tapping the button pauses the run
      When 1000 ms pass
      And I tap "II"
      Then the page reads "Paused" centred in white 40px at (200, 190)
      And the page reads "Tap, press Space or the Up Arrow key to continue" centred in white 16px at (200, 320)

    Scenario: Tapping the button does not change the panda's height
      When 1000 ms pass
      And I tap "II"
      Then the panda's height just after the tap is the same as it was just before it

    Scenario: A run paused with the button does not advance
      When 1000 ms pass
      And I tap "II"
      And 2000 ms pass
      Then the game time is still 1000 ms
      And no box is on screen
      And the panda still stands on the floor
      And the floor has scrolled no further than it had at 1000 ms

  Rule: The button is hidden while paused, on the game-over screen, and until a new run is live

    Scenario: The button disappears the moment the run pauses
      When 1000 ms pass
      And I tap "II"
      Then the page does not read "II"

    Scenario: The button is hidden on the game-over screen and returns once the new run is live
      When I do not jump
      Then the panda touches the column and the game over screen shows
      Then the page does not read "II"
      When 500 ms pass
      And I tap the canvas
      Then the run restarts
      And the page reads "II" again

  Rule: Resuming a pause started with "II" works exactly like resuming a P or Escape pause

    Scenario: Space starts the same 3, 2, 1 countdown as resuming a P or Escape pause, without a jump, and the run continues normally
      When 1000 ms pass
      And I tap "II"
      And I press Space
      Then both pause texts are gone
      And the page reads "3" centred in white 40px at (200, 190)
      And the panda is still on the floor
      And the game time is still 1000 ms
      When 500 ms pass
      Then the page reads "2" centred in white 40px at (200, 190)
      When 500 ms pass
      Then the page reads "1" centred in white 40px at (200, 190)
      When 500 ms pass
      Then the page shows no countdown digit
      And the panda is still on the floor
      When the game time reaches 1500 ms
      Then the first column has spawned
      When I press Space at 2700 ms game time
      Then the score reads "1" at 3340 ms game time

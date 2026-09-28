Feature: Panda Jump holds a run paused after the player leaves the tab
  As a player whose phone hides the game tab mid-run, through a notification, an app switch or a locked screen
  I want the run to stay paused until I tap or press Space to continue
  So that I am not killed by a column that kept moving while I was not looking

  Heights and times use the same conventions as features/phaser-4-core-run.feature.
  "The page becomes hidden" and "the page becomes visible again" mean the suite sets
  document.visibilityState to "hidden", or back to "visible", and dispatches a visibilitychange
  event, simulating what happens when a phone hides or restores the tab.

  Background:
    Given I open the Panda Jump page
    And the run has just started
    And the random source picks 1 box for every column

  Rule: Hiding then showing the tab during a live run pauses it and shows the pause texts

    Scenario: The pause texts appear once the tab is shown again
      When 1000 ms pass
      And the page becomes hidden
      And the page becomes visible again
      Then the page reads "Paused" centred in white 40px at (200, 190)
      And the page reads "Tap or press Space to continue" centred in white 20px at (200, 320)

    Scenario: A paused run does not advance
      When 1000 ms pass
      And the page becomes hidden
      And the page becomes visible again
      And 2000 ms pass
      Then the game time is still 1000 ms
      And no box is on screen
      And the panda still stands on the floor
      And the floor has scrolled no further than it had at 1000 ms

  Rule: Resuming a paused run does not make the panda jump, and the run then continues normally

    Scenario Outline: Each control resumes the run without a jump
      When 1000 ms pass
      And the page becomes hidden
      And the page becomes visible again
      And I <action>
      Then both pause texts are gone
      And the panda is still on the floor
      When the game time reaches 1500 ms
      Then the first column has spawned
      When I press Space at 2700 ms game time
      Then the score reads "1" at 3340 ms game time

      Examples:
        | action           |
        | press Space      |
        | click the canvas |
        | tap the canvas   |

  Rule: Pausing has no effect on the game-over screen

    Scenario: Hiding the tab while the game-over screen is shown does not show "Paused", and restart still works
      When I do not jump
      Then the panda touches the column and the game over screen shows
      When the page becomes hidden
      And the page becomes visible again
      Then the page does not read "Paused"
      And the page still reads "Game over"
      When 500 ms pass
      And I press Space
      Then the run restarts

Feature: Panda Jump holds a run paused when the browser window loses focus
  As a desktop player who clicks another application or another monitor mid-run
  I want the run to pause the moment the game window loses focus and stay paused until I tap or press Space
  So that key presses that no longer reach the page do not cost me a run

  Heights and times use the same conventions as features/phaser-4-core-run.feature.
  "The window loses focus" and "the window regains focus" mean the suite dispatches a blur, or a
  focus, event on window, simulating the player switching to another application and back.

  Background:
    Given I open the Panda Jump page
    And the run has just started
    And the random source picks 1 box for every column

  Rule: Losing focus during a live run pauses it at once and shows the pause texts

    Scenario: The pause texts appear as soon as the window loses focus
      When 1000 ms pass
      And the window loses focus
      Then the page reads "Paused" centred in white 40px at (200, 190)
      And the page reads "Tap, press Space or the Up Arrow key to continue" centred in white 16px at (200, 320)

    Scenario: A run paused by losing focus does not advance
      When 1000 ms pass
      And the window loses focus
      And 2000 ms pass
      Then the game time is still 1000 ms
      And no box is on screen
      And the score reads "0"

    Scenario: Regaining focus on its own does not resume the run
      When 1000 ms pass
      And the window loses focus
      And the window regains focus
      And 2000 ms pass
      Then the page still reads "Paused" centred in white 40px at (200, 190)
      And the game time is still 1000 ms

  Rule: A run paused by losing focus resumes with the usual 3, 2, 1 countdown

    Scenario Outline: Each control starts a 1500 ms countdown and the run then continues
      When 1000 ms pass
      And the window loses focus
      And the window regains focus
      And I <action>
      Then both pause texts are gone
      And the page reads "3" centred in white 40px at (200, 190)
      When 1500 ms pass
      Then the page shows no countdown digit
      And the game time is still 1000 ms
      When the game time reaches 1500 ms
      Then the first column has spawned

      Examples:
        | action           |
        | press Space      |
        | press Up Arrow   |
        | click the canvas |
        | tap the canvas   |

  Rule: Losing focus during the resume countdown returns to the paused screen

    Scenario: The countdown is replaced by the pause texts
      When 1000 ms pass
      And the window loses focus
      And I press Space
      And 500 ms pass
      And the window loses focus
      Then the page reads "Paused" centred in white 40px at (200, 190)
      And the page shows no countdown digit
      And the game time is still 1000 ms

  Rule: Losing focus has no effect on the game-over screen

    Scenario: Losing focus while the game-over screen is shown does not show "Paused", and restart still works
      When I do not jump
      Then the panda touches the column and the game over screen shows
      When the window loses focus
      Then the page does not read "Paused"
      And the page still reads "Game over"
      When 500 ms pass
      And I press Space
      Then the run restarts

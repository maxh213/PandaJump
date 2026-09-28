Feature: Panda Jump waits for the player's first tap, click or Space press before the run starts
  As a player who has just opened the Panda Jump page
  I want the run to wait for my first input
  So that I am not killed by a column while I am still reading the controls or getting ready

  Heights, times and random-source conventions are as defined in features/phaser-4-core-run.feature.
  Restarting from the game-over screen is unaffected by this feature: it stays instant and never
  shows the ready screen, as features/phaser-4-core-run.feature already describes.

  Background:
    Given I open the Panda Jump page

  Rule: A fresh page load waits on a ready screen and nothing moves

    Scenario: The ready prompt is shown and no game-over text is visible
      Then the page reads "Tap or press Space to start" centred in white 20px Arial at (200, 320)
      And no game-over text is visible

    Scenario: With no input, the clock, score, boxes, panda and clouds all stay put
      When 5000 ms pass
      Then the run's time is still 0
      And the score still reads "0"
      And no box is on screen
      And the run has not ended
      And the panda's feet are still on the floor at y 426
      And the clouds and the floor scroll have not moved

  Rule: The player's first input starts the run without jumping

    Scenario Outline: Each control starts the run on the first press, without a jump
      When I <action>
      Then the ready prompt is gone
      And the panda's feet are still on the floor right after that input
      When 1500 ms pass after that input
      Then column 1 has spawned, exactly as a run's start behaves

      Examples:
        | action           |
        | click the canvas |
        | tap the canvas   |
        | press Space      |

    Scenario: Every press after the first works as a normal jump, including a double jump
      Given I pressed Space to start the run
      When I press Space
      Then the panda leaves the floor
      When I press Space again at 580 ms after that jump
      Then the panda peaks 199 px above the floor

  Rule: Restarting after death stays instant and skips the ready screen

    Scenario: Restarting from the game-over screen does not show the ready prompt again
      Given the random source picks 1 box for the first column
      And I pressed Space to start the run
      When I do not jump
      And the panda touches the column
      And 500 ms pass
      When I press Space
      Then the run restarts
      And the ready prompt is not shown
      When 1500 ms pass after the restart
      Then column 1 has spawned

Feature: A player can pause and resume a run on purpose with the P or Escape key
  As a player who needs to look away from a desktop game for a second
  I want to pause the run myself instead of having to die or switch tabs
  So that I can step away without losing my run

  Heights and times use the same conventions as features/phaser-4-core-run.feature.

  Background:
    Given I open the Panda Jump page
    And the run has just started
    And the random source picks 1 box for every column

  Rule: Pressing P or Escape during a live run pauses it and shows the pause texts

    Scenario Outline: The pause texts appear as soon as the key is pressed
      When 1000 ms pass
      And I press <key>
      Then the page reads "Paused" centred in white 40px at (200, 190)
      And the page reads "Tap or press Space to continue" centred in white 20px at (200, 320)

      Examples:
        | key    |
        | P      |
        | Escape |

    Scenario Outline: A run paused with the key does not advance
      When 1000 ms pass
      And I press <key>
      And 2000 ms pass
      Then the game time is still 1000 ms
      And no box is on screen
      And the panda still stands on the floor
      And the floor has scrolled no further than it had at 1000 ms

      Examples:
        | key    |
        | P      |
        | Escape |

  Rule: Pressing P or Escape while paused starts the same 3, 2, 1 countdown as any other control

    Scenario Outline: The pausing key starts a countdown without a jump
      When 1000 ms pass
      And I press <key>
      And I press <key>
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

      Examples:
        | key    |
        | P      |
        | Escape |

    Scenario: Tap, Space and the Up Arrow key still start the countdown on a run paused with P or Escape
      When 1000 ms pass
      And I press P
      And I press Space
      Then both pause texts are gone
      And the page reads "3" centred in white 40px at (200, 190)
      And the panda is still on the floor

  Rule: Pressing P or Escape on the game-over screen does nothing

    Scenario Outline: The key neither restarts the run nor shows the pause texts
      When I do not jump
      Then the panda touches the column and the game over screen shows
      When I press <key>
      Then the page does not read "Paused"
      And the page still reads "Game over"
      And the run has not restarted

      Examples:
        | key    |
        | P      |
        | Escape |

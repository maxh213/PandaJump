Feature: Panda Jump on Phaser 4, slice: tilting the panda with its vertical speed
  As a player on the Panda Jump page
  I want the panda to tilt its nose up while it rises and nose down while it falls
  So that a jump's arc reads clearly, the way it does in Flappy Bird

  Times are game time in ms since the run started, matching the conventions in
  features/phaser-4-core-run.feature. Jumping from the floor gives a speed of 580 px/s
  and peaks at 580 ms; with no second jump the panda lands again at 1160 ms.
  "The panda's angle" is its sprite's angle in degrees, negative meaning nose up and
  positive meaning nose down, computed as -speed / 20 clamped to [-25, 25].

  Background:
    Given I open the Panda Jump page
    And the run has just started

  Rule: The panda's angle tracks its vertical speed while the run is alive

    Scenario: The panda stays level while it runs along the floor
      Then the panda's angle is 0 degrees at 500 ms

    Scenario: A floor jump tilts the nose up immediately
      When I press Space at 0 ms
      Then the panda's angle is -25 degrees right after the jump

    Scenario: The panda passes back through level at the top of its jump
      When I press Space at 0 ms
      Then the panda's angle is 0 degrees at 580 ms, the top of the jump

    Scenario: The panda tilts its nose down as it falls, clamped in a long fall
      When I press Space at 0 ms
      Then the panda's angle is positive at 900 ms, while it is still falling
      And the panda's angle is 25 degrees at 1100 ms, clamped even though it is falling faster

    Scenario: Landing levels the panda back out
      When I press Space at 0 ms
      Then the panda's angle is 0 degrees at 1200 ms, after it has landed

  Rule: Death replaces the tilt with the existing upside-down flip

    Scenario: The panda's angle resets to 0 the moment it dies, mid-fall
      When I do not jump
      Then the panda touches the first column, freezing the run, upside down
      And the panda's angle is 0 degrees on the game-over screen

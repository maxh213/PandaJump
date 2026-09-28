Feature: Panda Jump on Phaser 4, slice: buffer a jump pressed just before landing
  As a player timing my taps against the box columns
  I want a tap made a moment before the panda lands to jump as soon as it lands
  So that the game never seems to eat a tap that was almost on time

  Times are game time in ms since the run started, same as features/phaser-4-core-run.feature.
  "The buffered sequence" means: jump at 0 ms, double jump at 580 ms, after which the panda lands
  at about 1470 ms. A press with the double jump already spent is called a late press.

  Background:
    Given I open the Panda Jump page
    And the run has just started
    And the random source picks 1 box for every column

  Rule: A late press made 100 ms or less before landing jumps the moment the panda lands

    Scenario: The panda leaves the floor again by itself with the floor jump speed
      Given the buffered sequence
      When I press Space at 1400 ms game time
      And the panda lands
      Then the panda leaves the floor again without another press
      And it rises to the same height as a normal first jump, about 168 px
      And it can still double jump during that jump

    Scenario: The buffered jump does not show the double jump puff
      Given the buffered sequence
      When I press Space at 1400 ms game time
      And 200 ms pass after the landing
      Then no puff is shown

  Rule: A late press made more than 100 ms before landing is dropped

    Scenario: The panda lands and stays on the floor
      Given the buffered sequence
      When I press Space at 1340 ms game time
      And 500 ms pass after the landing
      Then the panda is on the floor

  Rule: A press while the double jump is still available is still an immediate air jump

    Scenario: The second press in the air jumps at once and shows the puff
      When I press Space at 0 ms game time
      And I press Space at 100 ms game time
      Then the panda jumps again at once with the puff shown

  Rule: A buffered press is discarded by a pause, a death or a restart

    Scenario Outline: Pausing before landing drops the press
      Given the buffered sequence
      When I press Space at 1400 ms game time
      And I <pause> the run
      And I press Space to resume
      And 2500 ms pass
      Then the panda is on the floor

      Examples:
        | pause               |
        | press P to pause    |
        | press Escape to pause |
        | hide the tab to pause |

    Scenario: Dying before landing drops the press
      Given the random source picks 2 boxes for the first column
      When I jump at 2600 ms and again at 2800 ms and press Space a third time
      Then the panda hits the column and the game over screen shows
      When I press Space after 500 ms
      Then the new run starts with the panda on the floor and stays there

  Rule: Holding Space adds no jumps from auto-repeat

    Scenario: The held key's repeats are not buffered
      When I hold Space down at 0 ms game time
      And the operating system auto-repeat sends more keydowns before the panda lands
      Then the panda lands and stays on the floor

Feature: A tap anywhere on the page jumps, not only a tap on the game canvas
  As a player holding a phone
  I want the whole page to be the button
  So that a thumb landing beside or below the game still makes the panda jump

  Heights and times use the same conventions as features/phaser-4-core-run.feature.

  Background:
    Given I open the Panda Jump page
    And the run has just started
    And the random source picks 1 box for every column

  Rule: A click outside the canvas does what a click on the canvas does

    Scenario Outline: Clicking the <target> makes a standing panda jump
      When I click the <target>
      And 100 ms pass
      Then the panda is above the floor

      Examples:
        | target                             |
        | page heading                       |
        | Controls paragraph                 |
        | black area beside the canvas       |
        | black area below the canvas        |

    Scenario: One click on the canvas is exactly one jump
      When I click the canvas once
      And the panda has left the floor
      Then the panda can still make its double jump

    Scenario: One click outside the canvas is exactly one jump
      When I click the page heading once
      And the panda has left the floor
      Then the panda can still make its double jump

    Scenario: Clicking outside the canvas during a pause starts the countdown
      When 1000 ms pass
      And I press P
      And I click the page heading
      Then both pause texts are gone
      And the page reads "3" centred in white 40px at (200, 190)
      And the panda is still on the floor

    Scenario: Clicking outside the canvas restarts the run only after the game-over freeze
      When I do not jump
      Then the panda touches the column and the game over screen shows
      When I click the page heading
      Then the run has not restarted
      When 500 ms pass
      And I click the page heading
      Then the run has restarted

  Rule: A link is still a link

    Scenario: Clicking the GitHub link does not jump and still follows the link
      When I click the GitHub link
      Then the panda is still on the floor
      And the browser navigates to https://github.com/maxh213/PandaJump

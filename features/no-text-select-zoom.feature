Feature: Double-taps outside the game canvas do not select page text or zoom the page
  As a player double jumping with quick taps
  I want the page text to stay unselected and the view to stay put
  So that a run is never thrown off by a highlighted word or a zoomed page

  Heights and times use the same conventions as features/phaser-4-core-run.feature.

  Background:
    Given I open the Panda Jump page
    And the run has just started
    And the random source picks 1 box for every column

  Rule: Double-clicking page text selects nothing and still double jumps

    Scenario Outline: Double-clicking the <target> selects no text
      When I double-click the <target>
      Then the page selection reads ""
      And the panda's air jump has been used

      Examples:
        | target             |
        | page heading       |
        | Controls paragraph |

  Rule: The page allows scrolling and taps but not double-tap zoom

    Scenario: Touch actions and text selection are set on the page
      Then the html and body touch action are both "manipulation"
      And the canvas touch action is still "none"
      And the body user select is "none"

  Rule: A link is still a link

    Scenario: Clicking the GitHub link does not jump and still follows the link
      When I click the GitHub link
      Then the panda is still on the floor
      And the browser navigates to https://github.com/maxh213/PandaJump

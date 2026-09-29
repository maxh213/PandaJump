Feature: Panda Jump on Phaser 4, slice: the player's five best runs on the start screen
  As a player on the Panda Jump page
  I want to see my own best runs when I open the game
  So that I have several scores of my own to beat, not only the top one

  Heights and times use the same conventions as features/phaser-4-core-run.feature.
  "The stored best" is as defined in features/high-score.feature.
  "The stored list" means the value under the key "pandaJump.topScores" in the browser's localStorage:
  a JSON array of up to five integers above 0, sorted high to low, duplicates allowed.
  Unless a scenario says otherwise, both stored values are empty before the page opens.
  "The start screen" is the ready screen shown on a fresh page load, before the first tap or Space press.
  "The list" means the heading "Your best runs" and the numbered entries below it, all in white Arial with
  the standard black 4px outline: the heading centred at (200, 166) in 20px, and entry n, such as "1. 34",
  centred at x 200 in 16px at y 196, 216, 236, 256 and 276 for entries 1 to 5.
  A run "ends on" its final score when the panda touches a column.

  Background:
    Given I open the Panda Jump page

  Rule: The start screen lists the player's best runs

    Scenario: With no stored data a fresh load lists nothing
      Then the page reads "Tap or press Space to start"
      And the page does not read "Your best runs"
      And no numbered entry is drawn

    Scenario: A stored best with no stored list seeds a list of one
      Given the stored best is 7 and there is no stored list
      When I open the Panda Jump page
      Then the page reads "Your best runs" at (200, 166)
      And the page reads "1. 7" at (200, 196)

    Scenario: Runs ending on 3, 0, 5 and 3 are listed as 5, 3, 3 and a score of 0 is never listed
      Given the random source picks 1 box and no second column for every column
      And I press Space to start
      When four runs end on 3, 0, 5 and 3, each restarted by a tap after the game-over freeze
      And I reload the Panda Jump page
      Then the page reads "1. 5", "2. 3" and "3. 3" in that order
      And no "4." or "5." entry is drawn
      And the stored list is [5,3,3]

    Scenario: Six runs with distinct scores list only the five highest
      Given I press Space to start
      When six runs end on 2, 5, 1, 6, 3 and 4 and I reload the Panda Jump page
      Then the page reads "1. 6", "2. 5", "3. 4", "4. 3" and "5. 2" in that order

  Rule: The list only shows on the start screen

    Scenario: The list is gone the moment the first input starts the run
      Given the stored list is [4,2]
      When I open the Panda Jump page
      Then the page reads "1. 4" and "2. 2"
      When I press Space, or tap the canvas
      Then the heading and the entries are no longer drawn

    Scenario: The list is never shown during a run, while paused, on the game-over screen or after a restart
      Given the stored list is [4,2]
      And I press Space to start
      When the run is going, then paused, then over, then restarted by a tap
      Then the heading and the entries are not drawn at any of those moments

  Rule: The list is drawn as outlined white Arial

    Scenario: Heading and entries use the given sizes, colour, outline and positions
      Given the stored list is [5,4,3,2,1]
      When I open the Panda Jump page
      Then the heading is white 20px Arial with a black 4px outline centred at (200, 166)
      And the entries are white 16px Arial with a black 4px outline centred at y 196, 216, 236, 256 and 276

  Rule: Unreadable or blocked storage never breaks the game

    Scenario: Invalid JSON with a stored best seeds the list from the best
      Given the stored list is "not json" and the stored best is 6
      When I open the Panda Jump page
      Then the page reads "1. 6"
      And no error is thrown or logged

    Scenario: Invalid JSON with no stored best shows no list
      Given the stored list is "{oops"
      When I open the Panda Jump page
      Then no list is drawn

    Scenario: A stored list that is not made of positive integers is ignored
      Given the stored list is ["9",0]
      When I open the Panda Jump page
      Then no list is drawn

    Scenario: A blocked localStorage shows no list and the game still plays and restarts
      Given localStorage throws whenever it is read or written
      When I open the Panda Jump page
      Then no list is drawn
      And a run can be played to its end and restarted with no error thrown or logged

    Scenario: A localStorage whose reads throw shows no list and the game still plays
      Given localStorage.getItem throws
      When I open the Panda Jump page
      Then no list is drawn
      And a run can be played to its end with no error thrown or logged

    Scenario: A localStorage whose writes throw does not stop a run from ending and restarting
      Given localStorage.setItem throws
      When a run ends and is restarted
      Then no error is thrown or logged

  Rule: The existing best keeps its own behaviour

    Scenario: The stored best and its key are untouched by the list
      Given the stored best is 5
      When a run ends on 2
      Then the stored best is still 5
      And the page still reads "Best: 5" in the run

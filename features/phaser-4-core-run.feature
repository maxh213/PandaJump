Feature: Panda Jump on Phaser 4, slice 1: run, jump, die, restart
  As a player on the Panda Jump page
  I want the panda to run, jump over box columns and restart when it hits one
  So that I can play the game in a modern browser

  Heights are in px above the floor surface at y 426, measured at the panda's feet, within 3 px.
  Times are game time since the run started, driven by the suite's injected clock.
  "The random source picks" means the suite's injected random source decides that outcome.

  Background:
    Given I open the Panda Jump page
    And the run has just started

  Rule: The page keeps its content

    Scenario: The page shows its title, game and text
      Then the document title is "Panda Jump"
      And the heading reads "Panda Jump"
      And a 400 by 490 canvas is shown inside "#game_div"
      And the page reads "Check it out on Github" with "Github" linking to "https://github.com/maxh213/PandaJump"
      And the page reads "Controls: Click/touch to jump (you can double jump)"

    Scenario: Nothing on the page loads over plain http
      Then the Lato font is requested from an "https://" URL
      And no request uses an "http://" URL
      And no request is made for "main.js" or "phaser.min.js"

    Scenario: The production build runs from a plain file host
      Given "npm run build" has produced "dist/"
      When "dist/" is served by a static file server under the path "/PandaJump/"
      Then the game canvas is shown and the panda is running
      And every image in "assets/" that the game uses loads with status 200

  Rule: The panda runs on a scrolling floor

    Scenario: The opening scene
      Then the canvas background is "#71c5cf"
      And the panda stands on the floor with its left edge at x 100
      And the panda is drawn 25 px wide, 1.25 times the 20 px frame
      And the score reads "0" in white 30 px text at (20, 20)
      And no box is on screen

    Scenario: The run cycle plays whole frames
      When 1000 ms pass
      Then the panda cycles through spritesheet frames 17, 18, 19, 20, 21 and 22 at 15 frames per second
      And every drawn frame shows the whole panda
      And no drawn frame shows a strip of pixels from frame 16 or frame 23

    Scenario: The floor scrolls without a seam
      When 2000 ms pass
      Then the rock and grass tiles have moved 400 px to the left
      And at every sampled moment no pixel in rows 426 to 489 is the background colour "#71c5cf"
      And at every sampled moment no pixel in row 424 is the background colour "#71c5cf"

  Rule: The panda jumps once from the floor and once more in the air

    Scenario Outline: Each control makes the panda jump
      When I <action>
      Then the panda leaves the floor
      And the panda peaks 168 px above the floor about 580 ms later
      And the panda lands back on the floor about 1160 ms after the jump

      Examples:
        | action                 |
        | click the canvas       |
        | tap the canvas         |
        | press Space            |

    Scenario: Pressing Space does not scroll the page
      Given the page is scrolled to the top
      When I press Space
      Then the page is still scrolled to the top

    Scenario: A double jump adds a smaller boost
      When I press Space
      And 580 ms later I press Space again
      Then the panda peaks 199 px above the floor

    Scenario: A third jump in the air is ignored
      When I press Space
      And 580 ms later I press Space again
      And 100 ms later I press Space a third time
      Then the panda still peaks 199 px above the floor

    Scenario: Landing gives both jumps back
      Given I jumped and double jumped and the panda has landed
      When I press Space
      And 580 ms later I press Space again
      Then the panda peaks 199 px above the floor

  Rule: Box columns come from the right

    Scenario Outline: A column of one or two boxes spawns every 1500 ms
      Given the random source picks <boxes> boxes for the next column
      When 1500 ms pass
      Then a column of <boxes> "dirt_06.png" boxes appears with its left edge at x 400
      And its bottom box sits on the floor with its top at y <top>
      And the column moves left at 200 px per second

      Examples:
        | boxes | top |
        | 1     | 362 |
        | 2     | 298 |

    Scenario: Columns keep coming at a steady rate
      Given the panda clears every column
      When 6000 ms pass
      Then exactly 4 columns have spawned, at 1500, 3000, 4500 and 6000 ms

    Scenario: No second column while the score is 10 or less
      Given the score is 10 when a column spawns
      And the random source picks a second column
      Then only one column appears

    Scenario: A second column can follow once the score is above 10
      Given the score is 11 when a column spawns
      And the random source picks 2 boxes and a second column
      Then two columns of 2 boxes appear, the second with its left edge at x 464

    Scenario: A second column is not always added above 10
      Given the score is 11 when a column spawns
      And the random source picks no second column
      Then only one column appears

  Rule: The score counts cleared columns

    Scenario: Clearing a one-box column scores 1
      Given the random source picks 1 box for the first column
      When I press Space at 2700 ms
      Then the score reads "0" at 3300 ms
      And the score reads "1" at 3340 ms, when the column's right edge passes x 100

    Scenario: Clearing a two-box column with a double jump scores 1
      Given the random source picks 2 boxes for the first column
      When I press Space at 2530 ms
      And I press Space again at 2930 ms
      Then the score reads "1" at 3340 ms

    Scenario: A spawning column does not score
      Given the panda has cleared no column
      When the first and second columns spawn at 1500 ms and 3000 ms
      Then the score still reads "0" at 3000 ms

    Scenario: A column scores only once
      Given the panda has cleared the first column and the score reads "1"
      When 1000 ms pass with no other column cleared
      Then the score still reads "1"

    Scenario: A double column counts as one clear
      Given the score is 11 and a double column of 1 box spawns
      When the panda clears both columns
      Then the score reads "12"

  Rule: Touching a box restarts the run cleanly

    Scenario: Running into a column restarts at score 0
      Given the random source picks 1 box for the first column
      When I do not jump
      Then the panda touches the column at about 2875 ms
      And the run restarts
      And the score reads "0"
      And the panda stands on the floor with its left edge at x 100
      And no box is on screen

    Scenario: Landing on top of a box restarts the run
      Given the random source picks 2 boxes for the first column
      When I press Space at 2530 ms and do not jump again
      Then the panda touches the column
      And the run restarts with the score reading "0"

    Scenario: Dying after scoring resets the score
      Given the score reads "3"
      When the panda touches a box
      Then the score reads "0"

    Scenario: Nothing from the old run survives a restart
      Given the panda has died 3 times
      When 1400 ms pass after the latest restart
      Then no box is on screen
      When 100 ms more pass
      Then exactly one column is on screen, with its left edge at x 400
      When 1500 ms more pass
      Then exactly two columns have spawned since the latest restart

Feature: Panda Jump on Phaser 4, slice 1: run, jump, die, restart
  As a player on the Panda Jump page
  I want the panda to run, jump over box columns and restart when it hits one
  So that I can play the game in a modern browser

  Heights are in px above the floor surface at y 426, measured at the panda's feet, within 3 px.
  Times are game time in ms since the run started, or since the latest restart once the panda has died.
  The suite drives the game only through an injected random source and an injected clock.
  "The random source picks" means the injected random source decides that outcome.
  The suite never sets the score; every score is reached by playing.
  Column n (n = 1, 2, 3, ...) spawns at 1500 × n ms. With no jump, a column touches the panda 1375 ms after it spawns.
  "The standard schedule" means: the random source picks 1 box and no second column for every column,
  and I press Space 1200 ms after each column spawns. Column n is then cleared at 1500 × n + 1820 ms,
  so the score reads "10" when column 12 spawns at 18000 ms and "11" when column 13 spawns at 19500 ms.

  Background:
    Given I open the Panda Jump page
    And the run has just started

  Rule: The page keeps its content

    Scenario: The page shows its title, game and text
      Then the document title is "Panda Jump"
      And the heading reads "Panda Jump"
      And a 400 by 490 canvas is shown inside "#game_div"
      And the page reads "Check it out on Github" with "Github" linking to "https://github.com/maxh213/PandaJump"
      And the page reads "Controls: Click, tap, Space, Up Arrow or controller A to jump (double jump too). P, Escape or Start pauses and resumes."

    Scenario: The page declares its language for accessibility and search tools
      Then the page's <html> element has lang="en"

    Scenario: Nothing on the page loads over plain http
      Then the Lato font is requested from an "https://" URL
      And no request uses an "http://" URL
      And no request is made for "main.js" or "phaser.min.js"

    Scenario: The page has a favicon so the browser does not 404
      Then the page's <link rel="icon"> resolves with status 200
      And the favicon image's width equals its height

    Scenario: The page has an apple-touch-icon so iOS shows the Panda when added to the home screen
      Then the page's <link rel="apple-touch-icon"> resolves with status 200
      And the apple-touch-icon image shows a single recognisable Panda, not the raw sprite strip

    Scenario: The page asks iOS and Android to launch standalone when added to the home screen
      Then the page's <meta name="mobile-web-app-capable"> has content "yes"
      And the page's <meta name="apple-mobile-web-app-capable"> has content "yes"

    Scenario: Shared links show a real preview
      Then the page's <meta name="description"> has non-empty, game-specific text
      And the page's <meta property="og:type"> reads "website"
      And the page's <meta property="og:title"> reads "Panda Jump"
      And the page's <meta property="og:description"> has non-empty, game-specific text
      And the page's <meta property="og:image"> resolves to "panda-icon.png" and shows a single recognisable Panda, not the raw sprite strip
      And the page's <meta property="og:url"> resolves to "https://maxh213.github.io/PandaJump/"
      And the page's <meta name="twitter:card"> reads "summary"
      And the page's <meta name="twitter:title"> reads "Panda Jump"
      And the page's <meta name="twitter:description"> matches the og:description text
      And the page's <meta name="twitter:image"> resolves to "panda-icon.png" and shows a single recognisable Panda, not the raw sprite strip

    Scenario: The page preconnects to the Google Fonts origins so the font loads sooner
      Then the page has a <link rel="preconnect" href="https://fonts.googleapis.com">
      And the page has a <link rel="preconnect" href="https://fonts.gstatic.com"> with a crossorigin attribute

    Scenario: The production build runs from a plain file host
      Given "npm run build" has produced "dist/"
      When "dist/" is served by a static file server under the path "/PandaJump/"
      Then the game canvas is shown and the panda is running
      And every image in "assets/" that the game uses loads with status 200
      And the page's <link rel="icon"> resolves with status 200 and its width equals its height
      And the page's <meta property="og:image"> resolves with status 200 and shows a single recognisable Panda, not the raw sprite strip
      And the page's <link rel="apple-touch-icon"> resolves with status 200 and shows a single recognisable Panda, not the raw sprite strip
      And the page's <meta name="mobile-web-app-capable"> has content "yes"
      And the page's <meta name="apple-mobile-web-app-capable"> has content "yes"
      And the manifest's icon URL and start_url resolve with status 200
      And the manifest's icon image's width equals its height

  Rule: The panda runs on a scrolling floor

    Scenario: The opening scene
      Then the canvas background is "#71c5cf"
      And the panda stands on the floor with its left edge at x 100
      And the panda is drawn 25 px wide, 1.25 times the 20 px frame
      And the panda's hitbox matches the drawn frame: 25 px wide from x 100 to x 125, with its bottom at y 426
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
      When I <action> at 0 ms
      Then the panda leaves the floor
      And the panda peaks 168 px above the floor at about 580 ms
      And the panda lands back on the floor at about 1160 ms

      Examples:
        | action           |
        | click the canvas |
        | tap the canvas   |
        | press Space      |
        | press Up Arrow   |

    Scenario Outline: Pressing Space or Up Arrow does not scroll the page
      Given the browser viewport is 800 by 500 px
      And the page is taller than the viewport, so it can scroll
      And the page is scrolled to the top
      When I <action>
      Then the panda leaves the floor
      And the page is still scrolled to the top

      Examples:
        | action         |
        | press Space    |
        | press Up Arrow |

    Scenario Outline: A double jump adds a smaller boost
      When I <action> at 0 ms
      And I <action> again at 580 ms
      Then the panda peaks 199 px above the floor

      Examples:
        | action         |
        | press Space    |
        | press Up Arrow |

    Scenario Outline: A third jump in the air is ignored
      When I <action> at 0 ms
      And I <action> again at 580 ms
      And I <action> a third time at 680 ms
      Then the panda still peaks 199 px above the floor
      And the panda lands back on the floor at about 1460 ms

      Examples:
        | action         |
        | press Space    |
        | press Up Arrow |

    Scenario: Landing gives both jumps back
      Given I pressed Space at 0 ms and 580 ms and the panda landed at about 1460 ms
      When I press Space at 1600 ms
      And I press Space again at 2180 ms
      Then the panda peaks 199 px above the floor at about 2430 ms

    Scenario: Holding Space does not add a second jump from its auto-repeat
      Given the random source picks 1 box for the first column
      When I press Space at 0 ms and keep it held down
      And the held key's operating system auto-repeat sends another keydown at 580 ms
      Then the panda peaks 168 px above the floor, not 199 px

  Rule: Box columns come from the right

    Scenario Outline: A column of one or two boxes spawns every 1500 ms
      Given the random source picks <boxes> boxes for the first column
      When 1600 ms pass
      Then a column of <boxes> "dirt_06.png" boxes is on screen with its left edge at x 380
      And its bottom box sits on the floor and its top box has its top at y <top>
      And the column moves left at 200 px per second

      Examples:
        | boxes | top |
        | 1     | 362 |
        | 2     | 298 |

    Scenario: Columns keep coming at a steady rate
      Given the random source picks 1 box and no second column for every column
      When I press Space at 2700, 4200 and 5700 ms
      Then at 6100 ms exactly 4 columns have spawned, at 1500, 3000, 4500 and 6000 ms
      And the run has not restarted
      And the score reads "2"

    Scenario: No second column while the score is 10 or less
      Given I play the standard schedule, except that the random source picks a second column for column 12
      Then the score reads "10" at 18000 ms
      And at 18100 ms column 12 has its left edge at x 380 and no column has spawned behind it at x 444

    Scenario: A second column can follow once the score is above 10
      Given I play the standard schedule, except that the random source picks 2 boxes and a second column for column 13
      Then the score reads "11" at 19500 ms
      And at 20000 ms two columns of 2 boxes spawned at 19500 ms are on screen, with left edges at x 300 and x 364

    Scenario: A second column is not always added above 10
      Given I play the standard schedule
      Then the score reads "11" at 19500 ms
      And at 20000 ms one column spawned at 19500 ms is on screen, with its left edge at x 300, and nothing at x 364

  Rule: The score counts cleared columns

    Scenario: Clearing a one-box column scores 1
      Given the random source picks 1 box for the first column
      When I press Space at 2700 ms
      Then the score reads "0" at 3300 ms
      And the score reads "1" at 3340 ms, after the column's right edge passes x 100 at 3320 ms

    Scenario: Clearing a two-box column with a double jump scores 1
      Given the random source picks 2 boxes for the first column
      When I press Space at 2530 ms
      And I press Space again at 2930 ms
      Then the score reads "0" at 3300 ms
      And the score reads "1" at 3340 ms

    Scenario: A spawning column does not score
      Given the random source picks 1 box for the first two columns
      When I press Space at 2700 ms
      Then at 3000 ms the panda is above the first column, which it has not cleared
      And the second column spawns at 3000 ms
      And the score reads "0" at 3010 ms
      And the score reads "1" at 3340 ms

    Scenario: A column scores only once
      Given the random source picks 1 box for the first two columns
      When I press Space at 2700 ms
      Then the score reads "1" at 3340 ms
      And the score still reads "1" at 4300 ms

    Scenario: A double column counts as one clear
      Given I play the standard schedule, except that the random source picks 1 box and a second column for column 13
      Then the score reads "11" at 19500 ms
      And the score reads "12" at 19840 ms, when column 12 is cleared
      And the score still reads "12" at 21400 ms, after the front column of the pair passes x 100 at 21320 ms
      And the score still reads "12" at 21600 ms
      And the score reads "13" at 21680 ms, after the rear column of the pair passes x 100 at 21640 ms
      And the run has not restarted

  Rule: Touching a box freezes the run and shows a game over screen

    Scenario: Running into a column freezes the run and shows game over
      Given the random source picks 1 box for the first column
      When I do not jump
      Then the panda touches the column at about 2875 ms
      And the panda, the columns and the floor stop moving
      And the page reads "Game over" centred in white 40px
      And the page reads "Score: 0" and "Best: 0" under it, in white
      And the page does not yet invite a tap, click or Space press to restart
      And the run has not restarted

    Scenario: The restart prompt stays hidden until a restart would actually work
      Given the random source picks 1 box for the first column
      When I do not jump
      And the panda touches the column
      Then the page does not yet invite a tap, click or Space press to restart
      When 499 ms pass
      Then the page still does not invite a tap, click or Space press to restart
      When 1 more ms passes
      Then the page reads "Tap, press Space or the Up Arrow key to play again" under the Score and Best lines, in white 16px Arial
      And the prompt fits fully inside the 400px wide canvas

    Scenario: Landing on top of a box also freezes the run
      Given the random source picks 2 boxes for the first column
      When I press Space at 2300 ms and do not jump again
      Then the panda is 168 px above the floor at 2875 ms, higher than the column's top at 128 px
      And the panda comes down onto the column's top and touches it at about 3165 ms
      And the panda, the columns and the floor stop moving
      And the page reads "Game over"

    Scenario: Dying after scoring freezes the run with the score it reached
      Given the random source picks 1 box and no second column for every column
      When I press Space at 2700, 4200 and 5700 ms and then stop jumping
      Then the score reads "3" at 7300 ms
      And the panda touches column 4 at about 7375 ms
      And the page reads "Score: 3" and "New best: 3" on the game over screen, in gold (#ffd700), since this run overtook the stored best of 0
      And the run has not restarted

    Scenario Outline: No input restarts the run in the first 500ms after death
      Given the random source picks 1 box for the first column
      When I do not jump
      And the panda touches the column
      And 400 ms pass
      When I <action>
      Then the run has not restarted
      And the page still reads "Game over"
      And the page still does not invite a tap, click or Space press to restart

      Examples:
        | action           |
        | click the canvas |
        | tap the canvas   |
        | press Space      |
        | press Up Arrow   |

    Scenario Outline: Each control restarts the run once 500ms have passed
      Given the random source picks 1 box for the first column
      When I do not jump
      And the panda touches the column
      And 500 ms pass
      When I <action>
      Then the run restarts
      And the score reads "0"
      And the panda stands on the floor with its left edge at x 100
      And no box is on screen
      And the game over screen is gone

      Examples:
        | action           |
        | click the canvas |
        | tap the canvas   |
        | press Space      |
        | press Up Arrow   |

    Scenario: Holding Space through death does not auto-restart the run from its auto-repeat
      Given the random source picks 1 box for the first column
      When I press Space at 0 ms and keep it held down, and do not press it again
      Then the panda touches the column at about 2875 ms
      When the held key's auto-repeat sends further keydowns at 500, 520 and 600 ms after death
      Then the run has not restarted
      And the page still reads "Game over"
      And the page reads "Tap, press Space or the Up Arrow key to play again"
      When I release Space and press it again
      Then the run restarts
      And the score reads "0"

    Scenario: Nothing from the old run survives a restart
      Given the random source picks 1 box and no second column for every column
      And I do not jump, and 500 ms after each death I tap to play again, until the panda has died 3 times
      Then the restarts counter reads 3
      When 1400 ms pass after the latest restart
      Then no box is on screen
      When I wait until 1600 ms after the latest restart
      Then exactly one column is on screen, with its left edge at x 380
      When I press Space at 2700 ms after the latest restart
      And I wait until 3100 ms after the latest restart
      Then exactly two columns are on screen, with left edges at x 80 and x 380
      And the score reads "0"

  Rule: The tab title mirrors the live score

    Scenario: The tab title shows the live score once it rises above 0
      Given the random source picks 1 box and no second column for every column
      When I press Space at 2700 ms
      Then the document title is "1 - Panda Jump" at 3340 ms
      When I press Space at 4200 ms
      Then the document title is "2 - Panda Jump" at 4840 ms
      When I press Space at 5700 ms
      Then the document title is "3 - Panda Jump" at 6340 ms

    Scenario: The tab title returns to "Panda Jump" once the panda dies and a restart brings the score back to 0
      Given the random source picks 1 box and no second column for every column
      When I press Space at 2700, 4200 and 5700 ms and then stop jumping
      Then the document title is "3 - Panda Jump" at 7300 ms
      When the panda touches column 4, the game freezes, and tapping to play again restarts it
      Then the score reads "0"
      And the document title is "Panda Jump"

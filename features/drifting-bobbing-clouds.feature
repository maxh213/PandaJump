Feature: Panda Jump on Phaser 4, slice 3: drifting, bobbing clouds
  As a player on the Panda Jump page
  I want soft clouds drifting across the sky behind the action
  So that the scene feels alive without ever getting in the way of play

  Heights are in px from the top of the canvas: y 0 is the top, y 200 is the lowest a cloud's drawn position reaches.
  Times are game time in ms since the page loaded, driven by an injected clock.
  Clouds draw their height from their own position in the injected random source, independent of the position
  columns draw from; adding clouds does not change any column or score behaviour pinned in
  features/phaser-4-core-run.feature.
  "The cloud source" means a random source that repeats 0, 0.5 and 1 in order.
  With the cloud source, the run starts with 3 clouds: one at x 0 with y 6 using "cloud_02.png",
  one at x 150 with y 100 using "cloud_05.png", and one at x 300 with y 194 using "cloud_02.png".

  Background:
    Given I open the Panda Jump page with the cloud source and a manual clock

  Rule: Clouds sit behind everything else

    Scenario: Every cloud renders behind the floor, boxes, panda and score
      Then exactly 3 clouds are on screen
      And every cloud uses "cloud_02.png" or "cloud_05.png"
      And every cloud is drawn at a lower depth than the floor, boxes, panda and score, so it is always behind them

  Rule: Clouds drift left at a steady speed within the top 200 px

    Scenario: A cloud drifts left at 40 px per second while it bobs up and down over a 3 second cycle
      When 750 ms pass
      Then the cloud that started at x 150 is at x 120 and y 106
      When 750 ms pass
      Then that cloud is at x 90 and y 100
      When 750 ms pass
      Then that cloud is at x 60 and y 94

  Rule: A cloud leaving the left edge is replaced from the right edge

    Scenario: The leftmost cloud respawns off the right edge with a freshly drawn height and texture
      When 1250 ms pass
      Then the cloud that started at x 0 has been replaced by one entering at x 400 with y 6 using "cloud_05.png"
      And exactly 3 clouds are still on screen

  Rule: Exactly 3 clouds are always on screen within the top 200 px

    Scenario: Clouds stay at exactly 3 and within y 0 to 200 across many respawns
      When 20000 ms pass, sampled every 1250 ms
      Then exactly 3 clouds are on screen at every sample
      And every cloud's y is between 0 and 200 at every sample

  Rule: Clouds never affect collisions or score

    Scenario: A run scores exactly as it would with no clouds at all
      Given the random source picks 1 box for the first column
      When I press Space at 2700 ms
      Then the score reads "1" at 3340 ms
      And the run has not restarted

  Rule: Clouds are deterministic under the injected random source and clock

    Scenario: Two runs opened with the same random source and manual clock draw identical clouds
      Given a second run is opened with the same cloud source and manual clock
      When 20000 ms pass on both runs, sampled every 1250 ms
      Then both runs show the same cloud positions and textures at every sampled moment

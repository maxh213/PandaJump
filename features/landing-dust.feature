Feature: Panda Jump on Phaser 4, slice: the landing dust puff
  As a player on the Panda Jump page
  I want to see a small puff of dust where the panda touches down
  So that landing, when the full floor jump comes back, is visible even though the game has no sound

  Heights and times use the same conventions as features/phaser-4-core-run.feature: times are game time in
  ms since the run started, driven by an injected clock. Pressing Space at 0 ms is the floor jump pinned
  there: the panda leaves the floor at 0 ms and lands at about 1160 ms.
  "The dust" means two light sand-coloured (0xd2b48c) circles of radius 5, centred 10 px left and 10 px
  right of the panda's horizontal centre x 112.5, at the floor surface y 426. It is fully opaque on the
  step the panda lands, fades linearly to fully transparent over 200 ms, then is hidden.

  Background:
    Given I open the Panda Jump page
    And the run has just started

  Rule: The dust appears only when the panda lands from a jump

    Scenario: No dust while the panda is in the air
      When I press Space at 0 ms
      Then no dust is shown at 290 ms or at its 580 ms peak

    Scenario: The dust appears on landing and fades to gone over 200 ms
      When I press Space at 0 ms
      And the panda lands
      Then the dust is shown at (112.5, 426), fully opaque
      And its alpha is about 0.5 100 ms after landing
      And the dust is hidden 200 ms after landing

  Rule: A dead panda kicks up no dust

    Scenario: Falling to the floor during game over shows no dust
      When the panda hits a column in mid-air and falls to the floor
      Then no dust is shown, and none is shown after the restart

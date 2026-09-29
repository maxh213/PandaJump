Feature: Panda Jump on Phaser 4, slice: the ground shadow
  As a player on the Panda Jump page
  I want a soft shadow on the surface under the panda that shrinks as it jumps higher
  So that I can read how high the panda is and where it will land

  Heights and times use the same conventions as features/phaser-4-core-run.feature: heights are in px
  above the floor surface at y 426, measured at the panda's feet, within 3 px; times are game time in ms
  since the run started, driven by an injected clock. Pressing Space at 0 ms puts the panda at its 168 px
  peak at 580 ms and back on the floor at about 1160 ms.
  "The shadow" means a black ellipse 24 px wide and 6 px tall at 30% opacity, centred at the panda's
  horizontal centre, x 112.5 (the panda's left edge at x 100 plus 12.5). It sits on the floor at y 426,
  or on a box column's top (y 426 minus boxes times 64) when that centre lies in the column's x span.
  Its scale is 1 on the surface, falls linearly to 0.5 at a height of 168 px above that surface, and
  stays 0.5 above that. The surface snaps in one step as a column scrolls under the panda.

  Background:
    Given I open the Panda Jump page
    And the run has just started

  Rule: The shadow sits on the ground under the panda and shrinks with height

    Scenario: The shadow is full size while the panda stands
      Then the shadow is shown centred at (112.5, 426) at scale 1

    Scenario: The shadow shrinks while the panda is in the air and grows back on landing
      When I press Space at 0 ms
      Then at 290 ms the shadow is still centred at (112.5, 426) with a scale between 0.5 and 1
      And at 580 ms, the peak, its scale is 0.5
      And at about 1160 ms, after landing, its scale is 1 again

  Rule: The shadow is cast onto the box column under the panda

    Scenario: Jumping over a one-box column puts the shadow on the box top, then back on the floor
      Given the first column is one box high
      When I jump over that column
      Then while the shadow centre is over the column the shadow is at y 362
      And before and after that the shadow is at y 426

    Scenario: Jumping over a two-box column puts the shadow at y 298
      Given the first column is two boxes high
      When I jump over that column
      Then while the shadow centre is over the column the shadow is at y 298

    Scenario: The painted top of the box darkens under the shadow, and the floor under the panda does not
      Given the first column is one box high
      When I jump over that column and the shadow is on the box top
      Then the top rows of the box under the panda are darker than without the shadow
      And the floor under the panda is not darkened by the shadow

  Rule: The shadow is drawn above the floor and below the panda

    Scenario: The shadow sits between the grass and rock strips and the panda sprite
      Then the shadow is drawn on top of the grass and rock strips
      And the panda sprite is drawn on top of the shadow

  Rule: The shadow stays visible in every state

    Scenario: The shadow is shown while paused
      When I press Space at 0 ms and pause at 290 ms
      Then the shadow is still shown, at the scale it had when the game paused

    Scenario: The shadow is shown at game over
      When the panda hits a column and the run ends
      Then the shadow is still shown at (112.5, 426)

Feature: Panda Jump on Phaser 4, slice: squash and stretch
  As a player on the Panda Jump page
  I want the panda's body to stretch when it jumps off the floor and squash when it lands
  So that jumps feel snappy and alive without any sound

  Times are game time in ms since the run started, driven by an injected clock. Pressing Space at 0 ms
  puts the panda in the air until about 1160 ms. The panda sprite's normal scale is 1.25 by 1.25, and a
  scale of "x by y" means the sprite's horizontal and vertical scale, within 0.01.
  A floor jump starts at scale 1.0 by 1.5 (0.8 wide by 1.2 tall of normal) and eases linearly back to 1.25 by 1.25
  over 120 ms. A landing starts at scale 1.5 by 1.0 (1.2 wide by 0.8 tall of normal) and eases back to 1.25 by 1.25
  over 120 ms. The floor is at y 426.

  Background:
    Given I open the Panda Jump page
    And the run has just started

  Rule: A jump off the floor stretches the panda tall

    Scenario: The panda stretches at takeoff and eases back over 120 ms
      When I press Space at 0 ms
      Then at 0 ms the panda's scale is 1.0 by 1.5
      And at 60 ms it is 1.125 by 1.375
      And at 120 ms and later it is 1.25 by 1.25

    Scenario: A double jump in mid-air does not change the scale
      When I press Space at 0 ms and again at 300 ms
      Then the panda's scale is 1.25 by 1.25 right after the second press

  Rule: Landing squashes the panda wide

    Scenario: The panda squashes on the frame it lands and its feet stay on the floor
      When I press Space at 0 ms and the panda lands
      Then on that frame the panda's scale is 1.5 by 1.0
      And the bottom of the sprite is at y 426, within 1 px, while it is squashed
      And 120 ms after landing its scale is 1.25 by 1.25

  Rule: The panda impact-squashes on death, then is normal after a restart

    Scenario: The scale is the impact squash on the hit frame, then 1.25 by 1.25 after restarting
      When the panda hits a column and the run ends
      Then the panda's scale is 1.0 by 1.4375 on the hit frame
      And 120 ms later it is 1.25 by 1.25
      When I restart the run
      Then the panda's scale is 1.25 by 1.25

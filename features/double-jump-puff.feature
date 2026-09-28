Feature: Panda Jump on Phaser 4, slice: the double-jump puff
  As a player on the Panda Jump page
  I want to see a small puff of white the instant my double jump fires
  So that a second tap in the air always gives me visible feedback, even though it does nothing else

  Heights and times use the same conventions as features/phaser-4-core-run.feature: heights are in px
  above the floor surface at y 426, measured at the panda's feet, within 3 px; times are game time in ms
  since the run started, driven by an injected clock. Pressing Space at 0 ms then again at 580 ms is the
  same double jump pinned in features/phaser-4-core-run.feature: the panda leaves the floor at 0 ms and
  is at its 168 px peak, 257.8 px above the floor's y 426, the instant the second press lands at 580 ms.
  "The puff" means a small white circle of radius 8 drawn at the panda's horizontal centre, x 112.5 (the
  panda's left edge at x 100 plus 12.5), at the panda's feet at the moment the air jump fires. It stays
  at that fixed point while the panda rises away, fading from fully opaque to fully transparent over
  250 ms, then it is gone.

  Background:
    Given I open the Panda Jump page
    And the run has just started

  Rule: The puff appears only when the air jump actually fires

    Scenario: A single floor jump never shows a puff
      When I press Space at 0 ms
      Then the panda leaves the floor
      And no puff is shown at 290 ms, at its 580 ms peak, or after it lands at about 1160 ms

  Rule: A second tap while airborne marks the moment the air jump fires

    Scenario: The puff appears at the panda's feet, fully opaque, then fades to gone over 250 ms
      When I press Space at 0 ms
      And I press Space again at 580 ms
      Then a white circle of radius 8 is shown at (112.5, 257.8), fully opaque
      And the puff's alpha is about 0.5 at 705 ms, 125 ms after it appeared
      And the puff is gone at 830 ms, 250 ms after it appeared
      And the puff stays at (112.5, 257.8) throughout, even as the panda keeps rising away from it

  Rule: A third tap in the air, with the air jump already used, shows no new puff

    Scenario: The puff already showing keeps fading on its original schedule
      When I press Space at 0 ms
      And I press Space again at 580 ms
      And I press Space a third time at 680 ms
      Then the puff at 680 ms is unchanged by the third tap
      And the puff is still gone at 830 ms

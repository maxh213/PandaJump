Feature: Panda Jump on Phaser 4, slice: skip the full-screen white death flash for players who ask for reduced motion
  As a player whose device asks for reduced motion
  I want the game to leave out the full-screen white flash when the panda dies
  So that dying, which happens many times per session, is not a sharp bright flash for me

  Times are game time in ms since the run started, same as features/death-flash.feature.
  "The flash" is the full-canvas rectangle named "deathFlash". "Reduced motion" means the page's
  (prefers-reduced-motion: reduce) media query matches.

  Background:
    Given I open the Panda Jump page
    And the run has just started

  Rule: With reduced motion the flash stays invisible for the whole game-over screen

    Scenario: The flash never shows at the instant of death or at any later step
      Given the device asks for reduced motion
      And the random source picks 1 box for the first column
      When I do not jump
      And the panda touches the column
      Then the deathFlash rectangle has alpha exactly 0
      And the deathFlash rectangle has alpha exactly 0 at every step for the next 1000 ms

  Rule: Everything else about death is unchanged with reduced motion

    Scenario: The hit column is still tinted, the panda still tumbles and the game-over texts still appear
      Given the device asks for reduced motion
      And the random source picks 1 box for the first column
      When I do not jump
      And the panda touches the column
      Then every box of the column is tinted 0xff6666
      And the panda is upside down
      And the "Game over" title is visible

  Rule: Without the preference the flash is exactly as before

    Scenario: The flash still snaps to 0.6 at death when no reduced motion is asked for
      Given the device has no motion preference
      And the random source picks 1 box for the first column
      When I do not jump
      And the panda touches the column
      Then the deathFlash rectangle has alpha 0.6, within 0.05
      And features/death-flash.feature still passes unchanged

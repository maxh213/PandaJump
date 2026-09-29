Feature: Panda Jump on Phaser 4, slice: bounce off a box on death
  As a player on the Panda Jump page
  I want the panda to bounce left off a box it fails to clear, with a small impact burst
  So that a failed jump reads as a knockback instead of dropping into the boxes

  Heights, times and "the random source picks" are as defined in features/phaser-4-core-run.feature.
  The panda's hitbox is from pandaX+3 to pandaX+22. Knockback eases out over 250 ms of game time until
  the hitbox's right edge is at least 2 px left of the hit column's left edge. On impact the panda gets
  a small upward bounce, then falls under gravity to floor y 426. The impact burst is a short star of
  light strokes at the contact point that expands and fades over 250 ms; the panda squashes to scale
  0.8 by 1.15 (of normal) on the hit step and eases back over 120 ms. With prefers-reduced-motion the
  burst stays at its final size and the squash is skipped, but knockback and bounce still happen.
  "The two-box column scenario" means the same setup as features/death-tumble.feature.

  Background:
    Given I open the Panda Jump page
    And the run has just started

  Rule: Running into a column knocks the panda left and bounces it onto the floor

    Scenario: Dying on the floor against a one-box column knockbacks left and pops up then lands
      Given the random source picks 1 box for the first column
      When I do not jump
      And the panda touches the column
      Then over the following 250 ms pandaX decreases steadily from 100
      And after 250 ms the hitbox right edge is at least 2 px left of the hit column's left edge
      And the panda rises briefly above bottom 426 then settles exactly at 426

  Rule: Dying above the floor clears the column without deepening the overlap

    Scenario: Dying on top of a two-box column knocks left clear and lands in front of it
      Given the two-box column scenario
      Then the panda is above the floor the instant the run ends
      When time passes while the game-over screen is shown
      Then the panda moves left clear of the column and comes to rest at bottom 426 left of it
      And sampled every 10 ms the hitbox never overlaps the column more than on the hit step
      And from 250 ms on the hitbox does not overlap the column at all

  Rule: An impact burst and squash mark the hit, and respect reduced motion

    Scenario: The burst and squash play on a floor death then clear
      Given the random source picks 1 box for the first column
      When I do not jump
      And the panda touches the column
      Then an impact burst is shown at the contact point
      And the panda sprite is squashed on the hit step
      And the burst is gone 250 ms later
      And the squash is back to scale 1 within about 120 ms

    Scenario: With reduced motion the burst stays full size and there is no squash
      Given prefers-reduced-motion is emulated
      And the random source picks 1 box for the first column
      When I do not jump
      And the panda touches the column
      Then the burst does not change size while it fades
      And the panda is not squashed
      And the knockback and floor landing still happen

  Rule: Restart clears the bounce state

    Scenario: After restart the panda is back at x 100, bottom 426, upright, with no burst
      Given the random source picks 1 box for the first column
      When I do not jump
      And the panda touches the column
      And 500 ms pass and I tap to play again
      Then the panda is at x 100, bottom 426, not flipped, with no burst drawn

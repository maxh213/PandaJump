Feature: Panda Jump crossfades the sky, hills, ground and stars over 3 seconds when entering a new biome
  As a player whose score has just crossed a biome threshold
  I want the scenery to change gradually
  So that the journey feels smooth instead of an abrupt cut

  "The ramped schedule" and "column n is cleared" are as defined in features/sky-by-score.feature.
  Biomes and their colours are as features/biomes.feature describes. The fade lasts BIOME_FADE_MS = 3000 ms of
  game time, starting on the step where biomeFor(score) changes during a live run. Score 0 at the start of a
  run never fades. Box columns keep the texture of the biome they spawned in.
  The sky is a linear RGB blend of the outgoing and incoming biome skies. The hills, rock strip and top strip
  each draw the incoming biome over the outgoing one with alpha rising from 0 to 1. Stars fade in when
  entering industrial and fade out when leaving it.
  Game time stands still while paused and after death, so a fade in progress holds where it is. A restart
  snaps straight to meadow with no fade.

  Background:
    Given I open the Panda Jump page with a manual clock
    And the run has just started

  Rule: A run starts with no fade

    Scenario: Score 0 at the start of a run is pure meadow
      Then the sky is "#71c5cf"
      And the scenery fade progress is 1 with meadow floor, hills and no stars

  Rule: The desert scenery crossfades in over 3000 ms from the step score becomes 20

    Scenario: At score 20 the sky is still meadow, at 1500 ms it is the midpoint, at 3000 ms it is desert
      Given I play the ramped schedule through column 20
      Then the score reads "20"
      And the sky is "#71c5cf" within 1 per channel
      And the desert floor and top strips sit over the meadow ones at alpha 0
      And the hills show the meadow colour at full alpha over the desert at alpha 0
      When 1500 ms of game time pass
      Then the sky is the RGB midpoint of "#71c5cf" and "#f4a261" within 2 per channel
      And the desert floor, top and hills layers are at alpha 0.5
      When another 1500 ms of game time pass
      Then the sky is exactly "#f4a261"
      And the desert floor, top and hills layers are at alpha 1

  Rule: Stars fade in entering industrial and out leaving it

    Scenario: Stars fade from alpha 0 to 1 over 3000 ms when the score reaches 60
      Given I play the ramped schedule through column 60
      Then the score reads "60"
      And no star is drawn
      When 1500 ms of game time pass
      Then exactly 12 stars are drawn at alpha 0.5
      When another 1500 ms of game time pass
      Then exactly 12 stars are drawn at alpha 1

    Scenario: Stars fade from alpha 1 to 0 over 3000 ms when the score reaches 80
      Given I play the ramped schedule through column 80
      Then the score reads "80"
      And exactly 12 stars are drawn at alpha 1
      When 1500 ms of game time pass
      Then exactly 12 stars are drawn at alpha 0.5
      When another 1500 ms of game time pass
      Then no star is drawn

  Rule: Pausing or dying freezes a fade; restart snaps to meadow

    Scenario: Pausing halfway through the desert fade freezes the sky and layer alphas
      Given I play the ramped schedule through column 20
      And 1500 ms of game time have passed
      When I press "p"
      And 2000 ms pass
      Then the sky and scenery fade progress are exactly where they were when I paused

    Scenario: Dying mid-fade freezes the scenery, and a restart shows pure meadow
      Given I play the ramped schedule through column 20
      And 1000 ms of game time have passed
      When the panda touches the next column
      Then the scenery fade is frozen where it was at death
      When I tap to play again after the freeze
      Then the score reads "0"
      And the sky is "#71c5cf"
      And the scenery fade progress is 1 with meadow floor, hills and no stars

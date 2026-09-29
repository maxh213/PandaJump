Feature: Panda Jump moves the run through a new biome every 20 points
  As a player on a long run
  I want the scenery to change as my score climbs
  So that a long run feels like a journey rather than one endless field

  "The ramped schedule" and "column n is cleared" are as defined in features/sky-by-score.feature.
  A biome is a plain set of choices decided from the score alone: the meadow below 20, the desert from 20 to 39,
  the snowfield from 40 to 59 and the industrial biome from 60 to 79, after which the sequence repeats from the meadow.
  `window.pandaJump.run.view().biome` names the current biome. Each biome sets four things, all built only from files
  already in assets/ and colours:
  - the floor: the "rock" strip and the "grass" strip use "rock_06.png" and "top_grass_01.png" in the meadow,
    "sand_06.png" and "sand_06.png" in the desert, "snow_06.png" and "snow_06.png" in the snowfield, and
    "rock_06.png" and "metal_06.png" in the industrial biome;
  - the columns: a column spawned in the biome uses "dirt_06.png" (meadow), "sand_06.png" (desert), "ice_06.png"
    (snowfield) or "metal_06.png" (industrial) for every box, whatever the random source draws;
  - the sky, which is both `view().sky` and the main camera's background colour: "#71c5cf", "#f4a261", "#a9c9e0"
    and "#4a4e69" in that order;
  - the hills' colour: "#4a9ba6", "#c97b3a", "#ffffff" and "#22223b" in that order.
  Crossing a threshold starts a 3000 ms scenery crossfade (features/biome-fade.feature); by two columns after the
  switch the fade has finished and the new biome's floor, sky and hills are fully shown. Columns already on screen
  keep the look they spawned with, so a column is sampled two columns after the switch. The random source picks
  1 box and no second column for every column.

  Background:
    Given I open the Panda Jump page
    And the run has just started

  Rule: The biome is decided from the score

    Scenario: A run starts in the meadow
      Then the biome is "meadow"
      And the floor, a column, the sky and the hills all use the meadow's choices

    Scenario: The desert starts at a score of 20
      Given I play the ramped schedule through column 22
      Then the biome is "desert"
      And the floor, a column, the sky and the hills all use the desert's choices

    Scenario: The snowfield starts at a score of 40
      Given I play the ramped schedule through column 42
      Then the biome is "snowfield"
      And the floor, a column, the sky and the hills all use the snowfield's choices

    Scenario: The industrial biome starts at a score of 60
      Given I play the ramped schedule through column 62
      Then the biome is "industrial"
      And the floor, a column, the sky and the hills all use the industrial biome's choices

  Rule: A new run always starts back in the meadow

    Scenario: Restarting after a death in the desert returns to the meadow
      Given I play the ramped schedule through column 22 and then stop jumping
      When the panda touches the next column, the game freezes, and tapping to play again restarts it
      Then the score reads "0"
      And the biome is "meadow"
      And the floor, the sky and the hills use the meadow's choices

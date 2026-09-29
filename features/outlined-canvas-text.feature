Feature: Panda Jump outlines every piece of canvas text in black
  As a player looking at the day, sunset and night skies
  I want every word on the canvas to have a black outline
  So that the white and gold text stays readable whatever the sky colour

  Times use the same conventions as features/phaser-4-core-run.feature.
  "Outlined" means the text has a black (#000000) stroke 4 px thick and keeps its fill colour, font size, position and visibility.
  "The texts" are the score, the best line, the "Faster!" callout, the best-column marker, the countdown, the double-jump hint, the pause button (the "II"),
  the game-over texts (title, medal, score, best, prompt, share, copy and runs lines) and the pause texts (title and prompt).
  "The ramped schedule" is as defined in features/difficulty-ramp.feature.

  Background:
    Given I open the Panda Jump page
    And the run has just started

  Rule: Every text is outlined while the run is live

    Scenario: The texts are outlined the moment a run starts
      Then every one of the texts is outlined

  Rule: Every text is still outlined after a death

    Scenario: The texts are outlined on the game-over screen
      When the panda hits a column
      Then every one of the texts is outlined

  Rule: The gold callout is outlined while the sunset sky shows

    Scenario: The "Faster!" callout is gold and outlined on the sunset sky
      Given I play the ramped schedule through column 20
      Then the sky is "#f4a261"
      And the callout is visible
      And the callout is gold (#ffd700) and outlined

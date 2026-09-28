Feature: Panda Jump on Phaser 4, slice: the airborne pose
  As a player on the Panda Jump page
  I want the panda to hold one still pose while it is in the air
  So that a jump reads clearly as a jump instead of the panda pedalling its legs through the sky

  Times are game time in ms since the run started, driven by an injected clock. Pressing Space at 0 ms
  jumps and the panda is back on the floor by about 1160 ms. "The still pose" is frame 17 of
  assets/Panda.png, which is also the first of the six running frames 17 to 22. On the floor the panda
  cycles those frames at 15 per second of game time, unchanged. No new art is added.

  Background:
    Given I open the Panda Jump page
    And the run has just started

  Rule: While the panda is in the air it shows the still pose

    Scenario: A floor jump holds frame 17 at every moment in the air
      When I press Space at 0 ms
      Then the panda's frame is 17 at 100 ms, 300 ms, 580 ms and 900 ms

    Scenario: A double jump keeps holding frame 17
      When I press Space at 0 ms
      And I press Space again at 580 ms
      Then the panda's frame is 17 at 700 ms and at 1000 ms

  Rule: On the floor the panda keeps its running cycle

    Scenario: The frame cycles through 17 to 22 while the panda runs
      Then the panda's frame takes at least two different values between 17 and 22 over the first 400 ms

    Scenario: The running cycle picks up from game time the moment the panda lands
      When I press Space at 0 ms
      And I advance to 1300 ms
      Then the panda is on the floor and its frame is 18, the frame game time 1300 ms gives

  Rule: Pause and game over look as they always did

    Scenario: Pausing mid-jump shows the frame game time gives
      When I press Space at 0 ms
      And I press P at 300 ms
      Then the panda's frame is 21, the frame game time 300 ms gives

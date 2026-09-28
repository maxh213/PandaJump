Feature: Panda Jump blocks the page's pull-to-refresh gesture
  As a player tapping near the top of the screen on a phone
  I want a downward drag on the page to never reload it
  So that an accidental jump tap can't be mistaken for pull-to-refresh and interrupt my run

  Background:
    Given I open the Panda Jump page

  Rule: The page opts out of the browser's pull-to-refresh gesture

    Scenario: The html and body elements contain vertical overscroll instead of the default
      Then the html element's computed vertical overscroll behaviour is not the default "auto"
      And the body element's computed vertical overscroll behaviour is not the default "auto"

    Scenario: The solid black edge-to-edge page still has no visible layout regression
      Given the browser viewport is 375 by 812 px
      Then the pixel colour at each of the four page corners is pure black
      And the html and body backgrounds are pure black with no body margin

Feature: Sans-serif fallback for the page font
  As a player whose Google Fonts request fails or is blocked
  I want the page to still read as a sans-serif page
  So that a failed font load doesn't switch the title and text to a serif face

  Background:
    Given I open the Panda Jump page

  Rule: The page font falls back to a generic sans-serif family

    Scenario: The heading lists Lato then a generic sans-serif fallback
      Then the h1's computed font-family lists 'Lato' followed by a generic sans-serif fallback

    Scenario: The paragraph text lists Lato then a generic sans-serif fallback
      Then the paragraph's computed font-family lists 'Lato' followed by a generic sans-serif fallback

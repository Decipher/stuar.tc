Feature: Navigation

  Scenario: Navigation links are present
    Given I visit the homepage
    Then I should see navigation links

  Scenario: Site has working links
    Given I visit the homepage
    Then the page should load without errors
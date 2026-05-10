Feature: Articles

  Scenario: Anonymous user views articles listing
    Given I visit "/articles"
    Then I see the page title "Latest"

  Scenario: Homepage shows latest articles
    Given I visit the homepage
    Then I should see "Latest" section
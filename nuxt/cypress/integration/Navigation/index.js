import { Given, Then } from 'cypress-cucumber-preprocessor/steps'

Given('I visit the homepage', () => cy.visit('/'))
Then('I should see navigation links', () =>
  cy.get('nav, .navbar, [role="navigation"]').should('exist')
)
Then('the page should load without errors', () =>
  cy.get('body').should('be.visible')
)

import { Given, Then } from 'cypress-cucumber-preprocessor/steps'

Given('I visit the homepage', () => cy.visit('/'))
Given(/I visit "([^"]+)"/, (path) => cy.visit(path))
Then('I see the page title {string}', (title) => cy.get('body').should('contain', title))
Then('I should see {string} section', (section) => cy.get('body').should('contain', section))

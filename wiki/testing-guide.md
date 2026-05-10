# Testing Guide

## Test Types

This project uses three types of testing:

1. **Jest** - Unit tests for Vue components
2. **Cypress** - End-to-end tests for user flows
3. **PHPUnit** - Backend tests for Drupal JSON:API endpoints

## Running Tests

### All Tests

```bash
cd nuxt
yarn test
```

This runs both Jest and Cypress tests sequentially.

### Jest Tests Only

```bash
cd nuxt
yarn test:jest
```

### Cypress Tests Only

```bash
cd nuxt
yarn test:cy
```

Note: Cypress tests require the app to be serving first:
```bash
yarn serve  # Build and start production server
yarn test:cy
```

### Cypress Debug Mode (Interactive)

```bash
cd nuxt
yarn test:cy:open    # Against static server
yarn test:cy:watch  # Against dev server (live reload)
```

## Writing Jest Tests

### Test File Location

Place test files adjacent to the component with `.test.js` extension:

```
components/
├── MyComponent.vue
└── MyComponent.test.js
```

### Test Structure

```javascript
import { shallowMount } from '@vue/test-utils'
import MyComponent from './MyComponent.vue'

describe('MyComponent', () => {
  test('is a Vue instance', () => {
    const wrapper = shallowMount(MyComponent)
    expect(wrapper.vm).toBeTruthy()
  })

  test('renders correctly', () => {
    const wrapper = shallowMount(MyComponent, {
      propsData: { myProp: 'value' }
    })
    expect(wrapper.text()).toContain('value')
  })
})
```

### Best Practices

- Use `shallowMount` for unit tests to mock child components
- Mock external dependencies (Druxt modules, Vuex store)
- Test one behavior per test case

### Mocking Druxt Components

Many components use Druxt mixins that require specific props:

```javascript
jest.mock('druxt-entity', () => ({
  DruxtEntityMixin: {
    data() {
      return { fields: {}, schema: {} }
    },
  },
}))
```

## Writing Cypress Tests

### Test File Location

```
cypress/
├── integration/
│   └── Homepage.feature
```

### Feature File Structure

```gherkin
Feature: Homepage
  As a visitor
  I want to view the homepage
  So I can see the latest content

  Scenario: Homepage loads successfully
    Given I am on the homepage
    Then I should see the page title
```

### Step Definitions

```javascript
// cypress/integration/Homepage.js
import { Given, Then } from 'cypress-cucumber-preprocessor/steps'

Given('I am on the homepage', () => {
  cy.visit('/')
})

Then('I should see the page title', () => {
  cy.contains('Stuart Clark')
})
```

## Current Test Coverage

As of the last test run:

**Test Results**: 14 tests passing, 9 test suites

**Coverage on Tested Files**:
| File | Coverage |
|------|----------|
| Badge.vue | 100% |
| Button.vue | 100% |
| Card.vue | 100% |
| Hero.vue | 100% |
| Navbar.vue | 100% |
| StuartClark.vue | 100% |
| index.vue (pages) | 100% |
| index.vue (articles) | 100% |
| text-formatted/Default.vue | 100% |

**Note**: Druxt entity components (Card, Full, code, repository) have 40-66% coverage but tests pass. Some Druxt components (section, field, layout-paragraph) require integration testing with the full Nuxt/Druxt runtime and are better tested via Cypress E2E tests.

### Test Statistics

- Total Tests: 14
- Passing: 14
- Failing: 0
- Snapshots: 6 passed

### Adding New Tests

1. **Identify the component** to test
2. **Create test file** next to the component
3. **Write test cases** covering key functionality
4. **Run tests** to verify they pass
5. **Update this document** with coverage changes

## Running PHPUnit Tests (Drupal)

### Quick Test (Recommended)

```bash
cd drupal
ddev phpunit
```

This verifies:
- JSON:API endpoint is accessible
- Articles are returned (4 articles)
- Individual article access works
- Paragraph types (code, media, repository, section, text_formatted) are accessible

### Full PHPUnit Tests

To run the full PHPUnit test suite (requires additional setup):

```bash
cd drupal
ddev exec php -d memory_limit=-1 vendor/bin/phpunit --configuration=web/core/phpunit.xml.dist web/modules/custom/stuartc_tests/
```

Note: The kernel tests have module dependency issues in this environment - they require additional Symfony serializer module setup.

### Test Module

The test module is located at:
```
drupal/web/modules/custom/stuartc_tests/
```

It contains kernel tests that verify route availability and content field definitions:
- `tests/src/Kernel/JsonApiEndpointTest.php`

### Verify JSON:API Manually

```bash
# Test article endpoint
curl -sk https://stuartclark.ddev.site/jsonapi/node/article | jq '.data | length'

# Get article titles
curl -sk https://stuartclark.ddev.site/jsonapi/node/article | jq '.data[].attributes.title'
```

It contains kernel tests that verify route availability and content field definitions:
- `tests/src/Kernel/JsonApiEndpointTest.php`

### Known Issues

The PHPUnit test runner has configuration issues with this Drupal setup. To run tests manually:

```bash
cd drupal
SIMPLETEST_BASE_URL=http://web php vendor/bin/phpunit -c web/core/phpunit.xml.dist web/modules/custom/stuartc_tests/
```

Alternatively, verify the JSON:API contract manually - the live endpoint is accessible and returning the expected content from Tome exports.

### What the JSON:API Provides

- Article nodes at `/jsonapi/node/article` - returns 4 articles (Hello world, Layout Paragraphs module, What no images, Decoupling configuration with Config Pages)
- Taxonomy article_type at `/jsonapi/taxonomy_term--article_type` - returns "Blog post"
- Taxonomy article_category at `/jsonapi/taxonomy_term--article_category` - returns "Druxt", "Planet Drupal"
- Paragraphs: text_formatted, code, repository, section types
- Block content: basic_block

### CI Integration

To run in CI (GitHub Actions), verify JSON:API endpoint manually or fix PHPUnit configuration:
ddev phpunit --group stuartc_tests web/modules/custom/stuartc_tests/
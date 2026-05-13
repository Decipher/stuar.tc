# AGENTS.md — stuar.tc

Personal website of Stuart Clark at https://stuar.tc, built with Nuxt + Drupal (DruxtJS).

## Rules

- Use **yarn** (not npm) for frontend dependencies
- DDev commands must be run from the `drupal` directory
- Backend must be running before starting the frontend

## Project Structure

- `nuxt/` - Nuxt 2 frontend (Vue 2)
- `drupal/` - Drupal 11 backend
- `wiki/` - Project documentation
- `.opencode/` - OpenCode configuration and skills
- `openspec/` - Change specifications

## Development

### Prerequisites

- Node.js 16+
- PHP 8.3+
- Composer
- Docker + DDev

### Starting the Environment

```bash
# 1. Start DDev (run from drupal directory)
cd drupal
ddev start

# 2. Install the site
ddev install

# 3. Start the frontend (backend must be running first)
cd ../nuxt
yarn install
yarn dev

# Access at http://stuartclark.ddev.site
```

### Key Commands

**Frontend (from nuxt/):**

- `yarn dev` - Start dev server
- `yarn build` - Build for production
- `yarn generate` - Generate static site (for Netlify)
- `yarn lint` - Run all linters
- `yarn test:jest` - Run Jest unit tests
- `yarn test:cy` - Run Cypress E2E tests
- `yarn test:cy:open` - Open Cypress GUI (against static server)
- `yarn test:cy:watch` - Open Cypress GUI (against dev server)
- `yarn test` - Run all tests
- `yarn storybook` - Start Storybook

**Backend (from drupal/):**

- `ddev drush uli` - Get login one-time URL
- `ddev drush cr` - Clear cache
- `ddev drush updb` - Run database updates
- `ddev drush cim` - Import config
- `ddev phpunit` - Run PHPUnit tests
- `ddev phpcs` - Run PHP CodeSniffer (Drupal coding standards)
- `ddev phpcbf` - Fix PHP CodeSniffer violations
- `ddev phpstan` - Run PHPStan static analysis

### Environment Variables

- `BASE_URL` - Drupal site URL (default: `http://stuartclark.ddev.site`)

## Testing

- Jest for unit tests (`*.test.js`)
- Cypress for E2E tests (`cypress/integration/`)
- Storybook for component development: `npx nuxt storybook` (from nuxt/)

## Code Style

- ESLint for JavaScript
- Stylelint for CSS
- Commitlint for commit messages
- Prettier for formatting

## CI/CD

- **GitHub Actions**: Runs on push to `main`/`develop` and PRs. Lints, tests (Jest + Cypress), deploys to Netlify
- **Netlify**: Auto-deploys frontend on `main` branch
- **Codecov**: Test coverage reporting
- **Gitpod**: Cloud development environment with pre-configured DDev and Nuxt

## Content

- Content is stored in `drupal/content/` as JSON exports
- See [wiki/](wiki/) for detailed documentation

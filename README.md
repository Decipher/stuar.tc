# Stuart Clark

> Hello world

This repository contains the source code, content and configuration for https://stuar.tc, the personal website of Stuart Clark.

This is a [DruxtJS](https://druxtjs.org), Fully Decoupled Drupal & Nuxt.js site, built with the Drupal Tome module for file based content, with the intent of being developed in the cloud and deployed to CDN, and to operate serverless and databaseless.


## Local Development

### DDev

> DDEV is an open source tool that makes it dead simple to get local PHP development environments up and running within minutes.

DDEV is used to manage the Drupal instance, and provides a CLI that can be used to run common drupal tasks, including `ddev drush`.

These commands must be run from within the `drupal` folder.

```bash
# Start the environment
cd drupal
ddev start
ddev install
```

See the [wiki](wiki/development-setup.md) for full setup instructions.


## Cloud Development

### Gitpod

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/Decipher/stuar.tc)

The environment contains a running instance of Drupal and Nuxt.

You can access the services in your browser, via the **Remote Explorer** extension, or via the URL pattern: `https://[PORT]-[GITPOD_ID].[GITPOD_SERVER].gitpod.io`

| Port | Service |
| -- | -- |
| `3000` | Nuxt.js |
| `3003` | Storybook |
| `8080` | Drupal |


## CI/CD

### GitHub Actions

The project uses GitHub Actions for continuous integration:

- **Linting**: ESLint, Stylelint
- **Testing**: Jest (unit), Cypress (E2E)
- **Coverage**: Codecov
- **Deployment**: Netlify (automatic on main branch)

See [`.github/workflows/ci.yml`](.github/workflows/ci.yml) for the workflow configuration.

### Netlify

The frontend is deployed to Netlify. Deployment happens automatically on pushes to `main`. The build command is `yarn generate` and outputs to `nuxt/dist`.


## Tools

### DDEV

DDEV is used to manage the Drupal instance, and provides a CLI that can be used to run common drupal tasks, including `ddev drush`.

These commands should be run from within the `/drupal` folder.

Refer to the documentation for more details: https://ddev.readthedocs.io

### @nuxtjs/storybook

> Storybook integration with NuxtJS .

Druxt integrates with the Nuxt Storybook module to provide zero-configuration, auto-discovery stories with access to live data from your Drupal backend.

To start Storybook, navigate to the `nuxt` directory and run `npx nuxt storybook`.


## Documentation

See the [wiki/](wiki/) directory for detailed documentation:

| Page | Description |
|------|-------------|
| [Architecture](wiki/architecture.md) | Nuxt + Drupal + DruxtJS stack overview |
| [Development Setup](wiki/development-setup.md) | Local and cloud development environment |
| [Testing Guide](wiki/testing-guide.md) | Jest, Cypress, and PHPUnit testing |
| [Troubleshooting](wiki/troubleshooting.md) | Common issues and solutions |
| [Upgrade Notes](wiki/upgrade-notes/) | Drupal upgrade paths |

## License

[MIT](https://github.com/druxt/druxt.js/blob/develop/LICENSE)

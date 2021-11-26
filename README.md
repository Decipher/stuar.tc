# Stuart Clark

> Hello world

This repository contains the source code, content and configuration for https://stuar.tc, the personal website of Stuart Clark.

This is a [DruxtJS](https://druxtjs.org), Fully Decoupled Drupal & Nuxt.js site, built with the Drupal Tome module for file based content, with the intent of being developed in the cloud and deployed to CDN, and to operate serverless and databaseless.


## How to use it

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/Decipher/stuar.tc)

The environment contains a running instance of Drupal and Nuxt.

You can access the services in your browser, via the **Remote Explorer** extension, or via the URL pattern: `https://[PORT]-[GITPOD_ID].[GITPOD_SERVER].gitpod.io`


## Services

| Port | Service |
| -- | -- |
| `3000` | Nuxt.js |
| `3003` | Storybook |
| `8080` | Drupal |


## Tools

### DDEV

> DDEV is an open source tool that makes it dead simple to get local PHP development environments up and running within minutes. 

DDEV is used to manage the Drupal instance, and provides a CLI that can be used to run common drupal tasks, including `ddev drush`.

These commands should be run from within the `/drupal` folder.

Refer to the documentation for more details: https://ddev.readthedocs.io

### @nuxtjs/storybook

> Storybook integration with NuxtJS .

Druxt integrates with the Nuxt Storybook module to provide zero-configuration, auto-discovery stories with access to live data from your Drupal backend.

To start Storybook, navigate to the `nuxt` directory and run `npx nuxt storybook`.


## License

[MIT](https://github.com/druxt/druxt.js/blob/develop/LICENSE)

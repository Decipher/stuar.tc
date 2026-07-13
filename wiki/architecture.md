# Architecture Overview

## System Stack

```mermaid
graph LR
    Nuxt[Nuxt 4 Frontend] -->|SSG at build time| Static[Static HTML/.output/public]
    Nuxt -->|@nuxt/content v3| Content[content/articles Markdown]
    Nuxt -->|Live fetch at build time| DrupalOrg[drupal.org public API]
    Nuxt -->|Live fetch at build time| GitHub[GitHub API]
    Drupal[Drupal backend] -.->|JSON:API, tested in CI| DrupalTests[Kernel tests]
```

The frontend is **headless** — it does not consume the repo's own `drupal/`
backend. Druxt is gone for the initial Nuxt 4 launch. `drupal/` remains as a
self-hosted Drupal instance with its own JSON:API surface, exercised by
kernel tests in CI, independent of the Nuxt frontend's build.

> **Post-launch**: Druxt is planned to be re-integrated after launch to wire
> Drupal-driven content back into the frontend. See
> [Drupal 11 upgrade notes](upgrade-notes/drupal-11.md#future-druxt-re-integration-post-launch)
> — Druxt's module ecosystem has no Nuxt 3/4 support yet, so this is a
> substantial follow-up project, not a quick re-enable.

## Frontend (Nuxt 4)

- **Framework**: Nuxt 4, fully static (`routeRules: { '/**': { prerender: true } }`)
- **UI**: Nuxt UI v3 + Tailwind v4, via the `@stuartclark/ui` design-system
  package (`link:../../ui`, sibling `apps/ui` submodule)
- **Content**: `@nuxt/content` v3 typed collections (`content/articles/`) —
  no CMS round-trip
- **Data**: Typed TS data (`app/data/`) for site config, stats, projects,
  modules, talks, uses
- **Fonts**: `@nuxt/fonts` (self-hosted Archivo + JetBrains Mono)

### Directory Structure

```text
nuxt/
├── app/
│   ├── app.vue, app.config.ts   # Root + Nuxt UI config
│   ├── assets/css/main.css      # @theme: magenta/sand palettes
│   ├── components/              # App wrappers (StatBand, ActivityFeed, DevGrid, ...)
│   ├── composables/             # 10 auto-imported composables (see below)
│   ├── data/                    # Typed TS data
│   ├── layouts/                 # default + minimal
│   └── pages/                   # 7 active routes (+ writing, photos disabled)
├── content/articles/            # @nuxt/content Markdown
├── content.config.ts            # Article collection schema
├── tests/                       # Vitest unit/component, Playwright visual + SEO
└── .storybook/                  # Storybook 9 config
```

## Backend (Drupal)

- Self-hosted Drupal instance under `drupal/`, managed via DDEV
- Exposes a JSON:API surface, covered by PHPCS, PHPStan, and PHPUnit kernel
  tests in CI (see `drupal/web/modules/custom/stuartc_tests/`)
- **Not currently wired to the Nuxt frontend** — retained and tested in its
  own right, but content and data come from `@nuxt/content` and the
  composables below, not this instance

## Live Data (build-time fetch)

Several composables in `app/composables/` fetch from **external, public**
APIs at `nuxt generate` time (static, no client-side round-trip):

- `useModules`, `useCoMaintainedModules`, `useDrupalCons`, parts of
  `useActivity` — the public **drupal.org** API (Stuart's contributor
  profile, module installs, DrupalCon attendance)
- `useNpmPackages`, parts of `useActivity`, `useContributions` — the
  **GitHub API** (via server routes using `GH_TOKEN`)

See [Composables](../AGENTS.md#composables) in `AGENTS.md` for the full list
and their purposes.

## Data Flow

1. **Build time** (`nuxt generate`): composables fetch drupal.org + GitHub
   data, `@nuxt/content` loads Markdown articles, everything is prerendered
   to static HTML in `nuxt/.output/public`
2. **Runtime**: the static site is served as-is (Netlify) — no server calls
   except client-side interactivity (theme toggle, contact modal, dev console)

## Environment Variables

- `GH_TOKEN` — GitHub API token for build-time server routes
- `UI_REPO_TOKEN` — read access to the private `Decipher/sc-ui` mirror
  (Netlify install step clones `@stuartclark/ui`)

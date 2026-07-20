# Architecture Overview

## System Stack

```mermaid
graph LR
    Drupal[Drupal backend] -->|JSON:API, SQLite + Tome| Sync[sync-content.mjs — manual GitLab CI job]
    Sync -->|writes| ContentData[content/articles-data JSON]
    Nuxt[Nuxt 4 Frontend] -->|SSG at build time| Static[Static HTML/dist]
    Nuxt -->|@nuxt/content v3| ContentData
    Nuxt -->|Live fetch at build time| DrupalOrg[drupal.org public API]
    Nuxt -->|Live fetch at build time| GitHub[GitHub API]
    Drupal -.->|JSON:API, tested in CI| DrupalTests[Kernel tests]
```

The frontend is **fully static** — it never talks to Drupal at Nuxt build
time. Instead, the site's own `drupal/` backend (no production hosting) is
the source of truth for `/writing` content: a manual GitLab CI job installs
Drupal fresh via Composer + SQLite + Tome (no Docker/DDEV — see Content Sync
below), serves it with PHP's built-in server, and runs
`nuxt/scripts/sync-content.mjs` — using druxt's own core client
(`DruxtClient`) and schema introspection (`DruxtSchema`), installed as real
`nuxt/` dependencies from druxt/druxt.js's `feature/337-nuxt3` branch (the
Nuxt 4-targeting branch — the legacy Vue 2/Nuxt 2 `druxt` npm package has no
Nuxt 4 support) and patched via `pnpm patch` (`nuxt/patches/druxt.patch`,
`nuxt/patches/druxt-schema.patch`) to drop the axios/consola dependencies in
favour of fetch/console — to regenerate the `articleEntries` content
collection and open an MR. See [Content Sync](#content-sync-drupal--nuxt) below and
[Drupal 11 upgrade notes](upgrade-notes/drupal-11.md#future-druxt-re-integration-post-launch)
for the fuller history of this decision.

## Frontend (Nuxt 4)

- **Framework**: Nuxt 4, fully static (`routeRules: { '/**': { prerender: true } }`)
- **UI**: Nuxt UI v3 + Tailwind v4, via the `@stuartclark/ui` design-system
  package (`link:../../ui`, sibling `apps/ui` submodule)
- **Content**: `@nuxt/content` v3 typed collections — `articleEntries`
  (`content/articles-data/`), a data collection synced from Drupal (see
  below); no CMS round-trip at build or runtime, only at sync time
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
│   └── pages/                   # 8 active routes (+ uses, photos, drupalgive, styleguide disabled)
├── content/articles-data/       # @nuxt/content data collection, synced from Drupal
├── content.config.ts            # articleEntries collection schema (paragraph tree)
├── server/routes/               # blog.xml, planet-drupal.xml (RSS, prerendered)
├── tests/                       # Vitest unit/component, Playwright visual + SEO
└── .storybook/                  # Storybook 9 config
```

## Backend (Drupal)

- Self-hosted Drupal instance under `drupal/`, using DDEV for local
  MySQL-backed development and Tome (`drush tome:install -y` imports both
  `config/sync` and `content/*.json`) as the portable content format
- Exposes a JSON:API surface, covered by PHPCS, PHPStan, and PHPUnit kernel
  tests in CI (see `drupal/web/modules/custom/stuartc_tests/`)
- No production hosting — Tome's static content-JSON model means it doesn't
  need to run continuously to be the source of truth for `/writing`
- **Not wired to the Nuxt frontend's build** — the Nuxt build itself never
  talks to Drupal (see Content Sync below); everything else (site config,
  stats, projects) still comes from typed TS data and the composables below

## Content Sync (Drupal → Nuxt)

`/writing`'s content is authored in Drupal and pulled into the frontend by a
**manual** GitLab CI job (`sync:drupal-content` in `.gitlab-ci.yml`), not a
live or build-time integration. It runs
`.gitlab/scripts/run-drupal-content-sync.sh`, which deliberately avoids
Docker/DDEV entirely:

1. Plain `composer install` (image: `debian:trixie` + PHP 8.1 from the
   sury.org apt repo — no Docker executor complications, works identically
   on any runner architecture)
2. Installs Drupal against a throwaway **SQLite** database (`drush
   tome:install`, after enabling the `sqlite` core module in the CI
   checkout's copy of `core.extension.yml` only — Drupal won't import config
   that omits the module providing its own active DB driver, and the
   committed config was authored against DDEV's MySQL) — the same
   Docker-free pattern
   [AlexSkrypnyk/drupal_extension_scaffold](https://github.com/AlexSkrypnyk/drupal_extension_scaffold)
   uses to test Drupal extensions in CI
3. Serves the site with PHP's built-in server (`php -S`, run with its
   working directory set to the docroot — some contrib modules, e.g.
   `jsonapi_hypermedia`, resolve paths relative to cwd in a way that only
   matches the docroot under the built-in server, not wherever the shell
   started)
4. `nuxt/scripts/sync-content.mjs` queries that JSON:API (via druxt's own
   `DruxtClient`) for `node--article` (with paragraphs, taxonomy, and media
   included) and writes one JSON file per article into
   `nuxt/content/articles-data/`, preserving the full Layout Paragraphs tree
   (`text_formatted`, `section`, `code`, `repository`, `media` — the 5
   bundle types actually handled) rather than flattening it to markdown. It
   also uses `DruxtSchema` to check `field_content`'s actually-allowed
   paragraph bundles against that list and warns (without failing the sync)
   if Drupal's schema has grown a bundle the sync doesn't handle yet
5. The regenerated content + media are committed to a branch and opened as
   an MR (`.gitlab/scripts/open-content-sync-mr.sh`) for review — never
   pushed straight to main
6. Once merged (on `gitlab.local`) and promoted to the `github` mirror, the
   ordinary Netlify/GitHub Actions build picks up the already-synced static
   files with no Drupal dependency of its own

This replaced an earlier `docker:dind` + DDEV attempt that hit a chain of
runner-specific infrastructure issues (an arm64/amd64 image mismatch, then
service networking that never resolved by any hostname) — rather than
pursue those further, the CI job was rebuilt around a Docker-free install
path and verified end-to-end (real 4-article sync, real JSON:API, real
rendered `/writing` pages) before being wired back into `.gitlab-ci.yml`.

`nuxt/app/components/AppDruxtParagraph*.vue` render the synced paragraph
tree — a small, bespoke set of components in the spirit of Druxt, not the
legacy Nuxt 2 `druxt` npm package (Vue 2/Vuex-locked, no Nuxt 3/4 support).

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

1. **Sync time** (manual, infrequent): the GitLab CI job above pulls
   `/writing` content from Drupal into `content/articles-data/` — this is
   the only point at which Drupal is involved at all
2. **Build time** (`nuxt generate`): composables fetch drupal.org + GitHub
   data, `@nuxt/content` loads the (already-synced) `articleEntries`
   collection, everything — including `/blog.xml` and `/planet-drupal.xml`,
   explicitly listed in `nitro.prerender.routes` since the crawler doesn't
   follow `<head>` `<link>` tags — is prerendered to static HTML in
   `nuxt/dist`
3. **Runtime**: the static site is served as-is (Netlify) — no server calls
   except client-side interactivity (theme toggle, contact modal, dev console)

## Environment Variables

- `GH_TOKEN` — GitHub API token for build-time server routes
- `UI_REPO_TOKEN` — read access to the private `Decipher/sc-ui` mirror
  (Netlify install step clones `@stuartclark/ui`)

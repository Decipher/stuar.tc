# Architecture Overview

## System Stack

```mermaid
graph LR
    Drupal[Drupal backend] -->|JSON:API, DDEV + Tome| Sync[sync-content.mjs — manual GitLab CI job]
    Sync -->|writes| ContentData[content/articles-data JSON]
    Nuxt[Nuxt 4 Frontend] -->|SSG at build time| Static[Static HTML/dist]
    Nuxt -->|@nuxt/content v3| ContentData
    Nuxt -->|Live fetch at build time| DrupalOrg[drupal.org public API]
    Nuxt -->|Live fetch at build time| GitHub[GitHub API]
    Drupal -.->|JSON:API, tested in CI| DrupalTests[Kernel tests]
```

The frontend is **fully static** — it never talks to Drupal at Nuxt build
time (Netlify can't run DDEV). Instead, the site's own `drupal/` backend
(managed via DDEV + Tome, no production hosting) is the source of truth for
`/writing` content: a manual, `docker:dind`-based GitLab CI job spins up
DDEV, imports Tome content, and runs `drupal/scripts/sync-content.mjs` — a
small JSON:API client in the spirit of Druxt (not the legacy Vue 2/Nuxt 2
`druxt` npm package, which has no Nuxt 4 support) — to regenerate the
`articleEntries` content collection and open an MR. See
[Content Sync](#content-sync-drupal--nuxt) below and
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

- Self-hosted Drupal instance under `drupal/`, managed via DDEV + Tome
  (`drush tome:install -y` imports both `config/sync` and `content/*.json`)
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
live or build-time integration:

1. The job spins up DDEV under `docker:dind` (on the shared
   `macos-host-docker-runner` — a real Docker host, not the sandbox this was
   developed in) and runs `ddev install`, importing Tome content
2. `drupal/scripts/sync-content.mjs` queries the local JSON:API for
   `node--article` (with paragraphs, taxonomy, and media included) and
   writes one JSON file per article into `nuxt/content/articles-data/`,
   preserving the full Layout Paragraphs tree (`text_formatted`, `section`,
   `code`, `repository`, `media` — the 5 bundle types actually in use)
   rather than flattening it to markdown
3. The regenerated content + media are committed to a branch and opened as
   an MR (`.gitlab/scripts/open-content-sync-mr.sh`) for review — never
   pushed straight to main
4. Once merged (on `gitlab.local`) and promoted to the `github` mirror, the
   ordinary Netlify/GitHub Actions build picks up the already-synced static
   files with no Drupal dependency of its own

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

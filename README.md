# stuar.tc

[![CI](https://github.com/Decipher/stuar.tc/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Decipher/stuar.tc/actions/workflows/ci.yml?query=branch%3Amain)
[![Coverage](https://codecov.io/gh/Decipher/stuar.tc/branch/main/graph/badge.svg)](https://codecov.io/gh/Decipher/stuar.tc/branch/main)
[![License](https://img.shields.io/github/license/Decipher/stuar.tc)](LICENSE)
[![Sponsor](https://img.shields.io/github/sponsors/Decipher?logo=githubsponsors&label=sponsor)](https://github.com/sponsors/Decipher)

Personal website for Stuart Clark - a Nuxt 4 app built on Nuxt UI v3 and the
[`@stuartclark/ui`](../ui) design system. Static-generated. The `/writing`
section's content is synced from a real Drupal 11 backend into a typed
`@nuxt/content` data collection - see [Content sync](#content-sync) below.

## Stack

- **Nuxt 4** + **Nuxt UI v3** (Tailwind v4, semantic utilities)
- **@nuxt/content v3** (typed article collection, Drupal-synced - see below)
- **@nuxt/fonts** (self-hosted Archivo + JetBrains Mono)
- **@stuartclark/ui** design system (34 Vue SFCs, consumed as `link:../../ui`)
- **Drupal 11** backend - source of truth for `/writing` content, decoupled via JSON:API
- Light + dark mode via Nuxt UI color mode
- **`nuxt-cloudflared-tunnel`** module (dev-only live preview: site + Storybook tunnels)

## Getting started

```bash
mise install          # Node 24 + pnpm 10
mise run install      # pnpm install (in nuxt/)
mise run dev          # http://localhost:3000
mise run hooks:install   # optional: enable commit-msg + pre-commit hooks
```

### Backend (Drupal)

No Docker/DDEV required - just PHP, Composer, and SQLite, via `.devtools/`
(see `drupal/.devtools/README.md` for the full breakdown):

```bash
cd drupal
make build   # assemble (composer install) + provision (SQLite + content import) + start
make login   # one-time login link
```

The built-in PHP server auto-discovers a free port (from `8888`) and prints
its URL on `start`/`login`/`info`. A Cloudflare quick tunnel opens by default
for sharing a live local preview - opt out with `CLOUDFLARE_TUNNEL=0`.

## Content sync

`/writing` articles live in Drupal, not as hand-authored Markdown. A sync
script (`nuxt/scripts/sync-content.mjs`) pulls them from Drupal's JSON:API  -
via druxt's `DruxtClient`/`DruxtSchema`, not the legacy Nuxt 2 `druxt`
package - and writes typed JSON into `nuxt/content/articles-data/`, which
`@nuxt/content` then treats it as an ordinary collection. The frontend never
calls Drupal directly at build or runtime. It is headless once synced. RSS
feeds (`/blog.xml`, `/planet-drupal.xml`) and comments (via Giscus) run off
the same synced data.

## Quality gates

```bash
pnpm typecheck        # vue-tsc
pnpm lint             # ESLint
pnpm lint:style       # Stylelint
pnpm lint:knip        # Dead code detection
pnpm lint:spell       # cspell
pnpm test             # Vitest
pnpm test:coverage    # Same, with coverage report (thresholds enforced — effectively 100%, see nuxt/vitest.config.ts)
pnpm size             # Client bundle size budget (size-limit)
pnpm generate         # Static build → .output/public/
pnpm test:visual      # Playwright visual + SEO (needs generate first)
```

Or via mise:

```bash
mise run ci           # typecheck + lint + style + knip + spell + tests
mise run ci:full      # + visual regression + SEO audit
```

| Port | Service |
| -- | -- |
| `3000` | Nuxt.js |
| `6006` | Storybook |
| `8888`+ | Drupal (auto-discovered by `.devtools/start`) |

## Design system

Colors are registered via `@theme static` in `app/assets/css/main.css`:

| Palette  | Alias     | Usage                                |
|----------|-----------|--------------------------------------|
| magenta  | `primary` | links, tags, CTAs, active states     |
| sand     | `neutral` | backgrounds, text, borders           |
| electric | -         | accent highlights                    |
| coral    | -         | secondary accents                    |

Nuxt UI semantic utilities (`text-highlighted`, `text-muted`, `text-dimmed`,
`bg-default`, `bg-muted`, `bg-elevated`, `border-default`) automatically adapt
to light/dark mode. `app.config.ts` sets `primary: 'magenta'`, `neutral: 'sand'`.

Fonts: **Archivo** (display/body) + **JetBrains Mono** (labels/numerals),
self-hosted by @nuxt/fonts.

## Component library

The design system is maintained in the sibling [`@stuartclark/ui`](../ui) repo (34 Vue
SFCs built on Nuxt UI primitives). It is consumed here as `link:../../ui`:

| Category | Components |
|----------|-----------|
| Layout | AppHeader, AppFooter, AppLogo, ThemeToggle, BackToTop |
| Atoms | Eyebrow, StatusPill, StatBlock, StatBand, Quote, SectionHeader, Steps |
| Data | ModuleRow, ActivityRow, ProfileRow, ContributionHeatmap |
| Cards | ProjectCard, FeaturedCard, DrupalConCard, UsesGroup, GiveBackCard, ArticleCard, SponsorCard |
| Content | ArticleRow, CodeBlock, CommentItem, CommentComposer, PageHero, EcosystemPane |
| Media | ImageSlot, ImageLightbox, Gallery |
| Overlays | ContactModal |
| Loaders | AppSkeleton |

## Pages

| Route | Description |
|-------|-------------|
| `/` | Hero, stats band, heartbeat, latest writing, selected work |
| `/about` | Bio, headshot, expertise, elsewhere links; "Get in touch" opens contact modal |
| `/open-source` | Profiles, module installs, contribution heatmap, activity, flagship DruxtJS |
| `/community` | Talks, Splash Award, DrupalCons attended, organising & training |
| `/writing` | Article list - Drupal-sourced (see [Content sync](#content-sync)) |
| `/writing/[...slug]` | Article detail, with Giscus comments |
| `/blog.xml`, `/planet-drupal.xml` | RSS feeds over the same article data |
| ~~`/uses`~~ | Tools, hardware, services - *disabled for first launch* |
| ~~`/drupalgive`~~ | Maintained projects, DrupalCons - *disabled for first launch* |
| ~~`/styleguide`~~ | Component showcase - *disabled for first launch* |
| ~~`/photos`~~ | Photography gallery - *disabled for first launch* |

Disabled pages live in `app/disabled-pages/` (out of the router entirely, not
just hidden from nav) and can be moved back into `app/pages/` to re-enable.

## Composables

Auto-imported from `app/composables/`. Most fetch live data from the Drupal.org
or GitHub APIs at build time (SSG) with static fallbacks.

| Composable | Purpose |
|------------|---------|
| `useSite` | Site config singleton (name, tagline, socials) |
| `useStats` | Stats band data; `ffpSites` exposes the live File (Field) Paths install count |
| `useModules` | Drupal.org project_module installs, ranked by usage |
| `useCoMaintainedModules` | Curated co-maintained modules from Drupal.org API |
| `useNpmPackages` | npm download counts + GitHub stars |
| `useActivity` | Merged GitHub + Drupal GitLab activity feed |
| `useContributions` | Contribution heatmap cells (GitHub + Drupal) |
| `useDrupalCons` | DrupalCon attendance from Drupal.org profile API |
| `useOSSProfiles` | Open-source profile aggregates (Drupal, GitHub, npm) |
| `useContactModal` | Shared `useState` for the layout-level contact modal (any page can open it) |
| `useLazyRefresh` | Deferred data refresh via `IntersectionObserver` - components bind the returned `target` ref to their root element; below-the-fold data refreshes only when scrolled near |
| `useShareUrl` | Request-aware canonical URL for share links/QR codes (tunnel in dev, `stuar.tc` in production) |
| `useQrCode` | Generates the QR code used on OG share images |
| `useDevPrefs` | Persisted preferences for the dev-only `DevGrid` overlay |

## Structure

```text
nuxt/
  app/
    app.vue                Root: UApp + head/SEO meta
    app.config.ts          Nuxt UI: primary=magenta, neutral=sand
    assets/css/main.css    @theme static: magenta/sand palettes + bg-stripes
    components/            App wrappers (StatBand, ActivityFeed, etc.) + DevGrid;
                            AppDruxtParagraph*.vue render the synced paragraph tree
    composables/           14 auto-imported composables (see above)
    data/                  Typed TS data (site, stats, projects, modules, etc.)
    layouts/default.vue    AppHeader + slot + AppFooter + ContactModal
    pages/                 Active routes (see Pages above)
    disabled-pages/        Routes excluded from the router — move back to re-enable
  content/articles-data/   @nuxt/content collection, synced from Drupal (JSON, not hand-authored)
  content.schema.ts        Zod schema for the article collection (dependency-free, so
                            tests/content/*.spec.ts can validate content files directly)
  scripts/sync-content.mjs Pulls Drupal JSON:API → content/articles-data/*.json
  server/routes/           blog.xml, planet-drupal.xml (RSS, prerendered)
  server/api/              contact form, GitHub/Drupal activity + stats proxies
  tests/                   Vitest unit/component, Playwright visual + SEO
drupal/                    Drupal 11 backend — source of truth for /writing content.
                            JSON:API tested via kernel/functional tests in CI; consumed
                            by the Nuxt frontend only at sync time, never at runtime
drupal/.devtools/          Composer + PHP built-in server + SQLite local dev workflow
.githooks/                 Mise-driven commit-msg + pre-commit hooks
.gitlab/                   CI pipeline + helper scripts
wiki/                      Deeper architecture/testing/troubleshooting docs (submodule)
```

## CI

GitLab CI (`.gitlab-ci.yml`) runs on MRs with stages `lint → test → build →
visual → audit → sync → preview`. Every install job clones + builds
`@stuartclark/ui` as a sibling so the `link:../../ui` dependency resolves.
GitHub Actions (`.github/workflows/`) mirror the pipeline for when GitHub CI
is in use, and add a `drupal` job (PHPCS, PHPStan, PHPUnit via `.devtools/`)
for the backend. Coverage reports upload to [Codecov](https://codecov.io/gh/Decipher/stuar.tc).

Netlify deploys automatically from the connected branch - build command
`pnpm generate`, base directory `nuxt`, via `netlify.toml` and the
`clone-ui` build plugin (see `nuxt/netlify/plugins/clone-ui`).

## Releases

Follows [GitFlow](https://nvie.com/posts/a-successful-git-branching-model/):
feature/fix/docs branches off `develop`, releases cut from `main`, `main`
merged back into `develop` after each release. See [CHANGELOG.md](CHANGELOG.md)
for release history.

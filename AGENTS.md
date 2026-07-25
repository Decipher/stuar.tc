# stuar.tc — Agent Instructions

## Project overview

Personal website for Stuart Clark. A Nuxt 4 app consuming the
[`@stuartclark/ui`](../ui) design-system module. Static-generated. The
`/writing` section's content is synced from a real Drupal backend (via
druxt's `DruxtClient`/`DruxtSchema`, not the legacy Nuxt 2 `druxt` package)
into an [`@nuxt/content`](https://content.nuxt.com) v3 data collection — see
[Content Sync](wiki/architecture.md#content-sync-drupal--nuxt) in the nested
wiki for the full pipeline. Everything else (site config, stats, projects)
is typed TS data + build-time API fetches, same as before.

## Tech stack

- **Framework**: Nuxt 4 (static SSG via `nuxt generate` → `nuxt/.output/public`)
- **UI**: Nuxt UI v3 + Tailwind v4, via `@stuartclark/ui` (`link:../../ui`)
- **Content**: `@nuxt/content` v3 `articleEntries` data collection
  (`content/articles-data/*.json`, zod schema in `content.schema.ts`), synced
  from Drupal — not hand-authored
- **Fonts**: `@nuxt/fonts` (self-hosted Archivo + JetBrains Mono)
- **Analytics**: `nuxt-gtag` (GA4, property `G-X1BRPZD4K2`), production-only
- **Tooling**: mise (Node 24, pnpm 10) — run `mise install` before anything else
- **Tests**: Vitest + `@nuxt/test-utils` + `happy-dom` + `axe-core` — 100% coverage enforced on `app/**`
- **Visual regression**: Playwright — 4 breakpoints (phone/tablet/desktop/wide)
- **SEO**: Playwright metadata suite + `unlighthouse` audit
- **Storybook**: co-located `*.stories.ts` in `app/`
- **Linting**: ESLint (`@nuxt/eslint` + vuejs-accessibility), Stylelint, Markdownlint, cspell, knip, commitlint, lychee
- **Type checking**: `vue-tsc` via `nuxt typecheck`

## Directory layout

```text
nuxt/
  app/
    app.vue, app.config.ts        Root + Nuxt UI config (primary=magenta, neutral=sand)
    assets/css/main.css           @theme: magenta/sand palettes
    components/                   App wrappers (StatBand, ActivityFeed, etc.) + DevGrid;
                                   AppDruxtParagraph*.vue render the synced paragraph tree
                                   (text_formatted, code, repository, media, section, card,
                                   card_group, jumbotron, link)
    composables/                  10 auto-imported composables (see below)
    data/                         Typed TS data (site, stats, projects, modules, talks, uses)
    layouts/                      default + minimal
    pages/                        writing/[...slug] + 7 other active routes
  content/articles-data/          @nuxt/content data collection, synced from Drupal (JSON)
  content.config.ts               Wraps content.schema.ts's zod schema in defineCollection()
  content.schema.ts               The actual zod schema — kept dependency-free so
                                   tests/content/*.spec.ts can validate content files directly
  scripts/sync-content.mjs        Pulls Drupal JSON:API -> content/articles-data/*.json
  server/routes/                  blog.xml, planet-drupal.xml (RSS, prerendered)
  tests/
    *.spec.ts                     Vitest unit/component (100% coverage)
    setup/a11y.ts                 vitest-axe matchers
    visual/home.spec.ts           Playwright full-page visual regression
    seo/seo.spec.ts               Playwright head-metadata checks
    visual/compare-design.mjs     Human-review diff vs design handoff (ImageMagick)
  .storybook/                     Storybook 9 config
  playwright.config.ts            4 visual projects + 1 seo project; serves .output/public
  vitest.config.ts                nuxt environment, junit in CI, 100% coverage gate
drupal/                           Drupal backend — source of truth for /writing content.
                                   JSON:API tested via kernel tests in CI; consumed by the
                                   Nuxt frontend only at sync time (scripts/sync-content.mjs),
                                   never at Nuxt build/runtime — see wiki/architecture.md
.githooks/                        Mise-driven commit-msg + pre-commit hooks
.gitlab/                          CI helper scripts
.opencode/                        OpenCode configuration and skills
openspec/                         Change specifications
.mise.toml                        Tasks + tool versions
```

## Composables

All composables in `app/composables/` are auto-imported (no explicit import needed).

| Composable | Purpose |
|------------|---------|
| `useSite` | Site config singleton (name, tagline, socials) |
| `useStats` | Stats band data + `ffpSites` (live File (Field) Paths install count) |
| `useModules` | Drupal.org project_module installs, ranked by usage |
| `useCoMaintainedModules` | Curated co-maintained modules from Drupal.org API |
| `useNpmPackages` | npm download counts + GitHub stars |
| `useActivity` | Merged GitHub + Drupal GitLab activity feed |
| `useContributions` | Contribution heatmap cells (GitHub + Drupal) |
| `useDrupalCons` | DrupalCon attendance from Drupal.org profile API |
| `useOSSProfiles` | Open-source profile aggregates (Drupal, GitHub, npm) |
| `useContactModal` | Shared `useState` for the layout-level contact modal |

## Disabled sections

Writing relaunched (live in nav, Drupal-sourced content, RSS feeds). Photos
(`/photos`) is still built but disabled for first launch — hidden from nav
(commented out in `layouts/default.vue`) and the homepage photography teaser
is commented out in `pages/index.vue`. Page files remain in place; re-enable
by uncommenting the nav link and the homepage section.

## Hero / section spacing convention

All hero pages (`index`, `about`, `open-source`, `community`) use identical hero
spacing:

```html
<section class="mx-auto max-w-6xl px-6 pb-12 pt-20 sm:px-10">
```

Eyebrow → h1 gap is `mt-7`, h1 → paragraph gap is `mt-7`. Content/utility pages
(`uses`, `drupalgive`, `photos`) use `pt-20` top padding with `space-y-10`.

## Common commands (run via mise, from the repo root)

```bash
mise run install            # pnpm install (in nuxt/)
mise run dev                # nuxt dev (http://localhost:3000)
mise run storybook          # Storybook on :6006
mise run dev:all            # Nuxt + Storybook concurrently (Storybook gets a tunnel URL)
mise run generate           # static build → nuxt/.output/public/

mise run test               # Vitest (100% coverage enforced)
mise run test:watch
mise run test:coverage
mise run typecheck          # nuxt typecheck (vue-tsc)

mise run test:visual              # generate + Playwright visual suite
mise run test:visual:update       # regenerate visual baselines
mise run lint:seo                 # generate + unlighthouse audit

mise run lint               # ESLint
mise run lint:fix
mise run lint:style         # Stylelint
mise run lint:md            # Markdownlint
mise run lint:spell         # cspell
mise run lint:knip          # knip — dead code/dependencies

mise run ci                 # typecheck + lint + style + md + spell + knip + tests
mise run ci:full            # + visual regression + SEO audit

mise run hooks:install      # enable mise-driven git hooks (run once per clone)
mise run commitlint <file>  # validate a commit message
```

Backend (from `drupal/`, via `.devtools/` — no Docker/DDEV; PHP + Composer +
SQLite, the same mechanism CI's `sync:drupal-content` job uses; see
`wiki/architecture.md` and `drupal/.devtools/README.md`):

```bash
make build                   # assemble + provision + start (full local setup)
make login                   # one-time login URL
make drush cr                # clear cache (or any other drush command)
make test                    # PHPUnit (all suites)
make test-kernel             # PHPUnit kernel tests only
make lint                    # PHPCS + PHPStan
make lint-fix                # fix PHPCS violations
make info                    # environment summary (PHP/Drupal/Composer/Drush versions, DB path)
make stop                    # stop the dev server
make reset                   # stop + wipe the throwaway SQLite database
```

Content sync (from `nuxt/`, against a running local Drupal instance):

```bash
node scripts/sync-content.mjs --base-url=http://127.0.0.1:8888
```

## Design tokens

| Token    | Value                                        |
|----------|----------------------------------------------|
| Primary  | `magenta` (`--color-magenta-500: #c21a74`)   |
| Neutral  | `sand` (warm near-monochrome)                |
| Sans     | Archivo (`--font-sans`)                       |
| Mono     | JetBrains Mono (`--font-mono`)                |
| Accents  | `electric`, `coral`, `orange`, `yellow`      |

Use Nuxt UI semantic utilities (`text-highlighted`, `text-muted`, `bg-default`,
`border-default`) so light/dark themes are automatic. Never hardcode hex in
components — reference tokens. `app.config.ts` sets `primary: 'magenta'`,
`neutral: 'sand'`.

## Conventions

- The `@stuartclark/ui` dependency is `link:../../ui` — the `apps/ui` submodule
  provides it locally; CI clones + builds it per job. Change the design system in
  `apps/ui`, not here.
- Mount components in tests via `@nuxt/test-utils/runtime`.
- Coverage threshold is **~99.5%** on `app/**` (`vitest.config.ts`) — effectively
  100%, with a hair of headroom carved out for 3 functions (the `title`/`eyebrow`
  getters passed to `defineOgImage()` in `app.vue` and `writing/[...slug].vue`)
  that only run during nuxt-og-image's SSR image-generation pass, which this
  project's test environment runs with SSR forced off. See the comment above
  `thresholds` in `vitest.config.ts` for the full explanation.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.com/)
  — scope `nuxt` (e.g. `feat(nuxt): ...`, `fix(ci): ...`). Enforced by
  commitlint in CI and the `commit-msg` hook.

## Visual regression — critical gotchas

- **Never regenerate baselines from an ARM host** (e.g. Apple Silicon, or an
  aarch64 container). Chromium renders differ between ARM and x86_64. Use the
  manual **`visual:update`** CI job on the x86_64 runner, download the
  `nuxt/tests/visual/*-snapshots/` artifact, and commit the PNGs.
- `playwright.config.ts` serves the **generated** static site
  (`serve .output/public`), so `nuxt generate` must run first.
- `maxDiffPixelRatio: 0.02` (2% tolerance). All 4 projects run in the `visual`
  CI job; the `seo` project runs in its own job.

## CI

`.gitlab-ci.yml` runs **MR pipelines** (so `$CI_MERGE_REQUEST_IID` is set for the
preview/visual-failure comment jobs). Branch pipelines are suppressed when an MR
exists. Stages: `lint → test → build → visual → audit → preview`. Every install
job clones + builds `@stuartclark/ui` as a sibling (the `.setup` template).

The manual `preview:live` job posts its tunnel URLs to every surface that
applies via `.gitlab/scripts/post-preview-urls.sh`: an **MR note** (MR
pipelines), a **commit comment** (branch pipelines with no MR), and **Discord**
(always, when `$DISCORD_WEBHOOK_URL` is set). The MR note is deleted when the
preview job ends; commit comments and Discord messages state their own expiry
and are left in place. Add `$DISCORD_WEBHOOK_URL` as a masked CI/CD variable
(project or group level) to enable the Discord channel.

## GitLab integration

| Setting | Value |
|---------|-------|
| Host | `gitlab.local` |
| Repo | `stuart-clark/stuar.tc` |
| API | `http://gitlab.local/api/v4` |
| Default branch | `develop` |
| Nuxt 4 migration | MR into `develop` from `feat/nuxt4` |

## What NOT to change

- The magenta/sand palette — it is the stuar.tc brand identity
- The 100% coverage threshold
- The Docker/DDEV-free `sync:drupal-content` CI install (Composer + SQLite +
  PHP's built-in server) — replaced a `docker:dind` + DDEV attempt that hit
  runner-specific infrastructure issues that never resolved; don't reintroduce
  Docker into that job without a real reason
- The visual-regression baseline strategy (x86_64-only regeneration)

## Related

- [`@stuartclark/ui`](../ui) — design system / component library (sibling repo)
- Consumed by the workspace root via the `apps/stuar.tc` submodule

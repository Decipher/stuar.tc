# stuar.tc

Personal website for Stuart Clark — a Nuxt 4 app built on Nuxt UI v3, the
[`@stuartclark/ui`](../ui) design system, and headless `@nuxt/content` (no Druxt).
Static-generated.

## Stack

- **Nuxt 4** + **Nuxt UI v3** (Tailwind v4, semantic utilities)
- **@nuxt/content v3** (Markdown articles, typed collections)
- **@nuxt/fonts** (self-hosted Archivo + JetBrains Mono)
- **@stuartclark/ui** design system (25 Vue SFCs, consumed as `link:../../ui`)
- Headless (no Druxt) — content via @nuxt/content + typed TS data
- Light + dark mode via Nuxt UI color mode
- **`nuxt-cloudflared-tunnel`** module (dev-only live preview: site + Storybook tunnels)

## Getting started

```bash
mise install          # Node 24 + pnpm 10
mise run install      # pnpm install (in nuxt/)
mise run dev          # http://localhost:3000
mise run hooks:install   # optional: enable commit-msg + pre-commit hooks
```

## Quality gates

```bash
pnpm typecheck        # vue-tsc
pnpm lint             # ESLint
pnpm lint:style       # Stylelint
pnpm lint:knip        # Dead code detection
pnpm lint:spell       # cspell
pnpm test             # Vitest (100% coverage enforced)
pnpm test:coverage    # Same, with report
pnpm generate         # Static build → .output/public/
pnpm test:visual      # Playwright visual + SEO (needs generate first)
```

Or via mise:

```bash
mise run ci           # typecheck + lint + style + knip + spell + tests
mise run ci:full      # + visual regression + SEO audit
```

## Design system

Colors are registered via `@theme static` in `app/assets/css/main.css`:

| Palette  | Alias     | Usage                                |
|----------|-----------|--------------------------------------|
| magenta  | `primary` | links, tags, CTAs, active states     |
| sand     | `neutral` | backgrounds, text, borders           |
| electric | —         | accent highlights                    |
| coral    | —         | secondary accents                    |

Nuxt UI semantic utilities (`text-highlighted`, `text-muted`, `text-dimmed`,
`bg-default`, `bg-muted`, `bg-elevated`, `border-default`) automatically adapt
to light/dark mode. `app.config.ts` sets `primary: 'magenta'`, `neutral: 'sand'`.

Fonts: **Archivo** (display/body) + **JetBrains Mono** (labels/numerals),
self-hosted by @nuxt/fonts.

## Component library

The design system lives in the sibling [`@stuartclark/ui`](../ui) repo (25 Vue
SFCs built on Nuxt UI primitives). It is consumed here as `link:../../ui`:

| Category | Components |
|----------|-----------|
| Layout | AppHeader, AppFooter, AppLogo, ThemeToggle |
| Atoms | Eyebrow, StatusPill, StatBlock, StatBand, Quote, SectionHeader |
| Data | ModuleRow, ActivityRow, ContributionHeatmap |
| Cards | ProjectCard, FeaturedCard, DrupalConCard, UsesGroup, GiveBackCard |
| Content | ArticleRow, Steps, CodeBlock, CommentItem, CommentComposer |
| Media | ImageSlot, Gallery |

## Pages

| Route | Description |
|-------|-------------|
| `/` | Hero, stats band, heartbeat, selected work |
| `/about` | Bio, headshot, expertise, elsewhere links; "Get in touch" opens contact modal |
| `/open-source` | Profiles, module installs, contribution heatmap, activity, flagship DruxtJS |
| `/community` | Talks, Splash Award, DrupalCons attended, organising & training |
| `/uses` | Tools, hardware, services |
| `/drupalgive` | Maintained projects, DrupalCons |
| `/styleguide` | Component showcase |
| ~~`/writing`~~ | Article list — *disabled for first launch* (accessible via direct URL) |
| ~~`/writing/[slug]`~~ | Article detail (@nuxt/content) — *disabled for first launch* |
| ~~`/photos`~~ | Photography gallery — *disabled for first launch* (accessible via direct URL) |

Writing and photos are hidden from nav and the homepage teaser is commented out.
The page files remain in place for re-enabling post-launch.

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

## Structure

```text
nuxt/
  app/
    app.vue              # Root: UApp + head/SEO meta
    app.config.ts        # Nuxt UI: primary=magenta, neutral=sand
    assets/css/main.css  # @theme static: magenta/sand palettes + bg-stripes
    components/          # App wrappers (StatBand, ActivityFeed, etc.) + DevGrid
    composables/         # 10 auto-imported composables (see above)
    data/                # Typed TS data (site, stats, projects, modules, etc.)
    layouts/default.vue  # AppHeader + slot + AppFooter + ContactModal
    pages/               # 7 active routes (+ writing, photos disabled)
  content/articles/      # @nuxt/content Markdown articles
  content.config.ts      # Article collection schema (/writing prefix)
  tests/                 # Vitest unit (100% cov), Playwright visual + SEO
.githooks/               # Mise-driven commit-msg + pre-commit hooks
.gitlab/                 # CI pipeline + helper scripts
```

## CI

GitLab CI (`.gitlab-ci.yml`) runs on MRs with stages `lint → test → build →
visual → audit → preview`. Every install job clones + builds `@stuartclark/ui`
as a sibling so the `link:../../ui` dependency resolves. GitHub Actions
(`.github/workflows/`) mirror the pipeline for when GitHub CI is in use.

## Status

7 routes active (home, about, open-source, community, uses, drupalgive,
styleguide). Writing and photos are built but disabled for first launch.
Live data sources (Drupal.org API, GitHub API) are wired via composables.
Remaining work:

- Port real article bodies from Drupal (for when /writing re-enables)
- Generate Playwright visual baselines (x86_64 only — via the `visual:update` CI job)
- Curate real photography content (for when /photos re-enables)

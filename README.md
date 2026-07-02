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
| `/` | Hero, stats band, selected work, writing, photography teaser |
| `/about` | Bio, headshot, availability |
| `/open-source` | Projects, module installs, contribution heatmap, activity, DrupalCons |
| `/writing` | Article list |
| `/writing/[slug]` | Article detail (@nuxt/content) |
| `/uses` | Tools, hardware, services |
| `/drupalgive` | Maintained projects, DrupalCons |
| `/speaking` | Talks, Splash Award |
| `/photos` | Photography gallery |
| `/styleguide` | Component showcase |

## Structure

```text
nuxt/
  app/
    app.vue              # Root: UApp + head/SEO meta
    app.config.ts        # Nuxt UI: primary=magenta, neutral=sand
    assets/css/main.css  # @theme static: magenta/sand palettes + bg-stripes
    components/          # 25 Claude Design Vue SFCs
    composables/         # useSite()
    data/                # Typed TS data (site, stats, projects, modules, etc.)
    layouts/default.vue  # AppHeader + slot + AppFooter
    pages/               # 10 pages across 9 routes
  content/articles/      # @nuxt/content Markdown articles
  content.config.ts      # Article collection schema (/writing prefix)
  tests/                 # Vitest unit (100% cov), Playwright visual + SEO
.gitlab/                 # CI pipeline + helper scripts
.githooks/               # Mise-driven commit-msg + pre-commit hooks
```

## CI

GitLab CI (`.gitlab-ci.yml`) runs on MRs with stages `lint → test → build →
visual → audit → preview`. Every install job clones + builds `@stuartclark/ui`
as a sibling so the `link:../../ui` dependency resolves. GitHub Actions
(`.github/workflows/`) mirror the pipeline for when GitHub CI is in use.

## Status

All pages implemented and the full quality-gate pipeline is wired. Remaining
work:

- Port real article bodies from Drupal
- Generate Playwright visual baselines (x86_64 only — via the `visual:update` CI job)
- Connect live data sources (Drupal.org API, GitHub API)

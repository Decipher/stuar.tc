# stuar.tc — Agent Instructions

## Project overview

Personal website for Stuart Clark. A Nuxt 4 app consuming the
[`@stuartclark/ui`](../ui) design-system module, headless on
[`@nuxt/content`](https://content.nuxt.com) v3 (no Druxt). Static-generated.

## Tech stack

- **Framework**: Nuxt 4 (static SSG via `nuxt generate` → `nuxt/.output/public`)
- **UI**: Nuxt UI v3 + Tailwind v4, via `@stuartclark/ui` (`link:../../ui`)
- **Content**: `@nuxt/content` v3 typed collections (`content/articles/`)
- **Fonts**: `@nuxt/fonts` (self-hosted Archivo + JetBrains Mono)
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
    components/                   Claude Design v2 SFCs (now mostly from @stuartclark/ui)
    composables/useSite.ts        Site config + socials
    data/                         Typed TS data (site, stats, projects, modules, talks, uses)
    layouts/                      default + minimal
    pages/                        9 routes
  content/articles/               @nuxt/content Markdown
  content.config.ts               Article collection schema
  tests/
    *.spec.ts                     Vitest unit/component (100% coverage)
    setup/a11y.ts                 vitest-axe matchers
    visual/home.spec.ts           Playwright full-page visual regression
    seo/seo.spec.ts               Playwright head-metadata checks
    visual/compare-design.mjs     Human-review diff vs design handoff (ImageMagick)
  .storybook/                     Storybook 9 config
  playwright.config.ts            4 visual projects + 1 seo project; serves .output/public
  vitest.config.ts                nuxt environment, junit in CI, 100% coverage gate
drupal/                           Legacy Foundry distro (unmigrated, out of scope for CI)
.githooks/                        Mise-driven commit-msg + pre-commit hooks
.gitlab/                          CI helper scripts
.mise.toml                        Tasks + tool versions
```

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
- Coverage threshold is **100%** on `app/**`.
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
- The headless `@nuxt/content` architecture (Druxt is intentionally gone)
- The visual-regression baseline strategy (x86_64-only regeneration)

## Related

- [`@stuartclark/ui`](../ui) — design system / component library (sibling repo)
- Consumed by the workspace root via the `apps/stuar.tc` submodule

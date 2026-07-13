# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-07-13

### Added

- Nuxt 4 rewrite of stuar.tc (replaces the legacy Nuxt 2 / DruxtJS app)
- Nuxt UI v3 + Tailwind v4 design system (`@stuartclark/ui`)
- `@nuxt/content` v3 typed article collections (headless — no Druxt)
- `@nuxt/fonts` self-hosting (Archivo + JetBrains Mono)
- 10 routes: home, about, open-source, community, writing (+ article detail), uses, drupalgive, photos, styleguide
- `useContactModal` composable — SSR-safe shared `useState` so any page can open the layout-level contact modal
- `useStats` exposes `ffpSites` — live File (Field) Paths install count from Drupal.org API (with static fallback)
- About page "Get in touch" button opens the contact modal (was a plain LinkedIn link)
- About page bio renders the FFP install count from live data (was hardcoded text)
- Standardised hero spacing across all hero pages (`pt-20 pb-12`, `mt-7` gaps)
- Live data composables: `useModules`, `useCoMaintainedModules`, `useNpmPackages`,
  `useActivity`, `useContributions`, `useDrupalCons`, `useOSSProfiles`
- Storybook 9 with co-located stories
- Vitest unit/component tests with 100% coverage enforcement and axe a11y checks
- Playwright visual regression (4 breakpoints) + SEO metadata suite
- `nuxt-cloudflared-tunnel` module for dev live preview (site + Storybook tunnels)
- mise tooling config (Node 24, pnpm 10)
- Linting: ESLint, Stylelint, Markdownlint, cspell, knip, commitlint
- GitLab CI pipeline mirroring `@stuartclark/ui`
  (lint, linkcheck, test, typecheck, build, visual + seo, unlighthouse audit, live preview)
- `.gitlab/scripts/` helper suite: MR-note upsert/delete, live-preview tunnel, visual-failure comments
- Mise-driven git hooks (`.githooks/`) + `hooks:install` task
- `unlighthouse.config.ts`, `.lychee.toml`, `packageManager` field
- Repo-level docs: `AGENTS.md`, `CONTRIBUTING.md`, `CHANGELOG.md`
- GitHub Actions workflow modernised to mirror the GitLab pipeline
- `drupal` CI job (PHPCS, PHPStan, PHPUnit via DDEV) for the retained backend
- `stuar.tc` Netlify production site (`stuartclark`) repointed to build this
  Nuxt 4 app from `main` via `nuxt/netlify.toml` (was previously deployed by
  a manual GitHub Actions push job with no git integration)

### Known gaps

- Google Analytics (`vue-gtag`) was dropped as a side effect of removing the
  legacy `nuxt/` tree — tracked in `openspec/changes/add-analytics-gtag/`
- `wiki/architecture.md` etc. describe the current headless setup; Druxt
  re-integration is planned post-launch (see `wiki/upgrade-notes/drupal-11.md`)

### Disabled (first launch)

- `/writing` and `/writing/[slug]` — hidden from nav, accessible via direct URL
- `/photos` — hidden from nav and homepage teaser, accessible via direct URL

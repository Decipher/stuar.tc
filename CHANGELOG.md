# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Re-launched `/writing`, sourced from the Drupal backend instead of
  hand-written markdown, preserving the full Layout Paragraphs structure of
  each post via a small set of paragraph-renderer components
- `/blog.xml` and `/planet-drupal.xml` RSS feeds, restoring the site's
  original two-feed setup (the latter for Drupal Planet syndication), with
  feed autodiscovery `<link>` tags

## [1.1.2] - 2026-07-14

### Fixed

- Splash screen hid on a fixed `fonts.ready + 300ms` timer with no relationship
  to actual content readiness, so it would disappear only for the homepage's
  activity feed to keep visibly loading in underneath it. It now waits for the
  feed's first load to settle (success or error), capped at a 2.5s timeout so
  a slow upstream API can't strand it, and fades in to match its existing
  fade-out.
- The prerendered homepage was baking full, untrimmed drupal.org/GitHub API
  responses into the SSR payload — hundreds of unused fields per item (body,
  taxonomy, images, actor, full pull_request/issue objects, etc.). Trimmed to
  only the fields actually rendered, dropping homepage weight from ~628KB to
  ~122KB (flagged as excessive by an OG share tester).
- Pre-existing markdownlint config gap causing false-positive duplicate-heading
  errors on this CHANGELOG's repeated per-version headings.

### Added

- `size-limit` check for the client JS bundle (200 KB brotli budget, ~157 KB
  baseline) in both GitLab CI and GitHub Actions, so bundle growth from new
  features is visible in every pipeline run.

## [1.1.1] - 2026-07-14

### Fixed

- GA4 tracking never actually fired in production: v1.1.0 gated it on
  `NETLIFY_CONTEXT`, which isn't a real Netlify build variable — the correct
  one is `CONTEXT`. Confirmed the v1.1.0 production deploy built and
  published successfully but shipped with no tracking script at all.
  Verified live traffic on stuar.tc showed nothing in GA4 Realtime.

## [1.1.0] - 2026-07-14

### Added

- Google Analytics 4 pageview tracking via `nuxt-gtag` (property `G-X1BRPZD4K2`),
  reusing the identity of the legacy `vue-gtag` plugin dropped in the Nuxt 4
  rewrite. Gated to `NETLIFY_CONTEXT === 'production'` — silent in local dev,
  deploy previews, and branch deploys, so preview traffic doesn't pollute
  production analytics (caught in CodeRabbit review, GitHub PR #126)

### Known gaps

- Micro-interaction tracking (contact form open/submit, theme toggle, sponsor
  CTA) is not yet in place — tracked as GitLab issue #10

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

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.4.0] - 2026-08-12

### Added

- QR campaign tracking — QR codes on OG share images now encode `/q/`-prefixed
  tracking URLs (e.g. `stuar.tc/q/about`). Netlify 302-redirects `/q/<path>` to
  `/<path>` with UTM parameters (`utm_medium=qr`, `utm_source=share-card`,
  `utm_campaign=og-image`), making QR-code-acquired sessions visible in GA4's
  Traffic Acquisition report with source/medium `share-card / qr`, separate from
  direct traffic. The visible URL caption and canonical URL are unaffected.
- Re-designed the `/writing` listing as a searchable, filterable, sortable
  table (`UTable`, search + OR tag-filter + sortable date column) with a
  matching stacked card layout below `sm:`, replacing the single-row listing
- Netlify preview deploy workflow — every PR and branch push gets a preview
  URL, commented on the PR and updated in place on re-push
- Per-metric Lighthouse budget gating (FCP/LCP/CLS/TBT/performance) on the
  unlighthouse audit, on both GitLab CI and GitHub Actions, posted as a
  sticky MR/PR comment
- The JSON:API Views 8.x-1.2 blog post

### Changed

- Replaced the full-screen splash overlay with per-section skeleton loaders;
  below-the-fold sections now defer their data refresh until scrolled into
  view
- Refreshed README and CONTRIBUTING for the current project state: the
  `.devtools/` backend workflow, `/writing` now live, the Drupal content
  sync pipeline, corrected component/composable inventories, and a new
  Releases section documenting the GitFlow branching model
- Bumped `actions/checkout`, `actions/setup-node`, and `actions/cache` to
  their latest major versions across all GitHub Actions workflows

### Fixed

- Inline `<code>` chip in prose used a neutral background; now uses a
  theme-primary tint matching `apps/ui`'s `Steps.vue`
- `open-source` page visual-regression flakiness caused by live
  drupal.org/npm ranking data reaching screenshots unmasked, so results now
  stay deterministic regardless of when a build runs
- `push-story.mjs`: Layout Paragraphs nesting (`behavior_settings`) and
  card/link entity references (`field_link`) were silently never applied
  when syncing articles into Drupal — both fields require Drupal's own PHP
  API rather than JSON:API, which can't set either — so they're now applied
  via a `drush` fixup after creation

### Security

- Updated `storybook` to 9.1.19, fixing a GHSA-flagged vulnerability
- Normalised leading slashes in the `/q/` QR-redirect handler — `/q//evil.example`
  previously produced a protocol-relative `Location` header, which browsers
  treat as an external redirect off the trusted `stuar.tc` domain

## [1.3.2] - 2026-08-04

### Fixed

- `sitemap.xml` listed a Netlify branch-deploy URL
  (`main--stuartclark.netlify.app`) instead of `https://stuar.tc`, and
  included only the site's static pages, missing every individual writing
  article. The site URL trusted a Netlify env var that resolves incorrectly
  when the `main` branch build isn't classified as production, the writing
  content collection had no field for the sitemap module to pick it up, and
  dynamic article routes were never discovered by the prerender crawler

## [1.3.1] - 2026-07-25

### Added

- CI badges to the README: build status, license, GitHub Sponsors, and
  Codecov coverage
- Codecov integration — CI now uploads coverage reports and actually
  enforces the coverage thresholds it was previously only advertising

### Fixed

- GitHub Actions PHPCS lint failure caused by inline fully-qualified class
  references instead of `use` imports

## [1.3.0] - 2026-07-25

### Added

- Backend PHPUnit test coverage for the Drupal JSON:API/router surface the
  frontend and Druxt actually depend on: the article collection endpoint and
  its taxonomy/paragraph includes, taxonomy term collections, media and file
  resources, custom blocks, config pages, menu items, and path-alias
  resolution via `decoupled_router`
- `.devtools/` — a Composer + PHP built-in server + SQLite local dev
  workflow for the Drupal backend, replacing DDEV. No Docker required;
  includes an optional Cloudflare tunnel for sharing a live local preview

### Changed

- Upgraded the Drupal backend from 9.5 to 11.4.4, PHP from 8.1 to 8.3, and
  around 60 contrib modules to their latest Drupal 11-compatible releases
- Removed four long-unmaintained contrib modules with no Drupal 10/11
  upgrade path, none of which were doing anything active on the live site: a
  content-display-mode picker, a title-visibility admin toggle, a
  link-revision admin UI, and filename transliteration (superseded by
  Drupal core's own filename sanitization setting)
- Migrated the one CKEditor 4 text format still in use to CKEditor 5

## [1.2.1] - 2026-07-23

### Fixed

- `/blog.xml` and `/planet-drupal.xml` item links were baking in the
  prerender crawler's internal `localhost` origin instead of
  `https://stuar.tc`, since both feeds derived their base URL from the
  request rather than a fixed value

## [1.2.0] - 2026-07-23

### Added

- Re-launched `/writing`, sourced from the Drupal backend instead of
  hand-written markdown, preserving the full Layout Paragraphs structure of
  each post via a small set of paragraph-renderer components
- `/blog.xml` and `/planet-drupal.xml` RSS feeds, restoring the site's
  original two-feed setup (the latter for Drupal Planet syndication), with
  feed autodiscovery `<link>` tags
- Four new paragraph types for richer post layouts: card, card group,
  jumbotron, and link
- Repository cards can link out to a project's Drupal.org page, and show a
  GitHub Sponsors button when the linked repo is one of Stuart's own or a
  Druxt project
- Branded per-page Open Graph share images (title, eyebrow, and a QR code to
  the page) for every route, not just the homepage

### Changed

- Article URLs now use Drupal's own computed alias
  (`/writing/<title>-<published-date>`) instead of a hand-rolled slug,
  matching the site's real historical URL pattern
- Article ordering now uses full-precision publish timestamps instead of a
  date-only value, fixing non-deterministic ordering between posts published
  on the same day
- Only body text is constrained to a readable prose width now — code blocks,
  images, and cards use the full column width instead of being squeezed to
  match the surrounding paragraph text
- The nav header switches to its mobile layout at a wider breakpoint so it
  no longer crowds itself at in-between viewport widths

### Fixed

- `og:title`, `og:description`, `og:url`, and `og:type` were hardcoded to
  the homepage's values on every page; they're now route- and
  article-specific, and article pages generate their own share image
  instead of the generic section one
- Added 301 redirects from the four previously-live `/articles/...` URLs to
  their new `/writing/...` equivalents
- Article descriptions carrying literal CRLF line breaks from the original
  Drupal content no longer leak into `og:description` or the RSS feeds as
  broken multi-line text
- A leftover, unused dependency of the Drupal content sync tooling was
  pulling in two old CommonJS-only package builds that clashed with newer
  copies the rest of the app expects, breaking the production build and
  crashing the deployed server function at runtime

### Security

- Fixed an incomplete HTML-tag-sanitization pattern in the content sync
  script that could be bypassed by nested tags reconstructing a live tag
  after a single stripping pass

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

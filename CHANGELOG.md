# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Nuxt 4 rewrite of stuar.tc (replaces the legacy Nuxt 2 / DruxtJS app)
- Nuxt UI v3 + Tailwind v4 design system (`@stuartclark/ui`)
- `@nuxt/content` v3 typed article collections (headless — no Druxt)
- `@nuxt/fonts` self-hosting (Archivo + JetBrains Mono)
- 9 routes: home, about, open-source, writing (+ article detail), uses, drupalgive, speaking, photos, styleguide
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

# Testing Guide

## Test Types

This project uses four types of testing:

1. **Vitest** — unit/component tests for the Nuxt 4 app, 100% coverage
   enforced on `app/**`
2. **Playwright (visual)** — full-page visual regression across 4 breakpoints
3. **Playwright (SEO)** — head-metadata assertions against the generated site
4. **PHPUnit** — backend kernel tests for the Drupal JSON:API endpoints
   (independent of the frontend — see [Architecture](architecture.md))

## Running Tests

### Frontend

```bash
mise run test              # Vitest, 100% coverage enforced
mise run test:watch        # Vitest watch mode
mise run test:coverage     # Vitest with coverage report
mise run test:visual       # generate + Playwright visual suite (4 breakpoints + SEO)
mise run test:visual:update  # regenerate visual baselines
```

`playwright.config.ts` serves the **generated** static site
(`serve .output/public`), so `mise run generate` must run before
`test:visual` if not using the combined task.

### Backend

```bash
cd drupal
make test
```

## Writing Vitest Tests

### Test File Location

Co-locate test files under `nuxt/tests/`, mirroring the `app/` structure:

```text
tests/
├── composables/useStats.spec.ts
├── components/AppStatBand.spec.ts
└── setup/a11y.ts        # vitest-axe matchers
```

### Test Structure

```ts
import { describe, expect, test } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MyComponent from '~/components/MyComponent.vue'

describe('MyComponent', () => {
  test('renders correctly', async () => {
    const wrapper = await mountSuspended(MyComponent, {
      props: { myProp: 'value' },
    })
    expect(wrapper.text()).toContain('value')
  })
})
```

### Best Practices

- Mount components via `@nuxt/test-utils/runtime` (`mountSuspended`), not
  `@vue/test-utils` directly — Nuxt auto-imports need the Nuxt test context
- Run `vitest-axe` assertions on any new interactive component (a11y gate)
- Coverage threshold is **100%** on `app/**` — new code must be covered

## Writing Playwright Tests

### Visual regression (`tests/visual/`)

- `home.spec.ts`-style specs run against all 4 breakpoints (phone, tablet,
  desktop, wide), `maxDiffPixelRatio: 0.02`
- **Never regenerate baselines from an ARM host** (Apple Silicon, aarch64
  containers) — Chromium renders differ from x86_64. Use the manual
  `visual:update` CI job on the x86_64 runner, download the
  `nuxt/tests/visual/*-snapshots/` artifact, and commit the PNGs
- `freezeDynamicContent()` replaces build-time-baked live data (drupal.org
  install counts, GitHub stats, npm downloads, activity feed) with fixed
  placeholders so baselines are deterministic regardless of when
  `nuxt generate` ran

### SEO (`tests/seo/seo.spec.ts`)

Asserts head metadata (title, meta description, OG/Twitter tags where
applicable) against the generated static HTML.

## Running PHPUnit Tests (Drupal)

```bash
cd drupal
make test              # full suite (starts the dev server first)
make test-unit
make test-kernel
make test-functional   # BrowserTestBase — also starts the dev server
```

The test module lives at `drupal/web/modules/custom/stuartc_tests/` and
covers the JSON:API/router surface the Nuxt frontend (`sync-content.mjs`)
and Druxt actually depend on:

**Kernel** (`tests/src/Kernel/`) — bootstrap-only, no HTTP:

- `JsonApiArticleTest.php`, `JsonApiFieldTest.php`, `JsonApiRouteTest.php` —
  JSON:API route/service availability, base entity field definitions
- `JsonApiParagraphTest.php` — every paragraph bundle `sync-content.mjs`
  handles (`SUPPORTED_PARAGRAPH_BUNDLES`) has a registered
  `paragraph--<bundle>` JSON:API resource type
- `TomeContentTest.php` — structural sanity checks against the *committed*
  `content/*.json` export itself (article count, non-empty titles, path
  aliases under `/writing/`, both taxonomy vocabularies present, the
  `druxt_settings` config page exists). Reads the files directly rather
  than re-running a live Tome import — `tome_sync`'s importer orchestrates
  itself via `tome:import-content` sub-processes per chunk, which doesn't
  translate into a single in-process Kernel test; a real import already
  runs on every `.devtools/provision` / `sync:drupal-content`

**Functional** (`tests/src/Functional/`) — real HTTP requests via
`BrowserTestBase`, each spinning up its own throwaway SQLite install (never
the real site's database):

- `JsonApiArticleTest.php` — `node--article` collection shape, plus
  `?include=` for both taxonomy fields and `field_content` paragraphs
- `JsonApiTaxonomyTest.php`, `JsonApiMediaTest.php`,
  `JsonApiBlockContentTest.php`, `JsonApiConfigPagesTest.php`,
  `JsonApiMenuItemsTest.php` — one endpoint contract each
- `DecoupledRouterTest.php` — `/router/translate-path` resolves a real
  alias to the correct entity/JSON:API resource name, and 404s on an
  unknown path

`JsonApiFunctionalTestBase.php` holds shared fixtures (article content
type, taxonomy vocabularies, permission grants matching
`config/sync/user.role.anonymous.yml`) and `getJsonApi()`, which rebuilds
the router before every request — fixtures that create a bundle/field at
runtime (a new content type, a paragraph type, a media type) only mark the
router dirty in this process's memory; nothing flushes that to the
persisted router table until something explicitly rebuilds it, and the
next `drupalGet()` is a real HTTP request to the *separately running*
dev-server process, which would otherwise 404 on routes tied to
anything created after the table was last built.

```bash
cd drupal && make lint      # PHPCS + PHPStan
```

## CI Integration

- `build` — lint, typecheck, Vitest, `nuxt generate` (frontend)
- `seo` — Playwright SEO suite against the generated site
- `drupal` (GitHub Actions) — PHPCS, PHPStan, PHPUnit via `drupal/.devtools/`
  (no Docker/DDEV)
- Manual `visual` / `visual:update` jobs on GitLab (x86_64 runner)

See `.github/workflows/ci.yml` and `.gitlab-ci.yml`.

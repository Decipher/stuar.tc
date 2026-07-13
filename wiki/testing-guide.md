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
ddev phpunit
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
ddev phpunit
```

The test module lives at `drupal/web/modules/custom/stuartc_tests/` and
contains kernel tests verifying JSON:API route availability and content
field definitions (`tests/src/Kernel/JsonApiArticleTest.php`,
`JsonApiFieldTest.php`, `JsonApiRouteTest.php`).

```bash
cd drupal && ddev phpcs      # coding standards
cd drupal && ddev phpstan    # static analysis
```

## CI Integration

GitHub Actions and GitLab CI both run:

- `build` — lint, typecheck, Vitest, `nuxt generate` (frontend)
- `seo` — Playwright SEO suite against the generated site
- `drupal` — PHPCS, PHPStan, PHPUnit (backend, via DDEV)
- Manual `visual` / `visual:update` jobs on GitLab (x86_64 runner)

See `.github/workflows/ci.yml` and `.gitlab-ci.yml`.

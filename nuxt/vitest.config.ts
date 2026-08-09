import { defineVitestConfig } from '@nuxt/test-utils/config'
import { resolve } from 'node:path'

export default defineVitestConfig({
  resolve: {
    alias: {
      // The druxt/druxt-schema packages use a git+path patch that gives Vite's
      // import-analysis trouble in CI. Alias to empty stubs so the test
      // transform never tries to resolve them — sync-content.mjs uses dynamic
      // imports that are only called at runtime, not during tests.
      druxt: resolve(import.meta.dirname, 'tests/__stubs__/druxt.ts'),
      'druxt-schema': resolve(import.meta.dirname, 'tests/__stubs__/druxt-schema.ts'),
    },
  },
  test: {
    environment: 'nuxt',
    include: ['tests/**/*.spec.ts'],
    exclude: ['tests/visual/**', 'tests/seo/**', 'node_modules/**'],
    setupFiles: ['tests/setup/a11y.ts'],
    reporters: process.env.CI
      ? [['default'], ['junit', { outputFile: 'test-results/junit.xml', classname: 'stuartc' }]]
      : ['default'],
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'lcov', 'html', 'cobertura'],
      reportsDirectory: 'coverage',
      include: ['app/**/*.{vue,ts}', 'server/**/*.ts'],
      exclude: ['app/**/*.stories.ts', 'app/pages/typography.vue'],
      thresholds: {
        // Everything is genuinely 100% except 3 functions: the title/eyebrow
        // computed getters passed to defineOgImage() in app.vue and
        // writing/[...slug].vue. Those are only ever invoked by
        // nuxt-og-image's SSR image-generation pass — this test environment
        // runs with SSR forced off, so no test here can reach them (verified;
        // inline istanbul-ignore comments don't survive this project's
        // Vite+esbuild+Istanbul transform pipeline either). Thresholds below
        // are set just under 100% to admit exactly that gap.
        lines: 99.5,
        functions: 98.5,
        branches: 100,
        statements: 99.5,
      },
    },
  },
})

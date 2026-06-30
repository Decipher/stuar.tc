import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
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
      include: ['app/**/*.{vue,ts}'],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
})

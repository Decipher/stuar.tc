module.exports = {
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^~/(.*)$': '<rootDir>/$1',
    '^vue$': 'vue/dist/vue.common.js',
    '^~storybook': '<rootDir>/.nuxt-storybook/storybook/preview.js',
  },
  moduleFileExtensions: ['js', 'vue', 'json'],
  transform: {
    '^.+\\.js$': 'babel-jest',
    '.*\\.(vue)$': 'vue-jest',
  },
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/components/**/*.vue',
    '<rootDir>/pages/**/*.vue',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/components/druxt/entity/node/article/Full.vue',
  ],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: [],
  testMatch: ['<rootDir>/tests/**/*.test.js', '<rootDir>/**/*.test.js'],
}

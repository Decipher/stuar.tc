module.exports = {
  verbose: true,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^~/(.*)$': '<rootDir>/$1',
    '^vue$': 'vue/dist/vue.common.js',
    '^~storybook': '<rootDir>/.nuxt-storybook/storybook/preview.js',
    '\\.(css|less|scss)$': 'identity-obj-proxy',
  },
  moduleFileExtensions: ['js', 'vue', 'json'],
  transform: {
    '^.+\\.js$': 'babel-jest',
    '^.*\\.vue$': '@vue/vue2-jest',
  },
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/components/**/*.vue',
    '<rootDir>/pages/**/*.vue',
  ],
  testEnvironment: 'jsdom',
  transformIgnorePatterns: [
    // 'node_modules/(?!(@storybook/*))',
    // 'node_modules/(?!(druxt-.*\\.vue))',
  ],
}

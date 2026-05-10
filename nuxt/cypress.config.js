const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/integration/**/*.{feature,features}',
    supportFile: 'cypress/support/index.js',
    setupNodeEvents(on, config) {
      return require('./cypress/plugins/index.js')(on, config)
    },
  },
  component: {
    specPattern: 'components/**/*.spec.{js,jsx,ts,tsx,vue}',
  },
})

const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://localhost:8000',
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
    video: false,
    setupNodeEvents(on, config) {
      // Implementar plugins aqui
      return config
    }
  },
  env: {
    API_BASE_PATH: '/api'
  }
})
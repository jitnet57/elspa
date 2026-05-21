import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    chromeWebSecurity: false,
    setupNodeEvents(on, config) {
      // Environment setup
      if (config.env.ENV_NAME === 'production') {
        config.baseUrl = 'https://elspa-prod.vercel.app'
      } else if (config.env.ENV_NAME === 'staging') {
        config.baseUrl = 'https://elspa-staging.vercel.app'
      }

      return config
    },
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
  },
})

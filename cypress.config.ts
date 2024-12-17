import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8080',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    viewportWidth: 1024,
    viewportHeight: 768,
    defaultCommandTimeout: 10000,
    setupNodeEvents(on, config) {
      // implement node event listeners here
      on('before:browser:launch', (browser: any, launchOptions: any) => {
        // Allow canvas access in Chrome
        if (browser.name === 'chrome') {
          launchOptions.args.push('--allow-file-access-from-files');
          launchOptions.args.push('--disable-web-security');
        }
        return launchOptions;
      });
    },
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'webpack',
    },
  },
  env: {
    // Game-specific environment variables
    initialCoins: 1000,
    itemPrice: 100,
  },
  retries: {
    runMode: 2,
    openMode: 0,
  },
  video: false,
  screenshotOnRunFailure: true,
  trashAssetsBeforeRuns: true,
});

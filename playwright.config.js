const { defineConfig } = require('@playwright/test');
const path = require('path');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  use: {
    headless: false, // Keep false for extension testing
    viewport: { width: 1280, height: 720 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium-extension',
      use: {
        // Use Chromium instead of system Chrome for better stability
        launchOptions: {
          args: [
            `--load-extension=${path.resolve(__dirname)}`,
            '--disable-extensions-except=' + path.resolve(__dirname),
            '--disable-web-security',
            '--disable-features=TranslateUI',
            '--disable-ipc-flooding-protection',
            '--disable-renderer-backgrounding',
            '--disable-backgrounding-occluded-windows',
            '--disable-field-trial-config',
            '--no-sandbox',
            '--disable-dev-shm-usage'
          ],
          // Slower closing to prevent crashes
          slowMo: 100
        }
      }
    }
  ]
});
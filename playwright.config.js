// @ts-check
const { defineConfig } = require('@playwright/test');

const PORT = process.env.PORT || 3333;

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 60000,
  retries: 1,
  workers: 1, // serial — some tests mutate shared state
  use: {
    baseURL: `http://localhost:${PORT}`,
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    actionTimeout: 15000,
  },
  webServer: {
    command: `cd server && node server.js`,
    port: Number(PORT),
    timeout: 20000,
    reuseExistingServer: true,
    env: { PORT: String(PORT), PLAYWRIGHT: '1' },
  }
});

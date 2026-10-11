import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests-api",
  fullyParallel: false,
  timeout: 60000,
  expect: { timeout: 15000 },
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:5174",
    channel: "chrome",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: "mobile",
      use: {
        ...devices["iPhone 13"],
        defaultBrowserType: "chromium",
        channel: "chrome",
      },
    },
  ],
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 5174 --strictPort",
    url: "http://127.0.0.1:5174",
    timeout: 30000,
    reuseExistingServer: false,
    env: {
      VITE_YOUTUBE_API_KEY: "fixture-public-key",
      VITE_GOOGLE_CLIENT_ID: "fixture-client.apps.googleusercontent.com",
      VITE_YOUTUBE_REGION: "VN",
    },
  },
});

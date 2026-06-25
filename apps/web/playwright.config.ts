import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:5173";
const usesExternalBaseURL = Boolean(process.env.PLAYWRIGHT_BASE_URL);

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL,
    acceptDownloads: true,
    trace: "retain-on-failure",
  },
  ...(usesExternalBaseURL
    ? {}
    : {
        webServer: {
          command: "pnpm dev",
          url: baseURL,
          reuseExistingServer: !process.env.CI,
        },
      }),
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});

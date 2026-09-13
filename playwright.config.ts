import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  timeout: 60_000,
  use: { baseURL: "http://localhost:5180/" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev -- --port 5180 --strictPort",
    url: "http://localhost:5180/",
    reuseExistingServer: !process.env.CI,
  },
});

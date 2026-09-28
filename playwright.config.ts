import { defineConfig, devices } from "@playwright/test";
import { createHash } from "node:crypto";

const worktreeSeed = createHash("sha256").update(process.cwd()).digest().readUInt16BE(0);
const port = String(20000 + (worktreeSeed % 40000));

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  timeout: 60_000,
  use: { baseURL: `http://localhost:${port}/` },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run dev -- --port ${port} --strictPort`,
    url: `http://localhost:${port}/`,
    reuseExistingServer: !process.env.CI,
  },
});

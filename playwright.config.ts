import { defineConfig, devices } from "@playwright/test";
import { createHash } from "node:crypto";

const worktreeSeed = createHash("sha256").update(process.cwd()).digest().readUInt16BE(0);
const port = String(20000 + (worktreeSeed % 40000));

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  // Several agents run this suite at once on one machine; Playwright's
  // default of half the cores per run starved the box (load 160 on 24
  // cores) and timed out the slowest scenarios. PW_WORKERS overrides it.
  workers: Number(process.env.PW_WORKERS) || 2,
  timeout: 60_000,
  use: { baseURL: `http://localhost:${port}/` },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run dev -- --port ${port} --strictPort`,
    url: `http://localhost:${port}/`,
    reuseExistingServer: !process.env.CI,
  },
});
